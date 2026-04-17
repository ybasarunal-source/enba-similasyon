/**
 * Enba Similasyon - Detaylı Wizard Adım 4: Personel Yönetimi
 */

window.DetStep4_Personnel = function DetStep4_Personnel({
    asgariNet, setAsgariNet,
    asgariSgk, setAsgariSgk,
    gunlukYemek, setGunlukYemek,
    personelListesi, personelSil,
    yeniPersonel, setYeniPersonel,
    personelEkle, topluPersonelDegerleri,
    guncelleTopluPersonel, uygulaTopluPersonel,
    ayVerileri, acikAylar, setAcikAylar, vardiyaSayisi,
    aylikPersonelGuncelle, AYLAR,
    baslangicAyi, personelGiderleriniUygula,
    setAdim
}) {
    const bolt = '⚡ ';

    return (
        <div className="step-content">
            {/* Personel Parametreleri */}
            <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
                <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'16px', color:'var(--enba-dark)', margin:'0 0 20px' }}>Personel Maaş & Yan Hak Parametreleri</h2>
                <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' }}>
                    <div style={{flex:1, minWidth:'150px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Baz Net Maaş (₺)</label>
                        <input type='number' value={asgariNet} onChange={e => setAsgariNet(Number(e.target.value))} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div style={{flex:1, minWidth:'150px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Baz SGK Yükü (₺)</label>
                        <input type='number' value={asgariSgk} onChange={e => setAsgariSgk(Number(e.target.value))} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div style={{flex:1, minWidth:'150px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Günlük Yemek (₺)</label>
                        <input type='number' value={gunlukYemek} onChange={e => setGunlukYemek(Number(e.target.value))} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                </div>
            </div>

            {/* Personel Rol Yönetimi */}
            <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
                <h3 style={{ fontSize:'13px', margin:'0 0 10px', color:'var(--enba-dark)' }}>{bolt} İşçi / Personel Rolü Tanımla</h3>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', gap:'12px', marginBottom:'16px', alignItems:'end' }}>
                    <div>
                        <label style={{ fontSize:'10px', fontWeight:700, color:'var(--on-surface-variant)', display:'block', marginBottom:'4px' }}>ÜNVAN / KATEGORİ</label>
                        <input type='text' value={yeniPersonel.unvan} onChange={e => setYeniPersonel({...yeniPersonel, unvan: e.target.value})} placeholder='Örn: Kırma Operatörü' style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div>
                        <label style={{ fontSize:'10px', fontWeight:700, color:'var(--on-surface-variant)', display:'block', marginBottom:'4px' }}>EK MAAŞ (₺)</label>
                        <input type='number' value={yeniPersonel.ekMaas} onChange={e => setYeniPersonel({...yeniPersonel, ekMaas: e.target.value})} placeholder='0' style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div>
                        <label style={{ fontSize:'10px', fontWeight:700, color:'var(--on-surface-variant)', display:'block', marginBottom:'4px' }}>EK SGK (₺)</label>
                        <input type='number' value={yeniPersonel.ekSgk} onChange={e => setYeniPersonel({...yeniPersonel, ekSgk: e.target.value})} placeholder='0' style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div>
                        <label style={{ fontSize:'10px', fontWeight:700, color:'var(--on-surface-variant)', display:'block', marginBottom:'4px' }}>EK YEMEK (₺)</label>
                        <input type='number' value={yeniPersonel.ekYemek} onChange={e => setYeniPersonel({...yeniPersonel, ekYemek: e.target.value})} placeholder='0' style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <button onClick={personelEkle} style={{ background:'var(--enba-dark)', color:'#fff', border:'none', height:'42px', padding:'0 24px', borderRadius:'0.5rem', cursor:'pointer', fontWeight:700 }}>+ Ekle</button>
                </div>

                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                    {personelListesi.map(p => (
                        <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'10px', background:'var(--surface-container-low)', padding:'8px 16px', borderRadius:'2rem', border:'1px solid var(--surface-container-highest)' }}>
                            <div style={{ fontSize:'13px', fontWeight:700, color:'var(--enba-dark)' }}>{p.unvan}</div>
                            <div style={{ fontSize:'11px', color:'var(--on-surface-variant)' }}>
                                {p.ekMaas > 0 ? `+${p.ekMaas}₺` : 'Standart'}
                            </div>
                            <button onClick={() => personelSil(p.id)} style={{ background:'none', border:'none', color:'var(--error)', cursor:'pointer', fontWeight:800, padding:'4px' }}>✖</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Toplu Kadro Girişi */}
            {personelListesi.length > 0 && (
                <div style={{ padding:'20px', background:'var(--enba-dark)', color:'#fff', borderRadius:'1rem', marginBottom:'24px' }}>
                    <h3 style={{ fontSize:'14px', margin:'0 0 16px' }}>⚡ Tek Seferde Tüm Aylara Kadro Ata</h3>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'16px' }}>
                        {personelListesi.map(p => (
                            <div key={p.id} style={{ background:'rgba(255,255,255,0.05)', padding:'12px', borderRadius:'0.75rem', border:'1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontWeight:700, fontSize:'12px', marginBottom:'8px', color:'#F59E0B' }}>{p.unvan}</div>
                                <div style={{ display:'flex', gap:'8px' }}>
                                    {Array.from({length: vardiyaSayisi}).map((_, vIdx) => {
                                        const vNo = vIdx + 1;
                                        const pKey = `${p.id}_v${vNo}`;
                                        return (
                                            <div key={vNo} style={{flex:1}}>
                                                <label style={{fontSize:'9px', display:'block', marginBottom:'2px'}}>V{vNo}</label>
                                                <input 
                                                    type="number" 
                                                    placeholder="Kişi" 
                                                    value={topluPersonelDegerleri[pKey] || ''} 
                                                    onChange={e => guncelleTopluPersonel(pKey, e.target.value)} 
                                                    style={{ width:'100%', padding:'6px', borderRadius:'4px', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(0,0,0,0.2)', color:'#fff', textAlign:'center' }} 
                                                    onFocus={window.selectOnFocus}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'20px' }}>
                        <button onClick={uygulaTopluPersonel} style={{ background:'var(--enba-orange)', color:'#fff', border:'none', padding:'10px 24px', borderRadius:'2rem', cursor:'pointer', fontWeight:800 }}>Tüm Aylara Uygula</button>
                    </div>
                </div>
            )}

            {/* Aylık Kadro Tablosu */}
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                <thead>
                    <tr style={{ background:'var(--primary-container)' }}>
                        <th style={{ padding:'12px', textAlign:'left' }}>Ay</th>
                        <th style={{ padding:'12px', textAlign:'right' }}>Toplam Personel (Kişi)</th>
                        <th style={{ padding:'12px', textAlign:'right' }}>Detay</th>
                    </tr>
                </thead>
                <tbody>
                    {ayVerileri.map((a, i) => {
                        const gercekAyIdx = (baslangicAyi + i) % 12;
                        const isOpen = acikAylar[i];
                        
                        let toplamKisi = 0;
                        personelListesi.forEach(p => {
                            for(let v=1; v<=vardiyaSayisi; v++) {
                                toplamKisi += (a.personeller?.[`${p.id}_v${v}`] || 0);
                            }
                        });

                        return (
                            <React.Fragment key={i}>
                                <tr style={{ background:'var(--surface)', cursor:'pointer', borderBottom:'1px solid var(--surface-container)' }} onClick={() => setAcikAylar(p => ({ ...p, [i]: !p[i] }))}>
                                    <td style={{ padding:'14px', fontWeight:600 }}>{isOpen ? '▼' : '▶'} {AYLAR[gercekAyIdx]}</td>
                                    <td style={{ padding:'14px', textAlign:'right', fontWeight:700 }}>{toplamKisi} Kişi</td>
                                    <td style={{ padding:'14px', textAlign:'right', color:'var(--enba-orange)' }}>Genişlet / Düzenle</td>
                                </tr>
                                {isOpen && (
                                    <tr>
                                        <td colSpan="3" style={{ padding:'16px', background:'var(--surface-container)' }}>
                                            <table style={{ width:'100%', borderCollapse:'collapse', background:'var(--surface-container-lowest)', borderRadius:'0.5rem', overflow:'hidden' }}>
                                                <thead>
                                                    <tr style={{ background:'rgba(0,0,0,0.05)' }}>
                                                        <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'12px', color:'var(--enba-dark)' }}>Kadrolu Ünvan</th>
                                                        {Array.from({length: vardiyaSayisi}).map((_, vIdx) => (
                                                            <th key={vIdx} style={{ padding:'8px 12px', textAlign:'center', fontSize:'12px', color:'var(--enba-dark)' }}>{vIdx+1}. Vardiya (Kişi)</th>
                                                        ))}
                                                        <th style={{ padding:'8px 12px', textAlign:'right', fontSize:'12px', color:'var(--enba-dark)' }}>Satır Toplam</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {personelListesi.map(p => {
                                                        let satirToplam = 0;
                                                        return (
                                                            <tr key={p.id} style={{ borderBottom:'1px solid var(--surface-container-highest)' }}>
                                                                <td style={{ padding:'8px 12px', fontWeight:700, color:'var(--enba-dark)' }}>{bolt}{p.unvan}</td>
                                                                {Array.from({length: vardiyaSayisi}).map((_, vIdx) => {
                                                                    const vNo = vIdx + 1;
                                                                    const pKey = `${p.id}_v${vNo}`;
                                                                    const adet = a.personeller?.[pKey] || 0;
                                                                    satirToplam += adet;
                                                                    return (
                                                                        <td key={vNo} style={{ padding:'8px 12px', textAlign:'center' }}>
                                                                            <input 
                                                                                type="number" 
                                                                                value={a.personeller?.[pKey] || ''} 
                                                                                onChange={e => aylikPersonelGuncelle(i, pKey, e.target.value)} 
                                                                                style={{ width:'60px', padding:'6px', textAlign:'center', borderRadius:'0.25rem', border:'1px solid #ccc' }} 
                                                                                onFocus={window.selectOnFocus}
                                                                            />
                                                                        </td>
                                                                    );
                                                                })}
                                                                <td style={{ padding:'8px 12px', textAlign:'right', fontWeight:700 }}>{satirToplam}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>

            {/* Gider Yansıtma Butonu */}
            <div style={{ background:'rgba(245,158,11,0.05)', padding:'24px', borderRadius:'1.5rem', border:'2px dashed var(--enba-orange)', marginTop:'32px', textAlign:'center' }}>
                <h3 style={{ fontSize:'15px', color:'var(--enba-orange-dark)', marginBottom:'8px' }}>💰 Personel Giderlerini Hesaplara Yansıt</h3>
                <p style={{ fontSize:'12px', color:'var(--on-surface-variant)', marginBottom:'20px' }}>Girdiğiniz baş sayıları ve maaş parametrelerine göre; SGK, Yemek ve Maaş tutarları 5. Adımdaki gider kalemlerine (450, 455, 480) otomatik işlenecektir.</p>
                <button 
                    onClick={personelGiderleriniUygula} 
                    style={{ background:'var(--enba-orange)', color:'#fff', border:'none', padding:'14px 32px', borderRadius:'2rem', cursor:'pointer', fontWeight:800, fontSize:'15px', boxShadow:'0 6px 15px rgba(245,158,11,0.3)' }}
                >
                    ⚡ Hesapla ve Gider Tablosuna İşle
                </button>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'32px' }}>
                <button onClick={() => setAdim(3)} style={{ padding:'12px 24px', background:'var(--surface-container-high)', color:'var(--on-surface-variant)', border:'none', borderRadius:'2rem', fontWeight:600, cursor:'pointer' }}>← Geri: Operasyon</button>
                <button onClick={() => setAdim(5)} style={{ padding:'12px 24px', background:'var(--enba-orange)', color:'#fff', border:'none', borderRadius:'2rem', fontWeight:700, cursor:'pointer' }}>Sonraki: Tesis Giderleri →</button>
            </div>
        </div>
    );
};