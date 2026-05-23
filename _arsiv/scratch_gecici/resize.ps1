param(
    [string]$SourceFile,
    [string]$OutputDir,
    [string]$SizesString
)

Add-Type -AssemblyName System.Drawing

$Sizes = $SizesString.Split(',') | ForEach-Object { [int]$_ }

$src = [System.Drawing.Image]::FromFile((Resolve-Path $SourceFile))

foreach ($size in $Sizes) {
    $dest = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $size, $size)
    
    $outputPath = Join-Path $OutputDir "icon-$size.png"
    $dest.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $dest.Dispose()
}

$src.Dispose()
Write-Host "DONE"
