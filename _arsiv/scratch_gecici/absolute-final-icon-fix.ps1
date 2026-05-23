$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Character Definitions
$bolt = [char]0x26A1
$tasks = [char]::ConvertFromUtf32(0x1F4CB) # 📋
$chart = [char]::ConvertFromUtf32(0x1F4CA) # 📊
$excel = [char]::ConvertFromUtf32(0x1F4C8) # 📈
$down = [char]::ConvertFromUtf32(0x2B07)  # ⬇️
$trash = [char]::ConvertFromUtf32(0x1F5D1) # 🗑️
$rocket = [char]::ConvertFromUtf32(0x1F680) # 🚀
$S_cap = [char]0x15E # Ş

# Helper function
function Fix-File($path, $lineIndex, $newText) {
    if (Test-Path $path) {
        $c = Get-Content $path -Encoding UTF8
        if ($lineIndex -lt $c.Length) {
            $c[$lineIndex] = $newText
            [System.IO.File]::WriteAllLines($path, $c, $Utf8NoBom)
            Write-Host "Fixed $path at line $($lineIndex+1)"
        }
    }
}

# --- SIDEBAR.JSX RESTORATION ---
$ps = "components\Sidebar.jsx"
if (Test-Path $ps) {
    $c = Get-Content $ps -Encoding UTF8
    $c[27] = "                    $excel EXCEL İLE YÜKLE"
    $c[30] = "                    $down ${S_cap}ABLON İNDİR"
    $c[33] = "                <h2 style={{ textTransform: 'lowercase' }}>$tasks İPK LİSTESİ</h2>"
    $c[53] = "                    <button className=""btn btn-reset"" onClick={verileriSifirla}>$trash tüm verileri ve planları sil</button>"
    
    # Also fix line 40 Girişş mistake
    $c[39] = "                        <div className=""card-info"">Giriş: {window.fmt(plan.parametreler.aylikTon)} Ton | Çıkış: {window.fmt(plan.kutleDengesi?.toplamSatisTon || plan.parametreler.aylikTon)} Ton</div>"
    
    [System.IO.File]::WriteAllLines($ps, $c, $Utf8NoBom)
}

# --- APP.JSX FINAL ICON ---
$pa = "app.jsx"
if (Test-Path $pa) {
    $c = Get-Content $pa -Encoding UTF8
    $c[603] = "                        <span className=""nav-icon"">$rocket</span>"
    [System.IO.File]::WriteAllLines($pa, $c, $Utf8NoBom)
}

Write-Host "ABSOLUTE FINAL PROJECT-WIDE ICON RESTORATION COMPLETE"
