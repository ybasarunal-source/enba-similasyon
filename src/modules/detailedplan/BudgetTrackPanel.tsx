import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts';
import {
  cx, useChartColors, xInterval, I, Card, SectionTitle, Badge, Btn, Select, Variance,
} from './DPPrimitives';
import {
  SCENARIOS,
  bvaForPeriod, revenueFor, varCostFor, fixedCostFor,
  actualRevenueFor, actualVarCostFor, actualFixedCostFor,
  fmtTL, Scenario, usePlanData, PlanActuals,
} from './dpData';

/* ─── BudgetTrackPanel ─── */
interface BudgetTrackPanelProps {
  scenarioId: string;
  periodGranularity: string;
}

export function BudgetTrackPanel({ scenarioId }: BudgetTrackPanelProps) {
  const scen = SCENARIOS[scenarioId];
  const cc = useChartColors();
  const { products, fixedExpenses, periods, actualsThrough, actuals, onActualChange } = usePlanData();
  const [periodIdx, setPeriodIdx] = useState(Math.max(0, actualsThrough - 1));
  const [modalOpen, setModalOpen] = useState(false);

  const ytd = useMemo(() => {
    let bRev = 0, aRev = 0, bOp = 0, aOp = 0, bEb = 0, aEb = 0;
    for (let i = 0; i < actualsThrough; i++) {
      const bva = bvaForPeriod(i, scen, products, fixedExpenses, actualsThrough, actuals);
      bRev += bva.budget.revenue; bOp += bva.budget.opex; bEb += bva.budget.ebitda;
      aRev += bva.actual.revenue; aOp += bva.actual.opex; aEb += bva.actual.ebitda;
    }
    return { bRev, aRev, bOp, aOp, bEb, aEb };
  }, [scen, products, fixedExpenses, actualsThrough, actuals]);

  const sel = useMemo(() => bvaForPeriod(periodIdx, scen, products, fixedExpenses, actualsThrough, actuals), [periodIdx, scen, products, fixedExpenses, actualsThrough, actuals]);

  const trendData = useMemo(() => {
    const out = [];
    for (let i = 0; i < Math.min(24, periods.length); i++) {
      const bva = bvaForPeriod(i, scen, products, fixedExpenses, actualsThrough, actuals);
      out.push({
        label: periods[i].label,
        budget: bva.budget.revenue,
        actual: bva.hasActual ? bva.actual.revenue : null,
        budgetEbitda: bva.budget.ebitda,
        actualEbitda: bva.hasActual ? bva.actual.ebitda : null,
        isForecast: !bva.hasActual,
      });
    }
    return out;
  }, [scen, products, fixedExpenses, periods, actualsThrough, actuals]);

  return (
    <div className="space-y-5">
      {/* Period header */}
      <Card className="!p-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-muted">Karşılaştırma Dönemi</div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setPeriodIdx(Math.max(0, periodIdx - 1))}
                className="w-7 h-7 rounded-md border border-enba-line bg-enba-panel-2 hover:bg-enba-line text-enba-muted hover:text-enba-text inline-flex items-center justify-center"
              >
                <I.Chevron size={13} className="rotate-90" />
              </button>
              <div className="text-[15px] font-semibold tabular px-2 min-w-[100px] text-center">
                {periods[periodIdx]?.label}
              </div>
              <button
                onClick={() => setPeriodIdx(Math.min(actualsThrough - 1, periodIdx + 1))}
                disabled={periodIdx >= actualsThrough - 1}
                className="w-7 h-7 rounded-md border border-enba-line bg-enba-panel-2 hover:bg-enba-line text-enba-muted hover:text-enba-text inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <I.Chevron size={13} className="-rotate-90" />
              </button>
            </div>
          </div>
          <div className="h-10 w-px bg-enba-line" />
          <div className="flex-1">
            <PeriodScrubber selected={periodIdx} onSelect={setPeriodIdx} />
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-muted">Veri Durumu</div>
              <div className="mt-1 flex items-center gap-1.5">
                <Badge tone="green"><span className="w-1.5 h-1.5 rounded-full bg-enba-green inline-block mr-1" />Kapanmış</Badge>
                <span className="text-[10.5px] text-enba-dim">{actualsThrough} dönem aktif</span>
              </div>
            </div>
            <Btn
              variant="primary"
              size="sm"
              icon={<I.Edit size={12} />}
              onClick={() => setModalOpen(true)}
            >
              Aktüel Gir
            </Btn>
          </div>
        </div>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <BvaKpi
          title="Gelir"
          budget={sel.budget.revenue}
          actual={sel.actual.revenue}
          higherIsBetter
          icon={<I.Revenue size={14} />}
        />
        <BvaKpi
          title="Toplam Gider"
          budget={sel.budget.opex}
          actual={sel.actual.opex}
          higherIsBetter={false}
          icon={<I.Expense size={14} />}
        />
        <BvaKpi
          title="EBITDA"
          budget={sel.budget.ebitda}
          actual={sel.actual.ebitda}
          higherIsBetter
          icon={<I.Sparkles size={14} />}
        />
      </div>

      {/* Trend chart */}
      <Card padded={false}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">Aylık Eğilim</div>
            <h3 className="text-base font-semibold">Gelir · Bütçe vs Gerçekleşen</h3>
          </div>
          <div className="flex items-center gap-3 text-[10.5px] text-enba-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-[2px] inline-block border-t-2 border-dashed border-enba-orange/50" />
              Bütçe
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-[2px] bg-enba-orange inline-block" />
              Gerçekleşen
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-enba-line-2/50 inline-block" />
              Projeksiyon
            </span>
          </div>
        </div>
        <div className="h-[260px] px-2 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="bvaActGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#E35205" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#E35205" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} interval={xInterval(periods.length)} tick={{ fontSize: 10, fill: cc.muted }} />
              <YAxis tickFormatter={(v) => (v / 1_000_000).toFixed(1) + 'M'} tickLine={false} axisLine={false} width={48} tick={{ fontSize: 10, fill: cc.muted }} />
              <ReferenceLine
                x={periods[actualsThrough - 1]?.label}
                stroke="#5B9DFF"
                strokeDasharray="3 3"
                label={{ value: 'Bugün', position: 'top', fill: '#5B9DFF', fontSize: 10 }}
              />
              <Tooltip
                formatter={(v: unknown, k?: unknown) => [v == null ? '—' : fmtTL(v as number), k === 'budget' ? 'Bütçe' : 'Gerçekleşen'] as [string, string]}
                contentStyle={{ background: cc.panelBg, border: `1px solid ${cc.grid}`, borderRadius: 8, fontSize: 11 }}
              />
              <Area type="monotone" dataKey="actual" stroke="#E35205" strokeWidth={2.5} fill="url(#bvaActGrad)" connectNulls={false} name="Gerçekleşen" />
              <Line type="monotone" dataKey="budget" stroke="#E35205" strokeOpacity={0.55} strokeWidth={1.6} strokeDasharray="5 4" dot={false} name="Bütçe" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* YTD summary */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">
              Yıl Başından Bugüne (YTD) · {actualsThrough} ay
            </div>
            <h3 className="text-base font-semibold">Kümülatif Bütçe vs Gerçekleşen</h3>
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="outline" size="sm" icon={<I.Filter size={12} />}>Filtre</Btn>
            <Btn variant="outline" size="sm" icon={<I.Pdf size={12} />}>Dışa Aktar</Btn>
          </div>
        </div>
        <YtdComparisonBars
          rows={[
            { label: 'Gelir',        budget: ytd.bRev, actual: ytd.aRev, higherIsBetter: true,  color: '#E35205' },
            { label: 'Toplam Gider', budget: ytd.bOp,  actual: ytd.aOp,  higherIsBetter: false, color: '#F2A93B' },
            { label: 'EBITDA',       budget: ytd.bEb,  actual: ytd.aEb,  higherIsBetter: true,  color: '#3DBE7C' },
          ]}
        />
      </Card>

      {/* Line item drill-down */}
      <Card padded={false}>
        <div className="px-5 py-3 border-b border-enba-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-semibold">Kalem Bazlı Sapma Analizi</h4>
            <span className="text-[11px] text-enba-dim">· {periods[periodIdx]?.label}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Badge tone="green">İyi: {'>'}%0</Badge>
            <Badge tone="amber">Dikkat: −5%..0%</Badge>
            <Badge tone="red">Kritik: {'<'}−5%</Badge>
          </div>
        </div>
        <LineItemTable periodIdx={periodIdx} scen={scen} />
      </Card>

      {/* Heatmap */}
      <Card>
        <SectionTitle
          eyebrow="Sapma haritası"
          title="Ay × Kategori Sapma Yoğunluğu"
          action={<span className="text-[10.5px] text-enba-dim">Yeşil = bütçenin altında/üstünde (iyi), kırmızı = bütçenin sapmış (kötü)</span>}
        />
        <VarianceHeatmap scen={scen} actuals={actuals} />
      </Card>

      {/* Aktüel Veri Giriş Modalı */}
      {modalOpen && (
        <ActualEntryModal
          periodIdx={periodIdx}
          periods={periods}
          products={products}
          fixedExpenses={fixedExpenses}
          scen={scen}
          actuals={actuals}
          actualsThrough={actualsThrough}
          onSave={(newActuals, newThrough) => {
            onActualChange(newActuals, newThrough);
            setModalOpen(false);
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

/* ─── PeriodScrubber ─── */
interface PeriodScrubberProps {
  selected: number;
  onSelect: (i: number) => void;
}

function PeriodScrubber({ selected, onSelect }: PeriodScrubberProps) {
  const { periods, actualsThrough } = usePlanData();
  return (
    <div className="flex items-stretch gap-0.5 mt-3">
      {periods.slice(0, 24).map((p, i) => {
        const isActual = i < actualsThrough;
        const isSel = i === selected;
        const isStartOfYear = p.m === 0;
        return (
          <button
            key={p.key}
            onClick={() => isActual && onSelect(i)}
            disabled={!isActual}
            title={p.label}
            className={cx(
              'group flex-1 h-9 rounded-sm transition-all relative',
              isActual ? 'cursor-pointer' : 'cursor-not-allowed',
              isSel
                ? 'bg-enba-orange'
                : isActual
                  ? 'bg-enba-green/30 hover:bg-enba-green/60'
                  : 'bg-enba-panel-2 border border-dashed border-enba-line',
            )}
          >
            {isStartOfYear && (
              <span className="absolute -top-3 left-0 text-[9px] text-enba-dim whitespace-nowrap">{p.y}</span>
            )}
            {isSel && (
              <span className="absolute inset-x-0 -bottom-3 text-[9px] text-enba-orange font-medium text-center">{p.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── BvaKpi ─── */
type Tone = 'green' | 'amber' | 'red';

const TONE_CLASSES: Record<Tone, { text: string; bg: string; border: string; bar: string }> = {
  green: { text: 'text-enba-green', bg: 'bg-enba-green/10', border: 'border-enba-green/30', bar: 'bg-enba-green' },
  amber: { text: 'text-enba-amber', bg: 'bg-enba-amber/10', border: 'border-enba-amber/30', bar: 'bg-enba-amber' },
  red:   { text: 'text-enba-red',   bg: 'bg-enba-red/10',   border: 'border-enba-red/30',   bar: 'bg-enba-red'   },
};

interface BvaKpiProps {
  title: string;
  budget: number;
  actual: number;
  higherIsBetter: boolean;
  icon: React.ReactNode;
}

function BvaKpi({ title, budget, actual, higherIsBetter, icon }: BvaKpiProps) {
  const diff = actual - budget;
  const pct  = budget !== 0 ? diff / budget : 0;
  const positive = higherIsBetter ? diff >= 0 : diff <= 0;
  const tone: Tone = positive ? 'green' : Math.abs(pct) < 0.05 ? 'amber' : 'red';
  const t = TONE_CLASSES[tone];
  const ratio = Math.min(1.6, Math.max(0, actual / (budget || 1)));

  return (
    <div className={cx('bg-enba-panel border rounded-xl p-5', t.border)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[12px] font-medium text-enba-muted">
          {icon}
          <span>{title}</span>
        </div>
        <span className={cx('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium tabular', t.bg, t.text)}>
          {positive ? <I.Up size={11} /> : <I.Down size={11} />}
          {(pct > 0 ? '+' : '') + (pct * 100).toFixed(1) + '%'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-enba-dim mb-1">Bütçe</div>
          <div className="text-[18px] font-semibold tabular text-enba-text leading-none">{fmtTL(budget)}</div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-enba-dim mb-1">Gerçekleşen</div>
          <div className={cx('text-[18px] font-semibold tabular leading-none', t.text)}>{fmtTL(actual)}</div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-14 text-[10px] text-enba-dim uppercase tracking-wider">Bütçe</span>
          <div className="flex-1 h-1.5 bg-enba-panel-2 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-enba-line-2" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-14 text-[10px] text-enba-dim uppercase tracking-wider">Gerçek.</span>
          <div className="flex-1 h-1.5 bg-enba-panel-2 rounded-full overflow-hidden">
            <div className={cx('h-full rounded-full', t.bar)} style={{ width: Math.min(100, ratio * 100 / 1.6) + '%' }} />
          </div>
        </div>
      </div>

      <div className="mt-2 text-[10.5px] text-enba-dim tabular">
        Fark <span className={cx('font-medium', t.text)}>{fmtTL(diff, { sign: true })}</span>
      </div>
    </div>
  );
}

/* ─── YtdComparisonBars ─── */
interface YtdRow {
  label: string;
  budget: number;
  actual: number;
  higherIsBetter: boolean;
  color: string;
}

function YtdComparisonBars({ rows }: { rows: YtdRow[] }) {
  const max = Math.max(...rows.flatMap(r => [r.budget, r.actual]));
  return (
    <div className="space-y-4">
      {rows.map(r => {
        const diff = r.actual - r.budget;
        const pct = diff / r.budget;
        const positive = r.higherIsBetter ? diff >= 0 : diff <= 0;
        const wB = (r.budget / max) * 100;
        const wA = (r.actual / max) * 100;
        return (
          <div key={r.label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[13px] font-medium text-enba-text">{r.label}</div>
              <div className="flex items-center gap-3 text-[11.5px] tabular">
                <span className="text-enba-muted">Bütçe <span className="text-enba-text">{fmtTL(r.budget)}</span></span>
                <span className="text-enba-muted">Gerç. <span className="text-enba-text">{fmtTL(r.actual)}</span></span>
                <Variance value={positive ? Math.abs(diff) : -Math.abs(diff)} asPct={false} />
                <span className={cx('text-[11.5px] tabular font-medium', positive ? 'text-enba-green' : 'text-enba-red')}>
                  ({(pct > 0 ? '+' : '') + (pct * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="relative h-7 bg-enba-panel-2 rounded-md overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-enba-line-2/40" style={{ width: wB + '%' }} />
              <div
                className={cx('absolute inset-y-1 left-0 rounded-sm', positive ? 'bg-enba-green' : 'bg-enba-red')}
                style={{ width: wA + '%', opacity: 0.92 }}
              />
              <div className="absolute inset-y-0 w-[2px] bg-enba-text" style={{ left: wB + '%' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── LineItemTable ─── */
interface LineItemTableProps {
  periodIdx: number;
  scen: Scenario;
}

function LineItemTable({ periodIdx, scen }: LineItemTableProps) {
  const { products, fixedExpenses, actualsThrough, actuals } = usePlanData();
  const rows = useMemo(() => {
    const out: { id: string; group: string; name: string; budget: number; actual: number; higherIsBetter: boolean; color: string }[] = [];
    products.forEach(p => {
      out.push({
        id: 'rev-' + p.id,
        group: 'Gelir',
        name: p.name,
        budget: revenueFor(p, periodIdx, scen),
        actual: actualRevenueFor(p, periodIdx, scen, actualsThrough, actuals) ?? 0,
        higherIsBetter: true,
        color: p.color,
      });
    });
    fixedExpenses.forEach(e => {
      out.push({
        id: 'fix-' + e.id,
        group: 'Sabit Gider',
        name: e.name,
        budget: fixedCostFor(e, periodIdx, scen),
        actual: actualFixedCostFor(e, periodIdx, scen, actualsThrough, actuals) ?? 0,
        higherIsBetter: false,
        color: '#9A9A9A',
      });
    });
    out.sort((a, b) => Math.abs(b.actual - b.budget) - Math.abs(a.actual - a.budget));
    return out;
  }, [periodIdx, scen, products, fixedExpenses, actualsThrough, actuals]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12.5px] tabular">
        <thead>
          <tr className="text-enba-muted bg-enba-panel-2/40">
            <th className="border-b border-enba-line px-5 py-2.5 text-left font-medium min-w-[280px]">Kalem</th>
            <th className="border-b border-enba-line px-3 py-2.5 text-left font-medium w-[120px]">Grup</th>
            <th className="border-b border-enba-line px-3 py-2.5 text-right font-medium">Bütçe</th>
            <th className="border-b border-enba-line px-3 py-2.5 text-right font-medium">Gerçekleşen</th>
            <th className="border-b border-enba-line px-3 py-2.5 text-right font-medium">Sapma</th>
            <th className="border-b border-enba-line px-3 py-2.5 text-right font-medium">Sapma %</th>
            <th className="border-b border-enba-line px-3 py-2.5 text-center font-medium w-[140px]">Bar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const diff = r.actual - r.budget;
            const pct = r.budget !== 0 ? diff / r.budget : 0;
            const positive = r.higherIsBetter ? diff >= 0 : diff <= 0;
            const tone: Tone = positive ? 'green' : Math.abs(pct) < 0.05 ? 'amber' : 'red';
            const toneText = { green: 'text-enba-green', amber: 'text-enba-amber', red: 'text-enba-red' }[tone];
            return (
              <tr key={r.id} className="hover:bg-enba-panel-2/40 transition-colors">
                <td className="border-b border-enba-line px-5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1 h-5 rounded-sm" style={{ background: r.color }} />
                    <span className="text-[13px] font-medium">{r.name}</span>
                  </div>
                </td>
                <td className="border-b border-enba-line px-3 py-2.5">
                  <Badge tone={r.group === 'Gelir' ? 'orange' : 'neutral'}>{r.group}</Badge>
                </td>
                <td className="border-b border-enba-line px-3 py-2.5 text-right text-enba-muted">{fmtTL(r.budget)}</td>
                <td className="border-b border-enba-line px-3 py-2.5 text-right text-enba-text font-medium">{fmtTL(r.actual)}</td>
                <td className={cx('border-b border-enba-line px-3 py-2.5 text-right tabular', toneText)}>
                  {fmtTL(diff, { sign: true })}
                </td>
                <td className={cx('border-b border-enba-line px-3 py-2.5 text-right tabular font-medium', toneText)}>
                  {(pct > 0 ? '+' : '') + (pct * 100).toFixed(1)}%
                </td>
                <td className="border-b border-enba-line px-3 py-2.5">
                  <BulletBar budget={r.budget} actual={r.actual} positive={positive} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── BulletBar ─── */
function BulletBar({ budget, actual, positive }: { budget: number; actual: number; positive: boolean }) {
  const max = Math.max(budget, actual);
  const wB = (budget / max) * 100;
  const wA = (actual / max) * 100;
  return (
    <div className="relative h-4 w-[120px] mx-auto bg-enba-panel-2 rounded-sm overflow-hidden">
      <div className="absolute inset-y-0 left-0 bg-enba-line-2/40" style={{ width: wB + '%' }} />
      <div
        className={cx('absolute inset-y-1 left-0 rounded-sm', positive ? 'bg-enba-green' : 'bg-enba-red')}
        style={{ width: wA + '%' }}
      />
      <div className="absolute inset-y-0 w-[2px] bg-enba-text" style={{ left: wB + '%' }} />
    </div>
  );
}

/* ─── VarianceHeatmap ─── */
function VarianceHeatmap({ scen, actuals: externalActuals }: { scen: Scenario; actuals?: PlanActuals }) {
  const { products, fixedExpenses, periods, actualsThrough, actuals: ctxActuals } = usePlanData();
  const actuals = externalActuals ?? ctxActuals;
  const categories = [
    {
      id: 'rev', label: 'Gelir', higherIsBetter: true,
      resolver: (i: number) => {
        const b = products.reduce((s, p) => s + revenueFor(p, i, scen), 0);
        const a = products.reduce((s, p) => s + (actualRevenueFor(p, i, scen, actualsThrough, actuals) ?? 0), 0);
        return { b, a, has: i < actualsThrough };
      },
    },
    {
      id: 'var', label: 'Değişken Gider', higherIsBetter: false,
      resolver: (i: number) => {
        const b = products.reduce((s, p) => s + varCostFor(p, i, scen), 0);
        const a = products.reduce((s, p) => s + (actualVarCostFor(p, i, scen, actualsThrough, actuals) ?? 0), 0);
        return { b, a, has: i < actualsThrough };
      },
    },
    {
      id: 'fix', label: 'Sabit Gider', higherIsBetter: false,
      resolver: (i: number) => {
        const b = fixedExpenses.reduce((s, e) => s + fixedCostFor(e, i, scen), 0);
        const a = fixedExpenses.reduce((s, e) => s + (actualFixedCostFor(e, i, scen, actualsThrough, actuals) ?? 0), 0);
        return { b, a, has: i < actualsThrough };
      },
    },
    {
      id: 'eb', label: 'EBITDA', higherIsBetter: true,
      resolver: (i: number) => {
        const bva = bvaForPeriod(i, scen, products, fixedExpenses, actualsThrough, actuals);
        return { b: bva.budget.ebitda, a: bva.actual.ebitda, has: i < actualsThrough };
      },
    },
  ];

  const cellBg = (pct: number, positive: boolean, has: boolean) => {
    if (!has) return 'rgba(255,255,255,0.02)';
    if (Math.abs(pct) < 0.005) return positive ? 'rgba(61,190,124,0.10)' : 'rgba(229,72,77,0.10)';
    const intensity = Math.min(0.85, Math.abs(pct) / 0.15);
    return positive
      ? `rgba(61,190,124,${0.15 + intensity * 0.55})`
      : `rgba(229,72,77,${0.15 + intensity * 0.55})`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] tabular border-collapse">
        <thead>
          <tr className="text-enba-muted">
            <th className="text-left font-medium px-2 py-1.5 sticky left-0 bg-enba-panel z-10 min-w-[140px]">Kategori</th>
            {periods.slice(0, 24).map(p => (
              <th
                key={p.key}
                className={cx('text-center font-medium px-1 py-1.5 min-w-[40px]', p.m === 0 && 'text-enba-orange')}
              >
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id}>
              <td className="px-2 py-1.5 text-enba-text font-medium sticky left-0 bg-enba-panel z-10 border-r border-enba-line">
                {cat.label}
              </td>
              {periods.slice(0, 24).map((p, i) => {
                const { b, a, has } = cat.resolver(i);
                const diff = a - b;
                const pct = b !== 0 ? diff / b : 0;
                const positive = cat.higherIsBetter ? diff >= 0 : diff <= 0;
                const bg = cellBg(pct, positive, has);
                return (
                  <td key={p.key} className="p-0.5">
                    <div
                      className="h-7 rounded-sm flex items-center justify-center text-[10px] tabular border border-enba-line/40"
                      style={{ background: bg, color: has ? 'rgb(var(--enba-text))' : 'rgb(var(--enba-dim))' }}
                      title={has ? `${cat.label} ${p.label}: ${(pct * 100).toFixed(1)}%` : `${p.label}: projeksiyon`}
                    >
                      {has ? ((pct > 0 ? '+' : '') + (pct * 100).toFixed(0) + '%') : '·'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-2 text-[10.5px] text-enba-dim">
        <span>Düşük sapma</span>
        <div className="flex">
          {[0.1, 0.2, 0.35, 0.55, 0.7].map((a, i) => (
            <div key={i} className="w-5 h-3" style={{ background: `rgba(61,190,124,${a})` }} />
          ))}
        </div>
        <span className="text-enba-text mx-1">iyi</span>
        <div className="flex">
          {[0.1, 0.2, 0.35, 0.55, 0.7].map((a, i) => (
            <div key={i} className="w-5 h-3" style={{ background: `rgba(229,72,77,${a})` }} />
          ))}
        </div>
        <span>kritik</span>
        <span className="ml-4">Boş hücreler · projeksiyon dönemi</span>
      </div>
    </div>
  );
}

/* ─── ActualEntryModal ─── */
import type { Product, FixedExpense, Period } from './dpData';

interface ActualEntryModalProps {
  periodIdx: number;
  periods: Period[];
  products: Product[];
  fixedExpenses: FixedExpense[];
  scen: Scenario;
  actuals: PlanActuals;
  actualsThrough: number;
  onSave: (actuals: PlanActuals, actualsThrough: number) => void;
  onClose: () => void;
}

function ActualEntryModal({
  periodIdx, periods, products, fixedExpenses, scen,
  actuals, actualsThrough, onSave, onClose,
}: ActualEntryModalProps) {
  // Local form state — TL string olarak tutulur, sayıya çevrilir
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    products.forEach(p => {
      const key = `rev:${p.id}:${periodIdx}`;
      const budget = revenueFor(p, periodIdx, scen);
      init[key] = actuals[key] !== undefined
        ? String(actuals[key])
        : String(Math.round(budget));
    });
    fixedExpenses.forEach(e => {
      const key = `fix:${e.id}:${periodIdx}`;
      const budget = fixedCostFor(e, periodIdx, scen);
      init[key] = actuals[key] !== undefined
        ? String(actuals[key])
        : String(Math.round(budget));
    });
    return init;
  });

  const periodLabel = periods[periodIdx]?.label ?? `Dönem ${periodIdx + 1}`;
  const isNewPeriod = periodIdx >= actualsThrough;

  const handleSave = () => {
    const newActuals = { ...actuals };
    Object.entries(form).forEach(([k, v]) => {
      const n = parseFloat(v.replace(/\./g, '').replace(',', '.'));
      if (!isNaN(n)) newActuals[k] = n;
    });
    const newThrough = Math.max(actualsThrough, periodIdx + 1);
    onSave(newActuals, newThrough);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-enba-panel border border-enba-line rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-enba-line flex items-center justify-between">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-muted mb-0.5">Aktüel Veri Girişi</div>
            <h2 className="text-[15px] font-semibold text-enba-text">{periodLabel}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-enba-panel-2 flex items-center justify-center text-enba-muted hover:text-enba-text transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Gelir kalemleri */}
          {products.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted font-semibold mb-3 flex items-center gap-2">
                <I.Revenue size={13} /> Gelir Kalemleri
              </div>
              <div className="space-y-2">
                {products.map(p => {
                  const key = `rev:${p.id}:${periodIdx}`;
                  const budget = revenueFor(p, periodIdx, scen);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-enba-text leading-tight">{p.name}</div>
                        <div className="text-[10.5px] text-enba-dim">Bütçe: {fmtTL(budget)}</div>
                      </div>
                      <div className="relative w-44">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={form[key] ?? ''}
                          onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full text-sm text-right border border-enba-line rounded-lg px-3 py-2 bg-enba-panel-2 text-enba-text focus:outline-none focus:border-enba-orange focus:ring-1 focus:ring-enba-orange/20"
                          placeholder="0"
                        />
                        <span className="absolute right-9 top-1/2 -translate-y-1/2 text-[11px] text-enba-dim pointer-events-none">₺</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sabit gider kalemleri */}
          {fixedExpenses.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted font-semibold mb-3 flex items-center gap-2">
                <I.Expense size={13} /> Sabit Gider Kalemleri
              </div>
              <div className="space-y-2">
                {fixedExpenses.map(e => {
                  const key = `fix:${e.id}:${periodIdx}`;
                  const budget = fixedCostFor(e, periodIdx, scen);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-enba-text leading-tight">{e.name}</div>
                        <div className="text-[10.5px] text-enba-dim">Bütçe: {fmtTL(budget)}</div>
                      </div>
                      <div className="relative w-44">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={form[key] ?? ''}
                          onChange={e2 => setForm(prev => ({ ...prev, [key]: e2.target.value }))}
                          className="w-full text-sm text-right border border-enba-line rounded-lg px-3 py-2 bg-enba-panel-2 text-enba-text focus:outline-none focus:border-enba-orange focus:ring-1 focus:ring-enba-orange/20"
                          placeholder="0"
                        />
                        <span className="absolute right-9 top-1/2 -translate-y-1/2 text-[11px] text-enba-dim pointer-events-none">₺</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-enba-line flex items-center justify-between">
          {isNewPeriod && (
            <div className="flex items-center gap-2 text-[11px] text-enba-amber">
              <I.Info size={13} />
              Bu dönem yeni kapatılacak
            </div>
          )}
          {!isNewPeriod && (
            <div className="text-[11px] text-enba-dim">Mevcut aktüel güncelleniyor</div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <Btn variant="outline" size="sm" onClick={onClose}>İptal</Btn>
            <Btn variant="primary" size="sm" icon={<I.Save size={13} />} onClick={handleSave}>
              {isNewPeriod ? 'Kaydet & Dönemi Kapat' : 'Güncelle'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
