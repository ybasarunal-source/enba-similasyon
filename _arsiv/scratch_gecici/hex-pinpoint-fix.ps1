$p = "components\wizard\detailed\DetStep2_Customers.jsx"
if (Test-Path $p) {
    # Read as UTF-8 bytes to be safe
    $c = Get-Content $p -Encoding UTF8
    
    # 0-indexed positions for Line 77 and Line 80
    $char_s_low = [char]0x15F # ş
    $char_s_cap = [char]0x15E # Ş
    $char_bolt = [char]0x26A1  # ⚡
    
    $c[76] = "                {/* Fire Toplu Giri$char_s_low */}"
    $c[79] = "                        <span style={{ fontWeight:700, fontSize:'13px', color:'#F59E0B', whiteSpace:'nowrap' }}>$char_bolt ${char_s_cap}u anki Fire Toplu Giri$char_s_low</span>"
    
    $Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines($p, $c, $Utf8NoBom)
    Write-Host "HEX PINPOINT FIX COMPLETE"
}
