NEXIUM - Multipurpose AI Prototype

Overview

This repository contains a minimal prototype for a multipurpose AI assistant that can generate text, write code, and support retrieval-augmented generation (RAG) using Supabase and Hugging Face Inference API. It's designed as a cost-aware starting point: hosted inference (Hugging Face) + Supabase for vector storage.

Structure

- backend/: FastAPI backend with endpoints for generation, code tasks, embeddings, and RAG.
- frontend/: Simple React app demoing chat with the backend.

Quick start

1. Create a Python venv and install backend deps:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

2. Create a `.env` file in `backend/` with:

```
HF_API_KEY=your_hf_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key
```

3. Run backend:

```bash
cd backend
uvicorn main:app --reload --port 8000
```

4. Run frontend (from `frontend/`):

```bash
cd frontend
npm install
npm start
```

Next steps

- Provide your Hugging Face and Supabase keys in `backend/.env`.
- I can deploy this to a small cloud VM or a managed service when you're ready.

Self-hosting a quantized model (optional)

If you want to download and run a quantized GGML model locally (recommended approach for a low-cost, private setup), use WSL/Ubuntu and the provided helper scripts:

1. In WSL/Ubuntu, run the setup script to build `llama.cpp` and install the Python helper:

```bash
cd backend/tools
bash setup_llama_cpp.sh
```

2. Download a GGML model (you must accept its HF license on the web UI first):

```bash
python3 download_model.py --repo-id <owner/model-repo> --filename <ggml-file-name> --dest ../models
```

3. Run the model (example):

```bash
./../llama.cpp/main -m ../models/ggml-model.bin -p "Write me a short summary" -n 128
```

Notes:
- Use `huggingface-cli login` or set `HF_TOKEN` to allow `download_model.py` to fetch private or gated weights.
- Small 7B-class GGML models can run on many modern CPUs using `llama.cpp` or on GPUs with other runtimes after conversion.
- Accept the model's license on huggingface.co before downloading. Some models require agreement to download.

Automated setup scripts

I added helper scripts to automate common flows:

- `backend/tools/setup_vllm.sh` — creates a virtualenv, installs `vllm` and `huggingface_hub`, and prints exact commands to download `Qwen/Qwen3.8-27B` and serve it locally on `http://localhost:8001`.
- `backend/routers/vllm_proxy.py` — a new backend endpoint at `/api/local_chat` that forwards requests to a local vLLM server once it's running.

Run the setup script in WSL/Ubuntu or a Linux server to prepare the environment, then download the model and start the server as instructed by the script.

Fast path: use hosted Qwen (no download)

If you lack storage, use the hosted inference API instead of downloading weights. The project includes an endpoint that forwards requests to Hugging Face's inference for `Qwen/Qwen3.8-27B`:

- Endpoint: `POST /api/remote_qwen` (body: `{"prompt": "...", "max_tokens": 256}`)

Example curl using the prototype backend (assumes backend running on port 8000):

```bash
curl -sS -X POST http://localhost:8000/api/remote_qwen \
	-H "Content-Type: application/json" \
	-d '{"prompt":"Write a short summary","max_tokens":128}'
```

This uses your `HF_API_KEY` in `backend/.env` to call the Hugging Face inference API for Qwen without downloading the model files locally.

Docker / Deployment

To run the backend inside Docker (recommended for production/staging):

1. Build and run using docker-compose (set env vars in your shell or in a `.env` file):

```bash
docker compose up --build -d
```

2. The service will be available at `http://localhost:8000`.

Notes on safety and production readiness
- The repository includes a basic safety middleware (`backend/middleware/safety.py`) implementing an in-memory rate limiter and simple regex-based content filters. This is a minimal, single-process guard — replace with a robust moderation service (e.g., a hosted moderation API, or a Redis-backed rate limiter) for production.
- Before exposing the API publicly, add persistent logging, request auditing, API keys for clients, and a backend moderation provider.
Notes on safety and production readiness
- The repository includes a basic safety middleware (`backend/middleware/safety.py`) implementing an in-memory rate limiter and simple regex-based content filters. This is a minimal, single-process guard — replace with a robust moderation service for production.
- You can enable Redis-backed rate limiting and HF moderation model by setting the following env vars in `backend/.env` or your environment:

```
REDIS_URL=redis://localhost:6379/0
RATE_LIMIT_PER_MIN=60
MODERATION_ENABLED=1
MODERATION_MODEL=OpenAI/omni-moderation-latest
```

- When `REDIS_URL` is set and reachable, the middleware uses Redis counters for accurate rate limiting across processes. When `MODERATION_ENABLED` is `1`, the middleware will call the HF moderation model configured by `MODERATION_MODEL` to classify text and block flagged content.
