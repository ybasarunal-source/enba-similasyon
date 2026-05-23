$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Character Definitions (Hex only for safety)
$excel  = [char]::ConvertFromUtf32(0x1F4C8) # 📈
$down   = [char]0x2B07                     # ⬇
$tasks  = [char]::ConvertFromUtf32(0x1F4CB) # 📋
$trash  = [char]::ConvertFromUtf32(0x1F5D1) # 🗑️
$rocket = [char]::ConvertFromUtf32(0x1F680) # 🚀

$I_dot_cap = [char]0x0130 # İ
$U_uml_cap = [char]0x00DC # Ü
$S_ced_cap = [char]0x015E # Ş
$s_ced_low = [char]0x015F # ş
$C_ced_cap = [char]0x00C7 # Ç
$i_dot_low = [char]0x0131 # ı
$g_bre_low = [char]0x011F # ğ

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

# --- SIDEBAR RESTORATION (FINAL TYPO FIX) ---
Fix-File "components\Sidebar.jsx" 27 "                    $excel EXCEL ${I_dot_cap}LE Y${U_uml_cap}KLE"
Fix-File "components\Sidebar.jsx" 30 "                    $down ${S_ced_cap}ABLON ${I_dot_cap}ND${I_dot_cap}R"
Fix-File "components\Sidebar.jsx" 33 "                <h2 style={{ textTransform: 'lowercase' }}>$tasks ${I_dot_cap}PK L${I_dot_cap}STES${I_dot_cap}</h2>"
Fix-File "components\Sidebar.jsx" 39 "                        <div className=""card-info"">Giri${s_ced_low}: {window.fmt(plan.parametreler.aylikTon)} Ton | ${C_ced_cap}${i_dot_low}k${i_dot_low}${s_ced_low}: {window.fmt(plan.kutleDengesi?.toplamSatisTon || plan.parametreler.aylikTon)} Ton</div>"
Fix-File "components\Sidebar.jsx" 53 "                    <button className=""btn btn-reset"" onClick={verileriSifirla}>$trash t${u_low}m verileri ve planları sil</button>"

# --- STEP 6 (DIĞER FIX) ---
Fix-File "components\wizard\detailed\DetStep6_Investment.jsx" 45 "                            <option value=""diger"">$tools Di${g_bre_low}er</option>"

Write-Host "PERFECT TYPOGRAPHY RESTORATION COMPLETE"
