import React, { useState, useMemo } from 'react';
import { cx, I, Btn, Badge } from './DPPrimitives';
import { DPlan, Product, FixedExpense, buildMonths, buildSeries, fmtTL, SCENARIOS } from './dpData';

/* ─── Sabitler ─── */
const PRODUCT_COLORS = ['#E35205','#FF8A3D','#F2A93B','#3DBE7C','#5B9DFF','#9B8EF0','#E5484D','#9A9A9A'];
const CATEGORIES     = ['Granül Üretim','Hizmet','Hammadde','Yarı Mamül','Diğer'];
const UNITS          = ['ton','adet','sefer','m³','kg','paket'];
const MONTHS_TR      = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

/* ─── Boş kayıtlar ─── */
function emptyProduct(idx: number): Product {
  return {
    id: crypto.randomUUID(),
    name: '',
    category: CATEGORIES[0],
    unit: UNITS[0],
    price: 0,
    priceGrowth: 0.08,
    seasonality: Array(12).fill(1),
    volume: 0,
    volumeGrowth: 0.05,
    varCostRatio: 0.45,
    color: PRODUCT_COLORS[idx % PRODUCT_COLORS.length],
  };
}

function emptyExpense(): FixedExpense {
  return {
    id: crypto.randomUUID(),
    name: '',
    group: 'Sabit',
    monthly: 0,
    growth: 0.08,
  };
}

/* ─── DPlanWizard ─── */
interface DPlanWizardProps {
  onDone: (plan: DPlan) => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1 as Step, label: 'Temel Bilgiler', icon: I.Calendar },
  { n: 2 as Step, label: 'Ürün / Hizmetler', icon: I.Revenue },
  { n: 3 as Step, label: 'Sabit Giderler', icon: I.Expense },
  { n: 4 as Step, label: 'Özet & Oluştur', icon: I.Sparkles },
];

export function DPlanWizard({ onDone, onCancel }: DPlanWizardProps) {
  const currentYear = new Date().getFullYear();
  const [step, setStep] = useState<Step>(1);

  /* Adım 1 */
  const [title,       setTitle]       = useState('');
  const [startYear,   setStartYear]   = useState(currentYear);
  const [startMonth,  setStartMonth]  = useState(0);
  const [horizon,     setHorizon]     = useState<number>(24);
  const [openingCash, setOpeningCash] = useState(0);

  /* Adım 2 */
  const [products,    setProducts]    = useState<Product[]>([]);
  const [editProd,    setEditProd]    = useState<Product | null>(null);
  const [prodDraft,   setProdDraft]   = useState<Product>(emptyProduct(0));

  /* Adım 3 */
  const [expenses,    setExpenses]    = useState<FixedExpense[]>([]);
  const [editExp,     setEditExp]     = useState<FixedExpense | null>(null);
  const [expDraft,    setExpDraft]    = useState<FixedExpense>(emptyExpense());

  /* Özet hesabı */
  const summary = useMemo(() => {
    if (!products.length && !expenses.length) return null;
    const periods = buildMonths(12, startYear, startMonth);
    const series  = buildSeries(products, expenses, periods, SCENARIOS.baz);
    const totRev  = series.reduce((s, x) => s + x.revenue, 0);
    const totExp  = series.reduce((s, x) => s + x.opex, 0);
    const totEb   = series.reduce((s, x) => s + x.ebitda, 0);
    return { totRev, totExp, totEb };
  }, [products, expenses, startYear, startMonth]);

  /* Adım 1 validasyonu */
  const step1Valid = title.trim().length > 0;

  /* Ürün kaydet */
  const saveProd = () => {
    if (!prodDraft.name.trim()) return;
    if (editProd) {
      setProducts(prev => prev.map(p => p.id === editProd.id ? prodDraft : p));
      setEditProd(null);
    } else {
      setProducts(prev => [...prev, prodDraft]);
    }
    setProdDraft(emptyProduct(products.length + 1));
  };

  /* Gider kaydet */
  const saveExp = () => {
    if (!expDraft.name.trim()) return;
    if (editExp) {
      setExpenses(prev => prev.map(e => e.id === editExp.id ? expDraft : e));
      setEditExp(null);
    } else {
      setExpenses(prev => [...prev, expDraft]);
    }
    setExpDraft(emptyExpense());
  };

  /* Bitir */
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
      products,
      fixedExpenses: expenses,
      cashEvents: [],
    };
    onDone(plan);
  };

  return (
    <div className="h-full flex bg-enba-bg overflow-hidden">
      {/* Adım kenar çubuğu */}
      <aside className="w-[220px] flex-none bg-enba-panel border-r border-enba-line flex flex-col">
        <div className="h-[60px] flex items-center px-5 border-b border-enba-line gap-2 flex-none">
          <button onClick={onCancel} className="w-7 h-7 rounded-md text-enba-muted hover:text-enba-text hover:bg-enba-panel-2 inline-flex items-center justify-center">
            <I.Chevron size={13} className="rotate-90" />
          </button>
          <div className="text-[13px] font-semibold text-enba-text">Yeni Plan</div>
        </div>
        <nav className="flex-1 pt-4 px-3">
          {STEPS.map(({ n, label, icon: Icon }) => {
            const done    = step > n;
            const active  = step === n;
            return (
              <button
                key={n}
                onClick={() => done && setStep(n)}
                disabled={!done && !active}
                className={cx(
                  'w-full flex items-center gap-3 px-3 h-10 rounded-lg mb-1 text-[13px] transition-colors',
                  active  ? 'bg-enba-orange/12 text-enba-orange' : '',
                  done    ? 'text-enba-text hover:bg-enba-panel-2 cursor-pointer' : '',
                  !active && !done ? 'text-enba-dim cursor-not-allowed' : '',
                )}
              >
                {done
                  ? <span className="w-5 h-5 rounded-full bg-enba-green/20 text-enba-green inline-flex items-center justify-center flex-none"><I.Up size={10} /></span>
                  : <span className={cx('w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-semibold flex-none',
                      active ? 'bg-enba-orange text-white' : 'bg-enba-panel-2 text-enba-dim'
                    )}>{n}</span>
                }
                <span className="text-left flex-1 truncate">{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-enba-line">
          <div className="text-[10.5px] text-enba-dim mb-2">İlerleme</div>
          <div className="w-full h-1.5 bg-enba-panel-2 rounded-full overflow-hidden">
            <div className="h-full bg-enba-orange rounded-full transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }} />
          </div>
          <div className="text-[10px] text-enba-dim mt-1">Adım {step} / {STEPS.length}</div>
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
              <Step2
                products={products} setProducts={setProducts}
                prodDraft={prodDraft} setProdDraft={setProdDraft}
                editProd={editProd} setEditProd={setEditProd}
                onSave={saveProd}
                onCancel={() => { setEditProd(null); setProdDraft(emptyProduct(products.length)); }}
              />
            )}

            {step === 3 && (
              <Step3
                expenses={expenses} setExpenses={setExpenses}
                expDraft={expDraft} setExpDraft={setExpDraft}
                editExp={editExp} setEditExp={setEditExp}
                onSave={saveExp}
                onCancel={() => { setEditExp(null); setExpDraft(emptyExpense()); }}
              />
            )}

            {step === 4 && (
              <Step4
                title={title} startYear={startYear} startMonth={startMonth}
                horizon={horizon} openingCash={openingCash}
                products={products} expenses={expenses}
                summary={summary}
              />
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="flex-none border-t border-enba-line bg-enba-panel px-8 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Btn variant="outline" size="md" icon={<I.Chevron size={12} className="rotate-90" />}
                onClick={() => setStep((step - 1) as Step)}>
                Geri
              </Btn>
            )}
            {step === 1 && (
              <Btn variant="outline" size="md" onClick={onCancel}>İptal</Btn>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 4 && (
              <Btn
                variant="primary" size="md"
                disabled={step === 1 && !step1Valid}
                onClick={() => setStep((step + 1) as Step)}
              >
                {step === 3 && products.length === 0 && expenses.length === 0
                  ? 'Devam Et'
                  : step === 2 && products.length === 0
                    ? 'Ürünsüz Devam Et'
                    : 'İleri'
                }
                <I.Chevron size={12} className="-rotate-90 ml-1" />
              </Btn>
            )}
            {step === 4 && (
              <Btn variant="primary" size="md" icon={<I.Plus size={14} />} onClick={finish}>
                Planı Oluştur
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Adım 1 — Temel Bilgiler
══════════════════════════════════════════════════ */
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
      <StepHeader step={1} title="Temel Bilgiler" sub="Plan adı, dönem ve açılış nakit bakiyesi." />

      <FieldCard>
        <Field label="Plan Adı *" hint="Plana özgün, tanımlayıcı bir ad verin.">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="2025-2026 Üretim & Geri Dönüşüm Bütçesi"
            className={inputCls}
          />
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

        <Field label="Plan Ufku (ay)" hint="Projeksiyonun kaç aya kadar uzanacağı.">
          <div className="flex items-center gap-2">
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

        <Field label="Açılış Nakit Bakiyesi (₺)" hint="Plan başladığında kasada bulunan nakit miktarı.">
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

/* ══════════════════════════════════════════════════
   Adım 2 — Ürünler
══════════════════════════════════════════════════ */
interface Step2Props {
  products: Product[]; setProducts: (p: Product[]) => void;
  prodDraft: Product; setProdDraft: (p: Product) => void;
  editProd: Product | null; setEditProd: (p: Product | null) => void;
  onSave: () => void; onCancel: () => void;
}

function Step2({ products, setProducts, prodDraft, setProdDraft, editProd, setEditProd, onSave, onCancel }: Step2Props) {
  const [adding, setAdding] = useState(false);

  const startAdd = () => {
    setProdDraft(emptyProduct(products.length));
    setEditProd(null);
    setAdding(true);
  };

  const startEdit = (p: Product) => {
    setProdDraft({ ...p });
    setEditProd(p);
    setAdding(true);
  };

  const handleSave = () => {
    onSave();
    setAdding(false);
  };

  const handleCancel = () => {
    onCancel();
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      <StepHeader step={2} title="Ürün / Hizmetler"
        sub="Planınızdaki gelir yaratan ürün ve hizmetleri tanımlayın. Boş bırakırsanız daha sonra ekleyebilirsiniz." />

      {/* Ürün listesi */}
      {products.length > 0 && (
        <div className="space-y-2">
          {products.map((p, i) => (
            <div key={p.id} className="bg-enba-panel border border-enba-line rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="w-3 h-7 rounded-sm flex-none" style={{ background: p.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-enba-text">{p.name}</div>
                <div className="text-[11px] text-enba-dim mt-0.5">
                  {p.category} · {p.unit} · {fmtTL(p.price)}/{p.unit} · {p.volume.toLocaleString('tr-TR')} {p.unit}/ay
                </div>
              </div>
              <Badge tone="neutral">{Math.round(p.varCostRatio * 100)}% değ.maliyet</Badge>
              <button onClick={() => startEdit(p)} className="w-7 h-7 rounded-md text-enba-dim hover:text-enba-text hover:bg-enba-panel-2 inline-flex items-center justify-center">
                <I.Edit size={12} />
              </button>
              <button onClick={() => setProducts(products.filter((_, j) => j !== i))}
                className="w-7 h-7 rounded-md text-enba-dim hover:text-enba-red hover:bg-enba-red/10 inline-flex items-center justify-center">
                <I.Trash size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ürün formu */}
      {adding ? (
        <FieldCard>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded-sm" style={{ background: prodDraft.color }} />
            <span className="text-[12px] font-semibold text-enba-text">{editProd ? 'Ürünü Düzenle' : 'Yeni Ürün / Hizmet'}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Ürün / Hizmet Adı *">
              <input value={prodDraft.name} onChange={e => setProdDraft({ ...prodDraft, name: e.target.value })}
                placeholder="PET Granül Şeffaf" className={inputCls} autoFocus />
            </Field>
            <Field label="Kategori">
              <select value={prodDraft.category} onChange={e => setProdDraft({ ...prodDraft, category: e.target.value })} className={selectCls}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Birim">
              <select value={prodDraft.unit} onChange={e => setProdDraft({ ...prodDraft, unit: e.target.value })} className={selectCls}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Birim Fiyat (₺)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
                <input type="number" value={prodDraft.price} min={0}
                  onChange={e => setProdDraft({ ...prodDraft, price: Number(e.target.value) })}
                  className={cx(inputCls, 'pl-7')} />
              </div>
            </Field>
            <Field label="Aylık Hacim">
              <input type="number" value={prodDraft.volume} min={0}
                onChange={e => setProdDraft({ ...prodDraft, volume: Number(e.target.value) })}
                className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Değ. Maliyet (%)" hint="Gelirin kaçı değişken maliyete gider.">
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={100} step={1}
                  value={Math.round(prodDraft.varCostRatio * 100)}
                  onChange={e => setProdDraft({ ...prodDraft, varCostRatio: Number(e.target.value) / 100 })}
                  className="flex-1 accent-enba-orange" />
                <span className="w-10 text-right text-[13px] font-medium tabular">
                  {Math.round(prodDraft.varCostRatio * 100)}%
                </span>
              </div>
            </Field>
            <Field label="Fiyat Büyümesi (% yıllık)">
              <div className="flex items-center gap-1">
                <input type="number" value={Math.round(prodDraft.priceGrowth * 100)} min={-50} max={200} step={1}
                  onChange={e => setProdDraft({ ...prodDraft, priceGrowth: Number(e.target.value) / 100 })}
                  className={cx(inputCls, 'flex-1')} />
                <span className="text-enba-dim text-[13px]">%</span>
              </div>
            </Field>
            <Field label="Hacim Büyümesi (% yıllık)">
              <div className="flex items-center gap-1">
                <input type="number" value={Math.round(prodDraft.volumeGrowth * 100)} min={-50} max={200} step={1}
                  onChange={e => setProdDraft({ ...prodDraft, volumeGrowth: Number(e.target.value) / 100 })}
                  className={cx(inputCls, 'flex-1')} />
                <span className="text-enba-dim text-[13px]">%</span>
              </div>
            </Field>
          </div>

          <Field label="Renk">
            <div className="flex gap-2 flex-wrap">
              {PRODUCT_COLORS.map(c => (
                <button key={c} onClick={() => setProdDraft({ ...prodDraft, color: c })}
                  className={cx('w-7 h-7 rounded-md transition-all', prodDraft.color === c ? 'ring-2 ring-offset-2 ring-enba-orange ring-offset-enba-panel scale-110' : 'hover:scale-105')}
                  style={{ background: c }} />
              ))}
            </div>
          </Field>

          <div className="flex gap-2 pt-2 border-t border-enba-line">
            <button onClick={handleCancel} className="flex-none h-8 px-4 rounded-lg border border-enba-line text-[12px] text-enba-muted hover:bg-enba-panel-2">
              İptal
            </button>
            <Btn variant="primary" size="sm" onClick={handleSave} disabled={!prodDraft.name.trim()}>
              {editProd ? 'Güncelle' : 'Ekle'}
            </Btn>
          </div>
        </FieldCard>
      ) : (
        <button onClick={startAdd}
          className="w-full border-2 border-dashed border-enba-line rounded-xl h-12 flex items-center justify-center gap-2 text-[13px] text-enba-dim hover:border-enba-orange/40 hover:text-enba-muted transition-colors">
          <I.Plus size={14} /> Ürün / Hizmet Ekle
        </button>
      )}

      {products.length === 0 && !adding && (
        <p className="text-[11.5px] text-enba-dim text-center">
          Ürün eklemeden de devam edebilirsiniz — ürünleri plan açıldıktan sonra da ekleyebilirsiniz.
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Adım 3 — Sabit Giderler
══════════════════════════════════════════════════ */
interface Step3Props {
  expenses: FixedExpense[]; setExpenses: (e: FixedExpense[]) => void;
  expDraft: FixedExpense; setExpDraft: (e: FixedExpense) => void;
  editExp: FixedExpense | null; setEditExp: (e: FixedExpense | null) => void;
  onSave: () => void; onCancel: () => void;
}

function Step3({ expenses, setExpenses, expDraft, setExpDraft, editExp, setEditExp, onSave, onCancel }: Step3Props) {
  const [adding, setAdding] = useState(false);

  const startAdd = () => {
    setExpDraft(emptyExpense());
    setEditExp(null);
    setAdding(true);
  };

  const startEdit = (e: FixedExpense) => {
    setExpDraft({ ...e });
    setEditExp(e);
    setAdding(true);
  };

  const handleSave = () => {
    onSave();
    setAdding(false);
  };

  const handleCancel = () => {
    onCancel();
    setAdding(false);
  };

  const totalMonthly = expenses.reduce((s, e) => s + e.monthly, 0);

  return (
    <div className="space-y-4">
      <StepHeader step={3} title="Sabit Giderler"
        sub="Kira, personel, enerji gibi düzenli aylık giderlerinizi tanımlayın." />

      {/* Toplam banner */}
      {expenses.length > 0 && (
        <div className="bg-enba-panel border border-enba-line rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="text-[11px] text-enba-dim">{expenses.length} gider kalemi</div>
          <div className="text-[14px] font-semibold tabular">{fmtTL(totalMonthly)}<span className="text-[11px] text-enba-dim font-normal ml-1">/ ay</span></div>
        </div>
      )}

      {/* Gider listesi */}
      {expenses.length > 0 && (
        <div className="space-y-2">
          {expenses.map((e, i) => (
            <div key={e.id} className="bg-enba-panel border border-enba-line rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-enba-text">{e.name}</div>
                <div className="text-[11px] text-enba-dim mt-0.5">{e.group} · Yıllık +{Math.round(e.growth * 100)}%</div>
              </div>
              <div className="text-[14px] font-semibold tabular">{fmtTL(e.monthly)}<span className="text-[11px] text-enba-dim font-normal">/ay</span></div>
              <button onClick={() => startEdit(e)} className="w-7 h-7 rounded-md text-enba-dim hover:text-enba-text hover:bg-enba-panel-2 inline-flex items-center justify-center">
                <I.Edit size={12} />
              </button>
              <button onClick={() => setExpenses(expenses.filter((_, j) => j !== i))}
                className="w-7 h-7 rounded-md text-enba-dim hover:text-enba-red hover:bg-enba-red/10 inline-flex items-center justify-center">
                <I.Trash size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Gider formu */}
      {adding ? (
        <FieldCard>
          <span className="text-[12px] font-semibold text-enba-text">{editExp ? 'Gideri Düzenle' : 'Yeni Gider Kalemi'}</span>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Gider Adı *">
              <input value={expDraft.name} onChange={e => setExpDraft({ ...expDraft, name: e.target.value })}
                placeholder="Kira, Elektrik, Personel..." className={inputCls} autoFocus />
            </Field>
            <Field label="Grup">
              <select value={expDraft.group} onChange={e => setExpDraft({ ...expDraft, group: e.target.value })} className={selectCls}>
                <option>Sabit</option>
                <option>Yarı Değişken</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Aylık Tutar (₺)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
                <input type="number" value={expDraft.monthly} min={0}
                  onChange={e => setExpDraft({ ...expDraft, monthly: Number(e.target.value) })}
                  className={cx(inputCls, 'pl-7')} />
              </div>
            </Field>
            <Field label="Yıllık Büyüme (%)">
              <div className="flex items-center gap-1">
                <input type="number" value={Math.round(expDraft.growth * 100)} min={-20} max={200} step={1}
                  onChange={e => setExpDraft({ ...expDraft, growth: Number(e.target.value) / 100 })}
                  className={cx(inputCls, 'flex-1')} />
                <span className="text-enba-dim text-[13px]">%</span>
              </div>
            </Field>
          </div>

          <div className="flex gap-2 pt-2 border-t border-enba-line">
            <button onClick={handleCancel} className="flex-none h-8 px-4 rounded-lg border border-enba-line text-[12px] text-enba-muted hover:bg-enba-panel-2">
              İptal
            </button>
            <Btn variant="primary" size="sm" onClick={handleSave} disabled={!expDraft.name.trim()}>
              {editExp ? 'Güncelle' : 'Ekle'}
            </Btn>
          </div>
        </FieldCard>
      ) : (
        <button onClick={startAdd}
          className="w-full border-2 border-dashed border-enba-line rounded-xl h-12 flex items-center justify-center gap-2 text-[13px] text-enba-dim hover:border-enba-orange/40 hover:text-enba-muted transition-colors">
          <I.Plus size={14} /> Gider Kalemi Ekle
        </button>
      )}

      {expenses.length === 0 && !adding && (
        <p className="text-[11.5px] text-enba-dim text-center">
          Gider eklemeden de devam edebilirsiniz — daha sonra da eklenebilir.
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Adım 4 — Özet
══════════════════════════════════════════════════ */
interface Step4Props {
  title: string; startYear: number; startMonth: number;
  horizon: number; openingCash: number;
  products: Product[]; expenses: FixedExpense[];
  summary: { totRev: number; totExp: number; totEb: number } | null;
}

function Step4({ title, startYear, startMonth, horizon, openingCash, products, expenses, summary }: Step4Props) {
  return (
    <div className="space-y-5">
      <StepHeader step={4} title="Özet & Oluştur" sub="Her şey hazır. Planı oluşturduktan sonra düzenlemeye devam edebilirsiniz." />

      {/* Plan özet kartı */}
      <div className="bg-enba-panel border border-enba-line rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-enba-orange shadow-[0_0_8px] shadow-enba-orange/60" />
          <h3 className="text-[14px] font-semibold">{title || '(Adsız Plan)'}</h3>
          <Badge tone="amber">Taslak</Badge>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <InfoCell label="Dönem" value={`${MONTHS_TR[startMonth]} ${startYear}`} />
          <InfoCell label="Ufuk" value={`${horizon} ay`} />
          <InfoCell label="Açılış Nakit" value={openingCash > 0 ? fmtTL(openingCash) : '₺0'} />
        </div>
      </div>

      {/* İçerik özeti */}
      <div className="grid grid-cols-2 gap-4">
        <SumCard
          icon={<I.Revenue size={16} />}
          label="Ürün / Hizmet"
          count={products.length}
          empty="Henüz ürün eklenmedi"
          items={products.map(p => ({ name: p.name, sub: `${fmtTL(p.price)}/${p.unit}`, color: p.color }))}
        />
        <SumCard
          icon={<I.Expense size={16} />}
          label="Sabit Gider"
          count={expenses.length}
          empty="Henüz gider eklenmedi"
          items={expenses.map(e => ({ name: e.name, sub: `${fmtTL(e.monthly)}/ay` }))}
        />
      </div>

      {/* Projeksiyon önizlemesi */}
      {summary && (
        <div className="bg-enba-panel border border-enba-line rounded-xl p-5">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-dim mb-3">İlk 12 Ay Projeksiyonu (Baz Senaryo)</div>
          <div className="grid grid-cols-3 gap-4">
            <InfoCell label="Toplam Gelir" value={fmtTL(summary.totRev)} accent="orange" />
            <InfoCell label="Toplam Gider" value={fmtTL(summary.totExp)} accent="red" />
            <InfoCell label="EBITDA" value={fmtTL(summary.totEb)} accent={summary.totEb >= 0 ? 'green' : 'red'} />
          </div>
          {summary.totRev > 0 && (
            <div className="mt-3 text-[11px] text-enba-dim">
              EBITDA marjı: <span className={cx('font-semibold', summary.totEb >= 0 ? 'text-enba-green' : 'text-enba-red')}>
                {(summary.totEb / summary.totRev * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {(products.length === 0 || expenses.length === 0) && (
        <div className="border border-enba-amber/30 bg-enba-amber/5 rounded-xl px-4 py-3 text-[12px] text-enba-amber">
          {products.length === 0 && expenses.length === 0
            ? 'Ürün veya gider eklenmedi. Plan oluşturulacak, içerik daha sonra eklenebilir.'
            : products.length === 0
              ? 'Ürün eklenmedi. Gelir projeksiyon hesaplanamaz, ancak plan oluşturulabilir.'
              : 'Sabit gider eklenmedi. Giderler daha sonra eklenebilir.'}
        </div>
      )}
    </div>
  );
}

/* ── Yardımcı bileşenler ── */

function StepHeader({ step, title, sub }: { step: number; title: string; sub: string }) {
  return (
    <div className="mb-2">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-dim mb-1">Adım {step}</div>
      <h2 className="text-[20px] font-semibold text-enba-text">{title}</h2>
      <p className="text-[12.5px] text-enba-muted mt-1">{sub}</p>
    </div>
  );
}

function FieldCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-enba-panel border border-enba-line rounded-xl p-5 space-y-4">
      {children}
    </div>
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

function InfoCell({ label, value, accent }: { label: string; value: string; accent?: 'orange'|'green'|'red' }) {
  const accentCls = { orange: 'text-enba-orange', green: 'text-enba-green', red: 'text-enba-red' };
  return (
    <div>
      <div className="text-[10.5px] text-enba-dim uppercase tracking-wider mb-1">{label}</div>
      <div className={cx('text-[15px] font-semibold tabular', accent ? accentCls[accent] : 'text-enba-text')}>{value}</div>
    </div>
  );
}

function SumCard({ icon, label, count, empty, items }: {
  icon: React.ReactNode; label: string; count: number; empty: string;
  items: { name: string; sub: string; color?: string }[];
}) {
  return (
    <div className="bg-enba-panel border border-enba-line rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3 text-enba-muted text-[12px]">
        {icon}
        <span className="font-medium">{label}</span>
        <Badge tone={count > 0 ? 'orange' : 'neutral'}>{count}</Badge>
      </div>
      {items.length === 0
        ? <p className="text-[11.5px] text-enba-dim">{empty}</p>
        : <ul className="space-y-1.5">
            {items.slice(0, 5).map((it, i) => (
              <li key={i} className="flex items-center gap-2 text-[12px]">
                {it.color && <span className="w-2 h-2 rounded-sm flex-none" style={{ background: it.color }} />}
                <span className="flex-1 truncate text-enba-text">{it.name}</span>
                <span className="text-enba-dim tabular flex-none">{it.sub}</span>
              </li>
            ))}
            {items.length > 5 && <li className="text-[11px] text-enba-dim">+{items.length - 5} daha…</li>}
          </ul>
      }
    </div>
  );
}

const inputCls  = 'w-full bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2 text-[13px] text-enba-text focus:border-enba-orange/60 focus:ring-1 focus:ring-enba-orange/30 outline-none transition-colors';
const selectCls = 'w-full bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2 text-[13px] text-enba-text focus:border-enba-orange/60 focus:ring-1 focus:ring-enba-orange/30 outline-none transition-colors appearance-none';
