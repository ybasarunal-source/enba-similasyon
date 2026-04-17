function LandingPage({ navigate, user, t }) {
    const [stats, setStats] = React.useState({
        totalStock: 0,
        rawStock: 0,
        mamulStock: 0,
        prodPerformance: 0,
        monthlyProd: 0,
        licenseAlerts: 0,
        activeTasks: 0,
        overdueTasks: 0,
        urgentTaskList: [],
        upcomingPayments: [],
        totalPendingOutgoing: 0,
        activePlanTitle: "",
        hasData: false
    });

    const [activeTab, setActiveTab] = React.useState('tasks'); // 'tasks', 'payments', 'licenses'

    const isAuthorized = (pageId) => {
        if (!user) return false;
        if (user.role === window.USER_ROLES.ADMIN || user.role === window.USER_ROLES.GENEL_MUDUR) return true;
        return user.allowedModules && user.allowedModules.includes(pageId);
    };

    React.useEffect(() => {
        const loadStats = () => {
            try {
                const alislar = JSON.parse(localStorage.getItem('enba_alislar') || '[]');
                const satislar = JSON.parse(localStorage.getItem('enba_satislar') || '[]');
                const uretim = JSON.parse(localStorage.getItem('enba_uretim_kayitlari') || '[]');
                const planlar = JSON.parse(localStorage.getItem('enba_uretim_planlar') || '[]');
                const lan = localStorage.getItem('enba_lisans_ruhsat');
                const lisanslar = lan ? JSON.parse(lan) : [];
                const tsk = localStorage.getItem('enba_tasks');
                const tasks = tsk ? JSON.parse(tsk) : [];

                const rawPurchased = alislar.reduce((s, a) => s + (parseFloat(a.netMiktar) || 0), 0);
                const rawSold = satislar.filter(s => s.stokTuru === 'hammadde').reduce((s, a) => s + (parseFloat(a.miktar) || 0), 0);
                const netRaw = Math.max(0, rawPurchased - rawSold);

                const totalProd = uretim.reduce((s, a) => s + (parseFloat(a.cikanUrun) || 0), 0);
                const mamulSold = satislar.filter(s => s.stokTuru === 'mamul').reduce((s, a) => s + (parseFloat(a.miktar) || 0), 0);
                const netMamul = Math.max(0, totalProd - mamulSold);

                const bugun = new Date().toISOString().slice(0, 10);
                const activePlan = planlar.find(p => p.baslangicTarihi <= bugun && p.bitisTarihi >= bugun);
                let perf = 0;
                let activeTitle = t('landing.no_active_plan');
                if (activePlan) {
                    activeTitle = activePlan.baslik;
                    const planDays = [];
                    const cur = new Date(activePlan.baslangicTarihi + "T00:00:00");
                    const end = new Date(activePlan.bitisTarihi + "T00:00:00");
                    while (cur <= end) {
                        planDays.push(cur.toISOString().slice(0, 10));
                        cur.setDate(cur.getDate() + 1);
                    }
                    const planActual = uretim
                        .filter(u => planDays.includes(u.tarih))
                        .reduce((s, u) => s + (parseFloat(u.cikanUrun) || 0) / 1000, 0);
                    perf = activePlan.hedefCikanTon > 0 ? (planActual / activePlan.hedefCikanTon) * 100 : 0;
                }

                const thisMonth = new Date().toISOString().slice(0, 7);
                const monthlyP = uretim
                    .filter(u => u.tarih.startsWith(thisMonth))
                    .reduce((s, u) => s + (parseFloat(u.cikanUrun) || 0) / 1000, 0);

                const activeTasks = tasks.filter(t => t.status !== 'done');
                const urgentTasks = [...activeTasks].sort((a,b) => (a.priority === 'high' ? -1 : 1)).slice(0, 5);

                const calculateStatus = (yenilemeDate, isSuresiz) => {
                    if (isSuresiz) return "Aktif";
                    if (!yenilemeDate) return "Bilinmiyor";
                    const renewal = new Date(yenilemeDate);
                    const diffDays = Math.ceil((renewal - new Date()) / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) return "Süresi Dolmuş";
                    if (diffDays <= 30) return "Yaklaşıyor";
                    return "Aktif";
                };
                const alerts = lisanslar.filter(l => ["Süresi Dolmuş", "Yaklaşıyor"].includes(calculateStatus(l.yenilemeTarihi, l.isSuresiz)));

                const pay = localStorage.getItem('enba_payments');
                const payments = pay ? JSON.parse(pay) : [];
                const pendingOutgoing = payments.filter(p => p.type === 'outgoing' && p.status !== 'paid');
                const sortedUpcoming = [...pendingOutgoing].sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));

                setStats({
                    totalStock: (netRaw + netMamul) / 1000,
                    rawStock: netRaw / 1000,
                    mamulStock: netMamul / 1000,
                    prodPerformance: perf,
                    monthlyProd: monthlyP,
                    licenseAlerts: alerts.length,
                    activeTasks: activeTasks.length,
                    urgentTaskList: urgentTasks,
                    upcomingPayments: sortedUpcoming.slice(0, 5),
                    totalPendingOutgoing: pendingOutgoing.reduce((s,p) => s + (parseFloat(p.amount)||0), 0),
                    activePlanTitle: activeTitle,
                    hasData: true
                });
            } catch (e) { console.error("Stats load error", e); }
        };
        loadStats();
    }, []);

    const fmt = (n) => (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });

    // SVG Donut Chart for Stock
    const StockChart = () => {
        const total = stats.totalStock || 1;
        const rawP = (stats.rawStock / total) * 100;
        const mamulP = (stats.mamulStock / total) * 100;
        
        // Simple SVG implementation
        const radius = 70;
        const circ = 2 * Math.PI * radius;
        const rawOffset = circ - (rawP / 100) * circ;
        const mamulOffset = circ - (mamulP / 100) * circ;

        return (
            <div className="chart-wrap">
                <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                    <svg viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                        <circle cx="100" cy="100" r={radius} fill="transparent" stroke="#f0f2f5" strokeWidth="20" />
                        <circle cx="100" cy="100" r={radius} fill="transparent" stroke="var(--enba-dark)" strokeWidth="20"
                            strokeDasharray={circ} strokeDashoffset={rawOffset} style={{ transition: 'stroke-dashoffset 1s ease' }} />
                        <circle cx="100" cy="100" r={radius} fill="transparent" stroke="var(--enba-orange)" strokeWidth="20"
                            strokeDasharray={circ} strokeDashoffset={circ - (mamulP/100)*circ + (rawP/100)*circ} 
                            style={{ transition: 'stroke-dashoffset 1s ease', transformOrigin: 'center', transform: `rotate(${(rawP/100)*360}deg)` }} />
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 800 }}>{fmt(stats.totalStock)}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{t('landing.ton')}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--enba-dark)' }}></div>
                        <div style={{ fontSize: '13px', color: '#333' }}><b>{t('landing.raw_stock')}:</b> {fmt(stats.rawStock)} T (%{fmt(rawP)})</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--enba-orange)' }}></div>
                        <div style={{ fontSize: '13px', color: '#333' }}><b>{t('landing.mamul_stock')}:</b> {fmt(stats.mamulStock)} T (%{fmt(mamulP)})</div>
                    </div>
                </div>
            </div>
        );
    };

    const tabHeaderStyle = (id) => ({
        padding: '12px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
        color: activeTab === id ? 'var(--enba-orange)' : '#aaa',
        borderBottom: activeTab === id ? '3px solid var(--enba-orange)' : '3px solid transparent',
        transition: 'all 0.3s ease'
    });

    return (
        <div className="landing-container" style={{ padding: '30px', background: 'var(--surface)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            
            <header className="landing-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--enba-dark)' }}>
                        {t('landing.welcome')} {user.name}
                    </h1>
                    <p style={{ color: '#666', margin: '4px 0 0', fontSize: '14px' }}>{new Date().toLocaleDateString(localStorage.getItem('enba_lang') === 'TR' ? 'tr-TR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="btn-group">
                    <button onClick={() => navigate('uretimTakip')} style={{ padding: '8px 16px', borderRadius: '0.8rem', border: '1px solid #ddd', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flex: 1 }}>{t('landing.fast_prod')}</button>
                    <button onClick={() => navigate('stok')} style={{ padding: '8px 16px', borderRadius: '0.8rem', border: 'none', background: 'var(--enba-orange-dark)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(227,82,5,0.2)', flex: 1 }}>{t('landing.purchase_record')}</button>
                </div>
            </header>

            {/* KPI PANEL (KOMPAKT) */}
            <div className="kpi-grid">
                {[
                    { label: t('landing.stock_status'), value: `${fmt(stats.totalStock)} ` + t('landing.ton'), icon: 'ph-package', color: '#FFF2EB' },
                    { label: t('landing.prod_efficiency'), value: `%${fmt(stats.prodPerformance)}`, icon: 'ph-lightning', color: '#FEF9F2' },
                    { label: t('landing.monthly_prod'), value: `${fmt(stats.monthlyProd)} ` + t('landing.ton'), icon: 'ph-factory', color: '#F7F7F7' },
                    { label: t('landing.payment_burden'), value: `${fmt(stats.totalPendingOutgoing)} ₺`, icon: 'ph-money', color: '#FFF5F0' }
                ].map((kpi, i) => (
                    <div key={i} style={{ background: '#fff', padding: '20px', borderRadius: '1.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
                        <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>{kpi.label}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <i className={`ph ${kpi.icon}`} style={{ fontSize: '24px', color: 'var(--enba-orange)' }}></i>
                            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--enba-dark)' }}>{kpi.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="main-grid">
                
                {/* SOL: STOK DAĞILIMI (GRAFİK) */}
                <div style={{ background: '#fff', padding: '24px', borderRadius: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>📊 {t('landing.stock_analysis')}</h3>
                        <button onClick={() => navigate('stok')} className="btn-text" style={{ color: 'var(--enba-dark)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>{t('landing.view_details')} →</button>
                    </div>
                    <StockChart />
                    <div style={{ marginTop: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '1rem', fontSize: '13px', color: '#666', border: '1px solid #eee' }}>
                        <b>{t('common.info') || 'Tip'}:</b> {t('landing.stock_tip')} (%{fmt((stats.mamulStock / (stats.totalStock || 1)) * 100)})
                    </div>
                </div>

                {/* SAĞ: AKSİYON MERKEZİ (TABLI) */}
                <div style={{ background: '#fff', borderRadius: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #eee', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', background: '#fcfcfc', borderBottom: '1px solid #eee' }}>
                        <div onClick={() => setActiveTab('tasks')} style={tabHeaderStyle('tasks')}><i className="ph ph-check-square-offset"></i> {t('landing.tasks')} ({stats.activeTasks})</div>
                        <div onClick={() => setActiveTab('payments')} style={tabHeaderStyle('payments')}><i className="ph ph-credit-card"></i> {t('landing.payments')} ({stats.upcomingPayments.length})</div>
                        <div onClick={() => setActiveTab('licenses')} style={tabHeaderStyle('licenses')}><i className="ph ph-certificate"></i> {t('landing.licenses')} ({stats.licenseAlerts})</div>
                    </div>

                    <div style={{ padding: '20px', flex: 1, overflowY: 'auto', maxHeight: '350px' }}>
                        {activeTab === 'tasks' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {stats.urgentTaskList.length > 0 ? stats.urgentTaskList.map(task => (
                                    <div key={task.id} style={{ padding: '12px', background: '#f9f9f9', borderRadius: '1rem', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{task.title}</div>
                                            <div style={{ fontSize: '11px', color: '#999' }}>{t('prod.deadline') || 'Deadline'}: {task.deadline}</div>
                                        </div>
                                        <div style={{ fontSize: '10px', color: task.priority === 'high' ? '#e74c3c' : 'var(--enba-orange)', fontWeight: 800 }}>{task.priority.toUpperCase()}</div>
                                    </div>
                                )) : <div style={{ textAlign: 'center', color: '#ccc', marginTop: '20px' }}>{t('landing.no_tasks') || 'No tasks'}</div>}
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {stats.upcomingPayments.length > 0 ? stats.upcomingPayments.map(p => (
                                    <div key={p.id} style={{ padding: '12px', background: '#fcfcfc', borderRadius: '1rem', border: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{p.title}</div>
                                            <div style={{ fontSize: '11px', color: '#999' }}>{p.dueDate} • {p.category}</div>
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#e74c3c' }}>-{window.fmt(p.amount)} ₺</div>
                                    </div>
                                )) : <div style={{ textAlign: 'center', color: '#ccc', marginTop: '20px' }}>{t('landing.no_payments') || 'No payments'}</div>}
                            </div>
                        )}

                        {activeTab === 'licenses' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {stats.licenseAlerts > 0 ? (
                                    <div style={{ padding: '15px', background: 'rgba(231, 76, 60, 0.05)', borderRadius: '1rem', border: '1px solid rgba(231, 76, 60, 0.1)', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 800, color: '#e74c3c', fontSize: '16px' }}>{stats.licenseAlerts} {t('landing.license_alerts')}</div>
                                        <button onClick={() => navigate('lisansTakip')} style={{ marginTop: '10px', padding: '5px 15px', borderRadius: '5px', border: 'none', background: '#e74c3c', color: '#fff', cursor: 'pointer', fontSize: '11px' }}>{t('landing.view_details')}</button>
                                    </div>
                                ) : <div style={{ textAlign: 'center', color: '#ccc', marginTop: '20px' }}>{t('landing.no_alerts') || 'No alerts'}</div>}
                            </div>
                        )}
                    </div>
                    
                    <button onClick={() => navigate(activeTab === 'tasks' ? 'gorevler' : activeTab === 'payments' ? 'odemeTakip' : 'lisansTakip')} 
                        style={{ padding: '15px', background: '#fcfcfc', border: 'none', borderTop: '1px solid #eee', color: 'var(--enba-dark)', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>
                        {t('common.view_all')} →
                    </button>
                </div>
            </div>

            {/* FOOTER */}
            <footer style={{ background: 'transparent', color: '#aaa', textAlign: 'center', padding: '30px 0', fontSize: '11px' }}>
                © {new Date().getFullYear()} Enba Recycling - Tesis Yönetim Platformu v2.0
            </footer>
        </div>
    );}

window.LandingPage = LandingPage;


