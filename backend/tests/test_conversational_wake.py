"""
Test Suite for NEXIUM Conversational Wake Queries & Autonomous Persona Intelligence.
Validates 'Nexium how are you doing', hotword queries, live system status telemetry,
and conversational reasoning responses.
"""

import pytest
from fastapi.testclient import TestClient

try:
    from backend.main import app
    from backend.routers.reasoning import detect_and_run_tools
    from backend.memory import session_manager
except ImportError:
    from main import app
    from routers.reasoning import detect_and_run_tools
    from memory import session_manager

client = TestClient(app)

def test_detect_and_run_tools_conversational_wake():
    """Verify conversational status queries automatically dispatch device telemetry."""
    wake_prompts = [
        "Nexium how are you doing today?",
        "How are you doing?",
        "System status report",
        "Are you online and ready?",
    ]
    for prompt in wake_prompts:
        tools = detect_and_run_tools(prompt)
        assert len(tools) >= 1
        tool_names = [t["tool"] for t in tools]
        assert "device_task" in tool_names

def test_smart_chat_conversational_wake_query():
    """Verify /api/smart_chat handles 'Nexium how are you doing' with high-tech response."""
    payload = {
        "prompt": "Nexium how are you doing?",
        "persona": "general",
        "enable_thinking": True,
        "enable_tools": True,
        "enable_critic": True,
        "max_tokens": 256
    }
    resp = client.post("/api/smart_chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "text" in data
    assert len(data["text"]) > 10
    assert data["session_id"] is not None
    # Tools should have run system info
    assert len(data["tools_used"]) >= 1
    assert any(t["tool"] == "device_task" for t in data["tools_used"])

def test_general_persona_system_prompt_integrity():
    """Verify general persona contains futuristic autonomous AI guidelines."""
    session = session_manager.get_or_create(None, "general")
    prompt = session.system_prompt
    assert "NEXIUM AI" in prompt
    assert "Rust SIMD" in prompt
    assert "voice" in prompt or "gesture" in prompt
