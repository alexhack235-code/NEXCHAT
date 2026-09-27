import pytest
import ast
from fastapi.testclient import TestClient
from main import app
from heavy_code_engine import heavy_code_engine
from code_doctor import code_doctor
from tools_engine import execute_tool
from routers.reasoning import detect_and_run_tools
from heavy_code_engine import heavy_code_engine

@pytest.fixture
def client():
    return TestClient(app)

def test_heavy_code_synthesis():
    blueprints = heavy_code_engine.get_all_blueprints()
    assert len(blueprints) >= 6

    # Test synthesizing Raft
    raft_res = heavy_code_engine.synthesize_heavy_system("raft_consensus_engine")
    assert raft_res["success"] is True
    assert "class RaftConsensusNode" in raft_res["code"]
    assert raft_res["loc"] > 80

    # Test synthesizing Slab Allocator
    slab_res = heavy_code_engine.synthesize_heavy_system("lockfree_slab_arena")
    assert slab_res["success"] is True
    assert "LockFreeSlabArena" in slab_res["code"]

    # Test synthesizing HNSW Indexer
    hnsw_res = heavy_code_engine.synthesize_heavy_system("simd_hnsw_vector_indexer")
    assert hnsw_res["success"] is True
    assert "HnswGraph" in hnsw_res["code"]

def test_code_doctor_diagnostics():
    # 1. Bare except diagnostic
    buggy_py = "def run():\n    try:\n        pass\n    except:\n        pass\n"
    diag = code_doctor.diagnose_code(buggy_py, language="python")
    assert diag["healthy"] is False
    assert any(i["type"] == "silent_error_suppression" for i in diag["issues"])

    # 2. Division by zero diagnostic
    div_zero = "x = 42 / 0\n"
    div_diag = code_doctor.diagnose_code(div_zero, language="python")
    assert any(i["type"] == "boundary_exception" for i in div_diag["issues"])

    # 3. Rust unwrap diagnostic
    rust_code = "let val = opt.unwrap();"
    rust_diag = code_doctor.diagnose_code(rust_code, language="rust")
    assert any(i["type"] == "rust_borrow_violation" for i in rust_diag["issues"])

def test_code_doctor_repair():
    # Broken python snippet with bare except, missing colons, and unclosed file
    broken_py = (
        "def load_file(path)\n"
        "    f = open(path)\n"
        "    content = f.read()\n"
        "    try:\n"
        "        val = 10 / 0\n"
        "    except:\n"
        "        val = 0\n"
        "    return content\n"
    )

    repair_res = code_doctor.repair_code(broken_py, language="python")
    assert repair_res["success"] is True
    assert len(repair_res["patches_applied"]) >= 3
    assert repair_res["verification_passed"] is True

    # Confirm it parses cleanly in Python AST
    parsed = ast.parse(repair_res["repaired_code"])
    assert parsed is not None

def test_api_code_doctor_endpoints(client):
    # 1. Diagnose endpoint
    diag_res = client.post("/api/code/doctor/diagnose", json={
        "code": "def test():\n    try:\n        run()\n    except:\n        pass",
        "language": "python",
    })
    assert diag_res.status_code == 200
    assert diag_res.json()["total_issues"] > 0

    # 2. Repair endpoint
    repair_res = client.post("/api/code/doctor/repair", json={
        "code": "def compute(x)\n    try:\n        return x / 0\n    except:\n        return 0",
        "language": "python",
    })
    assert repair_res.status_code == 200
    assert repair_res.json()["verification_passed"] is True

    # 3. List heavy blueprints
    bps_res = client.get("/api/code/heavy/blueprints")
    assert bps_res.status_code == 200
    assert bps_res.json()["count"] >= 6

    # 4. Synthesize heavy architecture
    synth_res = client.post("/api/code/heavy/synthesize", json={
        "blueprint_id": "raft_consensus_engine",
    })
    assert synth_res.status_code == 200
    assert "RaftConsensusNode" in synth_res.json()["code"]

def test_tools_engine_integration():
    # 1. code_doctor tool
    tool_res = execute_tool("code_doctor", code="def calc():\n    try:\n        pass\n    except:\n        pass", action="repair")
    assert tool_res["success"] is True
    assert len(tool_res["patches_applied"]) > 0

    # 2. heavy_code tool
    heavy_res = execute_tool("heavy_code", blueprint_id="lockfree_slab_arena")
    assert heavy_res["success"] is True
    assert "LockFreeSlabArena" in heavy_res["code"]


def test_detect_and_run_tools_heavy_code_escalation():
    prompt = "Design a production-grade lock-free slab allocator with CAS-based free lists for a Rust service."
    tools = detect_and_run_tools(prompt)
    assert any(t["tool"] == "heavy_code" and t["result"]["success"] for t in tools)


def test_select_best_blueprint_for_prompt():
    blueprint_id = heavy_code_engine.select_blueprint_for_prompt(
        "Build a Raft consensus cluster for distributed writes with leader election and quorum"
    )
    assert blueprint_id == "raft_consensus_engine"


def test_generate_heavy_project_scaffold():
    result = heavy_code_engine.deep_engineer_task(
        "Create a full repo for a lock-free slab allocator in Rust with tests and a README",
        project_name="rust_slab_repo",
    )
    assert result["success"] is True
    assert result["blueprint_id"] == "lockfree_slab_arena"
    assert result["scaffold"]["files"][0]["path"].endswith("README.md")
