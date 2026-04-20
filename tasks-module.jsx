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

    // Microsoft States
    const [msAccount, setMsAccount] = React.useState(null);
    const [isConnecting, setIsConnecting] = React.useState(false);
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [isCompact, setIsCompact] = React.useState(() => {
        return localStorage.getItem('enba_tasks_compact') === 'true';
    });

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
        localStorage.setItem('enba_tasks_compact', isCompact.toString());
    }, [tasks, projects, isCompact]);

    // Microsoft Initializer
    React.useEffect(() => {
        const checkAccount = async () => {
            if (window.microsoftService) {
                const acc = await window.microsoftService.getAccount();
                if (acc) {
                    setMsAccount(acc);
                    handleSyncAll(acc);
                }
            }
        };
        checkAccount();
    }, []);

    const handleMsConnect = async () => {
        if (!window.microsoftService) return;
        setIsConnecting(true);
        // Give React time to render the loading state
        await new Promise(r => setTimeout(r, 100));
        try {
            const acc = await window.microsoftService.loginPopup();
            if (acc) setMsAccount(acc);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleSync = async () => {
        if (!window.microsoftService || !msAccount) return;
        setIsSyncing(true);
        try {
            const list = await window.microsoftService.ensureTodoList('Enba Tasks');
            if (!list) throw new Error('List access failed');
            
            for (const task of tasks) {
                if (task.status !== 'done') {
                    await window.microsoftService.syncTask(list.id, task);
                }
            }
            alert('Görevler Microsoft To Do ile senkronize edildi!');
        } catch (err) {
            console.error('Sync error:', err);
            alert('Senkronizasyon hatası.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        const isNew = !editingTask;
        const newTask = {
            ...formData,
            id: isNew ? Date.now() : editingTask.id,
            status: isNew ? 'todo' : editingTask.status,
            createdAt: isNew ? new Date().toISOString() : editingTask.createdAt,
            msTodoId: editingTask?.msTodoId,
            msListId: editingTask?.msListId
        };

        if (editingTask) {
            setTasks(tasks.map(t => t.id === editingTask.id ? newTask : t));
        } else {
            setTasks([...tasks, newTask]);
        }

        setShowTaskForm(false);
        setEditingTask(null);
        setFormData({ title: '', desc: '', priority: 'medium', deadline: '', projectId: 'p1', moduleRef: 'genel' });

        // Microsoft Push
        if (msAccount && window.microsoftService) {
            try {
                const list = await window.microsoftService.ensureTodoList('Enba Tasks');
                if (list) {
                    const result = await window.microsoftService.syncTask(list.id, newTask, newTask.msTodoId);
                    if (result && result.id) {
                        setTasks(current => current.map(t => t.id === newTask.id ? { ...t, msTodoId: result.id, msListId: list.id } : t));
                    }
                }
            } catch (err) { console.error('MS Push Error:', err); }
        }
    };

    const handleDeleteTask = async (id) => {
        if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
            const task = tasks.find(t => t.id === id);
            setTasks(tasks.filter(t => t.id !== id));
            
            if (msAccount && task?.msTodoId && task?.msListId && window.microsoftService) {
                await window.microsoftService.deleteTask(task.msListId, task.msTodoId);
            }
        }
    };

    const toggleTask = async (id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        
        // Local update
        setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));

        // Microsoft Update
        if (msAccount && task.msTodoId && task.msListId && window.microsoftService) {
            await window.microsoftService.syncTask(task.msListId, { ...task, status: newStatus }, task.msTodoId);
        }
    };

    const handleSyncAll = async (accountInstance = msAccount) => {
        if (!accountInstance || !window.microsoftService) return;
        setIsSyncing(true);
        try {
            const list = await window.microsoftService.ensureTodoList('Enba Tasks');
            if (!list) return;

            const msTasks = await window.microsoftService.getTodoListTasks(list.id);
            
            setTasks(current => {
                const updatedTasks = current.map(localTask => {
                    if (!localTask.msTodoId) return localTask;
                    const msTask = msTasks.find(t => t.id === localTask.msTodoId);
                    if (!msTask) return localTask;

                    const msStatus = msTask.status === 'completed' ? 'done' : 'todo';
                    const msDesc = msTask.body?.content || '';

                    if (localTask.status !== msStatus || localTask.title !== msTask.title || localTask.desc !== msDesc) {
                        return { ...localTask, status: msStatus, title: msTask.title, desc: msDesc };
                    }
                    return localTask;
                });

                const newTasksFromMs = [];
                msTasks.forEach(msTask => {
                    if (!current.find(t => t.msTodoId === msTask.id)) {
                        newTasksFromMs.push({
                            id: 'ms-' + msTask.id,
                            title: msTask.title,
                            desc: msTask.body?.content || '',
                            priority: msTask.importance === 'high' ? 'high' : 'medium',
                            deadline: msTask.dueDateTime?.dateTime || '',
                            projectId: 'p1',
                            moduleRef: 'genel',
                            status: msTask.status === 'completed' ? 'done' : 'todo',
                            createdAt: msTask.createdDateTime || new Date().toISOString(),
                            msTodoId: msTask.id,
                            msListId: list.id
                        });
                    }
                });
                return [...updatedTasks, ...newTasksFromMs];
            });
        } catch (err) {
            console.error('Sync error:', err);
        } finally {
            setIsSyncing(false);
        }
    };

    const isOverdue = (date) => {
        if (!date) return false;
        return new Date(date) < new Date() && tasks.find(t => t.deadline === date && t.status !== 'done');
    };

    const TaskCard = ({ task }) => {
        const isDone = task.status === 'done';
        const overdue = isOverdue(task.deadline) && !isDone;

        return (
            <div key={task.id} style={{ 
                background: '#ffffff', 
                padding: '10px 14px', 
                borderRadius: '1rem', 
                boxShadow: 'var(--shadow-sm)', 
                border: overdue ? '2px solid var(--enba-danger)' : '1px solid var(--surface-container-high)',
                position: 'relative',
                transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                opacity: isDone ? 0.5 : 1,
                filter: isDone ? 'grayscale(0.5)' : 'none'
            }}>
                 <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: task.priority === 'high' ? 'var(--enba-danger)' : task.priority === 'medium' ? 'var(--enba-orange)' : 'var(--info)' }}></div>

                {/* Checkbox */}
                <button 
                    onClick={() => toggleTask(task.id)}
                    style={{ 
                        width: '22px', height: '22px', borderRadius: '50%', border: '2px solid',
                        borderColor: isDone ? 'var(--enba-orange)' : '#e2e8f0',
                        background: isDone ? 'var(--enba-orange)' : 'transparent',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s'
                    }}
                >
                    {isDone && <i className="ph ph-check" style={{ fontSize: '12px', fontWeight: 900 }}></i>}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ 
                            margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--enba-dark)', 
                            textDecoration: isDone ? 'line-through' : 'none',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px' 
                        }}>{task.title}</h4>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="btn-icon" style={{ width: '24px', height: '24px' }} onClick={() => { setEditingTask(task); setFormData(task); setShowTaskForm(true); }} title="Düzenle">
                                <i className="ph ph-pencil-simple" style={{ fontSize: '12px' }}></i>
                            </button>
                            <button className="btn-icon" style={{ color: 'var(--enba-danger)', width: '24px', height: '24px' }} onClick={() => handleDeleteTask(task.id)} title="Sil">
                                <i className="ph ph-trash" style={{ fontSize: '12px' }}></i>
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '9px', color: overdue ? '#ef4444' : '#94a3b8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
                            <i className="ph ph-calendar"></i> {task.deadline ? new Date(task.deadline).toLocaleDateString('tr-TR') : 'SÜRESİZ'}
                        </span>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: task.priority === 'high' ? 'var(--enba-danger)' : task.priority === 'medium' ? 'var(--enba-orange)' : 'var(--info)' }}></div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '40px 48px', maxWidth: '1000px', margin: '0 auto', background: 'var(--surface)', minHeight: 'calc(100vh - 80px)' }}>
            <style>{`
                @keyframes blink-red {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--enba-orange)', marginBottom: '8px' }}>
                        <i className="ph ph-clipboard-text" style={{ fontSize: '24px' }}></i>
                        <span style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '1px' }}>PROJE & GÖREV YÖNETİMİ</span>
                    </div>
                    <h1 style={{ margin: 0, fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '32px', color: 'var(--enba-dark)' }}>İş Takip Merkezi</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {!msAccount ? (
                        <button 
                            onClick={handleMsConnect}
                            disabled={isConnecting}
                            style={{ 
                                padding: '10px 20px', borderRadius: '12px', fontWeight: 800, fontSize: '11px', 
                                background: isConnecting ? '#ccc' : '#0078d4', color: '#fff', border: 'none', 
                                cursor: isConnecting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
                            }}
                        >
                            {isConnecting ? '⌛  Bağlanıyor...' : '🟦  Microsoft To Do Bağla'}
                        </button>
                    ) : (
                        <button 
                        onClick={() => handleSyncAll()}
                        disabled={isSyncing}
                        style={{ 
                            padding: '10px 20px', borderRadius: '12px', fontWeight: 800, fontSize: '11px', 
                            background: isSyncing ? '#ccc' : '#2ecc71', color: '#fff', border: 'none', 
                            cursor: isSyncing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
                        }}
                    >
                        {isSyncing ? '🔄  Senkronize Ediliyor...' : '✅  MS To Do Güncelle'}
                    </button>
                    )}
                    <button
                        onClick={() => setShowTaskForm(true)}
                        className="btn btn-primary"
                        style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <i className="ph ph-plus-circle"></i> Yeni Görev
                    </button>
                </div>
            </div>

            <div className="custom-scrollbar" style={{ 
                background: '#fff', 
                borderRadius: '2rem', 
                padding: '32px', 
                boxShadow: 'var(--shadow-sm)', 
                border: '1px solid var(--surface-container-high)',
                maxHeight: 'calc(100vh - 250px)',
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--enba-dark)' }}>Operasyon Akışı</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Tüm Görevler (Sıralı)</p>
                    </div>
                    <div style={{ background: 'var(--secondary-container)', color: 'var(--enba-orange)', fontSize: '10px', fontWeight: 800, padding: '4px 12px', borderRadius: '12px' }}>
                        {tasks.filter(t => t.status !== 'done').length} Bekleyen Görev
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tasks
                        .sort((a, b) => (a.status === 'done' ? 1 : -1) - (b.status === 'done' ? 1 : -1))
                        .map(task => <TaskCard key={task.id} task={task} />)
                    }
                    {tasks.length === 0 && (
                        <div style={{ padding: '60px', textAlign: 'center', border: '2px dashed #f1f5f9', borderRadius: '2rem' }}>
                            <i className="ph ph-clipboard-text" style={{ fontSize: '32px', color: '#e2e8f0', marginBottom: '12px' }}></i>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Henüz görev eklenmemiş</div>
                        </div>
                    )}
                </div>
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

