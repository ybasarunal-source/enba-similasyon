/**
 * Stock — Stok Yönetimi
 * DetailedPlan design language ile sıfırdan yazıldı.
 * - Sol sidebar + sağ içerik alanı
 * - Alış / Satış için sağ-drawer form
 * - Tüm sub-component'ler modül seviyesinde tanımlı (focus kayması yok)
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  DataService, StockRecord, SalesRecord,
  SharedContact, SharedContactsService,
  StockItem, StockItemsService,
} from '../api/dataService';
import {
  Package, ArrowDownToLine, ArrowUpFromLine, BarChart3,
  Plus, Pencil, Trash2, X, Check, AlertTriangle,
  Truck, Users, Tag,
  type LucideIcon,
} from 'lucide-react';

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
const cx = (...cls: (string | false | null | undefined)[]) => cls.filter(Boolean).join(' ');
const todayIso = () => new Date().toISOString().slice(0, 10);
const tarihFmt = (iso: string) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};
const ayFmt = (iso: string) => {
  if (!iso) return '—';
  const [y, m] = iso.split('-');
  const AYLAR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  return `${AYLAR[parseInt(m, 10) - 1]} ${y}`;
};
const fmtTL = (n: number) =>
  isFinite(n) ? '₺' + Math.round(n).toLocaleString('tr-TR') : '—';
const fmtKg = (n: number, d = 0) =>
  isFinite(n) ? n.toLocaleString('tr-TR', { maximumFractionDigits: d }) + ' kg' : '—';

// ─── Sabitler ─────────────────────────────────────────────────────────────────
const HAMMADDE_TURLERI = [
  'Plastik (PET)', 'Plastik (HDPE)', 'Plastik (PP)', 'Plastik (PVC)',
  'Metal (Demir)', 'Metal (Alüminyum)', 'Metal (Bakır)',
  'Kağıt / Karton', 'Cam', 'Tekstil', 'Elektronik Atık', 'Diğer',
];
const MAMUL_TURLERI = [
  'Plastik Granül', 'Metal Balya', 'Kağıt Balya', 'Cam Kırığı',
  'Tekstil Balya', 'İşlenmiş Ürün', 'Diğer',
];

/** Alış/Satış formlarındaki dropdown listelerinden üretilen varsayılan stok kalemleri. */
const DEFAULT_STOCK_ITEMS: Omit<StockItem, 'id'>[] = [
  ...HAMMADDE_TURLERI.filter(t => t !== 'Diğer').map((name, i) => ({
    code: `HM-${String(i + 1).padStart(3, '0')}`,
    name,
    unit: 'kg',
    category: 'Hammadde',
  })),
  ...MAMUL_TURLERI.filter(t => t !== 'Diğer').map((name, i) => ({
    code: `MM-${String(i + 1).padStart(3, '0')}`,
    name,
    unit: 'kg',
    category: 'Mamul',
  })),
];

type ViewId = 'alis' | 'satis' | 'stok' | 'raporlar' | 'kalemler' | 'tedarikciler' | 'musteriler';

const NAV_GROUPS: { label: string; items: { id: ViewId; label: string; Icon: LucideIcon }[] }[] = [
  { label: 'İşlemler', items: [
    { id: 'alis',     label: 'Hammadde Alış', Icon: ArrowDownToLine },
    { id: 'satis',    label: 'Satış / Çıkış', Icon: ArrowUpFromLine },
  ]},
  { label: 'Takip', items: [
    { id: 'stok',     label: 'Stok Durumu',   Icon: Package },
    { id: 'raporlar', label: 'Raporlar',       Icon: BarChart3 },
  ]},
  { label: 'Tanımlar', items: [
    { id: 'kalemler',     label: 'Stok Kalemleri', Icon: Tag },
    { id: 'tedarikciler', label: 'Tedarikçiler',   Icon: Truck },
    { id: 'musteriler',   label: 'Müşteriler',     Icon: Users },
  ]},
];

type AlisForm = Omit<StockRecord, 'id'>;
type SatisForm = Omit<SalesRecord, 'id'>;

const emptyAlis = (): AlisForm => ({
  tarih: todayIso(), tedarikciAdi: '', hammaddeTuru: '',
  brutMiktar: 0, netMiktar: 0, alisFiyati: 0, nakliyeBedeli: 0,
  ymFire: 0, nemFire: 0, notlar: '',
});
const emptySatis = (): SatisForm => ({
  tarih: todayIso(), musteriAdi: '', stokTuru: 'hammadde',
  hammadde_turu: '', mamul_turu: '', miktar: 0,
  satisFiyati: 0, nakliyeBedeli: 0, notlar: '',
});

// ─── Temel UI bileşenleri ─────────────────────────────────────────────────────
const inputCls = [
  'h-9 px-3 rounded-lg border border-enba-line bg-enba-panel-2',
  'text-[13px] text-enba-text placeholder-enba-dim',
  'outline-none focus:border-enba-orange/60 focus:ring-2 focus:ring-enba-orange/10',
  'transition-colors w-full',
].join(' ');

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-enba-muted uppercase tracking-[0.1em]">{label}</label>
      {children}
    </div>
  );
}

function CalcRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10.5px] text-enba-dim mb-0.5">{label}</div>
      <div className={cx('text-[14px] font-semibold', accent ? 'text-enba-orange' : 'text-enba-text')}>{value}</div>
    </div>
  );
}

function KpiCard({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className="bg-enba-panel border border-enba-line rounded-xl p-4">
      <div className="text-[10.5px] uppercase tracking-[0.12em] text-enba-dim mb-1">{label}</div>
      <div className={cx('text-[22px] font-semibold leading-none', accent ? 'text-enba-orange' : 'text-enba-text')}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-enba-muted mt-1">{sub}</div>}
    </div>
  );
}

function Drawer({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose}/>}
      <div className={cx(
        'fixed inset-y-0 right-0 w-[500px] bg-enba-panel border-l border-enba-line flex flex-col z-50 transition-transform duration-200',
        open ? 'translate-x-0 shadow-2xl' : 'translate-x-full',
      )}>
        <div className="flex items-center px-5 h-[60px] border-b border-enba-line flex-none gap-3">
          <h2 className="text-[14px] font-semibold text-enba-text flex-1">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg text-enba-muted hover:text-enba-text hover:bg-enba-panel-2 inline-flex items-center justify-center">
            <X size={14}/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
      </div>
    </>
  );
}

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onCancel}>
      <div className="bg-enba-panel border border-enba-line rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-enba-red/10 flex items-center justify-center flex-none">
            <AlertTriangle size={18} className="text-enba-red"/>
          </div>
          <div>
            <div className="text-[13px] font-semibold text-enba-text">Kaydı Sil</div>
            <div className="text-[11.5px] text-enba-dim">Bu işlem geri alınamaz.</div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onConfirm}
            className="flex-1 h-9 bg-enba-red text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity">
            Evet, Sil
          </button>
          <button onClick={onCancel}
            className="flex-1 h-9 border border-enba-line text-enba-muted text-[13px] rounded-lg hover:bg-enba-panel-2 transition-colors">
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Alış Formu ───────────────────────────────────────────────────────────────
interface AlisFormProps {
  form: AlisForm;
  onChange: (f: AlisForm) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  tedarikciler: SharedContact[];
  editingId: string | null;
}

function AlisFormFields({ form, onChange, onSave, onCancel, loading, tedarikciler, editingId }: AlisFormProps) {
  const set = <K extends keyof AlisForm>(k: K) => (v: AlisForm[K]) => onChange({ ...form, [k]: v });
  const num = <K extends keyof AlisForm>(k: K) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...form, [k]: Number(e.target.value) as AlisForm[K] });

  const brut = Number(form.brutMiktar) || 0;
  const ym   = Number(form.ymFire) || 0;
  const nem  = Number(form.nemFire) || 0;
  const fiyat = Number(form.alisFiyati) || 0;
  const nak   = Number(form.nakliyeBedeli) || 0;
  const net   = brut * (1 - ym / 100) * (1 - nem / 100);
  const bm    = net > 0 ? (brut * fiyat + nak) / net : 0;
  const canSave = !!form.tedarikciAdi.trim() && brut > 0 && fiyat > 0;

  return (
    <>
      <datalist id="ted-dl">{tedarikciler.map(t => <option key={t.id} value={t.name}/>)}</datalist>
      <datalist id="ham-dl">{HAMMADDE_TURLERI.map(h => <option key={h} value={h}/>)}</datalist>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tarih">
          <input type="date" className={inputCls} value={form.tarih} onChange={e => set('tarih')(e.target.value)}/>
        </Field>
        <Field label="Tedarikçi *">
          <input type="text" autoComplete="off" list="ted-dl" className={inputCls} placeholder="Tedarikçi adı..."
            value={form.tedarikciAdi} onChange={e => set('tedarikciAdi')(e.target.value)}/>
        </Field>
        <Field label="Hammadde Türü">
          <input type="text" autoComplete="off" list="ham-dl" className={inputCls} placeholder="Tür seçin..."
            value={form.hammaddeTuru} onChange={e => set('hammaddeTuru')(e.target.value)}/>
        </Field>
        <Field label="Brüt Miktar (kg) *">
          <input type="number" min="0" className={inputCls} placeholder="0"
            value={form.brutMiktar || ''} onChange={num('brutMiktar')}/>
        </Field>
        <Field label="YM Fire (%)">
          <input type="number" min="0" max="100" step="0.1" className={inputCls} placeholder="0"
            value={form.ymFire || ''} onChange={num('ymFire')}/>
        </Field>
        <Field label="Nem Fire (%)">
          <input type="number" min="0" max="100" step="0.1" className={inputCls} placeholder="0"
            value={form.nemFire || ''} onChange={num('nemFire')}/>
        </Field>
        <Field label="Alış Fiyatı (₺/kg) *">
          <input type="number" min="0" step="0.01" className={inputCls} placeholder="0.00"
            value={form.alisFiyati || ''} onChange={num('alisFiyati')}/>
        </Field>
        <Field label="Nakliye (₺)">
          <input type="number" min="0" className={inputCls} placeholder="0"
            value={form.nakliyeBedeli || ''} onChange={num('nakliyeBedeli')}/>
        </Field>
      </div>
      <Field label="Notlar">
        <input type="text" className={inputCls} placeholder="..."
          value={form.notlar || ''} onChange={e => set('notlar')(e.target.value)}/>
      </Field>

      {brut > 0 && (
        <div className="p-4 bg-enba-orange/8 rounded-xl border border-enba-orange/20 grid grid-cols-2 gap-4">
          <CalcRow label="Net Kabul (kg)"
            value={net.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}/>
          <CalcRow label="Toplam Fire"
            value={(brut > 0 ? (100 - net / brut * 100) : 0).toFixed(1) + '%'}/>
          <CalcRow label="₺/kg (nakliye dahil)" value={bm.toFixed(2)}/>
          <CalcRow label="Toplam Maliyet" value={fmtTL(net * bm)} accent/>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={!canSave || loading}
          className="flex-1 h-10 bg-enba-orange text-white text-[13px] font-semibold rounded-lg hover:bg-enba-orange/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
          <Check size={14}/>{editingId ? 'Güncelle' : 'Kaydet'}
        </button>
        <button onClick={onCancel}
          className="h-10 px-4 border border-enba-line text-[13px] text-enba-muted rounded-lg hover:bg-enba-panel-2 transition-colors">
          İptal
        </button>
      </div>
    </>
  );
}

// ─── Satış Formu ──────────────────────────────────────────────────────────────
interface SatisFormProps {
  form: SatisForm;
  onChange: (f: SatisForm) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  musteriler: SharedContact[];
  editingId: string | null;
}

function SatisFormFields({ form, onChange, onSave, onCancel, loading, musteriler, editingId }: SatisFormProps) {
  const set = <K extends keyof SatisForm>(k: K) => (v: SatisForm[K]) => onChange({ ...form, [k]: v });
  const num = <K extends keyof SatisForm>(k: K) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...form, [k]: Number(e.target.value) as SatisForm[K] });

  const kg     = Number(form.miktar) || 0;
  const fiyat  = Number(form.satisFiyati) || 0;
  const nak    = Number(form.nakliyeBedeli) || 0;
  const brut   = kg * fiyat;
  const net    = brut - nak;
  const canSave = !!form.musteriAdi.trim() && kg > 0 && fiyat > 0;

  return (
    <>
      <datalist id="mus-dl">{musteriler.map(m => <option key={m.id} value={m.name}/>)}</datalist>
      <datalist id="ham-dl2">{HAMMADDE_TURLERI.map(h => <option key={h} value={h}/>)}</datalist>
      <datalist id="mam-dl">{MAMUL_TURLERI.map(m => <option key={m} value={m}/>)}</datalist>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tarih">
          <input type="date" className={inputCls} value={form.tarih} onChange={e => set('tarih')(e.target.value)}/>
        </Field>
        <Field label="Müşteri *">
          <input type="text" autoComplete="off" list="mus-dl" className={inputCls} placeholder="Müşteri adı..."
            value={form.musteriAdi} onChange={e => set('musteriAdi')(e.target.value)}/>
        </Field>
        <Field label="Ürün Tipi">
          <select className={inputCls} value={form.stokTuru}
            onChange={e => set('stokTuru')(e.target.value)}>
            <option value="hammadde">Hammadde</option>
            <option value="mamul">Mamül Ürün</option>
          </select>
        </Field>
        <Field label={form.stokTuru === 'hammadde' ? 'Hammadde Türü' : 'Mamül Türü'}>
          <input type="text"
            list={form.stokTuru === 'hammadde' ? 'ham-dl2' : 'mam-dl'}
            className={inputCls} placeholder="Tür..."
            value={form.stokTuru === 'hammadde' ? (form.hammadde_turu || '') : (form.mamul_turu || '')}
            onChange={e => form.stokTuru === 'hammadde'
              ? set('hammadde_turu')(e.target.value)
              : set('mamul_turu')(e.target.value)
            }/>
        </Field>
        <Field label="Miktar (kg) *">
          <input type="number" min="0" className={inputCls} placeholder="0"
            value={form.miktar || ''} onChange={num('miktar')}/>
        </Field>
        <Field label="Satış Fiyatı (₺/kg) *">
          <input type="number" min="0" step="0.01" className={inputCls} placeholder="0.00"
            value={form.satisFiyati || ''} onChange={num('satisFiyati')}/>
        </Field>
        <Field label="Nakliye (₺)">
          <input type="number" min="0" className={inputCls} placeholder="0"
            value={form.nakliyeBedeli || ''} onChange={num('nakliyeBedeli')}/>
        </Field>
        <Field label="Notlar">
          <input type="text" className={inputCls} placeholder="..."
            value={form.notlar || ''} onChange={e => set('notlar')(e.target.value)}/>
        </Field>
      </div>

      {kg > 0 && fiyat > 0 && (
        <div className="p-4 bg-enba-orange/8 rounded-xl border border-enba-orange/20 grid grid-cols-2 gap-4">
          <CalcRow label="Brüt Satış Tutarı" value={fmtTL(brut)}/>
          <CalcRow label="Net Gelir (nakliye düşük)" value={fmtTL(net)} accent/>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={!canSave || loading}
          className="flex-1 h-10 bg-enba-orange text-white text-[13px] font-semibold rounded-lg hover:bg-enba-orange/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
          <Check size={14}/>{editingId ? 'Güncelle' : 'Kaydet'}
        </button>
        <button onClick={onCancel}
          className="h-10 px-4 border border-enba-line text-[13px] text-enba-muted rounded-lg hover:bg-enba-panel-2 transition-colors">
          İptal
        </button>
      </div>
    </>
  );
}

// ─── Ortak tablo satır stili ──────────────────────────────────────────────────
const th = 'px-3 py-2.5 text-left text-[11px] font-medium text-enba-dim bg-enba-panel-2/60 border-b border-enba-line whitespace-nowrap';
const thR = th + ' text-right';
const td = 'px-3 py-3 text-[12.5px] text-enba-text border-b border-enba-line';
const tdR = td + ' text-right tabular-nums';

function TableEmpty({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center text-[12px] text-enba-dim italic">{label}</td>
    </tr>
  );
}

// ─── Alış Paneli ─────────────────────────────────────────────────────────────
interface AlisPanelProps {
  alislar: StockRecord[];
  tedarikciler: SharedContact[];
  loading: boolean;
  onInsert: (f: AlisForm) => Promise<void>;
  onUpdate: (id: string, f: AlisForm) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function AlisPanel({ alislar, tedarikciler, loading, onInsert, onUpdate, onDelete }: AlisPanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm]             = useState<AlisForm>(emptyAlis());
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [filtre, setFiltre]         = useState({ ted: '', tur: '', bas: '', bit: '' });

  const filtreli = useMemo(() => alislar.filter(a => {
    if (filtre.ted && !a.tedarikciAdi.toLowerCase().includes(filtre.ted.toLowerCase())) return false;
    if (filtre.tur && a.hammaddeTuru !== filtre.tur) return false;
    if (filtre.bas && a.tarih < filtre.bas) return false;
    if (filtre.bit && a.tarih > filtre.bit) return false;
    return true;
  }), [alislar, filtre]);

  const topNet = filtreli.reduce((s, a) => s + (Number(a.netMiktar) || 0), 0);
  const topMal = filtreli.reduce((s, a) => s + (Number(a.netMiktar) || 0) * (Number(a.birimMaliyet) || 0), 0);

  const openNew = () => { setForm(emptyAlis()); setEditingId(null); setDrawerOpen(true); };
  const openEdit = (a: StockRecord) => {
    setForm({ ...a, ymFire: a.ymFire ?? 0, nemFire: a.nemFire ?? 0, notlar: a.notlar ?? '' });
    setEditingId(a.id!);
    setDrawerOpen(true);
  };
  const closeDrawer = () => { setDrawerOpen(false); setEditingId(null); };
  const save = async () => {
    const brut = Number(form.brutMiktar) || 0;
    const ym = Number(form.ymFire) || 0;
    const nem = Number(form.nemFire) || 0;
    const netMiktar = brut * (1 - ym / 100) * (1 - nem / 100);
    const birimMaliyet = netMiktar > 0 ? (brut * (Number(form.alisFiyati) || 0) + (Number(form.nakliyeBedeli) || 0)) / netMiktar : 0;
    const payload = { ...form, netMiktar, birimMaliyet };
    if (editingId) await onUpdate(editingId, payload);
    else await onInsert(payload);
    closeDrawer();
  };

  const hasFilter = !!(filtre.ted || filtre.tur || filtre.bas || filtre.bit);

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto p-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-none">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-enba-dim mb-0.5">Hammadde</div>
          <h2 className="text-[15px] font-semibold text-enba-text">Alış Kayıtları</h2>
        </div>
        <button onClick={openNew}
          className="h-9 px-4 bg-enba-orange text-white text-[13px] font-semibold rounded-lg hover:bg-enba-orange/90 transition-colors flex items-center gap-2">
          <Plus size={14}/> Yeni Alış
        </button>
      </div>

      {/* KPI satırı */}
      <div className="grid grid-cols-3 gap-3 flex-none">
        <KpiCard label="Toplam Kayıt" value={String(filtreli.length)} sub="filtrelenmiş"/>
        <KpiCard label="Net Kabul" value={fmtKg(topNet, 0)} accent/>
        <KpiCard label="Toplam Maliyet" value={fmtTL(topMal)}/>
      </div>

      {/* Filtre */}
      <div className="flex flex-wrap items-center gap-2 flex-none">
        <input className="h-8 px-3 rounded-lg border border-enba-line bg-enba-panel text-[12.5px] text-enba-text placeholder-enba-dim outline-none focus:border-enba-orange/60 w-44"
          placeholder="Tedarikçi ara..."
          value={filtre.ted} onChange={e => setFiltre(f => ({ ...f, ted: e.target.value }))}/>
        <select className="h-8 px-2 rounded-lg border border-enba-line bg-enba-panel text-[12.5px] text-enba-text outline-none focus:border-enba-orange/60"
          value={filtre.tur} onChange={e => setFiltre(f => ({ ...f, tur: e.target.value }))}>
          <option value="">Tüm türler</option>
          {HAMMADDE_TURLERI.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="date" className="h-8 px-2 rounded-lg border border-enba-line bg-enba-panel text-[12.5px] text-enba-text outline-none"
          value={filtre.bas} onChange={e => setFiltre(f => ({ ...f, bas: e.target.value }))}/>
        <span className="text-enba-dim text-[11px]">—</span>
        <input type="date" className="h-8 px-2 rounded-lg border border-enba-line bg-enba-panel text-[12.5px] text-enba-text outline-none"
          value={filtre.bit} onChange={e => setFiltre(f => ({ ...f, bit: e.target.value }))}/>
        {hasFilter && (
          <button onClick={() => setFiltre({ ted: '', tur: '', bas: '', bit: '' })}
            className="h-8 px-3 text-[12px] text-enba-muted border border-enba-line rounded-lg hover:bg-enba-panel-2 transition-colors flex items-center gap-1">
            <X size={12}/> Temizle
          </button>
        )}
      </div>

      {/* Tablo */}
      <div className="bg-enba-panel border border-enba-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Tarih</th>
                <th className={th}>Tedarikçi</th>
                <th className={th}>Hammadde</th>
                <th className={thR}>Brüt kg</th>
                <th className={thR}>Fire</th>
                <th className={thR}>Net kg</th>
                <th className={thR}>₺/kg</th>
                <th className={thR}>Birim Mal.</th>
                <th className={thR}>Toplam ₺</th>
                <th className={th}>Notlar</th>
                <th className={th}/>
              </tr>
            </thead>
            <tbody>
              {filtreli.length === 0
                ? <TableEmpty colSpan={11} label="Alış kaydı bulunamadı"/>
                : filtreli.map(a => {
                  const net = Number(a.netMiktar) || 0;
                  const bm  = Number(a.birimMaliyet) || 0;
                  const ymF = Number(a.ymFire) || 0;
                  const nmF = Number(a.nemFire) || 0;
                  return (
                    <tr key={a.id} className="group hover:bg-enba-panel-2/40 transition-colors">
                      <td className={td + ' text-enba-muted whitespace-nowrap'}>{tarihFmt(a.tarih)}</td>
                      <td className={td + ' font-medium'}>{a.tedarikciAdi}</td>
                      <td className={td + ' text-enba-muted'}>{a.hammaddeTuru || '—'}</td>
                      <td className={tdR}>{(Number(a.brutMiktar)||0).toLocaleString('tr-TR', {maximumFractionDigits:0})}</td>
                      <td className={tdR + ' text-enba-amber/80'}>
                        {(ymF + nmF) > 0 ? `${(ymF + nmF).toFixed(1)}%` : '—'}
                      </td>
                      <td className={tdR + ' font-semibold text-enba-green'}>{net.toLocaleString('tr-TR', {maximumFractionDigits:0})}</td>
                      <td className={tdR}>{(Number(a.alisFiyati)||0).toFixed(2)}</td>
                      <td className={tdR + ' font-semibold'}>{bm.toFixed(2)}</td>
                      <td className={tdR + ' text-enba-orange font-semibold'}>{fmtTL(net * bm)}</td>
                      <td className={td + ' text-enba-dim max-w-[100px] truncate'}>{a.notlar || '—'}</td>
                      <td className={td + ' opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'}>
                        <button onClick={() => openEdit(a)}
                          className="p-1.5 text-enba-dim hover:text-enba-orange rounded-lg transition-colors mr-1">
                          <Pencil size={13}/>
                        </button>
                        <button onClick={() => setDeleteId(a.id!)}
                          className="p-1.5 text-enba-dim hover:text-enba-red rounded-lg transition-colors">
                          <Trash2 size={13}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={closeDrawer}
        title={editingId ? 'Alış Kaydını Düzenle' : 'Yeni Alış Kaydı'}>
        <AlisFormFields form={form} onChange={setForm} onSave={save} onCancel={closeDrawer}
          loading={loading} tedarikciler={tedarikciler} editingId={editingId}/>
      </Drawer>

      {deleteId && (
        <DeleteConfirm
          onConfirm={async () => { await onDelete(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}/>
      )}
    </div>
  );
}

// ─── Satış Paneli ─────────────────────────────────────────────────────────────
interface SatisPanelProps {
  satislar: SalesRecord[];
  musteriler: SharedContact[];
  loading: boolean;
  onInsert: (f: SatisForm) => Promise<void>;
  onUpdate: (id: string, f: SatisForm) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function SatisPanel({ satislar, musteriler, loading, onInsert, onUpdate, onDelete }: SatisPanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm]             = useState<SatisForm>(emptySatis());
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [filtre, setFiltre]         = useState({ mus: '', bas: '', bit: '' });

  const filtreli = useMemo(() => satislar.filter(s => {
    if (filtre.mus && !s.musteriAdi.toLowerCase().includes(filtre.mus.toLowerCase())) return false;
    if (filtre.bas && s.tarih < filtre.bas) return false;
    if (filtre.bit && s.tarih > filtre.bit) return false;
    return true;
  }), [satislar, filtre]);

  const topKg  = filtreli.reduce((s, a) => s + (Number(a.miktar) || 0), 0);
  const topNet = filtreli.reduce((s, a) => s + (Number(a.miktar)||0)*(Number(a.satisFiyati)||0)-(Number(a.nakliyeBedeli)||0), 0);

  const openNew = () => { setForm(emptySatis()); setEditingId(null); setDrawerOpen(true); };
  const openEdit = (s: SalesRecord) => { setForm({ ...s, notlar: s.notlar ?? '' }); setEditingId(s.id!); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setEditingId(null); };
  const save = async () => {
    if (editingId) await onUpdate(editingId, form);
    else await onInsert(form);
    closeDrawer();
  };

  const hasFilter = !!(filtre.mus || filtre.bas || filtre.bit);

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto p-5">
      <div className="flex items-center justify-between flex-none">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-enba-dim mb-0.5">Hammadde / Mamül</div>
          <h2 className="text-[15px] font-semibold text-enba-text">Satış Kayıtları</h2>
        </div>
        <button onClick={openNew}
          className="h-9 px-4 bg-enba-orange text-white text-[13px] font-semibold rounded-lg hover:bg-enba-orange/90 transition-colors flex items-center gap-2">
          <Plus size={14}/> Yeni Satış
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 flex-none">
        <KpiCard label="Toplam Kayıt" value={String(filtreli.length)} sub="filtrelenmiş"/>
        <KpiCard label="Toplam Miktar" value={fmtKg(topKg, 0)} accent/>
        <KpiCard label="Net Gelir" value={fmtTL(topNet)}/>
      </div>

      <div className="flex flex-wrap items-center gap-2 flex-none">
        <input className="h-8 px-3 rounded-lg border border-enba-line bg-enba-panel text-[12.5px] text-enba-text placeholder-enba-dim outline-none focus:border-enba-orange/60 w-44"
          placeholder="Müşteri ara..."
          value={filtre.mus} onChange={e => setFiltre(f => ({ ...f, mus: e.target.value }))}/>
        <input type="date" className="h-8 px-2 rounded-lg border border-enba-line bg-enba-panel text-[12.5px] text-enba-text outline-none"
          value={filtre.bas} onChange={e => setFiltre(f => ({ ...f, bas: e.target.value }))}/>
        <span className="text-enba-dim text-[11px]">—</span>
        <input type="date" className="h-8 px-2 rounded-lg border border-enba-line bg-enba-panel text-[12.5px] text-enba-text outline-none"
          value={filtre.bit} onChange={e => setFiltre(f => ({ ...f, bit: e.target.value }))}/>
        {hasFilter && (
          <button onClick={() => setFiltre({ mus: '', bas: '', bit: '' })}
            className="h-8 px-3 text-[12px] text-enba-muted border border-enba-line rounded-lg hover:bg-enba-panel-2 transition-colors flex items-center gap-1">
            <X size={12}/> Temizle
          </button>
        )}
      </div>

      <div className="bg-enba-panel border border-enba-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Tarih</th>
                <th className={th}>Müşteri</th>
                <th className={th}>Tip</th>
                <th className={th}>Ürün</th>
                <th className={thR}>Miktar kg</th>
                <th className={thR}>₺/kg</th>
                <th className={thR}>Nakliye</th>
                <th className={thR}>Net Gelir</th>
                <th className={th}>Notlar</th>
                <th className={th}/>
              </tr>
            </thead>
            <tbody>
              {filtreli.length === 0
                ? <TableEmpty colSpan={10} label="Satış kaydı bulunamadı"/>
                : filtreli.map(s => {
                  const kg  = Number(s.miktar) || 0;
                  const net = kg * (Number(s.satisFiyati)||0) - (Number(s.nakliyeBedeli)||0);
                  const urun = s.stokTuru === 'hammadde' ? s.hammadde_turu : s.mamul_turu;
                  return (
                    <tr key={s.id} className="group hover:bg-enba-panel-2/40 transition-colors">
                      <td className={td + ' text-enba-muted whitespace-nowrap'}>{tarihFmt(s.tarih)}</td>
                      <td className={td + ' font-medium'}>{s.musteriAdi}</td>
                      <td className={td}>
                        <span className={cx(
                          'text-[10.5px] font-medium px-2 py-0.5 rounded-full',
                          s.stokTuru === 'mamul'
                            ? 'bg-enba-blue/15 text-enba-blue'
                            : 'bg-enba-green/15 text-enba-green',
                        )}>
                          {s.stokTuru === 'mamul' ? 'Mamül' : 'Hammadde'}
                        </span>
                      </td>
                      <td className={td + ' text-enba-muted'}>{urun || '—'}</td>
                      <td className={tdR}>{kg.toLocaleString('tr-TR', {maximumFractionDigits:0})}</td>
                      <td className={tdR}>{(Number(s.satisFiyati)||0).toFixed(2)}</td>
                      <td className={tdR + ' text-enba-dim'}>{fmtTL(Number(s.nakliyeBedeli)||0)}</td>
                      <td className={tdR + (net >= 0 ? ' text-enba-green font-semibold' : ' text-enba-red font-semibold')}>
                        {fmtTL(net)}
                      </td>
                      <td className={td + ' text-enba-dim max-w-[100px] truncate'}>{s.notlar || '—'}</td>
                      <td className={td + ' opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'}>
                        <button onClick={() => openEdit(s)}
                          className="p-1.5 text-enba-dim hover:text-enba-orange rounded-lg transition-colors mr-1">
                          <Pencil size={13}/>
                        </button>
                        <button onClick={() => setDeleteId(s.id!)}
                          className="p-1.5 text-enba-dim hover:text-enba-red rounded-lg transition-colors">
                          <Trash2 size={13}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={closeDrawer}
        title={editingId ? 'Satış Kaydını Düzenle' : 'Yeni Satış Kaydı'}>
        <SatisFormFields form={form} onChange={setForm} onSave={save} onCancel={closeDrawer}
          loading={loading} musteriler={musteriler} editingId={editingId}/>
      </Drawer>

      {deleteId && (
        <DeleteConfirm
          onConfirm={async () => { await onDelete(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}/>
      )}
    </div>
  );
}

// ─── Stok Durumu Paneli ──────────────────────────────────────────────────────
interface StokPanelProps {
  alislar: StockRecord[];
  satislar: SalesRecord[];
}

function StokPanel({ alislar, satislar }: StokPanelProps) {
  const ozet = useMemo(() => {
    const oz: Record<string, { netAlis: number; toplaMal: number; satilanKg: number }> = {};
    alislar.forEach(a => {
      const t = a.hammaddeTuru || 'Diğer';
      if (!oz[t]) oz[t] = { netAlis: 0, toplaMal: 0, satilanKg: 0 };
      const nm = Number(a.netMiktar) || 0;
      const bm = Number(a.birimMaliyet) || 0;
      oz[t].netAlis  += nm;
      oz[t].toplaMal += nm * bm;
    });
    satislar.filter(s => s.stokTuru === 'hammadde').forEach(s => {
      const t = s.hammadde_turu || 'Diğer';
      if (!oz[t]) oz[t] = { netAlis: 0, toplaMal: 0, satilanKg: 0 };
      oz[t].satilanKg += Number(s.miktar) || 0;
    });
    return Object.entries(oz).map(([tur, o]) => {
      const ortMal  = o.netAlis > 0 ? o.toplaMal / o.netAlis : 0;
      const netStok = o.netAlis - o.satilanKg;
      const stokDeg = Math.max(0, netStok) * ortMal;
      return { tur, ...o, ortMal, netStok, stokDeg };
    });
  }, [alislar, satislar]);

  const topStok = ozet.reduce((s, o) => s + Math.max(0, o.netStok), 0);
  const topDeg  = ozet.reduce((s, o) => s + o.stokDeg, 0);

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto p-5">
      <div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-enba-dim mb-0.5">Hammadde</div>
        <h2 className="text-[15px] font-semibold text-enba-text">Stok Durumu</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Toplam Net Stok" value={fmtKg(topStok, 0)} accent/>
        <KpiCard label="Stok Değeri" value={fmtTL(topDeg)} sub="Ağırlıklı ort. maliyet bazında"/>
      </div>

      <div className="bg-enba-panel border border-enba-line rounded-xl overflow-hidden">
        {ozet.length === 0 ? (
          <div className="py-16 text-center text-[12px] text-enba-dim italic">Henüz alış kaydı yok</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={th}>Hammadde Türü</th>
                  <th className={thR}>Net Alınan</th>
                  <th className={thR}>Satılan</th>
                  <th className={thR}>Net Stok</th>
                  <th className={thR}>Ort. Mal. ₺/kg</th>
                  <th className={thR}>Stok Değeri</th>
                  <th className={th}>Durum</th>
                </tr>
              </thead>
              <tbody>
                {ozet.sort((a, b) => b.stokDeg - a.stokDeg).map(o => {
                  const dur = o.netStok <= 0
                    ? { label: 'Tükendi', cls: 'bg-enba-red/15 text-enba-red' }
                    : o.netStok < o.netAlis * 0.1
                      ? { label: 'Kritik',  cls: 'bg-enba-amber/15 text-enba-amber' }
                      : { label: 'Normal',  cls: 'bg-enba-green/15 text-enba-green' };
                  return (
                    <tr key={o.tur} className="hover:bg-enba-panel-2/40 transition-colors">
                      <td className={td + ' font-medium'}>{o.tur}</td>
                      <td className={tdR}>{o.netAlis.toLocaleString('tr-TR', {maximumFractionDigits:0})}</td>
                      <td className={tdR + ' text-enba-muted'}>{o.satilanKg.toLocaleString('tr-TR', {maximumFractionDigits:0})}</td>
                      <td className={tdR + (o.netStok > 0 ? ' text-enba-green font-semibold' : ' text-enba-red font-semibold')}>
                        {Math.max(0, o.netStok).toLocaleString('tr-TR', {maximumFractionDigits:0})} kg
                      </td>
                      <td className={tdR}>{o.ortMal.toFixed(2)}</td>
                      <td className={tdR + ' text-enba-orange font-semibold'}>{fmtTL(o.stokDeg)}</td>
                      <td className={td}>
                        <span className={cx('text-[11px] font-medium px-2.5 py-0.5 rounded-full', dur.cls)}>
                          {dur.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Raporlar Paneli ─────────────────────────────────────────────────────────
interface RaporlarPanelProps {
  alislar: StockRecord[];
  satislar: SalesRecord[];
}

function RaporlarPanel({ alislar, satislar }: RaporlarPanelProps) {
  const tedOzet = useMemo(() => {
    const oz: Record<string, { kg: number; mal: number; adet: number }> = {};
    alislar.forEach(a => {
      const k = a.tedarikciAdi || 'Bilinmiyor';
      if (!oz[k]) oz[k] = { kg: 0, mal: 0, adet: 0 };
      oz[k].kg  += Number(a.netMiktar) || 0;
      oz[k].mal += (Number(a.netMiktar)||0) * (Number(a.birimMaliyet)||0);
      oz[k].adet++;
    });
    return Object.entries(oz).sort((a, b) => b[1].mal - a[1].mal);
  }, [alislar]);

  const musOzet = useMemo(() => {
    const oz: Record<string, { kg: number; gelir: number; adet: number }> = {};
    satislar.forEach(s => {
      const k = s.musteriAdi || 'Bilinmiyor';
      if (!oz[k]) oz[k] = { kg: 0, gelir: 0, adet: 0 };
      oz[k].kg    += Number(s.miktar) || 0;
      oz[k].gelir += (Number(s.miktar)||0)*(Number(s.satisFiyati)||0)-(Number(s.nakliyeBedeli)||0);
      oz[k].adet++;
    });
    return Object.entries(oz).sort((a, b) => b[1].gelir - a[1].gelir);
  }, [satislar]);

  const ayOzet = useMemo(() => {
    const oz: Record<string, { alisKg: number; alisMal: number; satisKg: number; satisGelir: number }> = {};
    alislar.forEach(a => {
      const ay = (a.tarih || '').slice(0, 7) || '?';
      if (!oz[ay]) oz[ay] = { alisKg: 0, alisMal: 0, satisKg: 0, satisGelir: 0 };
      oz[ay].alisKg  += Number(a.netMiktar) || 0;
      oz[ay].alisMal += (Number(a.netMiktar)||0) * (Number(a.birimMaliyet)||0);
    });
    satislar.forEach(s => {
      const ay = (s.tarih || '').slice(0, 7) || '?';
      if (!oz[ay]) oz[ay] = { alisKg: 0, alisMal: 0, satisKg: 0, satisGelir: 0 };
      oz[ay].satisKg    += Number(s.miktar) || 0;
      oz[ay].satisGelir += (Number(s.miktar)||0)*(Number(s.satisFiyati)||0)-(Number(s.nakliyeBedeli)||0);
    });
    return Object.entries(oz).sort((a, b) => a[0].localeCompare(b[0]));
  }, [alislar, satislar]);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-enba-panel border border-enba-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-enba-line">
        <h3 className="text-[13px] font-semibold text-enba-text">{title}</h3>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );

  const Empty = ({ cols }: { cols: number }) => (
    <tr><td colSpan={cols} className="py-10 text-center text-[12px] text-enba-dim italic">Veri yok</td></tr>
  );

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto p-5">
      <div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-enba-dim mb-0.5">Analiz</div>
        <h2 className="text-[15px] font-semibold text-enba-text">Raporlar</h2>
      </div>

      {/* Tedarikçi raporu */}
      <Section title="Tedarikçi Bazında Alış Raporu">
        <table className="w-full">
          <thead><tr>
            <th className={th}>Tedarikçi</th>
            <th className={thR}>Alış Adedi</th>
            <th className={thR}>Net kg</th>
            <th className={thR}>Toplam Maliyet</th>
            <th className={thR}>Ort. ₺/kg</th>
          </tr></thead>
          <tbody>
            {tedOzet.length === 0 ? <Empty cols={5}/> : tedOzet.map(([adi, o]) => (
              <tr key={adi} className="hover:bg-enba-panel-2/40 transition-colors">
                <td className={td + ' font-medium'}>{adi}</td>
                <td className={tdR + ' text-enba-muted'}>{o.adet}</td>
                <td className={tdR}>{o.kg.toLocaleString('tr-TR', {maximumFractionDigits:0})}</td>
                <td className={tdR + ' text-enba-orange font-semibold'}>{fmtTL(o.mal)}</td>
                <td className={tdR}>{o.kg > 0 ? (o.mal/o.kg).toFixed(2) : '—'} ₺</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Müşteri raporu */}
      <Section title="Müşteri Bazında Satış Raporu">
        <table className="w-full">
          <thead><tr>
            <th className={th}>Müşteri</th>
            <th className={thR}>Satış Adedi</th>
            <th className={thR}>Toplam kg</th>
            <th className={thR}>Net Gelir</th>
            <th className={thR}>Ort. ₺/kg</th>
          </tr></thead>
          <tbody>
            {musOzet.length === 0 ? <Empty cols={5}/> : musOzet.map(([adi, o]) => (
              <tr key={adi} className="hover:bg-enba-panel-2/40 transition-colors">
                <td className={td + ' font-medium'}>{adi}</td>
                <td className={tdR + ' text-enba-muted'}>{o.adet}</td>
                <td className={tdR}>{o.kg.toLocaleString('tr-TR', {maximumFractionDigits:0})}</td>
                <td className={tdR + ' text-enba-green font-semibold'}>{fmtTL(o.gelir)}</td>
                <td className={tdR}>{o.kg > 0 ? (o.gelir/o.kg).toFixed(2) : '—'} ₺</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Aylık özet */}
      <Section title="Aylık Alış / Satış Özeti">
        <table className="w-full">
          <thead><tr>
            <th className={th}>Dönem</th>
            <th className={thR}>Alış kg</th>
            <th className={thR}>Alış Maliyet</th>
            <th className={thR}>Satış kg</th>
            <th className={thR}>Satış Gelir</th>
            <th className={thR}>Net Marjin</th>
            <th className={thR}>Marjin %</th>
          </tr></thead>
          <tbody>
            {ayOzet.length === 0 ? <Empty cols={7}/> : ayOzet.map(([ay, o]) => {
              const marjin = o.satisGelir - o.alisMal;
              const pct    = o.alisMal > 0 ? marjin / o.alisMal * 100 : 0;
              return (
                <tr key={ay} className="hover:bg-enba-panel-2/40 transition-colors">
                  <td className={td + ' font-medium'}>{ayFmt(ay + '-01')}</td>
                  <td className={tdR}>{o.alisKg.toLocaleString('tr-TR', {maximumFractionDigits:0})}</td>
                  <td className={tdR + ' text-enba-dim'}>{fmtTL(o.alisMal)}</td>
                  <td className={tdR}>{o.satisKg.toLocaleString('tr-TR', {maximumFractionDigits:0})}</td>
                  <td className={tdR + ' text-enba-green'}>{fmtTL(o.satisGelir)}</td>
                  <td className={tdR + (marjin >= 0 ? ' text-enba-green font-semibold' : ' text-enba-red font-semibold')}>
                    {fmtTL(marjin)}
                  </td>
                  <td className={tdR + (pct >= 0 ? ' text-enba-green' : ' text-enba-red')}>
                    {pct.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

// ─── Cari Havuzu Paneli (Tedarikçi / Müşteri) ────────────────────────────────

interface ContactPanelProps {
  contacts: SharedContact[];
  type: 'supplier' | 'customer';
  onAdd: (c: SharedContact) => void;
  onUpdate: (c: SharedContact) => void;
  onDelete: (id: string) => void;
}

type ContactForm = Omit<SharedContact, 'id' | 'type'>;

const emptyContactForm = (): ContactForm => ({ name: '', phone: '', email: '', notes: '' });

function ContactPanel({ contacts, type, onAdd, onUpdate, onDelete }: ContactPanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [form,       setForm]       = useState<ContactForm>(emptyContactForm());
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [search,     setSearch]     = useState('');

  const label    = type === 'supplier' ? 'Tedarikçi' : 'Müşteri';
  const eyebrow  = type === 'supplier' ? 'Alım' : 'Satış';
  const filtered = contacts.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd  = () => { setForm(emptyContactForm()); setEditingId(null); setDrawerOpen(true); };
  const openEdit = (c: SharedContact) => {
    setForm({ name: c.name, phone: c.phone ?? '', email: c.email ?? '', notes: c.notes ?? '' });
    setEditingId(c.id); setDrawerOpen(true);
  };
  const closeDrawer = () => { setDrawerOpen(false); setEditingId(null); };

  const save = () => {
    if (!form.name.trim()) return;
    if (editingId) onUpdate({ id: editingId, type, ...form });
    else           onAdd({ id: crypto.randomUUID(), type, ...form });
    closeDrawer();
  };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto p-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-enba-dim mb-0.5">{eyebrow} · Tanımlar</div>
          <h2 className="text-[15px] font-semibold text-enba-text">{label}ler</h2>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder={`${label} ara...`}
            className="h-8 px-3 text-[12.5px] rounded-lg border border-enba-line bg-enba-panel-2 text-enba-text placeholder-enba-dim outline-none focus:border-enba-orange/50 w-[180px]"
            value={search} onChange={e => setSearch(e.target.value)}/>
          <button onClick={openAdd}
            className="h-8 px-3 bg-enba-orange text-white text-[12.5px] font-semibold rounded-lg hover:bg-enba-orange/90 transition-colors flex items-center gap-1.5">
            <Plus size={13}/> Yeni {label}
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-enba-panel border border-enba-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Ad / Ünvan</th>
                <th className={th}>Telefon</th>
                <th className={th}>E-posta</th>
                <th className={th}>Notlar</th>
                <th className={th}/>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <TableEmpty colSpan={5} label={search ? 'Arama sonucu yok' : `${label} bulunamadı — Yeni ${label} ekleyin`}/>
                : filtered.map(c => (
                  <tr key={c.id} className="group hover:bg-enba-panel-2/40 transition-colors">
                    <td className={td + ' font-medium'}>{c.name}</td>
                    <td className={td + ' text-enba-muted'}>{c.phone || '—'}</td>
                    <td className={td + ' text-enba-muted'}>{c.email || '—'}</td>
                    <td className={td + ' text-enba-dim max-w-[160px] truncate'}>{c.notes || '—'}</td>
                    <td className={td + ' opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'}>
                      <button onClick={() => openEdit(c)}
                        className="p-1.5 text-enba-dim hover:text-enba-orange rounded-lg transition-colors mr-1">
                        <Pencil size={13}/>
                      </button>
                      <button onClick={() => setDeleteId(c.id)}
                        className="p-1.5 text-enba-dim hover:text-enba-red rounded-lg transition-colors">
                        <Trash2 size={13}/>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <Drawer open={drawerOpen} onClose={closeDrawer}
        title={editingId ? `${label} Düzenle` : `Yeni ${label}`}>
        <Field label="Ad / Ünvan *">
          <input autoFocus type="text" autoComplete="off" className={inputCls} placeholder={`örn. Polimer Atık A.Ş.`}
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
        </Field>
        <Field label="Telefon">
          <input type="tel" autoComplete="off" className={inputCls} placeholder="+90 555 000 00 00"
            value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value || undefined }))}/>
        </Field>
        <Field label="E-posta">
          <input type="email" autoComplete="off" className={inputCls} placeholder="ornek@firma.com"
            value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value || undefined }))}/>
        </Field>
        <Field label="Notlar">
          <input type="text" autoComplete="off" className={inputCls} placeholder="..."
            value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value || undefined }))}/>
        </Field>
        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={!form.name.trim()}
            className="flex-1 h-10 bg-enba-orange text-white text-[13px] font-semibold rounded-lg hover:bg-enba-orange/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            <Check size={14}/>{editingId ? 'Güncelle' : 'Kaydet'}
          </button>
          <button onClick={closeDrawer}
            className="h-10 px-4 border border-enba-line text-[13px] text-enba-muted rounded-lg hover:bg-enba-panel-2 transition-colors">
            İptal
          </button>
        </div>
      </Drawer>

      {deleteId && (
        <DeleteConfirm
          onConfirm={() => { onDelete(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}/>
      )}
    </div>
  );
}

// ─── Stok Kalemleri Paneli ────────────────────────────────────────────────────
const KALEM_UNITS      = ['kg', 'ton', 'adet', 'm²', 'm³', 'litre', 'paket'] as const;
const KALEM_CATEGORIES = ['Hammadde', 'Mamul', 'Yardımcı Malzeme', 'Ambalaj', 'Kimyasal', 'Diğer'] as const;

interface StokKalemleriPanelProps {
  items: StockItem[];
  onAdd: (item: StockItem) => void;
  onSeedAll: (items: StockItem[]) => void;
  onUpdate: (item: StockItem) => void;
  onDelete: (id: string) => void;
}

type KalemForm = Omit<StockItem, 'id'>;
const emptyKalemForm = (): KalemForm => ({
  code: '', name: '', unit: 'kg', category: 'Hammadde',
  defaultBuyPrice: undefined, defaultSellPrice: undefined, notes: '',
});

function StokKalemleriPanel({ items, onAdd, onSeedAll, onUpdate, onDelete }: StokKalemleriPanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [form,       setForm]       = useState<KalemForm>(emptyKalemForm());
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [search,     setSearch]     = useState('');

  const seedDefaults = () => {
    onSeedAll(DEFAULT_STOCK_ITEMS.map(item => ({ ...item, id: crypto.randomUUID() })));
  };

  const filtered = items.filter(i =>
    !search || i.code.toLowerCase().includes(search.toLowerCase())
            || i.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd  = () => { setForm(emptyKalemForm()); setEditingId(null); setDrawerOpen(true); };
  const openEdit = (item: StockItem) => {
    setForm({ code: item.code, name: item.name, unit: item.unit, category: item.category,
              defaultBuyPrice: item.defaultBuyPrice, defaultSellPrice: item.defaultSellPrice,
              notes: item.notes ?? '' });
    setEditingId(item.id); setDrawerOpen(true);
  };
  const closeDrawer = () => { setDrawerOpen(false); setEditingId(null); };

  const save = () => {
    if (!form.name.trim()) return;
    if (editingId) onUpdate({ id: editingId, ...form });
    else           onAdd({ id: crypto.randomUUID(), ...form });
    closeDrawer();
  };

  const numFld = (key: keyof KalemForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value ? Number(e.target.value) : undefined }));

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto p-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-enba-dim mb-0.5">Tanımlar</div>
          <h2 className="text-[15px] font-semibold text-enba-text">Stok Kalemleri</h2>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Kod veya ad ara..."
            className="h-8 px-3 text-[12.5px] rounded-lg border border-enba-line bg-enba-panel-2 text-enba-text placeholder-enba-dim outline-none focus:border-enba-orange/50 w-[180px]"
            value={search} onChange={e => setSearch(e.target.value)}/>
          <button onClick={openAdd}
            className="h-8 px-3 bg-enba-orange text-white text-[12.5px] font-semibold rounded-lg hover:bg-enba-orange/90 transition-colors flex items-center gap-1.5">
            <Plus size={13}/> Yeni Kalem
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-enba-panel border border-enba-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Kod</th>
                <th className={th}>Kalem Adı</th>
                <th className={th}>Birim</th>
                <th className={th}>Kategori</th>
                <th className={thR}>Alış ₺/birim</th>
                <th className={thR}>Satış ₺/birim</th>
                <th className={th}>Notlar</th>
                <th className={th}/>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      {search ? (
                        <span className="text-[12px] text-enba-dim italic">Arama sonucu yok</span>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="text-[13px] text-enba-muted">Henüz stok kalemi tanımlanmadı.</div>
                          <button onClick={seedDefaults}
                            className="h-9 px-4 bg-enba-orange text-white text-[12.5px] font-semibold rounded-lg hover:bg-enba-orange/90 transition-colors flex items-center gap-2">
                            <Plus size={13}/> Varsayılan kalemleri yükle ({DEFAULT_STOCK_ITEMS.length} kalem)
                          </button>
                          <div className="text-[11px] text-enba-dim">Hammadde ve mamul türleri otomatik eklenir, sonradan düzenleyebilirsiniz.</div>
                        </div>
                      )}
                    </td>
                  </tr>
                )
                : filtered.map(item => (
                  <tr key={item.id} className="group hover:bg-enba-panel-2/40 transition-colors">
                    <td className={td}>
                      <span className="font-mono text-[12px] bg-enba-panel-2 px-2 py-0.5 rounded text-enba-orange">
                        {item.code || '—'}
                      </span>
                    </td>
                    <td className={td + ' font-medium'}>{item.name}</td>
                    <td className={td + ' text-enba-muted'}>{item.unit}</td>
                    <td className={td}>
                      <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-enba-panel-2 text-enba-muted">
                        {item.category}
                      </span>
                    </td>
                    <td className={tdR + ' text-enba-muted'}>
                      {item.defaultBuyPrice != null ? `₺${item.defaultBuyPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className={tdR + ' text-enba-muted'}>
                      {item.defaultSellPrice != null ? `₺${item.defaultSellPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className={td + ' text-enba-dim max-w-[120px] truncate'}>{item.notes || '—'}</td>
                    <td className={td + ' opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'}>
                      <button onClick={() => openEdit(item)}
                        className="p-1.5 text-enba-dim hover:text-enba-orange rounded-lg transition-colors mr-1">
                        <Pencil size={13}/>
                      </button>
                      <button onClick={() => setDeleteId(item.id)}
                        className="p-1.5 text-enba-dim hover:text-enba-red rounded-lg transition-colors">
                        <Trash2 size={13}/>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <Drawer open={drawerOpen} onClose={closeDrawer}
        title={editingId ? 'Kalemi Düzenle' : 'Yeni Stok Kalemi'}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Stok Kodu">
            <input autoFocus type="text" autoComplete="off" className={inputCls} placeholder="örn. PET-001"
              value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}/>
          </Field>
          <Field label="Kalem Adı *">
            <input type="text" autoComplete="off" className={inputCls} placeholder="PET Şişe Atık"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
          </Field>
          <Field label="Birim">
            <select className={inputCls} value={form.unit}
              onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
              {KALEM_UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Kategori">
            <select className={inputCls} value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {KALEM_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Varsayılan Alış ₺/birim">
            <input type="number" min="0" step="0.01" className={inputCls} placeholder="—"
              value={form.defaultBuyPrice ?? ''} onChange={numFld('defaultBuyPrice')}/>
          </Field>
          <Field label="Varsayılan Satış ₺/birim">
            <input type="number" min="0" step="0.01" className={inputCls} placeholder="—"
              value={form.defaultSellPrice ?? ''} onChange={numFld('defaultSellPrice')}/>
          </Field>
        </div>
        <Field label="Notlar">
          <input type="text" className={inputCls} placeholder="..."
            value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value || undefined }))}/>
        </Field>
        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={!form.name.trim()}
            className="flex-1 h-10 bg-enba-orange text-white text-[13px] font-semibold rounded-lg hover:bg-enba-orange/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            <Check size={14}/>{editingId ? 'Güncelle' : 'Kaydet'}
          </button>
          <button onClick={closeDrawer}
            className="h-10 px-4 border border-enba-line text-[13px] text-enba-muted rounded-lg hover:bg-enba-panel-2 transition-colors">
            İptal
          </button>
        </div>
      </Drawer>

      {deleteId && (
        <DeleteConfirm
          onConfirm={() => { onDelete(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}/>
      )}
    </div>
  );
}

// ─── Ana Modül ────────────────────────────────────────────────────────────────
export const Stock: React.FC = () => {
  const [active, setActive]               = useState<ViewId>('alis');
  const [loading, setLoading]             = useState(true);
  const [alislar, setAlislar]             = useState<StockRecord[]>([]);
  const [satislar, setSatislar]           = useState<SalesRecord[]>([]);
  const [tedarikciler, setTedarikciler]   = useState<SharedContact[]>([]);
  const [musteriler, setMusteriler]       = useState<SharedContact[]>([]);
  const [stokKalemleri, setStokKalemleri] = useState<StockItem[]>([]);
  const [sidebarOpen, setSidebarOpen]     = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [a, s] = await Promise.all([
          DataService.getAlislar(),
          DataService.getSatislar(),
        ]);
        setAlislar(a);
        setSatislar(s);
      } catch (err) {
        console.error('Stok veri yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
      // Cari havuz ve kalemleri — localStorage'dan senkron yükle
      const all = SharedContactsService.getAll();
      setTedarikciler(all.filter(c => c.type === 'supplier'));
      setMusteriler(all.filter(c => c.type === 'customer'));
      setStokKalemleri(StockItemsService.getAll());
    })();
  }, []);

  // ─── Cari CRUD ──────────────────────────────────────────────────────────────
  const reloadContacts = () => {
    const all = SharedContactsService.getAll();
    setTedarikciler(all.filter(c => c.type === 'supplier'));
    setMusteriler(all.filter(c => c.type === 'customer'));
  };
  const handleAddContact    = (c: SharedContact) => { SharedContactsService.save([...SharedContactsService.getAll(), c]); reloadContacts(); };
  const handleUpdateContact = (c: SharedContact) => { SharedContactsService.update(c); reloadContacts(); };
  const handleDeleteContact = (id: string)        => { SharedContactsService.remove(id); reloadContacts(); };

  // ─── Stok Kalemi CRUD ───────────────────────────────────────────────────────
  const reloadKalemler = () => setStokKalemleri(StockItemsService.getAll());
  const handleAddKalem    = (item: StockItem) => { StockItemsService.save([...StockItemsService.getAll(), item]); reloadKalemler(); };
  const handleSeedKalemler = (newItems: StockItem[]) => {
    StockItemsService.save([...StockItemsService.getAll(), ...newItems]);
    reloadKalemler();
  };
  const handleUpdateKalem = (item: StockItem) => { StockItemsService.update(item); reloadKalemler(); };
  const handleDeleteKalem = (id: string)       => { StockItemsService.remove(id); reloadKalemler(); };

  /** Tedarikçi/müşteri adı henüz listede yoksa otomatik olarak cari havuzuna ekler. */
  const autoUpsertContact = (name: string, type: 'supplier' | 'customer') => {
    if (!name.trim()) return;
    SharedContactsService.upsertByName(name.trim(), type);
    reloadContacts();
  };

  const handleInsertAlis  = async (f: AlisForm) => {
    setLoading(true);
    try {
      const r = await DataService.insertAlis(f);
      setAlislar(p => [r, ...p]);
      autoUpsertContact(f.tedarikciAdi, 'supplier');
    }
    catch { alert('Kayıt hatası oluştu'); }
    finally { setLoading(false); }
  };
  const handleUpdateAlis  = async (id: string, f: AlisForm) => {
    setLoading(true);
    try {
      const r = await DataService.updateAlis(id, f);
      setAlislar(p => p.map(x => x.id === id ? r : x));
      autoUpsertContact(f.tedarikciAdi, 'supplier');
    }
    catch { alert('Güncelleme hatası oluştu'); }
    finally { setLoading(false); }
  };
  const handleDeleteAlis  = async (id: string) => {
    setLoading(true);
    try { await DataService.deleteData('stock_records', id); setAlislar(p => p.filter(x => x.id !== id)); }
    catch { alert('Silme hatası oluştu'); }
    finally { setLoading(false); }
  };
  const handleInsertSatis = async (f: SatisForm) => {
    setLoading(true);
    try {
      const r = await DataService.insertSatis(f);
      setSatislar(p => [r, ...p]);
      autoUpsertContact(f.musteriAdi, 'customer');
    }
    catch { alert('Kayıt hatası oluştu'); }
    finally { setLoading(false); }
  };
  const handleUpdateSatis = async (id: string, f: SatisForm) => {
    setLoading(true);
    try {
      const r = await DataService.updateSatis(id, f);
      setSatislar(p => p.map(x => x.id === id ? r : x));
      autoUpsertContact(f.musteriAdi, 'customer');
    }
    catch { alert('Güncelleme hatası oluştu'); }
    finally { setLoading(false); }
  };
  const handleDeleteSatis = async (id: string) => {
    setLoading(true);
    try { await DataService.deleteData('sales_records', id); setSatislar(p => p.filter(x => x.id !== id)); }
    catch { alert('Silme hatası oluştu'); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-full flex bg-enba-bg overflow-hidden">
      {/* Sidebar */}
      <aside className={cx(
        'bg-enba-panel border-r border-enba-line flex flex-col flex-none h-full transition-all duration-200',
        sidebarOpen ? 'w-[220px]' : 'w-12',
      )}>
        {/* Sidebar header */}
        <div className={cx(
          'flex items-center border-b border-enba-line flex-none h-[60px]',
          sidebarOpen ? 'px-4 gap-2' : 'justify-center',
        )}>
          {sidebarOpen && (
            <>
              <span className="w-2 h-2 rounded-full bg-enba-orange shadow-[0_0_8px] shadow-enba-orange/60 flex-none"/>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.14em] text-enba-dim leading-none mb-0.5">Modül</div>
                <div className="text-[13px] font-semibold text-enba-text truncate">Stok Yönetimi</div>
              </div>
            </>
          )}
          <button onClick={() => setSidebarOpen(o => !o)}
            className="w-7 h-7 rounded-md text-enba-muted hover:text-enba-text hover:bg-enba-panel-2 inline-flex items-center justify-center flex-none transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={cx('transition-transform duration-200', sidebarOpen ? 'rotate-90' : '-rotate-90')}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className={cx('pt-2 flex-1 overflow-y-auto', sidebarOpen ? 'px-2' : 'px-1.5')}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-2 pt-2 border-t border-enba-line' : ''}>
              {sidebarOpen && (
                <div className="px-2 pb-1 text-[9.5px] uppercase tracking-[0.15em] text-enba-dim font-medium">
                  {group.label}
                </div>
              )}
              {group.items.map(({ id, label, Icon }) => {
                const isActive = active === id;
                return (
                  <button key={id} onClick={() => setActive(id)} title={sidebarOpen ? undefined : label}
                    className={cx(
                      'w-full flex items-center rounded-lg transition-colors mb-0.5 relative',
                      sidebarOpen ? 'gap-3 px-3 h-9 text-[13px]' : 'justify-center h-9',
                      isActive
                        ? 'bg-enba-orange/12 text-enba-orange'
                        : 'text-enba-muted hover:text-enba-text hover:bg-enba-panel-2',
                    )}>
                    {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-enba-orange rounded-r"/>}
                    <Icon size={16}/>
                    {sidebarOpen && <span className="flex-1 text-left">{label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Loading indicator */}
        {loading && sidebarOpen && (
          <div className="px-4 py-3 border-t border-enba-line">
            <div className="text-[11px] text-enba-dim flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-enba-orange/40 border-t-enba-orange animate-spin flex-none"/>
              Yükleniyor...
            </div>
          </div>
        )}
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 overflow-hidden">
        {active === 'alis' && (
          <AlisPanel
            alislar={alislar} tedarikciler={tedarikciler} loading={loading}
            onInsert={handleInsertAlis} onUpdate={handleUpdateAlis} onDelete={handleDeleteAlis}/>
        )}
        {active === 'satis' && (
          <SatisPanel
            satislar={satislar} musteriler={musteriler} loading={loading}
            onInsert={handleInsertSatis} onUpdate={handleUpdateSatis} onDelete={handleDeleteSatis}/>
        )}
        {active === 'stok'     && <StokPanel alislar={alislar} satislar={satislar}/>}
        {active === 'raporlar' && <RaporlarPanel alislar={alislar} satislar={satislar}/>}
        {active === 'kalemler' && (
          <StokKalemleriPanel
            items={stokKalemleri}
            onAdd={handleAddKalem} onSeedAll={handleSeedKalemler}
            onUpdate={handleUpdateKalem} onDelete={handleDeleteKalem}/>
        )}
        {active === 'tedarikciler' && (
          <ContactPanel
            contacts={tedarikciler} type="supplier"
            onAdd={handleAddContact} onUpdate={handleUpdateContact} onDelete={handleDeleteContact}/>
        )}
        {active === 'musteriler' && (
          <ContactPanel
            contacts={musteriler} type="customer"
            onAdd={handleAddContact} onUpdate={handleUpdateContact} onDelete={handleDeleteContact}/>
        )}
      </main>
    </div>
  );
};

export default Stock;
