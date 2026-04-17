/**
 * Enba Similasyon - Detaylı Wizard Adım 1: Tedarikçi Yönetimi
 */

window.DetStep1_Suppliers = function DetStep1_Suppliers({
    planAdi, setPlanAdi,
    baslangicYili, setBaslangicYili,
    baslangicAyi, setBaslangicAyi,
    tedarikciler, setTedarikciler,
    yeniTedarikci, setYeniTedarikci,
    topluTedarikler, guncelleTopluTedarik, guncelleTopluTedarikUrun, uygulaTopluTedarik, tumTedarikVerileriniTemizle,
    ayVerileri, acikAylar, setAcikAylar, tedarikGuncelle, tedarikSonrakiAylara, fmt, AYLAR, setAdim
}) {
    // 12-month column headers starting from plan start date
    const ayBasliklari = Array.from({ length: 12 }, (_, i) => {
        const ayIdx = (baslangicAyi + i) % 12;
        const yil = baslangicYili + Math.floor((baslangicAyi + i) / 12);
        return { ayIdx, yil, label: AYLAR[ayIdx].slice(0, 3) + ' \'' + String(yil).slice(2) };
    });

    const COL1 = 170; // supplier name column width px
    const COL2 = 95;  // field label column width px

    const stickyCell = (left, bg, extra) => ({
        position: 'sticky',
        left: left + 'px',
        background: bg,
        zIndex: 2,
        ...extra,
    });

    const numInput = (value, onChange) => (
        <input
            type="number"
            value={value}
            onChange={onChange}
            onFocus={window.selectOnFocus}
            style={{
                padding: '5px 6px',
                width: '66px',
                textAlign: 'right',
                borderRadius: '0.375rem',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.07)',
                color: '#fff',
                fontSize: '12px',
            }}
        />
    );

    const DARK_BG = '#15222E';
    const ROW_EVEN = 'rgba(255,255,255,0.03)';
    const ROW_ODD  = 'rgba(0,0,0,0.12)';

    return (
        <div>
            {/* Genel Ayarlar */}
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

            {/* Tedarikçi Yönetimi */}
            <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
                <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'16px', color:'var(--enba-dark)', margin:'0 0 20px' }}>1. Tedarikçi Yönetimi</h2>

                {/* Add supplier */}
                <div style={{ display:'flex', gap:'12px', marginBottom:'16px' }}>
                    <input type='text' value={yeniTedarikci} onChange={e => setYeniTedarikci(e.target.value)} placeholder='Yeni tedarikçi adı...' style={{ flex:1, maxWidth:'300px', padding:'10px 14px', borderRadius:'0.75rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    <button onClick={() => { if(yeniTedarikci.trim()){ setTedarikciler(p => [...p, { id: Date.now(), ad: yeniTedarikci.trim() }]); setYeniTedarikci(''); } }} style={{ background:'var(--enba-dark)', color:'#fff', border:'none', padding:'0 20px', borderRadius:'0.75rem', cursor:'pointer' }}>+ Ekle</button>
                </div>
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'24px' }}>
                    {tedarikciler.map(t => (
                        <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'8px', background:'var(--surface-container-low)', padding:'6px 14px', borderRadius:'2rem', border:'1px solid var(--surface-container-highest)' }}>
                            <input type="text" value={t.ad || ''} onChange={e => setTedarikciler(p => p.map(x => x.id === t.id ? { ...x, ad: e.target.value } : x))} style={{ fontWeight:600, border:'1px solid var(--surface-container-highest)', background:'var(--surface-container-lowest)', outline:'none', padding:'4px 10px', borderRadius:'0.5rem', width:'150px', color:'var(--enba-dark)' }} onFocus={window.selectOnFocus} />
                            {tedarikciler.length > 1 && <button onClick={() => setTedarikciler(p => p.filter(x => x.id !== t.id))} style={{ background:'none', border:'none', color:'var(--error)', cursor:'pointer', fontWeight:800, padding:'4px' }}>✖</button>}
                        </div>
                    ))}
                </div>

                {/* ── Toplu Doldurma: Yatay 12 Ay Tablosu ── */}
                <div style={{ padding:'20px', background: DARK_BG, color:'#fff', borderRadius:'1rem', marginBottom:'24px' }}>
                    <h3 style={{ fontSize:'14px', margin:'0 0 16px', fontFamily:"'Manrope', sans-serif", fontWeight:700 }}>
                        ⚡ Tek Seferde Tüm Aylara Veri Gir (Toplu Doldurma)
                    </h3>

                    <div style={{ overflowX:'auto', borderRadius:'0.5rem' }}>
                        <table style={{ borderCollapse:'collapse', tableLayout:'fixed', minWidth: (COL1 + COL2 + 12 * 78) + 'px' }}>
                            <colgroup>
                                <col style={{ width: COL1 + 'px' }} />
                                <col style={{ width: COL2 + 'px' }} />
                                {ayBasliklari.map((_, i) => <col key={i} style={{ width:'78px' }} />)}
                            </colgroup>
                            <thead>
                                <tr style={{ background:'rgba(0,0,0,0.35)' }}>
                                    <th style={stickyCell(0, 'rgba(15,25,35,0.98)', { padding:'10px 12px', textAlign:'left', fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.9)' })}>Tedarikçi</th>
                                    <th style={stickyCell(COL1, 'rgba(15,25,35,0.98)', { padding:'10px 8px', textAlign:'left', fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.6)' })}>Alan</th>
                                    {ayBasliklari.map((a, i) => (
                                        <th key={i} style={{ padding:'10px 4px', textAlign:'center', fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.85)', whiteSpace:'nowrap' }}>
                                            {a.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tedarikciler.map((t, tIdx) => {
                                    const tData = topluTedarikler[t.id] || {};
                                    const rowBg = tIdx % 2 === 0 ? ROW_EVEN : ROW_ODD;
                                    const stickyBg = tIdx % 2 === 0 ? 'rgba(21,34,46,0.97)' : 'rgba(15,26,36,0.97)';
                                    const labelStyle = {
                                        padding:'8px 8px',
                                        fontSize:'11px',
                                        color:'rgba(255,255,255,0.55)',
                                        fontWeight:600,
                                        whiteSpace:'nowrap',
                                    };
                                    const cellStyle = { padding:'5px 4px', textAlign:'center' };

                                    return (
                                        <React.Fragment key={t.id}>
                                            {/* Row 1: supplier name (rowSpan=3) + Miktar */}
                                            <tr style={{ background: rowBg }}>
                                                <td rowSpan={3} style={stickyCell(0, stickyBg, {
                                                    padding:'10px 12px',
                                                    verticalAlign:'middle',
                                                    borderRight:'1px solid rgba(255,255,255,0.08)',
                                                    borderBottom:'2px solid rgba(255,255,255,0.12)',
                                                })}>
                                                    <div style={{ fontWeight:700, fontSize:'13px', marginBottom:'8px', color:'#fff' }}>{t.ad}</div>
                                                    <input
                                                        type="text"
                                                        placeholder="Ürün adı..."
                                                        value={tData.urun || ''}
                                                        onChange={e => guncelleTopluTedarikUrun(t.id, e.target.value)}
                                                        onFocus={window.selectOnFocus}
                                                        style={{ padding:'5px 8px', width:'100%', borderRadius:'0.375rem', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.07)', color:'#fff', fontSize:'12px' }}
                                                    />
                                                </td>
                                                <td style={stickyCell(COL1, stickyBg, labelStyle)}>Miktar (T)</td>
                                                {ayBasliklari.map((_, i) => (
                                                    <td key={i} style={cellStyle}>
                                                        {numInput(
                                                            (tData[i] || {}).miktar || '',
                                                            e => guncelleTopluTedarik(t.id, i, 'miktar', e.target.value)
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                            {/* Row 2: Alış Fiyatı */}
                                            <tr style={{ background: rowBg }}>
                                                <td style={stickyCell(COL1, stickyBg, labelStyle)}>Alış Fiy. (₺)</td>
                                                {ayBasliklari.map((_, i) => (
                                                    <td key={i} style={cellStyle}>
                                                        {numInput(
                                                            (tData[i] || {}).fiyat || '',
                                                            e => guncelleTopluTedarik(t.id, i, 'fiyat', e.target.value)
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                            {/* Row 3: Nakliye */}
                                            <tr style={{ background: rowBg, borderBottom:'2px solid rgba(255,255,255,0.1)' }}>
                                                <td style={stickyCell(COL1, stickyBg, { ...labelStyle, borderBottom:'2px solid rgba(255,255,255,0.1)' })}>Nakliye (₺)</td>
                                                {ayBasliklari.map((_, i) => (
                                                    <td key={i} style={{ ...cellStyle, borderBottom:'2px solid rgba(255,255,255,0.1)' }}>
                                                        {numInput(
                                                            (tData[i] || {}).nakliye || '',
                                                            e => guncelleTopluTedarik(t.id, i, 'nakliye', e.target.value)
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'16px', gap:'12px', flexWrap:'wrap' }}>
                        <button
                            onClick={tumTedarikVerileriniTemizle}
                            style={{ background:'rgba(220,53,69,0.15)', color:'#ff6b7a', border:'1px solid rgba(220,53,69,0.3)', padding:'8px 16px', borderRadius:'0.5rem', cursor:'pointer', fontWeight:600, fontSize:'12px' }}
                        >
                            🗑 Aylık Tabloyu Temizle
                        </button>
                        <button
                            onClick={uygulaTopluTedarik}
                            style={{ background:'var(--enba-orange)', color:'#fff', border:'none', padding:'12px 28px', borderRadius:'2rem', cursor:'pointer', fontWeight:800, fontSize:'14px', boxShadow:'0 4px 12px rgba(227,82,5,0.35)' }}
                        >
                            ✅ Aylık Tabloya Uygula
                        </button>
                    </div>
                </div>

                {/* ── Aylık Detay Tablosu ── */}
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
                                                                    <td style={{ padding:'8px 12px', fontWeight:700, color:'var(--enba-dark)' }}>⚡ {t.ad}</td>
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
