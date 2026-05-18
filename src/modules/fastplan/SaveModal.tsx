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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-enba-panel border border-enba-line rounded-xl p-8 max-w-md w-full shadow-enba space-y-5">
        <div className="text-center">
          <h2 className="text-[15px] font-semibold text-enba-text">Değişiklikleri Kaydet</h2>
          <p className="text-[13px] text-enba-muted mt-1.5">Bu düzenlemeyi nasıl kaydetmek istersiniz?</p>
        </div>
        <div>
          <label className="text-[11px] font-medium text-enba-muted uppercase tracking-[0.1em]">Versiyon Notu (opsiyonel)</label>
          <input
            type="text"
            value={not}
            onChange={e => setNot(e.target.value)}
            placeholder="Bu versiyonda ne değişti?"
            className="mt-2 w-full bg-enba-panel-2 border border-enba-line rounded-lg px-4 py-2.5 text-[13px] text-enba-text placeholder:text-enba-dim focus:border-enba-orange/50 focus:ring-2 focus:ring-enba-orange/15 outline-none transition-all"
          />
        </div>
        <div className="space-y-2.5">
          <button onClick={() => onYeniVersiyon(not)} className="w-full text-left px-5 py-3.5 bg-enba-orange/8 hover:bg-enba-orange/12 border border-enba-orange/30 hover:border-enba-orange/60 rounded-lg transition-all">
            <div className="font-semibold text-enba-text text-[13px]">Yeni Versiyon Olarak Kaydet</div>
            <div className="text-[11px] text-enba-muted mt-0.5">Mevcut hali geçmişe taşır, değişiklikleri yeni sürüm olarak kaydeder</div>
          </button>
          <button onClick={() => onGuncelle(not)} className="w-full text-left px-5 py-3.5 bg-enba-panel-2 hover:bg-enba-line/40 border border-enba-line rounded-lg transition-all">
            <div className="font-semibold text-enba-text text-[13px]">Mevcut Versiyonu Güncelle</div>
            <div className="text-[11px] text-enba-muted mt-0.5">Geçmişe eklenmez, doğrudan üzerine yazılır</div>
          </button>
          <button onClick={() => onYeniModel(not)} className="w-full text-left px-5 py-3.5 bg-enba-blue/8 hover:bg-enba-blue/12 border border-enba-blue/25 hover:border-enba-blue/50 rounded-lg transition-all">
            <div className="font-semibold text-enba-text text-[13px]">Farklı İş Modeli Olarak Kaydet</div>
            <div className="text-[11px] text-enba-muted mt-0.5">Ayrı, bağımsız bir plan kartı oluşturur</div>
          </button>
        </div>
        <button onClick={onIptal} className="w-full text-center text-[11px] font-medium text-enba-dim hover:text-enba-muted uppercase tracking-[0.1em] transition-colors pt-1">
          İptal
        </button>
      </div>
    </div>
  );
};
