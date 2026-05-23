$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Character Definitions
$bt = [char]0x60 # Backtick `
$bolt = [char]0x26A1
$stock = [char]::ConvertFromUtf32(0x1F4E6) # 📦
$factory = [char]::ConvertFromUtf32(0x1F3ED) # 🏭
$money = [char]::ConvertFromUtf32(0x1F4B8) # 💸
$chart = [char]::ConvertFromUtf32(0x1F4CA) # 📊
$tasks = [char]::ConvertFromUtf32(0x1F4CB) # 📋
$card = [char]::ConvertFromUtf32(0x1F4B3) # 💳
$license = [char]::ConvertFromUtf32(0x1F4DC) # 📜
$try = [char]0x20BA # ₺

# --- LANDING.JSX EMERGENCY REPAIR ---
$pl = "landing.jsx"
if (Test-Path $pl) {
    $c = Get-Content $pl -Encoding UTF8
    $c[177] = "                    { label: t('landing.stock_status'), value: ${bt}${([char]0x24)}{fmt(stats.totalStock)} ${bt} + t('landing.ton'), icon: '$stock', color: '#FFF2EB' },"
    $c[179] = "                    { label: t('landing.monthly_prod'), value: ${bt}%${([char]0x24)}{fmt(stats.prodPerformance)}${bt}, icon: '$bolt', color: '#FEF9F2' }," # Fixed index error
    $c[179] = "                    { label: t('landing.monthly_prod'), value: ${bt}${([char]0x24)}{fmt(stats.monthlyProd)} ${bt} + t('landing.ton'), icon: '$factory', color: '#F7F7F7' },"
    $c[180] = "                    { label: t('landing.payment_burden'), value: ${bt}${([char]0x24)}{fmt(stats.totalPendingOutgoing)} $try${bt}, icon: '$money', color: '#FFF5F0' }"
    
    # Re-writing the array correctly to avoid index confusion
    $lines = Get-Content $pl -Encoding UTF8
    $lines[177] = "                    { label: t('landing.stock_status'), value: ${bt}${([char]0x24)}{fmt(stats.totalStock)} ${bt} + t('landing.ton'), icon: '$stock', color: '#FFF2EB' },"
    $lines[178] = "                    { label: t('landing.prod_efficiency'), value: ${bt}%${([char]0x24)}{fmt(stats.prodPerformance)}${bt}, icon: '$bolt', color: '#FEF9F2' },"
    $lines[179] = "                    { label: t('landing.monthly_prod'), value: ${bt}${([char]0x24)}{fmt(stats.monthlyProd)} ${bt} + t('landing.ton'), icon: '$factory', color: '#F7F7F7' },"
    $lines[180] = "                    { label: t('landing.payment_burden'), value: ${bt}${([char]0x24)}{fmt(stats.totalPendingOutgoing)} $try${bt}, icon: '$money', color: '#FFF5F0' }"
    
    [System.IO.File]::WriteAllLines($pl, $lines, $Utf8NoBom)
}

# --- APP.JSX EMERGENCY REPAIR ---
$pa = "app.jsx"
if (Test-Path $pa) {
    $c = Get-Content $pa -Encoding UTF8
    $c[572] = "                                <div style={{fontSize: '11px', color: '#7F8C8D', marginBottom: '5px'}}>Giriş: {window.fmt(plan.parametreler.aylikTon)} T | Çıkış: {window.fmt(plan.kutleDengesi?.toplamSatisTon)} T</div>"
    $c[594] = "                        <span className=""nav-icon"">$chart</span>"
    $c[598] = "                        <span className=""nav-icon"">$tasks</span>"
    [System.IO.File]::WriteAllLines($pa, $c, $Utf8NoBom)
}

Write-Host "EMERGENCY REPAIR COMPLETE"
