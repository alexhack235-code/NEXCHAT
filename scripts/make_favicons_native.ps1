Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path (Get-Location) "logo.png"
$img = [System.Drawing.Image]::FromFile($srcPath)
Write-Host "Image loaded successfully: $($img.Width) x $($img.Height)"

$targets = @(
    @{ name="icon-512.png"; size=512 },
    @{ name="icon-192.png"; size=192 },
    @{ name="apple-touch-icon.png"; size=180 },
    @{ name="favicon-32.png"; size=32 }
)

foreach ($t in $targets) {
    $bmp = New-Object System.Drawing.Bitmap($t.size, $t.size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $t.size, $t.size)
    
    $outPath = Join-Path (Get-Location) "favicons\$($t.name)"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated $outPath ($($t.size)x$($t.size))"
}

$img.Dispose()
Write-Host "All favicons updated with the official NEXCHAT logo!"
