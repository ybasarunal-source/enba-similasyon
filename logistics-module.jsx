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
            {loading && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'var(--enba-orange)', color: '#fff', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    ⚡  İşlem gerçekleştiriliyor...
                </div>
            )}
            <h2 style={{color: 'var(--enba-dark)', textTransform: 'uppercase', marginBottom: '8px'}}>⚡  Lojistik & Araç Takip Modülü</h2>
            <p style={{color: '#7F8C8D', marginBottom: '24px'}}>Şirkete ait araçların günlük seferlerini, km bilgilerini ve şoför bilgilerini takip edin.</p>
            
            <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start'}}>
                
                {/* VERİ GİRİŞ FORMU */}
                <div style={{flex: '1 1 350px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-grey)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)'}}>
                    <h3 style={{margin: '0 0 20px 0', fontSize: '16px', color: 'var(--enba-dark)', borderBottom: '2px solid #eee', paddingBottom: '10px'}}>⚡  Yeni Sefer Kaydı</h3>
                    
                    <form onSubmit={kayitEkle} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                        <div style={{display: 'flex', gap: '10px'}}>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '4px'}}>TARİH</label>
                                <input type="date" value={tarih} onChange={e => setTarih(e.target.value)} required style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none'}} />
                            </div>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '4px'}}>ARAÇ PLAKASI</label>
                                <input type="text" value={aracPlaka} onChange={e => setAracPlaka(e.target.value)} required placeholder="Örn: 34 ABC 123" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none'}} />
                            </div>
                        </div>

                        <div>
                            <label style={{display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '4px'}}>KULLANICI (ŞOFÖR)</label>
                            <input type="text" value={kullanici} onChange={e => setKullanici(e.target.value)} required placeholder="Sürücü ad ve soyadı" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none'}} />
                        </div>

                        <div>
                            <label style={{display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '4px'}}>GÜZERGAH / AÇIKLAMA</label>
                            <input type="text" value={guzergah} onChange={e => setGuzergah(e.target.value)} required placeholder="Nereden nereye gidildi?" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none'}} />
                        </div>

                        <div style={{display: 'flex', gap: '10px', background: '#ebf5fb', padding: '10px', borderRadius: '8px', border: '1px solid #d4e6f1'}}>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#2980b9', marginBottom: '4px'}}>BAŞLANGIÇ KM</label>
                                <input type="number" value={baslangicKm} onChange={e => setBaslangicKm(e.target.value)} required placeholder="Örn: 100000" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #3498db', outline: 'none'}} onFocus={window.selectOnFocus} />
                            </div>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#2980b9', marginBottom: '4px'}}>BİTİŞ KM</label>
                                <input type="number" value={bitisKm} onChange={e => setBitisKm(e.target.value)} required placeholder="Örn: 100150" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #3498db', outline: 'none'}} onFocus={window.selectOnFocus} />
                            </div>
                        </div>

                        <button type="submit" style={{padding: '14px', background: 'var(--enba-dark)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px', transition: '0.2s', boxShadow: '0 4px 12px rgba(21, 34, 46, 0.2)'}}>
                            ⚡  Seferi Kaydet
                        </button>
                    </form>
                </div>

                {/* VERİ TABLOSU */}
                <div style={{flex: '2 1 600px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-grey)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', overflowX: 'auto'}}>
                    <h3 style={{margin: '0 0 15px 0', fontSize: '16px', color: 'var(--enba-dark)'}}>⚡  Sefer Kayıtları</h3>
                    {kayitlar.length === 0 ? (
                        <div style={{textAlign: 'center', padding: '40px', color: '#95a5a6', background: '#fcfcfc', borderRadius: '8px', border: '1px dashed #ddd'}}>
                            Henüz lojistik kaydı bulunmamaktadır.
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
                                    <tr key={k.id} style={{borderBottom: '1px solid #f0f0f0'}}>
                                        <td style={{padding: '10px', fontWeight: 'bold'}}>{k.tarih}</td>
                                        <td style={{padding: '10px'}}>
                                            <div style={{fontWeight: 'bold', color: 'var(--enba-dark)'}}>{k.aracPlaka}</div>
                                            <div style={{fontSize: '11px', color: '#7f8c8d'}}>{k.kullanici}</div>
                                        </td>
                                        <td style={{padding: '10px', fontSize: '13px'}}>{k.guzergah}</td>
                                        <td style={{padding: '10px', textAlign: 'right', color: '#7f8c8d'}}>{k.baslangicKm}</td>
                                        <td style={{padding: '10px', textAlign: 'right', color: '#7f8c8d'}}>{k.bitisKm}</td>
                                        <td style={{padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#2980b9'}}>{k.farkKm} km</td>
                                        <td style={{padding: '10px', textAlign: 'center'}}>
                                            <button onClick={() => kayitSil(k.id)} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px'}} title="Kaydı Sil">⚡ ️</button>
                                        </td>
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

