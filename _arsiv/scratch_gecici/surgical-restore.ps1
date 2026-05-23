$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$char_bolt = [char]0x26A1
$char_gear = [char]0x2699
$char_build = [char]0x1F3E2 # 🏢
$char_tools = [char]0x1F6E0 # 🛠️

# 1. Step 2 (Customers)
$p2 = "components\wizard\detailed\DetStep2_Customers.jsx"
if (Test-Path $p2) {
    $c = Get-Content $p2 -Encoding UTF8
    $c[79] = "                        <span style={{ fontWeight:700, fontSize:'13px', color:'#F59E0B', whiteSpace:'nowrap' }}>$char_bolt Şu anki Fire Toplu Giriş</span>"
    [System.IO.File]::WriteAllLines($p2, $c, $Utf8NoBom)
}

# 2. Step 4 (Personnel)
$p4 = "components\wizard\detailed\DetStep4_Personnel.jsx"
if (Test-Path $p4) {
    $c = Get-Content $p4 -Encoding UTF8
    $c[36] = "                <h3 style={{ fontSize:'13px', margin:'0 0 10px', color:'var(--enba-dark)' }}>$char_bolt İşçi / Personel Rolü Tanımla</h3>"
    [System.IO.File]::WriteAllLines($p4, $c, $Utf8NoBom)
}

# 3. Step 6 (Investment)
$p6 = "components\wizard\detailed\DetStep6_Investment.jsx"
if (Test-Path $p6) {
    $c = Get-Content $p6 -Encoding UTF8
    $c[43] = "                            <option value=""makina"">$char_gear Makina</option>"
    $c[44] = "                            <option value=""insaat"">$char_build İnşaat / Tesis</option>"
    $c[45] = "                            <option value=""diger"">$char_tools Diğer</option>"
    [System.IO.File]::WriteAllLines($p6, $c, $Utf8NoBom)
}

# 4. app.jsx (template text)
$pa = "app.jsx"
if (Test-Path $pa) {
    $c = Get-Content $pa -Encoding UTF8
    $c[156] = "                        // Şablon formatı: [KOD, KALEM ADI, TUTAR]"
    [System.IO.File]::WriteAllLines($pa, $c, $Utf8NoBom)
}

Write-Host "SURGICAL RESTORATION COMPLETE"
