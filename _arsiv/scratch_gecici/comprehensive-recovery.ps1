$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

$replacements = @{
    # Pattern (Mojibake) = Correct Char
    "$([char]0x00C5)$([char]0x0178)" = "ş"; # ÅŸ
    "$([char]0x00C4)$([char]0x00B1)" = "ı"; # Ä±
    "$([char]0x00C3)$([char]0x00A7)" = "ç"; # Ã§
    "$([char]0x00C3)$([char]0x00B6)" = "ö"; # Ã¶
    "$([char]0x00C3)$([char]0x00BC)" = "ü"; # Ã¼
    "$([char]0x00C4)$([char]0x009F)" = "ğ"; # ÄŸ
    "$([char]0x00C4)$([char]0x00B0)" = "İ"; # Ä°
    "$([char]0x00C5)$([char]0x017D)" = "Ş"; # ÅŽ
    "$([char]0x00C4)$([char]0x017E)" = "Ğ"; # Äž
    "?" = "Ş"; # Case observed in app.jsx
    "" = "ş";  # Fallback for unknown broken
    "İPK" = "İPK"; # Ensure consistency
}

foreach ($file in $files) {
    Write-Host "Checking $($file.FullName)..."
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $modified = $false
        
        foreach ($key in $replacements.Keys) {
            if ($content.Contains($key)) {
                $content = $content.Replace($key, $replacements[$key])
                $modified = $true
            }
        }

        # Manual fix for common broken words if patterns missed
        if ($content.Contains("?ablon")) { $content = $content.Replace("?ablon", "Şablon"); $modified = $true }
        if ($content.Contains("?ube"))   { $content = $content.Replace("?ube", "Şube"); $modified = $true }

        if ($modified) {
            [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
            Write-Host "FIXED: $($file.Name)"
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
    }
}
Write-Host "Comprehensive Recovery FINISHED."
