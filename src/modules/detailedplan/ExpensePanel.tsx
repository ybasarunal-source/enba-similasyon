import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar,
  LineChart, Area, ReferenceLine,
} from 'recharts';
import {
  SCENARIOS, fmtTL, fmtPct,
  revenueFor, varCostFor, fixedCostFor, facilityShareFor, sumForPeriod,
  Scenario, usePlanData, ActiveProject, FixedExpense, Period,
} from './dpData';
import { cx, Card, SectionTitle, Segmented, Badge, useChartColors, xInterval } from './DPPrimitives';

type TabId = 'all' | 'facility' | 'project' | 'variable';

export const ExpensePanel = ({ scenarioId, periodGranularity }:
  { scenarioId: string; periodGranularity: string }) => {
  const scen: Scenario = SCENARIOS[scenarioId];
  const cc = useChartColors();
  const { facilityExpenses, projects, products, fixedExpenses, periods } = usePlanData();
  const [horizon, setHorizon] = useState(12);
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const visiblePeriods = periods.slice(0, horizon);
  const allProducts      = useMemo(() => projects.flatMap(p => p.revenues), [projects]);
  const allProjExpenses  = useMemo(() => projects.flatMap(p => p.expenses), [projects]);

  const totals = useMemo(() => {
    let facility = 0, projFixed = 0, variable = 0;
    for (let i = 0; i < visiblePeriods.length; i++) {
      const p = visiblePeriods[i];
      facility  += sumForPeriod(p, i, mi => facilityExpenses.reduce((s, e) => s + fixedCostFor(e, mi, scen), 0));
      projFixed += sumForPeriod(p, i, mi => allProjExpenses.reduce((s, e) => s + fixedCostFor(e, mi, scen), 0));
      variable  += sumForPeriod(p, i, mi => allProducts.reduce((s, prod) => s + varCostFor(prod, mi, scen), 0));
    }
    return { facility, projFixed, variable, total: facility + projFixed + variable };
  }, [scenarioId, horizon, facilityExpenses, projects, visiblePeriods]);

  const monthlySeries = useMemo(() => visiblePeriods.map((p, i) => ({
    label:    p.label,
    tesis:    sumForPeriod(p, i, mi => facilityExpenses.reduce((s, e) => s + fixedCostFor(e, mi, scen), 0)),
    proje:    sumForPeriod(p, i, mi => allProjExpenses.reduce((s, e) => s + fixedCostFor(e, mi, scen), 0)),
    degisken: sumForPeriod(p, i, mi => allProducts.reduce((s, prod) => s + varCostFor(prod, mi, scen), 0)),
  })), [scenarioId, horizon, facilityExpenses, projects, visiblePeriods]);

  const facilityTotals = useMemo(() => facilityExpenses.map(e => {
    let sum = 0;
    for (let i = 0; i < visiblePeriods.length; i++) sum += sumForPeriod(visiblePeriods[i], i, mi => fixedCostFor(e, mi, scen));
    return { ...e, sum };
  }), [scenarioId, horizon, facilityExpenses, visiblePeriods]);

  const fShare = totals.facility   / (totals.total || 1);
  const pShare = totals.projFixed  / (totals.total || 1);
  const vShare = totals.variable   / (totals.total || 1);

  const tabs: { value: TabId; label: string; count?: number }[] = [
    { value: 'all',      label: 'Tümü' },
    { value: 'facility', label: 'Tesis Giderleri',   count: facilityExpenses.length },
    { value: 'project',  label: 'Proje Giderleri',   count: projects.length },
    { value: 'variable', label: 'Değişken Giderler', count: allProducts.length },
  ];

  return (
    <div className="space-y-5">
      {/* ── Özet kartları ── */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">{horizon} ay · {scen.label}</div>
          <h3 className="text-base font-semibold mb-3">Toplam Gider</h3>
          <div className="text-[28px] font-semibold text-enba-orange tabular leading-none">{fmtTL(totals.total)}</div>
          <div className="text-[11px] text-enba-dim mt-2">Aylık ort. <span className="text-enba-text tabular">{fmtTL(totals.total / Math.max(1, horizon))}</span></div>
          <div className="mt-4 h-2.5 bg-enba-panel-2 rounded-full overflow-hidden flex">
            <div className="bg-enba-orange"           style={{ width: (fShare*100)+'%' }}/>
            <div style={{ width: (pShare*100)+'%', background: '#5B9DFF' }}/>
            <div className="bg-enba-amber"            style={{ width: (vShare*100)+'%' }}/>
          </div>
          <div className="mt-3 space-y-1.5">
            <LegendRow color="#E35205" label="Tesis sabit"  value={totals.facility}  pct={fShare}/>
            <LegendRow color="#5B9DFF" label="Proje sabit"  value={totals.projFixed} pct={pShare}/>
            <LegendRow color="#F2A93B" label="Değişken"     value={totals.variable}  pct={vShare}/>
          </div>
        </Card>

        <Card className="col-span-8" padded={false}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">Aylık Trend</div>
              <h3 className="text-base font-semibold">Gider Bileşimi</h3>
            </div>
            <div className="flex items-center gap-3 text-[10.5px] text-enba-muted">
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-enba-orange"/>Tesis</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:'#5B9DFF'}}/>Proje sabit</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-enba-amber"/>Değişken</span>
            </div>
          </div>
          <div className="h-[180px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySeries} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval={xInterval(monthlySeries.length)} tick={{ fontSize: 10, fill: cc.muted }}/>
                <YAxis tickFormatter={(v) => (v/1000).toFixed(0)+'K'} tickLine={false} axisLine={false} width={42} tick={{ fontSize: 10, fill: cc.muted }}/>
                <Tooltip formatter={(v: any) => fmtTL(v)}/>
                <Bar dataKey="tesis"    stackId="x" fill="#E35205"/>
                <Bar dataKey="proje"    stackId="x" fill="#5B9DFF"/>
                <Bar dataKey="degisken" stackId="x" fill="#F2A93B" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Sekmeler ── */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center bg-enba-panel border border-enba-line rounded-lg p-0.5">
          {tabs.map(t => (
            <button key={t.value} onClick={() => setActiveTab(t.value)}
              className={cx('px-3 py-1.5 rounded-md text-[12.5px] inline-flex items-center gap-2 transition-colors',
                activeTab === t.value ? 'bg-enba-orange text-white' : 'text-enba-muted hover:text-enba-text')}>
              {t.label}
              {t.count !== undefined && (
                <span className={cx('text-[10.5px] px-1.5 py-0.5 rounded',
                  activeTab === t.value ? 'bg-white/15' : 'bg-enba-panel-2 text-enba-dim')}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
        <Segmented
          options={[{value:6,label:'6 ay'},{value:12,label:'12 ay'},{value:18,label:'18 ay'},{value:24,label:'24 ay'}]}
          value={horizon} onChange={setHorizon}/>
      </div>

      {/* ── Tesis Giderleri ── */}
      {(activeTab === 'all' || activeTab === 'facility') && (
        <FacilitySection facilityTotals={facilityTotals} totalFacility={totals.facility} visiblePeriods={visiblePeriods} scen={scen}/>
      )}

      {/* ── Proje Giderleri ── */}
      {(activeTab === 'all' || activeTab === 'project') && (
        <ProjectSection projects={projects} facilityExpenses={facilityExpenses} visiblePeriods={visiblePeriods} scen={scen} totalProjFixed={totals.projFixed}/>
      )}

      {/* ── Değişken Giderler ── */}
      {(activeTab === 'all' || activeTab === 'variable') && (
        <VariableSection projects={projects} visiblePeriods={visiblePeriods} scen={scen} totalVariable={totals.variable}/>
      )}

      {/* ── Alt: Gider / Gelir oranı ── */}
      <Card>
        <SectionTitle eyebrow="Verimlilik" title="Gider / Gelir Oranı"
          action={<span className="text-[10.5px] text-enba-dim">Düşük = daha verimli</span>}/>
        <ExpenseRatioChart scen={scen} horizon={horizon} cc={cc}/>
      </Card>
    </div>
  );
};

/* ─── LegendRow ─────────────────────────────────────────────────────────────── */
function LegendRow({ color, label, value, pct }: { color: string; label: string; value: number; pct: number }) {
  return (
    <div className="flex items-center gap-2 text-[11.5px]">
      <span className="w-2 h-2 rounded-full flex-none" style={{ background: color }}/>
      <span className="text-enba-muted flex-1">{label}</span>
      <span className="font-medium tabular">{fmtTL(value)}</span>
      <span className="text-enba-dim tabular w-9 text-right">{fmtPct(pct, 0)}</span>
    </div>
  );
}

/* ─── ExpenseAvatar ──────────────────────────────────────────────────────────── */
const ExpenseAvatar = ({ name }: { name: string }) => {
  const initials = name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const palette  = ['#E35205','#F2A93B','#5B9DFF','#3DBE7C','#9A6CFF','#D87CC4'];
  const h        = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const color    = palette[h % palette.length];
  return (
    <span className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-semibold flex-none"
      style={{ background: color + '20', color }}>
      {initials}
    </span>
  );
};

/* ─── FacilitySection ────────────────────────────────────────────────────────── */
function FacilitySection({ facilityTotals, totalFacility, visiblePeriods, scen }: {
  facilityTotals: (FixedExpense & { sum: number })[];
  totalFacility: number;
  visiblePeriods: Period[];
  scen: Scenario;
}) {
  if (facilityTotals.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-[12px] text-enba-dim">
          Tesis gideri girilmemiş. Plan sihirbazında <strong>Tesis Sabit Giderleri</strong> adımından ekleyin.
        </div>
      </Card>
    );
  }
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="px-5 py-3 flex items-center justify-between border-b border-enba-line">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-enba-orange"/>
          <h4 className="text-[13px] font-semibold">Tesis Giderleri</h4>
          <span className="text-[11px] text-enba-dim">· {facilityTotals.length} kalem · planın tamamında akar</span>
        </div>
        <span className="text-[12px] text-enba-muted tabular">{fmtTL(totalFacility)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px] tabular">
          <thead>
            <tr className="text-enba-muted bg-enba-panel-2/40">
              <th className="sticky left-0 z-10 bg-enba-panel-2/95 border-b border-r border-enba-line px-3 py-2.5 text-left font-medium min-w-[220px]">Kalem</th>
              <th className="border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap">Aylık</th>
              <th className="border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap">Artış</th>
              {visiblePeriods.map((p, i) => (
                <th key={p.key} className={cx('border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap min-w-[72px]',
                  i % 3 === 2 && 'border-r border-enba-line/60')}>
                  <span className={cx('text-[11px]', p.m === 0 && 'text-enba-orange')}>{p.label}</span>
                </th>
              ))}
              <th className="border-b border-l border-enba-line px-3 py-2.5 text-right font-medium min-w-[100px]">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {facilityTotals.map(e => (
              <tr key={e.id} className="group hover:bg-enba-panel-2/40 transition-colors">
                <td className="sticky left-0 z-10 bg-enba-panel group-hover:bg-enba-panel-2/90 border-b border-r border-enba-line px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <ExpenseAvatar name={e.name}/>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium text-enba-text leading-tight truncate">{e.name}</div>
                      <div className="text-[10.5px] text-enba-dim mt-0.5">{e.mcode}</div>
                    </div>
                  </div>
                </td>
                <td className="border-b border-enba-line px-2 py-2.5 text-right text-enba-text">{fmtTL(e.monthly)}</td>
                <td className="border-b border-enba-line px-2 py-2.5 text-right">
                  <span className={cx('text-[12px] tabular px-1.5 py-0.5 rounded',
                    e.growth >= 0.25 ? 'text-enba-red bg-enba-red/10' :
                    e.growth >= 0.15 ? 'text-enba-amber bg-enba-amber/10' :
                    'text-enba-green bg-enba-green/10')}>
                    +{fmtPct(e.growth, 0)}
                  </span>
                </td>
                {visiblePeriods.map((p, i) => {
                  const v = sumForPeriod(p, i, mi => fixedCostFor(e, mi, scen));
                  return (
                    <td key={i} className={cx('border-b border-enba-line px-2 py-2.5 text-right text-enba-text',
                      i % 3 === 2 && 'border-r border-enba-line/60')}>
                      {(v/1000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      <span className="text-enba-dim text-[10px]">K</span>
                    </td>
                  );
                })}
                <td className="border-b border-l border-enba-line px-3 py-2.5 text-right font-medium text-enba-orange">{fmtTL(e.sum)}</td>
              </tr>
            ))}
            <tr className="bg-enba-orange/5">
              <td className="sticky left-0 z-10 bg-enba-orange/[0.07] border-t-2 border-enba-orange/40 border-r border-enba-line px-3 py-3 font-semibold">Alt Toplam</td>
              <td className="border-t-2 border-enba-orange/40 px-2 py-3"/>
              <td className="border-t-2 border-enba-orange/40 px-2 py-3"/>
              {visiblePeriods.map((p, i) => {
                const sum = facilityTotals.reduce((s, e) => s + sumForPeriod(p, i, mi => fixedCostFor(e, mi, scen)), 0);
                return (
                  <td key={i} className={cx('border-t-2 border-enba-orange/40 px-2 py-3 text-right font-semibold text-enba-text',
                    i % 3 === 2 && 'border-r border-enba-line/60')}>
                    {(sum/1000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    <span className="text-enba-dim text-[10px]">K</span>
                  </td>
                );
              })}
              <td className="border-t-2 border-l border-enba-orange/40 px-3 py-3 text-right text-enba-orange font-semibold">{fmtTL(totalFacility)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ─── ProjectSection ─────────────────────────────────────────────────────────── */
function ProjectSection({ projects, facilityExpenses, visiblePeriods, scen, totalProjFixed }: {
  projects: ActiveProject[];
  facilityExpenses: FixedExpense[];
  visiblePeriods: Period[];
  scen: Scenario;
  totalProjFixed: number;
}) {
  if (projects.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-[12px] text-enba-dim">
          Henüz proje girilmemiş. Plan sihirbazında <strong>Projeler</strong> adımından ekleyin.
        </div>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="w-2 h-2 rounded-full" style={{ background: '#5B9DFF' }}/>
        <h4 className="text-[13px] font-semibold">Proje Giderleri</h4>
        <span className="text-[11px] text-enba-dim">· {projects.length} proje</span>
        <span className="ml-auto text-[12px] text-enba-muted tabular">{fmtTL(totalProjFixed)}</span>
      </div>
      {projects.map(project => (
        <ProjectExpenseCard
          key={project.id}
          project={project}
          facilityExpenses={facilityExpenses}
          allProjects={projects}
          visiblePeriods={visiblePeriods}
          scen={scen}
        />
      ))}
    </div>
  );
}

/* ─── ProjectExpenseCard ─────────────────────────────────────────────────────── */
function ProjectExpenseCard({ project, facilityExpenses, allProjects, visiblePeriods, scen }: {
  project: ActiveProject;
  facilityExpenses: FixedExpense[];
  allProjects: ActiveProject[];
  visiblePeriods: Period[];
  scen: Scenario;
}) {
  const expenseTotals = useMemo(() => project.expenses.map(e => {
    let sum = 0;
    for (let i = 0; i < visiblePeriods.length; i++) sum += sumForPeriod(visiblePeriods[i], i, mi => fixedCostFor(e, mi, scen));
    return { ...e, sum };
  }), [project.expenses, visiblePeriods, scen]);

  const facilityAllocPerPeriod = useMemo(() => visiblePeriods.map((p, i) => {
    const span   = p.spanMonths ?? 1;
    const offset = p.monthOffset ?? i;
    let total = 0;
    for (let s = 0; s < span; s++) {
      const mi = offset + s;
      const facTotal = facilityExpenses.reduce((acc, e) => acc + fixedCostFor(e, mi, scen), 0);
      total += facTotal * facilityShareFor(project, mi, allProjects);
    }
    return total;
  }), [project, facilityExpenses, allProjects, visiblePeriods, scen]);

  const totalExpense   = expenseTotals.reduce((s, e) => s + e.sum, 0);
  const totalAllocated = facilityAllocPerPeriod.reduce((s, v) => s + v, 0);
  const projectColor   = project.color || '#5B9DFF';

  return (
    <Card padded={false} className="overflow-hidden" style={{ borderLeft: `3px solid ${projectColor}` }}>
      {/* Proje başlığı */}
      <div className="px-5 py-3 flex items-center gap-3 border-b border-enba-line">
        <div className="w-3 h-3 rounded-sm flex-none" style={{ background: projectColor }}/>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-enba-text">{project.name}</div>
          <div className="text-[10.5px] text-enba-dim">Ağırlık {project.allocationWeight} · {expenseTotals.length} kalem</div>
        </div>
        <div className="text-right">
          <div className="text-[12px] text-enba-muted tabular">
            Proje: <span className="text-enba-text font-medium">{fmtTL(totalExpense)}</span>
          </div>
          <div className="text-[11px] text-enba-dim tabular">
            +Tesis payı: {fmtTL(totalAllocated)}
          </div>
        </div>
      </div>

      {expenseTotals.length === 0 ? (
        <div className="px-5 py-4 flex items-center justify-between border-b border-enba-line">
          <span className="text-[12px] text-enba-dim italic">Bu projeye ait özel gider girilmemiş.</span>
          {totalAllocated > 0 && (
            <div className="text-right">
              <div className="text-[10.5px] text-enba-dim">Tesis payı (ağırlığa göre)</div>
              <div className="text-[13px] font-medium text-enba-orange">{fmtTL(totalAllocated)}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] tabular">
            <thead>
              <tr className="text-enba-muted bg-enba-panel-2/40">
                <th className="sticky left-0 z-10 bg-enba-panel-2/95 border-b border-r border-enba-line px-3 py-2.5 text-left font-medium min-w-[200px]">Kalem</th>
                <th className="border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap">Aylık</th>
                <th className="border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap">Artış</th>
                {visiblePeriods.map((p, i) => (
                  <th key={p.key} className={cx('border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap min-w-[72px]',
                    i % 3 === 2 && 'border-r border-enba-line/60')}>
                    <span className={cx('text-[11px]', p.m === 0 && 'text-enba-orange')}>{p.label}</span>
                  </th>
                ))}
                <th className="border-b border-l border-enba-line px-3 py-2.5 text-right font-medium min-w-[100px]">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {expenseTotals.map(e => (
                <tr key={e.id} className="group hover:bg-enba-panel-2/40 transition-colors">
                  <td className="sticky left-0 z-10 bg-enba-panel group-hover:bg-enba-panel-2/90 border-b border-r border-enba-line px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <ExpenseAvatar name={e.name}/>
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-medium text-enba-text leading-tight truncate">{e.name}</div>
                        <div className="text-[10.5px] text-enba-dim mt-0.5">{e.mcode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-enba-line px-2 py-2.5 text-right text-enba-text">{fmtTL(e.monthly)}</td>
                  <td className="border-b border-enba-line px-2 py-2.5 text-right">
                    <span className={cx('text-[12px] tabular px-1.5 py-0.5 rounded',
                      e.growth >= 0.25 ? 'text-enba-red bg-enba-red/10' :
                      e.growth >= 0.15 ? 'text-enba-amber bg-enba-amber/10' :
                      'text-enba-green bg-enba-green/10')}>
                      +{fmtPct(e.growth, 0)}
                    </span>
                  </td>
                  {visiblePeriods.map((p, i) => {
                    const v = sumForPeriod(p, i, mi => fixedCostFor(e, mi, scen));
                    return (
                      <td key={i} className={cx('border-b border-enba-line px-2 py-2.5 text-right text-enba-text',
                        i % 3 === 2 && 'border-r border-enba-line/60')}>
                        {(v/1000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        <span className="text-enba-dim text-[10px]">K</span>
                      </td>
                    );
                  })}
                  <td className="border-b border-l border-enba-line px-3 py-2.5 text-right font-medium" style={{ color: projectColor }}>{fmtTL(e.sum)}</td>
                </tr>
              ))}

              {/* Tesis payı bilgi satırı */}
              <tr className="bg-enba-orange/[0.04]">
                <td className="sticky left-0 z-10 bg-enba-orange/[0.06] border-t border-enba-orange/20 border-r border-enba-line px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-enba-orange flex-none"/>
                    <span className="text-[11.5px] text-enba-muted italic">Tesis Payı (ağırlığa göre)</span>
                  </div>
                </td>
                <td className="border-t border-enba-orange/20 px-2 py-2"/>
                <td className="border-t border-enba-orange/20 px-2 py-2"/>
                {facilityAllocPerPeriod.map((v, i) => (
                  <td key={i} className={cx('border-t border-enba-orange/20 px-2 py-2 text-right text-enba-dim italic',
                    i % 3 === 2 && 'border-r border-enba-line/60')}>
                    {(v/1000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    <span className="text-[10px]">K</span>
                  </td>
                ))}
                <td className="border-t border-l border-enba-orange/20 px-3 py-2 text-right text-enba-orange/70 font-medium">{fmtTL(totalAllocated)}</td>
              </tr>

              {/* Proje toplam (kendi gider + tesis payı) */}
              <tr className="bg-enba-panel-2">
                <td className="sticky left-0 z-10 bg-enba-panel-2 border-t-2 border-enba-line border-r border-enba-line px-3 py-3 font-semibold">Proje Toplam</td>
                <td className="border-t-2 border-enba-line px-2 py-3"/>
                <td className="border-t-2 border-enba-line px-2 py-3"/>
                {visiblePeriods.map((p, i) => {
                  const exp   = expenseTotals.reduce((s, e) => s + sumForPeriod(p, i, mi => fixedCostFor(e, mi, scen)), 0);
                  const total = exp + facilityAllocPerPeriod[i];
                  return (
                    <td key={i} className={cx('border-t-2 border-enba-line px-2 py-3 text-right font-semibold text-enba-text',
                      i % 3 === 2 && 'border-r border-enba-line/60')}>
                      {(total/1000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      <span className="text-enba-dim text-[10px]">K</span>
                    </td>
                  );
                })}
                <td className="border-t-2 border-l border-enba-line px-3 py-3 text-right font-semibold" style={{ color: projectColor }}>
                  {fmtTL(totalExpense + totalAllocated)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ─── VariableSection ────────────────────────────────────────────────────────── */
function VariableSection({ projects, visiblePeriods, scen, totalVariable }: {
  projects: ActiveProject[];
  visiblePeriods: Period[];
  scen: Scenario;
  totalVariable: number;
}) {
  const projectsWithRev = projects.filter(p => p.revenues.length > 0);
  if (projectsWithRev.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-[12px] text-enba-dim">
          Henüz gelir/değişken maliyet girilmemiş.
        </div>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="w-2 h-2 rounded-full bg-enba-amber"/>
        <h4 className="text-[13px] font-semibold">Değişken Giderler</h4>
        <span className="text-[11px] text-enba-dim">· gelirle ilişkili, proje bazında</span>
        <span className="ml-auto text-[12px] text-enba-muted tabular">{fmtTL(totalVariable)}</span>
      </div>
      {projectsWithRev.map(project => (
        <VariableProjectCard key={project.id} project={project} visiblePeriods={visiblePeriods} scen={scen}/>
      ))}
    </div>
  );
}

/* ─── VariableProjectCard ────────────────────────────────────────────────────── */
function VariableProjectCard({ project, visiblePeriods, scen }: {
  project: ActiveProject;
  visiblePeriods: Period[];
  scen: Scenario;
}) {
  const varTotals = useMemo(() => project.revenues.map(p => {
    let sum = 0;
    for (let i = 0; i < visiblePeriods.length; i++) sum += sumForPeriod(visiblePeriods[i], i, mi => varCostFor(p, mi, scen));
    return { ...p, sum };
  }), [project.revenues, visiblePeriods, scen]);

  const totalVar     = varTotals.reduce((s, p) => s + p.sum, 0);
  const projectColor = project.color || '#5B9DFF';

  return (
    <Card padded={false} className="overflow-hidden" style={{ borderLeft: `3px solid ${projectColor}` }}>
      <div className="px-5 py-3 flex items-center gap-3 border-b border-enba-line">
        <div className="w-3 h-3 rounded-sm flex-none" style={{ background: projectColor }}/>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-enba-text">{project.name}</div>
          <div className="text-[10.5px] text-enba-dim">{varTotals.length} ürün/hizmet · gelirle bağlı değişken maliyet</div>
        </div>
        <span className="text-[12px] text-enba-muted tabular font-medium">{fmtTL(totalVar)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px] tabular">
          <thead>
            <tr className="text-enba-muted bg-enba-panel-2/40">
              <th className="sticky left-0 z-10 bg-enba-panel-2/95 border-b border-r border-enba-line px-3 py-2.5 text-left font-medium min-w-[200px]">Ürün / Hizmet</th>
              <th className="border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap">Maliyet %</th>
              {visiblePeriods.map((p, i) => (
                <th key={p.key} className={cx('border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap min-w-[72px]',
                  i % 3 === 2 && 'border-r border-enba-line/60')}>
                  <span className={cx('text-[11px]', p.m === 0 && 'text-enba-orange')}>{p.label}</span>
                </th>
              ))}
              <th className="border-b border-l border-enba-line px-3 py-2.5 text-right font-medium min-w-[100px]">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {varTotals.map(prod => (
              <tr key={prod.id} className="group hover:bg-enba-panel-2/40 transition-colors">
                <td className="sticky left-0 z-10 bg-enba-panel group-hover:bg-enba-panel-2/90 border-b border-r border-enba-line px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1 h-7 rounded-sm flex-none" style={{ background: prod.color }}/>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium text-enba-text leading-tight truncate">{prod.name}</div>
                      <div className="text-[10.5px] text-enba-dim mt-0.5">{prod.mcode}</div>
                    </div>
                  </div>
                </td>
                <td className="border-b border-enba-line px-2 py-2.5 text-right">
                  <span className="text-enba-text">{fmtPct(prod.varCostRatio, 0)}</span>
                  <span className="text-enba-dim text-[10.5px]"> /gelir</span>
                </td>
                {visiblePeriods.map((p, i) => {
                  const v = sumForPeriod(p, i, mi => varCostFor(prod, mi, scen));
                  return (
                    <td key={i} className={cx('border-b border-enba-line px-2 py-2.5 text-right text-enba-text',
                      i % 3 === 2 && 'border-r border-enba-line/60')}>
                      {(v/1000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      <span className="text-enba-dim text-[10px]">K</span>
                    </td>
                  );
                })}
                <td className="border-b border-l border-enba-line px-3 py-2.5 text-right font-medium text-enba-amber">{fmtTL(prod.sum)}</td>
              </tr>
            ))}
            <tr className="bg-enba-amber/5">
              <td className="sticky left-0 z-10 bg-enba-amber/[0.07] border-t-2 border-enba-amber/40 border-r border-enba-line px-3 py-3 font-semibold">Alt Toplam</td>
              <td className="border-t-2 border-enba-amber/40 px-2 py-3"/>
              {visiblePeriods.map((p, i) => {
                const sum = project.revenues.reduce((s, prod) => s + sumForPeriod(p, i, mi => varCostFor(prod, mi, scen)), 0);
                return (
                  <td key={i} className={cx('border-t-2 border-enba-amber/40 px-2 py-3 text-right font-semibold text-enba-text',
                    i % 3 === 2 && 'border-r border-enba-line/60')}>
                    {(sum/1000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    <span className="text-enba-dim text-[10px]">K</span>
                  </td>
                );
              })}
              <td className="border-t-2 border-l border-enba-amber/40 px-3 py-3 text-right text-enba-amber font-semibold">{fmtTL(totalVar)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ─── ExpenseRatioChart ──────────────────────────────────────────────────────── */
const ExpenseRatioChart = ({ scen, horizon, cc }: { scen: Scenario; horizon: number; cc: any }) => {
  const { products, fixedExpenses, periods } = usePlanData();
  const data = periods.slice(0, horizon).map((p, i) => {
    const rev  = sumForPeriod(p, i, mi => products.reduce((s, prod) => s + revenueFor(prod, mi, scen), 0));
    const opex = sumForPeriod(p, i, mi =>
      products.reduce((s, prod) => s + varCostFor(prod, mi, scen), 0)
      + fixedExpenses.reduce((s, e) => s + fixedCostFor(e, mi, scen), 0)
    );
    return { label: p.label, ratio: rev > 0 ? opex / rev : 0 };
  });
  const avg = data.length > 0 ? data.reduce((s, x) => s + x.ratio, 0) / data.length : 0;
  return (
    <div>
      <div className="flex items-end gap-6 mb-3">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-muted mb-1">Ortalama</div>
          <div className="text-[22px] font-semibold tabular text-enba-amber leading-none">{fmtPct(avg, 1)}</div>
        </div>
        <div className="text-[11px] text-enba-dim leading-snug max-w-[260px]">
          Hedef <span className="text-enba-text">%70'in altı</span>. Ortalamanın üstünde dönemlerde maliyet baskısı artar.
        </div>
      </div>
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ratioGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#F2A93B" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#F2A93B" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={xInterval(data.length)} tick={{ fontSize: 10, fill: cc.muted }}/>
            <YAxis tickFormatter={(v) => (v*100).toFixed(0)+'%'} tickLine={false} axisLine={false} width={40} domain={[0.5, 1]} tick={{ fontSize: 10, fill: cc.muted }}/>
            <ReferenceLine y={0.7} stroke="#3DBE7C" strokeDasharray="4 3" label={{ value: 'Hedef 70%', position: 'right', fill: '#3DBE7C', fontSize: 10 }}/>
            <Tooltip formatter={(v: any) => fmtPct(v, 1)}/>
            <Area type="monotone" dataKey="ratio" stroke="#F2A93B" strokeWidth={2} fill="url(#ratioGrad)"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
