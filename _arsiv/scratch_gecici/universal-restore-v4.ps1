$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

# Emojis via Hex
$bolt = [char]0x26A1  # ⚡
$stock = [char]::ConvertFromUtf32(0x1F4E6) # 📦
$factory = [char]::ConvertFromUtf32(0x1F3ED) # 🏭
$money = [char]::ConvertFromUtf32(0x1F4B8) # 💸
$chart = [char]::ConvertFromUtf32(0x1F4CA) # 📊

# Turkish Characters via Hex
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

# Repair Map (HEX based keys constructed to avoid parsing issues)
$replaces = @(
    @{ Pattern = [char]0xC3 + [char]0x84 + [char]0xC2 + [char]0xB0; Replace = $I_dot_cap } # Ä° -> İ
    @{ Pattern = [char]0xC3 + [char]0x84 + [char]0xC2 + [char]0xB1; Replace = $i_dot_low } # Ä± -> ı
    @{ Pattern = [char]0xC3 + [char]0x85 + [char]0xC5 + [char]0xBE; Replace = $S_ced_cap } # Åž -> Ş
    @{ Pattern = [char]0xC3 + [char]0x85 + [char]0xC5 + [char]0xB8; Replace = $s_ced_low } # ÅŸ -> ş
    @{ Pattern = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xBC; Replace = $u_uml_low } # Ã¼ -> ü
    @{ Pattern = [char]0xC3 + [char]0x83 + [char]0x85; Replace = $U_uml_cap }             # Ãœ -> Ü
)

foreach ($file in $files) {
    Write-Host "Probing: $($file.Name)..."
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $modified = $false
        
        # Wide-scale 'g' and 's' artifacts fix
        if ($content -match "[> ]g ") {
            $content = $content -replace " g ", " $bolt "
            $content = $content -replace ">g ", ">$bolt "
            $modified = $true
        }
        if ($content -match "s Tek Seferde") {
            $content = $content -replace "s Tek Seferde", "$bolt Tek Seferde"
            $modified = $true
        }

        # Fix specific mojibake
        foreach ($r in $replaces) {
            if ($content.Contains($r.Pattern)) {
                $content = $content.Replace($r.Pattern, $r.Replace)
                $modified = $true
            }
        }

        if ($modified) {
            [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
            Write-Host ">>> CLEANED: $($file.Name)"
        }
    } catch {
        Write-Host "Error in $($file.Name): $($_.Exception.Message)"
    }
}
Write-Host "PROJECT-WIDE RADIANCE SYNC COMPLETE."
