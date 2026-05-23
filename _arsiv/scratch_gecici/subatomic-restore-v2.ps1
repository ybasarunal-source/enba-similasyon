$files = Get-ChildItem -Recurse -Include *.jsx, *.css, *.html -Exclude node_modules

$p_g_junk = [byte[]](0x67, 0xEF, 0xBF, 0xBD, 0xEF, 0xBF, 0xBD, 0xEF, 0xBF, 0xBD) 
$r_bolt   = [byte[]](0xE2, 0x9A, 0xA1, 0x20)

$p_ph_g = [byte[]](0x70, 0x6C, 0x61, 0x63, 0x65, 0x68, 0x6F, 0x6C, 0x64, 0x65, 0x72, 0x3D, 0x22, 0x67, 0xEF, 0xBF, 0xBD, 0xEF, 0xBF, 0xBD, 0xEF, 0xBF, 0xBD)
$r_ph_s = [byte[]](0x70, 0x6C, 0x61, 0x63, 0x65, 0x68, 0x6F, 0x6C, 0x64, 0x65, 0x72, 0x3D, 0x22, 0xF0, 0x9F, 0x94, 0x8D, 0x20)

$p_I_cap = [byte[]](0xC3, 0x84, 0xC2, 0xB0)
$r_I_cap = [byte[]](0xC4, 0xB0)

$p_S_cap = [byte[]](0xC3, 0x85, 0xC5, 0xBE)
$r_S_cap = [byte[]](0xC5, 0x9E)

$p_ub = [byte[]](0xEF, 0xBF, 0xBD, 0x75, 0x62)
$r_ub = [byte[]](0xC5, 0x9E, 0x75, 0x62)

function Replace-Bytes($d, $p, $r) {
    if ($d.Length -lt $p.Length) { return $d }
    $res = New-Object System.Collections.Generic.List[byte]
    $m = $false
    for ($i = 0; $i -lt $d.Length; $i++) {
        $mt = $true
        if ($i + $p.Length -le $d.Length) {
            for ($j = 0; $j -lt $p.Length; $j++) {
                if ($d[$i + $j] -ne $p[$j]) { $mt = $false; break }
            }
        } else { $mt = $false }
        
        if ($mt) {
            $res.AddRange($r)
            $i += $p.Length - 1
            $m = $true
        } else {
            $res.Add($d[$i])
        }
    }
    return @($m, $res.ToArray())
}

foreach ($f in $files) {
    $b = [System.IO.File]::ReadAllBytes($f.FullName)
    $any = $false
    
    $res = Replace-Bytes $b $p_g_junk $r_bolt; if($res[0]) { $b=$res[1]; $any=$true }
    $res = Replace-Bytes $b $p_ph_g $r_ph_s;   if($res[0]) { $b=$res[1]; $any=$true }
    $res = Replace-Bytes $b $p_I_cap $r_I_cap; if($res[0]) { $b=$res[1]; $any=$true }
    $res = Replace-Bytes $b $p_S_cap $r_S_cap; if($res[0]) { $b=$res[1]; $any=$true }
    $res = Replace-Bytes $b $p_ub $r_ub;       if($res[0]) { $b=$res[1]; $any=$true }

    if ($any) {
        [System.IO.File]::WriteAllBytes($f.FullName, $b)
        Write-Host ">>> REPAIRED: $($f.Name)"
    }
}
Write-Host "SUBATOMIC RESTORATION COMPLETE."
