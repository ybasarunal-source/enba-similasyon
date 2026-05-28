import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, X, AlertCircle, TrendingUp, TrendingDown,
  FileSpreadsheet, FileText, Loader2, ChevronDown, ChevronUp,
  RefreshCw, CheckCircle2, Link2,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { kurulumNakitAPI, type FoundingCashflow, type FCForm, type FCTip, type FCImportRecord } from '../api/kurulumNakit';
import { parasutService, type ParasutInvoice } from '../api/parasut';
import type { UserProfile } from '../api/supabase';

interface KurulumNakitProps {
  profile: UserProfile | null;
}

// ── Sabit kategoriler ────────────────────────────────────────
const GIDER_KATEGORILER = [
  'Demirbaş & Ekipman',
  'Bina & Kira Depozitosu',
  'Lisans & İzin',
  'Danışmanlık & Hukuk',
  'İşletme Ruhsatı',
  'Yazılım & Donanım',
  'Araç',
  'İlk Stok Alımı',
  'Personel (Başlangıç)',
  'Pazarlama & Tanıtım',
  'Diğer Gider',
];

const GELIR_KATEGORILER = [
  'Ortak Sermayesi',
  'Banka Kredisi',
  'Hibe & Teşvik',
  'Satış Geliri',
  'Diğer Gelir',
];

type Tab = 'kayitlar' | 'grafik' | 'ozet';
type TipFilter = 'tümü' | FCTip;
type SortDir = 'asc' | 'desc';

function fmtTL(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₺';
}

function fmtDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}`;
}

// ── Paraşüt → FCImportRecord dönüşümü ───────────────────────
function mapParasutInvoice(inv: ParasutInvoice): FCImportRecord {
  const tip: FCTip = inv.type === 'sales_invoices' ? 'gelir' : 'gider';
  const cat = inv.category_name?.replace(/^\d+\s*/, '').trim() || (
    inv.type === 'sales_invoices'    ? 'Satış Geliri'     :
    inv.type === 'purchase_bills'    ? 'Alış Gideri'      :
    'Diğer Gider'
  );
  const parts = [inv.description, inv.contact_name !== '—' ? inv.contact_name : ''].filter(Boolean);
  return {
    tarih:      inv.issue_date,
    tip,
    kategori:   cat.slice(0, 60),
    tutar_tl:   Math.round(inv.net_total * 100) / 100,
    aciklama:   parts.join(' / ').slice(0, 200),
    parasut_id: `${inv.type}-${inv.id}`,
  };
}

// ── ImportModal ──────────────────────────────────────────────
interface ImportModalProps {
  companyId: string;
  onImported: (records: FoundingCashflow[]) => void;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ companyId, onImported, onClose }) => {
  const parasutCompany = parasutService.getCompany();
  const isConnected    = parasutService.isLoggedIn() && !!parasutCompany;

  const [fromDate, setFromDate] = useState('2020-01-01');
  const [toDate,   setToDate]   = useState(new Date().toISOString().slice(0, 10));
  const [step,     setStep]     = useState<'config' | 'preview' | 'done'>('config');
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState('');
  const [pending,  setPending]  = useState<FCImportRecord[]>([]);
  const [result,   setResult]   = useState<{ inserted: number; skipped: number } | null>(null);

  async function handleFetch() {
    if (!parasutCompany) return;
    setLoading(true); setErr('');
    try {
      const [sales, bills, exps] = await Promise.all([
        parasutService.getSalesInvoices(parasutCompany.id, fromDate, toDate),
        parasutService.getPurchaseBills(parasutCompany.id, fromDate, toDate),
        parasutService.getExpenditures(parasutCompany.id, fromDate, toDate),
      ]);
      const all = [...sales, ...bills, ...exps].map(mapParasutInvoice);

      // Mevcut parasut_id'leri client-side filtrele (preview için)
      const { data: existing } = await (await import('../api/supabase')).supabase
        .from('founding_cashflow')
        .select('parasut_id')
        .eq('company_id', companyId)
        .not('parasut_id', 'is', null);
      const existingIds = new Set((existing ?? []).map((r: { parasut_id: string | null }) => r.parasut_id));
      const newRecs = all.filter(r => !existingIds.has(r.parasut_id));

      setPending(newRecs);
      setStep('preview');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Paraşüt verisi alınamadı');
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    setLoading(true); setErr('');
    try {
      const res = await kurulumNakitAPI.batchImport(companyId, pending);
      setResult(res);
      setStep('done');
      // Yeni kayıtları üst bileşene bildir
      const { data } = await (await import('../api/supabase')).supabase
        .from('founding_cashflow')
        .select('*')
        .eq('company_id', companyId)
        .order('tarih', { ascending: true });
      onImported((data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id ?? ''),
        company_id: String(r.company_id ?? ''),
        tarih: String(r.tarih ?? ''),
        tip: (r.tip ?? 'gider') as FCTip,
        kategori: String(r.kategori ?? ''),
        tutar_tl: Number(r.tutar_tl ?? 0),
        aciklama: String(r.aciklama ?? ''),
        parasut_id: r.parasut_id ? String(r.parasut_id) : null,
        created_at: String(r.created_at ?? ''),
        updated_at: String(r.updated_at ?? ''),
      })));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? JSON.stringify(e);
      setErr(msg || 'Import hatası');
    } finally {
      setLoading(false);
    }
  }

  const gelirCount  = pending.filter(r => r.tip === 'gelir').length;
  const giderCount  = pending.filter(r => r.tip === 'gider').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--enba-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--enba-border)]">
          <div className="flex items-center gap-2">
            <RefreshCw size={15} className="text-[var(--enba-orange)]" />
            <span className="font-semibold text-[var(--enba-text)]">Paraşüt'ten İçe Aktar</span>
          </div>
          <button onClick={onClose} className="text-[var(--enba-text-muted)] hover:text-[var(--enba-text)] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Bağlantı durumu */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
            isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            <Link2 size={13} />
            {isConnected
              ? `Bağlı: ${parasutCompany!.name || parasutCompany!.id}`
              : 'Paraşüt bağlı değil — önce Paraşüt modülünden giriş yap'}
          </div>

          {isConnected && step === 'config' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--enba-text-muted)] mb-1.5">Başlangıç tarihi</label>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                    className="w-full bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-xl px-3 py-2 text-sm text-[var(--enba-text)] focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--enba-text-muted)] mb-1.5">Bitiş tarihi</label>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                    className="w-full bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-xl px-3 py-2 text-sm text-[var(--enba-text)] focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/30" />
                </div>
              </div>
              <p className="text-xs text-[var(--enba-text-muted)]">
                Satış faturaları, alış faturaları ve masraflar çekilecek. Zaten import edilmiş kayıtlar atlanır.
              </p>
            </>
          )}

          {isConnected && step === 'preview' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[var(--enba-bg)] rounded-xl py-3">
                  <div className="text-lg font-bold text-[var(--enba-text)]">{pending.length}</div>
                  <div className="text-xs text-[var(--enba-text-muted)]">Yeni kayıt</div>
                </div>
                <div className="bg-emerald-50 rounded-xl py-3">
                  <div className="text-lg font-bold text-emerald-600">{gelirCount}</div>
                  <div className="text-xs text-emerald-600">Gelir</div>
                </div>
                <div className="bg-red-50 rounded-xl py-3">
                  <div className="text-lg font-bold text-red-500">{giderCount}</div>
                  <div className="text-xs text-red-500">Gider</div>
                </div>
              </div>
              {pending.length === 0 ? (
                <p className="text-xs text-center text-[var(--enba-text-muted)] py-2">
                  Seçilen aralıkta tüm kayıtlar zaten aktarılmış.
                </p>
              ) : (
                <p className="text-xs text-[var(--enba-text-muted)]">
                  {pending.length} kayıt aktarılacak. Zaten var olanlar otomatik atlanır.
                </p>
              )}
            </div>
          )}

          {step === 'done' && result && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={36} className="text-emerald-500" />
              <div className="text-center">
                <div className="font-semibold text-[var(--enba-text)]">{result.inserted} kayıt aktarıldı</div>
                {result.skipped > 0 && (
                  <div className="text-xs text-[var(--enba-text-muted)] mt-1">{result.skipped} kayıt zaten vardı, atlandı</div>
                )}
              </div>
            </div>
          )}

          {err && (
            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle size={13} /> {err}
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex justify-end gap-2 border-t border-[var(--enba-border)]">
          {step === 'done' ? (
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white rounded-xl bg-[var(--enba-orange)] hover:bg-[var(--enba-orange-hover)] transition-all">
              Kapat
            </button>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--enba-text-muted)] hover:text-[var(--enba-text)] rounded-xl transition-colors">
                İptal
              </button>
              {isConnected && step === 'config' && (
                <button onClick={handleFetch} disabled={loading}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-xl bg-[var(--enba-orange)] hover:bg-[var(--enba-orange-hover)] disabled:opacity-50 transition-all flex items-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Verileri Getir
                </button>
              )}
              {isConnected && step === 'preview' && pending.length > 0 && (
                <button onClick={handleImport} disabled={loading}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {pending.length} Kaydı Aktar
                </button>
              )}
              {isConnected && step === 'preview' && pending.length === 0 && (
                <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white rounded-xl bg-[var(--enba-orange)] transition-all">
                  Tamam
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Empty form ───────────────────────────────────────────────
const emptyForm = (): FCForm => ({
  tarih:    new Date().toISOString().slice(0, 10),
  tip:      'gider',
  kategori: GIDER_KATEGORILER[0],
  tutar_tl: 0,
  aciklama: '',
});

// ── Modal ────────────────────────────────────────────────────
interface ModalProps {
  initial: FCForm | null;
  onSave: (f: FCForm) => Promise<void>;
  onClose: () => void;
}

const EntryModal: React.FC<ModalProps> = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState<FCForm>(initial ?? emptyForm());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const kategoriler = form.tip === 'gelir' ? GELIR_KATEGORILER : GIDER_KATEGORILER;

  function set<K extends keyof FCForm>(k: K, v: FCForm[K]) {
    setForm(p => {
      const next = { ...p, [k]: v };
      if (k === 'tip') {
        next.kategori = v === 'gelir' ? GELIR_KATEGORILER[0] : GIDER_KATEGORILER[0];
      }
      return next;
    });
  }

  async function handleSave() {
    if (!form.tarih) { setErr('Tarih gerekli'); return; }
    if (!form.tutar_tl || form.tutar_tl <= 0) { setErr('Tutar sıfırdan büyük olmalı'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Kayıt hatası');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--enba-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--enba-border)]">
          <span className="font-semibold text-[var(--enba-text)]">
            {initial ? 'Kaydı Düzenle' : 'Yeni Kayıt Ekle'}
          </span>
          <button onClick={onClose} className="text-[var(--enba-text-muted)] hover:text-[var(--enba-text)] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Tip */}
          <div>
            <label className="block text-xs font-medium text-[var(--enba-text-muted)] mb-1.5">Tip</label>
            <div className="flex gap-2">
              {(['gider', 'gelir'] as FCTip[]).map(t => (
                <button
                  key={t}
                  onClick={() => set('tip', t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                    form.tip === t
                      ? t === 'gider'
                        ? 'bg-red-500 text-white'
                        : 'bg-emerald-500 text-white'
                      : 'bg-[var(--enba-bg)] text-[var(--enba-text-muted)] border border-[var(--enba-border)]'
                  }`}
                >
                  {t === 'gider' ? 'Gider' : 'Gelir'}
                </button>
              ))}
            </div>
          </div>

          {/* Tarih */}
          <div>
            <label className="block text-xs font-medium text-[var(--enba-text-muted)] mb-1.5">Tarih</label>
            <input
              type="date"
              value={form.tarih}
              onChange={e => set('tarih', e.target.value)}
              className="w-full bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-xl px-3 py-2 text-sm text-[var(--enba-text)] focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/30"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-medium text-[var(--enba-text-muted)] mb-1.5">Kategori</label>
            <select
              value={form.kategori}
              onChange={e => set('kategori', e.target.value)}
              className="w-full bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-xl px-3 py-2 text-sm text-[var(--enba-text)] focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/30"
            >
              {kategoriler.map(k => <option key={k} value={k}>{k}</option>)}
              <option value="__custom__">— Özel kategori gir</option>
            </select>
            {form.kategori === '__custom__' && (
              <input
                type="text"
                autoFocus
                placeholder="Kategori adı..."
                className="mt-2 w-full bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-xl px-3 py-2 text-sm text-[var(--enba-text)] focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/30"
                onBlur={e => { if (e.target.value) set('kategori', e.target.value); }}
              />
            )}
          </div>

          {/* Tutar */}
          <div>
            <label className="block text-xs font-medium text-[var(--enba-text-muted)] mb-1.5">Tutar (₺)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={form.tutar_tl || ''}
              placeholder="0"
              onChange={e => set('tutar_tl', Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-xl px-3 py-2 text-sm text-[var(--enba-text)] focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/30"
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-xs font-medium text-[var(--enba-text-muted)] mb-1.5">Açıklama (isteğe bağlı)</label>
            <input
              type="text"
              value={form.aciklama}
              onChange={e => set('aciklama', e.target.value)}
              placeholder="Kısa not..."
              className="w-full bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-xl px-3 py-2 text-sm text-[var(--enba-text)] focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/30"
            />
          </div>

          {err && (
            <div className="flex items-center gap-2 text-red-500 text-xs">
              <AlertCircle size={13} />
              <span>{err}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-2 border-t border-[var(--enba-border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--enba-text-muted)] hover:text-[var(--enba-text)] rounded-xl transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white rounded-xl bg-[var(--enba-orange)] hover:bg-[var(--enba-orange-hover)] disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Tooltip özel ─────────────────────────────────────────────
interface CTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}
const CustomTooltip: React.FC<CTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-xl px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold text-[var(--enba-text)] mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--enba-text-muted)]">{p.name}:</span>
          <span className="font-semibold text-[var(--enba-text)]">{fmtTL(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── Ana bileşen ──────────────────────────────────────────────
export const KurulumNakit: React.FC<KurulumNakitProps> = ({ profile }) => {
  const [tab, setTab]             = useState<Tab>('kayitlar');
  const [rows, setRows]           = useState<FoundingCashflow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [modal, setModal]         = useState<'add' | FoundingCashflow | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [delId, setDelId]         = useState<string | null>(null);
  const [tipFilter, setTipFilter] = useState<TipFilter>('tümü');
  const [sortDir, setSortDir]     = useState<SortDir>('asc');
  const [exportMsg, setExportMsg] = useState('');

  const companyId = profile?.company_id ?? null;

  // ── Fetch ────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await kurulumNakitAPI.list(companyId);
      setRows(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Yükleme hatası');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  // ── Hesaplamalar ─────────────────────────────────────────
  const totalGider = useMemo(() => rows.filter(r => r.tip === 'gider').reduce((s, r) => s + r.tutar_tl, 0), [rows]);
  const totalGelir = useMemo(() => rows.filter(r => r.tip === 'gelir').reduce((s, r) => s + r.tutar_tl, 0), [rows]);
  const bakiye     = totalGelir - totalGider;

  // Filtrelenmiş + sıralanmış liste
  const displayed = useMemo(() => {
    let list = tipFilter === 'tümü' ? rows : rows.filter(r => r.tip === tipFilter);
    list = [...list].sort((a, b) => {
      const d = a.tarih.localeCompare(b.tarih);
      return sortDir === 'asc' ? d : -d;
    });
    return list;
  }, [rows, tipFilter, sortDir]);

  // Kümülatif grafik verisi (aylık gruplandırma)
  const cumulativeData = useMemo(() => {
    const sorted = [...rows].sort((a, b) => a.tarih.localeCompare(b.tarih));
    let cumulative = 0;
    const byMonth: Record<string, { gelir: number; gider: number }> = {};
    for (const r of sorted) {
      const month = r.tarih.slice(0, 7); // YYYY-MM
      if (!byMonth[month]) byMonth[month] = { gelir: 0, gider: 0 };
      if (r.tip === 'gelir') byMonth[month].gelir += r.tutar_tl;
      else byMonth[month].gider += r.tutar_tl;
    }
    return Object.entries(byMonth).map(([month, v]) => {
      cumulative += v.gelir - v.gider;
      const [y, m] = month.split('-');
      return {
        label: `${m}/${y.slice(2)}`,
        gelir: v.gelir,
        gider: v.gider,
        bakiye: cumulative,
      };
    });
  }, [rows]);

  // Kategori özet verisi
  const kategoriOzet = useMemo(() => {
    const map: Record<string, { gelir: number; gider: number }> = {};
    for (const r of rows) {
      if (!map[r.kategori]) map[r.kategori] = { gelir: 0, gider: 0 };
      if (r.tip === 'gelir') map[r.kategori].gelir += r.tutar_tl;
      else map[r.kategori].gider += r.tutar_tl;
    }
    return Object.entries(map)
      .map(([k, v]) => ({ kategori: k, ...v, net: v.gelir - v.gider }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [rows]);

  // ── Handlers ────────────────────────────────────────────
  async function handleSave(form: FCForm) {
    if (!companyId) throw new Error('Şirket bilgisi yok');
    if (modal === 'add') {
      const rec = await kurulumNakitAPI.insert(companyId, form);
      setRows(p => [...p, rec].sort((a, b) => a.tarih.localeCompare(b.tarih)));
    } else if (modal) {
      const rec = await kurulumNakitAPI.update(modal.id, form);
      setRows(p => p.map(r => r.id === rec.id ? rec : r));
    }
  }

  async function handleDelete() {
    if (!delId) return;
    try {
      await kurulumNakitAPI.delete(delId);
      setRows(p => p.filter(r => r.id !== delId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Silme hatası');
    } finally {
      setDelId(null);
    }
  }

  // ── Excel export ─────────────────────────────────────────
  function exportExcel() {
    const lines = [
      'Tarih\tTip\tKategori\tTutar (TL)\tAçıklama',
      ...rows
        .sort((a, b) => a.tarih.localeCompare(b.tarih))
        .map(r => `${fmtDate(r.tarih)}\t${r.tip}\t${r.kategori}\t${r.tutar_tl}\t${r.aciklama}`),
      '',
      `Toplam Gelir\t\t\t${totalGelir}`,
      `Toplam Gider\t\t\t${totalGider}`,
      `Bakiye\t\t\t${bakiye}`,
    ];
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/tab-separated-values;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kuruluş_nakit_akışı_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(a.href);
    setExportMsg('Excel indirildi');
    setTimeout(() => setExportMsg(''), 2500);
  }

  // ── PDF export ───────────────────────────────────────────
  async function exportPDF() {
    setExportMsg('PDF hazırlanıyor...');
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      const el = document.getElementById('kn-pdf-content');
      if (!el) return;
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `kuruluş_nakit_akışı_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      }).from(el).save();
      setExportMsg('PDF indirildi');
    } catch {
      setExportMsg('PDF hatası');
    }
    setTimeout(() => setExportMsg(''), 3000);
  }

  // ── UI ───────────────────────────────────────────────────
  if (!companyId) {
    return (
      <div className="p-8 text-center text-[var(--enba-text-muted)] text-sm">
        Şirket bilgisi bulunamadı.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--enba-bg)] animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-[var(--enba-surface)] border-b border-[var(--enba-border)] flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-[var(--enba-text)]">Nakit Akışı</h1>
          <p className="text-xs text-[var(--enba-text-muted)] mt-0.5">
            Şirket kuruluşundan itibaren tüm gelir ve gider hareketleri
          </p>
        </div>
        <div className="flex items-center gap-2">
          {exportMsg && (
            <span className="text-xs text-emerald-600 font-medium animate-fade-in">{exportMsg}</span>
          )}
          {parasutService.isLoggedIn() && parasutService.getCompany() && (
            <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:text-[var(--enba-orange)] hover:border-[var(--enba-orange)]/40 transition-colors">
              <RefreshCw size={13} /> Paraşüt'ten Aktar
            </button>
          )}
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:text-emerald-600 hover:border-emerald-300 transition-colors">
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:text-red-500 hover:border-red-300 transition-colors">
            <FileText size={13} /> PDF
          </button>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white rounded-xl bg-[var(--enba-orange)] hover:bg-[var(--enba-orange-hover)] transition-all shadow-sm"
          >
            <Plus size={15} /> Kayıt Ekle
          </button>
        </div>
      </div>

      {/* ── KPI satırı ── */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 flex-shrink-0">
        <div className="bg-[var(--enba-surface)] rounded-2xl px-5 py-4 border border-[var(--enba-border)]">
          <div className="flex items-center gap-2 text-xs text-[var(--enba-text-muted)] mb-1">
            <TrendingUp size={12} className="text-emerald-500" /> Toplam Gelir
          </div>
          <div className="text-lg font-bold text-emerald-600">{fmtTL(totalGelir)}</div>
          <div className="text-xs text-[var(--enba-text-muted)] mt-0.5">
            {rows.filter(r => r.tip === 'gelir').length} kayıt
          </div>
        </div>
        <div className="bg-[var(--enba-surface)] rounded-2xl px-5 py-4 border border-[var(--enba-border)]">
          <div className="flex items-center gap-2 text-xs text-[var(--enba-text-muted)] mb-1">
            <TrendingDown size={12} className="text-red-500" /> Toplam Gider
          </div>
          <div className="text-lg font-bold text-red-500">{fmtTL(totalGider)}</div>
          <div className="text-xs text-[var(--enba-text-muted)] mt-0.5">
            {rows.filter(r => r.tip === 'gider').length} kayıt
          </div>
        </div>
        <div className={`bg-[var(--enba-surface)] rounded-2xl px-5 py-4 border ${bakiye >= 0 ? 'border-emerald-200' : 'border-red-200'}`}>
          <div className="flex items-center gap-2 text-xs text-[var(--enba-text-muted)] mb-1">
            Net Bakiye
          </div>
          <div className={`text-lg font-bold ${bakiye >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {fmtTL(bakiye)}
          </div>
          <div className="text-xs text-[var(--enba-text-muted)] mt-0.5">{rows.length} toplam kayıt</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="px-6 flex-shrink-0">
        <div className="flex gap-1 bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-xl p-1 w-fit">
          {([['kayitlar', 'Kayıtlar'], ['grafik', 'Grafik'], ['ozet', 'Özet']] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                tab === id
                  ? 'bg-[var(--enba-orange)] text-white shadow-sm'
                  : 'text-[var(--enba-text-muted)] hover:text-[var(--enba-text)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={14} /> {error}
            <button className="ml-auto text-xs underline" onClick={() => setError('')}>Kapat</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={24} className="animate-spin text-[var(--enba-orange)]" />
          </div>
        ) : (
          <>
            {/* ── KAYITLAR TAB ── */}
            {tab === 'kayitlar' && (
              <div className="space-y-3">
                {/* Filtre + sıralama */}
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-lg p-0.5">
                    {([['tümü', 'Tümü'], ['gider', 'Gider'], ['gelir', 'Gelir']] as [TipFilter, string][]).map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() => setTipFilter(id)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                          tipFilter === id
                            ? id === 'gider' ? 'bg-red-500 text-white' : id === 'gelir' ? 'bg-emerald-500 text-white' : 'bg-[var(--enba-orange)] text-white'
                            : 'text-[var(--enba-text-muted)]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setSortDir(p => p === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-1 text-xs text-[var(--enba-text-muted)] hover:text-[var(--enba-text)] transition-colors"
                  >
                    {sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {sortDir === 'asc' ? 'Eskiden yeniye' : 'Yeniden eskiye'}
                  </button>
                  <span className="ml-auto text-xs text-[var(--enba-text-muted)]">{displayed.length} kayıt</span>
                </div>

                {displayed.length === 0 ? (
                  <div className="text-center py-16 text-[var(--enba-text-muted)] text-sm">
                    {tipFilter === 'tümü' ? 'Henüz kayıt yok. "Kayıt Ekle" ile başlayın.' : `${tipFilter} kaydı bulunamadı.`}
                  </div>
                ) : (
                  <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--enba-border)] text-xs text-[var(--enba-text-muted)]">
                          <th className="px-4 py-3 text-left font-medium">Tarih</th>
                          <th className="px-4 py-3 text-left font-medium">Tip</th>
                          <th className="px-4 py-3 text-left font-medium">Kategori</th>
                          <th className="px-4 py-3 text-right font-medium">Tutar</th>
                          <th className="px-4 py-3 text-left font-medium">Açıklama</th>
                          <th className="px-2 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {displayed.map((r, i) => (
                          <tr
                            key={r.id}
                            className={`border-b border-[var(--enba-border)] last:border-0 hover:bg-[var(--enba-bg)] transition-colors ${i % 2 === 1 ? 'bg-[var(--enba-bg)]/30' : ''}`}
                          >
                            <td className="px-4 py-2.5 text-xs text-[var(--enba-text-muted)] whitespace-nowrap">{fmtDate(r.tarih)}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                r.tip === 'gider' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {r.tip === 'gider' ? 'Gider' : 'Gelir'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-[var(--enba-text)]">{r.kategori}</td>
                            <td className={`px-4 py-2.5 text-xs font-semibold text-right whitespace-nowrap ${r.tip === 'gider' ? 'text-red-500' : 'text-emerald-600'}`}>
                              {r.tip === 'gider' ? '−' : '+'}{fmtTL(r.tutar_tl)}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-[var(--enba-text-muted)] max-w-[200px] truncate">{r.aciklama}</td>
                            <td className="px-2 py-2.5">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setModal(r)}
                                  className="p-1 text-[var(--enba-text-muted)] hover:text-[var(--enba-orange)] rounded-lg hover:bg-[var(--enba-bg)] transition-colors"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => setDelId(r.id)}
                                  className="p-1 text-[var(--enba-text-muted)] hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── GRAFİK TAB ── */}
            {tab === 'grafik' && (
              <div className="space-y-6">
                {cumulativeData.length === 0 ? (
                  <div className="text-center py-16 text-[var(--enba-text-muted)] text-sm">Grafik için veri yok.</div>
                ) : (
                  <>
                    {/* Kümülatif Bakiye */}
                    <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl p-5">
                      <h3 className="text-sm font-semibold text-[var(--enba-text)] mb-4">Kümülatif Nakit Bakiyesi</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={cumulativeData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--enba-border)" />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--enba-text-muted)' }} />
                          <YAxis tickFormatter={v => (v / 1000).toFixed(0) + 'K'} tick={{ fontSize: 11, fill: 'var(--enba-text-muted)' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
                          <Line type="monotone" dataKey="bakiye" name="Bakiye" stroke="#E35205" strokeWidth={2.5} dot={{ r: 3, fill: '#E35205' }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Aylık Gelir / Gider */}
                    <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl p-5">
                      <h3 className="text-sm font-semibold text-[var(--enba-text)] mb-4">Aylık Gelir & Gider</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={cumulativeData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--enba-border)" />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--enba-text-muted)' }} />
                          <YAxis tickFormatter={v => (v / 1000).toFixed(0) + 'K'} tick={{ fontSize: 11, fill: 'var(--enba-text-muted)' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="gelir" name="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="gider" name="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── ÖZET TAB ── */}
            {tab === 'ozet' && (
              <div id="kn-pdf-content" className="space-y-6">
                {/* Başlık (PDF için) */}
                <div className="pdf-only hidden">
                  <h2 style={{ fontFamily: 'Arial', fontSize: 18, marginBottom: 4 }}>Nakit Akışı</h2>
                  <p style={{ fontFamily: 'Arial', fontSize: 11, color: '#666' }}>
                    Rapor tarihi: {new Date().toLocaleDateString('tr-TR')}
                  </p>
                </div>

                {/* KPI özet */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Toplam Gelir', value: totalGelir, color: 'text-emerald-600' },
                    { label: 'Toplam Gider', value: totalGider, color: 'text-red-500' },
                    { label: 'Net Bakiye',   value: bakiye,     color: bakiye >= 0 ? 'text-emerald-600' : 'text-red-500' },
                  ].map(k => (
                    <div key={k.label} className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl px-5 py-4">
                      <div className="text-xs text-[var(--enba-text-muted)] mb-1">{k.label}</div>
                      <div className={`text-xl font-bold ${k.color}`}>{fmtTL(k.value)}</div>
                    </div>
                  ))}
                </div>

                {/* Kategori tablosu */}
                {kategoriOzet.length > 0 && (
                  <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[var(--enba-border)]">
                      <h3 className="text-sm font-semibold text-[var(--enba-text)]">Kategori Bazlı Özet</h3>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--enba-border)] text-xs text-[var(--enba-text-muted)]">
                          <th className="px-5 py-3 text-left font-medium">Kategori</th>
                          <th className="px-5 py-3 text-right font-medium">Gelir</th>
                          <th className="px-5 py-3 text-right font-medium">Gider</th>
                          <th className="px-5 py-3 text-right font-medium">Net</th>
                          <th className="px-5 py-3 text-right font-medium">Pay %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kategoriOzet.map(k => (
                          <tr key={k.kategori} className="border-b border-[var(--enba-border)] last:border-0 hover:bg-[var(--enba-bg)] transition-colors">
                            <td className="px-5 py-2.5 text-xs text-[var(--enba-text)] font-medium">{k.kategori}</td>
                            <td className="px-5 py-2.5 text-xs text-emerald-600 text-right font-semibold">
                              {k.gelir > 0 ? fmtTL(k.gelir) : '—'}
                            </td>
                            <td className="px-5 py-2.5 text-xs text-red-500 text-right font-semibold">
                              {k.gider > 0 ? fmtTL(k.gider) : '—'}
                            </td>
                            <td className={`px-5 py-2.5 text-xs text-right font-bold ${k.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {fmtTL(k.net)}
                            </td>
                            <td className="px-5 py-2.5 text-xs text-[var(--enba-text-muted)] text-right">
                              {totalGider > 0 && k.gider > 0
                                ? `${((k.gider / totalGider) * 100).toFixed(1)}%`
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[var(--enba-bg)] border-t-2 border-[var(--enba-border)]">
                          <td className="px-5 py-3 text-xs font-bold text-[var(--enba-text)]">TOPLAM</td>
                          <td className="px-5 py-3 text-xs font-bold text-emerald-600 text-right">{fmtTL(totalGelir)}</td>
                          <td className="px-5 py-3 text-xs font-bold text-red-500 text-right">{fmtTL(totalGider)}</td>
                          <td className={`px-5 py-3 text-xs font-bold text-right ${bakiye >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtTL(bakiye)}</td>
                          <td className="px-5 py-3 text-xs font-bold text-[var(--enba-text-muted)] text-right">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {kategoriOzet.length === 0 && (
                  <div className="text-center py-16 text-[var(--enba-text-muted)] text-sm">Özet için veri yok.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modaller ── */}
      {importOpen && companyId && (
        <ImportModal
          companyId={companyId}
          onImported={newRows => { setRows(newRows); setImportOpen(false); }}
          onClose={() => setImportOpen(false)}
        />
      )}

      {modal !== null && (
        <EntryModal
          initial={modal === 'add' ? null : { tarih: modal.tarih, tip: modal.tip, kategori: modal.kategori, tutar_tl: modal.tutar_tl, aciklama: modal.aciklama }}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--enba-surface)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="font-semibold text-[var(--enba-text)] mb-2">Kaydı Sil</h3>
              <p className="text-sm text-[var(--enba-text-muted)]">Bu kayıt kalıcı olarak silinecek. Emin misiniz?</p>
            </div>
            <div className="px-6 py-4 flex justify-end gap-2 border-t border-[var(--enba-border)]">
              <button onClick={() => setDelId(null)} className="px-4 py-2 text-sm text-[var(--enba-text-muted)] hover:text-[var(--enba-text)] rounded-xl transition-colors">İptal</button>
              <button onClick={handleDelete} className="px-5 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
