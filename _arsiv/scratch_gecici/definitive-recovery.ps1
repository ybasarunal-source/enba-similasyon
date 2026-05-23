$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

# Character Constants (Hex only to avoid script-encoding issues)
$bolt    = [char]0x26A1 # ⚡
$search  = [char]::ConvertFromUtf32(0x1F50D) # 🔍
$S_cap   = [char]0x15E   # Ş
$s_low   = [char]0x15F   # ş
$I_cap   = [char]0x130   # İ
$i_low   = [char]0x0131  # ı

# RegEx for any non-ASCII character
$nonAscii = '[^\x00-\x7F]'

foreach ($file in $files) {
    Write-Host "SCANNING: $($file.Name)..."
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $m = $false

        # --- REPAIR 1: THE 'g' ICON ARTIFACTS ---
        # Matches 'g' followed by 1 to 4 non-ASCII chars
        $gArtifact = "g" + $nonAscii + "{1,4}\s*"
        if ($content -match $gArtifact) {
            # Fix placeholders specifically as Search icons
            if ($content -match "placeholder=""$gArtifact") {
                $content = [regex]::Replace($content, "placeholder=""$gArtifact", "placeholder=""$search ")
            }
            # Fix general content as Bolt icons
            $content = [regex]::Replace($content, "([> "''])g$nonAscii{1,4}\s*", "$1$bolt ")
            $m = $true
        }

        # --- REPAIR 2: MOJIBAKE AND REPLACEMENT CHARS ---
        # Using simple string replaces for the most common ones
        $mods = @(
            @([char]0xC3 + [char]0x84 + [char]0xC2 + [char]0xB0, $I_cap), # Ä° -> İ
            @([char]0xC3 + [char]0x84 + [char]0xC2 + [char]0xB1, $i_low), # Ä± -> ı
            @([char]0xC3 + [char]0x85 + [char]0xC5 + [char]0xBE, $S_ced_cap), # Åž -> Ş
            @([char]0xC3 + [char]0x85 + [char]0xC5 + [char]0xB8, $s_low), # ÅŸ -> ş
            @([char]0xEF + [char]0xBF + [char]0xBD + "ub", $S_cap + "ub"), # ?ub -> Şub
            @([char]0xEF + [char]0xBF + [char]0xBD + "ABLON", $S_cap + "ABLON"), # ?ABLON -> ŞABLON
            @("Girişş", "Giriş")
        )

        foreach ($p in $mods) {
            if ($content.Contains($p[0])) { $content = $content.Replace($p[0], $p[1]); $m = $true }
        }

        if ($m) {
            [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
            Write-Host ">>> REPAIRED: $($file.Name)"
        }
    } catch {
        Write-Host "ERR: $($file.Name) - $($_.Exception.Message)"
    }
}
Write-Host "DEFINITIVE PROJECT RECOVERY COMPLETE."
