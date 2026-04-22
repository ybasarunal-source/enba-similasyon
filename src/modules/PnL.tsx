import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { 
  BarChart3, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Eye, 
  EyeOff, 
  Hourglass, 
  Save, 
  Trash2, 
  Download,
  Terminal,
  ArrowUpCircle,
  ArrowDownCircle,
  Gem,
  Info,
  RefreshCw,
  Calendar as CalendarIcon,
  Link as LinkIcon
} from 'lucide-react';
import { fmt } from '../utils/formatters';
import { parasutService, ParasutInvoice } from '../api/parasut';

interface PnLData {
  aylar: string[];
  modeller: string[];
  kategoriler: Record<string, Record<string, Record<string, number>>>;
  aylikToplam: Record<string, Record<string, number>>;
}

interface SavedReport {
  id: string;
  name: string;
  date: string;
  payload: any;
}

export const PnL: React.FC = () => {
    const [gelirData, setGelirData] = useState<PnLData | null>(null);
    const [giderData, setGiderData] = useState<PnLData | null>(null);
    const [gelirDosya, setGelirDosya] = useState("");
    const [giderDosya, setGiderDosya] = useState("");
    
    const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
    const [raporAdi, setRaporAdi] = useState("");

    // UI Toggles
    const [gelirAcik, setGelirAcik] = useState(true);
    const [giderAcik, setGiderAcik] = useState(true);
    const [capexActive, setCapexActive] = useState(false);
    const [capexVade, setCapexVade] = useState(18);
    const [modelDetayAcik, setModelDetayAcik] = useState(false);
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);
    
    // Paraşüt Sync States
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [parasutConnected, setParasutConnected] = useState(parasutService.isLoggedIn());
    const [companyId, setCompanyId] = useState(parasutService.getCompany()?.id || '');
    
    const [grupAcik, setGrupAcik] = useState<Record<string, boolean>>({});

    const toggleGrup = (grupAd: string) => {
        setGrupAcik(prev => ({...prev, [grupAd]: prev[grupAd] === undefined ? true : !prev[grupAd]}));
    };

    useEffect(() => {
        setParasutConnected(parasutService.isLoggedIn());
        setCompanyId(parasutService.getCompany()?.id || '');
    }, []);

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
        
        const newReport: SavedReport = {
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

    const raporuYukle = (report: SavedReport) => {
        setGelirData(report.payload.gelirData);
        setGiderData(report.payload.giderData);
        setCapexActive(report.payload.capexActive || false);
        setCapexVade(report.payload.capexVade || 18);
        setModelDetayAcik(report.payload.modelDetayAcik || false);
        setGelirDosya(report.payload.gelirDosya || "Kayıtlı Gelir Verisi");
        setGiderDosya(report.payload.giderDosya || "Kayıtlı Gider Verisi");
    };

    const raporuSil = (id: string) => {
        if(confirm("Bu kayıtlı raporu silmek istediğinize emin misiniz?")) {
            const updated = savedReports.filter(r => r.id !== id);
            setSavedReports(updated);
            localStorage.setItem('enba_pnl_reports', JSON.stringify(updated));
        }
    };

    const parseExcel = (json: any[]): PnLData => {
        let aylarSet = new Set<string>();
        let modellerSet = new Set<string>();
        let kategoriMap: Record<string, Record<string, Record<string, number>>> = {}; 
        let aylikToplam: Record<string, Record<string, number>> = {}; 
        
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

    const dosyaSecildi = (e: React.ChangeEvent<HTMLInputElement>, tip: 'gelir' | 'gider') => {
        const file = e.target.files?.[0];
        if(!file) return;
        
        if(tip === 'gelir') setGelirDosya(file.name);
        else setGiderDosya(file.name);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target?.result;
            const wb = XLSX.read(data, {type: 'binary', cellDates: true, dateNF: 'yyyy-mm-dd'});
            const sheetName = wb.SheetNames[0];
            const sheet = wb.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            
            const parsed = parseExcel(json as any[]);
            if(tip === 'gelir') setGelirData(parsed);
            else setGiderData(parsed);
        };
        reader.readAsBinaryString(file);
    };

    const handleParasutSync = async () => {
        if (!companyId) {
            alert("Lütfen önce Paraşüt modülünden bir firma seçin.");
            return;
        }
        
        setIsSyncing(true);
        setSyncError(null);
        
        try {
            // "Taze Başlangıç" - Clear everything
            setGelirData(null);
            setGiderData(null);
            setGelirDosya(`Paraşüt: ${startDate} - ${endDate}`);
            setGiderDosya(`Paraşüt: ${startDate} - ${endDate}`);

            // Fetch all document types that affect P&L
            const [sales, purchases, expenditures, salaries, taxes] = await Promise.all([
                parasutService.getSalesInvoices(companyId, startDate, endDate),
                parasutService.getPurchaseBills(companyId, startDate, endDate),
                parasutService.getExpenditures(companyId, startDate, endDate),
                parasutService.getSalaries(companyId, startDate, endDate),
                parasutService.getTaxes(companyId, startDate, endDate)
            ]);

            // Combine all expense types
            const allExpenses = [...purchases, ...expenditures, ...salaries, ...taxes];

            // Map and Save
            setGelirData(mapParasutInvoicesToPnL(sales));
            setGiderData(mapParasutInvoicesToPnL(allExpenses));
        } catch (err: any) {
            setSyncError(err.message || 'Senkronizasyon hatası');
            alert("Paraşüt verisi çekilemedi: " + (err.message || 'Bilinmeyen hata'));
        } finally {
            setIsSyncing(false);
        }
    };

    const mapParasutInvoicesToPnL = (invoices: ParasutInvoice[]): PnLData => {
        let aylarSet = new Set<string>();
        let modellerSet = new Set<string>();
        let kategoriMap: Record<string, Record<string, Record<string, number>>> = {}; 
        let aylikToplam: Record<string, Record<string, number>> = {}; 

        invoices.forEach(inv => {
            const rawAy = inv.issue_date.substring(0, 7); 
            aylarSet.add(rawAy);

            // Use category_name from Paraşüt
            let rawKat = inv.category_name || 'Genel';
            let tutar = inv.net_total || 0;
            
            let model = "Ortak";
            let baseKat = rawKat;
            
            // Re-use existing regex for model extraction
            const match = rawKat.match(/^([A-Za-z]+)[-_ \.]?(\d+.*)$/);
            if (match) {
                let prefix = match[1].toUpperCase();
                baseKat = match[2].trim();
                model = (prefix === 'YM') ? "Ortak" : prefix;
            } else {
                // If contact name contains model info
                const contactMatch = inv.contact_name.match(/^([A-Za-z]+)[-_ \.]?(\d+.*)$/);
                if (contactMatch) {
                    let prefix = contactMatch[1].toUpperCase();
                    model = (prefix === 'YM') ? "Ortak" : prefix;
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
            aylar: Array.from(aylarSet).sort(),
            modeller: Array.from(modellerSet),
            kategoriler: kategoriMap,
            aylikToplam: aylikToplam
        };
    };

    const pGiderData = useMemo(() => {
        if(!giderData) return null;
        if(!capexActive) return giderData;

        let d: PnLData = JSON.parse(JSON.stringify(giderData));
        let capexSchedules: any[] = [];

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
        let yAylar = new Set<string>();
        let yModeller = new Set<string>();
        
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

    const getHucreselTutar = (data: PnLData | null, kat: string, ay: string, mod: string) => {
        if(!data || !data.kategoriler[kat] || !data.kategoriler[kat][ay] || !data.kategoriler[kat][ay][mod]) return 0;
        return data.kategoriler[kat][ay][mod];
    };

    const getAylikToplam = (data: PnLData | null, ay: string, mod: string) => {
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
    const renderTableDenge = (sAylar: string[], oAylarFull: string[], showTotalCol: boolean, tableIndex: number) => {
        const renderKategoriSatirlari = (data: PnLData | null, tipLabel: string, colorClass: string, isGrupEnabled = false) => {
            if(!data) return null;
            let kats = Object.keys(data.kategoriler).sort();
            
            if (!isGrupEnabled) {
                return kats.map(kat => {
                    const isAmort = kat.includes("Amortisman");
                    let rowGenelGlobal = 0;
                    oAylarFull.forEach(ga => modeller.forEach(gm => { rowGenelGlobal += getHucreselTutar(data, kat, ga, gm) }));

                    return (
                        <tr key={kat} className={`border-b border-gray-100 transition-colors hover:bg-gray-50/50 ${isAmort ? 'bg-enba-orange/5' : ''}`}>
                            <td className="p-4 flex items-center gap-3">
                                <span className="text-[9px] font-black px-2 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-wider">{tipLabel}</span>
                                <span className={`text-xs font-bold ${isAmort ? 'text-enba-orange' : 'text-enba-dark'}`}>
                                  {isAmort ? <Gem size={14} className="inline mr-1" /> : null} {kat}
                                </span>
                            </td>
                            {sAylar.map(ay => {
                                let ayTop = 0;
                                const modCells = modeller.map(mod => {
                                    const val = getHucreselTutar(data, kat, ay, mod);
                                    ayTop += val;
                                    return <td key={`${ay}-${mod}`} className={`p-4 text-right text-xs font-medium border-l border-gray-50 ${mod === modeller[0] ? 'border-l-gray-200' : ''}`}>{val > 0 ? fmt(val) : '-'}</td>
                                });
                                
                                if (modelDetayAcik) {
                                    return (
                                        <React.Fragment key={`frag-${kat}-${ay}`}>
                                            {modCells}
                                            <td className="p-4 text-right text-xs font-black border-l border-gray-200 bg-gray-50/30">{ayTop > 0 ? fmt(ayTop) : '-'}</td>
                                        </React.Fragment>
                                    );
                                } else {
                                    return <td key={`top-${kat}-${ay}`} className="p-4 text-right text-xs font-black border-l-2 border-gray-100 bg-gray-50/30">{ayTop > 0 ? fmt(ayTop) : '-'}</td>;
                                }
                            })}
                            {showTotalCol && <td className={`p-4 text-right text-xs font-black border-l-2 border-gray-200 ${colorClass}`}>{fmt(rowGenelGlobal)} ₺</td>}
                        </tr>
                    )
                });
            } else {
                let gruplar: Record<string, string[]> = {};
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
                    const isOpen = isPdfGenerating ? true : grupAcik[grupAdi] === true; 
                    let grupGloGenel = 0;
                    oAylarFull.forEach(ga => modeller.forEach(gm => { 
                        gruplar[grupAdi].forEach(kat => grupGloGenel += getHucreselTutar(data, kat, ga, gm));
                    }));

                    const grupAylarAraTpl: Record<string, Record<string, number>> = {}; 
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
                            <tr className="bg-gray-50/50 cursor-pointer border-b border-gray-200" onClick={() => toggleGrup(grupAdi)}>
                                <td className="p-4 flex items-center gap-2">
                                   <span className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}>
                                      <Eye className="text-gray-400" size={14} /> 
                                   </span>
                                   <span className="text-xs font-black text-enba-dark tracking-tight">{grupAdi}</span>
                                </td>
                                {sAylar.map(ay => {
                                    let ayTop = 0;
                                    const modCells = modeller.map(mod => {
                                        const val = grupAylarAraTpl[ay][mod];
                                        ayTop += val;
                                        return <td key={`grp-${ay}-${mod}`} className={`p-4 text-right text-xs font-bold text-enba-dark border-l border-gray-100 ${mod === modeller[0] ? 'border-l-gray-300' : ''}`}>{val > 0 ? fmt(val) : '-'}</td>
                                    });
                                    
                                    if (modelDetayAcik) {
                                         return (
                                            <React.Fragment key={`frag-grp-${ay}`}>
                                                {modCells}
                                                <td className="p-4 text-right text-xs font-black bg-gray-100/50 text-enba-dark border-l border-gray-300">{fmt(ayTop)}</td>
                                            </React.Fragment>
                                         )
                                    } else {
                                         return <td key={`top-grp-${ay}`} className="p-4 text-right text-xs font-black bg-gray-100/50 text-enba-dark border-l-2 border-gray-300">{fmt(ayTop)}</td>
                                    }
                                })}
                                {showTotalCol && <td className="p-4 text-right text-xs font-black bg-gray-100 text-enba-dark border-l-2 border-gray-300">{fmt(grupGloGenel)} ₺</td>}
                            </tr>

                            {isOpen && gruplar[grupAdi].map(kat => {
                                    const isAmort = kat.includes("Amortisman");
                                    let cGloGenel = 0;
                                    oAylarFull.forEach(ga => modeller.forEach(gm => cGloGenel += getHucreselTutar(data, kat, ga, gm)));

                                    return (
                                        <tr key={kat} className={`border-b border-gray-50 transition-colors hover:bg-gray-100/20 ${isAmort ? 'bg-enba-orange/5' : ''}`}>
                                            <td className="p-3 pl-10 text-[11px] font-bold text-gray-500 flex items-center gap-2">
                                                <span className="text-gray-200">└</span>
                                                {kat}
                                            </td>
                                            {sAylar.map(ay => {
                                                let ayTop = 0;
                                                const modCells = modeller.map(mod => {
                                                    const val = getHucreselTutar(data, kat, ay, mod);
                                                    ayTop += val;
                                                    return <td key={`ch-${ay}-${mod}`} className={`p-3 text-right text-[11px] font-medium text-gray-400 border-l border-gray-50 ${mod === modeller[0] ? 'border-l-gray-100' : ''}`}>{val > 0 ? fmt(val) : '-'}</td>
                                                });
                                                if (modelDetayAcik) {
                                                    return (
                                                        <React.Fragment key={`frag-ch-${ay}`}>
                                                            {modCells}
                                                            <td className="p-3 text-right text-[11px] font-bold bg-gray-50/50 text-gray-600 border-l border-gray-100">{ayTop > 0 ? fmt(ayTop) : '-'}</td>
                                                        </React.Fragment>
                                                    )
                                                } else {
                                                    return <td key={`top-ch-${ay}`} className="p-3 text-right text-[11px] font-bold bg-gray-50/50 text-gray-600 border-l-2 border-gray-100">{ayTop > 0 ? fmt(ayTop) : '-'}</td>
                                                }
                                            })}
                                            {showTotalCol && <td className={`p-3 text-right text-[11px] font-black bg-gray-50 text-enba-dark border-l-2 border-gray-100`}>{fmt(cGloGenel)} ₺</td>}
                                        </tr>
                                    )
                            })}
                        </React.Fragment>
                    );
                });
            }
        };

        return (
            <div className="overflow-x-auto custom-scrollbar">
              <table id={`pnl-table-report-${tableIndex}`} className="w-full border-collapse border border-gray-200 bg-white">
                  <thead>
                      <tr className="bg-enba-dark text-white">
                          <th rowSpan={2} className="p-6 text-left text-[10px] font-black uppercase tracking-[3px] w-[300px] border-b-4 border-enba-orange">Kategori</th>
                          {sAylar.map(ay => (
                              <th key={ay} colSpan={modelDetayAcik ? modeller.length + 1 : 1} className="p-4 text-center text-[11px] font-black uppercase tracking-widest border-l border-white/10">{ay}</th>
                          ))}
                          {showTotalCol && <th rowSpan={2} className="p-6 text-right text-[10px] font-black uppercase tracking-[3px] border-l border-white/10 border-b-4 border-enba-orange text-enba-orange">Toplam</th>}
                      </tr>
                      <tr className="bg-gray-800 text-gray-400">
                          {sAylar.map(ay => {
                              if(modelDetayAcik) {
                                  return (
                                      <React.Fragment key={`th-${ay}`}>
                                          {modeller.map(mod => (
                                              <th key={`${ay}-${mod}`} className="p-3 text-right text-[9px] font-black uppercase border-l border-white/5">{mod}</th>
                                          ))}
                                          <th key={`${ay}-toplam`} className="p-3 text-right text-[9px] font-black uppercase border-l border-white/20 bg-white/5 text-white">Top</th>
                                      </React.Fragment>
                                  )
                              } else {
                                  return <th key={`${ay}-toplam`} className="p-3 text-right text-[9px] font-black uppercase border-l border-white/20 bg-white/5 text-white">Top</th>
                              }
                          })}
                      </tr>
                  </thead>
                  <tbody>
                      
                      {gelirData && (
                          <>
                              <tr className="bg-emerald-50 text-emerald-700 cursor-pointer" onClick={() => setGelirAcik(!gelirAcik)}>
                                  <td colSpan={1 + sAylar.length * (modelDetayAcik ? modeller.length + 1 : 1) + (showTotalCol ? 1 : 0)} className="p-5 font-black text-sm border-b-2 border-emerald-500 flex items-center gap-3">
                                      {gelirAcik ? <Eye size={18} /> : <EyeOff size={18} />}
                                      I. GELİRLER (SATIŞLAR)
                                  </td>
                              </tr>
                              {(gelirAcik || isPdfGenerating) && renderKategoriSatirlari(gelirData, 'GELİR', 'text-emerald-600')}
                              
                              <tr className="bg-emerald-100/50">
                                  <td className="p-5 font-black text-sm text-emerald-800">GELİR TOPLAMI</td>
                                  {sAylar.map(ay => {
                                      let ayTop = getAylikToplam(gelirData, ay, 'Toplam');
                                      const modCells = modeller.map(mod => (
                                          <td key={`gelir-${ay}-${mod}`} className="p-5 text-right font-bold text-emerald-700 border-l border-emerald-200/30">{fmt(getAylikToplam(gelirData, ay, mod))}</td>
                                      ));

                                      if (modelDetayAcik) {
                                          return (
                                              <React.Fragment key={`frag-geltop-${ay}`}>
                                                  {modCells}
                                                  <td className="p-5 text-right font-black text-emerald-800 bg-emerald-100 border-l-2 border-emerald-300">{fmt(ayTop)}</td>
                                              </React.Fragment>
                                          )
                                      } else {
                                          return <td key={`top-geltop-${ay}`} className="p-5 text-right font-black text-emerald-800 bg-emerald-100 border-l-2 border-emerald-300">{fmt(ayTop)}</td>
                                      }
                                  })}
                                  {showTotalCol && <td className="p-5 text-right font-black text-emerald-900 bg-emerald-200 border-l-2 border-emerald-400">
                                      {fmt(oAylarFull.reduce((a, b) => a + getAylikToplam(gelirData, b, 'Toplam'), 0))} ₺
                                  </td>}
                              </tr>
                          </>
                      )}

                      {pGiderData && (
                          <>
                              <tr className="bg-red-50 text-red-700 cursor-pointer" onClick={() => setGiderAcik(!giderAcik)}>
                                  <td colSpan={1 + sAylar.length * (modelDetayAcik ? modeller.length + 1 : 1) + (showTotalCol ? 1 : 0)} className="p-5 font-black text-sm border-b-2 border-red-500 mt-4 flex items-center gap-3">
                                      {giderAcik ? <Eye size={18} /> : <EyeOff size={18} />}
                                      II. GİDERLER (OPEX & YATIRIM)
                                  </td>
                              </tr>
                              {(giderAcik || isPdfGenerating) && renderKategoriSatirlari(pGiderData, 'GİDER', 'text-red-600', true)}
                              
                              <tr className="bg-red-100/50">
                                  <td className="p-5 font-black text-sm text-red-800">GİDER TOPLAMI</td>
                                  {sAylar.map(ay => {
                                      let ayTop = getAylikToplam(pGiderData, ay, 'Toplam');
                                      const modCells = modeller.map(mod => (
                                          <td key={`gider-${ay}-${mod}`} className="p-5 text-right font-bold text-red-700 border-l border-red-200/30">{fmt(getAylikToplam(pGiderData, ay, mod))}</td>
                                      ));

                                      if (modelDetayAcik) {
                                          return (
                                              <React.Fragment key={`frag-gidtop-${ay}`}>
                                                  {modCells}
                                                  <td className="p-5 text-right font-black text-red-800 bg-red-100 border-l-2 border-red-300">{fmt(ayTop)}</td>
                                              </React.Fragment>
                                          )
                                      } else {
                                          return <td key={`top-gidtop-${ay}`} className="p-5 text-right font-black text-red-800 bg-red-100 border-l-2 border-red-300">{fmt(ayTop)}</td>
                                      }
                                  })}
                                  {showTotalCol && <td className="p-5 text-right font-black text-red-900 bg-red-200 border-l-2 border-red-400">
                                      {fmt(oAylarFull.reduce((a, b) => a + getAylikToplam(pGiderData, b, 'Toplam'), 0))} ₺
                                  </td>}
                              </tr>
                          </>
                      )}

                      {(gelirData && pGiderData) && (
                          <>
                              <tr className="bg-enba-dark text-white border-t-8 border-white">
                                  <td className="p-8 text-lg font-black tracking-tighter uppercase italic">EBITDA Net Kâr/Zarar</td>
                                  {sAylar.map(ay => {
                                      const gTot = getAylikToplam(gelirData, ay, 'Toplam');
                                      const cTot = getAylikToplam(pGiderData, ay, 'Toplam');
                                      const netTop = gTot - cTot;
                                      const topColorClass = netTop > 0 ? 'text-emerald-400' : (netTop < 0 ? 'text-red-400' : 'text-gray-400');

                                      const modCells = modeller.map(mod => {
                                          const gelir = getAylikToplam(gelirData, ay, mod);
                                          const c = getAylikToplam(pGiderData, ay, mod);
                                          const net = gelir - c;
                                          const rColorClass = net > 0 ? 'text-emerald-400' : (net < 0 ? 'text-red-400' : 'text-gray-400'); 
                                          return <td key={`net-${ay}-${mod}`} className={`p-8 text-right font-black text-sm border-l border-white/5 ${rColorClass}`}>{fmt(net)}</td>
                                      });

                                      if (modelDetayAcik) {
                                          return (
                                              <React.Fragment key={`f-net-${ay}`}>
                                                  {modCells}
                                                  <td className={`p-8 text-right font-black text-lg border-l-2 border-white/20 bg-white/5 ${topColorClass}`}>{fmt(netTop)}</td>
                                              </React.Fragment>
                                          )
                                      } else {
                                          return <td key={`top-net-${ay}`} className={`p-8 text-right font-black text-lg border-l-2 border-white/20 bg-white/5 ${topColorClass}`}>{fmt(netTop)}</td>
                                      }
                                  })}
                                  
                                  {showTotalCol && <td className="p-8 text-right font-black text-xl border-l-4 border-enba-orange bg-enba-orange/10 text-white">
                                      {fmt(
                                          oAylarFull.reduce((a, b) => a + getAylikToplam(gelirData, b, 'Toplam'), 0) - oAylarFull.reduce((a, b) => a + getAylikToplam(pGiderData, b, 'Toplam'), 0)
                                      )} ₺
                                  </td>}
                              </tr>
                          </>
                      )}
                  </tbody>
              </table>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 p-10 animate-in fade-in duration-1000 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-enba-dark rounded-[1.2rem] flex items-center justify-center text-enba-orange shadow-2xl border border-white/5">
                            <BarChart3 size={28} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-enba-dark tracking-tighter uppercase leading-none">Kâr / Zarar Analizi</h2>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[4px] mt-2">Excel Tablosu Yükle · Model Bazlı P&L</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Paraşüt Sync Panel */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-card overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                    <RefreshCw size={120} />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${parasutConnected ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-400'}`}>
                            <LinkIcon size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-enba-dark tracking-tight">Paraşüt Veri Senkronizasyonu</h3>
                            <p className="text-xs text-gray-400 font-medium mt-1">
                                {parasutConnected 
                                    ? "Seçilen tarih aralığındaki faturaları otomatik olarak analiz et." 
                                    : "Bu özelliği kullanmak için önce Paraşüt modülünden giriş yapmalısınız."}
                            </p>
                        </div>
                    </div>

                    {parasutConnected && (
                        <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-2 px-3">
                                <CalendarIcon size={14} className="text-gray-400" />
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold text-enba-dark outline-none cursor-pointer"
                                />
                                <span className="text-gray-300 mx-1">-</span>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold text-enba-dark outline-none cursor-pointer"
                                />
                            </div>

                            <button
                                onClick={handleParasutSync}
                                disabled={isSyncing}
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isSyncing ? 'bg-gray-100 text-gray-400' : 'bg-enba-orange text-white hover:bg-enba-dark shadow-lg shadow-enba-orange/20'}`}
                            >
                                {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                {isSyncing ? 'Veriler Çekiliyor...' : 'Senkronize Et'}
                            </button>
                        </div>
                    )}

                    {!parasutConnected && (
                        <button className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-50 cursor-not-allowed">
                            Bağlantı Bekleniyor
                        </button>
                    )}
                </div>
            </div>
            
            {/* Saved Reports Section */}
            {savedReports.length > 0 && (
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-card">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-4 flex items-center gap-2">
                    <Terminal size={14} /> Kayıtlı Analizler
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {savedReports.map(rep => (
                      <div key={rep.id} className="flex items-center bg-gray-50 rounded-xl overflow-hidden group border border-transparent hover:border-enba-orange/20 transition-all">
                        <button 
                          onClick={() => raporuYukle(rep)}
                          className="px-5 py-3 text-xs font-bold text-enba-dark hover:bg-white transition-all flex flex-col items-start"
                        >
                          {rep.name}
                          <span className="text-[9px] text-gray-400 font-medium">{rep.date}</span>
                        </button>
                        <button 
                          onClick={() => raporuSil(rep.id)}
                          className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all border-l border-gray-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
            )}

            {/* Upload Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                {/* Gelir Upload */}
                <div className={`relative overflow-hidden bg-white p-10 rounded-[2.5rem] border-2 border-dashed transition-all group ${gelirData ? 'border-emerald-200 bg-emerald-50/10' : 'border-emerald-400/30 hover:border-emerald-500/50'}`}>
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => dosyaSecildi(e, 'gelir')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center text-center gap-4 relative z-0">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${gelirData ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-emerald-50 text-emerald-500'}`}>
                            <ArrowUpCircle size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-enba-dark tracking-tight">{gelirDosya ? gelirDosya : "Satış Verisi Yükle"}</h3>
                            <p className="text-gray-400 text-sm font-medium mt-1">Muhasebeden aldığınız Satış/Gelir tablosu</p>
                        </div>
                        {gelirData && <div className="mt-2 px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Veri Hazır</div>}
                    </div>
                </div>

                {/* Gider Upload */}
                <div className={`relative overflow-hidden bg-white p-10 rounded-[2.5rem] border-2 border-dashed transition-all group ${giderData ? 'border-red-200 bg-red-50/10' : 'border-red-400/30 hover:border-red-500/50'}`}>
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => dosyaSecildi(e, 'gider')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center text-center gap-4 relative z-0">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${giderData ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-red-50 text-red-500'}`}>
                            <ArrowDownCircle size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-enba-dark tracking-tight">{giderDosya ? giderDosya : "Gider Verisi Yükle"}</h3>
                            <p className="text-gray-400 text-sm font-medium mt-1">Harcamalar, Personel ve Yatırım tablosu</p>
                        </div>
                        {giderData && <div className="mt-2 px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Veri Hazır</div>}
                    </div>
                </div>
            </div>
            
            {/* Report Area */}
            {(gelirData || pGiderData) && (
                <div id="pnl-report-container" className="flex flex-col gap-6 animate-in slide-in-from-bottom-10 duration-1000">
                    
                    {/* Toolbar */}
                    <div id="pnl-actions" className="bg-white p-6 rounded-[2.5rem] shadow-card border border-gray-100 flex flex-wrap justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setModelDetayAcik(!modelDetayAcik)}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${modelDetayAcik ? 'bg-enba-dark text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                {modelDetayAcik ? <EyeOff size={16} /> : <Eye size={16} />} 
                                {modelDetayAcik ? 'Model Detaylarını Gizle' : 'V/Ortak Detayları Gör'}
                            </button>

                            {/* CAPEX Control */}
                            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-100">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CAPEX Amortisman:</span>
                                <input 
                                  type="number" 
                                  value={capexVade} 
                                  onChange={(e) => setCapexVade(Number(e.target.value) || 1)} 
                                  disabled={capexActive}
                                  className="w-16 bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-black text-center outline-none focus:border-enba-orange transition-all disabled:opacity-40"
                                />
                                <button 
                                    onClick={() => setCapexActive(!capexActive)}
                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${capexActive ? 'bg-enba-orange text-white' : 'bg-white text-gray-400'}`}
                                >
                                    <Hourglass size={14} className={capexActive ? 'animate-spin' : ''} /> 
                                    {capexActive ? 'Aktif' : 'Pasif'}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center bg-gray-50 p-1 rounded-2xl border border-gray-100 mr-2">
                              <input 
                                type="text" 
                                value={raporAdi} 
                                onChange={(e) => setRaporAdi(e.target.value)} 
                                placeholder="Kaydetmek için isim..." 
                                className="bg-transparent border-none px-4 py-2 text-xs font-bold text-enba-dark outline-none w-48"
                              />
                              <button 
                                onClick={raporuKaydet} 
                                className="bg-enba-dark text-white p-2.5 rounded-xl block hover:bg-black transition-all"
                              >
                                <Save size={16} />
                              </button>
                            </div>

                            <button onClick={excelIndir} className="p-3 bg-white border border-gray-100 rounded-2xl text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm">
                                <FileSpreadsheet size={20} />
                            </button>
                            <button onClick={pdfIndir} className="p-3 bg-white border border-gray-100 rounded-2xl text-red-500 hover:bg-red-50 transition-all shadow-sm">
                                <FileText size={20} />
                            </button>
                        </div>
                    </div>

                    <div id="pnl-report-container-print" className="bg-white rounded-[2.5rem] shadow-card border border-gray-100 overflow-hidden">
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
                                        <div key={`pdf-chunk-${index}`} className={index > 0 ? 'mt-10' : ''}>
                                            {renderTableDenge(chunk, aylar, isLast, index)}
                                        </div>
                                    )
                                })
                            }
                        })()}
                    </div>
                </div>
            )}
            
            {/* Empty State */}
            {!gelirData && !giderData && (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-gray-100 shadow-card">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-200">
                    <BarChart3 size={48} />
                  </div>
                  <h3 className="text-xl font-black text-enba-dark">Analiz Başlatılmadı</h3>
                  <p className="text-gray-400 text-sm mt-2 max-w-sm text-center">Rapor oluşturmak için lütfen muhasebe sisteminizden aldığınız Gelir ve Gider tablolarını yükleyin.</p>
                  
                  <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl px-10">
                     {[
                       { icon: Upload, title: 'Dosyaları Seç', desc: 'Excel veya CSV tablolarını yükle' },
                       { icon: Info, title: 'Detayları İncele', desc: 'Model bazlı karlılığı gör' },
                       { icon: Download, title: 'Rapor Al', desc: 'PDF veya Excel olarak dışa aktar' }
                     ].map((step, i) => (
                       <div key={i} className="flex flex-col items-center text-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-enba-orange/10 text-enba-orange flex items-center justify-center">
                            <step.icon size={20} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-enba-dark">{step.title}</span>
                          <span className="text-[10px] font-bold text-gray-400 leading-tight">{step.desc}</span>
                       </div>
                     ))}
                  </div>
              </div>
            )}
        </div>
    );
};

export default PnL;
