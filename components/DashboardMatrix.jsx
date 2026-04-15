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
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '15px', marginBottom: '15px'}}>
                    <h3 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>⚡  TKKÖ - TESİS KONSOLİDE KÂRLILIK ÖZETİ</h3>
                </div>
                <div style={{textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '15px'}}>
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
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '15px', marginBottom: '15px'}}>
                <h3 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>⚡  TKKÖ - TESİS KONSOLİDE KÂRLILIK ÖZETİ</h3>
                <div style={{display: 'flex', gap: '10px'}} data-html2canvas-ignore="true">
                    <button className="btn btn-success" style={{fontSize: '11px', padding: '6px 12px'}} onClick={exportToExcel}>⚡  Excel</button>
                    <button className="btn btn-danger" style={{fontSize: '11px', padding: '6px 12px'}} onClick={exportToPDF}>⚡  PDF</button>
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
                        <tr><td colSpan={aktifPlanlar.length + 2} className="row-header" style={{color: 'var(--enba-orange)'}}>⚡  GELİRLER</td></tr>
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
                            <td>TOPLAM GELİR</td>
                            {aktifPlanlar.map(p => <td key={p.id}>{window.fmt(p.ozetGelir)}</td>)}
                            <td className="total-col" style={{color: 'var(--enba-orange)', fontSize:'14px'}}>{window.fmt(sonuc.gelir)} ₺</td>
                        </tr>

                        {(window.GIDER_GRUPLARI || []).map(grup => {
                            const grubunKoduListesi = giderKodlari.filter(kodu => (window.SABLON_GIDERLER || []).find(g => g.kodu === kodu)?.grup === grup.id);
                            if (grubunKoduListesi.length === 0) return null;

                            const isExpanded = grupGosterim[grup.id] !== false; 

                            return (
                                <React.Fragment key={grup.id}>
                                    <tr className="row-header group-row" style={{color: '#F39C12', backgroundColor: 'rgba(243, 156, 18, 0.1)', cursor: 'pointer', transition: 'background 0.2s'}} onClick={() => setGrupGosterim(prev => ({...prev, [grup.id]: !prev[grup.id]}))} title="Detayları Gizle/Göster">
                                        <td style={{paddingLeft: '10px', whiteSpace: 'nowrap'}}>
                                            <span style={{display: 'inline-block', width: '20px', fontSize: '10px'}}>{isExpanded ? '▼' : '▶'}</span>
                                            <span style={{fontWeight: 'bold'}}>⚡  {grup.ad.toUpperCase()}</span>
                                        </td>
                                        {aktifPlanlar.map(p => {
                                            const subTutar = grubunKoduListesi.reduce((sum, kodu) => sum + (Number(p.giderler[kodu]) || 0), 0);
                                            return <td key={p.id} style={{color: '#F39C12', fontWeight: 'bold'}}>{subTutar > 0 ? window.fmt(subTutar) : '-'}</td>;
                                        })}
                                        <td className="total-col" style={{color: '#F39C12'}}>
                                            {window.fmt(grubunKoduListesi.reduce((sum, kodu) => sum + (Number(sonuc.giderDetaylari[kodu]?.tutar) || 0), 0))} ₺
                                        </td>
                                    </tr>
                                    
                                    {isExpanded && grubunKoduListesi.map(kodu => {
                                        const ad = (window.SABLON_GIDERLER || []).find(g => g.kodu === kodu)?.adi || kodu;
                                        let satirToplam = 0;

                                        return (
                                            <tr key={kodu} style={{backgroundColor: 'rgba(0,0,0,0.15)'}}>
                                                <td style={{paddingLeft: '35px', color: '#A0AEC0', borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>{ad}</td>
                                                {aktifPlanlar.map(p => {
                                                    const tutar = Number(p.giderler[kodu]) || 0;
                                                    satirToplam += tutar;
                                                    return <td key={p.id} style={{color: '#A0AEC0', borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>{tutar > 0 ? window.fmt(tutar) : '-'}</td>;
                                                })}
                                                <td className="total-col" style={{color: '#E74C3C', opacity: 0.8, borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>{window.fmt(satirToplam)} ₺</td>
                                            </tr>
                                        )
                                    })}
                                </React.Fragment>
                            );
                        })}

                        <tr className="grand-total" style={{ borderTop: '2px solid rgba(255,255,255,0.2)', marginTop: '15px' }}>
                            <td style={{ paddingTop: '15px' }}>TOPLAM OPEX (Tüm Gruplar)</td>
                            {aktifPlanlar.map(p => <td key={p.id} style={{ paddingTop: '15px' }}>{window.fmt(p.ozetOpex)}</td>)}
                            <td className="total-col" style={{color: '#E74C3C', fontSize:'14px', paddingTop: '15px'}}>{window.fmt(sonuc.opex)} ₺</td>
                        </tr>

                        <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <td style={{ fontWeight: 'bold', fontSize: '14px', paddingTop: '15px' }}>FAVÖK (EBITDA)</td>
                            {aktifPlanlar.map(p => <td key={p.id} style={{ fontWeight: 'bold', fontSize: '14px', paddingTop: '15px' }}>{window.fmt(p.ebitda)}</td>)}
                            <td className="total-col" style={{ fontWeight: 'bold', fontSize: '15px', paddingTop: '15px' }}>{window.fmt(sonuc.ebitda)} ₺</td>
                        </tr>

                        <tr>
                            <td style={{color: '#A0AEC0'}}>Amortisman (CAPEX Aylık Yükü)</td>
                            {aktifPlanlar.map(p => <td key={p.id} style={{color: '#A0AEC0'}}>{window.fmt(p.aylikAmortisman)}</td>)}
                            <td className="total-col" style={{color: '#E74C3C'}}>{window.fmt(sonuc.amortisman)} ₺</td>
                        </tr>

                        <tr style={{ background: 'rgba(243, 156, 18, 0.1)' }}>
                            <td style={{ padding: '18px 10px', fontWeight: 'bold', fontSize: '16px' }}>NET DURUM (KÂR / ZARAR)</td>
                            {aktifPlanlar.map(p => <td key={p.id} style={{ padding: '18px 10px', fontWeight: 'bold', fontSize: '16px', color: p.netKar>=0?'var(--enba-orange)':'#E74C3C' }}>{window.fmt(p.netKar)}</td>)}
                            <td className="total-col" style={{ padding: '18px 10px', fontWeight: 'bold', fontSize: '20px', color: sonuc.net>=0?'var(--enba-orange)':'#E74C3C' }}>{window.fmt(sonuc.net)} ₺</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

