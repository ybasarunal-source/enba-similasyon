import React, { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip,
  ReferenceLine, Area, Line, AreaChart, Bar, BarChart,
} from 'recharts';
import {
  SCENARIOS, PRODUCTS, PERIODS, buildSeries, fmtTL, fmtPct,
  revenueFor, Scenario,
} from './dpData';
import { cx, Card, SectionTitle, KpiCard, Sparkline, Variance, I, useChartColors } from './DPPrimitives';

export const OverviewPanel = ({ scenarioId, periodGranularity }:
  { scenarioId: string; periodGranularity: string }) => {
  const scen: Scenario = SCENARIOS[scenarioId];
  const cc = useChartColors();
  const series = useMemo(() => buildSeries(scen), [scenarioId]);

  const grouped = useMemo(() => {
    if (periodGranularity === 'month') return series;
    const size = periodGranularity === 'quarter' ? 3 : 12;
    const out: any[] = [];
    for (let i = 0; i < series.length; i += size) {
      const chunk = series.slice(i, i + size);
      if (!chunk.length) continue;
      const sum = (k: string) => chunk.reduce((s: number, x: any) => s + x[k], 0);
      const label = periodGranularity === 'quarter'
        ? `Ç${Math.floor((chunk[0].m)/3)+1} ${String(chunk[0].y).slice(2)}`
        : `${chunk[0].y}`;
      out.push({ label, key: chunk[0].key, idx: chunk[0].idx,
        revenue: sum('revenue'), opex: sum('opex'),
        varCost: sum('varCost'), fixCost: sum('fixCost'),
        ebitda: sum('ebitda'), net: sum('net') });
    }
    return out;
  }, [series, periodGranularity]);

  const totals = useMemo(() => series.reduce((a, x) => ({
    revenue: a.revenue + x.revenue, opex: a.opex + x.opex,
    ebitda: a.ebitda + x.ebitda, net: a.net + x.net,
  }), { revenue: 0, opex: 0, ebitda: 0, net: 0 }), [series]);

  const cashCum = useMemo(() => {
    const investment = 4_800_000;
    let cum = -investment;
    let paybackIdx: number | null = null;
    const points = series.map((x, i) => {
      cum += x.net;
      if (paybackIdx == null && cum >= 0) paybackIdx = i;
      return { ...x, cash: cum };
    });
    return { points, investment, paybackIdx };
  }, [series]);

  const ebitdaMargin = totals.revenue > 0 ? totals.ebitda / totals.revenue : 0;
  const revSpark = grouped.map(g => (g as any).revenue);

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Toplam Gelir (24 ay)" value={fmtTL(totals.revenue)}
          sub="Ürün + hizmet satırları toplamı" trend={0.182} accent="orange"
          icon={<I.Revenue size={14}/>} tooltip="Seçili senaryo altında planlanan toplam ciro"/>
        <KpiCard label="EBITDA" value={fmtTL(totals.ebitda)}
          sub={`Marj ${fmtPct(ebitdaMargin)} · Faaliyet Karı`} trend={0.241} accent="green"
          icon={<I.Sparkles size={14}/>}/>
        <KpiCard label="Net Kâr" value={fmtTL(totals.net)}
          sub="Amortisman + vergi sonrası" trend={totals.net > 0 ? 0.156 : -0.08}
          accent={totals.net > 0 ? 'green' : 'red'} icon={<I.Bolt size={14}/>}/>
        <KpiCard label="Geri Ödeme Süresi"
          value={cashCum.paybackIdx != null ? `${cashCum.paybackIdx + 1} ay` : '> 24 ay'}
          sub="₺4,8 Mn başlangıç yatırımı" accent="amber" icon={<I.Calendar size={14}/>}/>
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
            <ComposedChart data={grouped} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#E35205" stopOpacity="0.45"/>
                  <stop offset="100%" stopColor="#E35205" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
              <XAxis dataKey="label" tickLine={false} axisLine={false}/>
              <YAxis tickFormatter={(v) => v >= 1_000_000 ? (v/1_000_000).toFixed(1)+'M' : (v/1000).toFixed(0)+'K'}
                tickLine={false} axisLine={false} width={48}/>
              <Tooltip cursor={{ fill: 'rgba(227,82,5,0.05)' }} formatter={(v: any, name: any) => [fmtTL(v), name]}/>
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
            action={<div className="text-[11.5px] text-enba-muted">Başlangıç yatırımı <span className="text-enba-text tabular">{fmtTL(cashCum.investment)}</span></div>}
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
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval={2}/>
                <YAxis tickFormatter={(v) => (v/1_000_000).toFixed(1)+'M'} tickLine={false} axisLine={false} width={48}/>
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
              const ss = buildSeries(s);
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
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted">Bu Ay · Bütçe vs Gerçekleşen</div>
              <span className="text-[10.5px] text-enba-dim">May 25</span>
            </div>
            <BvaSnapshot/>
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
              {PRODUCTS.slice(0,6).map(p => (
                <div key={p.id} className="flex items-center gap-1.5 text-[10.5px] text-enba-muted">
                  <span className="w-2 h-2 rounded-sm" style={{background: p.color}}/>
                  <span className="truncate max-w-[80px]">{p.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[230px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PERIODS.slice(0,12).map((p, i) => {
                const row: any = { label: p.label };
                PRODUCTS.forEach(prod => { row[prod.id] = revenueFor(prod, i, scen); });
                return row;
              })} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
                <XAxis dataKey="label" tickLine={false} axisLine={false}/>
                <YAxis tickFormatter={(v) => (v/1000).toFixed(0)+'K'} tickLine={false} axisLine={false} width={42}/>
                <Tooltip formatter={(v: any, k: any) => [fmtTL(v), PRODUCTS.find(p => p.id === k)?.name || k]}/>
                {PRODUCTS.map((p) => (
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

const BvaSnapshot = () => {
  const rows = [
    { label: 'Granül Satışı',     budget: 4_950_000, actual: 5_180_000 },
    { label: 'Hizmet Gelirleri',  budget:   720_000, actual:   645_000 },
    { label: 'Personel Gideri',   budget:   285_000, actual:   298_000, isExpense: true },
    { label: 'Enerji',            budget:   138_000, actual:   162_000, isExpense: true },
  ];
  return (
    <div className="space-y-2">
      {rows.map(r => {
        const diff = r.actual - r.budget;
        const ratio = r.actual / r.budget;
        const good = r.isExpense ? diff <= 0 : diff >= 0;
        return (
          <div key={r.label} className="flex items-center gap-3">
            <div className="w-[110px] text-[11.5px] text-enba-muted truncate">{r.label}</div>
            <div className="flex-1 h-2 bg-enba-panel-2 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-enba-line-2" style={{ width: '100%' }}/>
              <div className={cx('absolute inset-y-0 left-0 rounded-full', good ? 'bg-enba-green' : 'bg-enba-red')}
                style={{ width: Math.min(100, ratio * 100) + '%' }}/>
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
