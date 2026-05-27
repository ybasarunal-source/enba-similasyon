/**
 * PnLPanel — Tam P&L hiyerarşisi paneli (Shell sekme 1, varsayılan)
 *
 * Tüm M-kodları her zaman görünür:
 *   ✅  Dolu/Hesaplanan — değer var
 *   ⬜  Boş            — girilmemiş (sarı uyarı)
 *   ~~  N/A            — kullanıcı "bu planda yok" dedi (soluk)
 */
import React, { useState, useMemo, useCallback } from 'react';
import { cx, I, Badge } from './DPPrimitives';
import {
  DPlan, FixedExpense,
  calcProductionResults,
  fmtTL,
  PlanMCodeEntry, PlanMCodeStatus,
  usePlanData,
} from './dpData';
import {
  buildPnLRows, PNL_SECTIONS, PNL_MILESTONE_MCODES,
} from './pnlStructure';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PnLPanelProps {
  plan?:   DPlan;
  onSave?: (p: DPlan) => void;
  scenarioId?: string;
}

// ─── Ana bileşen ─────────────────────────────────────────────────────────────

export function PnLPanel({ plan, onSave }: PnLPanelProps) {
  const { facilityExpenses, fixedExpenses } = usePlanData();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showNA, setShowNA] = useState(false);

  // Toplam tesis giderleri (CostCenter'dan gelen)
  const ccExpenses: FixedExpense[] = facilityExpenses;

  // ProductionCalcResult — plan.productionModel varsa hesapla
  const calc = useMemo(() => {
    if (!plan?.productionModel) return null;
    return calcProductionResults(plan.productionModel);
  }, [plan?.productionModel]);

  const mcodeEntries: PlanMCodeEntry[] = plan?.mcodeEntries ?? [];

  // Tam P&L satır listesi
  const allRows = useMemo(
    () => buildPnLRows(calc, mcodeEntries, ccExpenses),
    [calc, mcodeEntries, ccExpenses],
  );

  // Satır bazlı monthly değer — subtotal satırları için bölüm toplamını hesapla
  const computedRows = useMemo(() => {
    const monthly: Record<string, number> = {};
    const rows = allRows;

    // 1. pass: item satırlarını doldur
    for (const r of rows) {
      if (r.type === 'item') monthly[r.mcode] = r.monthly;
    }

    // 2. pass: subtotal satırlarını bölümün item'ları üzerinden hesapla
    for (const section of PNL_SECTIONS) {
      let sectionTotal = 0;
      for (const item of section.items) {
        const val = monthly[item.mcode] ?? 0;
        sectionTotal += item.isExpense ? -val : val;
      }
      if (section.subtotalMcode) {
        monthly[section.subtotalMcode] = sectionTotal;
      }
    }

    // Milestone değerleri (EBITDA, EBIT, NET KAR vb.) — birikmeli hesap
    // ÖNEMLİ: Section subtotal'lar zaten işaretli (giderler negatif, gelirler pozitif).
    // Doğrudan toplanır — ek çarpma gerekmez.
    const m179 = monthly['M179'] ?? 0;  // Net Satışlar (pozitif)
    const m249 = monthly['M249'] ?? 0;  // Satış Giderleri (negatif)
    const m299 = m179 + m249;           // NET GELİR
    monthly['M299'] = m299;

    const m369 = monthly['M369'] ?? 0;  // Malzeme (negatif)
    const m399 = m299 + m369;           // BRÜT KATKI PAYI
    monthly['M399'] = m399;

    // m419, m489, m689 zaten negatif (gider section toplamları) — doğrudan topla
    const m419 = monthly['M419'] ?? 0;  // Enerji (negatif)
    const m489 = monthly['M489'] ?? 0;  // Personel (negatif)
    const m689 = monthly['M689'] ?? 0;  // Genel Gider (negatif)
    // BAKIM & ÇEVRE: pnlStructure'da subtotalMcode='' olduğu için section toplamına dahil değil
    // monthly['M509'] ve monthly['M529'] raw pozitif değerler → elle eksi yap
    const bakimCevre = (monthly['M509'] ?? 0) + (monthly['M529'] ?? 0);
    const m739 = monthly['M739'] ?? 0;  // Diğer Faaliyet Gelirleri (pozitif)
    const ebitda = m399 + m419 + m489 + m689 - bakimCevre + m739;
    monthly['M769'] = ebitda;

    // m789 zaten negatif (amortisman section toplamı) — doğrudan topla
    const m789 = monthly['M789'] ?? 0;  // Amortisman (negatif)
    monthly['M799'] = ebitda + m789;    // EBIT = EBITDA − amortisman

    const m869 = monthly['M869'] ?? 0;  // Net Finansman (işaretli)
    const m879 = monthly['M799'] + m869; // Olağan Faaliyet Kârı
    monthly['M879'] = m879;

    const m889 = monthly['M889'] ?? 0;  // Olağandışı (işaretli)
    const ebt = m879 + m889;
    monthly['M899'] = ebt;

    const vergi = ebt > 0 ? ebt * 0.22 : 0;
    monthly['M909'] = -vergi;
    monthly['M919'] = ebt - vergi;
    monthly['M999'] = monthly['M919'];

    return { monthly };
  }, [allRows]);

  const getValue = (mcode: string) => computedRows.monthly[mcode] ?? 0;

  const toggleSection = (id: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Inline edit: mcodeEntry güncelle ve plan'a kaydet
  const updateEntry = useCallback((mcode: string, patch: Partial<PlanMCodeEntry>) => {
    if (!plan || !onSave) return;
    const existing = plan.mcodeEntries ?? [];
    const has = existing.some(e => e.mcode === mcode);
    const updated: PlanMCodeEntry[] = has
      ? existing.map(e => e.mcode === mcode ? { ...e, ...patch } : e)
      : [...existing, { mcode, status: 'filled', monthly: 0, ...patch }];
    onSave({ ...plan, mcodeEntries: updated });
  }, [plan, onSave]);

  // Özet metrikler
  const summary = useMemo(() => {
    const m = computedRows.monthly;
    const rev    = m['M179'] ?? 0;
    const ebitda = m['M769'] ?? 0;
    const ebit   = m['M799'] ?? 0;
    const netKar = m['M919'] ?? 0;
    const margin = rev > 0 ? (ebitda / rev * 100) : 0;
    return { rev, ebitda, ebit, netKar, margin };
  }, [computedRows]);

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-full text-enba-dim text-[13px]">
        Plan seçilmedi
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Özet kartları ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Net Satışlar" value={fmtTL(summary.rev, { compact: true })} sub="M179 / ay" color="green" />
        <MetricCard label="EBITDA" value={fmtTL(summary.ebitda, { compact: true, sign: true })}
          sub={`%${summary.margin.toFixed(1)} marj`}
          color={summary.ebitda >= 0 ? 'orange' : 'red'} />
        <MetricCard label="EBIT" value={fmtTL(summary.ebit, { compact: true, sign: true })}
          sub="amortisman sonrası" color={summary.ebit >= 0 ? 'blue' : 'red'} />
        <MetricCard label="Net Kâr" value={fmtTL(summary.netKar, { compact: true, sign: true })}
          sub="vergi sonrası" color={summary.netKar >= 0 ? 'green' : 'red'} />
      </div>

      {/* ── Filtre araç çubuğu ── */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-enba-dim uppercase tracking-wider">Görünüm</span>
        <button
          onClick={() => setShowNA(!showNA)}
          className={cx(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11.5px] font-medium transition-colors',
            showNA
              ? 'border-enba-orange/50 bg-enba-orange/10 text-enba-orange'
              : 'border-enba-line text-enba-muted hover:text-enba-text',
          )}
        >
          N/A göster
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-[11px] text-enba-dim">
          <span className="w-2.5 h-2.5 rounded-full bg-enba-orange/70 inline-block" /> Otomatik
          <span className="w-2.5 h-2.5 rounded-full bg-enba-panel-2 border border-enba-line inline-block ml-2" /> Manuel
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50 inline-block ml-2" /> Girilmemiş
        </div>
      </div>

      {/* ── P&L Tablosu ── */}
      <div className="bg-enba-panel border border-enba-line rounded-2xl overflow-hidden">
        {/* Tablo başlığı */}
        <div className="grid grid-cols-[auto_1fr_160px_120px] gap-0 bg-enba-panel-2/60 border-b border-enba-line px-4 py-2">
          <span className="text-[10px] uppercase tracking-wider text-enba-dim w-20">M-Kodu</span>
          <span className="text-[10px] uppercase tracking-wider text-enba-dim">Kalem</span>
          <span className="text-[10px] uppercase tracking-wider text-enba-dim text-right">Aylık Ortalama</span>
          <span className="text-[10px] uppercase tracking-wider text-enba-dim text-right">Yıllık</span>
        </div>

        {/* Bölümler */}
        {PNL_SECTIONS.map(section => {
          const isCollapsed = collapsedSections.has(section.id);
          const sectionItems = allRows.filter(r => r.sectionId === section.id && r.type === 'item');
          const visibleItems = showNA ? sectionItems : sectionItems.filter(r => {
            const e = mcodeEntries.find(me => me.mcode === r.mcode);
            return e?.status !== 'na';
          });

          return (
            <div key={section.id} className={cx('border-b border-enba-line last:border-0', `border-l-2 ${section.colorCls}`)}>
              {/* Bölüm başlığı */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-enba-panel-2/50 transition-colors"
              >
                <I.Chevron size={10} className={cx('text-enba-dim flex-none transition-transform', isCollapsed ? '-rotate-90' : '')} />
                <span className="text-[11.5px] font-semibold text-enba-text uppercase tracking-wide flex-1 text-left">
                  {section.label}
                </span>
                {section.subtotalMcode && (
                  <MilestoneValue
                    mcode={section.subtotalMcode}
                    value={getValue(section.subtotalMcode)}
                  />
                )}
              </button>

              {/* Kalemler */}
              {!isCollapsed && visibleItems.map(row => {
                const entry      = mcodeEntries.find(e => e.mcode === row.mcode);
                const val        = getValue(row.mcode);
                const isNA       = entry?.status === 'na';
                const isCalc     = row.status === 'calculated';
                const isEmpty    = !isNA && !isCalc && val === 0;
                const isMilestone = PNL_MILESTONE_MCODES.has(row.mcode);

                if (isNA && !showNA) return null;
                if (isMilestone) return null; // milestone'lar bölüm başlığında gösterilir

                return (
                  <PnLRow
                    key={row.mcode}
                    mcode={row.mcode}
                    label={row.label}
                    level={row.level}
                    value={val}
                    isExpense={row.isExpense}
                    isNA={isNA}
                    isEmpty={isEmpty}
                    isCalc={isCalc}
                    editable={row.editable && !!onSave}
                    onUpdate={patch => updateEntry(row.mcode, patch)}
                  />
                );
              })}

              {/* Ara toplam satırı */}
              {!isCollapsed && section.subtotalMcode && (
                <SubtotalRow
                  label={`${section.label} Toplamı`}
                  mcode={section.subtotalMcode}
                  value={getValue(section.subtotalMcode)}
                />
              )}
            </div>
          );
        })}

        {/* Milestone toplamlar — EBITDA, EBIT, NET KAR */}
        <div className="bg-enba-panel-2/30 px-4 py-3 flex flex-col gap-1.5">
          {[
            { mcode: 'M769', label: 'EBITDA' },
            { mcode: 'M799', label: 'EBIT (Faiz ve Amortisman Öncesi)' },
            { mcode: 'M879', label: 'OLAĞAN FAALİYET KARI' },
            { mcode: 'M899', label: 'VERGİ ÖNCESİ KAR (EBT)' },
            { mcode: 'M919', label: 'NET KAR' },
          ].map(({ mcode, label }) => {
            const val = getValue(mcode);
            return (
              <div key={mcode} className={cx(
                'flex items-center justify-between px-3 py-2 rounded-xl border',
                mcode === 'M919'
                  ? 'bg-enba-panel border-enba-orange/30 font-bold'
                  : mcode === 'M769'
                  ? 'bg-enba-orange/5 border-enba-orange/20'
                  : 'bg-enba-panel border-enba-line',
              )}>
                <div>
                  <span className="text-[10px] font-mono text-enba-dim mr-2">{mcode}</span>
                  <span className={cx('text-[12.5px] font-semibold', mcode === 'M919' ? 'text-enba-text' : 'text-enba-muted')}>
                    {label}
                  </span>
                </div>
                <div className="text-right">
                  <span className={cx(
                    'text-[13px] font-semibold tabular-nums',
                    val >= 0 ? (mcode === 'M769' ? 'text-enba-orange' : 'text-enba-green') : 'text-red-400',
                  )}>
                    {fmtTL(val, { compact: true, sign: true })}
                  </span>
                  <span className="text-[10.5px] text-enba-dim ml-1">/ay</span>
                  <div className="text-[10px] text-enba-dim">
                    {fmtTL(val * 12, { compact: true, sign: true })}/yıl
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Alt bileşenler ───────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string;
  color: 'green' | 'red' | 'orange' | 'blue' | 'neutral';
}) {
  const colors = {
    green:   'text-enba-green',
    red:     'text-red-400',
    orange:  'text-enba-orange',
    blue:    'text-blue-400',
    neutral: 'text-enba-muted',
  };
  return (
    <div className="bg-enba-panel border border-enba-line rounded-xl px-4 py-3">
      <div className="text-[11px] text-enba-dim mb-1">{label}</div>
      <div className={cx('text-[17px] font-semibold tabular-nums', colors[color])}>{value}</div>
      {sub && <div className="text-[10.5px] text-enba-dim mt-0.5">{sub}</div>}
    </div>
  );
}

function MilestoneValue({ mcode, value }: { mcode: string; value: number }) {
  return (
    <div className="flex items-center gap-2 flex-none">
      <span className="text-[9.5px] font-mono text-enba-dim">{mcode}</span>
      <span className={cx(
        'text-[12px] font-semibold tabular-nums',
        value >= 0 ? 'text-enba-green' : 'text-red-400',
      )}>
        {value !== 0 ? fmtTL(value, { compact: true, sign: true }) : '—'}
      </span>
      <span className="text-[10px] text-enba-dim">/ay</span>
    </div>
  );
}

function SubtotalRow({ label, mcode, value }: { label: string; mcode: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-enba-panel-2/30 border-t border-enba-line/50">
      <div className="flex items-center gap-2">
        <span className="text-[9.5px] font-mono text-enba-dim">{mcode}</span>
        <span className="text-[11.5px] font-semibold text-enba-muted">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cx(
          'text-[12px] font-semibold tabular-nums',
          value >= 0 ? 'text-enba-text' : 'text-red-400',
        )}>
          {value !== 0 ? fmtTL(value, { compact: true }) : '—'}
        </span>
        <span className="text-[10px] text-enba-dim w-8">/ay</span>
      </div>
    </div>
  );
}

function PnLRow({ mcode, label, level, value, isExpense, isNA, isEmpty, isCalc, editable, onUpdate }: {
  mcode:     string;
  label:     string;
  level:     0 | 1 | 2;
  value:     number;
  isExpense: boolean;
  isNA:      boolean;
  isEmpty:   boolean;
  isCalc:    boolean;
  editable:  boolean;
  onUpdate:  (patch: Partial<PlanMCodeEntry>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  const pl = level === 2 ? 'pl-12' : level === 1 ? 'pl-8' : 'pl-4';

  const commitEdit = () => {
    onUpdate({ monthly: draft, status: 'filled' });
    setEditing(false);
  };

  return (
    <div className={cx(
      'group grid grid-cols-[auto_1fr_160px_120px] gap-0 px-4 items-center transition-colors',
      isNA      ? 'opacity-35 bg-transparent' :
      isEmpty   ? 'bg-amber-500/4 hover:bg-amber-500/8' :
                  'hover:bg-enba-panel-2/40',
      'py-[5px]',
    )}>
      {/* M-kodu */}
      <div className="w-20 flex-none">
        <span className={cx(
          'text-[9.5px] font-mono px-1.5 py-0.5 rounded',
          isCalc ? 'bg-enba-orange/15 text-enba-orange' :
          isEmpty ? 'bg-amber-500/15 text-amber-400' :
          'bg-enba-panel-2 text-enba-dim',
        )}>
          {mcode}
        </span>
      </div>

      {/* Açıklama */}
      <div className={cx('min-w-0 flex items-center gap-2', pl)}>
        <span className={cx(
          'text-[12px] truncate',
          isNA    ? 'line-through text-enba-dim' :
          isEmpty ? 'text-amber-300' :
                    'text-enba-muted',
        )}>
          {label}
        </span>
        {isCalc && <Badge tone="orange">otom.</Badge>}
        {isEmpty && <span className="text-[9.5px] text-amber-500/70">⚠ girilmemiş</span>}
      </div>

      {/* Aylık değer */}
      <div className="text-right flex items-center justify-end gap-2">
        {editable && !isNA && !isCalc ? (
          editing ? (
            <input
              type="number"
              autoFocus
              value={draft || ''}
              placeholder="0"
              step={1000}
              onChange={e => setDraft(Number(e.target.value) || 0)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
              className="w-28 text-right px-2 py-0.5 rounded border border-enba-orange/50 bg-enba-panel text-[12px] text-enba-text outline-none"
            />
          ) : (
            <button
              onClick={() => { setDraft(value); setEditing(true); }}
              className={cx(
                'text-[12px] tabular-nums hover:text-enba-orange transition-colors',
                isEmpty ? 'text-amber-400/60 italic' : isExpense ? 'text-red-400/70' : 'text-enba-text/70',
              )}
            >
              {isEmpty ? '— gir' : fmtTL(Math.abs(value), { compact: true })}
            </button>
          )
        ) : (
          <span className={cx(
            'text-[12px] tabular-nums',
            isNA    ? 'text-enba-dim' :
            isEmpty ? 'text-amber-400/40 italic' :
            isExpense && value !== 0 ? 'text-red-400/70' :
            value > 0 ? 'text-enba-text/80' : 'text-enba-dim',
          )}>
            {isNA ? 'N/A' : isEmpty ? '—' : (isExpense ? '- ' : '') + fmtTL(value, { compact: true })}
          </span>
        )}

        {/* N/A toggle */}
        {editable && !isCalc && (
          <button
            onClick={() => onUpdate({ status: isNA ? 'empty' : 'na', monthly: 0 })}
            title={isNA ? 'Aktife al' : 'Bu planda yok (N/A)'}
            className={cx(
              'text-[9.5px] px-1.5 py-0.5 rounded border transition-colors flex-none opacity-0 group-hover:opacity-100',
              isNA ? 'border-enba-line text-enba-dim' : 'border-enba-line text-enba-dim hover:border-amber-500/40 hover:text-amber-400',
            )}
          >
            {isNA ? '↩' : 'N/A'}
          </button>
        )}
      </div>

      {/* Yıllık değer */}
      <div className="text-right">
        <span className={cx(
          'text-[11.5px] tabular-nums text-enba-dim',
          isNA || isEmpty ? 'opacity-30' : '',
        )}>
          {isNA || isEmpty ? '—' : fmtTL(Math.abs(value) * 12, { compact: true })}
        </span>
      </div>
    </div>
  );
}
