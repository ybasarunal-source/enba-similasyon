import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip,
  ReferenceLine, Line, PieChart, Pie, Cell,
} from 'recharts';
import {
  SCENARIOS, MONTHS_TR, fmtTL, fmtPct, fmtNum,
  revenueFor, varCostFor, monthlyVolumeFor, Scenario, usePlanData,
} from './dpData';
import {
  cx, Card, SectionTitle, Sparkline, Segmented, Btn, Select,
  Badge, I, useChartColors,
} from './DPPrimitives';

export const RevenuePanel = ({ scenarioId, periodGranularity }:
  { scenarioId: string; periodGranularity: string }) => {
  const scen: Scenario = SCENARIOS[scenarioId];
  const cc = useChartColors();
  const { products: allProducts, periods } = usePlanData();
  const [horizon, setHorizon] = useState(12);
  const [filterCat, setFilterCat] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [editing, setEditing] = useState<string | null>(null);

  const visiblePeriods = periods.slice(0, horizon);
  const products = allProducts.filter(p => filterCat === 'all' || p.category === filterCat);

  const productTotals = useMemo(() => products.map(p => {
    let rev = 0, vol = 0, cost = 0;
    for (let i = 0; i < visiblePeriods.length; i++) {
      rev += revenueFor(p, i, scen);
      vol += monthlyVolumeFor(p, i);
      cost += varCostFor(p, i, scen);
    }
    return { p, rev, vol, cost, gp: rev - cost, gpm: rev > 0 ? (rev - cost)/rev : 0 };
  }), [products, scenarioId, horizon]);

  const grandRev = productTotals.reduce((s, x) => s + x.rev, 0);
  const grandCost = productTotals.reduce((s, x) => s + x.cost, 0);
  const grandGP = grandRev - grandCost;

  const periodTotals = useMemo(() => visiblePeriods.map((_, i) =>
    products.reduce((s, p) => s + revenueFor(p, i, scen), 0)
  ), [products, scenarioId, horizon]);

  const toggle = (id: string) => {
    const n = new Set(expanded);
    n.has(id) ? n.delete(id) : n.add(id);
    setExpanded(n);
  };

  const catOpts = [
    { value: 'all', label: 'Tüm Kategoriler' },
    { value: 'Granül Üretim', label: 'Granül Üretim', dot: '#E35205' },
    { value: 'Hizmet', label: 'Hizmet', dot: '#5B9DFF' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">{horizon} ay · {scen.label}</div>
                <h3 className="text-base font-semibold">Toplam Gelir Projeksiyonu</h3>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="outline" size="sm" icon={<I.Filter size={13}/>}>Filtre</Btn>
                <Btn variant="primary" size="sm" icon={<I.Plus size={13}/>}>Yeni Satır</Btn>
              </div>
            </div>
            <div className="flex items-end gap-8 mt-4">
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-muted mb-1">Toplam Gelir</div>
                <div className="text-[28px] font-semibold tabular text-enba-orange leading-none">{fmtTL(grandRev)}</div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-muted mb-1">Brüt Kâr</div>
                <div className="text-[20px] font-semibold tabular text-enba-green leading-none">{fmtTL(grandGP)}</div>
                <div className="text-[10.5px] text-enba-dim mt-1 tabular">Marj {fmtPct(grandRev > 0 ? grandGP/grandRev : 0)}</div>
              </div>
              <div className="flex-1">
                <Sparkline data={periodTotals} color="#E35205" height={52} width={300}/>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-span-5 grid grid-cols-2 gap-4">
          <div className="bg-enba-panel border border-enba-line rounded-xl p-4">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-muted mb-2">Ürün/Hizmet Sayısı</div>
            <div className="text-2xl font-semibold tabular">{products.length}</div>
            <div className="text-[10.5px] text-enba-dim mt-1">{allProducts.length - products.length} adet filtrelendi</div>
          </div>
          <div className="bg-enba-panel border border-enba-line rounded-xl p-4">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-muted mb-2">Ort. Hacim Büyümesi</div>
            <div className="text-2xl font-semibold tabular text-enba-green">
              +{fmtPct(products.reduce((s,p)=>s+p.volumeGrowth,0)/Math.max(1,products.length)).replace('%','')}
            </div>
            <div className="text-[10.5px] text-enba-dim mt-1">Yıllık bazda</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={filterCat} onChange={setFilterCat} options={catOpts} icon={<I.Filter size={13}/>}/>
          <div className="h-6 w-px bg-enba-line mx-1"/>
          <Segmented options={[{value:6,label:'6 ay'},{value:12,label:'12 ay'},{value:18,label:'18 ay'},{value:24,label:'24 ay'}]}
            value={horizon} onChange={setHorizon}/>
        </div>
        <div className="flex items-center gap-2 text-[11.5px] text-enba-muted">
          <span className="inline-flex items-center gap-1"><I.Info size={12}/> Hücrelere tıklayarak değer düzenleyebilirsiniz</span>
        </div>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] tabular">
            <thead>
              <tr className="text-enba-muted">
                <th className="sticky left-0 z-10 bg-enba-panel border-b border-r border-enba-line px-3 py-2.5 text-left font-medium min-w-[260px]">Ürün / Hizmet</th>
                <th className="bg-enba-panel border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap">Birim Fiyat</th>
                <th className="bg-enba-panel border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap">Aylık Hacim</th>
                <th className="bg-enba-panel border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap">Maliyet %</th>
                {visiblePeriods.map((p, i) => (
                  <th key={p.key} className={cx('bg-enba-panel border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap min-w-[78px]',
                    i % 3 === 2 && 'border-r border-enba-line/60')}>
                    <div className={cx('text-[11px]', p.m === 0 && 'text-enba-orange')}>{p.label}</div>
                  </th>
                ))}
                <th className="bg-enba-panel border-b border-l border-enba-line px-3 py-2.5 text-right font-medium whitespace-nowrap min-w-[110px]">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {productTotals.map(({ p, rev, vol, cost, gp, gpm }) => {
                const isOpen = expanded.has(p.id);
                return (
                  <React.Fragment key={p.id}>
                    <tr className="group hover:bg-enba-panel-2/60 transition-colors">
                      <td className="sticky left-0 z-10 bg-enba-panel group-hover:bg-enba-panel-2/95 border-b border-r border-enba-line px-3 py-2.5">
                        <button onClick={() => toggle(p.id)} className="flex items-center gap-2.5 text-left w-full">
                          <span className={cx('w-4 h-4 rounded flex items-center justify-center text-enba-muted transition-transform', isOpen && 'rotate-90')}>
                            <I.Chevron size={12} className="-rotate-90"/>
                          </span>
                          <span className="w-1 h-7 rounded-sm flex-none" style={{ background: p.color }}/>
                          <div className="min-w-0">
                            <div className="font-medium text-enba-text text-[13px] leading-tight">{p.name}</div>
                            <div className="text-[10.5px] text-enba-dim mt-0.5">{p.category} · {p.unit}</div>
                          </div>
                        </button>
                      </td>
                      <td className="border-b border-enba-line px-2 py-2.5 text-right">
                        <EditableCell value={fmtTL(p.price, { compact: false })}
                          isEditing={editing === `${p.id}-price`}
                          onClick={() => setEditing(`${p.id}-price`)}
                          onBlur={() => setEditing(null)}/>
                      </td>
                      <td className="border-b border-enba-line px-2 py-2.5 text-right">
                        <span className="text-enba-text">{fmtNum(p.volume)}</span>
                        <span className="text-enba-dim text-[10.5px]"> /{p.unit}</span>
                      </td>
                      <td className="border-b border-enba-line px-2 py-2.5 text-right text-enba-muted">{fmtPct(p.varCostRatio, 0)}</td>
                      {visiblePeriods.map((_, i) => {
                        const r = revenueFor(p, i, scen);
                        return (
                          <td key={i} className={cx('border-b border-enba-line px-2 py-2.5 text-right text-enba-text',
                            i % 3 === 2 && 'border-r border-enba-line/60')}>
                            {(r/1000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                            <span className="text-enba-dim text-[10px]">K</span>
                          </td>
                        );
                      })}
                      <td className="border-b border-l border-enba-line px-3 py-2.5 text-right font-medium text-enba-orange">{fmtTL(rev)}</td>
                    </tr>
                    {isOpen && (
                      <>
                        <tr className="bg-enba-panel-2/30">
                          <td className="sticky left-0 z-10 bg-enba-panel-2/30 border-b border-r border-enba-line/60 px-3 py-1.5 pl-10">
                            <span className="text-[11.5px] text-enba-muted">↳ Hacim ({p.unit})</span>
                          </td>
                          <td className="border-b border-enba-line/60 px-2 py-1.5"/><td className="border-b border-enba-line/60 px-2 py-1.5"/>
                          <td className="border-b border-enba-line/60 px-2 py-1.5"/>
                          {visiblePeriods.map((_, i) => (
                            <td key={i} className={cx('border-b border-enba-line/60 px-2 py-1.5 text-right text-[11.5px] text-enba-muted',
                              i % 3 === 2 && 'border-r border-enba-line/40')}>
                              {fmtNum(monthlyVolumeFor(p, i), 0)}
                            </td>
                          ))}
                          <td className="border-b border-l border-enba-line/60 px-3 py-1.5 text-right text-[11.5px] text-enba-muted">
                            {fmtNum(vol, 0)} {p.unit}
                          </td>
                        </tr>
                        <tr className="bg-enba-panel-2/30">
                          <td className="sticky left-0 z-10 bg-enba-panel-2/30 border-b border-r border-enba-line/60 px-3 py-1.5 pl-10">
                            <span className="text-[11.5px] text-enba-muted">↳ Değ. Maliyet</span>
                          </td>
                          <td className="border-b border-enba-line/60 px-2 py-1.5"/><td className="border-b border-enba-line/60 px-2 py-1.5"/>
                          <td className="border-b border-enba-line/60 px-2 py-1.5"/>
                          {visiblePeriods.map((_, i) => (
                            <td key={i} className={cx('border-b border-enba-line/60 px-2 py-1.5 text-right text-[11.5px] text-enba-red/80',
                              i % 3 === 2 && 'border-r border-enba-line/40')}>
                              −{(varCostFor(p, i, scen)/1000).toLocaleString('tr-TR', {maximumFractionDigits: 0})}K
                            </td>
                          ))}
                          <td className="border-b border-l border-enba-line/60 px-3 py-1.5 text-right text-[11.5px] text-enba-red/80">
                            −{fmtTL(cost)}
                          </td>
                        </tr>
                        <tr className="bg-enba-panel-2/50">
                          <td className="sticky left-0 z-10 bg-enba-panel-2/50 border-b border-r border-enba-line px-3 py-1.5 pl-10">
                            <span className="text-[11.5px] font-medium text-enba-green">↳ Brüt Kâr</span>
                          </td>
                          <td className="border-b border-enba-line/60 px-2 py-1.5"/><td className="border-b border-enba-line/60 px-2 py-1.5"/>
                          <td className="border-b border-enba-line/60 px-2 py-1.5 text-right text-[11.5px] text-enba-green">{fmtPct(1 - p.varCostRatio, 0)}</td>
                          {visiblePeriods.map((_, i) => {
                            const g = revenueFor(p, i, scen) - varCostFor(p, i, scen);
                            return (
                              <td key={i} className={cx('border-b border-enba-line/60 px-2 py-1.5 text-right text-[11.5px] text-enba-green font-medium',
                                i % 3 === 2 && 'border-r border-enba-line/40')}>
                                {(g/1000).toLocaleString('tr-TR', {maximumFractionDigits: 0})}K
                              </td>
                            );
                          })}
                          <td className="border-b border-l border-enba-line px-3 py-1.5 text-right text-[12px] font-semibold text-enba-green">{fmtTL(gp)}</td>
                        </tr>
                      </>
                    )}
                  </React.Fragment>
                );
              })}
              <tr className="bg-enba-orange/5">
                <td className="sticky left-0 z-10 bg-enba-orange/5 border-t-2 border-enba-orange/40 border-r border-enba-line px-3 py-3 font-semibold text-enba-text">TOPLAM</td>
                <td className="border-t-2 border-enba-orange/40 px-2 py-3"/>
                <td className="border-t-2 border-enba-orange/40 px-2 py-3"/>
                <td className="border-t-2 border-enba-orange/40 px-2 py-3"/>
                {periodTotals.map((v, i) => (
                  <td key={i} className={cx('border-t-2 border-enba-orange/40 px-2 py-3 text-right text-enba-text font-semibold',
                    i % 3 === 2 && 'border-r border-enba-line/60')}>
                    {(v/1000).toLocaleString('tr-TR', {maximumFractionDigits: 0})}
                    <span className="text-enba-dim text-[10px]">K</span>
                  </td>
                ))}
                <td className="border-t-2 border-l border-enba-orange/40 px-3 py-3 text-right text-enba-orange font-semibold text-[13.5px]">
                  {fmtTL(grandRev)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-5">
          <SectionTitle eyebrow="Ürün payı" title="Gelir Mix (24 ay)"/>
          <RevenueMix scen={scen} cc={cc}/>
        </Card>
        <Card className="col-span-7">
          <SectionTitle eyebrow="Mevsimsellik" title="Ortalama Aylık Hacim Endeksi"
            action={<span className="text-[10.5px] text-enba-dim">Endeks 1.0 = yıllık ortalama</span>}/>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHS_TR.map((m, i) => {
                const row: any = { month: m };
                allProducts.forEach(p => { row[p.id] = p.seasonality[i]; });
                return row;
              })}>
                <CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
                <XAxis dataKey="month" tickLine={false} axisLine={false}/>
                <YAxis domain={[0.6, 1.4]} ticks={[0.7, 1.0, 1.3]} tickLine={false} axisLine={false} width={32}/>
                <ReferenceLine y={1} stroke={cc.refLine} strokeDasharray="3 3"/>
                <Tooltip formatter={(v: any, k: any) => [(v as number).toFixed(2), allProducts.find(p => p.id === k)?.name || k]}/>
                {allProducts.map(p => (
                  <Line key={p.id} type="monotone" dataKey={p.id} stroke={p.color} strokeWidth={1.6} dot={false}/>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

const EditableCell = ({ value, isEditing, onClick, onBlur }:
  { value: string; isEditing: boolean; onClick: () => void; onBlur: () => void }) => {
  if (isEditing) {
    return (
      <input autoFocus defaultValue={value} onBlur={onBlur}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') onBlur(); }}
        className="w-full text-right bg-enba-bg border border-enba-orange rounded px-1.5 py-0.5 text-enba-text outline-none tabular text-[12.5px]"/>
    );
  }
  return (
    <button onClick={onClick}
      className="w-full text-right text-enba-text hover:bg-enba-orange/10 hover:text-enba-orange rounded px-1.5 py-0.5 -my-0.5 transition-colors">
      {value}
    </button>
  );
};

const RevenueMix = ({ scen, cc }: { scen: Scenario; cc: any }) => {
  const { products: allProducts } = usePlanData();
  const data = allProducts.map(p => {
    let rev = 0;
    for (let i = 0; i < 24; i++) rev += revenueFor(p, i, scen);
    return { name: p.name, value: rev, color: p.color, id: p.id };
  });
  const total = data.reduce((s, x) => s + x.value, 0);
  return (
    <div className="flex items-center gap-5">
      <div className="w-[150px] h-[150px] flex-none">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={48} outerRadius={70} stroke={cc.sliceSep} strokeWidth={2}>
              {data.map((d, i) => <Cell key={i} fill={d.color}/>)}
            </Pie>
            <Tooltip formatter={(v: any) => fmtTL(v)}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5">
        {data.map(d => {
          const pct = d.value / total;
          return (
            <div key={d.id} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-none" style={{background: d.color}}/>
              <span className="flex-1 text-[12px] text-enba-text truncate">{d.name}</span>
              <span className="text-[11.5px] text-enba-muted tabular w-12 text-right">{fmtPct(pct, 1)}</span>
              <div className="w-16 h-1.5 bg-enba-panel-2 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: (pct*100)+'%', background: d.color }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
