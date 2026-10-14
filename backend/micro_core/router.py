# -*- coding: utf-8 -*-
"""
FastAPI Router for NEXIUM Micro-Computing Core.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

try:
    from .engine import micro_engine
except ImportError:
    from micro_core.engine import micro_engine

router = APIRouter(prefix="/micro", tags=["micro_core"])

class MicroDeliberateRequest(BaseModel):
    prompt: str = Field(..., description="Query or thought segment to micro-deliberate")
    context: Optional[str] = Field(default=None, description="Optional cognitive context")

@router.post("/deliberate")
async def deliberate(req: MicroDeliberateRequest) -> Dict[str, Any]:
    """Runs sub-millisecond cognitive micro-assertions and invariant checks."""
    return micro_engine.deliberate(prompt=req.prompt, context=req.context)

@router.get("/stats")
async def get_stats() -> Dict[str, Any]:
    """Returns micro-computing operational parameters."""
    return micro_engine.get_stats()
