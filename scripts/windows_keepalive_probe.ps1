# Windows Desktop Keep-Alive Probe Daemon
# Keeps screen active and prevents Windows sleep/display timeout

$code = @"
using System;
using System.Runtime.InteropServices;

public class WindowsDesktopKeeper {
    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern uint SetThreadExecutionState(uint esFlags);

    public const uint ES_CONTINUOUS = 0x80000000;
    public const uint ES_SYSTEM_REQUIRED = 0x00000001;
    public const uint ES_DISPLAY_REQUIRED = 0x00000002;
}
"@

try {
    Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
} catch {}

Write-Host "Windows Desktop Keep-Alive Probe initialized successfully."
$wscript = New-Object -ComObject WScript.Shell

while ($true) {
    try {
        [WindowsDesktopKeeper]::SetThreadExecutionState(
            [WindowsDesktopKeeper]::ES_CONTINUOUS -bor 
            [WindowsDesktopKeeper]::ES_DISPLAY_REQUIRED -bor 
            [WindowsDesktopKeeper]::ES_SYSTEM_REQUIRED
        ) | Out-Null
        # F15 key pulse resets idle countdown without modifying inputs
        $wscript.SendKeys("{F15}")
    } catch {}
    Start-Sleep -Seconds 45
}
