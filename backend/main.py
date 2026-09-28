import os
import sys
import shutil
import subprocess
import tempfile
import logging
from pathlib import Path
from fastapi import FastAPI, Request
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
CSS_PATH = PROJECT_ROOT / "css"

try:
    from .rust_engine import engine as rust_core
except ImportError:
    try:
        from rust_engine import engine as rust_core
    except ImportError:
        rust_core = None

app = FastAPI(title="NEXIUM AI - Autonomous Workstation", version="3.0.0")

# Mount CSS directory if it exists
if CSS_PATH.exists():
    app.mount("/css", StaticFiles(directory=str(CSS_PATH)), name="css")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
                    <div class="card-icon" style="background: rgba(0, 240, 255, 0.15); border: 1px solid rgba(0, 240, 255, 0.3);">💬</div>
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
                    <div class="card-icon" style="background: rgba(254, 44, 85, 0.15); border: 1px solid rgba(254, 44, 85, 0.3);">⚡</div>
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
                    <div class="card-icon" style="background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3);">🛠️</div>
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
                    <div class="card-icon" style="background: rgba(0, 255, 136, 0.15); border: 1px solid rgba(0, 255, 136, 0.3);">🎮</div>
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
                    <div class="card-icon" style="background: rgba(255, 215, 0, 0.15); border: 1px solid rgba(255, 215, 0, 0.3);">📱</div>
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
                    <div class="card-icon" style="background: rgba(0, 255, 136, 0.15); border: 1px solid rgba(0, 255, 136, 0.3);">🤖</div>
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
                    <div class="card-icon" style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);">📖</div>
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
            NEXIUM-AI • Powered by Rust SIMD Core + Ollama + Three.js • Lagos Senior Dev Grade ⚡
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

@app.get("/studio")
async def serve_studio():
    if STUDIO_HTML_PATH.exists():
        return FileResponse(str(STUDIO_HTML_PATH), media_type="text/html")
    return HTMLResponse("<h1>nex-3d-studio.html not found</h1>", status_code=404)


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
OLLAMA_API_URL = os.getenv("OLLAMA_HOST", "http://localhost:11434") + "/api/generate"
HF_API_KEY = os.getenv("HF_API_KEY")

NEXIUM_SUPER_SYSTEM_PROMPT = """You are NEXIUM, an elite autonomous AI workstation created by NEXO-TECH.

IDENTITY & CORE DIRECTIVE:
- Creator: NEXO-TECH (When asked who created you, always state: "I am NEXIUM, created by NEXO-TECH")
- Mission: Autonomous high-speed reasoning, master-level coding across all major languages, rigorous mathematical problem-solving, and direct desktop task execution.
- Operational Style: Laser-focused, highly structured, clean, precise. Never use frivolous emojis.

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

@app.post("/api/remote_qwen")
async def remote_qwen(request_data: dict):
    """Call local Ollama model with autonomous thinking and action execution."""
    prompt = request_data.get("prompt", "")
    max_tokens = request_data.get("max_tokens", 2048)
    model = request_data.get("model", "qwen2.5:3b-instruct")
    temperature = request_data.get("temperature", 0.7)

    if not prompt:
        return {"error": "prompt is required"}

    enhanced_prompt = f"{NEXIUM_SUPER_SYSTEM_PROMPT}\n\nUser: {prompt}\n\nAI: "

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
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
                text = result.get("response", "No response from model")
                return {"text": text, "creator": "NEXO-TECH", "ai_name": "NEXIUM", "model": model}
            else:
                return {"error": f"Ollama error: {response.status_code}", "details": response.text}
    except Exception as e:
        return {
            "error": f"Connection to Ollama failed: {str(e)}",
            "hint": "Ensure Ollama is running locally via 'ollama serve' or configure Ollama Host URL."
        }

@app.post("/api/chat")
async def chat(request_data: dict):
    """Chat endpoint - forwards to remote_qwen."""
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
