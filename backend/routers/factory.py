"""
NEXIUM Code Factory API Router.
Exposes REST and SSE endpoints for high-throughput code synthesis, verification,
and live streaming of generated algorithmic and system modules.
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Query, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

try:
    from ..code_factory import code_factory
except ImportError:
    from code_factory import code_factory

logger = logging.getLogger("nexium.factory_api")
router = APIRouter(prefix="/factory", tags=["code_factory"])

class GenerateRequest(BaseModel):
    count: int = Field(default=100, ge=1, le=100000, description="Number of modules to synthesize")
    write_vault_sample: bool = Field(default=True, description="Save sample files to disk vault")
    stream_to_catalog: bool = Field(default=True, description="Record in JSONL streaming catalog")
    index_rag: bool = Field(default=False, description="Ingest chunks into RAG store")

@router.get("/stats")
async def get_factory_stats() -> Dict[str, Any]:
    """
    Returns telemetry for the autonomous code factory (total verified, catalog size, domains).
    """
    return {
        "status": "online",
        "stats": code_factory.get_stats()
    }

@router.post("/generate")
async def generate_code_batch(req: GenerateRequest) -> Dict[str, Any]:
    """
    Executes a verified synthesis batch of production code modules.
    """
    try:
        result = code_factory.generate_and_verify_batch(
            count=req.count,
            write_vault_sample=req.write_vault_sample,
            stream_to_catalog=req.stream_to_catalog
        )

        rag_ingested = 0
        if req.index_rag:
            rag_ingested = code_factory.ingest_into_rag()
            result["rag_chunks_ingested"] = rag_ingested

        return {
            "status": "success",
            "result": result
        }
    except Exception as e:
        logger.error(f"Code generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stream")
async def stream_code_synthesis(count: int = Query(default=20, ge=1, le=200)):
    """
    SSE stream emitting live generated and verified code modules.
    """
    async def event_generator():
        for i in range(count):
            meta, code, success = code_factory.generate_module(i)
            payload = {
                "step": i + 1,
                "total": count,
                "id": meta.get("id"),
                "name": meta.get("name"),
                "title": meta.get("title"),
                "domain": meta.get("domain"),
                "lang": meta.get("lang"),
                "verified": success,
                "code": code
            }
            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(0.01)

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/languages")
async def get_supported_languages() -> Dict[str, Any]:
    """
    Returns list of all 10 supported programming languages and their architectural capabilities.
    """
    return {
        "status": "online",
        "data": code_factory.get_supported_languages()
    }

@router.get("/checkpoint")
async def get_factory_checkpoint() -> Dict[str, Any]:
    """
    Returns latest checkpoint of the 10-million loop execution.
    """
    return {
        "status": "online",
        "stats": code_factory.get_stats()
    }
