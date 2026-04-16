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
    fmt, setAdim
}) {
    const yatirimEkle = () => {
        if (!yeniYatirimAd || !yeniYatirimMaliyet) return;
        setYatirimlar([...yatirimlar, {
            id: Date.now(),
            ad: yeniYatirimAd,
            tur: yeniYatirimTur,
            maliyet: Number(yeniYatirimMaliyet),
            geriOdeme: Number(yeniYatirimGeriOdeme),
            erteleme: Number(yeniYatirimErteleme)
        }]);
        setYeniYatirimAd('');
        setYeniYatirimMaliyet('');
    };

    const yatirimSil = (id) => {
        setYatirimlar(yatirimlar.filter(y => y.id !== id));
    };

    return (
        <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
            <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'16px', color:'var(--enba-dark)', margin:'0 0 20px' }}>6. Yatırım ve Kurulum Maliyetleri (CAPEX)</h2>
            <div style={{ padding:'24px', background:'var(--surface-container-low)', borderRadius:'1rem', marginBottom:'24px' }}>
                <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'flex-end' }}>
                    <div style={{flex:2, minWidth:'200px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', display:'block', marginBottom:'6px' }}>Yatırım Kalemi / Makine Adı</label>
                        <input type='text' value={yeniYatirimAd} onChange={e => setYeniYatirimAd(e.target.value)} placeholder='Örn: Trafo, Kırma Hattı, İnşaat' style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div style={{width:'150px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', display:'block', marginBottom:'6px' }}>Tür</label>
                        <select value={yeniYatirimTur} onChange={e => setYeniYatirimTur(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }}>
                            <option value="makina">⚙ Makina</option>
                            <option value="insaat">🏢 İnşaat / Tesis</option>
                            <option value="diger"> Diğer</option>
                        </select>
                    </div>
                    <div style={{width:'150px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', display:'block', marginBottom:'6px' }}>Maliyet (₺)</label>
                        <input type='number' value={yeniYatirimMaliyet} onChange={e => setYeniYatirimMaliyet(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div style={{width:'120px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', display:'block', marginBottom:'6px' }}>Amortisman (Ay)</label>
                        <input type='number' value={yeniYatirimGeriOdeme} onChange={e => setYeniYatirimGeriOdeme(e.target.value)} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <div style={{width:'120px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', display:'block', marginBottom:'6px' }}>Erteleme (Ay)</label>
                        <input type='number' value={yeniYatirimErteleme} onChange={e => setYeniYatirimErteleme(e.target.value)} title="Yatırımın kaç ay sonra başlayacağı" style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} onFocus={window.selectOnFocus} />
                    </div>
                    <button onClick={yatirimEkle} style={{ background:'var(--enba-dark)', color:'#fff', border:'none', padding:'11px 24px', borderRadius:'0.75rem', cursor:'pointer', fontWeight:700 }}>+ EKLE</button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                    <thead>
                        <tr style={{ background:'var(--surface-container-low)' }}>
                            <th style={{ padding:'12px', textAlign:'left' }}>Yatırım Adı</th>
                            <th style={{ padding:'12px', textAlign:'left' }}>Tür</th>
                            <th style={{ padding:'12px', textAlign:'right' }}>Toplam Maliyet</th>
                            <th style={{ padding:'12px', textAlign:'right' }}>Geri Ödeme</th>
                            <th style={{ padding:'12px', textAlign:'right' }}>Aylık Amortisman</th>
                            <th style={{ padding:'12px', textAlign:'center' }}>Haraket</th>
                        </tr>
                    </thead>
                    <tbody>
                        {yatirimlar.map(y => (
                            <tr key={y.id} style={{ borderBottom:'1px solid var(--surface-container-highest)' }}>
                                <td style={{ padding:'12px', fontWeight:700 }}>{y.ad}</td>
                                <td style={{ padding:'12px' }}>{y.tur === 'makina' ? '⚡  Makina' : y.tur === 'insaat' ? '⚡ ️ İnşaat' : '⚡  Diğer'}</td>
                                <td style={{ padding:'12px', textAlign:'right', fontWeight:700 }}>{fmt(y.maliyet)} ₺</td>
                                <td style={{ padding:'12px', textAlign:'right' }}>{y.geriOdeme} Ay {y.erteleme > 0 && <span style={{fontSize:'10px', color:'var(--error)'}}>(+{y.erteleme} ay erteleme)</span>}</td>
                                <td style={{ padding:'12px', textAlign:'right', color:'var(--error)', fontWeight:700 }}>{fmt(y.maliyet / y.geriOdeme)} ₺/Ay</td>
                                <td style={{ padding:'12px', textAlign:'center' }}>
                                    <button onClick={() => yatirimSil(y.id)} style={{ background:'none', border:'none', color:'var(--error)', cursor:'pointer', fontWeight:800 }}>SİL</button>
                                </td>
                            </tr>
                        ))}
                        {yatirimlar.length > 0 && (
                            <tr style={{ background:'var(--surface-container-highest)' }}>
                                <td colSpan="2" style={{ padding:'14px', fontWeight:800 }}>YATIRIM TOPLAMI</td>
                                <td style={{ padding:'14px', textAlign:'right', fontWeight:800 }}>{fmt(yatirimlar.reduce((s,y)=>s+Number(y.maliyet),0))} ₺</td>
                                <td colSpan="3"></td>
                            </tr>
                        )}
                        {yatirimlar.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding:'24px', textAlign:'center', color:'#999' }}>Henüz yatırım kalemi eklenmedi. Eğer mevcut bir tesis üzerinde çalışıyorsanız CAPEX eklemeniz gerekmez.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'20px' }}>
                <button onClick={()=>setAdim(5)} style={{ padding:'12px 24px', background:'var(--surface-container-high)', border:'none', borderRadius:'2rem', fontWeight:700, cursor:'pointer' }}>← Geri</button>
                <button onClick={()=>setAdim(7)} style={{ padding:'12px 24px', background:'var(--enba-orange)', color:'#fff', border:'none', borderRadius:'2rem', fontWeight:700, cursor:'pointer' }}>Görünüm: Finansal Rapor (Sonuç) →</button>
            </div>
        </div>
    );
};

