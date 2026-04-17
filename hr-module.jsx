// ============================================================
//  Enba Recycling — İnsan Kaynakları Modülü
// ============================================================

function HrModule() {
    // ── Eyaletler (State) ───────────────────────────────────
    const [personel, setPersonel] = React.useState([]);
    const [attendance, setAttendance] = React.useState([]);
    const [payments, setPayments] = React.useState([]);
    const [debts, setDebts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    // ── Data Fetching ───────────────────────────────────────
    const fetchData = async () => {
        if (!window.DataService) return;
        setLoading(true);
        try {
            const [p, a, pay, d] = await Promise.all([
                window.DataService.getPersonnel(),
                window.DataService.getAttendance(),
                window.DataService.getPayments(),
                window.DataService.getDebts()
            ]);
            setPersonel(p.map(x => ({ ...x, sgkStatus: x.sgk_status, startDate: x.start_date })));
            setAttendance(a.map(x => ({ ...x, personId: x.person_id, workHours: x.work_hours, overtimeHours: x.overtime_hours })));
            setPayments(pay.map(x => ({ ...x, personId: x.person_id })));
            setDebts(d.map(x => ({ ...x, personId: x.person_id })));
        } catch (e) {
            console.error("İK verileri çekilemedi:", e);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { fetchData(); }, []);

    // ── UI State ────────────────────────────────────────────
    const [activeTab, setActiveTab] = React.useState('personnel'); // personnel | attendance | payments | debts
    const [showModal, setShowModal] = React.useState(null); // 'person' | 'attendance' | 'payment' | 'debt'
    const [editingItem, setEditingItem] = React.useState(null);
    const [overtimeInputs, setOvertimeInputs] = React.useState({}); // { [personId]: string }

    // ── Handlers ────────────────────────────────────────────
    const savePerson = async (data) => {
        try {
            const result = await window.DataService.savePerson({ ...data, id: editingItem?.id });
            if (result) await fetchData();
            setShowModal(null);
            setEditingItem(null);
        } catch (e) { alert("Personel kaydedilemedi."); }
    };

    const deletePerson = async (id) => {
        if (confirm(window.t('common.delete') + '?')) {
            try {
                await window.DataService.deleteData('personnel', id);
                await fetchData();
            } catch (e) { alert("Personel silinemedi."); }
        }
    };

    const saveAttendance = async (data, closeModal = true) => {
        try {
            await window.DataService.saveAttendance(data);
            await fetchData();
            if (closeModal) setShowModal(null);
        } catch (e) { alert("Puantaj kaydedilemedi."); }
    };

    const savePayment = async (data) => {
        try {
            await window.DataService.savePayment(data);
            await fetchData();
            setShowModal(null);
        } catch (e) { alert("Ödeme kaydedilemedi."); }
    };

    const saveDebt = async (data) => {
        try {
            await window.DataService.saveDebt(data);
            await fetchData();
            setShowModal(null);
        } catch (e) { alert("Borç kaydedilemedi."); }
    };

    // ── Styles ──────────────────────────────────────────────
    const cardStyle = {
        background: 'var(--surface-container-lowest)',
        padding: '24px',
        borderRadius: '1.2rem',
        border: '1px solid var(--surface-container-highest)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px'
    };

    const tabBtnStyle = (active) => ({
        padding: '10px 24px',
        borderRadius: '2rem',
        border: 'none',
        background: active ? 'var(--enba-dark)' : 'var(--surface-container-high)',
        color: active ? '#fff' : 'var(--on-surface-variant)',
        fontWeight: 800,
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    });

    const tableHeaderStyle = {
        textAlign: 'left',
        padding: '12px 16px',
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--on-surface-variant)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: '2px solid var(--surface-container-highest)'
    };

    const tableCellStyle = {
        padding: '12px 16px',
        fontSize: '14px',
        color: 'var(--on-surface)',
        borderBottom: '1px solid var(--surface-container-highest)'
    };

    return (
        <div style={{ padding: '32px 40px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            
            {/* Header */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '28px', color: 'var(--enba-dark)', margin: '0 0 8px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <i className="ph-fill ph-identification-card" style={{ color: 'var(--enba-orange)' }}></i> {window.t('modules.hr')}
                    </h1>
                    <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '15px' }}>
                        Personel yönetimi, puantaj, ödemeler ve finansal takip merkezi.
                    </p>
                </div>
                <button 
                    onClick={() => { setEditingItem(null); setShowModal('person'); }}
                    className="btn btn-primary"
                    style={{ 
                        padding: '12px 24px', borderRadius: '0.75rem', 
                        display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-md)'
                    }}
                >
                    <i className="ph ph-user-plus"></i> {window.t('hr.add_person')}
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
                <button 
                    onClick={() => setActiveTab('personnel')} 
                    className={`btn ${activeTab === 'personnel' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: '2rem', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="ph ph-users"></i> {window.t('hr.personnel')}
                </button>
                <button 
                    onClick={() => setActiveTab('attendance')} 
                    className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: '2rem', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="ph ph-calendar-check"></i> {window.t('hr.attendance')}
                </button>
                <button 
                    onClick={() => setActiveTab('payments')} 
                    className={`btn ${activeTab === 'payments' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: '2rem', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="ph ph-wallet"></i> {window.t('hr.payments')}
                </button>
                <button 
                    onClick={() => setActiveTab('debts')} 
                    className={`btn ${activeTab === 'debts' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: '2rem', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="ph ph-hand-coins"></i> {window.t('hr.debts')}
                </button>
            </div>

            {/* Content Area */}
            <div style={cardStyle}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>Yükleniyor...</div>
                ) : (
                    <>
                        {activeTab === 'personnel' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={tableHeaderStyle}>{window.t('hr.name')}</th>
                                <th style={tableHeaderStyle}>{window.t('hr.position')}</th>
                                <th style={tableHeaderStyle}>Departman</th>
                                <th style={tableHeaderStyle}>{window.t('hr.salary')}</th>
                                <th style={tableHeaderStyle}>{window.t('hr.sgk')}</th>
                                <th style={tableHeaderStyle}>{window.t('hr.start_date')}</th>
                                <th style={tableHeaderStyle}>Fazla Mesai (Bu Ay)</th>
                                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>{window.t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {personel.map(p => {
                                const otVal = overtimeInputs[p.id] || '';
                                const hasValue = otVal !== '' && Number(otVal) > 0;
                                return (
                                <tr key={p.id}>
                                    <td style={{ ...tableCellStyle, fontWeight: 600 }}>{p.name}</td>
                                    <td style={tableCellStyle}>{p.position}</td>
                                    <td style={tableCellStyle}>
                                        <span style={{ fontSize: '12px', color: 'var(--enba-dark)', fontWeight: 600, background: 'rgba(21,34,46,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                            {p.department || 'Üretim'}
                                        </span>
                                    </td>
                                    <td style={{ ...tableCellStyle, color: 'var(--enba-dark)', fontWeight: 700 }}>{window.fmt(p.salary)} ₺</td>
                                    <td style={tableCellStyle}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '1rem', fontSize: '11px', fontWeight: 800,
                                            background: p.sgkStatus === 'Aktif' ? 'var(--success-container)' : 'var(--surface-container-high)',
                                            color: p.sgkStatus === 'Aktif' ? 'var(--success)' : 'var(--on-surface-variant)'
                                        }}>
                                            {p.sgkStatus}
                                        </span>
                                    </td>
                                    <td style={tableCellStyle}>{p.startDate}</td>
                                    <td style={{ ...tableCellStyle }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Saat"
                                                value={otVal}
                                                onChange={e => setOvertimeInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                                                style={{
                                                    width: '72px', padding: '6px 8px', borderRadius: '0.4rem',
                                                    border: '1px solid ' + (hasValue ? 'var(--success)' : 'var(--surface-container-highest)'),
                                                    fontSize: '13px', outline: 'none',
                                                    transition: 'border-color 0.2s',
                                                    background: 'var(--surface-container-lowest)',
                                                    color: 'var(--on-surface)'
                                                }}
                                                onFocus={window.selectOnFocus}
                                            />
                                            {hasValue && (
                                                    <button
                                                        onClick={() => {
                                                            const now = new Date();
                                                            saveAttendance({
                                                                personId: p.id,
                                                                month: now.getMonth() + 1,
                                                                year: now.getFullYear(),
                                                                workHours: 225,
                                                                overtimeHours: Number(otVal),
                                                                notes: 'Hızlı mesai girişi'
                                                            }, false);
                                                            setOvertimeInputs(prev => ({ ...prev, [p.id]: '' }));
                                                        }}
                                                        title="Kaydet"
                                                        className="btn btn-primary"
                                                        style={{
                                                            width: '32px', height: '32px', borderRadius: '50%',
                                                            padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <i className="ph ph-check" style={{ fontSize: '18px' }}></i>
                                                    </button>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button onClick={() => { setEditingItem(p); setShowModal('person'); }} className="btn-icon" title="Düzenle"><i className="ph ph-pencil-simple"></i></button>
                                            <button onClick={() => deletePerson(p.id)} className="btn-icon" style={{ background: 'var(--enba-danger)', color: '#fff' }} title="Sil"><i className="ph ph-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {activeTab === 'attendance' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                            <button onClick={() => setShowModal('attendance')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="ph ph-plus-circle"></i> Kayıt Ekle
                            </button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={tableHeaderStyle}>Personel</th>
                                    <th style={tableHeaderStyle}>Dönem</th>
                                    <th style={tableHeaderStyle}>{window.t('hr.work_hours')}</th>
                                    <th style={tableHeaderStyle}>{window.t('hr.overtime')}</th>
                                    <th style={tableHeaderStyle}>Notlar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.length > 0 ? attendance.map(a => (
                                    <tr key={a.id}>
                                        <td style={tableCellStyle}>{personel.find(p => p.id === a.personId)?.name || '—'}</td>
                                        <td style={tableCellStyle}>{a.month}/{a.year}</td>
                                        <td style={tableCellStyle}>{a.workHours} Saat</td>
                                        <td style={{ ...tableCellStyle, color: 'var(--enba-orange)', fontWeight: 700 }}>+{a.overtimeHours} Saat</td>
                                        <td style={tableCellStyle}>{a.notes || '—'}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>Henüz puantaj kaydı bulunmuyor.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div>
                         <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                            <button onClick={() => setShowModal('payment')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="ph ph-plus-circle"></i> Ödeme Girişi
                            </button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={tableHeaderStyle}>Personel</th>
                                    <th style={tableHeaderStyle}>{window.t('hr.payment_date')}</th>
                                    <th style={tableHeaderStyle}>{window.t('hr.amount')}</th>
                                    <th style={tableHeaderStyle}>{window.t('hr.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length > 0 ? payments.map(p => (
                                    <tr key={p.id}>
                                        <td style={tableCellStyle}>{personel.find(pers => pers.id === p.personId)?.name || '—'}</td>
                                        <td style={tableCellStyle}>{p.date}</td>
                                        <td style={{ ...tableCellStyle, fontWeight: 700 }}>{window.fmt(p.amount)} ₺</td>
                                        <td style={tableCellStyle}>
                                            <span style={{ 
                                                padding: '4px 10px', borderRadius: '1rem', fontSize: '11px', fontWeight: 800,
                                                background: p.status === 'Ödendi' ? 'var(--success-container)' : 'var(--surface-container-high)',
                                                color: p.status === 'Ödendi' ? 'var(--success)' : 'var(--on-surface-variant)'
                                            }}>
                                                {p.status}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>Henüz ödeme kaydı bulunmuyor.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'debts' && (
                    <div>
                         <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                            <button onClick={() => setShowModal('debt')} className="btn btn-secondary" style={{ color: 'var(--enba-danger)', borderColor: 'var(--enba-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="ph ph-plus-circle"></i> Avans/Borç Kaydı
                            </button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={tableHeaderStyle}>Personel</th>
                                    <th style={tableHeaderStyle}>Tarih</th>
                                    <th style={tableHeaderStyle}>Tür</th>
                                    <th style={tableHeaderStyle}>{window.t('hr.amount')}</th>
                                    <th style={tableHeaderStyle}>Açıklama</th>
                                </tr>
                            </thead>
                            <tbody>
                                {debts.length > 0 ? debts.map(d => (
                                    <tr key={d.id}>
                                        <td style={tableCellStyle}>{personel.find(p => p.id === d.personId)?.name || '—'}</td>
                                        <td style={tableCellStyle}>{d.date}</td>
                                        <td style={tableCellStyle}>
                                            <span style={{ color: d.type === 'Avans' ? '#e67e22' : '#3498db', fontWeight: 700 }}>{d.type}</span>
                                        </td>
                                        <td style={{ ...tableCellStyle, fontWeight: 700, color: '#c0392b' }}>{window.fmt(d.amount)} ₺</td>
                                        <td style={tableCellStyle}>{d.description || '—'}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>Henüz borç/alacak kaydı bulunmuyor.</td></tr>
                                )}
                            </tbody>
                        </table>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {showModal === 'person' && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '32px', borderRadius: '1.5rem', width: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                        <h3 style={{ margin: '0 0 24px', fontFamily: "'Manrope', sans-serif" }}>{editingItem ? window.t('hr.edit_person') : window.t('hr.add_person')}</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            savePerson({
                                name: formData.get('name'),
                                position: formData.get('position'),
                                department: formData.get('department'),
                                salary: Number(formData.get('salary')),
                                sgkStatus: formData.get('sgkStatus'),
                                startDate: formData.get('startDate')
                            });
                        }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>{window.t('hr.name')}</label>
                                <input name="name" defaultValue={editingItem?.name} required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>{window.t('hr.position')}</label>
                                <input name="position" defaultValue={editingItem?.position} required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Departman</label>
                                <select name="department" defaultValue={editingItem?.department || 'Üretim'} required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }}>
                                    <option value="Üretim">Üretim</option>
                                    <option value="Lojistik">Lojistik</option>
                                    <option value="İdari">İdari</option>
                                    <option value="Teknik">Teknik</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>{window.t('hr.salary')} (₺)</label>
                                    <input name="salary" type="number" defaultValue={editingItem?.salary} required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }} onFocus={window.selectOnFocus} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>{window.t('hr.sgk')}</label>
                                    <select name="sgkStatus" defaultValue={editingItem?.sgkStatus || 'Aktif'} style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }}>
                                        <option value="Aktif">Aktif</option>
                                        <option value="Pasif">Pasif</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>{window.t('hr.start_date')}</label>
                                <input name="startDate" type="date" defaultValue={editingItem?.startDate || new Date().toISOString().split('T')[0]} required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => setShowModal(null)} style={{ flex: 1, padding: '12px', borderRadius: '0.5rem', border: 'none', background: 'var(--surface-container-high)', fontWeight: 600, cursor: 'pointer' }}>{window.t('common.cancel')}</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '0.5rem', border: 'none', background: 'var(--enba-dark)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{window.t('common.save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal === 'attendance' && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '32px', borderRadius: '1.5rem', width: '400px' }}>
                        <h3 style={{ margin: '0 0 24px' }}>Puantaj Girişşi</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            saveAttendance({
                                personId: formData.get('personId'),
                                month: formData.get('month'),
                                year: formData.get('year'),
                                workHours: formData.get('workHours'),
                                overtimeHours: formData.get('overtimeHours'),
                                notes: formData.get('notes')
                            });
                        }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Personel Seçimi</label>
                                <select name="personId" required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }}>
                                    <option value="">Seçiniz...</option>
                                    {personel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Ay</label>
                                    <input name="month" type="number" min="1" max="12" defaultValue={new Date().getMonth() + 1} required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }} onFocus={window.selectOnFocus} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Yıl</label>
                                    <input name="year" type="number" defaultValue={new Date().getFullYear()} required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }} onFocus={window.selectOnFocus} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Çalışma Saati</label>
                                    <input name="workHours" type="number" defaultValue={225} style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }} onFocus={window.selectOnFocus} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Mesai</label>
                                    <input name="overtimeHours" type="number" defaultValue={0} style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }} onFocus={window.selectOnFocus} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Notlar</label>
                                <input name="notes" placeholder="Ekstra bilgi..." style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => setShowModal(null)} style={{ flex: 1, padding: '12px', borderRadius: '0.5rem', border: 'none', background: 'var(--surface-container-high)', fontWeight: 600 }}>Talebi Kapat</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '0.5rem', border: 'none', background: 'var(--enba-dark)', color: '#fff', fontWeight: 600 }}>Kaydı Oluştur</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal === 'payment' && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '32px', borderRadius: '1.5rem', width: '400px' }}>
                        <h3 style={{ margin: '0 0 24px' }}>Maaş Ödeme Kaydı</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            savePayment({
                                personId: formData.get('personId'),
                                date: formData.get('date'),
                                amount: formData.get('amount'),
                                status: formData.get('status')
                            });
                        }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Personel</label>
                                <select name="personId" required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }}>
                                    {personel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Tarih</label>
                                <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Miktar (₺)</label>
                                <input name="amount" type="number" required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }} onFocus={window.selectOnFocus} />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Durum</label>
                                <select name="status" style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }}>
                                    <option value="Ödendi">Ödendi</option>
                                    <option value="Bekliyor">Bekliyor</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => setShowModal(null)} style={{ flex: 1, padding: '12px', borderRadius: '0.5rem', border: 'none', background: 'var(--surface-container-high)', fontWeight: 600 }}>İptal</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '0.5rem', border: 'none', background: 'var(--enba-dark)', color: '#fff', fontWeight: 600 }}>Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal === 'debt' && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '32px', borderRadius: '1.5rem', width: '400px' }}>
                        <h3 style={{ margin: '0 0 24px' }}>Avans / Borç Kaydı</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            saveDebt({
                                personId: formData.get('personId'),
                                date: formData.get('date'),
                                amount: formData.get('amount'),
                                type: formData.get('type'),
                                description: formData.get('description')
                            });
                        }}>
                             <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Personel</label>
                                <select name="personId" required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }}>
                                    {personel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Tür</label>
                                    <select name="type" style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }}>
                                        <option value="Avans">Avans</option>
                                        <option value="Borç (Kesinti)">Borç (Kesinti)</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Tarih</label>
                                    <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Tutar (₺)</label>
                                <input name="amount" type="number" required style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd' }} onFocus={window.selectOnFocus} />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Açıklama</label>
                                <textarea name="description" style={{ width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid #ddd', minHeight: '60px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => setShowModal(null)} style={{ flex: 1, padding: '12px', borderRadius: '0.5rem', border: 'none', background: 'var(--surface-container-high)', fontWeight: 600 }}>Kapat</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '0.5rem', border: 'none', background: 'var(--error)', color: '#fff', fontWeight: 600 }}>Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

window.HrModule = HrModule;

