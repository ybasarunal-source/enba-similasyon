$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

# Character Constants (Hex only)
$I_dot_cap = [char]0x0130 # İ
$i_dot_low = [char]0x0131 # ı
$s_ced_low = [char]0x015F # ş
$S_ced_cap = [char]0x015E # Ş
$u_uml_low = [char]0x00FC # ü
$U_uml_cap = [char]0x00DC # Ü
$o_uml_low = [char]0x00F6 # ö
$O_uml_cap = [char]0x00D6 # Ö
$c_ced_low = [char]0x00E7 # ç
$C_ced_cap = [char]0x00C7 # Ç
$g_bre_low = [char]0x011F # ğ
$G_bre_cap = [char]0x011E # Ğ

$bolt      = [char]0x26A1 # ⚡
$search    = [char]::ConvertFromUtf32(0x1F50D) # 🔍
$stock     = [char]::ConvertFromUtf32(0x1F4E6) # 📦
$factory   = [char]::ConvertFromUtf32(0x1F3ED) # 🏭
$chart     = [char]::ConvertFromUtf32(0x1F4CA) # 📊
$down      = [char]0x2B07 # ⬇

# Mojibake Search Patterns (Byte pairs as characters)
$m_I_cap = [char]0xC3 + [char]0x84 + [char]0xC2 + [char]0xB0 # Ä°
$m_i_low = [char]0xC3 + [char]0x84 + [char]0xC2 + [char]0xB1 # Ä±
$m_S_cap = [char]0xC3 + [char]0x85 + [char]0xC5 + [char]0xBE # Åž
$m_s_low = [char]0xC3 + [char]0x85 + [char]0xC5 + [char]0xB8 # ÅŸ
$m_u_low = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xBC # Ã¼
$m_U_cap = [char]0xC3 + [char]0x83 + [char]0x85 # Ãœ
$m_o_low = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xB6 # Ã¶
$m_O_cap = [char]0xC3 + [char]0x83 + [char]0x96 # Ã–
$m_c_low = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xA7 # Ã§
$m_C_cap = [char]0xC3 + [char]0x83 + [char]0x87 # Ã‡
$m_g_low = [char]0xC3 + [char]0x84 + [char]0xC5 + [char]0xB8 # ÄŸ
$m_G_cap = [char]0xC3 + [char]0x84 + [char]0x9E # Ä

foreach ($file in $files) {
    Write-Host "CLEANING: $($file.Name)..."
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $m = $false

        # Pattern 1: 'g ' artifacts
        if ($content -match "[> ]g ") {
            $content = $content -replace " g ", " $bolt "
            $content = $content -replace ">g ", ">$bolt "
            $m = $true
        }
        
        # Pattern 2: 's ' and 's' artifacts (bolt)
        if ($content -match "s Tek Seferde") {
            $content = $content -replace "s Tek Seferde", "$bolt Tek Seferde"
            $m = $true
        }

        # Pattern 3: placeholder artifacts
        if ($content.Contains("placeholder=""g ")) {
            $content = $content.Replace("placeholder=""g ", "placeholder=""$search ")
            $m = $true
        }

        # Pattern 4: Mojibake
        $mods = @(
            @($m_I_cap, $I_dot_cap), @($m_i_low, $i_dot_low), @($m_S_cap, $S_ced_cap), @($m_s_low, $s_ced_low),
            @($m_u_low, $u_uml_low), @($m_U_cap, $U_uml_cap), @($m_o_low, $o_uml_low), @($m_O_cap, $O_uml_cap),
            @($m_c_low, $c_ced_low), @($m_C_cap, $C_ced_cap), @($m_g_low, $g_bre_low), @($m_G_cap, $G_bre_cap)
        )
        foreach ($pair in $mods) {
            if ($content.Contains($pair[0])) { $content = $content.Replace($pair[0], $pair[1]); $m = $true }
        }

        # Pattern 5: Special artifacts found in view_file
        if ($content.Contains("'Oca','?ub'")) {
            $content = $content.Replace("'Oca','?ub'", "'Oca'"+",$([char]0x27)$S_ced_cap" + "ub$([char]0x27)")
            $m = $true
        }

        if ($m) {
            [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
            Write-Host ">>> REPAIRED: $($file.Name)"
        }
    } catch {
        Write-Host "ERROR: $($file.Name) - $($_.Exception.Message)"
    }
}
Write-Host "RADICAL PROJECT RECOVERY COMPLETE."
