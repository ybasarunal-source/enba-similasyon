/**
 * Enba Similasyon - Detaylı Wizard Adım 3: Operasyon ve Makina Yönetimi
 */

window.DetStep3_Operations = function DetStep3_Operations({
    globalMakinalar, vardiyaSayisi, setVardiyaSayisi,
    vardiyaSaatleri, setVardiyaSaatleri,
    aylikCalismaGunu, setAylikCalismaGunu,
    elektrikBirimFiyat, setElektrikBirimFiyat,
    opGider, setOpGider,
    seciliMakinalar, setSeciliMakinalar,
    aylikKapasiteToplam, aylikSonuclar, AYLAR, baslangicAyi, fmt
}) {
    return (
        <div style={{ background:'var(--surface-container-lowest)', borderRadius:'1.5rem', padding:'28px', boxShadow:'var(--shadow-card)', marginBottom:'24px' }}>
            <h2 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:700, fontSize:'16px', color:'var(--enba-dark)', margin:'0 0 20px' }}>3. Operasyon ve Makina Yönetimi</h2>
            
            {globalMakinalar.length === 0 && (
                <div style={{ background: 'var(--error-container)', color: 'var(--error)', padding: '20px', borderRadius: '1rem', marginBottom:'24px' }}>
                    Makina kataloğunda henüz hiç makina tanımlanmamış. İş planında makine kullanabilmek için lütfen sol menüdeki "Makina ve Teçhizat" bölümünden sisteme yeni donanım tanımlayın.
                </div>
            )}

            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px', background:'var(--surface-container-low)', padding:'12px 20px', borderRadius:'1rem', border:'1px solid var(--surface-container-highest)' }}>
                <label style={{ fontSize:'12px', fontWeight:700, color:'var(--enba-dark)' }}>Tesisteki Günlük Vardiya Sayısı:</label>
                <select value={vardiyaSayisi} onChange={e => setVardiyaSayisi(Number(e.target.value))} style={{ padding:'8px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)', background:'var(--surface-container-lowest)', color:'var(--on-surface)', fontWeight:600 }}>
                    <option value={1}>1 Vardiya (Gündüz)</option>
                    <option value={2}>2 Vardiya</option>
                    <option value={3}>3 Vardiya (24 Saat)</option>
                </select>
            </div>

            <div style={{ display:'flex', gap:'20px', flexWrap:'wrap', marginBottom:'24px', background:'var(--surface-container-low)', padding:'24px', borderRadius:'1.5rem', border:'1px solid var(--surface-container-highest)' }}>
                {Array.from({length: vardiyaSayisi}, (_, i) => (
                    <div key={i} style={{flex:1, minWidth:'150px'}}>
                        <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>{i+1}. Vardiya (Saat / Gün)</label>
                        <input type='number' value={vardiyaSaatleri[i+1] || 8} onChange={e => setVardiyaSaatleri({...vardiyaSaatleri, [i+1]: Number(e.target.value)})} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} />
                    </div>
                ))}
                <div style={{flex:1, minWidth:'150px'}}>
                    <label style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Aylık Çalışma Günü</label>
                    <input type='number' value={aylikCalismaGunu} onChange={e => setAylikCalismaGunu(Number(e.target.value))} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} />
                </div>
                <div style={{flex:1, minWidth:'150px'}}>
                    <label style={{ fontSize:'11px', fontWeight:600, color:'var(--enba-orange-dark)', textTransform:'uppercase', display:'block', marginBottom:'6px' }}>⚡ Elektrik Birim Fiyatı (₺/kWh)</label>
                    <input type='number' step='0.1' value={elektrikBirimFiyat} onChange={e => setElektrikBirimFiyat(Number(e.target.value))} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid var(--surface-container-highest)' }} />
                </div>
            </div>

            <div style={{ marginBottom:'24px', background:'rgba(243, 156, 18, 0.05)', padding:'24px', borderRadius:'1.5rem', border:'1px solid rgba(243, 156, 18, 0.3)', display:'flex', gap:'20px', flexWrap:'wrap', alignItems:'center' }}>
                <div style={{ flex:1, minWidth:'180px' }}>
                    <h3 style={{ fontSize:'16px', margin:'0 0 16px', color:'var(--enba-dark)' }}>⚡  Ambalaj / Çuval Gideri Hesaplama</h3>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                        <div>
                            <label style={{ fontSize:'10px', fontWeight:600, color:'var(--on-surface-variant)', display:'block', marginBottom:'4px' }}>ÇUVAL KAPASİTESİ (TON/ADET)</label>
                            <input type='number' step='0.01' value={opGider.cuvalKapasite} onChange={e => setOpGider({...opGider, cuvalKapasite: Number(e.target.value)})} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid #ccc', background:'var(--surface-container-lowest)' }} />
                        </div>
                        <div>
                            <label style={{ fontSize:'10px', fontWeight:600, color:'var(--on-surface-variant)', display:'block', marginBottom:'4px' }}>ÇUVAL BİRİM FİYATI (₺)</label>
                            <input type='number' step='0.1' value={opGider.cuvalFiyat} onChange={e => setOpGider({...opGider, cuvalFiyat: Number(e.target.value)})} style={{ width:'100%', padding:'10px', borderRadius:'0.5rem', border:'1px solid #ccc', background:'var(--surface-container-lowest)' }} />
                        </div>
                    </div>
                </div>
                <div style={{ display:'flex', alignItems:'flex-end', paddingTop:'24px', paddingLeft:'16px' }}>
                    <span style={{ fontSize:'12px', color:'var(--enba-dark)', background:'var(--surface-container-highest)', padding:'10px 16px', borderRadius:'1rem', display:'flex', gap:'8px', alignItems:'center', border:'1px solid var(--enba-orange)' }}>
                        <span>✅</span> Çuval Gideri (315), aylık tedarik tonajinize göre doğrudan otomatik ve eş zamanlı hesaplanır.
                    </span>
                </div>
            </div>

            <div style={{ marginBottom:'24px', background:'var(--surface-container-low)', padding:'20px', borderRadius:'1rem' }}>
                <h3 style={{ fontSize:'14px', margin:'0 0 16px', color:'var(--enba-dark)' }}>⚙️ İşletme Planına Makina Ekle</h3>
                <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                    <select id="yeniMakineSecim" style={{ flex:1, minWidth:'200px', padding:'10px', borderRadius:'0.75rem', border:'1px solid var(--surface-container-highest)' }}>
                        <option value="">Katalogdan Makina Seç...</option>
                        {globalMakinalar.map(m => (
                            <option key={m.id} value={m.id}>{m.adi} ({m.kapasite} T/saat - {m.motorGucu} kW)</option>
                        ))}
                    </select>
                    <button onClick={() => {
                        const sel = document.getElementById('yeniMakineSecim');
                        if(sel.value) {
                            setSeciliMakinalar([...seciliMakinalar, { id: Date.now(), makinaId: sel.value, verimlilik: 85, katsayi: 0.8 }]);
                            sel.value = "";
                        }
                    }} style={{ background:'var(--enba-dark)', color:'#fff', border:'none', padding:'0 20px', borderRadius:'0.75rem', cursor:'pointer' }}>+ Kat</button>
                </div>

                <div style={{ marginTop:'20px', display:'grid', gap:'12px' }}>
                    {seciliMakinalar.map(sm => {
                        const gm = globalMakinalar.find(x => x.id === sm.makinaId);
                        if(!gm) return null;
                        return (
                            <div key={sm.id} style={{ background:'var(--surface-container-lowest)', padding:'16px', borderRadius:'1rem', border:'1px solid var(--surface-container-highest)', display:'flex', flexWrap:'wrap', gap:'16px', alignItems:'center' }}>
                                <div style={{ flex:'1 1 200px' }}>
                                    <div style={{ fontWeight:700, color:'var(--enba-dark)', fontSize:'14px' }}>{gm.adi}</div>
                                    <div style={{ fontSize:'11px', color:'var(--on-surface-variant)' }}>Kapasite: {gm.kapasite} T/saat | Motor: {gm.motorGucu} kW</div>
                                </div>
                                <div style={{ width:'100px' }}>
                                    <label style={{ fontSize:'10px', display:'block', marginBottom:'4px' }}>Verimlilik (%)</label>
                                    <input type='number' value={sm.verimlilik} onChange={e=> setSeciliMakinalar(prev => prev.map(x => x.id===sm.id ? {...x, verimlilik: Number(e.target.value)} : x))} style={{ width:'100%', padding:'6px', borderRadius:'0.5rem', border:'1px solid #ccc' }} />
                                </div>
                                <div style={{ width:'100px' }}>
                                    <label style={{ fontSize:'10px', display:'block', marginBottom:'4px' }}>Güç Katsayısı</label>
                                    <input type='number' step='0.1' value={sm.katsayi} onChange={e=> setSeciliMakinalar(prev => prev.map(x => x.id===sm.id ? {...x, katsayi: Number(e.target.value)} : x))} style={{ width:'100%', padding:'6px', borderRadius:'0.5rem', border:'1px solid #ccc' }} />
                                </div>
                                <button onClick={() => setSeciliMakinalar(seciliMakinalar.filter(x => x.id !== sm.id))} style={{ background:'none', border:'none', color:'var(--error)', cursor:'pointer', fontWeight:800 }}>✖ Kaldır</button>
                            </div>
                        )
                    })}
                </div>
                
                <div style={{ marginTop:'20px', borderTop:'1px solid var(--surface-container-highest)', paddingTop:'20px' }}>
                    <span style={{ fontSize:'12px', color:'var(--enba-dark)', background:'var(--surface-container-highest)', padding:'10px 16px', borderRadius:'1rem', display:'inline-flex', gap:'8px', alignItems:'center', border:'1px solid var(--enba-orange)' }}>
                        <span>⚡</span> Elektrik Gideri (405); kurulu makinalarınız, elektrik fiyatı ve o ayki <b>kapasite kullanım oranınıza</b> (hedef tonaj) göre her ay dinamik olarak hesaplanır.
                    </span>
                </div>
            </div>

            <div>
                <h3 style={{ fontSize:'14px', margin:'0 0 16px', color:'var(--enba-dark)' }}>⚡  Kapasite Analizi (Aylık)</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                        <thead>
                            <tr style={{ background:'var(--primary-container)' }}>
                                <th style={{ padding:'10px', textAlign:'left' }}>Ay</th>
                                <th style={{ padding:'10px', textAlign:'right' }}>Kurulu Kapasite</th>
                                <th style={{ padding:'10px', textAlign:'right' }}>Alış Hedefi</th>
                                <th style={{ padding:'10px', textAlign:'right' }}>Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aylikSonuclar.map((as, idx) => {
                                const toplamKuruluKapasite = aylikKapasiteToplam();
                                const aT = as.alisTon;
                                const fark = toplamKuruluKapasite - aT;
                                const uyari = fark < 0;
                                return (
                                    <tr key={idx} style={{ borderBottom:'1px solid var(--surface-container-highest)' }}>
                                        <td style={{ padding:'10px' }}>{AYLAR[(baslangicAyi + idx) % 12]}</td>
                                        <td style={{ padding:'10px', textAlign:'right' }}>{fmt(toplamKuruluKapasite)} T</td>
                                        <td style={{ padding:'10px', textAlign:'right' }}>{fmt(aT)} T</td>
                                        <td style={{ padding:'10px', textAlign:'right', fontWeight:700, color: uyari ? 'var(--error)' : 'var(--enba-orange-dark)' }}>
                                            {uyari ? `⚠️ ${fmt(Math.abs(fark))} T Kapasite Aşımı` : `✅ ${fmt(fark)} T Boş Kapasite`}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'20px' }}>
                <button onClick={() => window.setAdim(2)} style={{ padding:'12px 24px', background:'var(--surface-container-high)', border:'none', borderRadius:'2rem', fontWeight:700, cursor:'pointer' }}>← Geri</button>
                <button onClick={() => window.setAdim(4)} style={{ padding:'12px 24px', background:'var(--enba-orange)', color:'#fff', border:'none', borderRadius:'2rem', fontWeight:700, cursor:'pointer' }}>Sonraki: Personel Planlama →</button>
            </div>
        </div>
    );
};

