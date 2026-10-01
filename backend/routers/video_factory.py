# -*- coding: utf-8 -*-
"""
FastAPI Router for VideoFactory AI.
Exposes automated video manufacturing endpoints for viral novel recap Shorts.
"""

import os
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

try:
    from ..video_factory import video_factory, VIDEOS_DIR, VIDEOFACTORY_SYSTEM_PROMPT
except ImportError:
    from video_factory import video_factory, VIDEOS_DIR, VIDEOFACTORY_SYSTEM_PROMPT

router = APIRouter(prefix="/video", tags=["VideoFactory AI"])

class ChapterToShortRequest(BaseModel):
    chapter: str = Field(..., description="Novel chapter text or script content")
    elevenlabs_api_key: Optional[str] = Field(default=None, description="Optional ElevenLabs API key")
    creatomate_api_key: Optional[str] = Field(default=None, description="Optional Creatomate API key")
    template_id: Optional[str] = Field(default=None, description="Optional Creatomate template ID")

class ConfigUpdateRequest(BaseModel):
    elevenlabs_api_key: Optional[str] = None
    creatomate_api_key: Optional[str] = None
    creatomate_template_id: Optional[str] = None
    voice_id: Optional[str] = None

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
        "total_shorts_generated": len(video_factory.jobs)
    }

@router.post("/chapter-to-short")
async def generate_short_from_chapter(req: ChapterToShortRequest) -> Dict[str, Any]:
    """
    Executes the 4-step VideoFactory pipeline:
    1. Rewrite chapter into 130-word viral script.
    2. Synthesize deep Adam voiceover via ElevenLabs (or sovereign fallback).
    3. Generate 9:16 cinematic manhwa visual from keywords.
    4. Compile final 9:16 vertical short with Anton Bold white+cyan glow subtitles.
    """
    if not req.chapter.strip():
        raise HTTPException(status_code=400, detail="Chapter text cannot be empty.")

    job = await video_factory.execute_pipeline(
        chapter_text=req.chapter,
        elevenlabs_key=req.elevenlabs_api_key,
        creatomate_key=req.creatomate_api_key,
        template_id=req.template_id
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
        "output": job["mp4_url"]
    }

@router.post("/upload")
async def upload_chapter_file(
    file: UploadFile = File(...),
    elevenlabs_api_key: Optional[str] = Form(None),
    creatomate_api_key: Optional[str] = Form(None),
    template_id: Optional[str] = Form(None)
) -> Dict[str, Any]:
    """Upload a chapter file (.txt, .md) to directly synthesize a viral Short."""
    content_bytes = await file.read()
    try:
        chapter_text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        chapter_text = content_bytes.decode("latin-1")

    job = await video_factory.execute_pipeline(
        chapter_text=chapter_text,
        elevenlabs_key=elevenlabs_api_key,
        creatomate_key=creatomate_api_key,
        template_id=template_id
    )
    return {
        "status": "success",
        "filename": file.filename,
        "mp4_url": job["mp4_url"],
        "job_id": job["job_id"],
        "script": job["script"],
        "keywords": job["keywords"],
        "duration_sec": job["duration_sec"],
        "output": job["mp4_url"]
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
