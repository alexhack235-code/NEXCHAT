# -*- coding: utf-8 -*-
import pytest
from fastapi.testclient import TestClient
from main import app
from emotion_core.engine import emotion_engine

@pytest.fixture
def client():
    return TestClient(app)

def test_emotion_engine_analysis_positive():
    """Verify emotion scoring on joyful/excited text."""
    res = emotion_engine.record_and_direct(user_text="I am absolutely thrilled with how this works! Incredible work!", session_id="test_sess_1")
    assert "feeling" in res
    feeling = res["feeling"]
    assert feeling["valence"] > 0.0
    assert feeling["arousal"] > 0.0
    assert "directive" in res
    assert len(res["directive"]) > 0

def test_emotion_engine_analysis_frustrated():
    """Verify emotion scoring and empathy directive on frustrated text."""
    res = emotion_engine.record_and_direct(user_text="I am feeling overwhelmed and frustrated, nothing is working and I am stuck.", session_id="test_sess_2")
    feeling = res["feeling"]
    assert feeling["valence"] < 0.0
    assert "reassuring" in res["directive"].lower() or "support" in res["directive"].lower() or "patience" in res["directive"].lower()

def test_emotion_engine_history():
    """Verify journal retrieval and persistence."""
    history = emotion_engine.get_history(limit=5)
    assert isinstance(history, list)
    assert len(history) >= 1
    assert "timestamp" in history[-1]
    assert "valence" in history[-1]

def test_api_emotion_record(client):
    """Verify /api/emotion/record endpoint."""
    resp = client.post("/api/emotion/record", json={
        "user_text": "I am curious to see how the supercomputer performs.",
        "session_id": "test_api_sess"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "recorded"
    assert "feeling" in data
    assert "directive" in data
    assert "summary" in data

def test_api_emotion_history(client):
    """Verify /api/emotion/history endpoint."""
    resp = client.get("/api/emotion/history?limit=10")
    assert resp.status_code == 200
    data = resp.json()
    assert "history" in data
    assert "summary" in data
    assert isinstance(data["history"], list)

def test_api_emotion_status(client):
    """Verify /api/emotion/status endpoint."""
    resp = client.get("/api/emotion/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "active"
    assert "current_emotional_climate" in data
    assert "total_journal_entries" in data

def test_api_emotion_current_and_journal(client):
    """Verify /api/emotion/current and /api/emotion/journal endpoints."""
    resp_curr = client.get("/api/emotion/current")
    assert resp_curr.status_code == 200
    assert "current_feeling" in resp_curr.json()

    resp_jrn = client.get("/api/emotion/journal?limit=5")
    assert resp_jrn.status_code == 200
    assert isinstance(resp_jrn.json(), list)
