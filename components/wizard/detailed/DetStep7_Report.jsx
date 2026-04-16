/**
 * Enba Similasyon - Detaylı Wizard Adım 7: Finansal Rapor ve Projeksiyonlar
 */

window.DetStep7_Report = function DetStep7_Report({
    yilOzet, fmt, renk, arka, plTableRef,
    hesaplanmisAyVerileri, aylikSonuclar, AYLAR, baslangicAyi,
    gecerliGiderler, ACILIR_KODLAR, altGiderKalemleri,
    aylikAmortismanlar, yillikAmortismanToplam,
    tonajBuyume, setTonajBuyume,
    fiyatBuyume, setFiyatBuyume,
    sabitMaliyet, setSabitMaliyet,
    degiskenMaliyet, setDegiskenMaliyet,
    projeksiyon,
    excelExport, detayliPdfExport,
    setAdim
}) {
    return (
        <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'16px', marginBottom:'24px' }}>
                {[
                    { label:'Yıllık Gelir', value: fmt(yilOzet.gelir) + ' ₺', color:'var(--enba-orange-dark)', bg:'#f0fce6' },
                    { label:'Yıllık OPEX', value: fmt(yilOzet.opex) + ' ₺', color:'var(--error)', bg:'var(--error-container)' },
                    { label:'Yıllık EBITDA', value: fmt(yilOzet.ebitda) + ' ₺', color: renk(yilOzet.ebitda), bg: arka(yilOzet.ebitda) },
                    { label:'Yıllık Amortisman', value: fmt(yilOzet.amortisman) + ' ₺', color:'var(--on-surface-variant)', bg:'var(--surface-container-low)' },
                    { label:'Yıllık Net Kâr', value: fmt(yilOzet.net) + ' ₺', color: renk(yilOzet.net), bg: arka(yilOzet.net) },
                    { label:'Satış Tonajı', value: fmt(yilOzet.toplamSatisTon) + ' T', color:'var(--enba-dark)', bg:'var(--surface-container-low)' },
                ].map(k => (
                    <div key={k.label} style={{ background: k.bg, padding:'20px', borderRadius:'1rem' }}>
                        <div style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', textTransform:'uppercase', display:'block', marginBottom:'8px' }}>{k.label}</div>
                        <div style={{ fontSize:'20px', fontWeight:800, fontFamily:"'Manrope', sans-serif", color: k.color }}>{k.value}</div>
                    </div>
                ))}
            </div>

            {/* ===== DETAYLI AYLIK P&L TABLOSU ===== */}
            <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
                    <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'16px', color:'var(--enba-dark)', margin:0 }}>
                        ⚡  Detaylı Aylık P&L Tablosu — Tüm Kodlar
                    </h2>
                    <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center' }}>
                        <span style={{ fontSize:'11px', color:'var(--on-surface-variant)', fontWeight:600, background:'var(--surface-container-low)', padding:'6px 14px', borderRadius:'2rem' }}>
                            Tüm tutarlar ₺
                        </span>
                        <button onClick={excelExport} style={{ display:'flex', alignItems:'center', gap:'8px', background:'#1a7f4b', color:'#fff', border:'none', padding:'9px 18px', borderRadius:'2rem', cursor:'pointer', fontWeight:700, fontSize:'13px', boxShadow:'0 3px 10px rgba(26,127,75,0.35)', transition:'all 0.2s' }}>
                            <span style={{fontSize:'16px'}}>⚡ </span> Excel'e Aktar
                        </button>
                        <button onClick={detayliPdfExport} style={{ display:'flex', alignItems:'center', gap:'8px', background:'#c0392b', color:'#fff', border:'none', padding:'9px 18px', borderRadius:'2rem', cursor:'pointer', fontWeight:700, fontSize:'13px', boxShadow:'0 3px 10px rgba(192,57,43,0.35)', transition:'all 0.2s' }}>
                            <span style={{fontSize:'16px'}}>⚡ </span> PDF'e Aktar
                        </button>
                    </div>
                </div>
                <div style={{ overflowX:'auto' }}>
                    <table ref={plTableRef} style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px', minWidth:'1200px' }}>
                        <thead>
                            <tr style={{ background:'linear-gradient(135deg, var(--primary-container), var(--primary))' }}>
                                <th style={{ padding:'12px 14px', textAlign:'left', color:'rgba(255,255,255,0.85)', fontWeight:700, fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', minWidth:'240px', position:'sticky', left:0, background:'var(--primary)', zIndex:2 }}>Gider Kodu / Kalem</th>
                                {Array.from({length:12}, (_,i) => { const ayIdx = (baslangicAyi + i) % 12; return (<th key={i} style={{ padding:'12px 10px', textAlign:'right', color:'rgba(255,255,255,0.75)', fontWeight:600, fontSize:'11px', minWidth:'90px' }}>{AYLAR[ayIdx]}</th>); })}
                                <th style={{ padding:'12px 14px', textAlign:'right', color:'#FFD700', fontWeight:800, fontSize:'11px', textTransform:'uppercase', minWidth:'110px', borderLeft:'2px solid rgba(255,255,255,0.2)' }}>TOPLAM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* GELİR */}
                            <tr style={{ background:'linear-gradient(90deg,#0a3d22,#0d5c2e)' }}><td colSpan={14} style={{ padding:'10px 14px', color:'#7fffb0', fontWeight:800, fontSize:'11px', textTransform:'uppercase', letterSpacing:'1.5px', position:'sticky', left:0, background:'linear-gradient(90deg,#0a3d22,#0d5c2e)' }}>▸ GELİR</td></tr>
                            <tr style={{ background:'#edfaf4' }}>
                                <td style={{ padding:'10px 14px', fontWeight:600, color:'var(--enba-dark)', borderBottom:'1px solid var(--surface-container)', position:'sticky', left:0, background:'#edfaf4', zIndex:1 }}>
                                    <span style={{ fontSize:'10px', fontWeight:700, marginRight:'8px', background:'#cde8d8', padding:'2px 6px', borderRadius:'4px' }}>TON</span>Alış Tonajı
                                </td>
                                {hesaplanmisAyVerileri.map((a,i) => (<td key={i} style={{ padding:'10px 8px', textAlign:'right', borderBottom:'1px solid var(--surface-container)', color:'var(--on-surface-variant)', fontFamily:'monospace' }}>{fmt(a.ayTon)}</td>))}
                                <td style={{ padding:'10px 14px', textAlign:'right', fontWeight:700, borderBottom:'1px solid var(--surface-container)', borderLeft:'2px solid var(--surface-container)', color:'var(--on-surface-variant)', fontFamily:'monospace' }}>{fmt(yilOzet.alisTon)}</td>
                            </tr>
                            <tr style={{ background:'#f5fdf8' }}>
                                <td style={{ padding:'10px 14px', fontWeight:600, color:'var(--enba-dark)', borderBottom:'1px solid var(--surface-container)', position:'sticky', left:0, background:'#f5fdf8', zIndex:1 }}>
                                    <span style={{ fontSize:'10px', fontWeight:700, marginRight:'8px', background:'#cde8d8', padding:'2px 6px', borderRadius:'4px' }}>TON</span>Satış Tonajı
                                </td>
                                {aylikSonuclar.map((s,i) => (<td key={i} style={{ padding:'10px 8px', textAlign:'right', borderBottom:'1px solid var(--surface-container)', color:'var(--on-surface-variant)', fontFamily:'monospace' }}>{fmt(s.toplamSatisTon)}</td>))}
                                <td style={{ padding:'10px 14px', textAlign:'right', fontWeight:700, borderBottom:'1px solid var(--surface-container)', borderLeft:'2px solid var(--surface-container)', color:'var(--on-surface-variant)', fontFamily:'monospace' }}>{fmt(yilOzet.toplamSatisTon)}</td>
                            </tr>
                            <tr style={{ background:'#d9f5e6' }}>
                                <td style={{ padding:'11px 14px', fontWeight:700, color:'var(--enba-orange-dark)', borderBottom:'2px solid #a5d6b7', position:'sticky', left:0, background:'#d9f5e6', zIndex:1 }}>
                                    <span style={{ fontSize:'10px', color:'#fff', fontWeight:700, marginRight:'8px', background:'var(--enba-orange-dark)', padding:'2px 6px', borderRadius:'4px' }}>109</span>MAL SATIŞ GELİRİ
                                </td>
                                {aylikSonuclar.map((s,i) => (<td key={i} style={{ padding:'11px 8px', textAlign:'right', borderBottom:'2px solid rgba(39,174,96,0.25)', color:'var(--enba-orange-dark)', fontWeight:700, fontFamily:'monospace' }}>{fmt(s.gelir)}</td>))}
                                <td style={{ padding:'11px 14px', textAlign:'right', fontWeight:800, borderBottom:'2px solid rgba(39,174,96,0.25)', borderLeft:'2px solid var(--surface-container)', color:'var(--enba-orange-dark)', fontFamily:'monospace', fontSize:'13px' }}>{fmt(yilOzet.gelir)}</td>
                            </tr>

                            {/* DOĞRUDAN MALİYETLER */}
                            <tr style={{ background:'linear-gradient(90deg,#2c1810,#3d2015)' }}><td colSpan={14} style={{ padding:'10px 14px', color:'#ffb380', fontWeight:800, fontSize:'11px', textTransform:'uppercase', letterSpacing:'1.5px', position:'sticky', left:0, background:'linear-gradient(90deg,#2c1810,#3d2015)' }}>▸ DOĞRUDAN MALİYETLER (Alım + Nakliye)</td></tr>
                            <tr style={{ background:'#fdf0ee' }}>
                                <td style={{ padding:'10px 14px', fontWeight:600, color:'var(--enba-dark)', borderBottom:'1px solid var(--surface-container)', position:'sticky', left:0, background:'#fdf0ee', zIndex:1 }}>
                                    <span style={{ fontSize:'10px', color:'#fff', fontWeight:700, marginRight:'8px', background:'#c0392b', padding:'2px 6px', borderRadius:'4px', fontFamily:'monospace' }}>305</span>Mal Ödemesi (Tedarikçi)
                                </td>
                                {aylikSonuclar.map((s,i) => (<td key={i} style={{ padding:'10px 8px', textAlign:'right', borderBottom:'1px solid var(--surface-container)', color:'var(--error)', fontFamily:'monospace' }}>{fmt(s.alisGideri)}</td>))}
                                <td style={{ padding:'10px 14px', textAlign:'right', fontWeight:700, borderBottom:'1px solid var(--surface-container)', borderLeft:'2px solid var(--surface-container)', color:'var(--error)', fontFamily:'monospace' }}>{fmt(yilOzet.alisGideri)}</td>
                            </tr>
                            <tr style={{ background:'#fff6f5' }}>
                                <td style={{ padding:'10px 14px', fontWeight:600, color:'var(--enba-dark)', borderBottom:'1px solid var(--surface-container)', position:'sticky', left:0, background:'#fff6f5', zIndex:1 }}>
                                    <span style={{ fontSize:'10px', color:'#fff', fontWeight:700, marginRight:'8px', background:'#c0392b', padding:'2px 6px', borderRadius:'4px', fontFamily:'monospace' }}>301</span>Alış Nakliye
                                </td>
                                {aylikSonuclar.map((s,i) => (<td key={i} style={{ padding:'10px 8px', textAlign:'right', borderBottom:'1px solid var(--surface-container)', color:'var(--error)', fontFamily:'monospace' }}>{fmt(s.alisNakliye)}</td>))}
                                <td style={{ padding:'10px 14px', textAlign:'right', fontWeight:700, borderBottom:'1px solid var(--surface-container)', borderLeft:'2px solid var(--surface-container)', color:'var(--error)', fontFamily:'monospace' }}>{fmt(yilOzet.alisNakliye)}</td>
                            </tr>
                            <tr style={{ background:'#fdf0ee' }}>
                                <td style={{ padding:'10px 14px', fontWeight:600, color:'var(--enba-dark)', borderBottom:'2px solid #e8b4ae', position:'sticky', left:0, background:'#fdf0ee', zIndex:1 }}>
                                    <span style={{ fontSize:'10px', color:'#fff', fontWeight:700, marginRight:'8px', background:'#c0392b', padding:'2px 6px', borderRadius:'4px', fontFamily:'monospace' }}>302</span>Satış Nakliye
                                </td>
                                {aylikSonuclar.map((s,i) => (<td key={i} style={{ padding:'10px 8px', textAlign:'right', borderBottom:'2px solid #e8b4ae', color:'var(--error)', fontFamily:'monospace' }}>{fmt(s.satisNakliye)}</td>))}
                                <td style={{ padding:'10px 14px', textAlign:'right', fontWeight:700, borderBottom:'2px solid #e8b4ae', borderLeft:'2px solid var(--surface-container)', color:'var(--error)', fontFamily:'monospace' }}>{fmt(yilOzet.satisNakliye)}</td>
                            </tr>

                            {/* DİĞER GİDER GRUPLARI */}
                            {(() => {
                                const gruplar = window.GIDER_GRUPLARI || [];
                                const giderler = window.SABLON_GIDERLER || [];
                                const haricKodlar = new Set(['305','301','302','109']);
                                const grupRenkleri = {
                                    G1: { bg:'#152b1e', text:'#80ffb0', rowBgA:'#eef8f2', rowBgB:'#f7fcf9' },
                                    G2: { bg:'#152233', text:'#80c8ff', rowBgA:'#eef4fb', rowBgB:'#f5f9fd' },
                                    G3: { bg:'#2a1a33', text:'#d4a0ff', rowBgA:'#f4eefa', rowBgB:'#faf6fd' },
                                    G4: { bg:'#33221a', text:'#ffd080', rowBgA:'#fdf4ea', rowBgB:'#fef9f3' },
                                    G5: { bg:'#152233', text:'#a0c4ff', rowBgA:'#eef4fb', rowBgB:'#f5f9fd' },
                                };
                                const rows = [];
                                gruplar.forEach(grp => {
                                    const grpGiderler = giderler.filter(g => g.grup === grp.id && !haricKodlar.has(g.kodu));
                                    if (!grpGiderler.length) return;
                                    const rk = grupRenkleri[grp.id] || { bg:'#1a2030', text:'#c0d0ff', rowBgA:'#eef0f8', rowBgB:'#f6f7fb' };
                                    rows.push(<tr key={'grp_'+grp.id} style={{ background:`linear-gradient(90deg,${rk.bg},${rk.bg}dd)` }}><td colSpan={14} style={{ padding:'10px 14px', color:rk.text, fontWeight:800, fontSize:'11px', textTransform:'uppercase', letterSpacing:'1.5px', position:'sticky', left:0, background:`linear-gradient(90deg,${rk.bg},${rk.bg}dd)` }}>▸ {grp.ad}</td></tr>);
                                    grpGiderler.forEach((g, gi) => {
                                        const isAcilir = ACILIR_KODLAR.includes(g.kodu);
                                        const altlar = isAcilir ? altGiderKalemleri.filter(k => k.parentKod === g.kodu) : [];
                                        const yillikToplam = isAcilir
                                            ? altlar.reduce((t, k) => t + hesaplanmisAyVerileri.reduce((s, a) => s + (Number(a.giderler?.[k.id]) || 0), 0), 0)
                                            : hesaplanmisAyVerileri.reduce((t,a) => t + (Number(a.giderler?.[g.kodu]) || 0), 0);
                                        const rowBg = gi % 2 === 0 ? rk.rowBgA : rk.rowBgB;
                                        rows.push(
                                            <tr key={g.kodu} style={{ background: rowBg }}>
                                                <td style={{ padding:'10px 14px', fontWeight:600, color:'var(--enba-dark)', borderBottom: isAcilir && altlar.length ? 'none' : '1px solid var(--surface-container)', position:'sticky', left:0, background: rowBg, zIndex:1 }}>
                                                    <span style={{ fontSize:'10px', color:'#fff', fontWeight:700, marginRight:'8px', background:'var(--enba-dark)', padding:'2px 6px', borderRadius:'4px', fontFamily:'monospace' }}>{g.kodu}</span>{g.adi}
                                                </td>
                                                {hesaplanmisAyVerileri.map((a,i) => {
                                                    const val = isAcilir
                                                        ? altlar.reduce((t,k) => t + (Number(a.giderler?.[k.id]) || 0), 0)
                                                        : Number(a.giderler?.[g.kodu]) || 0;
                                                    return (<td key={i} style={{ padding:'10px 8px', textAlign:'right', borderBottom: isAcilir && altlar.length ? 'none' : '1px solid var(--surface-container)', color: val > 0 ? 'var(--error)' : 'var(--on-surface-variant)', fontFamily:'monospace', opacity: val === 0 ? 0.3 : 1 }}>{val > 0 ? fmt(val) : '—'}</td>);
                                                })}
                                                <td style={{ padding:'10px 14px', textAlign:'right', fontWeight:700, borderBottom: isAcilir && altlar.length ? 'none' : '1px solid var(--surface-container)', borderLeft:'2px solid var(--surface-container)', color: yillikToplam > 0 ? 'var(--error)' : 'var(--on-surface-variant)', fontFamily:'monospace', opacity: yillikToplam === 0 ? 0.3 : 1 }}>{yillikToplam > 0 ? fmt(yillikToplam) : '—'}</td>
                                            </tr>
                                        );
                                        if (isAcilir && altlar.length > 0) {
                                            altlar.forEach((k, ki) => {
                                                const altYillik = hesaplanmisAyVerileri.reduce((t,a) => t + (Number(a.giderler?.[k.id]) || 0), 0);
                                                rows.push(
                                                    <tr key={k.id} style={{ background: rowBg }}>
                                                        <td style={{ padding:'6px 14px 6px 28px', color:'var(--on-surface-variant)', fontSize:'11px', borderBottom: ki === altlar.length-1 ? '1px solid var(--surface-container)' : 'none', position:'sticky', left:0, background: rowBg, zIndex:1 }}>└ {k.ad}</td>
                                                        {hesaplanmisAyVerileri.map((a,i) => { const v = Number(a.giderler?.[k.id]) || 0; return (<td key={i} style={{ padding:'6px 8px', textAlign:'right', borderBottom: ki === altlar.length-1 ? '1px solid var(--surface-container)' : 'none', color: v > 0 ? 'var(--error)' : 'var(--on-surface-variant)', fontFamily:'monospace', fontSize:'11px', opacity: v === 0 ? 0.3 : 1 }}>{v > 0 ? fmt(v) : '—'}</td>); })}
                                                        <td style={{ padding:'6px 14px', textAlign:'right', borderBottom: ki === altlar.length-1 ? '1px solid var(--surface-container)' : 'none', borderLeft:'2px solid var(--surface-container)', color: altYillik > 0 ? 'var(--error)' : 'var(--on-surface-variant)', fontFamily:'monospace', fontSize:'11px', opacity: altYillik === 0 ? 0.3 : 1 }}>{altYillik > 0 ? fmt(altYillik) : '—'}</td>
                                                    </tr>
                                                );
                                            });
                                        }
                                    });
                                });
                                return rows;
                            })()}

                            {/* ÖZET SATIRLAR */}
                            <tr style={{ background:'linear-gradient(90deg,#1a2035,#1f2840)' }}><td colSpan={14} style={{ padding:'10px 14px', color:'#a0c4ff', fontWeight:800, fontSize:'11px', textTransform:'uppercase', letterSpacing:'1.5px', position:'sticky', left:0, background:'linear-gradient(90deg,#1a2035,#1f2840)' }}>▸ ÖZET / KÂR-ZARAR</td></tr>
                            <tr style={{ background:'#fcecea' }}>
                                <td style={{ padding:'12px 14px', fontWeight:700, color:'var(--error)', borderBottom:'1px solid var(--surface-container)', position:'sticky', left:0, background:'#fcecea', zIndex:1, fontSize:'13px' }}>TOPLAM OPEX</td>
                                {aylikSonuclar.map((s,i) => (<td key={i} style={{ padding:'12px 8px', textAlign:'right', borderBottom:'1px solid var(--surface-container)', color:'var(--error)', fontWeight:700, fontFamily:'monospace' }}>{fmt(s.opex)}</td>))}
                                <td style={{ padding:'12px 14px', textAlign:'right', fontWeight:800, borderBottom:'1px solid var(--surface-container)', borderLeft:'2px solid var(--surface-container)', color:'var(--error)', fontFamily:'monospace', fontSize:'13px' }}>{fmt(yilOzet.opex)}</td>
                            </tr>
                            <tr style={{ background: yilOzet.ebitda >= 0 ? '#e6f7ed' : '#fcecea' }}>
                                <td style={{ padding:'13px 14px', fontWeight:800, color: yilOzet.ebitda >= 0 ? 'var(--enba-orange-dark)' : 'var(--error)', borderBottom:'2px solid var(--surface-container)', position:'sticky', left:0, background: yilOzet.ebitda >= 0 ? '#e6f7ed' : '#fcecea', zIndex:1, fontSize:'13px' }}>FAVÖK (EBITDA)</td>
                                {aylikSonuclar.map((s,i) => (<td key={i} style={{ padding:'13px 8px', textAlign:'right', borderBottom:'2px solid var(--surface-container)', color: s.ebitda >= 0 ? 'var(--enba-orange-dark)' : 'var(--error)', fontWeight:700, fontFamily:'monospace' }}>{fmt(s.ebitda)}</td>))}
                                <td style={{ padding:'13px 14px', textAlign:'right', fontWeight:800, borderBottom:'2px solid var(--surface-container)', borderLeft:'2px solid var(--surface-container)', color: yilOzet.ebitda >= 0 ? 'var(--enba-orange-dark)' : 'var(--error)', fontFamily:'monospace', fontSize:'14px' }}>{fmt(yilOzet.ebitda)}</td>
                            </tr>
                            <tr style={{ background:'#f5eefa' }}>
                                <td style={{ padding:'10px 14px', fontWeight:600, color:'var(--on-surface-variant)', borderBottom:'1px solid var(--surface-container)', position:'sticky', left:0, background:'#f5eefa', zIndex:1 }}>
                                    <span style={{ fontSize:'10px', color:'#fff', fontWeight:700, marginRight:'8px', background:'#8e44ad', padding:'2px 6px', borderRadius:'4px' }}>CAPEX</span>Amortisman
                                </td>
                                {aylikAmortismanlar.map((a,i) => (<td key={i} style={{ padding:'10px 8px', textAlign:'right', borderBottom:'1px solid var(--surface-container)', color:'#8e44ad', fontFamily:'monospace' }}>{fmt(Math.round(a))}</td>))}
                                <td style={{ padding:'10px 14px', textAlign:'right', fontWeight:700, borderBottom:'1px solid var(--surface-container)', borderLeft:'2px solid var(--surface-container)', color:'#8e44ad', fontFamily:'monospace' }}>{fmt(Math.round(yillikAmortismanToplam))}</td>
                            </tr>
                            <tr style={{ background: yilOzet.net >= 0 ? '#d2f0df' : '#f9d9d6' }}>
                                <td style={{ padding:'16px 14px', fontWeight:800, color: yilOzet.net >= 0 ? 'var(--enba-orange-dark)' : 'var(--error)', position:'sticky', left:0, background: yilOzet.net >= 0 ? '#d2f0df' : '#f9d9d6', zIndex:1, fontSize:'14px' }}>⚡  NET KÂR / ZARAR</td>
                                {aylikSonuclar.map((s,i) => { const netAy = s.ebitda - aylikAmortismanlar[i]; return (<td key={i} style={{ padding:'16px 8px', textAlign:'right', color: netAy >= 0 ? 'var(--enba-orange-dark)' : 'var(--error)', fontWeight:800, fontFamily:'monospace', fontSize:'13px' }}>{fmt(netAy)}</td>); })}
                                <td style={{ padding:'16px 14px', textAlign:'right', fontWeight:900, borderLeft:'2px solid var(--surface-container)', color: yilOzet.net >= 0 ? 'var(--enba-orange-dark)' : 'var(--error)', fontFamily:'monospace', fontSize:'16px' }}>{fmt(yilOzet.net)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ===== 5 YILLIK PROJEKSİYON ===== */}
            <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
                <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'16px', color:'var(--enba-dark)', margin:'0 0 20px' }}>5 Yıllık Projeksiyon</h2>
                
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px', marginBottom:'24px' }}>
                    {[
                        { label:'Yıllık Tonaj Büyüme Oranı (%)', val: tonajBuyume, set: setTonajBuyume },
                        { label:'Yıllık Satış Fiyat Artışı (%)', val: fiyatBuyume, set: setFiyatBuyume },
                        { label:'Sabit Gider Enflasyonu (%)', val: sabitMaliyet, set: setSabitMaliyet },
                        { label:'Değişken Gider Enflasyonu (%)', val: degiskenMaliyet, set: setDegiskenMaliyet },
                    ].map(p => (
                        <div key={p.label}>
                            <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>{p.label}</label>
                            <input type='number' step='0.5' value={p.val} onChange={e => p.set(Number(e.target.value))} style={{ width:'100%', padding:'12px 14px', borderRadius:'0.75rem', border:'1px solid var(--surface-container-highest)', outline:'none', boxSizing:'border-box' }} onFocus={window.selectOnFocus} />
                        </div>
                    ))}
                </div>

                <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'700px', fontSize:'14px' }}>
                        <thead>
                            <tr style={{ background:'linear-gradient(135deg, var(--primary-container), var(--primary))' }}>
                                {['Yıl','Satış Tonajı','Gelir','OPEX','EBITDA','Amortisman','Net Kâr'].map(h => (
                                    <th key={h} style={{ padding:'14px 16px', color:'rgba(255,255,255,0.7)', fontWeight:600, fontSize:'11px', textTransform:'uppercase', textAlign: h === 'Yıl' ? 'left' : 'right' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {projeksiyon.map((p, i) => {
                                const bg = i % 2 === 0 ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)';
                                return (
                                    <tr key={p.yil} style={{ background: bg }}>
                                        <td style={{ padding:'16px', fontFamily:"'Manrope', sans-serif", fontWeight:800, fontSize:'18px', color:'var(--enba-dark)' }}>
                                            {p.yil} {i === 0 && <span style={{ fontSize:'10px', fontWeight:600, background:'var(--enba-orange)', color:'#fff', padding:'2px 8px', borderRadius:'2rem', marginLeft:'8px' }}>BAZ</span>}
                                        </td>
                                        <td style={{ padding:'16px', textAlign:'right', color:'var(--on-surface-variant)' }}>{fmt(p.satisTon)} T</td>
                                        <td style={{ padding:'16px', textAlign:'right', color:'var(--enba-orange-dark)', fontWeight:600 }}>{fmt(p.gelir)} ₺</td>
                                        <td style={{ padding:'16px', textAlign:'right', color:'var(--error)' }}>{fmt(p.opex)} ₺</td>
                                        <td style={{ padding:'16px', textAlign:'right', fontWeight:700, color: renk(p.ebitda) }}>{fmt(p.ebitda)} ₺</td>
                                        <td style={{ padding:'16px', textAlign:'right', color:'var(--on-surface-variant)' }}>{fmt(p.amortisman)} ₺</td>
                                        <td style={{ padding:'16px', textAlign:'right', fontWeight:800, fontSize:'16px', color: renk(p.net) }}>{fmt(p.net)} ₺</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', paddingBottom:'40px' }}>
                <button onClick={()=>setAdim(6)} style={{ padding:'12px 24px', background:'var(--surface-container-high)', border:'none', borderRadius:'2rem', fontWeight:700, cursor:'pointer' }}>← Geri</button>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={excelExport} style={{ display:'flex', alignItems:'center', gap:'8px', background:'#1a7f4b', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'2rem', cursor:'pointer', fontWeight:700, fontSize:'13px', boxShadow:'0 3px 10px rgba(26,127,75,0.35)' }}>
                        <span style={{fontSize:'16px'}}>⚡ </span> Excel'e Aktar
                    </button>
                    <button onClick={detayliPdfExport} style={{ display:'flex', alignItems:'center', gap:'8px', background:'#c0392b', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'2rem', cursor:'pointer', fontWeight:700, fontSize:'13px', boxShadow:'0 3px 10px rgba(192,57,43,0.35)' }}>
                        <span style={{fontSize:'16px'}}>⚡ </span> PDF'e Aktar
                    </button>
                </div>
            </div>
        </>
    );
};

