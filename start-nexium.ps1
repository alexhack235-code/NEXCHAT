# PowerShell startup script for NEXIUM
# Run as: Right-click -> Run with PowerShell, or from an elevated PowerShell prompt
Set-Location -Path (Split-Path -Path $PSCommandPath -Parent)
Write-Host "Starting NEXIUM services..." -ForegroundColor Cyan

# Start Ollama (opens separate window)
Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","ollama serve"

# Start backend in new window, activating venv
$backendCmd = "cd backend; .\..\.venv\Scripts\Activate.ps1; ..\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command",$backendCmd

Start-Sleep -Seconds 4
Start-Process -FilePath "explorer.exe" -ArgumentList "`"$PWD\chat-gpt-style.html`""
Write-Host "NEXIUM startup initiated. Check the new PowerShell windows for logs." -ForegroundColor Green