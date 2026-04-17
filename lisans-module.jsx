const { useState, useEffect, useMemo, useRef } = React;

// ── Shared Storage Functions (Archive Integration) ──────────
// Re-implementing archive helpers since we don't have modules
function lisansArsivDbAc() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('enba_arsiv', 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('icerikler'))
                db.createObjectStore('icerikler', { keyPath: 'id' });
        };
        req.onsuccess  = (e) => resolve(e.target.result);
        req.onerror    = (e) => reject(e.target.error);
    });
}

async function lisansBlobKaydet(id, blob) {
    const db = await lisansArsivDbAc();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('icerikler', 'readwrite');
        tx.objectStore('icerikler').put({ id, blob });
        tx.oncomplete = resolve;
        tx.onerror    = (e) => reject(e.target.error);
    });
}

async function lisansBlobGetir(id) {
    const db = await lisansArsivDbAc();
    return new Promise((resolve, reject) => {
        const tx  = db.transaction('icerikler', 'readonly');
        const req = tx.objectStore('icerikler').get(id);
        req.onsuccess = () => resolve(req.result?.blob || null);
        req.onerror   = () => reject(req.error);
    });
}

// ── Main Component ──────────────────────────────────────────

function LisansRuhsatModulu() {
    const [kayitlar, setKayitlar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [migrationStatus, setMigrationStatus] = useState(null);

    // Initial load & Migration
    useEffect(() => {
        const init = async () => {
            if (!window.DataService) return;
            setLoading(true);

            // 1. Check if migration needed
            const hasLocalArsiv = localStorage.getItem('enba_arsiv_meta');
            const hasLocalLisans = localStorage.getItem('enba_lisans_kayitlari');
            
            if (hasLocalArsiv || hasLocalLisans) {
                setMigrationStatus("Mevcut verileriniz buluta taşınıyor... Lütfen bekleyin.");
                try {
                    await window.DataService.migrateLisansArsiv(msg => setMigrationStatus(msg));
                } catch (e) {
                    console.error("Migrasyon hatası:", e);
                }
                setMigrationStatus(null);
            }

            // 2. Load from DB
            try {
                const data = await window.DataService.getPermits();
                setKayitlar(data);
            } catch (e) {
                console.error("Lisanslar yüklenemedi:", e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // Form States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formAd, setFormAd] = useState("");
    const [formKategori, setFormKategori] = useState("Ruhsat");
    const [formKurum, setFormKurum] = useState("");
    const [formAlinis, setFormAlinis] = useState("");
    const [formYenileme, setFormYenileme] = useState("");
    const [formSuresiz, setFormSuresiz] = useState(false);
    const [formMaliyet, setFormMaliyet] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [attachedFileId, setAttachedFileId] = useState(null);

    // Preview State
    const [previewId, setPreviewId] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const fileInputRef = useRef(null);

    // Removed localStorage auto-save useEffect

    const categories = ["Ruhsat", "Lisans", "Sertifika", "Sigorta", "Sözleşme", "Diğer"];

    const calculateStatus = (yenilemeDate, isSuresiz) => {
        if (isSuresiz) return { label: "Süresiz Aktif", color: "var(--success)", icon: "ph ph-infinity" };
        if (!yenilemeDate) return { label: "Bilinmiyor", color: "var(--on-surface-variant)", icon: "ph ph-question" };
        const today = new Date();
        const renewal = new Date(yenilemeDate);
        const diffDays = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: "Süresi Dolmuş", color: "var(--error)", icon: "ph ph-warning-circle" };
        if (diffDays <= 30) return { label: "Yaklaşıyor", color: "var(--enba-orange)", icon: "ph ph-clock-countdown" };
        return { label: "Aktif", color: "var(--success)", icon: "ph ph-check-circle" };
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const kaydet = async (e) => {
        e.preventDefault();
        if (!window.DataService) return;
        setLoading(true);
        
        try {
            let currentFileId = attachedFileId;
            let currentFileName = selectedFile ? selectedFile.name : (kayitlar.find(k => k.id === editingId)?.fileName || null);

            // 1. If new file selected, upload to Storage and create Archive entry
            if (selectedFile) {
                const uploadRes = await window.DataService.uploadFile(selectedFile, 'licences');
                const arsivEntry = await window.DataService.saveArsivFile({
                    ad: selectedFile.name,
                    mime: selectedFile.type,
                    boyut: selectedFile.size,
                    kategori: 'Ruhsat & Lisans',
                    etiketler: ['ruhsat-lisans-modulu'],
                    notlar: `${formAd} belgesi örneği`,
                    storagePath: uploadRes.path
                });
                currentFileId = arsivEntry.id;
            }

            // 2. Save Permit record
            const permitRecord = {
                id: editingId, // if null, upsert handles new
                ad: formAd,
                kategori: formKategori,
                kurum: formKurum,
                alinisTarihi: formAlinis,
                yenilemeTarihi: formSuresiz ? null : formYenileme,
                isSuresiz: formSuresiz,
                maliyet: Number(formMaliyet) || 0,
                fileId: currentFileId,
                fileName: currentFileName
            };

            await window.DataService.savePermit(permitRecord);
            
            // 3. Refresh list
            const updatedData = await window.DataService.getPermits();
            setKayitlar(updatedData);
            resetForm();
        } catch (err) {
            console.error("Kaydedilemedi:", err);
            alert("Hata: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setFormAd("");
        setFormKategori("Ruhsat");
        setFormKurum("");
        setFormAlinis("");
        setFormYenileme("");
        setFormSuresiz(false);
        setFormMaliyet("");
        setSelectedFile(null);
        setAttachedFileId(null);
    };

    const duzenle = (k) => {
        setEditingId(k.id);
        setFormAd(k.ad);
        setFormKategori(k.kategori);
        setFormKurum(k.kurum);
        setFormAlinis(k.alinisTarihi || "");
        setFormYenileme(k.yenilemeTarihi || "");
        setFormSuresiz(!!k.isSuresiz);
        setFormMaliyet(k.maliyet);
        setAttachedFileId(k.fileId);
        setIsFormOpen(true);
    };

    const sil = async (id) => {
        if (!window.DataService) return;
        if (confirm("Bu ruhsat kaydını silmek istediğinize emin misiniz?")) {
            setLoading(true);
            try {
                await window.DataService.deleteData('permit_records', id);
                setKayitlar(kayitlar.filter(k => k.id !== id));
            } catch (e) {
                alert("Silinemedi: " + e.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const acOnizleme = async (k) => {
        if (!k.fileId || !window.DataService) return;
        setLoading(true);
        try {
            setPreviewId(k.id);
            setPreviewData(k);
            
            // 1. Get file metadata to find storagePath
            const files = await window.DataService.getArsivFiles();
            const fileMeta = files.find(f => f.id === k.fileId);
            
            if (fileMeta && fileMeta.storage_path) {
                const url = await window.DataService.getFileUrl(fileMeta.storage_path);
                setPreviewUrl(url);
            } else {
                // Check if it's still in IndexedDB (legacy support during migration or failed migration)
                const blob = await lisansBlobGetir(k.fileId);
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    setPreviewUrl(url);
                } else {
                    alert("Belge dosyası bulunamadı!");
                }
            }
        } catch (err) {
            console.error("Önizleme hatası:", err);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const totalCost = kayitlar.reduce((sum, k) => sum + (k.maliyet || 0), 0);
        const expiringCount = kayitlar.filter(k => {
            const status = calculateStatus(k.yenilemeTarihi);
            return status.label === "Yaklaşıyor";
        }).length;
        const expiredCount = kayitlar.filter(k => {
            if (k.isSuresiz) return false;
            const status = calculateStatus(k.yenilemeTarihi, k.isSuresiz);
            return status.label === "Süresi Dolmuş";
        }).length;

        return { totalCost, expiringCount, expiredCount, total: kayitlar.length };
    }, [kayitlar]);

    // Cleanup preview URL
    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    return (
        <div className="page-container" style={{maxWidth: '1200px', margin: '0 auto', padding: '32px 20px', fontFamily: "'Inter', sans-serif"}}>
            
            {/* Header Area */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
                <div>
                    <h1 style={{fontFamily: "'Manrope', sans-serif", fontSize: '28px', color: 'var(--enba-dark)', margin: '0 0 8px 0', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <i className="ph-fill ph-certificate" style={{ color: 'var(--enba-orange)' }}></i> Ruhsat & Lisans Takibi
                    </h1>
                    <p style={{color: 'var(--on-surface-variant)', margin: 0, fontSize: '15px'}}>
                        {migrationStatus ? migrationStatus : "Resmi belgeler, sertifikalar ve yenileme tarihlerini arşiv entegrasyonu ile takip edin."}
                    </p>
                </div>
                <button onClick={() => setIsFormOpen(true)} className="btn btn-primary" style={{
                    padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <i className="ph ph-file-plus"></i> Yeni Belge Ekle
                </button>
            </div>

            {/* Stats Dashboard */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="enba-card" style={{ padding: '24px' }}>
                    <i className="ph ph-files" style={{fontSize: '32px', color: 'var(--enba-orange)', marginBottom: '12px'}}></i>
                    <div style={statValueStyle}>{stats.total}</div>
                    <div style={statLabelStyle}>Toplam Belge</div>
                </div>
                <div className="enba-card" style={{ padding: '24px' }}>
                    <i className="ph ph-coins" style={{fontSize: '32px', color: 'var(--enba-dark)', marginBottom: '12px'}}></i>
                    <div style={statValueStyle}>{stats.totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} ₺</div>
                    <div style={statLabelStyle}>Toplam Gider</div>
                </div>
                <div className="enba-card" style={{ padding: '24px', background: stats.expiringCount > 0 ? 'var(--warning-container)' : 'var(--surface-container-lowest)', border: stats.expiringCount > 0 ? '1px solid var(--enba-orange)' : '1px solid var(--surface-container-highest)' }}>
                    <i className="ph ph-warning-circle" style={{fontSize: '32px', color: 'var(--enba-orange)', marginBottom: '12px'}}></i>
                    <div style={{...statValueStyle, color: 'var(--enba-orange)'}}>{stats.expiringCount}</div>
                    <div style={statLabelStyle}>Yaklaşan Yenileme</div>
                </div>
                <div className="enba-card" style={{ padding: '24px', background: stats.expiredCount > 0 ? 'var(--error-container)' : 'var(--surface-container-lowest)', border: stats.expiredCount > 0 ? '1px solid var(--error)' : '1px solid var(--surface-container-highest)' }}>
                    <i className="ph ph-x-circle" style={{fontSize: '32px', color: 'var(--error)', marginBottom: '12px'}}></i>
                    <div style={{...statValueStyle, color: 'var(--error)'}}>{stats.expiredCount}</div>
                    <div style={statLabelStyle}>Süresi Dolanlar</div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{display: 'flex', gap: '24px', flexWrap: 'wrap'}}>
                
                {/* List Table */}
                <div style={{flex: '1 1 700px', background: '#fff', borderRadius: '16px', border: '1px solid var(--surface-container-highest)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden'}}>
                    <div style={{padding: '20px 24px', borderBottom: '1px solid var(--surface-container-high)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <h3 style={{margin: 0, fontSize: '16px', color: 'var(--enba-dark)'}}>Belge Listesi</h3>
                    </div>
                    
                    {kayitlar.length === 0 ? (
                        <div style={{padding: '60px', textAlign: 'center', color: 'var(--on-surface-variant)'}}>
                            <div style={{fontSize: '64px', marginBottom: '24px', color: 'var(--surface-container-highest)'}}><i className="ph ph-file-dashed"></i></div>
                            <div style={{ fontSize: '16px' }}>Henüz bir belge eklenmemiş. "Yeni Belge Ekle" butonu ile başlayın.</div>
                        </div>
                    ) : (
                        <div style={{overflowX: 'auto'}}>
                            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                                <thead>
                                    <tr style={{background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px'}}>
                                        <th style={{padding: '16px 24px'}}>BELGE ADI / KURUM</th>
                                        <th style={{padding: '16px 12px'}}>DURUM</th>
                                        <th style={{padding: '16px 12px'}}>YENİLEME</th>
                                        <th style={{padding: '16px 12px', textAlign: 'right'}}>MALİYET</th>
                                        <th style={{padding: '16px 24px', textAlign: 'right'}}>İŞLEMLER</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kayitlar.map(k => {
                                        const status = calculateStatus(k.yenilemeTarihi, k.isSuresiz);
                                        return (
                                            <tr key={k.id} style={{borderBottom: '1px solid var(--surface-container-high)', transition: '0.1s'}} className="hover-row">
                                                <td style={{padding: '16px 24px'}}>
                                                    <div style={{fontWeight: 700, color: 'var(--enba-dark)', fontSize: '14px'}}>{k.ad}</div>
                                                    <div style={{fontSize: '12px', color: 'var(--on-surface-variant)'}}>{k.kurum} • {k.kategori}</div>
                                                </td>
                                                <td style={{padding: '16px 12px'}}>
                                                    <span style={{
                                                        padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 800,
                                                        background: status.color + '15', color: status.color, border: `1px solid ${status.color}30`,
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                                                    }}>
                                                        <i className={status.icon}></i> {status.label}
                                                    </span>
                                                </td>
                                                <td style={{padding: '16px 12px'}}>
                                                    <div style={{fontSize: '13px', fontWeight: 600, color: status.label === 'Aktif' || k.isSuresiz ? '#2C3E50' : status.color}}>
                                                        {k.isSuresiz ? '∞ Süresiz' : (k.yenilemeTarihi ? new Date(k.yenilemeTarihi).toLocaleDateString('tr-TR') : '—')}
                                                    </div>
                                                </td>
                                                <td style={{padding: '16px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--enba-dark)'}}>
                                                    {k.maliyet ? k.maliyet.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + ' ₺' : '0.0 ₺'}
                                                </td>
                                                <td style={{padding: '16px 24px', textAlign: 'right'}}>
                                                    <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                                                        {k.fileId && (
                                                            <button onClick={() => acOnizleme(k)} className="btn-icon" title="Dosya Önizle"><i className="ph ph-eye"></i></button>
                                                        )}
                                                        <button onClick={() => duzenle(k)} className="btn-icon" title="Düzenle"><i className="ph ph-pencil-simple"></i></button>
                                                        <button onClick={() => sil(k.id)} className="btn-icon" style={{ background: 'var(--enba-danger)', color: '#fff' }} title="Sil"><i className="ph ph-trash"></i></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                            <h3 style={{margin: 0, fontSize: '18px', color: 'var(--enba-dark)'}}>{editingId ? <><i className="ph ph-pencil-simple"></i> Belge Düzenle</> : <><i className="ph ph-file-plus"></i> Yeni Belge Ekle</>}</h3>
                            <button onClick={resetForm} style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#95a5a6'}}>×</button>
                        </div>

                        <form onSubmit={kaydet} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                                <div>
                                    <label style={labelStyle}>BELGE ADI</label>
                                    <input type="text" value={formAd} onChange={e => setFormAd(e.target.value)} required placeholder="Örn: Fabrika Çalışma Ruhsatı" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>KATEGORİ</label>
                                    <select value={formKategori} onChange={e => setFormKategori(e.target.value)} style={inputStyle}>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>DÜZENLEYEN KURUM / MAKHAM</label>
                                <input type="text" value={formKurum} onChange={e => setFormKurum(e.target.value)} required placeholder="Örn: Sanayi ve Teknoloji Bakanlığı" style={inputStyle} />
                            </div>

                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px'}}>
                                <div>
                                    <label style={labelStyle}>ALINIŞ TARİHİ</label>
                                    <input type="date" value={formAlinis} onChange={e => setFormAlinis(e.target.value)} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>YENİLEME TARİHİ</label>
                                    <input type="date" value={formYenileme} onChange={e => setFormYenileme(e.target.value)} required={!formSuresiz} disabled={formSuresiz} style={{...inputStyle, opacity: formSuresiz ? 0.5 : 1}} />
                                    <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px'}}>
                                        <input type="checkbox" id="chkSuresiz" checked={formSuresiz} onChange={e => setFormSuresiz(e.target.checked)} style={{width: '14px', height: '14px', cursor: 'pointer'}} />
                                        <label htmlFor="chkSuresiz" style={{fontSize: '12px', color: 'var(--enba-dark)', cursor: 'pointer', fontWeight: 600}}>Süresiz Geçerli</label>
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>MALİYET (₺)</label>
                                    <input type="number" value={formMaliyet} onChange={e => setFormMaliyet(e.target.value)} placeholder="0" style={inputStyle} onFocus={window.selectOnFocus} />
                                </div>
                            </div>

                            <div style={{padding: '16px', background: 'var(--surface-container-low)', borderRadius: '12px', border: '1px dashed var(--surface-container-highest)'}}>
                                <label style={labelStyle}>DOSYA ÖRNEĞİ (ARŞİV'E KAYDEDİLİR)</label>
                                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px'}}>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" style={{
                                        padding: '8px 16px', borderRadius: '8px', 
                                        fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
                                    }}>
                                        <i className="ph ph-upload-simple"></i> Dosya Seç
                                    </button>
                                    <span style={{fontSize: '12px', color: 'var(--on-surface-variant)'}}>
                                        {selectedFile ? selectedFile.name : (attachedFileId ? "Mevcut dosya korunuyor" : "Dosya seçilmedi")}
                                    </span>
                                </div>
                            </div>

                            <div style={{display: 'flex', gap: '12px', marginTop: '10px'}}>
                                <button type="submit" className="btn btn-primary" style={{
                                    flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 800, fontSize: '16px'
                                }}>
                                    {editingId ? "Değişiklikleri Kaydet" : "Belgeyi Kaydet"}
                                </button>
                                <button type="button" onClick={resetForm} className="btn btn-secondary" style={{
                                    padding: '14px 24px', borderRadius: '12px', fontWeight: 800, fontSize: '16px'
                                }}>
                                    İptal
                                </button>
                            </div>orderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: 'pointer'
                                }}>
                                    İptal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewUrl && (
                <div style={modalOverlayStyle} onClick={() => setPreviewUrl(null)}>
                    <div style={{...modalContentStyle, maxWidth: '900px', height: '85vh', padding: '0', overflow: 'hidden'}} onClick={e => e.stopPropagation()}>
                        <div style={{padding: '16px 24px', borderBottom: '1px solid var(--surface-container-high)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <h3 style={{margin: 0, fontSize: '16px', color: 'var(--enba-dark)'}}>{previewData?.ad} - Belge Önizleme</h3>
                            <button onClick={() => setPreviewUrl(null)} style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#95a5a6'}}>×</button>
                        </div>
                        <div style={{height: 'calc(100% - 60px)', background: '#F0F3F4'}}>
                            {previewData?.fileName?.toLowerCase().endsWith('.pdf') ? (
                                <iframe src={previewUrl} style={{width: '100%', height: '100%', border: 'none'}} title="PDF Önizleme" />
                            ) : (
                                <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <img src={previewUrl} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} alt="Önizleme" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

// ── Styles ──────────────────────────────────────────────────

const statCardStyle = {
    background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid var(--surface-container-highest)',
    display: 'flex', flexDirection: 'column', transition: 'transform 0.2s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
};

const statValueStyle = {
    fontSize: '22px', fontWeight: 800, color: 'var(--enba-dark)', marginBottom: '4px'
};

const statLabelStyle = {
    fontSize: '12px', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px'
};

const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: '6px', letterSpacing: '0.5px'
};

const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--surface-container-highest)',
    outline: 'none', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box'
};

const actionBtnStyle = {
    background: 'var(--surface-container-low)', border: 'none', borderRadius: '8px', width: '34px', height: '34px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px',
    transition: '0.2s', border: '1px solid var(--surface-container-highest)'
};

const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(21, 34, 46, 0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
};

const modalContentStyle = {
    background: '#fff', padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '600px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'modalIn 0.3s ease-out'
};

// Global styles for the component in a style tag might be needed if we want hover effects on rows
// but we'll stick to inline for now as per the environment.

window.LisansRuhsatModulu = LisansRuhsatModulu;

