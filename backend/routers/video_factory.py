# -*- coding: utf-8 -*-
"""
FastAPI Router for VideoFactory AI.
Exposes automated video manufacturing endpoints for viral novel recap Shorts.
Enforces Token and Free Limit System (Free: 2/day, Elite: 35 tokens/video).
"""

import os
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

try:
    from ..video_factory import video_factory, VIDEOS_DIR, VIDEOFACTORY_SYSTEM_PROMPT
    from ..video_tokens import token_manager, UPGRADE_MENU_TEXT, TOKEN_PACKS, COST_PER_VIDEO
    from ..video_storage import cloud_vault
except ImportError:
    from video_factory import video_factory, VIDEOS_DIR, VIDEOFACTORY_SYSTEM_PROMPT
    from video_tokens import token_manager, UPGRADE_MENU_TEXT, TOKEN_PACKS, COST_PER_VIDEO
    from video_storage import cloud_vault

router = APIRouter(prefix="/video", tags=["VideoFactory AI"])

class ChapterToShortRequest(BaseModel):
    chapter: str = Field(..., description="Novel chapter text or script content")
    user_id: Optional[str] = Field(default="default_user", description="User identifier for tier and token tracking")
    elevenlabs_api_key: Optional[str] = Field(default=None, description="Optional ElevenLabs API key")
    creatomate_api_key: Optional[str] = Field(default=None, description="Optional Creatomate API key")
    template_id: Optional[str] = Field(default=None, description="Optional Creatomate template ID")

class ConfigUpdateRequest(BaseModel):
    elevenlabs_api_key: Optional[str] = None
    creatomate_api_key: Optional[str] = None
    creatomate_template_id: Optional[str] = None
    voice_id: Optional[str] = None

class BuyTokenRequest(BaseModel):
    user_id: Optional[str] = "default_user"
    pack: str = Field(..., description="Pack name or amount, e.g. BUY 5, BUY 20, BUY 50, starter, pro, agency")
    paystack_ref: Optional[str] = None

@router.get("/status")
async def get_factory_status() -> Dict[str, Any]:
    """Returns VideoFactory AI configuration and pipeline status."""
    return {
        "status": "ONLINE",
        "service": "VideoFactory AI",
        "role": "Viral Novel Recap Shorts Manufacturing Engine",
        "steps": [
            "STEP 1: SCRIPT (130-word viral recap, Hook 'He thought...', Present-tense, Cliffhanger)",
            "STEP 2: VOICE (ElevenLabs API: Adam deep pNInz6obpgDQGcFmaJgB, eleven_multilingual_v2)",
            "STEP 3: VISUALS (Prompt: manhwa style, {keywords}, cinematic, 9:16, highly detailed)",
            "STEP 4: EDIT (Creatomate template integration + Native 60fps FFmpeg compositor)"
        ],
        "system_prompt": VIDEOFACTORY_SYSTEM_PROMPT,
        "configured_keys": {
            "elevenlabs": bool(video_factory.config.get("elevenlabs_api_key")),
            "creatomate": bool(video_factory.config.get("creatomate_api_key")),
            "template_id": video_factory.config.get("creatomate_template_id") or "YOUR_TEMPLATE_ID"
        },
        "total_shorts_generated": len(video_factory.jobs),
        "cost_per_video": COST_PER_VIDEO
    }

@router.post("/chapter-to-short")
async def generate_short_from_chapter(req: ChapterToShortRequest):
    """
    Executes the 4-step VideoFactory pipeline:
    1. Rewrite chapter into 130-word viral script.
    2. Synthesize deep Adam voiceover via ElevenLabs (or sovereign fallback).
    3. Generate 9:16 cinematic manhwa visual from keywords.
    4. Compile final 9:16 vertical short with Anton Bold white+cyan glow subtitles.
    Enforces Free tier (2/day) and Elite tier (35 tokens/video) limits.
    """
    if not req.chapter.strip():
        raise HTTPException(status_code=400, detail="Chapter text cannot be empty.")

    job = await video_factory.execute_pipeline(
        chapter_text=req.chapter,
        user_id=req.user_id or "default_user",
        elevenlabs_key=req.elevenlabs_api_key,
        creatomate_key=req.creatomate_api_key,
        template_id=req.template_id
    )

    if job.get("status") == "BLOCKED":
        return JSONResponse(
            status_code=402,
            content={
                "status": "BLOCKED",
                "quota_reply": job.get("quota_reply"),
                "error": job.get("error"),
                "user_tier": job.get("user_tier"),
                "user_tokens": job.get("user_tokens"),
                "videos_today": job.get("videos_today")
            }
        )

    return {
        "status": "success",
        "mp4_url": job["mp4_url"],
        "job_id": job["job_id"],
        "script": job["script"],
        "keywords": job["keywords"],
        "duration_sec": job["duration_sec"],
        "elapsed_sec": job["elapsed_sec"],
        "voice_engine": job["voice_engine"],
        "visual_engine": job["visual_engine"],
        "render_engine": job["render_engine"],
        "quota_reply": job.get("quota_reply"),
        "user_tier": job.get("user_tier"),
        "user_tokens": job.get("user_tokens"),
        "videos_today": job.get("videos_today"),
        "output": job["mp4_url"]
    }

@router.post("/upload")
async def upload_chapter_file(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form("default_user"),
    elevenlabs_api_key: Optional[str] = Form(None),
    creatomate_api_key: Optional[str] = Form(None),
    template_id: Optional[str] = Form(None)
):
    """Upload a chapter file (.txt, .md) to directly synthesize a viral Short."""
    content_bytes = await file.read()
    try:
        chapter_text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        chapter_text = content_bytes.decode("latin-1")

    job = await video_factory.execute_pipeline(
        chapter_text=chapter_text,
        user_id=user_id or "default_user",
        elevenlabs_key=elevenlabs_api_key,
        creatomate_key=creatomate_api_key,
        template_id=template_id
    )

    if job.get("status") == "BLOCKED":
        return JSONResponse(
            status_code=402,
            content={
                "status": "BLOCKED",
                "quota_reply": job.get("quota_reply"),
                "error": job.get("error"),
                "user_tier": job.get("user_tier"),
                "user_tokens": job.get("user_tokens"),
                "videos_today": job.get("videos_today")
            }
        )

    return {
        "status": "success",
        "filename": file.filename,
        "mp4_url": job["mp4_url"],
        "job_id": job["job_id"],
        "script": job["script"],
        "keywords": job["keywords"],
        "duration_sec": job["duration_sec"],
        "quota_reply": job.get("quota_reply"),
        "user_tier": job.get("user_tier"),
        "user_tokens": job.get("user_tokens"),
        "videos_today": job.get("videos_today"),
        "output": job["mp4_url"]
    }

@router.get("/user/{user_id}")
async def get_user_quota_status(user_id: str) -> Dict[str, Any]:
    """Returns complete user quota, tier, and reset countdown."""
    if not token_manager:
        raise HTTPException(status_code=500, detail="Token manager not initialized.")
    return token_manager.get_user_status(user_id)

@router.get("/upgrade-plans")
async def get_upgrade_plans() -> Dict[str, Any]:
    """Returns Elite Tier token packs and upgrade menu text."""
    return {
        "status": "success",
        "menu_text": UPGRADE_MENU_TEXT,
        "packs": TOKEN_PACKS,
        "cost_per_video": COST_PER_VIDEO
    }

@router.post("/tokens/buy")
async def buy_token_pack(req: BuyTokenRequest) -> Dict[str, Any]:
    """Purchases a token pack and upgrades user to Elite tier."""
    if not token_manager:
        raise HTTPException(status_code=500, detail="Token manager not initialized.")
    success, msg, user_record = token_manager.purchase_pack(
        user_id=req.user_id or "default_user",
        pack_identifier=req.pack,
        paystack_ref=req.paystack_ref
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {
        "status": "success",
        "message": msg,
        "user": user_record
    }

@router.post("/tokens/reset-daily")
async def trigger_daily_reset() -> Dict[str, Any]:
    """Triggers the midnight WAT free-tier daily reset."""
    if not token_manager:
        raise HTTPException(status_code=500, detail="Token manager not initialized.")
    count = token_manager.reset_all_free_users_daily()
    return {
        "status": "success",
        "message": f"Daily midnight WAT reset completed. Reset {count} free tier accounts.",
        "reset_count": count
    }

class CloudinarySetupRequest(BaseModel):
    presets: List[Dict[str, Any]] = Field(default=[], description="List of Cloudinary configurations (up to 5)")
    raw_text: Optional[str] = Field(default=None, description="Raw text or Cloudinary URLs to parse")

@router.get("/vault-status")
async def get_vault_status() -> Dict[str, Any]:
    """Returns active cloud storage vault configuration and status."""
    if not cloud_vault:
        return {"active_provider": "LOCAL_DISK_VAULT", "configured": False}
    return cloud_vault.get_vault_status()

@router.post("/vault/setup-cloudinary")
async def setup_cloudinary_vault(req: CloudinarySetupRequest) -> Dict[str, Any]:
    """Registers up to 5 Cloudinary upload presets or credentials into the persistent vault."""
    if not cloud_vault:
        raise HTTPException(status_code=500, detail="Cloud vault adapter not loaded.")

    accounts = list(req.presets)
    if req.raw_text:
        for line in req.raw_text.strip().splitlines():
            line = line.strip()
            if not line:
                continue
            if line.startswith("cloudinary://"):
                parsed = cloud_vault.parse_cloudinary_url(line)
                if parsed:
                    accounts.append(parsed)
            elif "," in line:
                parts = [p.strip() for p in line.split(",")]
                if len(parts) >= 2:
                    accounts.append({
                        "id": f"preset_{len(accounts)+1}",
                        "cloud_name": parts[0],
                        "upload_preset": parts[1]
                    })

    if not accounts:
        raise HTTPException(status_code=400, detail="No valid Cloudinary presets or credentials provided.")

    count = cloud_vault.register_cloudinary_accounts(accounts)
    return {
        "status": "success",
        "message": f"Successfully registered {count} Cloudinary vault presets into load balancer.",
        "active_provider": cloud_vault.active_provider,
        "vault_status": cloud_vault.get_vault_status()
    }

@router.get("/stream/{filename}")
@router.head("/stream/{filename}")
async def stream_video(filename: str):
    """Streams generated MP4 video directly with partial content/range support."""
    # Sanitize filename
    safe_name = os.path.basename(filename)
    path = os.path.join(VIDEOS_DIR, safe_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Requested video file does not exist.")
    return FileResponse(path, media_type="video/mp4", filename=safe_name)

@router.get("/jobs")
async def get_all_jobs() -> Dict[str, Any]:
    """Returns all past synthesized shorts in reverse chronological order."""
    return {
        "status": "success",
        "count": len(video_factory.jobs),
        "jobs": video_factory.list_jobs()
    }

@router.post("/config")
async def update_config(req: ConfigUpdateRequest) -> Dict[str, Any]:
    """Updates API keys for ElevenLabs and Creatomate."""
    updates = {}
    if req.elevenlabs_api_key is not None:
        updates["elevenlabs_api_key"] = req.elevenlabs_api_key
    if req.creatomate_api_key is not None:
        updates["creatomate_api_key"] = req.creatomate_api_key
    if req.creatomate_template_id is not None:
        updates["creatomate_template_id"] = req.creatomate_template_id
    if req.voice_id is not None:
        updates["voice_id"] = req.voice_id

    video_factory.save_config(updates)
    return {
        "status": "success",
        "message": "VideoFactory configuration saved.",
        "configured": {
            "elevenlabs": bool(video_factory.config.get("elevenlabs_api_key")),
            "creatomate": bool(video_factory.config.get("creatomate_api_key")),
            "template_id": video_factory.config.get("creatomate_template_id")
        }
    }
