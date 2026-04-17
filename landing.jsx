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
                        <circle cx="100" cy="100" r={radius} fill="transparent" stroke="var(--surface-container-high)" strokeWidth="20" />
                        <circle cx="100" cy="100" r={radius} fill="transparent" stroke="var(--enba-dark)" strokeWidth="20"
                            strokeDasharray={circ} strokeDashoffset={rawOffset} style={{ transition: 'stroke-dashoffset 1s ease' }} />
                        <circle cx="100" cy="100" r={radius} fill="transparent" stroke="var(--enba-orange)" strokeWidth="20"
                            strokeDasharray={circ} strokeDashoffset={circ - (mamulP/100)*circ + (rawP/100)*circ} 
                            style={{ transition: 'stroke-dashoffset 1s ease', transformOrigin: 'center', transform: `rotate(${(rawP/100)*360}deg)` }} />
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--on-surface)' }}>{fmt(stats.totalStock)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>{t('landing.ton')}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--enba-dark)' }}></div>
                        <div style={{ fontSize: '13px', color: 'var(--on-surface)' }}><b>{t('landing.raw_stock')}:</b> {fmt(stats.rawStock)} T (%{fmt(rawP)})</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--enba-orange)' }}></div>
                        <div style={{ fontSize: '13px', color: 'var(--on-surface)' }}><b>{t('landing.mamul_stock')}:</b> {fmt(stats.mamulStock)} T (%{fmt(mamulP)})</div>
                    </div>
                </div>
            </div>
        );
    };

    const tabHeaderStyle = (id) => ({
        padding: '12px 24px', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
        color: activeTab === id ? 'var(--enba-dark)' : 'var(--on-surface-variant)',
        borderBottom: activeTab === id ? '3px solid var(--enba-orange)' : '3px solid transparent',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', gap: '8px'
    });

    return (
        <div className="landing-container" style={{ padding: '30px', background: 'var(--surface)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            
            <header className="landing-header">
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: 'var(--enba-dark)', fontFamily: "'Manrope', sans-serif" }}>
                        {t('landing.welcome')} {user.name}
                    </h1>
                    <p style={{ color: 'var(--on-surface-variant)', margin: '4px 0 0', fontSize: '15px' }}>{new Date().toLocaleDateString(localStorage.getItem('enba_lang') === 'TR' ? 'tr-TR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="btn-group">
                    <button onClick={() => navigate('uretimTakip')} style={{ padding: '8px 16px', borderRadius: '0.8rem', border: '1px solid #ddd', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flex: 1 }}>{t('landing.fast_prod')}</button>
                    <button onClick={() => navigate('stok')} style={{ padding: '8px 16px', borderRadius: '0.8rem', border: 'none', background: 'var(--enba-orange-dark)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(227,82,5,0.2)', flex: 1 }}>{t('landing.purchase_record')}</button>
                </div>
            </header>

            {/* KPI PANEL (KOMPAKT) */}
            <div className="kpi-grid">
                {[
                    { label: t('landing.stock_status'), value: `${fmt(stats.totalStock)} ` + t('landing.ton'), icon: 'ph-fill ph-package' },
                    { label: t('landing.prod_efficiency'), value: `%${fmt(stats.prodPerformance)}`, icon: 'ph-fill ph-lightning' },
                    { label: t('landing.monthly_prod'), value: `${fmt(stats.monthlyProd)} ` + t('landing.ton'), icon: 'ph-fill ph-factory' },
                    { label: t('landing.payment_burden'), value: `${fmt(stats.totalPendingOutgoing)} ₺`, icon: 'ph-fill ph-money' }
                ].map((kpi, i) => (
                    <div key={i} className="enba-card" style={{ padding: '24px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>{kpi.label}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '1rem', background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className={kpi.icon} style={{ fontSize: '24px', color: 'var(--enba-orange)' }}></i>
                            </div>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--enba-dark)', fontFamily: "'Manrope', sans-serif" }}>{kpi.value}</span>
                        </div>
                    </div>
                ))}
            </div>
 domestic
            <div className="main-grid">
                
                {/* SOL: STOK DAĞILIMI (GRAFİK) */}
                <div className="enba-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="ph-fill ph-chart-pie" style={{ color: 'var(--enba-orange)' }}></i> {t('landing.stock_analysis')}
                        </h3>
                        <button onClick={() => navigate('stok')} style={{ color: 'var(--enba-dark)', fontWeight: 800, background: 'var(--surface-container-high)', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '6px 12px', borderRadius: '0.5rem' }}>{t('landing.view_details')} →</button>
                    </div>
                    <StockChart />
                    <div style={{ marginTop: '32px', padding: '20px', background: 'var(--surface-container-low)', borderRadius: '1rem', fontSize: '13px', color: 'var(--on-surface-variant)', border: '1px solid var(--surface-container-highest)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <i className="ph-fill ph-info" style={{ fontSize: '18px', color: 'var(--enba-orange)', marginTop: '2px' }}></i>
                        <span>
                            <b>{t('common.info') || 'Tip'}:</b> {t('landing.stock_tip')} (%{fmt((stats.mamulStock / (stats.totalStock || 1)) * 100)})
                        </span>
                    </div>
                </div>

                {/* SAĞ: AKSİYON MERKEZİ (TABLI) */}
                <div className="enba-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', background: 'var(--surface-container-low)', borderBottom: '1px solid var(--surface-container-highest)' }}>
                        <div onClick={() => setActiveTab('tasks')} style={tabHeaderStyle('tasks')}><i className="ph ph-check-square-offset"></i> {t('landing.tasks')} <span style={{ marginLeft: '4px', opacity: 0.6 }}>({stats.activeTasks})</span></div>
                        <div onClick={() => setActiveTab('payments')} style={tabHeaderStyle('payments')}><i className="ph ph-credit-card"></i> {t('landing.payments')} <span style={{ marginLeft: '4px', opacity: 0.6 }}>({stats.upcomingPayments.length})</span></div>
                        <div onClick={() => setActiveTab('licenses')} style={tabHeaderStyle('licenses')}><i className="ph ph-certificate"></i> {t('landing.licenses')} <span style={{ marginLeft: '4px', opacity: 0.6 }}>({stats.licenseAlerts})</span></div>
                    </div>

                    <div style={{ padding: '24px', flex: 1, overflowY: 'auto', maxHeight: '380px' }}>
                        {activeTab === 'tasks' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {stats.urgentTaskList.length > 0 ? stats.urgentTaskList.map(task => (
                                    <div key={task.id} style={{ padding: '16px', background: 'var(--surface-container-lowest)', borderRadius: '1rem', border: '1px solid var(--surface-container-highest)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--enba-dark)' }}>{task.title}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{t('prod.deadline') || 'Deadline'}: {task.deadline}</div>
                                        </div>
                                        <div style={{ fontSize: '11px', color: task.priority === 'high' ? 'var(--error)' : 'var(--enba-orange)', fontWeight: 800, background: task.priority === 'high' ? 'rgba(192,57,43,0.1)' : 'rgba(227,82,5,0.1)', padding: '4px 10px', borderRadius: '1rem' }}>{task.priority.toUpperCase()}</div>
                                    </div>
                                )) : <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', marginTop: '40px' }}><i className="ph ph-ghost" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}></i><br/>{t('landing.no_tasks') || 'No tasks'}</div>}
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {stats.upcomingPayments.length > 0 ? stats.upcomingPayments.map(p => (
                                    <div key={p.id} style={{ padding: '16px', background: 'var(--surface-container-lowest)', borderRadius: '1rem', border: '1px solid var(--surface-container-highest)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--enba-dark)' }}>{p.title}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{p.dueDate} • {p.category}</div>
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--error)' }}>-{window.fmt(p.amount)} ₺</div>
                                    </div>
                                )) : <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', marginTop: '40px' }}><i className="ph ph-receipt" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}></i><br/>{t('landing.no_payments') || 'No payments'}</div>}
                            </div>
                        )}

                        {activeTab === 'licenses' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {stats.licenseAlerts > 0 ? (
                                    <div style={{ padding: '24px', background: 'rgba(192, 57, 43, 0.05)', borderRadius: '1.2rem', border: '1px solid rgba(192, 57, 43, 0.1)', textAlign: 'center' }}>
                                        <i className="ph-fill ph-bell-ringing" style={{ fontSize: '32px', color: 'var(--error)', marginBottom: '12px' }}></i>
                                        <div style={{ fontWeight: 800, color: 'var(--error)', fontSize: '16px' }}>{stats.licenseAlerts} {t('landing.license_alerts')}</div>
                                        <button onClick={() => navigate('lisansTakip')} className="btn btn-primary" style={{ marginTop: '16px', borderRadius: '1rem', padding: '8px 24px', background: 'var(--error)' }}>{t('landing.view_details')}</button>
                                    </div>
                                ) : <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', marginTop: '40px' }}><i className="ph ph-seal-check" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}></i><br/>{t('landing.no_alerts') || 'No alerts'}</div>}
                            </div>
                        )}
                    </div>
                    
                    <button onClick={() => navigate(activeTab === 'tasks' ? 'gorevler' : activeTab === 'payments' ? 'odemeTakip' : 'lisansTakip')} 
                        style={{ padding: '16px', background: 'var(--surface-container-low)', border: 'none', borderTop: '1px solid var(--surface-container-highest)', color: 'var(--enba-dark)', fontWeight: 800, cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s' }}>
                        {t('common.view_all')} <i className="ph ph-arrow-right" style={{ marginLeft: '4px' }}></i>
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


