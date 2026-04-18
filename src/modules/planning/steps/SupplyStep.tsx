import React, { useState } from 'react';
import { useTranslation } from '../../../api/i18n';
import {
  Users,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Copy,
  Truck,
  ArrowLeftRight,
  Building2,
  Settings
} from 'lucide-react';

interface Supplier {
  id: number;
  ad: string;
}

interface SupplyStepProps {
  planData: any;
  onUpdate: (data: any) => void;
  next: () => void;
  back: () => void;
}

const SupplyStep: React.FC<SupplyStepProps> = ({ planData, onUpdate, next, back }) => {
  const { t } = useTranslation();
  const [newSupplierName, setNewSupplierName] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({});
  const [bulkOpen, setBulkOpen] = useState(true);

  const AYLAR = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const ayBasliklari = Array.from({ length: 12 }, (_, i) => {
    const ayIdx = (planData.startMonth + i) % 12;
    const yil = planData.startYear + Math.floor((planData.startMonth + i) / 12);
    return { ayIdx, yil, label: AYLAR[ayIdx].slice(0, 3) + ' ' + String(yil).slice(2) };
  });

  const addSupplier = () => {
    if (!newSupplierName.trim()) return;
    const newSupp: Supplier = { id: Date.now(), ad: newSupplierName.trim() };
    onUpdate({
      ...planData,
      suppliers: [...planData.suppliers, newSupp]
    });
    setNewSupplierName('');
  };

  const removeSupplier = (id: number) => {
    if(confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) {
        onUpdate({
          ...planData,
          suppliers: planData.suppliers.filter((s: Supplier) => s.id !== id)
        });
    }
  };

  const updateTedarik = (monthIdx: number, supplierId: number, field: string, value: any) => {
    const newMonthly = [...planData.monthlyData];
    if (!newMonthly[monthIdx].tedarikler) newMonthly[monthIdx].tedarikler = {};
    if (!newMonthly[monthIdx].tedarikler[supplierId]) newMonthly[monthIdx].tedarikler[supplierId] = {};
    
    newMonthly[monthIdx].tedarikler[supplierId][field] = value;
    onUpdate({ ...planData, monthlyData: newMonthly });
  };

  const copyForward = (monthIdx: number, supplierId: number) => {
    const currentData = planData.monthlyData[monthIdx].tedarikler?.[supplierId];
    if (!currentData) return;

    const newMonthly = [...planData.monthlyData];
    for (let i = monthIdx + 1; i < 12; i++) {
       if (!newMonthly[i].tedarikler) newMonthly[i].tedarikler = {};
       newMonthly[i].tedarikler[supplierId] = { ...currentData };
    }
    onUpdate({ ...planData, monthlyData: newMonthly });
    alert('Veriler sonraki tüm aylara kopyalandı.');
  };

  const fmt = (v: number) => (Number(v) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 1 });

  return (
    <div className="flex flex-col gap-10 p-10 animate-in slide-in-from-right duration-700">
      {/* Header & General Info */}
      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-card flex flex-col gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] flex items-center gap-2">
            <Settings size={14} className="text-blue-500" /> Plan Zaman Çizelgesi
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-[11px] font-black text-enba-dark uppercase tracking-widest ml-1">Simülasyon Yılı</span>
              <input 
                type="number" 
                value={planData.startYear}
                onChange={e => onUpdate({...planData, startYear: Number(e.target.value)})}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-black text-enba-dark uppercase tracking-widest ml-1">Başlangıç Ayı</span>
              <select 
                value={planData.startMonth}
                onChange={e => onUpdate({...planData, startMonth: Number(e.target.value)})}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none cursor-pointer"
              >
                {AYLAR.map((ay, i) => <option key={i} value={i}>{ay}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-card flex flex-col gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-enba-orange/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-enba-orange/10 transition-all"></div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] flex items-center gap-2">
            <Users size={14} className="text-enba-orange" /> Tedarikçi Havuzu
          </label>
          <div className="flex gap-3">
             <input 
               type="text" 
               value={newSupplierName}
               onChange={e => setNewSupplierName(e.target.value)}
               placeholder="Örn: Kuzey Lojistik A.Ş."
               className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all placeholder:text-gray-300"
               onKeyDown={e => e.key === 'Enter' && addSupplier()}
             />
             <button 
               onClick={addSupplier}
               className="px-6 bg-enba-dark text-white rounded-2xl hover:bg-black transition-all flex items-center justify-center shadow-lg active:scale-90"
             >
               <Plus size={24} />
             </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {planData.suppliers.map((s: Supplier) => (
              <div key={s.id} className="group flex items-center gap-3 px-4 py-2.5 bg-gray-50 text-enba-dark rounded-xl border border-gray-100 font-bold text-xs hover:border-enba-orange/30 hover:bg-white transition-all animate-in zoom-in duration-300 shadow-sm">
                <div className="w-5 h-5 rounded bg-enba-orange/10 text-enba-orange flex items-center justify-center">
                    <Building2 size={12} />
                </div>
                {s.ad}
                <button onClick={() => removeSupplier(s.id)} className="opacity-0 group-hover:opacity-100 transition-all hover:text-rose-500 p-1">
                   <Trash2 size={14} />
                </button>
              </div>
            ))}
            {planData.suppliers.length === 0 && <span className="text-[10px] font-bold text-gray-300 italic">Lütfen tedarikçi ekleyerek başlayın.</span>}
          </div>
        </div>
      </div>

      {/* Bulk Input Matrix - Premium Professional View */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-card overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-enba-orange shadow-sm border border-gray-100">
                <ArrowLeftRight size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-enba-dark italic uppercase tracking-tighter">Tedarik & Maliyet Matrisi</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-1">12 Aylık Ham Madde Akış Projeksiyonu</p>
              </div>
            </div>
            <button 
               onClick={() => setBulkOpen(!bulkOpen)}
               className="p-3 hover:bg-white rounded-xl transition-all text-gray-400 border border-transparent hover:border-gray-100 shadow-sm"
            >
              {bulkOpen ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
            </button>
        </div>

        {bulkOpen && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="sticky left-0 bg-gray-50 p-6 border-r border-gray-100 z-10 w-56 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tedarikçi Bilgisi</th>
                  <th className="sticky left-56 bg-gray-50 p-6 border-r border-gray-100 z-10 w-28 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Metrik</th>
                  {ayBasliklari.map((a, i) => (
                    <th key={i} className="p-6 text-center text-[11px] font-black text-enba-dark uppercase tracking-widest min-w-[120px] border-l border-gray-50 bg-white/40">
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planData.suppliers.map((s: Supplier) => (
                  <React.Fragment key={s.id}>
                    {/* Miktar Row */}
                    <tr className="border-t border-gray-100 group">
                      <td rowSpan={3} className="sticky left-0 bg-white p-6 border-r border-gray-100 z-10 font-black text-enba-dark text-sm uppercase tracking-tighter italic group-hover:bg-gray-50/50 transition-colors">
                        {s.ad}
                      </td>
                      <td className="sticky left-56 bg-white p-3 border-r border-gray-100 z-10 text-[9px] font-black text-blue-500 uppercase tracking-widest text-center group-hover:bg-gray-50/50">Miktar (T)</td>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <td key={i} className="p-3 bg-white group-hover:bg-gray-50/20 transition-colors">
                          <input 
                            type="number" 
                            value={planData.monthlyData[i].tedarikler?.[s.id]?.miktar || ''}
                            onChange={e => updateTedarik(i, s.id, 'miktar', e.target.value)}
                            className="w-full text-center py-3 bg-blue-50/30 border-none rounded-xl text-xs font-black text-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            placeholder="0"
                          />
                        </td>
                      ))}
                    </tr>
                    {/* Fiyat Row */}
                    <tr className="border-t border-gray-50 group">
                      <td className="sticky left-56 bg-white p-3 border-r border-gray-100 z-10 text-[9px] font-black text-emerald-600 uppercase tracking-widest text-center group-hover:bg-gray-50/50">Fiyat (₺)</td>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <td key={i} className="p-3 bg-white group-hover:bg-gray-50/20 transition-colors">
                          <input 
                            type="number" 
                            value={planData.monthlyData[i].tedarikler?.[s.id]?.fiyat || ''}
                            onChange={e => updateTedarik(i, s.id, 'fiyat', e.target.value)}
                            className="w-full text-center py-3 bg-emerald-50/30 border-none rounded-xl text-xs font-black text-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                            placeholder="0"
                          />
                        </td>
                      ))}
                    </tr>
                    {/* Nakliye Row */}
                    <tr className="border-t border-gray-50 border-b border-gray-100 group">
                      <td className="sticky left-56 bg-white p-3 border-r border-gray-100 z-10 text-[9px] font-black text-enba-orange uppercase tracking-widest text-center whitespace-nowrap group-hover:bg-gray-50/50">Nakliye (₺)</td>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <td key={i} className="p-3 bg-white group-hover:bg-gray-50/20 transition-colors">
                          <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                value={planData.monthlyData[i].tedarikler?.[s.id]?.nakliye || ''}
                                onChange={e => updateTedarik(i, s.id, 'nakliye', e.target.value)}
                                className="w-full text-center py-3 bg-orange-50/30 border-none rounded-xl text-xs font-black text-enba-orange focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                                placeholder="0"
                            />
                            <button 
                                onClick={() => copyForward(i, s.id)}
                                className="w-9 h-9 shrink-0 flex items-center justify-center bg-enba-dark text-white rounded-xl shadow-sm hover:bg-black transition-all active:scale-90" 
                                title="Sonraki aylara kopyala"
                            >
                                <Copy size={14} />
                            </button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                ))}
                {planData.suppliers.length === 0 && (
                   <tr>
                     <td colSpan={14} className="py-20 text-center text-gray-300 italic font-medium">Lütfen önce tedarikçi ekleyiniz.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-card">
        <button 
          onClick={back}
          className="px-10 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-[2px] hover:bg-gray-200 hover:text-enba-dark transition-all active:scale-95"
        >
          ← Geri Dön
        </button>
        <button 
          onClick={next}
          className="px-12 py-4 bg-enba-dark text-white rounded-2xl font-black text-xs uppercase tracking-[2px] hover:bg-black shadow-xl shadow-gray-200 transition-all active:scale-95 flex items-center gap-3"
        >
          Operasyon & Makina Parkuru
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default SupplyStep;
