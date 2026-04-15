/**
 * Enba Similasyon - Wizard Adım 3: Personel, Dış Hizmet ve Kiralar
 */

window.WizardStep3 = function WizardStep3({
    asgariNet, setAsgariNet,
    asgariSgk, setAsgariSgk,
    planParametreleri, parametreDegisti,
    personelListesi, personelEkle, personelSil, personelDuzenle,
    yeniPersonel, setYeniPersonel,
    disHizmetlerListesi, disHizmetEkle, disHizmetSil, disHizmetDuzenle,
    yeniDisHizmet, setYeniDisHizmet,
    kiralamaListesi, kiralamaEkle, kiralamaSil, kiralamaDuzenle,
    yeniKiralama, setYeniKiralama,
    uretimRecetesi,
    kutleDengesiOzet
}) {
    return (
        <div>
            <div className="personnel-zone">
                <h3 style={{marginTop: 0, color: 'var(--enba-orange-dark)', textTransform: 'uppercase', fontSize: '15px', letterSpacing: '1px'}}>⚡  personel maliyet yönetimi</h3>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid var(--enba-orange)' }}>
                    <div style={{fontSize: '13px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--enba-dark)'}}><strong>Asgari Ücret (Net):</strong> <input type="number" step="0.01" style={{width: '100px', padding: '6px', border: '1px solid var(--border-grey)', borderRadius: '4px', marginLeft: '5px', outline: 'none'}} value={asgariNet} onChange={e=>setAsgariNet(Number(e.target.value))} /> ₺</div>
                    <div style={{fontSize: '13px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--enba-dark)'}}><strong>Asgari SGK Maliyeti:</strong> <input type="number" step="0.01" style={{width: '100px', padding: '6px', border: '1px solid var(--border-grey)', borderRadius: '4px', marginLeft: '5px', outline: 'none'}} value={asgariSgk} onChange={e=>setAsgariSgk(Number(e.target.value))} /> ₺</div>
                    <div style={{fontSize: '13px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--enba-dark)'}}><strong>Günlük Yemek:</strong> <input type="number" step="0.01" style={{width: '80px', padding: '6px', border: '1px solid var(--border-grey)', borderRadius: '4px', marginLeft: '5px', outline: 'none'}} value={planParametreleri.gunlukYemekUcreti} onChange={e=>parametreDegisti('gunlukYemekUcreti', e.target.value)} /> ₺</div>
                </div>

                {personelListesi.length > 0 && (
                    <table className="personnel-table">
                        <thead>
                            <tr>
                                <th>Ünvan</th>
                                <th>Nitelik</th>
                                <th>Kişi/Vardiya</th>
                                <th>Maaş (Asgari+Ek)</th>
                                <th>Sgk (Asgari+Ek)</th>
                                <th>Yemek (Aylık)</th>
                                <th>Aylık Toplam ({planParametreleri.vardiyaSayisi || 1} vardiya)</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {personelListesi.map(p => {
                                const kisiMaasi = asgariNet + Number(p.ekMaas);
                                const kisiSgk = asgariSgk + Number(p.ekSgk);
                                const kisiYemek = (Number(planParametreleri.gunlukYemekUcreti) * Number(planParametreleri.aylikGun)) + Number(p.ekYemek);
                                const kisiAylikMaliyet = (kisiMaasi + kisiSgk + kisiYemek) * Number(p.kisiSayisi) * Number(planParametreleri.vardiyaSayisi || 1);
                                return (
                                    <tr key={p.id}>
                                        <td style={{fontWeight: '600', color: 'var(--enba-dark)'}}>{p.unvan}</td>
                                        <td>{p.isAyiklama ? <span style={{backgroundColor: '#EBF5FB', color: 'var(--info)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'}}>Ayıklama</span> : <span style={{color: '#95A5A6'}}>-</span>}</td>
                                        <td style={{fontWeight: '600'}}>{p.kisiSayisi}</td>
                                        <td>{window.fmt(kisiMaasi)} ₺</td>
                                        <td>{window.fmt(kisiSgk)} ₺</td>
                                        <td>{window.fmt(kisiYemek)} ₺</td>
                                        <td style={{fontWeight: 'bold', color: 'var(--error)'}}>{window.fmt(kisiAylikMaliyet)} ₺</td>
                                        <td style={{whiteSpace: 'nowrap'}}>
                                            <button className="btn btn-warning" style={{padding: '5px 10px', fontSize: '11px', marginRight: '5px'}} onClick={() => personelDuzenle(p)}>Düzenle</button>
                                            <button className="btn btn-danger" style={{padding: '5px 10px', fontSize: '11px'}} onClick={() => personelSil(p.id)}>Sil</button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}

                <div className="personnel-form">
                    <div className="form-group" style={{flex: 2}}><label>ünvan</label><input type="text" placeholder="Örn: Vasıfsız İşçi" value={yeniPersonel.unvan} onChange={e => setYeniPersonel({...yeniPersonel, unvan: e.target.value})} /></div>
                    <div className="form-group" style={{ flex: 0.5, alignItems: 'center', justifyContent: 'center', paddingBottom: '8px' }}>
                        <label style={{textAlign: 'center', color: 'var(--enba-dark)'}}>Ayıklama<br/>Yapar mı?</label>
                        <input type="checkbox" checked={yeniPersonel.isAyiklama} onChange={e => setYeniPersonel({...yeniPersonel, isAyiklama: e.target.checked})} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                    </div>
                    <div className="form-group"><label>kişi sayısı</label><input type="number" min="1" value={yeniPersonel.kisiSayisi} onChange={e => setYeniPersonel({...yeniPersonel, kisiSayisi: e.target.value})} /></div>
                    <div className="form-group"><label>ek maaş (+₺)</label><input type="number" placeholder="0" value={yeniPersonel.ekMaas} onChange={e => setYeniPersonel({...yeniPersonel, ekMaas: e.target.value})} /></div>
                    <div className="form-group"><label>ek sgk (+₺)</label><input type="number" placeholder="0" value={yeniPersonel.ekSgk} onChange={e => setYeniPersonel({...yeniPersonel, ekSgk: e.target.value})} /></div>
                    <div className="form-group"><label>ek yemek (+₺)</label><input type="number" placeholder="0" value={yeniPersonel.ekYemek} onChange={e => setYeniPersonel({...yeniPersonel, ekYemek: e.target.value})} /></div>
                    <button className="btn btn-info" style={{marginBottom: '0', padding: '10px 20px'}} onClick={personelEkle}>+ EKLE</button>
                </div>
            </div>

            <div className="personnel-zone" style={{borderColor: 'var(--info)', backgroundColor: '#EBF5FB', marginTop: '25px'}}>
                <h3 style={{marginTop: 0, color: 'var(--info)', textTransform: 'uppercase', fontSize: '15px', letterSpacing: '1px'}}>⚡  DIŞ HİZMETLER YÖNETİMİ (609)</h3>
                <div className="personnel-form" style={{border: '1px solid #AED6F1', backgroundColor: '#fff'}}>
                    <div className="form-group" style={{flex: 2}}>
                        <label style={{color: 'var(--info)'}}>HİZMET ADI</label>
                        <input type="text" placeholder="Örn: Muhasebe / Güvenlik Hizmeti" value={yeniDisHizmet.ad} onChange={e => setYeniDisHizmet({...yeniDisHizmet, ad: e.target.value})} style={{borderColor: '#AED6F1'}} />
                    </div>
                    <div className="form-group">
                        <label style={{color: 'var(--info)'}}>AYLIK TUTAR (₺)</label>
                        <input type="number" placeholder="0" value={yeniDisHizmet.tutar} onChange={e => setYeniDisHizmet({...yeniDisHizmet, tutar: e.target.value})} style={{borderColor: '#AED6F1'}} />
                    </div>
                    <button className="btn btn-info" style={{marginBottom: '0', padding: '10px 20px', backgroundColor: 'var(--info)'}} onClick={disHizmetEkle}>+ EKLE</button>
                </div>

                {(disHizmetlerListesi.length > 0 || uretimRecetesi.ayristirmaVar) && (
                    <table className="personnel-table" style={{marginTop:'15px', border: '1px solid #AED6F1'}}>
                        <thead>
                            <tr>
                                <th style={{backgroundColor: 'var(--info)'}}>Hizmet / Gider Kalemi</th>
                                <th style={{backgroundColor: 'var(--info)'}}>Aylık Tutar</th>
                                <th style={{backgroundColor: 'var(--info)'}}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {uretimRecetesi.ayristirmaVar && (
                                <tr style={{backgroundColor: '#FDEDEC'}}>
                                    <td>
                                        <strong>Atık Bertaraf Gideri (Otomatik)</strong>
                                    </td>
                                    <td style={{fontWeight: 'bold', color: 'var(--error)'}}>{window.fmt(kutleDengesiOzet.copTon * Number(uretimRecetesi.copBertarafFiyati))} ₺</td>
                                    <td style={{fontSize: '11px', color: '#95A5A6', fontStyle: 'italic'}}>Otomatik</td>
                                </tr>
                            )}
                            {disHizmetlerListesi.map(h => (
                                <tr key={h.id}>
                                    <td style={{fontWeight: '600', color: 'var(--enba-dark)'}}>{h.ad}</td>
                                    <td style={{fontWeight: 'bold'}}>{window.fmt(h.tutar)} ₺</td>
                                    <td style={{whiteSpace: 'nowrap'}}>
                                        <button className="btn btn-warning" style={{padding: '5px 10px', fontSize: '11px', marginRight: '5px'}} onClick={() => disHizmetDuzenle(h)}>Düzenle</button>
                                        <button className="btn btn-danger" style={{padding: '5px 10px', fontSize: '11px'}} onClick={() => disHizmetSil(h.id)}>Sil</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="personnel-zone" style={{borderColor: '#E67E22', backgroundColor: '#FDF2E9', marginTop: '25px'}}>
                <h3 style={{marginTop: 0, color: '#D35400', textTransform: 'uppercase', fontSize: '15px', letterSpacing: '1px'}}>⚡  TESİS & EKİPMAN KİRA YÖNETİMİ (610)</h3>
                <div className="personnel-form" style={{border: '1px solid #F6DDCC', backgroundColor: '#fff'}}>
                    <div className="form-group" style={{flex: 2}}>
                        <label style={{color: '#D35400'}}>KİRALAMA MADDE ADI</label>
                        <input type="text" placeholder="Örn: Tesis Kirası / Elektrikli Forklift" value={yeniKiralama.ad} onChange={e => setYeniKiralama({...yeniKiralama, ad: e.target.value})} style={{borderColor: '#F5CBA7'}} />
                    </div>
                    <div className="form-group">
                        <label style={{color: '#D35400'}}>AYLIK KİRA (₺)</label>
                        <input type="number" placeholder="0" value={yeniKiralama.tutar} onChange={e => setYeniKiralama({...yeniKiralama, tutar: e.target.value})} style={{borderColor: '#F5CBA7'}} />
                    </div>
                    <button className="btn btn-warning" style={{marginBottom: '0', padding: '10px 20px', backgroundColor: '#D35400', color: 'white'}} onClick={kiralamaEkle}>+ EKLE</button>
                </div>

                {kiralamaListesi.length > 0 && (
                    <table className="personnel-table" style={{marginTop:'15px', border: '1px solid #F6DDCC'}}>
                        <thead>
                            <tr>
                                <th style={{backgroundColor: '#E67E22'}}>Kira Kalemi</th>
                                <th style={{backgroundColor: '#E67E22'}}>Aylık Tutar</th>
                                <th style={{backgroundColor: '#E67E22'}}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {kiralamaListesi.map(h => (
                                <tr key={h.id}>
                                    <td style={{fontWeight: '600', color: '#D35400'}}>{h.ad}</td>
                                    <td style={{fontWeight: 'bold'}}>{window.fmt(h.tutar)} ₺</td>
                                    <td style={{whiteSpace: 'nowrap'}}>
                                        <button className="btn btn-warning" style={{padding: '5px 10px', fontSize: '11px', marginRight: '5px'}} onClick={() => kiralamaDuzenle(h)}>Düzenle</button>
                                        <button className="btn btn-danger" style={{padding: '5px 10px', fontSize: '11px'}} onClick={() => kiralamaSil(h.id)}>Sil</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

