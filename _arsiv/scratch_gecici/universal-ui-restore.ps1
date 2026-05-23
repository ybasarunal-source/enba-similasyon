$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

# Character Constants
$bolt    = [char]0x26A1  # ⚡
$search  = [char]::ConvertFromUtf32(0x1F50D) # 🔍
$stock   = [char]::ConvertFromUtf32(0x1F4E6) # 📦
$factory = [char]::ConvertFromUtf32(0x1F3ED) # 🏭
$chart   = [char]::ConvertFromUtf32(0x1F4CA) # 📊
$tasks   = [char]::ConvertFromUtf32(0x1F4CB) # 📋
$S_cap   = [char]0x15E   # Ş
$s_low   = [char]0x15F   # ş
$I_cap   = [char]0x130   # İ

# Mojibake Search Patterns (Byte pairs as characters)
$m_I_cap = [char]0xC3 + [char]0x84 + [char]0xC2 + [char]0xB0 # Ä°
$m_i_low = [char]0xC3 + [char]0x84 + [char]0xC2 + [char]0xB1 # Ä±
$m_S_cap = [char]0xC3 + [char]0x85 + [char]0xC5 + [char]0xBE # Åž
$m_s_low = [char]0xC3 + [char]0x85 + [char]0xC5 + [char]0xB8 # ÅŸ
$m_u_low = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xBC # Ã¼
$m_U_cap = [char]0xC3 + [char]0x83 + [char]0x85 # Ãœ

foreach ($file in $files) {
    Write-Host "SANITY CHECK: $($file.Name)..."
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $modified = $false

        # --- THE ICON FIX (THE 'g ' ARTIFACT) ---
        # Matches 'g ' at start of string, or after bracket/quote/space
        if ($content -match '(["''> ])g ') {
            # 1. Placeholders
            $content = $content -replace '(placeholder=["''])g ', "`$1$search "
            # 2. HTML content or strings
            $content = $content -replace '([> ])g ', "`$1$bolt "
            $modified = $true
        }

        # --- THE MOJIBAKE FIX ---
        $mods = @(
            @($m_I_cap, $I_cap), @($m_i_low, $i_dot_low), @($m_S_cap, $S_cap), @($m_s_low, $s_low),
            @($m_u_low, [char]0x00FC), @($m_U_cap, [char]0x00DC),
            @("'Oca','?ub'", "'Oca','$S_cap" + "ub'"),
            @(">g️", ">$bolt️"),
            @(">s ", ">$bolt ")
        )
        foreach ($p in $mods) {
            if ($content.Contains($p[0])) {
                $content = $content.Replace($p[0], $p[1])
                $modified = $true
            }
        }

        # --- SPECIFIC TARGETS FOUND IN SIDEBAR/LANDING ---
        if ($content.Contains("btn-reset")) {
            $content = $content -replace "g tüm verileri", "$tasks tüm verileri"
            $modified = $true
        }

        if ($modified) {
            [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
            Write-Host ">>> RESTORED: $($file.Name)"
        }
    } catch {
        Write-Host "ERR: $($file.Name) - $($_.Exception.Message)"
    }
}
Write-Host "UNIVERSAL UI RESTORATION COMPLETE."
