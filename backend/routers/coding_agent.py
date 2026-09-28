# -*- coding: utf-8 -*-
"""
FastAPI Router for NEX-CODER 3.8 HIGH Autonomous Coding Engine.
Endpoints for compile-time verification, workspace symbol lookup, AST mapping,
atomic file patching, test suite execution, and recursive self-healing.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:
    from ..coding_agent import coding_agent
    from ..tools_engine import execute_tool, list_registered_tools
except ImportError:
    from coding_agent import coding_agent
    from tools_engine import execute_tool, list_registered_tools

router = APIRouter()

class VerifyCodeRequest(BaseModel):
    code: str = Field(..., description="Source code to verify")
    language: str = Field(default="python", description="Language: python, typescript, javascript, cpp, rust")

class SymbolSearchRequest(BaseModel):
    query: str = Field(..., description="Symbol name or pattern to search")
    max_results: int = Field(default=25, ge=1, le=100)

class PatchFileRequest(BaseModel):
    file_path: str = Field(..., description="Target file path")
    target_chunk: str = Field(..., description="Existing chunk to replace")
    replacement_chunk: str = Field(..., description="New replacement chunk")

class TestSuiteRequest(BaseModel):
    test_target: Optional[str] = Field(default=None, description="Test folder or file (default: backend/tests)")

class AstMapRequest(BaseModel):
    file_path: str = Field(..., description="Relative or absolute file path to map")

class UE5ValidateRequest(BaseModel):
    code: str = Field(..., description="Unreal Engine 5 C++ header or source code")
    class_name: Optional[str] = Field(default=None)

class AutoCycleRequest(BaseModel):
    task: str = Field(..., description="Software engineering task prompt")
    target_file: Optional[str] = Field(default=None, description="Optional target file path")
    code_payload: Optional[str] = Field(default=None, description="Optional code snippet to verify and repair")
    language: str = Field(default="python")
    run_tests: bool = Field(default=True)

class ProjectMemoryRequest(BaseModel):
    action: str = Field(..., description="get | set | list | clear")
    key: Optional[str] = Field(default=None)
    value: Optional[Any] = Field(default=None)

@router.get("/coder/status")
async def get_coder_status():
    """Returns status of autonomous coding engine, tools, and workspace memory."""
    all_tools = list_registered_tools()
    mem_res = execute_tool("project_memory", action="list")
    diff_res = execute_tool("git_diff", max_chars=500)
    return {
        "status": "ONLINE",
        "engine": "NEX-CODER 3.8 HIGH",
        "registered_tools_count": len(all_tools),
        "coding_tools": [
            "compile_and_verify", "symbol_search", "patch_file",
            "run_tests", "project_memory", "ast_map", "git_diff", "ue5_validator"
        ],
        "workspace_memory_keys": list(mem_res.get("memory", {}).keys()),
        "git_status": {
            "changed_files_count": diff_res.get("changed_files_count", 0),
            "changed_files": diff_res.get("changed_files", [])
        }
    }

@router.post("/coder/verify")
async def verify_code(req: VerifyCodeRequest):
    """Compile and verify code syntax, delimiters, and AST integrity."""
    res = coding_agent.verify_code(req.code, language=req.language)
    return res

@router.post("/coder/symbol-search")
async def symbol_search(req: SymbolSearchRequest):
    """Search workspace symbol table for classes, functions, structs, and interfaces."""
    res = execute_tool("symbol_search", query=req.query, max_results=req.max_results)
    return res

@router.post("/coder/patch")
async def patch_file(req: PatchFileRequest):
    """Apply an atomic search-and-replace chunk patch without rewriting whole files."""
    res = execute_tool("patch_file", file_path=req.file_path, target_chunk=req.target_chunk, replacement_chunk=req.replacement_chunk)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Patch failed"))
    return res

@router.post("/coder/test")
async def run_tests(req: TestSuiteRequest):
    """Execute project test suites and return parsed exit summaries."""
    res = execute_tool("run_tests", test_target=req.test_target)
    return res

@router.post("/coder/ast-map")
async def get_ast_map(req: AstMapRequest):
    """Extract structural AST outline (classes, methods, docstrings, imports) of a file."""
    res = execute_tool("ast_map", file_path=req.file_path)
    if not res.get("success"):
        raise HTTPException(status_code=404, detail=res.get("error", "AST map failed"))
    return res

@router.get("/coder/git-diff")
async def get_git_diff(cached: bool = False):
    """Get current git diff and changed files in the workspace."""
    return execute_tool("git_diff", cached=cached)

@router.post("/coder/ue5-validate")
async def validate_ue5(req: UE5ValidateRequest):
    """Validate Unreal Engine 5 C++ character, rig, or animation architecture rules."""
    return execute_tool("ue5_validator", code=req.code, class_name=req.class_name)

@router.post("/coder/auto-cycle")
async def run_autonomous_cycle(req: AutoCycleRequest):
    """Execute end-to-end autonomous coding cycle (discovery -> verify -> self-heal -> test -> persist)."""
    return coding_agent.execute_autonomous_cycle(
        task=req.task,
        target_file=req.target_file,
        code_payload=req.code_payload,
        language=req.language,
        run_tests=req.run_tests
    )

@router.post("/coder/memory")
async def manage_project_memory(req: ProjectMemoryRequest):
    """Manage long-term project knowledge and memory key-values across sessions."""
    return execute_tool("project_memory", action=req.action, key=req.key, value=req.value)
