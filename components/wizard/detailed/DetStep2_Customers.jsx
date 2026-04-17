/**
 * Enba Similasyon - Detaylı Wizard Adım 2: Müşteri Yönetimi
 */

window.DetStep2_Customers = function DetStep2_Customers({
    musteriler, setMusteriler,
    yeniMusteri, setYeniMusteri,
    topluMusteriler, guncelleTopluMusteri, guncelleTopluMusteriUrun,
    guncelleTopluMusteriBaslangicAy, uygulaTopluMusteri,
    ayVerileri, acikAylar, setAcikAylar,
    musteriGuncelle, fmt, AYLAR,
    baslangicAyi, baslangicYili,
    topluFire, setTopluFire, uygulaTopluFire,
    hesaplanmisAyVerileri, fireGuncelle, musteriSonrakiAylara,
    musteriAyiTemizle, planOlcumBirimi,
    aylikSonuclar, aylikAmortismanlar,
    setAdim
}) {
    const wt = k => window.t('wizard.' + k);
    const birimEtiketi = planOlcumBirimi === 'kg' ? 'kg' : 'T';
    const tonToDisplay = (tons) => planOlcumBirimi === 'kg' ? (Number(tons) || 0) * 1000 : (Number(tons) || 0);
    const displayToTon = (val) => planOlcumBirimi === 'kg' ? Number(val) / 1000 : Number(val);
    const fiyatToDisplay = (f) => planOlcumBirimi === 'kg' ? (Number(f) || 0) / 1000 : (Number(f) || 0);
    const displayToFiyat = (v) => planOlcumBirimi === 'kg' ? Number(v) * 1000 : Number(v);
    const fiyatBirimi = planOlcumBirimi === 'kg' ? '₺/kg' : '₺/T';

    const ayBasliklari = Array.from({ length: 12 }, (_, i) => {
        const ayIdx = (baslangicAyi + i) % 12;
        const yil = baslangicYili + Math.floor((baslangicAyi + i) / 12);
        return { ayIdx, yil, label: AYLAR[ayIdx].slice(0, 3) + ' \'' + String(yil).slice(2) };
    });

    const COL1 = 175;
    const COL2 = 90;
    const DARK_BG = '#15222E';

    const stickyCell = (left, bg, extra) => ({
        position: 'sticky', left: left + 'px', background: bg, zIndex: 2, ...extra,
    });

    const numInput = (value, onChange, disabled) => (
        <input
            type="number"
            value={value}
            onChange={onChange}
            onFocus={window.selectOnFocus}
            disabled={disabled}
            style={{
                padding: '5px 6px', width: '66px', textAlign: 'right',
                borderRadius: '0.375rem',
                border: '1px solid rgba(255,255,255,0.18)',
                background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                color: disabled ? 'rgba(255,255,255,0.45)' : '#fff',
                fontSize: '12px', cursor: disabled ? 'not-allowed' : 'auto',
            }}
        />
    );

    // Per-month: available tonnage + cost per ton (uses data from earlier steps)
    const ayOzet = (aylikSonuclar || []).map((s, i) => {
        const ayData = hesaplanmisAyVerileri?.[i] || {};
        const fireOran = ayData.fireAktif ? (Number(ayData.fireYuzde) || 0) / 100 : 0;
        const satilabilecekTon = s.alisTon * (1 - fireOran);
        const amort = (aylikAmortismanlar || [])[i] || 0;
        const uretimMaliyeti = s.alisGideri + s.alisNakliye + s.digerOpex + amort;
        const tonBasiMaliyet = s.alisTon > 0 ? uretimMaliyeti / s.alisTon : 0;
        return { satilabilecekTon, tonBasiMaliyet, alisTon: s.alisTon };
    });

    const toplamSatilabilecek = ayOzet.reduce((t, a) => t + a.satilabilecekTon, 0);
    const yillikAlisTop = ayOzet.reduce((t, a) => t + a.alisTon, 0);
    const yillikMaliyetTop = (aylikSonuclar || []).reduce((t, s, i) => t + s.alisGideri + s.alisNakliye + s.digerOpex + ((aylikAmortismanlar || [])[i] || 0), 0);
    const yillikTonBasi = yillikAlisTop > 0 ? yillikMaliyetTop / yillikAlisTop : 0;

    const hasData = yillikAlisTop > 0;

    return (
        <div className="step-content">

            {/* ── Üretim & Maliyet Özeti ── */}
            {hasData && (
                <div style={{ background:'linear-gradient(135deg, #0f1e2e, #15222E)', borderRadius:'1.5rem', padding:'24px', boxShadow:'var(--shadow-card)', marginBottom:'24px', border:'1px solid rgba(255,255,255,0.07)' }}>
                    <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'15px', color:'#fff', margin:'0 0 16px', display:'flex', alignItems:'center', gap:'8px' }}>
                        📊 {wt('s2_monthly_table')}
                    </h2>

                    {/* Yıllık özet kartlar */}
                    <div style={{ display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap' }}>
                        <div style={{ flex:1, minWidth:'160px', background:'rgba(255,255,255,0.04)', borderRadius:'1rem', padding:'14px 16px', border:'1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:'6px' }}>{wt('s2_annual_available')}</div>
                            <div style={{ fontSize:'22px', fontWeight:800, color:'#34d399' }}>{fmt(tonToDisplay(toplamSatilabilecek))} <span style={{ fontSize:'13px', fontWeight:500 }}>{birimEtiketi}</span></div>
                        </div>
                        <div style={{ flex:1, minWidth:'160px', background:'rgba(255,255,255,0.04)', borderRadius:'1rem', padding:'14px 16px', border:'1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:'6px' }}>{wt('s2_avg_cost')}</div>
                            <div style={{ fontSize:'22px', fontWeight:800, color:'#fbbf24' }}>{fmt(fiyatToDisplay(yillikTonBasi))} <span style={{ fontSize:'13px', fontWeight:500 }}>{fiyatBirimi}</span></div>
                        </div>
                        <div style={{ flex:1, minWidth:'160px', background:'rgba(255,255,255,0.04)', borderRadius:'1rem', padding:'14px 16px', border:'1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:'6px' }}>{wt('s2_annual_purchase')}</div>
                            <div style={{ fontSize:'22px', fontWeight:800, color:'#60a5fa' }}>{fmt(tonToDisplay(yillikAlisTop))} <span style={{ fontSize:'13px', fontWeight:500 }}>{birimEtiketi}</span></div>
                        </div>
                    </div>

                    {/* Aylık tablo */}
                    <div style={{ overflowX:'auto' }}>
                        <table style={{ borderCollapse:'collapse', width:'100%', fontSize:'12px' }}>
                            <thead>
                                <tr style={{ background:'rgba(0,0,0,0.3)' }}>
                                    <th style={{ padding:'8px 12px', textAlign:'left', color:'rgba(255,255,255,0.6)', fontWeight:600 }}>{wt('month_col')}</th>
                                    <th style={{ padding:'8px 10px', textAlign:'right', color:'rgba(255,255,255,0.6)', fontWeight:600, whiteSpace:'nowrap' }}>{wt('s2_purchase_col')} ({birimEtiketi})</th>
                                    <th style={{ padding:'8px 10px', textAlign:'right', color:'#34d399', fontWeight:700, whiteSpace:'nowrap' }}>{wt('s2_available')} ({birimEtiketi})</th>
                                    <th style={{ padding:'8px 10px', textAlign:'right', color:'#fbbf24', fontWeight:700, whiteSpace:'nowrap' }}>{wt('s2_cost_per_ton')} ({fiyatBirimi})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ayOzet.map((o, i) => {
                                    const gercekAyIdx = (baslangicAyi + i) % 12;
                                    const yil = baslangicYili + Math.floor((baslangicAyi + i) / 12);
                                    return (
                                        <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                            <td style={{ padding:'7px 12px', color:'rgba(255,255,255,0.7)', fontWeight:500 }}>{AYLAR[gercekAyIdx]} {yil}</td>
                                            <td style={{ padding:'7px 10px', textAlign:'right', color:'rgba(255,255,255,0.6)' }}>{fmt(tonToDisplay(o.alisTon))}</td>
                                            <td style={{ padding:'7px 10px', textAlign:'right', color:'#34d399', fontWeight:700 }}>{fmt(tonToDisplay(o.satilabilecekTon))}</td>
                                            <td style={{ padding:'7px 10px', textAlign:'right', color:'#fbbf24', fontWeight:700 }}>{fmt(fiyatToDisplay(o.tonBasiMaliyet))}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Müşteri Listesi */}
            <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
                <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'16px', color:'var(--enba-dark)', margin:'0 0 20px' }}>{wt('s2_title')}</h2>
                <div style={{ display:'flex', gap:'12px', marginBottom:'16px' }}>
                    <input type='text' value={yeniMusteri} onChange={e => setYeniMusteri(e.target.value)} placeholder={wt('s2_new_placeholder')} style={{ flex:1, maxWidth:'300px', padding:'10px 14px', borderRadius:'0.75rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    <button onClick={() => { if(yeniMusteri.trim()){ setMusteriler(p => [...p, { id: Date.now(), ad: yeniMusteri.trim() }]); setYeniMusteri(''); } }} style={{ background:'var(--enba-dark)', color:'#fff', border:'none', padding:'0 20px', borderRadius:'0.75rem', cursor:'pointer' }}>+ Ekle</button>
                </div>
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                    {musteriler.map(m => (
                        <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'8px', background:'var(--surface-container-low)', padding:'6px 14px', borderRadius:'2rem', border:'1px solid var(--surface-container-highest)' }}>
                            <input type="text" value={m.ad || ''} onChange={e => setMusteriler(p => p.map(x => x.id === m.id ? { ...x, ad: e.target.value } : x))} style={{ fontWeight:600, border:'1px solid var(--surface-container-highest)', background:'var(--surface-container-lowest)', outline:'none', padding:'4px 10px', borderRadius:'0.5rem', width:'150px', color:'var(--enba-dark)' }} onFocus={window.selectOnFocus} />
                            {musteriler.length > 1 && <button onClick={() => setMusteriler(p => p.filter(x => x.id !== m.id))} style={{ background:'none', border:'none', color:'var(--error)', cursor:'pointer', fontWeight:800, padding:'4px' }}>✖</button>}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Toplu Veri Girişi ── */}
            <div style={{ padding:'20px', background: DARK_BG, color:'#fff', borderRadius:'1rem', marginBottom:'24px' }}>
                {/* Header row: title + fire */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px', gap:'16px', flexWrap:'wrap' }}>
                    <div>
                        <h3 style={{ fontSize:'14px', margin:'0 0 4px', fontFamily:"'Manrope', sans-serif", fontWeight:700 }}>{wt('bulk_title')}</h3>
                        <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)', margin:0 }}>{wt('bulk_desc')}</p>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.04)', padding:'10px 14px', borderRadius:'0.75rem', border:'1px solid rgba(245,158,11,0.2)', flexShrink:0 }}>
                        <span style={{ fontWeight:700, fontSize:'12px', color:'#F59E0B', display:'block', marginBottom:'8px' }}>⚡ Fire (Toplu)</span>
                        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                            <label style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', cursor:'pointer' }}>
                                <input type="checkbox" checked={topluFire.aktif} onChange={e => setTopluFire(p => ({ ...p, aktif: e.target.checked }))} /> Uygula
                            </label>
                            <input type="number" placeholder="%" value={topluFire.yuzde} onChange={e => setTopluFire(p => ({ ...p, yuzde: e.target.value }))} style={{ width:'52px', padding:'5px', borderRadius:'0.375rem', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.07)', color:'#fff', textAlign:'center', fontSize:'12px' }} onFocus={window.selectOnFocus} />
                            <button onClick={uygulaTopluFire} style={{ background:'#F59E0B', color:'#fff', border:'none', padding:'5px 10px', borderRadius:'0.375rem', cursor:'pointer', fontWeight:700, fontSize:'11px' }}>Uygula</button>
                        </div>
                    </div>
                </div>

                <div style={{ overflowX:'auto', borderRadius:'0.5rem' }}>
                    <table style={{ borderCollapse:'collapse', tableLayout:'fixed', minWidth: (COL1 + COL2 + 12 * 78) + 'px' }}>
                        <colgroup>
                            <col style={{ width: COL1 + 'px' }} />
                            <col style={{ width: COL2 + 'px' }} />
                            {ayBasliklari.map((_, i) => <col key={i} style={{ width:'78px' }} />)}
                        </colgroup>
                        <thead>
                            <tr style={{ background:'rgba(0,0,0,0.35)' }}>
                                <th style={stickyCell(0, 'rgba(15,25,35,0.98)', { padding:'10px 12px', textAlign:'left', fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.9)' })}>{wt('s2_customer_col')}</th>
                                <th style={stickyCell(COL1, 'rgba(15,25,35,0.98)', { padding:'10px 8px', textAlign:'left', fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.7)' })}>{wt('field_col')}</th>
                                {ayBasliklari.map((a, i) => (
                                    <th key={i} style={{ padding:'10px 4px', textAlign:'center', fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.8)', whiteSpace:'nowrap' }}>{a.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {musteriler.map((m, mIdx) => {
                                const mData = topluMusteriler[m.id] || {};
                                const baslangicAy = mData.baslangicAy || 0;
                                const rowBg = mIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.12)';
                                const stickyBg = mIdx % 2 === 0 ? 'rgba(19,30,42,0.97)' : 'rgba(14,23,33,0.97)';

                                const labelTd = (text) => (
                                    <td style={stickyCell(COL1, stickyBg, { padding:'7px 8px', fontSize:'11px', color:'rgba(255,255,255,0.85)', fontWeight:600, whiteSpace:'nowrap' })}>
                                        {text}
                                    </td>
                                );

                                const monthCells = (alan) => ayBasliklari.map((_, i) => {
                                    const disabled = i < baslangicAy;
                                    const isStart = i === baslangicAy;
                                    return (
                                        <td key={i} style={{ padding:'5px 4px', textAlign:'center', background: isStart ? 'rgba(227,82,5,0.08)' : undefined, borderLeft: isStart ? '2px solid rgba(227,82,5,0.5)' : undefined }}>
                                            {numInput(
                                                (mData[i] || {})[alan] || '',
                                                e => guncelleTopluMusteri(m.id, i, alan, e.target.value),
                                                disabled
                                            )}
                                        </td>
                                    );
                                });

                                return (
                                    <React.Fragment key={m.id}>
                                        <tr style={{ background: rowBg }}>
                                            <td rowSpan={3} style={stickyCell(0, stickyBg, { padding:'10px 12px', verticalAlign:'middle', borderRight:'1px solid rgba(255,255,255,0.08)', borderBottom:'2px solid rgba(255,255,255,0.1)' })}>
                                                <div style={{ fontWeight:700, fontSize:'13px', color:'#fff', marginBottom:'6px' }}>{m.ad}</div>
                                                <input type="text" placeholder="Ürün adı..." value={mData.urun || ''} onChange={e => guncelleTopluMusteriUrun(m.id, e.target.value)} onFocus={window.selectOnFocus} style={{ padding:'4px 8px', width:'100%', borderRadius:'0.375rem', border:'1px solid rgba(255,255,255,0.18)', background:'rgba(255,255,255,0.06)', color:'#fff', fontSize:'12px', marginBottom:'8px' }} />
                                                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                                                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.7)', fontWeight:600, whiteSpace:'nowrap' }}>{wt('start_month_short')}</span>
                                                    <select value={baslangicAy} onChange={e => guncelleTopluMusteriBaslangicAy(m.id, e.target.value)} style={{ flex:1, padding:'4px 6px', borderRadius:'0.375rem', border:'1px solid rgba(245,158,11,0.35)', background:'rgba(245,158,11,0.08)', color:'#F59E0B', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                                                        {ayBasliklari.map((a, i) => <option key={i} value={i}>{a.label}</option>)}
                                                    </select>
                                                </div>
                                            </td>
                                            {labelTd(`${wt('s1_quantity')} (${birimEtiketi})`)}
                                            {monthCells('miktar')}
                                        </tr>
                                        <tr style={{ background: rowBg }}>
                                            {labelTd(`${wt('s1_price')} (${fiyatBirimi})`)}
                                            {monthCells('fiyat')}
                                        </tr>
                                        <tr style={{ background: rowBg, borderBottom:'2px solid rgba(255,255,255,0.1)' }}>
                                            {labelTd(`${wt('s1_freight')} (${fiyatBirimi})`)}
                                            {monthCells('nakliye')}
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'16px' }}>
                    <button onClick={uygulaTopluMusteri} style={{ background:'var(--enba-orange)', color:'#fff', border:'none', padding:'12px 28px', borderRadius:'2rem', cursor:'pointer', fontWeight:800, fontSize:'14px', boxShadow:'0 4px 12px rgba(227,82,5,0.35)' }}>
                        {wt('apply_table')}
                    </button>
                </div>
            </div>

            {/* ── Aylık Detay Tablosu ── */}
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                <thead>
                    <tr style={{ background:'var(--primary-container)' }}>
                        <th style={{ padding:'12px', textAlign:'left' }}>{wt('month_col')}</th>
                        <th style={{ padding:'12px', textAlign:'right' }}>{wt('s2_total_sales')} ({birimEtiketi})</th>
                        <th style={{ padding:'12px', textAlign:'right' }}>{wt('s2_fire')}</th>
                        <th style={{ padding:'12px', textAlign:'right' }}>{wt('detail_col')}</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({length: 12}, (_, i) => {
                        const gercekAyIdx = (baslangicAyi + i) % 12;
                        const a = ayVerileri[gercekAyIdx] || { musteriler: {}, tedarikler: {}, giderler: {}, personeller: {} };
                        const isOpen = acikAylar[i];
                        let toplamSatisTon = 0; musteriler.forEach(m => { toplamSatisTon += (a.musteriler?.[m.id]?.miktar || 0); });
                        const toplamSatis = tonToDisplay(toplamSatisTon);

                        return (
                            <React.Fragment key={i}>
                                <tr style={{ background:'var(--surface)', cursor:'pointer', borderBottom:'1px solid var(--surface-container)' }} onClick={() => setAcikAylar(p => ({ ...p, [i]: !p[i] }))}>
                                    <td style={{ padding:'14px', fontWeight:600 }}>{isOpen ? '▼' : '▶'} {AYLAR[gercekAyIdx]}</td>
                                    <td style={{ padding:'14px', textAlign:'right', fontWeight:700 }}>{fmt(toplamSatis)} {birimEtiketi}</td>
                                    <td style={{ padding:'14px', textAlign:'right', color: a.fireAktif ? 'var(--error)' : 'var(--on-surface-variant)' }}>{a.fireAktif ? `%${a.fireYuzde} ${wt('s2_fire')}` : wt('s2_no_fire')}</td>
                                    <td style={{ padding:'14px', textAlign:'right', color:'var(--enba-orange-dark)' }}>{wt('expand')}</td>
                                </tr>
                                {isOpen && (
                                    <tr>
                                        <td colSpan="4" style={{ padding:'16px', background:'var(--surface-container)' }}>
                                            <div style={{ background:'var(--surface-container-lowest)', padding:'16px', borderRadius:'1rem', marginBottom:'10px', display:'flex', gap:'20px', alignItems:'center', border:'1px solid var(--surface-container-highest)', flexWrap:'wrap' }}>
                                                <div style={{ fontWeight:700, fontSize:'13px', color:'var(--enba-dark)' }}>📐 Bu Ay İçin Fire Ayarı:</div>
                                                <label style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', fontWeight:500, cursor:'pointer' }}>
                                                    <input type="checkbox" checked={a.fireAktif} onChange={e => fireGuncelle(gercekAyIdx, 'fireAktif', e.target.checked)} /> Fire Uygula
                                                </label>
                                                {a.fireAktif && (
                                                    <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                                                        <span style={{ fontSize:'12px', fontWeight:600 }}>Oran:</span>
                                                        <input type="number" value={a.fireYuzde || 0} onChange={e => fireGuncelle(gercekAyIdx, 'fireYuzde', e.target.value)} style={{ width:'60px', padding:'6px', borderRadius:'4px', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                        <span style={{ fontSize:'12px', fontWeight:600 }}>%</span>
                                                    </div>
                                                )}
                                            </div>

                                            <table style={{ width:'100%', borderCollapse:'collapse', background:'var(--surface-container-lowest)', borderRadius:'0.5rem', overflow:'hidden' }}>
                                                <thead>
                                                    <tr style={{ background:'rgba(0,0,0,0.05)' }}>
                                                        <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'12px', color:'var(--enba-dark)' }}>{wt('s2_customer_col')}</th>
                                                        <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'12px', color:'var(--enba-dark)' }}>{wt('s1_product_col')}</th>
                                                        <th style={{ padding:'8px 12px', textAlign:'right', fontSize:'12px', color:'var(--enba-dark)' }}>{wt('s2_total_sales')} ({birimEtiketi})</th>
                                                        <th style={{ padding:'8px 12px', textAlign:'right', fontSize:'12px', color:'var(--enba-dark)' }}>{wt('s1_price')} ({fiyatBirimi})</th>
                                                        <th style={{ padding:'8px 12px', textAlign:'right', fontSize:'12px', color:'var(--enba-dark)' }}>{wt('s1_freight')} ({fiyatBirimi})</th>
                                                        <th style={{ padding:'8px 12px', textAlign:'center', fontSize:'12px', color:'var(--enba-dark)' }}>{wt('operation_col')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {musteriler.map(m => {
                                                        const md = a.musteriler?.[m.id] || { miktar:'', fiyat:'', nakliye:'', urun:'' };
                                                        return (
                                                            <tr key={m.id} style={{ borderBottom:'1px solid var(--surface-container-highest)' }}>
                                                                <td style={{ padding:'8px 12px', fontWeight:700, color:'var(--enba-dark)' }}>⚡ {m.ad}</td>
                                                                <td style={{ padding:'8px 12px' }}>
                                                                    <input type="text" placeholder="Örn: Granül" value={md.urun || ''} onChange={e => musteriGuncelle(gercekAyIdx, m.id, 'urun', e.target.value)} style={{ width:'120px', padding:'6px', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                </td>
                                                                <td style={{ padding:'8px 12px', textAlign:'right' }}>
                                                                    <input type="number" value={md.miktar !== '' && md.miktar !== undefined ? tonToDisplay(md.miktar) : ''} onChange={e => musteriGuncelle(gercekAyIdx, m.id, 'miktar', displayToTon(e.target.value))} style={{ width:'80px', padding:'6px', textAlign:'right', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                </td>
                                                                <td style={{ padding:'8px 12px', textAlign:'right' }}>
                                                                    <input type="number" value={md.fiyat !== '' && md.fiyat !== undefined ? fiyatToDisplay(md.fiyat) : ''} onChange={e => musteriGuncelle(gercekAyIdx, m.id, 'fiyat', displayToFiyat(e.target.value))} style={{ width:'80px', padding:'6px', textAlign:'right', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                </td>
                                                                <td style={{ padding:'8px 12px', textAlign:'right' }}>
                                                                    <input type="number" value={md.nakliye !== '' && md.nakliye !== undefined ? fiyatToDisplay(md.nakliye) : ''} onChange={e => musteriGuncelle(gercekAyIdx, m.id, 'nakliye', displayToFiyat(e.target.value))} style={{ width:'80px', padding:'6px', textAlign:'right', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                </td>
                                                                <td style={{ padding:'8px 12px', textAlign:'center' }}>
                                                                    <button onClick={() => musteriSonrakiAylara(gercekAyIdx, m.id)} style={{ fontSize:'10px', background:'var(--enba-dark)', color:'#fff', border:'none', padding:'4px 8px', borderRadius:'4px', cursor:'pointer' }}>{wt('copy_forward')}</button>
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
                <button onClick={() => setAdim(5)} style={{ padding:'12px 24px', background:'var(--surface-container-high)', color:'var(--on-surface-variant)', border:'none', borderRadius:'2rem', fontWeight:600, cursor:'pointer' }}>{wt('s2_back')}</button>
                <button onClick={() => setAdim(7)} style={{ padding:'12px 24px', background:'var(--enba-orange)', color:'#fff', border:'none', borderRadius:'2rem', fontWeight:700, cursor:'pointer' }}>{wt('s2_next')}</button>
            </div>
        </div>
    );
};
