import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../api/i18n';
import { 
  Award, 
  Hourglass, 
  CheckCircle, 
  AlertCircle, 
  Infinity as InfinityIcon, 
  FilePlus, 
  Eye, 
  Pencil, 
  Trash2, 
  Coins, 
  Files, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';
import { fmt } from '../utils/formatters';

interface Permit {
  id: string;
  ad: string;
  kategori: string;
  kurum: string;
  alinisTarihi: string;
  yenilemeTarihi: string | null;
  isSuresiz: boolean;
  maliyet: number;
  fileId?: string;
  fileName?: string;
}

export const Licensing: React.FC = () => {
  const { t } = useTranslation();

  // ── Data States ──────────────────────────────────────────
  const [kayitlar, setKayitlar] = useState<Permit[]>(() => {
    const saved = localStorage.getItem('enba_lisans_kayitlari');
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(false);

  // ── Sync with LocalStorage ───────────────────────────────
  useEffect(() => {
    localStorage.setItem('enba_lisans_kayitlari', JSON.stringify(kayitlar));
  }, [kayitlar]);

  // ── UI States ────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Permit>>({
    ad: '', kategori: 'Ruhsat', kurum: '', alinisTarihi: '', yenilemeTarihi: '', isSuresiz: false, maliyet: 0
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const categories = ["Ruhsat", "Lisans", "Sertifika", "Sigorta", "Sözleşme", "Diğer"];

  // ── Helper Logic ────────────────────────────────────────
  const calculateStatus = (yenilemeDate: string | null, isSuresiz: boolean) => {
    if (isSuresiz) return { label: "Süresiz Aktif", color: "text-emerald-500", bg: "bg-emerald-50", border: 'border-emerald-100', icon: InfinityIcon };
    if (!yenilemeDate) return { label: "Bilinmiyor", color: "text-slate-400", bg: "bg-slate-50", border: 'border-slate-100', icon: AlertCircle };
    
    const today = new Date();
    const renewal = new Date(yenilemeDate);
    const diffDays = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "Süresi Dolmuş", color: "text-rose-600", bg: "bg-rose-50", border: 'border-rose-100', icon: AlertCircle };
    if (diffDays <= 30) return { label: "Yaklaşıyor", color: "text-orange-600", bg: "bg-orange-50", border: 'border-orange-100', icon: Hourglass };
    return { label: "Aktif", color: "text-emerald-600", bg: "bg-emerald-50", border: 'border-emerald-100', icon: CheckCircle };
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ad) return;

    const newRecord: Permit = {
      ...formData as Permit,
      id: editingId || `prm_${Date.now()}`
    };

    if (editingId) {
      setKayitlar(prev => prev.map(k => k.id === editingId ? newRecord : k));
    } else {
      setKayitlar(prev => [...prev, newRecord]);
    }

    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ ad: '', kategori: 'Ruhsat', kurum: '', alinisTarihi: '', yenilemeTarihi: '', isSuresiz: false, maliyet: 0 });
  };

  const stats = useMemo(() => {
    const totalCost = kayitlar.reduce((sum, k) => sum + (k.maliyet || 0), 0);
    const expiringCount = kayitlar.filter(k => {
      const status = calculateStatus(k.yenilemeTarihi, k.isSuresiz);
      return status.label === "Yaklaşıyor";
    }).length;
    const expiredCount = kayitlar.filter(k => !k.isSuresiz && calculateStatus(k.yenilemeTarihi, k.isSuresiz).label === "Süresi Dolmuş").length;

    return { totalCost, expiringCount, expiredCount, total: kayitlar.length };
  }, [kayitlar]);

  return (
    <div className="flex flex-col gap-10 p-10 animate-in fade-in duration-1000">
       {/* Header Section */}
       <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-enba-dark rounded-[1.2rem] flex items-center justify-center text-enba-orange shadow-2xl border border-white/5">
                   <Award size={32} />
                </div>
                <div>
                   <h2 className="text-3xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">
                     Uyumluluk & Lisans Matrixi
                   </h2>
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-[4px] mt-2 italic">Yasal İzin ve Sertifikasyon Yönetimi</p>
                </div>
             </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setIsFormOpen(true)} className="px-10 py-5 bg-enba-dark text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[3px] shadow-2xl shadow-black/20 hover:bg-black transition-all flex items-center gap-4 group active:scale-95 border border-white/5">
                <FilePlus size={20} className="text-enba-orange transition-transform group-hover:rotate-90" />
                Varlık / Lisans Kaydı Ekle
             </button>
          </div>
       </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'Aktif Mevzuat Kaydı', value: stats.total, unit: 'BELGE', icon: Files, color: 'text-enba-dark' },
            { label: 'Yıllık Uyum Giderleri', value: stats.totalCost, unit: '₺', icon: Coins, color: 'text-enba-dark' },
            { label: 'Günü Yaklaşanlar', value: stats.expiringCount, unit: 'RİSK', icon: Hourglass, color: 'text-orange-600', special: stats.expiringCount > 0 },
            { label: 'Süresi Dolanlar', value: stats.expiredCount, unit: 'KRİTİK', icon: AlertCircle, color: 'text-rose-600', special: stats.expiredCount > 0 }
          ].map((stat, i) => (
            <div key={i} className={`bg-white p-10 rounded-[2.5rem] border ${stat.special ? 'border-orange-100 shadow-orange-50' : 'border-gray-100 shadow-card'} flex flex-col justify-between min-h-[200px] group transition-all relative overflow-hidden`}>
               <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-enba-orange/5 transition-colors"></div>
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl relative z-10 ${stat.special ? 'bg-orange-500' : 'bg-enba-dark'}`}>
                  <stat.icon size={24} />
               </div>
               <div className="relative z-10">
                  <div className="text-[10px] font-black text-gray-300 uppercase tracking-[4px] mb-2">{stat.label}</div>
                  <div className={`text-2xl font-black tracking-tighter italic ${stat.color} leading-none`}>
                     {stat.unit === '₺' ? fmt(stat.value) : stat.value} <span className="text-[10px] font-bold text-gray-300 ml-1 italic uppercase leading-none">{stat.unit}</span>
                  </div>
               </div>
            </div>
          ))}
       </div>

       {/* List Control Panel */}
       <div className="bg-white rounded-[3rem] border border-gray-100 shadow-card overflow-hidden group">
          <div className="p-10 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
             <div>
                <h3 className="text-xl font-black text-enba-dark italic uppercase tracking-tighter leading-none flex items-center gap-4">
                  <ShieldCheck size={28} className="text-emerald-500" /> Aktif Mevzuat Matrixi
                </h3>
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-[3px] mt-2">Sistem Üzerindeki Tüm Yasal Kayıtlar</p>
             </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">
                      <th className="px-10 py-6">Belge Detayı & Düzenleyen Kurum</th>
                      <th className="px-10 py-6 text-center">Durum</th>
                      <th className="px-10 py-6">Vade / Yenileme</th>
                      <th className="px-10 py-6 text-right">Maliyet</th>
                      <th className="px-10 py-6 text-right">Yönetim</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {kayitlar.map(k => {
                     const status = calculateStatus(k.yenilemeTarihi, k.isSuresiz);
                     const StatusIcon = status.icon;

                     return (
                        <tr key={k.id} className="group/tr hover:bg-gray-50/80 transition-all">
                           <td className="px-10 py-8">
                              <div className="flex items-center gap-6">
                                 <div className={`w-12 h-12 rounded-[1rem] ${status.bg} ${status.color} flex items-center justify-center shadow-lg group-hover/tr:scale-110 transition-transform`}>
                                    <Award size={24} />
                                 </div>
                                 <div>
                                    <div className="text-base font-black text-enba-dark tracking-tight italic uppercase leading-none mb-1.5">{k.ad}</div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] flex items-center gap-3">
                                       <Building2 size={12} className="text-enba-orange" /> {k.kurum} <div className="w-1 h-1 bg-gray-200 rounded-full"></div> {k.kategori}
                                    </div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-8 text-center">
                              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest italic ${status.bg} ${status.color} border ${status.border} shadow-sm`}>
                                 <StatusIcon size={12} /> {status.label}
                              </span>
                           </td>
                           <td className="px-10 py-8">
                              <div className="flex items-center gap-3">
                                 <Calendar size={18} className="text-enba-orange" />
                                 <span className={`text-[11px] font-black tracking-widest uppercase italic tabular-nums ${status.label === 'Süresi Dolmuş' ? 'text-rose-500 underline underline-offset-4 decoration-rose-200' : 'text-enba-dark'}`}>
                                    {k.isSuresiz ? 'SÜRESİZ GEÇERLİ' : (k.yenilemeTarihi ? new Date(k.yenilemeTarihi).toLocaleDateString('tr-TR') : 'BELİRTİLMEDİ')}
                                 </span>
                              </div>
                           </td>
                           <td className="px-10 py-8 text-right">
                              <span className="text-base font-black text-enba-dark tabular-nums italic uppercase leading-none">
                                {fmt(k.maliyet)} <span className="text-[9px] text-gray-300 font-bold ml-1">₺</span>
                              </span>
                           </td>
                           <td className="px-10 py-8 text-right">
                              <div className="flex justify-end gap-3 opacity-0 group-hover/tr:opacity-100 transition-opacity">
                                 <button onClick={() => { setEditingId(k.id); setFormData(k); setIsFormOpen(true); }} className="w-10 h-10 rounded-xl bg-enba-dark text-white flex items-center justify-center hover:bg-black transition-all shadow-xl active:scale-90">
                                    <Pencil size={18} />
                                 </button>
                                 <button onClick={() => setKayitlar(prev => prev.filter(x => x.id !== k.id))} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90">
                                    <Trash2 size={18} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     );
                   })}
                   {kayitlar.length === 0 && (
                     <tr>
                        <td colSpan={5} className="px-10 py-32 text-center">
                           <div className="flex flex-col items-center gap-6">
                              <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-100 border border-gray-50 shadow-inner">
                                 <Files size={48} />
                              </div>
                              <div className="flex flex-col gap-2">
                                 <span className="text-[12px] font-black text-gray-300 uppercase tracking-[6px] italic leading-none">SİSTEM KAYDI BULUNAMADI</span>
                                 <span className="text-[9px] font-bold text-gray-200 uppercase tracking-[3px]">Yeni bir lisans ekleyerek başlayın</span>
                              </div>
                           </div>
                        </td>
                     </tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>

       {/* Form Modal */}
       {isFormOpen && (
         <div className="fixed inset-0 bg-enba-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 overflow-hidden relative group">
               <div className="absolute top-0 left-0 w-full h-2 bg-enba-orange shadow-lg shadow-enba-orange/20"></div>
               <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-enba-dark rounded-2xl flex items-center justify-center text-enba-orange shadow-2xl">
                        <FilePlus size={32} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">{editingId ? 'Lisans Güncelleme' : 'Yeni Lisans Kaydı'}</h3>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-2 italic">Mevzuat Verisi Giriş Paneli</p>
                     </div>
                  </div>
                  <button onClick={() => setIsFormOpen(false)} className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-300 transition-all hover:rotate-90">
                     <X size={32} />
                  </button>
               </div>
               <form onSubmit={handleSave} className="p-12 space-y-10">
                  <div className="grid grid-cols-2 gap-10">
                     <div className="col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Belge / Lisans Tanımı</label>
                        <input required value={formData.ad} onChange={e => setFormData({...formData, ad: e.target.value})} className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-base font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all placeholder:italic" placeholder="ÖRN: ÇEVRE İZNİ VE LİSANSI" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Kategori Matrixi</label>
                        <select value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all appearance-none italic">
                           {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Düzenleyici Kurum</label>
                        <input value={formData.kurum} onChange={e => setFormData({...formData, kurum: e.target.value})} className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all placeholder:italic placeholder:text-[10px]" placeholder="ÖRN: ÇEVRE VE ŞEHİRCİLİK BAKANLIĞI" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Edinim Tarihi</label>
                        <input type="date" value={formData.alinisTarihi} onChange={e => setFormData({...formData, alinisTarihi: e.target.value})} className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all" />
                     </div>
                     <div className="space-y-3 relative">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Vade / Yenileme Tarihi</label>
                        <input type="date" required={!formData.isSuresiz} disabled={formData.isSuresiz} value={formData.yenilemeTarihi || ''} onChange={e => setFormData({...formData, yenilemeTarihi: e.target.value})} className={`w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all ${formData.isSuresiz ? 'opacity-20 pointer-events-none' : ''}`} />
                        <label className="flex items-center gap-3 mt-4 cursor-pointer group/chk">
                           <input type="checkbox" checked={formData.isSuresiz} onChange={e => setFormData({...formData, isSuresiz: e.target.checked})} className="w-5 h-5 rounded-lg bg-gray-100 border-none text-enba-orange focus:ring-0 cursor-pointer" />
                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] group-hover/chk:text-enba-orange transition-colors italic">Süresiz Geçerli Belge</span>
                        </label>
                     </div>
                     <div className="col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Yasal Harç & Maliyet (₺)</label>
                        <input type="number" value={formData.maliyet} onChange={e => setFormData({...formData, maliyet: Number(e.target.value)})} className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-base font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all tabular-nums" placeholder="0" />
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
export default Licensing;
