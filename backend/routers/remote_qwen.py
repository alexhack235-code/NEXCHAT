from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

try:
    from ..hf_client import generate_text
except ImportError:
    from hf_client import generate_text

router = APIRouter()

class RemoteQwenRequest(BaseModel):
    prompt: str
    max_tokens: int = 256
    model: str = "Qwen/Qwen3.8-27B"


@router.post("/remote_qwen")
async def remote_qwen(req: RemoteQwenRequest):
    try:
        out = await generate_text(req.model, req.prompt, max_length=req.max_tokens)
        # HF may return string or structured response
        if isinstance(out, dict):
            # attempt to extract generated_text
            if out.get("generated_text"):
                return {"text": out.get("generated_text"), "raw": out}
        if isinstance(out, str):
            return {"text": out}
        return {"raw": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
