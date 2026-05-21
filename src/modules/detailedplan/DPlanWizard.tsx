import React, { useState, useMemo, useRef } from 'react';
import { cx, I, Btn } from './DPPrimitives';
import {
  DPlan, Product, FixedExpense, ActiveProject, CostCenter, Supplier, Customer,
  buildMonths, buildSeries, fmtTL, SCENARIOS,
} from './dpData';

/* ══════════════════════════════════════════════════════
   M-KOD VERİSİ
══════════════════════════════════════════════════════ */
export interface MCodeEntry { code: string; tr: string; }

// Alım maliyetleri — hammadde/malzeme alışları
const MCODES_ALIM: MCodeEntry[] = [
  { code: 'M369', tr: '150/710 - M369 İlk Madde ve Malzeme Giderleri Toplamı' },
];

// Üretim maliyetleri — enerji, bakım, dışarıdan hizmet
const MCODES_URETIM: MCodeEntry[] = [
  { code: 'M405', tr: '770.40 - M405 Elektrik Enerjisi Giderleri' },
  { code: 'M410', tr: '770.41 - M410 Isınma, Yakıt ve Buhar Giderleri' },
  { code: 'M415', tr: '770.42 - M415 Su Tüketim Giderleri' },
  { code: 'M509', tr: '770.20 - M509 Makine, Cihaz ve Bakım Onarım Giderleri' },
  { code: 'M529', tr: '770.25 - M529 Çevre, Atık Yönetimi ve İSG Giderleri' },
  { code: 'M604', tr: '730.05 - M604 Dışarıdan Sağlanan Fayda ve Hizmetler (Üretim)' },
];
// Birim tüketim bazlı üretim giderleri (birim fiyat × aylık tüketim)
const URETIM_BIRIM: Record<string, string> = { 'M405': 'kWh', 'M410': 'lt', 'M415': 'm³' };

// Personel maliyetleri
const MCODES_PERSONEL: MCodeEntry[] = [
  { code: 'M489',    tr: '770.01 - M489 Brüt Personel Maaş ve Ücret Giderleri' },
  { code: 'M489.01', tr: '770.02 - M489.01 SGK İşveren Payı Giderleri' },
  { code: 'M489.03', tr: '770.04 - M489.03 Personel Yemek ve Mutfak Giderleri' },
  { code: 'M489.04', tr: '770.05 - M489.04 Personel Ulaşım ve Yol Giderleri' },
  { code: 'M605',    tr: '770.06 - M605 Dışarıdan Sağlanan Personel Hizmetleri' },
];
// Kişi bazlı personel giderleri (kişi sayısı × birim ücret)
const PERSONEL_KISI_BAZLI = new Set(['M489', 'M489.01', 'M489.03', 'M489.04']);

// Satış / pazarlama maliyetleri
const MCODES_SATIS: MCodeEntry[] = [
  { code: 'M630', tr: '760.20 - M630 Reklam, Pazarlama ve Tanıtım Giderleri' },
  { code: 'M640', tr: '760.30 - M640 Lojistik, Nakliye ve Dağıtım Giderleri' },
  { code: 'M650', tr: '760.40 - M650 Satış Komisyonu ve Bayi Giderleri' },
  { code: 'M999', tr: '760.99 - M999 Diğer Satış ve Pazarlama Giderleri' },
];

// MCodeTag için tüm gider kodları birleşik
const MCODES_ALL_EXPENSE: MCodeEntry[] = [
  ...MCODES_ALIM, ...MCODES_URETIM, ...MCODES_PERSONEL, ...MCODES_SATIS,
];

// Gelir kodları
const MCODES_SALES: MCodeEntry[] = [
  { code: 'M105', tr: '600.01 - M105 Yurt İçi Satışlar (Üçüncü Şahıslar)' },
  { code: 'M149', tr: '600.02 - M149 Ticari Mal Satışları (Net)' },
];

/* ══════════════════════════════════════════════════════
   YARDIMCI BİLEŞENLER
══════════════════════════════════════════════════════ */

function MCodeTag({ code, mcodes }: { code: string; mcodes: MCodeEntry[] }) {
  const [open, setOpen] = useState(false);
  const entry = mcodes.find(m => m.code === code);
  const parts  = entry ? entry.tr.split(' - ') : [];
  const acctNo = parts[0] ?? '';
  const desc   = parts.slice(1).join(' - ');
  return (
    <span className="relative inline-block">
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-enba-panel-2 border border-enba-line text-[11px] font-mono text-enba-orange cursor-default select-none"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      >{code}</span>
      {open && entry && (
        <div className="absolute left-0 top-full mt-1 z-50 w-[280px] bg-enba-panel border border-enba-line rounded-lg shadow-xl p-3 pointer-events-none">
          <div className="text-[10px] text-enba-dim font-mono mb-0.5">{acctNo}</div>
          <div className="text-[12px] text-enba-text leading-snug">{desc}</div>
        </div>
      )}
    </span>
  );
}

function MCodeSelect({ value, onChange, mcodes, label }:
  { value: string; onChange: (v: string) => void; mcodes: MCodeEntry[]; label: string }) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const entry    = mcodes.find(m => m.code === value);
  const acctNo   = entry ? entry.tr.split(' - ')[0] : '';
  const desc     = entry ? entry.tr.split(' - ').slice(1).join(' - ') : '';
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q ? mcodes.filter(m => m.tr.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)) : mcodes;
  }, [query, mcodes]);

  const select = (code: string) => { onChange(code); setOpen(false); setQuery(''); };

  return (
    <div className="relative">
      <label className="block text-[11px] uppercase tracking-wider text-enba-dim mb-1.5">{label}</label>
      <button type="button"
        onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="w-full bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2 text-[13px] text-left flex items-center gap-2 focus:border-enba-orange/60 outline-none transition-colors"
      >
        <span className="font-mono text-enba-orange flex-none">{value}</span>
        <span className="text-enba-muted truncate text-[12px] flex-1">{desc}</span>
        <I.Chevron size={12} className={cx('flex-none text-enba-dim transition-transform', open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-enba-panel border border-enba-line rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-enba-line">
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Ara…"
              className="w-full bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-1.5 text-[12.5px] text-enba-text outline-none focus:border-enba-orange/60" />
          </div>
          <ul className="max-h-[420px] overflow-y-auto py-1">
            {filtered.length === 0 && <li className="px-4 py-3 text-[12px] text-enba-dim text-center">Sonuç yok</li>}
            {filtered.map(m => {
              const mDesc = m.tr.split(' - ').slice(1).join(' - ');
              return (
                <li key={m.code}>
                  <button type="button" onClick={() => select(m.code)}
                    className={cx('w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-enba-panel-2 transition-colors', m.code === value ? 'bg-enba-orange/10' : '')}>
                    <span className="font-mono text-[12px] text-enba-orange flex-none w-[72px]">{m.code}</span>
                    <span className="text-[12px] text-enba-text leading-snug">{mDesc}</span>
                    {m.code === value && <I.Check size={12} className="text-enba-orange flex-none ml-auto" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {entry && (
        <div className="mt-1 flex items-baseline gap-1.5 text-[10.5px]">
          <span className="font-mono text-enba-dim">{acctNo}</span>
          <span className="text-enba-muted">{desc}</span>
        </div>
      )}
    </div>
  );
}

const inputCls  = 'w-full bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2 text-[13px] text-enba-text focus:border-enba-orange/60 focus:ring-1 focus:ring-enba-orange/30 outline-none transition-colors';
const selectCls = inputCls + ' appearance-none';

function MoneyInput({ value, onChange, className, min = 0 }:
  { value: number; onChange: (v: number) => void; className?: string; min?: number }) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState('');
  const display = focused ? raw : (value === 0 ? '' : value.toLocaleString('tr-TR'));
  return (
    <input type="text" inputMode="numeric" value={display} placeholder="0"
      onFocus={() => { setFocused(true); setRaw(value === 0 ? '' : String(value)); }}
      onBlur={() => { setFocused(false); const p = Number(raw.replace(/[^\d]/g, '')); onChange(isNaN(p) ? min : Math.max(min, p)); }}
      onChange={e => setRaw(e.target.value.replace(/[^\d]/g, ''))}
      className={className ?? inputCls} />
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-enba-dim mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[10.5px] text-enba-dim mt-1">{hint}</p>}
    </div>
  );
}

function FieldCard({ children }: { children: React.ReactNode }) {
  return <div className="bg-enba-panel border border-enba-line rounded-xl p-5 space-y-4">{children}</div>;
}

function StepHeader({ step, total, title, sub }: { step: number; total: number; title: string; sub: string }) {
  return (
    <div className="mb-4">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-dim mb-1">Adım {step} / {total}</div>
      <h2 className="text-[20px] font-semibold text-enba-text">{title}</h2>
      <p className="text-[12.5px] text-enba-muted mt-1">{sub}</p>
    </div>
  );
}

const MONTHS_TR_FULL = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const UNITS_WEIGHT   = ['ton','kg','m³'];
const UNITS_PRODUCT  = ['ton','kg','adet','sefer','m²','paket'];
const PROJECT_COLORS = ['#E35205','#3DBE7C','#5B9DFF','#F2A93B','#9B8EF0','#E5484D','#FF8A3D','#9A9A9A'];

/* ══════════════════════════════════════════════════════
   ADIM 1 — Temel Bilgiler
══════════════════════════════════════════════════════ */
interface Step1Props {
  title: string; setTitle: (v: string) => void;
  startYear: number; setStartYear: (v: number) => void;
  startMonth: number; setStartMonth: (v: number) => void;
  horizon: number; setHorizon: (v: number) => void;
  openingCash: number; setOpeningCash: (v: number) => void;
}
function Step1({ title, setTitle, startYear, setStartYear, startMonth, setStartMonth, horizon, setHorizon, openingCash, setOpeningCash }: Step1Props) {
  return (
    <div className="space-y-6">
      <StepHeader step={1} total={2} title="Temel Bilgiler" sub="Plan adı, zaman aralığı ve başlangıç nakit bakiyesi." />
      <FieldCard>
        <Field label="Plan Adı">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="örn. 2025 PET Geri Dönüşüm Planı"
            className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Başlangıç Yılı">
            <input type="number" value={startYear} min={2020} max={2040}
              onChange={e => setStartYear(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Başlangıç Ayı">
            <select value={startMonth} onChange={e => setStartMonth(Number(e.target.value))} className={selectCls}>
              {MONTHS_TR_FULL.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Plan Ufku">
          <div className="flex gap-2">
            {[12, 18, 24, 36].map(h => (
              <button key={h} onClick={() => setHorizon(h)}
                className={cx('flex-1 h-9 rounded-lg border text-[13px] font-medium transition-colors',
                  horizon === h ? 'border-enba-orange bg-enba-orange/10 text-enba-orange' : 'border-enba-line bg-enba-panel-2 text-enba-muted hover:border-enba-orange/40')}>
                {h} ay
              </button>
            ))}
          </div>
        </Field>
        <Field label="Açılış Nakit Bakiyesi (₺)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
            <MoneyInput value={openingCash} onChange={setOpeningCash} className={cx(inputCls, 'pl-7')} />
          </div>
        </Field>
      </FieldCard>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ADIM 2 — Projeler
══════════════════════════════════════════════════════ */
function emptyProject(idx: number, defaultCostCenterId: string): ActiveProject {
  return {
    id: crypto.randomUUID(),
    costCenterId: defaultCostCenterId,
    isActive: true,
    name: '',
    color: PROJECT_COLORS[idx % PROJECT_COLORS.length],
    allocationWeight: 1,
    startOffset: 0,
    endOffset: undefined,
    expenses: [],
    revenues: [],
  };
}

function emptyProjectExpense(): FixedExpense {
  return { id: crypto.randomUUID(), mcode: 'M489', costCategory: 'production', name: '', group: 'Sabit', monthly: 0, growth: 0.10, startOffset: 0 };
}

function emptyRevenue(idx: number): Product {
  return {
    id: crypto.randomUUID(), mcode: 'M105', name: '', category: 'Üretim', unit: 'ton',
    price: 0, priceGrowth: 0.08, seasonality: Array(12).fill(1),
    volume: 0, volumeGrowth: 0.05, varCostRatio: 0,
    color: PROJECT_COLORS[idx % PROJECT_COLORS.length],
  };
}

/* ══════════════════════════════════════════════════════
   KATEGORİ BAZLI GİDER LİSTELERİ
══════════════════════════════════════════════════════ */

// Tüm gider listelerinde kullanılan satır + form yardımcısı
function ExpenseRow({ item, onEdit, onDelete }: {
  item: FixedExpense;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isKisiBazli = PERSONEL_KISI_BAZLI.has(item.mcode);
  const isBirimBazli = item.mcode in URETIM_BIRIM;
  const isPurchase = item.costCategory === 'purchase';
  const birim = URETIM_BIRIM[item.mcode];
  return (
    <div className="bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2.5 flex items-center gap-3 group">
      <MCodeTag code={item.mcode} mcodes={MCODES_ALL_EXPENSE} />
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-enba-text truncate">{item.name}</div>
        <div className="text-[10.5px] text-enba-dim mt-0.5">
          {isPurchase && item.monthlyQty != null && item.unitPrice != null
            ? `${item.monthlyQty.toLocaleString('tr-TR')} ${item.unit ?? 'ton'} × ${fmtTL(item.unitPrice)}/${item.unit ?? 'ton'}`
            : isBirimBazli && item.monthlyQty != null && item.unitPrice != null
            ? `${item.monthlyQty.toLocaleString('tr-TR')} ${birim} × ${fmtTL(item.unitPrice)}/${birim}`
            : isKisiBazli && item.monthlyQty != null && item.unitPrice != null
            ? `${item.monthlyQty} kişi × ${fmtTL(item.unitPrice)}/kişi`
            : `+${Math.round(item.growth * 100)}%/yıl${(item.startOffset ?? 0) > 0 ? ` · ${item.startOffset! + 1}. aydan` : ''}`
          }
        </div>
      </div>
      <span className="text-[12.5px] font-semibold tabular text-enba-text flex-none">{fmtTL(item.monthly)}/ay</span>
      <button onClick={onEdit} className="w-6 h-6 rounded text-enba-dim hover:text-enba-text hover:bg-enba-panel opacity-0 group-hover:opacity-100 inline-flex items-center justify-center"><I.Edit size={12} /></button>
      <button onClick={onDelete} className="w-6 h-6 rounded text-enba-dim hover:text-enba-red opacity-0 group-hover:opacity-100 inline-flex items-center justify-center"><I.Trash size={12} /></button>
    </div>
  );
}

/* ── 1. Alım Maliyetleri (M369) ── */
function AlimList({ all, setAll, suppliers = [] }: { all: FixedExpense[]; setAll: (v: FixedExpense[]) => void; suppliers?: Supplier[] }) {
  const items    = all.filter(e => e.costCategory === 'purchase');
  const setItems = (updated: FixedExpense[]) => setAll([...all.filter(e => e.costCategory !== 'purchase'), ...updated]);

  const empty = (): FixedExpense => ({
    id: crypto.randomUUID(), mcode: 'M369', costCategory: 'purchase',
    name: '', group: 'Yarı Değişken', monthly: 0, growth: 0.08,
    startOffset: 0, unit: 'ton', unitPrice: 0, monthlyQty: 0,
  });

  const [adding, setAdding] = useState(false);
  const [draft,  setDraft]  = useState<FixedExpense>(empty());
  const [editId, setEditId] = useState<string | null>(null);

  const startAdd  = () => { setDraft(empty()); setEditId(null); setAdding(true); };
  const startEdit = (item: FixedExpense) => { setDraft({ ...item }); setEditId(item.id); setAdding(true); };
  const cancel    = () => { setAdding(false); setEditId(null); };
  const save = () => {
    if (!draft.name.trim()) return;
    const monthly = (draft.unitPrice ?? 0) * (draft.monthlyQty ?? 0);
    const item = { ...draft, monthly };
    if (editId) setItems(items.map(i => i.id === editId ? item : i));
    else        setItems([...items, { ...item, id: crypto.randomUUID() }]);
    setAdding(false); setEditId(null);
  };
  const totalMonthly = items.reduce((s, e) => s + e.monthly, 0);

  return (
    <div className="space-y-3">
      <p className="text-[11.5px] text-enba-dim">Hammadde ve malzeme alışları. Birim fiyat × aylık miktar → aylık maliyet.</p>
      {items.map(item => (
        <ExpenseRow key={item.id} item={item} onEdit={() => startEdit(item)} onDelete={() => setItems(items.filter(i => i.id !== item.id))} />
      ))}
      {adding ? (
        <div className="bg-enba-panel border border-enba-line rounded-xl p-4 space-y-3">
          {suppliers.length > 0 && (
            <Field label="Tedarikçiden Seç">
              <select
                value=""
                onChange={e => {
                  const s = suppliers.find(x => x.id === e.target.value);
                  if (s) setDraft({ ...draft, name: s.material || draft.name, unit: s.unit, unitPrice: s.unitPrice });
                }}
                className={selectCls}
              >
                <option value="">— tedarikçiden doldur (isteğe bağlı) —</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} · {s.material} ({fmtTL(s.unitPrice)}/{s.unit})</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Malzeme / Hammadde Adı">
            <input autoFocus value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
              placeholder="örn. PET Şişe Atık" className={inputCls} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Birim">
              <select value={draft.unit ?? 'ton'} onChange={e => setDraft({ ...draft, unit: e.target.value })} className={selectCls}>
                {UNITS_WEIGHT.map(u => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label={`Alış Fiyatı (₺/${draft.unit ?? 'ton'})`}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
                <MoneyInput value={draft.unitPrice ?? 0} onChange={v => setDraft({ ...draft, unitPrice: v })} className={cx(inputCls, 'pl-7')} />
              </div>
            </Field>
            <Field label={`Aylık Miktar (${draft.unit ?? 'ton'})`}>
              <input type="number" value={draft.monthlyQty ?? 0} min={0}
                onChange={e => setDraft({ ...draft, monthlyQty: Number(e.target.value) })} className={inputCls} />
            </Field>
          </div>
          {(draft.unitPrice ?? 0) > 0 && (draft.monthlyQty ?? 0) > 0 && (
            <div className="text-[12px] text-enba-muted bg-enba-orange/8 border border-enba-orange/20 rounded-lg px-3 py-2">
              Aylık maliyet: <span className="font-semibold text-enba-text">{fmtTL((draft.unitPrice ?? 0) * (draft.monthlyQty ?? 0))}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Büyüme %/yıl">
              <div className="flex items-center gap-1">
                <input type="number" value={Math.round(draft.growth * 100)} min={-20} max={200} step={1}
                  onChange={e => setDraft({ ...draft, growth: Number(e.target.value) / 100 })} className={cx(inputCls, 'flex-1')} />
                <span className="text-enba-dim text-[13px]">%</span>
              </div>
            </Field>
            <Field label="Başlangıç Ayı">
              <select value={draft.startOffset ?? 0} onChange={e => setDraft({ ...draft, startOffset: Number(e.target.value) })} className={selectCls}>
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i === 0 ? '1. ay' : `${i + 1}. ay`}</option>)}
              </select>
            </Field>
          </div>
          <FormFooter onCancel={cancel} onSave={save} editId={editId} disabled={!draft.name.trim()} />
        </div>
      ) : (
        <AddRow onClick={startAdd} label="Hammadde / malzeme ekle" />
      )}
      {items.length > 0 && <TotalRow total={totalMonthly} />}
    </div>
  );
}

/* ── 2. Üretim Maliyetleri (elektrik, yakıt, su, bakım...) ── */
function UretimList({ all, setAll }: { all: FixedExpense[]; setAll: (v: FixedExpense[]) => void }) {
  const items    = all.filter(e => e.costCategory === 'production');
  const setItems = (updated: FixedExpense[]) => setAll([...all.filter(e => e.costCategory !== 'production'), ...updated]);

  const empty = (): FixedExpense => ({
    id: crypto.randomUUID(), mcode: 'M405', costCategory: 'production',
    name: '', group: 'Yarı Değişken', monthly: 0, growth: 0.15,
    startOffset: 0, unit: 'kWh', unitPrice: 0, monthlyQty: 0,
  });

  const [adding, setAdding] = useState(false);
  const [draft,  setDraft]  = useState<FixedExpense>(empty());
  const [editId, setEditId] = useState<string | null>(null);

  const isBirimBazli = draft.mcode in URETIM_BIRIM;
  const birim = URETIM_BIRIM[draft.mcode];

  const startAdd  = () => { setDraft(empty()); setEditId(null); setAdding(true); };
  const startEdit = (item: FixedExpense) => { setDraft({ ...item }); setEditId(item.id); setAdding(true); };
  const cancel    = () => { setAdding(false); setEditId(null); };

  const handleMcodeChange = (v: string) => {
    const unit = URETIM_BIRIM[v] ?? '';
    setDraft({ ...draft, mcode: v, unit, unitPrice: isBirimBazli ? draft.unitPrice : 0, monthlyQty: isBirimBazli ? draft.monthlyQty : 0 });
  };

  const save = () => {
    if (!draft.name.trim()) return;
    const monthly = isBirimBazli
      ? (draft.unitPrice ?? 0) * (draft.monthlyQty ?? 0)
      : draft.monthly;
    const item = { ...draft, monthly };
    if (editId) setItems(items.map(i => i.id === editId ? item : i));
    else        setItems([...items, { ...item, id: crypto.randomUUID() }]);
    setAdding(false); setEditId(null);
  };
  const totalMonthly = items.reduce((s, e) => s + e.monthly, 0);

  return (
    <div className="space-y-3">
      <p className="text-[11.5px] text-enba-dim">Enerji, bakım, dışarıdan alınan üretim hizmetleri. Elektrik/yakıt/su için birim tüketim girebilirsiniz.</p>
      {items.map(item => (
        <ExpenseRow key={item.id} item={item} onEdit={() => startEdit(item)} onDelete={() => setItems(items.filter(i => i.id !== item.id))} />
      ))}
      {adding ? (
        <div className="bg-enba-panel border border-enba-line rounded-xl p-4 space-y-3">
          <MCodeSelect value={draft.mcode} onChange={handleMcodeChange} mcodes={MCODES_URETIM} label="Hesap Kodu" />
          <Field label="Gider Adı">
            <input autoFocus value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
              placeholder={isBirimBazli ? `örn. ${draft.mcode === 'M405' ? 'Üretim Elektriği' : draft.mcode === 'M410' ? 'Isıtma Mazotu' : 'Proses Suyu'}` : 'örn. Ekipman Bakım Sözleşmesi'}
              className={inputCls} />
          </Field>
          {isBirimBazli ? (
            <div className="grid grid-cols-3 gap-3">
              <Field label={`Birim Fiyat (₺/${birim})`}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
                  <MoneyInput value={draft.unitPrice ?? 0} onChange={v => setDraft({ ...draft, unitPrice: v })} className={cx(inputCls, 'pl-7')} />
                </div>
              </Field>
              <Field label={`Aylık Tüketim (${birim})`}>
                <input type="number" value={draft.monthlyQty ?? 0} min={0}
                  onChange={e => setDraft({ ...draft, monthlyQty: Number(e.target.value) })} className={inputCls} />
              </Field>
              <Field label="Büyüme %/yıl">
                <div className="flex items-center gap-1">
                  <input type="number" value={Math.round(draft.growth * 100)} min={-20} max={200} step={1}
                    onChange={e => setDraft({ ...draft, growth: Number(e.target.value) / 100 })} className={cx(inputCls, 'flex-1')} />
                  <span className="text-enba-dim text-[13px]">%</span>
                </div>
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Aylık Tutar (₺)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
                  <MoneyInput value={draft.monthly} onChange={v => setDraft({ ...draft, monthly: v })} className={cx(inputCls, 'pl-7')} />
                </div>
              </Field>
              <Field label="Büyüme %/yıl">
                <div className="flex items-center gap-1">
                  <input type="number" value={Math.round(draft.growth * 100)} min={-20} max={200} step={1}
                    onChange={e => setDraft({ ...draft, growth: Number(e.target.value) / 100 })} className={cx(inputCls, 'flex-1')} />
                  <span className="text-enba-dim text-[13px]">%</span>
                </div>
              </Field>
            </div>
          )}
          {isBirimBazli && (draft.unitPrice ?? 0) > 0 && (draft.monthlyQty ?? 0) > 0 && (
            <div className="text-[12px] text-enba-muted bg-enba-orange/8 border border-enba-orange/20 rounded-lg px-3 py-2">
              Aylık maliyet: <span className="font-semibold text-enba-text">{fmtTL((draft.unitPrice ?? 0) * (draft.monthlyQty ?? 0))}</span>
            </div>
          )}
          <Field label="Başlangıç Ayı">
            <select value={draft.startOffset ?? 0} onChange={e => setDraft({ ...draft, startOffset: Number(e.target.value) })} className={selectCls}>
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i === 0 ? '1. ay' : `${i + 1}. ay`}</option>)}
            </select>
          </Field>
          <FormFooter onCancel={cancel} onSave={save} editId={editId} disabled={!draft.name.trim()} />
        </div>
      ) : (
        <AddRow onClick={startAdd} label="Üretim gideri ekle" />
      )}
      {items.length > 0 && <TotalRow total={totalMonthly} />}
    </div>
  );
}

/* ── 3. Personel Maliyetleri ── */
function PersonelList({ all, setAll }: { all: FixedExpense[]; setAll: (v: FixedExpense[]) => void }) {
  const items    = all.filter(e => e.costCategory === 'personnel');
  const setItems = (updated: FixedExpense[]) => setAll([...all.filter(e => e.costCategory !== 'personnel'), ...updated]);

  const empty = (): FixedExpense => ({
    id: crypto.randomUUID(), mcode: 'M489', costCategory: 'personnel',
    name: '', group: 'Sabit', monthly: 0, growth: 0.20,
    startOffset: 0, unit: 'kişi', unitPrice: 0, monthlyQty: 1,
  });

  const [adding, setAdding] = useState(false);
  const [draft,  setDraft]  = useState<FixedExpense>(empty());
  const [editId, setEditId] = useState<string | null>(null);

  const isKisiBazli = PERSONEL_KISI_BAZLI.has(draft.mcode);
  const startAdd  = () => { setDraft(empty()); setEditId(null); setAdding(true); };
  const startEdit = (item: FixedExpense) => { setDraft({ ...item }); setEditId(item.id); setAdding(true); };
  const cancel    = () => { setAdding(false); setEditId(null); };

  const save = () => {
    if (!draft.name.trim()) return;
    const monthly = isKisiBazli
      ? (draft.unitPrice ?? 0) * (draft.monthlyQty ?? 1)
      : draft.monthly;
    const item = { ...draft, monthly };
    if (editId) setItems(items.map(i => i.id === editId ? item : i));
    else        setItems([...items, { ...item, id: crypto.randomUUID() }]);
    setAdding(false); setEditId(null);
  };
  const totalMonthly = items.reduce((s, e) => s + e.monthly, 0);
  const totalKisi    = items.filter(e => PERSONEL_KISI_BAZLI.has(e.mcode) && e.mcode === 'M489').reduce((s, e) => s + (e.monthlyQty ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <p className="text-[11.5px] text-enba-dim flex-1">Pozisyon, çalışan sayısı ve birim ücret tanımlayın.</p>
        {totalKisi > 0 && <span className="text-[11px] text-enba-muted bg-enba-panel-2 px-2 py-1 rounded">{totalKisi} çalışan</span>}
      </div>
      {items.map(item => (
        <ExpenseRow key={item.id} item={item} onEdit={() => startEdit(item)} onDelete={() => setItems(items.filter(i => i.id !== item.id))} />
      ))}
      {adding ? (
        <div className="bg-enba-panel border border-enba-line rounded-xl p-4 space-y-3">
          <MCodeSelect value={draft.mcode} onChange={v => setDraft({ ...draft, mcode: v })} mcodes={MCODES_PERSONEL} label="Gider Türü" />
          <Field label={isKisiBazli ? 'Pozisyon Adı' : 'Gider Adı'}>
            <input autoFocus value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
              placeholder={draft.mcode === 'M489' ? 'örn. Üretim Operatörü' : draft.mcode === 'M489.01' ? 'örn. SGK Payı' : draft.mcode === 'M489.03' ? 'örn. Yemek Hizmeti' : draft.mcode === 'M489.04' ? 'örn. Servis Taşımacılığı' : 'örn. Tahsis Personel'}
              className={inputCls} />
          </Field>
          {isKisiBazli ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kişi Sayısı">
                <input type="number" value={draft.monthlyQty ?? 1} min={1} step={1}
                  onChange={e => setDraft({ ...draft, monthlyQty: Number(e.target.value) })} className={inputCls} />
              </Field>
              <Field label={`Kişi Başı Aylık Tutar (₺)`}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
                  <MoneyInput value={draft.unitPrice ?? 0} onChange={v => setDraft({ ...draft, unitPrice: v })} className={cx(inputCls, 'pl-7')} />
                </div>
              </Field>
            </div>
          ) : (
            <Field label="Aylık Tutar (₺)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
                <MoneyInput value={draft.monthly} onChange={v => setDraft({ ...draft, monthly: v })} className={cx(inputCls, 'pl-7')} />
              </div>
            </Field>
          )}
          {isKisiBazli && (draft.unitPrice ?? 0) > 0 && (draft.monthlyQty ?? 0) > 0 && (
            <div className="text-[12px] text-enba-muted bg-enba-orange/8 border border-enba-orange/20 rounded-lg px-3 py-2 flex items-center justify-between">
              <span>{draft.monthlyQty} kişi × {fmtTL(draft.unitPrice)}</span>
              <span className="font-semibold text-enba-text">{fmtTL((draft.unitPrice ?? 0) * (draft.monthlyQty ?? 1))}/ay</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Büyüme %/yıl">
              <div className="flex items-center gap-1">
                <input type="number" value={Math.round(draft.growth * 100)} min={-20} max={200} step={1}
                  onChange={e => setDraft({ ...draft, growth: Number(e.target.value) / 100 })} className={cx(inputCls, 'flex-1')} />
                <span className="text-enba-dim text-[13px]">%</span>
              </div>
            </Field>
            <Field label="Başlangıç Ayı">
              <select value={draft.startOffset ?? 0} onChange={e => setDraft({ ...draft, startOffset: Number(e.target.value) })} className={selectCls}>
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i === 0 ? '1. ay' : `${i + 1}. ay`}</option>)}
              </select>
            </Field>
          </div>
          <FormFooter onCancel={cancel} onSave={save} editId={editId} disabled={!draft.name.trim()} />
        </div>
      ) : (
        <AddRow onClick={startAdd} label="Personel kalemi ekle" />
      )}
      {items.length > 0 && <TotalRow total={totalMonthly} />}
    </div>
  );
}

/* ── 4. Satış / Pazarlama Maliyetleri ── */
function SatisList({ all, setAll }: { all: FixedExpense[]; setAll: (v: FixedExpense[]) => void }) {
  const items    = all.filter(e => e.costCategory === 'sales');
  const setItems = (updated: FixedExpense[]) => setAll([...all.filter(e => e.costCategory !== 'sales'), ...updated]);

  const empty = (): FixedExpense => ({
    id: crypto.randomUUID(), mcode: 'M630', costCategory: 'sales',
    name: '', group: 'Yarı Değişken', monthly: 0, growth: 0.10, startOffset: 0,
  });

  const [adding, setAdding] = useState(false);
  const [draft,  setDraft]  = useState<FixedExpense>(empty());
  const [editId, setEditId] = useState<string | null>(null);

  const startAdd  = () => { setDraft(empty()); setEditId(null); setAdding(true); };
  const startEdit = (item: FixedExpense) => { setDraft({ ...item }); setEditId(item.id); setAdding(true); };
  const cancel    = () => { setAdding(false); setEditId(null); };
  const save = () => {
    if (!draft.name.trim()) return;
    if (editId) setItems(items.map(i => i.id === editId ? draft : i));
    else        setItems([...items, { ...draft, id: crypto.randomUUID() }]);
    setAdding(false); setEditId(null);
  };
  const totalMonthly = items.reduce((s, e) => s + e.monthly, 0);

  return (
    <div className="space-y-3">
      <p className="text-[11.5px] text-enba-dim">Reklam, pazarlama, lojistik, komisyon gibi satışa özgü giderler.</p>
      {items.map(item => (
        <ExpenseRow key={item.id} item={item} onEdit={() => startEdit(item)} onDelete={() => setItems(items.filter(i => i.id !== item.id))} />
      ))}
      {adding ? (
        <div className="bg-enba-panel border border-enba-line rounded-xl p-4 space-y-3">
          <MCodeSelect value={draft.mcode} onChange={v => setDraft({ ...draft, mcode: v })} mcodes={MCODES_SATIS} label="Hesap Kodu" />
          <Field label="Gider Adı">
            <input autoFocus value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
              placeholder="örn. Dijital Pazarlama" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Aylık Tutar (₺)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
                <MoneyInput value={draft.monthly} onChange={v => setDraft({ ...draft, monthly: v })} className={cx(inputCls, 'pl-7')} />
              </div>
            </Field>
            <Field label="Büyüme %/yıl">
              <div className="flex items-center gap-1">
                <input type="number" value={Math.round(draft.growth * 100)} min={-20} max={200} step={1}
                  onChange={e => setDraft({ ...draft, growth: Number(e.target.value) / 100 })} className={cx(inputCls, 'flex-1')} />
                <span className="text-enba-dim text-[13px]">%</span>
              </div>
            </Field>
          </div>
          <FormFooter onCancel={cancel} onSave={save} editId={editId} disabled={!draft.name.trim()} />
        </div>
      ) : (
        <AddRow onClick={startAdd} label="Satış gideri ekle" />
      )}
      {items.length > 0 && <TotalRow total={totalMonthly} />}
    </div>
  );
}

/* ── Shared mini helpers ── */
function FormFooter({ onCancel, onSave, editId, disabled }: { onCancel: () => void; onSave: () => void; editId: string | null; disabled: boolean }) {
  return (
    <div className="flex gap-2 pt-1 border-t border-enba-line">
      <button onClick={onCancel} className="h-8 px-4 rounded-lg border border-enba-line text-[12px] text-enba-muted hover:bg-enba-panel-2">İptal</button>
      <Btn variant="primary" size="sm" onClick={onSave} disabled={disabled}>{editId ? 'Güncelle' : 'Ekle'}</Btn>
    </div>
  );
}
function AddRow({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="w-full border-2 border-dashed border-enba-line rounded-lg h-9 flex items-center justify-center gap-2 text-[12px] text-enba-dim hover:border-enba-orange/40 hover:text-enba-muted transition-colors">
      <I.Plus size={13} /> {label}
    </button>
  );
}
function TotalRow({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-between text-[12px] px-1">
      <span className="text-enba-dim">Toplam</span>
      <span className="font-semibold text-enba-text">{fmtTL(total)}/ay</span>
    </div>
  );
}

/* ── Proje Gelir Listesi ── */
function ProjectRevenueList({ items, setItems, projectIdx, customers = [] }: { items: Product[]; setItems: (v: Product[]) => void; projectIdx: number; customers?: Customer[] }) {
  const [adding, setAdding] = useState(false);
  const [draft,  setDraft]  = useState<Product>(emptyRevenue(projectIdx));
  const [editId, setEditId] = useState<string | null>(null);

  const startAdd  = () => { setDraft(emptyRevenue(projectIdx)); setEditId(null); setAdding(true); };
  const startEdit = (item: Product) => { setDraft({ ...item }); setEditId(item.id); setAdding(true); };
  const cancel    = () => { setAdding(false); setEditId(null); };

  const saveFixed = () => {
    if (!draft.name.trim()) return;
    if (editId) setItems(items.map(i => i.id === editId ? draft : i));
    else        setItems([...items, { ...draft, id: crypto.randomUUID() }]);
    setAdding(false); setEditId(null);
  };

  return (
    <div className="space-y-3">
      {items.map(item => {
        const cust = customers.find(c => c.id === item.customerId);
        return (
          <div key={item.id} className="bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2.5 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: item.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-enba-text">{item.name}</div>
              <div className="text-[10.5px] text-enba-dim">
                {fmtTL(item.price)}/{item.unit} · {item.volume.toLocaleString('tr-TR')} {item.unit}/ay
                {cust && <span className="ml-1.5 text-enba-blue">· {cust.name}</span>}
              </div>
            </div>
            <span className="text-[12.5px] font-semibold tabular text-enba-orange">{fmtTL(item.price * item.volume)}/ay</span>
            <button onClick={() => startEdit(item)} className="w-6 h-6 rounded text-enba-dim hover:text-enba-text hover:bg-enba-panel inline-flex items-center justify-center"><I.Edit size={12} /></button>
            <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="w-6 h-6 rounded text-enba-dim hover:text-enba-red inline-flex items-center justify-center"><I.Trash size={12} /></button>
          </div>
        );
      })}

      {adding ? (
        <div className="bg-enba-panel border border-enba-line rounded-xl p-4 space-y-3">
          {customers.length > 0 && (
            <Field label="Müşteri">
              <select
                value={draft.customerId ?? ''}
                onChange={e => setDraft({ ...draft, customerId: e.target.value || undefined })}
                className={selectCls}
              >
                <option value="">— atanmamış —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.sector ? ` · ${c.sector}` : ''}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Ürün / Hizmet Adı">
            <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
              placeholder="örn. PET Granül" className={inputCls} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Birim">
              <select value={draft.unit} onChange={e => setDraft({ ...draft, unit: e.target.value })} className={selectCls}>
                {UNITS_PRODUCT.map(u => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label={`Satış Fiyatı (₺/${draft.unit})`}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
                <MoneyInput value={draft.price} onChange={v => setDraft({ ...draft, price: v })} className={cx(inputCls, 'pl-7')} />
              </div>
            </Field>
            <Field label={`Aylık Hacim (${draft.unit})`}>
              <input type="number" value={draft.volume} min={0}
                onChange={e => setDraft({ ...draft, volume: Number(e.target.value) })} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fiyat Büyümesi %/yıl">
              <div className="flex items-center gap-1">
                <input type="number" value={Math.round(draft.priceGrowth * 100)} min={-50} max={200} step={1}
                  onChange={e => setDraft({ ...draft, priceGrowth: Number(e.target.value) / 100 })} className={cx(inputCls, 'flex-1')} />
                <span className="text-enba-dim text-[13px]">%</span>
              </div>
            </Field>
            <Field label="Hacim Büyümesi %/yıl">
              <div className="flex items-center gap-1">
                <input type="number" value={Math.round(draft.volumeGrowth * 100)} min={-50} max={200} step={1}
                  onChange={e => setDraft({ ...draft, volumeGrowth: Number(e.target.value) / 100 })} className={cx(inputCls, 'flex-1')} />
                <span className="text-enba-dim text-[13px]">%</span>
              </div>
            </Field>
          </div>
          <div className="flex gap-2 pt-1 border-t border-enba-line">
            <button onClick={cancel} className="h-8 px-4 rounded-lg border border-enba-line text-[12px] text-enba-muted hover:bg-enba-panel-2">İptal</button>
            <Btn variant="primary" size="sm" onClick={saveFixed} disabled={!draft.name.trim()}>{editId ? 'Güncelle' : 'Ekle'}</Btn>
          </div>
        </div>
      ) : (
        <button onClick={startAdd}
          className="w-full border-2 border-dashed border-enba-line rounded-lg h-9 flex items-center justify-center gap-2 text-[12px] text-enba-dim hover:border-enba-orange/40 hover:text-enba-muted transition-colors">
          <I.Plus size={13} /> Gelir Kalemi Ekle
        </button>
      )}
    </div>
  );
}

/* ── Proje Düzenleyici ── */
type ProjectTab = 'temel' | 'alim' | 'uretim' | 'personel' | 'satis' | 'gelirler';

function ProjectEditor({ project, idx, horizon, costCenters, suppliers = [], customers = [], onSave, onCancel }:
  { project: ActiveProject; idx: number; horizon: number; costCenters: CostCenter[]; suppliers?: Supplier[]; customers?: Customer[]; onSave: (p: ActiveProject) => void; onCancel: () => void }) {
  const [tab,   setTab]   = useState<ProjectTab>('temel');
  const [draft, setDraft] = useState<ActiveProject>({ ...project });

  const revenueTotal = draft.revenues.reduce((s, r) => s + r.price * r.volume, 0);
  const selectedCC   = costCenters.find(cc => cc.id === draft.costCenterId);
  const ccTotal      = selectedCC?.fixedExpenses.reduce((s, e) => s + e.monthly, 0) ?? 0;

  const countOf = (cat: FixedExpense['costCategory']) => draft.expenses.filter(e => e.costCategory === cat).length;

  const TABS: { id: ProjectTab; label: string; count?: number }[] = [
    { id: 'temel',    label: 'Temel' },
    { id: 'alim',     label: 'Alım',     count: countOf('purchase') },
    { id: 'uretim',   label: 'Üretim',   count: countOf('production') },
    { id: 'personel', label: 'Personel', count: countOf('personnel') },
    { id: 'satis',    label: 'Satış',    count: countOf('sales') },
    { id: 'gelirler', label: 'Gelirler', count: draft.revenues.length },
  ];

  return (
    <div className="bg-enba-panel border border-enba-line rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-enba-line" style={{ borderLeftColor: draft.color, borderLeftWidth: 4 }}>
        <span className="w-3 h-3 rounded-full flex-none" style={{ background: draft.color }} />
        <span className="text-[13px] font-semibold flex-1">{draft.name || 'Yeni Proje'}</span>
        <button onClick={onCancel} className="w-7 h-7 rounded-md text-enba-dim hover:bg-enba-panel-2 inline-flex items-center justify-center"><I.Chevron size={13} className="rotate-180" /></button>
      </div>

      <div className="flex border-b border-enba-line bg-enba-panel-2/40 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cx(
              'flex-none px-3 h-9 text-[12px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5',
              tab === t.id ? 'text-enba-orange border-b-2 border-enba-orange bg-enba-orange/5' : 'text-enba-muted hover:text-enba-text',
            )}>
            {t.label}
            {(t.count ?? 0) > 0 && (
              <span className={cx('text-[10px] px-1.5 py-0.5 rounded-full', tab === t.id ? 'bg-enba-orange/20 text-enba-orange' : 'bg-enba-panel-2 text-enba-dim')}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {tab === 'temel' && (
          <>
            {/* Aktif toggle */}
            <div
              className={cx(
                'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors cursor-pointer select-none',
                draft.isActive ? 'bg-enba-green/8 border-enba-green/30' : 'bg-enba-panel-2 border-enba-line',
              )}
              onClick={() => setDraft({ ...draft, isActive: !draft.isActive })}
            >
              <div className={cx('w-9 h-5 rounded-full flex items-center transition-all relative flex-none', draft.isActive ? 'bg-enba-green' : 'bg-enba-dim/40')}>
                <div className={cx('w-4 h-4 rounded-full bg-white shadow absolute transition-all', draft.isActive ? 'left-[18px]' : 'left-[2px]')} />
              </div>
              <div>
                <div className={cx('text-[13px] font-semibold', draft.isActive ? 'text-enba-green' : 'text-enba-dim')}>
                  {draft.isActive ? 'Aktif — Gider merkezi maliyeti alıyor' : 'Pasif — Maliyet almıyor'}
                </div>
                <div className="text-[11px] text-enba-dim mt-0.5">Pasif projeler sabit gider payına girmez</div>
              </div>
            </div>

            <Field label="Proje Adı">
              <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
                placeholder="örn. PET Geri Dönüşüm Hattı" className={inputCls} />
            </Field>
            <Field label="Renk">
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map(c => (
                  <button key={c} onClick={() => setDraft({ ...draft, color: c })}
                    className={cx('w-7 h-7 rounded-full border-2 transition-all', draft.color === c ? 'border-enba-text scale-110' : 'border-transparent')}
                    style={{ background: c }} />
                ))}
              </div>
            </Field>

            {/* Gider Merkezi seçici */}
            <Field label="Gider Merkezi" hint="Bu projenin sabit maliyetlerini hangi tesis karşılıyor?">
              {costCenters.length === 0 ? (
                <div className="bg-enba-amber/8 border border-enba-amber/30 rounded-lg px-3 py-2.5 text-[12px] text-enba-amber">
                  Henüz gider merkezi yok — ana ekrandan önce bir tesis oluşturun.
                </div>
              ) : (
                <div className="space-y-2">
                  {costCenters.map(cc => {
                    const ccMon = cc.fixedExpenses.reduce((s, e) => s + e.monthly, 0);
                    return (
                      <div
                        key={cc.id}
                        onClick={() => setDraft({ ...draft, costCenterId: cc.id })}
                        className={cx(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors',
                          draft.costCenterId === cc.id
                            ? 'border-enba-orange bg-enba-orange/8'
                            : 'border-enba-line hover:border-enba-orange/40',
                        )}
                      >
                        <div className={cx('w-4 h-4 rounded-full border-2 flex-none flex items-center justify-center',
                          draft.costCenterId === cc.id ? 'border-enba-orange' : 'border-enba-dim')}>
                          {draft.costCenterId === cc.id && <div className="w-2 h-2 rounded-full bg-enba-orange" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-[13px] font-semibold text-enba-text">{cc.name}</div>
                          <div className="text-[11px] text-enba-dim">{cc.fixedExpenses.length} gider · {fmtTL(ccMon)}/ay</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Field>

            {selectedCC && ccTotal > 0 && (
              <Field label="Dağılım Ağırlığı" hint="Göreceli sayı — aynı gider merkezinin aktif projeleriyle paylaşılır. (2 ve 1 → %67/%33)">
                <input type="number" value={draft.allocationWeight} min={0.1} step={0.1}
                  onChange={e => setDraft({ ...draft, allocationWeight: Number(e.target.value) })}
                  className={inputCls} />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Başlangıç Ayı">
                <select value={draft.startOffset} onChange={e => setDraft({ ...draft, startOffset: Number(e.target.value) })} className={selectCls}>
                  {Array.from({ length: horizon }, (_, i) => <option key={i} value={i}>{i === 0 ? '1. ay (hemen)' : `${i + 1}. ay`}</option>)}
                </select>
              </Field>
              <Field label="Bitiş Ayı">
                <select value={draft.endOffset ?? ''} onChange={e => setDraft({ ...draft, endOffset: e.target.value === '' ? undefined : Number(e.target.value) })} className={selectCls}>
                  <option value="">Plana kadar (süresiz)</option>
                  {Array.from({ length: horizon }, (_, i) => <option key={i+1} value={i+1}>{i + 1}. ay sonu</option>)}
                </select>
              </Field>
            </div>
          </>
        )}
        {tab === 'alim' && (
          <AlimList all={draft.expenses} setAll={v => setDraft({ ...draft, expenses: v })} suppliers={suppliers} />
        )}
        {tab === 'uretim' && (
          <UretimList all={draft.expenses} setAll={v => setDraft({ ...draft, expenses: v })} />
        )}
        {tab === 'personel' && (
          <PersonelList all={draft.expenses} setAll={v => setDraft({ ...draft, expenses: v })} />
        )}
        {tab === 'satis' && (
          <SatisList all={draft.expenses} setAll={v => setDraft({ ...draft, expenses: v })} />
        )}
        {tab === 'gelirler' && (
          <>
            <p className="text-[11.5px] text-enba-dim">Bu projenin üretip sattığı ürün ve hizmetler.</p>
            <ProjectRevenueList items={draft.revenues} setItems={v => setDraft({ ...draft, revenues: v })} projectIdx={idx} customers={customers} />
            {revenueTotal > 0 && (
              <div className="text-right text-[12px] text-enba-dim">Brüt gelir: <span className="font-semibold text-enba-orange">{fmtTL(revenueTotal)}/ay</span></div>
            )}
          </>
        )}
      </div>

      <div className="px-4 pb-4">
        <Btn variant="primary" size="sm" className="w-full" onClick={() => onSave(draft)} disabled={!draft.name.trim()}>
          <I.Check size={13} className="mr-1" /> Projeyi Kaydet
        </Btn>
      </div>
    </div>
  );
}

/* ── Tedarikçi Havuzu (plan içi) ── */
const SUPPLIER_UNITS_WIZ = ['ton', 'kg', 'lt', 'm³', 'adet', 'kWh', 'm²', 'm'];

const PAYMENT_OPTS_WIZ = ['peşin', '7 gün', '15 gün', '30 gün', '45 gün', '60 gün', '90 gün', 'kısmi'];
const DEFERRED_DAYS    = [7, 15, 30, 45, 60, 90];

function SupplierFormRow({ draft, setDraft, onSave, onCancel }: {
  draft: Supplier; setDraft: (s: Supplier) => void; onSave: () => void; onCancel: () => void;
}) {
  const isPartial = draft.paymentTerms === 'kısmi';
  return (
    <div className="bg-enba-panel border border-enba-orange/30 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tedarikçi / Şirket Adı">
          <input autoFocus value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
            placeholder="örn. Polimer Atık A.Ş." className={inputCls} />
        </Field>
        <Field label="Tedarik Edilen Malzeme">
          <input value={draft.material} onChange={e => setDraft({ ...draft, material: e.target.value })}
            placeholder="örn. PET Şişe Atık" className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Birim">
          <select value={draft.unit} onChange={e => setDraft({ ...draft, unit: e.target.value })} className={selectCls}>
            {SUPPLIER_UNITS_WIZ.map(u => <option key={u}>{u}</option>)}
          </select>
        </Field>
        <Field label={`Alış Fiyatı (₺/${draft.unit})`}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
            <MoneyInput value={draft.unitPrice} onChange={v => setDraft({ ...draft, unitPrice: v })} className={cx(inputCls, 'pl-7')} />
          </div>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Alış Nakliyesi (₺/kg)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
            <MoneyInput value={draft.shippingCost ?? 0} onChange={v => setDraft({ ...draft, shippingCost: v || undefined })} className={cx(inputCls, 'pl-7')} />
          </div>
        </Field>
        <Field label="Ödeme Vadesi">
          <select value={draft.paymentTerms ?? ''} onChange={e => setDraft({ ...draft, paymentTerms: e.target.value || undefined, prepayRatio: undefined, deferredDays: undefined })} className={selectCls}>
            <option value="">— belirtilmemiş —</option>
            {PAYMENT_OPTS_WIZ.map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
      </div>
      {isPartial && (
        <div className="grid grid-cols-2 gap-3 pl-0">
          <Field label="Peşin Oran (%)">
            <div className="relative">
              <input type="number" min={0} max={100} step={5}
                value={draft.prepayRatio ?? 50}
                onChange={e => setDraft({ ...draft, prepayRatio: Math.min(100, Math.max(0, Number(e.target.value))) })}
                className={cx(inputCls, 'pr-7')} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">%</span>
            </div>
          </Field>
          <Field label="Vadeli Kısım">
            <select value={draft.deferredDays ?? 30} onChange={e => setDraft({ ...draft, deferredDays: Number(e.target.value) })} className={selectCls}>
              {DEFERRED_DAYS.map(d => <option key={d} value={d}>{d} gün</option>)}
            </select>
          </Field>
        </div>
      )}
      <FormFooter onCancel={onCancel} onSave={onSave} editId={null} disabled={!draft.name.trim()} />
    </div>
  );
}

function SupplierList({ suppliers, setSuppliers }: { suppliers: Supplier[]; setSuppliers: (v: Supplier[]) => void }) {
  const emptyDraft = (): Supplier => ({ id: crypto.randomUUID(), name: '', material: '', unit: 'ton', unitPrice: 0 });
  const [adding,  setAdding]  = useState(false);
  const [editId,  setEditId]  = useState<string | null>(null);
  const [draft,   setDraft]   = useState<Supplier>(emptyDraft());

  const startAdd  = () => { setDraft(emptyDraft()); setEditId(null); setAdding(true); };
  const startEdit = (s: Supplier) => { setDraft({ ...s }); setEditId(s.id); setAdding(true); };
  const cancel    = () => { setAdding(false); setEditId(null); };
  const save      = () => {
    if (!draft.name.trim()) return;
    if (editId) setSuppliers(suppliers.map(s => s.id === editId ? draft : s));
    else        setSuppliers([...suppliers, { ...draft, id: crypto.randomUUID() }]);
    setAdding(false); setEditId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-enba-text">Tedarikçi Havuzu</h2>
          <p className="text-[11.5px] text-enba-dim mt-0.5">Bu plana ait hammadde tedarikçileri — alım kalemi girerken hızlı seçim sağlar.</p>
        </div>
        {!adding && (
          <Btn variant="outline" size="sm" icon={<I.Plus size={13} />} onClick={startAdd}>Ekle</Btn>
        )}
      </div>

      {suppliers.map(s => (
        editId === s.id && adding ? (
          <SupplierFormRow key={s.id} draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
        ) : (
          <div key={s.id} className="bg-enba-panel border border-enba-line rounded-xl px-4 py-3 flex items-center gap-3 group">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-enba-text truncate">{s.name}</div>
              <div className="text-[11px] text-enba-muted">
                {s.material} · {fmtTL(s.unitPrice)}/{s.unit}
                {s.shippingCost ? ` · nakliye ${fmtTL(s.shippingCost, { compact: true })}/kg` : ''}
                {s.paymentTerms ? ` · ${s.paymentTerms === 'kısmi' && s.prepayRatio != null ? `%${s.prepayRatio} peşin + ${s.deferredDays ?? 30} gün` : s.paymentTerms}` : ''}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(s)} className="w-7 h-7 rounded text-enba-dim hover:text-enba-orange inline-flex items-center justify-center">
                <I.Edit size={13} />
              </button>
              <button onClick={() => setSuppliers(suppliers.filter(x => x.id !== s.id))} className="w-7 h-7 rounded text-enba-dim hover:text-enba-red inline-flex items-center justify-center">
                <I.Trash size={13} />
              </button>
            </div>
          </div>
        )
      ))}

      {adding && !editId && (
        <SupplierFormRow draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
      )}

      {suppliers.length === 0 && !adding && (
        <div
          onClick={startAdd}
          className="border-2 border-dashed border-enba-line rounded-xl p-5 flex items-center gap-3 cursor-pointer hover:border-enba-orange/40 hover:bg-enba-orange/5 transition-colors"
        >
          <I.Plus size={16} className="text-enba-dim flex-none" />
          <span className="text-[12.5px] text-enba-dim">Tedarikçi ekle (isteğe bağlı)</span>
        </div>
      )}
    </div>
  );
}

/* ── Müşteri Havuzu (plan içi) ── */
function CustomerFormRow({ draft, setDraft, onSave, onCancel }: {
  draft: Customer; setDraft: (c: Customer) => void; onSave: () => void; onCancel: () => void;
}) {
  const isPartial = draft.paymentTerms === 'kısmi';
  return (
    <div className="bg-enba-panel border border-enba-orange/30 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Müşteri / Şirket Adı">
          <input autoFocus value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
            placeholder="örn. EcoGreen Ltd." className={inputCls} />
        </Field>
        <Field label="Sektör (isteğe bağlı)">
          <input value={draft.sector ?? ''} onChange={e => setDraft({ ...draft, sector: e.target.value || undefined })}
            placeholder="örn. Plastik, Tekstil" className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Birim">
          <select value={draft.unit ?? 'kg'} onChange={e => setDraft({ ...draft, unit: e.target.value })} className={selectCls}>
            {SUPPLIER_UNITS_WIZ.map(u => <option key={u}>{u}</option>)}
          </select>
        </Field>
        <Field label={`Satış Fiyatı (₺/${draft.unit ?? 'kg'})`}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
            <MoneyInput value={draft.salesPrice ?? 0} onChange={v => setDraft({ ...draft, salesPrice: v || undefined })} className={cx(inputCls, 'pl-7')} />
          </div>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Satış Nakliyesi (₺/kg)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
            <MoneyInput value={draft.shippingCost ?? 0} onChange={v => setDraft({ ...draft, shippingCost: v || undefined })} className={cx(inputCls, 'pl-7')} />
          </div>
        </Field>
        <Field label="Ödeme Vadesi">
          <select value={draft.paymentTerms ?? ''} onChange={e => setDraft({ ...draft, paymentTerms: e.target.value || undefined, prepayRatio: undefined, deferredDays: undefined })} className={selectCls}>
            <option value="">— belirtilmemiş —</option>
            {PAYMENT_OPTS_WIZ.map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
      </div>
      {isPartial && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peşin Oran (%)">
            <div className="relative">
              <input type="number" min={0} max={100} step={5}
                value={draft.prepayRatio ?? 50}
                onChange={e => setDraft({ ...draft, prepayRatio: Math.min(100, Math.max(0, Number(e.target.value))) })}
                className={cx(inputCls, 'pr-7')} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">%</span>
            </div>
          </Field>
          <Field label="Vadeli Kısım">
            <select value={draft.deferredDays ?? 30} onChange={e => setDraft({ ...draft, deferredDays: Number(e.target.value) })} className={selectCls}>
              {DEFERRED_DAYS.map(d => <option key={d} value={d}>{d} gün</option>)}
            </select>
          </Field>
        </div>
      )}
      <FormFooter onCancel={onCancel} onSave={onSave} editId={null} disabled={!draft.name.trim()} />
    </div>
  );
}

function CustomerList({ customers, setCustomers }: { customers: Customer[]; setCustomers: (v: Customer[]) => void }) {
  const emptyDraft = (): Customer => ({ id: crypto.randomUUID(), name: '' });
  const [adding, setAdding]  = useState(false);
  const [editId, setEditId]  = useState<string | null>(null);
  const [draft,  setDraft]   = useState<Customer>(emptyDraft());

  const startAdd  = () => { setDraft(emptyDraft()); setEditId(null); setAdding(true); };
  const startEdit = (c: Customer) => { setDraft({ ...c }); setEditId(c.id); setAdding(true); };
  const cancel    = () => { setAdding(false); setEditId(null); };
  const save      = () => {
    if (!draft.name.trim()) return;
    if (editId) setCustomers(customers.map(c => c.id === editId ? draft : c));
    else        setCustomers([...customers, { ...draft, id: crypto.randomUUID() }]);
    setAdding(false); setEditId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-enba-text">Müşteri Havuzu</h2>
          <p className="text-[11.5px] text-enba-dim mt-0.5">Bu plana ait müşteriler — gelir kalemlerine müşteri atayabilirsiniz.</p>
        </div>
        {!adding && (
          <Btn variant="outline" size="sm" icon={<I.Plus size={13} />} onClick={startAdd}>Ekle</Btn>
        )}
      </div>

      {customers.map(c => (
        editId === c.id && adding ? (
          <CustomerFormRow key={c.id} draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
        ) : (
          <div key={c.id} className="bg-enba-panel border border-enba-line rounded-xl px-4 py-3 flex items-center gap-3 group">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-enba-text truncate">{c.name}</div>
              <div className="text-[11px] text-enba-muted">
                {[
                  c.sector,
                  c.salesPrice ? `${fmtTL(c.salesPrice, { compact: true })}/${c.unit ?? 'kg'}` : null,
                  c.shippingCost ? `nakliye ${fmtTL(c.shippingCost, { compact: true })}/kg` : null,
                  c.paymentTerms === 'kısmi' && c.prepayRatio != null
                    ? `%${c.prepayRatio} peşin + ${c.deferredDays ?? 30} gün`
                    : c.paymentTerms,
                ].filter(Boolean).join(' · ') || 'Detay girilmemiş'}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(c)} className="w-7 h-7 rounded text-enba-dim hover:text-enba-orange inline-flex items-center justify-center">
                <I.Edit size={13} />
              </button>
              <button onClick={() => setCustomers(customers.filter(x => x.id !== c.id))} className="w-7 h-7 rounded text-enba-dim hover:text-enba-red inline-flex items-center justify-center">
                <I.Trash size={13} />
              </button>
            </div>
          </div>
        )
      ))}

      {adding && !editId && (
        <CustomerFormRow draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
      )}

      {customers.length === 0 && !adding && (
        <div
          onClick={startAdd}
          className="border-2 border-dashed border-enba-line rounded-xl p-5 flex items-center gap-3 cursor-pointer hover:border-enba-orange/40 hover:bg-enba-orange/5 transition-colors"
        >
          <I.Plus size={16} className="text-enba-dim flex-none" />
          <span className="text-[12.5px] text-enba-dim">Müşteri ekle (isteğe bağlı)</span>
        </div>
      )}
    </div>
  );
}

/* ── Step 2 — Projeler ── */
function ProjectsStep({ projects, setProjects, horizon, costCenters, suppliers = [], customers = [] }:
  { projects: ActiveProject[]; setProjects: (v: ActiveProject[]) => void; horizon: number; costCenters: CostCenter[]; suppliers?: Supplier[]; customers?: Customer[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const defaultCcId = costCenters[0]?.id ?? '';

  const toggleActive  = (id: string) => setProjects(projects.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  const saveProject   = (updated: ActiveProject) => { setProjects(projects.map(p => p.id === updated.id ? updated : p)); setEditingId(null); };
  const addProject    = () => { const np = emptyProject(projects.length, defaultCcId); setProjects([...projects, np]); setEditingId(np.id); };
  const deleteProject = (id: string) => setProjects(projects.filter(p => p.id !== id));

  // Gider merkezi bazlı dağılım özeti
  const ccBars = costCenters.map(cc => {
    const fps    = projects.filter(p => p.costCenterId === cc.id && p.isActive);
    const ccMon  = cc.fixedExpenses.reduce((s, e) => s + e.monthly, 0);
    const wTotal = fps.reduce((s, p) => s + p.allocationWeight, 0);
    return { cc, fps, ccMon, wTotal };
  }).filter(b => b.fps.length > 0 && b.ccMon > 0);

  return (
    <div className="space-y-4">
      <StepHeader step={2} total={2} title="Projeler"
        sub="Her proje kendi gelir ve giderlerini taşır. Aktif projeler bağlı olduğu gider merkezinin sabit maliyetini paylaşır." />

      {costCenters.length === 0 && (
        <div className="bg-enba-amber/8 border border-enba-amber/30 rounded-xl px-4 py-3 text-[12.5px] text-enba-amber">
          Henüz gider merkezi tanımlanmamış. Ana ekrandan önce bir tesis oluşturun, sonra buraya proje ekleyin.
        </div>
      )}

      {/* Dağılım barları */}
      {ccBars.map(({ cc, fps, ccMon, wTotal }) => (
        <div key={cc.id} className="bg-enba-panel border border-enba-line rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-enba-dim uppercase tracking-wider">{cc.name} · Sabit Gider</span>
            <span className="text-[12px] font-semibold tabular">{fmtTL(ccMon)}/ay</span>
          </div>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-enba-panel-2">
            {fps.map(p => (
              <div key={p.id} className="h-full transition-all"
                style={{ background: p.color, width: `${(p.allocationWeight / (wTotal || 1)) * 100}%` }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {fps.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                <span className="font-medium text-enba-text">{p.name || 'İsimsiz'}</span>
                <span className="text-enba-dim">%{Math.round((p.allocationWeight / (wTotal || 1)) * 100)}</span>
                <span className="text-enba-dim">· {fmtTL((p.allocationWeight / (wTotal || 1)) * ccMon)}/ay</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Proje kartları */}
      {projects.map((p, idx) => editingId === p.id ? (
        <ProjectEditor key={p.id} project={p} idx={idx} horizon={horizon} costCenters={costCenters} suppliers={suppliers} customers={customers}
          onSave={saveProject} onCancel={() => setEditingId(null)} />
      ) : (
        <div key={p.id}
          className={cx('bg-enba-panel border rounded-xl px-4 py-3 flex items-center gap-3 transition-opacity', !p.isActive && 'opacity-60')}
          style={{ borderLeftColor: p.color, borderLeftWidth: 4 }}>
          <span className="w-3 h-3 rounded-full flex-none" style={{ background: p.color }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-enba-text">{p.name || 'İsimsiz Proje'}</span>
              <span className={cx('px-1.5 py-0.5 rounded text-[10px] font-medium',
                p.isActive ? 'bg-enba-green/15 text-enba-green' : 'bg-enba-dim/15 text-enba-dim')}>
                {p.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            <div className="text-[11px] text-enba-dim mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{costCenters.find(cc => cc.id === p.costCenterId)?.name ?? '—'}</span>
              <span>·</span>
              <span>{p.startOffset + 1}. ay{p.endOffset ? ` – ${p.endOffset}. ay` : ' → son'}</span>
              {p.expenses.length > 0 && (
                <>
                  <span>·</span>
                  <span>{fmtTL(p.expenses.reduce((s, e) => s + e.monthly, 0))}/ay gider</span>
                </>
              )}
              {p.revenues.length > 0 && (
                <>
                  <span>·</span>
                  <span className="text-enba-orange">{fmtTL(p.revenues.reduce((s, r) => s + r.price * r.volume, 0))}/ay gelir</span>
                </>
              )}
            </div>
          </div>
          <button onClick={() => toggleActive(p.id)} title={p.isActive ? 'Pasife al' : 'Aktife al'}
            className={cx('w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors',
              p.isActive ? 'text-enba-green bg-enba-green/10' : 'text-enba-dim bg-enba-panel-2 hover:text-enba-green hover:bg-enba-green/10')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="4" width="14" height="8" rx="4" fill="currentColor" opacity={p.isActive ? '1' : '0.3'} />
              <circle cx={p.isActive ? 11 : 5} cy="8" r="3" fill="white" />
            </svg>
          </button>
          <button onClick={() => setEditingId(p.id)} className="w-8 h-8 rounded-lg text-enba-dim hover:text-enba-orange hover:bg-enba-orange/10 inline-flex items-center justify-center"><I.Edit size={14} /></button>
          <button onClick={() => deleteProject(p.id)} className="w-8 h-8 rounded-lg text-enba-dim hover:text-enba-red hover:bg-enba-red/10 inline-flex items-center justify-center"><I.Trash size={14} /></button>
        </div>
      ))}

      {editingId === null && (
        <button onClick={addProject}
          className="w-full border-2 border-dashed border-enba-line rounded-xl h-11 flex items-center justify-center gap-2 text-[13px] text-enba-dim hover:border-enba-orange/40 hover:text-enba-muted transition-colors">
          <I.Plus size={14} /> Proje Ekle
        </button>
      )}
      {projects.length === 0 && (
        <p className="text-[11.5px] text-enba-dim text-center">En az bir proje ekleyerek planı tamamlayın.</p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ANA SIHIRBAZ — 2 adım
══════════════════════════════════════════════════════ */
type WStep = 1 | 2;
const STEPS = [
  { n: 1 as WStep, label: 'Temel Bilgiler' },
  { n: 2 as WStep, label: 'Projeler' },
];

interface Props {
  onDone:       (plan: DPlan) => void;
  onCancel:     () => void;
  onSave?:      (plan: DPlan) => void;
  initialPlan?: DPlan;
  costCenters:  CostCenter[];
}

export function DPlanWizard({ onDone, onCancel, onSave, initialPlan, costCenters }: Props) {
  const planId = useRef<string>(initialPlan?.id ?? crypto.randomUUID());
  const [step,  setStep]  = useState<WStep>(1);
  const [saved, setSaved] = useState(false);

  /* Adım 1 */
  const [title,       setTitle]       = useState(initialPlan?.title ?? '');
  const [startYear,   setStartYear]   = useState(initialPlan?.startYear ?? new Date().getFullYear());
  const [startMonth,  setStartMonth]  = useState(initialPlan?.startMonth ?? 0);
  const [horizon,     setHorizon]     = useState(initialPlan?.horizon ?? 24);
  const [openingCash, setOpeningCash] = useState(initialPlan?.openingCash ?? 0);

  /* Tedarikçiler & Müşteriler (plana ait) */
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => initialPlan?.suppliers ?? []);
  const [customers, setCustomers] = useState<Customer[]>(() => initialPlan?.customers ?? []);

  /* Adım 2 */
  const defaultCcId = costCenters[0]?.id ?? '';
  const [projects, setProjects] = useState<ActiveProject[]>(() =>
    (initialPlan?.projects ?? []).map(p => ({
      ...p,
      costCenterId: (p as ActiveProject & { costCenterId?: string; facilityId?: string }).costCenterId
        ?? (p as ActiveProject & { facilityId?: string }).facilityId
        ?? defaultCcId,
      isActive: (p as ActiveProject & { isActive?: boolean }).isActive ?? true,
    }))
  );

  /* Önizleme */
  const preview = useMemo(() => {
    const allProducts = projects.flatMap(p => p.revenues);
    const allExpenses = [
      ...costCenters.flatMap(cc => cc.fixedExpenses),
      ...projects.flatMap(p => p.expenses),
    ];
    if (!allProducts.length && !allExpenses.length) return null;
    const periods = buildMonths(12, startYear, startMonth);
    const s = buildSeries(allProducts, allExpenses, periods, SCENARIOS.baz);
    return {
      rev:    s.reduce((a, x) => a + x.revenue, 0),
      opex:   s.reduce((a, x) => a + x.opex,    0),
      ebitda: s.reduce((a, x) => a + x.ebitda,  0),
    };
  }, [projects, costCenters, startYear, startMonth]);

  const next = () => { setSaved(false); setStep(s => Math.min(2, s + 1) as WStep); };
  const prev = () => { setSaved(false); setStep(s => Math.max(1, s - 1) as WStep); };

  const buildPlan = (status: DPlan['status'] = 'draft'): DPlan => ({
    id:             planId.current,
    title:          title.trim() || 'İsimsiz Plan',
    baslik:         title.trim() || 'İsimsiz Plan',
    status,
    year:           startYear,
    startYear,
    startMonth,
    horizon,
    openingCash,
    actualsThrough: initialPlan?.actualsThrough ?? 0,
    suppliers,
    customers,
    projects,
    cashEvents:     initialPlan?.cashEvents ?? [],
  });

  const handleSave = () => { onSave?.(buildPlan('draft')); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const finish     = () => onDone(buildPlan(initialPlan?.status ?? 'draft'));

  return (
    <div className="h-full flex bg-enba-bg overflow-hidden">

      {/* Sol adım çubuğu */}
      <aside className="w-[200px] flex-none bg-enba-panel border-r border-enba-line flex flex-col">
        <div className="h-[60px] flex items-center px-4 border-b border-enba-line gap-2 flex-none">
          <button onClick={onCancel} className="w-7 h-7 rounded-md text-enba-muted hover:text-enba-text hover:bg-enba-panel-2 inline-flex items-center justify-center">
            <I.Chevron size={13} className="rotate-90" />
          </button>
          <span className="text-[13px] font-semibold text-enba-text">{initialPlan ? 'Planı Düzenle' : 'Yeni Plan'}</span>
        </div>

        <nav className="flex-1 pt-3 px-2">
          {STEPS.map(({ n, label }) => {
            const done   = step > n;
            const active = step === n;
            return (
              <button key={n} onClick={() => done && setStep(n)} disabled={!done && !active}
                className={cx('w-full flex items-center gap-2.5 px-3 h-9 rounded-lg mb-0.5 text-[12.5px] transition-colors',
                  active  ? 'bg-enba-orange/12 text-enba-orange' : '',
                  done    ? 'text-enba-text hover:bg-enba-panel-2 cursor-pointer' : '',
                  !active && !done ? 'text-enba-dim cursor-not-allowed' : '')}>
                <span className={cx('w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-semibold flex-none',
                  done   ? 'bg-enba-green/20 text-enba-green' : '',
                  active ? 'bg-enba-orange text-white' : '',
                  !active && !done ? 'bg-enba-panel-2 text-enba-dim' : '')}>
                  {done ? '✓' : n}
                </span>
                <span className="text-left flex-1 truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Önizleme */}
        {preview && (
          <div className="m-3 p-3 rounded-lg bg-enba-panel-2 border border-enba-line space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-enba-dim">12 ay önizleme</div>
            <div className="flex justify-between text-[11.5px]">
              <span className="text-enba-dim">Gelir</span>
              <span className="font-semibold text-enba-orange">{fmtTL(preview.rev, { compact: true })}</span>
            </div>
            <div className="flex justify-between text-[11.5px]">
              <span className="text-enba-dim">Gider</span>
              <span className="font-semibold text-enba-red">{fmtTL(preview.opex, { compact: true })}</span>
            </div>
            <div className="pt-1 border-t border-enba-line flex justify-between text-[11.5px]">
              <span className="text-enba-dim">EBITDA</span>
              <span className={cx('font-semibold', preview.ebitda >= 0 ? 'text-enba-green' : 'text-enba-red')}>
                {fmtTL(preview.ebitda, { compact: true })}
              </span>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-enba-line">
          <div className="w-full h-1 bg-enba-panel-2 rounded-full overflow-hidden">
            <div className="h-full bg-enba-orange rounded-full transition-all" style={{ width: `${((step - 1) / 1) * 100}%` }} />
          </div>
          <div className="text-[10px] text-enba-dim mt-1.5">Adım {step} / 2</div>
        </div>
      </aside>

      {/* İçerik */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 grid-bg">
          <div className="max-w-[720px] mx-auto">
            {step === 1 && (
              <Step1
                title={title} setTitle={setTitle}
                startYear={startYear} setStartYear={setStartYear}
                startMonth={startMonth} setStartMonth={setStartMonth}
                horizon={horizon} setHorizon={setHorizon}
                openingCash={openingCash} setOpeningCash={setOpeningCash}
              />
            )}
            {step === 2 && (
              <>
                <SupplierList suppliers={suppliers} setSuppliers={setSuppliers} />
                <div className="mt-6 pt-6 border-t border-enba-line">
                  <CustomerList customers={customers} setCustomers={setCustomers} />
                </div>
                <div className="mt-6 pt-6 border-t border-enba-line">
                  <ProjectsStep
                    projects={projects} setProjects={setProjects}
                    horizon={horizon} costCenters={costCenters}
                    suppliers={suppliers} customers={customers}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-none border-t border-enba-line bg-enba-panel px-8 h-[60px] flex items-center justify-between">
          <Btn variant="outline" size="md"
            icon={step > 1 ? <I.Chevron size={12} className="rotate-90" /> : undefined}
            onClick={step > 1 ? prev : onCancel}>
            {step > 1 ? 'Geri' : 'İptal'}
          </Btn>
          <div className="flex items-center gap-2">
            {onSave && title.trim() && (
              <Btn variant="outline" size="md" icon={saved ? <I.Check size={13} /> : undefined} onClick={handleSave}>
                {saved ? 'Kaydedildi' : 'Kaydet'}
              </Btn>
            )}
            {step < 2
              ? <Btn variant="primary" size="md" disabled={!title.trim()} onClick={next}>
                  İleri <I.Chevron size={12} className="-rotate-90 ml-1" />
                </Btn>
              : <Btn variant="primary" size="md" icon={<I.Check size={14} />} onClick={finish}>
                  Tamamla
                </Btn>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
