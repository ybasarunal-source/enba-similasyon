/**
 * Enba Similasyon - Detaylı Wizard Adım 5: Gider Kalemleri (OPEX)
 */

window.DetStep5_Expenses = function DetStep5_Expenses({
    gecerliGiderler, topluGiderler, guncelleTopluGider, uygulaTümAylaraGider,
    ayVerileri, AYLAR, baslangicAyi, ACILIR_KODLAR, 
    altGiderKalemleri, yeniAltAdlar, setYeniAltAdlar, altKalemEkle, altKalemSil,
    giderGuncelle, setAdim
}) {
    return (
        <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
            <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'16px', color:'var(--enba-dark)', margin:'0 0 20px' }}>5. Üretim ve Tesis Giderleri</h2>

            <div style={{ padding:'16px', background:'var(--surface-container-low)', borderRadius:'1rem', marginBottom:'24px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', flexWrap:'wrap', gap:'12px' }}>
                    <h3 style={{ fontSize:'13px', margin:0 }}>⚡ Toplu Doldurma</h3>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <button onClick={uygulaTümAylaraGider} style={{ background:'var(--enba-orange)', color:'#fff', border:'none', padding:'8px 18px', borderRadius:'0.5rem', cursor:'pointer', fontWeight:600 }}>Tüm Aylara Uygula</button>
                    </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'10px' }}>
                    {gecerliGiderler.map(g => {
                        const isDynamic = ['315', '405'].includes(g.kodu);
                        if (ACILIR_KODLAR.includes(g.kodu)) return null;
                        return (
                            <div key={g.kodu} title={isDynamic ? "Bu alan otomatik hesaplanır, toplu doldurulamaz." : ""} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background: isDynamic ? 'var(--surface-container)' : 'var(--surface-container-lowest)', padding:'8px 12px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }}>
                                <label style={{ fontSize:'11px', fontWeight:600, color: isDynamic ? '#999' : 'var(--on-surface-variant)', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap', flex:1 }}>
                                    {g.kodu} - {g.adi}
                                </label>
                                <input
                                    type='number'
                                    disabled={isDynamic}
                                    value={topluGiderler[g.kodu] || ''}
                                    onChange={e => guncelleTopluGider(g.kodu, e.target.value)}
                                    placeholder={isDynamic ? "Oto" : "0"}
                                    style={{ width:'70px', padding:'6px', borderRadius:'0.25rem', border:'1px solid var(--surface-container-highest)', textAlign:'right', fontSize:'12px' }}
                                    onFocus={window.selectOnFocus}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px', minWidth: '1000px' }}>
                    <thead>
                        <tr style={{ background:'var(--surface-container-low)', color:'var(--on-surface)' }}>
                            <th style={{ padding:'12px', textAlign:'left', position:'sticky', left:0, background:'var(--surface-container-low)', zIndex:10 }}>Kod / Gider Adı</th>
                            {ayVerileri.map((_, idx) => (
                                <th key={idx} style={{ padding:'12px', textAlign:'center', minWidth:'100px' }}>{AYLAR[(baslangicAyi+idx)%12]}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {gecerliGiderler.map(g => {
                            const isDynamic = ['315', '405'].includes(g.kodu);
                            const isExpandable = ACILIR_KODLAR.includes(g.kodu);
                            
                            return (
                                <React.Fragment key={g.kodu}>
                                    <tr style={{ borderBottom:'1px solid var(--surface-container-highest)' }}>
                                        <td style={{ padding:'10px 12px', fontWeight:700, position:'sticky', left:0, background:'var(--surface-container-lowest)', zIndex:5, borderRight:'1px solid var(--surface-container-highest)', color: isDynamic ? 'var(--enba-orange-dark)' : 'var(--enba-dark)' }}>
                                            {isDynamic && '⚡ '} {g.kodu} - {g.adi}
                                        </td>
                                        {Array.from({length: 12}, (_, i) => { const calIdx=(baslangicAyi+i)%12; const a=ayVerileri[calIdx]||{giderler:{}}; return (
                                            <td key={i} style={{ padding:'6px 8px', textAlign:'center' }}>
                                                {!isExpandable ? (
                                                    <input
                                                        type="number"
                                                        disabled={isDynamic}
                                                        value={Number(a.giderler?.[g.kodu]) || ''}
                                                        onChange={e => giderGuncelle(calIdx, g.kodu, e.target.value)}
                                                        style={{ width:'80px', padding:'6px', borderRadius:'0.25rem', border:'1px solid var(--surface-container-highest)', textAlign:'right' }}
                                                        onFocus={window.selectOnFocus}
                                                    />
                                                ) : <span style={{color:'#999', fontSize:'10px'}}>As. Tabloya Bakınız</span>}
                                            </td>
                                        ); })}
                                    </tr>

                                    {isExpandable && (
                                        <tr>
                                            <td colSpan={ayVerileri.length + 1} style={{ padding:'10px 16px', background:'var(--surface-container-low)' }}>
                                                <div style={{ background:'var(--surface-container-lowest)', padding:'16px', borderRadius:'1rem' }}>
                                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                                                        <h4 style={{ margin:0, fontSize:'13px', color:'var(--enba-dark)' }}>⚡  {g.adi} - Alt Kalemleri</h4>
                                                        <div style={{ display:'flex', gap:'10px' }}>
                                                            <input
                                                                type="text"
                                                                placeholder="Yeni alt kalem adı..."
                                                                value={yeniAltAdlar[g.kodu] || ''}
                                                                onChange={e => setYeniAltAdlar(p => ({ ...p, [g.kodu]: e.target.value }))}
                                                                style={{ padding:'6px 12px', borderRadius:'0.5rem', border:'1px solid #ccc', fontSize:'12px' }}
                                                                onFocus={window.selectOnFocus}
                                                            />
                                                            <button onClick={() => altKalemEkle(g.kodu)} style={{ background:'var(--enba-dark)', color:'#fff', border:'none', padding:'6px 12px', borderRadius:'0.5rem', fontSize:'12px', cursor:'pointer' }}>+ KAT</button>
                                                        </div>
                                                    </div>
                                                    
                                                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                                                        <thead>
                                                            <tr style={{ background:'rgba(0,0,0,0.03)' }}>
                                                                <th style={{ padding:'8px', textAlign:'left', fontSize:'11px' }}>Alt Kalem Adı</th>
                                                                {ayVerileri.map((_, idx) => <th key={idx} style={{ padding:'8px', textAlign:'center', fontSize:'11px' }}>{AYLAR[(baslangicAyi+idx)%12]}</th>)}
                                                                <th style={{ padding:'8px' }}></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {altGiderKalemleri.filter(ak => ak.parentKod === g.kodu).map(ak => (
                                                                <tr key={ak.id} style={{ borderBottom:'1px solid #eee' }}>
                                                                    <td style={{ padding:'8px', fontWeight:600 }}>{ak.ad}</td>
                                                                    {Array.from({length:12}, (_, i) => { const cI=(baslangicAyi+i)%12; const aI=ayVerileri[cI]||{giderler:{}}; return (
                                                                        <td key={i} style={{ padding:'4px 8px', textAlign:'center' }}>
                                                                            <input
                                                                                type="number"
                                                                                value={Number(aI.giderler?.[ak.id]) || ''}
                                                                                onChange={e => giderGuncelle(cI, ak.id, e.target.value)}
                                                                                style={{ width:'70px', padding:'6px', borderRadius:'0.25rem', border:'1px solid #eee', textAlign:'right' }}
                                                                                onFocus={window.selectOnFocus}
                                                                            />
                                                                        </td>
                                                                    ); })}
                                                                    <td style={{ padding:'8px' }}>
                                                                        <button onClick={() => altKalemSil(ak.id)} style={{ background:'none', border:'none', color:'var(--error)', cursor:'pointer', fontWeight:800 }}>✖</button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
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
                <button onClick={()=>setAdim(4)} style={{ padding:'12px 24px', background:'var(--surface-container-high)', border:'none', borderRadius:'2rem', fontWeight:700, cursor:'pointer' }}>← Geri</button>
                <button onClick={()=>setAdim(6)} style={{ padding:'12px 24px', background:'var(--enba-orange)', color:'#fff', border:'none', borderRadius:'2rem', fontWeight:700, cursor:'pointer' }}>Sonraki: Müşteri Satış Planı →</button>
            </div>
        </div>
    );
};

