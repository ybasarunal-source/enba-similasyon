import React, { useState } from 'react';

interface SaveModalProps {
  onYeniVersiyon: (not: string) => void;
  onGuncelle: (not: string) => void;
  onYeniModel: (not: string) => void;
  onIptal: () => void;
}

export const SaveModal: React.FC<SaveModalProps> = ({ onYeniVersiyon, onGuncelle, onYeniModel, onIptal }) => {
  const [not, setNot] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl space-y-5">
        <div className="text-center">
          <h2 className="text-xl font-black text-enba-dark uppercase tracking-tight italic">Değişiklikleri Kaydet</h2>
          <p className="text-sm text-gray-400 mt-2">Bu düzenlemeyi nasıl kaydetmek istersiniz?</p>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Versiyon Notu (opsiyonel)</label>
          <input
            type="text"
            value={not}
            onChange={e => setNot(e.target.value)}
            placeholder="Bu versiyonda ne değişti?"
            className="mt-2 w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-3 text-sm font-medium text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all"
          />
        </div>
        <div className="space-y-3">
          <button onClick={() => onYeniVersiyon(not)} className="w-full text-left px-6 py-4 bg-enba-orange/5 hover:bg-enba-orange/10 border-2 border-enba-orange/30 hover:border-enba-orange rounded-2xl transition-all">
            <div className="font-black text-enba-dark text-sm">Yeni Versiyon Olarak Kaydet</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Mevcut hali geçmişe taşır, değişiklikleri yeni sürüm olarak kaydeder</div>
          </button>
          <button onClick={() => onGuncelle(not)} className="w-full text-left px-6 py-4 bg-gray-50 hover:bg-gray-100 border-2 border-transparent rounded-2xl transition-all">
            <div className="font-black text-enba-dark text-sm">Mevcut Versiyonu Güncelle</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Geçmişe eklenmez, doğrudan üzerine yazılır</div>
          </button>
          <button onClick={() => onYeniModel(not)} className="w-full text-left px-6 py-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 hover:border-blue-300 rounded-2xl transition-all">
            <div className="font-black text-enba-dark text-sm">Farklı İş Modeli Olarak Kaydet</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Ayrı, bağımsız bir plan kartı oluşturur</div>
          </button>
        </div>
        <button onClick={onIptal} className="w-full text-center text-[11px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-[3px] transition-colors pt-1">
          İptal
        </button>
      </div>
    </div>
  );
};
