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
  TrendingUp,
  Building2,
  Banknote,
  Target,
  FlaskConical as Flask,
  Info
} from 'lucide-react';

interface Customer {
  id: number;
  ad: string;
}

interface CustomerStepProps {
  planData: any;
  onUpdate: (data: any) => void;
  next: () => void;
  back: () => void;
}

const CustomerStep: React.FC<CustomerStepProps> = ({ planData, onUpdate, next, back }) => {
  const { t } = useTranslation();
  const [newCustomerName, setNewCustomerName] = useState('');
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

  const addCustomer = () => {
    if (!newCustomerName.trim()) return;
    const newCust: Customer = { id: Date.now(), ad: newCustomerName.trim() };
    onUpdate({
      ...planData,
      customers: [...(planData.customers || []), newCust]
    });
    setNewCustomerName('');
  };

  const removeCustomer = (id: number) => {
    if(confirm('Müşteriyi ve bağlı satış projeksiyonunu silmek istediğinize emin misiniz?')) {
        onUpdate({
          ...planData,
          customers: planData.customers.filter((c: Customer) => c.id !== id)
        });
    }
  };

  const updateSatis = (monthIdx: number, customerId: number, field: string, value: any) => {
    const newMonthly = [...planData.monthlyData];
    if (!newMonthly[monthIdx].musteriler) newMonthly[monthIdx].musteriler = {};
    if (!newMonthly[monthIdx].musteriler[customerId]) newMonthly[monthIdx].musteriler[customerId] = {};
    
    newMonthly[monthIdx].musteriler[customerId][field] = value;
    onUpdate({ ...planData, monthlyData: newMonthly });
  };

  const updateFire = (monthIdx: number, field: string, value: any) => {
    const newMonthly = [...planData.monthlyData];
    newMonthly[monthIdx][field] = value;
    onUpdate({ ...planData, monthlyData: newMonthly });
  };

  const copyForward = (monthIdx: number, customerId: number) => {
    const currentData = planData.monthlyData[monthIdx].musteriler?.[customerId];
    if (!currentData) return;

    const newMonthly = [...planData.monthlyData];
    for (let i = monthIdx + 1; i < 12; i++) {
       if (!newMonthly[i].musteriler) newMonthly[i].musteriler = {};
       newMonthly[i].musteriler[customerId] = { ...currentData };
    }
    onUpdate({ ...planData, monthlyData: newMonthly });
  };

  const getMonthlyCostInfo = (monthIdx: number) => {
     let totalAlisTon = 0;
     const tedarikler = planData.monthlyData[monthIdx]?.tedarikler || {};
     Object.values(tedarikler).forEach((t: any) => totalAlisTon += parseFloat(t.miktar || 0));

     const fire = (planData.monthlyData[monthIdx]?.fireYuzde || 0) / 100;
     const satilabilirTon = totalAlisTon * (1 - fire);
     
     const mockCostPerTon = 12450; 
     return { totalAlisTon, satilabilirTon, mockCostPerTon };
  };

  const fmt = (v: number) => (Number(v) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 1 });

  return (
    <div className="flex flex-col gap-10 p-10 animate-in slide-in-from-right duration-700">
      
      {/* Production & Cost Summary - Industrial Dark Card */}
      <div className="bg-enba-dark rounded-[2.5rem] p-10 overflow-hidden relative border border-white/10 shadow-2xl group transition-all hover:bg-black">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-enba-orange/10 rounded-full blur-3xl -mr-48 -mt-48 transition-all group-hover:bg-enba-orange/20"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex-1 space-y-4">
             <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-enba-orange">
                <Target size={16} className="animate-pulse" />
                Üretim & Sevkiyat Projeksiyonu
             </div>
             <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-tight">
               Satış Öncesi <br/><span className="text-enba-orange">Operasyonel Analiz</span>
             </h3>
             <p className="text-sm text-white/40 font-medium max-w-lg leading-relaxed">
                Tedarik, operasyon ve kadro maliyetlerinize göre sistem tarafından öngörülen baz maliyetiniz ve satılabilir ürün tonajınız aşağıdadır. Satışlarınızı bu balans üzerinden optimize ediniz.
             </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6">
             <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] min-w-[180px] backdrop-blur-sm group-hover:border-enba-orange/20 transition-all">
                <div className="text-[10px] font-black text-white/30 uppercase tracking-[3px] mb-3">Satılabilir T</div>
                <div className="text-3xl font-black text-white italic">2.450 <span className="text-xs font-bold text-white/20 uppercase tracking-widest border-l border-white/10 pl-3 ml-3">Ton</span></div>
             </div>
             <div className="bg-enba-orange p-8 rounded-[2rem] min-w-[180px] shadow-xl shadow-enba-orange/20 hover:scale-105 transition-transform">
                <div className="text-[10px] font-black text-white/50 uppercase tracking-[3px] mb-3 leading-none truncate">Ort. Birim Maliyet</div>
                <div className="text-3xl font-black text-white italic">12.450 <span className="text-xs font-bold text-white/50 uppercase tracking-widest border-l border-white/20 pl-3 ml-3">₺</span></div>
             </div>
          </div>
        </div>
      </div>

      {/* Customer Portolio - Premium Input */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-card flex flex-col gap-6 group hover:border-blue-500/20 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm transition-transform group-hover:rotate-12">
                   <Users size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-enba-dark tracking-tighter uppercase italic">Müşteri Portföyü & Hedef Kitle</h4>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-1">Simülasyon dahilindeki ana alıcıları ekleyiniz</p>
                </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
             <div className="relative flex-1 group/input">
                <input 
                  type="text" 
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  placeholder="Portföye yeni alıcı/müşteri ekle..."
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-inner"
                  onKeyDown={e => e.key === 'Enter' && addCustomer()}
                />
                <Building2 size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/input:text-blue-400 transition-colors" />
             </div>
             <button 
               onClick={addCustomer}
               className="px-10 py-4 bg-enba-dark text-white rounded-2xl hover:bg-black shadow-xl shadow-gray-200 transition-all font-black text-xs uppercase tracking-[2px] active:scale-95"
             >
               Müşteri Ekle
             </button>
          </div>

          <div className="flex flex-wrap gap-4 mt-2">
            {(planData.customers || []).map((c: Customer) => (
              <div key={c.id} className="group flex items-center gap-4 px-6 py-4 bg-blue-50/50 text-blue-800 rounded-[1.5rem] border border-blue-100 font-black text-xs tracking-widest uppercase transition-all hover:bg-blue-100/50 animate-in zoom-in duration-300">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-blue-400 shadow-sm group-hover:scale-110 transition-transform">
                  <Building2 size={16} />
                </div>
                {c.ad}
                <button onClick={() => removeCustomer(c.id)} className="w-8 h-8 flex items-center justify-center text-blue-300 hover:text-white hover:bg-rose-500 rounded-lg transition-all ml-2">
                   <Trash2 size={14} />
                </button>
              </div>
            ))}
            {(planData.customers || []).length === 0 && <span className="text-xs text-gray-300 font-medium italic py-2">Henüz müşteri tanımlanmadı.</span>}
          </div>
      </div>

      {/* Sales Matrix - Premium Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-card overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/30">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-enba-orange border border-gray-100">
                  <TrendingUp size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-enba-dark italic uppercase tracking-tighter leading-none">Satış & Tahsilat Matrisi</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-1">12 Aylık Hedef Satış ve Birim Fiyat Öngörüsü</p>
               </div>
             </div>
             <button 
               onClick={() => setBulkOpen(!bulkOpen)}
               className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${bulkOpen ? 'bg-enba-dark text-white' : 'bg-gray-100 text-gray-400'}`}
             >
              {bulkOpen ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
             </button>
          </div>

          <div className={`overflow-x-auto custom-scrollbar transition-all duration-700 ${bulkOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
             <table className="w-full text-left border-collapse min-w-[1400px]">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                     <th className="sticky left-0 bg-gray-50/90 backdrop-blur-md p-8 border-r border-gray-100 z-10 w-52 text-[10px] font-black text-gray-400 uppercase tracking-[3px] text-center">Hedef Alıcı</th>
                     <th className="sticky left-52 bg-gray-50/90 backdrop-blur-md p-8 border-r border-gray-100 z-10 w-32 text-[10px] font-black text-gray-400 uppercase tracking-[3px] text-center">Girdi Tipi</th>
                     {ayBasliklari.map((a, i) => (
                       <th key={i} className="p-6 text-center text-[10px] font-black text-enba-dark uppercase tracking-widest min-w-[130px] border-r border-gray-50">
                         {a.label}
                       </th>
                     ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[11px]">
                  {(planData.customers || []).map((c: Customer) => (
                    <React.Fragment key={c.id}>
                      {/* Miktar Row */}
                      <tr className="group hover:bg-blue-50/20 transition-all">
                         <td rowSpan={2} className="sticky left-0 bg-white/90 backdrop-blur-md p-6 border-r border-gray-100 z-10 font-black text-enba-dark text-sm uppercase italic tracking-tighter group-hover:bg-blue-50/50">
                           <div className="flex items-center gap-4">
                             <div className="w-2 h-12 rounded-full bg-blue-500 opacity-20 group-hover:opacity-100 transition-all"></div>
                             {c.ad}
                           </div>
                         </td>
                         <td className="sticky left-52 bg-white/90 backdrop-blur-md p-4 border-r border-gray-100 z-10 text-[9px] font-black text-gray-400 uppercase text-center group-hover:bg-blue-50/50">Satış Miktarı (T)</td>
                         {Array.from({ length: 12 }).map((_, i) => (
                           <td key={i} className="p-4 border-r border-gray-50">
                             <input 
                               type="number" 
                               value={planData.monthlyData[i].musteriler?.[c.id]?.miktar || ''}
                               onChange={e => updateSatis(i, c.id, 'miktar', e.target.value)}
                               className="w-full text-center py-3.5 bg-gray-50 border-none rounded-2xl text-[11px] font-black text-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:shadow-xl outline-none transition-all shadow-inner"
                               placeholder="0"
                             />
                           </td>
                         ))}
                      </tr>
                      {/* Fiyat Row */}
                      <tr className="group hover:bg-orange-50/20 transition-all border-b-2 border-gray-100">
                         <td className="sticky left-52 bg-white/90 backdrop-blur-md p-4 border-r border-gray-100 z-10 text-[9px] font-black text-gray-400 uppercase text-center group-hover:bg-orange-50/50">Birim Fiyat (₺)</td>
                         {Array.from({ length: 12 }).map((_, i) => (
                           <td key={i} className="p-4 relative group/cell border-r border-gray-50">
                             <input 
                               type="number" 
                               value={planData.monthlyData[i].musteriler?.[c.id]?.fiyat || ''}
                               onChange={e => updateSatis(i, c.id, 'fiyat', e.target.value)}
                               className="w-full text-center py-3.5 bg-orange-50/40 border-none rounded-2xl text-[11px] font-black text-orange-950 focus:bg-white focus:ring-2 focus:ring-orange-200 focus:shadow-xl outline-none transition-all shadow-inner"
                               placeholder="0.00"
                             />
                             <button 
                               onClick={() => copyForward(i, c.id)}
                               className="absolute right-0 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover/cell:opacity-100 bg-enba-dark text-white rounded-xl transition-all hover:scale-110 z-20 shadow-lg mr-1 group-hover/cell:-translate-x-2"
                             >
                               <Copy size={16} />
                             </button>
                           </td>
                         ))}
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
             </table>
          </div>
      </div>

      {/* Monthly Efficiency - Premium List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
           <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[4px]">Aylık Verimlilik & Fire Kontrolü</h4>
           <div className="flex gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-enba-orange"></div>
                 <span className="text-[9px] font-black text-gray-400 uppercase">Proses Firesi</span>
              </div>
           </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
            {ayBasliklari.map((a, i) => {
              const isOpen = expandedMonths[i];
              const { totalAlisTon, satilabilirTon, mockCostPerTon } = getMonthlyCostInfo(i);
              const fireSetting = planData.monthlyData[i].fireYuzde || 0;
              
              let totalSatisTon = 0;
              Object.values(planData.monthlyData[i].musteriler || {}).forEach((s: any) => totalSatisTon += parseFloat(s.miktar || 0));

              const isOverSold = totalSatisTon > satilabilirTon;

              return (
                <div key={i} className={`bg-white border rounded-[2.5rem] shadow-card overflow-hidden transition-all duration-500 ${isOpen ? 'border-enba-orange/20 ring-4 ring-enba-orange/5' : 'border-gray-100'}`}>
                    <button 
                      onClick={() => setExpandedMonths({...expandedMonths, [i]: !isOpen})}
                      className={`w-full flex items-center justify-between p-8 text-left transition-all ${isOpen ? 'bg-orange-50/30' : 'hover:bg-gray-50/50'}`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${isOpen ? 'bg-enba-orange text-white rotate-90 shadow-enba-orange/20' : 'bg-gray-100 text-gray-400'}`}>
                           {isOpen ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                        </div>
                        <div>
                          <span className="text-base font-black text-enba-dark uppercase tracking-tight italic">{a.label}</span>
                          <div className="flex gap-6 mt-1.5">
                             <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Girdi: {fmt(totalAlisTon)} T</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${isOverSold ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isOverSold ? 'text-rose-500' : 'text-emerald-500'}`}>Satış: {fmt(totalSatisTon)} T</span>
                             </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-10">
                         <div className="hidden lg:flex flex-col items-end">
                            <span className="text-[9px] font-black text-gray-300 uppercase mb-1 tracking-[3px] leading-none">Birim Maliyet</span>
                            <span className="text-base font-black text-gray-500 italic leading-none">{fmt(mockCostPerTon)} ₺</span>
                         </div>
                         <div className="flex flex-col items-end min-w-[100px]">
                            <span className="text-[9px] font-black text-gray-300 uppercase mb-1 tracking-[3px] leading-none">Öngörülen Fire</span>
                            <span className={`text-base font-black italic leading-none ${fireSetting > 0 ? 'text-enba-orange' : 'text-gray-300'}`}>% {fireSetting}</span>
                         </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-10 border-t border-gray-100 bg-gray-50/20 animate-in slide-in-from-top-6 duration-700">
                         <div className="flex flex-col lg:flex-row gap-8">
                            <div className="flex-1 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-card flex items-center gap-6 group">
                               <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-enba-orange shadow-inner group-hover:scale-110 transition-transform">
                                  <Flask size={32} />
                               </div>
                               <div className="flex-1 space-y-4">
                                  <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] block">Aylık Proses Firesi (%)</label>
                                      <span className="px-4 py-1.5 bg-enba-orange text-white rounded-xl font-black text-xs italic tracking-widest shadow-lg shadow-enba-orange/10">% {fireSetting}</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="0" max="35" step="0.5"
                                    value={fireSetting}
                                    onChange={e => updateFire(i, 'fireYuzde', e.target.value)}
                                    className="w-full h-2.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-enba-orange hover:accent-enba-orange-dark focus:outline-none transition-all"
                                  />
                               </div>
                            </div>
                            <div className="flex-1 bg-enba-dark p-8 rounded-[2rem] border border-white/5 shadow-2xl flex items-start gap-6 relative overflow-hidden group">
                               <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all"></div>
                               <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 group-hover:rotate-12 transition-transform">
                                  <Info size={32} />
                               </div>
                               <div className="relative z-10 flex flex-col gap-2">
                                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[3px] leading-none mb-1">Dinamik Çıktı Analizi</span>
                                  <p className="text-[12px] font-medium text-white/60 leading-relaxed italic">
                                    Sahanıza giren <b>{fmt(totalAlisTon)} T</b> ham maddeden <b>%{fireSetting}</b> fire düşüldüğünde; sevkiyata hazır net ürününüz <b>{fmt(satilabilirTon)} T</b> olarak simüle edilmiştir. 
                                  </p>
                                  {isOverSold && (
                                    <div className="flex items-center gap-2 mt-2 px-4 py-2 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                       <Banknote size={14} />
                                       Kritik: Kapasite Aşımı var!
                                    </div>
                                  )}
                               </div>
                            </div>
                         </div>
                      </div>
                    )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Results Controls - Premium Actions */}
      <div className="mt-4 flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-enba-orange/5 translate-x-1/2 -skew-x-12 group-hover:bg-enba-orange/10 transition-all"></div>
          <div className="flex flex-col gap-1 relative z-10">
             <h4 className="text-xl font-black text-enba-dark italic uppercase tracking-tighter">İş Planı Tamamlanmaya Hazır</h4>
             <p className="text-xs font-medium text-gray-400">Tüm verileriniz analiz edilerek simülasyon raporu oluşturulacaktır.</p>
          </div>
          <div className="flex items-center gap-6 relative z-10 mt-6 md:mt-0">
              <button 
                onClick={back}
                className="px-10 py-5 bg-gray-50 text-gray-400 rounded-[1.5rem] font-black text-xs uppercase tracking-[2px] hover:bg-gray-100 hover:text-enba-dark transition-all active:scale-95"
              >
                Geri Git
              </button>
              <button 
                onClick={next}
                className="px-12 py-5 bg-enba-orange text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[3px] hover:bg-enba-orange-dark shadow-2xl shadow-enba-orange/20 transition-all active:scale-95 flex items-center gap-3"
              >
                Raporu Görüntüle
                <ChevronRight size={20} />
              </button>
          </div>
      </div>
    </div>
  );
};

export default CustomerStep;
