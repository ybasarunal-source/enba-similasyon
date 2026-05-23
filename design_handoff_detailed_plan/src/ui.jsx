// Reusable UI primitives for DetailedPlan
const { useState, useMemo, useRef, useEffect } = React;

const cx = (...xs) => xs.filter(Boolean).join(' ');

// ----- Theme -----
const ThemeContext = React.createContext({ theme: 'dark', toggleTheme: () => {} });
const useTheme = () => React.useContext(ThemeContext);

// Chart palette indexed by theme — keeps recharts in sync
const CHART_PALETTE = {
  dark: {
    grid:     '#262626',
    refLine:  '#3A3A3A',
    muted:    '#9A9A9A',
    panelBg:  '#1A1A1A',
    sliceSep: '#1A1A1A',
  },
  light: {
    grid:     '#E5E2D9',
    refLine:  '#D6D3CB',
    muted:    '#6D6D6D',
    panelBg:  '#FFFFFF',
    sliceSep: '#FFFFFF',
  },
};
const useChartColors = () => {
  const { theme } = useTheme();
  return CHART_PALETTE[theme] || CHART_PALETTE.dark;
};

const Card = ({ className = '', children, padded = true, ...rest }) => (
  <div className={cx(
    'bg-enba-panel border border-enba-line rounded-xl',
    padded && 'p-5',
    className
  )} {...rest}>
    {children}
  </div>
);

const SectionTitle = ({ eyebrow, title, action }) => (
  <div className="flex items-end justify-between mb-3">
    <div>
      {eyebrow && <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">{eyebrow}</div>}
      <h3 className="text-base font-semibold text-enba-text">{title}</h3>
    </div>
    {action}
  </div>
);

// KPI card
const KpiCard = ({ label, value, sub, trend, accent = 'orange', icon, tooltip }) => {
  const accentMap = {
    orange: 'text-enba-orange',
    green:  'text-enba-green',
    red:    'text-enba-red',
    amber:  'text-enba-amber',
    blue:   'text-enba-blue',
  };
  const trendUp = trend != null && trend > 0;
  const trendDown = trend != null && trend < 0;
  return (
    <div className="bg-enba-panel border border-enba-line rounded-xl p-5 flex flex-col gap-3 hover:border-enba-line-2 transition-colors group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-enba-muted text-[12px] font-medium">
          {icon}
          <span>{label}</span>
          {tooltip && <span title={tooltip} className="opacity-50"><I.Info size={13}/></span>}
        </div>
        {trend != null && (
          <span className={cx(
            'inline-flex items-center gap-1 text-[11px] tabular px-1.5 py-0.5 rounded',
            trendUp && 'text-enba-green bg-enba-green/10',
            trendDown && 'text-enba-red bg-enba-red/10',
          )}>
            {trendUp ? <I.Up size={11}/> : <I.Down size={11}/>}
            {Math.abs(trend*100).toFixed(1)}%
          </span>
        )}
      </div>
      <div className={cx('text-[26px] font-semibold tabular leading-none', accentMap[accent])}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-enba-dim leading-snug">{sub}</div>}
    </div>
  );
};

// Tiny sparkline for KPI cards (SVG, no recharts)
const Sparkline = ({ data, color = '#E35205', height = 36, width = 120, fill = true }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / range) * (height - 4) - 2]);
  const d = pts.map((p, i) => (i === 0 ? `M${p[0].toFixed(1)},${p[1].toFixed(1)}` : `L${p[0].toFixed(1)},${p[1].toFixed(1)}`)).join(' ');
  const area = d + ` L${width},${height} L0,${height} Z`;
  const id = 'spark-' + Math.random().toString(36).slice(2,8);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Segmented control
const Segmented = ({ options, value, onChange, size = 'sm' }) => (
  <div className={cx('inline-flex items-center bg-enba-panel-2 border border-enba-line rounded-lg p-0.5')}>
    {options.map(o => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className={cx(
          'px-3 py-1.5 rounded-md transition-colors',
          size === 'sm' ? 'text-[12px]' : 'text-sm',
          value === o.value
            ? 'bg-enba-orange text-white shadow-sm'
            : 'text-enba-muted hover:text-enba-text'
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

// Pill button
const Btn = ({ children, variant = 'ghost', onClick, icon, size = 'md', className = '' }) => {
  const variants = {
    primary: 'bg-enba-orange text-white hover:bg-enba-orange-2 border border-enba-orange',
    ghost:   'bg-enba-panel-2 text-enba-text hover:bg-enba-line border border-enba-line',
    outline: 'bg-transparent text-enba-text hover:bg-enba-panel-2 border border-enba-line',
    danger:  'bg-transparent text-enba-red hover:bg-enba-red/10 border border-enba-red/30',
  };
  const sizes = {
    sm: 'h-7 px-2.5 text-[12px] gap-1.5',
    md: 'h-9 px-3.5 text-[13px] gap-2',
  };
  return (
    <button onClick={onClick}
      className={cx('inline-flex items-center font-medium rounded-lg transition-colors', variants[variant], sizes[size], className)}>
      {icon}{children}
    </button>
  );
};

// Dropdown-ish selector (visual; static for the prototype)
const Select = ({ value, onChange, options, label, icon, className = '', tone = 'default' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const current = options.find(o => o.value === value);
  return (
    <div ref={ref} className={cx('relative', className)}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cx(
          'h-9 px-3 inline-flex items-center gap-2 rounded-lg border text-[13px] transition-colors',
          tone === 'accent'
            ? 'bg-enba-orange/10 border-enba-orange/40 text-enba-orange hover:bg-enba-orange/15'
            : 'bg-enba-panel-2 border-enba-line text-enba-text hover:bg-enba-line'
        )}>
        {icon}
        {label && <span className="text-enba-muted">{label}:</span>}
        <span className="font-medium">{current?.label}</span>
        <I.Chevron size={14} className="opacity-60"/>
      </button>
      {open && (
        <div className="absolute z-30 mt-1.5 min-w-[180px] right-0 bg-enba-panel border border-enba-line rounded-lg shadow-enba p-1">
          {options.map(o => (
            <button key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={cx(
                'w-full text-left px-2.5 py-1.5 rounded text-[13px] flex items-center justify-between gap-3',
                o.value === value ? 'bg-enba-orange/10 text-enba-orange' : 'text-enba-text hover:bg-enba-panel-2'
              )}>
              <span className="flex items-center gap-2">
                {o.dot && <span className="w-2 h-2 rounded-full" style={{background: o.dot}}/>}
                {o.label}
              </span>
              {o.hint && <span className="text-[11px] text-enba-dim">{o.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Scenario chip selector — colored
const ScenarioChip = ({ scenario, active, onClick }) => (
  <button onClick={onClick}
    className={cx(
      'inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-[13px] transition-colors',
      active
        ? 'border-transparent text-white'
        : 'border-enba-line bg-enba-panel-2 text-enba-muted hover:text-enba-text'
    )}
    style={active ? { background: scenario.color + '22', borderColor: scenario.color + '66', color: scenario.color } : {}}>
    <span className="w-1.5 h-1.5 rounded-full" style={{background: scenario.color}}/>
    {scenario.label}
  </button>
);

// Small badge
const Badge = ({ children, tone = 'neutral' }) => {
  const tones = {
    neutral: 'bg-enba-panel-2 text-enba-muted border-enba-line',
    orange:  'bg-enba-orange/10 text-enba-orange border-enba-orange/30',
    green:   'bg-enba-green/10 text-enba-green border-enba-green/30',
    red:     'bg-enba-red/10 text-enba-red border-enba-red/30',
    blue:    'bg-enba-blue/10 text-enba-blue border-enba-blue/30',
    amber:   'bg-enba-amber/10 text-enba-amber border-enba-amber/30',
  };
  return <span className={cx('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium border tabular', tones[tone])}>{children}</span>;
};

// Variance pill
const Variance = ({ value, asPct = false, base }) => {
  if (value == null) return <span className="text-enba-dim">—</span>;
  const positive = value >= 0;
  const txt = asPct
    ? ((value > 0 ? '+' : '') + (value*100).toFixed(1) + '%')
    : (value > 0 ? '+' : '') + fmtTL(value);
  return (
    <span className={cx('inline-flex items-center gap-1 tabular text-[12px] font-medium',
      positive ? 'text-enba-green' : 'text-enba-red')}>
      {positive ? <I.Up size={11}/> : <I.Down size={11}/>}
      {txt}
    </span>
  );
};

Object.assign(window, {
  cx, Card, SectionTitle, KpiCard, Sparkline, Segmented, Btn, Select, ScenarioChip, Badge, Variance,
  ThemeContext, useTheme, useChartColors,
});
