// ============================================================
//  Enba Recycling — Ana Router
// ============================================================
function EnbaRouter() {
    const [sayfa, setSayfa] = React.useState('landing');
    const [lang, setLang] = React.useState(() => localStorage.getItem('enba_lang') || 'TR');

    const handleLangChange = (newLang) => {
        localStorage.setItem('enba_lang', newLang);
        setLang(newLang);
    };

    const [user, setUser] = React.useState(null);
    const [allUsers, setAllUsers] = React.useState(window.MOCK_USERS);

    // Supabase Auth Listener
    React.useEffect(() => {
        if (!window.supabaseClient) return;

        // Mevcut oturumu kontrol et
        window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                const userData = {
                    id: session.user.id,
                    username: session.user.email?.split('@')[0],
                    name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                    role: session.user.user_metadata?.role || 'operator',
                    avatar: null
                };
                setUser(userData);
            }
        });

        // Değişiklikleri dinle
        const { data: { subscription } } = window.supabaseClient.auth.onAuthStateChange((_event, session) => {
            if (session) {
                const userData = {
                    id: session.user.id,
                    username: session.user.email?.split('@')[0],
                    name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                    role: session.user.user_metadata?.role || 'operator',
                    avatar: null
                };
                setUser(userData);
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Listen for user data updates (from YetkiYonetimi)
    React.useEffect(() => {
        const handleUpdate = () => {
            const saved = localStorage.getItem('enba_users_data');
            if (saved) setAllUsers(JSON.parse(saved));
        };
        window.addEventListener('enba_users_updated', handleUpdate);
        return () => window.removeEventListener('enba_users_updated', handleUpdate);
    }, []);

    const onLogin = (userData, remember) => {
        setUser(userData);
        setSayfa('landing');
    };

    const onLogout = async () => {
        if (window.supabaseClient) {
            await window.supabaseClient.auth.signOut();
        }
        setUser(null);
        setSayfa('landing');
    };

    const hasAccess = (pageId) => {
        if (!user) return false;
        if (pageId === 'profilim' || pageId === 'landing') return true;
        
        if (user.role === window.USER_ROLES.ADMIN) return true;
        
        // 1. Role-based check
        const rolePermissions = window.ROLE_TEMPLATES[user.role] || [];
        if (rolePermissions.includes(pageId)) return true;

        // 2. Manual override check
        return user.allowedModules && user.allowedModules.includes(pageId);
    };

    // App bileşeninin bekleyenPlanlar & aktifPlanlar state'i
    const [bekleyenPlanlar, setBekleyenPlanlar] = React.useState([]);
    const [aktifPlanlar, setAktifPlanlar] = React.useState([]);

    // Planları Supabase'den çek
    React.useEffect(() => {
        if (!user) return;
        const loadPlans = async () => {
            const allPlans = await window.DataService.getPlans();
            // Veritabanından gelen formatı uygulama formatına çevir (content içinde saklıyoruz)
            const extracted = allPlans.map(p => ({ ...p.content, id: p.id, status: p.status }));
            setBekleyenPlanlar(extracted.filter(p => p.status === 'pending'));
            setAktifPlanlar(extracted.filter(p => p.status === 'active'));
        };
        loadPlans();
    }, [user, sayfa]);

    const navigate = (hedef) => {
        if (!user) {
            setSayfa('landing');
            return;
        }
        setSayfa(hedef);
    };

    // Komponentleri window nesnesinden güvenli bir şekilde al
    const LoginPage = window.LoginPage;
    const LandingPage = window.LandingPage;
    const App = window.App;
    const DetayliPlanModulu = window.DetayliPlanModulu;
    const PnlRaporu = window.PnlRaporu;
    const UretimTakipModulu = window.UretimTakipModulu;
    const LojistikModulu = window.LojistikModulu;
    const KatalogModulu = window.KatalogModulu;
    const MakinaKatalog = window.MakinaKatalog;
    const ProductionLineModule = window.ProductionLineModule;
    const NakitAkisModulu = window.NakitAkisModulu;
    const UretimPlanlamaModulu = window.UretimPlanlamaModulu;
    const ArsivModulu = window.ArsivModulu;
    const StokModulu = window.StokModulu;
    const LisansRuhsatModulu = window.LisansRuhsatModulu;
    const GorevModulu = window.GorevModulu;
    const MessagingModule = window.MessagingModule;
    const ProfileModule = window.ProfileModule;
    const YetkiYonetimi = window.YetkiYonetimi;
    const OrgChartModule = window.OrgChartModule;
    const HrModule = window.HrModule;
    const PaymentsModule = window.PaymentsModule;
    const EnbaCoPilot = window.EnbaCoPilot;
    const EnbaMessenger = window.EnbaMessenger;

    // Giriş yapmamışsa Login ekranını göster
    if (!user) {
        return <LoginPage onLogin={onLogin} />;
    }

    // Yetki kontrolü (landing hariç her sayfa için)
    if (sayfa !== 'landing' && !hasAccess(sayfa)) {
        return (
            <div className="unauthorized-overlay">
                <div style={{textAlign:'center', padding:'40px', background:'rgba(255,255,255,0.05)', borderRadius:'2rem', border:'1px solid rgba(255,255,255,0.1)'}}>
                    <div style={{fontSize:'48px', marginBottom:'20px'}}>⚡ </div>
                    <h2 style={{margin:'0 0 10px'}}>{window.t('auth.unauthorized')}</h2>
                    <p style={{color:'rgba(255,255,255,0.5)', marginBottom:'30px'}}>{window.t('auth.no_access')}</p>
                    <button className="btn btn-warning" onClick={() => setSayfa('landing')}>{window.t('nav.home')}</button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Üst Navigasyon — tüm sayfalarda görünür */}
            <TopNav aktifSayfa={sayfa} navigate={navigate} user={user} onLogout={onLogout} currentLang={lang} onLangChange={handleLangChange} />

            {sayfa === 'landing'     && <LandingPage navigate={navigate} user={user} t={window.t} />}
            {sayfa === 'isPlanlama'  && <App />}
            {sayfa === 'detayliPlan' && (
                <DetayliPlanModulu
                    navigate={navigate}
                    aktifPlanlar={aktifPlanlar}
                    bekleyenPlanlar={bekleyenPlanlar}
                />
            )}
            {sayfa === 'pnlRapor' && <PnlRaporu />}
            {sayfa === 'uretimTakip' && <UretimTakipModulu />}
            {sayfa === 'lojistikTakip' && <LojistikModulu />}
            {sayfa === 'katalog' && <KatalogModulu />}
            {sayfa === 'makina'     && <MakinaKatalog />}
            {sayfa === 'uretimHatti' && (ProductionLineModule ? <ProductionLineModule /> : <div style={{padding:'100px', textAlign:'center', color:'#fff'}}>Yükleniyor...</div>)}
            {sayfa === 'nakitAkis'   && <NakitAkisModulu aktifPlanlar={aktifPlanlar} />}
            {sayfa === 'uretimPlan' && <UretimPlanlamaModulu />}
            {sayfa === 'arsiv' && <ArsivModulu user={user} />}
            {sayfa === 'stok'  && <StokModulu />}
            {sayfa === 'lisansTakip' && <LisansRuhsatModulu />}
            {sayfa === 'gorevler' && <GorevModulu navigate={navigate} />}
            {sayfa === 'mesajlar' && <MessagingModule user={user} />}
            {sayfa === 'profilim' && (ProfileModule ? 
                <ProfileModule user={user} onUpdate={(updated) => { setUser(updated); localStorage.setItem('enba_current_user', JSON.stringify(updated)); }} /> 
                : <div style={{padding:'100px', textAlign:'center', color:'#fff'}}>Modül yükleniyor...</div>
            )}
            {sayfa === 'yetkiYonetimi' && (YetkiYonetimi ? <YetkiYonetimi /> : <div style={{padding:'100px', textAlign:'center', color:'#fff'}}>Yükleniyor...</div>)}
            {sayfa === 'orgChart' && (OrgChartModule ? <OrgChartModule /> : <div style={{padding:'100px', textAlign:'center', color:'#fff'}}>Yükleniyor...</div>)}
            {sayfa === 'insanKaynaklari' && (HrModule ? <HrModule /> : <div style={{padding:'100px', textAlign:'center', color:'#fff'}}>Modül yükleniyor...</div>)}
            {sayfa === 'odemeTakip' && (PaymentsModule ? <PaymentsModule /> : <div style={{padding:'100px', textAlign:'center', color:'#fff'}}>Modül yükleniyor...</div>)}

            {/* AI Assistant & Messenger — Tüm sayfalarda yüzen butonlar olarak görünür */}
            {EnbaCoPilot && <EnbaCoPilot activePage={sayfa} />}
            {EnbaMessenger && <EnbaMessenger user={user} />}
        </div>
    );
}

const getNavGroups = () => [
    {
        id: 'planlama', label: window.t('nav.planlama'), icon: 'ph-calendar-check',
        items: [
            { sayfa: 'isPlanlama',  label: window.t('modules.fast_plan'), icon: 'ph-lightning' },
            { sayfa: 'detayliPlan', label: window.t('modules.detailed_plan'), icon: 'ph-kanban' },
            { sayfa: 'odemeTakip',  label: window.t('modules.payments'), icon: 'ph-currency-circle-dollar' },
            { sayfa: 'nakitAkis',   label: window.t('modules.cashflow'), icon: 'ph-trend-up' },
        ]
    },
    {
        id: 'raporlar', label: window.t('nav.raporlar'), icon: 'ph-chart-bar',
        items: [
            { sayfa: 'pnlRapor', label: window.t('modules.pnl'), icon: 'ph-file-text' },
        ]
    },
    {
        id: 'operasyon', label: window.t('nav.operasyon'), icon: 'ph-factory',
        items: [
            { sayfa: 'uretimPlan',    label: window.t('modules.prod_plan'), icon: 'ph-clipboard-text' },
            { sayfa: 'uretimTakip',   label: window.t('modules.prod_tracking'), icon: 'ph-monitor-play' },
            { sayfa: 'lojistikTakip', label: window.t('modules.logistics'), icon: 'ph-truck' },
            { sayfa: 'stok',          label: window.t('modules.inventory'), icon: 'ph-package' },
            { sayfa: 'lisansTakip',   label: window.t('modules.licensing'), icon: 'ph-certificate' },
            { sayfa: 'gorevler',      label: window.t('modules.tasks'), icon: 'ph-check-square-offset' },
        ]
    },
    {
        id: 'varliklar', label: window.t('nav.varliklar'), icon: 'ph-buildings',
        items: [
            { sayfa: 'katalog', label: window.t('modules.catalog'), icon: 'ph-book-open-text' },
            { sayfa: 'makina',  label: window.t('modules.machinery'), icon: 'ph-engine' },
            { sayfa: 'uretimHatti', label: window.t('modules.prod_lines'), icon: 'ph-git-branch' },
            { sayfa: 'arsiv',   label: window.t('modules.archive'), icon: 'ph-archive-box' },
        ]
    },
    {
        id: 'sistem', label: window.t('nav.sistem'), icon: 'ph-gear',
        items: [
            { sayfa: 'orgChart',      label: window.t('nav.org_chart'), icon: 'ph-users-three' },
            { sayfa: 'insanKaynaklari', label: window.t('modules.hr'), icon: 'ph-identification-card' },
            { sayfa: 'yetkiYonetimi', label: window.t('nav.auth_mgmt'), icon: 'ph-shield-check' },
        ]
    },
    {
        id: 'iletisim', label: window.t('nav.iletisim'), icon: 'ph-chat-circle',
        items: [
            { sayfa: 'mesajlar', label: window.t('modules.messaging'), icon: 'ph-envelope-simple' },
        ]
    }
];

function TopNav({ aktifSayfa, navigate, user, onLogout, currentLang, onLangChange }) {
    const [acikGrup,  setAcikGrup]  = React.useState(null);
    const [mobAcik,   setMobAcik]   = React.useState(false);
    const [mobGrup,   setMobGrup]   = React.useState(null);

    const navGroups = getNavGroups();

    // Dışarı tıklayınca dropdown kapat
    React.useEffect(() => {
        if (!acikGrup) return;
        const handler = (e) => {
            if (!e.target.closest('.nav-dd-wrap')) setAcikGrup(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [acikGrup]);

    // Rol bazlı filtreleme fonksiyonu
    const canSee = (pageId) => {
        if (!user) return false;
        if (user.role === window.USER_ROLES.ADMIN) return true;
        
        // 1. Role-based check
        const rolePermissions = window.ROLE_TEMPLATES[user.role] || [];
        if (rolePermissions.includes(pageId)) return true;

        // 2. Manual check
        return user.allowedModules && user.allowedModules.includes(pageId);
    };

    // Grupları filtrele: İçinde en az bir erişilebilir sayfa olan grupları göster
    const FILTRELI_GRUPLAR = navGroups.map(g => ({
        ...g,
        items: g.items.filter(i => canSee(i.sayfa))
    })).filter(g => g.items.length > 0);

    const aktifGrup = FILTRELI_GRUPLAR.find(g => g.items.some(i => i.sayfa === aktifSayfa));

    const navItemStyle = (aktif) => ({
        padding: '8px 16px',
        borderRadius: '2rem',
        border: 'none',
        background: aktif ? 'rgba(227,82,5,0.15)' : 'transparent',
        color: aktif ? '#FFB380' : 'rgba(255,255,255,0.70)',
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: '13px',
        cursor: 'pointer',
        letterSpacing: '0.2px',
        transition: 'all 0.18s',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    });

    const dropItemStyle = (aktif) => ({
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 16px',
        background: aktif ? 'rgba(227,82,5,0.15)' : 'transparent',
        color: aktif ? '#FFB380' : 'rgba(255,255,255,0.80)',
        border: 'none', borderRadius: '0.6rem',
        fontFamily: "'Inter', sans-serif", fontWeight: aktif ? 700 : 500,
        fontSize: '13px', cursor: 'pointer', width: '100%', textAlign: 'left',
        transition: 'background 0.15s',
        whiteSpace: 'nowrap',
    });

    return (
        <React.Fragment>
            <nav style={{
                position: 'sticky', top: 0, zIndex: 200,
                background: 'linear-gradient(135deg, rgba(21,34,46,0.98) 0%, rgba(0,11,22,0.99) 100%)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center',
                padding: '0 16px', height: '60px', gap: '4px'
            }}>

                {/* Logo */}
                <button onClick={() => { navigate('landing'); setAcikGrup(null); }}
                    style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'baseline', gap:'4px', padding:'0 5px 0 0', flexShrink:0 }}>
                    <span style={{ fontFamily:"'Manrope', sans-serif", fontWeight:800, fontSize:'20px', color:'#fff', letterSpacing:'-1px', textShadow: '0 2px 8px rgba(255,255,255,0.2)' }}>enba</span>
                    <span className="topnav-recycling" style={{ fontFamily:"'Manrope', sans-serif", fontWeight:600, fontSize:'18px', color:'#FFB380', letterSpacing:'0px', textShadow: '0 2px 8px rgba(227,82,5,0.4)' }}>recycling</span>
                </button>

                <div style={{ width:'1px', height:'24px', background:'rgba(255,255,255,0.12)', margin:'0 6px', flexShrink:0 }} />

                {/* Masaüstü: Ana Sayfa + Gruplar */}
                <div className="nav-desktop-links" style={{ gap:'2px', flex:1, alignItems:'center' }}>

                    {/* Ana Sayfa — direkt link */}
                    <button style={navItemStyle(aktifSayfa === 'landing')}
                        onClick={() => { navigate('landing'); setAcikGrup(null); }}>
                        <i className="ph ph-house"></i> {window.t('nav.home')}
                    </button>

                    {/* Gruplu dropdown menüler */}
                    {FILTRELI_GRUPLAR.map(grup => {
                        const grupAktif = aktifGrup?.id === grup.id;
                        const acik = acikGrup === grup.id;
                        return (
                            <div key={grup.id} className="nav-dd-wrap" style={{ position:'relative' }}>
                                <button
                                    style={{ ...navItemStyle(grupAktif), background: acik ? 'rgba(255,255,255,0.1)' : grupAktif ? 'rgba(227,82,5,0.18)' : 'transparent' }}
                                    onClick={() => setAcikGrup(acik ? null : grup.id)}
                                >
                                    <i className={`ph ${grup.icon}`}></i> {grup.label}
                                    <span style={{ fontSize:'10px', opacity:0.7, marginLeft:'4px', transition:'transform 0.2s', display:'inline-block', transform: acik ? 'rotate(180deg)' : 'none' }}>▾</span>
                                </button>

                                {acik && (
                                    <div style={{
                                        position: 'absolute', top: 'calc(100% + 10px)', left: 0,
                                        background: 'rgba(10,22,34,0.97)', backdropFilter:'blur(20px)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '1rem', padding: '8px',
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                                        minWidth: '220px', zIndex:300,
                                        display:'flex', flexDirection:'column', gap:'2px'
                                    }}>
                                        {grup.items.map(item => (
                                            <button key={item.sayfa}
                                                style={dropItemStyle(aktifSayfa === item.sayfa)}
                                                onClick={() => { navigate(item.sayfa); setAcikGrup(null); }}
                                            >
                                                <i className={`ph ${item.icon}`}></i> {item.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Kullanıcı Profili (Avatar + Dropdown) */}
                <div className="nav-dd-wrap" style={{ position: 'relative', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }} className="nav-user-info-text">
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{user.name}</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase' }}>{user.role}</span>
                    </div>
                    
                    <button 
                        onClick={() => setAcikGrup(acikGrup === 'user_menu' ? null : 'user_menu')}
                        style={{ 
                            width: '38px', height: '38px', borderRadius: '50%', background: 'var(--surface-container-highest)', 
                            border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer', overflow: 'hidden', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', padding: 0
                        }}
                    >
                        {user.avatar ? (
                            <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                                {user.name.split(' ').map(n=>n[0]).join('')}
                            </span>
                        )}
                    </button>

                    {acikGrup === 'user_menu' && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                            background: 'rgba(10,22,34,0.97)', backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1rem', padding: '8px',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                            minWidth: '200px', zIndex: 300,
                            display: 'flex', flexDirection: 'column', gap: '2px'
                        }}>
                            <button style={dropItemStyle(aktifSayfa === 'profilim')} onClick={() => { navigate('profilim'); setAcikGrup(null); }}>
                                <i className="ph ph-user"></i> {window.t('nav.profile')}
                            </button>
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                            
                            <div style={{ padding: '4px 8px', display: 'flex', gap: '4px' }}>
                                {['TR', 'EN', 'DE'].map(lg => (
                                    <button key={lg} 
                                        onClick={() => { onLangChange(lg); setAcikGrup(null); }}
                                        style={{ 
                                            flex: 1, padding: '6px', borderRadius: '0.4rem', border: 'none', 
                                            background: currentLang === lg ? 'var(--enba-orange)' : 'rgba(255,255,255,0.05)',
                                            color: '#fff', fontSize: '10px', fontWeight: 800, cursor: 'pointer'
                                        }}
                                    >
                                        {lg}
                                    </button>
                                ))}
                            </div>

                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                            <button style={{ ...dropItemStyle(false), color: '#ff7675' }} onClick={onLogout}>
                                <i className="ph ph-sign-out"></i> {window.t('auth.logout')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobil Hamburger */}
                <button className="nav-mobile-toggle"
                    onClick={() => setMobAcik(a => !a)}
                    style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', borderRadius:'0.5rem', padding:'6px 10px', cursor:'pointer', fontSize:'18px', marginLeft:'10px' }}>
                    {mobAcik ? '✕' : '☰'}
                </button>
            </nav>

            {/* Mobil tam panel — NAV DIŞINA ÇIKARILDI (Clipping sorununu çözer) */}
            {mobAcik && (
                <div style={{
                    position:'fixed', top:'60px', left:0, right:0, bottom:0,
                    background:'rgba(10,22,34,0.98)', backdropFilter:'blur(20px)',
                    padding:'16px 20px', display:'flex', flexDirection:'column', gap:'4px',
                    zIndex:1000, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', overflowY:'auto'
                }}>
                    <div style={{ padding:'10px 18px', background:'rgba(255,255,255,0.03)', borderRadius:'0.75rem', marginBottom:'10px' }}>
                        <div style={{ color:'var(--enba-orange)', fontSize:'14px', fontWeight:800 }}>{user.name}</div>
                        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'10px', textTransform:'uppercase' }}>{user.role}</div>
                    </div>

                    <button onClick={() => { navigate('landing'); setMobAcik(false); }}
                        style={{ ...dropItemStyle(aktifSayfa === 'landing'), padding:'14px 18px', borderRadius:'0.75rem', fontWeight:700 }}>
                        <i className="ph ph-house"></i> Ana Sayfa
                    </button>

                    <div style={{ height:'1px', background:'rgba(255,255,255,0.08)', margin:'8px 0' }} />

                    {FILTRELI_GRUPLAR.map(grup => (
                        <div key={grup.id}>
                            <button onClick={() => setMobGrup(mobGrup === grup.id ? null : grup.id)}
                                style={{
                                    display:'flex', alignItems:'center', justifyContent:'space-between',
                                    width:'100%', padding:'12px 18px', background:'rgba(255,255,255,0.05)',
                                    border:'none', borderRadius:'0.75rem', color:'rgba(255,255,255,0.5)',
                                    fontFamily:"'Inter', sans-serif", fontWeight:700, fontSize:'11px',
                                    textTransform:'uppercase', letterSpacing:'0.8px', cursor:'pointer', marginBottom:'2px'
                                }}>
                                <span><i className={`ph ${grup.icon}`}></i> {grup.label}</span>
                                <span style={{ fontSize:'10px', transform: mobGrup===grup.id?'rotate(180deg)':'none', transition:'transform 0.2s', display:'inline-block' }}>▾</span>
                            </button>
                            {mobGrup === grup.id && (
                                <div style={{ paddingLeft:'10px', marginBottom:'8px' }}>
                                    {grup.items.map(item => (
                                        <button key={item.sayfa} onClick={() => { navigate(item.sayfa); setMobAcik(false); }}
                                            style={{ ...dropItemStyle(aktifSayfa === item.sayfa), padding:'12px 18px', margin:'2px 0' }}>
                                            <i className={`ph ${item.icon}`}></i> {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    
                    <button onClick={onLogout}
                        style={{ ...dropItemStyle(false), marginTop:'20px', color:'#ff7675', background:'rgba(231,76,60,0.1)' }}>
                        ⚡  Sistemden Güvenli Çıkış
                    </button>
                </div>
            )}
        </React.Fragment>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<EnbaRouter />);

