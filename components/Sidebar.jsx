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
            <button className="sidebar-toggle" style={{background: 'var(--surface-container-high)', color: 'var(--enba-dark)'}} onClick={() => setSidebarAcik(a => !a)} title={sidebarAcik ? 'Paneli Gizle' : 'Paneli Aç'}>
                <i className={`ph ${sidebarAcik ? 'ph-caret-left' : 'ph-caret-right'}`} style={{fontSize:'16px'}}></i>
            </button>
            <div className="sidebar-content" style={{paddingTop: '20px'}}>
                
                <div style={{display:'flex', flexDirection:'column', gap:'10px', marginBottom:'30px'}}>
                    <button className="btn btn-primary" style={{width:'100%', padding:'12px'}} onClick={yeniIpkBaslat}>
                        <i className="ph ph-plus-circle" style={{fontSize:'18px'}}></i> YENİ İPK TASARLA
                    </button>
                    
                    <input type="file" id="excel-upload" accept=".xlsx, .xls, .csv" style={{display: 'none'}} onChange={excelIceAktar} />
                    <button className="btn btn-secondary" style={{width:'100%'}} onClick={() => document.getElementById('excel-upload').click()}>
                        <i className="ph ph-file-xls" style={{fontSize:'18px', color:'#16A34A'}}></i> EXCEL İLE YÜKLE
                    </button>
                    <button className="btn btn-secondary" style={{width:'100%'}} onClick={sablonIndir}>
                        <i className="ph ph-download-simple" style={{fontSize:'18px', color:'var(--enba-orange)'}}></i> ŞABLON İNDİR
                    </button>
                </div>

                <div className="enba-section-title" style={{marginBottom:'10px', color: 'var(--enba-orange)'}}>
                    <i className="ph ph-list-bullets" style={{fontSize:'18px'}}></i> İPK LİSTESİ
                </div>
                <p style={{ fontSize: '12px', color: '#888', marginBottom:'20px', fontWeight:500 }}>Modelleri tesise sürükleyerek aktif edebilirsiniz.</p>
                
                <div style={{flex:1, overflowY:'auto', paddingRight:'5px'}}>
                    {bekleyenPlanlar
                        .filter(p => !p.plan_type || p.plan_type === 'fast')
                        .map(plan => (
                        <div key={plan.id} className="sidebar-card" draggable onDragStart={(e) => suruklemeBasladi(e, plan.id)}>
                            <div style={{fontWeight:800, fontSize:'14px', color:'var(--enba-dark)', marginBottom:'4px'}}>{plan.baslik}</div>
                            <div style={{fontSize:'11px', color:'#666', marginBottom:'10px'}}>
                                {window.fmt(plan.parametreler?.aylikTon)} Ton Giriş / {window.fmt(plan.kutleDengesi?.toplamSatisTon || plan.parametreler?.aylikTon)} Ton Çıkış
                            </div>
                            
                            <div style={{fontSize:'12px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--surface-container-low)', padding:'6px 10px', borderRadius:'8px', marginBottom:'12px'}}>
                                <span style={{fontWeight:600, color:'#888', fontSize:'10px', textTransform:'uppercase'}}>Tahmini Net Kâr</span>
                                <strong style={{color: plan.netKar >= 0 ? '#16A34A' : '#DC2626', fontSize:'13px'}}>{window.fmt(plan.netKar)} ₺</strong>
                            </div>

                            <div style={{ display:'flex', gap:'6px' }}>
                                <button className="btn btn-secondary" style={{flex:1, fontSize:'10px', padding:'6px 0'}} onClick={() => IpkDuzenle(plan)}>
                                    <i className="ph ph-pencil-simple"></i>
                                </button>
                                <button className="btn btn-primary" style={{flex:3, fontSize:'10px', padding:'6px 0'}} onClick={() => { setAktifPlanlar([...aktifPlanlar, plan]); setBekleyenPlanlar(bekleyenPlanlar.filter(x=>x.id!==plan.id)); }}>
                                    <i className="ph ph-play-circle"></i> AKTİF ET
                                </button>
                                <button className="btn btn-danger btn-icon" 
                                    style={{width:'28px', height:'28px'}}
                                    title="Bu Planı Tamamen Sil"
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); IpkSil(plan.id); }}>
                                    <i className="ph ph-trash" style={{fontSize:'14px'}}></i>
                                </button>
                            </div>
                        </div>
                    ))}
                    {bekleyenPlanlar.length === 0 && <div style={{textAlign:'center', padding:'30px 10px', color: '#bbb', fontSize: '13px', fontStyle:'italic'}}>Henüz bir İPK oluşturulmadı.</div>}
                </div>
                
                <div style={{marginTop:'auto', paddingTop:'20px', borderTop:'1px solid #eee'}}>
                    <button className="btn btn-danger" style={{width:'100%', padding:'12px', fontSize:'11px', opacity:0.8}} onClick={verileriSifirla}>
                        <i className="ph ph-warning-octagon"></i> TÜM VERİLERİ SIFIRLA
                    </button>
                </div>
            </div>
        </div>
    );
};

