# NEXT STEPS (for new PC)

Short: use the hosted API for now. When you move to the new PC and have enough disk (>= 120 GB free recommended), follow the steps below to finish setup and optionally download Qwen3.8-27B.

1) Prereqs (install on the new PC)
   - Git, Python 3.11+, Docker Desktop (or a Linux VM), WSL2 (Windows) recommended, Node/npm for frontend.

2) Clone repo
   - git clone <repo-url> && cd NEXIUM

3) Add secrets (DO NOT COMMIT)
   - Create `backend/.env` from `.env.example` and add your `HF_API_KEY`.
   - Example (do locally):
     ```text
     HF_API_KEY=hf_xxxYOURTOKENxxx
     REDIS_URL=redis://localhost:6379/0
     RATE_LIMIT_PER_MIN=60
     MODERATION_ENABLED=1
     MODERATION_MODEL=OpenAI/omni-moderation-latest
     SUPABASE_URL=
     SUPABASE_KEY=
     ```

4) Run Redis (recommended)
   - Docker (recommended): `docker run -d --name nexium-redis -p 6379:6379 redis:7`
   - Or install in WSL: `sudo apt install -y redis-server` then `sudo service redis-server start`.

5) Run backend (dev)
   - Linux/WSL:
     ```bash
     cd backend
     python -m venv .venv
     source .venv/bin/activate
     pip install -r requirements.txt
     uvicorn main:app --reload --port 8000
     ```
   - Windows PowerShell:
     ```powershell
     cd backend
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     pip install -r requirements.txt
     uvicorn main:app --reload --port 8000
     ```

6) Quick tests (after backend running)
   - Health: `curl http://localhost:8000/health`
   - Redis: `curl http://localhost:8000/health/redis`
   - HF key present: `curl http://localhost:8000/health/hf`
   - Hosted Qwen call (uses `HF_API_KEY`):
     ```bash
     curl -X POST http://localhost:8000/api/remote_qwen -H "Content-Type: application/json" -d '{"prompt":"Hello","max_tokens":64}'
     ```

7) Optional: Download & self-host Qwen3.8-27B (only if you have storage & GPU)
   - Ensure >=120 GB free and a CUDA-capable GPU (24–40 GB VRAM recommended) or be prepared for long CPU runs.
   - Accept model license on Hugging Face: https://huggingface.co/Qwen/Qwen3.8-27B (click "Access repository" / accept license).
   - Download (example using huggingface_hub):
     ```bash
     pip install huggingface_hub
     python - <<'PY'
     from huggingface_hub import snapshot_download
     snapshot_download(repo_id='Qwen/Qwen3.8-27B', local_dir='backend/models/Qwen3.8-27B')
     PY
     ```
   - Install vLLM and serve (GPU path): see `backend/tools/setup_vllm.sh` then run `vllm serve --model backend/models/Qwen3.8-27B --port 8001`.
   - After vLLM running, call the local proxy: `POST /api/local_chat`.

8) If storage limited: continue using hosted HF inference (no download). Use RAG with Supabase to reduce calls.

9) Security & production notes
   - Never commit `.env` or tokens to git. Use secret stores for production (Vault, cloud secrets, GitHub secrets).
   - Replace in-memory/Redis rate limiter with production services if exposing publicly.

10) Checklist to hand to the next AI / person
   - Ensure `backend/.env` populated with `HF_API_KEY` and `REDIS_URL`.
   - Start Redis then backend, verify `/health` endpoints.
   - If download requested: confirm disk, accept HF license, run `snapshot_download`, install vLLM and serve, then test `/api/local_chat`.

-- END
