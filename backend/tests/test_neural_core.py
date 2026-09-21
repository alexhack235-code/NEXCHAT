# -*- coding: utf-8 -*-
import pytest
from fastapi.testclient import TestClient
from main import app
from neural_core.engine import neural_engine

@pytest.fixture
def client():
    return TestClient(app)

def test_neural_engine_firing():
    """Verify neural mesh forward simulation, SwiGLU / GeLU activations, and spike potentials."""
    res = neural_engine.fire_forward("NEXIUM hyper-edge cognitive synthesis", layer_stimulus=1.0)
    assert res["total_neurons"] == 4096
    assert len(res["layers"]) == 4
    assert res["active_firing_neurons"] > 0
    assert 0.0 <= res["firing_rate_pct"] <= 100.0
    for l in res["layers"]:
        assert "layer_idx" in l
        assert "active_neurons" in l
        assert "layer_firing_rate" in l

def test_neural_engine_status():
    """Verify neural network architecture telemetry."""
    status = neural_engine.get_status()
    assert status["total_neurons"] == 4096
    assert status["num_layers"] == 4
    assert "SwiGLU" in status["activation_functions"]
    assert status["status"] == "online"

def test_api_neural_fire(client):
    """Verify /api/neural/fire endpoint."""
    resp = client.post("/api/neural/fire", json={
        "stimulus_text": "Quantum tensor contraction via SIMD",
        "stimulus_intensity": 1.2
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "fired"
    firing = data["firing"]
    assert firing["total_neurons"] == 4096
    assert firing["active_firing_neurons"] > 0
    assert len(firing["layers"]) == 4

def test_api_neural_status(client):
    """Verify /api/neural/status endpoint."""
    resp = client.get("/api/neural/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert data["network_topology"]["total_neurons"] == 4096
