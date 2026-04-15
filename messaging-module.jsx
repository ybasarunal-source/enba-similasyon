// ============================================================
//  Enba Recycling — İletişim Merkezi (Messaging Hub)
// ============================================================

function MessagingModule({ user }) {
    const [messages, setMessages] = React.useState(() => {
        const saved = localStorage.getItem('enba_messages');
        return saved ? JSON.parse(saved) : [];
    });

    const [allUsers, setAllUsers] = React.useState(() => {
        const saved = localStorage.getItem('enba_users_data');
        return saved ? JSON.parse(saved) : window.MOCK_USERS;
    });

    const [archiveFiles, setArchiveFiles] = React.useState(() => {
        const saved = localStorage.getItem('enba_archive_db');
        return saved ? JSON.parse(saved) : [];
    });

    const [activeTab, setActiveTab] = React.useState('group'); // 'group', 'dm'
    const [activePeerId, setActivePeerId] = React.useState('general'); // 'general', 'announcements', or userId
    const [inputText, setInputText] = React.useState('');
    const [showFilePicker, setShowFilePicker] = React.useState(false);

    const scrollRef = React.useRef(null);

    // Sync messages across tabs
    React.useEffect(() => {
        const handleSync = (e) => {
            if (e.key === 'enba_messages') setMessages(JSON.parse(e.newValue || '[]'));
            if (e.key === 'enba_users_data') setAllUsers(JSON.parse(e.newValue || '[]'));
            if (e.key === 'enba_archive_db') setArchiveFiles(JSON.parse(e.newValue || '[]'));
        };
        window.addEventListener('storage', handleSync);
        return () => window.removeEventListener('storage', handleSync);
    }, []);

    // Scroll to bottom on new messages
    React.useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, activePeerId]);

    const isSystemUser = user.role === window.USER_ROLES.ADMIN || user.role === window.USER_ROLES.GENEL_MUDUR;

    const filteredMessages = messages.filter(m => {
        if (activePeerId === 'general') return m.to === 'general';
        if (activePeerId === 'announcements') return m.to === 'announcements';
        // Private DM
        return (m.from === user.id && m.to === activePeerId) || (m.from === activePeerId && m.to === user.id);
    });

    const sendMessage = (text, file = null) => {
        if (!text.trim() && !file) return;

        const newMessage = {
            id: 'm-' + Date.now(),
            from: user.id,
            fromName: user.name,
            to: activePeerId,
            text: text,
            file: file,
            timestamp: new Date().toISOString(),
            isAnnouncement: activePeerId === 'announcements'
        };

        const updated = [...messages, newMessage];
        setMessages(updated);
        localStorage.setItem('enba_messages', JSON.stringify(updated));
        setInputText('');
    };

    const attachFile = (fileObj) => {
        sendMessage(`⚡ ? Dosya paylaştı: ${fileObj.ad}`, {
            id: fileObj.id,
            ad: fileObj.ad,
            kategori: fileObj.kategori
        });
        setShowFilePicker(false);
    };

    const formatTime = (iso) => {
        const d = new Date(iso);
        return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    };

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#fff', overflow: 'hidden' }}>
            
            {/* Siderbar (Channels/Users) */}
            <div style={{ 
                width: '320px', borderRight: '1px solid var(--surface-container-high)', 
                background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column' 
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--surface-container-high)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--enba-dark)' }}>Mesajlaşma</h2>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    
                    {/* Groups */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', padding: '0 12px 8px', letterSpacing: '0.5px' }}>Kanallar</div>
                        <button 
                            onClick={() => { setActivePeerId('announcements'); setActiveTab('group'); }}
                            style={{ 
                                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
                                border: 'none', borderRadius: '0.75rem', cursor: 'pointer', textAlign: 'left',
                                background: activePeerId === 'announcements' ? 'rgba(243,156,18,0.1)' : 'transparent',
                                color: activePeerId === 'announcements' ? 'var(--enba-orange-dark)' : 'var(--on-surface)'
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>⚡ </span>
                            <div style={{ fontWeight: activePeerId === 'announcements' ? 700 : 500 }}>Genel Duyurular</div>
                        </button>
                        <button 
                            onClick={() => { setActivePeerId('general'); setActiveTab('group'); }}
                            style={{ 
                                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
                                border: 'none', borderRadius: '0.75rem', cursor: 'pointer', textAlign: 'left',
                                background: activePeerId === 'general' ? 'rgba(243,156,18,0.1)' : 'transparent',
                                color: activePeerId === 'general' ? 'var(--enba-orange-dark)' : 'var(--on-surface)'
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>⚡ </span>
                            <div style={{ fontWeight: activePeerId === 'general' ? 700 : 500 }}>Genel Sohbet</div>
                        </button>
                    </div>

                    {/* DMs */}
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', padding: '0 12px 8px', letterSpacing: '0.5px' }}>Özel Mesajlar</div>
                        {allUsers.filter(u => u.id !== user.id).map(u => (
                            <button 
                                key={u.id}
                                onClick={() => { setActivePeerId(u.id); setActiveTab('dm'); }}
                                style={{ 
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', 
                                    border: 'none', borderRadius: '0.75rem', cursor: 'pointer', textAlign: 'left',
                                    background: activePeerId === u.id ? 'rgba(39,174,96,0.1)' : 'transparent',
                                    color: activePeerId === u.id ? 'var(--enba-orange)' : 'var(--on-surface)',
                                    marginBottom: '2px'
                                }}
                            >
                                <div style={{ 
                                    width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-container-highest)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: 'var(--enba-dark)', overflow: 'hidden'
                                }}>
                                    {u.avatar ? <img src={u.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.name.split(' ').map(n=>n[0]).join('')}
                                </div>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: activePeerId === u.id ? 700 : 500 }}>{u.name}</div>
                                    <div style={{ fontSize: '10px', opacity: 0.6 }}>{u.role.toUpperCase()}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
                
                {/* Header */}
                <div style={{ 
                    padding: '16px 24px', background: '#fff', borderBottom: '1px solid var(--surface-container-high)',
                    display: 'flex', alignItems: 'center', gap: '16px'
                }}>
                    <div style={{ fontSize: '20px' }}>
                        {activePeerId === 'announcements' ? '⚡ ' : activePeerId === 'general' ? '⚡ ' : '⚡ '}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                            {activePeerId === 'announcements' ? 'Genel Duyurular' : activePeerId === 'general' ? 'Genel Sohbet' : allUsers.find(u=>u.id===activePeerId)?.name}
                        </h3>
                        {activePeerId === 'announcements' && <span style={{ fontSize: '11px', color: 'var(--error)' }}>Sadece Yönetim</span>}
                    </div>
                </div>

                {/* Messages Feed */}
                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredMessages.map((m, i) => {
                        const isMe = m.from === user.id;
                        return (
                            <div key={m.id} style={{ 
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '70%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isMe ? 'flex-end' : 'flex-start'
                            }}>
                                {!isMe && activeTab === 'group' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', marginLeft: '4px' }}>
                                        <div style={{ 
                                            width: '18px', height: '18px', borderRadius: '50%', background: '#ddd', overflow: 'hidden',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800
                                        }}>
                                            {(() => {
                                                const sender = allUsers.find(u => u.id === m.from);
                                                return sender?.avatar ? <img src={sender.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.fromName[0];
                                            })()}
                                        </div>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>{m.fromName}</div>
                                    </div>
                                )}
                                <div style={{ 
                                    padding: '12px 16px', 
                                    borderRadius: isMe ? '1.2rem 1.2rem 0.2rem 1.2rem' : '1.2rem 1.2rem 1.2rem 0.2rem',
                                    background: m.isAnnouncement ? 'var(--error)' : isMe ? 'var(--enba-dark)' : '#fff',
                                    color: (m.isAnnouncement || isMe) ? '#fff' : 'var(--on-surface)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                    position: 'relative'
                                }}>
                                    {m.file ? (
                                        <div style={{ 
                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', 
                                            background: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', cursor: 'pointer' 
                                        }} onClick={() => alert('Dosya Görüntüleniyor: ' + m.file.ad)}>
                                            <span style={{ fontSize: '20px' }}>⚡ </span>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 700 }}>{m.file.ad}</div>
                                                <div style={{ fontSize: '10px', opacity: 0.8 }}>{m.file.kategori}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{m.text}</div>
                                    )}
                                    <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '4px', textAlign: 'right' }}>{formatTime(m.timestamp)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input Area */}
                {activePeerId === 'announcements' && !isSystemUser ? (
                    <div style={{ padding: '20px', background: '#eee', textAlign: 'center', fontSize: '13px', color: '#666' }}>
                        Bu kanala sadece yöneticiler mesaj gönderebilir.
                    </div>
                ) : (
                    <div style={{ padding: '20px', background: '#fff', borderTop: '1px solid var(--surface-container-high)' }}>
                        <form 
                            onSubmit={(e) => { e.preventDefault(); sendMessage(inputText); }}
                            style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                        >
                            <button 
                                type="button" 
                                onClick={() => setShowFilePicker(true)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', opacity: 0.6 }}
                                title="Dosya Ekle"
                            >
                                ⚡ ?
                            </button>
                            <input 
                                className="form-control"
                                placeholder={activePeerId === 'announcements' ? "Duyuru yapın..." : "Mesajınızı yazın..."}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                style={{ borderRadius: '1.5rem', paddingLeft: '20px' }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                ⚡ 
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* FILE PICKER MODAL */}
            {showFilePicker && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '2rem', width: '100%', maxWidth: '600px', padding: '32px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Arşiv'den Dosya Seç</h2>
                            <button onClick={() => setShowFilePicker(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {archiveFiles.length === 0 ? <p style={{ textAlign: 'center', color: '#666' }}>Arşivde dosya bulunmuyor.</p> : archiveFiles.map(f => (
                                <div key={f.id} onClick={() => attachFile(f)} style={{ 
                                    padding: '12px 16px', borderRadius: '1rem', border: '1px solid #eee', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s'
                                }} onMouseOver={e=>e.currentTarget.style.background='#f0f0f0'} onMouseOut={e=>e.currentTarget.style.background='none'}>
                                    <span style={{ fontSize: '24px' }}>⚡ </span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{f.ad}</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>{f.kategori} • {f.tarih}</div>
                                    </div>
                                    <button className="btn btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }}>Seç</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

window.MessagingModule = MessagingModule;

