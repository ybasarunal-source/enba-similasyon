// Gider Planı — fixed + variable expense planning with editable monthly grid
const { useState: _useS_exp, useMemo: _useM_exp } = React;
const RC_E = window.Recharts;

const EXPENSE_GROUPS = [
  { key: 'Sabit',           color: '#E35205', desc: 'Hacme bağlı olmayan, dönemsel ödenen giderler.' },
  { key: 'Yarı Değişken',   color: '#F2A93B', desc: 'Hem sabit bir taban hem de hacme bağlı bir kısmı olan giderler.' },
];

const ExpensePanel = ({ scenarioId, periodGranularity }) => {
  const scen = SCENARIOS[scenarioId];
  const cc = useChartColors();
  const [horizon, setHorizon] = _useS_exp(12);
  const [activeTab, setActiveTab] = _useS_exp('all'); // all | fixed | variable
  const [editing, setEditing] = _useS_exp(null);

  const visiblePeriods = PERIODS.slice(0, horizon);

  // Totals
  const totals = _useM_exp(() => {
    let fixed = 0, variable = 0;
    for (let i = 0; i < visiblePeriods.length; i++) {
      fixed    += FIXED_EXPENSES.reduce((s, e) => s + fixedCostFor(e, i, scen), 0);
      variable += PRODUCTS.reduce((s, p) => s + varCostFor(p, i, scen), 0);
    }
    return { fixed, variable, total: fixed + variable };
  }, [scen, horizon]);

  const fixedShare = totals.fixed / totals.total;

  // Per-period series for chart
  const monthlySeries = _useM_exp(() => visiblePeriods.map((p, i) => ({
    label: p.label,
    sabit: FIXED_EXPENSES.reduce((s, e) => s + fixedCostFor(e, i, scen), 0),
    degisken: PRODUCTS.reduce((s, prod) => s + varCostFor(prod, i, scen), 0),
  })), [scen, horizon]);

  // Per-item totals (fixed)
  const fixedTotals = _useM_exp(() => FIXED_EXPENSES.map(e => {
    let sum = 0;
    for (let i = 0; i < visiblePeriods.length; i++) sum += fixedCostFor(e, i, scen);
    return { ...e, sum };
  }), [scen, horizon]);

  // Variable group: roll up by product
  const variableTotals = _useM_exp(() => PRODUCTS.map(p => {
    let sum = 0;
    for (let i = 0; i < visiblePeriods.length; i++) sum += varCostFor(p, i, scen);
    return { ...p, sum };
  }), [scen, horizon]);

  return (
    <div className="space-y-5">
      {/* Top summary */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">
                {horizon} ay · {scen.label}
              </div>
              <h3 className="text-base font-semibold">Toplam Gider</h3>
            </div>
            <Badge tone="orange">{horizon} aylık</Badge>
          </div>
          <div className="text-[28px] font-semibold text-enba-orange tabular mt-3 leading-none">
            {fmtTL(totals.total)}
          </div>
          <div className="text-[11px] text-enba-dim mt-2">
            Aylık ortalama <span className="text-enba-text tabular">{fmtTL(totals.total / horizon)}</span>
          </div>

          {/* Composition bar */}
          <div className="mt-4 h-2.5 bg-enba-panel-2 rounded-full overflow-hidden flex">
            <div className="bg-enba-orange" style={{ width: (fixedShare*100)+'%' }}/>
            <div className="bg-enba-amber" style={{ width: ((1-fixedShare)*100)+'%' }}/>
          </div>
          <div className="flex items-center justify-between mt-2.5 text-[11.5px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-enba-orange"/>
              <span className="text-enba-muted">Sabit</span>
              <span className="font-medium tabular">{fmtTL(totals.fixed)}</span>
              <span className="text-enba-dim tabular">({fmtPct(fixedShare, 0)})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-enba-amber"/>
              <span className="text-enba-muted">Değişken</span>
              <span className="font-medium tabular">{fmtTL(totals.variable)}</span>
              <span className="text-enba-dim tabular">({fmtPct(1-fixedShare, 0)})</span>
            </div>
          </div>
        </Card>

        <Card className="col-span-7" padded={false}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">Aylık Trend</div>
              <h3 className="text-base font-semibold">Sabit + Değişken Gider Akışı</h3>
            </div>
            <div className="flex items-center gap-3 text-[10.5px] text-enba-muted">
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-enba-orange"/>Sabit</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-enba-amber"/>Değişken</span>
            </div>
          </div>
          <div className="h-[160px] px-2">
            <RC_E.ResponsiveContainer width="100%" height="100%">
              <RC_E.BarChart data={monthlySeries} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <RC_E.CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
                <RC_E.XAxis dataKey="label" tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(horizon/8)-1)}/>
                <RC_E.YAxis tickFormatter={(v) => (v/1000).toFixed(0)+'K'} tickLine={false} axisLine={false} width={42}/>
                <RC_E.Tooltip formatter={(v) => fmtTL(v)}/>
                <RC_E.Bar dataKey="sabit" stackId="x" fill="#E35205" radius={[0,0,0,0]}/>
                <RC_E.Bar dataKey="degisken" stackId="x" fill="#F2A93B" radius={[3,3,0,0]}/>
              </RC_E.BarChart>
            </RC_E.ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center bg-enba-panel border border-enba-line rounded-lg p-0.5">
          {[
            { value: 'all',      label: 'Tümü',            n: FIXED_EXPENSES.length + PRODUCTS.length },
            { value: 'fixed',    label: 'Sabit Giderler',  n: FIXED_EXPENSES.length },
            { value: 'variable', label: 'Değişken Giderler', n: PRODUCTS.length },
          ].map(t => (
            <button key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={cx(
                'px-3 py-1.5 rounded-md text-[12.5px] inline-flex items-center gap-2 transition-colors',
                activeTab === t.value
                  ? 'bg-enba-orange text-white'
                  : 'text-enba-muted hover:text-enba-text'
              )}>
              {t.label}
              <span className={cx(
                'text-[10.5px] px-1.5 py-0.5 rounded',
                activeTab === t.value ? 'bg-white/15' : 'bg-enba-panel-2 text-enba-dim'
              )}>{t.n}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Segmented
            options={[
              { value: 6,  label: '6 ay' },
              { value: 12, label: '12 ay' },
              { value: 18, label: '18 ay' },
              { value: 24, label: '24 ay' },
            ]}
            value={horizon}
            onChange={setHorizon}
          />
          <Btn variant="primary" size="sm" icon={<I.Plus size={13}/>}>Yeni Kalem</Btn>
        </div>
      </div>

      {/* Fixed expenses grid */}
      {(activeTab === 'all' || activeTab === 'fixed') && (
        <Card padded={false} className="overflow-hidden">
          <div className="px-5 py-3 flex items-center justify-between border-b border-enba-line">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-enba-orange"/>
              <h4 className="text-[13px] font-semibold">Sabit Giderler</h4>
              <span className="text-[11px] text-enba-dim">· {FIXED_EXPENSES.length} kalem</span>
            </div>
            <span className="text-[12px] text-enba-muted tabular">{fmtTL(totals.fixed)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] tabular">
              <thead>
                <tr className="text-enba-muted bg-enba-panel-2/40">
                  <th className="sticky left-0 z-10 bg-enba-panel-2/95 border-b border-r border-enba-line px-3 py-2.5 text-left font-medium min-w-[240px]">Kalem</th>
                  <th className="border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap">Aylık Tutar</th>
                  <th className="border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap">Yıllık Artış</th>
                  {visiblePeriods.map((p, i) => (
                    <th key={p.key}
                      className={cx(
                        'border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap min-w-[78px]',
                        i % 3 === 2 && 'border-r border-enba-line/60'
                      )}>
                      <span className={cx('text-[11px]', p.m === 0 && 'text-enba-orange')}>{p.label}</span>
                    </th>
                  ))}
                  <th className="border-b border-l border-enba-line px-3 py-2.5 text-right font-medium whitespace-nowrap min-w-[110px]">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {fixedTotals.map((e) => (
                  <tr key={e.id} className="group hover:bg-enba-panel-2/40 transition-colors">
                    <td className="sticky left-0 z-10 bg-enba-panel group-hover:bg-enba-panel-2/90 border-b border-r border-enba-line px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <ExpenseAvatar name={e.name}/>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-enba-text leading-tight">{e.name}</div>
                          <div className="text-[10.5px] text-enba-dim mt-0.5">{e.group}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-enba-line px-2 py-2.5 text-right">
                      <EditableCellExp
                        value={fmtTL(e.monthly, {compact:false})}
                        isEditing={editing === `${e.id}-m`}
                        onClick={() => setEditing(`${e.id}-m`)}
                        onBlur={() => setEditing(null)}
                      />
                    </td>
                    <td className="border-b border-enba-line px-2 py-2.5 text-right">
                      <span className={cx('text-[12px] tabular px-1.5 py-0.5 rounded',
                        e.growth >= 0.25 ? 'text-enba-red bg-enba-red/10' :
                        e.growth >= 0.15 ? 'text-enba-amber bg-enba-amber/10' :
                        'text-enba-green bg-enba-green/10')}>
                        +{fmtPct(e.growth, 0)}
                      </span>
                    </td>
                    {visiblePeriods.map((_, i) => {
                      const v = fixedCostFor(e, i, scen);
                      return (
                        <td key={i}
                          className={cx(
                            'border-b border-enba-line px-2 py-2.5 text-right text-enba-text',
                            i % 3 === 2 && 'border-r border-enba-line/60'
                          )}>
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
                  {visiblePeriods.map((_, i) => {
                    const sum = FIXED_EXPENSES.reduce((s, x) => s + fixedCostFor(x, i, scen), 0);
                    return (
                      <td key={i}
                        className={cx(
                          'border-t-2 border-enba-orange/40 px-2 py-3 text-right text-enba-text font-semibold',
                          i % 3 === 2 && 'border-r border-enba-line/60'
                        )}>
                        {(sum/1000).toLocaleString('tr-TR', {maximumFractionDigits: 0})}
                        <span className="text-enba-dim text-[10px]">K</span>
                      </td>
                    );
                  })}
                  <td className="border-t-2 border-l border-enba-orange/40 px-3 py-3 text-right text-enba-orange font-semibold">
                    {fmtTL(totals.fixed)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Variable expenses */}
      {(activeTab === 'all' || activeTab === 'variable') && (
        <Card padded={false} className="overflow-hidden">
          <div className="px-5 py-3 flex items-center justify-between border-b border-enba-line">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-enba-amber"/>
              <h4 className="text-[13px] font-semibold">Değişken Giderler</h4>
              <span className="text-[11px] text-enba-dim">· {PRODUCTS.length} ürün/hizmete bağlı</span>
              <Badge tone="amber">Gelirle ilişkili</Badge>
            </div>
            <span className="text-[12px] text-enba-muted tabular">{fmtTL(totals.variable)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] tabular">
              <thead>
                <tr className="text-enba-muted bg-enba-panel-2/40">
                  <th className="sticky left-0 z-10 bg-enba-panel-2/95 border-b border-r border-enba-line px-3 py-2.5 text-left font-medium min-w-[240px]">Kalem</th>
                  <th className="border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap">Maliyet %</th>
                  <th className="border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap">Tip</th>
                  {visiblePeriods.map((p, i) => (
                    <th key={p.key}
                      className={cx(
                        'border-b border-enba-line px-2 py-2.5 text-right font-medium whitespace-nowrap min-w-[78px]',
                        i % 3 === 2 && 'border-r border-enba-line/60'
                      )}>
                      <span className={cx('text-[11px]', p.m === 0 && 'text-enba-orange')}>{p.label}</span>
                    </th>
                  ))}
                  <th className="border-b border-l border-enba-line px-3 py-2.5 text-right font-medium whitespace-nowrap min-w-[110px]">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {variableTotals.map(({ id, name, category, color, varCostRatio, sum }) => (
                  <tr key={id} className="group hover:bg-enba-panel-2/40 transition-colors">
                    <td className="sticky left-0 z-10 bg-enba-panel group-hover:bg-enba-panel-2/90 border-b border-r border-enba-line px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-1 h-7 rounded-sm flex-none" style={{ background: color }}/>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-enba-text leading-tight">{name}</div>
                          <div className="text-[10.5px] text-enba-dim mt-0.5">{category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-enba-line px-2 py-2.5 text-right">
                      <span className="text-enba-text">{fmtPct(varCostRatio, 0)}</span>
                      <span className="text-enba-dim text-[10.5px]"> /gelir</span>
                    </td>
                    <td className="border-b border-enba-line px-2 py-2.5 text-right">
                      <Badge tone="amber">% gelir</Badge>
                    </td>
                    {visiblePeriods.map((_, i) => {
                      const product = PRODUCTS.find(p => p.id === id);
                      const actual = varCostFor(product, i, scen);
                      return (
                        <td key={i}
                          className={cx(
                            'border-b border-enba-line px-2 py-2.5 text-right text-enba-text',
                            i % 3 === 2 && 'border-r border-enba-line/60'
                          )}>
                          {(actual/1000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                          <span className="text-enba-dim text-[10px]">K</span>
                        </td>
                      );
                    })}
                    <td className="border-b border-l border-enba-line px-3 py-2.5 text-right font-medium text-enba-amber">{fmtTL(sum)}</td>
                  </tr>
                ))}
                <tr className="bg-enba-amber/5">
                  <td className="sticky left-0 z-10 bg-enba-amber/[0.07] border-t-2 border-enba-amber/40 border-r border-enba-line px-3 py-3 font-semibold">Alt Toplam</td>
                  <td className="border-t-2 border-enba-amber/40 px-2 py-3"/>
                  <td className="border-t-2 border-enba-amber/40 px-2 py-3"/>
                  {visiblePeriods.map((_, i) => {
                    const sum = PRODUCTS.reduce((s, p) => s + varCostFor(p, i, scen), 0);
                    return (
                      <td key={i}
                        className={cx(
                          'border-t-2 border-enba-amber/40 px-2 py-3 text-right text-enba-text font-semibold',
                          i % 3 === 2 && 'border-r border-enba-line/60'
                        )}>
                        {(sum/1000).toLocaleString('tr-TR', {maximumFractionDigits: 0})}
                        <span className="text-enba-dim text-[10px]">K</span>
                      </td>
                    );
                  })}
                  <td className="border-t-2 border-l border-enba-amber/40 px-3 py-3 text-right text-enba-amber font-semibold">
                    {fmtTL(totals.variable)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Composition row */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-5">
          <SectionTitle eyebrow="Dağılım" title="Sabit Gider Kompozisyonu"/>
          <ExpenseComposition data={fixedTotals}/>
        </Card>

        <Card className="col-span-7">
          <SectionTitle
            eyebrow="Verimlilik"
            title="Gider / Gelir Oranı"
            action={<span className="text-[10.5px] text-enba-dim">Düşük = daha verimli</span>}
          />
          <ExpenseRatioChart scen={scen} horizon={horizon} cc={cc}/>
        </Card>
      </div>
    </div>
  );
};

// Small avatar derived from name initials
const ExpenseAvatar = ({ name }) => {
  const initials = name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  // hash to pick color
  const palette = ['#E35205','#F2A93B','#5B9DFF','#3DBE7C','#9A6CFF','#D87CC4'];
  const h = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const color = palette[h % palette.length];
  return (
    <span className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-semibold flex-none"
      style={{ background: color + '20', color }}>
      {initials}
    </span>
  );
};

const EditableCellExp = ({ value, isEditing, onClick, onBlur }) => {
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

const ExpenseComposition = ({ data }) => {
  const cc = useChartColors();
  const total = data.reduce((s, x) => s + x.sum, 0);
  const palette = ['#E35205','#F2A93B','#5B9DFF','#3DBE7C','#9A6CFF','#D87CC4','#E5484D','#9A9A9A'];
  const items = data.map((d, i) => ({ ...d, color: palette[i % palette.length] }))
    .sort((a, b) => b.sum - a.sum);
  return (
    <div className="flex items-center gap-5">
      <div className="w-[150px] h-[150px] flex-none">
        <RC_E.ResponsiveContainer width="100%" height="100%">
          <RC_E.PieChart>
            <RC_E.Pie data={items} dataKey="sum" innerRadius={48} outerRadius={70} stroke={cc.sliceSep} strokeWidth={2}>
              {items.map((d, i) => <RC_E.Cell key={i} fill={d.color}/>)}
            </RC_E.Pie>
            <RC_E.Tooltip formatter={(v) => fmtTL(v)}/>
          </RC_E.PieChart>
        </RC_E.ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5">
        {items.map(d => {
          const pct = d.sum / total;
          return (
            <div key={d.id} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-none" style={{background: d.color}}/>
              <span className="flex-1 text-[12px] text-enba-text truncate">{d.name}</span>
              <span className="text-[11.5px] text-enba-muted tabular w-12 text-right">{fmtPct(pct, 1)}</span>
              <div className="w-12 h-1.5 bg-enba-panel-2 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: (pct*100)+'%', background: d.color }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ExpenseRatioChart = ({ scen, horizon, cc }) => {
  const data = PERIODS.slice(0, horizon).map((p, i) => {
    const rev = PRODUCTS.reduce((s, prod) => s + revenueFor(prod, i, scen), 0);
    const opex = PRODUCTS.reduce((s, prod) => s + varCostFor(prod, i, scen), 0)
      + FIXED_EXPENSES.reduce((s, e) => s + fixedCostFor(e, i, scen), 0);
    return { label: p.label, ratio: rev > 0 ? opex/rev : 0 };
  });
  const avg = data.reduce((s, x) => s + x.ratio, 0) / data.length;
  return (
    <div>
      <div className="flex items-end gap-6 mb-3">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-muted mb-1">Ortalama</div>
          <div className="text-[22px] font-semibold tabular text-enba-amber leading-none">{fmtPct(avg, 1)}</div>
        </div>
        <div className="text-[11px] text-enba-dim leading-snug max-w-[260px]">
          Hedef <span className="text-enba-text">%70'in altı</span>. Ortalamanın üstünde olan dönemlerde maliyet baskısı artar.
        </div>
      </div>
      <div className="h-[140px]">
        <RC_E.ResponsiveContainer width="100%" height="100%">
          <RC_E.LineChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ratioGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#F2A93B" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#F2A93B" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <RC_E.CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
            <RC_E.XAxis dataKey="label" tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(horizon/8)-1)}/>
            <RC_E.YAxis tickFormatter={(v) => (v*100).toFixed(0)+'%'} tickLine={false} axisLine={false} width={40} domain={[0.5, 1]}/>
            <RC_E.ReferenceLine y={0.7} stroke="#3DBE7C" strokeDasharray="4 3" label={{ value: 'Hedef 70%', position: 'right', fill: '#3DBE7C', fontSize: 10 }}/>
            <RC_E.Tooltip formatter={(v) => fmtPct(v, 1)}/>
            <RC_E.Area type="monotone" dataKey="ratio" stroke="#F2A93B" strokeWidth={2} fill="url(#ratioGrad)"/>
          </RC_E.LineChart>
        </RC_E.ResponsiveContainer>
      </div>
    </div>
  );
};

window.ExpensePanel = ExpensePanel;
