/**
 * Enba Similasyon - Wizard Adım 1: Temel Girdiler ve Kütle Dengesi
 */

window.WizardStep1 = function WizardStep1({
    planParametreleri, parametreDegisti,
    uretimRecetesi, setUretimRecetesi,
    altUrunEkle, altUrunSil, altUrunGuncelle,
    kutleDengesiOzet, ayiklamaKapasitesi
}) {
    return (
        <div>
            <div className="params-zone">
                <h3 style={{marginTop: 0, color: 'var(--warning)', textTransform: 'uppercase', fontSize: '15px', marginBottom: '5px', letterSpacing: '1px'}}>⚙️ planlama girdileri</h3>
                <p style={{fontSize: '12px', color: '#7F8C8D', margin: 0}}>Tesise giren hammadde ve genel çalışma parametreleri.</p>
                
                <div className="params-grid">
                    <div className="param-box"><label>aylık giren malzeme (ton)</label><input type="number" value={planParametreleri.aylikTon} onChange={(e) => parametreDegisti('aylikTon', e.target.value)} /></div>
                    <div className="param-box"><label>mal alış fiyatı (₺/ton)</label><input type="number" value={planParametreleri.alisFiyati} onChange={(e) => parametreDegisti('alisFiyati', e.target.value)} /></div>
                    <div className="param-box"><label>ana ürün satış fiyatı (₺/ton)</label><input type="number" value={planParametreleri.satisFiyati} onChange={(e) => parametreDegisti('satisFiyati', e.target.value)} /></div>
                    
                    <div className="param-box"><label>aylık çalışma gün sayısı</label><input type="number" value={planParametreleri.aylikGun} onChange={(e) => parametreDegisti('aylikGun', e.target.value)} /></div>
                    <div className="param-box"><label>tek vardiya çalışma saati</label><input type="number" value={planParametreleri.gunlukSaat} onChange={(e) => parametreDegisti('gunlukSaat', e.target.value)} /></div>
                    <div className="param-box"><label>vardiya sayısı</label><input type="number" min="1" max="3" value={planParametreleri.vardiyaSayisi} onChange={(e) => parametreDegisti('vardiyaSayisi', e.target.value)} /></div>
                    <div className="param-box"><label>ayıklama personeli saatlik hızı (ton)</label><input type="number" step="0.1" value={planParametreleri.ayiklamaHizi} onChange={(e) => parametreDegisti('ayiklamaHizi', e.target.value)} /></div>
                    
                    <div className="param-box"><label>alış nakliye (₺/ton)</label><input type="number" value={planParametreleri.alisNakliye} onChange={(e) => parametreDegisti('alisNakliye', e.target.value)} /></div>
                    <div className="param-box"><label>satış nakliye (₺/ton)</label><input type="number" value={planParametreleri.satisNakliye} onChange={(e) => parametreDegisti('satisNakliye', e.target.value)} /></div>
                    <div className="param-box"><label>elektrik kw fiyatı (₺)</label><input type="number" step="0.01" value={planParametreleri.elektrikKwFiyat} onChange={(e) => parametreDegisti('elektrikKwFiyat', e.target.value)} /></div>
                </div>
            </div>

            <div className="mass-balance-zone">
                <h3 style={{marginTop: 0, color: 'var(--info)', textTransform: 'uppercase', fontSize: '15px', marginBottom: '15px', letterSpacing: '1px'}}>♻️ Kütle Dengesi ve Üretim Reçetesi</h3>
                <label style={{ display: 'flex', alignItems: 'center', fontWeight: '600', color: 'var(--info)', cursor: 'pointer', fontSize: '14px', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #AED6F1' }}>
                    <input type="checkbox" checked={uretimRecetesi.ayristirmaVar} onChange={e => setUretimRecetesi({...uretimRecetesi, ayristirmaVar: e.target.checked})} style={{ marginRight: '12px', width: '20px', height: '20px', cursor: 'pointer' }} />
                    Tesiste Ayrıştırma / Ayıklama (Sorting) işlemi yapılacak
                </label>
                <div className="mass-balance-grid">
                    <div>
                        {uretimRecetesi.ayristirmaVar && (
                            <div className="mass-box" style={{marginBottom: '20px'}}>
                                <h4>1. Ayrıştırma Aşaması (Çıkanlar)</h4>
                                <div className="sub-product-row">
                                    <input type="text" value="⚡ ️ Ayrıştırma Çöpü / Fire" disabled style={{fontWeight: '600', color: 'var(--error)', backgroundColor: '#FDEDEC'}}/>
                                    <input type="number" placeholder="Oran %" value={uretimRecetesi.copOrani} onChange={e => setUretimRecetesi({...uretimRecetesi, copOrani: e.target.value})} />
                                    <span style={{fontSize: '12px', color: '#7F8C8D', flex: 1, fontWeight: '600'}}>% (Çöp)</span>
                                </div>
                                <div className="sub-product-row">
                                    <span style={{flex: 2}}></span>
                                    <input type="number" placeholder="Bertaraf ₺/Ton" value={uretimRecetesi.copBertarafFiyati} onChange={e => setUretimRecetesi({...uretimRecetesi, copBertarafFiyati: e.target.value})} />
                                    <span style={{fontSize: '12px', color: '#7F8C8D', flex: 1, fontWeight: '600'}}>₺/Ton Gider</span>
                                </div>
                                
                                <h5 style={{color: 'var(--enba-dark)', fontSize: '13px', marginTop: '20px', marginBottom: '10px', textTransform: 'uppercase'}}>Ayrıştırılan Alt Ürünler:</h5>
                                {uretimRecetesi.altUrunler.map((urun) => (
                                    <div key={urun.id} className="sub-product-row" style={{background: 'var(--surface-container-low)', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)'}}>
                                        <input type="text" value={urun.ad} onChange={(e) => altUrunGuncelle(urun.id, 'ad', e.target.value)} placeholder="Ürün Adı"/>
                                        <input type="number" value={urun.oran} onChange={(e) => altUrunGuncelle(urun.id, 'oran', e.target.value)} placeholder="% Oran"/>
                                        <input type="number" value={urun.fiyat} onChange={(e) => altUrunGuncelle(urun.id, 'fiyat', e.target.value)} placeholder="Satış ₺/Ton"/>
                                        <label style={{fontSize: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 0.8, fontWeight: '600', color: 'var(--enba-dark)'}}>
                                            <span>Üretime Girer</span>
                                            <input type="checkbox" checked={urun.uretimeGirer} onChange={(e) => altUrunGuncelle(urun.id, 'uretimeGirer', e.target.checked)} style={{marginTop: '4px'}}/>
                                        </label>
                                        <button onClick={() => altUrunSil(urun.id)} style={{background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '5px', fontSize: '14px', fontWeight: 'bold'}}>✖</button>
                                    </div>
                                ))}
                                <button className="btn btn-info" style={{fontSize: '11px', padding: '8px 15px', marginTop: '10px'}} onClick={altUrunEkle}>+ ALT ÜRÜN EKLE</button>
                            </div>
                        )}

                        <div className="mass-box">
                            <h4>2. Üretim Aşaması (Makine)</h4>
                            <div className="sub-product-row">
                                <span style={{flex: 2, fontWeight: '600', color: 'var(--enba-dark)'}}>⚙️ Üretim Firesi (Buhar, Gaz vb.):</span>
                                <input type="number" value={uretimRecetesi.uretimFiresi} onChange={e => setUretimRecetesi({...uretimRecetesi, uretimFiresi: e.target.value})} style={{flex: 1}}/>
                                <span style={{flex: 1, fontSize: '12px', fontWeight: '600', color: '#7F8C8D'}}>% (Fire)</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="summary-box">
                            <h4 style={{margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', color: '#fff', fontSize: '14px', letterSpacing: '1px'}}>⚖️ KÜTLE DENGESİ ÖZETİ</h4>
                            <div className="summary-item"><span>Ana Girdi Malzeme:</span> <strong>{window.fmt(kutleDengesiOzet.girenTon)} Ton</strong></div>
                            {uretimRecetesi.ayristirmaVar && (
                                <div className="summary-item" style={{color: '#F5B7B1'}}><span>- Ayrıştırma Çöpü:</span> <strong>{window.fmt(kutleDengesiOzet.copTon)} Ton</strong></div>
                            )}
                            <div className="summary-item" style={{marginTop: '10px', paddingTop: '10px', borderTop: '2px solid rgba(255,255,255,0.2)'}}>
                                <span>Makineye / Üretime Giren:</span> <strong>{window.fmt(kutleDengesiOzet.uretimGirenTon)} Ton</strong>
                            </div>
                            <div className="summary-item" style={{color: '#F5B7B1'}}><span>- Üretim Firesi:</span> <strong>{window.fmt(kutleDengesiOzet.uretimFireTon)} Ton</strong></div>
                            <div className="summary-item" style={{fontSize: '16px', color: 'var(--enba-orange)', borderTop: '2px solid rgba(255,255,255,0.2)', marginTop: '10px', paddingTop: '15px'}}>
                                <span>SATIŞA HAZIR TOPLAM ÜRÜN:</span> <strong>{window.fmt(kutleDengesiOzet.toplamSatisTon)} Ton</strong>
                            </div>
                        </div>

                        {uretimRecetesi.ayristirmaVar && (
                            <div className={`capacity-alert ${ayiklamaKapasitesi >= planParametreleri.aylikTon ? 'capacity-success' : 'capacity-error'}`}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                                    {ayiklamaKapasitesi >= planParametreleri.aylikTon ? '✅ Ayrıştırma Kapasitesi Yeterli' : '⚠️ Kapasite Yetersiz! Ayıklama personeli ekleyin.'}
                                </h4>
                                <p style={{ margin: 0, fontSize: '13px' }}>
                                    Hedeflenen: <strong>{window.fmt(planParametreleri.aylikTon)} Ton</strong> | Personel Kapasitesi: <strong>{window.fmt(ayiklamaKapasitesi)} Ton</strong>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

