import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip,
  ReferenceLine, Bar, Line,
} from 'recharts';
import {
  SCENARIOS,
  cashFlowFor, fmtTL, Scenario, usePlanData, buildMonths,
} from './dpData';
import { cx, Card, Segmented, Btn, Badge, I, useChartColors } from './DPPrimitives';

export const CashFlowPanel = ({ scenarioId, periodGranularity }:
  { scenarioId: string; periodGranularity: string }) => {
  const scen: Scenario = SCENARIOS[scenarioId];
  const cc = useChartColors();
  const { products, fixedExpenses, cashEvents, openingCash, startYear, startMonth } = usePlanData();
  const [horizon, setHorizon] = useState(24);

  // CashFlow her zaman aylık granülaritede çalışır — kendi period serisini inşa eder.
  // PlanCtx'in granularity'sine bağlı değil; aksi hâlde quarterly/annual modda
  // periods[i] yanlış veya tanımsız dönem etiketi döndürür.
  const monthlyPeriods = useMemo(
    () => buildMonths(horizon, startYear, startMonth),
    [horizon, startYear, startMonth],
  );

  const series = useMemo(() => {
    let balance = openingCash;
    const rows: any[] = [];
    let minBalance = balance, minIdx = -1;
    for (let i = 0; i < horizon; i++) {
      const f = cashFlowFor(i, scen, products, fixedExpenses, cashEvents);
      balance += f.net;
      if (balance < minBalance) { minBalance = balance; minIdx = i; }
      rows.push({ ...(monthlyPeriods[i] ?? { label: `M${i+1}`, key: `m${i}` }), idx: i, ...f, balance });
    }
    return { rows, minBalance, minIdx };
  }, [scenarioId, horizon, products, fixedExpenses, monthlyPeriods, cashEvents, openingCash]);

  const totals = useMemo(() => series.rows.reduce((a: any, r: any) => ({
    operating: a.operating + r.operating,
    investing: a.investing + r.investing,
    financing: a.financing + r.financing,
    net: a.net + r.net,
  }), { operating: 0, investing: 0, financing: 0, net: 0 }), [series]);

  const endingBalance = openingCash + totals.net;

  const chartData = useMemo(() => {
    if (horizon <= 12) return series.rows.map((r: any) => ({
      label: r.label, operating: r.operating, investing: r.investing,
      financing: r.financing, balance: r.balance,
    }));
    const out: any[] = [];
    for (let i = 0; i < series.rows.length; i += 3) {
      const chunk = series.rows.slice(i, i + 3);
      if (!chunk.length) continue;
      const sum = (k: string) => chunk.reduce((s: number, x: any) => s + x[k], 0);
      out.push({
        label: `Ç${Math.floor((chunk[0].m)/3)+1} ${String(chunk[0].y).slice(2)}`,
        operating: sum('operating'), investing: sum('investing'),
        financing: sum('financing'), balance: chunk[chunk.length-1].balance,
      });
    }
    return out;
  }, [series, horizon]);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-12 gap-4">
        <CashKpi label="Dönem Başı Nakit" value={fmtTL(openingCash)} sub="01 Oca 2025" accent="neutral" icon={<I.Calendar size={14}/>} span={2}/>
        <CashKpi label="Faaliyet Nakit Akışı" value={fmtTL(totals.operating)} sub="EBITDA − vergi (24 ay)" accent="green" icon={<I.Bolt size={14}/>} span={3}/>
        <CashKpi label="Yatırım Nakit Akışı" value={fmtTL(totals.investing)} sub="CAPEX + ekipman" accent="red" icon={<I.Down size={14}/>} span={2}/>
        <CashKpi label="Finansman Nakit Akışı" value={fmtTL(totals.financing)} sub="Kredi + sermaye"
          accent={totals.financing >= 0 ? 'blue' : 'amber'} icon={<I.Refresh size={14}/>} span={2}/>
        <CashKpi label="Dönem Sonu Nakit" value={fmtTL(endingBalance)} sub={`Net değişim ${fmtTL(totals.net, {sign: true})}`}
          accent="orange" icon={<I.Cash size={14}/>} span={3}/>
      </div>

      {/* Main chart */}
      <Card padded={false}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">{horizon} ay · {scen.label}</div>
            <h3 className="text-base font-semibold">Nakit Akışı Bileşenleri & Bakiye</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-[10.5px] text-enba-muted">
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-enba-green"/>Faaliyet</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-enba-red"/>Yatırım</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-enba-blue"/>Finansman</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-1 rounded-sm bg-enba-orange"/>Bakiye</span>
            </div>
            <Segmented options={[{value:12,label:'12 ay'},{value:18,label:'18 ay'},{value:24,label:'24 ay'}]}
              value={horizon} onChange={setHorizon}/>
          </div>
        </div>
        <div className="h-[280px] px-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: cc.muted }}/>
              <YAxis yAxisId="left" tickFormatter={(v) => (v/1_000_000).toFixed(1)+'M'} tickLine={false} axisLine={false} width={50} tick={{ fontSize: 10, fill: cc.muted }}/>
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => (v/1_000_000).toFixed(1)+'M'} tickLine={false} axisLine={false} width={50} tick={{ fontSize: 10, fill: cc.muted }}/>
              <ReferenceLine y={0} yAxisId="left" stroke={cc.refLine}/>
              <Tooltip formatter={(v: any, k: any) => [fmtTL(v), ({operating:'Faaliyet',investing:'Yatırım',financing:'Finansman',balance:'Bakiye'} as any)[k] || k]}/>
              <Bar yAxisId="left" dataKey="operating" fill="#3DBE7C" stackId="cf"/>
              <Bar yAxisId="left" dataKey="investing" fill="#E5484D" stackId="cf"/>
              <Bar yAxisId="left" dataKey="financing" fill="#5B9DFF" stackId="cf" radius={[3,3,0,0]}/>
              <Line yAxisId="right" type="monotone" dataKey="balance" stroke="#E35205" strokeWidth={2.5} dot={{ r: 3, fill: '#E35205' }} name="Bakiye"/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Min balance alert */}
      {series.minBalance < 0 && (
        <div className="bg-enba-red/10 border border-enba-red/30 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-enba-red/20 text-enba-red flex items-center justify-center flex-none">
            <I.Down size={16}/>
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-enba-red">Negatif Bakiye Uyarısı</div>
            <div className="text-[12px] text-enba-muted mt-0.5">
              <span className="text-enba-text font-medium">{monthlyPeriods[series.minIdx]?.label}</span> döneminde nakit bakiyesi{' '}
              <span className="text-enba-red tabular font-medium">{fmtTL(series.minBalance)}</span> seviyesine iniyor.
              Ek kredi limiti veya ödeme planı revizyonu önerilir.
            </div>
          </div>
          <Btn variant="outline" size="sm" icon={<I.Sparkles size={12}/>}>Çözüm Öner</Btn>
        </div>
      )}

      {/* Statement table */}
      <Card padded={false} className="overflow-hidden">
        <div className="px-5 py-3 border-b border-enba-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-semibold">Nakit Akış Tablosu</h4>
            <Badge tone="neutral">Çeyreklik özet</Badge>
          </div>
          <Btn variant="outline" size="sm" icon={<I.Pdf size={12}/>}>Excel</Btn>
        </div>
        <CashStatementTable rows={series.rows} scen={scen}/>
      </Card>

      {/* Investing + financing items */}
      <div className="grid grid-cols-2 gap-4">
        <Card padded={false}>
          <div className="px-5 py-3 border-b border-enba-line flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-enba-red"/>
            <h4 className="text-[13px] font-semibold">Yatırım Faaliyetleri</h4>
            <span className="text-[11px] text-enba-dim">· {cashEvents.filter(e => e.type === 'investing').length} kalem</span>
          </div>
          <EventList type="investing"/>
        </Card>
        <Card padded={false}>
          <div className="px-5 py-3 border-b border-enba-line flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-enba-blue"/>
            <h4 className="text-[13px] font-semibold">Finansman Faaliyetleri</h4>
            <span className="text-[11px] text-enba-dim">· {cashEvents.filter(e => e.type === 'financing').length} kalem</span>
          </div>
          <EventList type="financing"/>
        </Card>
      </div>
    </div>
  );
};

const CashKpi = ({ label, value, sub, accent = 'neutral', icon, span = 3 }:
  { label: string; value: string; sub?: string; accent?: string; icon?: React.ReactNode; span?: number }) => {
  const accents: Record<string, string> = {
    neutral: 'text-enba-text', orange: 'text-enba-orange', green: 'text-enba-green',
    red: 'text-enba-red', blue: 'text-enba-blue', amber: 'text-enba-amber',
  };
  const spans: Record<number, string> = { 2:'col-span-2', 3:'col-span-3', 4:'col-span-4', 5:'col-span-5', 6:'col-span-6' };
  return (
    <div className={cx('bg-enba-panel border border-enba-line rounded-xl p-4 flex flex-col gap-2', spans[span] || 'col-span-3')}>
      <div className="flex items-center gap-2 text-enba-muted text-[11.5px] font-medium">{icon} <span>{label}</span></div>
      <div className={cx('text-[22px] font-semibold tabular leading-none', accents[accent])}>{value}</div>
      <div className="text-[10.5px] text-enba-dim leading-snug">{sub}</div>
    </div>
  );
};

const CashStatementTable = ({ rows, scen }: { rows: any[]; scen: Scenario }) => {
  const { openingCash } = usePlanData();
  const quarters = useMemo(() => {
    const out: any[] = [];
    for (let i = 0; i < rows.length; i += 3) {
      const chunk = rows.slice(i, i + 3);
      if (!chunk.length) continue;
      const sum = (k: string) => chunk.reduce((s: number, x: any) => s + x[k], 0);
      out.push({
        label: `Ç${Math.floor((chunk[0].m)/3)+1} ${chunk[0].y}`,
        operating: sum('operating'), investing: sum('investing'), financing: sum('financing'),
        net: sum('operating') + sum('investing') + sum('financing'),
        balance: chunk[chunk.length-1].balance,
      });
    }
    return out;
  }, [rows]);

  const last = quarters[quarters.length - 1];
  const total = quarters.reduce((a: any, q: any) => ({
    operating: a.operating + q.operating, investing: a.investing + q.investing,
    financing: a.financing + q.financing, net: a.net + q.net,
  }), { operating: 0, investing: 0, financing: 0, net: 0 });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12.5px] tabular">
        <thead>
          <tr className="text-enba-muted">
            <th className="sticky left-0 z-10 bg-enba-panel border-b border-r border-enba-line px-5 py-2.5 text-left font-medium min-w-[260px]">Kalem</th>
            {quarters.map((q: any) => (
              <th key={q.label} className="border-b border-enba-line px-3 py-2.5 text-right font-medium whitespace-nowrap min-w-[100px]">{q.label}</th>
            ))}
            <th className="border-b border-l border-enba-line px-5 py-2.5 text-right font-medium whitespace-nowrap min-w-[120px]">Toplam</th>
          </tr>
        </thead>
        <tbody>
          <StatementRow label="Dönem Başı Nakit" rows={quarters} resolver={(_q: any, i: number) => i === 0 ? openingCash : quarters[i-1].balance} total={openingCash} muted/>
          <SectionDivider label="Faaliyet Nakit Akışları" tone="green"/>
          <StatementRow label="Faaliyetlerden Net Nakit" rows={quarters} resolver={(q: any) => q.operating} total={total.operating} accent="green"/>
          <SectionDivider label="Yatırım Faaliyetleri" tone="red"/>
          <StatementRow label="Yatırımlara Harcanan" rows={quarters} resolver={(q: any) => q.investing} total={total.investing} accent="red"/>
          <SectionDivider label="Finansman Faaliyetleri" tone="blue"/>
          <StatementRow label="Finansman Net Nakit" rows={quarters} resolver={(q: any) => q.financing} total={total.financing} accent="blue"/>
          <tr className="bg-enba-panel-2/40">
            <td className="sticky left-0 z-10 bg-enba-panel-2/95 border-t border-b border-r border-enba-line px-5 py-2.5 font-semibold">Net Nakit Değişimi</td>
            {quarters.map((q: any, i: number) => (
              <td key={i} className={cx('border-t border-b border-enba-line px-3 py-2.5 text-right font-semibold tabular',
                q.net >= 0 ? 'text-enba-green' : 'text-enba-red')}>{fmtTL(q.net)}</td>
            ))}
            <td className="border-t border-b border-l border-enba-line px-5 py-2.5 text-right font-semibold text-enba-orange">{fmtTL(total.net)}</td>
          </tr>
          <tr className="bg-enba-orange/5">
            <td className="sticky left-0 z-10 bg-enba-orange/[0.07] border-b border-r border-enba-line px-5 py-3 font-semibold text-enba-text">Dönem Sonu Bakiye</td>
            {quarters.map((q: any, i: number) => (
              <td key={i} className="border-b border-enba-line px-3 py-3 text-right font-semibold tabular text-enba-text">{fmtTL(q.balance)}</td>
            ))}
            <td className="border-b border-l border-enba-line px-5 py-3 text-right font-semibold text-enba-orange">{fmtTL(last?.balance ?? openingCash)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const StatementRow = ({ label, rows, resolver, total, accent = 'neutral', muted = false }:
  { label: string; rows: any[]; resolver: (q: any, i: number) => number; total: number; accent?: string; muted?: boolean }) => {
  const tones: Record<string, string> = { green: 'text-enba-green', red: 'text-enba-red', blue: 'text-enba-blue', neutral: 'text-enba-text' };
  return (
    <tr className="hover:bg-enba-panel-2/30">
      <td className={cx('sticky left-0 z-10 bg-enba-panel hover:bg-enba-panel-2/40 border-b border-r border-enba-line px-5 py-2', muted && 'text-enba-muted')}>
        <span className="pl-3 text-[12.5px]">{label}</span>
      </td>
      {rows.map((q: any, i: number) => {
        const v = resolver(q, i);
        return (
          <td key={i} className={cx('border-b border-enba-line px-3 py-2 text-right tabular', muted ? 'text-enba-muted' : tones[accent])}>
            {fmtTL(v)}
          </td>
        );
      })}
      <td className={cx('border-b border-l border-enba-line px-5 py-2 text-right font-medium tabular', muted ? 'text-enba-muted' : tones[accent])}>
        {fmtTL(total)}
      </td>
    </tr>
  );
};

const SectionDivider = ({ label, tone }: { label: string; tone: string }) => {
  const tones: Record<string, string> = {
    green: 'text-enba-green bg-enba-green/[0.06]',
    red: 'text-enba-red bg-enba-red/[0.06]',
    blue: 'text-enba-blue bg-enba-blue/[0.06]',
  };
  return (
    <tr>
      <td colSpan={99} className={cx('px-5 py-1.5 border-b border-enba-line text-[10.5px] uppercase tracking-[0.16em] font-semibold', tones[tone])}>
        {label}
      </td>
    </tr>
  );
};

const EventList = ({ type }: { type: 'investing' | 'financing' }) => {
  const { cashEvents, periods } = usePlanData();
  const items = cashEvents.filter(e => e.type === type);
  return (
    <div className="divide-y divide-enba-line">
      {items.map(ev => {
        const total = ev.months.reduce((s, m) => s + m.amount, 0);
        const positive = total >= 0;
        let schedule = '';
        if (ev.months.length === 1) schedule = periods[ev.months[0].idx]?.label || '—';
        else if (ev.months.length >= 12) schedule = `Aylık · ${ev.months.length} dönem`;
        else schedule = `${ev.months.length} dönem`;
        return (
          <div key={ev.id} className="px-5 py-3 flex items-center gap-3 hover:bg-enba-panel-2/40 transition-colors">
            <div className={cx('w-8 h-8 rounded-md flex-none flex items-center justify-center',
              positive ? 'bg-enba-green/15 text-enba-green' : 'bg-enba-red/15 text-enba-red')}>
              {positive ? <I.Up size={14}/> : <I.Down size={14}/>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{ev.name}</div>
              <div className="text-[11px] text-enba-dim mt-0.5">{schedule}</div>
            </div>
            <div className={cx('text-[13px] font-semibold tabular', positive ? 'text-enba-green' : 'text-enba-red')}>
              {fmtTL(total, { sign: true })}
            </div>
            <button className="text-enba-dim hover:text-enba-text"><I.Edit size={13}/></button>
          </div>
        );
      })}
      <div className="px-5 py-3 hover:bg-enba-panel-2/40 transition-colors">
        <button className="flex items-center gap-2 text-[12px] text-enba-orange font-medium">
          <I.Plus size={13}/> Yeni {type === 'investing' ? 'Yatırım' : 'Finansman'} Kalemi Ekle
        </button>
      </div>
    </div>
  );
};
