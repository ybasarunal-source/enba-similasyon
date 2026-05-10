import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Contact,
  Banknote,
  ChevronRight,
  UserPlus,
  Copy
} from 'lucide-react';

interface PersonnelRole {
  id: number;
  unvan: string;
  ekMaas: number;
  ekSgk: number;
  ekYemek: number;
}

interface PersonnelStepProps {
  planData: any;
  onUpdate: (data: any) => void;
  next: () => void;
  back: () => void;
}

const PersonnelStep: React.FC<PersonnelStepProps> = ({ planData, onUpdate, next, back }) => {
  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({});
  
  const [newRole, setNewRole] = useState({
    unvan: '',
    ekMaas: '',
    ekSgk: '',
    ekYemek: ''
  });

  const AYLAR = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const addRole = () => {
    if (!newRole.unvan.trim()) return;
    const role: PersonnelRole = {
      id: Date.now(),
      unvan: newRole.unvan.trim(),
      ekMaas: Number(newRole.ekMaas) || 0,
      ekSgk: Number(newRole.ekSgk) || 0,
      ekYemek: Number(newRole.ekYemek) || 0
    };
    onUpdate({
      ...planData,
      personnelList: [...(planData.personnelList || []), role]
    });
    setNewRole({ unvan: '', ekMaas: '', ekSgk: '', ekYemek: '' });
  };

  const removeRole = (id: number) => {
    if(confirm('Bu unvanı ve bağlı kadroları silmek istediğinize emin misiniz?')) {
        onUpdate({
          ...planData,
          personnelList: planData.personnelList.filter((r: PersonnelRole) => r.id !== id)
        });
    }
  };

  const updateStaffCount = (monthIdx: number, roleId: number, shift: number, count: string) => {
    const newMonthly = [...planData.monthlyData];
    const key = `${roleId}_v${shift}`;
    if (!newMonthly[monthIdx].personeller) newMonthly[monthIdx].personeller = {};
    newMonthly[monthIdx].personeller[key] = Number(count) || 0;
    onUpdate({ ...planData, monthlyData: newMonthly });
  };

  const applyToAllMonths = () => {
     // Take first month's staffing and apply to all
     const firstMonthStaff = planData.monthlyData[0].personeller || {};
     const newMonthly = planData.monthlyData.map((m: any) => ({
        ...m,
        personeller: { ...firstMonthStaff }
     }));
     onUpdate({ ...planData, monthlyData: newMonthly });
     alert('Ocak ayı kadro dağılımı tüm yıla başarıyla kopyalandı.');
  };

  const calculateTotalStaff = (monthIdx: number) => {
    let total = 0;
    const personeller = planData.monthlyData[monthIdx].personeller || {};
    Object.values(personeller).forEach(val => total += (val as number));
    return total;
  };

  const fmt = (v: number) => (v || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col gap-10 p-10 animate-in slide-in-from-right duration-700">
      
      {/* Base Parameters - Premium Glass Card */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm transition-transform group-hover:rotate-12">
             <Banknote size={24} />
          </div>
          <div>
             <h3 className="text-xl font-black text-enba-dark italic uppercase tracking-tighter">İnsan Kaynakları & Maaş Parametreleri</h3>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-1">Global Maaş, SGK ve Sosyal Hak Standartları</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Taban Net Maaş (₺)</label>
            <input 
              type="number" 
              value={planData.baseNetSalary || 28075.5}
              onChange={e => onUpdate({...planData, baseNetSalary: Number(e.target.value)})}
              className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">SGK İşveren Yükü (₺)</label>
            <input 
              type="number" 
              value={planData.baseSgk || 12799.13}
              onChange={e => onUpdate({...planData, baseSgk: Number(e.target.value)})}
              className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Günlük Yemek / Yan Hak (₺)</label>
            <input 
              type="number" 
              value={planData.dailyMealCost || 200}
              onChange={e => onUpdate({...planData, dailyMealCost: Number(e.target.value)})}
              className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Role Management - Industrial Dark Component */}
      <div className="bg-enba-dark p-10 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col gap-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-enba-orange shadow-lg transition-transform group-hover:scale-110">
               <Contact size={28} />
            </div>
            <div>
               <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Organizasyonel Rol Tanımları</h3>
               <p className="text-[10px] text-white/40 font-black uppercase tracking-[3px] mt-1">Ünvan Bazlı Maaş Farkları ve Destekler</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-6 items-end bg-white/5 p-8 rounded-3xl border border-white/10 group-hover:border-white/20 transition-all">
           <div className="md:col-span-2 space-y-2">
             <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block ml-1">Ünvan / Pozisyon</label>
             <input 
               type="text" 
               value={newRole.unvan}
               onChange={e => setNewRole({...newRole, unvan: e.target.value})}
               placeholder="Örn: Fabrika Müdürü"
               className="w-full bg-white/5 border-none rounded-2xl px-6 py-4 text-sm font-bold text-white focus:bg-white/10 focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all"
             />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block ml-1">Ek Maaş (₺)</label>
             <input 
               type="number" 
               value={newRole.ekMaas}
               onChange={e => setNewRole({...newRole, ekMaas: e.target.value})}
               className="w-full bg-white/5 border-none rounded-2xl px-6 py-4 text-sm font-black text-enba-orange focus:bg-white/10 focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all"
               placeholder="0"
             />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block ml-1">Ek SGK (₺)</label>
             <input 
               type="number" 
               value={newRole.ekSgk}
               onChange={e => setNewRole({...newRole, ekSgk: e.target.value})}
               className="w-full bg-white/5 border-none rounded-2xl px-6 py-4 text-sm font-black text-white/60 focus:bg-white/10 outline-none transition-all"
               placeholder="0"
             />
           </div>
           <button 
             onClick={addRole}
             className="h-[54px] bg-enba-orange text-white rounded-2xl font-black text-xs uppercase tracking-[3px] hover:bg-enba-orange-dark shadow-xl shadow-enba-orange/20 transition-all flex items-center justify-center gap-3 active:scale-95"
           >
             <Plus size={20} />
             Rol Ekle
           </button>
        </div>

        <div className="relative z-10 flex flex-wrap gap-4 pt-2">
          {(planData.personnelList || []).map((role: PersonnelRole) => (
            <div key={role.id} className="group bg-white/5 border border-white/5 p-6 rounded-[2rem] flex items-center gap-6 hover:bg-white/10 hover:border-enba-orange/30 transition-all shadow-xl animate-in zoom-in duration-300">
               <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:text-enba-orange transition-colors">
                  <Users size={24} />
               </div>
               <div>
                  <div className="font-black text-white text-base tracking-tight uppercase">{role.unvan}</div>
                  <div className="text-[10px] font-black text-enba-orange mt-1 tracking-widest">+{fmt(role.ekMaas)} ₺ PREMIUM</div>
               </div>
               <button onClick={() => removeRole(role.id)} className="w-10 h-10 flex items-center justify-center text-white/10 hover:text-white hover:bg-rose-500 rounded-xl transition-all ml-2">
                  <Trash2 size={16} />
               </button>
            </div>
          ))}
          {(planData.personnelList || []).length === 0 && <span className="text-xs text-white/20 font-medium italic">Henüz özel ünvan tanımlanmadı.</span>}
        </div>
      </div>

      {/* Monthly Staffing Table - Premium Layout */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-card overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/30">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-enba-orange border border-gray-100">
                  <Users size={28} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-enba-dark italic uppercase tracking-tighter">İstihdam & Kadro Planlama</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-1">Aylık ve Vardiya Bazlı Personel Sayıları</p>
               </div>
             </div>
             {(planData.personnelList || []).length > 0 && (
               <button 
                  onClick={applyToAllMonths}
                  className="flex items-center gap-3 px-8 py-4 bg-enba-dark text-white rounded-2xl font-black text-xs uppercase tracking-[2px] shadow-xl hover:bg-black transition-all active:scale-95"
               >
                 <Copy size={18} />
                 Ocak Kadrosunu Şablona Yay
               </button>
             )}
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                   <tr>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Simülasyon Dönemi</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[3px] text-center">Toplam Aktif Kadro</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[3px] text-right">Organizasyon</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {Array.from({length: 12}).map((_, i) => {
                    const ayIdx = (planData.startMonth + i) % 12;
                    const isOpen = expandedMonths[i];
                    const total = calculateTotalStaff(i);
                    return (
                      <React.Fragment key={i}>
                        <tr 
                          onClick={() => setExpandedMonths({...expandedMonths, [i]: !isOpen})}
                          className={`cursor-pointer group transition-all ${isOpen ? 'bg-blue-50/30' : 'hover:bg-gray-50/80'}`}
                        >
                           <td className="px-10 py-6 text-sm font-black text-enba-dark uppercase tracking-tight italic">
                             <div className="flex items-center gap-4">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isOpen ? 'bg-enba-orange text-white rotate-90' : 'bg-gray-100 text-gray-400'}`}>
                                  <ChevronRight size={16} />
                               </div>
                               {AYLAR[ayIdx]}
                             </div>
                           </td>
                           <td className="px-10 py-6 text-center">
                               <span className={`inline-flex items-center gap-3 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-sm ${total > 0 ? 'bg-enba-dark text-white ring-4 ring-enba-orange/10' : 'bg-gray-100 text-gray-400'}`}>
                                 {total} Aktif Personel
                               </span>
                           </td>
                           <td className="px-10 py-6 text-right">
                               <span className="text-[10px] font-black text-enba-orange uppercase tracking-[2px] opacity-0 group-hover:opacity-100 transition-opacity">Kadro Şemasını Düzenle →</span>
                           </td>
                        </tr>
                        {isOpen && (
                          <tr className="animate-in fade-in duration-500">
                            <td colSpan={3} className="px-10 py-10 bg-gray-50/20 border-y border-gray-100">
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                  {(planData.personnelList || []).map((role: PersonnelRole) => (
                                    <div key={role.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-card group hover:border-enba-orange/20 transition-all">
                                       <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 border-b border-gray-50 pb-3 flex items-center justify-between">
                                           <span>{role.unvan}</span>
                                           <Users size={12} />
                                       </div>
                                       <div className="flex gap-4">
                                          {Array.from({length: planData.shifts || 1}).map((_, vIdx) => (
                                             <div key={vIdx} className="flex-1 space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 block ml-1 uppercase">{vIdx+1}. Vardiya</label>
                                                <input 
                                                  type="number" 
                                                  value={planData.monthlyData[i].personeller?.[`${role.id}_v${vIdx+1}`] || ''}
                                                  onChange={e => updateStaffCount(i, role.id, vIdx+1, e.target.value)}
                                                  className="w-full bg-gray-50 border-none rounded-xl py-3 text-center text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all shadow-inner"
                                                  placeholder="0"
                                                />
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                  ))}
                               </div>
                               {(planData.personnelList || []).length === 0 && (
                                 <div className="text-center py-10 flex flex-col items-center gap-3 opacity-30 grayscale">
                                   <UserPlus size={48} />
                                   <span className="text-xs font-black uppercase tracking-widest">Lütfen yukarıdan ünvanları tanımlayarak başlayın.</span>
                                 </div>
                               )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                   })}
                </tbody>
             </table>
          </div>
      </div>

      {/* Footer Controls - Premium Actions */}
      <div className="mt-4 flex justify-between items-center bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-card relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/10 group-hover:bg-emerald-500 transition-all"></div>
          <div className="flex flex-col gap-1">
             <h4 className="text-lg font-black text-enba-dark uppercase tracking-tighter italic">Organizasyon Maliyeti Onayı</h4>
             <p className="text-xs font-medium text-gray-400">Belirlediğiniz kadro, bir sonraki adıma (Giderler) maliyet olarak yansıtılacaktır.</p>
          </div>
          <div className="flex items-center gap-6">
              <button 
                onClick={back}
                className="px-10 py-5 bg-gray-50 text-gray-400 rounded-[1.5rem] font-black text-xs uppercase tracking-[2px] hover:bg-gray-100 hover:text-enba-dark transition-all active:scale-95"
              >
                Geri Git
              </button>
              <button 
                onClick={next}
                className="px-12 py-5 bg-enba-dark text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[2px] hover:bg-black shadow-2xl shadow-gray-200 transition-all active:scale-95 flex items-center gap-3"
              >
                Gider & Sabit Maliyetler
                <ChevronRight size={18} />
              </button>
          </div>
      </div>
    </div>
  );
};

export default PersonnelStep;
