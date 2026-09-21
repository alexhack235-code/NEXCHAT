# NEXIUM Autonomous Background Supervisor (Windows PowerShell)
# Keeps Backend and Frontend alive 24/7 with automatic self-healing restart on crash.

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " NEXIUM 24/7 AUTONOMOUS SUPERVISOR ENGINE" -ForegroundColor Cyan
Write-Host " Self-healing background service with crash recovery" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$RootDir = Split-Path -Parent $PSScriptRoot
$VenvPython = Join-Path $RootDir ".venv\Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
    Write-Error "Virtual environment not found at $VenvPython. Run setup first."
    exit 1
}

# Function to run background process and monitor
function Start-NexiumBackend {
    $backendDir = Join-Path $RootDir "backend"
    Write-Host "[*] Starting NEXIUM Backend on port 8001..." -ForegroundColor Green
    return Start-Process -FilePath $VenvPython `
        -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8001" `
        -WorkingDirectory $backendDir `
        -PassThru -NoNewWindow
}

function Start-NexiumFrontend {
    $frontendDir = Join-Path $RootDir "frontend"
    Write-Host "[*] Starting NEXIUM Frontend on port 3000..." -ForegroundColor Green
    return Start-Process -FilePath "npm.cmd" `
        -ArgumentList "start" `
        -WorkingDirectory $frontendDir `
        -PassThru -NoNewWindow
}

$backendProc = Start-NexiumBackend
$frontendProc = Start-NexiumFrontend

Write-Host "[✓] All NEXIUM services active. Monitoring loop started." -ForegroundColor Cyan

try {
    while ($true) {
        Start-Sleep -Seconds 5

        if ($backendProc.HasExited) {
            Write-Warning "[!] Backend crashed or stopped with code $($backendProc.ExitCode). Restarting..."
            $backendProc = Start-NexiumBackend
        }

        if ($frontendProc.HasExited) {
            Write-Warning "[!] Frontend crashed or stopped with code $($frontendProc.ExitCode). Restarting..."
            $frontendProc = Start-NexiumFrontend
        }
    }
} finally {
    Write-Host "[*] Stopping supervised processes..." -ForegroundColor Yellow
    if ($backendProc -and -not $backendProc.HasExited) { Stop-Process -Id $backendProc.Id -Force }
    if ($frontendProc -and -not $frontendProc.HasExited) { Stop-Process -Id $frontendProc.Id -Force }
}
