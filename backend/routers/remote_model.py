from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import httpx

router = APIRouter()


class RemoteModelRequest(BaseModel):
    prompt: str
    model: str = "qwen2.5:3b-instruct"
    max_tokens: int = 512


@router.post('/remote_model')
async def remote_model(req: RemoteModelRequest):
    """Try cloud provider first (if configured), otherwise call local Ollama."""
    # 1) If CLOUD_MODEL_URL env var is set, call it
    cloud_url = os.environ.get('CLOUD_MODEL_URL')
    cloud_key = os.environ.get('CLOUD_MODEL_KEY')
    if cloud_url:
        try:
            headers = {'Content-Type': 'application/json'}
            if cloud_key:
                headers['Authorization'] = f"Bearer {cloud_key}"
            async with httpx.AsyncClient(timeout=60.0) as client:
                payload = {"model": req.model, "prompt": req.prompt, "max_tokens": req.max_tokens}
                r = await client.post(cloud_url, json=payload, headers=headers)
                r.raise_for_status()
                data = r.json()
                # Expect provider to return {'text': '...'} or similar
                if isinstance(data, dict) and data.get('text'):
                    return {"source": "cloud", "text": data.get('text'), "raw": data}
                return {"source": "cloud", "raw": data}
        except Exception as e:
            # fall through to local
            print(f"Remote model call failed: {e}")

    # 2) Fallback: local Ollama
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            ollama_url = os.environ.get('OLLAMA_URL', 'http://localhost:11434/api/generate')
            payload = {"model": req.model, "prompt": req.prompt, "max_tokens": req.max_tokens}
            r = await client.post(ollama_url, json=payload)
            r.raise_for_status()
            data = r.json()
            # Ollama returns streaming endpoints normally; adapt if necessary
            if isinstance(data, dict) and data.get('output'):
                return {"source": "ollama", "text": data.get('output'), "raw": data}
            return {"source": "ollama", "raw": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
