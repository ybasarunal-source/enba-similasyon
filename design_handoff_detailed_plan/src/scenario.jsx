// Senaryo Yönetimi — scenario parameters, comparison, sensitivity analysis
const { useState: _useS_sc, useMemo: _useM_sc } = React;
const RC_S = window.Recharts;

const ScenarioPanel = ({ scenarioId, periodGranularity }) => {
  const cc = useChartColors();
  const [focused, setFocused] = _useS_sc(scenarioId);

  // Compute metrics for each scenario
  const metrics = _useM_sc(() => {
    const all = {};
    Object.values(SCENARIOS).forEach(s => {
      const series = buildSeries(s);
      const totalRev = series.reduce((a, x) => a + x.revenue, 0);
      const totalOp  = series.reduce((a, x) => a + x.opex, 0);
      const totalEb  = series.reduce((a, x) => a + x.ebitda, 0);
      const totalNet = series.reduce((a, x) => a + x.net, 0);
      const ebMargin = totalRev > 0 ? totalEb / totalRev : 0;
      // payback
      let cum = -4_800_000;
      let payback = null;
      series.forEach((x, i) => { cum += x.net; if (payback == null && cum >= 0) payback = i + 1; });
      all[s.id] = { scenario: s, totalRev, totalOp, totalEb, totalNet, ebMargin, payback, series };
    });
    return all;
  }, []);

  // Quarterly aggregated revenue per scenario for grouped bar chart
  const quarterlyCompare = _useM_sc(() => {
    const quarters = [];
    for (let q = 0; q < 8; q++) {
      const months = [q*3, q*3+1, q*3+2];
      const row = { label: `Ç${(q%4)+1} ${months[0] < 12 ? '25' : '26'}` };
      Object.values(SCENARIOS).forEach(s => {
        let sum = 0;
        months.forEach(m => { sum += metrics[s.id]?.series[m]?.revenue ?? 0; });
        row[s.id] = sum;
      });
      quarters.push(row);
    }
    return quarters;
  }, [metrics]);

  return (
    <div className="space-y-5">
      {/* Header card */}
      <Card className="!p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">Senaryo Yönetimi</div>
            <h2 className="text-lg font-semibold">3 Senaryo · 24 Aylık Karşılaştırma</h2>
            <p className="text-[12.5px] text-enba-muted mt-1.5 max-w-2xl">
              Her senaryo, gelir ve maliyet varsayımlarının üzerine çarpan uygular. Senaryolar arasındaki farkları görerek riski ölçer ve aksiyon planları hazırlarsınız.
            </p>
          </div>
          <Btn variant="primary" icon={<I.Plus size={14}/>}>Yeni Senaryo</Btn>
        </div>
      </Card>

      {/* Scenario cards */}
      <div className="grid grid-cols-3 gap-4">
        {Object.values(SCENARIOS).map(s => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            metrics={metrics[s.id]}
            focused={focused === s.id}
            onFocus={() => setFocused(s.id)}
          />
        ))}
      </div>

      {/* Comparison table */}
      <Card padded={false}>
        <div className="px-5 py-3 border-b border-enba-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-semibold">Senaryo Metrikleri Karşılaştırması</h4>
            <Badge tone="neutral">24 ay toplam</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Btn variant="outline" size="sm" icon={<I.Pdf size={12}/>}>Excel</Btn>
          </div>
        </div>
        <ComparisonTable metrics={metrics}/>
      </Card>

      {/* Two-col: Revenue trends + sensitivity */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-7" padded={false}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">Çeyreklik</div>
              <h3 className="text-base font-semibold">Senaryo Bazında Gelir Karşılaştırması</h3>
            </div>
            <div className="flex items-center gap-3 text-[10.5px] text-enba-muted">
              {Object.values(SCENARIOS).map(s => (
                <span key={s.id} className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{background: s.color}}/>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
          <div className="h-[260px] px-2">
            <RC_S.ResponsiveContainer width="100%" height="100%">
              <RC_S.BarChart data={quarterlyCompare} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <RC_S.CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
                <RC_S.XAxis dataKey="label" tickLine={false} axisLine={false}/>
                <RC_S.YAxis tickFormatter={(v) => (v/1_000_000).toFixed(1)+'M'} tickLine={false} axisLine={false} width={48}/>
                <RC_S.Tooltip formatter={(v, k) => [fmtTL(v), SCENARIOS[k]?.label || k]}/>
                {Object.values(SCENARIOS).map(s => (
                  <RC_S.Bar key={s.id} dataKey={s.id} fill={s.color} radius={[3,3,0,0]}/>
                ))}
              </RC_S.BarChart>
            </RC_S.ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-5">
          <SectionTitle eyebrow="Hassasiyet" title="Tek Değişken Analizi"/>
          <SensitivityAnalysis/>
        </Card>
      </div>

      {/* EBITDA cumulative comparison */}
      <Card padded={false}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">Kümülatif</div>
            <h3 className="text-base font-semibold">EBITDA Birikim Eğrisi</h3>
          </div>
          <div className="flex items-center gap-3 text-[10.5px] text-enba-muted">
            {Object.values(SCENARIOS).map(s => (
              <span key={s.id} className="inline-flex items-center gap-1.5">
                <span className="w-3 h-[2px]" style={{background: s.color}}/>
                {s.label}
              </span>
            ))}
          </div>
        </div>
        <div className="h-[260px] px-2">
          <RC_S.ResponsiveContainer width="100%" height="100%">
            <RC_S.LineChart
              data={PERIODS.slice(0, 24).map((p, i) => {
                const row = { label: p.label };
                Object.values(SCENARIOS).forEach(s => {
                  let cum = 0;
                  for (let j = 0; j <= i; j++) cum += metrics[s.id]?.series[j]?.ebitda ?? 0;
                  row[s.id] = cum;
                });
                return row;
              })}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                {Object.values(SCENARIOS).map(s => (
                  <linearGradient key={s.id} id={'scgrad-'+s.id} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity="0.25"/>
                    <stop offset="100%" stopColor={s.color} stopOpacity="0"/>
                  </linearGradient>
                ))}
              </defs>
              <RC_S.CartesianGrid strokeDasharray="2 4" stroke={cc.grid} vertical={false}/>
              <RC_S.XAxis dataKey="label" tickLine={false} axisLine={false} interval={1}/>
              <RC_S.YAxis tickFormatter={(v) => (v/1_000_000).toFixed(0)+'M'} tickLine={false} axisLine={false} width={48}/>
              <RC_S.Tooltip formatter={(v, k) => [fmtTL(v), SCENARIOS[k]?.label || k]}/>
              {Object.values(SCENARIOS).map(s => (
                <RC_S.Line key={s.id} type="monotone" dataKey={s.id} stroke={s.color} strokeWidth={2.2} dot={false} name={s.label}/>
              ))}
            </RC_S.LineChart>
          </RC_S.ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

const ScenarioCard = ({ scenario, metrics, focused, onFocus }) => {
  if (!metrics) return null;
  return (
    <div
      className={cx(
        'rounded-xl border p-5 cursor-pointer transition-all relative overflow-hidden',
        focused ? '' : 'bg-enba-panel border-enba-line hover:border-enba-line-2'
      )}
      style={focused ? {
        background: `linear-gradient(135deg, ${scenario.color}18 0%, transparent 60%)`,
        borderColor: scenario.color + '66',
      } : {}}
      onClick={onFocus}>

      {focused && (
        <div className="absolute top-0 right-0 px-2 py-0.5 text-[9.5px] uppercase tracking-[0.16em] font-semibold rounded-bl-md"
          style={{ background: scenario.color, color: 'white' }}>Odaklanmış</div>
      )}

      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-2.5 h-2.5 rounded-full" style={{background: scenario.color, boxShadow: `0 0 12px ${scenario.color}` }}/>
        <h3 className="text-[15px] font-semibold" style={{color: scenario.color}}>{scenario.label}</h3>
        <div className="ml-auto">
          <button className="text-enba-dim hover:text-enba-text" onClick={(e) => e.stopPropagation()}>
            <I.Edit size={13}/>
          </button>
        </div>
      </div>

      <p className="text-[11.5px] text-enba-muted leading-snug mb-4 min-h-[34px]">{scenario.hint}</p>

      {/* Multipliers */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-enba-panel-2/60 rounded-md px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-wider text-enba-dim">Gelir Çarpanı</div>
          <div className="text-[15px] font-semibold tabular mt-0.5">
            {(scenario.rev * 100).toFixed(0)}%
          </div>
        </div>
        <div className="bg-enba-panel-2/60 rounded-md px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-wider text-enba-dim">Maliyet Çarpanı</div>
          <div className="text-[15px] font-semibold tabular mt-0.5">
            {(scenario.cost * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Metrics summary */}
      <div className="space-y-1.5 pt-3 border-t border-enba-line/50">
        <ScenarioMetric label="Toplam Gelir" value={fmtTL(metrics.totalRev)} accent={scenario.color}/>
        <ScenarioMetric label="EBITDA"        value={fmtTL(metrics.totalEb)}  sub={fmtPct(metrics.ebMargin, 1)+' marj'}/>
        <ScenarioMetric label="Net Kâr"       value={fmtTL(metrics.totalNet)} accent={metrics.totalNet >= 0 ? '#3DBE7C' : '#E5484D'}/>
        <ScenarioMetric label="Geri Ödeme"    value={metrics.payback ? `${metrics.payback} ay` : '> 24 ay'}/>
      </div>
    </div>
  );
};

const ScenarioMetric = ({ label, value, sub, accent }) => (
  <div className="flex items-center justify-between text-[12px]">
    <span className="text-enba-muted">{label}</span>
    <div className="text-right">
      <span className="font-semibold tabular" style={accent ? { color: accent } : {}}>{value}</span>
      {sub && <span className="text-[10.5px] text-enba-dim tabular ml-1.5">{sub}</span>}
    </div>
  </div>
);

const ComparisonTable = ({ metrics }) => {
  const ids = Object.keys(SCENARIOS);
  const baz = metrics.baz;
  const rows = [
    { label: 'Gelir Çarpanı',  getter: (m) => (m.scenario.rev * 100).toFixed(0) + '%', raw: (m) => m.scenario.rev },
    { label: 'Maliyet Çarpanı', getter: (m) => (m.scenario.cost * 100).toFixed(0) + '%', raw: (m) => m.scenario.cost },
    { label: 'Toplam Gelir (24 ay)', getter: (m) => fmtTL(m.totalRev), raw: (m) => m.totalRev, money: true },
    { label: 'Toplam Gider', getter: (m) => fmtTL(m.totalOp), raw: (m) => m.totalOp, money: true, inverse: true },
    { label: 'EBITDA', getter: (m) => fmtTL(m.totalEb), raw: (m) => m.totalEb, money: true },
    { label: 'EBITDA Marjı', getter: (m) => fmtPct(m.ebMargin, 1), raw: (m) => m.ebMargin },
    { label: 'Net Kâr', getter: (m) => fmtTL(m.totalNet), raw: (m) => m.totalNet, money: true },
    { label: 'Geri Ödeme Süresi', getter: (m) => m.payback ? `${m.payback} ay` : '> 24 ay', raw: (m) => m.payback ?? 999, inverse: true },
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
              idx === 4 && 'border-t-2 border-enba-orange/30',
              r.money && 'font-medium')}>
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
  const [priceShift, setPriceShift] = _useS_sc(0);
  const [volShift, setVolShift]     = _useS_sc(0);
  const [costShift, setCostShift]   = _useS_sc(0);

  const baseScen = SCENARIOS.baz;
  const result = _useM_sc(() => {
    let rev = 0, opex = 0, fix = 0;
    for (let i = 0; i < 24; i++) {
      const periodRev = PRODUCTS.reduce((s, p) => {
        return s + monthlyPriceFor(p, i) * (1 + priceShift) * monthlyVolumeFor(p, i) * (1 + volShift);
      }, 0);
      const periodVar = PRODUCTS.reduce((s, p) => {
        const baseRev = monthlyPriceFor(p, i) * (1 + priceShift) * monthlyVolumeFor(p, i) * (1 + volShift);
        return s + baseRev * p.varCostRatio * (1 + costShift);
      }, 0);
      const periodFix = FIXED_EXPENSES.reduce((s, e) => s + fixedCostFor(e, i, baseScen) * (1 + costShift), 0);
      rev += periodRev; opex += periodVar + periodFix; fix += periodFix;
    }
    const ebitda = rev - opex;
    return { rev, opex, ebitda, margin: rev > 0 ? ebitda/rev : 0 };
  }, [priceShift, volShift, costShift]);

  // base reference
  const baseMetrics = _useM_sc(() => {
    const series = buildSeries(baseScen);
    const rev = series.reduce((a, x) => a + x.revenue, 0);
    const eb  = series.reduce((a, x) => a + x.ebitda, 0);
    return { rev, eb };
  }, []);

  const revDelta = baseMetrics.rev !== 0 ? (result.rev - baseMetrics.rev) / baseMetrics.rev : 0;
  const ebDelta  = baseMetrics.eb  !== 0 ? (result.ebitda - baseMetrics.eb) / baseMetrics.eb  : 0;

  return (
    <div>
      <p className="text-[11.5px] text-enba-muted mb-4 leading-snug">
        Baz senaryo üzerinde değişiklik yaparak sonucu canlı görün. Sıfıra çekerek başlangıç değerlerine dönebilirsiniz.
      </p>

      <SensSlider label="Birim Fiyat"  value={priceShift} onChange={setPriceShift}/>
      <SensSlider label="Satış Hacmi"  value={volShift}   onChange={setVolShift}/>
      <SensSlider label="Maliyetler"   value={costShift}  onChange={setCostShift} inverse/>

      <div className="mt-5 pt-4 border-t border-enba-line space-y-2.5">
        <SensResult label="Toplam Gelir"  value={fmtTL(result.rev)}    delta={revDelta} better={revDelta >= 0}/>
        <SensResult label="EBITDA"        value={fmtTL(result.ebitda)} delta={ebDelta}  better={ebDelta >= 0}/>
        <SensResult label="EBITDA Marjı"  value={fmtPct(result.margin, 1)} delta={null}/>
      </div>

      <button
        onClick={() => { setPriceShift(0); setVolShift(0); setCostShift(0); }}
        className="mt-4 text-[11.5px] text-enba-orange hover:underline inline-flex items-center gap-1">
        <I.Refresh size={11}/> Sıfırla
      </button>
    </div>
  );
};

const SensSlider = ({ label, value, onChange, inverse }) => {
  const pct = (value * 100);
  return (
    <div className="mb-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-enba-text">{label}</span>
        <span className={cx('text-[11.5px] tabular font-medium px-1.5 py-0.5 rounded',
          pct > 0 ? 'text-enba-green bg-enba-green/10' : pct < 0 ? 'text-enba-red bg-enba-red/10' : 'text-enba-muted bg-enba-panel-2'
        )}>
          {pct > 0 ? '+' : ''}{pct.toFixed(0)}%
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={-30} max={30} step={1}
          value={Math.round(pct)}
          onChange={(e) => onChange(Number(e.target.value)/100)}
          className="w-full sens-slider"
        />
      </div>
      <style>{`
        .sens-slider { -webkit-appearance: none; appearance: none; height: 4px; background: rgb(var(--enba-line)); border-radius: 2px; outline: none; }
        .sens-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: rgb(var(--enba-orange)); border-radius: 50%; cursor: pointer; border: 2px solid rgb(var(--enba-panel)); }
        .sens-slider::-moz-range-thumb { width: 16px; height: 16px; background: rgb(var(--enba-orange)); border-radius: 50%; cursor: pointer; border: 2px solid rgb(var(--enba-panel)); }
      `}</style>
      <div className="flex justify-between text-[9.5px] text-enba-dim mt-0.5 tabular">
        <span>−30%</span><span>0</span><span>+30%</span>
      </div>
    </div>
  );
};

const SensResult = ({ label, value, delta, better = true }) => (
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

window.ScenarioPanel = ScenarioPanel;
