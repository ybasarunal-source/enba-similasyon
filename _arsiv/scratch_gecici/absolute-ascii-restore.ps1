$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

# Emojis via Hex
$bolt    = [char]0x26A1 # ⚡
$tasks   = [char]::ConvertFromUtf32(0x1F4CB) # 📋
$search  = [char]::ConvertFromUtf32(0x1F50D) # 🔍

# Turkish via Hex
$S_cap   = [char]0x0130 # İ (Correction: This is I dot cap 0x0130)
$I_dot   = [char]0x0130 # İ
$S_ced   = [char]0x015E # Ş
$s_ced   = [char]0x015F # ş
$i_dot   = [char]0x0131 # ı
$u_uml   = [char]0x00FC # ü
$U_uml   = [char]0x00DC # Ü

# Replacement Character
$rep = [char]0xFFFD

# Mojibake Patterns (Constructed byte-by-byte to avoid script mangling)
# Ä° (C3 84 C2 B0)
$m_I_cap = [char]0x00C3 + [char]0x0084 + [char]0x00C2 + [char]0x00B0
# Ä± (C3 84 C2 B1)
$m_i_low = [char]0x00C3 + [char]0x0084 + [char]0x00C2 + [char]0x00B1
# ÅŸ (C3 85 C5 B8)
$m_s_low = [char]0x00C3 + [char]0x0085 + [char]0x00C5 + [char]0x00B8 
# Åž (C3 85 C5 BE)
$m_S_cap = [char]0x00C3 + [char]0x0085 + [char]0x00C5 + [char]0x00BE

foreach ($f in $files) {
    Write-Host "Scrubbing: $($f.Name)..."
    try {
        $c = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
        $modified = $false
        
        # 1. Icons (g + replacements)
        $gJunk = "g" + $rep + "+"
        if ($c -match $gJunk) {
            $c = [regex]::Replace($c, $gJunk, "$bolt ")
            $modified = $true
        }

        # 2. Specific Words
        if ($c.Contains($rep + "irkete")) { $c = $c.Replace($rep + "irkete", $S_ced + "irkete"); $modified = $true }
        if ($c.Contains($rep + "ub"))     { $c = $c.Replace($rep + "ub", $S_ced + "ub"); $modified = $true }
        
        # 3. Mojibake
        if ($c.Contains($m_I_cap)) { $c = $c.Replace($m_I_cap, $I_dot); $modified = $true }
        if ($c.Contains($m_i_low)) { $c = $c.Replace($m_i_low, $i_dot); $modified = $true }
        if ($c.Contains($m_S_cap)) { $c = $c.Replace($m_S_cap, $S_ced); $modified = $true }
        if ($c.Contains($m_s_low)) { $c = $c.Replace($m_s_low, $s_ced); $modified = $true }

        if ($modified) {
            [System.IO.File]::WriteAllText($f.FullName, $c, $Utf8NoBom)
            Write-Host ">>> REPAIRED: $($f.Name)"
        }
    } catch {
        Write-Host "ERR: $($f.Name) - $($_.Exception.Message)"
    }
}
Write-Host "ABSOLUTE RESTORATION COMPLETE."
