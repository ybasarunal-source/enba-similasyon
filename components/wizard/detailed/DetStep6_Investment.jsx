/**
 * Enba Similasyon - Detaylı Wizard Adım 6: Yatırımlar (CAPEX)
 */

window.DetStep6_Investment = function DetStep6_Investment({
    yatirimlar, setYatirimlar,
    yeniYatirimAd, setYeniYatirimAd,
    yeniYatirimTur, setYeniYatirimTur,
    yeniYatirimMaliyet, setYeniYatirimMaliyet,
    yeniYatirimGeriOdeme, setYeniYatirimGeriOdeme,
    yeniYatirimErteleme, setYeniYatirimErteleme,
    yeniYatirimGucTuketimi, setYeniYatirimGucTuketimi,
    yeniYatirimKapasite, setYeniYatirimKapasite,
    fmt, setAdim
}) {
    const wt = k => window.t('wizard.' + k);

    const yatirimEkle = () => {
        if (!yeniYatirimAd || !yeniYatirimMaliyet) return;
        setYatirimlar([...yatirimlar, {
            id: Date.now(),
            ad: yeniYatirimAd,
            tur: yeniYatirimTur,
            maliyet: Number(yeniYatirimMaliyet),
            geriOdeme: Number(yeniYatirimGeriOdeme),
            erteleme: Number(yeniYatirimErteleme),
            gucTuketimi: yeniYatirimTur === 'makina' ? Number(yeniYatirimGucTuketimi) || 0 : 0,
            saatlikKapasite: yeniYatirimTur === 'makina' ? Number(yeniYatirimKapasite) || 0 : 0,
        }]);
        setYeniYatirimAd('');
        setYeniYatirimMaliyet('');
        setYeniYatirimGucTuketimi('');
        setYeniYatirimKapasite('');
    };

    const yatirimSil = (id) => {
        setYatirimlar(yatirimlar.filter(y => y.id !== id));
    };

    const isMakina = yeniYatirimTur === 'makina';

    return (
        <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
            <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'16px', color:'var(--enba-dark)', margin:'0 0 20px' }}>{wt('s6_title')}</h2>
            <div style={{ padding:'24px', background:'var(--surface-container-low)', borderRadius:'1rem', marginBottom:'24px' }}>
                <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'flex-end' }}>
                    <div style={{flex:2, minWidth:'200px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', display:'block', marginBottom:'6px' }}>{wt('s6_item_name')}</label>
                        <input type='text' value={yeniYatirimAd} onChange={e => setYeniYatirimAd(e.target.value)} placeholder={wt('s6_item_placeholder')} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div style={{width:'150px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', display:'block', marginBottom:'6px' }}>{wt('s6_type')}</label>
                        <select value={yeniYatirimTur} onChange={e => setYeniYatirimTur(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }}>
                            <option value="makina">{wt('s6_type_machine')}</option>
                            <option value="insaat">{wt('s6_type_building')}</option>
                            <option value="diger">{wt('s6_type_other')}</option>
                        </select>
                    </div>
                    <div style={{width:'150px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', display:'block', marginBottom:'6px' }}>{wt('s6_cost')}</label>
                        <input type='number' value={yeniYatirimMaliyet} onChange={e => setYeniYatirimMaliyet(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div style={{width:'120px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', display:'block', marginBottom:'6px' }}>{wt('s6_depreciation')}</label>
                        <input type='number' value={yeniYatirimGeriOdeme} onChange={e => setYeniYatirimGeriOdeme(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div style={{width:'120px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', display:'block', marginBottom:'6px' }}>{wt('s6_delay')}</label>
                        <input type='number' value={yeniYatirimErteleme} onChange={e => setYeniYatirimErteleme(e.target.value)} title={wt('s6_delay_title')} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    {isMakina && (
                        <div style={{width:'130px'}}>
                            <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', display:'block', marginBottom:'6px' }}>{wt('s6_power_kw')}</label>
                            <input type='number' value={yeniYatirimGucTuketimi} onChange={e => setYeniYatirimGucTuketimi(e.target.value)} placeholder='0' style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--enba-orange)', background:'#fff8f0' }} onFocus={window.selectOnFocus} />
                        </div>
                    )}
                    {isMakina && (
                        <div style={{width:'150px'}}>
                            <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', display:'block', marginBottom:'6px' }}>{wt('s6_hourly_capacity')}</label>
                            <input type='number' value={yeniYatirimKapasite} onChange={e => setYeniYatirimKapasite(e.target.value)} placeholder='0' style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--enba-orange)', background:'#fff8f0' }} onFocus={window.selectOnFocus} />
                        </div>
                    )}
                    <button onClick={yatirimEkle} style={{ background:'var(--enba-dark)', color:'#fff', border:'none', padding:'11px 24px', borderRadius:'0.75rem', cursor:'pointer', fontWeight:700 }}>{wt('add')}</button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                    <thead>
                        <tr style={{ background:'var(--primary-container)' }}>
                            <th style={{ padding:'12px', textAlign:'left', color:'#fff' }}>{wt('s6_name_col')}</th>
                            <th style={{ padding:'12px', textAlign:'left', color:'#fff' }}>{wt('s6_type_col')}</th>
                            <th style={{ padding:'12px', textAlign:'right', color:'#fff' }}>{wt('s6_total_cost')}</th>
                            <th style={{ padding:'12px', textAlign:'right', color:'#fff' }}>{wt('s6_payback')}</th>
                            <th style={{ padding:'12px', textAlign:'right', color:'#fff' }}>{wt('s6_monthly_dep')}</th>
                            <th style={{ padding:'12px', textAlign:'right', color:'#fff' }}>{wt('s6_power_kw')}</th>
                            <th style={{ padding:'12px', textAlign:'right', color:'#fff' }}>{wt('s6_hourly_capacity')}</th>
                            <th style={{ padding:'12px', textAlign:'center', color:'#fff' }}>{wt('s6_actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {yatirimlar.map(y => (
                            <tr key={y.id} style={{ borderBottom:'1px solid var(--surface-container-highest)' }}>
                                <td style={{ padding:'12px', fontWeight:700 }}>{y.ad}</td>
                                <td style={{ padding:'12px' }}>{y.tur === 'makina' ? wt('s6_type_machine') : y.tur === 'insaat' ? wt('s6_type_building') : wt('s6_type_other')}</td>
                                <td style={{ padding:'12px', textAlign:'right', fontWeight:700 }}>{fmt(y.maliyet)} ₺</td>
                                <td style={{ padding:'12px', textAlign:'right' }}>{y.geriOdeme} {wt('s6_depreciation')} {y.erteleme > 0 && <span style={{fontSize:'10px', color:'var(--error)'}}>(+{y.erteleme} {wt('s6_delay')})</span>}</td>
                                <td style={{ padding:'12px', textAlign:'right', color:'var(--error)', fontWeight:700 }}>{fmt(y.maliyet / y.geriOdeme)} ₺/{wt('month_col')}</td>
                                <td style={{ padding:'12px', textAlign:'right' }}>{y.tur === 'makina' && y.gucTuketimi > 0 ? <span style={{fontWeight:700, color:'var(--enba-orange-dark)'}}>{y.gucTuketimi} kW</span> : <span style={{color:'var(--on-surface-variant)', opacity:0.3}}>—</span>}</td>
                                <td style={{ padding:'12px', textAlign:'right' }}>{y.tur === 'makina' && y.saatlikKapasite > 0 ? <span style={{fontWeight:700}}>{y.saatlikKapasite} {wt('s6_capacity_unit')}</span> : <span style={{color:'var(--on-surface-variant)', opacity:0.3}}>—</span>}</td>
                                <td style={{ padding:'12px', textAlign:'center' }}>
                                    <button onClick={() => yatirimSil(y.id)} style={{ background:'none', border:'none', color:'var(--error)', cursor:'pointer', fontWeight:800 }}>SİL</button>
                                </td>
                            </tr>
                        ))}
                        {yatirimlar.length > 0 && (
                            <tr style={{ background:'var(--surface-container-highest)' }}>
                                <td colSpan="2" style={{ padding:'14px', fontWeight:800 }}>{wt('s6_grand_total')}</td>
                                <td style={{ padding:'14px', textAlign:'right', fontWeight:800 }}>{fmt(yatirimlar.reduce((s,y)=>s+Number(y.maliyet),0))} ₺</td>
                                <td colSpan="5"></td>
                            </tr>
                        )}
                        {yatirimlar.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ padding:'24px', textAlign:'center', color:'var(--on-surface-variant)', opacity:0.6 }}>{wt('s6_empty')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'20px' }}>
                <button onClick={()=>setAdim(2)} style={{ padding:'12px 24px', background:'var(--enba-orange)', color:'#fff', border:'none', borderRadius:'2rem', fontWeight:700, cursor:'pointer' }}>{wt('s6_next')}</button>
            </div>
        </div>
    );
};
