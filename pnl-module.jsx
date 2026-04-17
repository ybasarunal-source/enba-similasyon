const { useState, useMemo, useEffect } = React;

function PnlRaporu() {
    const [gelirData, setGelirData] = useState(null);
    const [giderData, setGiderData] = useState(null);
    const [gelirDosya, setGelirDosya] = useState("");
    const [giderDosya, setGiderDosya] = useState("");
    
    const [savedReports, setSavedReports] = useState([]);
    const [raporAdi, setRaporAdi] = useState("");

    // UI Toggles
    const [gelirAcik, setGelirAcik] = useState(true);
    const [giderAcik, setGiderAcik] = useState(true);
    const [capexActive, setCapexActive] = useState(false);
    const [capexVade, setCapexVade] = useState(18);
    const [modelDetayAcik, setModelDetayAcik] = useState(false);
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);
    
    const [grupAcik, setGrupAcik] = useState({});

    const toggleGrup = (grupAd) => {
        setGrupAcik(prev => ({...prev, [grupAd]: prev[grupAd] === undefined ? true : !prev[grupAd]}));
    };

    useEffect(() => {
        const saved = localStorage.getItem('enba_pnl_reports');
        if(saved) {
            try { setSavedReports(JSON.parse(saved)); } catch(e){}
        }
    }, []);

    const raporuKaydet = () => {
        if(!raporAdi.trim()) {
            alert("Lütfen kaydetmeden önce raporunuza bir isim verin!");
            return;
        }
        if(!gelirData && !giderData) {
            alert("Kaydedilecek bir veri (Excel yüklemesi) yok.");
            return;
        }
        
        const newReport = {
            id: Date.now().toString(),
            name: raporAdi.trim(),
            date: new Date().toLocaleDateString('tr-TR'),
            payload: {
                gelirData,
                giderData,
                capexActive,
                capexVade,
                gelirDosya,
                giderDosya,
                modelDetayAcik
            }
        };
        
        const updated = [...savedReports, newReport];
        setSavedReports(updated);
        localStorage.setItem('enba_pnl_reports', JSON.stringify(updated));
        
        alert("Rapor başarıyla kaydedildi!");
        setRaporAdi("");
    };

    const raporuYukle = (report) => {
        setGelirData(report.payload.gelirData);
        setGiderData(report.payload.giderData);
        setCapexActive(report.payload.capexActive || false);
        setCapexVade(report.payload.capexVade || 18);
        setModelDetayAcik(report.payload.modelDetayAcik || false);
        setGelirDosya(report.payload.gelirDosya || "Kayıtlı Gelir Verisi");
        setGiderDosya(report.payload.giderDosya || "Kayıtlı Gider Verisi");
    };

    const raporuSil = (id) => {
        if(confirm("Bu kayıtlı raporu silmek istediğinize emin misiniz?")) {
            const updated = savedReports.filter(r => r.id !== id);
            setSavedReports(updated);
            localStorage.setItem('enba_pnl_reports', JSON.stringify(updated));
        }
    };

    const formatleTutar = (num) => {
        return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(num || 0);
    };

    const parseExcel = (json) => {
        let aylarSet = new Set();
        let modellerSet = new Set();
        let kategoriMap = {}; 
        let aylikToplam = {}; 
        
        json.forEach(row => {
            const tarihKey = Object.keys(row).find(k => k.toLowerCase().includes('tarih'));
            const kategoriKey = Object.keys(row).find(k => k.toLowerCase().includes('kategori'));
            const tutarKeyTL = Object.keys(row).find(k => k.toLowerCase().includes('genel toplam (tl)'));
            const tutarKeyGenel = Object.keys(row).find(k => k.toLowerCase().includes('toplam') && !k.toLowerCase().includes('kdv'));
            
            let tutarKey = tutarKeyTL || tutarKeyGenel;
            if(!tutarKey) return; 
            
            let tarihVal = tarihKey ? row[tarihKey] : null;
            let rawAy = "Bilinmeyen Tarih";
            
            if (tarihVal) {
                if (tarihVal instanceof Date) {
                   const m = tarihVal.getMonth() + 1;
                   const y = tarihVal.getFullYear();
                   rawAy = `${y}-${m.toString().padStart(2, '0')}`;
                } else if (typeof tarihVal === 'string') {
                   const parts = tarihVal.split('.');
                   if(parts.length === 3) {
                       rawAy = `${parts[2]}-${parts[1].padStart(2, '0')}`;
                   } else {
                       rawAy = tarihVal.substring(0, 7); 
                   }
                } else if(typeof tarihVal === 'number') {
                     const date = new Date(Math.round((tarihVal - 25569)*86400*1000));
                     const m = date.getMonth() + 1;
                     const y = date.getFullYear();
                     rawAy = `${y}-${m.toString().padStart(2, '0')}`;
                }
            }

            aylarSet.add(rawAy);
            
            let rawKat = (kategoriKey && row[kategoriKey]) ? row[kategoriKey].toString().trim() : "Genel/Diğer";
            let tutar = Number(row[tutarKey]) || 0;
            
            let model = "Ortak";
            let baseKat = rawKat;
            
            const match = rawKat.match(/^([A-Za-z]+)[-_ \.]?(\d+.*)$/);
            if (match) {
                let prefix = match[1].toUpperCase();
                baseKat = match[2].trim();
                
                if (prefix === 'YM') {
                    model = "Ortak";
                } else {
                    model = prefix;
                }
            }
            
            modellerSet.add(model);
            
            if(!kategoriMap[baseKat]) kategoriMap[baseKat] = {};
            if(!kategoriMap[baseKat][rawAy]) kategoriMap[baseKat][rawAy] = {};
            if(!kategoriMap[baseKat][rawAy][model]) kategoriMap[baseKat][rawAy][model] = 0;
            
            kategoriMap[baseKat][rawAy][model] += tutar;
            
            if(!aylikToplam[rawAy]) aylikToplam[rawAy] = { Toplam: 0 };
            if(!aylikToplam[rawAy][model]) aylikToplam[rawAy][model] = 0;
            
            aylikToplam[rawAy][model] += tutar;
            aylikToplam[rawAy].Toplam += tutar;
        });
        
        return {
            aylar: Array.from(aylarSet),
            modeller: Array.from(modellerSet),
            kategoriler: kategoriMap,
            aylikToplam: aylikToplam
        };
    };

    const dosyaSecildi = (e, tip) => {
        const file = e.target.files[0];
        if(!file) return;
        
        if(tip === 'gelir') setGelirDosya(file.name);
        else setGiderDosya(file.name);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target.result;
            const wb = XLSX.read(data, {type: 'binary', cellDates: true, dateNF: 'yyyy-mm-dd'});
            const sheetName = wb.SheetNames[0];
            const sheet = wb.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            
            const parsed = parseExcel(json);
            if(tip === 'gelir') setGelirData(parsed);
            else setGiderData(parsed);
        };
        reader.readAsBinaryString(file);
    };

    const pGiderData = useMemo(() => {
        if(!giderData) return null;
        if(!capexActive) return giderData;

        let d = JSON.parse(JSON.stringify(giderData));
        let capexSchedules = [];

        Object.keys(d.kategoriler).forEach(kat => {
            if (kat.startsWith("680") || kat.toLowerCase().includes("kurulum")) {
                Object.keys(d.kategoriler[kat]).forEach(ay => {
                    Object.keys(d.kategoriler[kat][ay]).forEach(mod => {
                        const t = d.kategoriler[kat][ay][mod];
                        if(t > 0) {
                            capexSchedules.push({ kokenKat: kat, baslangicAy: ay, tutar: t, aylikTutar: t / capexVade, model: mod });
                            
                            d.kategoriler[kat][ay][mod] = 0;
                            d.aylikToplam[ay][mod] -= t;
                            d.aylikToplam[ay].Toplam -= t;
                        }
                    });
                });
            }
        });

        if(capexSchedules.length > 0) {
            const amortKat = `680&Kurulum - Amortismanı (CAPEX - ${capexVade} Ay)`;
            if(!d.kategoriler[amortKat]) d.kategoriler[amortKat] = {};

            capexSchedules.forEach(schedule => {
                let sDate = new Date(`${schedule.baslangicAy}-01`);
                for(let i=0; i<capexVade; i++) {
                    let cDate = new Date(sDate);
                    cDate.setMonth(cDate.getMonth() + i);
                    let targetAy = `${cDate.getFullYear()}-${(cDate.getMonth() + 1).toString().padStart(2, '0')}`;
                    
                    if(!d.aylikToplam[targetAy]) {
                        d.aylikToplam[targetAy] = { Toplam: 0 };
                        d.modeller.forEach(m => d.aylikToplam[targetAy][m] = 0);
                    }
                    
                    if(!d.kategoriler[amortKat][targetAy]) d.kategoriler[amortKat][targetAy] = {};
                    if(!d.kategoriler[amortKat][targetAy][schedule.model]) d.kategoriler[amortKat][targetAy][schedule.model] = 0;
                    
                    d.kategoriler[amortKat][targetAy][schedule.model] += schedule.aylikTutar;
                    d.aylikToplam[targetAy][schedule.model] = (d.aylikToplam[targetAy][schedule.model] || 0) + schedule.aylikTutar;
                    d.aylikToplam[targetAy].Toplam += schedule.aylikTutar;

                    if(!d.aylar.includes(targetAy)) d.aylar.push(targetAy);
                }
            });
            d.aylar.sort();
        }
        
        return d;
    }, [giderData, capexActive, capexVade]);

    const { aylar, modeller } = useMemo(() => {
        let yAylar = new Set();
        let yModeller = new Set();
        
        if(gelirData) { gelirData.aylar.forEach(a => yAylar.add(a)); gelirData.modeller.forEach(m => yModeller.add(m)); }
        if(pGiderData) { pGiderData.aylar.forEach(a => yAylar.add(a)); pGiderData.modeller.forEach(m => yModeller.add(m)); }
        
        const aList = Array.from(yAylar).sort();
        const mList = Array.from(yModeller).sort((a,b) => {
            if (a === 'Ortak') return 1;
            if (b === 'Ortak') return -1;
            return a.localeCompare(b);
        });
        return { aylar: aList, modeller: mList };
    }, [gelirData, pGiderData]);

    const getHucreselTutar = (data, kat, ay, mod) => {
        if(!data || !data.kategoriler[kat] || !data.kategoriler[kat][ay] || !data.kategoriler[kat][ay][mod]) return 0;
        return data.kategoriler[kat][ay][mod];
    };

    const getAylikToplam = (data, ay, mod) => {
        if(!data || !data.aylikToplam[ay]) return 0;
        if(mod === 'Toplam') return data.aylikToplam[ay].Toplam || 0;
        return data.aylikToplam[ay][mod] || 0;
    };

    const excelIndir = () => {
        const table = document.getElementById('pnl-table-report-0');
        if (!table) return;
        const wb = XLSX.utils.table_to_book(table, {sheet: "P&L Raporu"});
        XLSX.writeFile(wb, "Enba_PNL_Raporu.xlsx");
    };

    const pdfIndir = () => {
        setIsPdfGenerating(true);
        setTimeout(() => {
            const printContainer = document.getElementById('pnl-report-container-print');
            if (!printContainer) return;

            const opt = {
                margin:       [10, 10, 10, 10],
                filename:     'Enba_PNL_Raporu.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a3', orientation: 'landscape' },
                pagebreak:    { mode: ['css', 'legacy'] }
            };

            const actions = document.getElementById('pnl-actions');
            if (actions) actions.style.display = 'none';

            html2pdf().set(opt).from(printContainer).save().then(() => {
                if (actions) actions.style.display = 'flex';
                setIsPdfGenerating(false);
            });
        }, 500); 
    };

    // Table Rendering Core Component
    const renderTableDenge = (sAylar, oAylarFull, showTotalCol, tableIndex) => {
        const renderKategoriSatirlari = (data, tipLabel, colorCss, isGrupEnabled = false) => {
            if(!data) return null;
            let kats = Object.keys(data.kategoriler).sort();
            
            if (!isGrupEnabled) {
                return kats.map(kat => {
                    const isAmort = kat.includes("Amortisman");
                    const highlightStyle = isAmort ? {background: 'rgba(243, 156, 18, 0.1)', color: 'var(--enba-orange)', fontWeight: 'bold'} : {};
                    
                    let rowGenelGlobal = 0;
                    oAylarFull.forEach(ga => modeller.forEach(gm => { rowGenelGlobal += getHucreselTutar(data, kat, ga, gm) }));

                    return (
                        <tr key={kat} style={{borderBottom: '1px solid var(--surface-container-high)', ...highlightStyle}}>
                            <td style={{padding: '14px 10px', color: isAmort ? 'var(--enba-orange)' : 'var(--enba-dark)', fontWeight: isAmort ? '800' : '500'}}>
                                <span style={{fontSize: '11px', padding: '4px 8px', background: 'var(--surface-container-high)', borderRadius: '4px', marginRight: '8px', color: 'var(--on-surface-variant)', fontWeight: 800}}>{tipLabel}</span>
                                {isAmort ? <><i className="ph ph-sparkle"></i> {kat}</> : kat}
                            </td>
                            {sAylar.map(ay => {
                                let ayTop = 0;
                                const modCells = modeller.map(mod => {
                                    const val = getHucreselTutar(data, kat, ay, mod);
                                    ayTop += val;
                                    return <td key={`${ay}-${mod}`} style={{padding: '14px 10px', textAlign: 'right', color: isAmort ? 'var(--enba-orange)' : '#34495E', borderLeft: mod === modeller[0] ? '2px solid #eee' : '1px solid transparent'}}>{val > 0 ? formatleTutar(val) : '-'}</td>
                                });
                                
                                if (modelDetayAcik) {
                                    return (
                                        <React.Fragment key={`frag-${kat}-${ay}`}>
                                            {modCells}
                                            <td style={{padding: '14px 10px', textAlign: 'right', borderLeft: '1px solid #ddd', background: '#fafafa', color: isAmort ? 'var(--enba-orange)' : '#2c3e50', fontWeight: 'bold'}}>{ayTop > 0 ? formatleTutar(ayTop) : '-'}</td>
                                        </React.Fragment>
                                    );
                                } else {
                                    return <td key={`top-${kat}-${ay}`} style={{padding: '14px 10px', textAlign: 'right', borderLeft: '2px solid #eee', background: '#fafafa', color: isAmort ? 'var(--enba-orange)' : '#2c3e50', fontWeight: 'bold'}}>{ayTop > 0 ? formatleTutar(ayTop) : '-'}</td>;
                                }
                            })}
                            {showTotalCol && <td style={{padding: '14px 10px', textAlign: 'right', fontWeight: '800', borderLeft: '2px solid var(--surface-container-high)', color: colorCss}}>{formatleTutar(rowGenelGlobal)} ₺</td>}
                        </tr>
                    )
                });
            } else {
                let gruplar = {};
                kats.forEach(kat => {
                    let grupAdi = "Diğer Giderler";
                    const m = kat.match(/^(\d{1})/); 
                    if (m) {
                        const digit = m[1];
                        if (digit === "2") grupAdi = "200'ler - Satış Maliyeti";
                        else if (digit === "3") grupAdi = "300'ler - Alış Maliyeti";
                        else if (digit === "4") grupAdi = "400'ler - Üretim Maliyetleri";
                        else if (digit === "5") grupAdi = "500'ler - Bakım Onarım Maliyeti";
                        else if (digit === "6") grupAdi = "600'ler - Diğer Maliyetler";
                        else grupAdi = `${digit}00'lü Grubun Toplamı`;
                    }
                    if (!gruplar[grupAdi]) gruplar[grupAdi] = [];
                    gruplar[grupAdi].push(kat);
                });

                return Object.keys(gruplar).sort().map(grupAdi => {
                    // Force open all groups during PDF generation for transparency.
                    const isOpen = isPdfGenerating ? true : grupAcik[grupAdi] === true; 
                    
                    let grupGloGenel = 0;
                    oAylarFull.forEach(ga => modeller.forEach(gm => { 
                        gruplar[grupAdi].forEach(kat => grupGloGenel += getHucreselTutar(data, kat, ga, gm));
                    }));

                    const grupAylarAraTpl = {}; 
                    sAylar.forEach(ay => {
                        if (!grupAylarAraTpl[ay]) grupAylarAraTpl[ay] = {};
                        modeller.forEach(mod => {
                            let cellTot = 0;
                            gruplar[grupAdi].forEach(kat => {
                                cellTot += getHucreselTutar(data, kat, ay, mod);
                            });
                            grupAylarAraTpl[ay][mod] = cellTot;
                        });
                    });

                    return (
                        <React.Fragment key={grupAdi}>
                            <tr style={{background: 'var(--surface-container-low)', cursor: 'pointer', borderBottom: '1px solid var(--surface-container-high)'}} onClick={() => toggleGrup(grupAdi)}>
                                <td style={{padding: '12px 14px', color: 'var(--enba-dark)', fontWeight: '800'}}>
                                   <span style={{display: 'inline-block', width: '24px', fontSize: '14px', color: 'var(--on-surface-variant)'}}>
                                       <i className={`ph ph-caret-${isOpen ? 'down' : 'right'}`}></i>
                                   </span>
                                   <i className="ph ph-lightning" style={{ color: 'var(--enba-orange)', marginRight: '6px' }}></i> {grupAdi}
                                </td>
                                {sAylar.map(ay => {
                                    let ayTop = 0;
                                    const modCells = modeller.map(mod => {
                                        const val = grupAylarAraTpl[ay][mod];
                                        ayTop += val;
                                        return <td key={`grp-${ay}-${mod}`} style={{padding: '12px 10px', textAlign: 'right', fontWeight: '700', color: 'var(--enba-dark)', borderLeft: mod === modeller[0] ? '2px solid #ddd' : '1px solid transparent', borderBottom: '1px solid var(--border-grey)'}}>{val > 0 ? formatleTutar(val) : '-'}</td>
                                    });
                                    
                                    if (modelDetayAcik) {
                                         return (
                                            <React.Fragment key={`frag-grp-${ay}`}>
                                                {modCells}
                                                <td style={{padding: '12px 10px', textAlign: 'right', borderLeft: '1px solid #ddd', background: 'var(--surface-container-low)', fontWeight: '800', color: 'var(--enba-dark)', borderBottom: '1px solid var(--border-grey)'}}>{formatleTutar(ayTop)}</td>
                                            </React.Fragment>
                                         )
                                    } else {
                                         return <td key={`top-grp-${ay}`} style={{padding: '12px 10px', textAlign: 'right', borderLeft: '2px solid #ddd', background: 'var(--surface-container-low)', fontWeight: '800', color: 'var(--enba-dark)', borderBottom: '1px solid var(--border-grey)'}}>{formatleTutar(ayTop)}</td>
                                    }
                                })}
                                {showTotalCol && <td style={{padding: '12px 10px', textAlign: 'right', fontWeight: '800', borderLeft: '2px solid #ddd', color: 'var(--enba-dark)', borderBottom: '1px solid var(--border-grey)'}}>{formatleTutar(grupGloGenel)} ₺</td>}
                            </tr>

                            {isOpen && gruplar[grupAdi].map(kat => {
                                    const isAmort = kat.includes("Amortisman");
                                    const highlightStyle = isAmort ? {background: 'rgba(243, 156, 18, 0.05)', color: 'var(--enba-orange)', fontWeight: 'bold'} : {};
                                    let cGloGenel = 0;
                                    oAylarFull.forEach(ga => modeller.forEach(gm => cGloGenel += getHucreselTutar(data, kat, ga, gm)));

                                    return (
                                        <tr key={kat} style={{borderBottom: '1px solid var(--surface-container-high)', ...highlightStyle}}>
                                            <td style={{padding: '10px 10px 10px 36px', color: isAmort ? 'var(--enba-orange)' : '#4b6584', fontWeight: isAmort ? '800' : '500', fontSize: '13px'}}>
                                                <span style={{color: '#bdc3c7', marginRight: '6px'}}>└</span>
                                                {isAmort ? <><i className="ph ph-sparkle"></i> {kat}</> : kat}
                                            </td>
                                            {sAylar.map(ay => {
                                                let ayTop = 0;
                                                const modCells = modeller.map(mod => {
                                                    const val = getHucreselTutar(data, kat, ay, mod);
                                                    ayTop += val;
                                                    return <td key={`ch-${ay}-${mod}`} style={{padding: '10px 10px', textAlign: 'right', color: isAmort ? 'var(--enba-orange)' : '#7f8c8d', fontSize: '13px', borderLeft: mod === modeller[0] ? '2px solid var(--surface-container-high)' : '1px solid transparent'}}>{val > 0 ? formatleTutar(val) : '-'}</td>
                                                });
                                                if (modelDetayAcik) {
                                                    return (
                                                        <React.Fragment key={`frag-ch-${ay}`}>
                                                            {modCells}
                                                            <td style={{padding: '10px 10px', textAlign: 'right', borderLeft: '1px solid var(--surface-container-high)', background: 'var(--surface-container-lowest)', fontWeight: 'bold', fontSize: '13px', color: isAmort ? 'var(--enba-orange)' : '#34495E'}}>{ayTop > 0 ? formatleTutar(ayTop) : '-'}</td>
                                                        </React.Fragment>
                                                    )
                                                } else {
                                                    return <td key={`top-ch-${ay}`} style={{padding: '10px 10px', textAlign: 'right', borderLeft: '2px solid var(--surface-container-high)', background: 'var(--surface-container-lowest)', fontWeight: 'bold', fontSize: '13px', color: isAmort ? 'var(--enba-orange)' : '#34495E'}}>{ayTop > 0 ? formatleTutar(ayTop) : '-'}</td>
                                                }
                                            })}
                                            {showTotalCol && <td style={{padding: '10px 10px', textAlign: 'right', fontWeight: 'bold', borderLeft: '2px solid var(--surface-container-high)', color: colorCss, fontSize: '13px'}}>{formatleTutar(cGloGenel)} ₺</td>}
                                        </tr>
                                    )
                            })}
                        </React.Fragment>
                    );
                });
            }
        };

        return (
            <table id={`pnl-table-report-${tableIndex}`} className="matrix-table html2pdf__page-break" style={{width: '100%', minWidth: '800px', borderCollapse: 'collapse', marginBottom: '20px', background: '#fff', border: '1px solid var(--surface-container-highest)'}}>
                <thead>
                    <tr style={{background: 'var(--surface-container-low)'}}>
                        <th rowSpan="2" style={{textAlign: 'left', padding: '16px', borderBottom: '2px solid var(--enba-dark)', color: 'var(--enba-dark)', width: '250px', fontSize: '13px', fontWeight: 800}}>FİNANSAL KATEGORİSİ</th>
                        {sAylar.map(ay => (
                            <th key={ay} colSpan={modelDetayAcik ? modeller.length + 1 : 1} style={{textAlign: 'center', padding: '12px', borderBottom: '1px solid var(--surface-container-high)', borderLeft: '1px solid var(--surface-container-high)', color: 'var(--enba-dark)', fontSize: '13px', fontWeight: 800}}>{ay}</th>
                        ))}
                        {showTotalCol && <th rowSpan="2" style={{textAlign: 'right', padding: '16px', borderBottom: '2px solid var(--enba-orange)', borderLeft: '1px solid var(--surface-container-high)', color: 'var(--enba-orange)', fontSize: '13px', fontWeight: 800}}>GENEL TOPLAM</th>}
                    </tr>
                    <tr style={{background: 'var(--surface-container-lowest)'}}>
                        {sAylar.map(ay => {
                            if(modelDetayAcik) {
                                return (
                                    <React.Fragment key={`th-${ay}`}>
                                        {modeller.map(mod => (
                                            <th key={`${ay}-${mod}`} style={{textAlign: 'right', padding: '10px 12px', fontSize: '11px', borderBottom: '2px solid var(--enba-dark)', borderLeft: mod === modeller[0] ? '1px solid var(--surface-container-high)' : '1px solid var(--surface-container-lowest)', color: mod === 'Ortak' ? 'var(--on-surface-variant)' : 'var(--enba-dark)', fontWeight: 700}}>{mod}</th>
                                        ))}
                                        <th key={`${ay}-toplam`} style={{textAlign: 'right', padding: '10px 12px', fontSize: '11px', borderBottom: '2px solid var(--enba-dark)', borderLeft: '1px solid var(--surface-container-high)', background: 'var(--surface-container-low)', color: 'var(--enba-dark)', fontWeight: 800}}>TOPLAM</th>
                                    </React.Fragment>
                                )
                            } else {
                                return <th key={`${ay}-toplam`} style={{textAlign: 'right', padding: '10px 12px', fontSize: '11px', borderBottom: '2px solid var(--enba-dark)', borderLeft: '1px solid var(--surface-container-high)', background: 'var(--surface-container-low)', color: 'var(--enba-dark)', fontWeight: 800}}>TOPLAM</th>
                            }
                        })}
                    </tr>
                </thead>
                <tbody>
                    
                    {gelirData && (
                        <>
                            <tr>
                                <td colSpan={1 + sAylar.length * (modelDetayAcik ? modeller.length + 1 : 1) + (showTotalCol ? 1 : 0)} onClick={() => setGelirAcik(!gelirAcik)} style={{background: 'var(--surface-container-lowest)', color: 'var(--success)', fontWeight: '800', padding: '14px 16px', borderBottom: '2px solid var(--success)', cursor: 'pointer', fontSize: '14px'}}>
                                    <span style={{display: 'inline-block', width: '24px', fontSize: '14px'}}><i className={`ph ph-caret-${gelirAcik || isPdfGenerating ? 'down' : 'right'}`}></i></span>
                                    I. GELİRLER (SATIŞLAR)
                                </td>
                            </tr>
                            {(gelirAcik || isPdfGenerating) && renderKategoriSatirlari(gelirData, 'GELİR', 'var(--success)')}
                            
                            <tr style={{background: 'rgba(46, 204, 113, 0.05)'}}>
                                <td style={{padding: '14px 16px', fontWeight: '800', color: 'var(--success)', borderBottom: '1px solid var(--success)'}}>GELİR TOPLAMI:</td>
                                {sAylar.map(ay => {
                                    let ayTop = getAylikToplam(gelirData, ay, 'Toplam');
                                    const modCells = modeller.map(mod => (
                                        <td key={`gelir-${ay}-${mod}`} style={{padding: '14px 12px', textAlign: 'right', fontWeight: '800', color: 'var(--success)', borderLeft: mod === modeller[0] ? '1px solid var(--surface-container-high)' : '1px solid transparent', borderBottom: '1px solid var(--success)'}}>{formatleTutar(getAylikToplam(gelirData, ay, mod))}</td>
                                    ));

                                    if (modelDetayAcik) {
                                        return (
                                            <React.Fragment key={`frag-geltop-${ay}`}>
                                                {modCells}
                                                <td style={{padding: '14px 12px', textAlign: 'right', fontWeight: '800', borderLeft: '1px solid var(--success)', background: 'rgba(46, 204, 113, 0.1)', color: 'var(--success)', borderBottom: '1px solid var(--success)'}}>{formatleTutar(ayTop)}</td>
                                            </React.Fragment>
                                        )
                                    } else {
                                        return <td key={`top-geltop-${ay}`} style={{padding: '14px 12px', textAlign: 'right', fontWeight: '800', borderLeft: '1px solid var(--success)', background: 'rgba(46, 204, 113, 0.1)', color: 'var(--success)', borderBottom: '1px solid var(--success)'}}>{formatleTutar(ayTop)}</td>
                                    }
                                })}
                                {showTotalCol && <td style={{padding: '14px 12px', textAlign: 'right', fontWeight: '800', color: 'var(--success)', borderLeft: '1px solid var(--success)', borderBottom: '1px solid var(--success)'}}>
                                    {formatleTutar(oAylarFull.reduce((a, b) => a + getAylikToplam(gelirData, b, 'Toplam'), 0))} ₺
                                </td>}
                            </tr>
                        </>
                    )}

                    {pGiderData && (
                        <>
                            <tr>
                                <td colSpan={1 + sAylar.length * (modelDetayAcik ? modeller.length + 1 : 1) + (showTotalCol ? 1 : 0)} onClick={() => setGiderAcik(!giderAcik)} style={{background: 'var(--surface-container-lowest)', color: 'var(--error)', fontWeight: '800', padding: '14px 16px', borderBottom: '2px solid var(--error)', borderTop: '4px solid transparent', cursor: 'pointer', fontSize: '14px'}}>
                                    <span style={{display: 'inline-block', width: '24px', fontSize: '14px'}}><i className={`ph ph-caret-${giderAcik || isPdfGenerating ? 'down' : 'right'}`}></i></span>
                                    II. GİDERLER (OPEX & YATIRIM)
                                </td>
                            </tr>
                            {(giderAcik || isPdfGenerating) && renderKategoriSatirlari(pGiderData, 'GİDER', 'var(--error)', true)}
                            
                            <tr style={{background: 'rgba(231, 76, 60, 0.05)'}}>
                                <td style={{padding: '14px 16px', fontWeight: '800', color: 'var(--error)', borderBottom: '1px solid var(--error)'}}>GİDER TOPLAMI:</td>
                                {sAylar.map(ay => {
                                    let ayTop = getAylikToplam(pGiderData, ay, 'Toplam');
                                    const modCells = modeller.map(mod => (
                                        <td key={`gider-${ay}-${mod}`} style={{padding: '14px 12px', textAlign: 'right', fontWeight: '800', color: 'var(--error)', borderLeft: mod === modeller[0] ? '1px solid var(--surface-container-high)' : '1px solid transparent', borderBottom: '1px solid var(--error)'}}>{formatleTutar(getAylikToplam(pGiderData, ay, mod))}</td>
                                    ));

                                    if (modelDetayAcik) {
                                        return (
                                            <React.Fragment key={`frag-gidtop-${ay}`}>
                                                {modCells}
                                                <td style={{padding: '14px 12px', textAlign: 'right', fontWeight: '800', borderLeft: '1px solid var(--error)', background: 'rgba(231, 76, 60, 0.1)', color: 'var(--error)', borderBottom: '1px solid var(--error)'}}>{formatleTutar(ayTop)}</td>
                                            </React.Fragment>
                                        )
                                    } else {
                                        return <td key={`top-gidtop-${ay}`} style={{padding: '14px 12px', textAlign: 'right', fontWeight: '800', borderLeft: '1px solid var(--error)', background: 'rgba(231, 76, 60, 0.1)', color: 'var(--error)', borderBottom: '1px solid var(--error)'}}>{formatleTutar(ayTop)}</td>
                                    }
                                })}
                                {showTotalCol && <td style={{padding: '14px 12px', textAlign: 'right', fontWeight: '800', color: 'var(--error)', borderLeft: '1px solid var(--error)', borderBottom: '1px solid var(--error)'}}>
                                    {formatleTutar(oAylarFull.reduce((a, b) => a + getAylikToplam(pGiderData, b, 'Toplam'), 0))} ₺
                                </td>}
                            </tr>
                        </>
                    )}

                    {(gelirData && pGiderData) && (
                        <>
                            <tr><td colSpan={1 + sAylar.length * (modelDetayAcik ? modeller.length + 1 : 1) + (showTotalCol ? 1 : 0)} style={{borderTop: '6px solid var(--enba-dark)'}}></td></tr>
                            <tr style={{background: 'var(--enba-dark)'}}>
                                <td style={{padding: '24px 16px', fontWeight: '900', color: '#fff', fontSize: '16px'}}>NET KÂR / ZARAR (EBITDA)</td>
                                {sAylar.map(ay => {
                                    const gTot = getAylikToplam(gelirData, ay, 'Toplam');
                                    const cTot = getAylikToplam(pGiderData, ay, 'Toplam');
                                    const netTop = gTot - cTot;
                                    const topColor = netTop > 0 ? 'var(--success)' : (netTop < 0 ? 'var(--error)' : '#bdc3c7');

                                    const modCells = modeller.map(mod => {
                                        const gelir = getAylikToplam(gelirData, ay, mod);
                                        const c = getAylikToplam(pGiderData, ay, mod);
                                        const net = gelir - c;
                                        const rColor = net > 0 ? 'var(--success)' : (net < 0 ? 'var(--error)' : '#bdc3c7'); 
                                        return <td key={`net-${ay}-${mod}`} style={{padding: '24px 12px', textAlign: 'right', fontWeight: '800', color: rColor, borderLeft: mod === modeller[0] ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent'}}>{formatleTutar(net)}</td>
                                    });

                                    if (modelDetayAcik) {
                                        return (
                                            <React.Fragment key={`f-net-${ay}`}>
                                                {modCells}
                                                <td style={{padding: '24px 12px', textAlign: 'right', fontWeight: '900', color: topColor, borderLeft: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)'}}>{formatleTutar(netTop)}</td>
                                            </React.Fragment>
                                        )
                                    } else {
                                        return <td key={`top-net-${ay}`} style={{padding: '24px 12px', textAlign: 'right', fontWeight: '900', color: topColor, borderLeft: '1px solid rgba(255,255,255,0.2)'}}>{formatleTutar(netTop)}</td>
                                    }
                                })}
                                
                                {showTotalCol && <td style={{padding: '24px 12px', textAlign: 'right', fontWeight: '900', color: '#fff', borderLeft: '1px solid rgba(255,255,255,0.2)', fontSize: '16px', background: 'rgba(255,255,255,0.1)'}}>
                                    {formatleTutar(
                                        oAylarFull.reduce((a, b) => a + getAylikToplam(gelirData, b, 'Toplam'), 0) - oAylarFull.reduce((a, b) => a + getAylikToplam(pGiderData, b, 'Toplam'), 0)
                                    )} ₺
                                </td>}
                            </tr>
                        </>
                    )}
                </tbody>
            </table>
        );
    }

    return (
        <div className="page-container" style={{maxWidth: '1400px', margin: '0 auto', padding: '40px 48px'}}>
            <h2 style={{color: 'var(--enba-dark)', fontWeight: 800, fontFamily: "'Manrope',sans-serif", fontSize: '28px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                <i className="ph-fill ph-chart-pie" style={{ color: 'var(--enba-orange)' }}></i> Kâr/Zarar (P&L) Tablo Modülü
            </h2>
            <p style={{color: 'var(--on-surface-variant)', fontSize: '15px', marginBottom: '32px'}}>Muhasebe programından aldığınız gelir ve gider raporlarını (.xlsx) ayrı ayrı yükleyerek EBITDA bazlı net karlılığınızı ay ve model kırılımına göre görün.</p>
            
            {/* KAYITLI RAPORLAR SECTION */}
            {savedReports.length > 0 && (
                <div style={{marginBottom: '32px', background: '#fff', padding: '20px 24px', borderRadius: '1.5rem', border: '1px solid var(--surface-container-highest)', boxShadow: 'var(--shadow-sm)'}}>
                    <h3 style={{margin: '0 0 16px 0', fontSize: '14px', fontWeight: 800, color: 'var(--enba-dark)', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <i className="ph ph-archive"></i> Kayıtlı Raporlarınız (Tarayıcı Belleği)
                    </h3>
                    <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                        {savedReports.map(rep => (
                            <div key={rep.id} style={{display: 'flex', alignItems: 'center', background: 'var(--surface-container-lowest)', border: '1px solid var(--surface-container-high)', borderRadius: '0.8rem', overflow: 'hidden'}}>
                                <button onClick={() => raporuYukle(rep)} style={{padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '700', color: 'var(--enba-dark)', fontSize: '13px', transition: '0.2s', outline: 'none'}}>
                                    {rep.name} <span style={{color: 'var(--on-surface-variant)', fontSize: '11px', marginLeft: '8px', fontWeight: '500'}}>{rep.date}</span>
                                </button>
                                <button onClick={() => raporuSil(rep.id)} className="btn-icon" style={{padding: '10px 14px', background: 'var(--enba-danger)', color: '#fff', borderRadius: 0}} title="Veriyi Sil">
                                    <i className="ph ph-trash"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{display: 'flex', gap: '24px', marginBottom: '40px', flexWrap: 'wrap'}}>
                {/* Gelir Upload */}
                <div style={{flex: 1, minWidth: '300px', background: 'var(--surface-container-lowest)', border: '2px dashed var(--enba-orange)', borderRadius: '1.5rem', padding: '40px', textAlign: 'center', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)'}}>
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => dosyaSecildi(e, 'gelir')} style={{display: 'none'}} id="pnl-gelir-upload" />
                    <label htmlFor="pnl-gelir-upload" style={{cursor: 'pointer', display: 'block'}}>
                        <div style={{fontSize: '48px', marginBottom: '16px', color: 'var(--enba-orange)'}}><i className="ph ph-trend-up"></i></div>
                        <h3 style={{margin: '0 0 12px 0', color: 'var(--enba-dark)', fontWeight: 800, fontSize: '18px'}}>{gelirDosya ? gelirDosya : "1. GELİRLER Dosyasını Yükle"}</h3>
                        <p style={{color: 'var(--on-surface-variant)', fontWeight: 600, fontSize: '14px'}}>{gelirDosya ? 'Değiştirmek için tıklayın' : 'Satışlar tablosunu sürükleyin'}</p>
                    </label>
                </div>

                {/* Gider Upload */}
                <div style={{flex: 1, minWidth: '300px', background: 'var(--surface-container-lowest)', border: '2px dashed var(--enba-dark)', borderRadius: '1.5rem', padding: '40px', textAlign: 'center', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)'}}>
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => dosyaSecildi(e, 'gider')} style={{display: 'none'}} id="pnl-gider-upload" />
                    <label htmlFor="pnl-gider-upload" style={{cursor: 'pointer', display: 'block'}}>
                        <div style={{fontSize: '48px', marginBottom: '16px', color: 'var(--enba-dark)'}}><i className="ph ph-trend-down"></i></div>
                        <h3 style={{margin: '0 0 12px 0', color: 'var(--enba-dark)', fontWeight: 800, fontSize: '18px'}}>{giderDosya ? giderDosya : "2. GİDERLER Dosyasını Yükle"}</h3>
                        <p style={{color: 'var(--on-surface-variant)', fontWeight: 600, fontSize: '14px'}}>{giderDosya ? 'Değiştirmek için tıklayın' : 'Harcamalar tablosunu sürükleyin'}</p>
                    </label>
                </div>
            </div>
            
            {(gelirData || pGiderData) && (
                <div id="pnl-report-container" className="enba-card" style={{padding: '32px', border: '1px solid var(--surface-container-highest)', boxShadow: 'var(--shadow-md)'}}>
                    
                    <div id="pnl-actions" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap'}}>
                            <h3 style={{margin: 0, color: 'var(--enba-dark)', fontSize: '18px', fontWeight: 800}}>KONSOLİDE P&L TABLOSU</h3>
                            
                            <button 
                                onClick={() => setModelDetayAcik(!modelDetayAcik)}
                                className={`btn ${modelDetayAcik ? 'btn-primary' : 'btn-secondary'}`}
                                style={{padding: '8px 18px', borderRadius: '24px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <i className="ph ph-eye"></i> {modelDetayAcik ? 'Detayları Gizle' : 'V/Ortak Detaylarını Gör'}
                            </button>

                            {/* CAPEX Toggle */}
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-container-low)', padding: '6px 16px', borderRadius: '24px', border: '1px solid var(--surface-container-highest)'}}>
                                <span style={{fontSize: '11px', fontWeight: 800, color: 'var(--on-surface-variant)', letterSpacing: '0.5px'}}>VADE (AY):</span>
                                <input type="number" min="1" max="120" value={capexVade} onChange={(e) => setCapexVade(Number(e.target.value) || 1)} disabled={capexActive} style={{width: '50px', padding: '4px', borderRadius: '6px', border: '1px solid var(--surface-container-high)', outline: 'none', textAlign: 'center', fontSize: '12px', background: capexActive ? 'var(--surface-container-highest)' : '#fff'}} onFocus={window.selectOnFocus} />
                                <button 
                                    onClick={() => setCapexActive(!capexActive)}
                                    className={`btn ${capexActive ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{padding: '8px 18px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    <i className="ph ph-hourglass"></i> {capexActive ? 'CAPEX Uygulanıyor' : 'CAPEX Ayır'}
                                </button>
                            </div>
                        </div>

                        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                            
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px'}}>
                                <input type="text" value={raporAdi} onChange={(e) => setRaporAdi(e.target.value)} placeholder="Rapor Adı..." style={{padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--surface-container-high)', outline: 'none', fontSize: '13px', width: '180px'}} />
                                <button onClick={raporuKaydet} className="btn btn-primary" style={{padding: '10px 18px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    <i className="ph ph-floppy-disk"></i> Kaydet
                                </button>
                            </div>

                            <button onClick={excelIndir} className="btn btn-secondary" style={{padding: '10px 18px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <i className="ph ph-file-xls"></i> Excel
                            </button>
                            <button onClick={pdfIndir} className="btn btn-secondary" style={{padding: '10px 18px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <i className="ph ph-file-pdf"></i> PDF
                            </button>
                            <button onClick={() => { setGelirAcik(false); setGiderAcik(false); setGrupAcik({}); }} className="btn btn-icon" style={{padding: '10px 18px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'}} title="Tümünü Gizle">
                                <i className="ph ph-eye-slash"></i>
                            </button>
                        </div>
                    </div>

                    <div id="pnl-report-container-print">
                        {(() => {
                            if (!isPdfGenerating) {
                                return renderTableDenge(aylar, aylar, true, 0);
                            } else {
                                let chunks = [];
                                for (let i = 0; i < aylar.length; i += 12) {
                                    chunks.push(aylar.slice(i, i + 12));
                                }
                                return chunks.map((chunk, index) => {
                                    const isLast = (index === chunks.length - 1);
                                    return (
                                        <div key={`pdf-chunk-${index}`} style={{ marginBottom: isLast ? '0' : '50px' }}>
                                            {renderTableDenge(chunk, aylar, isLast, index)}
                                        </div>
                                    )
                                })
                            }
                        })()}
                    </div>

                </div>
            )}
        </div>
    );
}

window.PnlRaporu = PnlRaporu;
