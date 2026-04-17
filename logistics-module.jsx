const { useState, useEffect } = React;

function LojistikModulu() {
    const [kayitlar, setKayitlar] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form States
    const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
    const [aracPlaka, setAracPlaka] = useState("");
    const [kullanici, setKullanici] = useState("");
    const [baslangicKm, setBaslangicKm] = useState("");
    const [bitisKm, setBitisKm] = useState("");
    const [guzergah, setGuzergah] = useState("");

    useEffect(() => {
        const loadRecords = async () => {
            if (!window.DataService) return;
            setLoading(true);
            try {
                const data = await window.DataService.getLogisticsRecords();
                setKayitlar(data);
            } catch (e) {
                console.error("Lojistik kayıtları yüklenemedi:", e);
            } finally {
                setLoading(false);
            }
        };
        loadRecords();
    }, []);

    const kayitEkle = async (e) => {
        e.preventDefault();
        if (!window.DataService) return;
        
        const basKm = Number(baslangicKm) || 0;
        const bitKm = Number(bitisKm) || 0;
        const farkKm = bitKm - basKm;

        const yeniKayit = {
            tarih,
            aracPlaka,
            kullanici,
            baslangicKm: basKm,
            bitisKm: bitKm,
            farkKm,
            guzergah
        };

        setLoading(true);
        try {
            await window.DataService.saveLogisticsRecord(yeniKayit);
            const data = await window.DataService.getLogisticsRecords();
            setKayitlar(data);

            // Formu temizle
            setBaslangicKm(bitKm.toString());
            setBitisKm("");
            setGuzergah("");
        } catch (e) {
            alert("Kayıt sırasında hata oluştu: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const kayitSil = async (id) => {
        if (!window.DataService) return;
        if (confirm("Bu kayıt silinecektir. Emin misiniz?")) {
            setLoading(true);
            try {
                await window.DataService.deleteData('logistics_records', id);
                setKayitlar(p => p.filter(k => k.id !== id));
            } catch (e) {
                alert("Silme sırasında hata oluştu: " + e.message);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="page-container" style={{maxWidth: '96%', margin: '0 auto', padding: '20px 10px', opacity: loading ? 0.7 : 1}}>
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ color: 'var(--enba-dark)', margin: '0 0 8px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i className="ph-fill ph-truck" style={{ color: 'var(--enba-orange)' }}></i> {window.t('logistics.title') || 'Lojistik & Araç Takip Modülü'}
                </h2>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '15px' }}>
                    {window.t('logistics.desc') || 'Şirkete ait araçların günlük seferlerini, km bilgilerini ve şoför bilgilerini takip edin.'}
                </p>
            </div>
            
            <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start'}}>
                
                <div className="enba-card" style={{ flex: '1 1 350px', padding: '24px' }}>
                    <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800, color: 'var(--enba-dark)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="ph ph-plus-circle"></i> Yeni Sefer Kaydı
                    </h3>
                    
                    <form onSubmit={kayitEkle} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                        <div style={{display: 'flex', gap: '12px'}}>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Tarih</label>
                                <input type="date" value={tarih} onChange={e => setTarih(e.target.value)} required style={{width: '100%', padding: '12px', borderRadius: '0.75rem', border: '1px solid var(--surface-container-highest)', outline: 'none', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)'}} />
                            </div>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Araç Plakası</label>
                                <input type="text" value={aracPlaka} onChange={e => setAracPlaka(e.target.value)} required placeholder="Örn: 34 ABC 123" style={{width: '100%', padding: '12px', borderRadius: '0.75rem', border: '1px solid var(--surface-container-highest)', outline: 'none', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)'}} />
                            </div>
                        </div>

                        <div>
                            <label style={{display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Kullanıcı (Şoför)</label>
                            <input type="text" value={kullanici} onChange={e => setKullanici(e.target.value)} required placeholder="Sürücü ad ve soyadı" style={{width: '100%', padding: '12px', borderRadius: '0.75rem', border: '1px solid var(--surface-container-highest)', outline: 'none', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)'}} />
                        </div>

                        <div>
                            <label style={{display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Güzergah / Açıklama</label>
                            <input type="text" value={guzergah} onChange={e => setGuzergah(e.target.value)} required placeholder="Nereden nereye gidildi?" style={{width: '100%', padding: '12px', borderRadius: '0.75rem', border: '1px solid var(--surface-container-highest)', outline: 'none', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)'}} />
                        </div>

                        <div style={{display: 'flex', gap: '12px', background: 'var(--surface-container-lowest)', padding: '16px', borderRadius: '1rem', border: '1px solid var(--surface-container-high)'}}>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--enba-dark)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Başlangıç KM</label>
                                <input type="number" value={baslangicKm} onChange={e => setBaslangicKm(e.target.value)} required placeholder="Örn: 100000" style={{width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid var(--enba-orange)', outline: 'none', fontWeight: 700}} onFocus={window.selectOnFocus} />
                            </div>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--enba-dark)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Bitiş KM</label>
                                <input type="number" value={bitisKm} onChange={e => setBitisKm(e.target.value)} required placeholder="Örn: 100150" style={{width: '100%', padding: '10px', borderRadius: '0.5rem', border: '1px solid var(--enba-orange)', outline: 'none', fontWeight: 700}} onFocus={window.selectOnFocus} />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ padding: '14px', width: '100%', marginTop: '10px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '1rem', boxShadow: 'var(--shadow-md)' }}>
                            <i className="ph ph-check-circle"></i> Seferi Kaydet
                        </button>
                    </form>
                </div>

                <div className="enba-card" style={{ flex: '2 1 600px', padding: '24px', overflowX: 'auto' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 800, color: 'var(--enba-dark)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="ph ph-list-bullets"></i> Sefer Kayıtları
                    </h3>
                    {kayitlar.length === 0 ? (
                        <div style={{textAlign: 'center', padding: '48px', color: 'var(--on-surface-variant)', background: 'var(--surface-container-lowest)', borderRadius: '1rem', border: '1px dashed var(--surface-container-highest)'}}>
                            <i className="ph ph-truck" style={{ fontSize: '48px', opacity: 0.1, marginBottom: '16px' }}></i>
                            <br/>Henüz lojistik kaydı bulunmamaktadır.
                        </div>
                    ) : (
                        <table className="matrix-table" style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px'}}>
                            <thead>
                                <tr style={{background: 'var(--enba-dark)', color: '#fff'}}>
                                    <th style={{padding: '10px', fontSize: '12px'}}>TARİH</th>
                                    <th style={{padding: '10px', fontSize: '12px'}}>ARAÇ & SÜRÜCÜ</th>
                                    <th style={{padding: '10px', fontSize: '12px'}}>GÜZERGAH</th>
                                    <th style={{padding: '10px', fontSize: '12px', textAlign: 'right'}}>BAŞ. KM</th>
                                    <th style={{padding: '10px', fontSize: '12px', textAlign: 'right'}}>BİTİŞ KM</th>
                                    <th style={{padding: '10px', fontSize: '12px', textAlign: 'right'}}>TOPLAM FARK</th>
                                    <th style={{padding: '10px', fontSize: '12px', textAlign: 'center'}}>İŞLEM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kayitlar.map(k => (
                                    <tr key={k.id} style={{borderBottom: '1px solid var(--surface-container-high)'}}>
                                        <td style={{padding: '10px', fontWeight: 'bold'}}>{k.tarih}</td>
                                        <td style={{padding: '10px'}}>
                                            <div style={{fontWeight: 'bold', color: 'var(--enba-dark)'}}>{k.aracPlaka}</div>
                                            <div style={{fontSize: '11px', color: 'var(--on-surface-variant)'}}>{k.kullanici}</div>
                                        </td>
                                        <td style={{padding: '10px', fontSize: '13px'}}>{k.guzergah}</td>
                                        <td style={{padding: '10px', textAlign: 'right', color: 'var(--on-surface-variant)'}}>{k.baslangicKm}</td>
                                        <td style={{padding: '10px', textAlign: 'right', color: 'var(--on-surface-variant)'}}>{k.bitisKm}</td>
                                        <td style={{padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#2980b9'}}>{k.farkKm} km</td>
                                            <button onClick={() => kayitSil(k.id)} className="btn-icon" style={{ color: 'var(--error)' }} title="Kaydı Sil">
                                                <i className="ph ph-trash"></i>
                                            </button>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </div>
    );
}

window.LojistikModulu = LojistikModulu;

