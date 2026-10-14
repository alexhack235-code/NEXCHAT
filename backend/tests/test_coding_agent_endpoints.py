# -*- coding: utf-8 -*-
"""
Tests for NEX-CODER 3.8 HIGH Autonomous Coding Engine & Endpoints.
Tests AST mapping, Git diff inspection, UE5 validation, recursive self-healing,
and FastAPI coder endpoints.
"""

import os
import pytest
from fastapi.testclient import TestClient

from tools_engine import execute_tool
from coding_agent import coding_agent
from main import app

client = TestClient(app)

def test_tool_ast_map_python():
    res = execute_tool("ast_map", file_path="backend/tools_engine.py")
    assert res["success"] is True
    assert res["loc"] > 100
    assert len(res["functions"]) > 5
    fn_names = [f["name"] for f in res["functions"]]
    assert "tool_compile_and_verify" in fn_names
    assert "tool_ast_map" in fn_names

def test_tool_git_diff():
    res = execute_tool("git_diff")
    assert res["success"] is True
    assert "changed_files" in res
    assert "diff_snippet" in res

def test_tool_ue5_validator_valid():
    valid_ue5 = """
    #pragma once
    #include "CoreMinimal.h"
    #include "GameFramework/Character.h"
    #include "NEXPhantomCharacter.generated.h"

    UCLASS(config=Game)
    class ANEXPhantomCharacter : public ACharacter
    {
        GENERATED_BODY()

    public:
        UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Locomotion")
        float SprintSpeed;
    };
    """
    res = execute_tool("ue5_validator", code=valid_ue5)
    assert res["success"] is True
    assert res["valid"] is True
    assert len(res["diagnostics"]) == 0

def test_tool_ue5_validator_invalid():
    broken_ue5 = """
    UCLASS()
    class BrokenCharacter : public ACharacter
    {
        // Missing GENERATED_BODY() and generated.h
    };
    """
    res = execute_tool("ue5_validator", code=broken_ue5)
    assert res["success"] is True
    assert res["valid"] is False
    assert len(res["diagnostics"]) >= 1

def test_coding_agent_self_heal():
    broken_py = "def calculate_sum(a, b\n    return a + b\n"
    res = coding_agent.self_heal(broken_py, "SyntaxError: expected ':'", language="python")
    assert "healed" in res
    assert "history" in res
    assert len(res["history"]) >= 1

def test_coding_agent_execute_autonomous_cycle():
    valid_code = "def fast_multiplier(x: int, y: int) -> int:\n    return x * y\n"
    res = coding_agent.execute_autonomous_cycle(
        task="create fast multiplier",
        target_file="backend/tools_engine.py",
        code_payload=valid_code,
        language="python",
        run_tests=False
    )
    assert res["success"] is True
    assert len(res["steps"]) >= 2
    step_names = [s["step"] for s in res["steps"]]
    assert "DISCOVERY" in step_names
    assert "VERIFY_SYNTAX" in step_names

def test_endpoint_coder_status():
    resp = client.get("/api/coder/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ONLINE"
    assert data["engine"] == "NEX-CODER 3.8 HIGH"
    assert "compile_and_verify" in data["coding_tools"]
    assert "ast_map" in data["coding_tools"]

def test_endpoint_coder_verify():
    payload = {
        "code": "const add = (a: number, b: number): number => a + b;",
        "language": "typescript"
    }
    resp = client.post("/api/coder/verify", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["syntax_valid"] is True

def test_endpoint_coder_ast_map():
    payload = {"file_path": "backend/tools_engine.py"}
    resp = client.post("/api/coder/ast-map", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["loc"] > 50

def test_endpoint_coder_ue5_validate():
    payload = {
        "code": "#include \"Phantom.generated.h\"\nUCLASS()\nclass ANEXPhantom : public ACharacter {\nGENERATED_BODY()\n};"
    }
    resp = client.post("/api/coder/ue5-validate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is True
