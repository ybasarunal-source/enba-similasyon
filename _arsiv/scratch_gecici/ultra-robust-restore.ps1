$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Character Definitions
$bolt = [char]0x26A1
$gear = [char]0x2699
$build = [char]::ConvertFromUtf32(0x1F3E2)
$tools = [char]::ConvertFromUtf32(0x1F6E0)
$S_cap = [char]0x15E # Ş
$s_low = [char]0x15F # ş
$I_dot = [char]0x130 # İ
$g_low = [char]0x11F # ğ

# Helper function to write fixed lines
function Fix-File($path, $lineIndex, $newText) {
    if (Test-Path $path) {
        $c = Get-Content $path -Encoding UTF8
        $c[$lineIndex] = $newText
        [System.IO.File]::WriteAllLines($path, $c, $Utf8NoBom)
        Write-Host "Fixed $path at line $($lineIndex+1)"
    }
}

# 1. Step 2 (Customers)
Fix-File "components\wizard\detailed\DetStep2_Customers.jsx" 79 "                        <span style={{ fontWeight:700, fontSize:'13px', color:'#F59E0B', whiteSpace:'nowrap' }}>$bolt ${S_cap}u anki Fire Toplu Giri$s_low</span>"

# 2. Step 4 (Personnel)
Fix-File "components\wizard\detailed\DetStep4_Personnel.jsx" 36 "                <h3 style={{ fontSize:'13px', margin:'0 0 10px', color:'var(--enba-dark)' }}>$bolt ${I_dot}$s_lowci / Personel Rolü Tanımla</h3>"

# 3. Step 6 (Investment)
Fix-File "components\wizard\detailed\DetStep6_Investment.jsx" 43 "                            <option value=""makina"">$gear Makina</option>"
Fix-File "components\wizard\detailed\DetStep6_Investment.jsx" 44 "                            <option value=""insaat"">$build ${I_dot}n$s_lowaat / Tesis</option>"
Fix-File "components\wizard\detailed\DetStep6_Investment.jsx" 45 "                            <option value=""diger"">$tools Di$g_lower</option>"

# 4. app.jsx
Fix-File "app.jsx" 156 "                        // ${S_cap}ablon formatı: [KOD, KALEM ADI, TUTAR]"

Write-Host "ULTRA-ROBUST RESTORATION COMPLETE"
