import pytest
from fastapi.testclient import TestClient
from main import app
from rust_engine import engine as rust_core

@pytest.fixture
def client():
    return TestClient(app)

def test_cot_graph_decomposition():
    thought = (
        "1. Decompose the problem into subgoals.\n"
        "2. Analyze time and space complexity constraints.\n"
        "3. Derive asymptotic bounds.\n"
        "4. Verify edge cases with unit tests.\n"
        "5. Conclude with final optimal implementation."
    )
    res = rust_core.decompose_cot(thought)
    assert res["total_steps"] == 5
    assert res["coherence"] >= 0.85
    assert res["is_sound"] is True
    stages = [s["stage"] for s in res["steps"]]
    assert "decomposition" in stages
    assert "analysis" in stages
    assert "verification" in stages
    assert "conclusion" in stages

def test_tot_multi_branch_evaluation():
    branches = [
        "Branch A: Because of the loop invariant, we verify the bounds in O(N) time.",
        "Branch B: This contains a contradiction and breaks safety lemma.",
        "Branch C: We derive the optimal path and confirmed all tests pass.",
    ]
    res = rust_core.evaluate_tot_branches(branches)
    assert "best_branch_index" in res
    assert res["best_score"] > 0.60
    assert len(res["evaluated"]) == 3
    # Branch B has contradiction, score should be penalized
    assert res["evaluated"][1]["score"] < res["evaluated"][0]["score"]

def test_symbolic_constraint_verifier():
    valid_expr = "((a + b) * c) == (a * c + b * c)"
    res_valid = rust_core.verify_symbolic_constraints(valid_expr)
    assert res_valid["valid"] is True
    assert res_valid["is_balanced"] is True
    assert res_valid["has_equality"] is True

    invalid_expr = "((a + b) * c"
    res_invalid = rust_core.verify_symbolic_constraints(invalid_expr)
    assert res_invalid["valid"] is False

def test_mcts_cognitive_rollout():
    res = rust_core.mcts_cognitive_rollout(simulations=50)
    assert res["simulations"] == 50
    assert res["status"] == "converged"
    assert 0.0 < res["mean_utility"] <= 1.0
    assert res["optimal_confidence"] >= res["mean_utility"]

def test_smart_chat_deep_thinking_telemetry(client):
    payload = {
        "prompt": "Decompose and analyze how a lock-free queue works in Rust.",
        "persona": "general",
        "enable_thinking": True,
        "enable_tools": False,
        "max_tokens": 128,
    }
    resp = client.post("/api/smart_chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "text" in data
    assert "thinking" in data
    assert "thinking_telemetry" in data
    telemetry = data["thinking_telemetry"]
    assert telemetry is not None
    assert "cot" in telemetry
    assert "symbolic" in telemetry
    assert "mcts" in telemetry
    assert telemetry["rust_accelerated"] is True
