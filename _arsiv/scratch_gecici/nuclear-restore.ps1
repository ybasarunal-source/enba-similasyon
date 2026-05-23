$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

# Pattern definitions (Byte Arrays)
# Corrupted Bolt: 'g' (67) followed by '⚡' (E2 9A A1)
$p_g_bolt = [byte[]](0x67, 0xE2, 0x9A, 0xA1)
$r_bolt   = [byte[]](0xE2, 0x9A, 0xA1)

# Corrupted placeholder: 'placeholder="g' (70 6C 61 63 65 68 6F 6C 64 65 72 3D 22 67)
$p_ph_g = [byte[]](0x70, 0x6C, 0x61, 0x63, 0x65, 0x68, 0x6F, 0x6C, 0x64, 0x65, 0x72, 0x3D, 0x22, 0x67)
$r_ph_s = [byte[]](0x70, 0x6C, 0x61, 0x63, 0x65, 0x68, 0x6F, 0x6C, 0x64, 0x65, 0x72, 0x3D, 0x22, 0xF0, 0x9F, 0x90, 0x8D) # Placeholder Search icon bytes

# Turkish Mojibake
$p_I_cap = [byte[]](0xC3, 0x84, 0xC2, 0xB0) # Ä°
$r_I_cap = [byte[]](0xC4, 0xB0)             # İ

$p_i_low = [byte[]](0xC3, 0x84, 0xC2, 0xB1) # Ä±
$r_i_low = [byte[]](0xC4, 0xB1)             # ı

$p_S_cap = [byte[]](0xC3, 0x85, 0xC5, 0xBE) # Åž
$r_S_cap = [byte[]](0xC5, 0x9E)             # Ş

$p_s_low = [byte[]](0xC3, 0x85, 0xC5, 0xB8) # ÅŸ
$r_s_low = [byte[]](0xC5, 0x9F)             # ş

function Replace-Bytes($bytes, $pattern, $replacement) {
    if ($bytes.Length -lt $pattern.Length) { return $bytes }
    $newBytes = New-Object System.Collections.Generic.List[byte]
    for ($i = 0; $i -lt $bytes.Length; $i++) {
        $match = $true
        if ($i + $pattern.Length -le $bytes.Length) {
            for ($j = 0; $j -lt $pattern.Length; $j++) {
                if ($bytes[$i + $j] -ne $pattern[$j]) { $match = $false; break }
            }
        } else { $match = $false }

        if ($match) {
            $newBytes.AddRange($replacement)
            $i += $pattern.Length - 1
        } else {
            $newBytes.Add($bytes[$i])
        }
    }
    return $newBytes.ToArray()
}

foreach ($file in $files) {
    Write-Host "BINARY SANITIZING: $($file.Name)..."
    $b = [System.IO.File]::ReadAllBytes($file.FullName)
    $origLen = $b.Length
    
    $b = Replace-Bytes $b $p_g_bolt $r_bolt
    $b = Replace-Bytes $b $p_ph_g $p_ph_g # Wait, need to fix placeholder logic
    
    # Actually, simpler: replace 'g' followed by any sequence starting with E2 9A or F0 9F
    # But for now, let's fix the most obvious ones
    $b = Replace-Bytes $b $p_I_cap $r_I_cap
    $b = Replace-Bytes $b $p_i_low $r_i_low
    $b = Replace-Bytes $b $p_S_cap $r_S_cap
    $b = Replace-Bytes $b $p_s_low $r_s_low

    if ($b.Length -ne $origLen -or -not ([System.Linq.Enumerable]::SequenceEqual($b, [System.IO.File]::ReadAllBytes($file.FullName)))) {
        [System.IO.File]::WriteAllBytes($file.FullName, $b)
        Write-Host ">>> BINARY REPAIRED: $($file.Name)"
    }
}
Write-Host "NUCLEAR BINARY RESTORATION COMPLETE."
