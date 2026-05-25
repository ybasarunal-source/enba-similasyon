import React, { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip,
  ReferenceLine, Area, Line, AreaChart, Bar, BarChart,
} from 'recharts';
import {
  SCENARIOS, buildSeries, fmtTL, fmtPct,
  revenueFor, bvaForPeriod, Scenario, usePlanData, Granularity,
} from './dpData';
import { cx, Card, SectionTitle, KpiCard, Sparkline, Variance, I, useChartColors, xInterval } from './DPPrimitives';

const GRAN_LABEL: Record<Granularity, string> = {
  weekly:    'haftalık',
  monthly:   'aylık',
  quarterly: 'çeyreklik',
  annual:    'yıllık',
};

export const OverviewPanel = ({ scenarioId }: { scenarioId: string; periodGranularity: string }) => {
  const scen: Scenario = SCENARIOS[scenarioId];
  const cc = useChartColors();
  const { products, fixedExpenses, periods, weeklyHorizon, cashEvents, actualsThrough, granularity } = usePlanData();

  // weeklyHorizon buildSeries'e aktarılmalı — yoksa haftalık ramp hesaplanmaz
  const series = useMemo(
    () => buildSeries(products, fixedExpenses, periods, scen, weeklyHorizon),
    [scenarioId, products, fixedExpenses, periods, weeklyHorizon],
  );

  const totals = useMemo(() => series.reduce((a, x) => ({
    revenue: a.revenue + x.revenue, opex: a.opex + x.opex,
    ebitda: a.ebitda + x.ebitda, net: a.net + x.net,
  }), { revenue: 0, opex: 0, ebitda: 0, net: 0 }), [series]);

  // Dönem ortalaması — granülarite değişince bu değer görünür şekilde değişir
  const n   = series.length || 1;
  const avg = {
    revenue: totals.revenue / n,
    ebitda:  totals.ebitda  / n,
    net:     totals.net     / n,
  };
  const granLbl = GRAN_LABEL[granularity] ?? 'dönem';

  // Başlangıç yatırımı: yatırım nakit olaylarının toplam çıkışı.
  const totalInvestment = useMemo(
    () => cashEvents
      .filter(e => e.type === 'investing')
      .flatMap(e => e.months)
      .reduce((s, m) => s - Math.min(0, m.amount), 0),
    [cashEvents],
  );

  const cashCum = useMemo(() => {
    const investment = totalInvestment;
    let cum = investment > 0 ? -investment : 0;
    let paybackIdx: number | null = null;
    const points = series.map((x) => {
      cum += x.net;
      if (paybackIdx == null && investment > 0 && cum >= 0) paybackIdx = series.indexOf(x);
      return { ...x, cash: cum };
    });
    return { points, investment, paybackIdx };
  }, [series, totalInvestment]);

  const ebitdaMargin = totals.revenue > 0 ? totals.ebitda / totals.revenue : 0;

  return (
    <div className="space-y-5">
      {/* KPI Row — dönem ortalaması gösterir, granülarite değişince değer değişir */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label={`Ort. Gelir / ${granLbl}`}
          value={fmtTL(avg.revenue, { compact: true })}
          sub={`Plan toplamı: ${fmtTL(totals.revenue, { compact: true })} · ${n} dönem`}
          trend={0.182} accent="orange"
          icon={<I.Revenue size={14}/>}
          tooltip="Seçili granülaritede dönem başına ortalama gelir"
        />
        <KpiCard
          label={`Ort. EBITDA / ${granLbl}`}
          value={fmtTL(avg.ebitda, { compact: true })}
          sub={`Marj ${fmtPct(ebitdaMargin)} · Plan toplam ${fmtTL(totals.ebitda, { compact: true })}`}
          trend={0.241} accent="green"
          icon={<I.Sparkles size={14}/>}
        />
        <KpiCard
          label={`Ort. Net Kâr / ${granLbl}`}
          value={fmtTL(avg.net, { compact: true })}
          sub={`Plan toplam: ${fmtTL(totals.net, { compact: true })}`}
          trend={totals.net > 0 ? 0.156 : -0.08}
          accent={totals.net > 0 ? 'green' : 'red'}
          icon={<I.Bolt size={14}/>}
        />
        <KpiCard label="Geri Ödeme Süresi"
          value={
            cashCum.investment === 0
              ? '—'
              : cashCum.paybackIdx != null
                ? `${cashCum.paybackIdx + 1} ay`
                : `> ${periods.length} dönem`
          }
          sub={cashCum.investment > 0 ? `${fmtTL(cashCum.investment, { compact: true })} yatırım` : 'Yatırım nakit olayı girilmemiş'}
          accent="amber" icon={<I.Calendar size={14}/>}/>
      </div>

      {/* Revenue / Cost chart */}
      <Card>
        <SectionTitle eyebrow={`${scen.label} senaryo`} title="Gelir & Gider Projeksiyonu"
          action={
            <div className="flex items-center gap-2 text-[11.5px]">
              <LegendDot color="#E35205"/> <span className="text-enba-muted">Gelir</span>
              <LegendDot color="#9A9A9A" className="ml-3"/> <span className="text-enba-muted">Toplam Gider</span>
              <LegendDot color="#3DBE7C" className="ml-3"/> <span className="text-enba-muted">EBITDA</span>
            </div>
          }
        />
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#E35205" stopOpacity="0.45"/>
                  <stop offset="100%" stopColor="#E35205" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
              <XAxis dataKey="label" tickLine={false} axisLine={false} interval={xInterval(series.length)} tick={{ fontSize: 10, fill: cc.muted }}/>
              <YAxis tickFormatter={(v) => v >= 1_000_000 ? (v/1_000_000).toFixed(1)+'M' : (v/1000).toFixed(0)+'K'}
                tickLine={false} axisLine={false} width={48} tick={{ fontSize: 10, fill: cc.muted }}/>
              <Tooltip cursor={{ fill: 'rgba(227,82,5,0.05)' }} formatter={(v: any, name: any) => [fmtTL(v), name]} contentStyle={{ fontSize: 11 }}/>
              <Area type="monotone" dataKey="revenue" stroke="#E35205" strokeWidth={2.5} fill="url(#revGrad)" name="Gelir"/>
              <Line type="monotone" dataKey="opex" stroke={cc.muted} strokeWidth={1.8} strokeDasharray="4 3" dot={false} name="Toplam Gider"/>
              <Line type="monotone" dataKey="ebitda" stroke="#3DBE7C" strokeWidth={2} dot={false} name="EBITDA"/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two-col: cash + scenario compare */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-7">
          <SectionTitle eyebrow="Kümülatif" title="Nakit Akışı (Birikimli)"
            action={
            cashCum.investment > 0
              ? <div className="text-[11.5px] text-enba-muted">Başlangıç yatırımı <span className="text-enba-text tabular">{fmtTL(cashCum.investment)}</span></div>
              : <div className="text-[11.5px] text-enba-dim">Yatırım nakit olayı girilmemiş</div>
          }
          />
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashCum.points} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cashGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={scen.color} stopOpacity="0.5"/>
                    <stop offset="100%" stopColor={scen.color} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval={xInterval(cashCum.points.length)} tick={{ fontSize: 10, fill: cc.muted }}/>
                <YAxis tickFormatter={(v) => (v/1_000_000).toFixed(1)+'M'} tickLine={false} axisLine={false} width={48} tick={{ fontSize: 10, fill: cc.muted }}/>
                <ReferenceLine y={0} stroke={cc.refLine} strokeDasharray="3 3"/>
                {cashCum.paybackIdx != null && (
                  <ReferenceLine x={(cashCum.points[cashCum.paybackIdx] as any).label}
                    stroke="#3DBE7C" strokeDasharray="3 3"
                    label={{ value: 'Geri Ödeme', position: 'top', fill: '#3DBE7C', fontSize: 10 }}/>
                )}
                <Tooltip formatter={(v: any) => [fmtTL(v), 'Birikimli Nakit']}/>
                <Area type="monotone" dataKey="cash" stroke={scen.color} strokeWidth={2} fill="url(#cashGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-5">
          <SectionTitle eyebrow="Karşılaştırma" title="Senaryo Özeti"/>
          <div className="space-y-2">
            {Object.values(SCENARIOS).map(s => {
              const ss = buildSeries(products, fixedExpenses, periods, s, weeklyHorizon);
              const rev = ss.reduce((a, x) => a + x.revenue, 0);
              const eb = ss.reduce((a, x) => a + x.ebitda, 0);
              const margin = eb / rev;
              const active = s.id === scenarioId;
              return (
                <div key={s.id}
                  className={cx('flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors',
                    active ? 'border-transparent' : 'border-enba-line bg-enba-panel-2/40')}
                  style={active ? { background: s.color + '14', borderColor: s.color + '44' } : {}}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-none" style={{ background: s.color }}/>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium" style={{ color: active ? s.color : undefined }}>{s.label}</div>
                      <div className="text-[10.5px] text-enba-dim truncate">{s.hint}</div>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-[13px] font-semibold tabular">{fmtTL(rev)}</div>
                    <div className="text-[10.5px] text-enba-muted tabular">EBITDA marjı {fmtPct(margin)}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-enba-line">
            <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-2.5">
              Son Gerçekleşen · Bütçe vs Gerçekleşen
            </div>
            <BvaSnapshot scenarioId={scenarioId} scen={scen}/>
          </div>
        </Card>
      </div>

      {/* Activity row */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-8" padded={false}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">İlk 12 ay</div>
              <h3 className="text-base font-semibold">Aylık Gelir Dağılımı (Ürün Bazında)</h3>
            </div>
            <div className="flex items-center gap-2">
              {products.slice(0,6).map(p => (
                <div key={p.id} className="flex items-center gap-1.5 text-[10.5px] text-enba-muted">
                  <span className="w-2 h-2 rounded-sm" style={{background: p.color}}/>
                  <span className="truncate max-w-[80px]">{p.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[230px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periods.slice(0,12).map((p, i) => {
                const row: any = { label: p.label };
                products.forEach(prod => { row[prod.id] = revenueFor(prod, i, scen); });
                return row;
              })} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval={xInterval(12)} tick={{ fontSize: 10, fill: cc.muted }}/>
                <YAxis tickFormatter={(v) => (v/1000).toFixed(0)+'K'} tickLine={false} axisLine={false} width={42} tick={{ fontSize: 10, fill: cc.muted }}/>
                <Tooltip formatter={(v: any, k: any) => [fmtTL(v), products.find(p => p.id === k)?.name || k]} contentStyle={{ fontSize: 11 }}/>
                {products.map((p) => (
                  <Bar key={p.id} dataKey={p.id} stackId="rev" fill={p.color}/>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-4">
          <SectionTitle eyebrow="Aktiviteler" title="Son Değişiklikler"/>
          <div className="space-y-3">
            <ActivityItem icon={<I.Edit size={12}/>} tone="orange" who="Murat K."
              what="PET Granül (Şeffaf) fiyatını ₺27.500 → ₺28.500 olarak güncelledi." when="2 saat önce"/>
            <ActivityItem icon={<I.Plus size={12}/>} tone="green" who="Ayşe T."
              what="Yeni gider kalemi: 'Sigorta & Yasal' eklendi." when="Dün"/>
            <ActivityItem icon={<I.Sparkles size={12}/>} tone="blue" who="Sistem"
              what="İyimser senaryo katsayıları yenilendi (+%12 gelir varsayımı)." when="2 gün önce"/>
            <ActivityItem icon={<I.Check size={12}/>} tone="green" who="Onay"
              what="2025 Q1 bütçesi finalize edildi ve kilitlendi." when="3 gün önce"/>
            <ActivityItem icon={<I.Refresh size={12}/>} tone="amber" who="Murat K."
              what="Atık Toplama Hizmeti hacim varsayımı %18 → %20 (yıllık)." when="5 gün önce"/>
          </div>
        </Card>
      </div>
    </div>
  );
};

const LegendDot = ({ color, className = '' }: { color: string; className?: string }) => (
  <span className={cx('inline-block w-2 h-2 rounded-full', className)} style={{ background: color }}/>
);

const BvaSnapshot = ({ scenarioId, scen }: { scenarioId: string; scen: Scenario }) => {
  const { products, fixedExpenses, actualsThrough } = usePlanData();

  if (actualsThrough <= 0) {
    return (
      <div className="py-3 text-center text-[11px] text-enba-dim leading-snug">
        Henüz gerçekleşen veri girilmemiş.<br/>
        <span className="text-enba-muted">Bütçe Takip panelinden aktüel ekleyin.</span>
      </div>
    );
  }

  // Son gerçekleşen aya ait bütçe vs gerçekleşen özet satırları
  const lastActualMonth = actualsThrough - 1;
  const bva = bvaForPeriod(lastActualMonth, scen, products, fixedExpenses, actualsThrough);

  const rows = [
    { label: 'Gelir',          budget: bva.budget.revenue, actual: bva.actual.revenue, isExpense: false },
    { label: 'Değ. Maliyet',   budget: bva.budget.varCost, actual: bva.actual.varCost, isExpense: true  },
    { label: 'Sabit Gider',    budget: bva.budget.fixCost, actual: bva.actual.fixCost, isExpense: true  },
    { label: 'EBITDA',         budget: bva.budget.ebitda,  actual: bva.actual.ebitda,  isExpense: false },
  ];

  return (
    <div className="space-y-2">
      {rows.map(r => {
        const diff  = r.actual - r.budget;
        const ratio = r.budget !== 0 ? Math.abs(r.actual / r.budget) : 1;
        const good  = r.isExpense ? diff <= 0 : diff >= 0;
        return (
          <div key={r.label} className="flex items-center gap-3">
            <div className="w-[110px] text-[11.5px] text-enba-muted truncate">{r.label}</div>
            <div className="flex-1 h-2 bg-enba-panel-2 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-enba-line-2" style={{ width: '100%' }}/>
              <div
                className={cx('absolute inset-y-0 left-0 rounded-full', good ? 'bg-enba-green' : 'bg-enba-red')}
                style={{ width: Math.min(100, ratio * 100) + '%' }}
              />
            </div>
            <div className="w-[80px] text-right">
              <Variance value={r.isExpense ? -diff : diff}/>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ActivityItem = ({ icon, who, what, when, tone = 'orange' }:
  { icon: React.ReactNode; who: string; what: string; when: string; tone?: string }) => {
  const tones: Record<string, string> = {
    orange: 'bg-enba-orange/15 text-enba-orange', green: 'bg-enba-green/15 text-enba-green',
    blue: 'bg-enba-blue/15 text-enba-blue', amber: 'bg-enba-amber/15 text-enba-amber',
  };
  return (
    <div className="flex gap-3">
      <div className={cx('w-6 h-6 rounded-md flex items-center justify-center flex-none', tones[tone])}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] text-enba-text leading-snug">
          <span className="font-medium">{who}</span> <span className="text-enba-muted">{what}</span>
        </div>
        <div className="text-[10.5px] text-enba-dim mt-0.5">{when}</div>
      </div>
    </div>
  );
};
