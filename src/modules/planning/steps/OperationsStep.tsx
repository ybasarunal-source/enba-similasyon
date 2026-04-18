import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../api/i18n';
import {
  Clock,
  Zap,
  Package,
  Plus,
  Trash2,
  Settings,
  Info,
  AlertCircle,
  CheckCircle,
  Target,
  ChevronRight
} from 'lucide-react';

const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

interface SelectedMachine {
  id: number;
  makinaId: string;
  verimlilik: number;
  katsayi: number;
}

interface OperationsStepProps {
  planData: any;
  onUpdate: (data: any) => void;
  next: () => void;
  back: () => void;
}

const OperationsStep: React.FC<OperationsStepProps> = ({ planData, onUpdate, next, back }) => {
  const { t } = useTranslation();
  
  const [globalMachines] = useState([
    { id: '1', adi: 'Kırma Hattı - L1', kapasite: 2.5, motorGucu: 110, tur: 'makina' },
    { id: '2', adi: 'Yıkama Tankı - T1', kapasite: 3.0, motorGucu: 45, tur: 'makina' },
    { id: '3', adi: 'Granül Makinası - G1', kapasite: 1.2, motorGucu: 160, tur: 'makina' },
    { id: '4', adi: 'Optik Ayırıcı - S1', kapasite: 5.0, motorGucu: 12, tur: 'makina' },
  ]);

  const [selectedMachineId, setSelectedMachineId] = useState('');

  const addMachine = () => {
    if (!selectedMachineId) return;
    const newEntry: SelectedMachine = {
      id: Date.now(),
      makinaId: selectedMachineId,
      verimlilik: 85,
      katsayi: 0.8
    };
    onUpdate({
      ...planData,
      selectedMachines: [...(planData.selectedMachines || []), newEntry]
    });
    setSelectedMachineId('');
  };

  const removeMachine = (id: number) => {
    onUpdate({
      ...planData,
      selectedMachines: planData.selectedMachines.filter((m: SelectedMachine) => m.id !== id)
    });
  };

  const updateMachineParam = (id: number, field: string, value: number) => {
    onUpdate({
      ...planData,
      selectedMachines: planData.selectedMachines.map((m: SelectedMachine) => 
        m.id === id ? { ...m, [field]: value } : m
      )
    });
  };

  const calculateTotalCapacity = () => {
    const dailyHours = Object.values(planData.shiftHours || {}).slice(0, planData.shifts).reduce((a, b) => (a as number) + (b as number), 0) as number;
    const monthlyHours = dailyHours * (planData.workDays || 26);
    
    let totalCap = 0;
    (planData.selectedMachines || []).forEach((sm: SelectedMachine) => {
      const gm = globalMachines.find(m => m.id === sm.makinaId);
      if (gm) {
        totalCap += gm.kapasite * (sm.verimlilik / 100) * monthlyHours;
      }
    });
    return totalCap;
  };

  const fmt = (n: number) => (n || 0).toLocaleString('tr-TR', { maximumFractionDigits: 1 });

  return (
    <div className="flex flex-col gap-10 p-10 animate-in slide-in-from-right duration-700">
      
      {/* Process Flow Visualization - Premium Addition */}
      <div className="bg-enba-dark rounded-[2.5rem] p-10 overflow-hidden relative border border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="relative z-10">
          <div className="flex flex-col gap-1 mb-8">
             <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Operasyonel İş Akış Şeması</h3>
             <p className="text-[10px] text-white/40 font-black uppercase tracking-[3px]">Seçili Makina Parkuru ve İşleme Hattı Vizyonu</p>
          </div>
          
          <div className="flex items-center justify-between gap-4 mt-4">
             {/* Feed Stock */}
             <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-enba-orange shadow-lg">
                   <Package size={28} />
                </div>
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Girdi</span>
             </div>

             <div className="h-0.5 flex-1 bg-gradient-to-r from-enba-orange/50 to-enba-orange relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-enba-orange animate-ping"></div>
             </div>

             {/* Dynamic Machine Slots */}
             {(planData.selectedMachines || []).slice(0, 3).map((sm: any, idx: number) => {
                 const gm = globalMachines.find(m => m.id === sm.makinaId);
                 return (
                    <React.Fragment key={sm.id}>
                        <div className="flex flex-col items-center gap-3 group">
                            <div className="w-20 h-20 rounded-3xl bg-enba-orange/20 border border-enba-orange/30 flex items-center justify-center text-enba-orange shadow-2xl transition-transform group-hover:scale-110 duration-500">
                                <Settings size={32} />
                            </div>
                            <span className="text-[10px] font-black text-white uppercase tracking-tighter whitespace-nowrap overflow-hidden max-w-[80px] text-ellipsis">{gm?.adi}</span>
                        </div>
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-enba-orange to-enba-orange/50"></div>
                    </React.Fragment>
                 )
             })}

             {/* Output */}
             <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                   <Zap size={28} />
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Çıktı</span>
             </div>
          </div>
        </div>
      </div>

      {/* Configuration Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-card flex flex-col gap-6 group hover:border-blue-500/20 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm transition-transform group-hover:rotate-12">
               <Clock size={24} />
            </div>
            <div>
               <h4 className="text-sm font-black text-enba-dark tracking-[3px] uppercase">Çalışma Düzeni</h4>
               <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Vardiya & Mesai Ayarları</p>
            </div>
          </div>
          <div className="space-y-6 pt-2">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Vardiya Sayısı</label>
              <select 
                value={planData.shifts}
                onChange={e => onUpdate({...planData, shifts: Number(e.target.value)})}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value={1}>1 Vardiya (Standart)</option>
                <option value={2}>2 Vardiya (Yoğun)</option>
                <option value={3}>3 Vardiya (24 Saat Kesintisiz)</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({length: planData.shifts}).map((_, i) => (
                <div key={i}>
                  <label className="text-[9px] font-black text-gray-400 block mb-1.5 ml-1">{i+1}. V <span className="text-blue-500">(S)</span></label>
                  <input 
                    type="number" 
                    value={planData.shiftHours?.[i+1] || 8}
                    onChange={e => onUpdate({...planData, shiftHours: {...planData.shiftHours, [i+1]: Number(e.target.value)}})}
                    className="w-full bg-gray-50 border-none rounded-xl px-2 py-3 text-xs font-black text-center text-enba-dark focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-card flex flex-col gap-6 group hover:border-amber-500/20 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm transition-transform group-hover:rotate-12">
               <Zap size={24} />
            </div>
            <div>
               <h4 className="text-sm font-black text-enba-dark tracking-[3px] uppercase">Enerji & Takvim</h4>
               <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Aylık Aktif Gün & Birim Fiyat</p>
            </div>
          </div>
          <div className="space-y-6 pt-2">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Aylık Çalışma Günü</label>
              <input 
                type="number" 
                value={planData.workDays}
                onChange={e => onUpdate({...planData, workDays: Number(e.target.value)})}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-amber-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Elek. Birim Fiyat <span className="text-amber-500">(₺/kWh)</span></label>
              <input 
                type="number" 
                step="0.1"
                value={planData.electricPrice}
                onChange={e => onUpdate({...planData, electricPrice: Number(e.target.value)})}
                className="w-full bg-orange-50/50 border-none rounded-2xl px-5 py-4 text-sm font-black text-enba-orange focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-card flex flex-col gap-6 group hover:border-emerald-500/20 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm transition-transform group-hover:rotate-12">
               <Package size={24} />
            </div>
            <div>
               <h4 className="text-sm font-black text-enba-dark tracking-[3px] uppercase">Sarf Malzeme</h4>
               <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Big-Bag & Paketleme Gideri</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="col-span-2 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                <Info size={16} className="text-emerald-500 shrink-0" />
                <p className="text-[10px] font-bold text-emerald-800 leading-snug italic">Ambalaj giderleri tedarik tonajına göre otomatik reel hesaplanır.</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Big-Bag Kapasite (T)</label>
              <input 
                type="number" 
                step="0.01"
                value={planData.packaging?.capacity || 1.15}
                onChange={e => onUpdate({...planData, packaging: {...planData.packaging, capacity: Number(e.target.value)}})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-black text-enba-dark focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Birim Fiyat (₺)</label>
              <input 
                type="number" 
                step="0.1"
                value={planData.packaging?.price || 185}
                onChange={e => onUpdate({...planData, packaging: {...planData.packaging, price: Number(e.target.value)}})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-black text-enba-dark focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Machinery Management - Matrix Style */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-card overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/30">
          <div>
            <h3 className="text-xl font-black text-enba-dark uppercase italic tracking-tighter flex items-center gap-3">
              <Settings size={28} className="text-enba-orange" />
              Aktif Makina Parkuru Yönetimi
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-1">Operasyonda çalışacak makinaları seçiniz ve verimliliklerini belirleyiniz.</p>
          </div>
          
          <div className="flex gap-3">
            <select 
              value={selectedMachineId}
              onChange={e => setSelectedMachineId(e.target.value)}
              className="bg-white border-none rounded-2xl px-6 py-4 text-sm font-black text-enba-dark shadow-sm focus:ring-2 focus:ring-enba-orange/20 outline-none w-72 appearance-none cursor-pointer"
            >
              <option value="">⚙️ KATALOGDAN MAKİNA SEÇ...</option>
              {globalMachines.map(m => (
                <option key={m.id} value={m.id}>{m.adi} ({m.kapasite} T/sa)</option>
              ))}
            </select>
            <button 
              onClick={addMachine}
              className="px-8 py-4 bg-enba-dark text-white rounded-2xl hover:bg-black transition-all flex items-center gap-2 font-black text-xs uppercase tracking-[2px] shadow-lg active:scale-95"
            >
              <Plus size={20} />
              MAKİNA EKLE
            </button>
          </div>
        </div>

        <div className="p-10">
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {(planData.selectedMachines || []).length > 0 ? (planData.selectedMachines || []).map((sm: SelectedMachine) => {
                const gm = globalMachines.find(m => m.id === sm.makinaId);
                return (
                  <div key={sm.id} className="p-8 bg-gray-50/50 border border-gray-100 rounded-[2rem] flex flex-col gap-6 relative group transition-all hover:bg-white hover:shadow-xl hover:border-enba-orange/20 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-enba-orange/5 rounded-full -mr-12 -mt-12 group-hover:bg-enba-orange/10 transition-all"></div>
                    
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-enba-orange shadow-card border border-gray-50 group-hover:scale-110 transition-transform">
                        <Settings size={28} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="font-black text-enba-dark text-base tracking-tight">{gm?.adi || 'Bilinmeyen Makina'}</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                          {gm?.kapasite} T/saAT • {gm?.motorGucu} KW
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-6 border-t border-gray-100 relative z-10">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Verimlilik %</label>
                        <div className="flex items-center gap-3">
                           <input 
                              type="number" 
                              value={sm.verimlilik}
                              onChange={e => updateMachineParam(sm.id, 'verimlilik', Number(e.target.value))}
                              className="w-20 bg-white border-none rounded-xl px-3 py-2 text-sm font-black text-enba-dark shadow-sm focus:ring-2 focus:ring-enba-orange/20 outline-none"
                           />
                           <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-enba-orange" style={{ width: `${sm.verimlilik}%` }}></div>
                           </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeMachine(sm.id)}
                        className="w-12 h-12 flex items-center justify-center text-gray-300 hover:text-white hover:bg-rose-500 rounded-2xl transition-all shadow-sm hover:shadow-rose-200 mt-auto"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 opacity-20 grayscale">
                  <Settings size={64} className="animate-spin-slow" />
                  <span className="text-sm font-black uppercase tracking-widest">Plana Dahil Ettiğiniz Makinalar Burada Görünecektir</span>
                </div>
              )}
           </div>
        </div>

        <div className="p-8 bg-enba-orange/5 border-t border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-enba-orange text-white flex items-center justify-center shadow-lg">
             <Zap size={20} />
          </div>
          <p className="text-[11px] font-black text-enba-orange uppercase tracking-widest leading-relaxed">
             <b>Enerji Analizi (Kod 405):</b> Elektrik giderleri, kurulu güç kapasitesi ve o ayki üretim yoğunluğunuza (Usage Factor) göre anlık hesaplanmaktadır.
          </p>
        </div>
      </div>

      {/* Capacity Analytics - Premium Table */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
           <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[4px]">Kapasite Kullanım Projeksiyonu</h4>
           <div className="flex gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-[9px] font-black text-gray-400 uppercase">Yeterli</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                 <span className="text-[9px] font-black text-gray-400 uppercase">Kapasite Aşımı</span>
              </div>
           </div>
        </div>
        <div className="overflow-hidden border border-gray-100 rounded-[2.5rem] shadow-card bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Dönem / Ay</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[3px] text-right">Kurulu Kapasite</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[3px] text-right">İşleme Hedefi</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[3px] text-center">Verimlilik Durumu</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({length: 12}).map((_, i) => {
                const ayIdx = (planData.startMonth + i) % 12;
                const totalCap = calculateTotalCapacity();
                
                let targetTon = 0;
                const tedarikler = planData.monthlyData[i]?.tedarikler || {};
                Object.values(tedarikler).forEach((t: any) => {
                  targetTon += parseFloat(t.miktar || 0);
                });

                const diff = totalCap - targetTon;
                const isOver = diff < 0;

                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-all group">
                    <td className="px-10 py-6 text-sm font-black text-enba-dark uppercase tracking-tight italic">
                      {AYLAR[ayIdx]}
                    </td>
                    <td className="px-10 py-6 text-right">
                       <span className="text-sm font-black text-enba-dark">{fmt(totalCap)} T</span>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <span className="text-sm font-bold text-gray-500 group-hover:text-enba-orange transition-colors">{fmt(targetTon)} T</span>
                    </td>
                    <td className="px-10 py-6 text-center">
                       <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                         isOver ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                       }`}>
                         {isOver ? <AlertCircle size={14} className="animate-pulse" /> : <CheckCircle size={14} />}
                         {isOver ? `${fmt(Math.abs(diff))} T Eksik` : `${fmt(diff)} T Serbest`}
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-card">
        <button 
          onClick={back}
          className="px-10 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-[2px] hover:bg-gray-200 hover:text-enba-dark transition-all active:scale-95"
        >
          ← Tedarik Planı
        </button>
        <button 
          onClick={next}
          className="px-12 py-4 bg-enba-dark text-white rounded-2xl font-black text-xs uppercase tracking-[2px] hover:bg-black shadow-xl shadow-gray-200 transition-all active:scale-95 flex items-center gap-3"
        >
          Personel & Organizasyon
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default OperationsStep;
