// ============================================================
//  Enba Recycling — Üretim Hattı Yönetimi (Industrial Tech Edition)
// ============================================================

function ProductionLineModule() {
    const [lines, setLines] = React.useState(() => {
        const saved = localStorage.getItem('enba_production_lines');
        return saved ? JSON.parse(saved) : [];
    });

    const [makinalar] = React.useState(() => {
        const k = localStorage.getItem('enba_makinalar_v2');
        return k ? JSON.parse(k) : [];
    });

    const [activeLineId, setActiveLineId] = React.useState(null);
    const [lineName, setLineName] = React.useState('');

    // Persistence
    React.useEffect(() => {
        localStorage.setItem('enba_production_lines', JSON.stringify(lines));
    }, [lines]);

    const activeLine = lines.find(l => l.id === activeLineId);

    // --- Industrial Theme Palette ---
    const THEME = {
        primary: 'var(--enba-dark)',     // Deep Industrial Blue
        secondary: 'var(--on-surface-variant)',   // Steel Gray
        accent: 'var(--enba-orange)',      // Tech Blue
        danger: 'var(--error)',      // Bottleneck Red
        surface: 'var(--surface-container-low)'      // Metallic Light Gray
    };

    // --- Hierarchical Size Engine ---
    const getMachineTier = (m) => {
        if (!m) return { id: 'medium', width: '200px', icon: '36px', scale: 1 };
        
        // 1. Priority: Manual Selection from Catalog
        if (m.boyut === 'Büyük') return { id: 'large', width: '240px', icon: '48px', scale: 1.05 };
        if (m.boyut === 'Orta')  return { id: 'medium', width: '200px', icon: '36px', scale: 1 };
        if (m.boyut === 'Küçük') return { id: 'small', width: '160px', icon: '28px', scale: 0.85 };

        // 2. Fallback: Smart Keyword Engine
        const n = (m.adi || '').toLowerCase();
        const c = (m.kategori || '').toLowerCase();
        
        if (n.includes('kırma') || n.includes('shredder') || n.includes('ekstrüder') || n.includes('eritm') || n.includes('wash') || n.includes('yıkama') || n.includes('değirmen')) {
            return { id: 'large', width: '240px', icon: '48px', scale: 1.05 };
        }
        
        if (n.includes('silo') || n.includes('paket') || n.includes('press') || n.includes('sort') || n.includes('ayrıştırma')) {
            return { id: 'medium', width: '200px', icon: '36px', scale: 0.95 };
        }
        
        if (n.includes('bant') || n.includes('conveyor') || c.includes('konveyör') || n.includes('motor') || n.includes('pompa')) {
            return { id: 'small', width: '160px', icon: '28px', scale: 0.85 };
        }
        
        return { id: 'medium', width: '200px', icon: '36px', scale: 1 };
    };

    // --- Smart Icon Engine ---
    const getMachineIcon = (name, category) => {
        const n = (name || '').toLowerCase();
        const c = (category || '').toLowerCase();
        
        if (n.includes('kırma') || n.includes('shredder')) return <i className="ph ph-lightning"></i>;
        if (n.includes('yıkama') || n.includes('wash')) return <i className="ph ph-drop"></i>;
        if (n.includes('ekstrüder') || n.includes('extruder') || n.includes('eritm')) return <i className="ph ph-fire"></i>;
        if (n.includes('bant') || n.includes('conveyor') || c.includes('konveyör')) return <i className="ph ph-arrows-left-right"></i>;
        if (n.includes('silo')) return <i className="ph ph-cylinder"></i>;
        if (n.includes('paket') || n.includes('press')) return <i className="ph ph-package"></i>;
        if (n.includes('ayrıştırma') || n.includes('sort')) return <i className="ph ph-funnel"></i>;
        if (n.includes('değirmen')) return <i className="ph ph-spinner"></i>;
        
        return <i className="ph ph-gear"></i>; // Default
    };

    // --- Actions ---
    const handleAddLine = () => {
        if (!lineName) return;
        const newLine = { id: 'line_' + Date.now(), name: lineName, machines: [] };
        setLines([...lines, newLine]);
        setActiveLineId(newLine.id);
        setLineName('');
    };

    const addMachineToLine = (machine) => {
        if (!activeLineId) return;
        setLines(lines.map(l => {
            if (l.id === activeLineId) {
                return { ...l, machines: [...l.machines, { ...machine, instanceId: Date.now() + Math.random() }] };
            }
            return l;
        }));
    };

    const removeMachineFromLine = (instanceId) => {
        setLines(lines.map(l => (l.id === activeLineId ? { ...l, machines: l.machines.filter(m => m.instanceId !== instanceId) } : l)));
    };

    const moveMachine = (index, direction) => {
        if (!activeLineId) return;
        const active = lines.find(l => l.id === activeLineId);
        const newMachines = [...active.machines];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newMachines.length) return;
        [newMachines[index], newMachines[targetIndex]] = [newMachines[targetIndex], newMachines[index]];
        setLines(lines.map(l => (l.id === activeLineId ? { ...l, machines: newMachines } : l)));
    };

    // --- Analytics Logic ---
    const getAnalytics = (machines) => {
        if (!machines || machines.length === 0) return { power: 0, speed: 0, bottleneck: null };
        const totalPower = machines.reduce((sum, m) => sum + (m.motorGucu || 0), 0);
        const capacities = machines.map(m => m.kapasite || 0).filter(c => c > 0);
        const lineSpeed = capacities.length > 0 ? Math.min(...capacities) : 0;
        const bottleneck = lineSpeed > 0 ? machines.find(m => m.kapasite === lineSpeed) : null;
        return { power: totalPower, speed: lineSpeed, bottleneck };
    };

    const analytics = activeLine ? getAnalytics(activeLine.machines) : { power: 0, speed: 0, bottleneck: null };

    // --- Render Components ---

    const MachineCard = ({ machine, index, isBottleneck }) => {
        const tier = getMachineTier(machine);
        
        return (
            <div style={{
                position: 'relative',
                minWidth: tier.width,
                maxWidth: tier.width,
                padding: tier.id === 'small' ? '16px' : '24px',
                background: 'var(--surface-container-lowest)',
                backdropFilter: 'blur(10px)',
                borderRadius: '1.25rem',
                border: isBottleneck ? `2px solid var(--error)` : '1px solid var(--surface-container-highest)',
                boxShadow: isBottleneck ? `0 0 30px var(--error)44` : 'var(--shadow-md)',
                textAlign: 'center',
                zIndex: isBottleneck ? 20 : 10,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: isBottleneck ? 'pulse-bottleneck 2s infinite' : 'lineItemFadeIn 0.4s ease forwards',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '10px'
            }}>
                {isBottleneck && (
                    <div style={{
                        position: 'absolute',
                        top: '-12px',
                        background: THEME.danger,
                        color: '#fff',
                        padding: '2px 14px',
                        borderRadius: '2rem',
                        fontSize: '10px',
                        fontWeight: 900,
                        letterSpacing: '1px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                    }}>DARBOĞAZ</div>
                )}
                
                <div style={{ fontSize: tier.icon, marginBottom: tier.id === 'small' ? '8px' : '16px', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.1))' }}>
                    {getMachineIcon(machine.adi, machine.kategori)}
                </div>
                
                <div style={{ width: '100%', marginBottom: tier.id === 'small' ? '8px' : '16px' }}>
                    <div style={{ fontWeight: 800, fontSize: tier.id === 'large' ? '16px' : '13px', color: THEME.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {machine.adi}
                    </div>
                </div>

                <div style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: '0.8rem', display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <div>
                        <div style={{ fontSize: '8px', fontWeight: 700, opacity: 0.5 }}>KAPASİTE</div>
                        <div style={{ fontSize: tier.id === 'small' ? '11px' : '13px', fontWeight: 800, color: THEME.accent }}>{machine.kapasite} <small style={{fontSize:'8px'}}>t/h</small></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '8px', fontWeight: 700, opacity: 0.5 }}>GÜÇ</div>
                        <div style={{ fontSize: tier.id === 'small' ? '11px' : '13px', fontWeight: 800, color: THEME.primary }}>{machine.motorGucu} <small style={{fontSize:'8px'}}>kW</small></div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button onClick={() => moveMachine(index, -1)} className="btn-icon" style={{ width: '32px', height: '32px' }}><i className="ph ph-caret-left"></i></button>
                    <button onClick={() => removeMachineFromLine(machine.instanceId)} className="btn-icon" style={{ height: '32px', padding: '0 12px', color: 'var(--error)', fontSize: '11px' }}>SİL</button>
                    <button onClick={() => moveMachine(index, 1)} className="btn-icon" style={{ width: '32px', height: '32px' }}><i className="ph ph-caret-right"></i></button>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto', fontFamily: "'Manrope', sans-serif" }}>
            
            
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontWeight: 800, fontSize: '32px', color: THEME.primary, margin: '0 0 8px', letterSpacing: '-1px' }}>
                        Üretim Hattı <span style={{color: THEME.accent}}>Tasarımcısı</span>
                    </h1>
                    <p style={{ color: THEME.secondary, fontSize: '15px', fontWeight: 500, margin: 0 }}>
                        {activeLine ? `Düzenlenen Hat: ${activeLine.name}` : 'Tesis mimarinizi görselleştirin ve verimliliği analiz edin.'}
                    </p>
                </div>
                
                {!activeLineId ? (
                    <div style={{ display: 'flex', border: '1px solid var(--surface-container-high)', padding: '6px', borderRadius: '1rem', background: '#fff' }}>
                        <input 
                            style={{ border: 'none', padding: '10px 16px', outline: 'none', width: '220px', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}
                            placeholder="Örn: Yıkama Hattı A"
                            value={lineName}
                            onChange={e => setLineName(e.target.value)}
                        />
                        <button 
                            onClick={handleAddLine}
                            className="btn btn-primary"
                            style={{ padding: '10px 24px' }}
                        >
                            YENİ HAT OLUŞTUR
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setActiveLineId(null)} style={{ background: THEME.surface, border: '1px solid rgba(0,0,0,0.1)', padding: '12px 24px', borderRadius: '1rem', fontWeight: 800, color: THEME.primary, cursor: 'pointer' }}>
                        ← LİSTEYE DÖN
                    </button>
                )}
            </header>

            {!activeLineId ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                    {lines.map(line => (
                        <div key={line.id} onClick={() => setActiveLineId(line.id)} style={{ padding: '32px', background: 'var(--surface-container-lowest)', borderRadius: '2rem', border: '1px solid var(--surface-container-high)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--enba-orange)'; e.currentTarget.style.transform = 'translateY(-5px)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--surface-container-high)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ width: '48px', height: '48px', background: 'var(--surface-container-low)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--enba-orange)' }}>
                                    <i className="ph-fill ph-factory"></i>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--on-surface-variant)' }}>MAKİNE SAYISI</div>
                                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--enba-dark)' }}>{line.machines ? line.machines.length : 0} Adet</div>
                                </div>
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: THEME.primary, margin: '0 0 4px' }}>{line.name}</h3>
                            <div style={{ fontSize: '13px', color: THEME.secondary }}>Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '40px', alignItems: 'flex-start' }}>
                    
                    {/* Sidebar: Available Tech */}
                    <aside style={{ background: '#fff', padding: '32px', borderRadius: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <h4 style={{ margin: '0 0 24px', fontSize: '13px', fontWeight: 900, color: THEME.secondary, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Teknoloji Envanteri</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {makinalar.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#ccc', fontSize: '13px' }}>Kataloğunuzda makine bulunamadı.</div>
                            ) : makinalar.map(m => (
                                <div 
                                    key={m.id} 
                                    onClick={() => addMachineToLine(m)}
                                    style={{ padding: '16px', background: THEME.surface, borderRadius: '1.25rem', border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', gap: '16px', alignItems: 'center' }}
                                    onMouseOver={e => { e.currentTarget.style.borderColor = THEME.accent; e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateX(5px)'; }}
                                    onMouseOut={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = THEME.surface; e.currentTarget.style.transform = 'translateX(0)'; }}
                                >
                                    <div style={{ fontSize: '24px' }}>{getMachineIcon(m.adi, m.kategori)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, fontSize: '13px', color: THEME.primary }}>{m.adi}</div>
                                        <div style={{ fontSize: '10px', color: THEME.secondary, fontWeight: 600 }}>{m.kapasite} t/h • {m.motorGucu} kW</div>
                                    </div>
                                    <div style={{ fontSize: '18px', color: THEME.accent }}>+</div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Designer Canvas */}
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                            {[
                                { label: 'HAT GÜCÜ', val: analytics.power + ' kW', color: THEME.primary, icon: <i className="ph-fill ph-lightning"></i> },
                                { label: 'HAT KAPASİTESİ', val: analytics.speed + ' t/h', color: THEME.accent, icon: <i className="ph-fill ph-waves"></i> },
                                { label: 'DARBOĞAZ', val: analytics.bottleneck ? analytics.bottleneck.adi : 'YOK', color: THEME.danger, icon: <i className="ph-fill ph-warning-octagon"></i> },
                            ].map(stat => (
                                <div key={stat.label} style={{ background: '#fff', padding: '24px', borderRadius: '1.5rem', boxShadow: '0 15px 40px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ fontSize: '28px', opacity: 0.8 }}>{stat.icon}</div>
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: 900, color: THEME.secondary, letterSpacing: '1px' }}>{stat.label}</div>
                                        <div style={{ fontSize: '22px', fontWeight: 900, color: stat.color }}>{stat.val}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Interactive Blueprint Canvas */}
                        <div style={{ 
                            background: 'var(--surface-container-low)', 
                            borderRadius: '2.5rem', 
                            minHeight: '520px', 
                            border: '2px dashed var(--surface-container-highest)', 
                            position: 'relative', 
                            overflow: 'auto', 
                            display: 'flex', 
                            padding: '40px',
                            backgroundImage: `radial-gradient(circle at 1px 1px, var(--surface-container-highest) 1px, transparent 0)`,
                            backgroundSize: '30px 30px'
                        }}>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '15px',
                                width: '100%',
                                padding: '20px'
                            }}>
                            {!activeLine || !activeLine.machines || activeLine.machines.length === 0 ? (
                                <div style={{ width: '100%', textAlign: 'center', opacity: 0.3 }}>
                                    <div style={{ fontSize: '64px', marginBottom: '20px', color: 'var(--enba-orange)' }}>
                                        <i className="ph ph-blueprint"></i>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '20px', color: 'var(--enba-dark)' }}>TASARIM ALANI BOŞ</div>
                                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--on-surface-variant)' }}>Makineleri soldan sürükleyin veya tıklayarak hatta ekleyin.</div>
                                </div>
                            ) : (
                                <>
                                    {activeLine.machines.map((m, idx) => {
                                        const isBottleneck = analytics.bottleneck && m.instanceId === analytics.bottleneck.instanceId;
                                        return (
                                            <div key={m.instanceId || idx} style={{ display: 'flex', alignItems: 'center' }}>
                                                <MachineCard machine={m} index={idx} isBottleneck={isBottleneck} />
                                                
                                                {/* Compact Directional Arrow (Localized) */}
                                                {idx < activeLine.machines.length - 1 && (
                                                    <div style={{ 
                                                        width: '30px', 
                                                        height: '30px', 
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '20px',
                                                        color: isBottleneck ? THEME.danger : THEME.accent,
                                                        opacity: 0.5,
                                                        animation: 'pulse-arrow 1.5s infinite'
                                                    }}>→</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div style={{ color: 'var(--on-surface-variant)', fontSize: '13px', fontWeight: 600 }}>Tüm değişiklikler otomatik olarak kaydedilir.</div>
                             <button onClick={() => { if(window.confirm('Bu hattı silmeye emin misiniz?')) { setLines(lines.filter(l => l.id !== activeLineId)); setActiveLineId(null); } }} className="btn btn-secondary" style={{ color: 'var(--error)', fontSize: '13px', fontWeight: 800, border: 'none', background: 'none' }}>
                                <i className="ph ph-trash" style={{ marginRight: '6px' }}></i> Hattı Kalıcı Olarak Sil
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

window.ProductionLineModule = ProductionLineModule;

