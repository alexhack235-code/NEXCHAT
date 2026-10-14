NEXIUM - Quick Start
=====================

This file describes quick startup commands and how to run NEXIUM locally on Windows.

Prerequisites
-------------
- Ollama installed and configured (`ollama` on PATH).
- Python 3.12 virtual environment at `\.venv` in project root.
- Dependencies installed in `backend/requirements.txt` (activate venv and `pip install -r backend/requirements.txt`).

Recommended quick start (PowerShell)
-----------------------------------
Open a PowerShell window and run:

```powershell
cd C:\Users\Baha\Desktop\NEXIUM
# (optional) set HF cache to project root to avoid cross-drive cache issues
$env:HF_HOME = "."

# Start ollama (if not already running) in a new window
Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","ollama serve"

# Start the backend (in a new window) - make sure the venv exists
Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","cd backend; .\\..\\.venv\\Scripts\\Activate.ps1; ..\\.venv\\Scripts\\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

# Open UI
Start-Sleep -Seconds 3
start "http://localhost:8001/chat-gpt-style.html"
```

One-click Start
---------------
Double-click `start-nexium.bat` or run `start-nexium.ps1` from PowerShell (may require setting execution policy for the current session):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\start-nexium.ps1
```

Notes & Troubleshooting
-----------------------
- If `ollama serve` fails with `Only one usage of each socket address`, Ollama is already running; skip starting it.
- To list available Ollama models: `ollama list`.
- To import a local GGUF model into Ollama:
  1. Place the `.gguf` file in this folder.
  2. Create a `Modelfile` with the single line: `FROM ./your-model-file.gguf`.
  3. Run: `ollama create yourmodel:name -f Modelfile`.
- If downloads fail due to network/DNS, try a different network or use the `hf` CLI with `--cache-dir` pointing to a drive with enough free space.

If something doesn't work, paste the console output here and I'll help diagnose.
