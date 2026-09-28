# -*- coding: utf-8 -*-
"""
Google Gemini Cloud Engine for NEXIUM AI.
Ultra-fast cloud fallback and primary intelligence engine powered by Gemini 3.8 / Flash / Pro.
Supports Multi-Key Rotation Pool (Round-Robin load balancing and instant zero-downtime failover).
"""

import os
import json
import time
import logging
import threading
from typing import Optional, Dict, Any, List, Tuple
import httpx
from dotenv import load_dotenv, set_key

load_dotenv()
logger = logging.getLogger("nexium.gemini")

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

class GeminiEngine:
    def __init__(self):
        self._lock = threading.Lock()
        self._key_index = 0
        self.api_keys: List[str] = []
        self._load_keys_from_env()
        self.default_model = "gemini-3.8-flash"
        self.client = httpx.AsyncClient(timeout=httpx.Timeout(20.0, connect=5.0))

    def _load_keys_from_env(self):
        """Loads and deduplicates API keys from GEMINI_API_KEYS or GEMINI_API_KEY / GOOGLE_API_KEY."""
        keys = []
        raw_pool = os.getenv("GEMINI_API_KEYS", "")
        if raw_pool:
            # Split by comma or whitespace/newline
            for k in raw_pool.replace("\n", ",").replace(";", ",").split(","):
                k_clean = k.strip()
                if k_clean and len(k_clean) > 8 and k_clean not in keys:
                    keys.append(k_clean)

        single_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
        if single_key:
            single_clean = single_key.strip()
            if single_clean and single_clean not in keys:
                keys.append(single_clean)

        self.api_keys = keys

    @property
    def api_key(self) -> str:
        """Returns the primary or current active API key."""
        if not self.api_keys:
            return ""
        with self._lock:
            idx = self._key_index % len(self.api_keys)
            return self.api_keys[idx]

    def is_configured(self) -> bool:
        return bool(self.api_keys and len(self.api_keys) > 0)

    def set_api_key(self, key: str, persist: bool = True) -> bool:
        """Sets single active key as primary in the pool."""
        cleaned = key.strip()
        if not cleaned:
            return False
        with self._lock:
            if cleaned in self.api_keys:
                self.api_keys.remove(cleaned)
            self.api_keys.insert(0, cleaned)
            self._key_index = 0
        os.environ["GEMINI_API_KEY"] = cleaned
        if persist:
            self._persist_to_env()
        return True

    def set_key_pool(self, keys: List[str], persist: bool = True) -> int:
        """Sets a multi-key pool (e.g., 5-7 keys) for rotation and failover."""
        valid_keys = []
        for k in keys:
            c = k.strip()
            if c and len(c) > 8 and c not in valid_keys:
                valid_keys.append(c)

        if not valid_keys:
            return 0

        with self._lock:
            self.api_keys = valid_keys
            self._key_index = 0

        os.environ["GEMINI_API_KEY"] = valid_keys[0]
        os.environ["GEMINI_API_KEYS"] = ",".join(valid_keys)

        if persist:
            self._persist_to_env()
        return len(valid_keys)

    def add_api_keys(self, new_keys: List[str], persist: bool = True) -> int:
        """Appends new keys to existing key pool."""
        added = 0
        with self._lock:
            for k in new_keys:
                c = k.strip()
                if c and len(c) > 8 and c not in self.api_keys:
                    self.api_keys.append(c)
                    added += 1
        if added > 0:
            os.environ["GEMINI_API_KEYS"] = ",".join(self.api_keys)
            if persist:
                self._persist_to_env()
        return added

    def _persist_to_env(self):
        """Persists GEMINI_API_KEYS and GEMINI_API_KEY into backend/.env."""
        try:
            root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            backend_env = os.path.join(root_dir, "backend", ".env")
            root_env = os.path.join(root_dir, ".env")
            target_env = backend_env if os.path.exists(backend_env) else root_env
            if os.path.exists(target_env):
                if self.api_keys:
                    set_key(target_env, "GEMINI_API_KEY", self.api_keys[0])
                    set_key(target_env, "GEMINI_API_KEYS", ",".join(self.api_keys))
        except Exception as e:
            logger.warning(f"Could not persist Gemini keys to .env: {e}")

    def get_pool_status(self) -> Dict[str, Any]:
        """Returns health and status metadata for the key pool."""
        masked_list = []
        for idx, k in enumerate(self.api_keys):
            masked = f"{k[:6]}...{k[-4:]}" if len(k) >= 10 else "***"
            masked_list.append({"index": idx, "key": masked, "active": idx == (self._key_index % max(1, len(self.api_keys)))})

        return {
            "status": "ONLINE" if self.is_configured() else "REQUIRES_KEY",
            "configured": self.is_configured(),
            "pool_size": len(self.api_keys),
            "keys": masked_list,
            "default_model": self.default_model,
            "supported_models": [
                "gemini-3.8-flash",
                "gemini-3.1-pro-preview",
                "gemini-flash-latest",
                "gemini-pro-latest",
                "gemini-2.5-flash",
                "gemini-2.5-pro"
            ],
            "rotation_mode": "Round-Robin with Automatic Multi-Key Failover"
        }

    def _rotate_key(self):
        """Advances key index to next key in pool."""
        with self._lock:
            if self.api_keys:
                self._key_index = (self._key_index + 1) % len(self.api_keys)

    async def generate_content(
        self,
        prompt: str,
        model: str = "gemini-3.8-flash",
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_output_tokens: int = 1024
    ) -> Dict[str, Any]:
        """
        Executes ultra-fast generation via Google Gemini API with multi-key pool failover.
        If a key encounters 429 rate limit or 403 quota exhaustion, automatically tries
        the next key in the pool until success or all keys exhausted.
        """
        if not self.is_configured():
            return {
                "success": False,
                "error": "GEMINI_API_KEY pool is empty. Please add your Gemini keys.",
                "fallback_available": True
            }

        target_model = model or self.default_model
        if target_model in ("gemini", "flash", "gemini-flash", "gemini-2.5-flash"):
            target_model = "gemini-3.8-flash"
        elif target_model in ("pro", "gemini-pro", "gemini-2.5-pro"):
            target_model = "gemini-3.1-pro-preview"

        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens
            }
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        pool_size = len(self.api_keys)
        last_error = ""
        total_t0 = time.perf_counter()

        for attempt in range(pool_size):
            with self._lock:
                active_idx = (self._key_index + attempt) % pool_size
                current_key = self.api_keys[active_idx]

            url = f"{GEMINI_BASE_URL}/{target_model}:generateContent?key={current_key}"
            t0 = time.perf_counter()

            try:
                resp = await self.client.post(url, json=payload)
                elapsed_ms = round((time.perf_counter() - t0) * 1000)

                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text_parts = candidates[0].get("content", {}).get("parts", [])
                        output_text = "".join(p.get("text", "") for p in text_parts)
                        usage = data.get("usageMetadata", {})

                        # Advance index on success for round-robin balancing
                        self._rotate_key()

                        return {
                            "success": True,
                            "text": output_text,
                            "model": target_model,
                            "key_index": active_idx,
                            "attempts": attempt + 1,
                            "latency_ms": elapsed_ms,
                            "prompt_tokens": usage.get("promptTokenCount", 0),
                            "completion_tokens": usage.get("candidatesTokenCount", 0)
                        }

                # If 429 (rate limit) or 403 (quota / permission), record error and fail over to next key
                last_error = f"Key #{active_idx} HTTP {resp.status_code}: {resp.text}"
                logger.warning(f"Gemini Key #{active_idx} returned {resp.status_code}. Auto-failing over to next key...")
                continue

            except Exception as e:
                last_error = f"Key #{active_idx} connection exception: {e}"
                logger.warning(f"Gemini Key #{active_idx} exception: {e}. Trying next key...")
                continue

        total_elapsed_ms = round((time.perf_counter() - total_t0) * 1000)
        return {
            "success": False,
            "error": f"All {pool_size} Gemini keys failed or rate-limited. Last: {last_error}",
            "pool_size": pool_size,
            "latency_ms": total_elapsed_ms,
            "fallback_available": True
        }

    async def fallback_or_local(
        self,
        local_coro,
        prompt: str,
        timeout_seconds: float = 3.0,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes local generation task with strict timeout.
        If local task fails or takes longer than timeout_seconds, automatically falls back to Gemini API pool!
        """
        import asyncio
        try:
            res = await asyncio.wait_for(local_coro, timeout=timeout_seconds)
            return {"engine": "local", "result": res}
        except (asyncio.TimeoutError, Exception) as local_err:
            logger.info(f"Local engine exceeded {timeout_seconds}s or failed: {local_err}. Falling back to Gemini API pool...")
            if self.is_configured():
                gem_res = await self.generate_content(prompt, model=self.default_model, system_instruction=system_instruction)
                if gem_res.get("success"):
                    return {"engine": self.default_model, "fallback_reason": str(local_err), "result": gem_res.get("text")}
            return {"engine": "offline_fallback", "error": f"Local error: {local_err}"}

# Singleton Instance
gemini_engine = GeminiEngine()
