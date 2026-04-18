import React, { useState, useEffect, useMemo } from 'react';
import { DataService } from '../api/dataService';
import { fmt } from '../utils/formatters';
import { Banknote, Landmark, Flag, Zap, TrendingUp, Info } from 'lucide-react';

/**
 * Enba Similasyon - Nakit Akışı & Finansal Planlama (TypeScript + Tailwind)
 */

interface Loan {
  id: string;
  ad: string;
  anapara: number;
  faizYillik: number;
  vadeAy: number;
  baslangicAy: number;
  tur: 'esit_taksit' | 'sabit_anapara';
}

interface CashflowParams {
  baslangicKasasi: number;
  tahsilatVadesi: number;
  tedarikciVadesi: number;
  satisNakliyeVadesi: number;
  vergiorani: number;
  vergiPeriyodu: 'aylik' | 'ceyreklik' | 'yillik';
  krediler: Loan[];
}

export const Cashflow: React.FC<{ aktifPlanlar?: any[] }> = ({ aktifPlanlar = [] }) => {
  const [seciliPlanId, setSeciliPlanId] = useState('');
  const [params, setParams] = useState<CashflowParams>({
    baslangicKasasi: 0,
    tahsilatVadesi: 30,
    tedarikciVadesi: 30,
    satisNakliyeVadesi: 30,
    vergiorani: 25,
    vergiPeriyodu: 'ceyreklik',
    krediler: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'parameters' | 'monthly' | 'projection'>('monthly');

  useEffect(() => {
    if (aktifPlanlar.length > 0 && !seciliPlanId) {
      setSeciliPlanId(aktifPlanlar[0].id);
    }
  }, [aktifPlanlar]);

  const loadData = async () => {
    if (!seciliPlanId) return;
    setLoading(true);
    try {
      // In a real scenario, we fetch params from DB
      // const p = await DataService.fetchCashflowParams(seciliPlanId);
      // setParams(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [seciliPlanId]);

  const nakitVerileri = useMemo(() => {
    const labels = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    let currentBalance = params.baslangicKasasi;
    
    // Find selected plan data
    const plan = aktifPlanlar.find(p => p.id === seciliPlanId) || (aktifPlanlar.length > 0 ? aktifPlanlar[0] : null);
    
    return labels.map((label, i) => {
      let inflow = 0;
      let outflow = 0;

      if (plan && plan.monthlyData && plan.monthlyData[i]) {
        // 1. INFLOW (Collections)
        // Apply Vade Logic (Simplistic: if vade > 15 shift % of income)
        const currentSales = Object.values(plan.monthlyData[i].musteriler || {}).reduce((sum: number, s: any) => sum + (parseFloat(s.miktar || 0) * parseFloat(s.fiyat || 0)), 0);
        const prevSales = i > 0 ? Object.values(plan.monthlyData[i-1].musteriler || {}).reduce((sum: number, s: any) => sum + (parseFloat(s.miktar || 0) * parseFloat(s.fiyat || 0)), 0) : 0;
        
        const shiftRate = Math.min(params.tahsilatVadesi / 30, 1);
        inflow = currentSales * (1 - shiftRate) + prevSales * shiftRate;

        // 2. OUTFLOW (Payments)
        const currentSupply = Object.values(plan.monthlyData[i].tedarikler || {}).reduce((sum: number, t: any) => sum + (parseFloat(t.miktar || 0) * parseFloat(t.fiyat || 0)), 0);
        const prevSupply = i > 0 ? Object.values(plan.monthlyData[i-1].tedarikler || {}).reduce((sum: number, t: any) => sum + (parseFloat(t.miktar || 0) * parseFloat(t.fiyat || 0)), 0) : 0;
        
        const payShiftRate = Math.min(params.tedarikciVadesi / 30, 1);
        const supplyOut = currentSupply * (1 - payShiftRate) + prevSupply * payShiftRate;

        // Fixed & Personel OPEX (Usually paid in current month)
        let opexOut = Object.values(plan.monthlyData[i].giderler || {}).reduce((sum: number, g: any) => sum + (parseFloat(g as any) || 0), 0);
        
        // Personnel from plan
        if (plan.personnelList) {
          plan.personnelList.forEach((role: any) => {
            for(let v=1; v<=(plan.shifts || 1); v++) {
              const count = plan.monthlyData[i]?.personeller?.[`${role.id}_v${v}`] || 0;
              opexOut += count * ((plan.baseNetSalary || 17002) + (role.ekMaas || 0) + (plan.baseSgk || 5000));
            }
          });
        }

        outflow = supplyOut + opexOut;
      } else {
        // Mock fallback if no plan selected
        inflow = 0;
        outflow = 0;
      }

      const net = inflow - outflow;
      currentBalance += net;
      
      return {
        label,
        inflow,
        outflow,
        net,
        balance: currentBalance
      };
    });
  }, [params, aktifPlanlar, seciliPlanId]);

  return (
    <div className="flex flex-col gap-8 p-4 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end bg-white p-8 rounded-[2.5rem] shadow-card border border-gray-100 overflow-hidden relative">
        <div className="flex flex-col gap-2 relative z-10">
          <h2 className="text-3xl font-black text-enba-dark flex items-center gap-3 tracking-tighter">
            <Banknote className="text-enba-orange fill-enba-orange" size={32} /> Nakit Akışı & Likidite Planı
          </h2>
          <p className="text-gray-500 font-medium text-sm">İş planınızı nakit akışına dönüştürün, kasa açıklarını önceden tespit edin.</p>
        </div>

        <div className="flex items-center gap-4 relative z-10">
           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aktif Senaryo:</label>
           <select 
             value={seciliPlanId} 
             onChange={e => setSeciliPlanId(e.target.value)}
             className="bg-gray-50 border border-transparent rounded-2xl px-5 py-3 text-sm font-bold text-enba-dark focus:bg-white focus:border-enba-orange/30 outline-none w-64 transition-all"
           >
             {aktifPlanlar.map(p => <option key={p.id} value={p.id}>{p.baslik}</option>)}
             {aktifPlanlar.length === 0 && <option>Aktif Plan Bulunamadı</option>}
           </select>
        </div>
        
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-enba-orange/5 rounded-full -mr-32 -mt-32 blur-3xl text-enba-orange/10 pointer-events-none"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Başlangıç Kasası', value: params.baslangicKasasi, color: 'text-blue-500', icon: Landmark },
          { label: 'Yıl Sonu Tahmini', value: nakitVerileri[11].balance, color: 'text-green-500', icon: Flag },
          { label: 'Min. Kasa Seviyesi', value: Math.min(...nakitVerileri.map(v => v.balance)), color: 'text-enba-orange', icon: Zap },
          { label: 'Toplam Nakit Girişi', value: nakitVerileri.reduce((s,v)=>s+v.inflow,0), color: 'text-indigo-500', icon: TrendingUp }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-card border border-gray-100 flex flex-col gap-3 relative overflow-hidden group hover:-translate-y-1 transition-all">
             <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${stat.color} text-xl group-hover:bg-enba-dark group-hover:text-white transition-all`}>
                <stat.icon size={20} />
             </div>
             <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
                <div className={`text-xl font-black ${stat.color} tracking-tight mt-1`}>{fmt(stat.value)} ₺</div>
             </div>
             <div className="absolute top-0 right-0 w-16 h-1 w-full bg-enba-orange/10"></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-2xl self-start">
        {(['parameters', 'monthly', 'projection'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all 
              ${activeTab === tab ? 'bg-white text-enba-dark shadow-sm' : 'text-gray-500 hover:text-enba-dark'}`}
          >
            {tab === 'parameters' && 'Parametreler'}
            {tab === 'monthly' && 'Aylık Nakit Akışı'}
            {tab === 'projection' && '5 Yıl Projeksiyonu'}
          </button>
        ))}
      </div>

      {/* Main Analysis Area */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-gray-100">
         {activeTab === 'monthly' && (
           <div className="flex flex-col gap-10">
              {/* Chart Container */}
              <div className="h-64 flex items-end gap-2 px-4 border-b border-dashed border-gray-100 pb-2">
                 {nakitVerileri.map((data, i) => {
                    const maxVal = Math.max(...nakitVerileri.map(v => v.balance));
                    const heightPercent = (data.balance / maxVal) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                         <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-enba-dark text-white text-[10px] font-black px-2 py-1 rounded-lg z-10">
                           {fmt(data.balance)} ₺
                         </div>
                         <div 
                           className={`w-full rounded-t-xl transition-all duration-700 hover:brightness-90 ${data.balance >= 0 ? 'bg-green-400' : 'bg-red-400'}`}
                           style={{ height: `${Math.max(5, heightPercent)}%` }}
                         ></div>
                         <span className="text-[10px] font-black text-gray-400 uppercase">{data.label}</span>
                      </div>
                    );
                 })}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                       <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest ">
                          <th className="px-6 py-2">Dönem</th>
                          <th className="px-6 py-2">Nakit Girişi</th>
                          <th className="px-6 py-2">Nakit Çıkışı</th>
                          <th className="px-6 py-2 text-right">Net Değişim</th>
                          <th className="px-6 py-2 text-right">Kasa Sonu</th>
                       </tr>
                    </thead>
                    <tbody>
                       {nakitVerileri.map((d, i) => (
                         <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                            <td className="px-6 py-5 rounded-l-2xl text-sm font-black text-enba-dark">{d.label} 2024</td>
                            <td className="px-6 py-5 text-sm font-bold text-green-600">+{fmt(d.inflow)} ₺</td>
                            <td className="px-6 py-5 text-sm font-bold text-red-400">-{fmt(d.outflow)} ₺</td>
                            <td className="px-6 py-5 text-right font-black text-enba-dark">
                               <span className={d.net >= 0 ? 'text-green-600' : 'text-red-500'}>
                                  {d.net >= 0 ? '+' : ''}{fmt(d.net)}
                               </span>
                            </td>
                            <td className="px-6 py-5 text-right rounded-r-2xl font-black text-lg text-enba-dark tracking-tighter">
                               {fmt(d.balance)} ₺
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
         )}

         {activeTab === 'parameters' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 p-4">
              <div className="space-y-8">
                 <h4 className="text-xs font-black text-enba-orange uppercase tracking-[3px]">Temel Faktörler</h4>
                 <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Başlangıç Kasası (₺)</label>
                       <input 
                         type="number" 
                         value={params.baslangicKasasi}
                         onChange={e => setParams({...params, baslangicKasasi: Number(e.target.value)})}
                         className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 text-sm font-black text-enba-dark focus:bg-white focus:border-enba-orange/30 outline-none transition-all"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Müşteri Vadesi (Gün)</label>
                          <input type="number" defaultValue={30} className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 text-sm font-black text-enba-dark outline-none" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tedarikçi Vadesi (Gün)</label>
                          <input type="number" defaultValue={30} className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 text-sm font-black text-enba-dark outline-none" />
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100">
                 <h4 className="text-xs font-black text-enba-dark uppercase tracking-[3px] mb-6 flex items-center gap-2">
                    <Info className="text-enba-orange" size={20} /> Planlama Notu
                 </h4>
                 <p className="text-sm font-medium text-gray-500 leading-relaxed italic">
                    "Nakit akışı verileri, tahsilat vadelerine göre otomatik olarak dağıtılır. Örneğin 45 günlük bir vade tanımladığınızda, sistem o ayki satışın %50'sini içinde bulunulan aya, kalan %50'sini bir sonraki aya tahsilat olarak yazdırmaktadır."
                 </p>
                 <div className="mt-8 pt-8 border-t border-gray-200">
                    <button className="w-full bg-enba-dark text-white rounded-2xl py-4 font-black text-xs uppercase tracking-[2px] transition-all hover:bg-black">
                       Tüm Parametreleri Güncelle
                    </button>
                 </div>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};
