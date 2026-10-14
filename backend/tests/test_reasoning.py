import pytest
from fastapi.testclient import TestClient
from main import app
from memory import session_manager
from tools_engine import safe_eval_math, execute_tool

@pytest.fixture
def client():
    return TestClient(app)

def test_safe_eval_math():
    assert safe_eval_math("2 + 2") == 4.0
    assert safe_eval_math("15 * 3 - 5") == 40.0
    assert safe_eval_math("sqrt(144)") == 12.0
    assert safe_eval_math("2 ^ 8") == 256.0
    assert safe_eval_math("(10 + 2) / 3") == 4.0

    with pytest.raises(Exception):
        safe_eval_math("__import__('os').system('dir')")

def test_tools_engine():
    res_calc = execute_tool("calculate", expression="sqrt(16) * 5")
    assert res_calc["success"] is True
    assert res_calc["result"] == 20.0

    res_time = execute_tool("get_time")
    assert res_time["success"] is True
    assert "datetime" in res_time

    res_dist = execute_tool("string_distance", s1="nexium", s2="nexium_core")
    assert res_dist["success"] is True
    assert res_dist["jaro_winkler_similarity"] > 0.8

def test_session_memory_lifecycle():
    sess = session_manager.get_or_create(persona="architect")
    session_id = sess.session_id
    assert sess.persona == "architect"
    assert len(sess.messages) == 1  # system prompt

    sess.add_message("user", "Design a cache system in Rust")
    sess.add_message("assistant", "We can use an LRU cache with RwLock")
    assert len(sess.messages) == 3

    ctx = sess.get_context_window(max_chars=5000)
    assert len(ctx) == 3
    assert ctx[0]["role"] == "system"
    assert "Architect" in ctx[0]["content"]

def test_smart_chat_endpoint(client):
    payload = {
        "prompt": "What are the advantages of zero-cost abstractions in systems programming?",
        "persona": "architect",
        "enable_thinking": True,
        "enable_tools": False,
        "max_tokens": 64,
    }
    res = client.post("/api/smart_chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "text" in data
    assert "session_id" in data
    assert data["persona"] == "architect"
    assert data["rust_accelerated"] is True

def test_smart_chat_tool_trigger(client):
    payload = {
        "prompt": "Please calculate sqrt(625) + 50",
        "enable_tools": True,
        "enable_thinking": False,
        "max_tokens": 32,
    }
    res = client.post("/api/smart_chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["tools_used"]) > 0
    tool_entry = data["tools_used"][0]
    assert tool_entry["tool"] == "calculate"
    assert tool_entry["result"]["result"] == 75.0

def test_session_persistence_api(client):
    # 1. First turn
    turn1 = client.post("/api/smart_chat", json={"prompt": "My favorite programming language is Rust."})
    assert turn1.status_code == 200
    session_id = turn1.json()["session_id"]

    # 2. Check session retrieval
    sess_res = client.get(f"/api/sessions/{session_id}")
    assert sess_res.status_code == 200
    history = sess_res.json()["messages"]
    assert any("Rust" in m["content"] for m in history)

    # 3. Second turn in same session
    turn2 = client.post("/api/smart_chat", json={"session_id": session_id, "prompt": "What language did I just say is my favorite?"})
    assert turn2.status_code == 200
    assert turn2.json()["session_id"] == session_id
