const { useState, useEffect, useMemo } = React;

function PaymentsModule() {
    const [payments, setPayments] = useState(() => {
        const saved = localStorage.getItem('enba_payments');
        return saved ? JSON.parse(saved) : [
            { id: '1', title: 'Nisan Ayı Kira', amount: 45000, type: 'outgoing', category: 'Rent', dueDate: '2026-04-15', status: 'pending' },
            { id: '2', title: 'Hammadde Tahsilatı - X Geri Dönüşüm', amount: 120000, type: 'incoming', category: 'Invoice', dueDate: '2026-04-12', status: 'paid' },
            { id: '3', title: 'Elektrik Faturası', amount: 8500, type: 'outgoing', category: 'Utility', dueDate: '2026-04-20', status: 'pending' }
        ];
    });

    const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', 'projection'
    const [initialCash, setInitialCash] = useState(() => {
        const saved = localStorage.getItem('enba_initial_box_cash');
        return saved ? Number(saved) : 50000;
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => {
        localStorage.setItem('enba_payments', JSON.stringify(payments));
    }, [payments]);

    useEffect(() => {
        localStorage.setItem('enba_initial_box_cash', initialCash.toString());
    }, [initialCash]);

    // Daily Projections
    const projectionData = useMemo(() => {
        const sorted = [...payments].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        let current = initialCash;
        const result = [];
        
        // Group by date for cleaner chart
        const byDate = {};
        sorted.forEach(p => {
            if (!byDate[p.dueDate]) byDate[p.dueDate] = { incoming: 0, outgoing: 0, items: [] };
            if (p.type === 'incoming') byDate[p.dueDate].incoming += p.amount;
            else byDate[p.dueDate].outgoing += p.amount;
            byDate[p.dueDate].items.push(p);
        });

        const dates = Object.keys(byDate).sort();
        dates.forEach(date => {
            current += (byDate[date].incoming - byDate[date].outgoing);
            result.push({
                date,
                balance: current,
                diff: byDate[date].incoming - byDate[date].outgoing,
                isNegative: current < 0
            });
        });

        return result;
    }, [payments, initialCash]);

    const negativeDates = projectionData.filter(d => d.isNegative);

    // HR Integration: Sync salaries
    useEffect(() => {
        const hrData = localStorage.getItem('enba_hr_personel');
        if (hrData) {
            const personnel = JSON.parse(hrData);
            const today = new Date();
            const currentMonth = today.toISOString().slice(0, 7);
            
            const newSalaries = [];
            personnel.forEach(p => {
                const salaryId = `salary_${p.id}_${currentMonth}`;
                if (!payments.find(pm => pm.id === salaryId)) {
                    newSalaries.push({
                        id: salaryId,
                        title: `${p.name} - ${currentMonth} Maaş`,
                        amount: Number(p.salary) || 0,
                        type: 'outgoing',
                        category: 'Salary',
                        dueDate: `${currentMonth}-05`, 
                        status: 'pending'
                    });
                }
            });

            if (newSalaries.length > 0) {
                setPayments(prev => [...prev, ...newSalaries]);
            }
        }
    }, []);

    const savePayment = (data) => {
        if (editingItem) {
            setPayments(payments.map(p => p.id === editingItem.id ? { ...data, id: p.id } : p));
        } else {
            setPayments([...payments, { ...data, id: Date.now().toString() }]);
        }
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const deletePayment = (id) => {
        if (confirm('Bu ödeme kaydı silinecektir?')) {
            setPayments(payments.filter(p => p.id !== id));
        }
    };

    // Calendar Calculations
    const [currentDate, setCurrentDate] = useState(new Date());
    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        const grid = [];
        
        for (let i = 0; i < startDay; i++) grid.push(null);
        
        for (let i = 1; i <= days; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayPayments = payments.filter(p => p.dueDate === dateStr);
            grid.push({ day: i, date: dateStr, payments: dayPayments });
        }
        
        return grid;
    }, [currentDate, payments]);

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + offset)));
    };

    // Styles
    const containerStyle = { padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" };
    const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
    const cardStyle = { background: '#fff', borderRadius: '1.2rem', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--surface-container-highest)' };
    const btnPrimary = { padding: '10px 20px', background: 'var(--enba-dark)', color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer' };
    const badgeStyle = (type, status) => ({
        padding: '4px 12px', borderRadius: '2rem', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
        background: status === 'paid' ? 'var(--success-container)' : status === 'pending' ? 'var(--warning-container)' : 'var(--error-container)',
        color: status === 'paid' ? 'var(--success)' : status === 'pending' ? 'var(--enba-orange)' : 'var(--error)'
    });

    const ProjectionChart = () => {
        if (projectionData.length === 0) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>{window.t('payments.no_projection_data')}</div>;
        
        const balances = [initialCash, ...projectionData.map(d => d.balance)];
        const maxV = Math.max(...balances, 0) || 1000;
        const minV = Math.min(...balances, 0);
        const range = maxV - minV;
        
        const W = 1000, H = 200;
        const getY = (v) => H - ((v - minV) / range) * H;
        const step = W / (projectionData.length);

        let path = `M 0 ${getY(initialCash)}`;
        projectionData.forEach((d, i) => {
            path += ` L ${(i+1)*step} ${getY(d.balance)}`;
        });

        return (
            <div style={{ width: '100%', height: '220px', position: 'relative', marginTop: '20px' }}>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow:'visible' }}>
                    {/* Zero line */}
                    <line x1="0" y1={getY(0)} x2={W} y2={getY(0)} stroke="var(--surface-container-highest)" strokeDasharray="5,5" />
                    {/* Balance Path */}
                    <path d={path} fill="none" stroke="var(--enba-dark)" strokeWidth="3" />
                    {/* Points */}
                    {projectionData.map((d, i) => (
                        <circle key={i} cx={(i+1)*step} cy={getY(d.balance)} r="4" fill={d.isNegative ? 'var(--error)' : 'var(--enba-dark)'} />
                    ))}
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', fontWeight: 600, color: 'var(--on-surface-variant)' }}>
                    <span>{window.t('payments.today')}</span>
                    <span>{window.t('payments.last_due')}</span>
                </div>
            </div>
        );
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div>
                    <h2 style={{ margin: 0, color: 'var(--enba-dark)', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800 }}>
                        <i className="ph-fill ph-calendar-check" style={{ color: 'var(--enba-orange)' }}></i> {window.t('payments.upcoming')}
                    </h2>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '4px' }}>{window.t('payments.desc')}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ background: 'var(--surface-container-high)', padding: '4px', borderRadius: '0.8rem', display: 'flex', gap: '4px' }}>
                        <button onClick={() => setViewMode('list')} className="btn-icon" style={{ background: viewMode === 'list' ? '#fff' : 'transparent', borderRadius: '0.6rem' }} title={window.t('payments.list')}><i className="ph ph-list-bullets"></i></button>
                        <button onClick={() => setViewMode('calendar')} className="btn-icon" style={{ background: viewMode === 'calendar' ? '#fff' : 'transparent', borderRadius: '0.6rem' }} title={window.t('payments.calendar')}><i className="ph ph-calendar"></i></button>
                        <button onClick={() => setViewMode('projection')} className="btn-icon" style={{ background: viewMode === 'projection' ? '#fff' : 'transparent', borderRadius: '0.6rem' }} title={window.t('payments.cash_projection')}><i className="ph ph-chart-line-up"></i></button>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} style={btnPrimary}>+ {window.t('payments.add')}</button>
                </div>
            </div>

            <div className="enba-card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--enba-dark)', color: '#fff', padding: '24px' }}>
                <div style={{ fontSize: '32px', color: 'var(--enba-orange)' }}><i className="ph-fill ph-wallet"></i></div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: 700, letterSpacing: '1px' }}>{window.t('payments.initial_cash').toUpperCase()}</div>
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{window.fmt(initialCash)} ₺</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="number" value={initialCash} onChange={(e) => setInitialCash(Number(e.target.value))} onFocus={window.selectOnFocus}
                        style={{ padding: '8px', borderRadius: '8px', border: 'none', width: '150px', fontSize: '14px' }} placeholder={window.t('payments.update_balance_placeholder')} />
                </div>
            </div>

            {viewMode === 'list' && (
                <div style={cardStyle}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--surface-container-highest)' }}>
                                <th style={{ padding: '12px' }}>{window.t('payments.title')}</th>
                                <th style={{ padding: '12px' }}>{window.t('payments.category')}</th>
                                <th style={{ padding: '12px' }}>{window.t('payments.amount')}</th>
                                <th style={{ padding: '12px' }}>{window.t('payments.dueDate')}</th>
                                <th style={{ padding: '12px' }}>{window.t('payments.status')}</th>
                                <th style={{ padding: '12px' }}>{window.t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)).map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--surface-container-low)' }}>
                                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--enba-dark)' }}>
                                        <i className={p.type === 'incoming' ? 'ph ph-arrow-down-left' : 'ph ph-arrow-up-right'} 
                                           style={{ color: p.type === 'incoming' ? 'var(--success)' : 'var(--error)', marginRight: '8px' }}></i>
                                        {p.title}
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>{window.t(`payments.${p.category.toLowerCase()}`) || p.category}</td>
                                    <td style={{ padding: '12px', fontWeight: 700, color: p.type === 'incoming' ? 'var(--success)' : 'var(--error)' }}>
                                        {p.type === 'incoming' ? '+' : '-'}{window.fmt(p.amount)} ₺
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '13px' }}>{p.dueDate}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={badgeStyle(p.type, p.status)}>{window.t(`payments.${p.status}`)}</span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button onClick={() => { setEditingItem(p); setIsModalOpen(true); }} className="btn-icon" style={{ marginRight: '8px' }} title={window.t('common.edit')}><i className="ph ph-pencil-line"></i></button>
                                        <button onClick={() => deletePayment(p.id)} className="btn-icon" style={{ color: 'var(--error)' }} title={window.t('common.delete')}><i className="ph ph-trash"></i></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {viewMode === 'calendar' && (
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <button onClick={() => changeMonth(-1)} className="btn btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="ph ph-caret-left"></i> {window.t('common.previous')}
                        </button>
                        <h3 style={{ margin: 0, fontWeight: 800, textTransform: 'capitalize', color: 'var(--enba-dark)' }}>
                            {currentDate.toLocaleString(localStorage.getItem('enba_lang') === 'TR' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button onClick={() => changeMonth(1)} className="btn btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {window.t('common.next')} <i className="ph ph-caret-right"></i>
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--surface-container-highest)', border: '1px solid var(--surface-container-highest)' }}>
                        {(localStorage.getItem('enba_lang') === 'TR' ? ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map(d => (
                            <div key={d} style={{ background: '#f8f9fa', padding: '10px', textAlign: 'center', fontWeight: 700, fontSize: '12px' }}>{d}</div>
                        ))}
                        {calendarGrid.map((cell, idx) => (
                            <div key={idx} style={{ background: '#fff', minHeight: '100px', padding: '8px', border: '0.5px solid #f0f0f0' }}>
                                {cell && (
                                    <>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#aaa', marginBottom: '5px' }}>{cell.day}</div>
                                        {cell.payments.map(p => (
                                            <div key={p.id} style={{ 
                                                fontSize: '10px', padding: '4px', borderRadius: '4px', marginBottom: '2px', 
                                                background: p.type === 'incoming' ? 'var(--success-container)' : 'var(--error-container)',
                                                color: p.type === 'incoming' ? 'var(--success)' : 'var(--error)',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                borderLeft: `3px solid ${p.type === 'incoming' ? 'var(--success)' : 'var(--error)'}`
                                            }} title={p.title}>
                                                <b>{window.fmt(p.amount)}</b> {p.title}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {viewMode === 'projection' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="enba-card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="ph ph-chart-line-up" style={{ color: 'var(--enba-orange)' }}></i> {window.t('payments.cash_projection')}
                        </h3>
                        <ProjectionChart />
                    </div>

                    {negativeDates.length > 0 && (
                        <div style={{ ...cardStyle, borderLeft: '10px solid var(--error)', background: 'rgba(198, 40, 40, 0.05)', padding: '24px' }}>
                            <h4 style={{ color: 'var(--error)', margin: '0 0 10px 0', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="ph-fill ph-warning-octagon"></i> {window.t('payments.negative_alert')}
                            </h4>
                            <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>{window.t('payments.negative_alert_desc')}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '15px' }}>
                                {negativeDates.map((d, i) => (
                                    <div key={i} style={{ padding: '10px', borderRadius: '8px', background: '#fff', border: '1px solid #fab1a0', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--error)' }}>{d.date}</div>
                                        <div style={{ fontSize: '12px', fontWeight: 600 }}>{window.fmt(d.balance)} ₺</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {negativeDates.length === 0 && (
                        <div style={{ ...cardStyle, borderLeft: '10px solid var(--success)', background: '#f2f9f5' }}>
                            <h4 style={{ color: 'var(--success)', margin: 0 }}>{window.t('payments.cash_safe')}</h4>
                            <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginTop: '5px' }}>{window.t('payments.cash_safe_desc')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ ...cardStyle, width: '450px' }}>
                        <h3>{editingItem ? window.t('common.edit') : window.t('payments.add')}</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            savePayment({
                                title: formData.get('title'),
                                amount: Number(formData.get('amount')),
                                type: formData.get('type'),
                                category: formData.get('category'),
                                dueDate: formData.get('dueDate'),
                                status: formData.get('status')
                            });
                        }}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px' }}>{window.t('payments.title')}</label>
                                <input name="title" defaultValue={editingItem?.title} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px' }}>{window.t('payments.amount')} (₺)</label>
                                    <input name="amount" type="number" defaultValue={editingItem?.amount} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} onFocus={window.selectOnFocus} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px' }}>{window.t('payments.type')}</label>
                                    <select name="type" defaultValue={editingItem?.type || 'outgoing'} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                        <option value="outgoing">{window.t('payments.outgoing')}</option>
                                        <option value="incoming">{window.t('payments.incoming')}</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px' }}>{window.t('payments.dueDate')}</label>
                                    <input name="dueDate" type="date" defaultValue={editingItem?.dueDate || new Date().toISOString().slice(0, 10)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px' }}>{window.t('payments.status')}</label>
                                    <select name="status" defaultValue={editingItem?.status || 'pending'} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                        <option value="pending">{window.t('payments.pending')}</option>
                                        <option value="paid">{window.t('payments.paid')}</option>
                                        <option value="delayed">{window.t('payments.delayed')}</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px' }}>{window.t('payments.category')}</label>
                                <select name="category" defaultValue={editingItem?.category || 'Invoice'} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                    <option value="Salary">{window.t('payments.salary')}</option>
                                    <option value="Invoice">{window.t('payments.invoice')}</option>
                                    <option value="Utility">{window.t('payments.utility')}</option>
                                    <option value="Tax">{window.t('payments.tax')}</option>
                                    <option value="Rent">{window.t('common.rent') || 'Rent'}</option>
                                    <option value="Other">{window.t('common.other') || 'Other'}</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ ...btnPrimary, background: 'var(--surface-container-highest)', color: '#333' }}>{window.t('common.cancel')}</button>
                                <button type="submit" style={btnPrimary}>{window.t('common.save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

window.PaymentsModule = PaymentsModule;

