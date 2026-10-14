@echo off
REM Start NEXIUM: Ollama (if not running), backend (uvicorn) and open the chat UI
cd /d %~dp0
echo Starting NEXIUM...

:: Start Ollama (if already running this will fail but that's fine)
start "Ollama" cmd /k "ollama serve"

:: Start backend (uses venv in project root)
start "NEXIUM Backend" cmd /k "cd backend && ..\.venv\Scripts\activate && ..\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

:: Give services a few seconds then open the chat UI in default browser
timeout /t 4 /nobreak >nul
start "" "%cd%\chat-gpt-style.html"
echo NEXIUM startup initiated. Check the two new terminal windows for logs.
pause