import React, { useState } from 'react';
import { useTranslation } from '../../../api/i18n';
import { Plus, Trash2, Settings, Building2, HelpCircle, Info } from 'lucide-react';

interface Investment {
  id: number;
  ad: string;
  tur: 'makina' | 'insaat' | 'diger';
  maliyet: number;
  geriOdeme: number;
  erteleme: number;
  gucTuketimi: number;
  saatlikKapasite: number;
}

interface InvestmentStepProps {
  investments: Investment[];
  onUpdate: (investments: Investment[]) => void;
  next: () => void;
}

const InvestmentStep: React.FC<InvestmentStepProps> = ({ investments, onUpdate, next }) => {
  const { t } = useTranslation();
  
  const [newInv, setNewInv] = useState({
    ad: '',
    tur: 'makina' as const,
    maliyet: '',
    geriOdeme: '60',
    erteleme: '0',
    gucTuketimi: '',
    saatlikKapasite: ''
  });

  const addInvestment = () => {
    if (!newInv.ad || !newInv.maliyet) return;
    
    const item: Investment = {
      id: Date.now(),
      ad: newInv.ad,
      tur: newInv.tur,
      maliyet: Number(newInv.maliyet),
      geriOdeme: Number(newInv.geriOdeme) || 1,
      erteleme: Number(newInv.erteleme) || 0,
      gucTuketimi: newInv.tur === 'makina' ? Number(newInv.gucTuketimi) || 0 : 0,
      saatlikKapasite: newInv.tur === 'makina' ? Number(newInv.saatlikKapasite) || 0 : 0,
    };

    onUpdate([...investments, item]);
    setNewInv({
      ad: '',
      tur: 'makina',
      maliyet: '',
      geriOdeme: '60',
      erteleme: '0',
      gucTuketimi: '',
      saatlikKapasite: ''
    });
  };

  const removeInvestment = (id: number) => {
    if(confirm('Bu yatırım kalemini silmek istediğinize emin misiniz?')) {
        onUpdate(investments.filter(i => i.id !== id));
    }
  };

  const fmt = (v: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const totalCost = investments.reduce((sum, i) => sum + i.maliyet, 0);

  return (
    <div className="flex flex-col gap-10 p-10 animate-in slide-in-from-right duration-700">
      {/* Input Form Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-black text-enba-dark uppercase tracking-tight italic">Kurulum & Sermaye Yatırımı (CAPEX)</h3>
          <p className="text-xs text-gray-400 font-medium">Tesisin başlangıç kurulumu, inşaat maliyetleri ve makina parkuru yatırımlarınızı giriniz.</p>
        </div>
        <div className="px-5 py-3 bg-enba-orange/5 rounded-2xl border border-enba-orange/10 flex items-center gap-3">
          <Info size={18} className="text-enba-orange" />
          <span className="text-[10px] font-black text-enba-orange uppercase tracking-widest">Amortismanlar P&L'e otomatik yansıtılır.</span>
        </div>
      </div>

      {/* New Investment Form - Premium Card */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-card grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6 items-end relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-2 h-full bg-enba-orange/10 group-hover:bg-enba-orange transition-all"></div>
        
        <div className="col-span-1 md:col-span-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Yatırım Adı / Açıklama</label>
          <input 
            type="text" 
            value={newInv.ad}
            onChange={e => setNewInv({...newInv, ad: e.target.value})}
            placeholder="Örn: 2500 T/Gün Kırma Hattı L1"
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all placeholder:text-gray-300"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Kategori</label>
          <select 
            value={newInv.tur}
            onChange={e => setNewInv({...newInv, tur: e.target.value as any})}
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="makina">⚙️ Makina</option>
            <option value="insaat">🏗️ İnşaat / Altyapı</option>
            <option value="diger">📦 Diğer</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Maliyet (₺)</label>
          <input 
            type="number" 
            value={newInv.maliyet}
            onChange={e => setNewInv({...newInv, maliyet: e.target.value})}
            className="w-full bg-emerald-50/30 border-none rounded-2xl px-5 py-4 text-sm font-black text-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Amortisman (Ay)</label>
          <input 
            type="number" 
            value={newInv.geriOdeme}
            onChange={e => setNewInv({...newInv, geriOdeme: e.target.value})}
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all"
            placeholder="60"
          />
        </div>

        {newInv.tur === 'makina' ? (
          <>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Motor Gücü (kW)</label>
              <input 
                type="number" 
                value={newInv.gucTuketimi}
                onChange={e => setNewInv({...newInv, gucTuketimi: e.target.value})}
                className="w-full bg-orange-50/50 border-none rounded-2xl px-5 py-4 text-sm font-black text-enba-orange focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all"
                placeholder="0"
              />
            </div>
            <button 
              onClick={addInvestment}
              className="px-8 py-4 bg-enba-dark text-white rounded-2xl font-black text-xs uppercase tracking-[3px] hover:bg-black shadow-xl shadow-gray-200 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus size={18} />
              Ekle
            </button>
          </>
        ) : (
          <div className="xl:col-span-2 flex justify-end">
            <button 
              onClick={addInvestment}
              className="w-full h-[54px] bg-enba-dark text-white rounded-2xl font-black text-xs uppercase tracking-[3px] hover:bg-black shadow-xl shadow-gray-200 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus size={18} />
              Yatırım Ekle
            </button>
          </div>
        )}
      </div>

      {/* List Table - Premium Modern Style */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Yatırım Kalemi / Cihaz</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Kategori</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[3px] text-right">Maliyet</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[3px] text-right">Aylık Depr.</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[3px] text-right">Enerji Yükü</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[3px] text-center">Yönetim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {investments.length > 0 ? investments.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50/30 transition-all group">
                <td className="px-8 py-6">
                  <span className="text-sm font-black text-enba-dark tracking-tight">{inv.ad}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${inv.tur === 'makina' ? 'bg-orange-50 text-enba-orange' : inv.tur === 'insaat' ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-400'}`}>
                        {inv.tur === 'makina' ? <Settings size={14} /> : inv.tur === 'insaat' ? <Building2 size={14} /> : <HelpCircle size={14} />}
                    </div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{inv.tur === 'makina' ? 'Makina' : inv.tur === 'insaat' ? 'İnşaat' : 'Diğer'}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <span className="text-sm font-black text-emerald-600">{fmt(inv.maliyet)} ₺</span>
                </td>
                <td className="px-8 py-6 text-right">
                  <span className="text-sm font-black text-rose-500">-{fmt(inv.maliyet / inv.geriOdeme)} ₺</span>
                  <div className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter mt-1">{inv.geriOdeme} AY VADE</div>
                </td>
                <td className="px-8 py-6 text-right">
                  <span className="text-sm font-black text-enba-orange">{inv.gucTuketimi > 0 ? `${inv.gucTuketimi} kW` : '—'}</span>
                </td>
                <td className="px-8 py-6 text-center">
                  <button 
                    onClick={() => removeInvestment(inv.id)}
                    className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-rose-500 rounded-xl transition-all shadow-sm hover:shadow-rose-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-3 grayscale opacity-30">
                        <Building2 size={48} />
                        <span className="text-sm font-bold italic">Henüz yatırım kalemi bulunmamaktadır.</span>
                    </div>
                </td>
              </tr>
            )}
          </tbody>
          {investments.length > 0 && (
            <tfoot>
              <tr className="bg-enba-dark text-white border-t-4 border-enba-orange">
                <td colSpan={2} className="px-10 py-8 text-sm font-black uppercase tracking-[3px]">Toplam Proje Yatırımı</td>
                <td className="px-8 py-8 text-right text-2xl font-black text-enba-orange">{fmt(totalCost)} ₺</td>
                <td colSpan={3} className="px-8 py-8 text-right italic font-medium text-white/40 text-xs">Amortisman maliyeti aylık olarak brüt kârdan düşülecektir.</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="mt-8 flex justify-end">
        <button 
          onClick={next}
          className="px-12 py-5 bg-enba-dark text-white rounded-[2rem] font-black text-xs uppercase tracking-[3px] hover:bg-black shadow-2xl shadow-gray-300 transition-all active:scale-95 flex items-center gap-3"
        >
          Sonraki Adım: Tedarik Planı
          <Plus size={18} className="rotate-45" />
        </button>
      </div>
    </div>
  );
};

export default InvestmentStep;
