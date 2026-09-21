# -*- coding: utf-8 -*-
import pytest
from fastapi.testclient import TestClient
from main import app
from rust_engine import engine as rust_core

@pytest.fixture
def client():
    return TestClient(app)

def test_supercomputer_benchmark_kernel():
    """Verify Rust Supercomputer GEMM tensor compute kernel."""
    res = rust_core.run_supercomputer_benchmark(matrix_dim=128, iterations=2)
    assert res["matrix_dim"] == 128
    assert res["iterations"] == 2
    assert res["gflops"] > 0.0
    assert res["status"] == "optimal"
    assert "simd_pipeline" in res
    assert "memory_bandwidth_gbps" in res
    assert res["total_flops"] == 2 * (128 ** 3) * 2

def test_micro_thinking_engine():
    """Verify sub-millisecond micro-thinking granular proposition generation."""
    prompt = "Design a lock-free ring buffer in Rust with atomic CAS"
    res = rust_core.micro_think(prompt)
    assert res["total_micro_steps"] >= 5
    assert res["status"] == "crystallized"
    assert res["convergence_rate"] > 0.95
    assert res["micro_latency_us"] > 0
    step_types = [s["type"] for s in res["micro_steps"]]
    assert "invariant_assertion" in step_types
    assert "boundary_check" in step_types
    assert "semantic_drift" in step_types
    assert "micro_convergence" in step_types

def test_supercomputer_api_status(client):
    """Verify /api/supercomputer/status endpoint."""
    resp = client.get("/api/supercomputer/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert "cluster_name" in data
    assert data["worker_threads"] >= 1
    assert "system_memory_total_gb" in data
    assert "peak_theoretical_gflops" in data

def test_supercomputer_api_benchmark(client):
    """Verify /api/supercomputer/benchmark endpoint."""
    payload = {"matrix_dim": 128, "iterations": 2}
    resp = client.post("/api/supercomputer/benchmark", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    bench = data["benchmark"]
    assert bench["gflops"] > 0.0
    assert bench["matrix_dim"] == 128
    assert bench["status"] == "optimal"

def test_smart_chat_with_micro_thinking(client):
    """Verify /api/smart_chat includes micro_thinking timeline and telemetry."""
    payload = {
        "prompt": "Explain zero-copy deserialization in Rust systems.",
        "persona": "architect",
        "enable_thinking": True,
        "enable_tools": False,
        "max_tokens": 64,
    }
    resp = client.post("/api/smart_chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "micro_thinking" in data
    ut = data["micro_thinking"]
    assert ut is not None
    assert ut["total_micro_steps"] >= 5
    assert len(ut["micro_steps"]) >= 5
