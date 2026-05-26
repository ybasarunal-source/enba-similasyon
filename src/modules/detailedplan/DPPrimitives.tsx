import React, { useState, useRef, useEffect } from 'react';
import { fmtTL } from './dpData';

// ---- cx helper ----
export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

// ---- Chart palette ----
const CHART_PALETTE = {
  dark: { grid: '#262626', refLine: '#3A3A3A', muted: '#9A9A9A', panelBg: '#1A1A1A', sliceSep: '#1A1A1A' },
  light: { grid: '#E5E2D9', refLine: '#D6D3CB', muted: '#6D6D6D', panelBg: '#FFFFFF', sliceSep: '#FFFFFF' },
};

export const useChartColors = () => {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return isDark ? CHART_PALETTE.dark : CHART_PALETTE.light;
};

/**
 * XAxis interval hesaplayıcı — veri noktası sayısından max ~5 label görünmesini sağlar.
 * Recharts interval={n}: her (n+1). tick gösterilir.
 * Örnek: n=24 → interval=3 → 6 label | n=52 → interval=9 → ~5 label
 */
export const xInterval = (dataLen: number, maxLabels = 5): number =>
  Math.max(0, Math.floor(dataLen / maxLabels) - 1);

// ---- Icons ----
const Icon = ({ d, size = 18, stroke = 1.6, fill = 'none', children, className = '' }:
  { d?: string; size?: number; stroke?: number; fill?: string; children?: React.ReactNode; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke="currentColor" strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {d ? <path d={d} /> : children}
  </svg>
);

type IconProps = { size?: number; className?: string };

export const I = {
  Dashboard: (p: IconProps) => <Icon {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Icon>,
  Revenue:   (p: IconProps) => <Icon {...p}><path d="M3 17l5-5 4 4 8-9"/><path d="M14 7h6v6"/></Icon>,
  Expense:   (p: IconProps) => <Icon {...p}><path d="M3 7l5 5 4-4 9 9"/><path d="M14 17h6v-6"/></Icon>,
  Cash:      (p: IconProps) => <Icon {...p}><rect x="2.5" y="6" width="19" height="13" rx="2"/><circle cx="12" cy="12.5" r="2.6"/><path d="M6 6V4.5A1.5 1.5 0 017.5 3h9A1.5 1.5 0 0118 4.5V6"/></Icon>,
  Scenario:  (p: IconProps) => <Icon {...p}><path d="M4 7h6"/><path d="M4 12h10"/><path d="M4 17h16"/><circle cx="13" cy="7" r="1.7"/><circle cx="17" cy="12" r="1.7"/></Icon>,
  Budget:    (p: IconProps) => <Icon {...p}><path d="M12 3a9 9 0 109 9"/><path d="M12 3v9l6.4 6.4"/><path d="M21 12a9 9 0 00-9-9"/></Icon>,
  Save:      (p: IconProps) => <Icon {...p}><path d="M5 4h11l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M8 4v5h7V4"/><path d="M8 14h8v6H8z"/></Icon>,
  Pdf:       (p: IconProps) => <Icon {...p}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></Icon>,
  Chevron:   (p: IconProps) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>,
  Search:    (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>,
  Plus:      (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Trash:     (p: IconProps) => <Icon {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></Icon>,
  Edit:      (p: IconProps) => <Icon {...p}><path d="M4 20h4l11-11-4-4L4 16v4z"/></Icon>,
  Filter:    (p: IconProps) => <Icon {...p}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></Icon>,
  Up:        (p: IconProps) => <Icon {...p}><path d="M7 14l5-5 5 5"/></Icon>,
  Down:      (p: IconProps) => <Icon {...p}><path d="M7 10l5 5 5-5"/></Icon>,
  Calendar:  (p: IconProps) => <Icon {...p}><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></Icon>,
  Logo:      (p: IconProps) => <Icon {...p}><path d="M3 12l4-7h10l4 7-4 7H7z" fill="#E35205" stroke="#E35205"/><path d="M9 12h6" stroke="#fff"/></Icon>,
  Info:      (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 8v.01"/></Icon>,
  Refresh:   (p: IconProps) => <Icon {...p}><path d="M21 12a9 9 0 11-3-6.7L21 8"/><path d="M21 3v5h-5"/></Icon>,
  Bell:      (p: IconProps) => <Icon {...p}><path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 004 0"/></Icon>,
  Sparkles:  (p: IconProps) => <Icon {...p}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7z"/></Icon>,
  Bolt:      (p: IconProps) => <Icon {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></Icon>,
  Check:     (p: IconProps) => <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7"/></Icon>,
  Sun:       (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></Icon>,
  Moon:      (p: IconProps) => <Icon {...p}><path d="M21 13.5A8.5 8.5 0 1110.5 3a7 7 0 0010.5 10.5z"/></Icon>,
  Lock:      (p: IconProps) => <Icon {...p}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></Icon>,
  Copy:      (p: IconProps) => <Icon {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></Icon>,
  List:      (p: IconProps) => <Icon {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></Icon>,
};

// ---- Card ----
export const Card = ({ className = '', children, padded = true, ...rest }:
  { className?: string; children: React.ReactNode; padded?: boolean; [k: string]: any }) => (
  <div className={cx('bg-enba-panel border border-enba-line rounded-xl', padded && 'p-5', className)} {...rest}>
    {children}
  </div>
);

// ---- SectionTitle ----
export const SectionTitle = ({ eyebrow, title, action }:
  { eyebrow?: string; title: string; action?: React.ReactNode }) => (
  <div className="flex items-end justify-between mb-3">
    <div>
      {eyebrow && <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-1">{eyebrow}</div>}
      <h3 className="text-base font-semibold text-enba-text">{title}</h3>
    </div>
    {action}
  </div>
);

// ---- KpiCard ----
export const KpiCard = ({ label, value, sub, trend, accent = 'orange', icon, tooltip }:
  { label: string; value: string; sub?: string; trend?: number | null; accent?: string; icon?: React.ReactNode; tooltip?: string }) => {
  const accentMap: Record<string, string> = {
    orange: 'text-enba-orange', green: 'text-enba-green', red: 'text-enba-red',
    amber: 'text-enba-amber', blue: 'text-enba-blue',
  };
  const trendUp = trend != null && trend > 0;
  const trendDown = trend != null && trend < 0;
  return (
    <div className="bg-enba-panel border border-enba-line rounded-xl p-5 flex flex-col gap-3 hover:border-enba-line-2 transition-colors group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-enba-muted text-[12px] font-medium">
          {icon}<span>{label}</span>
          {tooltip && <span title={tooltip} className="opacity-50"><I.Info size={13}/></span>}
        </div>
        {trend != null && (
          <span className={cx('inline-flex items-center gap-1 text-[11px] tabular px-1.5 py-0.5 rounded',
            trendUp && 'text-enba-green bg-enba-green/10',
            trendDown && 'text-enba-red bg-enba-red/10',
          )}>
            {trendUp ? <I.Up size={11}/> : <I.Down size={11}/>}
            {Math.abs((trend ?? 0)*100).toFixed(1)}%
          </span>
        )}
      </div>
      <div className={cx('text-[26px] font-semibold tabular leading-none', accentMap[accent] || accentMap.orange)}>{value}</div>
      {sub && <div className="text-[11px] text-enba-dim leading-snug">{sub}</div>}
    </div>
  );
};

// ---- Sparkline ----
export const Sparkline = ({ data, color = '#E35205', height = 36, width = 120, fill = true }:
  { data: number[]; color?: string; height?: number; width?: number; fill?: boolean }) => {
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
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// ---- Segmented ----
export const Segmented = ({ options, value, onChange, size = 'sm' }:
  { options: { value: any; label: string }[]; value: any; onChange: (v: any) => void; size?: 'sm' | 'md' }) => (
  <div className="inline-flex items-center bg-enba-panel-2 border border-enba-line rounded-lg p-0.5">
    {options.map(o => (
      <button key={o.value} onClick={() => onChange(o.value)}
        className={cx('px-3 py-1.5 rounded-md transition-colors',
          size === 'sm' ? 'text-[12px]' : 'text-sm',
          value === o.value ? 'bg-enba-orange text-white shadow-sm' : 'text-enba-muted hover:text-enba-text'
        )}>
        {o.label}
      </button>
    ))}
  </div>
);

// ---- Btn ----
export const Btn = ({ children, variant = 'ghost', onClick, icon, size = 'md', className = '', disabled = false }:
  { children?: React.ReactNode; variant?: 'primary'|'ghost'|'outline'|'danger'; onClick?: () => void;
    icon?: React.ReactNode; size?: 'sm'|'md'; className?: string; disabled?: boolean }) => {
  const variants: Record<string, string> = {
    primary: 'bg-enba-orange text-white hover:bg-enba-orange-2 border border-enba-orange',
    ghost:   'bg-enba-panel-2 text-enba-text hover:bg-enba-line border border-enba-line',
    outline: 'bg-transparent text-enba-text hover:bg-enba-panel-2 border border-enba-line',
    danger:  'bg-transparent text-enba-red hover:bg-enba-red/10 border border-enba-red/30',
  };
  const sizes: Record<string, string> = {
    sm: 'h-7 px-2.5 text-[12px] gap-1.5',
    md: 'h-9 px-3.5 text-[13px] gap-2',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={cx('inline-flex items-center font-medium rounded-lg transition-colors', variants[variant], sizes[size], disabled && 'opacity-40 cursor-not-allowed pointer-events-none', className)}>
      {icon}{children}
    </button>
  );
};

// ---- Select ----
export const Select = ({ value, onChange, options, label, icon, className = '', tone = 'default' }:
  { value: any; onChange: (v: any) => void; options: { value: any; label: string; dot?: string; hint?: string }[];
    label?: string; icon?: React.ReactNode; className?: string; tone?: string }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const current = options.find(o => o.value === value);
  return (
    <div ref={ref} className={cx('relative', className)}>
      <button onClick={() => setOpen(o => !o)}
        className={cx('h-9 px-3 inline-flex items-center gap-2 rounded-lg border text-[13px] transition-colors',
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
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              className={cx('w-full text-left px-2.5 py-1.5 rounded text-[13px] flex items-center justify-between gap-3',
                o.value === value ? 'bg-enba-orange/10 text-enba-orange' : 'text-enba-text hover:bg-enba-panel-2')}>
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

// ---- ScenarioChip ----
export const ScenarioChip = ({ scenario, active, onClick }:
  { scenario: { color: string; label: string }; active: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className={cx('inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-[13px] transition-colors',
      active ? 'border-transparent text-white' : 'border-enba-line bg-enba-panel-2 text-enba-muted hover:text-enba-text'
    )}
    style={active ? { background: scenario.color + '22', borderColor: scenario.color + '66', color: scenario.color } : {}}>
    <span className="w-1.5 h-1.5 rounded-full" style={{background: scenario.color}}/>
    {scenario.label}
  </button>
);

// ---- Badge ----
export const Badge = ({ children, tone = 'neutral' }:
  { children: React.ReactNode; tone?: 'neutral'|'orange'|'green'|'red'|'blue'|'amber' }) => {
  const tones: Record<string, string> = {
    neutral: 'bg-enba-panel-2 text-enba-muted border-enba-line',
    orange:  'bg-enba-orange/10 text-enba-orange border-enba-orange/30',
    green:   'bg-enba-green/10 text-enba-green border-enba-green/30',
    red:     'bg-enba-red/10 text-enba-red border-enba-red/30',
    blue:    'bg-enba-blue/10 text-enba-blue border-enba-blue/30',
    amber:   'bg-enba-amber/10 text-enba-amber border-enba-amber/30',
  };
  return <span className={cx('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium border tabular', tones[tone])}>{children}</span>;
};

// ---- Variance ----
export const Variance = ({ value, asPct = false }:
  { value: number | null | undefined; asPct?: boolean; base?: number }) => {
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
