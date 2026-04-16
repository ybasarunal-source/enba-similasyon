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
        return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
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
                    const highlightStyle = isAmort ? {background: 'rgba(243, 156, 18, 0.1)', color: '#d35400', fontWeight: 'bold'} : {};
                    
                    let rowGenelGlobal = 0;
                    oAylarFull.forEach(ga => modeller.forEach(gm => { rowGenelGlobal += getHucreselTutar(data, kat, ga, gm) }));

                    return (
                        <tr key={kat} style={{borderBottom: '1px solid var(--border-grey)', ...highlightStyle}}>
                            <td style={{padding: '14px 10px', color: isAmort ? '#d35400' : '#1F3040', fontWeight: isAmort ? '700' : '500'}}>
                                <span style={{fontSize: '11px', padding: '2px 6px', background: '#f0f0f0', borderRadius: '4px', marginRight: '8px', color: '#7f8c8d'}}>{tipLabel}</span>
                                {isAmort ? "✨ " + kat : kat}
                            </td>
                            {sAylar.map(ay => {
                                let ayTop = 0;
                                const modCells = modeller.map(mod => {
                                    const val = getHucreselTutar(data, kat, ay, mod);
                                    ayTop += val;
                                    return <td key={`${ay}-${mod}`} style={{padding: '14px 10px', textAlign: 'right', color: isAmort ? '#d35400' : '#34495E', borderLeft: mod === modeller[0] ? '2px solid #eee' : '1px solid transparent'}}>{val > 0 ? formatleTutar(val) : '-'}</td>
                                });
                                
                                if (modelDetayAcik) {
                                    return (
                                        <React.Fragment key={`frag-${kat}-${ay}`}>
                                            {modCells}
                                            <td style={{padding: '14px 10px', textAlign: 'right', borderLeft: '1px solid #ddd', background: '#fafafa', color: isAmort ? '#d35400' : '#2c3e50', fontWeight: 'bold'}}>{ayTop > 0 ? formatleTutar(ayTop) : '-'}</td>
                                        </React.Fragment>
                                    );
                                } else {
                                    return <td key={`top-${kat}-${ay}`} style={{padding: '14px 10px', textAlign: 'right', borderLeft: '2px solid #eee', background: '#fafafa', color: isAmort ? '#d35400' : '#2c3e50', fontWeight: 'bold'}}>{ayTop > 0 ? formatleTutar(ayTop) : '-'}</td>;
                                }
                            })}
                            {showTotalCol && <td style={{padding: '14px 10px', textAlign: 'right', fontWeight: 'bold', borderLeft: '2px solid #eee', color: colorCss}}>{formatleTutar(rowGenelGlobal)} ₺</td>}
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
                            <tr style={{background: 'var(--surface-container-low)', cursor: 'pointer'}} onClick={() => toggleGrup(grupAdi)}>
                                <td style={{padding: '12px 14px', color: 'var(--enba-dark)', fontWeight: 'bold', borderBottom: '1px solid var(--border-grey)'}}>
                                   <span style={{display: 'inline-block', width: '20px', fontSize: '11px', color: '#7f8c8d'}}>{isOpen ? '▼' : '▶'}</span>
                                   ⚡  {grupAdi}
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
                                                <td style={{padding: '12px 10px', textAlign: 'right', borderLeft: '1px solid #ddd', background: '#eaecee', fontWeight: '800', color: 'var(--enba-dark)', borderBottom: '1px solid var(--border-grey)'}}>{formatleTutar(ayTop)}</td>
                                            </React.Fragment>
                                         )
                                    } else {
                                         return <td key={`top-grp-${ay}`} style={{padding: '12px 10px', textAlign: 'right', borderLeft: '2px solid #ddd', background: '#eaecee', fontWeight: '800', color: 'var(--enba-dark)', borderBottom: '1px solid var(--border-grey)'}}>{formatleTutar(ayTop)}</td>
                                    }
                                })}
                                {showTotalCol && <td style={{padding: '12px 10px', textAlign: 'right', fontWeight: '800', borderLeft: '2px solid #ddd', color: 'var(--enba-dark)', borderBottom: '1px solid var(--border-grey)'}}>{formatleTutar(grupGloGenel)} ₺</td>}
                            </tr>

                            {isOpen && gruplar[grupAdi].map(kat => {
                                    const isAmort = kat.includes("Amortisman");
                                    const highlightStyle = isAmort ? {background: 'rgba(243, 156, 18, 0.05)', color: '#d35400', fontWeight: 'bold'} : {};
                                    let cGloGenel = 0;
                                    oAylarFull.forEach(ga => modeller.forEach(gm => cGloGenel += getHucreselTutar(data, kat, ga, gm)));

                                    return (
                                        <tr key={kat} style={{borderBottom: '1px solid var(--border-grey)', ...highlightStyle}}>
                                            <td style={{padding: '10px 10px 10px 36px', color: isAmort ? '#d35400' : '#4b6584', fontWeight: isAmort ? '700' : '500', fontSize: '13px'}}>
                                                <span style={{color: '#bdc3c7', marginRight: '6px'}}>└</span>
                                                {isAmort ? "✨ " + kat : kat}
                                            </td>
                                            {sAylar.map(ay => {
                                                let ayTop = 0;
                                                const modCells = modeller.map(mod => {
                                                    const val = getHucreselTutar(data, kat, ay, mod);
                                                    ayTop += val;
                                                    return <td key={`ch-${ay}-${mod}`} style={{padding: '10px 10px', textAlign: 'right', color: isAmort ? '#d35400' : '#7f8c8d', fontSize: '13px', borderLeft: mod === modeller[0] ? '2px solid #eee' : '1px solid transparent'}}>{val > 0 ? formatleTutar(val) : '-'}</td>
                                                });
                                                if (modelDetayAcik) {
                                                    return (
                                                        <React.Fragment key={`frag-ch-${ay}`}>
                                                            {modCells}
                                                            <td style={{padding: '10px 10px', textAlign: 'right', borderLeft: '1px solid #ddd', background: '#fafafa', fontWeight: 'bold', fontSize: '13px', color: isAmort ? '#d35400' : '#34495E'}}>{ayTop > 0 ? formatleTutar(ayTop) : '-'}</td>
                                                        </React.Fragment>
                                                    )
                                                } else {
                                                    return <td key={`top-ch-${ay}`} style={{padding: '10px 10px', textAlign: 'right', borderLeft: '2px solid #eee', background: '#fafafa', fontWeight: 'bold', fontSize: '13px', color: isAmort ? '#d35400' : '#34495E'}}>{ayTop > 0 ? formatleTutar(ayTop) : '-'}</td>
                                                }
                                            })}
                                            {showTotalCol && <td style={{padding: '10px 10px', textAlign: 'right', fontWeight: 'bold', borderLeft: '2px solid #eee', color: colorCss, fontSize: '13px'}}>{formatleTutar(cGloGenel)} ₺</td>}
                                        </tr>
                                    )
                            })}
                        </React.Fragment>
                    );
                });
            }
        };

        return (
            <table id={`pnl-table-report-${tableIndex}`} className="matrix-table html2pdf__page-break" style={{width: '100%', minWidth: '800px', borderCollapse: 'collapse', marginBottom: '20px', background: '#fff'}}>
                <thead>
                    <tr style={{background: 'var(--surface-container-low)'}}>
                        <th rowSpan="2" style={{textAlign: 'left', padding: '12px', borderBottom: '2px solid var(--enba-dark)', color: 'var(--enba-dark)', width: '250px'}}>FİNANSAL KATEGORİSİ</th>
                        {sAylar.map(ay => (
                            <th key={ay} colSpan={modelDetayAcik ? modeller.length + 1 : 1} style={{textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd', borderLeft: '2px solid #ddd', color: 'var(--enba-dark)'}}>{ay}</th>
                        ))}
                        {showTotalCol && <th rowSpan="2" style={{textAlign: 'right', padding: '12px', borderBottom: '2px solid var(--enba-orange)', borderLeft: '2px solid #ddd', color: 'var(--enba-orange)'}}>GENEL TOPLAM</th>}
                    </tr>
                    <tr style={{background: 'var(--surface-container-lowest)'}}>
                        {sAylar.map(ay => {
                            if(modelDetayAcik) {
                                return (
                                    <React.Fragment key={`th-${ay}`}>
                                        {modeller.map(mod => (
                                            <th key={`${ay}-${mod}`} style={{textAlign: 'right', padding: '8px', fontSize: '13px', borderBottom: '2px solid var(--enba-dark)', borderLeft: mod === modeller[0] ? '2px solid #ddd' : '1px solid #eee', color: mod === 'Ortak' ? '#7f8c8d' : 'var(--enba-dark)'}}>{mod}</th>
                                        ))}
                                        <th key={`${ay}-toplam`} style={{textAlign: 'right', padding: '8px', fontSize: '13px', borderBottom: '2px solid var(--enba-dark)', borderLeft: '1px solid #ddd', background: '#f8f9fa', color: 'var(--enba-dark)'}}>TOPLAM</th>
                                    </React.Fragment>
                                )
                            } else {
                                return <th key={`${ay}-toplam`} style={{textAlign: 'right', padding: '8px', fontSize: '13px', borderBottom: '2px solid var(--enba-dark)', borderLeft: '2px solid #ddd', background: '#f8f9fa', color: 'var(--enba-dark)'}}>TOPLAM</th>
                            }
                        })}
                    </tr>
                </thead>
                <tbody>
                    
                    {gelirData && (
                        <>
                            <tr>
                                <td colSpan={1 + sAylar.length * (modelDetayAcik ? modeller.length + 1 : 1) + (showTotalCol ? 1 : 0)} onClick={() => setGelirAcik(!gelirAcik)} style={{background: '#f9fcec', color: '#27ae60', fontWeight: 'bold', padding: '10px 14px', borderBottom: '2px solid #2ecc71', cursor: 'pointer'}}>
                                    <span style={{display: 'inline-block', width: '20px', fontSize: '12px'}}>{gelirAcik || isPdfGenerating ? '▼' : '▶'}</span>
                                    I. GELİRLER (SATIŞLAR)
                                </td>
                            </tr>
                            {(gelirAcik || isPdfGenerating) && renderKategoriSatirlari(gelirData, 'GELİR', '#27ae60')}
                            
                            <tr style={{background: 'rgba(46, 204, 113, 0.08)'}}>
                                <td style={{padding: '12px 14px', fontWeight: 'bold', color: '#27ae60'}}>GELİR TOPLAMI:</td>
                                {sAylar.map(ay => {
                                    let ayTop = getAylikToplam(gelirData, ay, 'Toplam');
                                    const modCells = modeller.map(mod => (
                                        <td key={`gelir-${ay}-${mod}`} style={{padding: '12px 10px', textAlign: 'right', fontWeight: '700', color: '#27ae60', borderLeft: mod === modeller[0] ? '2px solid #ddd' : '1px solid transparent'}}>{formatleTutar(getAylikToplam(gelirData, ay, mod))}</td>
                                    ));

                                    if (modelDetayAcik) {
                                        return (
                                            <React.Fragment key={`frag-geltop-${ay}`}>
                                                {modCells}
                                                <td style={{padding: '12px 10px', textAlign: 'right', fontWeight: '800', borderLeft: '1px solid #ddd', background: 'rgba(46, 204, 113, 0.15)', color: '#27ae60'}}>{formatleTutar(ayTop)}</td>
                                            </React.Fragment>
                                        )
                                    } else {
                                        return <td key={`top-geltop-${ay}`} style={{padding: '12px 10px', textAlign: 'right', fontWeight: '800', borderLeft: '2px solid #ddd', background: 'rgba(46, 204, 113, 0.15)', color: '#27ae60'}}>{formatleTutar(ayTop)}</td>
                                    }
                                })}
                                {showTotalCol && <td style={{padding: '12px 10px', textAlign: 'right', fontWeight: '800', color: '#27ae60', borderLeft: '2px solid #ddd', borderBottom: '1px solid #2ecc71'}}>
                                    {formatleTutar(oAylarFull.reduce((a, b) => a + getAylikToplam(gelirData, b, 'Toplam'), 0))} ₺
                                </td>}
                            </tr>
                        </>
                    )}

                    {pGiderData && (
                        <>
                            <tr>
                                <td colSpan={1 + sAylar.length * (modelDetayAcik ? modeller.length + 1 : 1) + (showTotalCol ? 1 : 0)} onClick={() => setGiderAcik(!giderAcik)} style={{background: '#fdf2f0', color: '#c0392b', fontWeight: 'bold', padding: '10px 14px', borderBottom: '2px solid #e74c3c', borderTop: '4px solid transparent', cursor: 'pointer'}}>
                                    <span style={{display: 'inline-block', width: '20px', fontSize: '12px'}}>{giderAcik || isPdfGenerating ? '▼' : '▶'}</span>
                                    II. GİDERLER (OPEX & YATIRIM)
                                </td>
                            </tr>
                            {(giderAcik || isPdfGenerating) && renderKategoriSatirlari(pGiderData, 'GİDER', '#c0392b', true)}
                            
                            <tr style={{background: 'rgba(231, 76, 60, 0.08)'}}>
                                <td style={{padding: '12px 14px', fontWeight: 'bold', color: '#c0392b'}}>GİDER TOPLAMI:</td>
                                {sAylar.map(ay => {
                                    let ayTop = getAylikToplam(pGiderData, ay, 'Toplam');
                                    const modCells = modeller.map(mod => (
                                        <td key={`gider-${ay}-${mod}`} style={{padding: '12px 10px', textAlign: 'right', fontWeight: '700', color: '#c0392b', borderLeft: mod === modeller[0] ? '2px solid #ddd' : '1px solid transparent'}}>{formatleTutar(getAylikToplam(pGiderData, ay, mod))}</td>
                                    ));

                                    if (modelDetayAcik) {
                                        return (
                                            <React.Fragment key={`frag-gidtop-${ay}`}>
                                                {modCells}
                                                <td style={{padding: '12px 10px', textAlign: 'right', fontWeight: '800', borderLeft: '1px solid #ddd', background: 'rgba(231, 76, 60, 0.15)', color: '#c0392b'}}>{formatleTutar(ayTop)}</td>
                                            </React.Fragment>
                                        )
                                    } else {
                                        return <td key={`top-gidtop-${ay}`} style={{padding: '12px 10px', textAlign: 'right', fontWeight: '800', borderLeft: '2px solid #ddd', background: 'rgba(231, 76, 60, 0.15)', color: '#c0392b'}}>{formatleTutar(ayTop)}</td>
                                    }
                                })}
                                {showTotalCol && <td style={{padding: '12px 10px', textAlign: 'right', fontWeight: '800', color: '#c0392b', borderLeft: '2px solid #ddd', borderBottom: '1px solid #e74c3c'}}>
                                    {formatleTutar(oAylarFull.reduce((a, b) => a + getAylikToplam(pGiderData, b, 'Toplam'), 0))} ₺
                                </td>}
                            </tr>
                        </>
                    )}

                    {(gelirData && pGiderData) && (
                        <>
                            <tr><td colSpan={1 + sAylar.length * (modelDetayAcik ? modeller.length + 1 : 1) + (showTotalCol ? 1 : 0)} style={{borderTop: '6px solid var(--enba-dark)'}}></td></tr>
                            <tr style={{background: 'var(--enba-dark)'}}>
                                <td style={{padding: '20px 14px', fontWeight: 'bold', color: '#fff', fontSize: '15px'}}>NET KÂR / ZARAR (EBITDA)</td>
                                {sAylar.map(ay => {
                                    const gTot = getAylikToplam(gelirData, ay, 'Toplam');
                                    const cTot = getAylikToplam(pGiderData, ay, 'Toplam');
                                    const netTop = gTot - cTot;
                                    const topColor = netTop > 0 ? '#2ecc71' : (netTop < 0 ? '#e74c3c' : '#bdc3c7');

                                    const modCells = modeller.map(mod => {
                                        const gelir = getAylikToplam(gelirData, ay, mod);
                                        const c = getAylikToplam(pGiderData, ay, mod);
                                        const net = gelir - c;
                                        const rColor = net > 0 ? '#2ecc71' : (net < 0 ? '#e74c3c' : '#bdc3c7'); 
                                        return <td key={`net-${ay}-${mod}`} style={{padding: '20px 10px', textAlign: 'right', fontWeight: '800', color: rColor, borderLeft: mod === modeller[0] ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'}}>{formatleTutar(net)}</td>
                                    });

                                    if (modelDetayAcik) {
                                        return (
                                            <React.Fragment key={`f-net-${ay}`}>
                                                {modCells}
                                                <td style={{padding: '20px 10px', textAlign: 'right', fontWeight: '900', color: topColor, borderLeft: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)'}}>{formatleTutar(netTop)}</td>
                                            </React.Fragment>
                                        )
                                    } else {
                                        return <td key={`top-net-${ay}`} style={{padding: '20px 10px', textAlign: 'right', fontWeight: '900', color: topColor, borderLeft: '1px solid rgba(255,255,255,0.3)'}}>{formatleTutar(netTop)}</td>
                                    }
                                })}
                                
                                {showTotalCol && <td style={{padding: '20px 10px', textAlign: 'right', fontWeight: '900', color: '#fff', borderLeft: '1px solid rgba(255,255,255,0.2)', fontSize: '15px', background: 'rgba(255,255,255,0.05)'}}>
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
        <div className="page-container" style={{maxWidth: '96%', margin: '0 auto', padding: '20px 10px'}}>
            <h2 style={{color: 'var(--enba-dark)', textTransform: 'uppercase', marginBottom: '8px'}}>⚡  Kâr/Zarar (P&L) Tablo Modülü</h2>
            <p style={{color: '#7F8C8D', marginBottom: '24px'}}>Muhasebe programından aldığınız gelir ve gider raporlarını (.xlsx) ayrı ayrı yükleyerek EBITDA bazlı net karlılığınızı ay ve model kırılımına göre görün.</p>
            
            {/* KAYITLI RAPORLAR SECTION */}
            {savedReports.length > 0 && (
                <div style={{marginBottom: '30px', background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-grey)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'}}>
                    <h3 style={{margin: '0 0 12px 0', fontSize: '15px', color: 'var(--enba-dark)'}}>⚡  Kayıtlı Raporlarınız (Tarayıcı Belleği)</h3>
                    <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                        {savedReports.map(rep => (
                            <div key={rep.id} style={{display: 'flex', alignItems: 'center', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden'}}>
                                <button onClick={() => raporuYukle(rep)} style={{padding: '8px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600', color: 'var(--enba-dark)', fontSize: '13px', transition: '0.2s', outline: 'none'}} title="Bu raporu ekrana yükle">
                                    {rep.name} <span style={{color: '#95a5a6', fontSize: '11px', marginLeft: '6px', fontWeight: '400'}}>{rep.date}</span>
                                </button>
                                <button onClick={() => raporuSil(rep.id)} style={{padding: '8px 12px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px'}} title="Veriyi Sil">
                                    ⚡ ️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap'}}>
                {/* Gelir Upload */}
                <div style={{flex: 1, minWidth: '300px', background: '#fff', border: '2px dashed #2ecc71', borderRadius: '12px', padding: '30px', textAlign: 'center', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(46, 204, 113, 0.05)'}}>
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => dosyaSecildi(e, 'gelir')} style={{display: 'none'}} id="pnl-gelir-upload" />
                    <label htmlFor="pnl-gelir-upload" style={{cursor: 'pointer', display: 'block'}}>
                        <div style={{fontSize: '48px', marginBottom: '10px'}}>⚡ </div>
                        <h3 style={{margin: '0 0 10px 0', color: '#27ae60'}}>{gelirDosya ? gelirDosya : "1. GELİRLER Dosyasını Yükle"}</h3>
                        <p style={{color: '#2ecc71', fontWeight: 'bold'}}>{gelirDosya ? 'Değiştirmek için tıklayın' : 'Satışlar tablosunu sürükleyin'}</p>
                    </label>
                </div>

                {/* Gider Upload */}
                <div style={{flex: 1, minWidth: '300px', background: '#fff', border: '2px dashed #e74c3c', borderRadius: '12px', padding: '30px', textAlign: 'center', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(231, 76, 60, 0.05)'}}>
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => dosyaSecildi(e, 'gider')} style={{display: 'none'}} id="pnl-gider-upload" />
                    <label htmlFor="pnl-gider-upload" style={{cursor: 'pointer', display: 'block'}}>
                        <div style={{fontSize: '48px', marginBottom: '10px'}}>⚡ </div>
                        <h3 style={{margin: '0 0 10px 0', color: '#c0392b'}}>{giderDosya ? giderDosya : "2. GİDERLER Dosyasını Yükle"}</h3>
                        <p style={{color: '#e74c3c', fontWeight: 'bold'}}>{giderDosya ? 'Değiştirmek için tıklayın' : 'Harcamalar tablosunu sürükleyin'}</p>
                    </label>
                </div>
            </div>
            
            {(gelirData || pGiderData) && (
                <div id="pnl-report-container" style={{overflowX: 'auto', background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid var(--border-grey)'}}>
                    
                    <div id="pnl-actions" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap'}}>
                            <h3 style={{margin: 0, color: 'var(--enba-dark)', fontSize: '16px'}}>KONSOLİDE P&L TABLOSU</h3>
                            
                            <button 
                                onClick={() => setModelDetayAcik(!modelDetayAcik)}
                                style={{padding: '6px 14px', background: modelDetayAcik ? 'var(--info-blue)' : '#fdfdfd', color: modelDetayAcik ? '#fff' : 'var(--info-blue)', border: '1px solid var(--info-blue)', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                                ⚡  {modelDetayAcik ? 'Model Detaylarını Gizle' : 'Model (V, Ortak) Detaylarını Gör'}
                            </button>

                            {/* CAPEX Toggle */}
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px', background: '#fdf2e9', padding: '4px 8px', borderRadius: '20px', border: '1px solid #fdebd0'}}>
                                <span style={{fontSize: '11px', fontWeight: 'bold', color: '#e67e22', marginLeft: '4px'}}>VADE (AY):</span>
                                <input type="number" min="1" max="120" value={capexVade} onChange={(e) => setCapexVade(Number(e.target.value) || 1)} disabled={capexActive} style={{width: '45px', padding: '4px', borderRadius: '4px', border: '1px solid #f39c12', outline: 'none', textAlign: 'center', fontSize: '12px', background: capexActive ? '#fcf3cf' : '#fff'}} onFocus={window.selectOnFocus} />
                                <button 
                                    onClick={() => setCapexActive(!capexActive)}
                                    style={{padding: '6px 14px', background: capexActive ? '#f39c12' : '#fff', color: capexActive ? '#fff' : '#f39c12', border: capexActive ? 'none' : '1px solid #f39c12', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', boxShadow: capexActive ? '0 2px 8px rgba(243, 156, 18, 0.3)' : 'none'}}>
                                    ⚡ ️ {capexActive ? 'Uygulanıyor' : 'Demirbaş & Kurulumları CAPEX Ayır'}
                                </button>
                            </div>
                        </div>

                        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                            
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginRight: '20px'}}>
                                <input type="text" value={raporAdi} onChange={(e) => setRaporAdi(e.target.value)} placeholder="Rapor Adı (Örn: Q1 2024)" style={{padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', fontSize: '13px', width: '180px'}} />
                                <button onClick={raporuKaydet} style={{padding: '8px 16px', background: 'var(--enba-dark)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                                    ⚡  Kaydet
                                </button>
                            </div>

                            <button 
                                onClick={excelIndir}
                                style={{padding: '8px 16px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: '0.2s', fontSize: '13px'}}>
                                ⚡  Excel
                            </button>
                            <button 
                                onClick={pdfIndir}
                                style={{padding: '8px 16px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: '0.2s', fontSize: '13px'}}>
                                ⚡  PDF
                            </button>
                            <button 
                                onClick={() => { setGelirAcik(false); setGiderAcik(false); setGrupAcik({}); }}
                                style={{padding: '8px 16px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px'}}>
                                ⚡ ️ Tümünü Gizle
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

