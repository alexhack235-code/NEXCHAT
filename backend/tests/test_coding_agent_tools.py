# -*- coding: utf-8 -*-
"""
Tests for NEXIUM High-Productivity Coding Agent Tools.
Tests compile verification, symbol search, atomic patching, and project memory.
"""

import os
import pytest
from tools_engine import execute_tool

def test_tool_compile_and_verify_python_valid():
    valid_code = "def add(a: int, b: int) -> int:\n    return a + b\n"
    res = execute_tool("compile_and_verify", code=valid_code, language="python")
    assert res["success"] is True
    assert res["syntax_valid"] is True
    assert res["loc"] == 2

def test_tool_compile_and_verify_python_invalid():
    invalid_code = "def broken(:\n    pass\n"
    res = execute_tool("compile_and_verify", code=invalid_code, language="python")
    assert res["success"] is False
    assert res["syntax_valid"] is False
    assert "error" in res
    assert res["line"] == 1

def test_tool_compile_and_verify_brackets_mismatched():
    mismatched = "function test() { return [1, 2, (3, 4]; }"
    res = execute_tool("compile_and_verify", code=mismatched, language="typescript")
    assert res["success"] is False
    assert "Mismatched bracket" in res["error"]

def test_tool_symbol_search():
    res = execute_tool("symbol_search", query="execute_tool", max_results=5)
    assert res["success"] is True
    assert res["total_found"] >= 1
    symbols = [s["symbol"] for s in res["symbols"]]
    assert any("execute_tool" in s for s in symbols)

def test_tool_patch_file(tmp_path):
    test_file = tmp_path / "sample.py"
    test_file.write_text("def hello():\n    return 'old'\n", encoding="utf-8")

    res = execute_tool(
        "patch_file",
        file_path=str(test_file),
        target_chunk="return 'old'",
        replacement_chunk="return 'new'"
    )
    assert res["success"] is True
    assert test_file.read_text(encoding="utf-8") == "def hello():\n    return 'new'\n"

def test_tool_project_memory():
    # Set key
    set_res = execute_tool("project_memory", action="set", key="architecture_tier", value="AAA_UNREAL_5_5")
    assert set_res["success"] is True

    # Get key
    get_res = execute_tool("project_memory", action="get", key="architecture_tier")
    assert get_res["success"] is True
    assert get_res["value"] == "AAA_UNREAL_5_5"

    # List all
    list_res = execute_tool("project_memory", action="list")
    assert list_res["success"] is True
    assert "architecture_tier" in list_res["memory"]
