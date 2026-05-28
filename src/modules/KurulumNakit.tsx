import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, X, AlertCircle, TrendingUp, TrendingDown,
  FileSpreadsheet, FileText, Loader2, ChevronDown, ChevronUp,
  RefreshCw, CheckCircle2, Link2,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { kurulumNakitAPI, type FoundingCashflow, type FCForm, type FCTip, type FCImportRecord } from '../api/kurulumNakit';
import { parasutService, type ParasutInvoice, type ParasutAccount } from '../api/parasut';
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
type SortKey = 'tarih' | 'kategori' | 'tutar_tl';

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
    inv.type === 'sales_invoices' ? 'Satış Tahsilatı'  :
    inv.type === 'expenditures'   ? 'Ödeme'            :
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

// ── Paraşüt transaction_type → Türkçe kategori ──────────────
function txnKategori(txType: string, tip: FCTip, description: string): string {
  // Açıklama varsa onu kullan (en anlamlı)
  if (description && description !== '—' && description.trim().length > 1) {
    return description.slice(0, 60);
  }
  const t = txType.toLowerCase();
  if (t === 'initial_account_balance') return 'Açılış Bakiyesi';
  if (tip === 'gelir') {
    if (t === 'contact_credit')           return 'Tahsilat';
    if (t.includes('sales'))              return 'Satış Tahsilatı';
    if (t.includes('_credit'))            return 'Tahsilat';
    return 'Diğer Gelir';
  } else {
    if (t === 'purchase_bill_payment')    return 'Fatura Ödemesi';
    if (t.startsWith('purchase_'))        return 'Fatura Ödemesi';
    if (t === 'contact_debit')            return 'Ödeme';
    if (t.startsWith('expense_'))         return 'Gider Ödemesi';
    if (t.startsWith('payroll_') || t.startsWith('salary_')) return 'Personel Ödemesi';
    if (t.startsWith('tax_'))             return 'Vergi Ödemesi';
    if (t.includes('_debit'))             return 'Ödeme';
    return 'Diğer Gider';
  }
}

// ── Paraşüt transaction → FCImportRecord ────────────────────
function mapTransaction(txn: import('../api/parasut').ParasutTransaction): FCImportRecord {
  const tip: FCTip = txn.amount >= 0 ? 'gelir' : 'gider';
  return {
    tarih:      txn.date,
    tip,
    kategori:   txnKategori(txn.transaction_type || '', tip, txn.description),
    tutar_tl:   Math.round(Math.abs(txn.amount_tl) * 100) / 100,
    aciklama:   `[${txn.account_name}] ${txn.description}`.slice(0, 200),
    parasut_id: `txn-${txn.account_id}-${txn.id}`,
  };
}

// ── ImportModal ──────────────────────────────────────────────
interface ImportModalProps {
  companyId: string;
  onImported: () => void;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ companyId, onImported, onClose }) => {
  const parasutCompany = parasutService.getCompany();
  const isConnected    = parasutService.isLoggedIn() && !!parasutCompany;

  const [fromDate,        setFromDate]        = useState('2020-01-01');
  const [toDate,          setToDate]          = useState(new Date().toISOString().slice(0, 10));
  const [step,            setStep]            = useState<'config' | 'preview' | 'done'>('config');
  const [loading,         setLoading]         = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [progress,        setProgress]        = useState<{ label: string; pct: number } | null>(null);
  const [err,             setErr]             = useState('');
  const [accounts,        setAccounts]        = useState<ParasutAccount[]>([]);
  const [selectedIds,     setSelectedIds]     = useState<Set<string>>(new Set());
  const [pending,         setPending]         = useState<FCImportRecord[]>([]);
  const [result,          setResult]          = useState<{ inserted: number; skipped: number } | null>(null);

  // Çakışan IBAN hesaplarını tespit et (e.g. Vakıfbank geçmiş + IBAN)
  const ibanConflicts = useMemo(() => {
    const ibanMap = new Map<string, ParasutAccount[]>();
    accounts.forEach(a => {
      if (a.iban) {
        const normalized = a.iban.replace(/\s/g, '');
        if (!ibanMap.has(normalized)) ibanMap.set(normalized, []);
        ibanMap.get(normalized)!.push(a);
      }
    });
    const conflicts: ParasutAccount[][] = [];
    ibanMap.forEach(group => { if (group.length > 1) conflicts.push(group); });
    return conflicts;
  }, [accounts]);

  // Hesapları yükle
  useEffect(() => {
    if (!isConnected || !parasutCompany) return;
    setLoadingAccounts(true);
    parasutService.getFinancialAccounts(parasutCompany.id)
      .then(accs => {
        setAccounts(accs);
        setSelectedIds(new Set(accs.map(a => a.id)));
      })
      .catch(e => setErr(e instanceof Error ? e.message : 'Hesaplar alınamadı'))
      .finally(() => setLoadingAccounts(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleAccount(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleFetch() {
    if (!parasutCompany || selectedIds.size === 0) return;
    setLoading(true); setErr('');
    const selected = accounts.filter(a => selectedIds.has(a.id));
    const allTxns: import('../api/parasut').ParasutTransaction[] = [];
    try {
      for (let i = 0; i < selected.length; i++) {
        const acc = selected[i];
        setProgress({ label: `${acc.name} hareketleri alınıyor… (${i + 1}/${selected.length})`, pct: Math.round((i / selected.length) * 60) });
        try {
          const txns = await parasutService.getAccountTransactions(parasutCompany.id, acc, fromDate, toDate);
          allTxns.push(...txns);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          setErr(prev => prev ? `${prev}\n${acc.name}: ${msg}` : `${acc.name}: ${msg}`);
        }
        // Hesaplar arası rate limit koruması
        if (i < selected.length - 1) await new Promise(r => setTimeout(r, 500));
      }

      setProgress({ label: 'Mevcut kayıtlar kontrol ediliyor…', pct: 70 });
      const mapped = allTxns.map(mapTransaction);

      const sb = (await import('../api/supabase')).supabase;
      let existingRaw: { parasut_id: string | null }[] = [];
      let ep = 0;
      while (true) {
        const { data: pg } = await sb
          .from('founding_cashflow').select('parasut_id')
          .eq('company_id', companyId).not('parasut_id', 'is', null).range(ep, ep + 999);
        existingRaw = existingRaw.concat(pg ?? []);
        if (!pg || pg.length < 1000) break;
        ep += 1000;
      }
      const existingIds = new Set(existingRaw.map(r => r.parasut_id));
      const newRecs = mapped.filter(r => !existingIds.has(r.parasut_id));

      setProgress({ label: 'Tamamlandı', pct: 100 });
      setPending(newRecs);
      setStep('preview');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Paraşüt verisi alınamadı');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  async function handleImport() {
    setLoading(true); setErr('');
    const total = pending.length;
    setProgress({ label: `0 / ${total} kayıt yazılıyor…`, pct: 0 });
    try {
      const res = await kurulumNakitAPI.batchImportWithProgress(
        companyId, pending,
        (done) => setProgress({ label: `${done} / ${total} kayıt yazılıyor…`, pct: Math.round((done / total) * 100) }),
        100,
      );
      setProgress({ label: 'Tamamlandı', pct: 100 });
      setResult(res);
      setStep('done');
      onImported();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? JSON.stringify(e);
      setErr(msg || 'Import hatası');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  const gelirCount = pending.filter(r => r.tip === 'gelir').length;
  const giderCount = pending.filter(r => r.tip === 'gider').length;

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
            {isConnected ? `Bağlı: ${parasutCompany!.name || parasutCompany!.id}` : 'Paraşüt bağlı değil — önce Paraşüt modülünden giriş yap'}
          </div>

          {isConnected && step === 'config' && !loading && (
            <>
              {/* Tarih aralığı */}
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

              {/* Hesap listesi */}
              <div>
                <label className="block text-xs font-medium text-[var(--enba-text-muted)] mb-2">Hesaplar</label>
                {loadingAccounts ? (
                  <div className="flex items-center gap-2 text-xs text-[var(--enba-text-muted)] py-2">
                    <Loader2 size={12} className="animate-spin text-[var(--enba-orange)]" /> Hesaplar yükleniyor…
                  </div>
                ) : accounts.length === 0 ? (
                  <p className="text-xs text-[var(--enba-text-muted)]">Kasa/banka hesabı bulunamadı.</p>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {accounts.map(acc => (
                      <label key={acc.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[var(--enba-border)] bg-[var(--enba-bg)] cursor-pointer hover:border-[var(--enba-orange)]/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(acc.id)}
                          onChange={() => toggleAccount(acc.id)}
                          className="accent-[var(--enba-orange)]"
                        />
                        <span className="flex-1 text-xs text-[var(--enba-text)]">{acc.name}</span>
                        <span className="text-[10px] text-[var(--enba-text-muted)] bg-[var(--enba-surface)] px-1.5 py-0.5 rounded-md border border-[var(--enba-border)]">
                          {acc.type === 'bank_accounts' ? 'Banka' : 'Kasa'}
                        </span>
                        <span className="text-xs font-semibold text-[var(--enba-text)]">
                          {acc.balance.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {acc.currency}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {ibanConflicts.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-400">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Çakışan hesap uyarısı</p>
                    {ibanConflicts.map((group, i) => (
                      <p key={i} className="mt-0.5 text-[10px]">
                        {group.map(a => a.name).join(' + ')} — aynı IBAN, <strong>sadece birini seçin</strong>
                      </p>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-[var(--enba-text-muted)]">
                Seçilen hesapların kasa/banka hareketleri çekilir. Zaten import edilmiş kayıtlar atlanır.
              </p>
            </>
          )}

          {/* İlerleme */}
          {loading && progress && (
            <div className="space-y-2 py-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--enba-text-muted)] flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin text-[var(--enba-orange)]" />
                  {progress.label}
                </span>
                <span className="font-semibold text-[var(--enba-text)]">{progress.pct}%</span>
              </div>
              <div className="w-full h-2 bg-[var(--enba-bg)] rounded-full overflow-hidden border border-[var(--enba-border)]">
                <div className="h-full bg-[var(--enba-orange)] rounded-full transition-all duration-500" style={{ width: `${progress.pct}%` }} />
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[var(--enba-bg)] rounded-xl py-3">
                  <div className="text-lg font-bold text-[var(--enba-text)]">{pending.length}</div>
                  <div className="text-xs text-[var(--enba-text-muted)]">Yeni kayıt</div>
                </div>
                <div className="bg-emerald-50 rounded-xl py-3">
                  <div className="text-lg font-bold text-emerald-600">{gelirCount}</div>
                  <div className="text-xs text-emerald-600">Giriş</div>
                </div>
                <div className="bg-red-50 rounded-xl py-3">
                  <div className="text-lg font-bold text-red-500">{giderCount}</div>
                  <div className="text-xs text-red-500">Çıkış</div>
                </div>
              </div>
              {pending.length === 0
                ? <p className="text-xs text-center text-[var(--enba-text-muted)] py-2">Seçilen aralıkta tüm kayıtlar zaten aktarılmış.</p>
                : <p className="text-xs text-[var(--enba-text-muted)]">{pending.length} hareket aktarılacak. Zaten var olanlar otomatik atlanır.</p>
              }
            </div>
          )}

          {step === 'done' && result && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={36} className="text-emerald-500" />
              <div className="text-center">
                <div className="font-semibold text-[var(--enba-text)]">{result.inserted} hareket aktarıldı</div>
                {result.skipped > 0 && <div className="text-xs text-[var(--enba-text-muted)] mt-1">{result.skipped} kayıt zaten vardı, atlandı</div>}
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
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white rounded-xl bg-[var(--enba-orange)] hover:bg-[var(--enba-orange-hover)] transition-all">Kapat</button>
          ) : loading ? (
            <span className="text-xs text-[var(--enba-text-muted)] mr-auto">İşlem devam ediyor, lütfen bekleyin…</span>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--enba-text-muted)] hover:text-[var(--enba-text)] rounded-xl transition-colors">İptal</button>
              {step === 'config' && (
                <button onClick={handleFetch} disabled={selectedIds.size === 0 || loadingAccounts}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-xl bg-[var(--enba-orange)] hover:bg-[var(--enba-orange-hover)] disabled:opacity-50 transition-all">
                  Verileri Getir
                </button>
              )}
              {step === 'preview' && pending.length > 0 && (
                <button onClick={handleImport}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-xl bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-2">
                  {pending.length} Kaydı Aktar
                </button>
              )}
              {step === 'preview' && pending.length === 0 && (
                <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white rounded-xl bg-[var(--enba-orange)] transition-all">Tamam</button>
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
                  {t === 'gider' ? 'Çıktı' : 'Girdi'}
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
  const [sortKey, setSortKey]     = useState<SortKey>('tarih');
  const [sortDir, setSortDir]     = useState<SortDir>('desc');
  const [chartFrom, setChartFrom] = useState('');
  const [chartTo,   setChartTo]   = useState(() => new Date().toISOString().slice(0, 10));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }
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
      let d = 0;
      if (sortKey === 'tarih')    d = a.tarih.localeCompare(b.tarih);
      else if (sortKey === 'kategori') d = a.kategori.localeCompare(b.kategori, 'tr');
      else if (sortKey === 'tutar_tl') d = a.tutar_tl - b.tutar_tl;
      return sortDir === 'asc' ? d : -d;
    });
    return list;
  }, [rows, tipFilter, sortKey, sortDir]);

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

  // Gün gün kasa bakiyesi
  const dailyData = useMemo(() => {
    if (rows.length === 0) return [];
    const sorted = [...rows].sort((a, b) => a.tarih.localeCompare(b.tarih));

    // Tarihe göre grupla
    const byDate: Record<string, { gelir: number; gider: number }> = {};
    for (const r of sorted) {
      if (!byDate[r.tarih]) byDate[r.tarih] = { gelir: 0, gider: 0 };
      if (r.tip === 'gelir') byDate[r.tarih].gelir += r.tutar_tl;
      else byDate[r.tarih].gider += r.tutar_tl;
    }

    // Kümülatif bakiye hesapla
    let cum = 0;
    const all = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => {
        cum += v.gelir - v.gider;
        const [y, m, d] = date.split('-');
        return { date, label: `${d}.${m}.${y.slice(2)}`, bakiye: cum, net: v.gelir - v.gider };
      });

    // Tarih aralığı filtresi
    const from = chartFrom || (all[0]?.date ?? '');
    const to   = chartTo   || new Date().toISOString().slice(0, 10);
    return all.filter(p => p.date >= from && p.date <= to);
  }, [rows, chartFrom, chartTo]);

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
            <TrendingUp size={12} className="text-emerald-500" /> Toplam Girdi
          </div>
          <div className="text-lg font-bold text-emerald-600">{fmtTL(totalGelir)}</div>
          <div className="text-xs text-[var(--enba-text-muted)] mt-0.5">
            {rows.filter(r => r.tip === 'gelir').length} kayıt
          </div>
        </div>
        <div className="bg-[var(--enba-surface)] rounded-2xl px-5 py-4 border border-[var(--enba-border)]">
          <div className="flex items-center gap-2 text-xs text-[var(--enba-text-muted)] mb-1">
            <TrendingDown size={12} className="text-red-500" /> Toplam Çıktı
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
                    {([['tümü', 'Tümü'], ['gider', 'Çıktı'], ['gelir', 'Girdi']] as [TipFilter, string][]).map(([id, label]) => (
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
                  <span className="ml-auto text-xs text-[var(--enba-text-muted)]">{displayed.length} kayıt</span>
                </div>

                {displayed.length === 0 ? (
                  <div className="text-center py-16 text-[var(--enba-text-muted)] text-sm">
                    {tipFilter === 'tümü' ? 'Henüz kayıt yok. "Kayıt Ekle" ile başlayın.' : `${tipFilter === 'gelir' ? 'Girdi' : 'Çıktı'} kaydı bulunamadı.`}
                  </div>
                ) : (
                  <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--enba-border)] text-xs text-[var(--enba-text-muted)]">
                          {([['tarih','Tarih','left'],['kategori','Kategori','left'],['tutar_tl','Tutar','right']] as [SortKey,string,string][]).map(([key, label, align]) => (
                            <th key={key} onClick={() => toggleSort(key)}
                              className={`px-4 py-3 text-${align} font-medium cursor-pointer select-none hover:text-[var(--enba-text)] transition-colors group`}>
                              <span className="inline-flex items-center gap-1">
                                {label}
                                <span className="opacity-0 group-hover:opacity-60 transition-opacity">
                                  {sortKey === key
                                    ? (sortDir === 'asc' ? <ChevronUp size={11}/> : <ChevronDown size={11}/>)
                                    : <ChevronDown size={11}/>}
                                </span>
                                {sortKey === key && <span className="opacity-80">{sortDir === 'asc' ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}</span>}
                              </span>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-left font-medium">Tip</th>
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
                            <td className="px-4 py-2.5 text-xs text-[var(--enba-text)]">{r.kategori}</td>
                            <td className={`px-4 py-2.5 text-xs font-semibold text-right whitespace-nowrap ${r.tip === 'gider' ? 'text-red-500' : 'text-emerald-600'}`}>
                              {r.tip === 'gider' ? '−' : '+'} {fmtTL(r.tutar_tl)}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                r.tip === 'gider' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {r.tip === 'gider' ? 'Çıktı' : 'Girdi'}
                              </span>
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
                    {/* Kasa Bakiyesi — gün gün */}
                    <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--enba-text)]">Gün Gün Kasa Bakiyesi</h3>
                          {dailyData.length > 0 && (
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-[var(--enba-text-muted)]">
                                Başlangıç:&nbsp;
                                <span className={`font-semibold ${dailyData[0].bakiye >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {fmtTL(dailyData[0].bakiye)}
                                </span>
                              </span>
                              <span className="text-xs text-[var(--enba-text-muted)]">
                                Son:&nbsp;
                                <span className={`font-semibold ${dailyData[dailyData.length - 1].bakiye >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {fmtTL(dailyData[dailyData.length - 1].bakiye)}
                                </span>
                              </span>
                              <span className="text-xs text-[var(--enba-text-muted)]">
                                Min:&nbsp;
                                <span className="font-semibold text-red-500">
                                  {fmtTL(Math.min(...dailyData.map(d => d.bakiye)))}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-[var(--enba-text-muted)]">Başlangıç</label>
                            <input
                              type="date"
                              value={chartFrom}
                              onChange={e => setChartFrom(e.target.value)}
                              className="bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-lg px-2 py-1 text-xs text-[var(--enba-text)] focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/30"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-[var(--enba-text-muted)]">Bitiş</label>
                            <input
                              type="date"
                              value={chartTo}
                              onChange={e => setChartTo(e.target.value)}
                              className="bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-lg px-2 py-1 text-xs text-[var(--enba-text)] focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/30"
                            />
                          </div>
                          {chartFrom && (
                            <button
                              onClick={() => setChartFrom('')}
                              className="text-xs text-[var(--enba-text-muted)] hover:text-[var(--enba-text)] transition-colors"
                              title="Tüm tarihler"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      {dailyData.length === 0 ? (
                        <div className="text-center py-8 text-[var(--enba-text-muted)] text-xs">Seçilen aralıkta veri yok.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <AreaChart data={dailyData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <defs>
                              <linearGradient id="kasaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#E35205" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#E35205" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--enba-border)" />
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 10, fill: 'var(--enba-text-muted)' }}
                              interval={Math.max(0, Math.floor(dailyData.length / 12) - 1)}
                              angle={dailyData.length > 30 ? -35 : 0}
                              textAnchor={dailyData.length > 30 ? 'end' : 'middle'}
                              height={dailyData.length > 30 ? 40 : 20}
                            />
                            <YAxis
                              tickFormatter={v => {
                                const abs = Math.abs(v);
                                if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
                                return (v / 1000).toFixed(0) + 'K';
                              }}
                              tick={{ fontSize: 10, fill: 'var(--enba-text-muted)' }}
                            />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                const b = (payload[0]?.value as number) ?? 0;
                                return (
                                  <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-xl px-3 py-2 shadow-lg text-xs">
                                    <div className="font-semibold text-[var(--enba-text)] mb-1">{label}</div>
                                    <div className={`font-bold text-sm ${b >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {fmtTL(b)}
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
                            <Area
                              type="monotone"
                              dataKey="bakiye"
                              name="Kasa Bakiyesi"
                              stroke="#E35205"
                              strokeWidth={2}
                              fill="url(#kasaGrad)"
                              dot={dailyData.length <= 60 ? { r: 2.5, fill: '#E35205', strokeWidth: 0 } : false}
                              activeDot={{ r: 5, fill: '#E35205' }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>

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
                          <Bar dataKey="gelir" name="Girdi" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="gider" name="Çıktı" fill="#ef4444" radius={[4, 4, 0, 0]} />
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
                    { label: 'Toplam Girdi', value: totalGelir, color: 'text-emerald-600' },
                    { label: 'Toplam Çıktı', value: totalGider, color: 'text-red-500' },
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
                          <th className="px-5 py-3 text-right font-medium">Girdi</th>
                          <th className="px-5 py-3 text-right font-medium">Çıktı</th>
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
          onImported={() => { load(); setImportOpen(false); }}
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
