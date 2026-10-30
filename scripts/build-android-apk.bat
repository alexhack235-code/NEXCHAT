@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo [NEXCHAT] Android APK Build Automation
echo ===================================================

echo [1/4] Syncing web assets to dist directory...
python scripts/prepare_dist.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to prepare dist directory.
    exit /b %ERRORLEVEL%
)

echo [1.5/4] Generating Android launcher icons and splash screens...
powershell -ExecutionPolicy Bypass -File scripts\generate_android_icons.ps1

echo [2/4] Syncing Capacitor Android assets...
node ./node_modules/@capacitor/cli/bin/capacitor sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Capacitor sync failed.
    exit /b %ERRORLEVEL%
)

powershell -Command "if (Test-Path 'android\app\capacitor.build.gradle') { (Get-Content 'android\app\capacitor.build.gradle') -replace 'VERSION_21', 'VERSION_17' | Set-Content 'android\app\capacitor.build.gradle' }"

echo [3/4] Checking build environment...
if not exist "android\gradlew.bat" (
    echo [ERROR] Android project folder not found at android/
    exit /b 1
)

if not defined ANDROID_HOME (
    if exist "C:\Android\Sdk" (
        set "ANDROID_HOME=C:\Android\Sdk"
    )
)
if not exist "android\local.properties" (
    if exist "C:\Android\Sdk" (
        echo sdk.dir=C\:\\Android\\Sdk> "android\local.properties"
    )
)

where java >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Java JDK not found in PATH.
    echo Please install OpenJDK 17 or Android Studio to compile the APK locally.
    echo You can also open the project in Android Studio:
    echo   File -^> Open -^> Select "android" folder
    exit /b 0
)

echo [4/4] Assembling Debug APK via Gradle wrapper...
cd android
call gradlew.bat assembleDebug
set GRADLE_EXIT=!ERRORLEVEL!
cd ..

if !GRADLE_EXIT! EQU 0 (
    echo ===================================================
    echo [SUCCESS] APK built successfully!
    if not exist "dist-apk" mkdir "dist-apk"
    copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "dist-apk\NEXCHAT-debug.apk"
    echo [OUTPUT] APK location: dist-apk\NEXCHAT-debug.apk
    echo ===================================================
) else (
    echo [ERROR] Gradle build failed with code !GRADLE_EXIT!.
    echo Open android/ folder in Android Studio for detailed diagnostics.
)

endlocal
