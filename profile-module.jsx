// ============================================================
//  Enba Recycling — Kullanıcı Profili (Profile Module)
// ============================================================

function ProfileModule({ user, onUpdate }) {
    const [formData, setFormData] = React.useState({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        avatar: user.avatar || ""
    });
    const [status, setStatus] = React.useState({ loading: false, success: false });
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);

    // -- Interactive Crop States --
    const [rawImage, setRawImage] = React.useState(null); // original image object
    const [showCropper, setShowCropper] = React.useState(false);
    const [cropPos, setCropPos] = React.useState({ x: 0, y: 0 });
    const [zoom, setZoom] = React.useState(1);
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsAnalyzing(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setRawImage(img);
                // Başlangıçta yine bir yüz tespiti dene (opsiyonel otomatik hizalama için)
                autoDetectInitialPos(img);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const autoDetectInitialPos = (img) => {
        if (!window.tracking || !window.tracking.ObjectTracker) {
            setCropPos({ x: 0, y: 0 });
            setZoom(1);
            setShowCropper(true);
            return;
        }

        const tracker = new tracking.ObjectTracker('face');
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);

        tracker.on('track', (event) => {
            if (event.data.length > 0) {
                const face = event.data[0];
                const scale = 300 / face.width / 2; // initial best guess zoom
                setZoom(Math.max(0.5, Math.min(3, scale)));
                setCropPos({
                    x: -(face.x + face.width/2) * scale + 150,
                    y: -(face.y + face.height/2) * scale + 150
                });
            } else {
                const initZoom = 300 / Math.min(img.width, img.height);
                setZoom(initZoom);
                setCropPos({ x: 0, y: 0 });
            }
            setIsAnalyzing(false);
            setShowCropper(true);
        });

        tracking.track(tempCanvas, tracker);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - cropPos.x, y: e.clientY - cropPos.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setCropPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    const finalizeCrop = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        // Calculate source rectangle based on current visual state
        // Visual viewport is 300x300. Map to 400x400.
        // pos.x / zoom is original image coordinate
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(0,0,400,400);

        // DrawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
        // Bizim mantığımız: CSS'deki transform transform: translate(x,y) scale(z)
        // Canvas karşılığı:
        const drawScale = zoom * (400 / 300);
        ctx.drawImage(rawImage, 
            0, 0, rawImage.width, rawImage.height, 
            cropPos.x * (400/300), cropPos.y * (400/300), 
            rawImage.width * drawScale, rawImage.height * drawScale
        );

        setFormData(prev => ({ ...prev, avatar: canvas.toDataURL('image/jpeg', 0.85) }));
        setShowCropper(false);
    };

    const handleSave = (e) => {
        e.preventDefault();
        setStatus({ loading: true, success: false });

        setTimeout(() => {
            const allUsers = JSON.parse(localStorage.getItem('enba_users_data') || '[]');
            const updatedUsers = allUsers.map(u => {
                if (u.id === user.id) {
                    return { ...u, ...formData };
                }
                return u;
            });

            localStorage.setItem('enba_users_data', JSON.stringify(updatedUsers));
            
            // Güncel kullanıcı objesini router'a bildir
            if (onUpdate) onUpdate({ ...user, ...formData });

            setStatus({ loading: false, success: true });
            setTimeout(() => setStatus(prev => ({ ...prev, success: false })), 3000);
        }, 800);
    };

    return (
        <div style={{ padding: '48px', maxWidth: '900px', margin: '0 auto', background: 'var(--surface-container-low)', minHeight: '100vh', animation: 'fadeIn 0.5s ease' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '28px', color: 'var(--enba-dark)', margin: 0 }}>Profilim</h1>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '4px' }}>Kişisel bilgilerinizi ve profil fotoğrafınızı yönetin.</p>
                </div>
                <div style={{ background: 'var(--warning-container)', color: 'var(--enba-orange)', padding: '6px 14px', borderRadius: '2rem', fontSize: '11px', fontWeight: 800 }}>KİŞİSEL HESAP</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
                
                {/* Sol Taraf: Avatar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div style={{ 
                        width: '200px', height: '200px', borderRadius: '2rem', background: 'var(--surface-container-lowest)', 
                        border: '4px solid var(--surface-container-lowest)', boxShadow: 'var(--shadow-lg)',
                        overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {formData.avatar ? (
                            <img src={formData.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isAnalyzing ? 0.3 : 1 }} />
                        ) : (
                            <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--enba-dark)', opacity: 0.2 }}>
                                {formData.name.split(' ').map(n=>n[0]).join('')}
                            </div>
                        )}
                        {isAnalyzing && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <div style={{ width: '24px', height: '24px', border: '3px solid var(--enba-orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--enba-orange)' }}>ANALİZ EDİLİYOR...</div>
                            </div>
                        )}
                        <label style={{ 
                            position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', 
                            color: '#fff', textAlign: 'center', padding: '10px', fontSize: '12px', cursor: 'pointer',
                            backdropFilter: 'blur(4px)', display: isAnalyzing ? 'none' : 'block'
                        }}>
                            <i className="ph ph-upload-simple" style={{ marginRight: '6px' }}></i> Fotoğraf Yükle
                            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                        </label>
                    </div>
                </div>

                {/* Sağ Taraf: Form */}
                <div style={{ background: 'var(--surface-container-lowest)', padding: '32px', borderRadius: '2rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--surface-container-high)' }}>
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '12px', fontWeight: 800 }}>AD SOYAD</label>
                                <input className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required onFocus={window.selectOnFocus} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '12px', fontWeight: 800 }}>E-POSTA</label>
                                <input className="form-control" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} onFocus={window.selectOnFocus} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '12px', fontWeight: 800 }}>TELEFON NO</label>
                            <input className="form-control" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+90 5XX XXX XX XX" onFocus={window.selectOnFocus} />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '12px', fontWeight: 800 }}>KISA BİYOGRAFİ</label>
                            <textarea className="form-control" rows="3" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Kendinizden bahsedin..." style={{ borderRadius: '1rem' }} onFocus={window.selectOnFocus} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button type="submit" disabled={status.loading} className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: '2rem', fontWeight: 800 }}>{status.loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}</button>
                        </div>
                        {status.success && (
                            <div style={{ padding: '12px', background: 'var(--success-container)', color: 'var(--success)', borderRadius: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: 800, animation: 'fadeInUp 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid var(--success)' }}>
                                <i className="ph ph-check-circle"></i> Profil bilgileriniz başarıyla güncellendi!
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* INTERACTIVE CROPPER MODAL */}
            {showCropper && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s' }}>
                    <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
                        
                        <div style={{ textAlign: 'center', color: '#fff' }}>
                            <h3 style={{ margin: 0 }}>Fotoğrafı Hizalayın</h3>
                            <p style={{ fontSize: '13px', opacity: 0.7 }}>Sürükleyerek veya kaydırarak ayarlayın.</p>
                        </div>

                        {/* Crop Area */}
                        <div 
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            style={{ 
                                width: '300px', height: '300px', borderRadius: '1.5rem', 
                                border: '4px solid #fff', overflow: 'hidden', position: 'relative',
                                background: '#333', cursor: 'move', userSelect: 'none'
                            }}
                        >
                            <img 
                                src={rawImage?.src || ''} 
                                style={{ 
                                    position: 'absolute',
                                    transformOrigin: '0 0',
                                    transform: `translate(${cropPos.x}px, ${cropPos.y}px) scale(${zoom})`,
                                    pointerEvents: 'none',
                                    display: rawImage ? 'block' : 'none'
                                }} 
                            />
                            {/* Mask overlay for focus */}
                            <div style={{ position:'absolute', inset:0, boxShadow: '0 0 0 999px rgba(0,0,0,0.3)', pointerEvents:'none' }} />
                        </div>

                        {/* Slider Controls */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '12px' }}>
                                <span>Yakınlaştır</span>
                                <span>%{Math.round(zoom * 100)}</span>
                            </div>
                            <input 
                                type="range" min="0.1" max="5" step="0.01" 
                                value={zoom} 
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                style={{ width: '100%', height: '6px', cursor: 'pointer', accentColor: 'var(--enba-orange)' }}
                            />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <button onClick={() => setShowCropper(false)} style={{ flex: 1, padding: '12px', borderRadius: '1rem', border: '1px solid #555', background: 'transparent', color: '#fff', cursor: 'pointer' }}>Vazgeç</button>
                            <button onClick={finalizeCrop} style={{ flex: 2, padding: '12px', borderRadius: '1rem', border: 'none', background: 'var(--enba-orange)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Kırpmayı Tamamla</button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

window.ProfileModule = ProfileModule;

