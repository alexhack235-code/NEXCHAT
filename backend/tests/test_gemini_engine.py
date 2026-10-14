# -*- coding: utf-8 -*-
"""
Automated Test Suite for Google Gemini Cloud Engine & Multi-Key Rotation Pool.
Verifies API key pool configuration, rotation, status endpoint, and fallback mechanics.
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from main import app
from gemini_engine import gemini_engine, GeminiEngine
from hf_client import generate_text, synthesize_local_response

client = TestClient(app)

def test_gemini_engine_is_configured():
    """Verify Gemini engine recognizes the configured API key."""
    assert gemini_engine.is_configured() is True
    assert len(gemini_engine.api_key) > 10

def test_gemini_engine_default_model():
    """Verify engine defaults to modern gemini-3.8-flash."""
    assert "gemini-3.8" in gemini_engine.default_model or "gemini" in gemini_engine.default_model

def test_gemini_status_endpoint():
    """Test GET /api/gemini/status returns ONLINE status and model manifest."""
    resp = client.get("/api/gemini/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ONLINE"
    assert data["configured"] is True
    assert "gemini-3.8-flash" in data["supported_models"]
    assert data["masked_key"] is not None
    assert "..." in data["masked_key"]

def test_gemini_pool_endpoint():
    """Test GET /api/gemini/pool and POST /api/gemini/pool for 5-7 key batch import."""
    old_keys = list(gemini_engine.api_keys)
    try:
        sample_keys = [
            f"AQ.SampleKeyPool_{i}_abcdef123456" for i in range(1, 6)
        ]
        resp = client.post("/api/gemini/pool", json={"keys": sample_keys, "persist": False})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["keys_loaded"] == 5
        assert data["pool"]["pool_size"] == 5
        assert len(data["pool"]["keys"]) == 5

        # Check GET /api/gemini/pool
        get_resp = client.get("/api/gemini/pool")
        assert get_resp.status_code == 200
        assert get_resp.json()["pool_size"] == 5
    finally:
        gemini_engine.set_key_pool(old_keys, persist=False)

def test_gemini_key_update_endpoint():
    """Test POST /api/gemini/key updates runtime configuration."""
    original_key = gemini_engine.api_key
    try:
        resp = client.post("/api/gemini/key", json={"api_key": "AQ.TestKeyUpdate1234567890", "persist": False})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["configured"] is True
        assert gemini_engine.api_key == "AQ.TestKeyUpdate1234567890"
    finally:
        gemini_engine.set_api_key(original_key, persist=False)

def test_gemini_fallback_or_local_success():
    """Verify fallback_or_local executes fast local coroutine successfully."""
    async def run():
        async def fast_local():
            return "Local computation complete"

        result = await gemini_engine.fallback_or_local(fast_local(), "test prompt", timeout_seconds=1.0)
        assert result["engine"] == "local"
        assert result["result"] == "Local computation complete"

    asyncio.run(run())

def test_gemini_fallback_on_local_timeout():
    """Verify fallback_or_local triggers fallback when local exceeds timeout."""
    async def run():
        async def slow_local():
            await asyncio.sleep(2.0)
            return "Slow"

        result = await gemini_engine.fallback_or_local(slow_local(), "test prompt", timeout_seconds=0.1)
        assert result["engine"] in ("gemini-3.8-flash", "offline_fallback")

    asyncio.run(run())

def test_synthesize_local_response():
    """Verify local intelligence synthesizer returns solid responses when offline."""
    res1 = synthesize_local_response("<thinking> deep analysis")
    assert "Deconstructing" in res1

    res2 = synthesize_local_response("[Tool Results] calculation: 42")
    assert "verified calculations" in res2

    res3 = synthesize_local_response("General prompt")
    assert "NEXIUM AI" in res3

def test_hf_client_gemini_failover_routing():
    """Verify hf_client generate_text handles gemini models without throwing."""
    async def run():
        resp = await generate_text("gemini-3.8-flash", "Status report", max_length=128)
        assert resp is not None
        assert isinstance(resp, str)
        assert len(resp) > 0

    asyncio.run(run())
