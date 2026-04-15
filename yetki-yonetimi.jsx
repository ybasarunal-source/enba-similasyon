function YetkiYonetimi() {
    // Tüm modüllerin listesi (router.jsx -> NAV_GRUPLAR'dan türetilebilir ancak burada sabit listelemek daha güvenli)
    const MODULLER = [
        { id: 'isPlanlama', label: 'Hızlı İş Planlama' },
        { id: 'detayliPlan', label: 'Detaylı İş Planlama' },
        { id: 'nakitAkis', label: 'Nakit Akışı' },
        { id: 'pnlRapor', label: 'P&L Raporu' },
        { id: 'uretimPlan', label: 'Üretim Planlaması' },
        { id: 'uretimTakip', label: 'Üretim Takibi' },
        { id: 'lojistikTakip', label: 'Lojistik Takip' },
        { id: 'stok', label: 'Stok Takibi' },
        { id: 'lisansTakip', label: 'Lisans Takibi' },
        { id: 'gorevler', label: 'Görev Yonetimi' },
        { id: 'katalog', label: 'Ürün Kataloğu' },
        { id: 'makina', label: 'Makina Teçhizat' },
        { id: 'arsiv', label: 'Arşiv' }
    ];

    const ROLLER = Object.values(window.USER_ROLES);

    // Kullanıcı listesini router'ın tuttuğu state'den veya localStorage'dan alacağız.
    // Router bu bileşene setUsers fonksiyonu geçebilir ya da biz direkt localStorage ile konuşuruz.
    // En temizi: Custom Event ile Router'ı tetiklemek.
    
    const [users, setUsers] = React.useState(() => {
        const saved = localStorage.getItem('enba_users_data');
        return saved ? JSON.parse(saved) : window.MOCK_USERS;
    });

    const [showAddModal, setShowAddModal] = React.useState(false);
    const [newUser, setNewUser] = React.useState({
        name: '', username: '', password: '123', role: window.USER_ROLES.OPERATOR
    });

    const saveToLocal = (updatedUsers) => {
        setUsers(updatedUsers);
        localStorage.setItem('enba_users_data', JSON.stringify(updatedUsers));
        // Router'ı bilgilendirmek için event fırlat
        window.dispatchEvent(new Event('enba_users_updated'));
    };

    const handleToggleModule = (userId, moduleId) => {
        const updated = users.map(u => {
            if (u.id !== userId) return u;
            const currentModules = u.allowedModules || [];
            const newModules = currentModules.includes(moduleId)
                ? currentModules.filter(m => m !== moduleId)
                : [...currentModules, moduleId];
            return { ...u, allowedModules: newModules };
        });
        saveToLocal(updated);
    };

    const handleChangeRole = (userId, newRole) => {
        const updated = users.map(u => {
            if (u.id !== userId) return u;
            return { ...u, role: newRole };
        });
        saveToLocal(updated);
    };

    const handleAddUser = (e) => {
        e.preventDefault();
        const id = 'u' + Date.now();
        // Varsayılan olarak sadece landing yetkisi veriyoruz
        const userToAdd = { ...newUser, id, allowedModules: ['landing'] };
        saveToLocal([...users, userToAdd]);
        setShowAddModal(false);
        setNewUser({ name: '', username: '', password: '123', role: window.USER_ROLES.OPERATOR });
    };

    const handleDeleteUser = (userId) => {
        if (userId === 'u1') return alert('Admin hesabı silinemez!');
        if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
        saveToLocal(users.filter(u => u.id !== userId));
    };

    return (
        <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '28px', color: 'var(--enba-dark)', margin: '0 0 8px' }}>
                        ⚡  Yetki ve Kullanıcı Yönetimi
                    </h1>
                    <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '14px' }}>
                        Sistem kullanıcılarını ekleyin ve modül bazlı erişim yetkilerini düzenleyin.
                    </p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary" 
                    style={{ padding: '12px 24px', borderRadius: '1rem', fontWeight: 700 }}
                >
                    <i className="ph ph-user-plus"></i> Yeni Kullanıcı Ekle
                </button>
            </div>

            <div style={{ 
                background: 'var(--surface-container-lowest)', 
                borderRadius: '1.5rem', 
                border: '1px solid var(--surface-container-highest)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-container-low)', borderBottom: '1px solid var(--surface-container-highest)' }}>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Kullanıcı</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Rol</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Modül Yetkileri</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', textAlign: 'center' }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--surface-container-high)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--enba-dark)', fontSize: '14px' }}>{u.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>@{u.username}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        {u.id === 'u1' ? (
                                            <span style={{ padding: '4px 12px', background: 'var(--enba-dark)', color: '#fff', borderRadius: '2rem', fontSize: '11px', fontWeight: 700 }}>{u.role.toUpperCase()}</span>
                                        ) : (
                                            <select 
                                                value={u.role}
                                                onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                                style={{ padding: '6px 10px', borderRadius: '0.5rem', border: '1px solid #ddd', fontSize: '13px' }}
                                            >
                                                {ROLLER.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                                            </select>
                                        )}
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        {u.role === window.USER_ROLES.ADMIN || u.role === window.USER_ROLES.GENEL_MUDUR ? (
                                            <div style={{ fontSize: '12px', color: 'var(--enba-orange)', fontWeight: 700 }}>✨ Tüm modüllere tam erişim</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {MODULLER.map(mod => {
                                                    const isChecked = (u.allowedModules || []).includes(mod.id);
                                                    return (
                                                        <label key={mod.id} style={{ 
                                                            display: 'flex', alignItems: 'center', gap: '6px', 
                                                            padding: '4px 10px', borderRadius: '2rem', 
                                                            background: isChecked ? 'rgba(39,174,96,0.1)' : 'var(--surface-container-low)',
                                                            border: isChecked ? '1px solid var(--enba-orange)' : '1px solid transparent',
                                                            cursor: 'pointer', transition: 'all 0.2s'
                                                        }}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isChecked}
                                                                onChange={() => handleToggleModule(u.id, mod.id)}
                                                            />
                                                            <span style={{ fontSize: '11px', color: isChecked ? 'var(--enba-orange-dark)' : 'var(--on-surface-variant)', fontWeight: isChecked ? 700 : 500 }}>
                                                                {mod.label}
                                                            </span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                        {u.id !== 'u1' && (
                                            <button 
                                                onClick={() => handleDeleteUser(u.id)}
                                                style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '18px' }}
                                                title="Sauronu Sil"
                                            >
                                                ⚡ ️
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD USER MODAL */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '2rem', width: '100%', maxWidth: '450px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, margin: '0 0 24px' }}>Yeni Kullanıcı Oluştur</h2>
                        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--on-surface-variant)' }}>AD SOYAD</label>
                                <input 
                                    className="form-control" 
                                    value={newUser.name} 
                                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                                    required
                                    placeholder="Örn: Ahmet Yılmaz"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--on-surface-variant)' }}>KULLANICI ADI</label>
                                <input 
                                    className="form-control" 
                                    value={newUser.username} 
                                    onChange={e => setNewUser({...newUser, username: e.target.value.toLowerCase()})}
                                    required
                                    placeholder="Örn: ahmetyilmaz"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--on-surface-variant)' }}>ŞİFRE</label>
                                <input 
                                    type="text"
                                    className="form-control" 
                                    value={newUser.password} 
                                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--on-surface-variant)' }}>VARSAYILAN ROL</label>
                                <select 
                                    className="form-control" 
                                    value={newUser.role} 
                                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                                >
                                    {ROLLER.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '14px' }}>Kullanıcıyı Kaydet</button>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '14px' }} onClick={() => setShowAddModal(false)}>İptal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

window.YetkiYonetimi = YetkiYonetimi;

