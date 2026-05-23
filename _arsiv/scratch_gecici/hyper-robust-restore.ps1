$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Character Definitions (Hex only for safety)
$excel  = [char]::ConvertFromUtf32(0x1F4C8) # 📈
$down   = [char]0x2B07                     # ⬇
$tasks  = [char]::ConvertFromUtf32(0x1F4CB) # 📋
$trash  = [char]::ConvertFromUtf32(0x1F5D1) # 🗑️
$rocket = [char]::ConvertFromUtf32(0x1F680) # 🚀

$I_cap  = [char]0x0130 # İ
$S_cap  = [char]0x15E  # Ş
$s_low  = [char]0x15F  # ş
$u_low  = [char]0x00FC # ü
$i_dot  = [char]0x0131 # ı
$C_cap  = [char]0x00C7 # Ç
$g_low  = [char]0x11F  # ğ

# Helper function
function Fix-File($path, $lineIndex, $newText) {
    if (Test-Path $path) {
        $c = Get-Content $path -Encoding UTF8
        if ($lineIndex -lt $c.Length) {
            $c[$lineIndex] = $newText
            [System.IO.File]::WriteAllLines($path, $c, $Utf8NoBom)
            Write-Host "Fixed $path line $($lineIndex+1)"
        }
    }
}

# --- SIDEBAR RESTORATION ---
Fix-File "components\Sidebar.jsx" 27 "                    $excel EXCEL ${I_cap}LE Y${u_low}KLE"
Fix-File "components\Sidebar.jsx" 30 "                    $down ${S_cap}ABLON ${I_cap}ND${i_dot}R"
Fix-File "components\Sidebar.jsx" 33 "                <h2 style={{ textTransform: 'lowercase' }}>$tasks ${I_cap}PK L${I_cap}STES${I_cap}</h2>"
Fix-File "components\Sidebar.jsx" 39 "                        <div className=""card-info"">Giri${s_low}: {window.fmt(plan.parametreler.aylikTon)} Ton | ${C_cap}${i_dot}k${i_dot}${s_low}: {window.fmt(plan.kutleDengesi?.toplamSatisTon || plan.parametreler.aylikTon)} Ton</div>"
Fix-File "components\Sidebar.jsx" 53 "                    <button className=""btn btn-reset"" onClick={verileriSifirla}>$trash t${u_low}m verileri ve planları sil</button>"

# --- APP NAVIGATION RESTORATION ---
Fix-File "app.jsx" 603 "                        <span className=""nav-icon"">$rocket</span>"

Write-Host "HYPER-ROBUST RESTORATION COMPLETE"
