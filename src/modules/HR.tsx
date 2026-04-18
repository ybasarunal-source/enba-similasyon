import React, { useState, useEffect } from 'react';
import { DataService, Contact } from '../api/dataService';
import { fmt } from '../utils/formatters';
import { t } from '../utils/translations';
import { Contact as ContactIcon, UserPlus, Pencil, Trash2, X } from 'lucide-react';

/**
 * Enba Similasyon - İnsan Kaynakları (HR) Modülü (TypeScript + Tailwind)
 */

interface Person {
  id: string;
  name: string;
  position: string;
  department: string;
  salary: number;
  sgk_status: string;
  start_date: string;
}

interface Attendance {
  id: string;
  person_id: string;
  month: number;
  year: number;
  work_hours: number;
  overtime_hours: number;
  notes?: string;
}

export const HR: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'personnel' | 'attendance' | 'payments' | 'debts'>('personnel');
  const [loading, setLoading] = useState(true);
  const [personel, setPersonel] = useState<Person[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [showModal, setShowModal] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        DataService.fetchData<any>('personnel', '*'),
        DataService.fetchData<any>('attendance', '*')
      ]);
      setPersonel(p || []);
      setAttendance(a || []);
    } catch (e) {
      console.error("İK verileri çekilemedi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="flex flex-col gap-10 p-10 animate-in fade-in duration-1000">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-enba-dark rounded-[1.2rem] flex items-center justify-center text-enba-orange shadow-2xl border border-white/5">
                <ContactIcon size={32} />
             </div>
             <div>
                <h2 className="text-3xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">
                  İnsan Kaynakları Yönetimi
                </h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[4px] mt-2 italic">Organizasyonel Yapı ve Personel Matrix</p>
             </div>
          </div>
        </div>
        <button 
          onClick={() => setShowModal('person')}
          className="px-10 py-5 bg-enba-dark text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[3px] shadow-2xl shadow-black/20 hover:bg-black transition-all flex items-center gap-4 group active:scale-95 border border-white/5"
        >
          <UserPlus size={20} className="text-enba-orange transition-transform group-hover:scale-125" />
          Kadro Tahsis Et
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-[2rem] self-start border border-gray-100 shadow-inner">
        {(['personnel', 'attendance', 'payments', 'debts'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[2px] transition-all 
              ${activeTab === tab ? 'bg-enba-dark text-white shadow-xl' : 'text-gray-400 hover:text-enba-dark'}`}
          >
            {tab === 'personnel' && 'Personel Matrix'}
            {tab === 'attendance' && 'Puantaj Kayıtları'}
            {tab === 'payments' && 'Maaş Rejimi'}
            {tab === 'debts' && 'Avans & Borç'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[2.5rem] shadow-card border border-gray-100 overflow-hidden group">
        <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
           <div>
              <h3 className="text-lg font-black text-enba-dark italic uppercase tracking-tighter">Aktif Personel Listesi</h3>
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-[3px] mt-1">Sistem Kayıtlı {personel.length} Personel</p>
           </div>
           <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300">
                 <ContactIcon size={18} />
              </div>
           </div>
        </div>

        {loading ? (
          <div className="py-32 text-center animate-pulse flex flex-col items-center">
             <div className="w-16 h-16 bg-gray-100 rounded-2xl mb-6 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-enba-orange border-t-transparent rounded-full animate-spin"></div>
             </div>
             <p className="text-gray-300 font-black uppercase text-[10px] tracking-[4px]">Veritabanı Senkronize Ediliyor...</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            {activeTab === 'personnel' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Kimlik & Pozisyon</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Departman Birimi</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Hakediş (Aylık)</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">SGK Matrahı</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Yönetim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {personel.map(p => (
                    <tr key={p.id} className="group hover:bg-gray-50/80 transition-all">
                      <td className="px-10 py-8">
                         <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[1rem] bg-enba-dark text-white flex items-center justify-center font-black italic shadow-lg group-hover:scale-110 transition-transform">
                               {p.name.charAt(0)}
                            </div>
                            <div>
                               <div className="text-base font-black text-enba-dark italic tracking-tight uppercase leading-none mb-2">{p.name}</div>
                               <div className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">{p.position}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         <div className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block border border-gray-200/50 group-hover:bg-white transition-colors">
                           {p.department || 'GENEL MERKEZ'}
                         </div>
                      </td>
                      <td className="px-10 py-8 text-base font-black text-enba-dark tabular-nums italic">
                         {fmt(p.salary)} <span className="text-[10px] text-gray-300 font-bold ml-1">₺</span>
                      </td>
                      <td className="px-10 py-8">
                         <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                           p.sgk_status === 'Aktif' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-100'
                         }`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${p.sgk_status === 'Aktif' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                           {p.sgk_status}
                         </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-enba-dark text-white hover:bg-black transition-all shadow-lg active:scale-90">
                               <Pencil size={18} />
                            </button>
                            <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90 border border-rose-100">
                               <Trash2 size={18} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {personel.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-32 text-center text-gray-200 flex flex-col items-center justify-center">
                         <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <ContactIcon size={40} className="opacity-20" />
                         </div>
                         <span className="font-black text-[10px] tracking-[4px] uppercase italic">Arşivde kayıtlı personel bulunamadı.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'attendance' && (
               <div className="py-32 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                     <ContactIcon size={40} className="text-gray-200" />
                  </div>
                  <p className="text-gray-300 font-black uppercase text-[10px] tracking-[4px] italic">Puantaj kayıtları bu bölümde detaylandırılacaktır.</p>
               </div>
            )}
          </div>
        )}
      </div>

      {/* Premium Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-enba-dark/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-500 px-6">
           <div className="bg-white rounded-[3.5rem] p-12 w-full max-w-xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-enba-orange shadow-lg shadow-enba-orange/20"></div>
              <button 
                onClick={() => setShowModal(null)}
                className="absolute top-8 right-8 text-gray-300 hover:text-enba-dark transition-all hover:rotate-90 duration-300"
              >
                <X size={32} />
              </button>
              
              <div className="flex items-center gap-6 mb-12">
                 <div className="w-16 h-16 bg-enba-dark rounded-2xl flex items-center justify-center text-enba-orange shadow-2xl">
                    <UserPlus size={32} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">Personel Kayıt Matrixi</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-2">Yeni Kadro Tahsis Formu</p>
                 </div>
              </div>
              
              <div className="space-y-10">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1">Kadro Ad Soyad</label>
                    <input type="text" className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all" placeholder="TAM İSİM GİRİNİZ" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1">Hakediş (NET ₺)</label>
                        <input type="number" className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all" placeholder="0.00" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1">Saha / Departman</label>
                        <select className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all appearance-none">
                           <option>ÜRETİM HATTI</option>
                           <option>LOJİSTİK & SEVKİYAT</option>
                           <option>İDARİ İŞLER</option>
                           <option>LABORATUVAR</option>
                        </select>
                    </div>
                 </div>

                 <button className="w-full bg-enba-orange text-white rounded-[1.8rem] py-6 font-black text-xs uppercase tracking-[5px] shadow-2xl shadow-enba-orange/30 hover:brightness-110 transition-all mt-6 active:scale-95 group overflow-hidden relative">
                    <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                    SİSTEME KAYDET
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HR;
