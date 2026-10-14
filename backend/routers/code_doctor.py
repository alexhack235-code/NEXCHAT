# -*- coding: utf-8 -*-
"""
FastAPI Router for NEXIUM Code Doctor & Heavy Architecture Synthesis.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:
    from ..code_doctor import code_doctor
    from ..heavy_code_engine import heavy_code_engine
except ImportError:
    from code_doctor import code_doctor
    from heavy_code_engine import heavy_code_engine

router = APIRouter()

class DiagnoseRequest(BaseModel):
    code: str = Field(..., description="Source code to analyze")
    language: str = Field(default="python", description="Language of the code")

class RepairRequest(BaseModel):
    code: str = Field(..., description="Source code to repair")
    language: str = Field(default="python", description="Language of the code")
    error_hint: Optional[str] = Field(default=None, description="Optional compiler or test error trace")

class HeavySynthesizeRequest(BaseModel):
    blueprint_id: str = Field(..., description="Heavy architecture blueprint ID (e.g. raft_consensus_engine, lockfree_slab_arena, simd_hnsw_vector_indexer)")

class TrainFixRequest(BaseModel):
    bug_name: str = Field(..., description="Name or class of the bug")
    broken_code: str = Field(..., description="Broken code snippet")
    language: str = Field(default="python")

@router.post("/code/doctor/diagnose")
async def diagnose_code(req: DiagnoseRequest):
    """Diagnose code for syntax, concurrency, memory leak, and edge-case bugs."""
    try:
        return code_doctor.diagnose_code(req.code, language=req.language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/code/doctor/repair")
async def repair_code(req: RepairRequest):
    """Autonomously patch and repair defects in code."""
    try:
        return code_doctor.repair_code(req.code, language=req.language, error_hint=req.error_hint)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/code/heavy/blueprints")
async def list_heavy_blueprints():
    """List all production heavy code architectures."""
    return {"blueprints": heavy_code_engine.get_all_blueprints(), "count": len(heavy_code_engine.blueprints)}

@router.post("/code/heavy/synthesize")
async def synthesize_heavy_code(req: HeavySynthesizeRequest):
    """Synthesize a complete industrial systems architecture."""
    res = heavy_code_engine.synthesize_heavy_system(req.blueprint_id)
    if not res.get("success"):
        raise HTTPException(status_code=404, detail=res.get("error", "Blueprint not found"))
    return res

@router.post("/code/doctor/train")
async def train_doctor_fix(req: TrainFixRequest):
    """Train Code Doctor on a broken code challenge and ingest the fix into RAG memory."""
    try:
        return await code_doctor.train_and_learn_fix(req.bug_name, req.broken_code, language=req.language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
