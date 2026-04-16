/**
 * Enba Similasyon - Detaylı Wizard Adım 2: Müşteri Yönetimi
 */

window.DetStep2_Customers = function DetStep2_Customers({
    musteriler, setMusteriler,
    yeniMusteri, setYeniMusteri,
    topluMusteriler, guncelleTopluMusteri, uygulaTopluMusteri,
    ayVerileri, acikAylar, setAcikAylar,
    musteriGuncelle, fmt, AYLAR,
    baslangicAyi, baslangicYili,
    topluFire, setTopluFire, uygulaTopluFire,
    hesaplanmisAyVerileri, fireGuncelle, musteriSonrakiAylara,
    musteriAyiTemizle, setAdim
}) {
    const bolt = '⚡ ';

    return (
        <div className="step-content">
            {/* Müşteri Listesi Yönetimi */}
            <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
                <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'16px', color:'var(--enba-dark)', margin:'0 0 20px' }}>2. Müşteri (Satış) Yönetimi</h2>
                <div style={{ display:'flex', gap:'12px', marginBottom:'16px' }}>
                    <input 
                        type='text' 
                        value={yeniMusteri} 
                        onChange={e => setYeniMusteri(e.target.value)} 
                        placeholder='Müşteri / Alıcı adı...' 
                        style={{ flex:1, maxWidth:'300px', padding:'10px 14px', borderRadius:'0.75rem', border:'1px solid var(--surface-container-highest)' }} 
                        onFocus={window.selectOnFocus}
                    />
                    <button 
                        onClick={() => { if(yeniMusteri.trim()){ setMusteriler(p => [...p, { id: Date.now(), ad: yeniMusteri.trim() }]); setYeniMusteri(''); } }} 
                        style={{ background:'var(--enba-dark)', color:'#fff', border:'none', padding:'0 20px', borderRadius:'0.75rem', cursor:'pointer' }}
                    >
                        + Ekle
                    </button>
                </div>
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                    {musteriler.map(m => (
                        <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'8px', background:'var(--surface-container-low)', padding:'6px 14px', borderRadius:'2rem', border:'1px solid var(--surface-container-highest)' }}>
                            <input 
                                type="text" 
                                value={m.ad || ''} 
                                onChange={e => setMusteriler(p => p.map(x => x.id === m.id ? { ...x, ad: e.target.value } : x))} 
                                style={{ fontWeight:600, border:'1px solid var(--surface-container-highest)', background:'var(--surface-container-lowest)', outline:'none', padding:'4px 10px', borderRadius:'0.5rem', width: '150px', color:'var(--enba-dark)' }} 
                                onFocus={window.selectOnFocus}
                            />
                            {musteriler.length > 1 && (
                                <button onClick={() => setMusteriler(p => p.filter(x => x.id !== m.id))} style={{ background:'none', border:'none', color:'var(--error)', cursor:'pointer', fontWeight:800, padding:'4px' }}>✖</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Toplu Veri Girişi & Fire Ayarları */}
            <div style={{ padding:'16px', background:'var(--enba-dark)', color:'#fff', borderRadius:'1rem', marginBottom:'24px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'15px' }}>
                    <div>
                        <h3 style={{ fontSize:'14px', margin:'0 0 4px' }}>{bolt} Tek Seferde Tüm Aylara Veri Gir</h3>
                        <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)', margin:0 }}>Belirlediğiniz aydan itibaren tüm geleceği tek tıkla simüle edin.</p>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'0.75rem', border:'1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontWeight:700, fontSize:'13px', color:'#F59E0B', whiteSpace:'nowrap', display:'block', marginBottom:'8px' }}>{bolt} Şu anki Fire Toplu Giriş</span>
                        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                            <label style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', cursor:'pointer' }}>
                                <input type="checkbox" checked={topluFire.aktif} onChange={e => setTopluFire(p => ({ ...p, aktif: e.target.checked }))} /> Fire Uygula
                            </label>
                            <input 
                                type="number" 
                                placeholder="%" 
                                value={topluFire.yuzde} 
                                onChange={e => setTopluFire(p => ({ ...p, yuzde: e.target.value }))} 
                                style={{ width:'60px', padding:'6px', borderRadius:'0.5rem', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'#fff', textAlign:'center' }} 
                                onFocus={window.selectOnFocus}
                            />
                            <button onClick={uygulaTopluFire} style={{ background:'#F59E0B', color:'#fff', border:'none', padding:'6px 12px', borderRadius:'0.5rem', cursor:'pointer', fontWeight:700, fontSize:'12px' }}>Uygula</button>
                        </div>
                    </div>
                </div>

                <table style={{width:'100%', borderCollapse:'collapse', background:'var(--enba-dark-light)', borderRadius:'0.5rem', overflow:'hidden', fontSize:'13px'}}>
                    <thead style={{ background:'rgba(0,0,0,0.3)' }}>
                        <tr>
                            <th style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, color:'#fff' }}>Müşteri Adı</th>
                            <th style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, color:'#fff' }}>Ürün (Örn: Çapak)</th>
                            <th style={{ padding:'10px 12px', textAlign:'right', fontWeight:600, color:'#fff' }}>Aylık Satış (T)</th>
                            <th style={{ padding:'10px 12px', textAlign:'right', fontWeight:600, color:'#fff' }}>Satış Fiyatı (₺/T)</th>
                            <th style={{ padding:'10px 12px', textAlign:'right', fontWeight:600, color:'#fff' }}>Nakliye (₺/T)</th>
                            <th style={{ padding:'10px 12px', textAlign:'center', fontWeight:600, color:'#F59E0B' }}>⏳ Başlangıç Ayı</th>
                        </tr>
                    </thead>
                    <tbody>
                        {musteriler.map(m => {
                            const md = topluMusteriler[m.id] || { miktar:'', fiyat:'', nakliye:'', urun:'' };
                            return (
                                <tr key={m.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding:'12px', fontWeight:600 }}>{m.ad}</td>
                                    <td style={{ padding:'8px 12px' }}>
                                        <input type="text" placeholder="Örn: Granül" value={md.urun || ''} onChange={e => guncelleTopluMusteri(m.id, 'urun', e.target.value)} style={{ padding:'8px', width:'100%', borderRadius:'0.5rem', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)', color:'#fff' }} onFocus={window.selectOnFocus} />
                                    </td>
                                    <td style={{ padding:'8px 12px' }}>
                                        <input type="number" placeholder="Miktar" value={md.miktar} onChange={e => guncelleTopluMusteri(m.id, 'miktar', e.target.value)} style={{ padding:'8px', width:'100%', textAlign:'right', borderRadius:'0.5rem', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)', color:'#fff' }} onFocus={window.selectOnFocus} />
                                    </td>
                                    <td style={{ padding:'8px 12px' }}>
                                        <input type="number" placeholder="Fiyat" value={md.fiyat} onChange={e => guncelleTopluMusteri(m.id, 'fiyat', e.target.value)} style={{ padding:'8px', width:'100%', textAlign:'right', borderRadius:'0.5rem', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)', color:'#fff' }} onFocus={window.selectOnFocus} />
                                    </td>
                                    <td style={{ padding:'8px 12px' }}>
                                        <input type="number" placeholder="Nakliye" value={md.nakliye} onChange={e => guncelleTopluMusteri(m.id, 'nakliye', e.target.value)} style={{ padding:'8px', width:'100%', textAlign:'right', borderRadius:'0.5rem', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)', color:'#fff' }} onFocus={window.selectOnFocus} />
                                    </td>
                                    <td style={{ padding:'8px 12px', textAlign:'center' }}>
                                        <select value={md.baslangicAy || 0} onChange={e => guncelleTopluMusteri(m.id, 'baslangicAy', Number(e.target.value))} style={{ padding:'6px 8px', borderRadius:'0.5rem', border:'1px solid rgba(245,158,11,0.4)', background:'rgba(245,158,11,0.08)', color:'#F59E0B', fontSize:'12px', fontWeight:600 }}>
                                            {ayVerileri.map((_, idx) => {
                                                const ayIdx = (baslangicAyi + idx) % 12;
                                                const yil = baslangicYili + Math.floor((baslangicAyi + idx) / 12);
                                                return <option key={idx} value={idx}>{AYLAR[ayIdx]} {yil}</option>;
                                            })}
                                        </select>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'16px' }}>
                    <button onClick={uygulaTopluMusteri} style={{ background:'var(--enba-orange)', color:'#fff', border:'none', padding:'12px 24px', borderRadius:'2rem', cursor:'pointer', fontWeight:800, fontSize:'14px', boxShadow:'0 4px 6px rgba(0,0,0,0.2)' }}>Tüm Aylara Uygula</button>
                </div>
            </div>

            {/* Aylık Detay Tablosu */}
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                <thead>
                    <tr style={{ background:'var(--primary-container)' }}>
                        <th style={{ padding:'12px', textAlign:'left' }}>Ay</th>
                        <th style={{ padding:'12px', textAlign:'right' }}>Toplam Satış (T)</th>
                        <th style={{ padding:'12px', textAlign:'right' }}>Ay Sonu Stok / Fire</th>
                        <th style={{ padding:'12px', textAlign:'right' }}>Detay</th>
                    </tr>
                </thead>
                <tbody>
                    {ayVerileri.map((a, i) => {
                        const gercekAyIdx = (baslangicAyi + i) % 12;
                        const isOpen = acikAylar[i];
                        let toplamSatis = 0; musteriler.forEach(m => { toplamSatis += (a.musteriler?.[m.id]?.miktar || 0); });
                        
                        return (
                            <React.Fragment key={i}>
                                <tr style={{ background:'var(--surface)', cursor:'pointer', borderBottom:'1px solid var(--surface-container)' }} onClick={() => setAcikAylar(p => ({ ...p, [i]: !p[i] }))}>
                                    <td style={{ padding:'14px', fontWeight:600 }}>{isOpen ? '▼' : '▶'} {AYLAR[gercekAyIdx]}</td>
                                    <td style={{ padding:'14px', textAlign:'right', fontWeight:700 }}>{fmt(toplamSatis)} T</td>
                                    <td style={{ padding:'14px', textAlign:'right', color: a.fireAktif ? 'var(--error)' : 'var(--on-surface-variant)' }}>
                                        {a.fireAktif ? `%${a.fireYuzde} Fire` : 'Firesiz'}
                                    </td>
                                    <td style={{ padding:'14px', textAlign:'right', color:'var(--enba-orange)' }}>Genişlet</td>
                                </tr>
                                {isOpen && (
                                    <tr>
                                        <td colSpan="4" style={{ padding:'16px', background:'var(--surface-container)' }}>
                                            <div style={{ background:'var(--surface-container-lowest)', padding:'20px', borderRadius:'1rem', marginBottom:'10px', display:'flex', gap:'20px', alignItems:'center', border:'1px solid var(--surface-container-highest)' }}>
                                                <div style={{ fontWeight:700, fontSize:'13px', color:'var(--enba-dark)' }}>📐 Bu Ay İçin Fire Ayarı:</div>
                                                <label style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', fontWeight:500, cursor:'pointer' }}>
                                                    <input type="checkbox" checked={a.fireAktif} onChange={e => fireGuncelle(i, 'fireAktif', e.target.checked)} /> Fire Uygula
                                                </label>
                                                {a.fireAktif && (
                                                    <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                                                        <span style={{ fontSize:'12px', fontWeight:600 }}>Oran:</span>
                                                        <input 
                                                            type="number" 
                                                            value={a.fireYuzde || 0} 
                                                            onChange={e => fireGuncelle(i, 'fireYuzde', e.target.value)} 
                                                            style={{ width:'60px', padding:'6px', borderRadius:'4px', border:'1px solid #ccc' }} 
                                                            onFocus={window.selectOnFocus}
                                                        />
                                                        <span style={{ fontSize:'12px', fontWeight:600 }}>%</span>
                                                    </div>
                                                )}
                                            </div>

                                            <table style={{ width:'100%', borderCollapse:'collapse', background:'var(--surface-container-lowest)', borderRadius:'0.5rem', overflow:'hidden' }}>
                                                <thead>
                                                    <tr style={{ background:'rgba(0,0,0,0.05)' }}>
                                                        <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'12px', color:'var(--enba-dark)' }}>Müşteri</th>
                                                        <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'12px', color:'var(--enba-dark)' }}>Ürün / Model</th>
                                                        <th style={{ padding:'8px 12px', textAlign:'right', fontSize:'12px', color:'var(--enba-dark)' }}>Satış (T)</th>
                                                        <th style={{ padding:'8px 12px', textAlign:'right', fontSize:'12px', color:'var(--enba-dark)' }}>Birim Fiyat (₺)</th>
                                                        <th style={{ padding:'8px 12px', textAlign:'right', fontSize:'12px', color:'var(--enba-dark)' }}>Nakliye (₺)</th>
                                                        <th style={{ padding:'8px 12px', textAlign:'center', fontSize:'12px', color:'var(--enba-dark)' }}>İşlem</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {musteriler.map(m => {
                                                        const md = a.musteriler?.[m.id] || { miktar:'', fiyat:'', nakliye:'', urun:'' };
                                                        return (
                                                            <tr key={m.id} style={{ borderBottom:'1px solid var(--surface-container-highest)' }}>
                                                                <td style={{ padding:'8px 12px', fontWeight:700, color:'var(--enba-dark)' }}>{bolt}{m.ad}</td>
                                                                <td style={{ padding:'8px 12px' }}>
                                                                    <input type="text" placeholder="Örn: Granül" value={md.urun || ''} onChange={e => musteriGuncelle(i, m.id, 'urun', e.target.value)} style={{ width:'120px', padding:'6px', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                </td>
                                                                <td style={{ padding:'8px 12px', textAlign:'right' }}>
                                                                    <input type="number" value={md.miktar} onChange={e => musteriGuncelle(i, m.id, 'miktar', e.target.value)} style={{ width:'80px', padding:'6px', textAlign:'right', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                </td>
                                                                <td style={{ padding:'8px 12px', textAlign:'right' }}>
                                                                    <input type="number" value={md.fiyat} onChange={e => musteriGuncelle(i, m.id, 'fiyat', e.target.value)} style={{ width:'80px', padding:'6px', textAlign:'right', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                </td>
                                                                <td style={{ padding:'8px 12px', textAlign:'right' }}>
                                                                    <input type="number" value={md.nakliye} onChange={e => musteriGuncelle(i, m.id, 'nakliye', e.target.value)} style={{ width:'80px', padding:'6px', textAlign:'right', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                </td>
                                                                <td style={{ padding:'8px 12px', textAlign:'center' }}>
                                                                    <button onClick={() => musteriSonrakiAylara(i, m.id)} style={{ fontSize:'10px', background:'var(--enba-dark)', color:'#fff', border:'none', padding:'4px 8px', borderRadius:'4px', cursor:'pointer' }}>⬇ Takip Edenlere Kopyala</button>
                                                                </td>
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

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'24px' }}>
                <button onClick={() => setAdim(1)} style={{ padding:'12px 24px', background:'var(--surface-container-high)', color:'var(--on-surface-variant)', border:'none', borderRadius:'2rem', fontWeight:600, cursor:'pointer' }}>← Geri: Tedarik</button>
                <button onClick={() => setAdim(3)} style={{ padding:'12px 24px', background:'var(--enba-orange)', color:'#fff', border:'none', borderRadius:'2rem', fontWeight:700, cursor:'pointer' }}>Sonraki: Operasyon & Makinalar →</button>
            </div>
        </div>
    );
};