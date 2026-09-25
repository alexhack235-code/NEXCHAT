import pytest
from fastapi.testclient import TestClient
from main import app
from autonomous_mind import (
    autonomous_mind,
    MetacognitionEngine,
    GoalDirector,
    InnerMonologue,
    AutonomousThinkingEngine,
)

@pytest.fixture
def client():
    return TestClient(app)

def test_metacognition_engine():
    metacog = MetacognitionEngine()
    assessment = metacog.assess_confidence(
        query="Write a rust SIMD vector math kernel",
        response="Here is the rust code:\n```rust\nfn add_simd() {}\n```",
        tools_used=[{"tool": "rust_simd"}],
    )
    assert assessment["confidence"] >= 0.7
    assert assessment["tool_grounded"] is True
    assert assessment["has_structured_output"] is True
    assert assessment["confidence_label"] in ("high", "very_high")

    # Low confidence query detection
    low_assessment = metacog.assess_confidence(
        query="What is the obscure history of XYZ?",
        response="I'm not sure, possibly it is unclear.",
        tools_used=[],
    )
    assert low_assessment["confidence"] < 0.5
    assert len(metacog.blind_spots) > 0

    report = metacog.get_self_awareness_report()
    assert report["total_assessments"] >= 2
    assert "multi-language code synthesis" in report["known_strengths"]

def test_goal_director():
    director = GoalDirector(goals_file=":memory:")
    goal = director.set_goal("Master Distributed Consensus (Raft/Paxos)", "distributed_systems", "high")
    assert goal["id"] > 0
    assert goal["status"] == "active"
    assert goal["progress_pct"] == 0

    # Progress update
    updated = director.update_progress(goal["id"], 50, "Implemented leader election state machine.")
    assert updated is not None
    assert updated["progress_pct"] == 50
    assert len(updated["reflections"]) == 1

    # Completion
    completed = director.update_progress(goal["id"], 100, "Log replication tests passing.")
    assert completed["status"] == "completed"
    assert completed["completed_at"] is not None

    # Auto-generation
    auto_goals = director.auto_generate_goals(["Quantum Annealing Optimization"])
    assert len(auto_goals) >= 1

def test_inner_monologue():
    metacog = MetacognitionEngine()
    director = GoalDirector(goals_file=":memory:")
    monologue = InnerMonologue(thoughts_file=":memory:")

    thought = monologue.generate_thought(metacog, director, kb_size=500)
    assert thought["id"] > 0
    assert len(thought["text"]) > 10
    assert "timestamp" in thought

    stream = monologue.get_thought_stream()
    assert stream["total_thoughts"] > 0
    assert len(stream["recent"]) > 0

def test_autonomous_thinking_cycle():
    mind = AutonomousThinkingEngine()
    cycle_res = mind.think()
    assert cycle_res["cycle"] == 1
    assert "thought" in cycle_res
    assert cycle_res["latency_ms"] >= 0
    assert "self_awareness" in cycle_res

    reflection = mind.post_interaction_reflect(
        query="Explain quantum computing",
        response="I think possibly unclear.",
        tools_used=[],
    )
    assert "metacognition" in reflection
    assert reflection["triggered_thinking"] is True

def test_api_mind_endpoints(client):
    # 1. Mind state
    state_res = client.get("/api/mind/state")
    assert state_res.status_code == 200
    state_data = state_res.json()
    assert state_data["creator"] == "NEXO-TECH"
    assert "self_awareness" in state_data

    # 2. Trigger thinking cycle
    think_res = client.post("/api/mind/think")
    assert think_res.status_code == 200
    think_data = think_res.json()
    assert think_data["cycle"] >= 1

    # 3. Thoughts stream
    thoughts_res = client.get("/api/mind/thoughts?count=5")
    assert thoughts_res.status_code == 200
    assert "thoughts" in thoughts_res.json()

    # 4. Create goal
    goal_res = client.post("/api/mind/goals", json={
        "title": "Optimize SIMD vector dot product",
        "category": "performance",
        "priority": "critical",
    })
    assert goal_res.status_code == 200
    goal_id = goal_res.json()["goal"]["id"]

    # 5. List goals
    list_goals_res = client.get("/api/mind/goals")
    assert list_goals_res.status_code == 200
    assert list_goals_res.json()["count"] > 0

    # 6. Update goal progress
    prog_res = client.post(f"/api/mind/goals/{goal_id}/progress", json={
        "progress_pct": 75,
        "reflection": "AVX-512 intrinsic benchmarks verified.",
    })
    assert prog_res.status_code == 200
    assert prog_res.json()["goal"]["progress_pct"] == 75

    # 7. Metacognition
    metacog_res = client.get("/api/mind/metacognition")
    assert metacog_res.status_code == 200
    assert "known_strengths" in metacog_res.json()

    # 8. Post-interaction reflection
    reflect_res = client.post("/api/mind/reflect", json={
        "query": "Solve 2x + 4 = 10",
        "response": "x = 3",
        "tools_used": [{"tool": "solve_equation", "result": {"solution": "3"}}],
    })
    assert reflect_res.status_code == 200
    assert "metacognition" in reflect_res.json()

def test_dynamic_tool_synthesis(client):
    # 1. Built-in dynamic tools
    hash_res = client.post("/api/mind/tools/execute", json={
        "tool": "crypto_hash",
        "arguments": {"data": "NEXIUM_OMNI_CORE", "algorithm": "sha256"}
    })
    assert hash_res.status_code == 200
    assert hash_res.json()["success"] is True
    assert len(hash_res.json()["hash"]) == 64

    # 2. Text Analyzer tool
    text_res = client.post("/api/mind/tools/execute", json={
        "tool": "text_analyzer",
        "arguments": {"text": "Autonomous high-performance cognitive neural systems."}
    })
    assert text_res.status_code == 200
    assert text_res.json()["shannon_entropy"] > 0

    # 3. Unit converter tool
    unit_res = client.post("/api/mind/tools/execute", json={
        "tool": "unit_converter",
        "arguments": {"value": 100, "from_unit": "c", "to_unit": "f"}
    })
    assert unit_res.status_code == 200
    assert unit_res.json()["value"] == 212.0

    # 4. Live Synthesis of a new tool
    custom_code = (
        "def collatz_steps(n: int):\n"
        "    steps = 0\n"
        "    val = n\n"
        "    while val > 1:\n"
        "        val = val // 2 if val % 2 == 0 else 3 * val + 1\n"
        "        steps += 1\n"
        "    return {'success': True, 'number': n, 'steps': steps}\n"
    )
    synth_res = client.post("/api/mind/tools/synthesize", json={
        "name": "collatz_conjecture",
        "code": custom_code,
        "entry_func": "collatz_steps",
        "description": "Calculate Collatz Conjecture steps to reach 1.",
        "parameters": {"n": "int"},
        "test_kwargs": {"n": 6}
    })
    assert synth_res.status_code == 200
    assert synth_res.json()["registered"] is True

    # 5. Execute the synthesized tool
    exec_res = client.post("/api/mind/tools/execute", json={
        "tool": "collatz_conjecture",
        "arguments": {"n": 27}
    })
    assert exec_res.status_code == 200
    assert exec_res.json()["steps"] == 111

def test_cognitive_consolidation_and_dream(client):
    # Trigger dream consolidation cycle
    dream_res = client.post("/api/mind/dream")
    assert dream_res.status_code == 200
    dream_data = dream_res.json()
    assert dream_data["cycle"] >= 1
    assert "model" in dream_data
    assert "epiphany" in dream_data

    # Retrieve epiphanies
    epi_res = client.get("/api/mind/epiphanies?limit=5")
    assert epi_res.status_code == 200
    epi_data = epi_res.json()
    assert len(epi_data["epiphanies"]) > 0
    assert epi_data["summary"]["total_cycles"] >= 1

