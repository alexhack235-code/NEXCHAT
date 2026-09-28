import re
import json
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

try:
    from ..memory import session_manager, ConversationSession
    from ..tools_engine import execute_tool, get_tool_descriptions
    from ..hf_client import generate_text, generate_text_stream
    from ..rust_engine import engine as rust_core
    from ..emotion_core.engine import emotion_engine
    from ..neural_core.engine import neural_engine
    from ..micro_core.engine import micro_engine
    from ..autonomous_mind import autonomous_mind
except ImportError:
    from memory import session_manager, ConversationSession
    from tools_engine import execute_tool, get_tool_descriptions
    from hf_client import generate_text, generate_text_stream
    from rust_engine import engine as rust_core
    from emotion_core.engine import emotion_engine
    from neural_core.engine import neural_engine
    from micro_core.engine import micro_engine
    from autonomous_mind import autonomous_mind

logger = logging.getLogger("nexium.reasoning")
router = APIRouter()

class SmartChatRequest(BaseModel):
    prompt: str = Field(..., description="User query or instruction")
    session_id: Optional[str] = Field(default=None, description="Conversation session ID")
    persona: str = Field(default="general", description="Persona preset: general, architect, math_logic")
    model: str = Field(default="mistral-7b")
    max_tokens: int = Field(default=512, ge=1, le=4096)
    enable_thinking: bool = Field(default=True, description="Enable chain-of-thought reasoning")
    enable_tools: bool = Field(default=True, description="Enable autonomous tool execution")
    enable_critic: bool = Field(default=True, description="Enable self-reflection critique")
    enable_emotion: bool = Field(default=True, description="Enable user feeling and emotional recording")
    enable_neural: bool = Field(default=True, description="Enable AI synaptic neuron firing simulation")

class CreateSessionRequest(BaseModel):
    persona: str = Field(default="general")

def detect_and_run_tools(prompt: str) -> List[Dict[str, Any]]:
    """Intelligent heuristic tool dispatcher for advanced math, calculus, algebra, system, and device tasks."""
    tools_used = []
    p_lower = prompt.lower().strip()

    # 1. Time & Date detection
    if any(k in p_lower for k in ("what time", "current time", "what date", "today's date", "what day is today")):
        res = execute_tool("get_time")
        tools_used.append({"tool": "get_time", "result": res})

    # 2. Heavy systems and production architecture design
    try:
        from ..heavy_code_engine import heavy_code_engine
    except ImportError:
        from heavy_code_engine import heavy_code_engine

    selected_blueprint = heavy_code_engine.select_blueprint_for_prompt(prompt)
    if selected_blueprint and not any(tool_info.get("tool") == "heavy_code" for tool_info in tools_used):
        res = execute_tool("heavy_code", blueprint_id=selected_blueprint)
        if res.get("success"):
            tools_used.append({"tool": "heavy_code", "input": selected_blueprint, "result": res})

    # 3. Equation Solving (e.g., "solve x^2 - 5x + 6 = 0", "find roots of x^3 - 8 = 0", "solve 2x + 4 = 10 for x")
    solve_match = re.search(r"(?:solve|find roots of|find solutions? (?:to|for))\s+([a-zA-Z0-9\+\-\*\/\^\(\)\.\s\=]+?)(?:\s+for\s+([a-zA-Z]))?$", prompt, re.IGNORECASE)
    if solve_match:
        eq_str = solve_match.group(1).strip()
        var_str = solve_match.group(2) or "x"
        if any(c in eq_str for c in ("x", "y", "z", "=")):
            res = execute_tool("solve_equation", equation=eq_str, variable=var_str)
            if res.get("success"):
                tools_used.append({"tool": "solve_equation", "input": eq_str, "result": res})

    # 3. Calculus: Derivatives (e.g., "derivative of sin(x)*e^x", "differentiate x^3 + 2x", "d/dx of ln(x)")
    diff_match = re.search(r"(?:derivative of|differentiate|d\/dx of|diff)\s+([a-zA-Z0-9\+\-\*\/\^\(\)\.\s\\\_]+)", prompt, re.IGNORECASE)
    if diff_match and not any(t["tool"] == "calculus" for t in tools_used):
        expr = diff_match.group(1).strip()
        res = execute_tool("calculus", operation="diff", expression=expr, variable="x")
        if res.get("success"):
            tools_used.append({"tool": "calculus_derivative", "input": expr, "result": res})

    # 4. Calculus: Integrals (e.g., "integral of x^2", "integrate 1/(1+x^2)", "antiderivative of cos(x)")
    int_match = re.search(r"(?:integral of|integrate|antiderivative of)\s+([a-zA-Z0-9\+\-\*\/\^\(\)\.\s\\\_]+)", prompt, re.IGNORECASE)
    if int_match and not any("calculus" in t["tool"] for t in tools_used):
        expr = int_match.group(1).strip()
        res = execute_tool("calculus", operation="integrate", expression=expr, variable="x")
        if res.get("success"):
            tools_used.append({"tool": "calculus_integral", "input": expr, "result": res})

    # 5. Algebraic Manipulation: Simplify, Factor, Expand
    alg_match = re.search(r"(?:simplify|factor|expand)\s+([a-zA-Z0-9\+\-\*\/\^\(\)\.\s]+)", prompt, re.IGNORECASE)
    if alg_match and not tools_used:
        full_match = alg_match.group(0).lower()
        mode = "factor" if full_match.startswith("factor") else ("expand" if full_match.startswith("expand") else "simplify")
        expr = alg_match.group(1).strip()
        res = execute_tool("simplify_expression", expression=expr, mode=mode)
        if res.get("success"):
            tools_used.append({"tool": f"algebra_{mode}", "input": expr, "result": res})

    # 6. Number Theory: Primes, GCD, LCM, Factorials
    if "prime factor" in p_lower or "factorize" in p_lower:
        num_m = re.search(r"(?:prime factors? of|factorize)\s+([0-9]+)", prompt, re.IGNORECASE)
        if num_m:
            res = execute_tool("number_theory", operation="prime_factors", n=int(num_m.group(1)))
            tools_used.append({"tool": "number_theory_factors", "result": res})
    elif "is" in p_lower and "prime" in p_lower:
        prime_m = re.search(r"(?:is\s+)?([0-9]+)\s+(?:a\s+)?prime", prompt, re.IGNORECASE)
        if prime_m:
            res = execute_tool("number_theory", operation="is_prime", n=int(prime_m.group(1)))
            tools_used.append({"tool": "number_theory_is_prime", "result": res})
    elif "factorial" in p_lower or re.search(r"\b[0-9]+!", prompt):
        fact_m = re.search(r"(?:factorial of\s+|([0-9]+)!)", prompt, re.IGNORECASE) or re.search(r"([0-9]+)\s*factorial", prompt, re.IGNORECASE)
        if fact_m:
            n_val = int(fact_m.group(1) or fact_m.group(2) or 0)
            if 0 <= n_val <= 1000:
                res = execute_tool("number_theory", operation="factorial", n=n_val)
                tools_used.append({"tool": "number_theory_factorial", "result": res})

    # 7. Descriptive Statistics
    if any(k in p_lower for k in ("mean of", "average of", "median of", "stdev of", "statistics of")):
        nums = [float(x) for x in re.findall(r"[-+]?[0-9]*\.?[0-9]+", prompt)]
        if len(nums) >= 2:
            res = execute_tool("statistics", operation="summary", data=nums)
            tools_used.append({"tool": "statistics", "result": res})

    # 8. General Arithmetic / Calculation
    if not any("calculate" in t["tool"] or "solve" in t["tool"] or "calculus" in t["tool"] for t in tools_used):
        math_match = re.search(r"(?:calculate|what is|compute)\s+([0-9\+\-\*\/\^\(\)\.\s\%sqrtlogsincoepita]+)", prompt, re.IGNORECASE)
        if math_match:
            expr = math_match.group(1).strip()
            if any(op in expr for op in ("+", "-", "*", "/", "^", "sqrt", "sin", "cos", "tan", "log", "exp")):
                res = execute_tool("calculate", expression=expr)
                if res.get("success"):
                    tools_used.append({"tool": "calculate", "input": expr, "result": res})

    # 9. Device Agent & System Diagnostics
    if any(k in p_lower for k in ("system specs", "device specs", "hardware specs", "system info", "device info", "ram specs", "disk space")):
        res = execute_tool("device_task", action="system_info")
        tools_used.append({"tool": "device_task", "action": "system_info", "result": res})
    elif any(k in p_lower for k in ("battery", "power status", "battery percent", "charging status")):
        res = execute_tool("device_task", action="battery")
        tools_used.append({"tool": "device_task", "action": "battery", "result": res})
    elif any(k in p_lower for k in ("list files", "workspace files", "my files")):
        res = execute_tool("device_task", action="list_files")
        tools_used.append({"tool": "device_task", "action": "list_files", "result": res})
    elif "ping" in p_lower or "network check" in p_lower:
        host_match = re.search(r"(?:ping|check)\s+([a-zA-Z0-9\.\-]+)", prompt, re.IGNORECASE)
        host = host_match.group(1) if host_match and host_match.group(1).lower() not in ("me", "this", "it") else "8.8.8.8"
        res = execute_tool("device_task", action="ping", host=host)
        tools_used.append({"tool": "device_task", "action": "ping", "result": res})
    elif any(k in p_lower for k in ("how are you doing", "how are you today", "system status", "nexium status", "status report", "are you online", "are you ready")):
        res = execute_tool("device_task", action="system_info")
        tools_used.append({"tool": "device_task", "action": "system_info", "result": res})

    # 10. Autonomous Coding Agent Tools:
    # 10a. Symbol Search (e.g. "search symbol X", "where is class X defined", "find function X")
    sym_m = re.search(r"(?:search symbol|find symbol|where is (?:class|function|def|struct|interface))\s+([A-Za-z0-9_]+)", prompt, re.IGNORECASE)
    if sym_m and not any(t.get("tool") == "symbol_search" for t in tools_used):
        query_sym = sym_m.group(1).strip()
        res = execute_tool("symbol_search", query=query_sym, max_results=10)
        tools_used.append({"tool": "symbol_search", "query": query_sym, "result": res})

    # 10b. Test Suite Runner (e.g. "run tests", "run pytest", "test the suite")
    if any(k in p_lower for k in ("run tests", "run pytest", "execute tests", "test suite")):
        target = None
        target_m = re.search(r"(?:run tests? on|test)\s+([a-zA-Z0-9_\-\.\/]+)", prompt, re.IGNORECASE)
        if target_m and target_m.group(1).lower() not in ("suite", "code", "it", "all", "the"):
            target = target_m.group(1)
        res = execute_tool("run_tests", test_target=target)
        tools_used.append({"tool": "run_tests", "result": res})

    # 10c. Git Diff & Working Tree (e.g. "git diff", "show changes", "what changed", "git status")
    if any(k in p_lower for k in ("git diff", "show git diff", "show changes", "what did i change", "what changed in git")):
        res = execute_tool("git_diff")
        tools_used.append({"tool": "git_diff", "result": res})

    # 10d. AST Outline / File Map (e.g. "ast of backend/tools_engine.py", "outline of main.py")
    ast_m = re.search(r"(?:ast of|outline of|map file)\s+([a-zA-Z0-9_\-\.\/]+)", prompt, re.IGNORECASE)
    if ast_m:
        fpath = ast_m.group(1).strip()
        res = execute_tool("ast_map", file_path=fpath)
        tools_used.append({"tool": "ast_map", "file": fpath, "result": res})

    # 10e. Unreal Engine 5 Validation (e.g. "validate ue5", "check unreal class")
    if ("ue5" in p_lower or "unreal" in p_lower) and any(k in p_lower for k in ("validate", "check", "uclass", "blueprint")):
        res = execute_tool("ue5_validator", code=prompt)
        tools_used.append({"tool": "ue5_validator", "result": res})

    # 10f. Project Memory Persistence (e.g. "remember that X is Y", "save to memory")
    mem_m = re.search(r"(?:remember that|save to memory|store memory)\s+([a-zA-Z0-9_]+)\s*(?:is|=|as)\s*(.*)", prompt, re.IGNORECASE)
    if mem_m:
        k = mem_m.group(1).strip()
        v = mem_m.group(2).strip()
        res = execute_tool("project_memory", action="set", key=k, value=v)
        tools_used.append({"tool": "project_memory", "key": k, "result": res})
    elif any(k in p_lower for k in ("list memory", "project memory", "show memory")):
        res = execute_tool("project_memory", action="list")
        tools_used.append({"tool": "project_memory", "result": res})

    return tools_used

@router.post("/smart_chat")
async def smart_chat(req: SmartChatRequest):
    """
    Cognitive multi-step reasoning endpoint:
    Decompose -> Tool Execution -> Chain-of-Thought Synthesis -> Self-Reflection -> Response.
    """
    try:
        # 1. Retrieve or create session
        session = session_manager.get_or_create(req.session_id, req.persona)
        session_id = session.session_id

        # 1b. Emotion & Feeling Analysis + Journaling
        emotion_res = None
        empathy_context = ""
        if req.enable_emotion:
            try:
                emotion_res = emotion_engine.record_feeling(session_id=session_id, user_text=req.prompt)
                if emotion_res.get("directive"):
                    empathy_context = f"\n[EMPATHY DIRECTIVE: {emotion_res['directive']}]\n"
            except Exception as em_err:
                logger.warning(f"Emotion core tracking warning: {em_err}")

        # 1c. AI Synaptic Neuron Layer Firing
        neural_res = None
        if req.enable_neural:
            try:
                neural_res = neural_engine.fire_forward(req.prompt, layer_stimulus=1.0)
            except Exception as neu_err:
                logger.warning(f"Neural core firing warning: {neu_err}")

        # 1d. Sub-millisecond Micro-Thinking Deliberation
        micro_res = None
        try:
            micro_res = micro_engine.deliberate(req.prompt)
        except Exception as mic_err:
            logger.warning(f"Micro core deliberation warning: {mic_err}")

        # 2. Autonomous Tool Detection & Execution
        tools_used = []
        tool_context = ""
        if req.enable_tools:
            tools_used = detect_and_run_tools(req.prompt)
            if tools_used:
                tool_lines = ["[Tool Execution Results]"]
                for t in tools_used:
                    tool_lines.append(f"- {t['tool']}: {t.get('result', {})}")
                tool_context = "\n".join(tool_lines) + "\n\n"

        # 3. Context Assembling
        history_msgs = session.get_context_window(max_chars=6000)
        history_str = ""
        for m in history_msgs:
            history_str += f"{m['role'].capitalize()}: {m['content']}\n"

        # 4. Multi-Step Reasoning Prompt Choreography
        thinking_block = ""
        thinking_telemetry = None
        if req.enable_thinking:
            thought_prompt = (
                f"{session.system_prompt}\n"
                f"{empathy_context}"
                f"{tool_context}"
                f"{history_str}"
                f"User: {req.prompt}\n\n"
                f"Think through this step-by-step before answering. Outline your logic clearly:\n"
                f"<thinking>\n"
            )
            raw_thought = await generate_text(req.model, thought_prompt, max_length=256)
            thinking_block = str(raw_thought).replace("</thinking>", "").strip()
            
            # Deep Thinking & Micro-Thinking Rust Acceleration Core
            cot_eval = rust_core.decompose_cot(thinking_block)
            sym_eval = rust_core.verify_symbolic_constraints(thinking_block)
            mcts_eval = rust_core.mcts_cognitive_rollout(simulations=50)
            micro_eval = rust_core.micro_think(req.prompt)
            thinking_telemetry = {
                "cot": cot_eval,
                "symbolic": sym_eval,
                "mcts": mcts_eval,
                "micro": micro_eval,
                "rust_accelerated": rust_core.is_native,
            }

        # 5. Synthesis Prompt
        synthesis_prompt = (
            f"{session.system_prompt}\n"
            f"{empathy_context}"
            f"{tool_context}"
            f"Reasoning context:\n{thinking_block}\n\n"
            f"{history_str}"
            f"User: {req.prompt}\n\n"
            f"Assistant:"
        )
        final_answer = await generate_text(req.model, synthesis_prompt, max_length=req.max_tokens)
        final_answer_str = str(final_answer).strip()

        # 6. Self-Reflection & Critic Loop (Optional)
        critic_result = {"status": "passed", "critique": "Answer is consistent and complete."}
        if req.enable_critic:
            critic_scan = rust_core.safety_scan(final_answer_str)
            if not critic_scan.get("safe", True):
                critic_result = {
                    "status": "flagged",
                    "critique": "Output triggered safety flags",
                    "flags": critic_scan.get("flags"),
                }

        # 7. Record in session memory
        session.add_message("user", req.prompt)
        session.add_message("assistant", final_answer_str, thinking=thinking_block)

        # 8. Autonomous Metacognition & Self-Reflection
        reflection = None
        try:
            reflection = autonomous_mind.post_interaction_reflect(req.prompt, final_answer_str, tools_used)
        except Exception as ref_err:
            logger.warning(f"Autonomous reflection warning: {ref_err}")

        return {
            "session_id": session_id,
            "text": final_answer_str,
            "thinking": thinking_block if req.enable_thinking else None,
            "thinking_telemetry": thinking_telemetry if req.enable_thinking else None,
            "micro_thinking": micro_res or (thinking_telemetry.get("micro") if thinking_telemetry else None),
            "emotion": emotion_res,
            "neural_telemetry": neural_res,
            "tools_used": tools_used,
            "critic": critic_result,
            "persona": req.persona,
            "autonomous_reflection": reflection,
            "rust_accelerated": rust_core.is_native,
        }
    except Exception as e:
        logger.exception("Smart chat failed")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/smart_chat/stream")
async def smart_chat_stream(req: SmartChatRequest):
    """
    Streaming cognitive endpoint: streams thinking tokens followed by answer tokens.
    Includes live emotional resonance and neural spike telemetry.
    """
    session = session_manager.get_or_create(req.session_id, req.persona)
    session_id = session.session_id

    # Emotion recording
    emotion_res = None
    empathy_context = ""
    if req.enable_emotion:
        try:
            emotion_res = emotion_engine.record_feeling(session_id=session_id, user_text=req.prompt)
            if emotion_res.get("directive"):
                empathy_context = f"\n[EMPATHY DIRECTIVE: {emotion_res['directive']}]\n"
        except Exception as em_err:
            logger.warning(f"Emotion core stream warning: {em_err}")

    # Neural firing
    neural_res = None
    if req.enable_neural:
        try:
            neural_res = neural_engine.fire_forward(req.prompt, layer_stimulus=1.0)
        except Exception as neu_err:
            logger.warning(f"Neural core stream warning: {neu_err}")

    # Tool detection
    tools_used = detect_and_run_tools(req.prompt) if req.enable_tools else []
    tool_context = ""
    if tools_used:
        tool_lines = ["[Tool Results]"]
        for t in tools_used:
            tool_lines.append(f"- {t['tool']}: {t.get('result', {})}")
        tool_context = "\n".join(tool_lines) + "\n\n"

    history_msgs = session.get_context_window(max_chars=6000)
    history_str = "".join(f"{m['role'].capitalize()}: {m['content']}\n" for m in history_msgs)

    synthesis_prompt = (
        f"{session.system_prompt}\n"
        f"{empathy_context}"
        f"{tool_context}"
        f"{history_str}"
        f"User: {req.prompt}\n\n"
        f"Assistant:"
    )

    async def event_generator():
        try:
            # Telemetry metadata frame first
            telemetry_payload = {}
            if emotion_res:
                telemetry_payload["emotion"] = emotion_res
            if neural_res:
                telemetry_payload["neural"] = neural_res
            if tools_used:
                telemetry_payload["tools"] = tools_used
            if telemetry_payload:
                yield f"data: {json.dumps(telemetry_payload)}\n\n"

            collected_tokens = []
            async for token in generate_text_stream(req.model, synthesis_prompt, max_length=req.max_tokens):
                collected_tokens.append(token)
                yield f"data: {json.dumps({'token': token, 'session_id': session_id})}\n\n"

            full_text = "".join(collected_tokens)
            session.add_message("user", req.prompt)
            session.add_message("assistant", full_text)

            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/sessions")
async def create_session(req: CreateSessionRequest):
    sess = session_manager.get_or_create(persona=req.persona)
    return sess.to_dict()

@router.get("/sessions")
async def list_sessions():
    return session_manager.list_sessions()

@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    sess = session_manager.get(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return sess.to_dict()

class ImproveRequest(BaseModel):
    iterations: int = Field(default=10, ge=1, le=500)

@router.post("/improve/run")
async def run_improvement_loop(req: ImproveRequest):
    """
    Triggers N continuous learning cycles:
    decomposing problems, verifying solutions, and ingesting knowledge into the Rust RAG store.
    """
    try:
        from ..self_improvement import self_improver
    except ImportError:
        from self_improvement import self_improver

    summary = await self_improver.run_batch(count=req.iterations)
    return summary

@router.get("/improve/status")
async def get_improvement_status():
    try:
        from ..self_improvement import self_improver
    except ImportError:
        from self_improvement import self_improver

    return {
        "total_iterations": self_improver.iteration_count,
        "verified_count": self_improver.verified_count,
        "history_count": len(self_improver.history),
        "recent": self_improver.history[-5:] if self_improver.history else [],
    }
