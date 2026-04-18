import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../../api/i18n';
import { 
  TrendingUp as ChartLineUp, 
  TrendingUp, 
  TrendingDown, 
  FileDown, 
  FileText as FilePdf, 
  Table, 
  Banknote as CurrencyDollar,
  Percent,
  Calculator,
  HardHat,
  Factory,
  ArrowUpRight
} from 'lucide-react';

interface ReportStepProps {
  planData: any;
  back: () => void;
}

const ReportStep: React.FC<ReportStepProps> = ({ planData, back }) => {
  const { t } = useTranslation();
  
  // Projection settings
  const [tonageGrowth, setTonageGrowth] = useState(10);
  const [priceInflation, setPriceInflation] = useState(25);
  const [expenseInflation, setExpenseInflation] = useState(20);

  const AYLAR = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const ayBasliklari = Array.from({ length: 12 }, (_, i) => {
    const ayIdx = (planData.startMonth + i) % 12;
    const yil = planData.startYear + Math.floor((planData.startMonth + i) / 12);
    return { ayIdx, yil, label: AYLAR[ayIdx].slice(0, 3) + ' ' + String(yil).slice(2) };
  });

  const calculations = useMemo(() => {
    const monthlyResults = Array.from({ length: 12 }).map((_, i) => {
      // 1. Revenue
      let revenue = 0;
      Object.values(planData.monthlyData[i]?.musteriler || {}).forEach((s: any) => revenue += (parseFloat(s.miktar || 0) * parseFloat(s.fiyat || 0)));

      // 2. Direct Costs (Cogs)
      let cogs = 0;
      Object.values(planData.monthlyData[i]?.tedarikler || {}).forEach((t: any) => cogs += (parseFloat(t.miktar || 0) * (parseFloat(t.fiyat || 0) + parseFloat(t.nakliye || 0))));

      // 3. OPEX (Fixed + Dynamic)
      let opex = 0;
      Object.values(planData.monthlyData[i]?.giderler || {}).forEach((g: any) => opex += (parseFloat(g) || 0));
      
      // Add Personnel
      (planData.personnelList || []).forEach((role: any) => {
        for(let v=1; v<= (planData.shifts || 1); v++) {
           const count = planData.monthlyData[i]?.personeller?.[`${role.id}_v${v}`] || 0;
           opex += count * ((planData.baseNetSalary || 17002) + (role.ekMaas || 0)); // Net
           opex += count * ((planData.baseSgk || 5000) + (role.ekSgk || 0)); // SGK
           opex += count * (planData.workDays || 26) * (planData.dailyMealCost || 200); // Meal
        }
      });

      // Power calculation consistent with ExpensesStep
       const shiftHrs = Object.values(planData.shiftHours || {}).slice(0, planData.shifts).reduce((a, b) => (a as any) + (b as any), 0) as number;
       const monthlyHrs = shiftHrs * (planData.workDays || 26);
       let powerCap = 0;
       (planData.selectedMachines || []).forEach((sm: any) => { powerCap += 2.5 * monthlyHrs; });
       opex += powerCap * (planData.electricPrice || 2.5) * 0.4;

      const ebitda = revenue - (cogs + opex);
      
      // Amortization (Total Investment / 60 months)
      const totalInvestment = (planData.investments || []).reduce((acc: number, inv: any) => acc + (parseFloat(inv.maliyet) || 0), 0);
      const monthlyAmort = totalInvestment / 60;

      const netProfit = ebitda - monthlyAmort;

      return { revenue, cogs, opex, ebitda, netProfit, monthlyAmort };
    });

    const yearlySum = monthlyResults.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.revenue,
      cogs: acc.cogs + curr.cogs,
      opex: acc.opex + curr.opex,
      ebitda: acc.ebitda + curr.ebitda,
      netProfit: acc.netProfit + curr.netProfit,
      amort: acc.amort + curr.monthlyAmort
    }), { revenue: 0, cogs: 0, opex: 0, ebitda: 0, netProfit: 0, amort: 0 });

    return { monthlyResults, yearlySum };
  }, [planData]);

  const fmt = (v: number) => (v || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col gap-10 p-10 animate-in slide-in-from-bottom duration-1000">
      
      {/* Executive KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
         <div className="bg-enba-dark rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group transition-all hover:bg-black border border-white/5">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
              <div>
                <div className="text-[10px] font-black text-white/30 uppercase tracking-[4px] mb-3">Yıllık Tahmini Ciro</div>
                <div className="text-4xl font-black tracking-tighter italic text-white group-hover:text-enba-orange transition-colors">{fmt(calculations.yearlySum.revenue)} <span className="text-sm font-bold opacity-30">₺</span></div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                 <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
                    <TrendingUp size={16} />
                 </div>
                 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Pazar Liderliği Hedefi</span>
              </div>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-card relative overflow-hidden group hover:border-gray-300 transition-all">
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-3">Toplam Operasyonel Yük</div>
                <div className="text-4xl font-black tracking-tighter italic text-enba-dark">{fmt(calculations.yearlySum.opex + calculations.yearlySum.cogs)} <span className="text-sm font-bold text-gray-300">₺</span></div>
              </div>
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[2px] mt-6 leading-relaxed max-w-[200px]">
                Ham madde, Enerji, Kadro ve Lojistik kalemlerinin kümülatif toplamı.
              </p>
            </div>
         </div>

         <div className="bg-enba-orange rounded-[2.5rem] p-10 text-white shadow-xl shadow-enba-orange/20 relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 scale-150 group-hover:rotate-12 transition-transform">
               <CurrencyDollar size={200} />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
              <div>
                <div className="text-[10px] font-black text-white/50 uppercase tracking-[4px] mb-3 leading-none">FAVÖK (EBITDA)</div>
                <div className="text-4xl font-black tracking-tighter italic leading-none">{fmt(calculations.yearlySum.ebitda)} <span className="text-sm font-bold text-white/40">₺</span></div>
              </div>
              <div className="px-5 py-2 bg-white/20 rounded-2xl text-[11px] font-black self-start uppercase tracking-widest backdrop-blur-sm border border-white/10 mt-6">
                Marj: %{fmt((calculations.yearlySum.ebitda / calculations.yearlySum.revenue) * 100)}
              </div>
            </div>
         </div>

         <div className={`rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group transition-all ${calculations.yearlySum.netProfit >= 0 ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-600 shadow-rose-500/20'}`}>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
              <div>
                <div className="text-[10px] font-black text-white/50 uppercase tracking-[4px] mb-3 leading-none">Net Konsolide Kâr</div>
                <div className="text-4xl font-black tracking-tighter italic leading-none">{fmt(calculations.yearlySum.netProfit)} <span className="text-sm font-bold text-white/40">₺</span></div>
              </div>
              <div className="mt-6">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                       {calculations.yearlySum.netProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                       {calculations.yearlySum.netProfit >= 0 ? 'Karlılık Eşiği Aşıldı' : 'Finansal Revizyon Gerekli'}
                    </span>
                 </div>
              </div>
            </div>
         </div>
      </div>

      {/* Financial Matrix Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-card overflow-hidden">
          <div className="p-10 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-gray-50/40">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-enba-dark rounded-[1.5rem] flex items-center justify-center text-enba-orange shadow-2xl border border-white/10 group">
                   <ChartLineUp size={36} className="transition-transform group-hover:scale-110 group-hover:rotate-6" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-enba-dark italic uppercase tracking-tighter leading-none">Finansal P&L Matrisi</h3>
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-[4px] mt-2">İş Geliştirme ve Yatırım Geri Dönüş Raporu</p>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <button className="flex items-center gap-4 px-8 py-4 bg-gray-900 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-[3px] hover:bg-black transition-all shadow-xl group border border-white/5 active:scale-95">
                   <Table size={18} className="text-enba-orange" />
                   Excel Raporu
                </button>
             </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left border-collapse min-w-[1500px]">
                <thead>
                   <tr className="bg-gray-50/80">
                      <th className="sticky left-0 bg-gray-50/95 backdrop-blur-md p-10 border-r border-gray-200 z-10 w-72 text-[10px] font-black text-gray-400 uppercase tracking-[4px]">Hesap Kalemi</th>
                      {ayBasliklari.map((a, i) => (
                        <th key={i} className="p-6 text-right text-[10px] font-black text-enba-dark uppercase tracking-widest min-w-[140px] border-r border-gray-100/50">
                          {a.label}
                        </th>
                      ))}
                      <th className="p-10 text-right text-[11px] font-black text-enba-orange-dark uppercase tracking-[4px] min-w-[180px] border-l-4 border-enba-orange/20 bg-orange-50/40 italic">
                        Yıllık Toplam
                      </th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {/* Revenue */}
                   <tr className="bg-emerald-50/10 group hover:bg-emerald-50/30 transition-all">
                      <td className="sticky left-0 bg-white/95 backdrop-blur-sm p-8 border-r border-gray-100 z-10 group-hover:bg-emerald-50/50 transition-all">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-500/20">
                              <TrendingUp size={20} />
                           </div>
                           <span className="text-[13px] font-black text-emerald-900 leading-none uppercase italic tracking-tighter">Brüt Satış Geliri</span>
                         </div>
                      </td>
                      {calculations.monthlyResults.map((r, i) => (
                        <td key={i} className="p-6 text-right text-[12px] font-black text-emerald-700 tabular-nums">{fmt(r.revenue)} ₺</td>
                      ))}
                      <td className="p-8 text-right text-[14px] font-black text-emerald-900 border-l-4 border-enba-orange/10 bg-emerald-50/50 tabular-nums">{fmt(calculations.yearlySum.revenue)} ₺</td>
                   </tr>

                   {/* COGS & OPEX Group */}
                   <tr className="group hover:bg-gray-50/50 transition-all">
                      <td className="sticky left-0 bg-white/95 p-8 border-r border-gray-100 z-10 group-hover:bg-gray-50 transition-all">
                         <div className="flex items-center gap-4 text-gray-400">
                           <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                              <Factory size={20} />
                           </div>
                           <span className="text-[13px] font-black leading-none uppercase tracking-tighter italic">Satılan Malın Maliyeti</span>
                         </div>
                      </td>
                      {calculations.monthlyResults.map((r, i) => (
                        <td key={i} className="p-6 text-right text-[12px] font-bold text-gray-400 tabular-nums">{fmt(r.cogs)} ₺</td>
                      ))}
                      <td className="p-8 text-right text-[14px] font-bold text-gray-400 border-l-4 border-enba-orange/10 bg-gray-50/30 tabular-nums">{fmt(calculations.yearlySum.cogs)} ₺</td>
                   </tr>

                   <tr className="group hover:bg-gray-50/50 transition-all">
                      <td className="sticky left-0 bg-white/95 p-8 border-r border-gray-100 z-10 group-hover:bg-gray-50 transition-all">
                         <div className="flex items-center gap-4 text-gray-400">
                           <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                              <Calculator size={20} />
                           </div>
                           <span className="text-[13px] font-black leading-none uppercase tracking-tighter italic">Operasyonel Giderler</span>
                         </div>
                      </td>
                      {calculations.monthlyResults.map((r, i) => (
                        <td key={i} className="p-6 text-right text-[12px] font-bold text-gray-400 tabular-nums">{fmt(r.opex)} ₺</td>
                      ))}
                      <td className="p-8 text-right text-[14px] font-bold text-gray-400 border-l-4 border-enba-orange/10 bg-gray-50/30 tabular-nums">{fmt(calculations.yearlySum.opex)} ₺</td>
                   </tr>

                   {/* EBITDA Highlight */}
                   <tr className="bg-orange-50/30 group hover:bg-orange-50/50 transition-all border-y-2 border-enba-orange/5">
                      <td className="sticky left-0 bg-white/95 backdrop-blur-sm p-8 border-r border-gray-100 z-10 group-hover:bg-orange-50/50 transition-all shadow-sm">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-enba-orange text-white flex items-center justify-center shadow-lg shadow-enba-orange/20 rotate-3 group-hover:rotate-0 transition-transform">
                              <CurrencyDollar size={20} />
                           </div>
                           <span className="text-[14px] font-black text-enba-dark leading-none uppercase italic tracking-tighter">EBİTDA (FAVÖK)</span>
                         </div>
                      </td>
                      {calculations.monthlyResults.map((r, i) => (
                        <td key={i} className={`p-6 text-right text-[13px] font-black tabular-nums ${r.ebitda >= 0 ? 'text-enba-orange-dark' : 'text-rose-600'}`}>
                           {fmt(r.ebitda)} ₺
                        </td>
                      ))}
                      <td className="p-10 text-right text-[18px] font-black text-white bg-enba-orange border-l-4 border-white/20 tabular-nums shadow-inner shadow-black/10 transition-transform group-hover:scale-[1.02]">{fmt(calculations.yearlySum.ebitda)} ₺</td>
                   </tr>

                   {/* Amortismab - Italic Subdued */}
                   <tr className="group hover:bg-gray-50/30 transition-all opacity-50 hover:opacity-100">
                      <td className="sticky left-0 bg-white/95 p-8 border-r border-gray-100 z-10 italic">
                         <div className="flex items-center gap-4 text-gray-300">
                           <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[10px] font-black uppercase ring-1 ring-gray-100">Amr</div>
                           <span className="text-[12px] font-black leading-none uppercase tracking-tighter">Finansman & Amortisman</span>
                         </div>
                      </td>
                      {calculations.monthlyResults.map((r, i) => (
                        <td key={i} className="p-6 text-right text-[11px] font-bold text-gray-300 italic tabular-nums">{fmt(r.monthlyAmort)} ₺</td>
                      ))}
                      <td className="p-8 text-right text-[13px] font-bold text-gray-400 border-l-4 border-enba-orange/10 bg-gray-50/20 italic tabular-nums">{fmt(calculations.yearlySum.amort)} ₺</td>
                   </tr>

                   {/* Net Profit - Main Total Bar */}
                   <tr className="border-t-4 border-enba-dark bg-enba-dark group">
                      <td className="sticky left-0 bg-black/95 p-10 border-r border-white/5 z-10 group-hover:bg-black transition-all">
                         <div className="flex items-center gap-5">
                           <div className="w-14 h-14 rounded-[1.2rem] bg-enba-orange text-white flex items-center justify-center shadow-xl shadow-enba-orange/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                              <HardHat size={32} />
                           </div>
                           <div>
                              <div className="text-[10px] font-black text-white/30 uppercase tracking-[4px] leading-none mb-2">Simülasyon Çıktısı</div>
                              <span className="text-xl font-black text-white uppercase italic tracking-tighter">Net Kâr & Zarar</span>
                           </div>
                         </div>
                      </td>
                      {calculations.monthlyResults.map((r, i) => (
                        <td key={i} className={`p-6 text-right text-[14px] font-black tabular-nums transition-colors ${r.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} bg-black/40`}>
                           {fmt(r.netProfit)} ₺
                        </td>
                      ))}
                      <td className="p-10 text-right text-[22px] font-black bg-black text-white border-l-8 border-enba-orange tabular-nums shadow-2xl relative overflow-hidden italic group-hover:text-enba-orange transition-colors">
                        <div className="absolute inset-0 bg-enba-orange/5 translate-x-1/2 -skew-x-12"></div>
                        <span className="relative z-10">{fmt(calculations.yearlySum.netProfit)} ₺</span>
                      </td>
                   </tr>
                </tbody>
             </table>
          </div>
      </div>

      {/* Advanced Projections Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* Parameter Sliders */}
          <div className="xl:col-span-4 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-card space-y-10">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-enba-orange/10 text-enba-orange rounded-2xl flex items-center justify-center transition-transform hover:rotate-12">
                   <Percent size={28} />
                </div>
                <div>
                   <h4 className="text-xl font-black text-enba-dark italic uppercase tracking-tighter">Projeksiyon Ayarları</h4>
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-1">Efor ve Enflasyon Parametreleri</p>
                </div>
             </div>
             
             <div className="space-y-10 pt-4">
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] block mb-1">Miktar Büyümesi</label>
                        <span className="text-xs font-bold text-gray-300">Yıllık tonaj artış hedefi</span>
                     </div>
                     <span className="px-5 py-2 bg-orange-50 text-enba-orange rounded-xl font-black text-lg italic tracking-widest">% {tonageGrowth}</span>
                   </div>
                   <input 
                     type="range" min="0" max="150" step="5"
                     value={tonageGrowth}
                     onChange={e => setTonageGrowth(Number(e.target.value))}
                     className="w-full h-3 bg-gray-100 rounded-full appearance-none accent-enba-orange hover:accent-enba-orange-dark outline-none cursor-pointer transition-all"
                   />
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] block mb-1">Fiyat Artış Tahmini</label>
                        <span className="text-xs font-bold text-gray-300">Birim satış fiyatı endeksi</span>
                     </div>
                     <span className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-lg italic tracking-widest">% {priceInflation}</span>
                   </div>
                   <input 
                     type="range" min="0" max="150" step="5"
                     value={priceInflation}
                     onChange={e => setPriceInflation(Number(e.target.value))}
                     className="w-full h-3 bg-gray-100 rounded-full appearance-none accent-emerald-500 hover:accent-emerald-600 outline-none cursor-pointer transition-all"
                   />
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] block mb-1">Operasyonel Enflasyon</label>
                        <span className="text-xs font-bold text-gray-300">Enerji ve lojistik maliyet artışı</span>
                     </div>
                     <span className="px-5 py-2 bg-rose-50 text-rose-500 rounded-xl font-black text-lg italic tracking-widest">% {expenseInflation}</span>
                   </div>
                   <input 
                     type="range" min="0" max="150" step="5"
                     value={expenseInflation}
                     onChange={e => setExpenseInflation(Number(e.target.value))}
                     className="w-full h-3 bg-gray-100 rounded-full appearance-none accent-rose-500 hover:accent-rose-600 outline-none cursor-pointer transition-all"
                   />
                </div>
             </div>
          </div>

          {/* Multi-Year Table */}
          <div className="xl:col-span-8 bg-black rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
             <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-5 mb-10">
                   <div className="w-14 h-14 bg-white/5 rounded-[1.5rem] flex items-center justify-center text-enba-orange border border-white/10 shadow-inner group">
                      <TrendingUp size={32} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                   </div>
                   <div>
                      <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">5 Yıllık Makro Öngörü</h4>
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-[4px] mt-1">Yatırımın Geri Dönüşü (ROI) ve Ölçeklenebilirlik</p>
                   </div>
                </div>

                <div className="flex-1 overflow-hidden">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10">
                           <th className="py-6 text-[10px] font-black text-white/40 uppercase tracking-[4px]">Dönem / Yıl</th>
                           <th className="py-6 text-[10px] font-black text-white/40 uppercase tracking-[4px] text-right">Konsolide Gelir</th>
                           <th className="py-6 text-[10px] font-black text-white/40 uppercase tracking-[4px] text-right">EBITDA Tahmini</th>
                           <th className="py-6 text-[10px] font-black text-white/40 uppercase tracking-[4px] text-right">Nakit Pozisyonu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-black text-[13px]">
                         {[0, 1, 2, 3, 4].map(yearOffset => {
                           const year = (planData.startYear || 2024) + yearOffset;
                           const growthFactor = Math.pow(1 + (tonageGrowth / 100), yearOffset) * Math.pow(1 + (priceInflation / 100), yearOffset);
                           const expenseFactor = Math.pow(1 + (expenseInflation / 100), yearOffset);
                           
                           const estRev = calculations.yearlySum.revenue * growthFactor;
                           const estNet = estRev - ((calculations.yearlySum.opex + calculations.yearlySum.cogs) * expenseFactor) - calculations.yearlySum.amort;

                           return (
                             <tr key={year} className="group hover:bg-white/5 transition-all">
                                <td className="py-7 flex items-center gap-4 text-white/80 group-hover:text-white group-hover:translate-x-2 transition-all">
                                   <div className="w-2 h-8 rounded-full bg-enba-orange group-hover:h-12 transition-all"></div>
                                   {year} {yearOffset === 0 && <span className="ml-2 px-3 py-1 bg-enba-orange text-white text-[9px] font-black rounded-lg shadow-lg shadow-enba-orange/20 animate-pulse">REFERANS</span>}
                                </td>
                                <td className="py-7 text-right text-white/60 group-hover:text-white transition-all tabular-nums italic">{fmt(estRev)} ₺</td>
                                <td className="py-7 text-right text-enba-orange tabular-nums italic">{fmt(estRev * 0.18)} ₺</td>
                                <td className={`py-7 text-right tabular-nums italic ${estNet >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                   {fmt(estNet)} ₺
                                </td>
                             </tr>
                           );
                         })}
                      </tbody>
                   </table>
                </div>
                
                <div className="mt-10 p-8 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-between group cursor-help">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-enba-orange rounded-xl flex items-center justify-center text-white shadow-lg rotate-12 group-hover:rotate-0 transition-transform">
                         <Calculator size={20} />
                      </div>
                      <p className="text-[11px] font-medium text-white/50 leading-relaxed italic max-w-xl">
                        Projeksiyon, girilen 12 aylık baz verinin üst üste birikimli (compounded) büyüme ve enflasyon modelleriyle zenginleştirilmiş halidir. Pazar volatilitesi dikkate alınmalıdır.
                      </p>
                   </div>
                   <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white transition-all">
                      <ArrowUpRight size={18} />
                   </button>
                </div>
             </div>
          </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center bg-enba-dark p-12 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        <div className="relative z-10 flex items-center gap-8 mb-8 md:mb-0">
            <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-enba-dark shadow-xl animate-pulse">
               <FilePdf size={32} />
            </div>
            <div>
               <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Stratejik Planlama Raporu</h4>
               <p className="text-xs font-black text-white/30 uppercase tracking-[3px] mt-1">Simülasyon özeti ve PDF dökümanları hazır.</p>
            </div>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-6 relative z-10">
           <button 
             onClick={back}
             className="px-10 py-5 bg-white/5 text-white/60 border border-white/10 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[3px] hover:bg-white/10 hover:text-white transition-all active:scale-95"
           >
             Verileri Düzenle
           </button>
           <button 
             onClick={() => window.location.reload()}
             className="px-10 py-5 bg-white/5 text-white/60 border border-white/10 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[3px] hover:bg-black hover:text-white transition-all active:scale-95"
           >
             Yeni Simülasyon
           </button>
           <button 
             className="px-12 py-5 bg-enba-orange text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[4px] hover:bg-enba-orange-dark shadow-2xl shadow-enba-orange/30 transition-all active:scale-95 flex items-center gap-4 group"
           >
             İndir (PDF / XL)
             <FileDown size={22} className="group-hover:translate-y-1 transition-transform" />
           </button>
        </div>
      </div>
    </div>
  );
};

export default ReportStep;
