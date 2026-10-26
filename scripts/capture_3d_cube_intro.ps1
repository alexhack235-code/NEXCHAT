$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$artDir = "C:\Users\USER\.gemini\antigravity\brain\14f1464a-682d-479c-bee5-4fa6af1c2548"

$shots = @(
    @{ file="grand_3d_rotating_cube_intro_desktop.png"; w=1440; h=900; budget=2000 },
    @{ file="grand_3d_rotating_cube_intro_mobile.png"; w=390; h=844; budget=2000 }
)

foreach ($s in $shots) {
    $outPath = Join-Path $artDir $s.file
    if (Test-Path $outPath) { Remove-Item $outPath -Force }
    $ts = [int][double]::Parse((Get-Date -UFormat %s))
    $url = "http://127.0.0.1:8080/index.html?_ts=$ts"
    Write-Host "Capturing $($s.file) ($($s.w)x$($s.h))..."
    
    $tempDir = Join-Path $env:TEMP ("chrome_cube_" + [System.Guid]::NewGuid().ToString("N"))
    $argsList = @(
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        "--user-data-dir=$tempDir",
        "--screenshot=$outPath",
        "--window-size=$($s.w),$($s.h)",
        "--virtual-time-budget=$($s.budget)",
        $url
    )

    Start-Process -FilePath $chrome -ArgumentList $argsList -Wait -WindowStyle Hidden
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    if (Test-Path $outPath) {
        $len = (Get-Item $outPath).Length / 1KB
        Write-Host "  -> Generated $($s.file) ($([math]::Round($len, 1)) KB)"
    } else {
        Write-Host "  -> FAILED to create $($s.file)"
    }
}
Write-Host "All intro captures completed."
