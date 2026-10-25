# NEXCHAT Android APK Build Script for PowerShell
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "[NEXCHAT] Android APK Build Automation" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

Write-Host "[1/4] Syncing web assets to dist directory..." -ForegroundColor Yellow
python scripts/prepare_dist.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to prepare dist directory." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "[2/4] Syncing Capacitor Android assets..." -ForegroundColor Yellow
node ./node_modules/@capacitor/cli/bin/capacitor sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Capacitor sync failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "[3/4] Checking build environment..." -ForegroundColor Yellow
if (-not (Test-Path "android\gradlew.bat")) {
    Write-Host "[ERROR] Android project folder not found at android/" -ForegroundColor Red
    exit 1
}

$javaCmd = Get-Command "java" -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Host "[WARNING] Java JDK not found in PATH." -ForegroundColor DarkYellow
    Write-Host "To compile the APK locally, install OpenJDK 17 or Android Studio." -ForegroundColor White
    Write-Host "You can also open the project directly in Android Studio:" -ForegroundColor White
    Write-Host "  File -> Open -> Select 'android' folder in NEXCHAT" -ForegroundColor Green
    exit 0
}

Write-Host "[4/4] Assembling Debug APK via Gradle wrapper..." -ForegroundColor Yellow
Push-Location android
try {
    .\gradlew.bat assembleDebug
    $gradleExit = $LASTEXITCODE
} finally {
    Pop-Location
}

if ($gradleExit -eq 0) {
    Write-Host "===================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] APK built successfully!" -ForegroundColor Green
    if (-not (Test-Path "dist-apk")) {
        New-Item -ItemType Directory -Path "dist-apk" | Out-Null
    }
    Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" -Destination "dist-apk\NEXCHAT-debug.apk" -Force
    Write-Host "[OUTPUT] APK location: dist-apk\NEXCHAT-debug.apk" -ForegroundColor Green
    Write-Host "===================================================" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Gradle build failed with code $gradleExit." -ForegroundColor Red
    Write-Host "Open android/ folder in Android Studio for detailed diagnostics." -ForegroundColor DarkYellow
}
