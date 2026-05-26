import React, { useState, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts';
import {
  cx, useChartColors, xInterval, I, Card, SectionTitle, Badge, Btn, Variance,
} from './DPPrimitives';
import {
  SCENARIOS,
  bvaForPeriod, revenueFor, varCostFor, fixedCostFor,
  actualRevenueFor, actualVarCostFor, actualFixedCostFor,
  fmtTL, Scenario, usePlanData, PlanActuals,
} from './dpData';
import type { Product, FixedExpense, Period } from './dpData';

// ─── Yardımcı anahtar oluşturucular ──────────────────────────────────────────
const kRev   = (id: string, idx: number, sfx = '')   => `rev:${id}:${idx}${sfx}`;
const kFix   = (id: string, idx: number, sfx = '')   => `fix:${id}:${idx}${sfx}`;
const kProd  = (field: string, idx: number, sfx = '') => `prod:${field}:${idx}${sfx}`;
const kStock = (field: string, idx: number)           => `stock:${field}:${idx}`;
const kHR    = (field: string, idx: number)           => `hr:${field}:${idx}`;

const WEEKS = ['H1', 'H2', 'H3', 'H4'] as const;
type WkIdx = 0 | 1 | 2 | 3;

// Haftalık alt-anahtar toplamı → aylık
const weeklySum = (actuals: PlanActuals, base: string, idx: number) =>
  WEEKS.reduce((s, _, w) => s + (actuals[`${base}:w${w}`] ?? 0), 0);

// Günlük alt-anahtar toplamı (1–31)
const dailySum = (actuals: PlanActuals, base: string, idx: number) => {
  let s = 0;
  for (let d = 1; d <= 31; d++) s += actuals[`${base}:d${d}`] ?? 0;
  return s;
};

// ─── BudgetTrackPanel ─────────────────────────────────────────────────────────
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

  // ── YTD toplamlari ────────────────────────────────────────────────────────
  const ytd = useMemo(() => {
    let bRev = 0, aRev = 0, bOp = 0, aOp = 0, bEb = 0, aEb = 0;
    for (let i = 0; i < actualsThrough; i++) {
      const bva = bvaForPeriod(i, scen, products, fixedExpenses, actualsThrough, actuals);
      bRev += bva.budget.revenue; bOp += bva.budget.opex; bEb += bva.budget.ebitda;
      aRev += bva.actual.revenue; aOp += bva.actual.opex; aEb += bva.actual.ebitda;
    }
    return { bRev, aRev, bOp, aOp, bEb, aEb };
  }, [scen, products, fixedExpenses, actualsThrough, actuals]);

  // ── Seçili dönem ─────────────────────────────────────────────────────────
  const sel = useMemo(
    () => bvaForPeriod(periodIdx, scen, products, fixedExpenses, actualsThrough, actuals),
    [periodIdx, scen, products, fixedExpenses, actualsThrough, actuals],
  );

  // ── Trend verisi ──────────────────────────────────────────────────────────
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

  // ── Üretim / Stok / İK aktüel verisi ────────────────────────────────────
  const opActuals = useMemo(() => {
    const inputTons  = actuals[kProd('input',  periodIdx)] ?? 0;
    const outputTons = actuals[kProd('output', periodIdx)] ?? 0;
    const fireRate   = inputTons > 0 ? (inputTons - outputTons) / inputTons : 0;
    const stockOpen  = actuals[kStock('open',  periodIdx)] ?? 0;
    const stockIn    = actuals[kStock('in',    periodIdx)] ?? inputTons;
    const stockOut   = actuals[kStock('out',   periodIdx)] ?? 0;
    const stockClose = actuals[kStock('close', periodIdx)] ?? (stockOpen + stockIn - stockOut);
    const headcount  = actuals[kHR('headcount', periodIdx)] ?? 0;
    const hours      = actuals[kHR('hours',     periodIdx)] ?? 0;
    const productivity = headcount > 0 && hours > 0
      ? outputTons * 1000 / (headcount * hours * 26) // kg/kişi/gün
      : 0;
    return { inputTons, outputTons, fireRate, stockOpen, stockIn, stockOut, stockClose, headcount, hours, productivity };
  }, [actuals, periodIdx]);

  const hasOpData = opActuals.inputTons > 0 || opActuals.headcount > 0;

  return (
    <div className="space-y-5">
      {/* Dönem seçici */}
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
            <Btn variant="primary" size="sm" icon={<I.Edit size={12} />} onClick={() => setModalOpen(true)}>
              Aktüel Gir
            </Btn>
          </div>
        </div>
      </Card>

      {/* Finansal KPI kartları */}
      <div className="grid grid-cols-3 gap-4">
        <BvaKpi title="Gelir"        budget={sel.budget.revenue} actual={sel.actual.revenue} higherIsBetter icon={<I.Revenue size={14} />} />
        <BvaKpi title="Toplam Gider" budget={sel.budget.opex}    actual={sel.actual.opex}    higherIsBetter={false} icon={<I.Expense size={14} />} />
        <BvaKpi title="EBITDA"       budget={sel.budget.ebitda}  actual={sel.actual.ebitda}  higherIsBetter icon={<I.Sparkles size={14} />} />
      </div>

      {/* Operasyonel KPI kartları — sadece veri girilmişse */}
      {hasOpData && (
        <div className="grid grid-cols-4 gap-4">
          {opActuals.inputTons > 0 && (
            <>
              <OperKpi label="Giriş Tonajı" value={`${opActuals.inputTons.toLocaleString('tr-TR')} ton`} sub="Gerçekleşen" color="orange" icon={<I.Bolt size={13}/>}/>
              <OperKpi label="Net Çıktı"    value={`${opActuals.outputTons.toLocaleString('tr-TR')} ton`} sub={`Fire %${(opActuals.fireRate * 100).toFixed(1)}`} color="green" icon={<I.Revenue size={13}/>}/>
              <OperKpi label="Dönem Sonu Stok" value={`${opActuals.stockClose.toLocaleString('tr-TR')} ton`} sub={`Giriş ${opActuals.stockIn}t · Çıkış ${opActuals.stockOut}t`} color="blue" icon={<I.Dashboard size={13}/>}/>
            </>
          )}
          {opActuals.headcount > 0 && (
            <OperKpi
              label="Çalışan Verimliliği"
              value={`${opActuals.productivity.toFixed(1)} kg/kişi/gün`}
              sub={`${opActuals.headcount} kişi · ${opActuals.hours}s/gün`}
              color="purple"
              icon={<I.Calendar size={13}/>}
            />
          )}
        </div>
      )}

      {/* Trend grafiği */}
      <Card padded={false}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">Aylık Eğilim</div>
            <h3 className="text-base font-semibold">Gelir · Bütçe vs Gerçekleşen</h3>
          </div>
          <div className="flex items-center gap-3 text-[10.5px] text-enba-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-[2px] inline-block border-t-2 border-dashed border-enba-orange/50" />Bütçe
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-[2px] bg-enba-orange inline-block" />Gerçekleşen
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-enba-line-2/50 inline-block" />Projeksiyon
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

      {/* YTD özeti */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">
              Yıl Başından Bugüne (YTD) · {actualsThrough} ay
            </div>
            <h3 className="text-base font-semibold">Kümülatif Bütçe vs Gerçekleşen</h3>
          </div>
        </div>
        <YtdComparisonBars rows={[
          { label: 'Gelir',        budget: ytd.bRev, actual: ytd.aRev, higherIsBetter: true,  color: '#E35205' },
          { label: 'Toplam Gider', budget: ytd.bOp,  actual: ytd.aOp,  higherIsBetter: false, color: '#F2A93B' },
          { label: 'EBITDA',       budget: ytd.bEb,  actual: ytd.aEb,  higherIsBetter: true,  color: '#3DBE7C' },
        ]} />
      </Card>

      {/* Kalem bazlı tablo */}
      <Card padded={false}>
        <div className="px-5 py-3 border-b border-enba-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-semibold">Kalem Bazlı Sapma Analizi</h4>
            <span className="text-[11px] text-enba-dim">· {periods[periodIdx]?.label}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Badge tone="green">İyi: &gt;%0</Badge>
            <Badge tone="amber">Dikkat: −5%..0%</Badge>
            <Badge tone="red">Kritik: &lt;−5%</Badge>
          </div>
        </div>
        <LineItemTable periodIdx={periodIdx} scen={scen} />
      </Card>

      {/* Isı haritası */}
      <Card>
        <SectionTitle
          eyebrow="Sapma haritası"
          title="Ay × Kategori Sapma Yoğunluğu"
          action={<span className="text-[10.5px] text-enba-dim">Yeşil = bütçe üstü (iyi), kırmızı = bütçe altı (kötü)</span>}
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

// ─── OperKpi ─────────────────────────────────────────────────────────────────
function OperKpi({ label, value, sub, color, icon }: {
  label: string; value: string; sub: string;
  color: 'orange' | 'green' | 'blue' | 'purple';
  icon: React.ReactNode;
}) {
  const palette = {
    orange: { border: 'border-enba-orange/25', bg: 'bg-enba-orange/8',  icon: 'bg-enba-orange/15 text-enba-orange', val: 'text-enba-orange' },
    green:  { border: 'border-enba-green/25',  bg: 'bg-enba-green/8',   icon: 'bg-enba-green/15 text-enba-green',   val: 'text-enba-green'  },
    blue:   { border: 'border-blue-400/25',    bg: 'bg-blue-400/8',     icon: 'bg-blue-400/15 text-blue-400',       val: 'text-blue-400'    },
    purple: { border: 'border-purple-400/25',  bg: 'bg-purple-400/8',   icon: 'bg-purple-400/15 text-purple-400',   val: 'text-purple-400'  },
  }[color];
  return (
    <div className={cx('rounded-xl border p-4 flex gap-3 items-start', palette.border, palette.bg)}>
      <div className={cx('w-8 h-8 rounded-lg flex items-center justify-center flex-none', palette.icon)}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[10.5px] text-enba-muted uppercase tracking-wider mb-1">{label}</div>
        <div className={cx('text-[16px] font-bold tabular leading-none mb-0.5', palette.val)}>{value}</div>
        <div className="text-[10.5px] text-enba-dim">{sub}</div>
      </div>
    </div>
  );
}

// ─── PeriodScrubber ───────────────────────────────────────────────────────────
function PeriodScrubber({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
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
              isSel ? 'bg-enba-orange' : isActual ? 'bg-enba-green/30 hover:bg-enba-green/60' : 'bg-enba-panel-2 border border-dashed border-enba-line',
            )}
          >
            {isStartOfYear && <span className="absolute -top-3 left-0 text-[9px] text-enba-dim whitespace-nowrap">{p.y}</span>}
            {isSel && <span className="absolute inset-x-0 -bottom-3 text-[9px] text-enba-orange font-medium text-center">{p.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── BvaKpi ──────────────────────────────────────────────────────────────────
type Tone = 'green' | 'amber' | 'red';
const TONE_CLASSES: Record<Tone, { text: string; bg: string; border: string; bar: string }> = {
  green: { text: 'text-enba-green', bg: 'bg-enba-green/10', border: 'border-enba-green/30', bar: 'bg-enba-green' },
  amber: { text: 'text-enba-amber', bg: 'bg-enba-amber/10', border: 'border-enba-amber/30', bar: 'bg-enba-amber' },
  red:   { text: 'text-enba-red',   bg: 'bg-enba-red/10',   border: 'border-enba-red/30',   bar: 'bg-enba-red'   },
};

function BvaKpi({ title, budget, actual, higherIsBetter, icon }: {
  title: string; budget: number; actual: number; higherIsBetter: boolean; icon: React.ReactNode;
}) {
  const diff = actual - budget;
  const pct  = budget !== 0 ? diff / budget : 0;
  const positive = higherIsBetter ? diff >= 0 : diff <= 0;
  const tone: Tone = positive ? 'green' : Math.abs(pct) < 0.05 ? 'amber' : 'red';
  const t = TONE_CLASSES[tone];
  const ratio = Math.min(1.6, Math.max(0, actual / (budget || 1)));
  return (
    <div className={cx('bg-enba-panel border rounded-xl p-5', t.border)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[12px] font-medium text-enba-muted">{icon}<span>{title}</span></div>
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

// ─── YtdComparisonBars ────────────────────────────────────────────────────────
interface YtdRow { label: string; budget: number; actual: number; higherIsBetter: boolean; color: string; }
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
              <div className={cx('absolute inset-y-1 left-0 rounded-sm', positive ? 'bg-enba-green' : 'bg-enba-red')} style={{ width: wA + '%', opacity: 0.92 }} />
              <div className="absolute inset-y-0 w-[2px] bg-enba-text" style={{ left: wB + '%' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LineItemTable ────────────────────────────────────────────────────────────
function LineItemTable({ periodIdx, scen }: { periodIdx: number; scen: Scenario }) {
  const { products, fixedExpenses, actualsThrough, actuals } = usePlanData();
  const rows = useMemo(() => {
    const out: { id: string; group: string; name: string; budget: number; actual: number; higherIsBetter: boolean; color: string }[] = [];
    products.forEach(p => {
      out.push({ id: 'rev-' + p.id, group: 'Gelir', name: p.name, budget: revenueFor(p, periodIdx, scen), actual: actualRevenueFor(p, periodIdx, scen, actualsThrough, actuals) ?? 0, higherIsBetter: true, color: p.color });
    });
    fixedExpenses.forEach(e => {
      out.push({ id: 'fix-' + e.id, group: 'Sabit Gider', name: e.name, budget: fixedCostFor(e, periodIdx, scen), actual: actualFixedCostFor(e, periodIdx, scen, actualsThrough, actuals) ?? 0, higherIsBetter: false, color: '#9A9A9A' });
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
                <td className={cx('border-b border-enba-line px-3 py-2.5 text-right tabular', toneText)}>{fmtTL(diff, { sign: true })}</td>
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

// ─── BulletBar ────────────────────────────────────────────────────────────────
function BulletBar({ budget, actual, positive }: { budget: number; actual: number; positive: boolean }) {
  const max = Math.max(budget, actual);
  const wB = (budget / max) * 100;
  const wA = (actual / max) * 100;
  return (
    <div className="relative h-4 w-[120px] mx-auto bg-enba-panel-2 rounded-sm overflow-hidden">
      <div className="absolute inset-y-0 left-0 bg-enba-line-2/40" style={{ width: wB + '%' }} />
      <div className={cx('absolute inset-y-1 left-0 rounded-sm', positive ? 'bg-enba-green' : 'bg-enba-red')} style={{ width: wA + '%' }} />
      <div className="absolute inset-y-0 w-[2px] bg-enba-text" style={{ left: wB + '%' }} />
    </div>
  );
}

// ─── VarianceHeatmap ──────────────────────────────────────────────────────────
function VarianceHeatmap({ scen, actuals: externalActuals }: { scen: Scenario; actuals?: PlanActuals }) {
  const { products, fixedExpenses, periods, actualsThrough, actuals: ctxActuals } = usePlanData();
  const actuals = externalActuals ?? ctxActuals;
  const categories = [
    { id: 'rev', label: 'Gelir', higherIsBetter: true,
      resolver: (i: number) => ({ b: products.reduce((s, p) => s + revenueFor(p, i, scen), 0), a: products.reduce((s, p) => s + (actualRevenueFor(p, i, scen, actualsThrough, actuals) ?? 0), 0), has: i < actualsThrough }) },
    { id: 'var', label: 'Değişken Gider', higherIsBetter: false,
      resolver: (i: number) => ({ b: products.reduce((s, p) => s + varCostFor(p, i, scen), 0), a: products.reduce((s, p) => s + (actualVarCostFor(p, i, scen, actualsThrough, actuals) ?? 0), 0), has: i < actualsThrough }) },
    { id: 'fix', label: 'Sabit Gider', higherIsBetter: false,
      resolver: (i: number) => ({ b: fixedExpenses.reduce((s, e) => s + fixedCostFor(e, i, scen), 0), a: fixedExpenses.reduce((s, e) => s + (actualFixedCostFor(e, i, scen, actualsThrough, actuals) ?? 0), 0), has: i < actualsThrough }) },
    { id: 'eb', label: 'EBITDA', higherIsBetter: true,
      resolver: (i: number) => { const bva = bvaForPeriod(i, scen, products, fixedExpenses, actualsThrough, actuals); return { b: bva.budget.ebitda, a: bva.actual.ebitda, has: i < actualsThrough }; } },
  ];
  const cellBg = (pct: number, positive: boolean, has: boolean) => {
    if (!has) return 'rgba(255,255,255,0.02)';
    if (Math.abs(pct) < 0.005) return positive ? 'rgba(61,190,124,0.10)' : 'rgba(229,72,77,0.10)';
    const intensity = Math.min(0.85, Math.abs(pct) / 0.15);
    return positive ? `rgba(61,190,124,${0.15 + intensity * 0.55})` : `rgba(229,72,77,${0.15 + intensity * 0.55})`;
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] tabular border-collapse">
        <thead>
          <tr className="text-enba-muted">
            <th className="text-left font-medium px-2 py-1.5 sticky left-0 bg-enba-panel z-10 min-w-[140px]">Kategori</th>
            {periods.slice(0, 24).map(p => (
              <th key={p.key} className={cx('text-center font-medium px-1 py-1.5 min-w-[40px]', p.m === 0 && 'text-enba-orange')}>{p.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id}>
              <td className="px-2 py-1.5 text-enba-text font-medium sticky left-0 bg-enba-panel z-10 border-r border-enba-line">{cat.label}</td>
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
        <div className="flex">{[0.1, 0.2, 0.35, 0.55, 0.7].map((a, i) => <div key={i} className="w-5 h-3" style={{ background: `rgba(61,190,124,${a})` }} />)}</div>
        <span className="text-enba-text mx-1">iyi</span>
        <div className="flex">{[0.1, 0.2, 0.35, 0.55, 0.7].map((a, i) => <div key={i} className="w-5 h-3" style={{ background: `rgba(229,72,77,${a})` }} />)}</div>
        <span>kritik</span>
        <span className="ml-4">Boş hücreler · projeksiyon dönemi</span>
      </div>
    </div>
  );
}

// ─── ActualEntryModal ─────────────────────────────────────────────────────────
type ModalTab = 'finansal' | 'uretim' | 'stok' | 'ik';
type EntryGranularity = 'monthly' | 'weekly' | 'daily';

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
  const [tab, setTab] = useState<ModalTab>('finansal');
  const [granularity, setGranularity] = useState<EntryGranularity>('monthly');
  const [form, setForm] = useState<Record<string, string>>(() => initForm(periodIdx, products, fixedExpenses, scen, actuals));

  const periodLabel = periods[periodIdx]?.label ?? `Dönem ${periodIdx + 1}`;
  const isNewPeriod = periodIdx >= actualsThrough;

  // ── form setter helper ────────────────────────────────────────────────────
  const set = useCallback((key: string, val: string) => setForm(prev => ({ ...prev, [key]: val })), []);
  const n = (key: string) => parseFloat((form[key] ?? '0').replace(/\./g, '').replace(',', '.')) || 0;

  // ── Üretim: haftalık toplamdan aylık hesapla ──────────────────────────────
  const prodInputWeeklyTotal = WEEKS.reduce((s, _, w) => s + n(kProd('input', periodIdx, `:w${w}`)), 0);
  const prodOutputWeeklyTotal = WEEKS.reduce((s, _, w) => s + n(kProd('output', periodIdx, `:w${w}`)), 0);

  // ── Üretim: günlük toplamdan aylık hesapla ───────────────────────────────
  const prodInputDailyTotal = Array.from({ length: 31 }, (_, d) => n(kProd('input', periodIdx, `:d${d + 1}`))).reduce((s, v) => s + v, 0);

  // Gerçek aylık giriş tonajı (granülasyona göre)
  const actualInputTons = granularity === 'monthly'
    ? n(kProd('input', periodIdx))
    : granularity === 'weekly'
      ? prodInputWeeklyTotal
      : prodInputDailyTotal;

  // Stok: dönem sonu otomatik hesapla
  const stockOpen  = n(kStock('open', periodIdx));
  const stockIn    = n(kStock('in',   periodIdx)) || actualInputTons;
  const stockOut   = n(kStock('out',  periodIdx));
  const stockClose = stockOpen + stockIn - stockOut;

  // İK: verimlilik hesabı
  const headcount   = n(kHR('headcount', periodIdx));
  const hoursPerDay = n(kHR('hours',     periodIdx));
  const outputTons  = granularity === 'monthly' ? n(kProd('output', periodIdx)) : prodOutputWeeklyTotal;
  const productivity = headcount > 0 && hoursPerDay > 0
    ? outputTons * 1000 / (headcount * hoursPerDay * 26)
    : 0;

  // ── Ton bazlı finansal öneri ──────────────────────────────────────────────
  const fillFromTons = () => {
    if (outputTons <= 0 || products.length === 0) return;
    const updated = { ...form };
    const totOutputTons = outputTons;
    products.forEach(p => {
      const share = p.volume > 0 ? 1 / products.length : 1 / products.length;
      const revTL = totOutputTons * share * 1000 * (p.price ?? 0); // ton → kg × TL/kg
      const key = kRev(p.id, periodIdx);
      updated[key] = String(Math.round(revTL));
    });
    setForm(updated);
    setTab('finansal');
  };

  // ── Kaydet ────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const newActuals = { ...actuals };

    // Finansal: aylık veya haftalık
    if (granularity === 'monthly') {
      products.forEach(p => { const k = kRev(p.id, periodIdx); const v = n(k); if (v) newActuals[k] = v; });
      fixedExpenses.forEach(e => { const k = kFix(e.id, periodIdx); const v = n(k); if (v) newActuals[k] = v; });
    } else if (granularity === 'weekly') {
      products.forEach(p => {
        let sum = 0;
        WEEKS.forEach((_, w) => {
          const k = kRev(p.id, periodIdx, `:w${w}`);
          const v = n(k); if (v) { newActuals[k] = v; sum += v; }
        });
        if (sum > 0) newActuals[kRev(p.id, periodIdx)] = sum;
      });
      fixedExpenses.forEach(e => {
        let sum = 0;
        WEEKS.forEach((_, w) => {
          const k = kFix(e.id, periodIdx, `:w${w}`);
          const v = n(k); if (v) { newActuals[k] = v; sum += v; }
        });
        if (sum > 0) newActuals[kFix(e.id, periodIdx)] = sum;
      });
    } else {
      // Daily — gelir: 31 gün
      products.forEach(p => {
        let sum = 0;
        for (let d = 1; d <= 31; d++) {
          const k = kRev(p.id, periodIdx, `:d${d}`);
          const v = n(k); if (v) { newActuals[k] = v; sum += v; }
        }
        if (sum > 0) newActuals[kRev(p.id, periodIdx)] = sum;
      });
      fixedExpenses.forEach(e => {
        let sum = 0;
        for (let d = 1; d <= 31; d++) {
          const k = kFix(e.id, periodIdx, `:d${d}`);
          const v = n(k); if (v) { newActuals[k] = v; sum += v; }
        }
        if (sum > 0) newActuals[kFix(e.id, periodIdx)] = sum;
      });
    }

    // Üretim
    if (granularity === 'monthly') {
      const iv = n(kProd('input', periodIdx));  if (iv) newActuals[kProd('input',  periodIdx)] = iv;
      const ov = n(kProd('output', periodIdx)); if (ov) newActuals[kProd('output', periodIdx)] = ov;
    } else if (granularity === 'weekly') {
      let iSum = 0, oSum = 0;
      WEEKS.forEach((_, w) => {
        const ik = kProd('input',  periodIdx, `:w${w}`); const iv = n(ik); if (iv) { newActuals[ik] = iv; iSum += iv; }
        const ok = kProd('output', periodIdx, `:w${w}`); const ov = n(ok); if (ov) { newActuals[ok] = ov; oSum += ov; }
      });
      if (iSum) newActuals[kProd('input',  periodIdx)] = iSum;
      if (oSum) newActuals[kProd('output', periodIdx)] = oSum;
    } else {
      let iSum = 0, oSum = 0;
      for (let d = 1; d <= 31; d++) {
        const ik = kProd('input',  periodIdx, `:d${d}`); const iv = n(ik); if (iv) { newActuals[ik] = iv; iSum += iv; }
        const ok = kProd('output', periodIdx, `:d${d}`); const ov = n(ok); if (ov) { newActuals[ok] = ov; oSum += ov; }
      }
      if (iSum) newActuals[kProd('input',  periodIdx)] = iSum;
      if (oSum) newActuals[kProd('output', periodIdx)] = oSum;
    }

    // Stok
    if (stockOpen) newActuals[kStock('open',  periodIdx)] = stockOpen;
    if (stockIn)   newActuals[kStock('in',    periodIdx)] = stockIn;
    if (stockOut)  newActuals[kStock('out',   periodIdx)] = stockOut;
    if (stockClose) newActuals[kStock('close', periodIdx)] = stockClose;

    // İK
    if (headcount)   newActuals[kHR('headcount', periodIdx)] = headcount;
    if (hoursPerDay) newActuals[kHR('hours',     periodIdx)] = hoursPerDay;

    const newThrough = Math.max(actualsThrough, periodIdx + 1);
    onSave(newActuals, newThrough);
  };

  const TABS: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
    { id: 'finansal', label: 'Finansal',    icon: <I.Revenue size={13}/> },
    { id: 'uretim',   label: 'Üretim',      icon: <I.Bolt size={13}/> },
    { id: 'stok',     label: 'Stok',        icon: <I.Dashboard size={13}/> },
    { id: 'ik',       label: 'İnsan Kaynağı', icon: <I.Calendar size={13}/> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-enba-panel border border-enba-line rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-enba-line flex items-center justify-between">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-muted mb-0.5">Aktüel Veri Girişi</div>
            <h2 className="text-[15px] font-semibold text-enba-text">{periodLabel}</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Granülasyon seçici */}
            <div className="flex items-center gap-0.5 bg-enba-panel-2 rounded-lg p-0.5">
              {(['monthly', 'weekly', 'daily'] as EntryGranularity[]).map(g => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={cx(
                    'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                    granularity === g ? 'bg-enba-orange text-white' : 'text-enba-dim hover:text-enba-text',
                  )}
                >
                  {g === 'monthly' ? 'Aylık' : g === 'weekly' ? 'Haftalık' : 'Günlük'}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-enba-panel-2 flex items-center justify-center text-enba-muted hover:text-enba-text transition-colors text-lg leading-none">✕</button>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="flex border-b border-enba-line bg-enba-panel-2/30">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                'flex items-center gap-1.5 px-4 py-3 text-[12px] font-medium border-b-2 transition-colors',
                tab === t.id
                  ? 'border-enba-orange text-enba-orange'
                  : 'border-transparent text-enba-muted hover:text-enba-text',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'finansal' && (
            <FinansalTab
              periodIdx={periodIdx} products={products} fixedExpenses={fixedExpenses}
              scen={scen} granularity={granularity} form={form} set={set} n={n}
            />
          )}
          {tab === 'uretim' && (
            <UretimTab
              periodIdx={periodIdx} granularity={granularity}
              form={form} set={set} n={n}
              weeklyInputTotal={prodInputWeeklyTotal}
              weeklyOutputTotal={prodOutputWeeklyTotal}
              dailyInputTotal={prodInputDailyTotal}
              onFillFinancial={fillFromTons}
            />
          )}
          {tab === 'stok' && (
            <StokTab
              periodIdx={periodIdx} form={form} set={set} n={n}
              autoClose={stockClose} autoIn={stockIn}
            />
          )}
          {tab === 'ik' && (
            <IkTab
              periodIdx={periodIdx} form={form} set={set} n={n}
              productivity={productivity}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-enba-line flex items-center justify-between">
          {isNewPeriod
            ? <div className="flex items-center gap-2 text-[11px] text-enba-amber"><I.Info size={13}/>Bu dönem yeni kapatılacak</div>
            : <div className="text-[11px] text-enba-dim">Mevcut aktüel güncelleniyor</div>
          }
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

// ─── Yardımcı: form başlangıç durumu ─────────────────────────────────────────
function initForm(
  periodIdx: number,
  products: Product[],
  fixedExpenses: FixedExpense[],
  scen: Scenario,
  actuals: PlanActuals,
): Record<string, string> {
  const init: Record<string, string> = {};
  products.forEach(p => {
    const key = kRev(p.id, periodIdx);
    const budget = revenueFor(p, periodIdx, scen);
    init[key] = actuals[key] !== undefined ? String(actuals[key]) : String(Math.round(budget));
    WEEKS.forEach((_, w) => { const k = kRev(p.id, periodIdx, `:w${w}`); init[k] = String(actuals[k] ?? 0); });
    for (let d = 1; d <= 31; d++) { const k = kRev(p.id, periodIdx, `:d${d}`); init[k] = String(actuals[k] ?? 0); }
  });
  fixedExpenses.forEach(e => {
    const key = kFix(e.id, periodIdx);
    const budget = fixedCostFor(e, periodIdx, scen);
    init[key] = actuals[key] !== undefined ? String(actuals[key]) : String(Math.round(budget));
    WEEKS.forEach((_, w) => { const k = kFix(e.id, periodIdx, `:w${w}`); init[k] = String(actuals[k] ?? 0); });
    for (let d = 1; d <= 31; d++) { const k = kFix(e.id, periodIdx, `:d${d}`); init[k] = String(actuals[k] ?? 0); }
  });
  // Üretim
  ['input', 'output'].forEach(f => {
    const k = kProd(f, periodIdx); init[k] = String(actuals[k] ?? 0);
    WEEKS.forEach((_, w) => { const wk = kProd(f, periodIdx, `:w${w}`); init[wk] = String(actuals[wk] ?? 0); });
    for (let d = 1; d <= 31; d++) { const dk = kProd(f, periodIdx, `:d${d}`); init[dk] = String(actuals[dk] ?? 0); }
  });
  // Stok
  ['open', 'in', 'out', 'close'].forEach(f => { const k = kStock(f, periodIdx); init[k] = String(actuals[k] ?? 0); });
  // İK
  ['headcount', 'hours'].forEach(f => { const k = kHR(f, periodIdx); init[k] = String(actuals[k] ?? 0); });
  return init;
}

// ─── Sekme: Finansal ──────────────────────────────────────────────────────────
interface TabProps { periodIdx: number; granularity?: EntryGranularity; form: Record<string, string>; set: (k: string, v: string) => void; n: (k: string) => number; }

function FinansalTab({ periodIdx, products, fixedExpenses, scen, granularity, form, set, n }: TabProps & { products: Product[]; fixedExpenses: FixedExpense[]; scen: Scenario }) {
  const numInput = (key: string, placeholder = '0') => (
    <input
      type="number"
      min={0}
      value={form[key] ?? ''}
      onChange={e => set(key, e.target.value)}
      placeholder={placeholder}
      className="w-full px-2.5 py-1.5 text-sm text-right border border-enba-line rounded-lg bg-enba-panel-2 text-enba-text focus:outline-none focus:border-enba-orange"
    />
  );

  if (granularity === 'monthly') {
    return (
      <div className="space-y-6">
        {products.length > 0 && (
          <section>
            <SectionLabel icon={<I.Revenue size={12}/>} label="Gelir Kalemleri"/>
            <div className="space-y-2">
              {products.map(p => {
                const key = kRev(p.id, periodIdx);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-[13px] font-medium">{p.name}</div>
                      <div className="text-[10.5px] text-enba-dim">Bütçe: {fmtTL(revenueFor(p, periodIdx, scen))}</div>
                    </div>
                    <div className="w-44 relative">
                      {numInput(key)}
                      <span className="absolute right-9 top-1/2 -translate-y-1/2 text-[10px] text-enba-dim pointer-events-none">₺</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {fixedExpenses.length > 0 && (
          <section>
            <SectionLabel icon={<I.Expense size={12}/>} label="Sabit Gider Kalemleri"/>
            <div className="space-y-2">
              {fixedExpenses.map(e => {
                const key = kFix(e.id, periodIdx);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-[13px] font-medium">{e.name}</div>
                      <div className="text-[10.5px] text-enba-dim">Bütçe: {fmtTL(fixedCostFor(e, periodIdx, scen))}</div>
                    </div>
                    <div className="w-44 relative">
                      {numInput(key)}
                      <span className="absolute right-9 top-1/2 -translate-y-1/2 text-[10px] text-enba-dim pointer-events-none">₺</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  }

  if (granularity === 'weekly') {
    return (
      <div className="space-y-6">
        {products.length > 0 && (
          <section>
            <SectionLabel icon={<I.Revenue size={12}/>} label="Gelir — Haftalık Dağılım"/>
            <WeeklyGrid items={products.map(p => ({ id: p.id, name: p.name, budget: revenueFor(p, periodIdx, scen) }))}
              baseKey={(id) => kRev(id, periodIdx)} form={form} set={set} n={n} unit="₺" />
          </section>
        )}
        {fixedExpenses.length > 0 && (
          <section>
            <SectionLabel icon={<I.Expense size={12}/>} label="Sabit Gider — Haftalık Dağılım"/>
            <WeeklyGrid items={fixedExpenses.map(e => ({ id: e.id, name: e.name, budget: fixedCostFor(e, periodIdx, scen) }))}
              baseKey={(id) => kFix(id, periodIdx)} form={form} set={set} n={n} unit="₺" />
          </section>
        )}
      </div>
    );
  }

  // Daily
  return (
    <div className="space-y-6">
      {products.length > 0 && (
        <section>
          <SectionLabel icon={<I.Revenue size={12}/>} label="Gelir — Günlük Dağılım"/>
          <DailyGrid items={products.map(p => ({ id: p.id, name: p.name, budget: revenueFor(p, periodIdx, scen) }))}
            baseKey={(id) => kRev(id, periodIdx)} form={form} set={set} n={n} unit="₺" />
        </section>
      )}
      {fixedExpenses.length > 0 && (
        <section>
          <SectionLabel icon={<I.Expense size={12}/>} label="Sabit Gider — Günlük Dağılım"/>
          <DailyGrid items={fixedExpenses.map(e => ({ id: e.id, name: e.name, budget: fixedCostFor(e, periodIdx, scen) }))}
            baseKey={(id) => kFix(id, periodIdx)} form={form} set={set} n={n} unit="₺" />
        </section>
      )}
    </div>
  );
}

// ─── Sekme: Üretim ────────────────────────────────────────────────────────────
function UretimTab({ periodIdx, granularity, form, set, n, weeklyInputTotal, weeklyOutputTotal, dailyInputTotal, onFillFinancial }: TabProps & {
  weeklyInputTotal: number; weeklyOutputTotal: number; dailyInputTotal: number; onFillFinancial: () => void;
}) {
  const inputKey  = kProd('input',  periodIdx);
  const outputKey = kProd('output', periodIdx);
  const inputVal  = granularity === 'monthly' ? n(inputKey)  : granularity === 'weekly' ? weeklyInputTotal  : dailyInputTotal;
  const outputVal = granularity === 'monthly' ? n(outputKey) : granularity === 'weekly' ? weeklyOutputTotal : 0;
  const fireRate  = inputVal > 0 ? Math.max(0, (inputVal - outputVal) / inputVal) : 0;

  const numInput = (key: string, label: string, unit = 'ton') => (
    <div className="flex items-center gap-3">
      <label className="text-[12.5px] font-medium text-enba-text flex-1">{label}</label>
      <div className="flex items-center gap-1.5 w-44">
        <input
          type="number" min={0}
          value={form[key] ?? ''} placeholder="0"
          onChange={e => set(key, e.target.value)}
          className="flex-1 px-2.5 py-1.5 text-sm text-right border border-enba-line rounded-lg bg-enba-panel-2 text-enba-text focus:outline-none focus:border-enba-orange"
        />
        <span className="text-[11px] text-enba-muted w-8 flex-none">{unit}</span>
      </div>
    </div>
  );

  if (granularity === 'monthly') {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <SectionLabel icon={<I.Bolt size={12}/>} label="Aylık Üretim Verileri"/>
          {numInput(inputKey,  'Giriş Tonajı (hammadde)')}
          {numInput(outputKey, 'Net Çıktı Tonajı')}
        </div>
        <UretimStats inputVal={inputVal} outputVal={outputVal} fireRate={fireRate} onFillFinancial={onFillFinancial}/>
      </div>
    );
  }

  if (granularity === 'weekly') {
    return (
      <div className="space-y-6">
        <div>
          <SectionLabel icon={<I.Bolt size={12}/>} label="Haftalık Üretim — Giriş Tonajı"/>
          <WeeklyGrid items={[{ id: 'input', name: 'Giriş Tonajı (hammadde)' }]}
            baseKey={() => kProd('input', periodIdx)} form={form} set={set} n={n} unit="ton" hideBudget />
        </div>
        <div>
          <SectionLabel icon={<I.Revenue size={12}/>} label="Haftalık Üretim — Çıktı Tonajı"/>
          <WeeklyGrid items={[{ id: 'output', name: 'Net Çıktı Tonajı' }]}
            baseKey={() => kProd('output', periodIdx)} form={form} set={set} n={n} unit="ton" hideBudget />
        </div>
        <UretimStats inputVal={inputVal} outputVal={outputVal} fireRate={fireRate} onFillFinancial={onFillFinancial}/>
      </div>
    );
  }

  // Daily
  return (
    <div className="space-y-6">
      <div>
        <SectionLabel icon={<I.Bolt size={12}/>} label="Günlük Üretim — Giriş Tonajı"/>
        <DailyGrid items={[{ id: 'input', name: 'Giriş' }]}
          baseKey={() => kProd('input', periodIdx)} form={form} set={set} n={n} unit="ton" hideBudget compact />
      </div>
      <div>
        <SectionLabel icon={<I.Revenue size={12}/>} label="Günlük Üretim — Çıktı Tonajı"/>
        <DailyGrid items={[{ id: 'output', name: 'Çıktı' }]}
          baseKey={() => kProd('output', periodIdx)} form={form} set={set} n={n} unit="ton" hideBudget compact />
      </div>
      <UretimStats inputVal={dailyInputTotal} outputVal={0} fireRate={0} onFillFinancial={onFillFinancial}/>
    </div>
  );
}

function UretimStats({ inputVal, outputVal, fireRate, onFillFinancial }: {
  inputVal: number; outputVal: number; fireRate: number; onFillFinancial: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-enba-panel-2/60 border border-enba-line">
      <Stat label="Giriş Toplamı"   value={`${inputVal.toFixed(2)} ton`} />
      <Stat label="Çıktı Toplamı"   value={`${outputVal.toFixed(2)} ton`} />
      <Stat label="Fire Oranı"       value={`%${(fireRate * 100).toFixed(1)}`} highlight={fireRate > 0.15 ? 'red' : 'green'} />
      {outputVal > 0 && (
        <div className="col-span-3 mt-1">
          <button
            onClick={onFillFinancial}
            className="w-full py-2 rounded-lg border border-enba-orange/40 text-enba-orange text-[12px] font-medium hover:bg-enba-orange/8 transition-colors"
          >
            Çıktı tonajından finansal geliri otomatik hesapla →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sekme: Stok ─────────────────────────────────────────────────────────────
function StokTab({ periodIdx, form, set, n, autoClose, autoIn }: TabProps & { autoClose: number; autoIn: number }) {
  const fields = [
    { key: kStock('open',  periodIdx), label: 'Dönem Başı Stok',   hint: 'Bir önceki dönem sonu stoku' },
    { key: kStock('in',    periodIdx), label: 'Dönem Girişi',        hint: `Üretim giriş tonajı (oto: ${autoIn.toFixed(1)} ton)` },
    { key: kStock('out',   periodIdx), label: 'Dönem Çıkışı (Satış)', hint: 'Satılan / sevk edilen ton' },
  ];
  return (
    <div className="space-y-5">
      <SectionLabel icon={<I.Dashboard size={12}/>} label="Stok Hareketleri"/>
      <div className="space-y-3">
        {fields.map(f => (
          <div key={f.key} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[13px] font-medium">{f.label}</div>
              <div className="text-[10.5px] text-enba-dim">{f.hint}</div>
            </div>
            <div className="flex items-center gap-1.5 w-44">
              <input
                type="number" min={0}
                value={form[f.key] ?? ''} placeholder="0"
                onChange={e => set(f.key, e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-sm text-right border border-enba-line rounded-lg bg-enba-panel-2 text-enba-text focus:outline-none focus:border-enba-orange"
              />
              <span className="text-[11px] text-enba-muted w-8 flex-none">ton</span>
            </div>
          </div>
        ))}
      </div>
      {/* Dönem sonu otomatik */}
      <div className="p-4 rounded-xl bg-enba-panel-2/60 border border-enba-line">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10.5px] text-enba-muted uppercase tracking-wider mb-1">Dönem Sonu Stok (Otomatik)</div>
            <div className="text-[20px] font-bold tabular text-enba-text">{autoClose.toFixed(2)} ton</div>
            <div className="text-[10.5px] text-enba-dim mt-0.5">Başı + Giriş − Çıkış = {n(kStock('open', periodIdx)).toFixed(1)} + {n(kStock('in', periodIdx)).toFixed(1)} − {n(kStock('out', periodIdx)).toFixed(1)}</div>
          </div>
          <div className="text-3xl opacity-20">📦</div>
        </div>
      </div>
    </div>
  );
}

// ─── Sekme: İK ───────────────────────────────────────────────────────────────
function IkTab({ periodIdx, form, set, n, productivity }: TabProps & { productivity: number }) {
  const fields = [
    { key: kHR('headcount', periodIdx), label: 'Ortalama Çalışan Sayısı',  unit: 'kişi',   hint: 'Dönem boyunca aktif çalışan' },
    { key: kHR('hours',     periodIdx), label: 'Günlük Mesai Saati',        unit: 'saat',   hint: 'Fiili vardiya süresi' },
  ];
  return (
    <div className="space-y-5">
      <SectionLabel icon={<I.Calendar size={12}/>} label="İnsan Kaynağı Verileri"/>
      <div className="space-y-3">
        {fields.map(f => (
          <div key={f.key} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[13px] font-medium">{f.label}</div>
              <div className="text-[10.5px] text-enba-dim">{f.hint}</div>
            </div>
            <div className="flex items-center gap-1.5 w-44">
              <input
                type="number" min={0}
                value={form[f.key] ?? ''} placeholder="0"
                onChange={e => set(f.key, e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-sm text-right border border-enba-line rounded-lg bg-enba-panel-2 text-enba-text focus:outline-none focus:border-enba-orange"
              />
              <span className="text-[11px] text-enba-muted w-8 flex-none">{f.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-enba-panel-2/60 border border-enba-line">
        <Stat label="Toplam Adam-Saat/Ay" value={`${(n(kHR('headcount', periodIdx)) * n(kHR('hours', periodIdx)) * 26).toFixed(0)} saat`} />
        <Stat label="Çalışan Verimliliği" value={productivity > 0 ? `${productivity.toFixed(1)} kg/kişi/gün` : '—'} highlight={productivity > 80 ? 'green' : productivity > 0 ? 'amber' : undefined} />
      </div>
    </div>
  );
}

// ─── Yardımcı Grid Bileşenleri ────────────────────────────────────────────────
function WeeklyGrid({ items, baseKey, form, set, n, unit, hideBudget }: {
  items: { id: string; name: string; budget?: number }[];
  baseKey: (id: string) => string;
  form: Record<string, string>; set: (k: string, v: string) => void; n: (k: string) => number;
  unit: string; hideBudget?: boolean;
}) {
  return (
    <div className="space-y-3 mt-2">
      {items.map(item => {
        const base = baseKey(item.id);
        const weeklyTotal = WEEKS.reduce((s, _, w) => s + n(`${base}:w${w}`), 0);
        return (
          <div key={item.id} className="rounded-xl border border-enba-line p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12.5px] font-medium">{item.name}</span>
              {!hideBudget && item.budget !== undefined && (
                <span className="text-[10.5px] text-enba-dim">Bütçe: {unit === '₺' ? fmtTL(item.budget) : item.budget + ' ' + unit}</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {WEEKS.map((wLabel, w) => {
                const k = `${base}:w${w}`;
                return (
                  <div key={w}>
                    <div className="text-[10px] text-enba-dim mb-1 text-center">{wLabel}</div>
                    <input
                      type="number" min={0}
                      value={form[k] ?? ''} placeholder="0"
                      onChange={e => set(k, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm text-center border border-enba-line rounded-lg bg-enba-panel-2 text-enba-text focus:outline-none focus:border-enba-orange"
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-right text-[11px] text-enba-muted">
              Toplam: <span className="font-medium text-enba-text">{unit === '₺' ? fmtTL(weeklyTotal) : weeklyTotal.toFixed(2) + ' ' + unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DailyGrid({ items, baseKey, form, set, n, unit, hideBudget, compact }: {
  items: { id: string; name: string; budget?: number }[];
  baseKey: (id: string) => string;
  form: Record<string, string>; set: (k: string, v: string) => void; n: (k: string) => number;
  unit: string; hideBudget?: boolean; compact?: boolean;
}) {
  const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
  return (
    <div className="space-y-4 mt-2">
      {items.map(item => {
        const base = baseKey(item.id);
        const total = DAYS.reduce((s, d) => s + n(`${base}:d${d}`), 0);
        return (
          <div key={item.id} className="rounded-xl border border-enba-line p-3">
            {!hideBudget && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12.5px] font-medium">{item.name}</span>
                {item.budget !== undefined && <span className="text-[10.5px] text-enba-dim">Bütçe/ay: {unit === '₺' ? fmtTL(item.budget) : item.budget + ' ' + unit}</span>}
              </div>
            )}
            {/* 7-sütun grid — haftalar satır bazlı */}
            <div className="grid grid-cols-7 gap-1">
              {['Pt','Sa','Ça','Pe','Cu','Ct','Pz'].map(d => (
                <div key={d} className="text-[9px] text-enba-dim text-center pb-0.5">{d}</div>
              ))}
              {DAYS.map(d => {
                const k = `${base}:d${d}`;
                return (
                  <input
                    key={d}
                    type="number" min={0}
                    value={form[k] ?? ''} placeholder={String(d)}
                    onChange={e => set(k, e.target.value)}
                    title={`Gün ${d}`}
                    className={cx(
                      'w-full py-1 text-center border border-enba-line rounded bg-enba-panel-2 text-enba-text focus:outline-none focus:border-enba-orange',
                      compact ? 'text-[10px] px-0' : 'text-[11px] px-1',
                    )}
                  />
                );
              })}
            </div>
            <div className="mt-2 text-right text-[11px] text-enba-muted">
              Toplam: <span className="font-medium text-enba-text">{unit === '₺' ? fmtTL(total) : total.toFixed(2) + ' ' + unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Küçük yardımcı bileşenler ────────────────────────────────────────────────
function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted font-semibold mb-3 flex items-center gap-2">
      {icon} {label}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'amber' | 'red' }) {
  const color = highlight === 'green' ? 'text-enba-green' : highlight === 'amber' ? 'text-enba-amber' : highlight === 'red' ? 'text-enba-red' : 'text-enba-text';
  return (
    <div>
      <div className="text-[10px] text-enba-dim uppercase tracking-wider mb-0.5">{label}</div>
      <div className={cx('text-[15px] font-bold tabular', color)}>{value}</div>
    </div>
  );
}
