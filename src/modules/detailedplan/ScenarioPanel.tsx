import React, { useState, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar,
  LineChart, Line,
} from 'recharts';
import {
  SCENARIOS, buildSeries, fmtTL, fmtPct,
  monthlyPriceFor, monthlyVolumeFor, varCostFor, fixedCostFor,
  Scenario, DPlan, usePlanData,
} from './dpData';
import {
  cx, Card, SectionTitle, Btn, Badge, I, useChartColors, xInterval,
} from './DPPrimitives';

// Preset renkler — özel senaryolar için
const CUSTOM_COLORS = ['#6366F1','#F59E0B','#8B5CF6','#06B6D4','#EC4899','#14B8A6'];

export const ScenarioPanel = ({ scenarioId, periodGranularity, plan, onSave }:
  { scenarioId: string; periodGranularity: string; plan?: DPlan; onSave?: (p: DPlan) => void }) => {
  const cc = useChartColors();
  const { products, fixedExpenses, periods, weeklyHorizon, rampUp, baseInputTons } = usePlanData();
  const [focused, setFocused] = useState(scenarioId);
  const [metricMode, setMetricMode] = useState<'total' | 'monthly'>('total');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingScen, setEditingScen] = useState<Scenario | null>(null);

  // Sabit + özel senaryolar birleşik liste
  const allScenarios = useMemo<Scenario[]>(() => [
    ...Object.values(SCENARIOS),
    ...(plan?.customScenarios ?? []),
  ], [plan?.customScenarios]);

  const metrics = useMemo(() => {
    const all: Record<string, any> = {};
    allScenarios.forEach(s => {
      const series = buildSeries(products, fixedExpenses, periods, s, weeklyHorizon, rampUp, baseInputTons);
      const totalRev = series.reduce((a, x) => a + x.revenue, 0);
      const totalOp  = series.reduce((a, x) => a + x.opex, 0);
      const totalEb  = series.reduce((a, x) => a + x.ebitda, 0);
      const totalNet = series.reduce((a, x) => a + x.net, 0);
      const ebMargin = totalRev > 0 ? totalEb / totalRev : 0;
      let cum = -4_800_000;
      let payback: number | null = null;
      series.forEach((x, i) => { cum += x.net; if (payback == null && cum >= 0) payback = i + 1; });
      all[s.id] = { scenario: s, totalRev, totalOp, totalEb, totalNet, ebMargin, payback, series };
    });
    return all;
  }, [allScenarios, products, fixedExpenses, periods, weeklyHorizon, rampUp, baseInputTons]);

  const handleSaveScenario = useCallback((scen: Scenario) => {
    if (!plan || !onSave) return;
    const existing = plan.customScenarios ?? [];
    const has = existing.some(s => s.id === scen.id);
    const updated = has
      ? existing.map(s => s.id === scen.id ? scen : s)
      : [...existing, scen];
    onSave({ ...plan, customScenarios: updated });
    setModalOpen(false);
    setEditingScen(null);
  }, [plan, onSave]);

  const handleDeleteScenario = useCallback((id: string) => {
    if (!plan || !onSave) return;
    onSave({ ...plan, customScenarios: (plan.customScenarios ?? []).filter(s => s.id !== id) });
  }, [plan, onSave]);

  const quarterlyCompare = useMemo(() => {
    const quarters: any[] = [];
    for (let q = 0; q < 8; q++) {
      const months = [q*3, q*3+1, q*3+2];
      const row: any = { label: `Ç${(q%4)+1} ${months[0] < 12 ? '25' : '26'}` };
      allScenarios.forEach(s => {
        let sum = 0;
        months.forEach(m => { sum += metrics[s.id]?.series[m]?.revenue ?? 0; });
        row[s.id] = sum;
      });
      quarters.push(row);
    }
    return quarters;
  }, [metrics, allScenarios]);

  return (
    <div className="space-y-5">
      {modalOpen && (
        <ScenarioModal
          editing={editingScen}
          usedColors={allScenarios.map(s => s.color)}
          onClose={() => { setModalOpen(false); setEditingScen(null); }}
          onSave={handleSaveScenario}
        />
      )}
      <Card className="!p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">Senaryo Yönetimi</div>
            <h2 className="text-lg font-semibold">{allScenarios.length} Senaryo · 24 Aylık Karşılaştırma</h2>
            <p className="text-[12.5px] text-enba-muted mt-1.5 max-w-2xl">
              Her senaryo, gelir ve maliyet varsayımlarının üzerine çarpan uygular.
              Senaryolar arasındaki farkları görerek riski ölçer ve aksiyon planları hazırlarsınız.
            </p>
          </div>
          {onSave && (
            <Btn variant="primary" icon={<I.Plus size={14}/>} onClick={() => { setEditingScen(null); setModalOpen(true); }}>
              Yeni Senaryo
            </Btn>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {allScenarios.map(s => {
          const isCustom = !(s.id in SCENARIOS);
          return (
            <ScenarioCard key={s.id} scenario={s} metrics={metrics[s.id]}
              focused={focused === s.id} onFocus={() => setFocused(s.id)}
              onEdit={onSave ? () => { setEditingScen(s); setModalOpen(true); } : undefined}
              onDelete={isCustom && onSave ? () => handleDeleteScenario(s.id) : undefined}
            />
          );
        })}
      </div>

      <Card padded={false}>
        <div className="px-5 py-3 border-b border-enba-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-semibold">Senaryo Metrikleri Karşılaştırması</h4>
            {/* Toplam / Aylık toggle */}
            <div className="flex items-center rounded-lg border border-enba-line overflow-hidden text-[11px] ml-1">
              <button
                onClick={() => setMetricMode('total')}
                className={cx(
                  'px-3 py-1.5 transition-colors',
                  metricMode === 'total'
                    ? 'bg-enba-orange text-white font-semibold'
                    : 'text-enba-muted hover:text-enba-text hover:bg-enba-panel-2',
                )}
              >
                24 ay toplam
              </button>
              <button
                onClick={() => setMetricMode('monthly')}
                className={cx(
                  'px-3 py-1.5 border-l border-enba-line transition-colors',
                  metricMode === 'monthly'
                    ? 'bg-enba-orange text-white font-semibold'
                    : 'text-enba-muted hover:text-enba-text hover:bg-enba-panel-2',
                )}
              >
                aylık ort.
              </button>
            </div>
          </div>
          <Btn variant="outline" size="sm" icon={<I.Pdf size={12}/>}>Excel</Btn>
        </div>
        <ComparisonTable metrics={metrics} mode={metricMode} scenarios={allScenarios}/>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-7" padded={false}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">Çeyreklik</div>
              <h3 className="text-base font-semibold">Senaryo Bazında Gelir Karşılaştırması</h3>
            </div>
            <div className="flex items-center gap-3 text-[10.5px] text-enba-muted">
              {allScenarios.map(s => (
                <span key={s.id} className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{background: s.color}}/>{s.label}
                </span>
              ))}
            </div>
          </div>
          <div className="h-[260px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyCompare} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval={xInterval(quarterlyCompare.length)} tick={{ fontSize: 10, fill: cc.muted }}/>
                <YAxis tickFormatter={(v) => (v/1_000_000).toFixed(1)+'M'} tickLine={false} axisLine={false} width={48} tick={{ fontSize: 10, fill: cc.muted }}/>
                <Tooltip formatter={(v: any, k: any) => [fmtTL(v), SCENARIOS[k]?.label || k]}/>
                {allScenarios.map(s => (
                  <Bar key={s.id} dataKey={s.id} fill={s.color} radius={[3,3,0,0]}/>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-5">
          <SectionTitle eyebrow="Hassasiyet" title="Tek Değişken Analizi"/>
          <SensitivityAnalysis/>
        </Card>
      </div>

      <Card padded={false}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">Kümülatif</div>
            <h3 className="text-base font-semibold">EBITDA Birikim Eğrisi</h3>
          </div>
          <div className="flex items-center gap-3 text-[10.5px] text-enba-muted">
            {allScenarios.map(s => (
              <span key={s.id} className="inline-flex items-center gap-1.5">
                <span className="w-3 h-[2px]" style={{background: s.color}}/>{s.label}
              </span>
            ))}
          </div>
        </div>
        <div className="h-[260px] px-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={periods.slice(0, 24).map((p, i) => {
                const row: any = { label: p.label };
                allScenarios.forEach(s => {
                  let cum = 0;
                  for (let j = 0; j <= i; j++) cum += metrics[s.id]?.series[j]?.ebitda ?? 0;
                  row[s.id] = cum;
                });
                return row;
              })}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
              <XAxis dataKey="label" tickLine={false} axisLine={false} interval={xInterval(periods.length)} tick={{ fontSize: 10, fill: cc.muted }}/>
              <YAxis tickFormatter={(v) => (v/1_000_000).toFixed(0)+'M'} tickLine={false} axisLine={false} width={48} tick={{ fontSize: 10, fill: cc.muted }}/>
              <Tooltip formatter={(v: any, k: any) => [fmtTL(v), allScenarios.find(s => s.id === k)?.label || k]}/>
              {allScenarios.map(s => (
                <Line key={s.id} type="monotone" dataKey={s.id} stroke={s.color} strokeWidth={2.2} dot={false} name={s.label}/>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

const ScenarioCard = ({ scenario, metrics, focused, onFocus, onEdit, onDelete }:
  { scenario: Scenario; metrics: any; focused: boolean; onFocus: () => void; onEdit?: () => void; onDelete?: () => void }) => {
  if (!metrics) return null;
  return (
    <div
      className={cx('rounded-xl border p-5 cursor-pointer transition-all relative overflow-hidden',
        focused ? '' : 'bg-enba-panel border-enba-line hover:border-enba-line-2')}
      style={focused ? { background: `linear-gradient(135deg, ${scenario.color}18 0%, transparent 60%)`, borderColor: scenario.color + '66' } : {}}
      onClick={onFocus}>
      {focused && (
        <div className="absolute top-0 right-0 px-2 py-0.5 text-[9.5px] uppercase tracking-[0.16em] font-semibold rounded-bl-md"
          style={{ background: scenario.color, color: 'white' }}>Odaklanmış</div>
      )}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-2.5 h-2.5 rounded-full" style={{background: scenario.color, boxShadow: `0 0 12px ${scenario.color}`}}/>
        <h3 className="text-[15px] font-semibold" style={{color: scenario.color}}>{scenario.label}</h3>
        <div className="ml-auto flex items-center gap-1">
          {onEdit && (
            <button className="text-enba-dim hover:text-enba-text p-1 rounded hover:bg-enba-panel-2"
              onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Düzenle">
              <I.Edit size={13}/>
            </button>
          )}
          {onDelete && (
            <button className="text-enba-dim hover:text-red-500 p-1 rounded hover:bg-red-50"
              onClick={(e) => { e.stopPropagation(); if (window.confirm('Bu senaryoyu sil?')) onDelete(); }} title="Sil">
              <I.Trash size={13}/>
            </button>
          )}
        </div>
      </div>
      <p className="text-[11.5px] text-enba-muted leading-snug mb-4 min-h-[34px]">{scenario.hint}</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-enba-panel-2/60 rounded-md px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-wider text-enba-dim">Gelir Çarpanı</div>
          <div className="text-[15px] font-semibold tabular mt-0.5">{(scenario.rev * 100).toFixed(0)}%</div>
        </div>
        <div className="bg-enba-panel-2/60 rounded-md px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-wider text-enba-dim">Maliyet Çarpanı</div>
          <div className="text-[15px] font-semibold tabular mt-0.5">{(scenario.cost * 100).toFixed(0)}%</div>
        </div>
      </div>
      <div className="space-y-1.5 pt-3 border-t border-enba-line/50">
        <ScenarioMetric label="Toplam Gelir" value={fmtTL(metrics.totalRev)} accent={scenario.color}/>
        <ScenarioMetric label="EBITDA" value={fmtTL(metrics.totalEb)} sub={fmtPct(metrics.ebMargin, 1)+' marj'}/>
        <ScenarioMetric label="Net Kâr" value={fmtTL(metrics.totalNet)} accent={metrics.totalNet >= 0 ? '#3DBE7C' : '#E5484D'}/>
        <ScenarioMetric label="Geri Ödeme" value={metrics.payback ? `${metrics.payback} ay` : '> 24 ay'}/>
      </div>
    </div>
  );
};

const ScenarioMetric = ({ label, value, sub, accent }:
  { label: string; value: string; sub?: string; accent?: string }) => (
  <div className="flex items-center justify-between text-[12px]">
    <span className="text-enba-muted">{label}</span>
    <div className="text-right">
      <span className="font-semibold tabular" style={accent ? { color: accent } : {}}>{value}</span>
      {sub && <span className="text-[10.5px] text-enba-dim tabular ml-1.5">{sub}</span>}
    </div>
  </div>
);

const ComparisonTable = ({ metrics, mode, scenarios }: { metrics: Record<string, any>; mode: 'total' | 'monthly'; scenarios: Scenario[] }) => {
  const N   = 24;
  const div = mode === 'monthly' ? N : 1;
  const lbl = (base: string) => mode === 'monthly' ? `Aylık Ort. ${base}` : `Toplam ${base} (24 ay)`;

  const ids = scenarios.map(s => s.id);
  const baz = metrics.baz;
  const rows = [
    { label: 'Gelir Çarpanı',    getter: (m: any) => (m.scenario.rev  * 100).toFixed(0) + '%', raw: (m: any) => m.scenario.rev  },
    { label: 'Maliyet Çarpanı',  getter: (m: any) => (m.scenario.cost * 100).toFixed(0) + '%', raw: (m: any) => m.scenario.cost },
    { label: lbl('Gelir'),        getter: (m: any) => fmtTL(m.totalRev  / div), raw: (m: any) => m.totalRev  / div, money: true },
    { label: lbl('Gider'),        getter: (m: any) => fmtTL(m.totalOp   / div), raw: (m: any) => m.totalOp   / div, money: true, inverse: true },
    { label: lbl('EBITDA'),       getter: (m: any) => fmtTL(m.totalEb   / div), raw: (m: any) => m.totalEb   / div, money: true },
    { label: 'EBITDA Marjı',      getter: (m: any) => fmtPct(m.ebMargin, 1),    raw: (m: any) => m.ebMargin },
    { label: lbl('Net Kâr'),      getter: (m: any) => fmtTL(m.totalNet  / div), raw: (m: any) => m.totalNet  / div, money: true },
    { label: 'Geri Ödeme Süresi', getter: (m: any) => m.payback ? `${m.payback} ay` : '> 24 ay', raw: (m: any) => m.payback ?? 999, inverse: true },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12.5px] tabular">
        <thead>
          <tr className="text-enba-muted bg-enba-panel-2/40">
            <th className="border-b border-enba-line px-5 py-2.5 text-left font-medium min-w-[200px]">Metrik</th>
            {ids.map(id => {
              const s = SCENARIOS[id];
              return (
                <th key={id} className="border-b border-l border-enba-line px-4 py-2.5 text-right font-medium" style={{ minWidth: 160 }}>
                  <div className="flex items-center justify-end gap-2">
                    <span className="w-2 h-2 rounded-full" style={{background: s.color}}/>
                    <span style={{color: s.color}}>{s.label}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.label} className={cx('hover:bg-enba-panel-2/30',
              idx === 4 && 'border-t-2 border-enba-orange/30', r.money && 'font-medium')}>
              <td className="border-b border-enba-line px-5 py-2.5 text-enba-text">{r.label}</td>
              {ids.map(id => {
                const m = metrics[id];
                const bazRaw = r.raw(baz);
                const thisRaw = r.raw(m);
                const diff = thisRaw - bazRaw;
                const diffPct = bazRaw !== 0 ? (diff / bazRaw) : 0;
                const isBaz = id === 'baz';
                const better = r.inverse ? diff < 0 : diff > 0;
                return (
                  <td key={id} className="border-b border-l border-enba-line px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-enba-text">{r.getter(m)}</span>
                      {!isBaz && (
                        <span className={cx('text-[10.5px] tabular px-1 rounded',
                          better ? 'text-enba-green bg-enba-green/10' : 'text-enba-red bg-enba-red/10')}>
                          {diffPct > 0 ? '+' : ''}{(diffPct*100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SensitivityAnalysis = () => {
  const [priceShift, setPriceShift] = useState(0);
  const [volShift, setVolShift]     = useState(0);
  const [costShift, setCostShift]   = useState(0);

  const { products, fixedExpenses, periods, weeklyHorizon, rampUp, baseInputTons } = usePlanData();
  const baseScen = SCENARIOS.baz;
  const result = useMemo(() => {
    let rev = 0, opex = 0;
    for (let i = 0; i < 24; i++) {
      const periodRev = products.reduce((s, p) => {
        return s + monthlyPriceFor(p, i) * (1 + priceShift) * monthlyVolumeFor(p, i) * (1 + volShift);
      }, 0);
      const periodVar = products.reduce((s, p) => {
        const baseRev = monthlyPriceFor(p, i) * (1 + priceShift) * monthlyVolumeFor(p, i) * (1 + volShift);
        return s + baseRev * p.varCostRatio * (1 + costShift);
      }, 0);
      const periodFix = fixedExpenses.reduce((s, e) => s + fixedCostFor(e, i, baseScen) * (1 + costShift), 0);
      rev += periodRev; opex += periodVar + periodFix;
    }
    const ebitda = rev - opex;
    return { rev, opex, ebitda, margin: rev > 0 ? ebitda/rev : 0 };
  }, [priceShift, volShift, costShift]);

  const baseMetrics = useMemo(() => {
    const series = buildSeries(products, fixedExpenses, periods, baseScen, weeklyHorizon, rampUp, baseInputTons);
    const rev = series.reduce((a, x) => a + x.revenue, 0);
    const eb  = series.reduce((a, x) => a + x.ebitda, 0);
    return { rev, eb };
  }, [products, fixedExpenses, periods, weeklyHorizon, rampUp, baseInputTons]);

  const revDelta = baseMetrics.rev !== 0 ? (result.rev - baseMetrics.rev) / baseMetrics.rev : 0;
  const ebDelta  = baseMetrics.eb  !== 0 ? (result.ebitda - baseMetrics.eb) / baseMetrics.eb  : 0;

  return (
    <div>
      <p className="text-[11.5px] text-enba-muted mb-4 leading-snug">
        Baz senaryo üzerinde değişiklik yaparak sonucu canlı görün.
      </p>
      <SensSlider label="Birim Fiyat"  value={priceShift} onChange={setPriceShift}/>
      <SensSlider label="Satış Hacmi"  value={volShift}   onChange={setVolShift}/>
      <SensSlider label="Maliyetler"   value={costShift}  onChange={setCostShift}/>
      <div className="mt-5 pt-4 border-t border-enba-line space-y-2.5">
        <SensResult label="Toplam Gelir"  value={fmtTL(result.rev)}    delta={revDelta} better={revDelta >= 0}/>
        <SensResult label="EBITDA"        value={fmtTL(result.ebitda)} delta={ebDelta}  better={ebDelta >= 0}/>
        <SensResult label="EBITDA Marjı"  value={fmtPct(result.margin, 1)} delta={null}/>
      </div>
      <button onClick={() => { setPriceShift(0); setVolShift(0); setCostShift(0); }}
        className="mt-4 text-[11.5px] text-enba-orange hover:underline inline-flex items-center gap-1">
        <I.Refresh size={11}/> Sıfırla
      </button>
    </div>
  );
};

const SensSlider = ({ label, value, onChange }:
  { label: string; value: number; onChange: (v: number) => void }) => {
  const pct = value * 100;
  return (
    <div className="mb-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-enba-text">{label}</span>
        <span className={cx('text-[11.5px] tabular font-medium px-1.5 py-0.5 rounded',
          pct > 0 ? 'text-enba-green bg-enba-green/10' : pct < 0 ? 'text-enba-red bg-enba-red/10' : 'text-enba-muted bg-enba-panel-2')}>
          {pct > 0 ? '+' : ''}{pct.toFixed(0)}%
        </span>
      </div>
      <input type="range" min={-30} max={30} step={1} value={Math.round(pct)}
        onChange={(e) => onChange(Number(e.target.value)/100)}
        className="w-full dp-sens-slider"/>
      <style>{`
        .dp-sens-slider { -webkit-appearance: none; appearance: none; height: 4px;
          background: rgb(var(--enba-line)); border-radius: 2px; outline: none; }
        .dp-sens-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
          width: 16px; height: 16px; background: var(--enba-orange, #E35205);
          border-radius: 50%; cursor: pointer; border: 2px solid rgb(var(--enba-panel)); }
        .dp-sens-slider::-moz-range-thumb { width: 16px; height: 16px;
          background: var(--enba-orange, #E35205); border-radius: 50%; cursor: pointer;
          border: 2px solid rgb(var(--enba-panel)); }
      `}</style>
      <div className="flex justify-between text-[9.5px] text-enba-dim mt-0.5 tabular">
        <span>−30%</span><span>0</span><span>+30%</span>
      </div>
    </div>
  );
};

const SensResult = ({ label, value, delta, better = true }:
  { label: string; value: string; delta: number | null; better?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-[12px] text-enba-muted">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-[13.5px] font-semibold tabular">{value}</span>
      {delta != null && (
        <span className={cx('text-[10.5px] tabular px-1 rounded',
          better ? 'text-enba-green bg-enba-green/10' : 'text-enba-red bg-enba-red/10')}>
          {delta > 0 ? '+' : ''}{(delta*100).toFixed(1)}%
        </span>
      )}
    </div>
  </div>
);

// ─── Senaryo Ekleme / Düzenleme Modalı ───────────────────────────────────────

const PRESET_COLORS = ['#6366F1','#F59E0B','#8B5CF6','#06B6D4','#EC4899','#14B8A6'];

function ScenarioModal({ editing, usedColors, onClose, onSave }: {
  editing:    Scenario | null;
  usedColors: string[];
  onClose:    () => void;
  onSave:     (s: Scenario) => void;
}) {
  const isNew = !editing;
  const availableColor = PRESET_COLORS.find(c => !usedColors.includes(c)) ?? PRESET_COLORS[0];
  const [label, setLabel] = useState(editing?.label ?? '');
  const [hint,  setHint]  = useState(editing?.hint  ?? '');
  const [rev,   setRev]   = useState(Math.round((editing?.rev  ?? 1) * 100));
  const [cost,  setCost]  = useState(Math.round((editing?.cost ?? 1) * 100));
  const [color, setColor] = useState(editing?.color ?? availableColor);

  const handleSubmit = () => {
    if (!label.trim()) return;
    onSave({ id: editing?.id ?? crypto.randomUUID(), label: label.trim(), hint: hint.trim(), rev: rev / 100, cost: cost / 100, color });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-enba-panel border border-enba-line rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold">{isNew ? 'Yeni Senaryo' : 'Senaryoyu Düzenle'}</h3>
          <button onClick={onClose} className="text-enba-muted hover:text-enba-text"><I.X size={16}/></button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-medium text-enba-muted uppercase tracking-wide">Senaryo Adı *</label>
          <input autoFocus value={label} onChange={e => setLabel(e.target.value)} placeholder="örn. Agresif Büyüme"
            className="w-full bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-enba-orange"/>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-medium text-enba-muted uppercase tracking-wide">Açıklama</label>
          <input value={hint} onChange={e => setHint(e.target.value)} placeholder="Kısa varsayım özeti"
            className="w-full bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-enba-orange"/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] font-medium text-enba-muted uppercase tracking-wide">
              Gelir <span className={cx('font-semibold', rev >= 100 ? 'text-enba-green' : 'text-enba-red')}>{rev}%</span>
            </label>
            <input type="range" min={50} max={150} step={1} value={rev} onChange={e => setRev(Number(e.target.value))} className="dp-sens-slider w-full"/>
            <div className="flex justify-between text-[9.5px] text-enba-dim tabular"><span>50%</span><span>100%</span><span>150%</span></div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] font-medium text-enba-muted uppercase tracking-wide">
              Maliyet <span className={cx('font-semibold', cost <= 100 ? 'text-enba-green' : 'text-enba-red')}>{cost}%</span>
            </label>
            <input type="range" min={50} max={150} step={1} value={cost} onChange={e => setCost(Number(e.target.value))} className="dp-sens-slider w-full"/>
            <div className="flex justify-between text-[9.5px] text-enba-dim tabular"><span>50%</span><span>100%</span><span>150%</span></div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[11.5px] font-medium text-enba-muted uppercase tracking-wide">Renk</label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={cx('w-7 h-7 rounded-full border-2 transition-transform', color === c ? 'border-enba-text scale-110' : 'border-transparent hover:scale-105')}
                style={{ background: c }}/>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-enba-line">
          <button onClick={onClose} className="px-4 py-2 text-[12.5px] text-enba-muted hover:text-enba-text rounded-lg hover:bg-enba-panel-2">İptal</button>
          <button onClick={handleSubmit} disabled={!label.trim()}
            className="px-4 py-2 text-[12.5px] font-semibold rounded-lg bg-enba-orange text-white hover:bg-enba-orange/90 disabled:opacity-40 disabled:cursor-not-allowed">
            {isNew ? 'Ekle' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
