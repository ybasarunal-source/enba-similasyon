import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DataService } from '../api/dataService';
import { fmt } from '../utils/formatters';
import { 
  Archive as ArchiveIcon, 
  Search, 
  Upload, 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  File, 
  Download, 
  Trash2, 
  FileX, 
  XCircle, 
  Eye 
} from 'lucide-react';

/**
 * Enba Similasyon - Arşiv & Doküman Yönetimi (TypeScript + Tailwind)
 */

interface ArchiveFile {
  id: string;
  ad: string;
  mime: string;
  boyut: number;
  kategori: string;
  etiketler: string[];
  notlar?: string;
  storage_path: string;
  yuklenmeTarihi: string;
}

const KATEGORILER = ['Tümü', 'Sözleşmeler', 'Faturalar', 'Ruhsat & Lisans', 'Teknik Belgeler', 'Mali Belgeler', 'Yazışmalar', 'Raporlar', 'Diğer'];

const getFileIcon = (mime: string) => {
  if (mime.includes('pdf')) return FileText;
  if (mime.startsWith('image/')) return FileImage;
  if (mime.includes('spreadsheet') || mime.includes('excel')) return FileSpreadsheet;
  return File;
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const Archive: React.FC = () => {
  const [dosyalar, setDosyalar] = useState<ArchiveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');
  const [kategoriFiltre, setKategoriFiltre] = useState('Tümü');
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await DataService.fetchData<any>('arsiv_files');
      setDosyalar(data);
    } catch (e) {
      console.error("Arşiv verileri çekilemedi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredFiles = useMemo(() => {
    return dosyalar.filter(d => {
      const matchSearch = d.ad.toLowerCase().includes(aramaMetni.toLowerCase());
      const matchCategory = kategoriFiltre === 'Tümü' || d.kategori === kategoriFiltre;
      return matchSearch && matchCategory;
    });
  }, [dosyalar, aramaMetni, kategoriFiltre]);

  const seciliDosya = useMemo(() => dosyalar.find(d => d.id === seciliId), [dosyalar, seciliId]);

  return (
    <div className="flex flex-col gap-10 p-10 animate-in fade-in duration-1000 h-full">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-enba-dark rounded-[1.2rem] flex items-center justify-center text-enba-orange shadow-2xl border border-white/5">
                <ArchiveIcon size={32} />
             </div>
             <div>
                <h2 className="text-3xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">
                  Kurumsal Hafıza Matrixi
                </h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[4px] mt-2 italic">Belge & Doküman Yönetim Merkezi</p>
             </div>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="relative group">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-enba-orange transition-colors" size={20} />
             <input 
               type="text" 
               placeholder="MATRİXTE ARA..."
               value={aramaMetni}
               onChange={e => setAramaMetni(e.target.value)}
               className="bg-white border border-gray-100 rounded-[1.8rem] pl-16 pr-8 py-5 text-[11px] font-black text-enba-dark focus:ring-4 focus:ring-enba-orange/5 outline-none w-80 transition-all placeholder:italic uppercase tracking-widest shadow-card"
             />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-10 py-5 bg-enba-dark text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[3px] shadow-2xl shadow-black/20 hover:bg-black transition-all flex items-center gap-4 group active:scale-95 border border-white/5"
          >
            <Upload size={20} className="text-enba-orange transition-transform group-hover:-translate-y-1" />
            Yeni Kayıt Girişi
          </button>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" multiple />
      </div>

      <div className="flex gap-10 flex-1 min-h-0">
        {/* Left Side: Categories & Files */}
        <div className="flex-1 flex flex-col gap-10 overflow-hidden">
          {/* Categories Matrix */}
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
            {KATEGORILER.map(k => (
              <button
                key={k}
                onClick={() => setKategoriFiltre(k)}
                className={`px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[2px] whitespace-nowrap transition-all border
                  ${kategoriFiltre === k ? 'bg-enba-dark text-white border-enba-dark shadow-xl' : 'bg-white text-gray-400 border-gray-100 hover:border-enba-orange/30 hover:text-enba-dark shadow-sm'}`}
              >
                {k}
              </button>
            ))}
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8 overflow-y-auto pr-4 custom-scrollbar pb-10">
            {filteredFiles.map(d => (
              <div 
                key={d.id}
                onClick={() => setSeciliId(d.id)}
                className={`group bg-white p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]
                  ${seciliId === d.id ? 'border-enba-orange shadow-2xl' : 'border-transparent shadow-card hover:border-gray-50'}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-enba-orange/5 transition-colors"></div>
                
                <div className="flex items-start gap-6 mb-6 relative z-10">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl transition-transform group-hover:scale-110 duration-500
                    ${d.mime.includes('pdf') ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                    {React.createElement(getFileIcon(d.mime), { size: 32 })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-black text-enba-dark truncate group-hover:text-enba-orange transition-colors uppercase italic tracking-tight mb-2">{d.ad}</div>
                    <div className="flex items-center gap-3">
                       <span className="text-[9px] font-black text-gray-300 uppercase tracking-[2px]">{formatSize(d.boyut)}</span>
                       <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                       <span className="text-[9px] font-black text-enba-orange uppercase tracking-[2px] italic">{d.kategori}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center relative z-10 pt-4 border-t border-gray-50/50">
                   <div className="flex items-center gap-2">
                       <FileText size={14} className="text-gray-200" />
                       <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest italic">{new Date(d.yuklenmeTarihi).toLocaleDateString('tr-TR')}</span>
                   </div>
                   <div className="flex gap-2">
                      <button className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-enba-dark hover:text-white transition-all shadow-sm">
                        <Download size={18} />
                      </button>
                      <button className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                        <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              </div>
            ))}
            
            {filteredFiles.length === 0 && !loading && (
              <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
                 <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-100 border border-gray-50 shadow-inner mb-6">
                    <FileX size={48} />
                 </div>
                 <p className="font-black uppercase text-[12px] tracking-[6px] text-gray-300 italic leading-none">ARŞİV MATRİXİ BOŞ</p>
                 <p className="text-[9px] font-bold text-gray-200 uppercase tracking-[3px] mt-2">Döküman yükleyerek kurumsal hafızayı oluşturun</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Preview Panel */}
        {seciliDosya && (
          <div className="w-[420px] bg-white rounded-[3rem] p-10 shadow-card border border-gray-100 flex flex-col gap-10 animate-in slide-in-from-right duration-500 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-enba-orange"></div>
             <div className="flex justify-between items-center">
                <div>
                   <h3 className="text-sm font-black text-enba-dark uppercase tracking-[4px] italic leading-none">Belge Matrix Verisi</h3>
                   <div className="text-[9px] font-bold text-gray-300 uppercase tracking-[2px] mt-1.5">Meta Veri ve Önizleme</div>
                </div>
                <button onClick={() => setSeciliId(null)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-300 transition-all hover:rotate-90">
                   <XCircle size={24} />
                </button>
             </div>

             <div className="flex flex-col items-center gap-6 bg-gray-50 rounded-[2.5rem] p-12 border border-dashed border-gray-200 relative group/preview">
                <div className="absolute inset-0 bg-enba-dark/5 opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-[2.5rem]"></div>
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl relative z-10">
                   {React.createElement(getFileIcon(seciliDosya.mime), { size: 48, className: 'text-enba-orange' })}
                </div>
                <div className="text-center relative z-10">
                   <div className="text-base font-black text-enba-dark uppercase italic tracking-tight line-clamp-2 max-w-[280px] leading-tight mb-2">{seciliDosya.ad}</div>
                   <div className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] opacity-70 italic">{formatSize(seciliDosya.boyut)}</div>
                </div>
             </div>

             <div className="flex flex-col gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-300 uppercase tracking-[4px] ml-1 italic">Kategori Referansı</label>
                   <div className="px-6 py-4 bg-gray-50 rounded-2xl text-[11px] font-black text-enba-dark border border-gray-100 uppercase tracking-widest">{seciliDosya.kategori}</div>
                </div>
                {seciliDosya.notlar && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-300 uppercase tracking-[4px] ml-1 italic">Operasyonel Notlar</label>
                    <div className="px-6 py-5 bg-gray-50 rounded-2xl text-xs font-medium text-gray-500 italic leading-relaxed shadow-inner border border-gray-100">
                      "{seciliDosya.notlar}"
                    </div>
                  </div>
                )}
             </div>

             <div className="mt-auto flex flex-col gap-4">
                <button className="w-full bg-enba-dark text-white rounded-[1.8rem] py-6 font-black text-xs uppercase tracking-[4px] transition-all hover:bg-black flex items-center justify-center gap-4 shadow-2xl active:scale-95 border border-white/5">
                   <Eye size={20} className="text-enba-orange" /> BELGEYİ GÖRÜNTÜLE
                </button>
                <button className="w-full border-2 border-enba-dark text-enba-dark rounded-[1.8rem] py-6 font-black text-xs uppercase tracking-[4px] transition-all hover:bg-gray-50 italic">
                   DOSYAYI İNDİR
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;
