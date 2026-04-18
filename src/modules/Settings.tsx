import React, { useState } from 'react';
import { useTranslation } from '../api/i18n';
import { 
  Settings as SettingsIcon, 
  CircleDollarSign, 
  Ruler, 
  Globe, 
  UserCircle, 
  Save, 
  CheckCircle,
  Weight,
  Scale,
  Languages,
  Moon,
  ShieldCheck,
  LogOut,
  Bell,
  RefreshCw
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Local Settings State ────────────────────────────────
  const [settings, setSettings] = useState({
    currency: 'TRY',
    unit: 'ton',
    notifications: true,
    theme: 'light'
  });

  const handleSave = () => {
    setLoading(true);
    // Simulate save
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  const CARD_STYLE = "bg-white rounded-[2.5rem] border border-gray-100 shadow-card p-10 transition-all hover:shadow-2xl relative overflow-hidden group";
  const TITLE_STYLE = "text-[11px] font-black text-enba-dark tracking-[4px] uppercase mb-8 flex items-center gap-4 italic";

  return (
    <div className="flex flex-col gap-10 p-10 animate-in fade-in duration-1000 max-w-6xl mx-auto">
       {/* Header Section */}
       <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-enba-dark rounded-[1.2rem] flex items-center justify-center text-enba-orange shadow-2xl border border-white/5">
                <SettingsIcon size={32} className="group-hover:rotate-90 transition-transform duration-700" />
             </div>
             <div>
                <h2 className="text-3xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">
                  Sistem Parametreleri
                </h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[4px] mt-2 italic">Global Tercihler & Profil Yönetimi</p>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Global Preferences */}
          <div className={CARD_STYLE}>
             <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-enba-orange/5 transition-colors"></div>
             <h3 className={TITLE_STYLE}>
                <CircleDollarSign size={20} className="text-enba-orange" /> Finansal Matrix Birimi
             </h3>
             <div className="grid grid-cols-2 gap-6 relative z-10">
                {['TRY', 'USD', 'EUR', 'GBP'].map(curr => (
                  <button 
                    key={curr}
                    onClick={() => setSettings({...settings, currency: curr})}
                    className={`p-8 rounded-[1.8rem] border-2 transition-all flex flex-col items-center gap-3 active:scale-95 ${settings.currency === curr ? 'border-enba-dark bg-enba-dark text-white shadow-xl rotate-1' : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-200'}`}
                  >
                    <span className="text-2xl font-black italic">{curr === 'TRY' ? '₺' : curr === 'USD' ? '$' : curr === 'EUR' ? '€' : '£'}</span>
                    <span className="text-[10px] font-black tracking-[3px] uppercase italic">{curr}</span>
                  </button>
                ))}
             </div>
          </div>

          <div className={CARD_STYLE}>
             <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-enba-orange/5 transition-colors"></div>
             <h3 className={TITLE_STYLE}>
                <Scale size={20} className="text-enba-orange" /> Endüstriyel Ölçüm Standardı
             </h3>
             <div className="flex flex-col gap-5 relative z-10">
                {[
                  { id: 'ton', label: 'METRİK TON (MT)', desc: 'Brüt ağırlık bazlı raporlama', icon: Ruler },
                  { id: 'kg', label: 'KİLOGRAM (KG)', desc: 'Net birim bazlı hassas takip', icon: Weight }
                ].map(unit => (
                  <button 
                    key={unit.id}
                    onClick={() => setSettings({...settings, unit: unit.id})}
                    className={`p-6 rounded-[1.8rem] border-2 transition-all flex items-center justify-between group/btn active:scale-98 ${settings.unit === unit.id ? 'border-enba-orange bg-orange-50 text-enba-dark shadow-lg' : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-200'}`}
                  >
                    <div className="flex items-center gap-6 text-left">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all ${settings.unit === unit.id ? 'bg-enba-dark text-white' : 'bg-white text-gray-200 shadow-sm'}`}>
                          <unit.icon size={28} />
                       </div>
                       <div>
                          <div className="text-xs font-black tracking-[2px] uppercase italic">{unit.label}</div>
                          <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1 italic">{unit.desc}</div>
                       </div>
                    </div>
                    {settings.unit === unit.id && <CheckCircle size={24} className="text-enba-orange" />}
                  </button>
                ))}
             </div>
          </div>

          {/* Language & Interface */}
          <div className={CARD_STYLE}>
             <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-enba-orange/5 transition-colors"></div>
             <h3 className={TITLE_STYLE}>
                <Globe size={20} className="text-enba-orange" /> Dil & Lokasyon Verisi
             </h3>
             <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-[1.8rem] border border-gray-100 group/row hover:bg-white transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-200 group-hover/row:text-enba-orange shadow-sm transition-colors">
                         <Languages size={24} />
                      </div>
                      <div>
                         <div className="text-[10px] font-black text-gray-300 uppercase tracking-[3px] mb-1 italic">Operasyonel Dil</div>
                         <div className="text-[11px] font-black text-enba-dark uppercase tracking-widest italic">{language === 'TR' ? 'Türkçe (TR)' : 'English (EN)'}</div>
                      </div>
                   </div>
                   <button 
                     onClick={() => setLanguage(language === 'TR' ? 'EN' : 'TR')}
                     className="px-6 py-3 bg-enba-dark text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-[2px] hover:bg-black transition-all shadow-xl active:scale-90 italic"
                   >
                      DEĞİŞTİR
                   </button>
                </div>
                <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-[1.8rem] border border-gray-100 group/row hover:bg-white transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-200 group-hover/row:text-enba-orange shadow-sm transition-colors">
                         <Bell size={24} />
                      </div>
                      <div>
                         <div className="text-[10px] font-black text-gray-300 uppercase tracking-[3px] mb-1 italic">Sistem Bildirimleri</div>
                         <div className="text-[11px] font-black text-enba-dark uppercase tracking-widest italic">{settings.notifications ? 'TAM ERİŞİM AKTİF' : 'YALNIZCA KRİTİK'}</div>
                      </div>
                   </div>
                   <button 
                     onClick={() => setSettings({...settings, notifications: !settings.notifications})}
                     className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${settings.notifications ? 'bg-enba-orange' : 'bg-gray-200'}`}
                   >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-2xl ${settings.notifications ? 'right-1' : 'left-1'}`}></div>
                   </button>
                </div>
             </div>
          </div>

          {/* Account/Profile Summary */}
          <div className={CARD_STYLE}>
             <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-enba-orange/5 transition-colors"></div>
             <h3 className={TITLE_STYLE}>
                <UserCircle size={20} className="text-enba-orange" /> Kullanıcı & Güvenlik Matrixi
             </h3>
             <div className="flex flex-col gap-8 relative z-10">
                <div className="flex items-center gap-6 p-2">
                   <div className="w-20 h-20 rounded-[2rem] bg-enba-dark flex items-center justify-center border-4 border-white shadow-2xl relative overflow-hidden group/avatar">
                      <UserCircle size={56} className="text-enba-orange/20" />
                      <div className="absolute inset-0 bg-enba-orange/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity"></div>
                      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-enba-orange"></div>
                   </div>
                   <div>
                      <div className="text-2xl font-black text-enba-dark tracking-tighter leading-none uppercase italic mb-2">ADMINISTRATOR</div>
                      <div className="text-[10px] font-black text-enba-orange uppercase tracking-[3px] italic bg-orange-50 px-3 py-1 rounded-full border border-orange-100 inline-block">FULL SYSTEM ACCESS</div>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <button className="flex items-center gap-3 justify-center px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[2px] hover:bg-enba-dark hover:text-white transition-all shadow-sm italic active:scale-95 group/sec">
                      <ShieldCheck size={18} className="text-enba-orange group-hover/sec:text-enba-orange" /> Şifre Matrix
                   </button>
                   <button className="flex items-center gap-3 justify-center px-6 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[2px] hover:bg-rose-500 hover:text-white transition-all shadow-sm italic active:scale-95">
                      <LogOut size={18} /> Çıkış Yap
                   </button>
                </div>
             </div>
          </div>
       </div>

       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 pt-10 border-t border-gray-100 mt-10">
          <div className="flex items-center gap-6">
             {success && (
               <div className="flex items-center gap-4 text-emerald-600 font-black text-[11px] uppercase tracking-[4px] italic animate-in fade-in slide-in-from-left-10 duration-500">
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shadow-emerald-50 shadow-lg">
                    <CheckCircle size={20} />
                  </div>
                  <span>MATRİX PARAMETRELERİ GÜNCELLENDİ</span>
               </div>
             )}
          </div>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-16 py-6 bg-enba-dark text-white rounded-[2.2rem] font-black text-xs uppercase tracking-[5px] hover:bg-black transition-all shadow-2xl flex items-center gap-4 group disabled:opacity-50 active:scale-95 border border-white/5 relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
             {loading ? (
               <RefreshCw size={24} className="animate-spin text-enba-orange" />
             ) : (
               <Save size={24} className="text-enba-orange group-hover:rotate-12 transition-transform" />
             )}
             {loading ? 'YÜKLENİYOR...' : 'SİSTEMİ GÜNCELLE'}
          </button>
       </div>
    </div>
  );
};

export default Settings;
