$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$artDir = "C:\Users\USER\.gemini\antigravity\brain\14f1464a-682d-479c-bee5-4fa6af1c2548"

$shots = @(
    @{ file="chat_list_mobile.png"; view="chats"; w=390; h=844; isMobile=$true },
    @{ file="chat_list_desktop.png"; view="chats"; w=1440; h=900; isMobile=$false },
    @{ file="1on1_chat_mobile.png"; view="1on1"; w=390; h=844; isMobile=$true },
    @{ file="1on1_chat_desktop.png"; view="1on1"; w=1440; h=900; isMobile=$false },
    @{ file="group_chat_mobile.png"; view="group"; w=390; h=844; isMobile=$true },
    @{ file="group_chat_desktop.png"; view="group"; w=1440; h=900; isMobile=$false },
    @{ file="status_updates_mobile.png"; view="updates"; w=390; h=844; isMobile=$true },
    @{ file="status_updates_desktop.png"; view="updates"; w=1440; h=900; isMobile=$false },
    @{ file="calls_history_mobile.png"; view="calls"; w=390; h=844; isMobile=$true },
    @{ file="calls_history_desktop.png"; view="calls"; w=1440; h=900; isMobile=$false }
)

foreach ($s in $shots) {
    $outPath = Join-Path $artDir $s.file
    if (Test-Path $outPath) { Remove-Item $outPath -Force }
    $mobileParam = if ($s.isMobile) { "&mobile=true" } else { "" }
    $url = "http://127.0.0.1:8080/chat.html?preview=true&view=$($s.view)$mobileParam"
    Write-Host "Capturing $($s.file) ($($s.w)x$($s.h)) for view=$($s.view)..."
    
    $argsList = @(
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        "--screenshot=$outPath",
        "--window-size=$($s.w),$($s.h)",
        "--virtual-time-budget=2500",
        $url
    )

    Start-Process -FilePath $chrome -ArgumentList $argsList -Wait -WindowStyle Hidden
    if (Test-Path $outPath) {
        $len = (Get-Item $outPath).Length / 1KB
        Write-Host "  -> Generated $($s.file) ($([math]::Round($len, 1)) KB)"
    } else {
        Write-Host "  -> FAILED to create $($s.file)"
    }
}
Write-Host "All 10 screenshots completed."
