$p = "components\wizard\detailed\DetStep2_Customers.jsx"
if (Test-Path $p) {
    $c = Get-Content $p
    # PowerShell is 0-indexed. Line 77 is index 76. Line 80 is index 79.
    $c[76] = "                {/* Fire Toplu Giriş */}"
    $c[79] = "                        <span style={{ fontWeight:700, fontSize:'13px', color:'#F59E0B', whiteSpace:'nowrap' }}>⚡ Şu anki Fire Toplu Giriş</span>"
    $Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines($p, $c, $Utf8NoBom)
    Write-Host "PINPOINT FIX COMPLETE"
} else {
    Write-Host "File not found"
}
