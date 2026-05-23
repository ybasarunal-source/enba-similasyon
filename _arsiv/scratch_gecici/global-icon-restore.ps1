$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Emojis via UTF32 to satisfy PS 5.1
$bolt = [char]0x26A1
$stock = [char]::ConvertFromUtf32(0x1F4E6) # 📦
$factory = [char]::ConvertFromUtf32(0x1F3ED) # 🏭
$money = [char]::ConvertFromUtf32(0x1F4B8) # 💸
$chart = [char]::ConvertFromUtf32(0x1F4CA) # 📊
$tasks = [char]::ConvertFromUtf32(0x1F4CB) # 📋
$card = [char]::ConvertFromUtf32(0x1F4B3) # 💳
$license = [char]::ConvertFromUtf32(0x1F4DC) # 📜

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

# --- LANDING.JSX RESTORATION ---
$pl = "landing.jsx"
if (Test-Path $pl) {
    $c = Get-Content $pl -Encoding UTF8
    $c[177] = "                    { label: t('landing.stock_status'), value: `${fmt(stats.totalStock)} ${t('landing.ton')}`, icon: '$stock', color: '#FFF2EB' },"
    $c[179] = "                    { label: t('landing.monthly_prod'), value: `${fmt(stats.monthlyProd)} ${t('landing.ton')}`, icon: '$factory', color: '#F7F7F7' },"
    $c[180] = "                    { label: t('landing.payment_burden'), value: `${fmt(stats.totalPendingOutgoing)} ${[char]0x20BA}`, icon: '$money', color: '#FFF5F0' }" # ₺ is 0x20BA
    $c[197] = "                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>$chart {t('landing.stock_analysis')}</h3>"
    $c[209] = "                        <div onClick={() => setActiveTab('tasks')} style={tabHeaderStyle('tasks')}>$tasks {t('landing.tasks')} ({stats.activeTasks})</div>"
    $c[210] = "                        <div onClick={() => setActiveTab('payments')} style={tabHeaderStyle('payments')}>$card {t('landing.payments')} ({stats.upcomingPayments.length})</div>"
    $c[211] = "                        <div onClick={() => setActiveTab('licenses')} style={tabHeaderStyle('licenses')}>$license {t('landing.licenses')} ({stats.licenseAlerts})</div>"
    [System.IO.File]::WriteAllLines($pl, $c, $Utf8NoBom)
}

# --- APP.JSX NAVIGATION RESTORATION ---
$pa = "app.jsx"
if (Test-Path $pa) {
    $c = Get-Content $pa -Encoding UTF8
    $c[572] = "                                <div style={{fontSize: '11px', color: '#7F8C8D', marginBottom: '5px'}}>Giriş: {window.fmt(plan.parametreler.aylikTon)} T | Çıkış: {window.fmt(plan.kutleDengesi?.toplamSatisTon)} T</div>"
    $c[594] = "                        <span className=""nav-icon"">$chart</span>"
    $c[598] = "                        <span className=""nav-icon"">$tasks</span>"
    $c[849] = "                    <h3 style={{marginTop: 0, color: '#D35400', textTransform: 'uppercase', fontSize: '15px', letterSpacing: '1px'}}>$bolt TESİS & EKİPMAN KİRA YÖNETİMİ (610)</h3>"
    $c[945] = "                    <h3 style={{marginTop: 0, color: 'var(--capex-purple)', textTransform: 'uppercase', fontSize: '16px', marginBottom: '5px', letterSpacing: '1px'}}>$factory KURULUM VE YATIRIM MALİYETLERİ (CAPEX)</h3>"
    [System.IO.File]::WriteAllLines($pa, $c, $Utf8NoBom)
}

Write-Host "PROJECT-WIDE ICON RESTORATION COMPLETE"
