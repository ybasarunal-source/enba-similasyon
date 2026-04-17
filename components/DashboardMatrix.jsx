/**
 * Enba Similasyon - Konsolide Kârlılık Özeti (TKKÖ) Tablosu
 */

window.DashboardMatrix = function DashboardMatrix({
    aktifPlanlar,
    sonuc,
    grupGosterim,
    setGrupGosterim,
    exportToExcel,
    exportToPDF
}) {
    if (aktifPlanlar.length === 0) {
        return (
            <div className="dashboard" id="exportable-report">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-container-high)', paddingBottom: '15px', marginBottom: '15px'}}>
                <h3 className="enba-section-title" style={{ margin: 0 }}>
                    <i className="ph ph-layout" style={{fontSize:'20px'}}></i> TKKÖ - TESİS KONSOLİDE KÂRLILIK ÖZETİ
                </h3>
            </div>
                <div style={{textAlign: 'center', padding: '40px 20px', color: 'var(--on-surface-variant)', fontSize: '15px', opacity:0.6}}>
                    Tesiste henüz veri yok. İPK ekleyin.
                </div>
            </div>
        );
    }

    const uniqueGelirler = new Set();
    const uniqueGiderKodlari = new Set();
    
    aktifPlanlar.forEach(p => {
        p.satisDetaylari?.forEach(d => { if(d.tutar > 0) uniqueGelirler.add(d.ad); });
        Object.keys(p.giderler || {}).forEach(k => {
            if(Number(p.giderler[k]) > 0) uniqueGiderKodlari.add(k);
        });
    });
    const gelirAdlari = Array.from(uniqueGelirler);
    const giderKodlari = Array.from(uniqueGiderKodlari).sort();

    return (
        <div className="dashboard" id="exportable-report">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-container-high)', paddingBottom: '15px', marginBottom: '15px'}}>
                <h3 className="enba-section-title" style={{ margin: 0 }}>
                    <i className="ph ph-layout" style={{fontSize:'20px'}}></i> TKKÖ - TESİS KONSOLİDE KÂRLILIK ÖZETİ
                </h3>
                <div style={{display: 'flex', gap: '10px'}} data-html2canvas-ignore="true">
                    <button className="btn btn-secondary" style={{fontSize: '11px', boxShadow:'0 2px 8px rgba(22,163,74,0.1)'}} onClick={exportToExcel}>
                        <i className="ph ph-file-xls" style={{color:'#16A34A'}}></i> EXCEL
                    </button>
                    <button className="btn btn-secondary" style={{fontSize: '11px', boxShadow:'0 2px 8px rgba(220,38,38,0.1)'}} onClick={exportToPDF}>
                        <i className="ph ph-file-pdf" style={{color:'#DC2626'}}></i> PDF
                    </button>
                </div>
            </div>
            
            <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                <table className="matrix-table" id="tkko-table">
                    <thead>
                        <tr>
                            <th>FİNANSAL KALEMLER</th>
                            {aktifPlanlar.map(p => <th key={p.id}>{p.baslik}</th>)}
                            <th style={{color: 'var(--enba-orange)', fontSize: '14px'}}>TOPLAM TESİS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colSpan={aktifPlanlar.length + 2} className="row-header" style={{color: 'var(--enba-orange-dark)', background:'var(--surface-container-high)', borderBottom:'1px solid var(--surface-container-highest)'}}>
                            <i className="ph ph-trend-up" style={{marginRight:'8px'}}></i> GELİRLER
                        </td></tr>
                        {gelirAdlari.map(ad => {
                            let satirToplam = 0;
                            return (
                                <tr key={ad}>
                                    <td>{ad}</td>
                                    {aktifPlanlar.map(p => {
                                        const tutar = p.satisDetaylari?.filter(d => d.ad === ad).reduce((a,b)=>a+b.tutar,0) || 0;
                                        satirToplam += tutar;
                                        return <td key={p.id}>{tutar > 0 ? window.fmt(tutar) : '-'}</td>;
                                    })}
                                    <td className="total-col" style={{color: 'var(--enba-orange)'}}>{window.fmt(satirToplam)} ₺</td>
                                </tr>
                            )
                        })}
                        <tr className="grand-total">
                            <td style={{fontWeight:800}}>TOPLAM GELİR</td>
                            {aktifPlanlar.map(p => <td key={p.id} style={{fontWeight:700}}>{window.fmt(p.ozetGelir)}</td>)}
                            <td className="total-col" style={{color: 'var(--enba-orange-dark)', fontSize:'14px', fontWeight:800}}>{window.fmt(sonuc.gelir)} ₺</td>
                        </tr>

                        {(window.GIDER_GRUPLARI || []).map(grup => {
                            const grubunKoduListesi = giderKodlari.filter(kodu => (window.SABLON_GIDERLER || []).find(g => g.kodu === kodu)?.grup === grup.id);
                            if (grubunKoduListesi.length === 0) return null;

                            const isExpanded = grupGosterim[grup.id] !== false; 

                            return (
                                <React.Fragment key={grup.id}>
                                    <tr className="row-header group-row" style={{color: '#92400E', backgroundColor: '#FEF3C7', cursor: 'pointer', transition: 'background 0.2s', borderBottom:'1px solid #FDE68A'}} onClick={() => setGrupGosterim(prev => ({...prev, [grup.id]: !prev[grup.id]}))} title="Detayları Gizle/Göster">
                                        <td style={{paddingLeft: '10px', whiteSpace: 'nowrap'}}>
                                            <i className={`ph ${isExpanded ? 'ph-caret-down' : 'ph-caret-right'}`} style={{fontSize: '12px', marginRight:'8px', display:'inline-block'}}></i>
                                            <span style={{fontWeight: 800}}>{grup.ad.toUpperCase()}</span>
                                        </td>
                                        {aktifPlanlar.map(p => {
                                            const subTutar = grubunKoduListesi.reduce((sum, kodu) => sum + (Number(p.giderler[kodu]) || 0), 0);
                                            return <td key={p.id} style={{color: '#92400E', fontWeight: 800}}>{subTutar > 0 ? window.fmt(subTutar) : '-'}</td>;
                                        })}
                                        <td className="total-col" style={{color: '#92400E', fontWeight:800}}>
                                            {window.fmt(grubunKoduListesi.reduce((sum, kodu) => sum + (Number(sonuc.giderDetaylari[kodu]?.tutar) || 0), 0))} ₺
                                        </td>
                                    </tr>
                                    
                                    {isExpanded && grubunKoduListesi.map(kodu => {
                                        const ad = (window.SABLON_GIDERLER || []).find(g => g.kodu === kodu)?.adi || kodu;
                                        let satirToplam = 0;

                                        return (
                                            <tr key={kodu} style={{backgroundColor: 'var(--surface-container-lowest)'}}>
                                                <td style={{paddingLeft: '35px', color: 'var(--on-surface-variant)', borderBottom: '1px dotted var(--surface-container-high)', fontWeight:500}}>{ad}</td>
                                                {aktifPlanlar.map(p => {
                                                    const tutar = Number(p.giderler[kodu]) || 0;
                                                    satirToplam += tutar;
                                                    return <td key={p.id} style={{color: 'var(--on-surface)', borderBottom: '1px dotted var(--surface-container-high)'}}>{tutar > 0 ? window.fmt(tutar) : '-'}</td>;
                                                })}
                                                <td className="total-col" style={{color: 'var(--error)', fontWeight: 600, borderBottom: '1px dotted var(--surface-container-high)'}}>{window.fmt(satirToplam)} ₺</td>
                                            </tr>
                                        )
                                    })}
                                </React.Fragment>
                            );
                        })}

                        <tr className="grand-total" style={{ borderTop: '2px solid var(--surface-container-highest)', marginTop: '15px' }}>
                            <td style={{ paddingTop: '15px', fontWeight:800 }}>TOPLAM OPEX (Tüm Gruplar)</td>
                            {aktifPlanlar.map(p => <td key={p.id} style={{ paddingTop: '15px', fontWeight:700 }}>{window.fmt(p.ozetOpex)}</td>)}
                            <td className="total-col" style={{color: 'var(--error)', fontSize:'14px', paddingTop: '15px', fontWeight:800}}>{window.fmt(sonuc.opex)} ₺</td>
                        </tr>

                        <tr style={{ background: 'var(--surface-container-high)' }}>
                            <td style={{ fontWeight: 800, fontSize: '14px', paddingTop: '15px', color:'var(--enba-dark)' }}>FAVÖK (EBITDA)</td>
                            {aktifPlanlar.map(p => <td key={p.id} style={{ fontWeight: 800, fontSize: '14px', paddingTop: '15px', color:'var(--enba-dark)' }}>{window.fmt(p.ebitda)}</td>)}
                            <td className="total-col" style={{ fontWeight: 800, fontSize: '15px', paddingTop: '15px', color:'var(--enba-orange-dark)' }}>{window.fmt(sonuc.ebitda)} ₺</td>
                        </tr>

                        <tr>
                            <td style={{color: 'var(--on-surface-variant)', fontWeight:600}}>Amortisman (CAPEX Aylık Yükü)</td>
                            {aktifPlanlar.map(p => <td key={p.id} style={{color: 'var(--on-surface-variant)'}}>{window.fmt(p.aylikAmortisman)}</td>)}
                            <td className="total-col" style={{color: 'var(--error)', fontWeight:700}}>{window.fmt(sonuc.amortisman)} ₺</td>
                        </tr>

                        <tr style={{ background: '#FFF7ED', borderTop: '2px solid #FED7AA' }}>
                            <td style={{ padding: '18px 10px', fontWeight: 900, fontSize: '16px', color:'var(--enba-dark)' }}>NET DURUM (KÂR / ZARAR)</td>
                            {aktifPlanlar.map(p => <td key={p.id} style={{ padding: '18px 10px', fontWeight: 900, fontSize: '16px', color: p.netKar>=0?'#16A34A':'var(--error)' }}>{window.fmt(p.netKar)}</td>)}
                            <td className="total-col" style={{ padding: '18px 10px', fontWeight: 900, fontSize: '20px', color: sonuc.net>=0?'#15803D':'var(--error)' }}>{window.fmt(sonuc.net)} ₺</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

