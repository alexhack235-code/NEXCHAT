from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

router = APIRouter()

class VLLMRequest(BaseModel):
    model: str = "Qwen3.8-27B"
    prompt: str
    max_tokens: int = 256

VLLM_URL = "http://127.0.0.1:8001/v1/completions"


@router.post("/local_chat")
async def local_chat(req: VLLMRequest):
    payload = {"model": req.model, "input": req.prompt, "max_tokens": req.max_tokens}
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(VLLM_URL, json=payload)
            r.raise_for_status()
            data = r.json()
            # vLLM returns choices with text content
            if isinstance(data, dict) and data.get("choices"):
                text = "".join([c.get("text", "") for c in data.get("choices", [])])
                return {"text": text, "raw": data}
            return {"raw": data}
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"vLLM request failed: {e}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
