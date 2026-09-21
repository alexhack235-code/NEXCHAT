# -*- coding: utf-8 -*-
import pytest
from fastapi.testclient import TestClient
from main import app
from micro_core.engine import micro_engine

@pytest.fixture
def client():
    return TestClient(app)

def test_micro_engine_deliberation():
    """Verify micro_engine direct python execution."""
    res = micro_engine.deliberate("Validate non-blocking channel backpressure")
    assert res["status"] in ("converged", "crystallized")
    assert res["total_micro_steps"] >= 5
    assert res["convergence_rate"] > 0.90
    assert len(res["micro_steps"]) >= 5
    first_step = res["micro_steps"][0]
    assert "id" in first_step
    assert "type" in first_step
    assert "status" in first_step

def test_micro_engine_stats():
    """Verify micro_engine telemetry stats accumulation."""
    stats = micro_engine.get_stats()
    assert "total_deliberations" in stats
    assert "avg_latency_us" in stats
    assert "cache_efficiency" in stats
    assert stats["total_deliberations"] >= 1

def test_api_micro_deliberate(client):
    """Verify /api/micro/deliberate endpoint."""
    resp = client.post("/api/micro/deliberate", json={
        "prompt": "Evaluate ring buffer pointer wrap-around",
        "context": "systems_programming"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("converged", "crystallized")
    assert data["total_micro_steps"] >= 5
    assert len(data["micro_steps"]) >= 5

def test_api_micro_stats(client):
    """Verify /api/micro/stats endpoint."""
    resp = client.get("/api/micro/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_deliberations" in data
    assert "engine_version" in data
