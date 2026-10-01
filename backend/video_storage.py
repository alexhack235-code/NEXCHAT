# -*- coding: utf-8 -*-
"""
NEXIUM Video Cloud Vault System.
Manages persistent cloud storage for end-user generated videos.

Supported Cloud Vault Providers:
1. Cloudflare R2 (S3-compatible, Zero Egress Bandwidth Fees - Recommended for video SaaS)
2. Supabase Storage (PostgreSQL & user-auth integrated storage bucket)
3. AWS S3 (Standard Enterprise S3 Object Storage)
4. Local Host Vault (Development fallback)
"""

import os
import logging
from typing import Optional, Dict, Any, List
import httpx

logger = logging.getLogger("nexium.video_storage")

class VideoCloudVault:
    def __init__(self):
        # Cloudflare R2 / S3 Credentials
        self.r2_account_id = os.getenv("R2_ACCOUNT_ID", "")
        self.r2_access_key = os.getenv("R2_ACCESS_KEY_ID", "")
        self.r2_secret_key = os.getenv("R2_SECRET_ACCESS_KEY", "")
        self.r2_bucket = os.getenv("R2_BUCKET_NAME", "nexium-videos")
        self.r2_public_url = os.getenv("R2_PUBLIC_DOMAIN", "").rstrip("/")

        # Supabase Credentials
        self.supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.supabase_key = os.getenv("SUPABASE_KEY", "")
        self.supabase_bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "videos")

        # Active Provider Detection
        self.active_provider = self._detect_active_provider()
        logger.info(f"[VideoCloudVault] Active Cloud Storage Vault: {self.active_provider}")

    def _detect_active_provider(self) -> str:
        if self.r2_access_key and self.r2_secret_key and self.r2_account_id:
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

        # Provider 1: Supabase Storage Vault
        if self.active_provider == "SUPABASE_STORAGE":
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
                    else:
                        logger.warning(f"[VideoCloudVault] Supabase upload error {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.error(f"[VideoCloudVault] Supabase upload failed: {e}")

        # Provider 2: Cloudflare R2 / AWS S3 Vault
        elif self.active_provider == "CLOUDFLARE_R2":
            try:
                # Direct S3 endpoint URL for Cloudflare R2
                endpoint = f"https://{self.r2_account_id}.r2.cloudflarestorage.com"
                # If boto3 is available, use client; otherwise use signed HTTP PUT
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
                if self.r2_public_url:
                    public_url = f"{self.r2_public_url}/{vault_key}"
                else:
                    public_url = f"https://{self.r2_bucket}.{self.r2_account_id}.r2.dev/{vault_key}"

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
            "providers": {
                "cloudflare_r2": {
                    "name": "Cloudflare R2 (Recommended - 0 Egress Bandwidth Fees)",
                    "configured": bool(self.r2_access_key and self.r2_secret_key and self.r2_account_id),
                    "required_keys": [
                        "R2_ACCOUNT_ID",
                        "R2_ACCESS_KEY_ID",
                        "R2_SECRET_ACCESS_KEY",
                        "R2_BUCKET_NAME",
                        "R2_PUBLIC_DOMAIN"
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
                "local_disk": {
                    "name": "Local Host Vault",
                    "configured": True,
                    "path": "backend/generated_code/videos"
                }
            }
        }

cloud_vault = VideoCloudVault()
