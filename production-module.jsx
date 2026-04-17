const { useState, useEffect } = React;

function UretimTakipModulu() {
    const [kayitlar, setKayitlar] = useState([]);

    // Form States
    const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
    const [vardiya, setVardiya] = useState("1. Vardiya");
    const [girenHammadde, setGirenHammadde] = useState("");
    const [cikanUrun, setCikanUrun] = useState("");
    const [baslamaSaati, setBaslamaSaati] = useState("08:00");
    const [bitisSaati, setBitisSaati] = useState("16:00");
    const [calisanlar, setCalisanlar] = useState([]); // List of {id, name, overtime}
    const [personelListesi, setPersonelListesi] = useState([]); // HR List
    const [sayacBasi, setSayacBasi] = useState("");
    const [sayacSonu, setSayacSonu] = useState("");

    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!window.DataService) return;
        setLoading(true);
        try {
            const [recs, pers] = await Promise.all([
                window.DataService.getProductionRecords(),
                window.DataService.getPersonnel()
            ]);
            
            // Map snake_case to camelCase for the component
            const mappedRecs = recs.map(r => ({
                id: r.id,
                tarih: r.tarih,
                vardiya: r.vardiya,
                baslamaSaati: r.baslama_saati,
                bitisSaati: r.bitis_saati,
                calisanlar: r.calisanlar || [],
                girenHammadde: r.giren_hammadde,
                cikanUrun: r.cikan_urun,
                sayacBasi: r.sayac_basi,
                sayacSonu: r.sayac_sonu,
                fireMiktar: r.fire_miktar,
                fireOran: r.fire_oran,
                elektrikSarfiyat: r.elektrik_sarfiyat,
                calismaSureSaat: r.calisma_sure_saat
            }));

            setKayitlar(mappedRecs.sort((a,b) => new Date(b.tarih) - new Date(a.tarih)));
            setPersonelListesi(pers.filter(p => p.department === 'Üretim'));
            
            if (mappedRecs.length > 0) {
                setSayacBasi(mappedRecs[0].sayacSonu?.toString() || "");
            }
        } catch (e) {
            console.error("Üretim verileri yüklenemedi:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const eklePersonel = (id) => {
        const p = personelListesi.find(x => x.id === id);
        if (p && !calisanlar.find(c => c.id === id)) {
            setCalisanlar([...calisanlar, { id: p.id, name: p.name, overtime: 0 }]);
        }
    };

    const cikarPersonel = (id) => {
        setCalisanlar(calisanlar.filter(c => c.id !== id));
    };

    const guncelleFazlaMesai = (id, val) => {
        setCalisanlar(calisanlar.map(c => c.id === id ? { ...c, overtime: Number(val) || 0 } : c));
    };

    // Handlers removed/replaced by DataService calls

    const sureHesapla = (bas, bit) => {
        if (!bas || !bit) return 0;
        const [basH, basM] = bas.split(':').map(Number);
        const [bitH, bitM] = bit.split(':').map(Number);
        let basDakika = (basH * 60) + basM;
        let bitDakika = (bitH * 60) + bitM;
        if (bitDakika < basDakika) bitDakika += (24 * 60);
        return (bitDakika - basDakika) / 60;
    };

    const kayitEkle = async (e) => {
        e.preventDefault();
        const giren = Number(girenHammadde) || 0;
        const cikan = Number(cikanUrun) || 0;
        const basi = Number(sayacBasi) || 0;
        const sonu = Number(sayacSonu) || 0;

        const fireMiktar = giren - cikan;
        const fireOran = giren > 0 ? (fireMiktar / giren) * 100 : 0;
        const elektrikSarfiyat = sonu - basi;
        const calismaSureSaat = sureHesapla(baslamaSaati, bitisSaati);

        const yeniKayit = {
            tarih,
            vardiya,
            girenHammadde: giren,
            cikanUrun: cikan,
            baslamaSaati,
            bitisSaati,
            calisanlar,
            sayacBasi: basi,
            sayacSonu: sonu,
            fireMiktar,
            fireOran,
            elektrikSarfiyat,
            calismaSureSaat
        };

        try {
            await window.DataService.saveProductionRecord(yeniKayit);
            await loadData();
            setGirenHammadde("");
            setCikanUrun("");
            setCalisanlar([]);
            setSayacSonu("");
        } catch(e) { alert("Kayıt eklenemedi."); }
    };

    const kayitSil = async (id) => {
        if (confirm("Bu kayıt silinecektir. Emin misiniz?")) {
            try {
                await window.DataService.deleteData('production_records', id);
                await loadData();
            } catch(e) { alert("Kayıt silinemedi."); }
        }
    };

    const excelIndir = () => {
        const table = document.getElementById('uretim-table-export');
        if (!table) return;
        const wb = XLSX.utils.table_to_book(table, {sheet: "Üretim Kayıtları"});
        XLSX.writeFile(wb, "Enba_Uretim_Takip_" + new Date().toISOString().split('T')[0] + ".xlsx");
    };

    const numFmt = (num) => new Intl.NumberFormat(localStorage.getItem('enba_lang') === 'TR' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(num || 0);

    return (
        <div className="page-container" style={{maxWidth: '96%', margin: '0 auto', padding: '20px 10px'}}>
            <h2 style={{color: 'var(--enba-dark)', textTransform: 'uppercase', marginBottom: '8px'}}>⚡  {window.t('prod.title')}</h2>
            <p style={{color: '#7F8C8D', marginBottom: '24px'}}>{window.t('prod.desc')}</p>
            
            <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start', opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto'}}>
                {loading && (
                    <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, background: 'rgba(255,255,255,0.8)', padding: '20px', borderRadius: '10px', fontWeight: 'bold'}}>
                        {window.t('common.loading') || 'Yükleniyor...'}
                    </div>
                )}
                
                {/* VERİ GİRİŞ FORMU */}
                <div style={{flex: '1 1 350px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-grey)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)'}}>
                    <h3 style={{margin: '0 0 20px 0', fontSize: '16px', color: 'var(--enba-dark)', borderBottom: '2px solid #eee', paddingBottom: '10px'}}>⚡  {window.t('prod.form_title')}</h3>
                    
                    <form onSubmit={kayitEkle} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                        <div style={{display: 'flex', gap: '10px'}}>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '4px'}}>{window.t('prod.date')}</label>
                                <input type="date" value={tarih} onChange={e => setTarih(e.target.value)} required style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none'}} />
                            </div>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '4px'}}>{window.t('prod.shift')}</label>
                                <select value={vardiya} onChange={e => setVardiya(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none'}}>
                                    <option>1. Vardiya</option>
                                    <option>2. Vardiya</option>
                                    <option>3. Vardiya</option>
                                </select>
                            </div>
                        </div>

                        <div style={{display: 'flex', gap: '10px'}}>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '4px'}}>{window.t('prod.start_time')}</label>
                                <input type="time" value={baslamaSaati} onChange={e => setBaslamaSaati(e.target.value)} required style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none'}} />
                            </div>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '4px'}}>{window.t('prod.end_time')}</label>
                                <input type="time" value={bitisSaati} onChange={e => setBitisSaati(e.target.value)} required style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none'}} />
                            </div>
                        </div>

                        <div>
                            <label style={{display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '4px'}}>{window.t('prod.personnel_selection')}</label>
                            <div style={{display: 'flex', gap: '8px', marginBottom: '10px'}}>
                                <select onChange={(e) => {
                                    if(e.target.value) {
                                        eklePersonel(e.target.value);
                                        e.target.value = "";
                                    }
                                }} style={{flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}>
                                    <option value="">{window.t('prod.select_person')}</option>
                                    {personelListesi.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Seçili Personel Listesi */}
                            <div style={{display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8f9fa', padding: '10px', borderRadius: '8px', border: '1px solid #eee'}}>
                                {calisanlar.length === 0 ? (
                                    <div style={{fontSize: '12px', color: '#aaa', textAlign: 'center'}}>{window.t('prod.no_personnel')}</div>
                                ) : (
                                    calisanlar.map(c => (
                                        <div key={c.id} style={{display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #dee2e6'}}>
                                            <div style={{flex: 1, fontSize: '13px', fontWeight: 600}}>{c.name}</div>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                <label style={{fontSize: '10px', fontWeight: 700, color: '#f39c12'}}>{window.t('prod.overtime')}:</label>
                                                <input type="number" step="0.5" value={c.overtime} onChange={(e) => guncelleFazlaMesai(c.id, e.target.value)} style={{width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px'}} onFocus={window.selectOnFocus} />
                                            </div>
                                            <button type="button" onClick={() => cikarPersonel(c.id)} style={{background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '14px'}}>✕</button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div style={{display: 'flex', gap: '10px', background: '#fdf2e9', padding: '10px', borderRadius: '8px', border: '1px solid #fdebd0'}}>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#d35400', marginBottom: '4px'}}>{window.t('prod.raw_input')}</label>
                                <input type="number" step="0.01" value={girenHammadde} onChange={e => setGirenHammadde(e.target.value)} required placeholder="Örn: 1500" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #f39c12', outline: 'none'}} onFocus={window.selectOnFocus} />
                            </div>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#27ae60', marginBottom: '4px'}}>{window.t('prod.finished_output')}</label>
                                <input type="number" step="0.01" value={cikanUrun} onChange={e => setCikanUrun(e.target.value)} required placeholder="Örn: 1250" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #2ecc71', outline: 'none'}} onFocus={window.selectOnFocus} />
                            </div>
                        </div>

                        <div style={{display: 'flex', gap: '10px', background: '#ebf5fb', padding: '10px', borderRadius: '8px', border: '1px solid #d4e6f1'}}>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#2980b9', marginBottom: '4px'}}>{window.t('prod.meter_start')}</label>
                                <input type="number" step="0.1" value={sayacBasi} onChange={e => setSayacBasi(e.target.value)} required placeholder="Örn: 24500" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #3498db', outline: 'none'}} onFocus={window.selectOnFocus} />
                            </div>
                            <div style={{flex: 1}}>
                                <label style={{display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#2980b9', marginBottom: '4px'}}>{window.t('prod.meter_end')}</label>
                                <input type="number" step="0.1" value={sayacSonu} onChange={e => setSayacSonu(e.target.value)} required placeholder="Örn: 24900" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #3498db', outline: 'none'}} onFocus={window.selectOnFocus} />
                            </div>
                        </div>

                        <button type="submit" style={{padding: '14px', background: 'var(--enba-dark)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px', transition: '0.2s', boxShadow: '0 4px 12px rgba(21, 34, 46, 0.2)'}}>
                            {window.t('prod.save_data')}
                        </button>
                    </form>
                </div>

                {/* VERİ TABLOSU */}
                <div style={{flex: '2 1 600px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-grey)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', overflowX: 'auto'}}>
                    
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                        <h3 style={{margin: 0, fontSize: '16px', color: 'var(--enba-dark)'}}>⚡  {window.t('prod.history_title')}</h3>
                        <button onClick={excelIndir} disabled={kayitlar.length === 0} style={{padding: '8px 16px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: kayitlar.length === 0 ? 'not-allowed' : 'pointer', opacity: kayitlar.length === 0 ? 0.5 : 1}}>
                            ⚡  {window.t('prod.export_excel')}
                        </button>
                    </div>

                    {kayitlar.length === 0 ? (
                        <div style={{textAlign: 'center', padding: '40px', color: '#95a5a6', background: '#fcfcfc', borderRadius: '8px', border: '1px dashed #ddd'}}>
                            {window.t('prod.no_records')}
                        </div>
                    ) : (
                        <table id="uretim-table-export" className="matrix-table" style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px'}}>
                            <thead>
                                <tr style={{background: 'var(--enba-dark)', color: '#fff'}}>
                                    <th style={{padding: '10px', fontSize: '12px'}}>{window.t('prod.date_shift')}</th>
                                    <th style={{padding: '10px', fontSize: '12px'}}>{window.t('prod.time_duration')}</th>
                                    <th style={{padding: '10px', fontSize: '12px'}}>{window.t('prod.personnel')}</th>
                                    <th style={{padding: '10px', fontSize: '12px', textAlign: 'right'}}>{window.t('prod.input_kg')}</th>
                                    <th style={{padding: '10px', fontSize: '12px', textAlign: 'right'}}>{window.t('prod.output_kg')}</th>
                                    <th style={{padding: '10px', fontSize: '12px', textAlign: 'right'}}>{window.t('prod.waste')}</th>
                                    <th style={{padding: '10px', fontSize: '12px', textAlign: 'right'}}>{window.t('prod.consumption')}</th>
                                    <th style={{padding: '10px', fontSize: '12px', textAlign: 'center'}}>{window.t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kayitlar.map(k => (
                                    <tr key={k.id} style={{borderBottom: '1px solid #f0f0f0'}}>
                                        <td style={{padding: '10px'}}>
                                            <div style={{fontWeight: 'bold', color: 'var(--enba-dark)', fontSize: '13px'}}>{k.tarih}</div>
                                            <div style={{fontSize: '11px', color: '#7f8c8d'}}>{k.vardiya}</div>
                                        </td>
                                        <td style={{padding: '10px'}}>
                                            <div style={{fontSize: '13px'}}>{k.baslamaSaati} - {k.bitisSaati}</div>
                                            <div style={{fontSize: '11px', color: '#8e44ad', fontWeight: 'bold'}}>{numFmt(k.calismaSureSaat)} {localStorage.getItem('enba_lang') === 'TR' ? 'Saat' : 'Hours'}</div>
                                        </td>
                                        <td style={{padding: '10px', fontSize: '13px'}}>
                                            {Array.isArray(k.calisanlar) ? (
                                                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                    {k.calisanlar.map(c => (
                                                        <div key={c.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '4px 8px', borderRadius: '4px', border: '1px solid #eee'}}>
                                                            <span>{c.name}</span>
                                                            {c.overtime > 0 && (
                                                                <span style={{fontSize: '10px', background: '#f39c12', color: '#fff', padding: '2px 5px', borderRadius: '10px', fontWeight: 700}}>
                                                                    +{c.overtime} {window.t('prod.overtime')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {k.calisanlar.length === 0 && '-'}
                                                </div>
                                            ) : (
                                                k.calisanlar || '-'
                                            )}
                                        </td>
                                        <td style={{padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#d35400'}}>{numFmt(k.girenHammadde)}</td>
                                        <td style={{padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#27ae60'}}>{numFmt(k.cikanUrun)}</td>
                                        <td style={{padding: '10px', textAlign: 'right'}}>
                                            <div style={{fontWeight: 'bold', color: '#c0392b', fontSize: '13px'}}>{numFmt(k.fireMiktar)} KG</div>
                                            <div style={{fontSize: '11px', color: '#e74c3c'}}>% {numFmt(k.fireOran)}</div>
                                        </td>
                                        <td style={{padding: '10px', textAlign: 'right'}}>
                                            <div style={{fontWeight: 'bold', color: '#2980b9', fontSize: '13px'}}>{numFmt(k.elektrikSarfiyat)} kWh</div>
                                            <div style={{fontSize: '11px', color: '#7f8c8d'}}>({k.sayacBasi} - {k.sayacSonu})</div>
                                        </td>
                                        <td style={{padding: '10px', textAlign: 'center'}}>
                                            <button onClick={() => kayitSil(k.id)} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px'}} title={window.t('common.delete')}>⚡ ️</button>
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

window.UretimTakipModulu = UretimTakipModulu;

