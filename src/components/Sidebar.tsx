import React from 'react';
import { t } from '../utils/translations';
import { 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  FileText, 
  Download, 
  List, 
  Pencil, 
  PlayCircle, 
  Trash2, 
  AlertOctagon 
} from 'lucide-react';

interface SidebarProps {
  sidebarAcik: boolean;
  setSidebarAcik: React.Dispatch<React.SetStateAction<boolean>>;
  mobileSidebarAcik: boolean;
  setMobileSidebarAcik: (open: boolean) => void;
  bekleyenPlanlar: any[];
  setBekleyenPlanlar: (plans: any[]) => void;
  aktifPlanlar: any[];
  setAktifPlanlar: (plans: any[]) => void;
  yeniIpkBaslat: () => void;
  excelIceAktar: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sablonIndir: () => void;
  suruklemeBasladi: (e: React.DragEvent, id: string) => void;
  IpkDuzenle: (plan: any) => void;
  IpkSil: (id: string) => void;
  verileriSifirla: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarAcik,
  setSidebarAcik,
  mobileSidebarAcik,
  bekleyenPlanlar,
  setBekleyenPlanlar,
  aktifPlanlar,
  setAktifPlanlar,
  yeniIpkBaslat,
  excelIceAktar,
  sablonIndir,
  suruklemeBasladi,
  IpkDuzenle,
  IpkSil,
  verileriSifirla
}) => {
  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-80 bg-enba-dark text-white transition-all duration-300 transform 
      ${sidebarAcik ? 'translate-x-0' : '-translate-x-full'} 
      ${mobileSidebarAcik ? 'translate-x-0' : ''} lg:relative lg:translate-x-0`}>
      
      {/* Toggle Button */}
      <button 
        className="absolute -right-4 top-8 flex h-8 w-8 items-center justify-center rounded-full bg-white text-enba-dark shadow-elevated lg:hidden"
        onClick={() => setSidebarAcik(!sidebarAcik)}
      >
        {sidebarAcik ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <div className="flex h-full flex-col p-6 overflow-y-auto sidebar-scrollbar custom-scrollbar">
        {/* Quick Actions */}
        <div className="flex flex-col gap-3 mb-10">
          <button 
            className="flex items-center justify-center gap-2 rounded-xl bg-enba-orange px-4 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
            onClick={yeniIpkBaslat}
          >
            <PlusCircle size={20} /> HIZLI İŞ PLANI
          </button>
          
          <input type="file" id="excel-upload" accept=".xlsx, .xls, .csv" className="hidden" onChange={excelIceAktar} />
          <button 
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-white/10"
            onClick={() => document.getElementById('excel-upload')?.click()}
          >
            <FileText size={20} className="text-green-500" /> EXCEL İLE YÜKLE
          </button>
          <button 
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-white/10"
            onClick={sablonIndir}
          >
            <Download size={20} className="text-enba-orange" /> ŞABLON İNDİR
          </button>
        </div>

        {/* Section Title */}
        <div className="flex items-center gap-2 mb-2 text-[11px] font-extrabold uppercase tracking-[2px] text-enba-orange">
          <List size={18} /> İPK LİSTESİ
        </div>
        <p className="mb-6 text-[11px] font-medium text-white/40 leading-relaxed italic">
          Modelleri tesise sürükleyerek aktif edebilirsiniz.
        </p>
        
        {/* Plan List */}
        <div className="flex-1 space-y-4">
          {bekleyenPlanlar
            .filter(p => !p.plan_type || p.plan_type === 'fast')
            .map(plan => (
            <div 
              key={plan.id} 
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:-translate-y-1 hover:border-enba-orange/40 hover:bg-white/10"
              draggable 
              onDragStart={(e) => suruklemeBasladi(e, plan.id)}
            >
              <div className="text-sm font-bold text-white mb-1">{plan.baslik}</div>
              <div className="text-[10px] text-white/40 mb-3">
                {plan.parametreler?.aylikTon || 0} Ton Giriş / {plan.kutleDengesi?.toplamSatisTon || plan.parametreler?.aylikTon || 0} Ton Çıkış
              </div>
              
              <div className="flex items-center justify-between rounded-lg bg-black/20 p-2 mb-3">
                <span className="text-[9px] font-bold uppercase text-white/30 tracking-tight">Tahmini Net Kâr</span>
                <strong className={`text-xs ${plan.netKar >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {plan.netKar || 0} ₺
                </strong>
              </div>

              <div className="flex gap-2">
                <button 
                  className="flex flex-1 items-center justify-center rounded-lg bg-white/10 py-1.5 transition-colors hover:bg-white/20"
                  onClick={() => IpkDuzenle(plan)}
                >
                  <Pencil size={14} />
                </button>
                <button 
                  className="flex flex-[3] items-center justify-center gap-1 rounded-lg bg-enba-orange py-1.5 text-[10px] font-bold transition-transform hover:scale-[1.02]"
                  onClick={() => { 
                    setAktifPlanlar([...aktifPlanlar, plan]); 
                    setBekleyenPlanlar(bekleyenPlanlar.filter(x => x.id !== plan.id)); 
                  }}
                >
                  <PlayCircle size={14} /> AKTİF ET
                </button>
                <button 
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-500 transition-colors hover:bg-red-500/30"
                  title="Sil"
                  onClick={(e) => { e.stopPropagation(); IpkSil(plan.id); }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {bekleyenPlanlar.length === 0 && (
            <div className="py-10 text-center text-xs italic text-white/20">
              Henüz bir İPK oluşturulmadı.
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <button 
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 py-3 text-[10px] font-bold text-red-500 transition-colors hover:bg-red-500/20"
            onClick={verileriSifirla}
          >
            <AlertOctagon size={16} /> TÜM VERİLERİ SIFIRLA
          </button>
        </div>
      </div>
    </div>
  );
};
