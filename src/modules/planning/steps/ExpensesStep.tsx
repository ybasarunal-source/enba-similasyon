import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../api/i18n';
import { 
  Receipt, 
  Zap, 
  Package, 
  Users, 
  Trash2, 
  Plus, 
  Copy, 
  Info,
  ChevronDown,
  ChevronRight,
  TrendingUp as ChartLineUp,
  CreditCard,
  Settings as Gear,
  Wrench,
  Files,
  Utensils as ForkKnife,
  Contact as IdentificationBadge
} from 'lucide-react';

interface ExpenseCode {
  kodu: string;
  adi: string;
  icon?: any;
}

interface ExpensesStepProps {
  planData: any;
  onUpdate: (data: any) => void;
  next: () => void;
  back: () => void;
}

const ExpensesStep: React.FC<ExpensesStepProps> = ({ planData, onUpdate, next, back }) => {
  const { t } = useTranslation();
  const [bulkValues, setBulkValues] = useState<Record<string, string>>({});
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({});

  const EXPENSE_CODES: ExpenseCode[] = [
    { kodu: '315', adi: 'Ambalaj / Big-Bag Gideri', icon: Package }, // Dynamic
    { kodu: '400', adi: 'Kira Giderleri', icon: Receipt },
    { kodu: '405', adi: 'Fabrika Enerji / Elektrik', icon: Zap }, // Dynamic
    { kodu: '410', adi: 'İş Makinası Yakıt / Bakım', icon: Gear },
    { kodu: '420', adi: 'Tesis Bakım & Onarım', icon: Wrench },
    { kodu: '430', adi: 'Üretim Sarf Malzemeleri', icon: CreditCard },
    { kodu: '450', adi: 'Personel Net Maaş', icon: Users }, // Auto from Personnel
    { kodu: '455', adi: 'SGK İşveren Yükü', icon: IdentificationBadge }, // Auto from Personnel
    { kodu: '460', adi: 'Genel İdari Giderler', icon: Files },
    { kodu: '470', adi: 'Pazarlama & Satış Gideri', icon: ChartLineUp },
    { kodu: '480', adi: 'Personel Yemek & Ulaşım', icon: ForkKnife }, // Auto from Personnel
  ];

  const DYNAMIC_CODES = ['315', '405', '450', '455', '480'];

  const AYLAR = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const ayBasliklari = Array.from({ length: 12 }, (_, i) => {
    const ayIdx = (planData.startMonth + i) % 12;
    const yil = planData.startYear + Math.floor((planData.startMonth + i) / 12);
    return { ayIdx, yil, label: AYLAR[ayIdx].slice(0, 3) + ' ' + String(yil).slice(2) };
  });

  // Dynamic Calculation Mock
  const getDynamicValue = (code: string, monthIdx: number) => {
    if (code === '450' || code === '455' || code === '480') {
      let totalRoleCost = 0;
      const staff = planData.monthlyData[monthIdx]?.personeller || {};
      (planData.personnelList || []).forEach((role: any) => {
        for(let v=1; v<= (planData.shifts || 1); v++) {
           const count = staff[`${role.id}_v${v}`] || 0;
           if (code === '450') totalRoleCost += count * ((planData.baseNetSalary || 17002) + (role.ekMaas || 0));
           if (code === '455') totalRoleCost += count * ((planData.baseSgk || 5000) + (role.ekSgk || 0));
           if (code === '480') totalRoleCost += count * (planData.workDays || 26) * (planData.dailyMealCost || 200);
        }
      });
      return totalRoleCost;
    }
    
    if (code === '405') {
       let totalCap = 0;
       const shiftHrs = Object.values(planData.shiftHours || {}).slice(0, planData.shifts).reduce((a, b) => (a as any) + (b as any), 0) as number;
       const monthlyHrs = shiftHrs * (planData.workDays || 26);
       
       (planData.selectedMachines || []).forEach((sm: any) => {
          totalCap += 2.5 * monthlyHrs; // Mock capacity logic consistent with Operations
       });
       return totalCap * (planData.electricPrice || 2.5) * 0.4; // 0.4 usage factor
    }

    if (code === '315') {
      let targetTon = 0;
      const tedarikler = planData.monthlyData[monthIdx]?.tedarikler || {};
      Object.values(tedarikler).forEach((t: any) => targetTon += parseFloat(t.miktar || 0));
      return (targetTon / (planData.packaging?.capacity || 1.15)) * (planData.packaging?.price || 185);
    }
    
    return 0;
  };

  const updateExpense = (monthIdx: number, code: string, value: string) => {
    const newMonthly = [...planData.monthlyData];
    if (!newMonthly[monthIdx].giderler) newMonthly[monthIdx].giderler = {};
    newMonthly[monthIdx].giderler[code] = Number(value) || 0;
    onUpdate({ ...planData, monthlyData: newMonthly });
  };

  const applyBulk = () => {
    const newMonthly = [...planData.monthlyData];
    Object.entries(bulkValues).forEach(([code, val]) => {
      if (!DYNAMIC_CODES.includes(code)) {
        for(let i=0; i<12; i++) {
          if (!newMonthly[i].giderler) newMonthly[i].giderler = {};
          newMonthly[i].giderler[code] = Number(val) || 0;
        }
      }
    });
    onUpdate({ ...planData, monthlyData: newMonthly });
    alert('Bütçe şablonu tüm aylara başarıyla uygulandı.');
  };

  const fmt = (v: number) => (v || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col gap-10 p-10 animate-in slide-in-from-right duration-700">
      
      {/* Premium Bulk Entry Panel */}
      <div className="bg-enba-dark rounded-[2.5rem] p-10 overflow-hidden relative border border-white/10 shadow-2xl group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-enba-orange shadow-lg transition-transform group-hover:scale-110">
                <Receipt size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Sabit Gider & Bütçeleme Merkezi</h3>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-[3px] mt-1">Sabit gider kalemlerini girerek yıllık projeksiyona yayın</p>
              </div>
            </div>
            <button 
              onClick={applyBulk}
              className="px-10 py-4 bg-enba-orange text-white rounded-2xl font-black text-xs uppercase tracking-[2px] shadow-xl shadow-enba-orange/10 hover:bg-enba-orange-dark transition-all active:scale-95 flex items-center gap-3"
            >
              <Copy size={18} />
              Ocak Verilerini Yay
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
             {EXPENSE_CODES.map(exp => {
                const isDyn = DYNAMIC_CODES.includes(exp.kodu);
                return (
                  <div key={exp.kodu} className={`flex flex-col gap-2 p-5 rounded-[1.8rem] border transition-all ${isDyn ? 'bg-white/5 border-white/5 opacity-40 grayscale pointer-events-none' : 'bg-white/5 border-white/10 hover:border-enba-orange/40 hover:bg-white/10'}`}>
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block ml-1 truncate">
                      {isDyn ? 'OtomatiK' : exp.kodu} {exp.adi}
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        disabled={isDyn}
                        value={bulkValues[exp.kodu] || ''}
                        onChange={e => setBulkValues({...bulkValues, [exp.kodu]: e.target.value})}
                        placeholder={isDyn ? '---' : '0'}
                        className="w-full bg-black/20 border-none rounded-xl px-4 py-3 text-sm font-black text-white focus:bg-black/40 focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all"
                      />
                      {!isDyn && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-enba-orange">₺</div>}
                    </div>
                  </div>
                );
             })}
          </div>
        </div>
      </div>

      {/* Expense Matrix Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-card overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-100 flex items-center gap-4 bg-gray-50/30">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-enba-orange border border-gray-100">
                <ChartLineUp size={24} />
             </div>
             <div>
                <h3 className="text-xl font-black text-enba-dark italic uppercase tracking-tighter leading-none">Aylık Gider Projeksiyonu</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-1">Tüm gider kalemlerinin 12 aylık kırılımı</p>
             </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1400px]">
               <thead className="bg-gray-50/50 border-b border-gray-100">
                 <tr>
                    <th className="sticky left-0 bg-gray-50/90 backdrop-blur-md p-8 border-r border-gray-100 z-10 w-72 text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Gider Kodu / Kalemi</th>
                    {ayBasliklari.map((a, i) => (
                      <th key={i} className="p-6 text-center text-[10px] font-black text-enba-dark uppercase tracking-widest min-w-[140px] border-r border-gray-50">
                        {a.label}
                      </th>
                    ))}
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50 text-[11px]">
                  {EXPENSE_CODES.map(exp => {
                    const isDyn = DYNAMIC_CODES.includes(exp.kodu);
                    return (
                      <tr key={exp.kodu} className="hover:bg-blue-50/20 transition-all group">
                        <td className="sticky left-0 bg-white/90 backdrop-blur-md p-6 border-r border-gray-100 z-10 group-hover:bg-blue-50/50">
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDyn ? 'bg-enba-orange/10 text-enba-orange ring-1 ring-enba-orange/20' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:shadow-sm'}`}>
                                {isDyn ? <Zap size={18} /> : (exp.icon ? <exp.icon size={18} /> : <Receipt size={18} />)}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <div className="font-black text-enba-dark tracking-tight leading-none uppercase">{exp.kodu}</div>
                                <div className="text-[9px] font-black text-gray-400 uppercase w-44 truncate">{exp.adi}</div>
                              </div>
                           </div>
                        </td>
                        {Array.from({length: 12}).map((_, i) => {
                          const val = isDyn ? getDynamicValue(exp.kodu, i) : (planData.monthlyData[i].giderler?.[exp.kodu] || 0);
                          return (
                            <td key={i} className={`p-4 border-r border-gray-50 ${isDyn ? 'bg-orange-50/10' : ''}`}>
                               {isDyn ? (
                                 <div className="w-full text-center py-4 px-3 bg-orange-50/40 rounded-2xl text-[11px] font-black text-enba-orange-dark border border-orange-100 shadow-sm shadow-orange-100/30">
                                   {fmt(val)} ₺
                                 </div>
                               ) : (
                                 <div className="relative group/input">
                                    <input 
                                      type="number"
                                      value={planData.monthlyData[i].giderler?.[exp.kodu] || ''}
                                      onChange={e => updateExpense(i, exp.kodu, e.target.value)}
                                      className="w-full text-center py-3.5 bg-gray-50 border-none rounded-2xl text-[11px] font-black text-enba-dark focus:ring-2 focus:ring-enba-orange/20 focus:bg-white focus:shadow-xl outline-none transition-all shadow-inner"
                                      placeholder="---"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300 opacity-0 group-focus-within/input:opacity-100 pointer-events-none transition-opacity">₺</div>
                                 </div>
                               )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
               </tbody>
            </table>
          </div>
      </div>

      {/* Advanced Logic Indicator - Footer Banner */}
      <div className="bg-enba-orange/5 border border-enba-orange/10 p-8 rounded-[2.5rem] flex items-start gap-6 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 text-enba-orange opacity-[0.03] -mr-8 -mb-8 pointer-events-none group-hover:opacity-[0.05] transition-all">
             <Gear size={200} className="animate-spin-slow" />
          </div>
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-enba-orange shadow-xl shrink-0 border border-enba-orange/10">
             <Info size={32} />
          </div>
          <div className="relative z-10">
            <h4 className="text-lg font-black text-enba-dark italic uppercase tracking-tighter">Dinamik Algoritma Bildirimi</h4>
            <p className="text-sm font-medium text-enba-orange-dark mt-1 leading-relaxed max-w-3xl">
               <b>Vurgu:</b> Turuncu arka plana sahip gider kalemleri (315, 405, 450, 455, 480) sistem tarafından seçilen makinelerin güç tüketimi, personellerin kıdem/unvan farkları ve tedarik ettiğiniz tonajlardaki ambalaj ihtiyacına göre gerçek zamanlı hesaplanmaktadır. 
            </p>
          </div>
      </div>

      <div className="flex justify-between items-center bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-card">
        <button 
          onClick={back}
          className="px-10 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-[2px] hover:bg-gray-100 hover:text-enba-dark transition-all active:scale-95"
        >
          ← Önceki: Personel
        </button>
        <button 
          onClick={next}
          className="px-12 py-5 bg-enba-dark text-white rounded-2xl font-black text-xs uppercase tracking-[2px] hover:bg-black shadow-2xl transition-all active:scale-95 flex items-center gap-3"
        >
          Satış & Sevkiyat Planı
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default ExpensesStep;
