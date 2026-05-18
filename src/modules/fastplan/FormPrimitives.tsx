import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const InputRow: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}> = ({ label, value, onChange, suffix = '', min = 0, max = 9999999, step = 1 }) => (
  <div className="flex items-center justify-between gap-4 py-2.5 border-b border-enba-line last:border-0">
    <label className="text-[11px] font-medium text-enba-muted uppercase tracking-[0.1em] flex-shrink-0">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        onFocus={e => e.target.select()}
        className="w-32 text-right bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-1.5 text-[13px] font-semibold text-enba-text focus:border-enba-orange/50 focus:ring-2 focus:ring-enba-orange/15 outline-none transition-all tabular"
      />
      {suffix && <span className="text-[11px] text-enba-dim w-10">{suffix}</span>}
    </div>
  </div>
);

export const Panel: React.FC<{
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
}> = ({ title, icon, open, onToggle, children, badge }) => (
  <div className="bg-enba-panel border border-enba-line rounded-xl overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-enba-panel-2/60 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-enba-orange/10 rounded-lg flex items-center justify-center text-enba-orange flex-none">{icon}</div>
        <span className="text-[12px] font-semibold text-enba-text uppercase tracking-[0.1em]">{title}</span>
        {badge && <span className="px-2 py-0.5 bg-enba-orange/10 text-enba-orange text-[10px] font-medium rounded-md">{badge}</span>}
      </div>
      {open
        ? <ChevronUp size={15} className="text-enba-dim flex-none" />
        : <ChevronDown size={15} className="text-enba-dim flex-none" />}
    </button>
    {open && <div className="px-5 pb-5 pt-1">{children}</div>}
  </div>
);
