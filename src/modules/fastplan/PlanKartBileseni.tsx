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

  const stripColor = s.ebitdaMarji >= 15 ? 'bg-enba-green'
    : s.ebitdaMarji >= 5 ? 'bg-enba-amber'
    : s.ebitdaMarji > 0 ? 'bg-enba-red'
    : 'bg-enba-line-2';

  const marjPillCls = s.ebitdaMarji >= 15
    ? 'bg-enba-green/15 text-enba-green'
    : s.ebitdaMarji >= 5 ? 'bg-enba-amber/15 text-enba-amber'
    : 'bg-enba-red/15 text-enba-red';

  return (
    <div className={`bg-enba-panel rounded-xl border transition-all duration-200 overflow-hidden ${
      isSelectedForCompare
        ? 'border-enba-blue/60 shadow-sm shadow-enba-blue/10'
        : aktif
          ? 'border-enba-orange/50 shadow-sm shadow-enba-orange/10'
          : 'border-enba-line hover:border-enba-line-2'
    }`}>
      {/* Color strip */}
      <div className={`h-0.5 ${stripColor}`} />

      {/* Card header */}
      <div className={`px-5 py-4 ${aktif ? 'bg-enba-orange/5' : 'bg-enba-panel-2/40'} border-b border-enba-line flex items-start justify-between gap-3`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {aktif && <div className="w-1.5 h-1.5 rounded-full bg-enba-orange animate-pulse flex-shrink-0" />}
            <h3 className="font-semibold text-enba-text text-[13px] truncate">{plan.baslik}</h3>
          </div>
          {plan.etiket && (
            <span className="inline-flex items-center mt-0.5 mb-1 px-2 py-0.5 bg-enba-panel-2 border border-enba-line text-enba-muted text-[10px] font-medium uppercase tracking-[0.1em] rounded-full">
              {plan.etiket}
            </span>
          )}
          {plan.aciklama && (
            <p className="text-[11px] text-enba-muted truncate">{plan.aciklama}</p>
          )}
          {versions.length === 0 ? (
            <div className="text-[10px] text-enba-dim mt-1">
              {new Date(plan.createdAt).toLocaleDateString('tr-TR')} · {fmtDec(dispParams.aylikTon)} ton/ay
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <select
                value={selectedVer === 'current' ? 'current' : String(selectedVer)}
                onChange={e => setSelectedVer(e.target.value === 'current' ? 'current' : Number(e.target.value))}
                className="text-[10px] font-medium text-enba-orange bg-enba-orange/10 border border-enba-orange/20 rounded-md px-2 py-0.5 outline-none cursor-pointer"
              >
                <option value="current">Güncel (V{versions.length + 1}) · {new Date(plan.updatedAt || plan.createdAt).toLocaleDateString('tr-TR')}</option>
                {[...versions].map((v, i) => (
                  <option key={i} value={String(i)}>
                    V{i + 1} · {new Date(v.tarih).toLocaleDateString('tr-TR')}{v.not ? ` · ${v.not}` : ''}
                  </option>
                )).reverse()}
              </select>
              <span className="text-[10px] text-enba-dim">{fmtDec(dispParams.aylikTon)} ton/ay</span>
              <button
                onClick={() => onVersionCompare(selectedVer === 'current' ? versions.length - 1 : selectedVer as number)}
                className="text-[10px] font-medium text-enba-muted hover:text-enba-blue transition-colors"
              >
                Kıyasla ↔
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          title={aktif ? 'Pasife Al' : 'Aktifleştir'}
          className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg transition-all ${
            aktif
              ? 'bg-enba-orange text-white shadow-sm shadow-enba-orange/30'
              : 'bg-enba-panel-2 border border-enba-line text-enba-dim hover:border-enba-orange/40 hover:text-enba-orange'
          }`}
        >
          {aktif ? <Play size={15} className="fill-white" /> : <Play size={15} />}
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-enba-line">
        {[
          { label: 'Gelir',   value: `₺${fmt(s.satisGeliri)}`, color: 'text-enba-green' },
          { label: 'Gider',   value: `₺${fmt(s.totalGider)}`,  color: 'text-enba-red'   },
          { label: 'FAVÖK',   value: `₺${fmt(s.ebitda)}`,      color: kpiColor(s.ebitda) },
          { label: 'Net Kâr', value: `₺${fmt(s.netKar)}`,      color: kpiColor(s.netKar) },
        ].map((kpi, i) => (
          <div key={i} className="px-5 py-4">
            <div className="text-[10px] font-medium text-enba-muted uppercase tracking-[0.1em]">{kpi.label}</div>
            <div className={`text-[15px] font-semibold tabular ${kpi.color} leading-tight mt-0.5`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex items-center justify-between border-t border-enba-line">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-[0.08em] ${marjPillCls}`}>
            EBITDA %{fmtDec(s.ebitdaMarji)}
          </span>
          {s.birimMaliyet > 0 && (
            <span className="text-[10px] text-enba-dim tabular">
              ₺{fmt(s.birimMaliyet)}/ton
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={onEdit} title="Düzenle" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-enba-panel-2 text-enba-dim hover:text-enba-text transition-all">
            <Edit3 size={14} />
          </button>
          <button onClick={onCopy} title="Kopyala" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-enba-panel-2 text-enba-dim hover:text-enba-text transition-all">
            <Copy size={14} />
          </button>
          <button onClick={onCompare} title={isSelectedForCompare ? 'Seçimi Kaldır' : 'Karşılaştır'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
              isSelectedForCompare ? 'bg-enba-blue text-white' : 'hover:bg-enba-panel-2 text-enba-dim hover:text-enba-blue'
            }`}>
            {isSelectedForCompare ? <X size={14} /> : <Scale size={14} />}
          </button>
          <button onClick={onArchive} title="Arşivle" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-enba-panel-2 text-enba-dim hover:text-enba-text transition-all">
            <Archive size={14} />
          </button>
          <button onClick={onDelete} title="Sil" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-enba-red/10 text-enba-dim hover:text-enba-red transition-all">
            <Trash2 size={14} />
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
    <div className="bg-enba-panel border border-enba-line rounded-xl overflow-hidden">
      <button onClick={() => setAcik(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-enba-panel-2/60 transition-colors">
        <div className="flex items-center gap-3">
          <Archive size={15} className="text-enba-muted" />
          <span className="text-[11px] font-medium text-enba-muted uppercase tracking-[0.1em]">
            Arşivlenmiş Planlar — {planlar.length} Kart
          </span>
        </div>
        {acik ? <ChevronUp size={15} className="text-enba-dim" /> : <ChevronDown size={15} className="text-enba-dim" />}
      </button>
      {acik && (
        <div className="px-5 pb-5 space-y-2 border-t border-enba-line pt-3">
          {planlar.map(plan => {
            const s = plan.sonuc;
            return (
              <div key={plan.id} className="flex items-center gap-3 px-4 py-3 bg-enba-panel-2 border border-enba-line rounded-lg opacity-70 hover:opacity-90 transition-opacity">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-[13px] text-enba-text truncate">{plan.baslik}</span>
                    {plan.etiket && (
                      <span className="px-1.5 py-0.5 bg-enba-panel border border-enba-line text-enba-dim text-[10px] font-medium uppercase rounded-full flex-shrink-0">
                        {plan.etiket}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-enba-dim">
                    {new Date(plan.createdAt).toLocaleDateString('tr-TR')} · {fmtDec(plan.params.aylikTon)} ton/ay · Net ₺{fmt(s.netKar)} · EBITDA %{fmtDec(s.ebitdaMarji)}
                  </div>
                </div>
                <button onClick={() => onRestore(plan.id)} title="Geri Al"
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-enba-green/10 text-enba-dim hover:text-enba-green transition-all">
                  <ArchiveRestore size={14} />
                </button>
                <button onClick={() => onDelete(plan.id)} title="Kalıcı Sil"
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-enba-red/10 text-enba-dim hover:text-enba-red transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
