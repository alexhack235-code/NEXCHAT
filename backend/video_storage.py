# -*- coding: utf-8 -*-
"""
NEXIUM Video Cloud Vault System.
Manages persistent cloud storage for end-user generated videos.

Supported Cloud Vault Providers:
1. Cloudinary Multi-Account / 5-Preset Vault (Instant global CDN, video streaming, automatic optimization)
2. Cloudflare R2 (S3-compatible, Zero Egress Bandwidth Fees)
3. Supabase Storage (PostgreSQL & user-auth integrated storage bucket)
4. Local Host Vault (Development fallback)
"""

import os
import json
import time
import hashlib
import logging
from typing import Optional, Dict, Any, List
import httpx

logger = logging.getLogger("nexium.video_storage")

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
CLOUDINARY_CONFIG_FILE = os.path.join(ROOT_DIR, "data", "cloudinary_vaults.json")

class VideoCloudVault:
    def __init__(self):
        # 1. Cloudinary Vault Pool (Supports up to 5 presets / accounts)
        self.cloudinary_accounts: List[Dict[str, str]] = []
        self._load_cloudinary_config()
        self.cloudinary_index = 0

        # 2. Cloudflare R2 Credentials
        self.r2_account_id = os.getenv("R2_ACCOUNT_ID", "")
        self.r2_access_key = os.getenv("R2_ACCESS_KEY_ID", "")
        self.r2_secret_key = os.getenv("R2_SECRET_ACCESS_KEY", "")
        self.r2_bucket = os.getenv("R2_BUCKET_NAME", "nexium-videos")
        self.r2_public_url = os.getenv("R2_PUBLIC_DOMAIN", "").rstrip("/")

        # 3. Supabase Credentials
        self.supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.supabase_key = os.getenv("SUPABASE_KEY", "")
        self.supabase_bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "videos")

        # Active Provider Detection
        self.active_provider = self._detect_active_provider()
        logger.info(f"[VideoCloudVault] Active Cloud Storage Vault: {self.active_provider}")

    def _load_cloudinary_config(self):
        """Loads Cloudinary single or multi-preset pool from file and environment."""
        self.cloudinary_accounts = []
        
        # Load from JSON file if present
        if os.path.exists(CLOUDINARY_CONFIG_FILE):
            try:
                with open(CLOUDINARY_CONFIG_FILE, "r", encoding="utf-8") as f:
                    saved = json.load(f)
                    if isinstance(saved, list):
                        self.cloudinary_accounts.extend(saved)
                    elif isinstance(saved, dict) and "accounts" in saved:
                        self.cloudinary_accounts.extend(saved["accounts"])
            except Exception as e:
                logger.warning(f"[VideoCloudVault] Could not load cloudinary_vaults.json: {e}")

        # Check standard environment variables
        c_url = os.getenv("CLOUDINARY_URL", "")
        if c_url.startswith("cloudinary://"):
            parsed = self.parse_cloudinary_url(c_url)
            if parsed and parsed not in self.cloudinary_accounts:
                self.cloudinary_accounts.append(parsed)

        # Check numbered environment presets (CLOUDINARY_1 to CLOUDINARY_5)
        for i in range(1, 6):
            preset_name = os.getenv(f"CLOUDINARY_PRESET_{i}") or os.getenv(f"CLOUDINARY_UPLOAD_PRESET_{i}")
            cloud_name = os.getenv(f"CLOUDINARY_CLOUD_NAME_{i}") or os.getenv("CLOUDINARY_CLOUD_NAME")
            api_key = os.getenv(f"CLOUDINARY_API_KEY_{i}") or os.getenv("CLOUDINARY_API_KEY")
            api_secret = os.getenv(f"CLOUDINARY_API_SECRET_{i}") or os.getenv("CLOUDINARY_API_SECRET")

            if cloud_name and (preset_name or (api_key and api_secret)):
                entry = {
                    "id": f"preset_{i}",
                    "cloud_name": cloud_name,
                    "upload_preset": preset_name or "",
                    "api_key": api_key or "",
                    "api_secret": api_secret or ""
                }
                if not any(a.get("cloud_name") == cloud_name and a.get("upload_preset") == preset_name for a in self.cloudinary_accounts):
                    self.cloudinary_accounts.append(entry)

        # Check base unnumbered env vars
        base_cloud = os.getenv("CLOUDINARY_CLOUD_NAME")
        base_preset = os.getenv("CLOUDINARY_UPLOAD_PRESET")
        base_key = os.getenv("CLOUDINARY_API_KEY")
        base_secret = os.getenv("CLOUDINARY_API_SECRET")
        if base_cloud and (base_preset or (base_key and base_secret)):
            entry = {
                "id": "primary",
                "cloud_name": base_cloud,
                "upload_preset": base_preset or "",
                "api_key": base_key or "",
                "api_secret": base_secret or ""
            }
            if not any(a.get("cloud_name") == base_cloud for a in self.cloudinary_accounts):
                self.cloudinary_accounts.insert(0, entry)

    def parse_cloudinary_url(self, url: str) -> Optional[Dict[str, str]]:
        """Parses cloudinary://<api_key>:<api_secret>@<cloud_name>"""
        try:
            core = url.replace("cloudinary://", "")
            creds, cloud_name = core.split("@")
            api_key, api_secret = creds.split(":")
            return {
                "id": f"account_{cloud_name}",
                "cloud_name": cloud_name,
                "api_key": api_key,
                "api_secret": api_secret,
                "upload_preset": ""
            }
        except Exception:
            return None

    def register_cloudinary_accounts(self, accounts: List[Dict[str, Any]]) -> int:
        """Saves user-provided Cloudinary presets into persistent config."""
        os.makedirs(os.path.dirname(CLOUDINARY_CONFIG_FILE), exist_ok=True)
        self.cloudinary_accounts = accounts
        with open(CLOUDINARY_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(self.cloudinary_accounts, f, indent=2)
        self.active_provider = self._detect_active_provider()
        logger.info(f"[VideoCloudVault] Registered {len(accounts)} Cloudinary vault presets.")
        return len(accounts)

    def _detect_active_provider(self) -> str:
        if self.cloudinary_accounts:
            return "CLOUDINARY"
        elif self.r2_access_key and self.r2_secret_key and self.r2_account_id:
            return "CLOUDFLARE_R2"
        elif self.supabase_url and self.supabase_key:
            return "SUPABASE_STORAGE"
        return "LOCAL_DISK_VAULT"

    async def upload_video(
        self,
        local_filepath: str,
        user_id: str = "default_user",
        filename: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uploads generated MP4 video to the user's isolated cloud vault folder:
        vault/{user_id}/videos/{filename}
        Returns the permanent public cloud streaming link.
        """
        if not os.path.exists(local_filepath):
            raise FileNotFoundError(f"Local video file not found: {local_filepath}")

        safe_filename = filename or os.path.basename(local_filepath)
        vault_key = f"{user_id}/videos/{safe_filename}"
        file_size = os.path.getsize(local_filepath)

        # Provider 1: Cloudinary Vault (Supports up to 5 presets with round-robin)
        if self.active_provider == "CLOUDINARY" and self.cloudinary_accounts:
            # Round-robin selection across available presets
            account = self.cloudinary_accounts[self.cloudinary_index % len(self.cloudinary_accounts)]
            self.cloudinary_index += 1

            cloud_name = account.get("cloud_name")
            upload_preset = account.get("upload_preset")
            api_key = account.get("api_key")
            api_secret = account.get("api_secret")

            upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/video/upload"
            clean_public_id = f"nexium_{user_id}_{os.path.splitext(safe_filename)[0]}"

            try:
                data_payload: Dict[str, Any] = {
                    "folder": f"nexium_videos/{user_id}",
                    "public_id": clean_public_id
                }

                # Unsigned upload with preset
                if upload_preset:
                    data_payload["upload_preset"] = upload_preset
                # Signed upload with API key + Secret
                elif api_key and api_secret:
                    timestamp = str(int(time.time()))
                    # Cloudinary signature calculation: SHA1 of sorted params + api_secret
                    to_sign = f"folder=nexium_videos/{user_id}&public_id={clean_public_id}&timestamp={timestamp}{api_secret}"
                    signature = hashlib.sha1(to_sign.encode("utf-8")).hexdigest()
                    data_payload["api_key"] = api_key
                    data_payload["timestamp"] = timestamp
                    data_payload["signature"] = signature

                logger.info(f"[VideoCloudVault] Uploading video ({file_size} bytes) to Cloudinary ({cloud_name})...")
                async with httpx.AsyncClient(timeout=120.0) as client:
                    with open(local_filepath, "rb") as f:
                        files = {"file": (safe_filename, f, "video/mp4")}
                        resp = await client.post(upload_url, data=data_payload, files=files)

                    if resp.status_code in (200, 201):
                        resp_data = resp.json()
                        secure_url = resp_data.get("secure_url") or resp_data.get("url")
                        logger.info(f"[VideoCloudVault] Cloudinary Upload Successful! URL: {secure_url}")
                        return {
                            "success": True,
                            "provider": f"Cloudinary Vault ({cloud_name})",
                            "public_url": secure_url,
                            "vault_key": resp_data.get("public_id", clean_public_id),
                            "format": resp_data.get("format", "mp4"),
                            "duration_sec": resp_data.get("duration"),
                            "file_size_bytes": resp_data.get("bytes", file_size)
                        }
                    else:
                        logger.warning(f"[VideoCloudVault] Cloudinary API Error {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.error(f"[VideoCloudVault] Cloudinary upload exception: {e}")

        # Provider 2: Supabase Storage Vault
        if self.active_provider == "SUPABASE_STORAGE" or (self.supabase_url and self.supabase_key):
            try:
                url = f"{self.supabase_url}/storage/v1/object/{self.supabase_bucket}/{vault_key}"
                headers = {
                    "apikey": self.supabase_key,
                    "Authorization": f"Bearer {self.supabase_key}",
                    "Content-Type": "video/mp4"
                }
                with open(local_filepath, "rb") as f:
                    file_data = f.read()

                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.post(url, headers=headers, content=file_data)
                    if resp.status_code in (200, 201):
                        public_url = f"{self.supabase_url}/storage/v1/object/public/{self.supabase_bucket}/{vault_key}"
                        logger.info(f"[VideoCloudVault] Uploaded to Supabase Vault: {public_url}")
                        return {
                            "success": True,
                            "provider": "Supabase Storage Vault",
                            "public_url": public_url,
                            "vault_key": vault_key,
                            "file_size_bytes": file_size
                        }
            except Exception as e:
                logger.error(f"[VideoCloudVault] Supabase upload failed: {e}")

        # Provider 3: Cloudflare R2 / AWS S3 Vault
        if self.r2_access_key and self.r2_secret_key and self.r2_account_id:
            try:
                endpoint = f"https://{self.r2_account_id}.r2.cloudflarestorage.com"
                import boto3
                s3_client = boto3.client(
                    "s3",
                    endpoint_url=endpoint,
                    aws_access_key_id=self.r2_access_key,
                    aws_secret_access_key=self.r2_secret_key,
                    region_name="auto"
                )
                s3_client.upload_file(
                    local_filepath,
                    self.r2_bucket,
                    vault_key,
                    ExtraArgs={"ContentType": "video/mp4"}
                )
                public_url = f"{self.r2_public_url}/{vault_key}" if self.r2_public_url else f"https://{self.r2_bucket}.{self.r2_account_id}.r2.dev/{vault_key}"
                logger.info(f"[VideoCloudVault] Uploaded to Cloudflare R2 Vault: {public_url}")
                return {
                    "success": True,
                    "provider": "Cloudflare R2 Vault",
                    "public_url": public_url,
                    "vault_key": vault_key,
                    "file_size_bytes": file_size
                }
            except Exception as e:
                logger.error(f"[VideoCloudVault] R2 upload failed: {e}")

        # Local Host Fallback
        public_url = f"http://127.0.0.1:8001/api/video/stream/{safe_filename}"
        logger.info(f"[VideoCloudVault] Stored in Local Host Vault: {public_url}")
        return {
            "success": True,
            "provider": "Local Host Vault (Development)",
            "public_url": public_url,
            "vault_key": safe_filename,
            "file_size_bytes": file_size
        }

    def get_vault_status(self) -> Dict[str, Any]:
        """Returns active cloud storage configuration status and required keys."""
        return {
            "active_provider": self.active_provider,
            "cloudinary_vault_count": len(self.cloudinary_accounts),
            "providers": {
                "cloudinary": {
                    "name": "Cloudinary Video Vault (5-Preset Load Balancing Pool)",
                    "configured": bool(self.cloudinary_accounts),
                    "active_accounts": [
                        {
                            "id": a.get("id"),
                            "cloud_name": a.get("cloud_name"),
                            "has_preset": bool(a.get("upload_preset")),
                            "has_api_key": bool(a.get("api_key"))
                        }
                        for a in self.cloudinary_accounts
                    ],
                    "required_keys": [
                        "cloud_name",
                        "upload_preset (or api_key + api_secret)"
                    ]
                },
                "supabase_storage": {
                    "name": "Supabase Storage (PostgreSQL User Tied Bucket)",
                    "configured": bool(self.supabase_url and self.supabase_key),
                    "required_keys": [
                        "SUPABASE_URL",
                        "SUPABASE_KEY",
                        "SUPABASE_STORAGE_BUCKET"
                    ]
                },
                "cloudflare_r2": {
                    "name": "Cloudflare R2 (0 Egress Bandwidth Fees)",
                    "configured": bool(self.r2_access_key and self.r2_secret_key and self.r2_account_id),
                    "required_keys": [
                        "R2_ACCOUNT_ID",
                        "R2_ACCESS_KEY_ID",
                        "R2_SECRET_ACCESS_KEY",
                        "R2_BUCKET_NAME",
                        "R2_PUBLIC_DOMAIN"
                    ]
                },
                "local_disk": {
                    "name": "Local Host Vault",
                    "configured": True,
                    "path": "backend/generated_code/videos"
                }
            }
        }

cloud_vault = VideoCloudVault()
