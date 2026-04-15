// ============================================================
//  Enba Recycling — Yüzen Messenger (Floating DM Box)
// ============================================================

function EnbaMessenger({ user }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [activePeerId, setActivePeerId] = React.useState(null);
    const [messages, setMessages] = React.useState(() => {
        const saved = localStorage.getItem('enba_messages');
        return saved ? JSON.parse(saved) : [];
    });
    const [allUsers, setAllUsers] = React.useState(() => {
        const saved = localStorage.getItem('enba_users_data');
        return saved ? JSON.parse(saved) : window.MOCK_USERS;
    });
    const [inputText, setInputText] = React.useState('');

    const scrollRef = React.useRef(null);

    React.useEffect(() => {
        const handleSync = (e) => {
            if (e.key === 'enba_messages') setMessages(JSON.parse(e.newValue || '[]'));
            if (e.key === 'enba_users_data') setAllUsers(JSON.parse(e.newValue || '[]'));
        };
        window.addEventListener('storage', handleSync);
        return () => window.removeEventListener('storage', handleSync);
    }, []);

    React.useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, activePeerId, isOpen]);

    const activePeer = allUsers.find(u => u.id === activePeerId);
    const filteredMessages = messages.filter(m => 
        (m.from === user.id && m.to === activePeerId) || (m.from === activePeerId && m.to === user.id)
    );

    const sendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newMessage = {
            id: 'm-' + Date.now(),
            from: user.id,
            fromName: user.name,
            to: activePeerId,
            text: inputText,
            timestamp: new Date().toISOString(),
            isAnnouncement: false
        };

        const updated = [...messages, newMessage];
        setMessages(updated);
        localStorage.setItem('enba_messages', JSON.stringify(updated));
        setInputText('');
    };

    const formatTime = (iso) => {
        const d = new Date(iso);
        return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    };

    // Unread count simulation (just for UI)
    const unreadCount = messages.filter(m => m.to === user.id && m.from !== activePeerId).length;

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '100px', zIndex: 9999 }}>
            
            {/* FAB Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    width: '60px', height: '60px', borderRadius: '50%', background: '#fff', 
                    color: 'var(--enba-dark)', border: '2px solid var(--enba-dark)', cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px',
                    position: 'relative', transition: 'all 0.2s ease'
                }}
            >
                <i className="ph-fill ph-chat-teardrop-text"></i>
                {unreadCount > 0 && !isOpen && (
                    <div style={{ 
                        position: 'absolute', top: '0', right: '0', background: 'var(--error)', 
                        color: '#fff', fontSize: '10px', width: '20px', height: '20px', 
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, border: '2px solid #fff'
                    }}>
                        {unreadCount}
                    </div>
                )}
            </button>

            {/* Messenger Popover */}
            {isOpen && (
                <div style={{ 
                    position: 'absolute', bottom: '80px', right: 0, width: '350px', height: '500px',
                    background: '#fff', borderRadius: '1.5rem', boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #eee',
                    animation: 'fadeInUp 0.3s ease'
                }}>
                    
                    {/* Header */}
                    <div style={{ 
                        padding: '16px 20px', background: 'var(--enba-dark)', color: '#fff', 
                        display: 'flex', alignItems: 'center', gap: '12px' 
                    }}>
                        {activePeerId ? (
                            <>
                                <button onClick={() => setActivePeerId(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>←</button>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{activePeer.name}</div>
                                    <div style={{ fontSize: '10px', opacity: 0.7 }}>{activePeer.role}</div>
                                </div>
                            </>
                        ) : (
                            <div style={{ fontWeight: 800 }}>Mesajlaşma</div>
                        )}
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}><i className="ph ph-x"></i></button>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflowY: 'auto', background: '#f8f9fa' }}>
                        {activePeerId ? (
                            /* Active Chat Feed */
                            <div ref={scrollRef} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {filteredMessages.map(m => {
                                    const isMe = m.from === user.id;
                                    return (
                                        <div key={m.id} style={{ 
                                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                                            maxWidth: '80%',
                                            padding: '8px 12px',
                                            borderRadius: isMe ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                                            background: isMe ? 'var(--enba-dark)' : '#fff',
                                            color: isMe ? '#fff' : 'var(--on-surface)',
                                            fontSize: '13px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        }}>
                                            {m.text}
                                            <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '4px', textAlign: 'right' }}>{formatTime(m.timestamp)}</div>
                                        </div>
                                    );
                                })}
                                {filteredMessages.length === 0 && (
                                    <div style={{ textAlign: 'center', color: '#999', fontSize: '12px', marginTop: '20px' }}>Henüz mesaj yok. İlk mesajı siz yazın!</div>
                                )}
                            </div>
                        ) : (
                            /* User List */
                            <div style={{ padding: '8px' }}>
                                {allUsers.filter(u => u.id !== user.id).map(u => (
                                    <div 
                                        key={u.id} 
                                        onClick={() => setActivePeerId(u.id)}
                                        style={{ 
                                            padding: '12px', borderRadius: '12px', cursor: 'pointer', 
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.background = '#fff'}
                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ 
                                            width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-container-high)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', overflow: 'hidden'
                                        }}>
                                            {u.avatar ? <img src={u.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.name.split(' ').map(n=>n[0]).join('')}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{u.name}</div>
                                            <div style={{ fontSize: '11px', color: '#999' }}>{u.role}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer / Input */}
                    {activePeerId && (
                        <div style={{ padding: '12px', background: '#fff', borderTop: '1px solid #eee' }}>
                            <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    className="form-control"
                                    placeholder="Mesaj yazın..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    style={{ borderRadius: '1rem', fontSize: '13px' }}
                                />
                                <button type="submit" className="btn btn-primary" style={{ padding: '4px 12px', borderRadius: '1rem' }}><i className="ph-fill ph-paper-plane-right"></i></button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

window.EnbaMessenger = EnbaMessenger;

