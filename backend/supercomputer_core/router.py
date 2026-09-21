# -*- coding: utf-8 -*-
"""
FastAPI Router for NEXIUM Supercomputing Core.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any

try:
    from .engine import supercomputer_engine
except ImportError:
    from supercomputer_core.engine import supercomputer_engine

router = APIRouter(prefix="/supercomputer", tags=["supercomputer_core"])

class BenchmarkRequest(BaseModel):
    matrix_dim: int = Field(default=256, ge=64, le=1024, description="Matrix dimension N for N x N GEMM stress test")
    iterations: int = Field(default=3, ge=1, le=20, description="Repetitions of matrix compute loops")

@router.get("/status")
async def get_status() -> Dict[str, Any]:
    """Returns live hardware performance metrics, CPU cores, and SIMD pipeline status."""
    return supercomputer_engine.get_cluster_status()

@router.post("/benchmark")
async def run_benchmark(req: BenchmarkRequest) -> Dict[str, Any]:
    """Executes high-throughput Rust SIMD tensor multiplication and returns live GFLOPS."""
    res = supercomputer_engine.run_gemm_benchmark(matrix_dim=req.matrix_dim, iterations=req.iterations)
    return {
        "status": "success",
        "benchmark": res,
    }
