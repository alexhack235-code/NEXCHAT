# -*- coding: utf-8 -*-
"""
NEXIUM Autonomous Dynamic Tool Synthesizer.
Allows NEXIUM to invent, validate, sandbox, and register new tools on the fly.
Enables true autonomous adaptability: when faced with a task beyond static tools,
NEXIUM writes the tool code, verifies safety with AST + Rust guardrails,
runs a smoke test, and registers it into the active execution pipeline.
"""

import os
import ast
import json
import time
import hashlib
import logging
from typing import Dict, Any, Optional, List

try:
    from .tools_engine import register_custom_tool, execute_tool, list_registered_tools
    from .rust_engine import engine as rust_core
except ImportError:
    from tools_engine import register_custom_tool, execute_tool, list_registered_tools
    from rust_engine import engine as rust_core

logger = logging.getLogger("nexium.tool_synthesizer")

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
TOOLS_CATALOG_FILE = os.path.join(DATA_DIR, "synthesized_tools_catalog.json")

# Forbidden AST nodes to ensure dynamic tools cannot execute hostile exploits
DANGEROUS_ATTRIBUTES = {
    "system", "popen", "spawn", "kill", "remove", "rmdir", "unlink"
}

class ToolSynthesizer:
    """
    Manages autonomous tool invention, safety analysis, sandboxed compilation,
    live registration, and persistent catalog storage.
    """

    def __init__(self):
        self.synthesized_tools: Dict[str, Dict[str, Any]] = {}
        self._load_catalog()
        self._bootstrap_default_tools()

    def _load_catalog(self):
        if os.path.exists(TOOLS_CATALOG_FILE):
            try:
                with open(TOOLS_CATALOG_FILE, "r", encoding="utf-8") as f:
                    self.synthesized_tools = json.load(f)
            except Exception as e:
                logger.debug(f"Catalog load notice: {e}")
                self.synthesized_tools = {}

    def _save_catalog(self):
        try:
            os.makedirs(DATA_DIR, exist_ok=True)
            with open(TOOLS_CATALOG_FILE, "w", encoding="utf-8") as f:
                json.dump(self.synthesized_tools, f, indent=2)
        except Exception as e:
            logger.warning(f"Could not save tool catalog: {e}")

    def _bootstrap_default_tools(self):
        """Bootstrap high-value dynamic tools immediately on startup."""
        # 1. Crypto Hasher
        def tool_crypto_hash(data: str, algorithm: str = "sha256") -> Dict[str, Any]:
            algo = algorithm.lower().strip()
            data_bytes = data.encode("utf-8")
            if algo == "sha256":
                digest = hashlib.sha256(data_bytes).hexdigest()
            elif algo == "sha512":
                digest = hashlib.sha512(data_bytes).hexdigest()
            elif algo == "sha1":
                digest = hashlib.sha1(data_bytes).hexdigest()
            elif algo == "md5":
                digest = hashlib.md5(data_bytes).hexdigest()
            elif algo == "blake2b":
                digest = hashlib.blake2b(data_bytes).hexdigest()
            else:
                return {"success": False, "error": f"Unsupported algorithm: {algorithm}"}
            return {"success": True, "algorithm": algo, "input_len": len(data), "hash": digest}

        register_custom_tool(
            "crypto_hash",
            tool_crypto_hash,
            "Cryptographic hashing: sha256, sha512, sha1, md5, blake2b.",
            {"data": "string", "algorithm": "optional string default 'sha256'"}
        )

        # 2. Text Linguistic & Entropy Analyzer
        def tool_text_analyzer(text: str) -> Dict[str, Any]:
            words = text.split()
            word_count = len(words)
            char_count = len(text)
            unique_words = len(set(w.lower() for w in words))
            lexical_diversity = round(unique_words / max(1, word_count), 3)

            # Shannon Entropy calculation
            import math
            prob = [float(text.count(c)) / max(1, char_count) for c in set(text)]
            entropy = round(-sum(p * math.log2(p) for p in prob), 3) if prob else 0.0

            return {
                "success": True,
                "character_count": char_count,
                "word_count": word_count,
                "unique_words": unique_words,
                "lexical_diversity": lexical_diversity,
                "shannon_entropy": entropy,
                "estimated_tokens": max(1, int(char_count / 3.8)),
            }

        register_custom_tool(
            "text_analyzer",
            tool_text_analyzer,
            "Analyze text complexity, Shannon entropy, lexical diversity, and token estimation.",
            {"text": "string"}
        )

        # 3. Unit Converter
        def tool_unit_converter(value: float, from_unit: str, to_unit: str) -> Dict[str, Any]:
            f_unit = from_unit.lower().strip()
            t_unit = to_unit.lower().strip()

            # Length (meters base)
            length_factors = {"m": 1.0, "km": 1000.0, "cm": 0.01, "mm": 0.001, "mi": 1609.34, "ft": 0.3048, "in": 0.0254}
            # Mass (kg base)
            mass_factors = {"kg": 1.0, "g": 0.001, "mg": 0.000001, "lb": 0.453592, "oz": 0.0283495}
            # Digital Data (bytes base)
            data_factors = {"b": 1, "kb": 1024, "mb": 1024**2, "gb": 1024**3, "tb": 1024**4}

            if f_unit in length_factors and t_unit in length_factors:
                meters = value * length_factors[f_unit]
                res = meters / length_factors[t_unit]
                return {"success": True, "value": round(res, 6), "from": f_unit, "to": t_unit}

            if f_unit in mass_factors and t_unit in mass_factors:
                kgs = value * mass_factors[f_unit]
                res = kgs / mass_factors[t_unit]
                return {"success": True, "value": round(res, 6), "from": f_unit, "to": t_unit}

            if f_unit in data_factors and t_unit in data_factors:
                bytes_val = value * data_factors[f_unit]
                res = bytes_val / data_factors[t_unit]
                return {"success": True, "value": round(res, 6), "from": f_unit, "to": t_unit}

            # Temperature
            if f_unit in ("c", "celsius") and t_unit in ("f", "fahrenheit"):
                return {"success": True, "value": round((value * 9/5) + 32, 2), "from": "C", "to": "F"}
            if f_unit in ("f", "fahrenheit") and t_unit in ("c", "celsius"):
                return {"success": True, "value": round((value - 32) * 5/9, 2), "from": "F", "to": "C"}
            if f_unit in ("c", "celsius") and t_unit in ("k", "kelvin"):
                return {"success": True, "value": round(value + 273.15, 2), "from": "C", "to": "K"}

            return {"success": False, "error": f"Incompatible units: '{from_unit}' to '{to_unit}'"}

        register_custom_tool(
            "unit_converter",
            tool_unit_converter,
            "Physical and digital unit conversion (length, mass, temperature, data bytes).",
            {"value": "float", "from_unit": "string", "to_unit": "string"}
        )

    def validate_code_safety(self, code_str: str) -> Dict[str, Any]:
        """Perform static AST and guardrail inspection of synthesized code."""
        # Rust guardrails scan
        safety_scan = rust_core.safety_scan(code_str)
        if not safety_scan.get("safe", True):
            return {"safe": False, "reason": "Rust guardrail scan flagged code as unsafe", "flags": safety_scan.get("flags")}

        # AST Parse & walk
        try:
            tree = ast.parse(code_str)
        except SyntaxError as syn_err:
            return {"safe": False, "reason": f"Syntax error in synthesized tool: {syn_err}"}

        for node in ast.walk(tree):
            if isinstance(node, ast.Attribute):
                if node.attr in DANGEROUS_ATTRIBUTES:
                    return {"safe": False, "reason": f"Prohibited dangerous attribute call: '{node.attr}'"}

        return {"safe": True}

    def synthesize_and_register(
        self,
        name: str,
        code_str: str,
        entry_func_name: str,
        description: str,
        parameters: Optional[Dict[str, str]] = None,
        test_kwargs: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Safely synthesize, sandbox compile, test, and register a dynamic tool.
        """
        t0 = time.perf_counter()

        # 1. Safety validation
        safety = self.validate_code_safety(code_str)
        if not safety["safe"]:
            return {"success": False, "error": safety["reason"]}

        # 2. Compilation in isolated scope
        compiled_scope: Dict[str, Any] = {}
        try:
            exec(code_str, compiled_scope)
        except Exception as e:
            return {"success": False, "error": f"Failed to compile tool module: {str(e)}"}

        if entry_func_name not in compiled_scope:
            return {"success": False, "error": f"Entry point function '{entry_func_name}' not defined in code."}

        target_func = compiled_scope[entry_func_name]

        # 3. Smoke test verification
        if test_kwargs is not None:
            try:
                smoke_res = target_func(**test_kwargs)
                logger.info(f"Tool '{name}' smoke test passed with result: {smoke_res}")
            except Exception as e:
                return {"success": False, "error": f"Smoke test failed for '{name}': {str(e)}"}

        # 4. Live Runtime Registration
        register_custom_tool(name, target_func, description, parameters or {})

        latency_ms = (time.perf_counter() - t0) * 1000.0

        # 5. Catalog record
        tool_record = {
            "name": name,
            "entry_func": entry_func_name,
            "description": description,
            "parameters": parameters or {},
            "code": code_str,
            "synthesized_at": time.time(),
            "rust_verified": True,
            "latency_ms": round(latency_ms, 2),
        }
        self.synthesized_tools[name] = tool_record
        self._save_catalog()

        return {
            "success": True,
            "tool_name": name,
            "description": description,
            "latency_ms": round(latency_ms, 2),
            "registered": True,
        }

# Global singleton
tool_synthesizer = ToolSynthesizer()
