// ============================================================
//  Enba Recycling — Organizasyon Şeması Modülü
// ============================================================

function OrgChartModule() {
    const [users, setUsers] = React.useState(() => {
        const saved = localStorage.getItem('enba_users_data');
        return saved ? JSON.parse(saved) : window.MOCK_USERS;
    });

    const [structure, setStructure] = React.useState(window.ORG_STRUCTURE);
    const [draggedUser, setDraggedUser] = React.useState(null);

    const refreshUsers = () => {
        const saved = localStorage.getItem('enba_users_data');
        if (saved) setUsers(JSON.parse(saved));
    };

    React.useEffect(() => {
        window.addEventListener('enba_users_updated', refreshUsers);
        return () => window.removeEventListener('enba_users_updated', refreshUsers);
    }, []);

    const handleDrop = (e, targetRole) => {
        e.preventDefault();
        const userId = e.dataTransfer.getData("userId");
        if (!userId) return;

        const updatedUsers = users.map(u => {
            if (u.id === userId) {
                return { ...u, role: targetRole };
            }
            return u;
        });

        localStorage.setItem('enba_users_data', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
        window.dispatchEvent(new Event('enba_users_updated'));
    };

    const handleDragStart = (e, user) => {
        e.dataTransfer.setData("userId", user.id);
        setDraggedUser(user);
    };

    // Recursive Node Component
    const OrgNode = ({ node }) => {
        const roleUsers = users.filter(u => u.role === node.role);
        const roleInfo = window.ROLE_TEMPLATES[node.role] || [];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, node.role)}
                    style={{
                        minWidth: '220px',
                        padding: '20px',
                        background: '#fff',
                        borderRadius: '1.5rem',
                        border: '2px dashed #ddd',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        borderStyle: 'solid',
                        borderColor: 'transparent',
                        backgroundClip: 'padding-box',
                        borderWidth: '2px',
                        backgroundImage: 'linear-gradient(#fff, #fff), linear-gradient(135deg, var(--enba-orange), var(--enba-dark))',
                    }}
                >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--enba-orange)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                        {node.role.replace('_', ' ')}
                    </div>
                    
                    {/* Role Based Permissions Mini List */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                        {roleInfo.slice(0, 3).map(p => (
                            <span key={p} style={{ fontSize: '9px', background: 'var(--surface-container-low)', padding: '2px 6px', borderRadius: '1rem', color: '#666' }}>{p}</span>
                        ))}
                        {roleInfo.length > 3 && <span style={{ fontSize: '9px', color: '#999' }}>+{roleInfo.length - 3}</span>}
                    </div>

                    {/* Users in this role */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {roleUsers.length > 0 ? roleUsers.map(u => (
                            <div 
                                key={u.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, u)}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', 
                                    background: 'var(--enba-orange-light)', borderRadius: '0.8rem', cursor: 'grab',
                                    border: '1px solid rgba(39,174,96,0.2)'
                                }}
                            >
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--enba-orange)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>
                                    {u.name[0]}
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--enba-orange-dark)' }}>{u.name}</div>
                            </div>
                        )) : (
                            <div style={{ fontSize: '11px', color: '#ccc', textAlign: 'center', fontStyle: 'italic', padding: '10px' }}>
                                Personel Bekleniyor...
                            </div>
                        )}
                    </div>
                </div>

                {node.children && node.children.length > 0 && (
                    <>
                        <div style={{ width: '2px', height: '20px', background: 'var(--enba-orange)', opacity: 0.3 }} />
                        <div style={{ display: 'flex', gap: '24px' }}>
                            {node.children.map(child => (
                                <OrgNode key={child.id} node={child} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div style={{ padding: '40px', background: 'var(--surface)', minHeight: 'calc(100vh - 60px)', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px' }}>
            
            {/* Main Chart Area */}
            <div style={{ overflow: 'auto', display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
                <div style={{ minWidth: 'fit-content' }}>
                    <OrgNode node={structure[0]} />
                </div>
            </div>

            {/* User Sidebar */}
            <div style={{ background: '#fff', borderRadius: '2rem', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: 'fit-content', position: 'sticky', top: '40px' }}>
                <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '18px', fontWeight: 800, margin: '0 0 16px' }}>Tüm Personel</h3>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '24px' }}>Kullanıcıları şema üzerindeki rollere sürükleyerek atama yapabilirsiniz.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {users.map(u => (
                        <div 
                            key={u.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, u)}
                            style={{ 
                                padding: '12px', border: '1px solid #eee', borderRadius: '1rem', 
                                display: 'flex', alignItems: 'center', gap: '12px', cursor: 'grab',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--enba-orange)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}
                        >
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
                                {u.avatar ? <img src={u.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : u.name[0]}
                            </div>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--enba-dark)' }}>{u.name}</div>
                                <div style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase' }}>{u.role.replace('_', ' ')}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '32px', padding: '16px', borderRadius: '1rem', background: 'var(--enba-dark)', color: '#fff' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, marginBottom: '4px' }}>BİLGİ</div>
                    <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                        Hiyerarşide yapılan değişiklikler kullanıcının yetkilerini anında günceller.
                    </div>
                </div>
            </div>

        </div>
    );
}

window.OrgChartModule = OrgChartModule;

