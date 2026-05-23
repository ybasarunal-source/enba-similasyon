$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

# Emojis via Hex
$bolt = [char]0x26A1
$stock = [char]::ConvertFromUtf32(0x1F4E6) # 📦
$factory = [char]::ConvertFromUtf32(0x1F3ED) # 🏭
$money = [char]::ConvertFromUtf32(0x1F4B8) # 💸
$chart = [char]::ConvertFromUtf32(0x1F4CA) # 📊
$tasks = [char]::ConvertFromUtf32(0x1F4CB) # 📋

# Replacement Dictionary
$replaces = @{
    "Ä°" = "İ";
    "Ä±" = "ı";
    "ÅŸ" = "ş";
    "Åž" = "Ş";
    "Ã¼" = "ü";
    "Ãœ" = "Ü";
    "Ã¶" = "ö";
    "Ã–" = "Ö";
    "Ã§" = "ç";
    "Ã‡" = "Ç";
    "ÄŸ" = "ğ";
    "Ä" = "Ğ";
    "âš¡" = "$bolt";
    "s Tek Seferde" = "$bolt Tek Seferde";
    "g Fire Toplu Giriş" = "$bolt Şu anki Fire Toplu Giriş";
    "g EXCEL İLE YÜKLE" = "📈 EXCEL İLE YÜKLE";
    "g ŞABLON İNDİR" = "⬇ ŞABLON İNDİR"
}

foreach ($file in $files) {
    Write-Host "REPAIRING: $($file.FullName)..."
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $modified = $false
        
        foreach ($key in $replaces.Keys) {
            if ($content.Contains($key)) {
                $content = $content.Replace($key, $replaces[$key])
                $modified = $true
            }
        }
        
        # Wide sweep for the 'g ' artifact in common icon locations
        if ($content -match ">g ") {
            $content = $content -replace ">g ", ">$bolt "
            $modified = $true
        }

        if ($modified) {
            [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
            Write-Host ">>> FIXED: $($file.Name)"
        }
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)"
    }
}
Write-Host "UNIVERSAL RESTORATION COMPLETE."
