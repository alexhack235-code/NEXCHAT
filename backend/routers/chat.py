import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

try:
    from ..hf_client import generate_text, generate_text_stream
    from ..rust_engine import engine as rust_core
except ImportError:
    from hf_client import generate_text, generate_text_stream
    from rust_engine import engine as rust_core

try:
    from ..gemini_engine import gemini_engine
except ImportError:
    try:
        from gemini_engine import gemini_engine
    except ImportError:
        gemini_engine = None

router = APIRouter()

class ChatRequest(BaseModel):
    model: str = Field(default="gemini-3.8-flash", description="Model name or HF repository ID")
    prompt: str = Field(..., description="Prompt or user message")
    max_tokens: int = Field(default=256, ge=1, le=4096)
    redact_pii: bool = Field(default=False, description="Automatically mask PII using Rust core")

class CodeRequest(BaseModel):
    language: str = Field(default="python", description="Target programming language")
    task: str = Field(..., description="Description of the coding task or function to write")
    model: str = Field(default="gemini-3.8-flash")
    max_tokens: int = Field(default=512, ge=1, le=4096)

@router.post("/chat")
async def chat(req: ChatRequest):
    prompt = req.prompt
    if req.redact_pii and rust_core:
        prompt = rust_core.mask_pii(prompt)

    # Route to Gemini if requested or as primary
    if ("gemini" in req.model.lower() or "flash" in req.model.lower()) and gemini_engine and gemini_engine.is_configured():
        gem_res = await gemini_engine.generate_content(prompt=prompt, model="gemini-3.8-flash", max_output_tokens=req.max_tokens)
        if gem_res.get("success"):
            return {"text": gem_res["text"], "model": "gemini-3.8-flash", "engine": "gemini-pool"}

    try:
        out = await generate_text(req.model, prompt, max_length=req.max_tokens)
        return {"text": out, "model": req.model}
    except Exception as e:
        if gemini_engine and gemini_engine.is_configured():
            gem_res = await gemini_engine.generate_content(prompt=prompt, model="gemini-3.8-flash", max_output_tokens=req.max_tokens)
            if gem_res.get("success"):
                return {"text": gem_res["text"], "model": "gemini-3.8-flash", "engine": "gemini-pool-fallback"}
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """
    Server-Sent Events (SSE) streaming endpoint for instantaneous token delivery.
    """
    prompt = req.prompt
    if req.redact_pii:
        prompt = rust_core.mask_pii(prompt)

    async def event_generator():
        try:
            async for token in generate_text_stream(req.model, prompt, max_length=req.max_tokens):
                payload = json.dumps({"token": token})
                yield f"data: {payload}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            error_payload = json.dumps({"error": str(e)})
            yield f"data: {error_payload}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/code")
async def code_generation(req: CodeRequest):
    """
    Specialized endpoint for generating high-quality code.
    """
    code_prompt = (
        f"You are an expert software engineer. Write clean, high-performance, well-tested {req.language} code for the following specification:\n\n"
        f"Task: {req.task}\n\n"
        f"Return ONLY valid {req.language} code with clear documentation comments."
    )
    try:
        out = await generate_text(req.model, code_prompt, max_length=req.max_tokens)
        return {
            "code": out,
            "language": req.language,
            "model": req.model,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
