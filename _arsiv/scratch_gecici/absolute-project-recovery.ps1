$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

# Character Definitions
$bolt    = [char]0x26A1  # ⚡
$stock   = [char]::ConvertFromUtf32(0x1F4E6) # 📦
$factory = [char]::ConvertFromUtf32(0x1F3ED) # 🏭
$money   = [char]::ConvertFromUtf32(0x1F4B8) # 💸
$chart   = [char]::ConvertFromUtf32(0x1F4CA) # 📊
$search  = [char]::ConvertFromUtf32(0x1F50D) # 🔍
$sparkle = [char]::ConvertFromUtf32(0x2728)  # ✨
$plus    = [char]0x2705  # ✅
$S_cap   = [char]0x15E   # Ş
$s_low   = [char]0x15F   # ş
$I_cap   = [char]0x130   # İ

# Restoration Map
# We use standard string replacement for common corrupted patterns
$replaces = @(
    # Icons
    @{ P = "g "; R = "$bolt " } 
    @{ P = ">g "; R = ">$bolt " }
    @{ P = "?"; R = "$sparkle" }
    @{ P = "?"; R = "$S_cap" }
    
    # Specific common corruptions found in research
    @{ P = "'Oca','?ub'"; R = "'Oca','$S_cap-ub'" }
    @{ P = "placeholder=""g "; R = "placeholder=""$search " }
    @{ P = "placeholder='g "; R = "placeholder='$search " }
    
    # Mojibake (Double UTF-8 patterns)
    @{ P = "Ä°"; R = "İ" }
    @{ P = "Ä±"; R = "ı" }
    @{ P = "ÅŸ"; R = "ş" }
    @{ P = "Åž"; R = "Ş" }
    @{ P = "Ã¼"; R = "ü" }
    @{ P = "Ãœ"; R = "Ü" }
    @{ P = "Ã¶"; R = "ö" }
    @{ P = "Ã–"; R = "Ö" }
    @{ P = "Ã§"; R = "ç" }
    @{ P = "Ã‡"; R = "Ç" }
    @{ P = "ÄŸ"; R = "ğ" }
)

foreach ($file in $files) {
    Write-Host "SCANNING: $($file.Name)..."
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $modified = $false
        
        foreach ($r in $replaces) {
            if ($content.Contains($r.P)) {
                $content = $content.Replace($r.P, $r.R)
                $modified = $true
            }
        }

        if ($modified) {
            # Special case for 'Şub' which had a problematic literal in my map
            $content = $content.Replace("'$S_cap-ub'", "'$S_cap" + "ub'")

            [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
            Write-Host ">>> REPAIRED: $($file.Name)"
        }
    } catch {
        Write-Host "FAIL: $($file.Name) - $($_.Exception.Message)"
    }
}
Write-Host "ABSOLUTE PROJECT RECOVERY COMPLETE."
