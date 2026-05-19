import React, { useState, useMemo } from 'react';
import { cx, I, Btn } from './DPPrimitives';
import {
  DPlan, Product, FixedExpense,
  buildMonths, buildSeries, fmtTL, SCENARIOS,
} from './dpData';

/* ════════════════════════════════════════════════════
   M-KOD VERİSİ  (geri dönüşüm + üretim bağlamı)
════════════════════════════════════════════════════ */
export interface MCodeEntry {
  code: string;
  tr: string; // "770.10 - M610 Ofis ve Depo Kira Giderleri"
}

const MCODES_SALES: MCodeEntry[] = [
  { code: 'M105', tr: '600.01 - M105 Yurt İçi Satışlar (Üçüncü Şahıslar)' },
  { code: 'M149', tr: '600.02 - M149 Ticari Mal Satışları (Net)' },
];

const MCODES_PURCHASE: MCodeEntry[] = [
  { code: 'M369', tr: '150/710 - M369 İlk Madde ve Malzeme Giderleri Toplamı' },
];

const MCODES_PRODUCTION: MCodeEntry[] = [
  { code: 'M405', tr: '770.40 - M405 Elektrik Enerjisi Giderleri' },
  { code: 'M410', tr: '770.41 - M410 Isınma, Yakıt ve Buhar Giderleri' },
  { code: 'M415', tr: '770.42 - M415 Su Tüketim Giderleri' },
  { code: 'M489', tr: '770.01 - M489 Brüt Personel Maaş ve Ücret Giderleri' },
  { code: 'M489.01', tr: '770.02 - M489.01 SGK İşveren Payı Giderleri' },
  { code: 'M489.03', tr: '770.04 - M489.03 Personel Yemek ve Mutfak Giderleri' },
  { code: 'M489.04', tr: '770.05 - M489.04 Personel Ulaşım ve Yol Giderleri' },
  { code: 'M509', tr: '770.20 - M509 Makine, Cihaz ve Ofis Bakım Onarım Giderleri' },
  { code: 'M529', tr: '770.25 - M529 Çevre, Atık Yönetimi ve İSG Giderleri' },
  { code: 'M604', tr: '730.05 - M604 Dışarıdan Sağlanan Fayda ve Hizmetler (Üretim)' },
];

const MCODES_OVERHEAD: MCodeEntry[] = [
  { code: 'M489', tr: '770.01 - M489 Brüt Personel Maaş ve Ücret Giderleri' },
  { code: 'M605', tr: '770.06 - M605 Dışarıdan Sağlanan Personel Hizmetleri (Yönetim)' },
  { code: 'M610', tr: '770.10 - M610 Ofis ve Depo Kira Giderleri' },
  { code: 'M615', tr: '770.30 - M615 Yurt İçi ve Yurt Dışı Seyahat Giderleri' },
  { code: 'M620', tr: '770.50 - M620 Telefon, İnternet ve İletişim Giderleri' },
  { code: 'M625', tr: '770.60 - M625 Hukuk, Müşavirlik ve Denetim Giderleri' },
  { code: 'M630', tr: '760.20 - M630 Reklam, Pazarlama ve Tanıtım Giderleri' },
  { code: 'M635', tr: '770.70 - M635 Ofis, Demirbaş ve Araç Sigorta Giderleri' },
  { code: 'M640', tr: '770.80 - M640 Dışarıdan Alınan BT ve Yazılım Lisans Giderleri' },
  { code: 'M650', tr: '653.01 - M650 Banka Hesap İşletim ve Komisyon Giderleri' },
  { code: 'M659', tr: '659 - M659 Diğer Finansal Gider ve Zararlar' },
  { code: 'M660', tr: '770.99 - M660 Diğer Çeşitli Genel Yönetim Giderleri' },
  { code: 'M665', tr: '770.15 - M665 Vergi, Resim, Harç ve Damga Vergileri' },
  { code: 'M759', tr: '770.11 - M759 Finansal Kiralama (Leasing) Giderleri' },
];

/* ════════════════════════════════════════════════════
   YARDIMCI BİLEŞENLER
════════════════════════════════════════════════════ */

/** M-kod üzerine gelindiğinde TR hesap kodu + açıklama gösterir */
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
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {code}
      </span>
      {open && entry && (
        <div className="absolute left-0 top-full mt-1 z-50 w-[280px] bg-enba-panel border border-enba-line rounded-lg shadow-xl p-3 pointer-events-none">
          <div className="text-[10px] text-enba-dim font-mono mb-0.5">{acctNo}</div>
          <div className="text-[12px] text-enba-text leading-snug">{desc}</div>
        </div>
      )}
    </span>
  );
}

/** Mcode seçici — seçince altta TR açıklama gösterir */
function MCodeSelect({
  value, onChange, mcodes, label,
}: { value: string; onChange: (v: string) => void; mcodes: MCodeEntry[]; label: string }) {
  const entry = mcodes.find(m => m.code === value);
  const parts  = entry ? entry.tr.split(' - ') : [];
  const acctNo = parts[0] ?? '';
  const desc   = parts.slice(1).join(' - ');

  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-enba-dim mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2 text-[13px] text-enba-text font-mono focus:border-enba-orange/60 focus:ring-1 focus:ring-enba-orange/30 outline-none appearance-none"
      >
        {mcodes.map(m => (
          <option key={m.code} value={m.code}>{m.code}</option>
        ))}
      </select>
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

function StepHeader({ step, title, sub }: { step: number; title: string; sub: string }) {
  return (
    <div className="mb-4">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-dim mb-1">Adım {step}</div>
      <h2 className="text-[20px] font-semibold text-enba-text">{title}</h2>
      <p className="text-[12.5px] text-enba-muted mt-1">{sub}</p>
    </div>
  );
}

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const PRODUCT_COLORS = ['#E35205','#FF8A3D','#F2A93B','#3DBE7C','#5B9DFF','#9B8EF0','#E5484D','#9A9A9A'];
const UNITS_WEIGHT   = ['ton','kg','m³'];
const UNITS_PRODUCT  = ['ton','kg','adet','sefer','m²','paket'];

/* ════════════════════════════════════════════════════
   ANA SIHIRBAZ
════════════════════════════════════════════════════ */
type Step = 1 | 2 | 3 | 4 | 5;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: 'Temel Bilgiler' },
  { n: 2, label: 'Sabit Giderler' },
  { n: 3, label: 'Alış Maliyetleri' },
  { n: 4, label: 'Üretim Maliyetleri' },
  { n: 5, label: 'Satış Gelirleri' },
];

interface Props {
  onDone: (plan: DPlan) => void;
  onCancel: () => void;
}

export function DPlanWizard({ onDone, onCancel }: Props) {
  const [step, setStep] = useState<Step>(1);

  /* Adım 1 — Temel */
  const [title,       setTitle]       = useState('');
  const [startYear,   setStartYear]   = useState(new Date().getFullYear());
  const [startMonth,  setStartMonth]  = useState(0);
  const [horizon,     setHorizon]     = useState(24);
  const [openingCash, setOpeningCash] = useState(0);

  /* Adım 2 — Sabit Giderler */
  const [overhead, setOverhead] = useState<FixedExpense[]>([]);

  /* Adım 3 — Alış Maliyetleri */
  const [purchase, setPurchase] = useState<FixedExpense[]>([]);

  /* Adım 4 — Üretim Maliyetleri */
  const [production, setProduction] = useState<FixedExpense[]>([]);

  /* Adım 5 — Satış Gelirleri */
  const [sales, setSales] = useState<Product[]>([]);

  /* Projeksiyon önizlemesi (adım 5) */
  const preview = useMemo(() => {
    const allExp = [...overhead, ...purchase, ...production];
    if (!sales.length && !allExp.length) return null;
    const periods = buildMonths(12, startYear, startMonth);
    const s       = buildSeries(sales, allExp, periods, SCENARIOS.baz);
    return {
      rev:    s.reduce((a, x) => a + x.revenue, 0),
      opex:   s.reduce((a, x) => a + x.opex, 0),
      ebitda: s.reduce((a, x) => a + x.ebitda, 0),
    };
  }, [sales, overhead, purchase, production, startYear, startMonth]);

  const next = () => setStep(s => Math.min(5, s + 1) as Step);
  const prev = () => setStep(s => Math.max(1, s - 1) as Step);

  const finish = () => {
    const plan: DPlan = {
      id: crypto.randomUUID(),
      title: title.trim(),
      baslik: title.trim(),
      status: 'draft',
      year: startYear,
      startYear,
      startMonth,
      horizon,
      openingCash,
      actualsThrough: 0,
      products:      sales,
      fixedExpenses: [...overhead, ...purchase, ...production],
      cashEvents:    [],
    };
    onDone(plan);
  };

  return (
    <div className="h-full flex bg-enba-bg overflow-hidden">

      {/* ── Sol adım çubuğu ── */}
      <aside className="w-[200px] flex-none bg-enba-panel border-r border-enba-line flex flex-col">
        <div className="h-[60px] flex items-center px-4 border-b border-enba-line gap-2 flex-none">
          <button onClick={onCancel} className="w-7 h-7 rounded-md text-enba-muted hover:text-enba-text hover:bg-enba-panel-2 inline-flex items-center justify-center">
            <I.Chevron size={13} className="rotate-90" />
          </button>
          <span className="text-[13px] font-semibold text-enba-text">Yeni Plan</span>
        </div>

        <nav className="flex-1 pt-3 px-2">
          {STEPS.map(({ n, label }) => {
            const done   = step > n;
            const active = step === n;
            return (
              <button
                key={n}
                onClick={() => done && setStep(n)}
                disabled={!done && !active}
                className={cx(
                  'w-full flex items-center gap-2.5 px-3 h-9 rounded-lg mb-0.5 text-[12.5px] transition-colors',
                  active  ? 'bg-enba-orange/12 text-enba-orange' : '',
                  done    ? 'text-enba-text hover:bg-enba-panel-2 cursor-pointer' : '',
                  !active && !done ? 'text-enba-dim cursor-not-allowed' : '',
                )}
              >
                <span className={cx(
                  'w-4.5 h-4.5 rounded-full inline-flex items-center justify-center text-[10px] font-semibold flex-none w-5 h-5',
                  done   ? 'bg-enba-green/20 text-enba-green' : '',
                  active ? 'bg-enba-orange text-white' : '',
                  !active && !done ? 'bg-enba-panel-2 text-enba-dim' : '',
                )}>
                  {done ? '✓' : n}
                </span>
                <span className="text-left flex-1 truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-enba-line">
          <div className="w-full h-1 bg-enba-panel-2 rounded-full overflow-hidden">
            <div className="h-full bg-enba-orange rounded-full transition-all" style={{ width: `${((step - 1) / 4) * 100}%` }} />
          </div>
          <div className="text-[10px] text-enba-dim mt-1.5">Adım {step} / 5</div>
        </div>
      </aside>

      {/* ── İçerik ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 grid-bg">
          <div className="max-w-[700px] mx-auto">

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
              <ExpenseStep
                stepNum={2}
                title="Sabit Giderler"
                sub="Kira, idari personel, sigorta, iletişim gibi dönemsel sabit maliyetler. (M610, M489, M620, M635 vb.)"
                category="overhead"
                mcodes={MCODES_OVERHEAD}
                defaultMcode="M610"
                items={overhead}
                setItems={setOverhead}
                showUnitPrice={false}
              />
            )}

            {step === 3 && (
              <ExpenseStep
                stepNum={3}
                title="Alış Maliyetleri"
                sub="Hammadde alışları: PET şişe, HDPE, LDPE, karton, metal vb. (M369)"
                category="purchase"
                mcodes={MCODES_PURCHASE}
                defaultMcode="M369"
                items={purchase}
                setItems={setPurchase}
                showUnitPrice={true}
                units={UNITS_WEIGHT}
              />
            )}

            {step === 4 && (
              <ExpenseStep
                stepNum={4}
                title="Üretim Maliyetleri"
                sub="Elektrik, üretim personeli, bakım, çevre/İSG, taşeron hizmet. (M405, M489, M509, M529, M604 vb.)"
                category="production"
                mcodes={MCODES_PRODUCTION}
                defaultMcode="M405"
                items={production}
                setItems={setProduction}
                showUnitPrice={false}
              />
            )}

            {step === 5 && (
              <SalesStep
                sales={sales}
                setSales={setSales}
                preview={preview}
              />
            )}

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex-none border-t border-enba-line bg-enba-panel px-8 h-[60px] flex items-center justify-between">
          <Btn variant="outline" size="md"
            icon={step > 1 ? <I.Chevron size={12} className="rotate-90" /> : undefined}
            onClick={step > 1 ? prev : onCancel}>
            {step > 1 ? 'Geri' : 'İptal'}
          </Btn>

          {step < 5
            ? <Btn variant="primary" size="md" disabled={step === 1 && !title.trim()} onClick={next}>
                İleri <I.Chevron size={12} className="-rotate-90 ml-1" />
              </Btn>
            : <Btn variant="primary" size="md" icon={<I.Plus size={14} />} onClick={finish}>
                Planı Oluştur
              </Btn>
          }
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   ADIM 1 — Temel Bilgiler
════════════════════════════════════════════════════ */
interface Step1Props {
  title: string; setTitle: (v: string) => void;
  startYear: number; setStartYear: (v: number) => void;
  startMonth: number; setStartMonth: (v: number) => void;
  horizon: number; setHorizon: (v: number) => void;
  openingCash: number; setOpeningCash: (v: number) => void;
}
function Step1({ title, setTitle, startYear, setStartYear, startMonth, setStartMonth, horizon, setHorizon, openingCash, setOpeningCash }: Step1Props) {
  return (
    <div className="space-y-5">
      <StepHeader step={1} title="Temel Bilgiler" sub="Plan adı, dönem aralığı ve açılış nakit bakiyesi." />
      <FieldCard>
        <Field label="Plan Adı *">
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            placeholder="2025 Geri Dönüşüm Bütçesi" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Başlangıç Yılı">
            <input type="number" value={startYear} min={2020} max={2040}
              onChange={e => setStartYear(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Başlangıç Ayı">
            <select value={startMonth} onChange={e => setStartMonth(Number(e.target.value))} className={selectCls}>
              {MONTHS_TR.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Plan Ufku">
          <div className="flex gap-2">
            {[12, 18, 24, 36].map(h => (
              <button key={h} onClick={() => setHorizon(h)}
                className={cx('flex-1 h-9 rounded-lg border text-[13px] font-medium transition-colors',
                  horizon === h ? 'border-enba-orange bg-enba-orange/10 text-enba-orange' : 'border-enba-line bg-enba-panel-2 text-enba-muted hover:border-enba-orange/40'
                )}>
                {h} ay
              </button>
            ))}
          </div>
        </Field>
        <Field label="Açılış Nakit Bakiyesi (₺)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
            <input type="number" value={openingCash} min={0}
              onChange={e => setOpeningCash(Number(e.target.value))}
              className={cx(inputCls, 'pl-7')} />
          </div>
        </Field>
      </FieldCard>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   ADIM 2/3/4 — Gider Adımları (Sabit / Alış / Üretim)
════════════════════════════════════════════════════ */
interface ExpenseStepProps {
  stepNum: number;
  title: string;
  sub: string;
  category: FixedExpense['costCategory'];
  mcodes: MCodeEntry[];
  defaultMcode: string;
  items: FixedExpense[];
  setItems: (v: FixedExpense[]) => void;
  showUnitPrice: boolean;
  units?: string[];
}

function emptyExpense(cat: FixedExpense['costCategory'], mcode: string): FixedExpense {
  return {
    id: crypto.randomUUID(),
    mcode,
    costCategory: cat,
    name: '',
    group: cat === 'purchase' ? 'Yarı Değişken' : 'Sabit',
    monthly: 0,
    growth: 0.10,
    unit: 'ton',
    unitPrice: 0,
    monthlyQty: 0,
  };
}

function ExpenseStep({ stepNum, title, sub, category, mcodes, defaultMcode, items, setItems, showUnitPrice, units = ['ton','kg'] }: ExpenseStepProps) {
  const [adding, setAdding] = useState(false);
  const [draft,  setDraft]  = useState<FixedExpense>(emptyExpense(category, defaultMcode));
  const [editId, setEditId] = useState<string | null>(null);

  const startAdd = () => {
    setDraft(emptyExpense(category, defaultMcode));
    setEditId(null);
    setAdding(true);
  };

  const startEdit = (item: FixedExpense) => {
    setDraft({ ...item });
    setEditId(item.id);
    setAdding(true);
  };

  const handleSave = () => {
    if (!draft.name.trim()) return;
    const monthly = showUnitPrice
      ? (draft.unitPrice ?? 0) * (draft.monthlyQty ?? 0)
      : draft.monthly;
    const item: FixedExpense = { ...draft, monthly };
    if (editId) {
      setItems(items.map(i => i.id === editId ? item : i));
    } else {
      setItems([...items, item]);
    }
    setAdding(false);
    setEditId(null);
  };

  const handleCancel = () => { setAdding(false); setEditId(null); };

  const totalMonthly = items.reduce((s, e) => s + e.monthly, 0);

  return (
    <div className="space-y-4">
      <StepHeader step={stepNum} title={title} sub={sub} />

      {/* Toplam */}
      {items.length > 0 && (
        <div className="bg-enba-panel border border-enba-line rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-[11px] text-enba-dim">{items.length} kalem</span>
          <span className="text-[14px] font-semibold tabular">
            {fmtTL(totalMonthly)}<span className="text-[11px] text-enba-dim font-normal ml-1">/ ay</span>
          </span>
        </div>
      )}

      {/* Liste */}
      {items.map(item => (
        <div key={item.id} className="bg-enba-panel border border-enba-line rounded-xl px-4 py-3 flex items-center gap-3">
          <MCodeTag code={item.mcode} mcodes={mcodes} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-enba-text">{item.name}</div>
            {showUnitPrice
              ? <div className="text-[11px] text-enba-dim mt-0.5">
                  {(item.monthlyQty ?? 0).toLocaleString('tr-TR')} {item.unit} · {fmtTL(item.unitPrice ?? 0)}/{item.unit} · yıllık +{Math.round(item.growth * 100)}%
                </div>
              : <div className="text-[11px] text-enba-dim mt-0.5">yıllık +{Math.round(item.growth * 100)}%</div>
            }
          </div>
          <span className="text-[13px] font-semibold tabular">{fmtTL(item.monthly)}<span className="text-[11px] text-enba-dim font-normal">/ay</span></span>
          <button onClick={() => startEdit(item)} className="w-7 h-7 rounded-md text-enba-dim hover:text-enba-text hover:bg-enba-panel-2 inline-flex items-center justify-center">
            <I.Edit size={12} />
          </button>
          <button onClick={() => setItems(items.filter(i => i.id !== item.id))}
            className="w-7 h-7 rounded-md text-enba-dim hover:text-enba-red hover:bg-enba-red/10 inline-flex items-center justify-center">
            <I.Trash size={12} />
          </button>
        </div>
      ))}

      {/* Form */}
      {adding ? (
        <FieldCard>
          <div className="grid grid-cols-2 gap-4">
            <MCodeSelect
              label="M-Kodu *"
              value={draft.mcode}
              onChange={v => setDraft({ ...draft, mcode: v })}
              mcodes={mcodes}
            />
            <Field label="Kalem Adı *">
              <input autoFocus value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
                placeholder={category === 'purchase' ? 'PET Şişe Atık...' : category === 'production' ? 'Elektrik, Personel...' : 'Kira, İletişim...'}
                className={inputCls} />
            </Field>
          </div>

          {showUnitPrice ? (
            <div className="grid grid-cols-3 gap-4">
              <Field label="Birim">
                <select value={draft.unit ?? 'ton'} onChange={e => setDraft({ ...draft, unit: e.target.value })} className={selectCls}>
                  {units.map(u => <option key={u}>{u}</option>)}
                </select>
              </Field>
              <Field label={`Alış Fiyatı (₺/${draft.unit ?? 'ton'})`}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
                  <input type="number" value={draft.unitPrice ?? 0} min={0}
                    onChange={e => setDraft({ ...draft, unitPrice: Number(e.target.value) })}
                    className={cx(inputCls, 'pl-7')} />
                </div>
              </Field>
              <Field label={`Aylık Alış (${draft.unit ?? 'ton'})`}>
                <input type="number" value={draft.monthlyQty ?? 0} min={0}
                  onChange={e => setDraft({ ...draft, monthlyQty: Number(e.target.value) })}
                  className={inputCls} />
              </Field>
            </div>
          ) : (
            <Field label="Aylık Tutar (₺)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
                <input type="number" value={draft.monthly} min={0}
                  onChange={e => setDraft({ ...draft, monthly: Number(e.target.value) })}
                  className={cx(inputCls, 'pl-7')} />
              </div>
            </Field>
          )}

          {/* Önizleme tutarı (alış için) */}
          {showUnitPrice && (draft.unitPrice ?? 0) > 0 && (draft.monthlyQty ?? 0) > 0 && (
            <div className="text-[12px] text-enba-muted bg-enba-panel-2 rounded-lg px-3 py-2">
              Aylık maliyet: <span className="font-semibold text-enba-text">{fmtTL((draft.unitPrice ?? 0) * (draft.monthlyQty ?? 0))}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Yıllık Büyüme (%)">
              <div className="flex items-center gap-1.5">
                <input type="number" value={Math.round(draft.growth * 100)} min={-20} max={200} step={1}
                  onChange={e => setDraft({ ...draft, growth: Number(e.target.value) / 100 })}
                  className={cx(inputCls, 'flex-1')} />
                <span className="text-enba-dim text-[13px]">%</span>
              </div>
            </Field>
            <Field label="Grup">
              <select value={draft.group} onChange={e => setDraft({ ...draft, group: e.target.value })} className={selectCls}>
                <option>Sabit</option>
                <option>Yarı Değişken</option>
              </select>
            </Field>
          </div>

          <div className="flex gap-2 pt-1 border-t border-enba-line">
            <button onClick={handleCancel} className="h-8 px-4 rounded-lg border border-enba-line text-[12px] text-enba-muted hover:bg-enba-panel-2">İptal</button>
            <Btn variant="primary" size="sm" onClick={handleSave} disabled={!draft.name.trim()}>
              {editId ? 'Güncelle' : 'Ekle'}
            </Btn>
          </div>
        </FieldCard>
      ) : (
        <button onClick={startAdd}
          className="w-full border-2 border-dashed border-enba-line rounded-xl h-11 flex items-center justify-center gap-2 text-[13px] text-enba-dim hover:border-enba-orange/40 hover:text-enba-muted transition-colors">
          <I.Plus size={14} /> Kalem Ekle
        </button>
      )}

      {items.length === 0 && !adding && (
        <p className="text-[11.5px] text-enba-dim text-center">
          Boş bırakabilirsiniz — plan oluşturulduktan sonra da eklenebilir.
        </p>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   ADIM 5 — Satış Gelirleri
════════════════════════════════════════════════════ */
function emptySale(idx: number): Product {
  return {
    id: crypto.randomUUID(),
    mcode: 'M105',
    name: '',
    category: 'Granül Üretim',
    unit: 'ton',
    price: 0,
    priceGrowth: 0.08,
    seasonality: Array(12).fill(1),
    volume: 0,
    volumeGrowth: 0.05,
    varCostRatio: 0,
    color: PRODUCT_COLORS[idx % PRODUCT_COLORS.length],
  };
}

interface SalesStepProps {
  sales: Product[];
  setSales: (v: Product[]) => void;
  preview: { rev: number; opex: number; ebitda: number } | null;
}

function SalesStep({ sales, setSales, preview }: SalesStepProps) {
  const [adding, setAdding] = useState(false);
  const [draft,  setDraft]  = useState<Product>(emptySale(0));
  const [editId, setEditId] = useState<string | null>(null);

  const startAdd = () => { setDraft(emptySale(sales.length)); setEditId(null); setAdding(true); };
  const startEdit = (p: Product) => { setDraft({ ...p }); setEditId(p.id); setAdding(true); };

  const handleSave = () => {
    if (!draft.name.trim()) return;
    if (editId) setSales(sales.map(p => p.id === editId ? draft : p));
    else        setSales([...sales, draft]);
    setAdding(false);
    setEditId(null);
  };

  return (
    <div className="space-y-4">
      <StepHeader step={5} title="Satış Gelirleri"
        sub="Granül, pelet ve hizmet gelirleri. Her ürün için birim fiyat ve aylık satış hacmi girin. (M105, M149)" />

      {/* Ürün listesi */}
      {sales.map(p => (
        <div key={p.id} className="bg-enba-panel border border-enba-line rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="w-2.5 h-8 rounded-sm flex-none" style={{ background: p.color }} />
          <MCodeTag code={p.mcode} mcodes={MCODES_SALES} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-enba-text">{p.name}</div>
            <div className="text-[11px] text-enba-dim mt-0.5">
              {fmtTL(p.price)}/{p.unit} · {p.volume.toLocaleString('tr-TR')} {p.unit}/ay
            </div>
          </div>
          <button onClick={() => startEdit(p)} className="w-7 h-7 rounded-md text-enba-dim hover:text-enba-text hover:bg-enba-panel-2 inline-flex items-center justify-center">
            <I.Edit size={12} />
          </button>
          <button onClick={() => setSales(sales.filter(x => x.id !== p.id))}
            className="w-7 h-7 rounded-md text-enba-dim hover:text-enba-red hover:bg-enba-red/10 inline-flex items-center justify-center">
            <I.Trash size={12} />
          </button>
        </div>
      ))}

      {/* Form */}
      {adding ? (
        <FieldCard>
          <div className="grid grid-cols-2 gap-4">
            <MCodeSelect label="M-Kodu *" value={draft.mcode}
              onChange={v => setDraft({ ...draft, mcode: v })} mcodes={MCODES_SALES} />
            <Field label="Ürün / Hizmet Adı *">
              <input autoFocus value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
                placeholder="PET Granül Şeffaf, HDPE Granül..." className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Birim">
              <select value={draft.unit} onChange={e => setDraft({ ...draft, unit: e.target.value })} className={selectCls}>
                {UNITS_PRODUCT.map(u => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label={`Satış Fiyatı (₺/${draft.unit})`}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
                <input type="number" value={draft.price} min={0}
                  onChange={e => setDraft({ ...draft, price: Number(e.target.value) })}
                  className={cx(inputCls, 'pl-7')} />
              </div>
            </Field>
            <Field label={`Aylık Hacim (${draft.unit})`}>
              <input type="number" value={draft.volume} min={0}
                onChange={e => setDraft({ ...draft, volume: Number(e.target.value) })}
                className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Fiyat Büyümesi (% yıllık)">
              <div className="flex items-center gap-1.5">
                <input type="number" value={Math.round(draft.priceGrowth * 100)} min={-50} max={200} step={1}
                  onChange={e => setDraft({ ...draft, priceGrowth: Number(e.target.value) / 100 })}
                  className={cx(inputCls, 'flex-1')} />
                <span className="text-enba-dim">%</span>
              </div>
            </Field>
            <Field label="Hacim Büyümesi (% yıllık)">
              <div className="flex items-center gap-1.5">
                <input type="number" value={Math.round(draft.volumeGrowth * 100)} min={-50} max={200} step={1}
                  onChange={e => setDraft({ ...draft, volumeGrowth: Number(e.target.value) / 100 })}
                  className={cx(inputCls, 'flex-1')} />
                <span className="text-enba-dim">%</span>
              </div>
            </Field>
          </div>

          <Field label="Renk">
            <div className="flex gap-2 flex-wrap">
              {PRODUCT_COLORS.map(c => (
                <button key={c} onClick={() => setDraft({ ...draft, color: c })}
                  className={cx('w-7 h-7 rounded-md transition-all', draft.color === c ? 'ring-2 ring-offset-2 ring-enba-orange ring-offset-enba-panel scale-110' : 'hover:scale-105')}
                  style={{ background: c }} />
              ))}
            </div>
          </Field>

          <div className="flex gap-2 pt-1 border-t border-enba-line">
            <button onClick={() => { setAdding(false); setEditId(null); }}
              className="h-8 px-4 rounded-lg border border-enba-line text-[12px] text-enba-muted hover:bg-enba-panel-2">İptal</button>
            <Btn variant="primary" size="sm" onClick={handleSave} disabled={!draft.name.trim()}>
              {editId ? 'Güncelle' : 'Ekle'}
            </Btn>
          </div>
        </FieldCard>
      ) : (
        <button onClick={startAdd}
          className="w-full border-2 border-dashed border-enba-line rounded-xl h-11 flex items-center justify-center gap-2 text-[13px] text-enba-dim hover:border-enba-orange/40 hover:text-enba-muted transition-colors">
          <I.Plus size={14} /> Satış Kalemi Ekle
        </button>
      )}

      {/* Projeksiyon önizlemesi */}
      {preview && (
        <div className="bg-enba-panel border border-enba-line rounded-xl p-4 mt-2">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-dim mb-3">İlk 12 Ay Projeksiyonu (Baz Senaryo)</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-[10.5px] text-enba-dim mb-1">M299 Net Satış</div>
              <div className="text-[15px] font-semibold tabular text-enba-orange">{fmtTL(preview.rev)}</div>
            </div>
            <div>
              <div className="text-[10.5px] text-enba-dim mb-1">Toplam Maliyet</div>
              <div className="text-[15px] font-semibold tabular text-enba-red">{fmtTL(preview.opex)}</div>
            </div>
            <div>
              <div className="text-[10.5px] text-enba-dim mb-1">M769 EBITDA</div>
              <div className={cx('text-[15px] font-semibold tabular', preview.ebitda >= 0 ? 'text-enba-green' : 'text-enba-red')}>
                {fmtTL(preview.ebitda)}
              </div>
            </div>
          </div>
        </div>
      )}

      {sales.length === 0 && !adding && (
        <p className="text-[11.5px] text-enba-dim text-center">
          Satış kalemi olmadan da plan oluşturulabilir — sonradan eklenir.
        </p>
      )}
    </div>
  );
}
