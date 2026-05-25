import React, { useState, useMemo, useCallback } from 'react';
import {
  SCENARIOS, buildSeries, fmtTL,
  Product, FixedExpense, usePlanData,
} from './dpData';
import { cx, I } from './DPPrimitives';

interface Props { scenarioId: string }

export function WhatIfBar({ scenarioId }: Props) {
  const scen = SCENARIOS[scenarioId];
  const { products, fixedExpenses, periods, weeklyHorizon } = usePlanData();

  const [open,      setOpen]      = useState(false);
  const [wiPrices,  setWiPrices]  = useState<Record<string, number>>({});
  const [wiVolumes, setWiVolumes] = useState<Record<string, number>>({});
  const [wiExp,     setWiExp]     = useState<Record<string, number>>({});
  const [wiUP,      setWiUP]      = useState<Record<string, number>>({});
  const [wiQty,     setWiQty]     = useState<Record<string, number>>({});

  const hasChanges =
    Object.keys(wiPrices).length > 0 ||
    Object.keys(wiVolumes).length > 0 ||
    Object.keys(wiExp).length > 0;

  const modProducts = useMemo(() =>
    products.map(p => ({ ...p, price: wiPrices[p.id] ?? p.price, volume: wiVolumes[p.id] ?? p.volume })),
    [products, wiPrices, wiVolumes],
  );
  const modExpenses = useMemo(() =>
    fixedExpenses.map(e => ({ ...e, monthly: wiExp[e.id] ?? e.monthly })),
    [fixedExpenses, wiExp],
  );

  const baseSeries = useMemo(
    () => buildSeries(products, fixedExpenses, periods, scen, weeklyHorizon),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, fixedExpenses, periods, scenarioId, weeklyHorizon],
  );
  const wiSeries = useMemo(
    () => open ? buildSeries(modProducts, modExpenses, periods, scen, weeklyHorizon) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, modProducts, modExpenses, periods, scenarioId, weeklyHorizon],
  );

  const sumSeries = (s: typeof baseSeries) =>
    s.reduce((a, x) => ({ revenue: a.revenue + x.revenue, opex: a.opex + x.opex, ebitda: a.ebitda + x.ebitda, net: a.net + x.net }),
      { revenue: 0, opex: 0, ebitda: 0, net: 0 });

  const base = useMemo(() => sumSeries(baseSeries), [baseSeries]);
  const wi   = useMemo(() => wiSeries ? sumSeries(wiSeries) : null, [wiSeries]);
  const n    = baseSeries.length || 1;

  const delta = wi ? {
    revenue: (wi.revenue - base.revenue) / n,
    ebitda:  (wi.ebitda  - base.ebitda)  / n,
    net:     (wi.net     - base.net)     / n,
  } : null;

  const reset = useCallback(() => {
    setWiPrices({}); setWiVolumes({}); setWiExp({}); setWiUP({}); setWiQty({});
  }, []);

  const onExpChange = (id: string, v: number) =>
    setWiExp(p => ({ ...p, [id]: v }));

  const onUPChange = (e: FixedExpense, newUP: number) => {
    const qty = wiQty[e.id] ?? e.monthlyQty ?? 1;
    setWiUP(p => ({ ...p, [e.id]: newUP }));
    setWiExp(p => ({ ...p, [e.id]: newUP * qty }));
  };
  const onQtyChange = (e: FixedExpense, newQty: number) => {
    const up = wiUP[e.id] ?? e.unitPrice ?? (e.monthly / (e.monthlyQty || 1));
    setWiQty(p => ({ ...p, [e.id]: newQty }));
    setWiExp(p => ({ ...p, [e.id]: up * newQty }));
  };

  if (!products.length && !fixedExpenses.length) return null;

  return (
    <div className="flex-none border-t-2 border-enba-orange/30 bg-enba-panel shadow-[0_-4px_20px_rgba(0,0,0,0.18)]">

      {/* ── Daima görünür çubuk ─────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 h-12 cursor-pointer select-none hover:bg-enba-panel-2/50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span className="w-6 h-6 rounded-lg bg-enba-orange/15 text-enba-orange inline-flex items-center justify-center flex-none">
          <I.Sparkles size={13} />
        </span>
        <span className="text-[12.5px] font-semibold text-enba-text flex-none">Anlık Simülasyon</span>
        {hasChanges && (
          <span className="px-2 py-0.5 rounded-full bg-enba-orange text-white text-[10px] font-bold flex-none">AKTİF</span>
        )}
        {delta && hasChanges && (
          <>
            <DeltaChip label="Gelir/ay" value={delta.revenue} />
            <DeltaChip label="EBITDA/ay" value={delta.ebitda} />
            <DeltaChip label="Net/ay" value={delta.net} />
          </>
        )}
        <div className="flex-1" />
        {hasChanges && (
          <button
            className="text-[11px] text-enba-orange hover:underline flex-none"
            onClick={e => { e.stopPropagation(); reset(); }}
          >
            Sıfırla
          </button>
        )}
        <I.Chevron size={13} className={cx('flex-none transition-transform duration-200', open ? '' : 'rotate-180')} />
      </div>

      {/* ── Açılır panel ────────────────────────────────────────────────── */}
      <div className={cx(
        'grid grid-cols-3 divide-x divide-enba-line border-t border-enba-line overflow-hidden transition-[max-height] duration-300',
        open ? 'max-h-[292px]' : 'max-h-0',
      )}>

        {/* ── Col 1: Ürün Fiyatları & Hacimler ── */}
        <div className="overflow-y-auto p-4">
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-enba-muted font-semibold mb-3">
            Ürün Fiyatları &amp; Hacimler
          </p>
          {products.length === 0
            ? <p className="text-[11.5px] text-enba-dim">Gelir kalemi yok.</p>
            : products.map(p => (
              <div key={p.id} className="mb-4 pb-4 border-b border-enba-line/60 last:border-0 last:mb-0 last:pb-0">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: p.color }} />
                  <span className={cx(
                    'text-[11.5px] font-medium truncate flex-1',
                    (wiPrices[p.id] !== undefined || wiVolumes[p.id] !== undefined) ? 'text-enba-orange' : 'text-enba-text',
                  )}>
                    {p.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <WiField
                    label={`Fiyat ₺/${p.unit}`}
                    value={wiPrices[p.id] ?? p.price}
                    base={p.price}
                    step={500}
                    onChange={v => setWiPrices(pr => ({ ...pr, [p.id]: v }))}
                    onReset={() => setWiPrices(pr => { const n = { ...pr }; delete n[p.id]; return n; })}
                  />
                  <WiField
                    label={`Hacim ${p.unit}/ay`}
                    value={wiVolumes[p.id] ?? p.volume}
                    base={p.volume}
                    step={1}
                    decimals={1}
                    onChange={v => setWiVolumes(pr => ({ ...pr, [p.id]: v }))}
                    onReset={() => setWiVolumes(pr => { const n = { ...pr }; delete n[p.id]; return n; })}
                  />
                </div>
              </div>
            ))
          }
        </div>

        {/* ── Col 2: Gider Parametreleri ── */}
        <div className="overflow-y-auto p-4">
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-enba-muted font-semibold mb-3">
            Gider Parametreleri
          </p>
          {fixedExpenses.length === 0
            ? <p className="text-[11.5px] text-enba-dim">Gider kalemi yok.</p>
            : fixedExpenses.map(e => {
              const isElec      = e.mcode === 'M405' || e.mcode.startsWith('M405.');
              const isPersonnel = e.mcode === 'M489' || e.mcode.startsWith('M489.');
              const hasHelper   = (isElec || isPersonnel) && !!e.monthlyQty;

              const baseUP  = e.unitPrice ?? (e.monthlyQty ? e.monthly / e.monthlyQty : 0);
              const baseQty = e.monthlyQty ?? 1;
              const curUP   = wiUP[e.id]  ?? baseUP;
              const curQty  = wiQty[e.id] ?? baseQty;
              const curMth  = wiExp[e.id] ?? e.monthly;
              const isMod   = wiExp[e.id] !== undefined && Math.abs(wiExp[e.id] - e.monthly) > 0.5;

              return (
                <div key={e.id} className="mb-4 pb-4 border-b border-enba-line/60 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={cx(
                      'text-[9px] font-mono px-1 py-0.5 rounded border flex-none',
                      isMod ? 'bg-enba-orange/10 border-enba-orange/40 text-enba-orange' : 'bg-enba-panel-2 border-enba-line text-enba-orange',
                    )}>{e.mcode}</span>
                    <span className={cx('text-[11.5px] font-medium truncate flex-1', isMod ? 'text-enba-orange' : 'text-enba-text')}>
                      {e.name}
                    </span>
                  </div>

                  {hasHelper ? (
                    <div className="grid grid-cols-2 gap-2">
                      <WiField
                        label={isElec ? '₺/kWh' : '₺/kişi'}
                        value={curUP}
                        base={baseUP}
                        step={isElec ? 0.5 : 1000}
                        decimals={isElec ? 2 : 0}
                        onChange={v => onUPChange(e, v)}
                        onReset={() => {
                          setWiUP(p => { const n = { ...p }; delete n[e.id]; return n; });
                          setWiExp(p => { const n = { ...p }; delete n[e.id]; return n; });
                        }}
                      />
                      <WiField
                        label={isElec ? 'kWh/ay' : 'Kişi sayısı'}
                        value={curQty}
                        base={baseQty}
                        step={isElec ? 1000 : 1}
                        decimals={0}
                        onChange={v => onQtyChange(e, v)}
                        onReset={() => {
                          setWiQty(p => { const n = { ...p }; delete n[e.id]; return n; });
                          setWiExp(p => { const n = { ...p }; delete n[e.id]; return n; });
                        }}
                      />
                    </div>
                  ) : (
                    <WiField
                      label="₺ / ay"
                      value={curMth}
                      base={e.monthly}
                      step={1000}
                      wide
                      onChange={v => onExpChange(e.id, v)}
                      onReset={() => setWiExp(p => { const n = { ...p }; delete n[e.id]; return n; })}
                    />
                  )}
                </div>
              );
            })
          }
        </div>

        {/* ── Col 3: Etki Özeti ── */}
        <div className="p-4 flex flex-col">
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-enba-muted font-semibold mb-3">
            Etki Özeti (ort. / ay)
          </p>
          {!hasChanges ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4 gap-2">
              <div className="w-10 h-10 rounded-xl bg-enba-panel-2 border border-enba-line flex items-center justify-center">
                <I.Sparkles size={16} className="text-enba-dim" />
              </div>
              <p className="text-[11px] text-enba-dim leading-snug">
                Parametreleri değiştirerek<br />etkiyi anlık görün
              </p>
            </div>
          ) : wi ? (
            <div className="space-y-2">
              {([
                { label: 'Gelir',   baseV: base.revenue / n, wiV: wi.revenue / n, better: true  },
                { label: 'Gider',   baseV: base.opex    / n, wiV: wi.opex    / n, better: false },
                { label: 'EBITDA',  baseV: base.ebitda  / n, wiV: wi.ebitda  / n, better: true  },
                { label: 'Net Kâr', baseV: base.net     / n, wiV: wi.net     / n, better: true  },
              ] as const).map(row => {
                const diff = row.wiV - row.baseV;
                const pct  = row.baseV !== 0 ? diff / Math.abs(row.baseV) : 0;
                const good = row.better ? diff >= 0 : diff <= 0;
                return (
                  <div key={row.label} className="rounded-xl border border-enba-line bg-enba-panel-2/40 px-3 py-2">
                    <div className="text-[9.5px] text-enba-muted mb-1.5">{row.label} / ay</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] text-enba-dim tabular">{fmtTL(row.baseV, { compact: true })}</span>
                      <I.Chevron size={9} className="-rotate-90 text-enba-dim flex-none" />
                      <span className="text-[12px] font-semibold tabular flex-1">{fmtTL(row.wiV, { compact: true })}</span>
                      <span className={cx(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded tabular',
                        good ? 'bg-enba-green/15 text-enba-green' : 'bg-enba-red/15 text-enba-red',
                      )}>
                        {diff > 0 ? '+' : ''}{(pct * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
              <button
                onClick={reset}
                className="w-full mt-1 py-1.5 rounded-lg text-[11px] text-enba-muted hover:text-enba-orange hover:bg-enba-orange/8 transition-colors flex items-center justify-center gap-1.5"
              >
                <I.Refresh size={11} /> Tüm değişiklikleri sıfırla
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── DeltaChip ────────────────────────────────────────────────────────────────
const DeltaChip = ({ label, value }: { label: string; value: number }) => (
  <span className={cx(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tabular flex-none',
    value >= 0 ? 'bg-enba-green/15 text-enba-green' : 'bg-enba-red/15 text-enba-red',
  )}>
    {value > 0 ? '+' : ''}{fmtTL(value, { compact: true })}
    <span className="font-normal opacity-60">{label}</span>
  </span>
);

// ─── WiField ──────────────────────────────────────────────────────────────────
interface WiFieldProps {
  label: string;
  value: number;
  base: number;
  onChange: (v: number) => void;
  onReset: () => void;
  step?: number;
  decimals?: number;
  wide?: boolean;
}

const WiField = ({ label, value, base, onChange, onReset, step = 100, decimals = 0, wide }: WiFieldProps) => {
  const modified = Math.abs(value - base) > 0.001;
  const [focused, setFocused] = useState(false);
  const [draft,   setDraft]   = useState('');

  return (
    <div className={cx(wide ? 'col-span-2' : '')}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[9.5px] uppercase tracking-wide text-enba-dim leading-none">{label}</label>
        {modified && (
          <button onClick={onReset} className="text-[9px] text-enba-orange hover:underline leading-none">← baz</button>
        )}
      </div>
      <input
        type="number"
        step={step}
        min={0}
        value={focused ? draft : value.toFixed(decimals)}
        onFocus={() => { setFocused(true); setDraft(value.toFixed(decimals)); }}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          setFocused(false);
          const v = parseFloat(draft);
          if (!isNaN(v) && v >= 0) onChange(v);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') { const v = parseFloat(draft); if (!isNaN(v) && v >= 0) onChange(v); }
        }}
        className={cx(
          'w-full rounded-lg px-2.5 py-1.5 text-[12px] text-right outline-none border transition-colors tabular',
          modified
            ? 'bg-enba-orange/6 border-enba-orange/50 text-enba-orange focus:border-enba-orange'
            : 'bg-enba-panel-2 border-enba-line text-enba-text focus:border-enba-orange/60',
        )}
      />
    </div>
  );
};
