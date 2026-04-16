/**
 * Enba Similasyon - Detaylı Wizard Adım 1: Tedarikçi Yönetimi
 */

window.DetStep1_Suppliers = function DetStep1_Suppliers({
    planAdi, setPlanAdi,
    baslangicYili, setBaslangicYili,
    baslangicAyi, setBaslangicAyi,
    tedarikciler, setTedarikciler,
    yeniTedarikci, setYeniTedarikci,
    topluTedarikler, guncelleTopluTedarik, uygulaTopluTedarik, tumTedarikVerileriniTemizle,
    ayVerileri, acikAylar, setAcikAylar, tedarikGuncelle, tedarikSonrakiAylara, fmt, AYLAR, setAdim
}) {
    return (
        <div>
            <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
                <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'16px', color:'var(--enba-dark)', margin:'0 0 20px' }}>Genel Ayarlar</h2>
                <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' }}>
                    <div style={{flex:1, minWidth:'200px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Plan Adı</label>
                        <input type='text' value={planAdi} onChange={e => setPlanAdi(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div style={{width:'120px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Başlangıç Yılı</label>
                        <input type='number' value={baslangicYili} onChange={e => setBaslangicYili(Number(e.target.value))} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div style={{width:'150px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Başlangıç Ayı</label>
                        <select value={baslangicAyi} onChange={e => setBaslangicAyi(Number(e.target.value))} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }}>
                            {AYLAR.map((ay, idx) => <option key={idx} value={idx}>{ay}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
                <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'16px', color:'var(--enba-dark)', margin:'0 0 20px' }}>1. Tedarikçi Yönetimi</h2>
                <div style={{ display:'flex', gap:'12px', marginBottom:'16px' }}>
                    <input type='text' value={yeniTedarikci} onChange={e => setYeniTedarikci(e.target.value)} placeholder='Yeni tedarikçi adı...' style={{ flex:1, maxWidth:'300px', padding:'10px 14px', borderRadius:'0.75rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    <button onClick={() => { if(yeniTedarikci.trim()){ setTedarikciler(p => [...p, { id: Date.now(), ad: yeniTedarikci.trim() }]); setYeniTedarikci(''); } }} style={{ background:'var(--enba-dark)', color:'#fff', border:'none', padding:'0 20px', borderRadius:'0.75rem', cursor:'pointer' }}>+ Ekle</button>
                </div>
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'24px' }}>
                    {tedarikciler.map(t => (
                        <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'8px', background:'var(--surface-container-low)', padding:'6px 14px', borderRadius:'2rem', border:'1px solid var(--surface-container-highest)' }}>
                            <input type="text" value={t.ad || ''} onChange={e => setTedarikciler(p => p.map(x => x.id === t.id ? { ...x, ad: e.target.value } : x))} style={{ fontWeight:600, border:'1px solid var(--surface-container-highest)', background:'var(--surface-container-lowest)', outline:'none', padding:'4px 10px', borderRadius:'0.5rem', width: '150px', color:'var(--enba-dark)' }} onFocus={window.selectOnFocus} />
                            {tedarikciler.length > 1 && <button onClick={() => setTedarikciler(p => p.filter(x => x.id !== t.id))} style={{ background:'none', border:'none', color:'var(--error)', cursor:'pointer', fontWeight:800, padding:'4px' }}>✖</button>}
                        </div>
                    ))}
                </div>

                <div style={{ padding:'16px', background:'var(--enba-dark)', color:'#fff', borderRadius:'1rem', marginBottom:'24px' }}>
                    <h3 style={{ fontSize:'14px', margin:'0 0 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span>⚡ Tek Seferde Tüm Aylara Veri Gir (Toplu Doldurma)</span>
                        <button onClick={tumTedarikVerileriniTemizle} style={{ background:'var(--error)', color:'#fff', border:'none', padding:'6px 12px', borderRadius:'0.5rem', cursor:'pointer', fontWeight:600, fontSize:'12px' }}>⚡ ️ Tüm İçeriği Temizle</button>
                    </h3>
                    <table style={{width:'100%', borderCollapse:'collapse', background:'var(--enba-dark-light)', borderRadius:'0.5rem', overflow:'hidden'}}>
                        <thead style={{ background:'rgba(0,0,0,0.3)' }}>
                            <tr>
                                <th style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, fontSize:'12px', color:'#fff' }}>Tedarikçi Adı</th>
                                <th style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, fontSize:'12px', color:'#fff' }}>Ürün (Örn: Pet)</th>
                                <th style={{ padding:'10px 12px', textAlign:'right', fontWeight:600, fontSize:'12px', color:'#fff' }}>Aylık Mikt. (T)</th>
                                <th style={{ padding:'10px 12px', textAlign:'right', fontWeight:600, fontSize:'12px', color:'#fff' }}>Alış Fiyatı (₺/T)</th>
                                <th style={{ padding:'10px 12px', textAlign:'right', fontWeight:600, fontSize:'12px', color:'#fff' }}>Nakliye (₺/T)</th>
                                <th style={{ padding:'10px 12px', textAlign:'center', fontWeight:600, fontSize:'12px', color:'#F59E0B' }}>⏳ Başlangıç Ayı</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tedarikciler.map(t => {
                                const td = topluTedarikler[t.id] || { miktar:'', fiyat:'', nakliye:'', urun:'' };
                                return (
                                    <tr key={t.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding:'12px', fontWeight:600 }}>{t.ad}</td>
                                        <td style={{ padding:'8px 12px' }}>
                                            <input type="text" placeholder="Örn: Hurda" value={td.urun || ''} onChange={e => guncelleTopluTedarik(t.id, 'urun', e.target.value)} style={{ padding:'8px', width:'100%', borderRadius:'0.5rem', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)', color:'#fff' }} onFocus={window.selectOnFocus} />
                                        </td>
                                        <td style={{ padding:'8px 12px' }}>
                                            <input type="number" placeholder="Miktar" value={td.miktar} onChange={e => guncelleTopluTedarik(t.id, 'miktar', e.target.value)} style={{ padding:'8px', width:'100%', textAlign:'right', borderRadius:'0.5rem', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)', color:'#fff' }} onFocus={window.selectOnFocus} />
                                        </td>
                                        <td style={{ padding:'8px 12px' }}>
                                            <input type="number" placeholder="Fiyat" value={td.fiyat} onChange={e => guncelleTopluTedarik(t.id, 'fiyat', e.target.value)} style={{ padding:'8px', width:'100%', textAlign:'right', borderRadius:'0.5rem', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)', color:'#fff' }} onFocus={window.selectOnFocus} />
                                        </td>
                                        <td style={{ padding:'8px 12px' }}>
                                            <input type="number" placeholder="Nakliye" value={td.nakliye} onChange={e => guncelleTopluTedarik(t.id, 'nakliye', e.target.value)} style={{ padding:'8px', width:'100%', textAlign:'right', borderRadius:'0.5rem', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)', color:'#fff' }} onFocus={window.selectOnFocus} />
                                        </td>
                                        <td style={{ padding:'8px 12px', textAlign:'center' }}>
                                            <select value={td.baslangicAy || 0} onChange={e => guncelleTopluTedarik(t.id, 'baslangicAy', Number(e.target.value))} style={{ padding:'6px 8px', borderRadius:'0.5rem', border:'1px solid rgba(245,158,11,0.4)', background:'rgba(245,158,11,0.08)', color:'#F59E0B', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
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
                        <button onClick={uygulaTopluTedarik} style={{ background:'var(--enba-orange)', color:'#fff', border:'none', padding:'12px 24px', borderRadius:'2rem', cursor:'pointer', fontWeight:800, fontSize:'14px', boxShadow:'0 4px 6px rgba(0,0,0,0.2)' }}>Tüm Aylara Uygula</button>
                    </div>
                </div>

                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                    <thead>
                        <tr style={{ background:'var(--primary-container)' }}>
                            <th style={{ padding:'12px', textAlign:'left' }}>Ay</th>
                            <th style={{ padding:'12px', textAlign:'right' }}>Toplam Alış Tonajı</th>
                            <th style={{ padding:'12px', textAlign:'right' }}>Detay</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ayVerileri.map((a, i) => {
                            const gercekAyIdx = (baslangicAyi + i) % 12;
                            const isOpen = acikAylar[i];
                            let ayTon = 0; tedarikciler.forEach(t => { ayTon += (a.tedarikler?.[t.id]?.miktar || 0); });
                            return (
                                <React.Fragment key={i}>
                                    <tr style={{ background:'var(--surface)', cursor:'pointer', borderBottom:'1px solid var(--surface-container)' }} onClick={() => setAcikAylar(p => ({ ...p, [i]: !p[i] }))}>
                                        <td style={{ padding:'14px', fontWeight:600 }}>{isOpen ? '▼' : '▶'} {AYLAR[gercekAyIdx]}</td>
                                        <td style={{ padding:'14px', textAlign:'right', fontWeight:700 }}>{fmt(ayTon)} T</td>
                                        <td style={{ padding:'14px', textAlign:'right', color:'var(--enba-orange)' }}>Genişlet</td>
                                    </tr>
                                    {isOpen && (
                                        <tr>
                                            <td colSpan="3" style={{ padding:'16px', background:'var(--surface-container)' }}>
                                                <table style={{ width:'100%', borderCollapse:'collapse', background:'var(--surface-container-lowest)', borderRadius:'0.5rem', overflow:'hidden' }}>
                                                    <thead>
                                                        <tr style={{ background:'rgba(0,0,0,0.05)' }}>
                                                            <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'12px', color:'var(--enba-dark)' }}>Tedarikçi</th>
                                                            <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'12px', color:'var(--enba-dark)' }}>Açıklama / Ürün</th>
                                                            <th style={{ padding:'8px 12px', textAlign:'right', fontSize:'12px', color:'var(--enba-dark)' }}>Miktar (T)</th>
                                                            <th style={{ padding:'8px 12px', textAlign:'right', fontSize:'12px', color:'var(--enba-dark)' }}>Alış Fiy. (₺)</th>
                                                            <th style={{ padding:'8px 12px', textAlign:'right', fontSize:'12px', color:'var(--enba-dark)' }}>Nakliye (₺)</th>
                                                            <th style={{ padding:'8px 12px', textAlign:'center', fontSize:'12px', color:'var(--enba-dark)' }}>İşlem</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {tedarikciler.map(t => {
                                                            const td = a.tedarikler?.[t.id] || { miktar:'', fiyat:'', nakliye:'', urun:'' };
                                                            return (
                                                                <tr key={t.id} style={{ borderBottom:'1px solid var(--surface-container-highest)' }}>
                                                                    <td style={{ padding:'8px 12px', fontWeight:700, color:'var(--enba-dark)' }}>⚡  {t.ad}</td>
                                                                    <td style={{ padding:'8px 12px' }}>
                                                                        <input type="text" placeholder="Örn: Hurda Karton" value={td.urun || ''} onChange={e => tedarikGuncelle(i, t.id, 'urun', e.target.value)} style={{ width:'120px', padding:'6px', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                    </td>
                                                                    <td style={{ padding:'8px 12px', textAlign:'right' }}>
                                                                        <input type="number" value={td.miktar} onChange={e => tedarikGuncelle(i, t.id, 'miktar', e.target.value)} style={{ width:'80px', padding:'6px', textAlign:'right', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                    </td>
                                                                    <td style={{ padding:'8px 12px', textAlign:'right' }}>
                                                                        <input type="number" value={td.fiyat} onChange={e => tedarikGuncelle(i, t.id, 'fiyat', e.target.value)} style={{ width:'80px', padding:'6px', textAlign:'right', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                    </td>
                                                                    <td style={{ padding:'8px 12px', textAlign:'right' }}>
                                                                        <input type="number" value={td.nakliye} onChange={e => tedarikGuncelle(i, t.id, 'nakliye', e.target.value)} style={{ width:'80px', padding:'6px', textAlign:'right', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                    </td>
                                                                    <td style={{ padding:'8px 12px', textAlign:'center' }}>
                                                                        <button onClick={() => tedarikSonrakiAylara(i, t.id)} style={{ fontSize:'10px', background:'var(--enba-dark)', color:'#fff', border:'none', padding:'4px 8px', borderRadius:'4px', cursor:'pointer' }}>⬇ Takip Edenlere Kopyala</button>
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
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'20px' }}>
                <button onClick={() => setAdim(2)} style={{ padding:'12px 24px', background:'var(--enba-orange)', color:'#fff', border:'none', borderRadius:'2rem', fontWeight:700, cursor:'pointer' }}>Sonraki: Müşteri (Satış) Planı →</button>
            </div>
        </div>
    );
};

