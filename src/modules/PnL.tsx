import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
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
  TrendingDown,
  Calendar as CalendarIcon,
  Link as LinkIcon,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { fmt } from '../utils/formatters';
import { parasutService, ParasutInvoice } from '../api/parasut';
import { pnlReportsAPI, SupabasePnlReport } from '../api/supabase';

interface PnLData {
  aylar: string[];
  modeller: string[];
  kategoriler: Record<string, Record<string, Record<string, number>>>;
  aylikToplam: Record<string, Record<string, number>>;
  rawDetails?: Record<string, Record<string, Record<string, any[]>>>;
}



const PNL_CONFIG = [
  { 
    section: "I. HASILAT", 
    items: [
      { id: "M109", label: "Mal Satışı (Toplam)", isRevenue: true },
      { id: "M159", label: "Diğer Satışlar", isRevenue: true },
      { id: "M179", label: "Toplam Satış", isTotal: true, formula: ["M109", "M159"], isRevenue: true },
      { id: "M249", label: "SATIŞ Harcamaları", isRevenue: false },
      { id: "M209", label: "Nakliye", isRevenue: false },
      { id: "M299", label: "Hasılat", isTotal: true, formula: ["M179", "-M249", "-M209"], isRevenue: true },
    ]
  },
  { 
    section: "II. MAL MALİYETLERİ", 
    items: [
      { id: "M301", label: "Alım Nakliye", isRevenue: false },
      { id: "M305", label: "Mal alım maliyeti", isRevenue: false },
      { id: "M339", label: "Mal Maliyetleri", isTotal: true, formula: ["M301", "M305"], isRevenue: false },
      { id: "M349", label: "Ticaret Mal maliyeti", isRevenue: false },
      { id: "M399", label: "KATKI", isTotal: true, formula: ["M299", "-M339", "-M349"], isRevenue: true },
    ]
  },
  { 
    section: "III. ENERJİ MALİYETLERİ", 
    items: [
      { id: "M405", label: "Elektrik", isRevenue: false },
      { id: "M410", label: "Yakıt", isRevenue: false },
      { id: "M415", label: "Su", isRevenue: false },
      { id: "M419", label: "Toplam enerji maliyeti", isTotal: true, formula: ["M405", "M410", "M415"], isRevenue: false },
    ]
  },
  { 
    section: "IV. PERSONEL MALİYETLERİ", 
    items: [
      { id: "M450", label: "Maaşlar", isRevenue: false },
      { id: "M455", label: "Sigortalar", isRevenue: false },
      { id: "M475", label: "Yol", isRevenue: false },
      { id: "M480", label: "Yemek", isRevenue: false },
      { id: "M489", label: "Personel maliyetleri", isTotal: true, formula: ["M450", "M455", "M475", "M480"], isRevenue: false },
    ]
  },
  { 
    section: "V. DİĞER GİDERLER", 
    items: [
      { id: "M509", label: "Bakım Onarım", isRevenue: false },
      { id: "M310", label: "Kimyasallar", isRevenue: false },
      { id: "M315", label: "Tel ve diğer Malzeme ÇUVAL", isRevenue: false },
      { id: "M609", label: "DIŞ Hizmetler", isRevenue: false },
      { id: "M610", label: "Kiralama Ücretleri", isRevenue: false },
      { id: "M615", label: "Seyahat Giderleri", isRevenue: false },
      { id: "M620", label: "İletişim Ücretleri", isRevenue: false },
      { id: "M625", label: "Yasal Ücretler", isRevenue: false },
      { id: "M630", label: "Reklam", isRevenue: false },
      { id: "M635", label: "Sigortalar (Diğer)", isRevenue: false },
      { id: "M640", label: "Bilişim Harcamaları", isRevenue: false },
      { id: "M650", label: "Banka giderleri", isRevenue: false },
      { id: "M660", label: "Beklenmedik Giderler", isRevenue: false },
      { id: "M665", label: "Harçlar ve Vergiler", isRevenue: false },
      { id: "M689", label: "Toplam Diğer Maliyetler", isTotal: true, formula: ["M310", "M315", "M609", "M610", "M615", "M620", "M625", "M630", "M635", "M640", "M650", "M660", "M665"], isRevenue: false },
    ]
  },
  { 
    section: "SONUÇ", 
    items: [
      { id: "TOTAL_COST", label: "Toplam Maliyet", isTotal: true, formula: ["M689", "M509", "M489", "M419"], isRevenue: false },
      { id: "M769", label: "EBITDA", isTotal: true, formula: ["M399", "-TOTAL_COST"], isRevenue: true }
    ]
  }
];

export const PnL: React.FC = () => {
    const [gelirData, setGelirData] = useState<PnLData | null>(null);
    const [giderData, setGiderData] = useState<PnLData | null>(null);
    const [gelirDosya, setGelirDosya] = useState("");
    const [giderDosya, setGiderDosya] = useState("");
    
    const [savedReports, setSavedReports] = useState<SupabasePnlReport[]>([]);
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
    const [katFiltre, setKatFiltre] = useState("");
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [parasutConnected, setParasutConnected] = useState(parasutService.isLoggedIn());
    const [companyId, setCompanyId] = useState(parasutService.getCompany()?.id || '');
    
    const [grupAcik, setGrupAcik] = useState<Record<string, boolean>>({});
    const [rowDetayAcik, setRowDetayAcik] = useState<Record<string, boolean>>({});
    const [insightAcik, setInsightAcik] = useState(false);
    const [sectionAcik, setSectionAcik] = useState<Record<string, boolean>>({
        "I. HASILAT": true,
        "II. MAL MALİYETLERİ": true,
        "III. ENERJİ MALİYETLERİ": true,
        "IV. PERSONEL MALİYETLERİ": true,
        "V. DİĞER GİDERLER": true,
        "SONUÇ": true
    });

    const toggleGrup = (grupAd: string) => {
        setGrupAcik(prev => ({...prev, [grupAd]: prev[grupAd] === undefined ? true : !prev[grupAd]}));
    };

    const toggleSection = (sectionName: string) => {
        setSectionAcik(prev => ({...prev, [sectionName]: !prev[sectionName]}));
    };

    const toggleRowDetay = (rowId: string) => {
        setRowDetayAcik(prev => ({...prev, [rowId]: !prev[rowId]}));
    };

    useEffect(() => {
        setParasutConnected(parasutService.isLoggedIn());
        setCompanyId(parasutService.getCompany()?.id || '');
    }, []);

    useEffect(() => {
        const loadReports = async () => {
            const cloudReports = await pnlReportsAPI.getAll();
            
            // Silent Migration
            const savedStr = localStorage.getItem('enba_pnl_reports');
            if (savedStr && cloudReports.length === 0) {
                try {
                    const savedLocal = JSON.parse(savedStr);
                    if (Array.isArray(savedLocal) && savedLocal.length > 0) {
                        for (const r of savedLocal) {
                            await pnlReportsAPI.insert({
                                id: r.id,
                                name: r.name,
                                date: r.date,
                                payload: r.payload
                            });
                        }
                        const migrated = await pnlReportsAPI.getAll();
                        setSavedReports(migrated);
                        localStorage.removeItem('enba_pnl_reports');
                        return;
                    }
                } catch(e) {}
            }
            setSavedReports(cloudReports);
        };
        loadReports();
        
        // Auto-restore active state
        const active = localStorage.getItem('enba_pnl_active_state');
        if (active) {
            try {
                const state = JSON.parse(active);
                setGelirData(state.gelirData);
                setGiderData(state.giderData);
                setGelirDosya(state.gelirDosya || "");
                setGiderDosya(state.giderDosya || "");
                setCapexActive(state.capexActive || false);
                setCapexVade(state.capexVade || 18);
                setModelDetayAcik(state.modelDetayAcik || false);
                if (state.sectionAcik) setSectionAcik(state.sectionAcik);
            } catch (e) {}
        }
    }, []);

    // Auto-save active state
    useEffect(() => {
        if (gelirData || giderData) {
            const state = {
                gelirData,
                giderData,
                gelirDosya,
                giderDosya,
                capexActive,
                capexVade,
                modelDetayAcik,
                sectionAcik
            };
            try {
                localStorage.setItem('enba_pnl_active_state', JSON.stringify(state));
            } catch (e) {
                console.warn("Storage quota exceeded");
            }
        }
    }, [gelirData, giderData, gelirDosya, giderDosya, capexActive, capexVade, modelDetayAcik, sectionAcik]);

    const raporuKaydet = async () => {
        if(!raporAdi.trim()) {
            alert("Lütfen kaydetmeden önce raporunuza bir isim verin!");
            return;
        }
        if(!gelirData && !giderData) {
            alert("Kaydedilecek bir veri (Excel yüklemesi) yok.");
            return;
        }
        
        const newReport: SupabasePnlReport = {
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
        
        const inserted = await pnlReportsAPI.insert(newReport);
        if (inserted) {
            setSavedReports(prev => [inserted, ...prev]);
            alert("Rapor başarıyla kaydedildi!");
            setRaporAdi("");
        } else {
            alert("Rapor kaydedilirken bir hata oluştu.");
        }
    };

    const raporuYukle = (report: SupabasePnlReport) => {
        setGelirData(report.payload.gelirData);
        setGiderData(report.payload.giderData);
        setCapexActive(report.payload.capexActive || false);
        setCapexVade(report.payload.capexVade || 18);
        setModelDetayAcik(report.payload.modelDetayAcik || false);
        setGelirDosya(report.payload.gelirDosya || "Kayıtlı Gelir Verisi");
        setGiderDosya(report.payload.giderDosya || "Kayıtlı Gider Verisi");
    };

    const raporuSil = async (id: string) => {
        if(confirm("Bu kayıtlı raporu silmek istediğinize emin misiniz?")) {
            const success = await pnlReportsAPI.delete(id);
            if (success) {
                setSavedReports(prev => prev.filter(r => r.id !== id));
            }
        }
    };

    const parseExcel = (json: any[]): PnLData => {
        let aylarSet = new Set<string>();
        let modellerSet = new Set<string>();
        let kategoriMap: Record<string, Record<string, Record<string, number>>> = {}; 
        let aylikToplam: Record<string, Record<string, number>> = {}; 
        let rawDetailsMap: Record<string, Record<string, Record<string, any[]>>> = {};
        
        json.forEach(row => {
            const tarihKey = Object.keys(row).find(k => k.toLowerCase().includes('tarih'));
            const kategoriKey = Object.keys(row).find(k => {
                const low = k.toLowerCase();
                return low.includes('kategori') || low.includes('hizmet') || low.includes('ürün') || low.includes('açıklama');
            });
            const cariKey = Object.keys(row).find(k => {
                const low = k.toLowerCase();
                return low.includes('cari') || low.includes('müşteri') || low.includes('unvan') || low.includes('ünvan');
            });
            
            const tutarKeyHariç = Object.keys(row).find(k => k.toLowerCase().includes('toplam') && k.toLowerCase().includes('hariç'));
            const tutarKeyTL = Object.keys(row).find(k => k.toLowerCase().includes('toplam') && k.toLowerCase().includes('(tl)'));
            const tutarKeyNet = Object.keys(row).find(k => k.toLowerCase().includes('net') && k.toLowerCase().includes('tutar'));
            const tutarKeyGenel = Object.keys(row).find(k => k.toLowerCase().includes('toplam') && !k.toLowerCase().includes('kdv'));
            
            let tutarKey = tutarKeyHariç || tutarKeyNet || tutarKeyTL || tutarKeyGenel;

            if (json.indexOf(row) === 0) {
                if (!tutarKey) alert("UYARI: Excel'de tutar sütunu (Toplam, Tutar vb.) bulunamadı. Lütfen sütun isimlerini kontrol edin.");
                if (!kategoriKey) alert("UYARI: Excel'de kategori sütunu bulunamadı.");
            }

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
            
            // Robust Amount Parsing
            let rawTutar = row[tutarKey];
            let tutar = 0;
            if (typeof rawTutar === 'number') {
                tutar = rawTutar;
            } else if (rawTutar) {
                let s = rawTutar.toString().replace(/[^\d,\.-]/g, ''); 
                if (s.includes(',') && s.includes('.')) {
                    s = s.replace(/\./g, '').replace(',', '.');
                } else if (s.includes(',')) {
                    s = s.replace(',', '.');
                }
                tutar = parseFloat(s) || 0;
            }
            
            // Extract Code (Mxxx, Kxxx, Vxxx)
            let baseKat = rawKat;
            const codeMatch = rawKat.match(/([MKV])(\d{3})/i);
            if (codeMatch) {
                // Map Kxxx and Vxxx to Mxxx for internal config lookup
                baseKat = 'M' + codeMatch[2];
            } else {
                // Specific common Paraşüt mappings
                if (rawKat.includes('600')) baseKat = 'M109';
                else if (rawKat.toLowerCase().includes('yönetim gider')) baseKat = 'M670';
                else {
                    // Try to find code by label matching (Smarter bidirectional match)
                    const configItem = PNL_CONFIG.flatMap(s => s.items).find(i => 
                        rawKat.toLowerCase().includes(i.label.toLowerCase()) || 
                        i.label.toLowerCase().includes(rawKat.toLowerCase())
                    );
                    if (configItem) baseKat = configItem.id;
                }
            }

            let model = "Ortak";
            const match = rawKat.match(/^([A-Za-z]+)[-_ \.]?(\d+.*)$/);
            if (match) {
                let prefix = match[1].toUpperCase();
                if (prefix !== 'YM') model = prefix;
            }
            
            modellerSet.add(model);
            
            if(!kategoriMap[baseKat]) kategoriMap[baseKat] = {};
            if(!kategoriMap[baseKat][rawAy]) kategoriMap[baseKat][rawAy] = {};
            if(!kategoriMap[baseKat][rawAy][model]) kategoriMap[baseKat][rawAy][model] = 0;
            
            kategoriMap[baseKat][rawAy][model] += tutar;

            if(!rawDetailsMap[baseKat]) rawDetailsMap[baseKat] = {};
            if(!rawDetailsMap[baseKat][rawAy]) rawDetailsMap[baseKat][rawAy] = {};
            if(!rawDetailsMap[baseKat][rawAy][model]) rawDetailsMap[baseKat][rawAy][model] = [];
            
            rawDetailsMap[baseKat][rawAy][model].push({
                desc: (cariKey && row[cariKey]) ? row[cariKey].toString() : "Detaysız Harcama",
                amount: tutar,
                date: rawAy
            });
            
            if(!aylikToplam[rawAy]) aylikToplam[rawAy] = { Toplam: 0 };
            if(!aylikToplam[rawAy][model]) aylikToplam[rawAy][model] = 0;
            
            aylikToplam[rawAy][model] += tutar;
            aylikToplam[rawAy].Toplam += tutar;
        });
        
        return {
            aylar: Array.from(aylarSet),
            modeller: Array.from(modellerSet),
            kategoriler: kategoriMap,
            aylikToplam: aylikToplam,
            rawDetails: rawDetailsMap
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

            // Sequential fetching to avoid rate limit (429)
            // Paraşüt API can be sensitive to simultaneous bulk requests
            const sales = await parasutService.getSalesInvoices(companyId, startDate, endDate);
            const purchases = await parasutService.getPurchaseBills(companyId, startDate, endDate);
            const expenditures = await parasutService.getExpenditures(companyId, startDate, endDate);
            const salaries = await parasutService.getSalaries(companyId, startDate, endDate);
            const taxes = await parasutService.getTaxes(companyId, startDate, endDate);

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
        let rawDetailsMap: Record<string, Record<string, Record<string, any[]>>> = {};

        invoices.forEach(inv => {
            const rawAy = inv.issue_date.substring(0, 7); 
            aylarSet.add(rawAy);

            // Use category_name from Paraşüt
            let rawKat = inv.category_name || 'Genel';
            let tutar = inv.net_total || 0;

            // Extract Code (Mxxx, Kxxx, Vxxx)
            let baseKat = rawKat;
            const codeMatch = rawKat.match(/([MKV])(\d{3})/i);
            if (codeMatch) {
                // Map Kxxx and Vxxx to Mxxx for internal config lookup
                baseKat = 'M' + codeMatch[2];
            } else {
                // Specific common Paraşüt mappings
                if (rawKat.includes('600')) baseKat = 'M109';
                else if (rawKat.toLowerCase().includes('yönetim gider')) baseKat = 'M670';
                else {
                    // Try to find code by label matching (Smarter bidirectional match)
                    const configItem = PNL_CONFIG.flatMap(s => s.items).find(i => 
                        rawKat.toLowerCase().includes(i.label.toLowerCase()) || 
                        i.label.toLowerCase().includes(rawKat.toLowerCase())
                    );
                    if (configItem) baseKat = configItem.id;
                }
            }

            if (baseKat === 'M109') {
            }

            let model = "Ortak";
            // If contact name contains model info
            const contactMatch = inv.contact_name.match(/^([A-Za-z]+)[-_ \.]?(\d+.*)$/);
            if (contactMatch) {
                let prefix = contactMatch[1].toUpperCase();
                if (prefix !== 'YM') model = prefix;
            }
            
            modellerSet.add(model);
            
            if(!kategoriMap[baseKat]) kategoriMap[baseKat] = {};
            if(!kategoriMap[baseKat][rawAy]) kategoriMap[baseKat][rawAy] = {};
            if(!kategoriMap[baseKat][rawAy][model]) kategoriMap[baseKat][rawAy][model] = 0;
            
            kategoriMap[baseKat][rawAy][model] += tutar;

            if(!rawDetailsMap[baseKat]) rawDetailsMap[baseKat] = {};
            if(!rawDetailsMap[baseKat][rawAy]) rawDetailsMap[baseKat][rawAy] = {};
            if(!rawDetailsMap[baseKat][rawAy][model]) rawDetailsMap[baseKat][rawAy][model] = [];
            
            rawDetailsMap[baseKat][rawAy][model].push({
                desc: inv.contact_name || inv.description || "Paraşüt İşlemi",
                amount: tutar,
                date: inv.issue_date
            });
            
            if(!aylikToplam[rawAy]) aylikToplam[rawAy] = { Toplam: 0 };
            if(!aylikToplam[rawAy][model]) aylikToplam[rawAy][model] = 0;
            
            aylikToplam[rawAy][model] += tutar;
            aylikToplam[rawAy].Toplam += tutar;
        });

        return {
            aylar: Array.from(aylarSet).sort(),
            modeller: Array.from(modellerSet),
            kategoriler: kategoriMap,
            aylikToplam: aylikToplam,
            rawDetails: rawDetailsMap
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

    const topExpenses = useMemo(() => {
        if (!pGiderData) return [];
        return Object.keys(pGiderData.kategoriler)
            .map(kat => {
                let total = 0;
                Object.keys(pGiderData.kategoriler[kat]).forEach(ay => {
                    Object.keys(pGiderData.kategoriler[kat][ay]).forEach(mod => {
                        total += pGiderData.kategoriler[kat][ay][mod];
                    });
                });
                return { kat, total };
            })
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }, [pGiderData]);

    const unifiedData = useMemo(() => {
        if(!gelirData && !pGiderData) return null;
        
        // Merge Kategoriler and rawDetails from both
        const mergedKats = { 
            ...(gelirData?.kategoriler || {}), 
            ...(pGiderData?.kategoriler || {}) 
        };

        const mergedRaw = {
            ...(gelirData?.rawDetails || {}),
            ...(pGiderData?.rawDetails || {})
        };

        const getVal = (code: string, ay: string, mod: string): number => {
            if (mergedKats[code] && mergedKats[code][ay] && mergedKats[code][ay][mod]) {
                return mergedKats[code][ay][mod];
            }
            return 0;
        };

        const getAylikVal = (code: string, ay: string): number => {
            let total = 0;
            modeller.forEach(m => { total += getVal(code, ay, m); });
            return total;
        };

        // Add calculated rows (Totals)
        PNL_CONFIG.forEach(section => {
            section.items.forEach(item => {
                if (item.isTotal && item.formula) {
                    if (!mergedKats[item.id]) mergedKats[item.id] = {};
                    aylar.forEach(ay => {
                        if (!mergedKats[item.id][ay]) mergedKats[item.id][ay] = {};
                        modeller.forEach(mod => {
                            let total = 0;
                            item.formula!.forEach(f => {
                                if (f.startsWith('-')) {
                                    total -= getVal(f.substring(1), ay, mod);
                                } else {
                                    total += getVal(f, ay, mod);
                                }
                            });
                            mergedKats[item.id][ay][mod] = total;
                        });
                    });
                }
            });
        });

        return {
            aylar,
            modeller,
            kategoriler: mergedKats,
            rawDetails: mergedRaw
        };
    }, [gelirData, pGiderData, aylar, modeller]);

    const getHucreselTutar = (data: any, code: string, ay: string, mod: string) => {
        if(!data || !data.kategoriler[code] || !data.kategoriler[code][ay] || !data.kategoriler[code][ay][mod]) return 0;
        return data.kategoriler[code][ay][mod];
    };

    const excelIndir = () => {
        const table = document.getElementById('pnl-table-report-0');
        if (!table) return;
        const wb = XLSX.utils.table_to_book(table, {sheet: "P&L Raporu"});
        XLSX.writeFile(wb, "Enba_PNL_Raporu.xlsx");
    };

    const pdfIndir = async () => {
        setIsPdfGenerating(true);
        await new Promise(r => setTimeout(r, 500));

        const printContainer = document.getElementById('pnl-report-container-print');
        if (!printContainer) { setIsPdfGenerating(false); return; }

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

        const { default: html2pdf } = await import('html2pdf.js');
        html2pdf().set(opt).from(printContainer).save().then(() => {
            if (actions) actions.style.display = 'flex';
            setIsPdfGenerating(false);
        });
    };

    const renderTableDenge = (sAylar: string[], oAylarFull: string[], showTotalCol: boolean, tableIndex: number) => {
        if (!unifiedData) return null;

        return (
            <div className="overflow-x-auto custom-scrollbar">
              <table id={`pnl-table-report-${tableIndex}`} className="w-full border-collapse border border-gray-200 bg-white">
                  <thead>
                      <tr className="bg-gray-100 text-enba-dark border-b border-gray-300">
                          <th rowSpan={2} className="p-2 text-center text-[9px] font-black uppercase tracking-widest w-[60px] border-b-4 border-enba-orange border-r border-gray-300">Kod</th>
                          <th rowSpan={2} className="p-3 text-left text-[9px] font-black uppercase tracking-[2px] w-[180px] border-b-4 border-enba-orange">Kategori</th>
                          {sAylar.map(ay => (
                              <th key={ay} colSpan={modelDetayAcik ? modeller.length + 1 : 1} className="p-2 text-center text-[10px] font-black uppercase tracking-widest border-l border-gray-300">{ay}</th>
                          ))}
                          {showTotalCol && <th rowSpan={2} className="p-3 text-right text-[9px] font-black uppercase tracking-[2px] border-l border-gray-300 border-b-4 border-enba-orange text-enba-orange">Toplam</th>}
                      </tr>
                      <tr className="bg-gray-50 text-gray-600">
                          {sAylar.map(ay => {
                              if(modelDetayAcik) {
                                  return (
                                      <React.Fragment key={`th-${ay}`}>
                                          {modeller.map(mod => (
                                              <th key={`${ay}-${mod}`} className="p-2 text-right text-[8px] font-black uppercase border-l border-gray-200">{mod}</th>
                                          ))}
                                          <th key={`${ay}-toplam`} className="p-2 text-right text-[8px] font-black uppercase border-l border-gray-300 bg-gray-200 text-enba-dark">Top</th>
                                      </React.Fragment>
                                  )
                              } else {
                                  return <th key={`${ay}-toplam`} className="p-2 text-right text-[8px] font-black uppercase border-l border-gray-300 bg-gray-200 text-enba-dark">Top</th>
                              }
                          })}
                      </tr>
                  </thead>
                  <tbody>
                      {PNL_CONFIG.map((section, sIdx) => {
                          const isOpen = sectionAcik[section.section] || isPdfGenerating;
                          return (
                              <React.Fragment key={section.section}>
                                  <tr 
                                      className={`cursor-pointer transition-colors border-b border-gray-200 ${isOpen ? 'bg-gray-50/80 hover:bg-gray-100' : 'bg-gray-200 text-enba-dark hover:bg-gray-300'}`}
                                      onClick={() => toggleSection(section.section)}
                                  >
                                      <td className={`p-2 text-center border-r ${isOpen ? 'border-gray-100' : 'border-gray-300'}`}>
                                          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                      </td>
                                      <td className="p-2 font-black text-[10px] uppercase tracking-[1px]">
                                          {section.section}
                                      </td>
                                      {sAylar.map(ay => {
                                          const summaryId = {
                                              "I. HASILAT": "M299",
                                              "II. MAL MALİYETLERİ": "M339",
                                              "III. ENERJİ MALİYETLERİ": "M419",
                                              "IV. PERSONEL MALİYETLERİ": "M489",
                                              "V. DİĞER GİDERLER": "M689",
                                              "SONUÇ": "M769"
                                          }[section.section] || "";

                                          let ayTop = 0;
                                          modeller.forEach(mod => {
                                              ayTop += getHucreselTutar(unifiedData, summaryId, ay, mod);
                                          });

                                          if (modelDetayAcik) {
                                              return (
                                                  <React.Fragment key={`section-ay-${ay}`}>
                                                      {modeller.map(mod => (
                                                          <td key={`sec-${ay}-${mod}`} className={`p-2 text-right text-[10px] font-bold border-l ${isOpen ? 'border-gray-100' : 'border-gray-300'} opacity-70`}>
                                                              {!isOpen && ayTop !== 0 ? fmt(getHucreselTutar(unifiedData, summaryId, ay, mod)) : ''}
                                                          </td>
                                                      ))}
                                                      <td className={`p-2 text-right text-[10px] font-black border-l ${isOpen ? 'border-gray-200 bg-gray-50/50' : 'border-gray-400 bg-gray-300/50'}`}>
                                                          {!isOpen && ayTop !== 0 ? fmt(ayTop) : ''}
                                                      </td>
                                                  </React.Fragment>
                                              );
                                          } else {
                                              return (
                                                  <td key={`section-ay-top-${ay}`} className={`p-2 text-right text-[10px] font-black border-l ${isOpen ? 'border-gray-200 bg-gray-50/50' : 'border-gray-400 bg-gray-300/50'}`}>
                                                      {!isOpen && ayTop !== 0 ? fmt(ayTop) : ''}
                                                  </td>
                                              );
                                          }
                                      })}
                                      {showTotalCol && (
                                          <td className={`p-2 text-right text-[10px] font-black border-l ${isOpen ? 'border-gray-200 bg-gray-50/50' : 'border-gray-400 bg-gray-300/50'}`}>
                                              {/* Total section total if needed */}
                                          </td>
                                      )}
                                  </tr>
                                  {isOpen && section.items.map(item => {
                                      let rowTotal = 0;
                                      oAylarFull.forEach(ay => modeller.forEach(m => { rowTotal += getHucreselTutar(unifiedData, item.id, ay, m) }));
                                      const isRowOpen = rowDetayAcik[item.id];

                                      return (
                                          <React.Fragment key={item.id}>
                                            <tr 
                                                className={`border-b border-gray-100 transition-colors hover:bg-gray-50/50 cursor-pointer ${item.isTotal ? 'bg-gray-50 font-bold' : ''}`}
                                                onClick={() => !item.isTotal && toggleRowDetay(item.id)}
                                            >
                                                <td className="p-2 border-r border-gray-100 bg-gray-50/30 text-center w-[80px] min-w-[80px]">
                                                    <span className="text-[9px] font-black px-2 py-0.5 bg-white border border-gray-200 text-gray-500 rounded uppercase tracking-wider shadow-sm">{item.id}</span>
                                                </td>
                                                <td className="p-2 w-[220px] min-w-[220px]">
                                                    <div className="flex items-center gap-2">
                                                        {!item.isTotal && (isRowOpen ? <ChevronDown size={12} className="text-enba-orange" /> : <ChevronRight size={12} className="text-gray-300" />)}
                                                        <span className={`text-[10px] ${item.isTotal ? 'font-black text-enba-dark' : 'font-bold text-gray-600'}`}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                {sAylar.map(ay => {
                                                    let ayTop = 0;
                                                    const modCells = modeller.map(mod => {
                                                        const val = getHucreselTutar(unifiedData, item.id, ay, mod);
                                                        ayTop += val;
                                                        return (
                                                            <td key={`${ay}-${mod}`} className={`p-2 text-right text-[10px] font-medium border-l border-gray-50 ${mod === modeller[0] ? 'border-l-gray-200' : ''}`}>
                                                                {val !== 0 ? fmt(val) : '-'}
                                                            </td>
                                                        );
                                                    });

                                                    if (modelDetayAcik) {
                                                        return (
                                                            <React.Fragment key={`frag-${item.id}-${ay}`}>
                                                                {modCells}
                                                                <td className={`p-2 text-right text-[10px] font-black border-l border-gray-200 ${item.isRevenue ? 'text-emerald-700' : 'text-red-700'} ${item.isTotal ? 'bg-gray-100/50' : 'bg-gray-50/30'}`}>
                                                                    {ayTop !== 0 ? fmt(ayTop) : '-'}
                                                                </td>
                                                            </React.Fragment>
                                                        );
                                                    } else {
                                                        return (
                                                            <td key={`top-${item.id}-${ay}`} className={`p-2 text-right text-[10px] font-black border-l-2 border-gray-100 ${item.isRevenue ? 'text-emerald-700' : 'text-red-700'} ${item.isTotal ? 'bg-gray-100/50' : 'bg-gray-50/30'}`}>
                                                                {ayTop !== 0 ? fmt(ayTop) : '-'}
                                                            </td>
                                                        );
                                                    }
                                                })}
                                                {showTotalCol && (
                                                    <td className={`p-2 text-right text-[10px] font-black border-l-2 border-gray-200 ${item.isRevenue ? 'text-emerald-800 bg-emerald-50/30' : 'text-red-800 bg-red-50/30'}`}>
                                                        {fmt(rowTotal)} ₺
                                                    </td>
                                                )}
                                            </tr>
                                            {isRowOpen && !isPdfGenerating && (
                                                <tr>
                                                    <td colSpan={2 + sAylar.length * (modelDetayAcik ? modeller.length + 1 : 1) + (showTotalCol ? 1 : 0)} className="p-0 bg-gray-50/30">
                                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-3">
                                                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                                                <table className="w-full text-left border-collapse">
                                                                    <thead className="bg-gray-50">
                                                                        <tr>
                                                                            <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Açıklama / Cari</th>
                                                                            <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Tarih / Ay</th>
                                                                            <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Tutar</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {(() => {
                                                                            let items: any[] = [];
                                                                            oAylarFull.forEach(ay => {
                                                                                modeller.forEach(mod => {
                                                                                    if (unifiedData.rawDetails?.[item.id]?.[ay]?.[mod]) {
                                                                                        items.push(...unifiedData.rawDetails[item.id][ay][mod]);
                                                                                    }
                                                                                });
                                                                            });
                                                                            if (items.length === 0) return <tr><td colSpan={3} className="p-3 text-center text-[10px] text-gray-400 italic">Bu kategori için işlem detayı bulunamadı.</td></tr>;
                                                                            
                                                                            return items.map((raw, rIdx) => (
                                                                                <tr key={rIdx} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                                                    <td className="p-3 text-[10px] font-bold text-enba-dark">{raw.desc}</td>
                                                                                    <td className="p-3 text-[10px] text-gray-500 text-center">{raw.date}</td>
                                                                                    <td className="p-3 text-[10px] font-black text-enba-dark text-right">{fmt(raw.amount)} ₺</td>
                                                                                </tr>
                                                                            ));
                                                                        })()}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                          </React.Fragment>
                                      );
                                  })}
                              </React.Fragment>
                          );
                      })}
                  </tbody>
              </table>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-6 animate-in fade-in duration-700 max-w-full mx-auto pb-10">
            {/* Header: Title & Main Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-enba-dark rounded-xl flex items-center justify-center text-enba-orange shadow-lg border border-white/5">
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-enba-dark tracking-tight uppercase leading-none">P&L Analizi</h2>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[2px] mt-1">Muhasebe & Kar/Zarar Projeksiyonu</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Action Buttons */}
                    {(gelirData || pGiderData) && (
                        <div className="flex items-center gap-2 border-r border-gray-100 pr-4 mr-2">
                            <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
                                <input 
                                    type="text" 
                                    value={raporAdi} 
                                    onChange={(e) => setRaporAdi(e.target.value)} 
                                    placeholder="Rapor ismi..." 
                                    className="bg-transparent border-none px-3 py-1 text-[11px] font-bold text-enba-dark outline-none w-32"
                                />
                                <button 
                                    onClick={raporuKaydet} 
                                    className="bg-enba-dark text-white p-1.5 rounded-lg hover:bg-black transition-all"
                                    title="Analizi Kaydet"
                                >
                                    <Save size={14} />
                                </button>
                            </div>
                            <button onClick={excelIndir} className="p-2 bg-white border border-gray-100 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm" title="Excel İndir">
                                <FileSpreadsheet size={18} />
                            </button>
                            <button onClick={pdfIndir} className="p-2 bg-white border border-gray-100 rounded-xl text-red-500 hover:bg-red-50 transition-all shadow-sm" title="PDF İndir">
                                <FileText size={18} />
                            </button>
                        </div>
                    )}
                    
                    {/* Model Toggle */}
                    <button 
                        onClick={() => setModelDetayAcik(!modelDetayAcik)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${modelDetayAcik ? 'bg-enba-dark text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        {modelDetayAcik ? <EyeOff size={14} /> : <Eye size={14} />} 
                        {modelDetayAcik ? 'Model Gizle' : 'Model Detay'}
                    </button>
                </div>
            </div>

            {/* Control Center: Paraşüt, Upload & Saved */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Paraşüt & Upload (Left/Top) */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
                        <div className="flex items-center gap-3 relative z-10">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${parasutConnected ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-400'}`}>
                                <LinkIcon size={16} />
                            </div>
                            <h3 className="text-xs font-black text-enba-dark uppercase tracking-wider">Paraşüt</h3>
                            
                            {parasutConnected && (
                                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-1 border border-gray-100 ml-2">
                                    <input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-transparent border-none text-[10px] font-bold text-enba-dark outline-none cursor-pointer"
                                    />
                                    <span className="text-gray-300">-</span>
                                    <input 
                                        type="date" 
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-transparent border-none text-[10px] font-bold text-enba-dark outline-none cursor-pointer"
                                    />
                                    <button
                                        onClick={handleParasutSync}
                                        disabled={isSyncing}
                                        className={`ml-2 p-1.5 rounded-lg transition-all ${isSyncing ? 'bg-gray-100 text-gray-400' : 'bg-enba-orange text-white hover:bg-enba-dark'}`}
                                    >
                                        <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Upload Minimalist */}
                        <div className="flex items-center gap-2 relative z-10">
                            <div className={`relative group px-3 py-2 rounded-xl border border-dashed transition-all cursor-pointer ${gelirData ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 hover:border-emerald-400'}`}>
                                <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => dosyaSecildi(e, 'gelir')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="flex items-center gap-2">
                                    <ArrowUpCircle size={14} className={gelirData ? 'text-emerald-500' : 'text-gray-400'} />
                                    <span className="text-[10px] font-bold text-enba-dark truncate max-w-[100px]">{gelirDosya || "Gelir Yükle"}</span>
                                </div>
                            </div>
                            <div className={`relative group px-3 py-2 rounded-xl border border-dashed transition-all cursor-pointer ${giderData ? 'border-red-200 bg-red-50/50' : 'border-gray-200 hover:border-red-400'}`}>
                                <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => dosyaSecildi(e, 'gider')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="flex items-center gap-2">
                                    <ArrowDownCircle size={14} className={giderData ? 'text-red-500' : 'text-gray-400'} />
                                    <span className="text-[10px] font-bold text-enba-dark truncate max-w-[100px]">{giderDosya || "Gider Yükle"}</span>
                                </div>
                            </div>
                        </div>

                        {/* CAPEX Compact */}
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 border border-gray-100">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">CAPEX:</span>
                            <input 
                              type="number" 
                              value={capexVade} 
                              onChange={(e) => setCapexVade(Number(e.target.value) || 1)} 
                              disabled={capexActive}
                              className="w-10 bg-white border border-gray-200 rounded-lg px-1 py-0.5 text-[10px] font-black text-center outline-none"
                            />
                            <button 
                                onClick={() => setCapexActive(!capexActive)}
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-all ${capexActive ? 'bg-enba-orange text-white' : 'bg-white text-gray-400'}`}
                            >
                                {capexActive ? 'AKTİF' : 'AÇ'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Saved Reports (Right/Side) */}
                <div className="lg:col-span-4">
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm h-full flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <Terminal size={12} className="text-gray-400" />
                            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Geçmiş Analizler</h3>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                            {savedReports.length === 0 ? (
                                <span className="text-[9px] text-gray-300 italic">Henüz rapor kaydedilmedi</span>
                            ) : (
                                savedReports.map(rep => (
                                    <div key={rep.id} className="flex-shrink-0 flex items-center bg-gray-50 rounded-lg overflow-hidden border border-transparent hover:border-enba-orange/20 transition-all">
                                        <button 
                                            onClick={() => raporuYukle(rep)}
                                            className="px-3 py-1.5 text-[10px] font-bold text-enba-dark hover:bg-white transition-all flex flex-col"
                                        >
                                            {rep.name}
                                        </button>
                                        <button 
                                            onClick={() => raporuSil(rep.id)}
                                            className="p-1.5 text-red-300 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Main Report Table Area */}
            {(gelirData || pGiderData) ? (
                <div id="pnl-report-container" className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500 flex-1">
                    {/* Insight Summary (Always Compact) */}
                    {pGiderData && insightAcik && topExpenses.length > 0 && (
                         <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <TrendingDown size={14} className="text-red-500" />
                                    <h3 className="text-[10px] font-black text-enba-dark uppercase tracking-wider">Kritik Gider Kalemleri</h3>
                                </div>
                                <button onClick={() => setInsightAcik(false)} className="text-gray-300 hover:text-gray-500"><EyeOff size={14} /></button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
                                {topExpenses.map((exp, idx) => (
                                    <div key={exp.kat} className="bg-gray-50/50 p-2 rounded-xl border border-gray-50 flex flex-col">
                                        <span className="text-[8px] font-black text-gray-400 truncate">{exp.kat}</span>
                                        <span className="text-[10px] font-black text-enba-dark">{fmt(exp.total)} ₺</span>
                                    </div>
                                ))}
                            </div>
                         </div>
                    )}
                    {!insightAcik && pGiderData && (
                        <button onClick={() => setInsightAcik(true)} className="self-start text-[9px] font-black text-gray-400 hover:text-enba-orange flex items-center gap-1 ml-4 italic underline underline-offset-2">
                            <TrendingDown size={10} /> Gider Analizini Göster
                        </button>
                    )}

                    <div id="pnl-report-container-print" className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex-1">
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
            ) : (
                /* Empty State - Modernized */
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex-1">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-200">
                        <BarChart3 size={32} />
                    </div>
                    <h3 className="text-lg font-black text-enba-dark tracking-tight">Veri Analizi Bekleniyor</h3>
                    <p className="text-gray-400 text-xs mt-1 max-w-xs text-center leading-relaxed">
                        Üst paneldeki <span className="text-enba-orange font-bold uppercase">Paraşüt</span> veya <span className="text-emerald-500 font-bold uppercase">Excel</span> butonlarını kullanarak analize başlayın.
                    </p>
                    
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-2xl px-10">
                        {[
                            { icon: Upload, title: 'Hızlı Yükleme', desc: 'Sürükle bırak veya seç' },
                            { icon: LinkIcon, title: 'API Bağlantısı', desc: 'Otomatik muhasebe aktarımı' },
                            { icon: Gem, title: 'Detaylı Analiz', desc: 'Birim bazlı kâr projeksiyonu' }
                        ].map((step, i) => (
                            <div key={i} className="flex flex-col items-center text-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center">
                                    <step.icon size={16} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-enba-dark">{step.title}</span>
                                <span className="text-[9px] font-bold text-gray-400 leading-tight">{step.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PnL;
