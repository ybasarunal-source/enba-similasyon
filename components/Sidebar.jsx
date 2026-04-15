/**
 * Enba Similasyon - Yan Menü Bileşeni
 */

window.Sidebar = function Sidebar({
    sidebarAcik, setSidebarAcik,
    mobileSidebarAcik, setMobileSidebarAcik,
    bekleyenPlanlar, setBekleyenPlanlar,
    aktifPlanlar, setAktifPlanlar,
    yeniIpkBaslat,
    excelIceAktar,
    sablonIndir,
    suruklemeBasladi,
    IpkDuzenle,
    IpkSil,
    verileriSifirla
}) {
    return (
        <div className={`sidebar${sidebarAcik ? '' : ' sidebar-hidden'}${mobileSidebarAcik ? ' sidebar-open-mobile' : ''}`}>
            <button className="sidebar-toggle" onClick={() => setSidebarAcik(a => !a)} title={sidebarAcik ? 'Paneli Gizle' : 'Paneli Aç'}>
                {sidebarAcik ? '◀' : '▶'}
            </button>
            <div className="sidebar-content">
                <button className="btn btn-primary" onClick={yeniIpkBaslat}>+ YENİ İPK TASARLA</button>
                
                <input type="file" id="excel-upload" accept=".xlsx, .xls, .csv" style={{display: 'none'}} onChange={excelIceAktar} />
                <button className="btn btn-secondary" style={{marginBottom: '8px', backgroundColor: '#34495E'}} onClick={() => document.getElementById('excel-upload').click()}>
                    📈 EXCEL İLE YÜKLE
                </button>
                <button className="btn btn-secondary" style={{marginBottom: '15px', backgroundColor: '#1A5276'}} onClick={sablonIndir}>
                    ⬇ ŞABLON İNDİR
                </button>

                <h2 style={{ textTransform: 'lowercase' }}>📋 İPK LİSTESİ</h2>
                <p style={{ fontSize: '12px', color: '#607d8b' }}>Oluşturduğunuz modelleri tesise sürükleyin.</p>
                
                {bekleyenPlanlar
                    .filter(p => !p.plan_type || p.plan_type === 'fast')
                    .map(plan => (
                    <div key={plan.id} className="card" draggable onDragStart={(e) => suruklemeBasladi(e, plan.id)}>
                        <div className="card-title">{plan.baslik}</div>
                        <div className="card-info">Giriş: {window.fmt(plan.parametreler?.aylikTon)} Ton | Çıkış: {window.fmt(plan.kutleDengesi?.toplamSatisTon || plan.parametreler?.aylikTon)} Ton</div>
                        <div style={{fontSize:'12px', display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(255,255,255,0.1)', marginTop:'5px', paddingTop:'5px'}}>
                            <span>Net Kâr:</span> <strong style={{color: plan.netKar >= 0 ? '#82A12E' : '#ef5350'}}>{window.fmt(plan.netKar)} ₺</strong>
                        </div>
                        <div style={{ display:'flex', gap:'5px', marginTop:'10px' }}>
                            <button className="btn btn-warning" style={{flex:1, fontSize:'10px', padding:'5px'}} onClick={() => IpkDuzenle(plan)}>DÜZENLE</button>
                            <button className="btn btn-success" style={{flex:1, fontSize:'10px', padding:'5px'}} onClick={() => { setAktifPlanlar([...aktifPlanlar, plan]); setBekleyenPlanlar(bekleyenPlanlar.filter(x=>x.id!==plan.id)); }}>AKTİF ET</button>
                            <button className="btn btn-danger" style={{padding:'5px', fontSize:'10px'}} onClick={() => IpkSil(plan.id)}>X</button>
                        </div>
                    </div>
                ))}
                {bekleyenPlanlar.length === 0 && <p style={{color: '#999', fontSize: '14px', textTransform: 'lowercase'}}>henüz bir ipk oluşturulmadı.</p>}
                
                <div className="reset-btn-container">
                    <button className="btn btn-reset" onClick={verileriSifirla}>🗑 tm verileri ve planları sil</button>
                </div>
            </div>
        </div>
    );
};

