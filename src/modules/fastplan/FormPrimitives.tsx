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
  <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] flex-shrink-0">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        onFocus={e => e.target.select()}
        className="w-32 text-right bg-gray-50 border border-transparent rounded-xl px-4 py-2 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all tabular-nums"
      />
      {suffix && <span className="text-[10px] font-black text-gray-400 uppercase w-10">{suffix}</span>}
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
  <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center justify-between px-8 py-5 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-enba-dark/5 rounded-xl flex items-center justify-center text-enba-orange">{icon}</div>
        <span className="text-[11px] font-black text-enba-dark uppercase tracking-[2px] italic">{title}</span>
        {badge && <span className="px-2 py-0.5 bg-enba-orange/10 text-enba-orange text-[9px] font-black uppercase tracking-widest rounded-full">{badge}</span>}
      </div>
      {open ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
    </button>
    {open && <div className="px-8 pb-8">{children}</div>}
  </div>
);
