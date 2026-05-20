import React, { useState, useMemo, useRef } from 'react';
import { cx, I, Btn } from './DPPrimitives';
import {
  DPlan, Product, FixedExpense, ActiveProject, Facility,
  buildMonths, buildSeries, fmtTL, SCENARIOS,
} from './dpData';

/* ══════════════════════════════════════════════════════
   M-KOD VERİSİ
══════════════════════════════════════════════════════ */
export interface MCodeEntry { code: string; tr: string; }

const MCODES_FACILITY: MCodeEntry[] = [
  { code: 'M489', tr: '770.01 - M489 Brüt Personel Maaş ve Ücret Giderleri' },
  { code: 'M509', tr: '770.20 - M509 Makine, Cihaz ve Güvenlik Sistemi Bakım Onarım Giderleri' },
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

const MCODES_PROJECT_EXPENSE: MCodeEntry[] = [
  { code: 'M369', tr: '150/710 - M369 İlk Madde ve Malzeme Giderleri Toplamı' },
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
  { code: 'M605', tr: '770.06 - M605 Dışarıdan Sağlanan Personel Hizmetleri (Yönetim)' },
];

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
      <StepHeader step={1} total={3} title="Temel Bilgiler" sub="Plan adı, zaman aralığı ve başlangıç nakit bakiyesi." />
      <FieldCard>
        <Field label="Plan Adı">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="örn. 2025 Merkez Tesis Bütçesi"
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
   ADIM 2 — Sabit Gider Merkezleri
══════════════════════════════════════════════════════ */
function emptyFacilityExpense(): FixedExpense {
  return { id: crypto.randomUUID(), mcode: 'M610', costCategory: 'facility', name: '', group: 'Sabit', monthly: 0, growth: 0.10, startOffset: 0 };
}

function FacilityExpenseList({ items, setItems }: { items: FixedExpense[]; setItems: (v: FixedExpense[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft,  setDraft]  = useState<FixedExpense>(emptyFacilityExpense());
  const [editId, setEditId] = useState<string | null>(null);

  const startAdd  = () => { setDraft(emptyFacilityExpense()); setEditId(null); setAdding(true); };
  const startEdit = (item: FixedExpense) => { setDraft({ ...item }); setEditId(item.id); setAdding(true); };
  const cancel    = () => { setAdding(false); setEditId(null); };

  const save = () => {
    if (!draft.name.trim()) return;
    if (editId) setItems(items.map(i => i.id === editId ? draft : i));
    else        setItems([...items, { ...draft, id: crypto.randomUUID() }]);
    setAdding(false); setEditId(null);
  };

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className="bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2.5 flex items-center gap-3">
          <MCodeTag code={item.mcode} mcodes={MCODES_FACILITY} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-enba-text">{item.name}</div>
            <div className="text-[11px] text-enba-dim mt-0.5">
              yıllık +{Math.round(item.growth * 100)}%
              {(item.startOffset ?? 0) > 0 && <span className="ml-2 text-enba-amber">{item.startOffset! + 1}. aydan itibaren</span>}
            </div>
          </div>
          <span className="text-[13px] font-semibold tabular">{fmtTL(item.monthly)}<span className="text-[11px] text-enba-dim font-normal">/ay</span></span>
          <button onClick={() => startEdit(item)} className="w-7 h-7 rounded-md text-enba-dim hover:text-enba-text hover:bg-enba-panel inline-flex items-center justify-center">
            <I.Edit size={13} />
          </button>
          <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="w-7 h-7 rounded-md text-enba-dim hover:text-enba-red hover:bg-enba-red/10 inline-flex items-center justify-center">
            <I.Trash size={13} />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="bg-enba-panel border border-enba-line rounded-xl p-4 space-y-4">
          <MCodeSelect value={draft.mcode} onChange={v => setDraft({ ...draft, mcode: v })} mcodes={MCODES_FACILITY} label="Hesap Kodu" />
          <Field label="Gider Adı">
            <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
              placeholder="örn. Tesis Kirası" className={inputCls} />
          </Field>
          <Field label="Aylık Tutar (₺)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
              <MoneyInput value={draft.monthly} onChange={v => setDraft({ ...draft, monthly: v })} className={cx(inputCls, 'pl-7')} />
            </div>
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Yıllık Büyüme (%)">
              <div className="flex items-center gap-1.5">
                <input type="number" value={Math.round(draft.growth * 100)} min={-20} max={200} step={1}
                  onChange={e => setDraft({ ...draft, growth: Number(e.target.value) / 100 })}
                  className={cx(inputCls, 'flex-1')} />
                <span className="text-enba-dim text-[13px]">%</span>
              </div>
            </Field>
            <Field label="Başlangıç Ayı" hint="Kaçıncı ayda başlar?">
              <select value={draft.startOffset ?? 0} onChange={e => setDraft({ ...draft, startOffset: Number(e.target.value) })} className={selectCls}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i === 0 ? '1. ay (hemen)' : `${i + 1}. ay`}</option>
                ))}
              </select>
            </Field>
            <Field label="Grup">
              <select value={draft.group} onChange={e => setDraft({ ...draft, group: e.target.value })} className={selectCls}>
                <option>Sabit</option>
                <option>Yarı Değişken</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-2 pt-1 border-t border-enba-line">
            <button onClick={cancel} className="h-8 px-4 rounded-lg border border-enba-line text-[12px] text-enba-muted hover:bg-enba-panel-2">İptal</button>
            <Btn variant="primary" size="sm" onClick={save} disabled={!draft.name.trim()}>{editId ? 'Güncelle' : 'Ekle'}</Btn>
          </div>
        </div>
      ) : (
        <button onClick={startAdd}
          className="w-full border-2 border-dashed border-enba-line rounded-lg h-9 flex items-center justify-center gap-2 text-[12px] text-enba-dim hover:border-enba-orange/40 hover:text-enba-muted transition-colors">
          <I.Plus size={13} /> Gider Ekle
        </button>
      )}
    </div>
  );
}

function FacilitiesStep({ facilities, setFacilities }:
  { facilities: Facility[]; setFacilities: (v: Facility[]) => void }) {

  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');

  const totalMonthly = facilities.reduce((s, f) =>
    s + f.fixedExpenses.reduce((ss, e) => ss + e.monthly, 0), 0);

  const startRename = (f: Facility) => { setEditingNameId(f.id); setNameDraft(f.name); };
  const commitRename = (id: string) => {
    if (nameDraft.trim()) setFacilities(facilities.map(f => f.id === id ? { ...f, name: nameDraft.trim() } : f));
    setEditingNameId(null);
  };

  const updateExpenses = (id: string, expenses: FixedExpense[]) =>
    setFacilities(facilities.map(f => f.id === id ? { ...f, fixedExpenses: expenses } : f));

  const deleteFacility = (id: string) => {
    if (!window.confirm('Bu maliyet merkezi ve tüm giderleri silinecek. Emin misiniz?')) return;
    setFacilities(facilities.filter(f => f.id !== id));
  };

  const addFacility = () => {
    const newF: Facility = { id: crypto.randomUUID(), name: `Maliyet Merkezi ${facilities.length + 1}`, fixedExpenses: [] };
    setFacilities([...facilities, newF]);
    setEditingNameId(newF.id);
    setNameDraft(newF.name);
  };

  return (
    <div className="space-y-4">
      <StepHeader step={2} total={3} title="Sabit Gider Merkezleri"
        sub="Projelerden bağımsız akan giderler: kira, aidat, muhasebe, sigorta vb. Aktif projeler bu maliyeti paylaşır." />

      {totalMonthly > 0 && (
        <div className="bg-enba-panel border border-enba-line rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-[11px] text-enba-dim">
            {facilities.length} merkez · {facilities.reduce((s, f) => s + f.fixedExpenses.length, 0)} kalem
          </span>
          <span className="text-[14px] font-semibold tabular">
            {fmtTL(totalMonthly)}<span className="text-[11px] text-enba-dim font-normal ml-1">/ ay toplam</span>
          </span>
        </div>
      )}

      {facilities.map(f => {
        const fTotal = f.fixedExpenses.reduce((s, e) => s + e.monthly, 0);
        return (
          <div key={f.id} className="bg-enba-panel border border-enba-line rounded-xl overflow-hidden">
            {/* Tesis başlık */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-enba-line bg-enba-panel-2/40">
              <span className="w-2 h-2 rounded-full bg-enba-orange flex-none" />
              {editingNameId === f.id ? (
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onBlur={() => commitRename(f.id)}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(f.id); if (e.key === 'Escape') setEditingNameId(null); }}
                  className="flex-1 bg-transparent border-b border-enba-orange text-[13px] font-semibold text-enba-text outline-none py-0.5"
                />
              ) : (
                <span className="flex-1 text-[13px] font-semibold text-enba-text">{f.name}</span>
              )}
              <span className="text-[12px] text-enba-muted tabular">{fmtTL(fTotal)}/ay</span>
              <button onClick={() => startRename(f)}
                className="w-7 h-7 rounded-md text-enba-dim hover:text-enba-text hover:bg-enba-panel inline-flex items-center justify-center">
                <I.Edit size={12} />
              </button>
              {facilities.length > 1 && (
                <button onClick={() => deleteFacility(f.id)}
                  className="w-7 h-7 rounded-md text-enba-dim hover:text-enba-red hover:bg-enba-red/10 inline-flex items-center justify-center">
                  <I.Trash size={12} />
                </button>
              )}
            </div>
            {/* Gider listesi */}
            <div className="p-4">
              <FacilityExpenseList
                items={f.fixedExpenses}
                setItems={items => updateExpenses(f.id, items)}
              />
            </div>
          </div>
        );
      })}

      <button onClick={addFacility}
        className="w-full border-2 border-dashed border-enba-line rounded-xl h-11 flex items-center justify-center gap-2 text-[13px] text-enba-dim hover:border-enba-orange/40 hover:text-enba-muted transition-colors">
        <I.Plus size={14} /> Yeni Maliyet Merkezi Ekle
      </button>

      {facilities.every(f => f.fixedExpenses.length === 0) && (
        <p className="text-[11.5px] text-enba-dim text-center">
          Sabit gideri olmayan planlar da oluşturulabilir — sonradan eklenebilir.
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ADIM 3 — Projeler
══════════════════════════════════════════════════════ */
function emptyProject(idx: number, facilityId: string): ActiveProject {
  return {
    id: crypto.randomUUID(),
    facilityId,
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

function emptyProjectExpensePurchase(): FixedExpense {
  return { id: crypto.randomUUID(), mcode: 'M369', costCategory: 'purchase', name: '', group: 'Yarı Değişken', monthly: 0, growth: 0.10, startOffset: 0, unit: 'ton', unitPrice: 0, monthlyQty: 0 };
}

function emptyRevenue(idx: number): Product {
  return {
    id: crypto.randomUUID(), mcode: 'M105', name: '', category: 'Üretim', unit: 'ton',
    price: 0, priceGrowth: 0.08, seasonality: Array(12).fill(1),
    volume: 0, volumeGrowth: 0.05, varCostRatio: 0,
    color: PROJECT_COLORS[idx % PROJECT_COLORS.length],
  };
}

/* ── Proje Gider Listesi ── */
function ProjectExpenseList({ items, setItems }: { items: FixedExpense[]; setItems: (v: FixedExpense[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft,  setDraft]  = useState<FixedExpense>(emptyProjectExpense());
  const [editId, setEditId] = useState<string | null>(null);
  const isPurchase = draft.mcode === 'M369';

  const startAdd  = () => { setDraft(emptyProjectExpense()); setEditId(null); setAdding(true); };
  const startEdit = (item: FixedExpense) => { setDraft({ ...item }); setEditId(item.id); setAdding(true); };
  const cancel    = () => { setAdding(false); setEditId(null); };

  const save = () => {
    if (!draft.name.trim()) return;
    const monthly = isPurchase ? (draft.unitPrice ?? 0) * (draft.monthlyQty ?? 0) : draft.monthly;
    const item: FixedExpense = { ...draft, monthly, costCategory: isPurchase ? 'purchase' : 'production' };
    if (editId) setItems(items.map(i => i.id === editId ? item : i));
    else        setItems([...items, { ...item, id: crypto.randomUUID() }]);
    setAdding(false); setEditId(null);
  };

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2.5 flex items-center gap-3">
          <MCodeTag code={item.mcode} mcodes={MCODES_PROJECT_EXPENSE} />
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-enba-text">{item.name}</div>
            {item.costCategory === 'purchase'
              ? <div className="text-[10.5px] text-enba-dim">{item.monthlyQty} {item.unit} · {fmtTL(item.unitPrice)}/{item.unit}</div>
              : <div className="text-[10.5px] text-enba-dim">+{Math.round(item.growth * 100)}%/yıl{(item.startOffset ?? 0) > 0 ? ` · ${item.startOffset! + 1}. aydan` : ''}</div>
            }
          </div>
          <span className="text-[12.5px] font-semibold tabular text-enba-text">{fmtTL(item.monthly)}/ay</span>
          <button onClick={() => startEdit(item)} className="w-6 h-6 rounded text-enba-dim hover:text-enba-text hover:bg-enba-panel inline-flex items-center justify-center"><I.Edit size={12} /></button>
          <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="w-6 h-6 rounded text-enba-dim hover:text-enba-red inline-flex items-center justify-center"><I.Trash size={12} /></button>
        </div>
      ))}

      {adding ? (
        <div className="bg-enba-panel border border-enba-line rounded-xl p-4 space-y-3">
          <MCodeSelect value={draft.mcode} onChange={v => setDraft({ ...draft, mcode: v, costCategory: v === 'M369' ? 'purchase' : 'production' })} mcodes={MCODES_PROJECT_EXPENSE} label="Hesap Kodu" />
          <Field label="Gider Adı">
            <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
              placeholder={isPurchase ? 'örn. PET Şişe Atık Alışı' : 'örn. Üretim Personeli'} className={inputCls} />
          </Field>
          {isPurchase ? (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Birim">
                <select value={draft.unit ?? 'ton'} onChange={e => setDraft({ ...draft, unit: e.target.value })} className={selectCls}>
                  {UNITS_WEIGHT.map(u => <option key={u}>{u}</option>)}
                </select>
              </Field>
              <Field label={`Fiyat (₺/${draft.unit ?? 'ton'})`}>
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
          ) : (
            <Field label="Aylık Tutar (₺)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-enba-dim text-[13px]">₺</span>
                <MoneyInput value={draft.monthly} onChange={v => setDraft({ ...draft, monthly: v })} className={cx(inputCls, 'pl-7')} />
              </div>
            </Field>
          )}
          <div className="grid grid-cols-3 gap-3">
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
            <Field label="Grup">
              <select value={draft.group} onChange={e => setDraft({ ...draft, group: e.target.value })} className={selectCls}>
                <option>Sabit</option>
                <option>Yarı Değişken</option>
              </select>
            </Field>
          </div>
          {isPurchase && (draft.unitPrice ?? 0) > 0 && (draft.monthlyQty ?? 0) > 0 && (
            <div className="text-[12px] text-enba-muted bg-enba-panel-2 rounded-lg px-3 py-2">
              Aylık maliyet: <span className="font-semibold text-enba-text">{fmtTL((draft.unitPrice ?? 0) * (draft.monthlyQty ?? 0))}</span>
            </div>
          )}
          <div className="flex gap-2 pt-1 border-t border-enba-line">
            <button onClick={cancel} className="h-8 px-4 rounded-lg border border-enba-line text-[12px] text-enba-muted hover:bg-enba-panel-2">İptal</button>
            <Btn variant="primary" size="sm" onClick={save} disabled={!draft.name.trim()}>{editId ? 'Güncelle' : 'Ekle'}</Btn>
          </div>
        </div>
      ) : (
        <button onClick={startAdd}
          className="w-full border-2 border-dashed border-enba-line rounded-lg h-9 flex items-center justify-center gap-2 text-[12px] text-enba-dim hover:border-enba-orange/40 hover:text-enba-muted transition-colors">
          <I.Plus size={13} /> Gider Ekle
        </button>
      )}
    </div>
  );
}

/* ── Proje Gelir Listesi ── */
function ProjectRevenueList({ items, setItems, projectIdx }: { items: Product[]; setItems: (v: Product[]) => void; projectIdx: number }) {
  const [adding, setAdding] = useState(false);
  const [draft,  setDraft]  = useState<Product>(emptyRevenue(projectIdx));
  const [editId, setEditId] = useState<string | null>(null);

  const startAdd  = () => { setDraft(emptyRevenue(projectIdx)); setEditId(null); setAdding(true); };
  const startEdit = (item: Product) => { setDraft({ ...item }); setEditId(item.id); setAdding(true); };
  const cancel    = () => { setAdding(false); setEditId(null); };

  const save = () => {
    if (!draft.name.trim()) return;
    if (editId) setItems(items.map(i => i.id === editId ? draft : i));
    else        setItems([...items, { ...draft, id: crypto.randomUUID() }]);
    setAdding(false); setEditId(null);
  };

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2.5 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: item.color }} />
          <MCodeTag code={item.mcode} mcodes={MCODES_SALES} />
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-enba-text">{item.name}</div>
            <div className="text-[10.5px] text-enba-dim">{fmtTL(item.price)}/{item.unit} · {item.volume.toLocaleString('tr-TR')} {item.unit}/ay</div>
          </div>
          <span className="text-[12.5px] font-semibold tabular text-enba-orange">{fmtTL(item.price * item.volume)}/ay</span>
          <button onClick={() => startEdit(item)} className="w-6 h-6 rounded text-enba-dim hover:text-enba-text hover:bg-enba-panel inline-flex items-center justify-center"><I.Edit size={12} /></button>
          <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="w-6 h-6 rounded text-enba-dim hover:text-enba-red inline-flex items-center justify-center"><I.Trash size={12} /></button>
        </div>
      ))}

      {adding ? (
        <div className="bg-enba-panel border border-enba-line rounded-xl p-4 space-y-3">
          <MCodeSelect value={draft.mcode} onChange={v => setDraft({ ...draft, mcode: v })} mcodes={MCODES_SALES} label="Hesap Kodu" />
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
            <Btn variant="primary" size="sm" onClick={save} disabled={!draft.name.trim()}>{editId ? 'Güncelle' : 'Ekle'}</Btn>
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
type ProjectTab = 'temel' | 'giderler' | 'gelirler';

function ProjectEditor({ project, idx, horizon, facilities, onSave, onCancel }:
  { project: ActiveProject; idx: number; horizon: number; facilities: Facility[]; onSave: (p: ActiveProject) => void; onCancel: () => void }) {
  const [tab,     setTab]     = useState<ProjectTab>('temel');
  const [draft,   setDraft]   = useState<ActiveProject>({ ...project });

  const expenseTotal = draft.expenses.reduce((s, e) => s + e.monthly, 0);
  const revenueTotal = draft.revenues.reduce((s, r) => s + r.price * r.volume, 0);

  return (
    <div className="bg-enba-panel border border-enba-line rounded-xl overflow-hidden">
      {/* Proje başlık */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-enba-line" style={{ borderLeftColor: draft.color, borderLeftWidth: 4 }}>
        <span className="w-3 h-3 rounded-full flex-none" style={{ background: draft.color }} />
        <span className="text-[13px] font-semibold flex-1">{draft.name || 'Yeni Proje'}</span>
        <button onClick={onCancel} className="w-7 h-7 rounded-md text-enba-dim hover:bg-enba-panel-2 inline-flex items-center justify-center"><I.Chevron size={13} className="rotate-180" /></button>
      </div>

      {/* Sekmeler */}
      <div className="flex border-b border-enba-line bg-enba-panel-2/40">
        {(['temel','giderler','gelirler'] as ProjectTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cx('flex-1 h-9 text-[12px] font-medium capitalize transition-colors',
              tab === t ? 'text-enba-orange border-b-2 border-enba-orange bg-enba-orange/5' : 'text-enba-muted hover:text-enba-text')}>
            {t === 'temel' ? 'Temel' : t === 'giderler' ? `Giderler${draft.expenses.length > 0 ? ` (${draft.expenses.length})` : ''}` : `Gelirler${draft.revenues.length > 0 ? ` (${draft.revenues.length})` : ''}`}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {tab === 'temel' && (
          <>
            {/* Aktif / Pasif toggle */}
            <div
              className={cx(
                'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors cursor-pointer select-none',
                draft.isActive
                  ? 'bg-enba-green/8 border-enba-green/30'
                  : 'bg-enba-panel-2 border-enba-line',
              )}
              onClick={() => setDraft({ ...draft, isActive: !draft.isActive })}
            >
              <div className={cx(
                'w-9 h-5 rounded-full flex items-center transition-all relative flex-none',
                draft.isActive ? 'bg-enba-green' : 'bg-enba-dim/40',
              )}>
                <div className={cx(
                  'w-4 h-4 rounded-full bg-white shadow absolute transition-all',
                  draft.isActive ? 'left-[18px]' : 'left-[2px]',
                )} />
              </div>
              <div>
                <div className={cx('text-[13px] font-semibold', draft.isActive ? 'text-enba-green' : 'text-enba-dim')}>
                  {draft.isActive ? 'Aktif — Tesis maliyeti alıyor' : 'Pasif — Maliyet almıyor'}
                </div>
                <div className="text-[11px] text-enba-dim mt-0.5">
                  Pasif projeler tesis gideri payına girmez
                </div>
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
            {/* Tesis seçici — birden fazla tesis varsa göster */}
            {facilities.length > 1 && (
              <Field label="Bağlı Tesis">
                <select value={draft.facilityId}
                  onChange={e => setDraft({ ...draft, facilityId: e.target.value })}
                  className={selectCls}>
                  {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </Field>
            )}
            <Field label="Tesis Gideri Dağılım Ağırlığı" hint="Göreceli sayı — aynı tesisin aktif projeleriyle karşılaştırılır. (örn: 2 ve 1 → %67 / %33)">
              <input type="number" value={draft.allocationWeight} min={0.1} step={0.1}
                onChange={e => setDraft({ ...draft, allocationWeight: Number(e.target.value) })}
                className={inputCls} />
            </Field>
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

        {tab === 'giderler' && (
          <>
            <div className="text-[11.5px] text-enba-dim">Projeye özgü giderler: personel, elektrik, su, hammadde alışı vb.</div>
            <ProjectExpenseList items={draft.expenses} setItems={v => setDraft({ ...draft, expenses: v })} />
            {expenseTotal > 0 && (
              <div className="text-right text-[12px] text-enba-dim">Toplam: <span className="font-semibold text-enba-text">{fmtTL(expenseTotal)}/ay</span></div>
            )}
          </>
        )}

        {tab === 'gelirler' && (
          <>
            <div className="text-[11.5px] text-enba-dim">Bu projenin üretip sattığı ürün ve hizmetler.</div>
            <ProjectRevenueList items={draft.revenues} setItems={v => setDraft({ ...draft, revenues: v })} projectIdx={idx} />
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

/* ── Step 3 — Projeler ana görünüm ── */
function ProjectsStep({ projects, setProjects, horizon, facilities }:
  { projects: ActiveProject[]; setProjects: (v: ActiveProject[]) => void; horizon: number; facilities: Facility[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const defaultFacilityId = facilities[0]?.id ?? '';
  const activeProjects    = projects.filter(p => p.isActive);
  const totalWeight       = activeProjects.reduce((s, p) => s + p.allocationWeight, 0);

  const facilityTotals = facilities.reduce<Record<string, number>>((acc, f) => {
    acc[f.id] = f.fixedExpenses.reduce((s, e) => s + e.monthly, 0);
    return acc;
  }, {});

  const saveProject   = (updated: ActiveProject) => {
    setProjects(projects.map(p => p.id === updated.id ? updated : p));
    setEditingId(null);
  };
  const toggleActive  = (id: string) =>
    setProjects(projects.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  const addProject    = () => {
    const np = emptyProject(projects.length, defaultFacilityId);
    setProjects([...projects, np]);
    setEditingId(np.id);
  };
  const deleteProject = (id: string) => setProjects(projects.filter(p => p.id !== id));

  // Tesis bazlı dağılım özeti — her tesis için ayrı bar
  const facilityBars = facilities.map(f => {
    const fps    = activeProjects.filter(p => p.facilityId === f.id);
    const fTotal = facilityTotals[f.id] ?? 0;
    const wTotal = fps.reduce((s, p) => s + p.allocationWeight, 0);
    return { facility: f, fTotal, fps, wTotal };
  }).filter(fb => fb.fps.length > 0 || fb.fTotal > 0);

  return (
    <div className="space-y-4">
      <StepHeader step={3} total={3} title="Projeler"
        sub="Her proje kendi giderlerini ve gelirlerini taşır. Aktif projeler tesis sabit giderini ağırlığa göre paylaşır." />

      {/* Tesis dağılım özeti */}
      {facilityBars.map(({ facility, fTotal, fps, wTotal }) => fps.length > 0 && fTotal > 0 && (
        <div key={facility.id} className="bg-enba-panel border border-enba-line rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-enba-dim uppercase tracking-wider">{facility.name} · Tesis Gideri</span>
            <span className="text-[12px] font-semibold tabular">{fmtTL(fTotal)}/ay</span>
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
                <span className="text-enba-text font-medium">{p.name || 'İsimsiz'}</span>
                <span className="text-enba-dim">%{Math.round((p.allocationWeight / (wTotal || 1)) * 100)}</span>
                <span className="text-enba-dim">·</span>
                <span className="text-enba-dim">{fmtTL((p.allocationWeight / (wTotal || 1)) * fTotal)}/ay</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Proje kartları */}
      {projects.map((p, idx) => editingId === p.id ? (
        <ProjectEditor key={p.id} project={p} idx={idx} horizon={horizon} facilities={facilities}
          onSave={saveProject} onCancel={() => setEditingId(null)} />
      ) : (
        <div key={p.id}
          className={cx(
            'bg-enba-panel border rounded-xl px-4 py-3 flex items-center gap-3 transition-opacity',
            p.isActive ? 'border-enba-line' : 'border-enba-line opacity-60',
          )}
          style={{ borderLeftColor: p.color, borderLeftWidth: 4 }}>
          <span className="w-3 h-3 rounded-full flex-none" style={{ background: p.color }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-enba-text">{p.name || 'İsimsiz Proje'}</span>
              <span className={cx(
                'px-1.5 py-0.5 rounded text-[10px] font-medium',
                p.isActive ? 'bg-enba-green/15 text-enba-green' : 'bg-enba-dim/15 text-enba-dim',
              )}>
                {p.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            <div className="text-[11px] text-enba-dim mt-0.5 flex items-center gap-2">
              {facilities.length > 1 && (
                <>
                  <span>{facilities.find(f => f.id === p.facilityId)?.name ?? '—'}</span>
                  <span>·</span>
                </>
              )}
              <span>Ağırlık: {p.allocationWeight}</span>
              <span>·</span>
              <span>{p.startOffset + 1}. ay{p.endOffset ? ` – ${p.endOffset}. ay` : ' → son'}</span>
              <span>·</span>
              <span>{p.expenses.length} gider, {p.revenues.length} ürün</span>
            </div>
          </div>
          {/* Aktif toggle */}
          <button
            onClick={() => toggleActive(p.id)}
            title={p.isActive ? 'Pasife al' : 'Aktife al'}
            className={cx(
              'w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors',
              p.isActive
                ? 'text-enba-green bg-enba-green/10 hover:bg-enba-green/20'
                : 'text-enba-dim bg-enba-panel-2 hover:text-enba-green hover:bg-enba-green/10',
            )}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="4" width="14" height="8" rx="4" fill="currentColor" opacity={p.isActive ? '1' : '0.3'} />
              <circle cx={p.isActive ? '11' : '5'} cy="8" r="3" fill="white" className="transition-all" />
            </svg>
          </button>
          <button onClick={() => setEditingId(p.id)}
            className="w-8 h-8 rounded-lg text-enba-dim hover:text-enba-orange hover:bg-enba-orange/10 inline-flex items-center justify-center">
            <I.Edit size={14} />
          </button>
          <button onClick={() => deleteProject(p.id)}
            className="w-8 h-8 rounded-lg text-enba-dim hover:text-enba-red hover:bg-enba-red/10 inline-flex items-center justify-center">
            <I.Trash size={14} />
          </button>
        </div>
      ))}

      {editingId === null && (
        <button onClick={addProject}
          className="w-full border-2 border-dashed border-enba-line rounded-xl h-11 flex items-center justify-center gap-2 text-[13px] text-enba-dim hover:border-enba-orange/40 hover:text-enba-muted transition-colors">
          <I.Plus size={14} /> Proje Ekle
        </button>
      )}

      {projects.length === 0 && (
        <p className="text-[11.5px] text-enba-dim text-center">
          En az bir proje tanımlamanız önerilir — sonradan da eklenebilir.
        </p>
      )}

      {projects.length > 0 && activeProjects.length === 0 && (
        <div className="text-[11.5px] text-enba-amber text-center bg-enba-amber/8 border border-enba-amber/20 rounded-lg py-2 px-3">
          Tüm projeler pasif — tesis maliyeti hiçbir projeye dağıtılmıyor.
        </div>
      )}

      {activeProjects.length > 0 && (
        <div className="text-[11px] text-enba-dim text-center">
          {activeProjects.length} aktif proje · toplam ağırlık {totalWeight}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ANA SIHIRBAZ
══════════════════════════════════════════════════════ */
type WStep = 1 | 2 | 3;
const STEPS = [
  { n: 1 as WStep, label: 'Temel Bilgiler' },
  { n: 2 as WStep, label: 'Tesis Giderleri' },
  { n: 3 as WStep, label: 'Projeler' },
];

interface Props {
  onDone:       (plan: DPlan) => void;
  onCancel:     () => void;
  onSave?:      (plan: DPlan) => void;
  initialPlan?: DPlan;
}

export function DPlanWizard({ onDone, onCancel, onSave, initialPlan }: Props) {
  const planId = useRef<string>(initialPlan?.id ?? crypto.randomUUID());
  const [step,  setStep]  = useState<WStep>(1);
  const [saved, setSaved] = useState(false);

  /* Adım 1 */
  const [title,       setTitle]       = useState(initialPlan?.title ?? '');
  const [startYear,   setStartYear]   = useState(initialPlan?.startYear ?? new Date().getFullYear());
  const [startMonth,  setStartMonth]  = useState(initialPlan?.startMonth ?? 0);
  const [horizon,     setHorizon]     = useState(initialPlan?.horizon ?? 24);
  const [openingCash, setOpeningCash] = useState(initialPlan?.openingCash ?? 0);

  /* Adım 2 */
  const [facilities, setFacilities] = useState<Facility[]>(() => {
    if (initialPlan?.facilities?.length) return initialPlan.facilities;
    // Eski format fallback
    const raw = initialPlan as (typeof initialPlan & { facilityExpenses?: FixedExpense[] });
    const facilityId = crypto.randomUUID();
    return [{ id: facilityId, name: 'Tesis', fixedExpenses: raw?.facilityExpenses ?? [] }];
  });

  /* Adım 3 */
  const [projects, setProjects] = useState<ActiveProject[]>(() => {
    const fid = initialPlan?.facilities?.[0]?.id ?? facilities[0]?.id ?? '';
    return (initialPlan?.projects ?? []).map(p => ({
      ...p,
      facilityId: (p as ActiveProject & { facilityId?: string }).facilityId ?? fid,
      isActive:   (p as ActiveProject & { isActive?: boolean }).isActive ?? true,
    }));
  });

  /* Önizleme (adım 3) */
  const preview = useMemo(() => {
    const allProducts  = projects.flatMap(p => p.revenues);
    const allFacilityExp = facilities.flatMap(f => f.fixedExpenses);
    const allExpenses  = [
      ...allFacilityExp,
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
  }, [projects, facilities, startYear, startMonth]);

  const next = () => { setSaved(false); setStep(s => Math.min(3, s + 1) as WStep); };
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
    facilities,
    projects,
    cashEvents:     initialPlan?.cashEvents ?? [],
  });

  const handleSave = () => {
    onSave?.(buildPlan('draft'));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const finish = () => onDone(buildPlan(initialPlan?.status ?? 'draft'));

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

        {/* Önizleme özeti */}
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
            <div className="h-full bg-enba-orange rounded-full transition-all" style={{ width: `${((step - 1) / 2) * 100}%` }} />
          </div>
          <div className="text-[10px] text-enba-dim mt-1.5">Adım {step} / 3</div>
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
              <FacilitiesStep facilities={facilities} setFacilities={setFacilities} />
            )}
            {step === 3 && (
              <ProjectsStep
                projects={projects} setProjects={setProjects}
                horizon={horizon} facilities={facilities}
              />
            )}
          </div>
        </div>

        {/* Footer */}
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
            {step < 3
              ? <Btn variant="primary" size="md" disabled={step === 1 && !title.trim()} onClick={next}>
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
