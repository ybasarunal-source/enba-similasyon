import React, { useState, useEffect } from 'react';
import { DataService } from '../api/dataService';
import { fmt } from '../utils/formatters';
import { Truck, PlusCircle, ListOrdered, Trash2 } from 'lucide-react';

/**
 * Enba Similasyon - Lojistik & Araç Takip Modülü (TypeScript + Tailwind)
 */

interface LogisticsRecord {
  id?: string;
  tarih: string;
  aracPlaka: string;
  kullanici: string;
  baslangicKm: number;
  bitisKm: number;
  farkKm: number;
  guzergah: string;
}

export const Logistics: React.FC = () => {
  const [kayitlar, setKayitlar] = useState<LogisticsRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Form States
  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
  const [aracPlaka, setAracPlaka] = useState("");
  const [kullanici, setKullanici] = useState("");
  const [baslangicKm, setBaslangicKm] = useState<string>("");
  const [bitisKm, setBitisKm] = useState<string>("");
  const [guzergah, setGuzergah] = useState("");

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await DataService.fetchData<any>('logistics_records');
      const mapped = (data || []).map((r: any) => ({
        id: r.id, tarih: r.tarih, aracPlaka: r.arac_plaka, kullanici: r.kullanici,
        baslangicKm: Number(r.baslangic_km) || 0, bitisKm: Number(r.bitis_km) || 0,
        farkKm: Number(r.fark_km) || 0, guzergah: r.guzergah,
      }));
      setKayitlar(mapped.sort((a: any, b: any) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime()));
    } catch (e) {
      console.error("Lojistik kayıtları yüklenemedi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, []);

  const handleKayitEkle = async (e: React.FormEvent) => {
    e.preventDefault();
    const basKm = Number(baslangicKm) || 0;
    const bitKm = Number(bitisKm) || 0;
    
    setLoading(true);
    try {
      await DataService.insertLogistics({ tarih, aracPlaka, kullanici, baslangicKm: basKm, bitisKm: bitKm, guzergah });
      await loadRecords();
      setBaslangicKm(bitKm.toString());
      setBitisKm("");
      setGuzergah("");
    } catch (e) {
      alert("Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 p-10 animate-in fade-in duration-1000">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-enba-dark rounded-[1.2rem] flex items-center justify-center text-enba-orange shadow-2xl border border-white/5">
                <Truck size={32} />
             </div>
             <div>
                <h2 className="text-3xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">
                  Lojistik & Filo Operasyonu
                </h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[4px] mt-2 italic">Sevkiyat Takibi ve Kilometre Matrixi</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Form Card */}
        <div className="xl:col-span-4 bg-white rounded-[2.5rem] p-10 shadow-card border border-gray-100 flex flex-col gap-10 sticky top-10 h-fit">
          <div className="flex items-center justify-between">
             <h3 className="text-sm font-black text-enba-dark uppercase tracking-[3px] italic flex items-center gap-3">
               <PlusCircle className="text-enba-orange" size={20} /> Yeni Sefer Kaydı
             </h3>
             <div className="w-2 h-2 rounded-full bg-enba-orange animate-pulse"></div>
          </div>

          <form onSubmit={handleKayitEkle} className="flex flex-col gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1">Operasyon Tarihi</label>
              <input type="date" value={tarih} onChange={e => setTarih(e.target.value)} required
                className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1">Araç Plakası</label>
                  <input type="text" placeholder="34 ABC 00" value={aracPlaka} onChange={e => setAracPlaka(e.target.value)} required
                    className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all uppercase placeholder:opacity-30" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1">Operatör / Şoför</label>
                  <input type="text" placeholder="AD SOYAD" value={kullanici} onChange={e => setKullanici(e.target.value)} required
                    className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all uppercase placeholder:opacity-30" />
                </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1">Görev Güzergahı</label>
              <input type="text" placeholder="VARIŞ NOKTASI VE AMAÇ" value={guzergah} onChange={e => setGuzergah(e.target.value)} required
                className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all uppercase placeholder:opacity-30" />
            </div>

            <div className="p-8 bg-enba-dark rounded-[2rem] border border-white/5 shadow-2xl space-y-8">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[4px]">Telemetri Verisi</span>
                  <div className="px-2 py-0.5 bg-enba-orange text-white text-[8px] font-black rounded uppercase">KM Takibi</div>
               </div>
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/50 uppercase tracking-[3px]">Başlangıç KM</label>
                    <input type="number" placeholder="0" value={baslangicKm} onChange={e => setBaslangicKm(e.target.value)} required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg font-black text-enba-orange focus:bg-white/10 outline-none transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/50 uppercase tracking-[3px]">Bitiş KM</label>
                    <input type="number" placeholder="0" value={bitisKm} onChange={e => setBitisKm(e.target.value)} required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg font-black text-enba-orange focus:bg-white/10 outline-none transition-all" />
                  </div>
               </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-enba-dark text-white rounded-[1.8rem] py-6 font-black text-xs uppercase tracking-[5px] shadow-2xl shadow-black/30 hover:bg-black transition-all active:scale-95 group relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
              SİSTEME KAYDET
            </button>
          </form>
        </div>

        {/* List Card */}
        <div className="xl:col-span-8 bg-white rounded-[2.5rem] shadow-card border border-gray-100 overflow-hidden flex flex-col group">
           <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <div>
                 <h3 className="text-lg font-black text-enba-dark italic uppercase tracking-tighter">Son Görev Kayıtları</h3>
                 <p className="text-[9px] text-gray-400 font-black uppercase tracking-[3px] mt-1">Sistem Genelinde Toplam Operasyon Verisi</p>
              </div>
              <div className="px-6 py-3 bg-enba-orange/10 rounded-2xl border border-enba-orange/20">
                 <span className="text-[9px] font-black text-enba-orange uppercase tracking-widest leading-none">Katedilen Mesafe:</span>
                 <span className="text-base font-black text-enba-dark ml-3 tabular-nums italic">{fmt(kayitlar.reduce((s,k)=>s+k.farkKm,0))} KM</span>
              </div>
           </div>

           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Tarih</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Araç & Operatör</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Güzergah</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic text-right">Mesafe Farkı</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic text-center">Yönetim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {kayitlar.map(k => (
                    <tr key={k.id} className="group hover:bg-gray-50/80 transition-all">
                      <td className="px-10 py-8 text-sm font-black text-enba-dark italic tabular-nums">{k.tarih}</td>
                      <td className="px-10 py-8">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-enba-dark text-white flex items-center justify-center font-black italic shadow-lg">
                               {k.aracPlaka?.substring(0, 2)}
                            </div>
                            <div>
                               <div className="text-base font-black text-enba-dark italic tracking-tight uppercase leading-none mb-1.5">{k.aracPlaka}</div>
                               <div className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">{k.kullanici}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         <div className="text-sm font-medium text-gray-500 italic max-w-[200px] truncate group-hover:text-enba-dark transition-colors">
                            "{k.guzergah}"
                         </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <div className="px-5 py-2 bg-gray-100 text-enba-dark rounded-xl text-xs font-black italic border border-gray-200/50 group-hover:border-enba-orange transition-all inline-block tabular-nums">
                           {fmt(k.farkKm)} KM
                         </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                         <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90 border border-rose-100">
                               <Trash2 size={18} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {kayitlar.length === 0 && (
                    <tr>
                       <td colSpan={5} className="py-32 text-center text-gray-200 flex flex-col items-center justify-center">
                          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
                             <Truck size={48} className="opacity-20 translate-x-1" />
                          </div>
                          <span className="font-black text-[10px] tracking-[5px] uppercase italic">Arşivde kayıtlı sefer bulunamadı.</span>
                       </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Logistics;
