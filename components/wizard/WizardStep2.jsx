/**
 * Enba Similasyon - Wizard Adım 2: Kurulum ve Yatırım (CAPEX)
 */

window.WizardStep2 = function WizardStep2({
    yeniKurulum, setYeniKurulum,
    yeniMotor, setYeniMotor,
    motorEkle, motorSil, motorToplamGucu,
    kurulumEkle, kurulumSil, kurulumDuzenle,
    kurulumKalemleri,
    amortismanSuresi, setAmortismanSuresi,
    yeniPlanBaslik
}) {
    return (
        <div className="capex-zone">
            <h3 style={{marginTop: 0, color: 'var(--capex-purple)', textTransform: 'uppercase', fontSize: '16px', marginBottom: '5px', letterSpacing: '1px'}}>⚡ ️ KURULUM VE YATIRIM MALİYETLERİ (CAPEX)</h3>
            <p style={{fontSize: '13px', color: '#7F8C8D', margin: 0, marginBottom: '25px'}}>
                Makine, Trafo, İnşaat gibi ilk kurulum harcamalarınızı girin. Bu maliyetler "FAVÖK" hesabına girmez, belirlediğiniz ay süresince bölünerek "Net Kâr"dan düşülür.
            </p>
            
            <div className="capex-box">
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', marginBottom: '20px' }}>
                    <div className="input-row" style={{ flex: 2, marginBottom: 0 }}>
                        <label style={{color: 'var(--capex-purple)'}}>Yatırım Kalemi Adı (Örn: Kırma Makinesi)</label>
                        <input type="text" value={yeniKurulum.ad} onChange={e => setYeniKurulum({...yeniKurulum, ad: e.target.value})} style={{borderColor: '#D7BDE2'}} />
                    </div>
                    <div className="input-row" style={{ flex: 1, marginBottom: 0 }}>
                        <label style={{color: 'var(--capex-purple)'}}>Tutar (₺)</label>
                        <input type="number" value={yeniKurulum.tutar} onChange={e => setYeniKurulum({...yeniKurulum, tutar: e.target.value})} style={{borderColor: '#D7BDE2'}} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px', padding: '10px', background: '#F5EEF8', borderRadius: '6px', border: '1px solid #EBDEF0' }}>
                        <input type="checkbox" id="isMakineCheck" checked={yeniKurulum.isMakine} onChange={e => setYeniKurulum({...yeniKurulum, isMakine: e.target.checked})} style={{width: '20px', height: '20px', cursor: 'pointer'}} />
                        <label htmlFor="isMakineCheck" style={{fontSize: '13px', fontWeight: 'bold', color: 'var(--capex-purple)', cursor: 'pointer', textTransform: 'none', margin: 0}}>Makine Ekliyorum</label>
                    </div>
                </div>

                {yeniKurulum.isMakine && (
                    <div style={{ background: '#F5EEF8', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px dashed #D7BDE2' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div className="input-row" style={{marginBottom: 0}}>
                                <label style={{color: '#6A1B9A', fontSize: '11px'}}>Üretim Kapasitesi (Ton/Saat)</label>
                                <input type="number" step="0.1" value={yeniKurulum.kapasite} onChange={e => setYeniKurulum({...yeniKurulum, kapasite: e.target.value})} placeholder="Örn: 5" style={{borderColor: '#D7BDE2'}}/>
                            </div>
                            <div className="input-row" style={{marginBottom: 0}}>
                                <label style={{color: '#6A1B9A', fontSize: '11px'}}>Verimlilik Katsayısı (%)</label>
                                <input type="number" value={yeniKurulum.verimlilik} onChange={e => setYeniKurulum({...yeniKurulum, verimlilik: e.target.value})} style={{borderColor: '#D7BDE2'}}/>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px dashed #D7BDE2', paddingTop: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <strong style={{ color: '#6A1B9A', fontSize: '13px' }}>⚡ Motorlar / Tüketim Kaynakları</strong>
                                <span style={{ fontSize: '13px', color: '#6A1B9A', fontWeight: 'bold' }}>
                                    Toplam Güç: {motorToplamGucu(yeniKurulum.motorlar)} kW
                                </span>
                            </div>

                            {yeniKurulum.motorlar.length > 0 && (
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ background: '#EBDEF0' }}>
                                            <th style={{ padding: '8px 10px', textAlign: 'left', color: '#6A1B9A', fontWeight: 600 }}>Motor / Kaynak Adı</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'right', color: '#6A1B9A', fontWeight: 600 }}>Güç (kW)</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'right', color: '#6A1B9A', fontWeight: 600 }}>Yük Katsayısı (%)</th>
                                            <th style={{ padding: '8px 10px', textAlign: 'right', color: '#6A1B9A', fontWeight: 600 }}>Eff. kW</th>
                                            <th style={{ padding: '8px 10px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {yeniKurulum.motorlar.map(m => (
                                            <tr key={m.id} style={{ background: '#fff' }}>
                                                <td style={{ padding: '7px 10px' }}>{m.ad}</td>
                                                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{m.gucu}</td>
                                                <td style={{ padding: '7px 10px', textAlign: 'right' }}>%{m.yukKatsayisi}</td>
                                                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#6A1B9A' }}>{(m.gucu * m.yukKatsayisi / 100).toFixed(1)}</td>
                                                <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                                                    <button onClick={() => motorSil(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0392B', fontWeight: 'bold', fontSize: '14px' }}>✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                <div className="input-row" style={{ flex: 3, marginBottom: 0 }}>
                                    <label style={{ color: '#6A1B9A', fontSize: '11px' }}>Motor / Kaynak Adı</label>
                                    <input type="text" value={yeniMotor.ad} onChange={e => setYeniMotor({...yeniMotor, ad: e.target.value})} placeholder="Örn: Ana Motor, Fanlı Soğutucu" style={{ borderColor: '#D7BDE2' }} />
                                </div>
                                <div className="input-row" style={{ flex: 1, marginBottom: 0 }}>
                                    <label style={{ color: '#6A1B9A', fontSize: '11px' }}>Güç (kW)</label>
                                    <input type="number" value={yeniMotor.gucu} onChange={e => setYeniMotor({...yeniMotor, gucu: e.target.value})} placeholder="kW" style={{ borderColor: '#D7BDE2' }} />
                                </div>
                                <div className="input-row" style={{ flex: 1, marginBottom: 0 }}>
                                    <label style={{ color: '#6A1B9A', fontSize: '11px' }}>Yük Katsayısı (%)</label>
                                    <input type="number" value={yeniMotor.yukKatsayisi} onChange={e => setYeniMotor({...yeniMotor, yukKatsayisi: e.target.value})} style={{ borderColor: '#D7BDE2' }} />
                                </div>
                                <button className="btn btn-purple" style={{ padding: '10px 18px', fontSize: '12px', whiteSpace: 'nowrap' }} onClick={motorEkle}>+ Motor Ekle</button>
                            </div>
                        </div>
                    </div>
                )}
                
                <div style={{textAlign: 'right'}}>
                    <button className="btn btn-purple" style={{padding: '12px 35px', fontSize: '14px'}} onClick={kurulumEkle}>+ EKLE</button>
                </div>

                {kurulumKalemleri.length > 0 && (
                    <div style={{overflowX: 'auto', marginTop: '25px'}}>
                        <table className="capex-table" style={{minWidth: '600px', background: '#fff', borderRadius: '8px', overflow: 'hidden'}}>
                            <thead>
                                <tr>
                                    <th>Yatırım Kalemi</th>
                                    <th>Tutar</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kurulumKalemleri.map(k => (
                                    <tr key={k.id}>
                                        <td>
                                            <strong style={{color: 'var(--enba-dark)', fontSize: '14px'}}>{k.ad}</strong>
                                            {k.isMakine && (
                                                <div style={{fontSize: '12px', color: '#7F8C8D', marginTop: '6px'}}>
                                                    <span style={{background: '#F5EEF8', display: 'inline-block', padding: '3px 8px', borderRadius: '4px', marginRight: '6px'}}>
                                                        Toplam Güç: {motorToplamGucu(k.motorlar || [])} kW | Kapasite: {k.kapasite} T/h (Verim: %{k.verimlilik})
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{fontWeight: 'bold', verticalAlign: 'middle', color: 'var(--enba-dark)'}}>{window.fmt(k.tutar)} ₺</td>
                                        <td style={{width: '160px', verticalAlign: 'middle', whiteSpace: 'nowrap'}}>
                                            <button className="btn btn-warning" style={{padding: '6px 12px', fontSize: '11px', marginRight: '8px'}} onClick={() => kurulumDuzenle(k)}>DÜZENLE</button>
                                            <button className="btn btn-danger" style={{padding: '6px 12px', fontSize: '11px'}} onClick={() => kurulumSil(k.id)}>SİL</button>
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{backgroundColor: '#F5EEF8'}}>
                                    <td style={{textAlign: 'right', fontWeight: 'bold', color: 'var(--capex-purple)'}}>TOPLAM YATIRIM MALİYETİ:</td>
                                    <td colSpan="2" style={{fontWeight: 'bold', color: 'var(--capex-purple)', fontSize: '16px'}}>{window.fmt(kurulumKalemleri.reduce((a, b) => a + b.tutar, 0))} ₺</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="capex-box" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F5EEF8', border: '1px solid #D7BDE2'}}>
                <div style={{flex: 1}}>
                    <label style={{fontSize: '14px', fontWeight: 'bold', color: 'var(--capex-purple)', display: 'block', marginBottom: '8px'}}>AMORTİSMAN / GERİ ÖDEME SÜRESİ (AY):</label>
                    <input type="number" value={amortismanSuresi} onChange={e => setAmortismanSuresi(Number(e.target.value))} style={{padding: '12px', fontSize: '18px', border: '2px solid var(--capex-purple)', borderRadius: '8px', width: '150px', outline: 'none', color: 'var(--enba-dark)', fontWeight: 'bold'}} />
                </div>
                <div style={{flex: 1, textAlign: 'right'}}>
                    <span style={{fontSize: '14px', color: '#7F8C8D', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px'}}>Aylık Kârdan Düşülecek Amortisman Payı:</span>
                    <span style={{fontSize: '28px', fontWeight: 'bold', color: 'var(--error)'}}>- { window.fmt(kurulumKalemleri.reduce((a, b) => a + b.tutar, 0) / (amortismanSuresi || 1)) } ₺ / Ay</span>
                </div>
            </div>
        </div>
    );
};

