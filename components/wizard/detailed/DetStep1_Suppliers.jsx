/**
 * Enba Similasyon - Detaylı Wizard Adım 1: Tedarikçi Yönetimi
 */

window.DetStep1_Suppliers = function DetStep1_Suppliers({
    planAdi, setPlanAdi,
    baslangicYili, setBaslangicYili,
    baslangicAyi, setBaslangicAyi,
    tedarikciler, setTedarikciler,
    yeniTedarikci, setYeniTedarikci,
    topluTedarikler, guncelleTopluTedarik, guncelleTopluTedarikUrun,
    guncelleTopluTedarikBaslangicAy, uygulaTopluTedarik, tumTedarikVerileriniTemizle,
    ayVerileri, acikAylar, setAcikAylar, tedarikGuncelle, tedarikSonrakiAylara,
    planOlcumBirimi, fmt, AYLAR, setAdim
}) {
    const wt = k => window.t('wizard.' + k);
    const birimEtiketi = planOlcumBirimi === 'kg' ? 'kg' : 'T';
    // Convert stored-tons to display value and back
    const tonToDisplay = (tons) => planOlcumBirimi === 'kg' ? (Number(tons) || 0) * 1000 : (Number(tons) || 0);
    const displayToTon = (val) => planOlcumBirimi === 'kg' ? Number(val) / 1000 : Number(val);
    // 12-month column headers starting from plan start date
    const ayBasliklari = Array.from({ length: 12 }, (_, i) => {
        const ayIdx = (baslangicAyi + i) % 12;
        const yil = baslangicYili + Math.floor((baslangicAyi + i) / 12);
        return { ayIdx, yil, label: AYLAR[ayIdx].slice(0, 3) + ' \'' + String(yil).slice(2) };
    });

    const COL1 = 175; // supplier name + controls column
    const COL2 = 90;  // field label column

    const stickyCell = (left, bg, extra) => ({
        position: 'sticky', left: left + 'px', background: bg, zIndex: 2, ...extra,
    });

    const DARK_BG = '#15222E';

    const numInput = (value, onChange, disabled) => (
        <input
            type="number"
            value={value}
            onChange={onChange}
            onFocus={window.selectOnFocus}
            disabled={disabled}
            style={{
                padding: '5px 6px',
                width: '66px',
                textAlign: 'right',
                borderRadius: '0.375rem',
                border: '1px solid rgba(255,255,255,0.18)',
                background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                color: disabled ? 'rgba(255,255,255,0.2)' : '#fff',
                fontSize: '12px',
                cursor: disabled ? 'not-allowed' : 'auto',
            }}
        />
    );

    const [topluAcik, setTopluAcik] = React.useState(true);

    return (
        <div>
            {/* Genel Ayarlar */}
            <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
                <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'16px', color:'var(--enba-dark)', margin:'0 0 20px' }}>{wt('general_settings')}</h2>
                <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' }}>
                    <div style={{flex:1, minWidth:'200px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>{wt('plan_name')}</label>
                        <input type='text' value={planAdi} onChange={e => setPlanAdi(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div style={{width:'120px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>{wt('start_year')}</label>
                        <input type='number' value={baslangicYili} onChange={e => setBaslangicYili(Number(e.target.value))} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div style={{width:'150px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>{wt('start_month')}</label>
                        <select value={baslangicAyi} onChange={e => setBaslangicAyi(Number(e.target.value))} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }}>
                            {AYLAR.map((ay, idx) => <option key={idx} value={idx}>{ay}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tedarikçi Yönetimi */}
            <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
                <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'16px', color:'var(--enba-dark)', margin:'0 0 20px' }}>{wt('s1_title')}</h2>

                {/* Add supplier */}
                <div style={{ display:'flex', gap:'12px', marginBottom:'16px' }}>
                    <input type='text' value={yeniTedarikci} onChange={e => setYeniTedarikci(e.target.value)} placeholder={wt('s1_new_placeholder')} style={{ flex:1, maxWidth:'300px', padding:'10px 14px', borderRadius:'0.75rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
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
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: topluAcik ? '4px' : '0' }}>
                        <h3 style={{ fontSize:'14px', margin:0, fontFamily:"'Manrope', sans-serif", fontWeight:700 }}>
                            {wt('bulk_title')}
                        </h3>
                        <button onClick={() => setTopluAcik(p => !p)} style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.15)', padding:'5px 14px', borderRadius:'0.5rem', cursor:'pointer', fontSize:'12px', fontWeight:600 }}>
                            {topluAcik ? wt('hide') : wt('show')}
                        </button>
                    </div>
                    {topluAcik && <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', margin:'4px 0 16px' }}>{wt('bulk_desc')}</p>}
                    {topluAcik && <React.Fragment>

                    <div style={{ overflowX:'auto', borderRadius:'0.5rem' }}>
                        <table style={{ borderCollapse:'collapse', tableLayout:'fixed', minWidth: (COL1 + COL2 + 12 * 78) + 'px' }}>
                            <colgroup>
                                <col style={{ width: COL1 + 'px' }} />
                                <col style={{ width: COL2 + 'px' }} />
                                {ayBasliklari.map((_, i) => <col key={i} style={{ width:'78px' }} />)}
                            </colgroup>
                            <thead>
                                <tr style={{ background:'rgba(0,0,0,0.35)' }}>
                                    <th style={stickyCell(0, 'rgba(15,25,35,0.98)', { padding:'10px 12px', textAlign:'left', fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.85)' })}>
                                        {wt('s1_supplier_col')}
                                    </th>
                                    <th style={stickyCell(COL1, 'rgba(15,25,35,0.98)', { padding:'10px 8px', textAlign:'left', fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.55)' })}>
                                        {wt('field_col')}
                                    </th>
                                    {ayBasliklari.map((a, i) => (
                                        <th key={i} style={{ padding:'10px 4px', textAlign:'center', fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.8)', whiteSpace:'nowrap' }}>
                                            {a.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tedarikciler.map((t, tIdx) => {
                                    const tData = topluTedarikler[t.id] || {};
                                    const baslangicAy = tData.baslangicAy || 0;
                                    const rowBg = tIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.12)';
                                    const stickyBg = tIdx % 2 === 0 ? 'rgba(19,30,42,0.97)' : 'rgba(14,23,33,0.97)';

                                    const labelTd = (text) => (
                                        <td style={stickyCell(COL1, stickyBg, {
                                            padding:'7px 8px',
                                            fontSize:'11px',
                                            color:'rgba(255,255,255,0.5)',
                                            fontWeight:600,
                                            whiteSpace:'nowrap',
                                        })}>
                                            {text}
                                        </td>
                                    );

                                    const monthCells = (alan) => ayBasliklari.map((_, i) => {
                                        const disabled = i < baslangicAy;
                                        const isStart = i === baslangicAy;
                                        const topluVal = (tData[i] || {})[alan];
                                        const fallbackRaw = ayVerileri[(baslangicAyi + i) % 12]?.tedarikler?.[t.id]?.[alan];
                                        let displayVal = '';
                                        if (topluVal !== undefined && topluVal !== '') {
                                            displayVal = topluVal;
                                        } else if (fallbackRaw !== undefined && fallbackRaw !== '' && Number(fallbackRaw) !== 0) {
                                            displayVal = alan === 'miktar' ? tonToDisplay(fallbackRaw) : fallbackRaw;
                                        }
                                        return (
                                            <td key={i} style={{
                                                padding:'5px 4px',
                                                textAlign:'center',
                                                background: isStart ? 'rgba(227,82,5,0.08)' : undefined,
                                                borderLeft: isStart ? '2px solid rgba(227,82,5,0.5)' : undefined,
                                            }}>
                                                {numInput(
                                                    displayVal,
                                                    e => guncelleTopluTedarik(t.id, i, alan, e.target.value),
                                                    disabled
                                                )}
                                            </td>
                                        );
                                    });

                                    return (
                                        <React.Fragment key={t.id}>
                                            {/* Row 1: supplier info (rowSpan=3) + Miktar */}
                                            <tr style={{ background: rowBg }}>
                                                <td rowSpan={3} style={stickyCell(0, stickyBg, {
                                                    padding:'10px 12px',
                                                    verticalAlign:'middle',
                                                    borderRight:'1px solid rgba(255,255,255,0.08)',
                                                    borderBottom:'2px solid rgba(255,255,255,0.1)',
                                                })}>
                                                    <div style={{ fontWeight:700, fontSize:'13px', color:'#fff', marginBottom:'6px' }}>{t.ad}</div>
                                                    <input
                                                        type="text"
                                                        placeholder="Ürün adı..."
                                                        value={tData.urun || ayVerileri[0]?.tedarikler?.[t.id]?.urun || ''}
                                                        onChange={e => guncelleTopluTedarikUrun(t.id, e.target.value)}
                                                        onFocus={window.selectOnFocus}
                                                        style={{ padding:'4px 8px', width:'100%', borderRadius:'0.375rem', border:'1px solid rgba(255,255,255,0.18)', background:'rgba(255,255,255,0.06)', color:'#fff', fontSize:'12px', marginBottom:'8px' }}
                                                    />
                                                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                                                        <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', fontWeight:600, whiteSpace:'nowrap' }}>{wt('start_month_short')}</span>
                                                        <select
                                                            value={baslangicAy}
                                                            onChange={e => guncelleTopluTedarikBaslangicAy(t.id, e.target.value)}
                                                            style={{ flex:1, padding:'4px 6px', borderRadius:'0.375rem', border:'1px solid rgba(245,158,11,0.35)', background:'rgba(245,158,11,0.08)', color:'#F59E0B', fontSize:'11px', fontWeight:600, cursor:'pointer' }}
                                                        >
                                                            {ayBasliklari.map((a, i) => (
                                                                <option key={i} value={i}>{a.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </td>
                                                {labelTd(`${wt('s1_quantity')} (${birimEtiketi})`)}
                                                {monthCells('miktar')}
                                            </tr>
                                            {/* Row 2: Alış Fiyatı */}
                                            <tr style={{ background: rowBg }}>
                                                {labelTd(`${wt('s1_price')} (₺)`)}
                                                {monthCells('fiyat')}
                                            </tr>
                                            {/* Row 3: Nakliye */}
                                            <tr style={{ background: rowBg, borderBottom:'2px solid rgba(255,255,255,0.1)' }}>
                                                {labelTd(`${wt('s1_freight')} (₺)`)}
                                                {monthCells('nakliye')}
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
                            style={{ background:'rgba(220,53,69,0.12)', color:'#ff6b7a', border:'1px solid rgba(220,53,69,0.25)', padding:'8px 16px', borderRadius:'0.5rem', cursor:'pointer', fontWeight:600, fontSize:'12px' }}
                        >
                            {wt('clear_table')}
                        </button>
                        <button
                            onClick={uygulaTopluTedarik}
                            style={{ background:'var(--enba-orange)', color:'#fff', border:'none', padding:'12px 28px', borderRadius:'2rem', cursor:'pointer', fontWeight:800, fontSize:'14px', boxShadow:'0 4px 12px rgba(227,82,5,0.35)' }}
                        >
                            {wt('apply_table')}
                        </button>
                    </div>
                </React.Fragment>}
                </div>

                {/* ── Aylık Detay Tablosu ── */}
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                    <thead>
                        <tr style={{ background:'var(--primary-container)' }}>
                            <th style={{ padding:'12px', textAlign:'left' }}>{wt('month_col')}</th>
                            <th style={{ padding:'12px', textAlign:'right' }}>{wt('s1_total_purchase')}</th>
                            <th style={{ padding:'12px', textAlign:'right' }}>{wt('detail_col')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({length: 12}, (_, i) => {
                            const gercekAyIdx = (baslangicAyi + i) % 12;
                            const a = ayVerileri[gercekAyIdx] || { tedarikler: {}, musteriler: {}, giderler: {}, personeller: {} };
                            const isOpen = acikAylar[i];
                            let ayTon = 0; tedarikciler.forEach(t => { ayTon += (a.tedarikler?.[t.id]?.miktar || 0); });
                            const ayMiktar = tonToDisplay(ayTon);
                            return (
                                <React.Fragment key={i}>
                                    <tr style={{ background:'var(--surface)', cursor:'pointer', borderBottom:'1px solid var(--surface-container)' }} onClick={() => setAcikAylar(p => ({ ...p, [i]: !p[i] }))}>
                                        <td style={{ padding:'14px', fontWeight:600 }}>{isOpen ? '▼' : '▶'} {AYLAR[gercekAyIdx]}</td>
                                        <td style={{ padding:'14px', textAlign:'right', fontWeight:700 }}>{fmt(ayMiktar)} {birimEtiketi}</td>
                                        <td style={{ padding:'14px', textAlign:'right', color:'var(--enba-orange)' }}>{wt('expand')}</td>
                                    </tr>
                                    {isOpen && (
                                        <tr>
                                            <td colSpan="3" style={{ padding:'16px', background:'var(--surface-container)' }}>
                                                <table style={{ width:'100%', borderCollapse:'collapse', background:'var(--surface-container-lowest)', borderRadius:'0.5rem', overflow:'hidden' }}>
                                                    <thead>
                                                        <tr style={{ background:'rgba(0,0,0,0.05)' }}>
                                                            <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'12px', color:'var(--enba-dark)' }}>{wt('s1_supplier_col')}</th>
                                                            <th style={{ padding:'8px 12px', textAlign:'left', fontSize:'12px', color:'var(--enba-dark)' }}>{wt('s1_product_col')}</th>
                                                            <th style={{ padding:'8px 12px', textAlign:'right', fontSize:'12px', color:'var(--enba-dark)' }}>{wt('s1_quantity')} ({birimEtiketi})</th>
                                                            <th style={{ padding:'8px 12px', textAlign:'right', fontSize:'12px', color:'var(--enba-dark)' }}>{wt('s1_price')} (₺)</th>
                                                            <th style={{ padding:'8px 12px', textAlign:'right', fontSize:'12px', color:'var(--enba-dark)' }}>{wt('s1_freight')} (₺)</th>
                                                            <th style={{ padding:'8px 12px', textAlign:'center', fontSize:'12px', color:'var(--enba-dark)' }}>{wt('operation_col')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {tedarikciler.map(t => {
                                                            const td = a.tedarikler?.[t.id] || { miktar:'', fiyat:'', nakliye:'', urun:'' };
                                                            return (
                                                                <tr key={t.id} style={{ borderBottom:'1px solid var(--surface-container-highest)' }}>
                                                                    <td style={{ padding:'8px 12px', fontWeight:700, color:'var(--enba-dark)' }}>⚡ {t.ad}</td>
                                                                    <td style={{ padding:'8px 12px' }}>
                                                                        <input type="text" placeholder="Örn: Hurda Karton" value={td.urun || ''} onChange={e => tedarikGuncelle(gercekAyIdx, t.id, 'urun', e.target.value)} style={{ width:'120px', padding:'6px', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                    </td>
                                                                    <td style={{ padding:'8px 12px', textAlign:'right' }}>
                                                                        <input type="number" value={td.miktar !== '' && td.miktar !== undefined ? tonToDisplay(td.miktar) : ''} onChange={e => tedarikGuncelle(gercekAyIdx, t.id, 'miktar', displayToTon(e.target.value))} style={{ width:'80px', padding:'6px', textAlign:'right', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                    </td>
                                                                    <td style={{ padding:'8px 12px', textAlign:'right' }}>
                                                                        <input type="number" value={td.fiyat} onChange={e => tedarikGuncelle(gercekAyIdx, t.id, 'fiyat', e.target.value)} style={{ width:'80px', padding:'6px', textAlign:'right', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                    </td>
                                                                    <td style={{ padding:'8px 12px', textAlign:'right' }}>
                                                                        <input type="number" value={td.nakliye} onChange={e => tedarikGuncelle(gercekAyIdx, t.id, 'nakliye', e.target.value)} style={{ width:'80px', padding:'6px', textAlign:'right', borderRadius:'0.25rem', border:'1px solid #ccc' }} onFocus={window.selectOnFocus} />
                                                                    </td>
                                                                    <td style={{ padding:'8px 12px', textAlign:'center' }}>
                                                                        <button onClick={() => tedarikSonrakiAylara(gercekAyIdx, t.id)} style={{ fontSize:'10px', background:'var(--enba-dark)', color:'#fff', border:'none', padding:'4px 8px', borderRadius:'4px', cursor:'pointer' }}>{wt('copy_forward')}</button>
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

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'20px' }}>
                <button onClick={() => setAdim(1)} style={{ padding:'12px 24px', background:'var(--surface-container-high)', color:'var(--on-surface-variant)', border:'none', borderRadius:'2rem', fontWeight:600, cursor:'pointer' }}>{wt('s1_back')}</button>
                <button onClick={() => setAdim(3)} style={{ padding:'12px 24px', background:'var(--enba-orange)', color:'#fff', border:'none', borderRadius:'2rem', fontWeight:700, cursor:'pointer' }}>{wt('s1_next')}</button>
            </div>
        </div>
    );
};
