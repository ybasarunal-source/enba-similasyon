import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from '../api/i18n';
import * as XLSX from 'xlsx';
import { 
  Wrench, 
  Factory, 
  Armchair, 
  PlusCircle, 
  FileSpreadsheet, 
  FileDown, 
  Trash2, 
  Pencil, 
  ChevronRight,
  TrendingUp,
  BadgeCheck,
  CheckCircle,
  AlertTriangle,
  Contact,
  Settings,
  Calendar
} from 'lucide-react';
import { fmt } from '../utils/formatters';
import { assetsAPI, maintenanceAPI, SupabaseAsset, SupabaseMaintenanceRecord } from '../api/supabase';

interface Asset {
  id: string;
  adi: string;
  marka?: string;
  motorGucu?: number;
  yatirimBedeli: number;
  satinalmaTarihi: string;
  kategori: string;
  kapasite?: number;
  boyut?: 'Büyük' | 'Orta' | 'Küçük';
  tur: 'makina' | 'demirbas';
}

interface MaintenanceRecord {
  id: string;
  tarih: string;
  varlikId: string;
  varlikAdi: string;
  varlikTuru: string;
  tur: string;
  aciklama: string;
  maliyet: number;
}

export const Machinery: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'machines' | 'fixtures' | 'maintenance'>('machines');

  // ── Data States ──────────────────────────────────────────
  const [assets, setAssets] = useState<SupabaseAsset[]>([]);
  const [maintenance, setMaintenance] = useState<SupabaseMaintenanceRecord[]>([]);

  useEffect(() => {
    async function loadData() {
      const [cloudAssets, cloudMaint] = await Promise.all([
        assetsAPI.getAll(),
        maintenanceAPI.getAll()
      ]);

      const mStr = localStorage.getItem('enba_makinalar_v2');
      const dStr = localStorage.getItem('enba_demirbaslar');
      const kStr = localStorage.getItem('enba_bakim_kayitlari');

      if ((mStr || dStr || kStr) && cloudAssets.length === 0 && cloudMaint.length === 0) {
        const m = mStr ? JSON.parse(mStr) : [];
        const d = dStr ? JSON.parse(dStr) : [];
        const k = kStr ? JSON.parse(kStr) : [];

        for (const item of m) {
          await assetsAPI.insert({ adi: item.adi, marka: item.marka, motor_gucu: item.motorGucu, yatirim_bedeli: item.yatirimBedeli, satinalma_tarihi: item.satinalmaTarihi, kategori: item.kategori, kapasite: item.kapasite, boyut: item.boyut, tur: 'makina' } as SupabaseAsset);
        }
        for (const item of d) {
          await assetsAPI.insert({ adi: item.adi, marka: item.marka, yatirim_bedeli: item.yatirimBedeli, satinalma_tarihi: item.satinalmaTarihi || new Date().toISOString().slice(0,10), kategori: item.kategori, boyut: item.boyut, tur: 'demirbas' } as SupabaseAsset);
        }
        for (const item of k) {
          await maintenanceAPI.insert({ tarih: item.tarih, varlik_id: item.varlikId, varlik_adi: item.varlikAdi, varlik_turu: item.varlikTuru, tur: item.tur, aciklama: item.aciklama, maliyet: item.maliyet } as SupabaseMaintenanceRecord);
        }

        const [newAssets, newMaint] = await Promise.all([assetsAPI.getAll(), maintenanceAPI.getAll()]);
        setAssets(newAssets);
        setMaintenance(newMaint);

        localStorage.removeItem('enba_makinalar_v2');
        localStorage.removeItem('enba_demirbaslar');
        localStorage.removeItem('enba_bakim_kayitlari');
        return;
      }

      setAssets(cloudAssets);
      setMaintenance(cloudMaint);
    }
    loadData();
  }, []);

  // ── Form States ──────────────────────────────────────────
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SupabaseAsset>>({
    adi: '', marka: '', motor_gucu: 0, yatirim_bedeli: 0, satinalma_tarihi: '',
    kategori: 'production', kapasite: 0, boyut: 'Orta', tur: 'makina'
  });

  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false);
  const [maintFormData, setMaintFormData] = useState<Partial<SupabaseMaintenanceRecord>>({
    tarih: new Date().toISOString().slice(0, 10), tur: 'Bakım', aciklama: '', maliyet: 0, varlik_id: ''
  });

  // ── KPI Calculations ─────────────────────────────────────
  const stats = useMemo(() => {
    const totalInvest = assets.reduce((acc, curr) => acc + (curr.yatirim_bedeli || 0), 0);
    const machineInvest = assets.filter(a => a.tur === 'makina').reduce((acc, curr) => acc + (curr.yatirim_bedeli || 0), 0);
    const totalMaint = maintenance.reduce((acc, curr) => acc + (curr.maliyet || 0), 0);
    return { totalInvest, machineInvest, totalMaint, count: assets.length };
  }, [assets, maintenance]);

  // ── Handlers ─────────────────────────────────────────────
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.adi) return;

    if (editingId) {
      const updated = await assetsAPI.update(editingId, formData);
      if (updated) setAssets(prev => prev.map(a => a.id === editingId ? updated : a));
    } else {
      const newAsset = await assetsAPI.insert(formData as SupabaseAsset);
      if (newAsset) setAssets(prev => [...prev, newAsset]);
    }

    setIsAssetFormOpen(false);
    setEditingId(null);
    setFormData({ adi: '', marka: '', motor_gucu: 0, yatirim_bedeli: 0, satinalma_tarihi: '', kategori: 'production', tur: formData.tur });
  };

  const handleDeleteAsset = async (id: string) => {
    if (confirm('Bu varlığı ve bağlı bakım kayıtlarını silmek istediğinize emin misiniz?')) {
      const success = await assetsAPI.delete(id);
      if (success) {
        setAssets(prev => prev.filter(a => a.id !== id));
        const relatedMaint = maintenance.filter(m => m.varlik_id === id);
        for (const m of relatedMaint) {
          await maintenanceAPI.delete(m.id);
        }
        setMaintenance(prev => prev.filter(m => m.varlik_id !== id));
      }
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rows.length < 2) return;

      const newMachines: SupabaseAsset[] = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i] as any[];
        if (!r[0]) continue;
        
        const assetObj = {
          adi: String(r[0] || ''),
          marka: String(r[1] || ''),
          motor_gucu: Number(r[2]) || 0,
          kategori: 'production',
          kapasite: Number(r[4]) || 0,
          satinalma_tarihi: String(r[5] || new Date().toISOString().slice(0, 10)),
          yatirim_bedeli: Number(r[6]) || 0,
          boyut: r[7] || 'Orta',
          tur: 'makina'
        } as SupabaseAsset;
        
        const inserted = await assetsAPI.insert(assetObj);
        if (inserted) newMachines.push(inserted);
      }

      setAssets(prev => [...prev, ...newMachines]);
      setIsBulkOpen(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Makine Adı', 'Markası', 'Motor Gücü (kW)', 'Tipi', 'Kapasite (Ton/Saat)', 'Alış Tarihi', 'Alış Fiyatı (₺)', 'Boyut (Büyük/Orta/Küçük)'],
      ['Kırma Makinası', 'Metso', 250, 'Üretim', 10, '2023-03-15', 1200000, 'Büyük']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Şablon');
    XLSX.writeFile(wb, 'Enba_Makina_Sablonu.xlsx');
  };

  return (
    <div className="flex flex-col gap-10 p-10 animate-in fade-in duration-1000">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-enba-dark rounded-[1.2rem] flex items-center justify-center text-enba-orange shadow-2xl border border-white/5">
                <Settings size={32} className="animate-spin-slow" />
             </div>
             <div>
                <h2 className="text-3xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">
                  Varlık & Envanter Matrixi
                </h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[4px] mt-2 italic">Makina Parkuru ve Sabit Kıymet Yönetimi</p>
             </div>
          </div>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => { setFormData({...formData, tur: 'makina'}); setIsAssetFormOpen(true); }}
             className="px-10 py-5 bg-enba-dark text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[3px] shadow-2xl shadow-black/20 hover:bg-black transition-all flex items-center gap-4 group active:scale-95 border border-white/5"
           >
             <PlusCircle size={20} className="text-enba-orange transition-transform group-hover:rotate-90" />
             Envanter Kaydı Ekle
           </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         {[
           { label: 'Toplam Yatırım (CAPEX)', value: stats.totalInvest, icon: TrendingUp, color: 'text-enba-dark', bg: 'bg-white' },
           { label: 'Makina Parkuru Değeri', value: stats.machineInvest, icon: Factory, color: 'text-enba-orange', bg: 'bg-white' },
           { label: 'Bakım Maliyet Endeksi', value: stats.totalMaint, icon: Wrench, color: 'text-rose-500', bg: 'bg-white' },
           { label: 'Aktif Varlık Adedi', value: stats.count, unit: 'ADET', icon: BadgeCheck, color: 'text-emerald-500', bg: 'bg-white' }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-card flex flex-col justify-between min-h-[200px] group hover:border-enba-orange/20 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-enba-orange/5 transition-colors"></div>
              <div className="flex justify-between items-start relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                    <stat.icon size={24} />
                 </div>
              </div>
              <div className="relative z-10">
                 <div className="text-[10px] font-black text-gray-300 uppercase tracking-[4px] mb-2">{stat.label}</div>
                 <div className={`text-3xl font-black tracking-tighter italic ${stat.color} leading-none`}>
                   {stat.unit === 'ADET' ? stat.value : fmt(stat.value)} <span className="text-xs font-bold text-gray-300 ml-1 italic uppercase leading-none">{stat.unit || '₺'}</span>
                 </div>
              </div>
           </div>
         ))}
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-col gap-10">
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-[2rem] self-start border border-gray-100 shadow-inner">
            <button 
              onClick={() => setActiveTab('machines')}
              className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-3 ${activeTab === 'machines' ? 'bg-enba-dark text-white shadow-xl' : 'text-gray-400 hover:text-enba-dark'}`}
            >
              <Factory size={18} /> Makina Parkuru ({assets.filter(a => a.tur === 'makina').length})
            </button>
            <button 
              onClick={() => setActiveTab('fixtures')}
              className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-3 ${activeTab === 'fixtures' ? 'bg-enba-dark text-white shadow-xl' : 'text-gray-400 hover:text-enba-dark'}`}
            >
              <Armchair size={18} /> Demirbaşlar ({assets.filter(a => a.tur === 'demirbas').length})
            </button>
            <button 
              onClick={() => setActiveTab('maintenance')}
              className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-3 ${activeTab === 'maintenance' ? 'bg-enba-dark text-white shadow-xl' : 'text-gray-400 hover:text-enba-dark'}`}
            >
              <Wrench size={18} /> Bakım Arşivi ({maintenance.length})
            </button>
        </div>

        {activeTab === 'machines' && (
          <div className="flex flex-col gap-10">
             <div className="flex justify-between items-center">
                <div>
                   <h3 className="text-xl font-black text-enba-dark tracking-tighter italic uppercase leading-none">Makine Parkuru Envanteri</h3>
                   <p className="text-[9px] text-gray-400 font-black uppercase tracking-[3px] mt-2">Aktif Üretim Bileşenleri Listesi</p>
                </div>
                <div className="flex gap-4">
                   <button onClick={downloadTemplate} className="w-12 h-12 bg-white border border-gray-100 text-gray-400 rounded-2xl hover:bg-enba-dark hover:text-white transition-all shadow-sm flex items-center justify-center" title="Excel Şablonu İndir">
                      <FileDown size={20} />
                   </button>
                   <button onClick={() => setIsBulkOpen(true)} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black flex items-center gap-3 hover:bg-emerald-700 shadow-xl shadow-emerald-100 uppercase tracking-widest">
                      <FileSpreadsheet size={20} /> Excel Matrix Yükle
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {assets.filter(a => a.tur === 'makina').map(machine => (
                  <div key={machine.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-card p-10 group hover:border-enba-orange/20 transition-all relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-enba-orange/5 transition-colors"></div>
                     <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 rounded-[1.5rem] bg-enba-dark text-enba-orange flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                              <Settings size={32} className="animate-spin-slow group-hover:animate-spin" />
                           </div>
                           <div>
                              <h4 className="text-xl font-black text-enba-dark tracking-tighter italic uppercase leading-none mb-2">{machine.adi}</h4>
                              <div className="flex items-center gap-3">
                                 <span className="text-[10px] font-black text-gray-300 uppercase tracking-[3px]">{machine.marka || 'GENERAL'}</span>
                                 <div className="w-1 h-1 bg-enba-orange rounded-full"></div>
                                 <span className="text-[10px] font-black text-enba-orange uppercase tracking-[3px] italic">{machine.kategori}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => { setEditingId(machine.id); setFormData(machine); setIsAssetFormOpen(true); }} className="w-11 h-11 rounded-xl bg-gray-50 text-gray-400 hover:bg-enba-dark hover:text-white flex items-center justify-center transition-all shadow-sm">
                              <Pencil size={20} />
                           </button>
                           <button onClick={() => handleDeleteAsset(machine.id)} className="w-11 h-11 rounded-xl bg-gray-50 text-gray-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shadow-sm">
                              <Trash2 size={20} />
                           </button>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-8 p-6 bg-gray-50 rounded-[1.8rem] mb-8 relative z-10 border border-gray-100">
                        <div>
                           <div className="text-[9px] font-black text-gray-400 uppercase tracking-[4px] mb-1">Güç</div>
                           <div className="text-base font-black text-enba-dark italic tabular-nums">{machine.motor_gucu} <span className="text-[10px] opacity-30 font-bold ml-0.5">KW</span></div>
                        </div>
                        <div>
                           <div className="text-[9px] font-black text-gray-400 uppercase tracking-[4px] mb-1">Kapasite</div>
                           <div className="text-base font-black text-enba-orange italic tabular-nums">{machine.kapasite} <span className="text-[10px] opacity-30 font-bold ml-0.5">T/S</span></div>
                        </div>
                        <div>
                           <div className="text-[9px] font-black text-gray-400 uppercase tracking-[4px] mb-1">Değer</div>
                           <div className="text-base font-black text-enba-dark italic tabular-nums">{fmt(machine.yatirim_bedeli)} <span className="text-[10px] opacity-30 font-bold ml-0.5">₺</span></div>
                        </div>
                     </div>

                     <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-100">
                           <Calendar size={14} className="text-enba-orange" />
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{new Date(machine.satinalma_tarihi).toLocaleDateString('tr-TR')} Envanter Girişi</span>
                        </div>
                        <button 
                          onClick={() => { setMaintFormData({...maintFormData, varlik_id: machine.id}); setIsMaintenanceFormOpen(true); }}
                          className="px-5 py-2.5 bg-enba-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-xl active:scale-95 group/btn"
                        >
                           <Wrench size={14} className="text-enba-orange" /> Bakım Emri Oluştur
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Fixtures Tab - Simplified Industrial List */}
      {activeTab === 'fixtures' && (
         <div className="bg-white rounded-[2.5rem] shadow-card border border-gray-100 overflow-hidden group">
            <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
               <div>
                  <h3 className="text-xl font-black text-enba-dark italic uppercase tracking-tighter leading-none">Demirbaş Envanteri</h3>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-[3px] mt-2">Duran Varlıklar ve Sabit Kıymetler Matrixi</p>
               </div>
               <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300">
                  <Armchair size={24} />
               </div>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Varlık Adı & Marka</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Hizmet Departmanı</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic text-right">Edinim Bedeli</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic text-center">Durum</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic text-right">Yönetim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {assets.filter(a => a.tur === 'demirbas').map(item => (
                      <tr key={item.id} className="group hover:bg-gray-50/80 transition-all">
                        <td className="px-10 py-8">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-[1rem] bg-enba-dark text-white flex items-center justify-center font-black italic shadow-lg group-hover:scale-110 transition-transform">
                                 {item.adi.charAt(0)}
                              </div>
                              <div>
                                 <div className="text-base font-black text-enba-dark italic tracking-tight uppercase leading-none mb-1.5">{item.adi}</div>
                                 <div className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">{item.marka || 'GENEL'}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-8">
                           <div className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block border border-gray-200/50 group-hover:bg-white transition-colors uppercase italic">
                              {item.kategori}
                           </div>
                        </td>
                        <td className="px-10 py-8 text-base font-black text-enba-dark tabular-nums italic text-right">
                           {fmt(item.yatirim_bedeli)} <span className="text-[10px] text-gray-300 font-bold ml-1">₺</span>
                        </td>
                        <td className="px-10 py-8 text-center">
                           <div className="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                             <CheckCircle size={10} /> AKTİF VARLIK
                           </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                           <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingId(item.id); setFormData(item); setIsAssetFormOpen(true); }} className="h-10 w-10 flex items-center justify-center rounded-xl bg-enba-dark text-white hover:bg-black transition-all shadow-lg active:scale-90">
                                 <Pencil size={18} />
                              </button>
                              <button onClick={() => handleDeleteAsset(item.id)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90 border border-rose-100">
                                 <Trash2 size={18} />
                              </button>
                           </div>
                        </td>
                      </tr>
                   ))}
                </tbody>
              </table>
            </div>
         </div>
      )}

      {/* Asset Form Modal */}
      {isAssetFormOpen && (
        <div className="fixed inset-0 bg-enba-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
           <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-2 bg-enba-orange shadow-lg shadow-enba-orange/20"></div>
              <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-enba-dark rounded-2xl flex items-center justify-center text-enba-orange shadow-2xl">
                       <PlusCircle size={32} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">Varlık Kayıt Matrixi</h3>
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-2">Envanter Verisi Giriş Paneli</p>
                    </div>
                 </div>
                 <button onClick={() => setIsAssetFormOpen(false)} className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-300 transition-all hover:rotate-90">
                    <X size={32} />
                 </button>
              </div>
              <form onSubmit={handleSaveAsset} className="p-12 space-y-10">
                 <div className="grid grid-cols-2 gap-10">
                    <div className="col-span-2 space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Varlık / Teçhizat Adı</label>
                       <input 
                         required
                         value={formData.adi}
                         onChange={e => setFormData({...formData, adi: e.target.value})}
                         className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-base font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all placeholder:italic"
                         placeholder="ÖRN: KIRMA HATTI XL-200"
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Varlık Türü</label>
                       <select 
                         value={formData.tur}
                         onChange={e => setFormData({...formData, tur: e.target.value as 'makina' | 'demirbas'})}
                         className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all appearance-none italic"
                       >
                          <option value="makina">ÜRETİM MAKİNASI</option>
                          <option value="demirbas">SABİT DEMİRBAŞ</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Yatırım Bedeli (NET ₺)</label>
                       <input 
                         type="number"
                         value={formData.yatirim_bedeli}
                         onChange={e => setFormData({...formData, yatirim_bedeli: Number(e.target.value)})}
                         className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all tabular-nums"
                         placeholder="0.00"
                       />
                    </div>
                    {formData.tur === 'makina' && (
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Motor Gücü (kW)</label>
                          <input 
                            type="number"
                            value={formData.motor_gucu}
                            onChange={e => setFormData({...formData, motor_gucu: Number(e.target.value)})}
                            className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all tabular-nums"
                            placeholder="0"
                          />
                       </div>
                    )}
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Envanter Giriş Tarihi</label>
                       <input 
                         type="date"
                         value={formData.satinalma_tarihi}
                         onChange={e => setFormData({...formData, satinalma_tarihi: e.target.value})}
                         className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all"
                       />
                    </div>
                 </div>
                 <button type="submit" className="w-full bg-enba-orange text-white rounded-[1.8rem] py-6 font-black text-xs uppercase tracking-[5px] shadow-2xl shadow-enba-orange/30 hover:brightness-110 transition-all mt-6 active:scale-95 group overflow-hidden relative">
                    <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                    SİSTEME KAYDET
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-enba-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
           <div className="bg-white rounded-[3.5rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
              <div className="p-12 space-y-10 text-center">
                 <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-100 transform -rotate-6 group-hover:rotate-0 transition-transform">
                    <FileSpreadsheet size={48} className="fill-emerald-100" />
                 </div>
                 <div className="space-y-3">
                    <h3 className="text-2xl font-black text-enba-dark uppercase italic tracking-tighter leading-none">Toplu Veri Aktarımı</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] leading-relaxed">Excel matrix dosyanızı sürükleyerek tüm varlıkları anında sisteme senkronize edin.</p>
                 </div>
                 <div className="relative group/zone">
                    <input 
                      type="file" 
                      accept=".xlsx, .xls"
                      onChange={handleBulkUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-12 group-hover/zone:border-emerald-500 group-hover/zone:bg-emerald-50/50 transition-all bg-gray-50/50">
                       <span className="text-[10px] font-black text-gray-300 uppercase tracking-[4px] group-hover/zone:text-emerald-700 italic">Dosya Seçin veya Sürükleyin</span>
                    </div>
                 </div>
                 <button onClick={() => setIsBulkOpen(false)} className="text-[10px] font-black text-gray-300 uppercase tracking-[5px] hover:text-enba-dark transition-all italic">İşlemi İptal Et</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

interface XProps {
  size: number;
}
const X: React.FC<XProps> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default Machinery;
