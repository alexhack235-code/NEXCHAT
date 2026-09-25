# -*- coding: utf-8 -*-
"""
FastAPI Router for NEXIUM's Autonomous Thinking Engine.
Provides endpoints for self-directed goals, inner monologue,
metacognition, and autonomous thinking loops.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:
    from ..autonomous_mind import autonomous_mind
    from ..tool_synthesizer import tool_synthesizer
    from ..consolidation_engine import cognitive_consolidator
    from ..tools_engine import list_registered_tools, execute_tool
except ImportError:
    from autonomous_mind import autonomous_mind
    from tool_synthesizer import tool_synthesizer
    from consolidation_engine import cognitive_consolidator
    from tools_engine import list_registered_tools, execute_tool

router = APIRouter()

class GoalCreateRequest(BaseModel):
    title: str = Field(..., description="Goal title or objective")
    category: str = Field(default="self_improvement", description="Goal category (e.g. learning, systems, math)")
    priority: str = Field(default="medium", description="Priority level: low, medium, high, critical")

class GoalProgressRequest(BaseModel):
    progress_pct: int = Field(..., ge=0, le=100, description="Progress percentage 0-100")
    reflection: str = Field(default="", description="Reflection notes on progress")

class ReflectRequest(BaseModel):
    query: str = Field(..., description="User query or input")
    response: str = Field(..., description="AI response text")
    tools_used: List[Dict[str, Any]] = Field(default_factory=list, description="Tools used during execution")

@router.get("/mind/state")
async def get_mind_state():
    """Retrieve full autonomous mind state (metacognition, goals, thoughts, KB size)."""
    try:
        return autonomous_mind.get_mind_state()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mind/think")
async def execute_thinking_cycle():
    """Trigger an autonomous thinking cycle explicitly."""
    try:
        cycle_result = autonomous_mind.think()
        return cycle_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mind/thoughts")
async def get_thoughts(count: int = 10):
    """Retrieve the recent inner monologue / autonomous thought stream."""
    try:
        return {
            "count": count,
            "thoughts": autonomous_mind.monologue.get_recent_thoughts(count=count),
            "stream": autonomous_mind.monologue.get_thought_stream(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mind/goals")
async def list_goals(status: Optional[str] = None):
    """List self-directed goals, optionally filtered by status (active/completed)."""
    try:
        if status == "active":
            return {"goals": autonomous_mind.goals.get_active_goals(), "count": len(autonomous_mind.goals.get_active_goals())}
        all_goals = autonomous_mind.goals.get_all_goals()
        return {"goals": all_goals, "count": len(all_goals)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mind/goals")
async def create_goal(req: GoalCreateRequest):
    """Set a new self-directed autonomous goal."""
    try:
        goal = autonomous_mind.goals.set_goal(
            title=req.title,
            category=req.category,
            priority=req.priority
        )
        return {"status": "created", "goal": goal}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mind/goals/{goal_id}/progress")
async def update_goal_progress(goal_id: int, req: GoalProgressRequest):
    """Update progress on an active self-directed goal."""
    try:
        updated = autonomous_mind.goals.update_progress(goal_id, req.progress_pct, req.reflection)
        if not updated:
            raise HTTPException(status_code=404, detail="Goal not found")
        return {"status": "updated", "goal": updated}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mind/metacognition")
async def get_metacognition():
    """Retrieve self-awareness report, confidence metrics, and detected blind spots."""
    try:
        return autonomous_mind.metacognition.get_self_awareness_report()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mind/reflect")
async def post_interaction_reflection(req: ReflectRequest):
    """Manually invoke post-interaction reflection on query/response."""
    try:
        return autonomous_mind.post_interaction_reflect(req.query, req.response, req.tools_used)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Dynamic Tool Synthesis & Execution Endpoints
# ============================================================================
class ToolSynthesizeRequest(BaseModel):
    name: str = Field(..., description="Unique tool identifier")
    code: str = Field(..., description="Python code implementation")
    entry_func: str = Field(..., description="Function name to execute")
    description: str = Field(..., description="Human-readable description")
    parameters: Optional[Dict[str, str]] = Field(default=None)
    test_kwargs: Optional[Dict[str, Any]] = Field(default=None)

class ToolExecuteRequest(BaseModel):
    tool: str = Field(..., description="Tool name")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Keyword arguments")

@router.get("/mind/tools")
async def get_all_tools():
    """List all registered and dynamically synthesized tools."""
    return {"tools": list_registered_tools()}

@router.post("/mind/tools/synthesize")
async def synthesize_tool(req: ToolSynthesizeRequest):
    """Synthesize, sandbox verify, and register a new tool live."""
    res = tool_synthesizer.synthesize_and_register(
        name=req.name,
        code_str=req.code,
        entry_func_name=req.entry_func,
        description=req.description,
        parameters=req.parameters,
        test_kwargs=req.test_kwargs,
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Tool synthesis failed"))
    return res

@router.post("/mind/tools/execute")
async def execute_dynamic_tool(req: ToolExecuteRequest):
    """Execute any tool (built-in or synthesized) with keyword arguments."""
    res = execute_tool(req.tool, **req.arguments)
    return res

# ============================================================================
# Autonomous Dream & Cognitive Consolidation Endpoints
# ============================================================================
@router.post("/mind/dream")
async def trigger_dream_cycle():
    """Trigger an autonomous cognitive consolidation dream cycle."""
    try:
        res = await cognitive_consolidator.dream_cycle()
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mind/epiphanies")
async def get_epiphanies(limit: int = 10):
    """Retrieve synthesized mental models and emergent epiphanies."""
    try:
        return {
            "summary": cognitive_consolidator.get_consolidation_summary(),
            "epiphanies": cognitive_consolidator.get_epiphanies(limit=limit),
            "mental_models": cognitive_consolidator.get_mental_models(limit=limit),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

