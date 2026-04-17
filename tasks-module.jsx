/**
 * ENBA RECYCLING - Görev ve Proje Yönetimi Modülü
 * Kanban tarzı iş takibi, proje gruplama ve süreli görev yönetimi.
 */

window.GorevModulu = function({ navigate }) {
    const [tasks, setTasks] = React.useState(() => {
        const saved = localStorage.getItem('enba_tasks');
        return saved ? JSON.parse(saved) : [];
    });

    const [projects, setProjects] = React.useState(() => {
        const saved = localStorage.getItem('enba_projects');
        return saved ? JSON.parse(saved) : [
            { id: 'p1', name: 'Genel Operasyon' },
            { id: 'p2', name: '2024 Modernizasyon' }
        ];
    });

    const [showTaskForm, setShowTaskForm] = React.useState(false);
    const [showProjectForm, setShowProjectForm] = React.useState(false);
    const [editingTask, setEditingTask] = React.useState(null);

    // Form states
    const [formData, setFormData] = React.useState({
        title: '',
        desc: '',
        priority: 'medium',
        deadline: '',
        projectId: 'p1',
        moduleRef: 'genel'
    });

    const categories = [
        { id: 'genel', label: 'Genel', color: 'var(--on-surface-variant)' },
        { id: 'isPlanlama', label: 'İş Planlama', color: 'var(--enba-orange)' },
        { id: 'uretimTakip', label: 'Üretim', color: '#8e44ad' },
        { id: 'lojistikTakip', label: 'Lojistik', color: '#e67e22' },
        { id: 'lisansTakip', label: 'Lisans/Belge', color: 'var(--enba-danger)' },
        { id: 'stok', label: 'Stok', color: 'var(--info)' }
    ];

    React.useEffect(() => {
        localStorage.setItem('enba_tasks', JSON.stringify(tasks));
        localStorage.setItem('enba_projects', JSON.stringify(projects));
    }, [tasks, projects]);

    const handleAddTask = (e) => {
        e.preventDefault();
        const newTask = {
            ...formData,
            id: editingTask ? editingTask.id : Date.now(),
            status: editingTask ? editingTask.status : 'todo',
            createdAt: editingTask ? editingTask.createdAt : new Date().toISOString()
        };

        if (editingTask) {
            setTasks(tasks.map(t => t.id === editingTask.id ? newTask : t));
        } else {
            setTasks([...tasks, newTask]);
        }

        setShowTaskForm(false);
        setEditingTask(null);
        setFormData({ title: '', desc: '', priority: 'medium', deadline: '', projectId: 'p1', moduleRef: 'genel' });
    };

    const handleDeleteTask = (id) => {
        if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
            setTasks(tasks.filter(t => t.id !== id));
        }
    };

    const moveTask = (id, newStatus) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    };

    const isOverdue = (date) => {
        if (!date) return false;
        return new Date(date) < new Date() && tasks.find(t => t.deadline === date && t.status !== 'done');
    };

    const KanbanColumn = ({ title, status, icon, color }) => {
        const filteredTasks = tasks.filter(t => t.status === status);
        return (
            <div style={{ flex: 1, minWidth: '300px', background: 'var(--surface-container-low)', borderRadius: '1.5rem', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--surface-container-high)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className={`ph ${icon}`} style={{ fontSize: '20px', color }}></i>
                        <h3 style={{ margin: 0, fontFamily: "'Manrope', sans-serif", fontSize: '16px', fontWeight: 800, color: 'var(--enba-dark)' }}>{title}</h3>
                        <span style={{ background: 'var(--surface-container-highest)', color: 'var(--enba-dark)', fontSize: '11px', fontWeight: 800, padding: '2px 10px', borderRadius: '12px' }}>{filteredTasks.length}</span>
                    </div>
                </div>

                {filteredTasks.map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    const cat = categories.find(c => c.id === task.moduleRef);
                    const overdue = isOverdue(task.deadline) && task.status !== 'done';

                    return (
                        <div key={task.id} style={{ 
                            background: '#ffffff', 
                            padding: '18px', 
                            borderRadius: '1.25rem', 
                            boxShadow: 'var(--shadow-sm)', 
                            border: overdue ? '2px solid var(--enba-danger)' : '1px solid var(--surface-container-high)',
                            position: 'relative',
                            transition: 'all 0.2s',
                            cursor: 'grab'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <span style={{ 
                                    fontSize: '10px', 
                                    fontWeight: 800, 
                                    padding: '2px 10px', 
                                    borderRadius: '1rem', 
                                    background: task.priority === 'high' ? 'var(--error-container)' : task.priority === 'medium' ? 'var(--secondary-container)' : '#f0f9ff',
                                    color: task.priority === 'high' ? 'var(--enba-danger)' : task.priority === 'medium' ? 'var(--enba-orange)' : 'var(--info)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn-icon" onClick={() => { setEditingTask(task); setFormData(task); setShowTaskForm(true); }} title="Düzenle">
                                        <i className="ph ph-pencil-simple"></i>
                                    </button>
                                    <button className="btn-icon" style={{ color: 'var(--enba-danger)' }} onClick={() => handleDeleteTask(task.id)} title="Sil">
                                        <i className="ph ph-trash"></i>
                                    </button>
                                </div>
                            </div>

                            <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 700, color: 'var(--enba-dark)' }}>{task.title}</h4>
                            <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{task.desc}</p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '10px', background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--surface-container-highest)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <i className="ph ph-package"></i> {project?.name}
                                </span>
                                <span style={{ fontSize: '10px', background: cat?.color + '20', color: cat?.color, padding: '4px 8px', borderRadius: '4px', border: `1px solid ${cat?.color}40`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <i className="ph ph-hash"></i> {cat?.label}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '10px', color: overdue ? '#ef4444' : '#94a3b8', fontWeight: overdue ? 800 : 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <i className="ph ph-calendar"></i> {task.deadline ? new Date(task.deadline).toLocaleDateString('tr-TR') : 'Süresiz'}
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {status !== 'todo' && <button onClick={() => moveTask(task.id, status === 'done' ? 'doing' : 'todo')} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>←</button>}
                                    {status !== 'done' && <button onClick={() => moveTask(task.id, status === 'todo' ? 'doing' : 'done')} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '4px', border: '1px solid #e2e8f0', background: 'var(--enba-dark)', color: '#fff', cursor: 'pointer' }}>→</button>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{ padding: '40px 48px', maxWidth: '1400px', margin: '0 auto', background: 'var(--surface)', minHeight: 'calc(100vh - 80px)' }}>
            <style>{`
                @keyframes blink-red {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--enba-orange)', marginBottom: '8px' }}>
                        <i className="ph ph-clipboard-text" style={{ fontSize: '24px' }}></i>
                        <span style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '1px' }}>PROJE & GÖREV YÖNETİMİ</span>
                    </div>
                    <h1 style={{ margin: 0, fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '32px', color: 'var(--enba-dark)' }}>İş Takip Merkezi</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={() => setShowProjectForm(true)}
                        className="btn btn-secondary"
                        style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <i className="ph ph-folder-plus"></i> Yeni Proje
                    </button>
                    <button
                        onClick={() => setShowTaskForm(true)}
                        className="btn btn-primary"
                        style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <i className="ph ph-plus-circle"></i> Yeni Görev
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '20px' }}>
                <KanbanColumn title="Beklemede" status="todo" icon="ph-clock" color="#94a3b8" />
                <KanbanColumn title="İşlemde" status="doing" icon="ph-arrow-clockwise" color="#3498db" />
                <KanbanColumn title="Tamamlandı" status="done" icon="ph-check-circle" color="var(--enba-orange)" />
            </div>

            {/* TASK FORM MODAL */}
            {showTaskForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <form onSubmit={handleAddTask} style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h2 style={{ margin: '0 0 24px', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>{editingTask ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>Başlık</label>
                                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} placeholder="Ne yapılacak?" onFocus={window.selectOnFocus} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>Açıklama</label>
                                <textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '100px' }} placeholder="Detaylar..." onFocus={window.selectOnFocus} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>Öncelik</label>
                                    <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <option value="low">Düşük</option>
                                        <option value="medium">Orta</option>
                                        <option value="high">Yüksek</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>Bitiş Tarihi</label>
                                    <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>Proje</label>
                                    <select value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>Modül Bağlantısı</label>
                                    <select value={formData.moduleRef} onChange={e => setFormData({...formData, moduleRef: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                            <button type="button" onClick={() => { setShowTaskForm(false); setEditingTask(null); }} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Vazgeç</button>
                            <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--enba-dark)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Kaydet</button>
                        </div>
                    </form>
                </div>
            )}

            {/* PROJECT FORM MODAL */}
            {showProjectForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '32px' }}>
                        <h2 style={{ margin: '0 0 24px', fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>Yeni Proje Grubu</h2>
                        <input id="newProjName" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '24px' }} placeholder="Proje Adı" onFocus={window.selectOnFocus} onKeyDown={e => {
                            if(e.key === 'Enter') {
                                const val = e.target.value.trim();
                                if(val) {
                                    setProjects([...projects, { id: 'p-' + Date.now(), name: val }]);
                                    setShowProjectForm(false);
                                }
                            }
                        }} />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowProjectForm(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Vazgeç</button>
                            <button onClick={() => {
                                const val = document.getElementById('newProjName').value.trim();
                                if(val) {
                                    setProjects([...projects, { id: 'p-' + Date.now(), name: val }]);
                                    setShowProjectForm(false);
                                }
                            }} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--enba-dark)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Ekle</button>
                        </div>
                        
                        <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                            <h4 style={{ margin: '0 0 12px', fontSize: '13px', color: '#94a3b8' }}>Mevcut Projeler</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {projects.map(p => (
                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', padding: '8px 0', borderBottom: '1px solid var(--surface-container-high)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <i className="ph ph-folder" style={{ color: 'var(--enba-orange)' }}></i> {p.name}
                                        </span>
                                        {['p1', 'p2'].indexOf(p.id) === -1 && (
                                            <button className="btn-icon" style={{ color: 'var(--enba-danger)' }} onClick={() => setProjects(projects.filter(pr => pr.id !== p.id))}>
                                                <i className="ph ph-x"></i>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

