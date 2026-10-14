# -*- coding: utf-8 -*-
"""
FastAPI Router for NEXIUM Emotion Resonance & User Feelings Journal.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

try:
    from .engine import emotion_engine
except ImportError:
    from emotion_core.engine import emotion_engine

router = APIRouter(prefix="/emotion", tags=["emotion_core"])

class AnalyzeFeelingRequest(BaseModel):
    text: str = Field(..., description="User message text to evaluate emotionally")
    record: bool = Field(default=True, description="Whether to record this entry into persistent feelings journal")

@router.get("/current")
async def get_current_emotion() -> Dict[str, Any]:
    """Returns current active user feeling and empathy resonance state."""
    return emotion_engine.get_current_state()

@router.get("/journal")
async def get_journal(limit: int = 25) -> List[Dict[str, Any]]:
    """Returns persistent feelings journal history."""
    return emotion_engine.get_journal_history(limit=limit)

@router.post("/analyze")
async def analyze_emotion(req: AnalyzeFeelingRequest) -> Dict[str, Any]:
    """Analyzes emotional state from text and optionally saves to journal."""
    feeling = emotion_engine.analyze_feeling(req.text)
    if req.record:
        emotion_engine.record_feeling(req.text, feeling)
    return {
        "status": "success",
        "feeling": feeling,
        "empathy_directive": emotion_engine.generate_empathy_directive(feeling),
    }

class RecordFeelingRequest(BaseModel):
    user_text: str = Field(..., description="User message text")
    session_id: Optional[str] = Field(default=None, description="Optional session ID")

@router.post("/record")
async def record_feeling_endpoint(req: RecordFeelingRequest) -> Dict[str, Any]:
    """Analyzes and records user feeling with empathy directive."""
    res = emotion_engine.record_and_direct(user_text=req.user_text, session_id=req.session_id)
    return {
        "status": "recorded",
        "feeling": res["feeling"],
        "directive": res["directive"],
        "summary": res["summary"],
    }

@router.get("/history")
async def get_history(limit: int = 25) -> Dict[str, Any]:
    """Returns feelings journal history with summary."""
    hist = emotion_engine.get_history(limit=limit)
    curr = emotion_engine.get_current_state()
    return {
        "status": "success",
        "history": hist,
        "summary": f"{len(hist)} journal entries retrieved",
        "current": curr,
    }

@router.get("/status")
async def get_emotion_status() -> Dict[str, Any]:
    """Returns emotion core status and climate."""
    curr = emotion_engine.get_current_state()
    return {
        "status": "active",
        "current_emotional_climate": curr["current_feeling"].get("primary", "Unknown"),
        "total_journal_entries": curr["total_entries_recorded"],
        "empathy_status": curr["empathy_status"],
    }
