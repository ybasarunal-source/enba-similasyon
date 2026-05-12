import React, { useState } from 'react';
import {
  Play, Edit3, Copy, Trash2, Archive, ArchiveRestore, Scale, X, ChevronDown, ChevronUp
} from 'lucide-react';
import type { PlanCard } from './types';

interface PlanKartProps {
  plan: PlanCard;
  onToggle: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onCompare: () => void;
  onVersionCompare: (vIdx: number) => void;
  isSelectedForCompare: boolean;
  kpiColor: (v: number) => string;
  fmt: (n: number) => string;
  fmtDec: (n: number) => string;
}

export const PlanKartBileseni: React.FC<PlanKartProps> = ({
  plan, onToggle, onEdit, onCopy, onDelete, onArchive, onCompare,
  onVersionCompare, isSelectedForCompare, kpiColor, fmt, fmtDec,
}) => {
  const versions = plan.versions ?? [];
  const [selectedVer, setSelectedVer] = useState<'current' | number>('current');
  const aktif = plan.status === 'active';

  const dispSonuc = selectedVer === 'current' ? plan.sonuc : (versions[selectedVer as number]?.sonuc ?? plan.sonuc);
  const dispParams = selectedVer === 'current' ? plan.params : (versions[selectedVer as number]?.params ?? plan.params);
  const s = dispSonuc;

  const seritRenk = s.ebitdaMarji >= 15 ? 'bg-emerald-400'
    : s.ebitdaMarji >= 5 ? 'bg-yellow-400'
    : s.ebitdaMarji > 0 ? 'bg-rose-400'
    : 'bg-gray-200';

  return (
    <div className={`bg-white rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden shadow-card ${
      isSelectedForCompare ? 'border-blue-400 shadow-blue-200/50 shadow-lg' : aktif ? 'border-enba-orange shadow-enba-orange/10' : 'border-transparent'
    }`}>
      <div className={`h-1 ${seritRenk}`} />

      <div className={`px-8 py-5 ${aktif ? 'bg-enba-orange/5' : 'bg-gray-50'} border-b border-gray-100 flex items-start justify-between gap-4`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {aktif && <div className="w-2 h-2 rounded-full bg-enba-orange animate-pulse flex-shrink-0" />}
            <h3 className="font-black text-enba-dark text-sm uppercase tracking-tight truncate">{plan.baslik}</h3>
          </div>
          {plan.etiket && (
            <span className="inline-flex items-center mt-1 mb-1 px-2.5 py-0.5 bg-enba-dark/5 text-enba-dark text-[9px] font-black uppercase tracking-widest rounded-full">
              {plan.etiket}
            </span>
          )}
          {plan.aciklama && (
            <p className="text-[10px] text-gray-400 font-medium truncate">{plan.aciklama}</p>
          )}
          {versions.length === 0 ? (
            <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1.5">
              {new Date(plan.createdAt).toLocaleDateString('tr-TR')} · {fmtDec(dispParams.aylikTon)} ton/ay
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <select
                value={selectedVer === 'current' ? 'current' : String(selectedVer)}
                onChange={e => setSelectedVer(e.target.value === 'current' ? 'current' : Number(e.target.value))}
                className="text-[9px] font-black text-enba-orange bg-enba-orange/10 border-none rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                <option value="current">Güncel (V{versions.length + 1}) · {new Date(plan.updatedAt || plan.createdAt).toLocaleDateString('tr-TR')}</option>
                {[...versions].map((v, i) => (
                  <option key={i} value={String(i)}>
                    V{i + 1} · {new Date(v.tarih).toLocaleDateString('tr-TR')}{v.not ? ` · ${v.not}` : ''}
                  </option>
                )).reverse()}
              </select>
              <span className="text-[9px] text-gray-300 font-black">{fmtDec(dispParams.aylikTon)} ton/ay</span>
              <button
                onClick={() => onVersionCompare(selectedVer === 'current' ? versions.length - 1 : selectedVer as number)}
                className="text-[9px] font-black text-gray-400 hover:text-blue-500 uppercase tracking-widest transition-colors"
              >
                Kıyasla ↔
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          title={aktif ? 'Pasife Al' : 'Aktifleştir'}
          className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all ${aktif ? 'bg-enba-orange text-white shadow-lg shadow-enba-orange/30' : 'bg-gray-100 text-gray-400 hover:bg-enba-orange/10 hover:text-enba-orange'}`}
        >
          {aktif ? <Play size={16} className="fill-white" /> : <Play size={16} />}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-px bg-gray-100">
        {[
          { label: 'Gelir', value: `₺${fmt(s.satisGeliri)}`, color: 'text-emerald-600' },
          { label: 'Gider', value: `₺${fmt(s.totalGider)}`, color: 'text-rose-500' },
          { label: 'FAVÖK', value: `₺${fmt(s.ebitda)}`, color: kpiColor(s.ebitda) },
          { label: 'Net Kâr', value: `₺${fmt(s.netKar)}`, color: kpiColor(s.netKar) },
        ].map((kpi, i) => (
          <div key={i} className="bg-white px-6 py-5">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">{kpi.label}</div>
            <div className={`text-base font-black tabular-nums ${kpi.color} leading-tight mt-1`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.ebitdaMarji >= 15 ? 'bg-emerald-100 text-emerald-700' : s.ebitdaMarji >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-rose-100 text-rose-700'}`}>
            EBITDA %{fmtDec(s.ebitdaMarji)}
          </div>
          {s.birimMaliyet > 0 && (
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest tabular-nums">
              ₺{fmt(s.birimMaliyet)}/ton
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} title="Düzenle" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-enba-dark transition-all">
            <Edit3 size={15} />
          </button>
          <button onClick={onCopy} title="Kopyala" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-enba-dark transition-all">
            <Copy size={15} />
          </button>
          <button onClick={onCompare} title={isSelectedForCompare ? 'Seçimi Kaldır' : 'Karşılaştır'}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isSelectedForCompare ? 'bg-blue-500 text-white' : 'hover:bg-blue-50 text-gray-400 hover:text-blue-500'}`}>
            {isSelectedForCompare ? <X size={15} /> : <Scale size={15} />}
          </button>
          <button onClick={onArchive} title="Arşivle" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-enba-dark transition-all">
            <Archive size={15} />
          </button>
          <button onClick={onDelete} title="Sil" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-all">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface ArşivProps {
  planlar: PlanCard[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  fmt: (n: number) => string;
  fmtDec: (n: number) => string;
}

export const ArşivBolumu: React.FC<ArşivProps> = ({ planlar, onRestore, onDelete, fmt, fmtDec }) => {
  const [acik, setAcik] = useState(false);
  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setAcik(v => !v)}
        className="w-full flex items-center justify-between px-8 py-5 hover:bg-gray-50/50 transition-colors">
        <div className="flex items-center gap-3">
          <Archive size={16} className="text-gray-400" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">
            Arşivlenmiş Planlar — {planlar.length} Kart
          </span>
        </div>
        {acik ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
      </button>
      {acik && (
        <div className="px-8 pb-8 space-y-3">
          {planlar.map(plan => {
            const s = plan.sonuc;
            return (
              <div key={plan.id} className="flex items-center gap-4 px-6 py-4 bg-gray-50 rounded-2xl opacity-70">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-sm text-gray-600 uppercase truncate">{plan.baslik}</span>
                    {plan.etiket && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-[9px] font-black uppercase tracking-widest rounded-full flex-shrink-0">
                        {plan.etiket}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-gray-400 font-medium">
                    {new Date(plan.createdAt).toLocaleDateString('tr-TR')} · {fmtDec(plan.params.aylikTon)} ton/ay · Net ₺{fmt(s.netKar)} · EBITDA %{fmtDec(s.ebitdaMarji)}
                  </div>
                </div>
                <button onClick={() => onRestore(plan.id)} title="Geri Al"
                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-all">
                  <ArchiveRestore size={15} />
                </button>
                <button onClick={() => onDelete(plan.id)} title="Kalıcı Sil"
                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-all">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
