// ============================================================
//  Enba Recycling — Arşiv Modülü
//  Dosya yönetimi, etiketleme ve arama sistemi.
//  Blob içerikler IndexedDB'de, metadata localStorage'da tutulur.
// ============================================================

// ── IndexedDB yardımcı fonksiyonları (bileşen dışı) ──────────

// Removed IndexedDB helper functions (arsivDbAc, dosyaBlobKaydet, etc.) since we're using Supabase Storage and DB.

// ── Yardımcı saf fonksiyonlar ────────────────────────────────

function dosyaIkonu(mime) {
    if (!mime) return 'ph-file';
    if (mime.includes('pdf'))                                          return 'ph-file-pdf';
    if (mime.startsWith('image/'))                                     return 'ph-image';
    if (mime.includes('spreadsheet') || mime.includes('excel'))       return 'ph-file-xls';
    if (mime.includes('word') || mime.includes('document'))           return 'ph-file-doc';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'ph-file-ppt';
    if (mime.startsWith('text/'))                                      return 'ph-file-text';
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) return 'ph-file-zip';
    return 'ph-file';
}

function boyutFmt(b) {
    if (!b) return '—';
    if (b < 1024)        return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1024 / 1024).toFixed(1) + ' MB';
}

function tarihFmt(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('tr-TR');
}

const KATEGORILER = ['Tümü', 'Sözleşmeler', 'Faturalar', 'Ruhsat & Lisans', 'Teknik Belgeler',
                     'Mali Belgeler', 'Yazışmalar', 'Raporlar', 'Diğer'];

// ── Ana Bileşen ───────────────────────────────────────────────
function ArsivModulu({ user }) {

    // Role-based category access configuration
    const ROLE_CATEGORY_ACCESS = {
        [window.USER_ROLES.ADMIN]: KATEGORILER,
        [window.USER_ROLES.GENEL_MUDUR]: KATEGORILER,
        [window.USER_ROLES.FINANS]: ['Sözleşmeler', 'Faturalar', 'Mali Belgeler', 'Raporlar'],
        [window.USER_ROLES.URETIM]: ['Teknik Belgeler', 'Raporlar'],
        [window.USER_ROLES.LOJISTIK]: ['Diğer', 'Raporlar'],
        [window.USER_ROLES.SAHA]: ['Raporlar', 'Diğer'],
    };

    const allowedCategories = ROLE_CATEGORY_ACCESS[user?.role] || ['Diğer'];
    const isAdmin = user?.role === window.USER_ROLES.ADMIN || user?.role === window.USER_ROLES.GENEL_MUDUR;

    // ── Metadata state ───────────────────────────────────────
    const [dosyalar, setDosyalar] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const loadFiles = async () => {
            if (!window.DataService) return;
            setLoading(true);
            try {
                const data = await window.DataService.getArsivFiles();
                setDosyalar(data);
            } catch (err) {
                console.error("Dosyalar yüklenemedi:", err);
            } finally {
                setLoading(false);
            }
        };
        loadFiles();
    }, []);

    // ── Filtre / arama state ─────────────────────────────────
    const [aramaMetni,     setAramaMetni]     = React.useState('');
    const [etiketFiltre,   setEtiketFiltre]   = React.useState(null);
    const [kategoriFiltre, setKategoriFiltre] = React.useState('Tümü');

    // ── Seçili dosya ve önizleme ─────────────────────────────
    const [seciliId,    setSeciliId]    = React.useState(null);
    const [onizlemeUrl, setOnizlemeUrl] = React.useState(null);
    const [onizlemeYukleniyor, setOnizlemeYukleniyor] = React.useState(false);

    // ── Upload state ─────────────────────────────────────────
    const [yukleniyor, setYukleniyor] = React.useState(false);
    const [dragOver,   setDragOver]   = React.useState(false);
    const dosyaInputRef = React.useRef(null);

    // ── Düzenleme state ──────────────────────────────────────
    const [duzenleId,   setDuzenleId]   = React.useState(null);
    const [duzenleForm, setDuzenleForm] = React.useState({});
    const [yeniEtiket,  setYeniEtiket]  = React.useState('');

    // Blob URL temizleme
    React.useEffect(() => {
        return () => { if (onizlemeUrl) URL.revokeObjectURL(onizlemeUrl); };
    }, [onizlemeUrl]);

    // ── Hesaplanan değerler ──────────────────────────────────
    const seciliDosya = dosyalar.find(d => d.id === seciliId) || null;

    const tumEtiketler = React.useMemo(() => {
        const sayac = {};
        dosyalar.forEach(d => (d.etiketler || []).forEach(e => {
            sayac[e] = (sayac[e] || 0) + 1;
        }));
        return Object.entries(sayac).sort((a, b) => b[1] - a[1]);
    }, [dosyalar]);

    const filtreliDosyalar = React.useMemo(() => {
        const kw = aramaMetni.toLowerCase().trim();
        return dosyalar.filter(d => {
            // Role check: Only show files in allowed categories (Admins see all)
            const isAllowedCategory = isAdmin || allowedCategories.includes(d.kategori);
            if (!isAllowedCategory) return false;

            const katOk  = kategoriFiltre === 'Tümü' || d.kategori === kategoriFiltre;
            const etOk   = !etiketFiltre  || (d.etiketler || []).includes(etiketFiltre);
            if (!kw) return katOk && etOk;
            const adOk   = (d.ad || '').toLowerCase().includes(kw);
            const etKw   = (d.etiketler || []).some(e => e.toLowerCase().includes(kw.replace(/^#/, '')));
            const notOk  = (d.notlar || '').toLowerCase().includes(kw);
            return katOk && etOk && (adOk || etKw || notOk);
        });
    }, [dosyalar, aramaMetni, etiketFiltre, kategoriFiltre, allowedCategories, isAdmin]);

    // ── Dosya yükleme ────────────────────────────────────────
    const dosyalariisle = async (fileList) => {
        if (!window.DataService) return;
        setYukleniyor(true);
        try {
            for (const file of Array.from(fileList)) {
                // 1. Upload to Storage
                const uploadRes = await window.DataService.uploadFile(file, 'archive');
                
                // 2. Save metadata to DB
                await window.DataService.saveArsivFile({
                    ad:              file.name,
                    mime:            file.type,
                    boyut:           file.size,
                    kategori:        'Diğer',
                    etiketler:       [],
                    notlar:          '',
                    storagePath:     uploadRes.path,
                    yuklenmeTarihi:  new Date().toISOString()
                });
            }
            // 3. Refresh list
            const data = await window.DataService.getArsivFiles();
            setDosyalar(data);
        } catch (err) {
            console.error('Dosya yüklenemedi:', err);
            alert("Hata: " + err.message);
        } finally {
            setYukleniyor(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault(); setDragOver(false);
        dosyalariisle(e.dataTransfer.files);
    };
    const handleFileInput = (e) => dosyalariisle(e.target.files);

    // ── Silme ────────────────────────────────────────────────
    const dosyaSil = async (id) => {
        if (!window.DataService) return;
        if (!window.confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;
        setYukleniyor(true);
        try {
            // Note: In a production app, we'd also delete from Storage bucket.
            // For now, removing metadata is sufficient.
            await window.DataService.deleteData('arsiv_files', id);
            setDosyalar(prev => prev.filter(d => d.id !== id));
            if (seciliId === id)    { setSeciliId(null); setOnizlemeUrl(null); }
            if (duzenleId === id)   setDuzenleId(null);
        } catch (err) {
            alert("Silinemedi: " + err.message);
        } finally {
            setYukleniyor(false);
        }
    };

    // ── Düzenleme ────────────────────────────────────────────
    const duzenlemeAc = (d) => {
        setDuzenleId(d.id);
        setDuzenleForm({ ad: d.ad, kategori: d.kategori, etiketler: [...(d.etiketler || [])], notlar: d.notlar || '' });
        setYeniEtiket('');
    };

    const duzenleKaydet = async () => {
        if (!window.DataService) return;
        setYukleniyor(true);
        try {
            await window.DataService.saveArsivFile({
                id: duzenleId,
                ...duzenleForm
            });
            const data = await window.DataService.getArsivFiles();
            setDosyalar(data);
            setDuzenleId(null);
        } catch (err) { alert("Güncellenemedi: " + err.message); }
        finally { setYukleniyor(false); }
    };

    const etiketEkle = (e) => {
        if (e.key !== 'Enter' && e.key !== ',') return;
        e.preventDefault();
        const tag = yeniEtiket.trim().replace(/^#/, '').toLowerCase();
        if (tag && !duzenleForm.etiketler.includes(tag)) {
            setDuzenleForm(p => ({ ...p, etiketler: [...p.etiketler, tag] }));
        }
        setYeniEtiket('');
    };

    const etiketKaldir = (tag) => {
        setDuzenleForm(p => ({ ...p, etiketler: p.etiketler.filter(e => e !== tag) }));
    };

    // ── Önizleme ─────────────────────────────────────────────
    const onizlemeAc = async (d) => {
        if (!window.DataService) return;
        setSeciliId(d.id);
        setOnizlemeYukleniyor(true);
        try {
            if (d.storage_path) {
                const url = await window.DataService.getFileUrl(d.storage_path);
                setOnizlemeUrl(url);
            } else {
                // Migration legacy support
                const db = await arsivDbAc();
                const blob = await new Promise(res => {
                    const tx  = db.transaction('icerikler', 'readonly');
                    const req = tx.objectStore('icerikler').get(d.id);
                    req.onsuccess = () => res(req.result?.blob);
                });
                if (blob) setOnizlemeUrl(URL.createObjectURL(blob));
            }
        } catch (err) { console.error(err); }
        setOnizlemeYukleniyor(false);
    };

    const dosyaIndir = async (d) => {
        if (!window.DataService) return;
        try {
            if (d.storage_path) {
                const url = await window.DataService.getFileUrl(d.storage_path);
                window.open(url, '_blank');
            } else {
                // Legacy IndxedDB download
                const db = await arsivDbAc();
                const blob = await new Promise(res => {
                    const tx  = db.transaction('icerikler', 'readonly');
                    const req = tx.objectStore('icerikler').get(d.id);
                    req.onsuccess = () => res(req.result?.blob);
                });
                if (blob) {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = d.ad;
                    a.click();
                    URL.revokeObjectURL(a.href);
                }
            }
        } catch (err) { console.error(err); }
    };

    // ── Stiller ──────────────────────────────────────────────
    const kart = {
        background:   'var(--surface-container-lowest)',
        borderRadius: '1.2rem',
        border:       '1px solid var(--surface-container-highest)',
        boxShadow:    'var(--shadow-sm)',
    };

    const inp = {
        padding:      '10px 14px',
        borderRadius: '0.75rem',
        border:       '1px solid var(--surface-container-highest)',
        outline:      'none',
        fontSize:     '14px',
        background:   'var(--surface-container-low)',
        color:        'var(--on-surface)',
        width:        '100%',
        boxSizing:    'border-box',
    };

    const lbl = {
        fontSize:      '11px', fontWeight: 600,
        color:         'var(--on-surface-variant)',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        display:       'block', marginBottom: '6px',
    };

    const btnNavy = {
        padding: '9px 20px', background: 'var(--enba-dark)', color: '#fff',
        border: 'none', borderRadius: '0.75rem', fontWeight: 700,
        fontSize: '13px', cursor: 'pointer',
    };

    const btnGreen = { ...btnNavy, background: 'var(--enba-orange)' };
    const btnGray  = { ...btnNavy, background: 'var(--surface-container-high)', color: 'var(--on-surface)' };

    // ── RENDER ───────────────────────────────────────────────
    return (
        <div style={{ padding: '32px 40px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>

            {/* Başlık */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '26px', color: 'var(--enba-dark)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="ph ph-archive"></i> Arşiv
                    </h1>
                    <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '14px' }}>
                        Şirket belgelerini yükleyin, isimlendirin ve etiketleyerek kolayca erişin.
                    </p>
                </div>
                <button
                    onClick={() => dosyaInputRef.current?.click()}
                    style={{ ...btnGreen, fontSize: '14px', padding: '11px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    disabled={yukleniyor}
                >
                    {yukleniyor ? <><i className="ph ph-spinner"></i> Yükleniyor…</> : <><i className="ph ph-upload-simple"></i> Dosya Yükle</>}
                </button>
                <input ref={dosyaInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileInput} />
            </div>

            {/* Arama + Kategori */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 280px', position: 'relative' }}>
                    <i className="ph ph-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', fontSize: '16px' }}></i>
                    <input
                        type="text"
                        placeholder="Dosya adı, etiket (#tedarikçi) veya not ara…"
                        value={aramaMetni}
                        onChange={e => setAramaMetni(e.target.value)}
                        style={{ ...inp, paddingLeft: '40px' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {KATEGORILER.filter(k => isAdmin || allowedCategories.includes(k)).map(k => (
                        <button key={k} onClick={() => setKategoriFiltre(k)} style={{
                            padding: '8px 14px', borderRadius: '2rem', border: 'none',
                            background: kategoriFiltre === k ? 'var(--enba-dark)' : 'var(--surface-container-high)',
                            color:      kategoriFiltre === k ? '#fff' : 'var(--on-surface-variant)',
                            fontWeight: 600, fontSize: '12px', cursor: 'pointer',
                        }}>{k}</button>
                    ))}
                </div>
            </div>

            {/* Etiket bulutu */}
            {tumEtiketler.length > 0 && (
                <div style={{ ...kart, padding: '14px 18px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>Etiketler:</span>
                        {etiketFiltre && (
                            <button onClick={() => setEtiketFiltre(null)} style={{
                                padding: '4px 12px', borderRadius: '1rem', border: 'none',
                                background: '#ffebee', color: '#c62828', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                            }}>✕ Filtreyi kaldır</button>
                        )}
                        {tumEtiketler.map(([etiket, sayi]) => (
                            <button key={etiket} onClick={() => setEtiketFiltre(etiketFiltre === etiket ? null : etiket)} style={{
                                padding: '4px 12px', borderRadius: '1rem', border: '1px solid',
                                borderColor: etiketFiltre === etiket ? 'var(--enba-dark)' : 'var(--surface-container-highest)',
                                background:  etiketFiltre === etiket ? 'var(--enba-dark)' : 'transparent',
                                color:       etiketFiltre === etiket ? '#fff' : 'var(--on-surface-variant)',
                                fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                            }}>
                                #{etiket}
                                <span style={{ background: etiketFiltre === etiket ? 'rgba(255,255,255,0.25)' : 'var(--surface-container-high)', borderRadius: '1rem', padding: '0 6px', fontSize: '11px' }}>{sayi}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Drop Zone (yalnızca boşsa veya drag over'da) */}
            {(dragOver || dosyalar.length === 0) && (
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => dosyaInputRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragOver ? 'var(--enba-orange)' : 'var(--surface-container-highest)'}`,
                        borderRadius: '1.2rem', padding: '48px', textAlign: 'center',
                        background: dragOver ? 'rgba(39,174,96,0.05)' : 'var(--surface-container-lowest)',
                        cursor: 'pointer', marginBottom: '24px', transition: 'all 0.2s',
                    }}
                >
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡ </div>
                    <div style={{ fontWeight: 700, color: 'var(--enba-dark)', marginBottom: '6px', fontFamily: "'Manrope', sans-serif" }}>
                        {dragOver ? 'Bırakın, yüklensin' : 'Dosyaları buraya sürükleyin'}
                    </div>
                    <div style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>
                        veya tıklayarak seçin — PDF, Word, Excel, görsel ve daha fazlası
                    </div>
                </div>
            )}

            {/* Yükle drop overlay (dosya varken de drag destekle) */}
            {dosyalar.length > 0 && !dragOver && (
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    style={{ position: 'fixed', inset: 0, zIndex: -1 }}
                />
            )}
            {dragOver && dosyalar.length > 0 && (
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 500,
                        background: 'rgba(39,174,96,0.12)', border: '3px dashed var(--enba-orange)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <div style={{ background: '#fff', padding: '32px 48px', borderRadius: '1.5rem', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
                        <div style={{ fontSize: '48px' }}>⚡ </div>
                        <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '20px', color: 'var(--enba-dark)', marginTop: '12px' }}>Bırakın, yüklensin</div>
                    </div>
                </div>
            )}

            {/* Özet sayım */}
            {dosyalar.length > 0 && (
                <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginBottom: '14px' }}>
                    <strong style={{ color: 'var(--on-surface)' }}>{filtreliDosyalar.length}</strong> / {dosyalar.length} dosya gösteriliyor
                    {(aramaMetni || etiketFiltre || kategoriFiltre !== 'Tümü') && (
                        <button onClick={() => { setAramaMetni(''); setEtiketFiltre(null); setKategoriFiltre('Tümü'); }}
                            style={{ marginLeft: '10px', background: 'none', border: 'none', color: 'var(--enba-orange)', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                            Filtreyi temizle
                        </button>
                    )}
                </div>
            )}

            {/* Ana içerik — liste + detay panel yan yana */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

                {/* Dosya listesi */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {filtreliDosyalar.length === 0 && dosyalar.length > 0 && (
                        <div style={{ ...kart, padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                            Arama kriterlerine uyan dosya bulunamadı.
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filtreliDosyalar.map(d => {
                            const secili  = seciliId === d.id;
                            const duzle   = duzenleId === d.id;
                            return (
                                <div key={d.id} style={{
                                    ...kart,
                                    padding: '0',
                                    outline: secili ? '2px solid var(--enba-orange)' : 'none',
                                    transition: 'outline 0.15s',
                                }}>
                                    {/* Kart üst satır */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px' }}>
                                        <i className={`ph ${dosyaIkonu(d.mime)}`} style={{ fontSize: '28px', flexShrink: 0, color: 'var(--enba-dark)' }}></i>

                                        {/* Ad + meta */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, color: 'var(--enba-dark)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {d.ad}
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '12px', color: 'var(--on-surface-variant)', flexWrap: 'wrap' }}>
                                                <span>{tarihFmt(d.yuklenmeTarihi)}</span>
                                                <span>{boyutFmt(d.boyut)}</span>
                                                {d.kategori && d.kategori !== 'Diğer' && (
                                                    <span style={{ background: 'var(--surface-container-high)', padding: '1px 8px', borderRadius: '1rem' }}>{d.kategori}</span>
                                                )}
                                            </div>
                                            {/* Etiketler */}
                                            {(d.etiketler || []).length > 0 && (
                                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' }}>
                                                    {d.etiketler.map(e => (
                                                        <button key={e} onClick={() => setEtiketFiltre(etiketFiltre === e ? null : e)} style={{
                                                            padding: '2px 9px', borderRadius: '1rem',
                                                            border: '1px solid var(--surface-container-highest)',
                                                            background: etiketFiltre === e ? 'var(--enba-dark)' : 'transparent',
                                                            color:      etiketFiltre === e ? '#fff' : 'var(--on-surface-variant)',
                                                            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                                        }}>#{e}</button>
                                                    ))}
                                                </div>
                                            )}
                                            {d.notlar && (
                                                <div style={{ marginTop: '5px', fontSize: '12px', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
                                                    {d.notlar.length > 100 ? d.notlar.slice(0, 100) + '…' : d.notlar}
                                                </div>
                                            )}
                                        </div>

                                        {/* Aksiyon butonları */}
                                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                            <button onClick={() => onizlemeAc(d.id)} title="Önizle / Seç"
                                                style={{ background: secili ? 'var(--enba-orange)' : 'var(--surface-container-high)', border: 'none', borderRadius: '0.6rem', padding: '7px 12px', cursor: 'pointer', fontSize: '14px', color: secili ? '#fff' : 'inherit' }}>
                                                {secili ? '✓' : '⚡ ️'}
                                            </button>
                                            <button onClick={() => duzenlemeAc(d)} title="Düzenle"
                                                style={{ background: 'var(--surface-container-high)', border: 'none', borderRadius: '0.6rem', padding: '7px 12px', cursor: 'pointer', fontSize: '14px' }}>
                                                ✏️
                                            </button>
                                            <button onClick={() => dosyaIndir(d)} title="İndir"
                                                style={{ background: 'var(--surface-container-high)', border: 'none', borderRadius: '0.6rem', padding: '7px 12px', cursor: 'pointer', fontSize: '14px' }}>
                                                ⬇️
                                            </button>
                                            <button onClick={() => dosyaSil(d.id)} title="Sil"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '7px 8px', color: '#c62828' }}>
                                                ⚡ ️
                                            </button>
                                        </div>
                                    </div>

                                    {/* Satır içi düzenleme formu */}
                                    {duzle && (
                                        <div style={{ borderTop: '1px solid var(--surface-container-highest)', padding: '16px 18px', background: 'var(--surface-container-low)', borderRadius: '0 0 1.2rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                <div style={{ flex: '2 1 220px' }}>
                                                    <label style={lbl}>Dosya Adı</label>
                                                    <input style={inp} value={duzenleForm.ad}
                                                        onChange={e => setDuzenleForm(p => ({ ...p, ad: e.target.value }))} />
                                                </div>
                                                <div style={{ flex: '1 1 160px' }}>
                                                    <label style={lbl}>Kategori</label>
                                                    <select style={inp} value={duzenleForm.kategori}
                                                        onChange={e => setDuzenleForm(p => ({ ...p, kategori: e.target.value }))}>
                                                        {KATEGORILER.filter(k => k !== 'Tümü').map(k => <option key={k} value={k}>{k}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label style={lbl}>Etiketler — Enter veya virgül ile ekle</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', border: '1px solid var(--surface-container-highest)', borderRadius: '0.75rem', background: 'var(--surface-container-lowest)', minHeight: '44px', alignItems: 'center' }}>
                                                    {duzenleForm.etiketler.map(e => (
                                                        <span key={e} style={{ background: 'var(--enba-dark)', color: '#fff', borderRadius: '1rem', padding: '3px 10px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            #{e}
                                                            <button onClick={() => etiketKaldir(e)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px', padding: '0', lineHeight: 1 }}>×</button>
                                                        </span>
                                                    ))}
                                                    <input
                                                        placeholder="etiket ekle…"
                                                        value={yeniEtiket}
                                                        onChange={e => setYeniEtiket(e.target.value)}
                                                        onKeyDown={etiketEkle}
                                                        onBlur={() => {
                                                            const tag = yeniEtiket.trim().replace(/^#/, '').toLowerCase();
                                                            if (tag && !duzenleForm.etiketler.includes(tag)) {
                                                                setDuzenleForm(p => ({ ...p, etiketler: [...p.etiketler, tag] }));
                                                            }
                                                            setYeniEtiket('');
                                                        }}
                                                        style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', flex: 1, minWidth: '100px', color: 'var(--on-surface)' }}
                                                    />
                                                </div>
                                                {/* Mevcut etiketlerden öneri */}
                                                {tumEtiketler.length > 0 && (
                                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                                                        {tumEtiketler.filter(([e]) => !duzenleForm.etiketler.includes(e)).slice(0, 10).map(([e]) => (
                                                            <button key={e} onClick={() => setDuzenleForm(p => ({ ...p, etiketler: [...p.etiketler, e] }))}
                                                                style={{ padding: '2px 9px', borderRadius: '1rem', border: '1px solid var(--surface-container-highest)', background: 'transparent', color: 'var(--on-surface-variant)', fontSize: '11px', cursor: 'pointer' }}>
                                                                +#{e}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label style={lbl}>Notlar</label>
                                                <textarea style={{ ...inp, resize: 'vertical', minHeight: '60px' }} value={duzenleForm.notlar}
                                                    onChange={e => setDuzenleForm(p => ({ ...p, notlar: e.target.value }))} rows={2} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={duzenleKaydet} style={btnNavy}>⚡  Kaydet</button>
                                                <button onClick={() => setDuzenleId(null)} style={btnGray}>İptal</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Önizleme paneli */}
                {seciliDosya && (
                    <div style={{ ...kart, width: '420px', flexShrink: 0, position: 'sticky', top: '80px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: 'calc(100vh - 100px)', overflow: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Önizleme</div>
                                <div style={{ fontWeight: 700, color: 'var(--enba-dark)', fontSize: '14px', wordBreak: 'break-all' }}>{seciliDosya.ad}</div>
                            </div>
                            <button onClick={() => { setSeciliId(null); URL.revokeObjectURL(onizlemeUrl); setOnizlemeUrl(null); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--on-surface-variant)', flexShrink: 0 }}>✕</button>
                        </div>

                        {/* Meta bilgiler */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                            {[
                                ['Boyut',    boyutFmt(seciliDosya.boyut)],
                                ['Tarih',    tarihFmt(seciliDosya.yuklenmeTarihi)],
                                ['Tür',      seciliDosya.mime || '—'],
                                ['Kategori', seciliDosya.kategori || '—'],
                            ].map(([k, v]) => (
                                <div key={k} style={{ background: 'var(--surface-container-low)', borderRadius: '0.6rem', padding: '8px 10px' }}>
                                    <div style={{ color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.4px' }}>{k}</div>
                                    <div style={{ color: 'var(--on-surface)', marginTop: '2px', wordBreak: 'break-all' }}>{v}</div>
                                </div>
                            ))}
                        </div>

                        {/* Etiketler */}
                        {(seciliDosya.etiketler || []).length > 0 && (
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {seciliDosya.etiketler.map(e => (
                                    <span key={e} style={{ background: 'var(--enba-dark)', color: '#fff', borderRadius: '1rem', padding: '3px 10px', fontSize: '12px', fontWeight: 600 }}>#{e}</span>
                                ))}
                            </div>
                        )}

                        {/* Notlar */}
                        {seciliDosya.notlar && (
                            <div style={{ background: 'var(--surface-container-low)', borderRadius: '0.75rem', padding: '10px 12px', fontSize: '13px', color: 'var(--on-surface)', fontStyle: 'italic' }}>
                                {seciliDosya.notlar}
                            </div>
                        )}

                        {/* Dosya önizlemesi */}
                        <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--surface-container-highest)', background: 'var(--surface-container-low)', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {onizlemeYukleniyor ? (
                                <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '40px' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                                    <div>Yükleniyor…</div>
                                </div>
                            ) : onizlemeUrl ? (
                                seciliDosya.mime?.startsWith('image/') ? (
                                    <img src={onizlemeUrl} alt={seciliDosya.ad} style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain', display: 'block' }} />
                                ) : seciliDosya.mime?.includes('pdf') ? (
                                    <iframe src={onizlemeUrl} title={seciliDosya.ad} style={{ width: '100%', height: '420px', border: 'none' }} />
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '32px' }}>
                                        <i className={`ph ${dosyaIkonu(seciliDosya.mime)}`} style={{ fontSize: '48px', marginBottom: '8px', color: 'var(--on-surface-variant)' }}></i>
                                        <div style={{ fontSize: '13px' }}>Bu dosya türü tarayıcıda görüntülenemiyor.</div>
                                    </div>
                                )
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '32px' }}>
                                    <i className={`ph ${dosyaIkonu(seciliDosya.mime)}`} style={{ fontSize: '48px', marginBottom: '8px', color: 'var(--on-surface-variant)' }}></i>
                                    <div style={{ fontSize: '13px' }}>Dosya içeriği yüklenemedi.</div>
                                </div>
                            )}
                        </div>

                        {/* İndir butonu */}
                        <button onClick={() => dosyaIndir(seciliDosya)} style={{ ...btnNavy, width: '100%', textAlign: 'center' }}>
                            ⬇️ İndir — {seciliDosya.ad}
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
}

window.ArsivModulu = ArsivModulu;

