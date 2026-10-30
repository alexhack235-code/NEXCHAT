# NEXCHAT Android App Launcher & Splash Screen Generator
Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path (Get-Location) "logo.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source logo not found at $srcPath"
    exit 1
}

$logo = [System.Drawing.Image]::FromFile($srcPath)
Write-Host "Loaded source logo: $($logo.Width)x$($logo.Height)"

$resDir = Join-Path (Get-Location) "android\app\src\main\res"
$bgHex = "#0E101D"
$bgColor = [System.Drawing.ColorTranslator]::FromHtml($bgHex)
$splashBgColor = [System.Drawing.ColorTranslator]::FromHtml("#0A0F1A")

# 1. Update values/ic_launcher_background.xml
$bgXmlPath = Join-Path $resDir "values\ic_launcher_background.xml"
$bgXmlContent = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">$bgHex</color>
</resources>
"@
[IO.File]::WriteAllText($bgXmlPath, $bgXmlContent.Replace("`r`n", "`n").Replace("`n", "`r`n"), [System.Text.Encoding]::UTF8)
Write-Host "Updated $bgXmlPath to $bgHex"

# 2. Mipmap densities for ic_launcher, ic_launcher_round, ic_launcher_foreground
$densities = @(
    @{ folder="mipmap-mdpi";    iconSize=48;  fgSize=108 },
    @{ folder="mipmap-hdpi";    iconSize=72;  fgSize=162 },
    @{ folder="mipmap-xhdpi";   iconSize=96;  fgSize=216 },
    @{ folder="mipmap-xxhdpi";  iconSize=144; fgSize=324 },
    @{ folder="mipmap-xxxhdpi"; iconSize=192; fgSize=432 }
)

foreach ($d in $densities) {
    $targetDir = Join-Path $resDir $d.folder
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    # A) ic_launcher.png (Square / Legacy)
    $bmpSquare = New-Object System.Drawing.Bitmap($d.iconSize, $d.iconSize)
    $gSquare = [System.Drawing.Graphics]::FromImage($bmpSquare)
    $gSquare.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gSquare.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gSquare.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gSquare.Clear($bgColor)
    $gSquare.DrawImage($logo, 0, 0, $d.iconSize, $d.iconSize)
    $outSquare = Join-Path $targetDir "ic_launcher.png"
    $bmpSquare.Save($outSquare, [System.Drawing.Imaging.ImageFormat]::Png)
    $gSquare.Dispose()
    $bmpSquare.Dispose()
    Write-Host "Generated $outSquare ($($d.iconSize)x$($d.iconSize))"

    # B) ic_launcher_round.png (Circular Clip)
    $bmpRound = New-Object System.Drawing.Bitmap($d.iconSize, $d.iconSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gRound = [System.Drawing.Graphics]::FromImage($bmpRound)
    $gRound.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gRound.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gRound.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gRound.Clear([System.Drawing.Color]::Transparent)
    
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $d.iconSize, $d.iconSize)
    $gRound.SetClip($path)
    $gRound.Clear($bgColor)
    $gRound.DrawImage($logo, 0, 0, $d.iconSize, $d.iconSize)
    $outRound = Join-Path $targetDir "ic_launcher_round.png"
    $bmpRound.Save($outRound, [System.Drawing.Imaging.ImageFormat]::Png)
    $path.Dispose()
    $gRound.Dispose()
    $bmpRound.Dispose()
    Write-Host "Generated $outRound ($($d.iconSize)x$($d.iconSize))"

    # C) ic_launcher_foreground.png (Adaptive Foreground - safe zone ~72% scale)
    $bmpFg = New-Object System.Drawing.Bitmap($d.fgSize, $d.fgSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gFg = [System.Drawing.Graphics]::FromImage($bmpFg)
    $gFg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gFg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gFg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gFg.Clear($bgColor)
    
    $contentSize = [int]($d.fgSize * 0.72)
    $offset = [int](($d.fgSize - $contentSize) / 2)
    $gFg.DrawImage($logo, $offset, $offset, $contentSize, $contentSize)
    $outFg = Join-Path $targetDir "ic_launcher_foreground.png"
    $bmpFg.Save($outFg, [System.Drawing.Imaging.ImageFormat]::Png)
    $gFg.Dispose()
    $bmpFg.Dispose()
    Write-Host "Generated $outFg ($($d.fgSize)x$($d.fgSize))"
}

# 3. Splash Screens across all drawables
$splashes = @(
    @{ folder="drawable";              w=480;  h=320 },
    @{ folder="drawable-land-mdpi";     w=480;  h=320 },
    @{ folder="drawable-land-hdpi";     w=800;  h=480 },
    @{ folder="drawable-land-xhdpi";    w=1280; h=720 },
    @{ folder="drawable-land-xxhdpi";   w=1600; h=960 },
    @{ folder="drawable-land-xxxhdpi";  w=1920; h=1080 },
    @{ folder="drawable-port-mdpi";     w=320;  h=480 },
    @{ folder="drawable-port-hdpi";     w=480;  h=800 },
    @{ folder="drawable-port-xhdpi";    w=720;  h=1280 },
    @{ folder="drawable-port-xxhdpi";   w=960;  h=1600 },
    @{ folder="drawable-port-xxxhdpi";  w=1080; h=1920 }
)

foreach ($s in $splashes) {
    $targetDir = Join-Path $resDir $s.folder
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    $bmpSplash = New-Object System.Drawing.Bitmap($s.w, $s.h)
    $gSplash = [System.Drawing.Graphics]::FromImage($bmpSplash)
    $gSplash.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gSplash.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gSplash.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gSplash.Clear($splashBgColor)

    # Logo size is roughly 38% of the minimum screen dimension
    $minDim = [Math]::Min($s.w, $s.h)
    $splashLogoSize = [int]($minDim * 0.40)
    $x = [int](($s.w - $splashLogoSize) / 2)
    $y = [int](($s.h - $splashLogoSize) / 2)
    $gSplash.DrawImage($logo, $x, $y, $splashLogoSize, $splashLogoSize)

    $outSplash = Join-Path $targetDir "splash.png"
    $bmpSplash.Save($outSplash, [System.Drawing.Imaging.ImageFormat]::Png)
    $gSplash.Dispose()
    $bmpSplash.Dispose()
    Write-Host "Generated splash: $outSplash ($($s.w)x$($s.h))"
}

$logo.Dispose()
Write-Host "SUCCESS: All Android launcher icons and splash screens generated from official NEXCHAT logo!"
