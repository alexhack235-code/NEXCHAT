# PowerShell helper to start Redis via Docker and show logs
# Usage: .\scripts\run_redis.ps1

Write-Host "Checking Docker status..."
try {
    docker info > $null 2>&1
} catch {
    Write-Error "Docker does not appear to be running or not installed. Please start Docker Desktop or install Docker."
    exit 1
}

# Remove existing container if present
Write-Host "Removing any existing 'nexium-redis' container..."
docker rm -f nexium-redis 2>$null | Out-Null

Write-Host "Starting Redis container..."
$proc = Start-Process -NoNewWindow -PassThru -FilePath docker -ArgumentList 'run -d --name nexium-redis -p 6379:6379 redis:7'
$proc.WaitForExit()
if ($proc.ExitCode -ne 0) {
    Write-Error "Failed to start Redis container. ExitCode=$($proc.ExitCode). Check Docker logs and available ports."
    exit $proc.ExitCode
}

Write-Host "Redis container started. Waiting for readiness..."
Start-Sleep -Seconds 2
# show container status
docker ps --filter "name=nexium-redis"

Write-Host "To stop and remove: docker rm -f nexium-redis"
