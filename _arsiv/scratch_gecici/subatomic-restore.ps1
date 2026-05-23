$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

# Binary patterns (Hex)
$p_g_junk = [byte[]](0x67, 0xEF, 0xBF, 0xBD, 0xEF, 0xBF, 0xBD, 0xEF, 0xBF, 0xBD) # 'g' + 3 replacement chars
$r_bolt   = [byte[]](0xE2, 0x9A, 0xA1, 0x20) # '⚡ '

$p_ph_g = [byte[]](0x70, 0x6C, 0x61, 0x63, 0x65, 0x68, 0x6F, 0x6C, 0x64, 0x65, 0x72, 0x3D, 0x22, 0x67, 0xEF, 0xBF, 0xBD, 0xEF, 0xBF, 0xBD, 0xEF, 0xBF, 0xBD)
$r_ph_s = [byte[]](0x70, 0x6C, 0x61, 0x63, 0x65, 0x68, 0x6F, 0x6C, 0x64, 0x65, 0x72, 0x3D, 0x22, 0xF0, 0x9F, 0x94, 0x8D, 0x20) # placeholder="🔍 "

$p_I_cap = [byte[]](0xC3, 0x84, 0xC2, 0xB0) # Ä°
$r_I_cap = [byte[]](0xC4, 0xB0)             # İ

$p_S_cap = [byte[]](0xC3, 0x85, 0xC5, 0xBE) # Åž
$r_S_cap = [byte[]](0xC5, 0x9E)             # Ş

$p_ub = [byte[]](0xEF, 0xBF, 0xBD, 0x75, 0x62) # ?ub
$r_ub = [byte[]](0xC5, 0x9E, 0x75, 0x62)       # Şub

function Replace-Bytes($data, $pattern, $replacement) {
    if ($data.Length -lt $pattern.Length) { return $data }
    $res = New-Object System.Collections.Generic.List[byte]
    for ($i = 0; $i -lt $data.Length; $i++) {
        $match = $true
        if ($i + $pattern.Length -le $data.Length) {
            for ($j = 0; $j -lt $pattern.Length; $j++) {
                if ($data[$i + $j] -ne $pattern[$j]) { $match = $false; break }
            }
        } else { $match = $false }
        
        if ($match) {
            $res.AddRange($replacement)
            $i += $pattern.Length - 1
        } else {
            $res.Add($data[$i])
        }
    }
    return $res.ToArray()
}

foreach ($f in $files) {
    Write-Host "Nuclear Scan: $($f.Name)..."
    $b = [System.IO.File]::ReadAllBytes($f.FullName)
    $old = $b.Length
    
    $b = Replace-Bytes $b $p_g_junk $r_bolt
    $b = Replace-Bytes $b $p_ph_g $r_ph_s
    $b = Replace-Bytes $b $p_I_cap $r_I_cap
    $b = Replace-Bytes $b $p_S_cap $r_S_cap
    $b = Replace-Bytes $b $p_ub $r_ub

    if ($b.Length -ne $old -or -not [System.Linq.Enumerable]::SequenceEqual($b, [System.IO.File]::ReadAllBytes($f.FullName))) {
        [System.IO.File]::WriteAllBytes($f.FullName, $b)
        Write-Host ">>> NUCLEAR REPAIR: $($f.Name)"
    }
}
Write-Host "NUCLEAR RESTORATION COMPLETE."
