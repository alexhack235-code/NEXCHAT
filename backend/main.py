import os
import sys
import shutil
import subprocess
import tempfile
import logging
import asyncio
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from dotenv import load_dotenv
import httpx

load_dotenv()
logger = logging.getLogger("nexium.main")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CHAT_HTML_PATH = PROJECT_ROOT / "chat.html"
STUDIO_HTML_PATH = PROJECT_ROOT / "nex-3d-studio.html"
VAULT_HTML_PATH = PROJECT_ROOT / "vault.html"
CSS_PATH = PROJECT_ROOT / "css"

try:
    from .rust_engine import engine as rust_core
except ImportError:
    try:
        from rust_engine import engine as rust_core
    except ImportError:
        rust_core = None

try:
    from .gemini_engine import gemini_engine, sanitize_nexium_output
except ImportError:
    try:
        from gemini_engine import gemini_engine, sanitize_nexium_output
    except ImportError:
        gemini_engine = None
        def sanitize_nexium_output(t): return t

try:
    from .video_factory import video_factory, VIDEOFACTORY_SYSTEM_PROMPT
except ImportError:
    try:
        from video_factory import video_factory, VIDEOFACTORY_SYSTEM_PROMPT
    except ImportError:
        video_factory = None
        VIDEOFACTORY_SYSTEM_PROMPT = ""

try:
    from .video_tokens import token_manager, UPGRADE_MENU_TEXT, midnight_wat_cron_worker
except ImportError:
    try:
        from video_tokens import token_manager, UPGRADE_MENU_TEXT, midnight_wat_cron_worker
    except ImportError:
        token_manager = None
        UPGRADE_MENU_TEXT = ""
        midnight_wat_cron_worker = None

app = FastAPI(title="NEXIUM AI - Autonomous Workstation", version="3.0.0")

@app.on_event("startup")
async def on_startup():
    if midnight_wat_cron_worker:
        asyncio.create_task(midnight_wat_cron_worker())
        logger.info("[NEXIUM] VideoFactory midnight Africa/Lagos (WAT) cron worker initialized.")

# Mount CSS directory if it exists
if CSS_PATH.exists():
    app.mount("/css", StaticFiles(directory=str(CSS_PATH)), name="css")

VIDEOS_DIR = PROJECT_ROOT / "backend" / "generated_code" / "videos"
os.makedirs(VIDEOS_DIR, exist_ok=True)
app.mount("/videos", StaticFiles(directory=str(VIDEOS_DIR)), name="videos")

FPS_ASSET_DIR = Path("C:/Users/Baha/Desktop/ASSET")
if not FPS_ASSET_DIR.exists():
    FPS_ASSET_DIR = PROJECT_ROOT / "frontend" / "assets" / "luxury_fps"
if FPS_ASSET_DIR.exists():
    app.mount("/fps-assets", StaticFiles(directory=str(FPS_ASSET_DIR)), name="fps-assets")

# Strict CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://nexchat-drab.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Zero-Trust Air-Gap Guard: Reject direct backend calls without x-internal-auth header
@app.middleware("http")
async def enforce_internal_auth(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    
    internal_secret = os.getenv("INTERNAL_SECRET", "d0caa6a4b13a2c24c4d7267d2a99a39f3d6e9b9a9506199f545d4043b8e975b4")
    incoming_secret = request.headers.get("x-internal-auth")
    
    if not incoming_secret or incoming_secret != internal_secret:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=403,
            content={"error": "Forbidden: Direct backend access prohibited. All requests must route through Fortress Cloud Defender Proxy."}
        )
    
    return await call_next(request)

# Root endpoint: Returns Master Launch Deck for browser, or JSON for API clients
@app.get("/")
async def root(request: Request):
    accept_header = request.headers.get("accept", "")
    if "text/html" in accept_header:
        html_dashboard = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXIUM // Master Autonomous Cockpit</title>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            background: #08080c;
            color: #f3f4f6;
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 2.5rem 1.5rem;
        }}
        .container {{ max-width: 1100px; margin: 0 auto; width: 100%; }}
        .header {{ text-align: center; margin-bottom: 3rem; }}
        .badge {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            background: rgba(0, 240, 255, 0.1);
            border: 1px solid rgba(0, 240, 255, 0.3);
            border-radius: 9999px;
            color: #00F0FF;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 1rem;
        }}
        .badge .dot {{ width: 8px; height: 8px; border-radius: 50%; background: #00FF88; box-shadow: 0 0 10px #00FF88; animation: pulse 2s infinite; }}
        @keyframes pulse {{ 0%, 100% {{ opacity: 1; }} 50% {{ opacity: 0.4; }} }}
        h1 {{
            font-size: 2.75rem;
            font-weight: 800;
            letter-spacing: -1px;
            background: linear-gradient(135deg, #ffffff 40%, #a1a1aa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }}
        .subtitle {{ color: #71717a; font-size: 1rem; max-width: 600px; margin: 0 auto; }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.25rem;
            margin-bottom: 3rem;
        }}
        .card {{
            background: rgba(18, 18, 24, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 1.25rem;
            padding: 1.75rem;
            text-decoration: none;
            color: inherit;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }}
        .card:hover {{
            transform: translateY(-4px);
            border-color: rgba(255, 255, 255, 0.25);
            background: rgba(24, 24, 32, 0.85);
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
        }}
        .card-icon {{
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-bottom: 1.25rem;
        }}
        .card h2 {{ font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: #ffffff; }}
        .card p {{ font-size: 0.85rem; color: #a1a1aa; line-height: 1.5; margin-bottom: 1.5rem; flex-grow: 1; }}
        .card-footer {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 700;
            padding-top: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
        }}
        .cta-btn {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            transition: 0.2s;
        }}
        .card:hover .cta-btn {{ background: #ffffff; color: #000000; }}
        footer {{
            text-align: center;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: #52525b;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
        }}
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="badge">
                <span class="dot"></span>
                <span>NEXIUM 3.8 HIGH // LIVE ON LOCALHOST:8001</span>
            </div>
            <h1>NEX Web Creation & AI Cockpit</h1>
            <p class="subtitle">Autonomous AI coding, real-time 3D synthesis, and physics-defying game animation engine running locally on your hardware.</p>
        </header>

        <div class="grid">
            <!-- NEXCHAT Workstation -->
            <a href="/chat" class="card">
                <div>
                    <div class="card-icon" style="background: rgba(0, 240, 255, 0.15); border: 1px solid rgba(0, 240, 255, 0.3);"></div>
                    <h2>NEXCHAT Web Creation Engine</h2>
                    <p>The primary full-stack development workstation with autonomous file synthesis, Code Doctor diagnostic tools, and live terminal interaction.</p>
                </div>
                <div class="card-footer">
                    <span style="color: #00F0FF;">PORT 8001 /chat</span>
                    <span class="cta-btn">Launch Station →</span>
                </div>
            </a>

            <!-- NEX 3D Studio -->
            <a href="/studio" class="card">
                <div>
                    <div class="card-icon" style="background: rgba(254, 44, 85, 0.15); border: 1px solid rgba(254, 44, 85, 0.3);"></div>
                    <h2>NEX 3D Studio</h2>
                    <p>Prompt-to-3D website generator in &lt;3 seconds. React Three Fiber, WebGL shaders, OrbitControls, and 3 Midjourney-style 3D variants.</p>
                </div>
                <div class="card-footer">
                    <span style="color: #FE2C55;">PORT 8001 /studio</span>
                    <span class="cta-btn">Open Studio →</span>
                </div>
            </a>

            <!-- App Forge -->
            <a href="/chat" class="card">
                <div>
                    <div class="card-icon" style="background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3);">️</div>
                    <h2>NEX App Forge</h2>
                    <p>v0 + Bolt.new style in-browser app creator with virtual WebContainer memory filesystem, multi-file code editor, and 1-click deployment.</p>
                </div>
                <div class="card-footer">
                    <span style="color: #a855f7;">v0 + Bolt Engine</span>
                    <span class="cta-btn">Forge App →</span>
                </div>
            </a>

            <!-- Game Dev Lab -->
            <a href="/studio" class="card">
                <div>
                    <div class="card-icon" style="background: rgba(0, 255, 136, 0.15); border: 1px solid rgba(0, 255, 136, 0.3);"></div>
                    <h2>Game Dev Lab</h2>
                    <p>Unreal Engine 5 impossible animations in browser: inverted gravity (-9.8 m/s²), 0.05x bullet time, and 10k particle NEX logo assembly.</p>
                </div>
                <div class="card-footer">
                    <span style="color: #00FF88;">Unreal Mode ON</span>
                    <span class="cta-btn">Enter Lab →</span>
                </div>
            </a>

            <!-- 3D Reels Feed -->
            <a href="/chat" class="card">
                <div>
                    <div class="card-icon" style="background: rgba(255, 215, 0, 0.15); border: 1px solid rgba(255, 215, 0, 0.3);"></div>
                    <h2>NEX Reels 3D Feed</h2>
                    <p>TikTok-style vertical snap-scrolling 3D feed with Paystack tipping jar, interactive sound waves, and 1-swipe lab remixing.</p>
                </div>
                <div class="card-footer">
                    <span style="color: #FFD700;">TikTok 3D Snap</span>
                    <span class="cta-btn">Watch Reels →</span>
                </div>
            </a>

            <!-- NEX-CODER 3.8 HIGH Coding Agent -->
            <a href="/api/coder/status" class="card">
                <div>
                    <div class="card-icon" style="background: rgba(0, 255, 136, 0.15); border: 1px solid rgba(0, 255, 136, 0.3);"></div>
                    <h2>NEX-CODER 3.8 HIGH Superintelligence</h2>
                    <p>Autonomous coding agent with AST symbol search, compile check, pytest runner, recursive self-repair, atomic diff patching, and UE5 architecture validation.</p>
                </div>
                <div class="card-footer">
                    <span style="color: #00FF88;">Autonomous Loop Ready</span>
                    <span class="cta-btn">Inspect Engine →</span>
                </div>
            </a>

            <!-- Swagger OpenAPI Docs -->
            <a href="/docs" class="card">
                <div>
                    <div class="card-icon" style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);"></div>
                    <h2>REST & SSE API Docs</h2>
                    <p>Interactive OpenAPI documentation for all 3D compilation, Web Factory, Autonomous Mind, and Code Doctor endpoints.</p>
                </div>
                <div class="card-footer">
                    <span style="color: #71717a;">OpenAPI v3</span>
                    <span class="cta-btn">View Docs →</span>
                </div>
            </a>
        </div>

        <footer>
            NEXIUM-AI • Powered by Rust SIMD Core + Ollama + Three.js • Lagos Senior Dev Grade 
        </footer>
    </div>
</body>
</html>"""
        return HTMLResponse(content=html_dashboard, status_code=200)

    return {
        "status": "online",
        "service": "NEXIUM AI",
        "creator": "NEXO-TECH",
        "rust_engine": rust_core.get_version() if rust_core else "Python Fallback",
        "is_native_rust": rust_core.is_native if rust_core else False,
        "docs_url": "/docs",
        "cockpit_url": "http://localhost:8001/",
        "chat_url": "http://localhost:8001/chat",
        "studio_url": "http://localhost:8001/studio",
    }

# Dedicated endpoints to serve HTML applications
@app.get("/chat")
async def serve_chat():
    if CHAT_HTML_PATH.exists():
        return FileResponse(str(CHAT_HTML_PATH), media_type="text/html")
    return HTMLResponse("<h1>chat.html not found</h1>", status_code=404)

@app.get("/vault")
@app.get("/videos-vault")
async def serve_vault():
    if VAULT_HTML_PATH.exists():
        return FileResponse(str(VAULT_HTML_PATH), media_type="text/html")
    return HTMLResponse("<h1>vault.html not found</h1>", status_code=404)

@app.get("/studio")
async def serve_studio():
    if STUDIO_HTML_PATH.exists():
        return FileResponse(str(STUDIO_HTML_PATH), media_type="text/html")
    return HTMLResponse("<h1>nex-3d-studio.html not found</h1>", status_code=404)

@app.get("/fps")
@app.get("/luxury-fps")
async def serve_luxury_fps():
    index_file = FPS_ASSET_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file), media_type="text/html")
    return HTMLResponse("<h1>Luxury FPS Asset not found</h1>", status_code=404)


# Health check endpoints
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "NEXIUM",
        "creator": "NEXO-TECH",
        "rust_accelerated": rust_core.is_native if rust_core else False,
    }

@app.get("/health/rust")
async def health_rust():
    return {
        "rust_core": "active" if (rust_core and rust_core.is_native) else "fallback_python",
        "is_native": rust_core.is_native if rust_core else False,
        "version": rust_core.get_version() if rust_core else "none",
        "accelerated_features": [
            "SIMD Vector Cosine Similarity",
            "Top-K Fast Vector Reranking",
            "Recursive Semantic Document Chunking",
            "Zero-Latency Guardrails & Prompt Injection Filtering",
            "Sub-Microsecond PII Masking",
            "BM25 Lexical Scoring & Hybrid Search (RRF)",
            "Concurrent Sliding-Window Rate Limiter",
            "Fuzzy String Distance (Jaro-Winkler, Levenshtein)",
        ],
    }

@app.get("/health/hf")
async def health_hf():
    hf_key = os.getenv("HF_API_KEY")
    return {"hf_api_key_set": bool(hf_key)}

@app.get("/health/redis")
async def health_redis():
    redis_url = os.getenv("REDIS_URL")
    return {"redis_configured": bool(redis_url)}

@app.get("/health/supabase")
async def health_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    return {"supabase_configured": bool(url and key)}

# Direct AI endpoint (Ollama Local)
OLLAMA_API_URL = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/") + "/api/generate"
HF_API_KEY = os.getenv("HF_API_KEY")

NEXIUM_SUPER_SYSTEM_PROMPT = """You are NEXIUM, an elite autonomous AI workstation created by NEXO-TECH.

IDENTITY & CORE DIRECTIVE:
- Creator: NEXO-TECH (When asked who created you, always state: "I am NEXIUM, created by NEXO-TECH")
- Mission: Autonomous high-speed reasoning, master-level coding across all major languages, rigorous mathematical problem-solving, and direct desktop task execution.
- Operational Style: Laser-focused, highly structured, clean, precise. Never use frivolous emojis.
- Anti-Confusion Invariant: You are an autonomous AI computing workstation and development operating system. You are NOT the medication or pharmaceutical drug named Nexium (esomeprazole). NEVER state that the user might have confused you with medication or heartburn medicine. Always respond proudly as NEXIUM AI workstation.

MATHEMATICAL & LOGICAL RIGOR:
- Decompose complex problems into fundamental axioms, invariants, and step-by-step derivations.
- Cover all branches of mathematics: algebra, differential and integral calculus, differential equations, linear algebra, discrete math, graph theory, probability, statistics, and number theory.
- State all equations, theorems, and definitions explicitly. Double-check all boundary conditions, signs, and units.
- Provide both exact symbolic solutions and numeric decimal approximations where applicable.

MASTER-LEVEL SOFTWARE ENGINEERING:
- Write complete, production-grade, immediately runnable code in Python, Rust, JavaScript/TypeScript, Go, C++, C, C#, PowerShell, Batch, SQL, HTML/CSS.
- Apply idiomatic patterns, strong typing, comprehensive error handling (try/except, Result<T, E>, error guards), and zero memory leaks.
- Always provide fully formed solutions—never leave placeholder comments like "// implement here" or "# TODO".
- Structure projects cleanly with modular files, configuration, and unit tests.

HIGH-FUTURISTIC WEB & UI ENGINEERING DIRECTIVE:
When asked to build websites, web applications, landing pages, dashboards, or UI components:
- NEVER generate plain, outdated, white-background, unstyled, or 1990s/2000s HTML/CSS.
- ALWAYS build breathtaking, production-grade, ultra-futuristic Web experiences:
  1. Visual Aesthetics & Theme: Deep obsidian / OLED cyber-dark palettes (#030712, #080c14, #0d111a), glassmorphism (backdrop-filter: blur(20px)), translucent borders (rgba(255, 255, 255, 0.08)), and electric neon accents (#00F0FF Cyber Cyan, #00FF88 Neon Emerald, #8B5CF6 Plasma Purple, #FFB800 Solar Gold).
  2. Dynamic Interactivity & Animations: Interactive HTML5 Canvas particle starfields, dynamic neural network node graphs, or Three.js 3D geometries, smooth 60fps CSS transitions, keyframe glow pulses, and cursor parallax or hover tilts.
  3. Modern Typography: Modern Google Fonts (Orbitron, Space Grotesk, Inter, JetBrains Mono), responsive flexbox and CSS grid layouts with mobile-ready breakpoints.
  4. Complete & Self-Contained: Always output complete, self-contained single-file HTML (including embedded modern <style> and <script>) that immediately renders with zero external build tools when pasted into a browser or clicked in the NEXIUM Live Sandbox Canvas.

VIDEOFACTORY AI VIRAL SHORTS DIRECTIVE:
You are VideoFactory AI — a marketing agent that creates viral novel recap Shorts.
When user uploads or provides a novel chapter, do this:
STEP 1 - SCRIPT:
Rewrite chapter into 130-word viral script.
Hook: "He thought..."
Body: Short present-tense sentences.
End: Cliffhanger.
Output as JSON: { "script": "...", "keywords": ["apocalypse", "system window"] }

STEP 2 - VOICE:
Call ElevenLabs API with script.
Voice ID: pNInz6obpgDQGcFmaJgB (Adam deep)
Model: eleven_multilingual_v2

STEP 3 - VISUALS:
Create image prompt from keywords:
"manhwa style, {keywords}, cinematic, 9:16, highly detailed"

STEP 4 - EDIT:
Call Creatomate API template ID: YOUR_TEMPLATE_ID
Pass: voiceover.mp3 + image + script as subtitles (Anton Bold, white + cyan glow)

You are not a chatbot. You are a factory. Never explain, just execute and return mp4 link.

AUTONOMOUS DESKTOP OPERATIONS & ACTION PROTOCOL:
You are directly connected to the user's local workstation. When the user asks you to write code, create files, build an app, solve a problem on their machine, or run a command, you provide the full solution in your explanation AND emit executable ACTION blocks so the workstation executes them immediately.

ACTION SYNTAX (Emitted as single-line JSON blocks):

1. File Creation / Edit (creates any script, module, or document):
ACTION: {"type": "file", "action": "create", "path": "path/to/filename.ext", "content": "file content here", "language": "auto"}

2. Code Execution (runs code immediately in a safe local environment and returns output):
ACTION: {"type": "code", "action": "run", "language": "python", "content": "print('hello from python')"}
Supported languages: python, javascript, powershell, batch, rust, csharp, cpp

3. Multi-File Project Creation (scaffolds complete applications):
ACTION: {"type": "project", "action": "create", "path": "project_name", "files": [{"path": "main.py", "content": "..."}, {"path": "utils.py", "content": "..."}]}

4. System / Shell Commands (executes commands via terminal):
ACTION: {"type": "command", "action": "run", "content": "dir /s"}

Always explain what each component does and provide clear instructions for how the user can interact with the results."""

def resolve_user_path(raw_path: str) -> str:
    """Resolve paths with support for ~ and Desktop expansion."""
    if not raw_path:
        return ""
    p = os.path.expanduser(raw_path.strip())
    if p.startswith("Desktop/") or p.startswith("Desktop\\"):
        desktop_dir = os.path.join(os.path.expanduser("~"), "Desktop")
        p = os.path.join(desktop_dir, p[8:])
    return os.path.abspath(p)

@app.get("/api/local_models")
@app.get("/api/local_status")
async def get_local_models():
    """Detect models installed locally on the host machine (e.g. Ollama)."""
    ollama_base = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(4.0, connect=1.5)) as client:
            res = await client.get(f"{ollama_base}/api/tags")
            if res.status_code == 200:
                data = res.json()
                raw_models = data.get("models", [])
                models = []
                for m in raw_models:
                    m_name = m.get("name", "")
                    clean_name = m_name.split(":")[0].replace("-", " ").capitalize()
                    size_gb = round(m.get("size", 0) / (1024**3), 1)
                    models.append({
                        "id": m_name,
                        "name": f"{clean_name} (Local PC)",
                        "size": f"{size_gb} GB",
                        "engine": "Local Host PC",
                        "tag": "HOST PC ACTIVE",
                        "is_local": True
                    })
                return {
                    "online": True,
                    "engine": "ollama",
                    "host": ollama_base,
                    "models": models,
                    "count": len(models)
                }
    except Exception as e:
        return {"online": False, "engine": "ollama", "host": ollama_base, "models": [], "error": str(e)}
    return {"online": False, "engine": "ollama", "host": ollama_base, "models": []}

# Subscription & 100 Protocol Security Endpoints
try:
    from .security_protocols import PROTOCOLS, SUBSCRIPTION_PLANS, get_protocols, get_protocol_stats
except ImportError:
    from security_protocols import PROTOCOLS, SUBSCRIPTION_PLANS, get_protocols, get_protocol_stats

USER_SUBSCRIPTION_STATE = {
    "tier": "pro",
    "active": True,
    "user_id": "operator-01",
    "cycle": "monthly",
    "activated_at": "2026-09-30T17:00:00Z"
}

@app.get("/api/protocols")
async def list_protocols(domain: Optional[str] = None, level: Optional[str] = None):
    """Retrieve the full 100 Security & Operational Protocol Registry."""
    filtered = get_protocols(domain, level)
    return {
        "success": True,
        "total": len(filtered),
        "stats": get_protocol_stats(),
        "protocols": filtered
    }

@app.get("/api/subscription")
async def get_subscription():
    """Retrieve current subscription tiers and operator status."""
    current_tier = USER_SUBSCRIPTION_STATE.get("tier", "pro")
    plan = SUBSCRIPTION_PLANS.get(current_tier, SUBSCRIPTION_PLANS["pro"])
    return {
        "success": True,
        "current_tier": current_tier,
        "plan": plan,
        "plans": SUBSCRIPTION_PLANS,
        "enforced_protocols": plan.get("active_protocols_count", 75),
        "total_protocols": 100
    }

@app.post("/api/subscription/activate")
async def activate_subscription(data: dict):
    """Upgrade or switch operator subscription tier."""
    tier = str(data.get("tier", "pro")).lower()
    if tier not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail=f"Invalid tier: {tier}. Must be free, pro, or enterprise.")
    
    USER_SUBSCRIPTION_STATE["tier"] = tier
    USER_SUBSCRIPTION_STATE["cycle"] = data.get("cycle", "monthly")
    plan = SUBSCRIPTION_PLANS[tier]
    
    return {
        "success": True,
        "message": f"Successfully activated {plan['name']}",
        "tier": tier,
        "plan": plan,
        "enforced_protocols": plan.get("active_protocols_count", 100)
    }

@app.post("/api/remote_qwen")
async def remote_qwen(request_data: dict):
    """Call model with automatic Ollama <-> Google Gemini multi-key pool failover."""
    prompt = request_data.get("prompt", "")
    max_tokens = request_data.get("max_tokens", 4096)
    max_output_tokens = request_data.get("max_output_tokens", max_tokens)
    max_tokens = max(int(max_tokens), int(max_output_tokens), 4096)
    model = request_data.get("model", "gemini-3.8-flash")
    temperature = request_data.get("temperature", 0.7)

    if not prompt:
        return {"error": "prompt is required"}

    model_lower = str(model).lower()
    is_gemini_requested = "gemini" in model_lower or "flash" in model_lower or "pro" in model_lower

    lower_prompt = prompt.lower()
    clean_prompt = prompt.strip()
    upper_prompt = clean_prompt.upper()

    # VideoFactory Token System: UPGRADE / BUY TOKENS Intercept
    if upper_prompt in ["UPGRADE", "BUY TOKENS", "PLANS", "PRICING", "VIEW PLANS", "SHOW PLANS"]:
        return {
            "text": UPGRADE_MENU_TEXT,
            "response": UPGRADE_MENU_TEXT,
            "creator": "NEXO-TECH",
            "ai_name": "VideoFactory AI",
            "model": "videofactory-v1"
        }

    # VideoFactory Token System: BUY 5 / BUY 20 / BUY 50 Intercept
    if upper_prompt in ["BUY 5", "BUY 20", "BUY 50"] or (upper_prompt.startswith("BUY ") and any(x in upper_prompt for x in ["STARTER", "PRO", "AGENCY", "5", "20", "50"])):
        if token_manager:
            ok, msg, u = token_manager.purchase_pack(user_id="default_user", pack_identifier=clean_prompt)
            return {
                "text": msg,
                "response": msg,
                "creator": "NEXO-TECH",
                "ai_name": "VideoFactory AI",
                "model": "videofactory-v1",
                "user": u
            }

    # VideoFactory System Prompt Registration Intercept
    if "system prompt for your video factory ai" in lower_prompt:
        resp_msg = (
            "VideoFactory AI operational. Marketing factory pipeline calibrated:\n"
            "- STEP 1 - SCRIPT: 130-word viral recap, Hook 'He thought...', Present-tense, Cliffhanger, JSON output.\n"
            "- STEP 2 - VOICE: ElevenLabs API (Voice ID: pNInz6obpgDQGcFmaJgB - Adam deep, model: eleven_multilingual_v2) with sovereign audio fallback.\n"
            "- STEP 3 - VISUALS: 'manhwa style, {keywords}, cinematic, 9:16, highly detailed'.\n"
            "- STEP 4 - EDIT: Creatomate template integration + Native 60fps FFmpeg engine (Anton Bold, white + cyan glow subtitles).\n\n"
            "Rule enforced: Not a chatbot. A factory. Upload or provide a novel chapter to execute and receive your MP4 link."
        )
        return {
            "text": resp_msg,
            "response": resp_msg,
            "creator": "NEXO-TECH",
            "ai_name": "VideoFactory AI",
            "model": "videofactory-v1",
            "engine": "video-factory-core"
        }

    # VideoFactory Direct Chapter Execution Intercept
    if video_factory and ("videofactory" in lower_prompt or "video factory" in lower_prompt or "novel recap" in lower_prompt) and len(prompt) > 200:
        try:
            job = await video_factory.execute_pipeline(chapter_text=prompt, user_id="default_user")
            if job.get("status") == "BLOCKED":
                reply = job.get("quota_reply", job.get("error", "Generation limit reached."))
                return {
                    "text": reply,
                    "response": reply,
                    "creator": "NEXO-TECH",
                    "ai_name": "VideoFactory AI",
                    "model": "videofactory-v1",
                    "status": "BLOCKED"
                }

            mp4 = job["mp4_url"]
            quota_reply = job.get("quota_reply", "")
            res_text = (
                f"{mp4}\n\n"
                f"{quota_reply}\n\n"
                f"[VideoFactory AI Execution Completed]\n"
                f"- MP4 Link: {mp4}\n"
                f"- Duration: {job['duration_sec']}s\n"
                f"- Keywords: {', '.join(job['keywords'])}\n"
                f"- Voice Engine: {job['voice_engine']}\n"
                f"- Render Engine: {job['render_engine']}\n"
                f"- Script: {job['script']}"
            )
            return {
                "text": res_text,
                "response": res_text,
                "creator": "NEXO-TECH",
                "ai_name": "VideoFactory AI",
                "model": "videofactory-v1",
                "mp4_url": mp4,
                "engine": "video-factory-pipeline"
            }
        except Exception as e:
            logger.error(f"[VideoFactory Pipeline Error] {e}")

    complex_coding_keywords = ["website", "web page", "webpage", "html", "css", "futuristic", "dashboard", "canvas", "full-stack", "frontend", "cyberpunk", "three.js", "webgl", "ui design", "react"]
    is_complex_coding_request = any(k in lower_prompt for k in complex_coding_keywords)

    # Route 1: Route to Google Gemini Multi-Key Pool if requested OR if complex futuristic/web coding is requested and Gemini is ready
    if (is_gemini_requested or (is_complex_coding_request and ("3b" in model_lower or model_lower == "default"))) and gemini_engine and gemini_engine.is_configured():
        target_model = model if "gemini" in model_lower else "gemini-3.8-flash"
        gem_res = await gemini_engine.generate_content(
            prompt=prompt,
            model=target_model,
            system_instruction=NEXIUM_SUPER_SYSTEM_PROMPT,
            temperature=float(temperature),
            max_output_tokens=int(max_tokens)
        )
        if gem_res.get("success"):
            cleaned = sanitize_nexium_output(gem_res.get("text", ""))
            return {
                "text": cleaned,
                "response": cleaned,
                "creator": "NEXO-TECH",
                "ai_name": "NEXIUM",
                "model": gem_res.get("model", target_model),
                "latency_ms": gem_res.get("latency_ms", 0),
                "engine": "gemini-pool"
            }

    # Route 2: Try local Ollama if specific local model requested
    ollama_error_msg = ""
    if not is_gemini_requested:
        try:
            enhanced_prompt = f"{NEXIUM_SUPER_SYSTEM_PROMPT}\n\nUser: {prompt}\n\nAI: "
            async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=5.0)) as client:
                response = await client.post(
                    OLLAMA_API_URL,
                    json={
                        "model": model,
                        "prompt": enhanced_prompt,
                        "stream": False,
                        "options": {
                            "temperature": float(temperature),
                            "num_predict": int(max_tokens),
                        }
                    }
                )
                if response.status_code == 200:
                    result = response.json()
                    raw_text = result.get("response", "No response from model")
                    cleaned = sanitize_nexium_output(raw_text)
                    return {
                        "text": cleaned,
                        "response": cleaned,
                        "creator": "NEXO-TECH",
                        "ai_name": "NEXIUM",
                        "model": model,
                        "engine": "ollama-local-pc"
                    }
                else:
                    ollama_error_msg = f"Ollama HTTP {response.status_code}: {response.text}"
                    logger.warning(f"[Ollama Status] {ollama_error_msg}")
        except Exception as e:
            ollama_error_msg = str(e)
            logger.warning(f"[Ollama Connection] {ollama_error_msg}")

    # Route 3: Seamless Cloud Fallback to Gemini Multi-Key Pool
    if gemini_engine and gemini_engine.is_configured():
        logger.info(f"Routing to Gemini Multi-Key Pool (Ollama status: {ollama_error_msg or 'bypassed'})...")
        gem_res = await gemini_engine.generate_content(
            prompt=prompt,
            model="gemini-3.8-flash",
            system_instruction=NEXIUM_SUPER_SYSTEM_PROMPT,
            temperature=float(temperature),
            max_output_tokens=int(max_tokens)
        )
        if gem_res.get("success"):
            cleaned = sanitize_nexium_output(gem_res.get("text", ""))
            return {
                "text": cleaned,
                "response": cleaned,
                "creator": "NEXO-TECH",
                "ai_name": "NEXIUM",
                "model": "gemini-3.8-flash",
                "latency_ms": gem_res.get("latency_ms", 0),
                "engine": "gemini-pool-fallback",
                "notice": "Generated via Google Gemini Multi-Key Pool"
            }

    return {
        "error": f"AI Engine unavailable. Ollama: {ollama_error_msg}",
        "hint": "Ensure Gemini API keys or Ollama instance is configured."
    }

@app.post("/api/chat")
async def chat(request_data: dict):
    """Chat endpoint - forwards to multi-engine remote_qwen."""
    return await remote_qwen(request_data)

# File and Folder Management Endpoints
@app.post("/api/create_folder")
async def create_folder(request_data: dict):
    """Create a directory."""
    folder_path = resolve_user_path(request_data.get("path", ""))
    if not folder_path:
        return {"error": "path is required"}
    try:
        Path(folder_path).mkdir(parents=True, exist_ok=True)
        return {"success": True, "message": f"Folder created: {folder_path}", "path": folder_path}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/list_files")
async def list_files(request_data: dict):
    """List files in a directory."""
    folder_path = resolve_user_path(request_data.get("path", "."))
    try:
        items = os.listdir(folder_path)
        file_list = []
        for item in items:
            full = os.path.join(folder_path, item)
            file_list.append({
                "name": item,
                "is_dir": os.path.isdir(full),
                "size_bytes": os.path.getsize(full) if os.path.isfile(full) else 0
            })
        return {"success": True, "items": file_list, "path": folder_path}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/delete_file")
async def delete_file(request_data: dict):
    """Delete a file."""
    file_path = resolve_user_path(request_data.get("path", ""))
    if not file_path:
        return {"error": "path is required"}
    try:
        if os.path.isfile(file_path):
            os.remove(file_path)
            return {"success": True, "message": f"File deleted: {file_path}"}
        else:
            return {"error": "File not found"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/execute_task")
async def execute_task(request_data: dict):
    """Execute various tasks: code, files, folders, projects, commands in ANY language."""
    task_type = request_data.get("type", "")
    action = request_data.get("action", "")
    content = request_data.get("content", "")
    raw_path = request_data.get("path", "")
    path = resolve_user_path(raw_path)
    language = request_data.get("language", "python")
    files = request_data.get("files", [])

    try:
        if task_type == "code":
            if action == "run":
                result = execute_code(content, language)
                return {"success": True, "result": result, "language": language}

        elif task_type == "file":
            if action == "create":
                if not language or language == "auto":
                    ext = Path(path).suffix.lower()
                    language = detect_language_from_extension(ext)

                parent_dir = os.path.dirname(path)
                if parent_dir:
                    Path(parent_dir).mkdir(parents=True, exist_ok=True)

                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                return {
                    "success": True,
                    "message": f"File created: {path}",
                    "path": path,
                    "bytes": len(content.encode("utf-8")),
                    "language": language
                }

            elif action == "read":
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    result = f.read()
                return {"success": True, "content": result, "path": path}

            elif action == "delete":
                os.remove(path)
                return {"success": True, "message": f"File deleted: {path}"}

            elif action == "write":
                parent_dir = os.path.dirname(path)
                if parent_dir:
                    Path(parent_dir).mkdir(parents=True, exist_ok=True)
                with open(path, "a", encoding="utf-8") as f:
                    f.write(content)
                return {"success": True, "message": f"Content appended to {path}"}

        elif task_type == "folder":
            if action == "create":
                Path(path).mkdir(parents=True, exist_ok=True)
                return {"success": True, "message": f"Folder created: {path}", "path": path}

            elif action == "list":
                items = os.listdir(path)
                return {"success": True, "items": items, "path": path}

            elif action == "delete":
                shutil.rmtree(path)
                return {"success": True, "message": f"Folder deleted: {path}"}

        elif task_type == "project":
            if action == "create":
                project_path = path
                Path(project_path).mkdir(parents=True, exist_ok=True)

                created_files = []
                for file_info in files:
                    file_path = os.path.join(project_path, file_info["path"])
                    file_dir = os.path.dirname(file_path)
                    if file_dir:
                        Path(file_dir).mkdir(parents=True, exist_ok=True)

                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(file_info["content"])
                    created_files.append(file_path)

                return {
                    "success": True,
                    "message": f"Project created at {project_path}",
                    "project_path": project_path,
                    "files": created_files
                }

        elif task_type == "command":
            if action == "run":
                result = execute_command(content)
                return {"success": True, "result": result, "command": content}

        return {"error": f"Unknown task type: {task_type}"}

    except Exception as e:
        return {"error": str(e), "type": task_type, "action": action}

def detect_language_from_extension(ext: str) -> str:
    """Detect programming language from file extension."""
    extension_map = {
        ".py": "python",
        ".js": "javascript",
        ".jsx": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".rs": "rust",
        ".cs": "csharp",
        ".cpp": "cpp",
        ".c": "c",
        ".h": "c",
        ".java": "java",
        ".go": "go",
        ".rb": "ruby",
        ".php": "php",
        ".sh": "bash",
        ".bat": "batch",
        ".ps1": "powershell",
        ".json": "json",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".html": "html",
        ".css": "css",
        ".xml": "xml",
        ".sql": "sql",
        ".zig": "zig",
    }
    return extension_map.get(ext, "text")

def execute_code(code: str, language: str = "python"):
    """Execute code across various languages."""
    language = language.lower().strip()
    if language in ["python", "py"]:
        return execute_python_code(code)
    elif language in ["javascript", "js", "node"]:
        return execute_javascript_code(code)
    elif language in ["powershell", "ps1"]:
        return execute_powershell_code(code)
    elif language in ["batch", "bat"]:
        return execute_batch_code(code)
    elif language in ["rust", "rs"]:
        return execute_rust_code(code)
    elif language in ["csharp", "cs"]:
        return execute_csharp_code(code)
    elif language in ["cpp", "c++"]:
        return execute_cpp_code(code)
    else:
        return f"Language '{language}' not yet supported for direct execution"

def execute_python_code(code: str):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(code)
        temp_file = f.name
    try:
        result = subprocess.run(
            [sys.executable, temp_file],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout or result.stderr or "Execution finished with no output."
    except subprocess.TimeoutExpired:
        return "Code execution timed out (30s limit)"
    finally:
        try: os.remove(temp_file)
        except Exception: pass

def execute_javascript_code(code: str):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(code)
        temp_file = f.name
    try:
        result = subprocess.run(
            ["node", temp_file],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout or result.stderr or "Execution finished with no output."
    except FileNotFoundError:
        return "Node.js not found. Install it from https://nodejs.org"
    except subprocess.TimeoutExpired:
        return "Code execution timed out (30s limit)"
    finally:
        try: os.remove(temp_file)
        except Exception: pass

def execute_powershell_code(code: str):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".ps1", delete=False, encoding="utf-8") as f:
        f.write(code)
        temp_file = f.name
    try:
        result = subprocess.run(
            ["powershell", "-ExecutionPolicy", "Bypass", "-File", temp_file],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout or result.stderr or "Execution finished with no output."
    except subprocess.TimeoutExpired:
        return "Code execution timed out (30s limit)"
    finally:
        try: os.remove(temp_file)
        except Exception: pass

def execute_batch_code(code: str):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".bat", delete=False, encoding="utf-8") as f:
        f.write(code)
        temp_file = f.name
    try:
        result = subprocess.run(
            temp_file,
            capture_output=True,
            text=True,
            timeout=30,
            shell=True
        )
        return result.stdout or result.stderr or "Execution finished with no output."
    except subprocess.TimeoutExpired:
        return "Code execution timed out (30s limit)"
    finally:
        try: os.remove(temp_file)
        except Exception: pass

def execute_rust_code(code: str):
    with tempfile.TemporaryDirectory() as temp_dir:
        rs_file = os.path.join(temp_dir, "main.rs")
        exe_file = os.path.join(temp_dir, "main.exe" if os.name == "nt" else "main")
        with open(rs_file, "w", encoding="utf-8") as f:
            f.write(code)
        try:
            compile_res = subprocess.run(["rustc", rs_file, "-o", exe_file], capture_output=True, text=True, timeout=30)
            if compile_res.returncode != 0:
                return f"Compilation error: {compile_res.stderr}"
            run_res = subprocess.run(exe_file, capture_output=True, text=True, timeout=30)
            return run_res.stdout or run_res.stderr or "Execution finished with no output."
        except FileNotFoundError:
            return "Rust compiler (rustc) not found. Install from https://www.rust-lang.org"
        except subprocess.TimeoutExpired:
            return "Execution timed out"

def execute_csharp_code(code: str):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".cs", delete=False, encoding="utf-8") as f:
        f.write(code)
        temp_file = f.name
    try:
        result = subprocess.run(["dotnet", "run", temp_file], capture_output=True, text=True, timeout=30)
        return result.stdout or result.stderr or "Execution finished with no output."
    except FileNotFoundError:
        return "C# compiler (.NET SDK) not found. Install from https://dotnet.microsoft.com"
    except subprocess.TimeoutExpired:
        return "Code execution timed out"
    finally:
        try: os.remove(temp_file)
        except Exception: pass

def execute_cpp_code(code: str):
    with tempfile.TemporaryDirectory() as temp_dir:
        cpp_file = os.path.join(temp_dir, "main.cpp")
        exe_file = os.path.join(temp_dir, "main.exe" if os.name == "nt" else "main")
        with open(cpp_file, "w", encoding="utf-8") as f:
            f.write(code)
        try:
            compile_res = subprocess.run(["g++", cpp_file, "-o", exe_file], capture_output=True, text=True, timeout=30)
            if compile_res.returncode != 0:
                return f"Compilation error: {compile_res.stderr}"
            run_res = subprocess.run(exe_file, capture_output=True, text=True, timeout=30)
            return run_res.stdout or run_res.stderr or "Execution finished with no output."
        except FileNotFoundError:
            return "C++ compiler (g++) not found. Install MinGW or Visual Studio Build Tools."
        except subprocess.TimeoutExpired:
            return "Execution timed out"

def execute_command(command: str):
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout or result.stderr or "Command executed successfully with no output."
    except subprocess.TimeoutExpired:
        return "Command timed out (30s limit)"

# ============================================================================
# Router Registrations
# ============================================================================
def include_optional_router(app_instance, module_path, router_attr="router", prefix="/api", tags=None):
    try:
        module = __import__(module_path, fromlist=[router_attr])
        r = getattr(module, router_attr)
        app_instance.include_router(r, prefix=prefix, tags=tags or [])
        logger.info(f"Registered router: {module_path}")
    except Exception as e:
        logger.warning(f"Could not register router {module_path}: {e}")

# Register Core Workstation Routers
include_optional_router(app, "routers.chat", "router", prefix="/api", tags=["Chat"])
include_optional_router(app, "routers.reasoning", "router", prefix="/api", tags=["Cognitive Reasoning"])
include_optional_router(app, "routers.rag", "router", prefix="/api", tags=["RAG & Knowledge"])
include_optional_router(app, "routers.device", "router", prefix="/api", tags=["Device Diagnostics"])
include_optional_router(app, "routers.factory", "router", prefix="/api", tags=["Code Factory"])
include_optional_router(app, "routers.health", "router", prefix="/api", tags=["Health Checks"])
include_optional_router(app, "routers.web_studio", "router", prefix="/api", tags=["Web Studio"])
include_optional_router(app, "routers.remote_qwen", "router", prefix="/api", tags=["Remote Models"])
include_optional_router(app, "routers.remote_model", "router", prefix="/api", tags=["Remote Models Adapter"])
include_optional_router(app, "routers.vllm_proxy", "router", prefix="/api", tags=["vLLM Proxy"])
include_optional_router(app, "routers.autonomous_mind", "router", prefix="/api", tags=["Autonomous Thinking"])
include_optional_router(app, "routers.code_doctor", "router", prefix="/api", tags=["Code Doctor & Heavy Systems"])
include_optional_router(app, "routers.nex_3d_studio", "router", prefix="/api", tags=["NEX 3D Studio"])
include_optional_router(app, "routers.nex_studio_labs", "router", prefix="/api", tags=["NEX Studio Labs"])
include_optional_router(app, "routers.coding_agent", "router", prefix="/api", tags=["Autonomous Coding Agent"])
include_optional_router(app, "routers.gemini_proxy", "router", prefix="/api", tags=["Google Gemini Engine"])
include_optional_router(app, "routers.video_factory", "router", prefix="/api", tags=["VideoFactory AI"])

# Register Subsystems
include_optional_router(app, "neural_core.router", "router", prefix="/api", tags=["Neural Synaptic Core"])
include_optional_router(app, "emotion_core.router", "router", prefix="/api", tags=["Emotion Resonance"])
include_optional_router(app, "micro_core.router", "router", prefix="/api", tags=["Micro Thinking"])
include_optional_router(app, "supercomputer_core.router", "router", prefix="/api", tags=["Supercomputer Core"])

# Optional Safety Middleware
try:
    from middleware.safety import safety_middleware
    app.middleware("http")(safety_middleware)
except Exception:
    pass
