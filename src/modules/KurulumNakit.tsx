import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, FileSpreadsheet, FileText,
  Loader2, ChevronDown, ChevronUp, RefreshCw, CheckCircle2,
  Link2, AlertCircle, Building2, X, Upload, Trash2, Eye, EyeOff,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { kurulumNakitAPI, type FoundingCashflow, type FCTip, type FCImportRecord } from '../api/kurulumNakit';
import { parasutService, type ParasutAccount } from '../api/parasut';
import { parasutExporter, type ExportState } from '../api/parasutExporter';
import { supabase } from '../api/supabase';
import type { UserProfile } from '../api/supabase';

interface KurulumNakitProps {
  profile: UserProfile | null;
}

type Tab = 'hesaplar' | 'hareketler' | 'grafik' | 'ozet' | 'aylik';
type TipFilter = 'tümü' | FCTip;
type SortDir = 'asc' | 'desc';
type SortKey = 'tarih' | 'kategori' | 'tutar_tl';

function fmtTL(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₺';
}

function fmtAmount(n: number, currency: string) {
  if (currency === 'TRL' || currency === 'TRY') return fmtTL(n);
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency;
}

function fmtDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}`;
}

function txnKategori(txType: string, tip: FCTip, description: string): string {
  const t = txType.toLowerCase();
  // Tip bazlı kategoriler her zaman description'dan önce gelir (transfer çift sayımını önler)
  if (t === 'initial_account_balance') return 'Açılış Bakiyesi';
  if (t === 'money_transfer')          return 'Hesaplar Arası Transfer';
  if (t === 'döviz_bozdurma')          return 'Hesaplar Arası Transfer';
  if (t === 'bank_fee_payment')        return 'Banka Masrafı';
  if (t === 'employee_debit')          return tip === 'gelir' ? 'Personel Tahsilatı' : 'Personel Ödemesi';
  if (description && description !== '—' && description.trim().length > 1) {
    return description.slice(0, 60);
  }
  if (tip === 'gelir') {
    if (t === 'contact_credit')  return 'Tahsilat';
    if (t.includes('sales'))     return 'Satış Tahsilatı';
    if (t.includes('_credit'))   return 'Tahsilat';
    return 'Diğer Gelir';
  } else {
    if (t === 'purchase_bill_payment')                               return 'Fatura Ödemesi';
    if (t.startsWith('purchase_'))                                   return 'Fatura Ödemesi';
    if (t === 'contact_debit')                                       return 'Ödeme';
    if (t.startsWith('expense_'))                                    return 'Gider Ödemesi';
    if (t.startsWith('payroll_') || t.startsWith('salary_'))        return 'Personel Ödemesi';
    if (t.startsWith('tax_'))                                        return 'Vergi Ödemesi';
    if (t.includes('_debit'))                                        return 'Ödeme';
    return 'Diğer Gider';
  }
}

function mapTransaction(txn: import('../api/parasut').ParasutTransaction): FCImportRecord {
  const tip: FCTip = txn.amount >= 0 ? 'gelir' : 'gider';
  return {
    tarih:            txn.date,
    tip,
    kategori:         txnKategori(txn.transaction_type || '', tip, txn.description),
    tutar_tl:         Math.round(Math.abs(txn.amount_tl) * 100) / 100,
    aciklama:         `[${txn.account_name}] ${txn.description}`.slice(0, 200),
    parasut_id:       `txn-${txn.account_id}-${txn.id}`,
    source_account:   txn.account_name,
    transaction_type: txn.transaction_type || '',
    balance_after:    txn.balance_after,
    is_reconciled:    txn.is_reconciled,
  };
}

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

export const KurulumNakit: React.FC<KurulumNakitProps> = ({ profile }) => {
  const syncingRef = React.useRef(false); // double-click / concurrent sync guard
  const [tab, setTab]               = useState<Tab>('hesaplar');
  const [rows, setRows]             = useState<FoundingCashflow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [tipFilter, setTipFilter]   = useState<TipFilter>('tümü');
  type RecFilter = 'tümü' | 'mutabık' | 'dengeleme';
  const [recFilter, setRecFilter]   = useState<RecFilter>('tümü');
  const [sortKey, setSortKey]       = useState<SortKey>('tarih');
  const [sortDir, setSortDir]       = useState<SortDir>('desc');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [chartFrom, setChartFrom]       = useState('');
  const [chartTo, setChartTo]           = useState(() => new Date().toISOString().slice(0, 10));
  const [chartAccountFilter, setChartAccountFilter] = useState<string>(''); // '' = tümü
  const [exportMsg, setExportMsg]   = useState('');

  const [accounts, setAccounts]           = useState<ParasutAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const [syncing, setSyncing]             = useState(false);
  const [syncProgress, setSyncProgress]   = useState<{ label: string; pct: number } | null>(null);
  const [syncResult, setSyncResult]       = useState<{ inserted: number; skipped: number } | null>(null);

  const [dailyBalances, setDailyBalances] = useState<{ account_name: string; tarih: string; bakiye: number }[]>([]);
  const [importModal, setImportModal]     = useState(false);
  const [importAccount, setImportAccount] = useState('');
  const [importJson, setImportJson]       = useState('');
  const [exportState, setExportState]     = useState<ExportState | null>(() => parasutExporter.getState());
  type DeleteStep = 'warn' | 'auth' | 'deleting' | 'done';
  const [deleteModal, setDeleteModal]     = useState<{ acc: ParasutAccount; step: DeleteStep; error?: string; result?: { deletedRows: number; deletedBalances: number } } | null>(null);
  const [deleteEmail, setDeleteEmail]     = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteShowPw, setDeleteShowPw]   = useState(false);
  const [importMsg, setImportMsg]         = useState('');

  const companyId        = profile?.company_id ?? null;
  const parasutCompany   = parasutService.getCompany();
  const isParasutConnected = parasutService.isLoggedIn() && !!parasutCompany;

  // Hesap bazlı dahil/hariç ayarı — localStorage'da kalıcı, account.id ile keyed
  const [excludedAccounts, setExcludedAccounts] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('enba_nakit_excluded_accounts');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch { return new Set(); }
  });

  type AccType = 'banka' | 'cari' | 'doviz';

  // Devam hesabı: continuationOf[accountId] = primaryAccountId
  // "Bu hesap, birincil hesabın kapandıktan sonra açılan devamıdır"
  // Birincil hesabın kapanış bakiyesi = devam hesabının açılış bakiyesi → çift sayımı önlemek için
  // devam hesabının initial_account_balance'ı atlanır.
  const [continuationOf, setContinuationOf] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('enba_nakit_continuation');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  function setContinuation(continuationId: string, primaryId: string | null) {
    setContinuationOf(prev => {
      const next = { ...prev };
      if (primaryId) next[continuationId] = primaryId;
      else delete next[continuationId];
      localStorage.setItem('enba_nakit_continuation', JSON.stringify(next));
      return next;
    });
  }

  // Paraşüt'e aktarım için işaretlenmiş hesaplar — localStorage'da kalıcı
  const [parasutExportAccounts, setParasutExportAccounts] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('enba_nakit_parasut_export');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch { return new Set(); }
  });

  function toggleParasutExport(accId: string) {
    setParasutExportAccounts(prev => {
      const next = new Set(prev);
      if (next.has(accId)) next.delete(accId); else next.add(accId);
      localStorage.setItem('enba_nakit_parasut_export', JSON.stringify([...next]));
      return next;
    });
  }

  // Kullanıcı tarafından atanan hesap tipleri — localStorage'da kalıcı
  const [accountTypesMap, setAccountTypesMap] = useState<Record<string, AccType>>(() => {
    try {
      const saved = localStorage.getItem('enba_nakit_account_types');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  function autoDetectType(acc: ParasutAccount): AccType {
    if (acc.currency === 'EUR') return 'doviz';
    return 'banka';
  }

  function getAccType(acc: ParasutAccount): AccType {
    return accountTypesMap[acc.id] ?? autoDetectType(acc);
  }

  function cycleAccType(accId: string, current: AccType) {
    const order: AccType[] = ['banka', 'cari', 'doviz'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    const updated = { ...accountTypesMap, [accId]: next };
    setAccountTypesMap(updated);
    localStorage.setItem('enba_nakit_account_types', JSON.stringify(updated));
  }

  function toggleAccountExclusion(accountId: string) {
    setExcludedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) next.delete(accountId); else next.add(accountId);
      localStorage.setItem('enba_nakit_excluded_accounts', JSON.stringify([...next]));
      return next;
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [data, balances] = await Promise.all([
        kurulumNakitAPI.list(companyId),
        kurulumNakitAPI.listDailyBalances(companyId),
      ]);
      setRows(data);
      setDailyBalances(balances);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yükleme hatası');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  // Singleton exporter'a abone ol — sayfa değişse de export devam eder
  useEffect(() => parasutExporter.subscribe(setExportState), []);

  useEffect(() => {
    if (!isParasutConnected || !parasutCompany) return;
    setAccountsLoading(true);
    parasutService.getFinancialAccounts(parasutCompany.id)
      .then(setAccounts)
      .catch(() => {})
      .finally(() => setAccountsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Satış tipi işlemler: gerçek gelir kaynakları
  const SATIS_TYPES = ['contact_credit', 'sales_invoice_payment', 'sales_receipt_payment', 'account_debit'];

  // Hesaplamalarda yalnızca mutabık (is_reconciled !== false) satırlar kullanılır.
  // is_reconciled === false → Paraşüt'te tik yok, dengeleme kaydı — tüm KPI/grafik/özet dışında tutulur.
  // is_reconciled === null  → eski kayıt (bilinmiyor) → dahil edilir.
  const calcRows = useMemo(() => rows.filter(r => r.is_reconciled !== false), [rows]);

  // Hesaplar arası transferler görsel listede gösterilir ama KPI'dan hariç (chart/ozet için)
  const nonTransfer   = useMemo(() => calcRows.filter(r => r.kategori !== 'Hesaplar Arası Transfer'), [calcRows]);

  // KPI 1: Satış Tahsilatı — contact_credit, sales_* tipler
  const totalSatisGeliri = useMemo(() =>
    calcRows.filter(r => r.tip === 'gelir' && SATIS_TYPES.includes(r.transaction_type ?? '')).reduce((s, r) => s + r.tutar_tl, 0),
  [calcRows]);

  // KPI 2: Diğer Girdi — money_transfer girdi (sermaye/borç) ve diğerleri
  const totalDigerGelir = useMemo(() =>
    calcRows.filter(r => r.tip === 'gelir' && !SATIS_TYPES.includes(r.transaction_type ?? '')).reduce((s, r) => s + r.tutar_tl, 0),
  [calcRows]);

  // KPI 3: Toplam Gider — tüm çıkışlar (transferler dahil, gerçek harcama)
  const totalGider = useMemo(() => calcRows.filter(r => r.tip === 'gider').reduce((s, r) => s + r.tutar_tl, 0), [calcRows]);

  // Transfer detayları (Özet tablosu için)
  const transferGelir = useMemo(() =>
    calcRows.filter(r => r.kategori === 'Hesaplar Arası Transfer' && r.tip === 'gelir').reduce((s, r) => s + r.tutar_tl, 0),
  [calcRows]);
  const transferGider = useMemo(() =>
    calcRows.filter(r => r.kategori === 'Hesaplar Arası Transfer' && r.tip === 'gider').reduce((s, r) => s + r.tutar_tl, 0),
  [calcRows]);

  // Eskiyle uyumluluk
  const totalGelir = totalSatisGeliri + totalDigerGelir;
  const bakiye     = totalGelir - totalGider;
  const transferCount = useMemo(() => calcRows.filter(r => r.kategori === 'Hesaplar Arası Transfer').length, [calcRows]);

  // Devam hesabı atanan geçmiş (pasif) hesapların ID kümesi
  // continuationOf[B] = A  →  A pasif, B aktif
  // KPI hesaplamalarında ve kart listesinde A gösterilmez.
  const continuationTargets = useMemo(
    () => new Set(Object.values(continuationOf)),
    [continuationOf],
  );

  // Paraşüt canlı bakiyesi (TRL hesaplar toplamı) — pasif hesaplar hariç
  const parasutNetTRL = useMemo(() => {
    if (accounts.length === 0) return null;
    const trlAccs = accounts.filter(a =>
      (a.currency === 'TRL' || a.currency === 'TRY') && !continuationTargets.has(a.id),
    );
    if (trlAccs.length === 0) return null;
    return trlAccs.reduce((s, a) => s + a.balance, 0);
  }, [accounts, continuationTargets]);

  // Banka nakdi: "banka" tipindeki TRL hesaplar — pasif hesaplar hariç
  const bankaNakdi = useMemo(() => {
    if (accounts.length === 0) return null;
    const bankaAccs = accounts.filter(a =>
      getAccType(a) === 'banka' &&
      (a.currency === 'TRL' || a.currency === 'TRY') &&
      !continuationTargets.has(a.id),
    );
    if (bankaAccs.length === 0) return null;
    return bankaAccs.reduce((s, a) => s + a.balance, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, accountTypesMap, continuationTargets]);

  // Cari alacaklar: "cari" tipindeki TRL hesaplar — pasif hesaplar hariç
  const cariAlacak = useMemo(() => {
    if (accounts.length === 0) return null;
    const cariAccs = accounts.filter(a =>
      getAccType(a) === 'cari' &&
      (a.currency === 'TRL' || a.currency === 'TRY') &&
      !continuationTargets.has(a.id),
    );
    if (cariAccs.length === 0) return null;
    const total = cariAccs.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
    return total > 0 ? total : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, accountTypesMap, continuationTargets]);

  // Sermaye: EUR hesaplarının negatif bakiyeleri — pasif hesaplar hariç
  const enesSermai = useMemo(() => {
    if (accounts.length === 0) return null;
    const eurAccs = accounts.filter(a => a.currency === 'EUR' && !continuationTargets.has(a.id));
    if (eurAccs.length === 0) return null;
    const total = eurAccs.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0);
    return Math.abs(total);
  }, [accounts, continuationTargets]);

  const allAccountNames = useMemo(() => {
    const names = new Set(rows.map(r => r.source_account).filter(Boolean) as string[]);
    return [...names].sort((a, b) => a.localeCompare(b, 'tr'));
  }, [rows]);

  const displayed = useMemo(() => {
    let list = rows;
    if (tipFilter !== 'tümü') list = list.filter(r => r.tip === tipFilter);
    if (accountFilter) list = list.filter(r => r.source_account === accountFilter);
    if (recFilter === 'mutabık')   list = list.filter(r => r.is_reconciled === true);
    if (recFilter === 'dengeleme') list = list.filter(r => r.is_reconciled === false);
    list = [...list].sort((a, b) => {
      let d = 0;
      if (sortKey === 'tarih')         d = a.tarih.localeCompare(b.tarih);
      else if (sortKey === 'kategori') d = a.kategori.localeCompare(b.kategori, 'tr');
      else if (sortKey === 'tutar_tl') d = a.tutar_tl - b.tutar_tl;
      return sortDir === 'asc' ? d : -d;
    });
    return list;
  }, [rows, tipFilter, recFilter, accountFilter, sortKey, sortDir]);

  // Grafik: operasyonel nakit akışı (transfer hariç).
  // "Kasa bakiyesi" değil, "operasyonel nakit pozisyonu" gösterir.
  // Enes/Başar sermaye girişleri grafik dışındadır — bunlar Net Bakiye KPI'da
  // Paraşüt canlı bakiyesi olarak doğru şekilde yansır.
  const cumulativeData = useMemo(() => {
    const sorted = [...nonTransfer].sort((a, b) => a.tarih.localeCompare(b.tarih));
    let cumulative = 0;
    const byMonth: Record<string, { gelir: number; gider: number }> = {};
    for (const r of sorted) {
      const month = r.tarih.slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { gelir: 0, gider: 0 };
      if (r.tip === 'gelir') byMonth[month].gelir += r.tutar_tl;
      else byMonth[month].gider += r.tutar_tl;
    }
    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => {
      cumulative += v.gelir - v.gider;
      const [y, m] = month.split('-');
      return { label: `${m}/${y.slice(2)}`, gelir: v.gelir, gider: v.gider, bakiye: cumulative };
    });
  }, [nonTransfer]);

  const dailyData = useMemo(() => {
    if (nonTransfer.length === 0) return [];
    const byDate: Record<string, { gelir: number; gider: number }> = {};
    for (const r of nonTransfer) {
      if (!byDate[r.tarih]) byDate[r.tarih] = { gelir: 0, gider: 0 };
      if (r.tip === 'gelir') byDate[r.tarih].gelir += r.tutar_tl;
      else byDate[r.tarih].gider += r.tutar_tl;
    }
    let cum = 0;
    const all = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => {
        cum += v.gelir - v.gider;
        const [y, m, d] = date.split('-');
        return { date, label: `${d}.${m}.${y.slice(2)}`, bakiye: cum };
      });
    const from = chartFrom || (all[0]?.date ?? '');
    const to   = chartTo   || new Date().toISOString().slice(0, 10);
    return all.filter(p => p.date >= from && p.date <= to);
  }, [nonTransfer, chartFrom, chartTo]);

  // Banka tipindeki hesapların günlük nakit bakiyesi
  // Yöntem A: account_daily_balance tablosunda içe aktarılmış veri varsa onu kullan
  // Yöntem B: rows'dan hesapla — initial_account_balance açılış noktası, tüm hareketler üstüne eklenir
  const bankaDailyData = useMemo(() => {
    const bankaAccs = accounts.filter(a =>
      getAccType(a) === 'banka' &&
      (a.currency === 'TRL' || a.currency === 'TRY') &&
      (chartAccountFilter === '' || a.id === chartAccountFilter || continuationOf[a.id] === chartAccountFilter)
    );
    if (bankaAccs.length === 0) return [];
    const bankaNames = new Set(bankaAccs.map(a => a.name));

    // Yöntem A: içe aktarılmış bakiye verisi
    const relevant = dailyBalances.filter(r => bankaNames.has(r.account_name));
    if (relevant.length > 0) {
      const byDate: Record<string, Record<string, number>> = {};
      for (const r of relevant) {
        if (!byDate[r.tarih]) byDate[r.tarih] = {};
        byDate[r.tarih][r.account_name] = r.bakiye;
      }
      const lastKnown: Record<string, number> = {};
      const all = Object.keys(byDate).sort().map(date => {
        Object.assign(lastKnown, byDate[date]);
        const total = Object.values(lastKnown).reduce((s, v) => s + v, 0);
        const [y, m, d] = date.split('-');
        return { date, label: `${d}.${m}.${y.slice(2)}`, bakiye: total };
      });
      const from = chartFrom || (all[0]?.date ?? '');
      const to   = chartTo   || new Date().toISOString().slice(0, 10);
      return all.filter(p => p.date >= from && p.date <= to);
    }

    // Yöntem B: initial_account_balance açılış + tüm banka hareketleri kümülatif
    // Devam hesaplarının initial_account_balance'ı atlanır (birincil hesabın kapanış bakiyesi = devamın açılışı)
    const continuationAccIds = new Set(
      accounts.filter(a => continuationOf[a.id]).map(a => a.name)
    );
    const bankaRows = calcRows.filter(r => {
      if (!r.source_account || !bankaNames.has(r.source_account)) return false;
      if (continuationAccIds.has(r.source_account) && r.transaction_type === 'initial_account_balance') return false;
      return true;
    });
    const hasOpening = bankaRows.some(r => r.transaction_type === 'initial_account_balance');
    if (!hasOpening) return [];  // açılış kaydı yoksa → yeniden senkronize et

    const byDate: Record<string, number> = {};
    for (const r of bankaRows) {
      byDate[r.tarih] = (byDate[r.tarih] ?? 0) + (r.tip === 'gelir' ? r.tutar_tl : -r.tutar_tl);
    }
    // Kümülatif seri hesapla
    let cum = 0;
    const raw = Object.keys(byDate).sort().map(date => {
      cum += byDate[date];
      const [y, m, d] = date.split('-');
      return { date, label: `${d}.${m}.${y.slice(2)}`, bakiye: cum };
    });
    if (raw.length === 0) return [];

    // Paraşüt canlı bakiyesine sabitle: son nokta = gerçek bakiye
    const liveBakiye = bankaAccs.reduce((s, a) => s + a.balance, 0);
    const offset = liveBakiye - raw[raw.length - 1].bakiye;
    const all = raw.map(p => ({ ...p, bakiye: p.bakiye + offset }));

    const from = chartFrom || (all[0]?.date ?? '');
    const to   = chartTo   || new Date().toISOString().slice(0, 10);
    return all.filter(p => p.date >= from && p.date <= to);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calcRows, dailyBalances, accounts, accountTypesMap, continuationOf, chartAccountFilter, chartFrom, chartTo]);

  const AYLAR = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  const aylikData = useMemo(() => {
    const byMonth: Record<string, { satis: number; sermaye: number; gider: number }> = {};
    for (const r of calcRows) {
      const month = r.tarih.slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { satis: 0, sermaye: 0, gider: 0 };
      if (r.tip === 'gelir') {
        if (SATIS_TYPES.includes(r.transaction_type ?? '')) byMonth[month].satis += r.tutar_tl;
        else byMonth[month].sermaye += r.tutar_tl;
      } else {
        byMonth[month].gider += r.tutar_tl;
      }
    }
    let cumulative = 0;
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => {
        const net = v.satis + v.sermaye - v.gider;
        cumulative += net;
        const [y, m] = month.split('-');
        return { label: `${AYLAR[parseInt(m)]} ${y}`, satis: v.satis, sermaye: v.sermaye, gider: v.gider, net, kumNet: cumulative };
      });
  }, [calcRows]);

  const hesapOdemeler = useMemo(() => {
    const byAcc: Record<string, number> = {};
    for (const r of calcRows) {
      if (r.tip === 'gider' && r.source_account) {
        byAcc[r.source_account] = (byAcc[r.source_account] ?? 0) + r.tutar_tl;
      }
    }
    return Object.entries(byAcc)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [calcRows]);

  const kategoriOzet = useMemo(() => {
    const map: Record<string, { gelir: number; gider: number }> = {};
    for (const r of nonTransfer) {
      if (!map[r.kategori]) map[r.kategori] = { gelir: 0, gider: 0 };
      if (r.tip === 'gelir') map[r.kategori].gelir += r.tutar_tl;
      else map[r.kategori].gider += r.tutar_tl;
    }
    return Object.entries(map)
      .map(([k, v]) => ({ kategori: k, ...v, net: v.gelir - v.gider }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [rows]);

  async function handleFullResync() {
    if (!isParasutConnected || !parasutCompany || !companyId || syncingRef.current) return;
    if (!window.confirm('Tüm mevcut nakit akışı kayıtları silinecek ve Paraşüt\'ten yeniden çekilecek. Devam edilsin mi?')) return;
    setSyncing(true);
    setSyncResult(null);
    setError('');
    setSyncProgress({ label: 'Mevcut kayıtlar temizleniyor…', pct: 2 });
    try {
      await kurulumNakitAPI.clearAll(companyId);
      setRows([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Temizleme hatası');
      setSyncing(false);
      return;
    }
    await handleSync();
  }

  async function handleExportToParasut(acc: ParasutAccount) {
    if (!isParasutConnected || !parasutCompany || !companyId) return;
    parasutExporter.start(rows, acc, companyId, parasutCompany.id)
      .then(() => kurulumNakitAPI.list(companyId).then(setRows).catch(() => {}));
  }

  async function handleConfirmDelete() {
    if (!deleteModal || !companyId) return;
    setDeleteModal(m => m ? { ...m, step: 'deleting', error: undefined } : null);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: deleteEmail, password: deletePassword });
      if (authErr) throw new Error('E-posta veya şifre hatalı');
      const result = await kurulumNakitAPI.deleteAccountWithBackup(companyId, deleteModal.acc.name, deleteEmail);
      const updated = await kurulumNakitAPI.list(companyId);
      setRows(updated);
      const updatedBal = await kurulumNakitAPI.listDailyBalances(companyId);
      setDailyBalances(updatedBal);
      setDeleteModal(m => m ? { ...m, step: 'done', result } : null);
      setDeleteEmail('');
      setDeletePassword('');
    } catch (e) {
      setDeleteModal(m => m ? { ...m, step: 'auth', error: e instanceof Error ? e.message : 'Hata' } : null);
    }
  }

  async function handleSync() {
    if (!isParasutConnected || !parasutCompany || !companyId || syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    setSyncResult(null);
    setError('');

    let accs = accounts;
    if (accs.length === 0) {
      setSyncProgress({ label: 'Hesaplar alınıyor…', pct: 2 });
      accs = await parasutService.getFinancialAccounts(parasutCompany.id).catch(() => []);
      if (accs.length > 0) setAccounts(accs);
    }
    if (accs.length === 0) { setSyncing(false); return; }

    const allTxns: import('../api/parasut').ParasutTransaction[] = [];
    const today = new Date().toISOString().slice(0, 10);
    // Yalnızca TRL hesaplar senkronize edilir.
    // EUR hesaplar (ör. Enes Eşsiz Euro) TRL nakit akışına karıştırılmaz:
    // TRL→EUR döviz alımı money_transfer olarak dışlanırken EUR harcamalar
    // TL karşılığıyla gider sayılıyor → büyük yapay negatif bakiye oluşur.
    // EUR pozisyonu Hesaplar sekmesinde canlı bakiye olarak gösterilir.
    const trlAccs = accs.filter(a =>
      (a.currency === 'TRL' || a.currency === 'TRY') &&
      !excludedAccounts.has(a.id)
    );
    for (let i = 0; i < trlAccs.length; i++) {
      const acc = trlAccs[i];
      setSyncProgress({ label: `${acc.name}… (${i + 1}/${trlAccs.length})`, pct: Math.round(5 + (i / trlAccs.length) * 65) });
      try {
        const txns = await parasutService.getAccountTransactions(parasutCompany.id, acc, '2020-01-01', today);
        allTxns.push(...txns);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(prev => prev ? `${prev}; ${acc.name}: ${msg}` : `${acc.name}: ${msg}`);
      }
      if (i < trlAccs.length - 1) await new Promise(r => setTimeout(r, 1500)); // 429 koruma
    }

    if (allTxns.length === 0) { syncingRef.current = false; setSyncing(false); setSyncProgress(null); return; }

    setSyncProgress({ label: 'Veritabanına yazılıyor…', pct: 75 });
    const mapped = allTxns.map(mapTransaction);
    try {
      const res = await kurulumNakitAPI.batchImportWithProgress(
        companyId, mapped,
        (done) => setSyncProgress({ label: `${done}/${mapped.length} kayıt…`, pct: 75 + Math.round((done / mapped.length) * 23) }),
        100,
      );
      setSyncProgress({ label: 'Tamamlandı ✓', pct: 100 });
      setSyncResult(res);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync hatası');
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      setTimeout(() => setSyncProgress(null), 4000);
    }
  }

  function exportExcel() {
    const lines = [
      'Tarih\tHesap\tTip\tKategori\tTutar (TL)\tAçıklama',
      ...rows
        .sort((a, b) => a.tarih.localeCompare(b.tarih))
        .map(r => `${fmtDate(r.tarih)}\t${r.source_account || ''}\t${r.tip}\t${r.kategori}\t${r.tutar_tl}\t${r.aciklama}`),
      '',
      `Toplam Gelir\t\t\t\t${totalGelir}`,
      `Toplam Gider\t\t\t\t${totalGider}`,
      `Bakiye\t\t\t\t${bakiye}`,
    ];
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/tab-separated-values;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nakit_akışı_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(a.href);
    setExportMsg('Excel indirildi');
    setTimeout(() => setExportMsg(''), 2500);
  }

  function exportHamVeri() {
    const lines = [
      'Tarih\tHesap\tParaşüt Tip Kodu\tKategori\tGelir/Gider\tTutar (TL)\tAçıklama\tParaşüt ID',
      ...rows
        .sort((a, b) => a.tarih.localeCompare(b.tarih))
        .map(r => [
          fmtDate(r.tarih),
          r.source_account || '',
          r.transaction_type || '',
          r.kategori,
          r.tip,
          r.tutar_tl,
          r.aciklama,
          r.parasut_id || '',
        ].join('\t')),
    ];
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/tab-separated-values;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nakit_ham_veri_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(a.href);
    setExportMsg('Ham veri indirildi');
    setTimeout(() => setExportMsg(''), 2500);
  }

  function exportAccountExcel(accountName: string, data: typeof rows) {
    const safe = accountName.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
    const gelir = data.filter(r => r.tip === 'gelir').reduce((s, r) => s + r.tutar_tl, 0);
    const gider = data.filter(r => r.tip === 'gider').reduce((s, r) => s + r.tutar_tl, 0);
    const lines = [
      `Hesap: ${accountName}`,
      `Rapor tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
      '',
      'Tarih\tKategori\tTutar (TL)\tTip\tAçıklama',
      ...data
        .sort((a, b) => a.tarih.localeCompare(b.tarih))
        .map(r => `${fmtDate(r.tarih)}\t${r.kategori}\t${r.tutar_tl}\t${r.tip}\t${r.aciklama}`),
      '',
      `Toplam Gelir\t\t${gelir}`,
      `Toplam Gider\t\t${gider}`,
      `Net\t\t${gelir - gider}`,
    ];
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/tab-separated-values;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${safe}_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(a.href);
    setExportMsg(`${accountName.slice(0, 20)} indirildi`);
    setTimeout(() => setExportMsg(''), 2500);
  }

  async function exportAccountPDF(accountName: string, data: typeof rows) {
    setExportMsg('PDF hazırlanıyor...');
    const safe = accountName.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
    const gelir = data.filter(r => r.tip === 'gelir').reduce((s, r) => s + r.tutar_tl, 0);
    const gider = data.filter(r => r.tip === 'gider').reduce((s, r) => s + r.tutar_tl, 0);
    const sorted = [...data].sort((a, b) => a.tarih.localeCompare(b.tarih));
    const el = document.createElement('div');
    el.style.fontFamily = 'Arial, sans-serif';
    el.style.padding = '20px';
    el.innerHTML = `
      <h2 style="font-size:16px;margin-bottom:4px">${accountName}</h2>
      <p style="font-size:11px;color:#666;margin-bottom:16px">Rapor: ${new Date().toLocaleDateString('tr-TR')} · ${data.length} kayıt</p>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="border:1px solid #ddd;padding:6px;text-align:left">Tarih</th>
            <th style="border:1px solid #ddd;padding:6px;text-align:left">Kategori</th>
            <th style="border:1px solid #ddd;padding:6px;text-align:right">Tutar (TL)</th>
            <th style="border:1px solid #ddd;padding:6px;text-align:left">Tip</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(r => `
            <tr>
              <td style="border:1px solid #eee;padding:5px">${fmtDate(r.tarih)}</td>
              <td style="border:1px solid #eee;padding:5px">${r.kategori}</td>
              <td style="border:1px solid #eee;padding:5px;text-align:right;color:${r.tip === 'gider' ? '#dc2626' : '#16a34a'}">${r.tip === 'gider' ? '−' : '+'}${fmtTL(r.tutar_tl)}</td>
              <td style="border:1px solid #eee;padding:5px">${r.tip}</td>
            </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr style="background:#f5f5f5;font-weight:bold">
            <td colspan="2" style="border:1px solid #ddd;padding:6px">TOPLAM</td>
            <td style="border:1px solid #ddd;padding:6px;text-align:right;color:#16a34a">+${fmtTL(gelir)}</td>
            <td style="border:1px solid #ddd;padding:6px"></td>
          </tr>
          <tr style="background:#f5f5f5;font-weight:bold">
            <td colspan="2" style="border:1px solid #ddd;padding:6px"></td>
            <td style="border:1px solid #ddd;padding:6px;text-align:right;color:#dc2626">−${fmtTL(gider)}</td>
            <td style="border:1px solid #ddd;padding:6px"></td>
          </tr>
          <tr style="background:#e0f2fe;font-weight:bold">
            <td colspan="2" style="border:1px solid #ddd;padding:6px">NET</td>
            <td style="border:1px solid #ddd;padding:6px;text-align:right;color:${gelir-gider>=0?'#16a34a':'#dc2626'}">${gelir-gider>=0?'+':''}${fmtTL(gelir-gider)}</td>
            <td style="border:1px solid #ddd;padding:6px"></td>
          </tr>
        </tfoot>
      </table>`;
    document.body.appendChild(el);
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `${safe}_${new Date().toISOString().slice(0, 10)}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(el).save();
      setExportMsg('PDF indirildi');
    } catch { setExportMsg('PDF hatası'); }
    document.body.removeChild(el);
    setTimeout(() => setExportMsg(''), 3000);
  }

  async function exportPDF() {
    setExportMsg('PDF hazırlanıyor...');
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      const el = document.getElementById('kn-pdf-content');
      if (!el) return;
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `nakit_akışı_${new Date().toISOString().slice(0, 10)}.pdf`,
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

  if (!companyId) {
    return <div className="p-8 text-center text-[var(--enba-text-muted)] text-sm">Şirket bilgisi bulunamadı.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[var(--enba-bg)] animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-[var(--enba-surface)] border-b border-[var(--enba-border)] flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-[var(--enba-text)]">Nakit Akışı</h1>
          <p className="text-xs text-[var(--enba-text-muted)] mt-0.5">Paraşüt entegrasyonlu kasa ve banka takibi</p>
        </div>
        <div className="flex items-center gap-2">
          {exportMsg && (
            <span className="text-xs text-emerald-600 font-medium animate-fade-in">{exportMsg}</span>
          )}
          {syncResult && !syncing && !syncProgress && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 size={12} /> {syncResult.inserted} yeni kayıt
            </span>
          )}
          {isParasutConnected && (
            <>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--enba-orange)]/40 text-[var(--enba-orange)] hover:bg-[var(--enba-orange)]/5 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Senkronize ediliyor…' : 'Güncelle'}
              </button>
              <button
                onClick={handleFullResync}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:text-orange-600 hover:border-orange-300 disabled:opacity-50 transition-colors"
                title="Tüm kayıtları sil ve Paraşüt'ten yeniden çek"
              >
                <RefreshCw size={13} />
                Yeniden Senkronize Et
              </button>
            </>
          )}
          <button onClick={exportHamVeri}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:text-blue-600 hover:border-blue-300 transition-colors">
            <FileSpreadsheet size={13} /> Ham Veri
          </button>
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:text-emerald-600 hover:border-emerald-300 transition-colors">
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:text-red-500 hover:border-red-300 transition-colors">
            <FileText size={13} /> PDF
          </button>
        </div>
      </div>

      {/* ── Sync progress bar ── */}
      {syncProgress && (
        <div className="px-6 py-2 bg-[var(--enba-surface)] border-b border-[var(--enba-border)] flex-shrink-0">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--enba-text-muted)] flex items-center gap-1.5">
              {syncProgress.pct < 100
                ? <Loader2 size={11} className="animate-spin text-[var(--enba-orange)]" />
                : <CheckCircle2 size={11} className="text-emerald-500" />}
              {syncProgress.label}
            </span>
            <span className="font-semibold text-[var(--enba-text)]">{syncProgress.pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--enba-bg)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${syncProgress.pct === 100 ? 'bg-emerald-500' : 'bg-[var(--enba-orange)]'}`}
              style={{ width: `${syncProgress.pct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="grid grid-cols-4 gap-3 px-6 py-4 flex-shrink-0">
        <div className="bg-[var(--enba-surface)] rounded-2xl px-4 py-3 border border-emerald-200">
          <div className="flex items-center gap-1.5 text-xs text-[var(--enba-text-muted)] mb-1">
            <TrendingUp size={11} className="text-emerald-500" /> Banka Nakdi
          </div>
          <div className="text-base font-bold text-emerald-600">
            {bankaNakdi !== null ? fmtTL(bankaNakdi) : '—'}
          </div>
          <div className="text-[10px] text-[var(--enba-text-muted)] mt-0.5">VakıfBank + Ziraat</div>
        </div>
        <div className="bg-[var(--enba-surface)] rounded-2xl px-4 py-3 border border-blue-100">
          <div className="flex items-center gap-1.5 text-xs text-[var(--enba-text-muted)] mb-1">
            <TrendingUp size={11} className="text-blue-400" /> Cari Alacak
          </div>
          <div className="text-base font-bold text-blue-600">
            {cariAlacak !== null ? '+' + fmtTL(cariAlacak) : '—'}
          </div>
          <div className="text-[10px] text-[var(--enba-text-muted)] mt-0.5">Başar + Enes TL + PET Deşe</div>
        </div>
        <div className={`bg-[var(--enba-surface)] rounded-2xl px-4 py-3 border ${(parasutNetTRL ?? bakiye) >= 0 ? 'border-emerald-100' : 'border-red-200'}`}>
          <div className="text-xs text-[var(--enba-text-muted)] mb-1">Toplam Pozisyon</div>
          <div className={`text-base font-bold ${(parasutNetTRL ?? bakiye) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {fmtTL(parasutNetTRL ?? bakiye)}
          </div>
          <div className="text-[10px] text-[var(--enba-text-muted)] mt-0.5">
            {parasutNetTRL !== null ? 'Paraşüt canlı · konsolide' : 'hesaplanan'}
          </div>
        </div>
        <div className="bg-[var(--enba-surface)] rounded-2xl px-4 py-3 border border-orange-100">
          <div className="flex items-center gap-1.5 text-xs text-[var(--enba-text-muted)] mb-1">
            <TrendingDown size={11} className="text-orange-400" /> Döviz Pozisyonu
          </div>
          <div className="text-base font-bold text-orange-500">
            {enesSermai !== null
              ? enesSermai.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR'
              : '— EUR'}
          </div>
          <div className="text-[10px] text-[var(--enba-text-muted)] mt-0.5">
            {accounts.filter(a => a.currency === 'EUR').length > 0
              ? `${accounts.filter(a => a.currency === 'EUR').length} EUR hesap · Paraşüt canlı`
              : 'EUR hesap yok'}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="px-6 flex-shrink-0">
        <div className="flex gap-1 bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-xl p-1 w-fit">
          {([['hesaplar','Hesaplar'],['hareketler','Hareketler'],['grafik','Grafik'],['ozet','Özet'],['aylik','Aylık Özet']] as [Tab,string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                tab === id ? 'bg-[var(--enba-orange)] text-white shadow-sm' : 'text-[var(--enba-text-muted)] hover:text-[var(--enba-text)]'
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
            <AlertCircle size={14} className="shrink-0" />
            <span className="flex-1 text-xs">{error}</span>
            <button className="text-xs underline shrink-0" onClick={() => setError('')}>Kapat</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={24} className="animate-spin text-[var(--enba-orange)]" />
          </div>
        ) : (
          <>

            {/* ══ HESAPLAR ══ */}
            {tab === 'hesaplar' && (
              <div className="space-y-4">
                {!isParasutConnected ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                    <Link2 size={32} className="text-[var(--enba-text-muted)]" />
                    <p className="text-sm font-semibold text-[var(--enba-text)]">Paraşüt bağlı değil</p>
                    <p className="text-xs text-[var(--enba-text-muted)]">
                      Canlı hesap bakiyelerini görmek için önce Paraşüt modülünden giriş yapın.
                    </p>
                  </div>
                ) : accountsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 size={24} className="animate-spin text-[var(--enba-orange)]" />
                  </div>
                ) : (
                  <>
                    {/* Hesap kartı render yardımcısı */}
                    {(() => {
                      const TYPE_LABELS: Record<AccType, string> = { banka: 'Banka', cari: 'Cari', doviz: 'Döviz' };
                      const TYPE_COLORS: Record<AccType, string> = {
                        banka: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
                        cari:  'bg-blue-100 text-blue-700 hover:bg-blue-200',
                        doviz: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
                      };

                      const renderCard = (acc: ParasutAccount) => {
                        const accType    = getAccType(acc);
                        const excluded   = excludedAccounts.has(acc.id);
                        const primaryId  = continuationOf[acc.id];
                        const primaryAcc = primaryId ? accounts.find(a => a.id === primaryId) : null;
                        const isCont     = !!primaryId;
                        const dbRows     = rows.filter(r => r.source_account === acc.name);
                        const dbGelir    = dbRows.filter(r => r.tip === 'gelir').reduce((s, r) => s + r.tutar_tl, 0);
                        const dbGider    = dbRows.filter(r => r.tip === 'gider').reduce((s, r) => s + r.tutar_tl, 0);
                        const cariYorum  = accType === 'cari'
                          ? (acc.balance > 0 ? 'karşı taraf şirkete borçlu' : acc.balance < 0 ? 'şirket karşı tarafa borçlu' : 'bakiye sıfır')
                          : null;
                        return (
                          <div key={acc.id} className={`relative bg-[var(--enba-surface)] border rounded-2xl p-4 transition-all ${excluded ? 'border-dashed border-[var(--enba-border)] opacity-60' : isCont ? 'border-blue-200 bg-blue-50/30' : 'border-[var(--enba-border)] hover:border-[var(--enba-orange)]/50 hover:shadow-md'}`}>
                            {/* Tip rozeti */}
                            <button
                              onClick={() => cycleAccType(acc.id, accType)}
                              title="Hesap tipini değiştir: Banka → Cari → Döviz"
                              className={`absolute top-3 left-3 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${TYPE_COLORS[accType]}`}
                            >
                              {TYPE_LABELS[accType]}
                            </button>
                            <div className="absolute top-3 right-3 flex items-center gap-1">
                              <button
                                onClick={e => { e.stopPropagation(); setDeleteModal({ acc, step: 'warn' }); }}
                                className="p-0.5 rounded text-[var(--enba-text-muted)] hover:text-red-500 transition-colors"
                                title="Hesabı sil"
                              >
                                <Trash2 size={12} />
                              </button>
                              <button
                                onClick={() => toggleAccountExclusion(acc.id)}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${excluded ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'}`}
                              >
                                {excluded ? 'Hariç' : 'Dahil'}
                              </button>
                            </div>
                            <button className="text-left w-full pt-1" onClick={() => { setAccountFilter(acc.name); setTab('hareketler'); }}>
                              <div className="flex items-start gap-2 mb-2 pr-14 pl-10">
                                <Building2 size={13} className="text-[var(--enba-orange)] shrink-0 mt-0.5" />
                                <span className="text-xs font-semibold text-[var(--enba-text)] leading-tight">{acc.name}</span>
                              </div>
                              <div className={`text-lg font-bold mb-0.5 ${acc.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {fmtAmount(acc.balance, acc.currency)}
                              </div>
                              <div className="text-[10px] text-[var(--enba-text-muted)]">
                                {cariYorum ?? (excluded ? 'Senkronize edilmiyor' : 'Paraşüt canlı bakiye')}
                              </div>
                              {isCont && primaryAcc && (
                                <div className="mt-1.5 flex items-center gap-1.5 bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-lg px-2 py-1">
                                  <span className="text-[9px] text-[var(--enba-text-muted)]">Geçmiş dönem saklı:</span>
                                  <span className="text-[9px] font-semibold text-[var(--enba-text)] truncate">{primaryAcc.name}</span>
                                  <span className="text-[9px] text-[var(--enba-text-muted)] ml-auto">{fmtAmount(primaryAcc.balance, primaryAcc.currency)}</span>
                                </div>
                              )}
                              {dbRows.length > 0 && !excluded && (
                                <div className="mt-2 pt-2 border-t border-[var(--enba-border)] flex items-center justify-between text-[10px]">
                                  <span className="text-emerald-600">+{fmtTL(dbGelir)}</span>
                                  <span className="text-red-500">−{fmtTL(dbGider)}</span>
                                  <span className="text-[var(--enba-text-muted)]">{dbRows.length} hk.</span>
                                </div>
                              )}
                            </button>
                            {/* Devam hesabı seçici + export */}
                            <div className="mt-2 pt-2 border-t border-[var(--enba-border)]">
                              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--enba-text-muted)] block mb-1">
                                Bu hesap şunun devamı:
                              </label>
                              <div className="flex items-center gap-1">
                                <select
                                  value={primaryId ?? ''}
                                  onChange={e => setContinuation(acc.id, e.target.value || null)}
                                  onClick={e => e.stopPropagation()}
                                  className="flex-1 bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-lg px-2 py-1 text-[10px] text-[var(--enba-text)] focus:outline-none focus:ring-1 focus:ring-[var(--enba-orange)]/30"
                                >
                                  <option value="">— yok (bağımsız hesap)</option>
                                  {accounts.filter(a => a.id !== acc.id).map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                  ))}
                                </select>
                                <button onClick={e => { e.stopPropagation(); exportAccountExcel(acc.name, rows.filter(r => r.source_account === acc.name)); }}
                                  className="shrink-0 p-1 rounded border border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:text-emerald-600 hover:border-emerald-300 transition-colors" title="Excel indir">
                                  <FileSpreadsheet size={11} /></button>
                                <button onClick={e => { e.stopPropagation(); exportAccountPDF(acc.name, rows.filter(r => r.source_account === acc.name)); }}
                                  className="shrink-0 p-1 rounded border border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:text-red-500 hover:border-red-300 transition-colors" title="PDF indir">
                                  <FileText size={11} /></button>
                              </div>
                              {/* Paraşüt senkronizasyon seçimi */}
                              {isParasutConnected && (
                                <div className="mt-1.5 flex items-center justify-between">
                                  <button
                                    onClick={e => { e.stopPropagation(); toggleParasutExport(acc.id); }}
                                    className={`flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                                      parasutExportAccounts.has(acc.id)
                                        ? 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100'
                                        : 'border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:border-blue-300 hover:text-blue-500'
                                    }`}
                                  >
                                    <Upload size={8} />
                                    {parasutExportAccounts.has(acc.id) ? 'Paraşüt\'e aktar ✓' : 'Paraşüt\'e aktar'}
                                  </button>
                                  {parasutExportAccounts.has(acc.id) && (() => {
                                    const pendingCount = dbRows.filter(r => !r.parasut_id).length;
                                    if (pendingCount === 0) return <span className="text-[9px] text-emerald-600 font-semibold">✓ Tümü aktarıldı</span>;
                                    const isExporting = exportState?.accountName === acc.name;
                                    return (
                                      <button
                                        onClick={e => { e.stopPropagation(); handleExportToParasut(acc); }}
                                        disabled={isExporting}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors text-[9px] font-semibold"
                                      >
                                        {isExporting ? <Loader2 size={9} className="animate-spin" /> : <Upload size={9} />}
                                        {isExporting ? `${exportState!.current}/${exportState!.total}` : `${pendingCount} hareketi aktar`}
                                      </button>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      };

                      // Pasif hesaplar (başka hesabın devamı olarak işaretlenenler) kart listesinden çıkar
                      const bankaAccs = accounts.filter(a => getAccType(a) === 'banka' && !continuationTargets.has(a.id));
                      const cariAccs  = accounts.filter(a => getAccType(a) === 'cari'  && !continuationTargets.has(a.id));
                      const eurAccs   = accounts.filter(a => getAccType(a) === 'doviz' && !continuationTargets.has(a.id));

                      return (
                        <div className="space-y-4">
                          {bankaAccs.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Banka Hesapları</span>
                                <span className="text-[10px] text-[var(--enba-text-muted)]">— gerçek nakit</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{bankaAccs.map(renderCard)}</div>
                            </div>
                          )}
                          {cariAccs.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Cari Hesaplar</span>
                                <span className="text-[10px] text-[var(--enba-text-muted)]">— alacak/borç takibi</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{cariAccs.map(renderCard)}</div>
                            </div>
                          )}
                          {eurAccs.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Döviz Hesapları</span>
                                <span className="text-[10px] text-[var(--enba-text-muted)]">— TL nakit akışına dahil değil</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{eurAccs.map(renderCard)}</div>
                            </div>
                          )}
                          {accounts.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-[10px] text-[var(--enba-text-muted)] bg-[var(--enba-bg)] rounded-xl px-4 py-2">
                                Hesap tipini değiştirmek için rozete tıkla: <strong>Banka</strong> (gerçek nakit) · <strong>Cari</strong> (alacak/borç) · <strong>Döviz</strong>
                              </div>
                              <div className="text-[10px] bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-amber-800">
                                <strong>⚠️ Paraşüt'te hesap silmeyin.</strong> Eski dönem hesapları (örn. "geçmiş işlemler") silinirse tarihsel veriler kaybolur.
                                Hesap kapandıysa, aşağıdaki <em>"Bu hesap şunun devamı"</em> seçeneğiyle birleştirin —
                                grafik kesintisiz tek çizgi olarak gösterir.
                              </div>
                            </div>
                          )}
                          {accounts.length > 0 && (
                            <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl px-5 py-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-semibold text-[var(--enba-text)]">Toplam Pozisyon</div>
                                  <div className="text-[10px] text-[var(--enba-text-muted)] mt-0.5">
                                    {bankaNakdi !== null ? `Banka nakdi: ${fmtTL(bankaNakdi)}` : ''}{cariAlacak !== null ? ` · Cari alacak: +${fmtTL(cariAlacak)}` : ''}
                                  </div>
                                </div>
                                <div className={`text-xl font-bold ${(parasutNetTRL ?? bakiye) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {fmtTL(parasutNetTRL ?? bakiye)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}

            {/* ══ HAREKETLER ══ */}
            {tab === 'hareketler' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex gap-1 bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-lg p-0.5">
                    {([['tümü','Tümü'],['gider','Çıktı'],['gelir','Girdi']] as [TipFilter,string][]).map(([id, label]) => (
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

                  {/* Mutabakat filtresi */}
                  <div className="flex gap-1 bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-lg p-0.5">
                    {([['tümü','Tümü'],['mutabık','✓ Mutabık'],['dengeleme','— Dengeleme']] as [RecFilter,string][]).map(([id, label]) => (
                      <button key={id} onClick={() => setRecFilter(id)}
                        className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
                          recFilter === id ? 'bg-[var(--enba-orange)] text-white' : 'text-[var(--enba-text-muted)] hover:text-[var(--enba-text)]'
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {allAccountNames.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={accountFilter}
                        onChange={e => setAccountFilter(e.target.value)}
                        className="bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-lg px-2 py-1 text-xs text-[var(--enba-text)] focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/30"
                      >
                        <option value="">Tüm hesaplar</option>
                        {allAccountNames.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      {accountFilter && (
                        <button onClick={() => setAccountFilter('')} className="text-[var(--enba-text-muted)] hover:text-[var(--enba-text)] transition-colors">
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-[var(--enba-text-muted)]">{displayed.length} kayıt</span>
                    {accountFilter && (
                      <>
                        <button
                          onClick={() => exportAccountExcel(accountFilter, displayed)}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:text-emerald-600 hover:border-emerald-300 transition-colors"
                          title="Bu hesabı Excel'e aktar"
                        >
                          <FileSpreadsheet size={11} /> Excel
                        </button>
                        <button
                          onClick={() => exportAccountPDF(accountFilter, displayed)}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:text-red-500 hover:border-red-300 transition-colors"
                          title="Bu hesabı PDF'e aktar"
                        >
                          <FileText size={11} /> PDF
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {displayed.length === 0 ? (
                  <div className="text-center py-16 text-[var(--enba-text-muted)] text-sm">
                    {rows.length === 0
                      ? '"Paraşüt\'ten Güncelle" ile verileri çekin.'
                      : 'Filtrelere uyan kayıt bulunamadı.'}
                  </div>
                ) : (
                  <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--enba-border)] text-xs text-[var(--enba-text-muted)]">
                          {([['tarih','Tarih','left'],['kategori','Kategori','left'],['tutar_tl','Tutar','right']] as [SortKey,string,string][]).map(([key, label, align]) => (
                            <th key={key} onClick={() => toggleSort(key)}
                              className={`px-4 py-3 text-${align} font-medium cursor-pointer select-none hover:text-[var(--enba-text)] transition-colors`}>
                              <span className="inline-flex items-center gap-1">
                                {label}
                                {sortKey === key && (sortDir === 'asc' ? <ChevronUp size={11}/> : <ChevronDown size={11}/>)}
                              </span>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-left font-medium">Tip</th>
                          <th className="px-4 py-3 text-left font-medium">Hesap</th>
                          <th className="px-4 py-3 text-left font-medium">Açıklama</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayed.map((r, i) => (
                          <tr key={r.id}
                            className={`border-b border-[var(--enba-border)] last:border-0 hover:bg-[var(--enba-bg)] transition-colors ${i % 2 === 1 ? 'bg-[var(--enba-bg)]/30' : ''}`}>
                            <td className="px-4 py-2.5 text-xs text-[var(--enba-text-muted)] whitespace-nowrap">
                              <span className="flex items-center gap-1.5">
                                {r.is_reconciled === true && (
                                  <span title="Banka mutabakatı — gerçek işlem">
                                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                                  </span>
                                )}
                                {r.is_reconciled === false && (
                                  <span className="w-2.5 h-2.5 rounded-full border border-[var(--enba-border)] bg-[var(--enba-bg)] shrink-0 inline-block" title="Mutabakat yok — dengeleme kaydı" />
                                )}
                                {r.is_reconciled == null && (
                                  <span className="w-2.5 h-2.5 shrink-0 inline-block" />
                                )}
                                {fmtDate(r.tarih)}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-[var(--enba-text)]">{r.kategori}</td>
                            <td className={`px-4 py-2.5 text-xs font-semibold text-right whitespace-nowrap ${r.tip === 'gider' ? 'text-red-500' : 'text-emerald-600'}`}>
                              {r.tip === 'gider' ? '−' : '+'} {fmtTL(r.tutar_tl)}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                r.tip === 'gider' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {r.tip === 'gider' ? 'Çıktı' : 'Girdi'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-[10px] text-[var(--enba-text-muted)] max-w-[130px] truncate">{r.source_account || '—'}</td>
                            <td className="px-4 py-2.5 text-xs text-[var(--enba-text-muted)] max-w-[200px] truncate">{r.aciklama}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══ GRAFİK ══ */}
            {tab === 'grafik' && (
              <div className="space-y-6">
                {/* Banka Nakdi Günlük — en üstte, en önemli */}
                <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-sm font-semibold text-[var(--enba-text)]">Banka Nakdi — Günlük</h3>
                        <select
                          value={chartAccountFilter}
                          onChange={e => setChartAccountFilter(e.target.value)}
                          className="bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-lg px-2 py-1 text-xs text-[var(--enba-text)] focus:outline-none focus:ring-1 focus:ring-[var(--enba-orange)]/30"
                        >
                          <option value="">Tüm banka hesapları</option>
                          {accounts.filter(a => getAccType(a) === 'banka' && !continuationOf[a.id]).map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                      {bankaDailyData.length > 0 && (
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-[var(--enba-text-muted)]">
                            Son:&nbsp;
                            <span className={`font-semibold ${bankaDailyData[bankaDailyData.length-1].bakiye >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {fmtTL(bankaDailyData[bankaDailyData.length-1].bakiye)}
                            </span>
                          </span>
                          <span className="text-xs text-[var(--enba-text-muted)]">
                            Min:&nbsp;
                            <span className="font-semibold text-red-500">
                              {fmtTL(Math.min(...bankaDailyData.map(d => d.bakiye)))}
                            </span>
                          </span>
                          <span className="text-xs text-[var(--enba-text-muted)]">
                            Max:&nbsp;
                            <span className="font-semibold text-emerald-600">
                              {fmtTL(Math.max(...bankaDailyData.map(d => d.bakiye)))}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {bankaDailyData.length === 0 ? (
                    <div className="text-center py-8 text-[var(--enba-text-muted)] text-xs space-y-2">
                      {accounts.filter(a => getAccType(a) === 'banka').length === 0
                        ? <p>Hesaplar sekmesinden en az bir hesabı <strong>"Banka"</strong> olarak işaretleyin.</p>
                        : <>
                            <p className="font-semibold text-[var(--enba-text)]">Bakiye verisi yok.</p>
                            <p className="mt-1"><strong>"Yeniden Senkronize Et"</strong> butonuna bas — açılış bakiyesi çekilecek.</p>
                            <p className="mt-1 text-[var(--enba-text-muted)]">Veya Excel bakiye verisini manuel aktar:</p>
                            <button
                              onClick={() => setImportModal(true)}
                              className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:text-[var(--enba-orange)] hover:border-[var(--enba-orange)] transition-colors"
                            >
                              Bakiye Verisi Aktar
                            </button>
                          </>
                      }
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={bankaDailyData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="bankaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--enba-border)" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--enba-text-muted)' }}
                          interval={Math.max(0, Math.floor(bankaDailyData.length / 12) - 1)}
                          angle={bankaDailyData.length > 30 ? -35 : 0}
                          textAnchor={bankaDailyData.length > 30 ? 'end' : 'middle'}
                          height={bankaDailyData.length > 30 ? 40 : 20} />
                        <YAxis tickFormatter={v => {
                          const abs = Math.abs(v);
                          if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
                          return (v / 1000).toFixed(0) + 'K';
                        }} tick={{ fontSize: 10, fill: 'var(--enba-text-muted)' }} />
                        <Tooltip content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const b = (payload[0]?.value as number) ?? 0;
                          return (
                            <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-xl px-3 py-2 shadow-lg text-xs">
                              <div className="font-semibold text-[var(--enba-text)] mb-1">{label}</div>
                              <div className={`font-bold text-sm ${b >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtTL(b)}</div>
                            </div>
                          );
                        }} />
                        <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
                        <Area type="monotone" dataKey="bakiye" name="Banka Nakdi" stroke="#10b981" strokeWidth={2}
                          fill="url(#bankaGrad)"
                          dot={bankaDailyData.length <= 60 ? { r: 2.5, fill: '#10b981', strokeWidth: 0 } : false}
                          activeDot={{ r: 5, fill: '#10b981' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {cumulativeData.length === 0 ? (
                  <div className="text-center py-16 text-[var(--enba-text-muted)] text-sm">Grafik için veri yok.</div>
                ) : (
                  <>
                    <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--enba-text)]">Operasyonel Nakit Pozisyonu <span className="text-[10px] font-normal text-[var(--enba-text-muted)]">(sermaye transferleri hariç)</span></h3>
                          {dailyData.length > 0 && (
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-[var(--enba-text-muted)]">
                                Son:&nbsp;
                                <span className={`font-semibold ${dailyData[dailyData.length-1].bakiye >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {fmtTL(dailyData[dailyData.length-1].bakiye)}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-[var(--enba-text-muted)]">Başlangıç</label>
                            <input type="date" value={chartFrom} onChange={e => setChartFrom(e.target.value)}
                              className="bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-lg px-2 py-1 text-xs text-[var(--enba-text)] focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/30" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-[var(--enba-text-muted)]">Bitiş</label>
                            <input type="date" value={chartTo} onChange={e => setChartTo(e.target.value)}
                              className="bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-lg px-2 py-1 text-xs text-[var(--enba-text)] focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/30" />
                          </div>
                          {chartFrom && (
                            <button onClick={() => setChartFrom('')} className="text-[var(--enba-text-muted)] hover:text-[var(--enba-text)] transition-colors">
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
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--enba-text-muted)' }}
                              interval={Math.max(0, Math.floor(dailyData.length / 12) - 1)}
                              angle={dailyData.length > 30 ? -35 : 0}
                              textAnchor={dailyData.length > 30 ? 'end' : 'middle'}
                              height={dailyData.length > 30 ? 40 : 20} />
                            <YAxis tickFormatter={v => {
                              const abs = Math.abs(v);
                              if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
                              return (v / 1000).toFixed(0) + 'K';
                            }} tick={{ fontSize: 10, fill: 'var(--enba-text-muted)' }} />
                            <Tooltip content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              const b = (payload[0]?.value as number) ?? 0;
                              return (
                                <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-xl px-3 py-2 shadow-lg text-xs">
                                  <div className="font-semibold text-[var(--enba-text)] mb-1">{label}</div>
                                  <div className={`font-bold text-sm ${b >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtTL(b)}</div>
                                </div>
                              );
                            }} />
                            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
                            <Area type="monotone" dataKey="bakiye" name="Kasa Bakiyesi" stroke="#E35205" strokeWidth={2}
                              fill="url(#kasaGrad)"
                              dot={dailyData.length <= 60 ? { r: 2.5, fill: '#E35205', strokeWidth: 0 } : false}
                              activeDot={{ r: 5, fill: '#E35205' }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl p-5">
                      <h3 className="text-sm font-semibold text-[var(--enba-text)] mb-4">Kümülatif Nakit Bakiyesi</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={cumulativeData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--enba-border)" />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--enba-text-muted)' }} />
                          <YAxis tickFormatter={v => (v / 1000).toFixed(0) + 'K'} tick={{ fontSize: 11, fill: 'var(--enba-text-muted)' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
                          <Line type="monotone" dataKey="bakiye" name="Bakiye" stroke="#E35205" strokeWidth={2.5}
                            dot={{ r: 3, fill: '#E35205' }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl p-5">
                      <h3 className="text-sm font-semibold text-[var(--enba-text)] mb-4">Aylık Nakit Akışı — Satış / Sermaye / Ödemeler</h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={aylikData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--enba-border)" />
                          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--enba-text-muted)' }} />
                          <YAxis tickFormatter={v => {
                            const abs = Math.abs(v);
                            return abs >= 1_000_000 ? (v/1_000_000).toFixed(1)+'M' : (v/1000).toFixed(0)+'K';
                          }} tick={{ fontSize: 10, fill: 'var(--enba-text-muted)' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1} />
                          <Bar dataKey="satis" name="Satış" stackId="a" fill="#10b981" radius={[0,0,0,0]} />
                          <Bar dataKey="sermaye" name="Sermaye Girişi" stackId="a" fill="#3b82f6" radius={[4,4,0,0]} />
                          <Bar dataKey="gider" name="Ödemeler" fill="#ef4444" radius={[4,4,0,0]} />
                          <Line type="monotone" dataKey="net" name="Net" stroke="#1a1a1a" strokeWidth={2}
                            dot={{ r: 2.5, fill: '#1a1a1a' }} activeDot={{ r: 5 }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {hesapOdemeler.length > 0 && (
                      <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl p-5">
                        <h3 className="text-sm font-semibold text-[var(--enba-text)] mb-4">Hesap Bazlı Ödemeler</h3>
                        <ResponsiveContainer width="100%" height={Math.max(160, hesapOdemeler.length * 36)}>
                          <BarChart data={hesapOdemeler} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--enba-border)" horizontal={false} />
                            <XAxis type="number" tickFormatter={v => (v/1000).toFixed(0)+'K'} tick={{ fontSize: 10, fill: 'var(--enba-text-muted)' }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--enba-text-muted)' }} width={140} />
                            <Tooltip formatter={(v) => fmtTL(Number(v))} />
                            <Bar dataKey="total" name="Ödeme" fill="#E35205" radius={[0,4,4,0]}
                              label={{ position: 'right', fontSize: 10, fill: 'var(--enba-text-muted)',
                                formatter: (v: unknown) => (Number(v)/1000).toFixed(0)+'K' }} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ══ ÖZET ══ */}
            {tab === 'ozet' && (
              <div id="kn-pdf-content" className="space-y-6">
                <div className="pdf-only hidden">
                  <h2 style={{ fontFamily: 'Arial', fontSize: 18, marginBottom: 4 }}>Nakit Akışı</h2>
                  <p style={{ fontFamily: 'Arial', fontSize: 11, color: '#666' }}>
                    Rapor tarihi: {new Date().toLocaleDateString('tr-TR')}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Satış Tahsilatı', value: totalSatisGeliri, color: 'text-emerald-600' },
                    { label: 'Diğer Girdi',     value: totalDigerGelir,  color: 'text-blue-500' },
                    { label: 'Toplam Çıktı',    value: totalGider,       color: 'text-red-500' },
                    { label: 'Net Bakiye',       value: parasutNetTRL ?? bakiye, color: (parasutNetTRL ?? bakiye) >= 0 ? 'text-emerald-600' : 'text-red-500' },
                  ].map(k => (
                    <div key={k.label} className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl px-4 py-3">
                      <div className="text-xs text-[var(--enba-text-muted)] mb-1">{k.label}</div>
                      <div className={`text-lg font-bold ${k.color}`}>{fmtTL(k.value)}</div>
                    </div>
                  ))}
                </div>

                {kategoriOzet.length > 0 ? (
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
                        {/* Sermaye Girdi — gelen transferler (Enes sermayesi dahil) */}
                        {transferGelir > 0 && (
                          <tr className="border-b border-[var(--enba-border)] bg-blue-50/40">
                            <td className="px-5 py-2.5 text-xs font-semibold text-blue-700">↓ Sermaye Girdi</td>
                            <td className="px-5 py-2.5 text-xs text-blue-600 text-right font-semibold">{fmtTL(transferGelir)}</td>
                            <td className="px-5 py-2.5 text-xs text-[var(--enba-text-muted)] text-right">—</td>
                            <td className="px-5 py-2.5 text-xs text-blue-600 text-right font-bold">{fmtTL(transferGelir)}</td>
                            <td className="px-5 py-2.5 text-xs text-[var(--enba-text-muted)] text-right">—</td>
                          </tr>
                        )}
                        {/* Hesaplar Arası Transfer — giden transferler */}
                        {transferGider > 0 && (
                          <tr className="border-b border-[var(--enba-border)] bg-gray-50/60">
                            <td className="px-5 py-2.5 text-xs font-semibold text-[var(--enba-text-muted)]">↑ Hesaplar Arası Transfer</td>
                            <td className="px-5 py-2.5 text-xs text-[var(--enba-text-muted)] text-right">—</td>
                            <td className="px-5 py-2.5 text-xs text-orange-500 text-right font-semibold">{fmtTL(transferGider)}</td>
                            <td className="px-5 py-2.5 text-xs text-orange-600 text-right font-bold">−{fmtTL(transferGider)}</td>
                            <td className="px-5 py-2.5 text-xs text-[var(--enba-text-muted)] text-right">—</td>
                          </tr>
                        )}
                        {/* Operasyonel kategoriler (transferler hariç) */}
                        {kategoriOzet.map(k => (
                          <tr key={k.kategori} className="border-b border-[var(--enba-border)] last:border-0 hover:bg-[var(--enba-bg)] transition-colors">
                            <td className="px-5 py-2.5 text-xs text-[var(--enba-text)] font-medium">{k.kategori}</td>
                            <td className="px-5 py-2.5 text-xs text-emerald-600 text-right font-semibold">{k.gelir > 0 ? fmtTL(k.gelir) : '—'}</td>
                            <td className="px-5 py-2.5 text-xs text-red-500 text-right font-semibold">{k.gider > 0 ? fmtTL(k.gider) : '—'}</td>
                            <td className={`px-5 py-2.5 text-xs text-right font-bold ${k.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtTL(k.net)}</td>
                            <td className="px-5 py-2.5 text-xs text-[var(--enba-text-muted)] text-right">
                              {totalGider > 0 && k.gider > 0 ? `${((k.gider / totalGider) * 100).toFixed(1)}%` : '—'}
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
                ) : (
                  <div className="text-center py-16 text-[var(--enba-text-muted)] text-sm">Özet için veri yok.</div>
                )}
              </div>
            )}

            {/* ══ AYLIK ÖZET ══ */}
            {tab === 'aylik' && (
              <div className="space-y-3">
                {aylikData.length === 0 ? (
                  <div className="text-center py-16 text-[var(--enba-text-muted)] text-sm">
                    Veri yok. "Paraşüt'ten Güncelle" ile verileri çekin.
                  </div>
                ) : (
                  <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[var(--enba-border)] flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[var(--enba-text)]">Aylık Nakit Tablosu</h3>
                      <div className="flex items-center gap-3 text-[10px] text-[var(--enba-text-muted)]">
                        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-emerald-500" />Satış</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-blue-500" />Sermaye</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-red-500" />Ödemeler</span>
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--enba-border)] text-xs text-[var(--enba-text-muted)]">
                          <th className="px-4 py-3 text-left font-medium">Ay</th>
                          <th className="px-4 py-3 text-right font-medium">Satış</th>
                          <th className="px-4 py-3 text-right font-medium">Sermaye Girişi</th>
                          <th className="px-4 py-3 text-right font-medium">Ödemeler</th>
                          <th className="px-4 py-3 text-right font-medium">Net</th>
                          <th className="px-4 py-3 text-right font-medium">Kümülatif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aylikData.map((row, i) => (
                          <tr key={i} className={`border-b border-[var(--enba-border)] last:border-0 hover:bg-[var(--enba-bg)] transition-colors ${row.net < 0 && row.kumNet <= 0 ? 'bg-red-50/40' : ''}`}>
                            <td className="px-4 py-2.5 text-xs font-semibold text-[var(--enba-text)]">{row.label}</td>
                            <td className="px-4 py-2.5 text-xs text-right text-emerald-600 font-medium">
                              {row.satis > 0 ? fmtTL(row.satis) : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-right text-blue-600 font-medium">
                              {row.sermaye > 0 ? fmtTL(row.sermaye) : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-right text-red-500 font-medium">
                              {row.gider > 0 ? fmtTL(row.gider) : '—'}
                            </td>
                            <td className={`px-4 py-2.5 text-xs text-right font-bold ${row.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {row.net >= 0 ? '+' : ''}{fmtTL(row.net)}
                            </td>
                            <td className={`px-4 py-2.5 text-xs text-right font-semibold ${row.kumNet >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {fmtTL(row.kumNet)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[var(--enba-bg)] border-t-2 border-[var(--enba-border)]">
                          <td className="px-4 py-3 text-xs font-bold text-[var(--enba-text)]">TOPLAM</td>
                          <td className="px-4 py-3 text-xs font-bold text-emerald-600 text-right">{fmtTL(aylikData.reduce((s, r) => s + r.satis, 0))}</td>
                          <td className="px-4 py-3 text-xs font-bold text-blue-600 text-right">{fmtTL(aylikData.reduce((s, r) => s + r.sermaye, 0))}</td>
                          <td className="px-4 py-3 text-xs font-bold text-red-500 text-right">{fmtTL(aylikData.reduce((s, r) => s + r.gider, 0))}</td>
                          <td className={`px-4 py-3 text-xs font-bold text-right ${aylikData[aylikData.length-1]?.kumNet >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {(() => { const n = aylikData.reduce((s, r) => s + r.net, 0); return (n >= 0 ? '+' : '') + fmtTL(n); })()}
                          </td>
                          <td className={`px-4 py-3 text-xs font-bold text-right ${aylikData[aylikData.length-1]?.kumNet >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {fmtTL(aylikData[aylikData.length-1]?.kumNet ?? 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

          </>
        )}
      </div>

      {/* ── Bakiye İçe Aktar Modal ── */}
      {importModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--enba-surface)] rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-[var(--enba-border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--enba-text)]">Bakiye Verisi Aktar</h3>
              <button onClick={() => { setImportModal(false); setImportMsg(''); }} className="text-[var(--enba-text-muted)] hover:text-[var(--enba-text)]"><X size={16} /></button>
            </div>
            <p className="text-xs text-[var(--enba-text-muted)] mb-3">
              <code>banka_nakit_grafik.html</code> dosyasını aç, içindeki <code>const RAW = [...]</code> dizisini kopyala ve buraya yapıştır.
            </p>
            <div className="mb-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--enba-text-muted)] mb-1 block">Hesap Adı (Paraşüt'teki tam isim)</label>
              <select
                value={importAccount}
                onChange={e => setImportAccount(e.target.value)}
                className="w-full bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-lg px-3 py-2 text-xs text-[var(--enba-text)] focus:outline-none"
              >
                <option value="">Hesap seç…</option>
                {accounts.filter(a => getAccType(a) === 'banka').map(a => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--enba-text-muted)] mb-1 block">JSON Verisi</label>
              <textarea
                value={importJson}
                onChange={e => setImportJson(e.target.value)}
                placeholder='[{"tarih":"2025-10-13","bakiye":126295.54}, ...]'
                rows={6}
                className="w-full bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-lg px-3 py-2 text-xs text-[var(--enba-text)] font-mono focus:outline-none resize-none"
              />
            </div>
            {importMsg && (
              <p className={`text-xs mb-3 ${importMsg.startsWith('✅') ? 'text-emerald-600' : 'text-red-500'}`}>{importMsg}</p>
            )}
            <button
              disabled={!importAccount || !importJson.trim() || !companyId}
              onClick={async () => {
                if (!companyId) return;
                setImportMsg('İşleniyor…');
                try {
                  const parsed: { tarih: string; bakiye: number }[] = JSON.parse(importJson);
                  const records = parsed.map(r => ({ account_name: importAccount, tarih: r.tarih, bakiye: r.bakiye }));
                  const n = await kurulumNakitAPI.upsertDailyBalances(companyId, records);
                  const updated = await kurulumNakitAPI.listDailyBalances(companyId);
                  setDailyBalances(updated);
                  setImportMsg(`✅ ${n} kayıt aktarıldı`);
                  setTimeout(() => { setImportModal(false); setImportMsg(''); setImportJson(''); }, 1500);
                } catch (e) {
                  setImportMsg(`Hata: ${e instanceof Error ? e.message : String(e)}`);
                }
              }}
              className="w-full py-2.5 text-xs font-bold rounded-xl bg-[var(--enba-orange)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Aktar
            </button>
          </div>
        </div>
      )}

      {/* ─── Hesap Silme Modalı ──── */}
      {deleteModal && (() => {
        const acc       = deleteModal.acc;
        const accRows   = rows.filter(r => r.source_account === acc.name);
        const accGelir  = accRows.filter(r => r.tip === 'gelir').reduce((s, r) => s + r.tutar_tl, 0);
        const accGider  = accRows.filter(r => r.tip === 'gider').reduce((s, r) => s + r.tutar_tl, 0);
        const accDates  = accRows.map(r => r.tarih).sort();
        const accBals   = dailyBalances.filter(b => b.account_name === acc.name);
        const isWarn    = deleteModal.step === 'warn';
        const isAuth    = deleteModal.step === 'auth';
        const isDeleting = deleteModal.step === 'deleting';
        const isDone    = deleteModal.step === 'done';

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--enba-surface)] rounded-2xl w-full max-w-md shadow-2xl border border-[var(--enba-border)] overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-4 flex items-center justify-between ${isDone ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-red-50 border-b border-red-100'}`}>
                <div className="flex items-center gap-2">
                  {isDone ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Trash2 size={18} className="text-red-500" />}
                  <h3 className="text-sm font-bold text-[var(--enba-text)]">
                    {isDone ? 'Hesap Silindi' : 'Hesabı Sil'}
                  </h3>
                </div>
                {!isDeleting && (
                  <button onClick={() => { setDeleteModal(null); setDeleteEmail(''); setDeletePassword(''); }}
                    className="text-[var(--enba-text-muted)] hover:text-[var(--enba-text)]"><X size={16} /></button>
                )}
              </div>

              <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

                {/* ADIM 1: Uyarı */}
                {(isWarn || isAuth) && (
                  <>
                    {/* Hesap bilgisi */}
                    <div className="bg-[var(--enba-bg)] rounded-xl p-4 space-y-2 text-xs">
                      <div className="font-bold text-[var(--enba-text)] text-sm">{acc.name}</div>
                      <div className="flex justify-between text-[var(--enba-text-muted)]">
                        <span>Canlı bakiye</span>
                        <span className={`font-semibold ${acc.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtAmount(acc.balance, acc.currency)}</span>
                      </div>
                    </div>

                    {/* Silinecek veri özeti */}
                    <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-2 text-xs">
                      <div className="font-semibold text-red-700 mb-2">Silinecek veriler:</div>
                      <div className="flex justify-between">
                        <span className="text-[var(--enba-text-muted)]">Hareket kaydı</span>
                        <span className="font-bold text-red-600">{accRows.length} adet</span>
                      </div>
                      {accRows.length > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-[var(--enba-text-muted)]">Dönem</span>
                            <span className="font-semibold text-[var(--enba-text)]">{accDates[0]} → {accDates[accDates.length - 1]}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--enba-text-muted)]">Toplam gelir</span>
                            <span className="font-semibold text-emerald-700">+{fmtTL(accGelir)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--enba-text-muted)]">Toplam gider</span>
                            <span className="font-semibold text-red-600">−{fmtTL(accGider)}</span>
                          </div>
                        </>
                      )}
                      {accBals.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[var(--enba-text-muted)]">Günlük bakiye kaydı</span>
                          <span className="font-bold text-red-600">{accBals.length} gün</span>
                        </div>
                      )}
                    </div>

                    {/* 30 gün yedek uyarısı */}
                    <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 text-xs text-amber-800">
                      <div className="font-bold mb-1">⚠️ Bu işlem geri alınamaz</div>
                      Silinen veriler <strong>30 gün</strong> boyunca yedeklenir. Bu süre sonunda kalıcı olarak silinir.
                      Paraşüt'teki hesap <strong>silinmez</strong> — yalnızca bu uygulamadaki kayıtlar temizlenir.
                    </div>
                  </>
                )}

                {/* ADIM 2: Kimlik doğrulama */}
                {(isAuth || isDeleting) && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-[var(--enba-text)]">İşlemi onaylamak için hesap bilgilerinizi girin:</div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--enba-text-muted)] block mb-1">E-posta</label>
                      <input
                        type="email"
                        value={deleteEmail}
                        onChange={e => setDeleteEmail(e.target.value)}
                        disabled={isDeleting}
                        placeholder="ornek@firma.com"
                        className="w-full bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-lg px-3 py-2 text-xs text-[var(--enba-text)] focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--enba-text-muted)] block mb-1">Şifre</label>
                      <div className="relative">
                        <input
                          type={deleteShowPw ? 'text' : 'password'}
                          value={deletePassword}
                          onChange={e => setDeletePassword(e.target.value)}
                          disabled={isDeleting}
                          placeholder="••••••••"
                          onKeyDown={e => { if (e.key === 'Enter' && deleteEmail && deletePassword) handleConfirmDelete(); }}
                          className="w-full bg-[var(--enba-bg)] border border-[var(--enba-border)] rounded-lg px-3 py-2 pr-9 text-xs text-[var(--enba-text)] focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                        />
                        <button type="button" onClick={() => setDeleteShowPw(v => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--enba-text-muted)] hover:text-[var(--enba-text)]">
                          {deleteShowPw ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                    {deleteModal.error && (
                      <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                        <AlertCircle size={13} className="shrink-0" />{deleteModal.error}
                      </div>
                    )}
                  </div>
                )}

                {/* ADIM 3: Siliniyor */}
                {isDeleting && (
                  <div className="flex items-center gap-3 text-xs text-[var(--enba-text-muted)] py-2">
                    <Loader2 size={16} className="animate-spin text-red-400" />
                    Hesap verileri yedekleniyor ve siliniyor…
                  </div>
                )}

                {/* ADIM 4: Tamamlandı */}
                {isDone && deleteModal.result && (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                      <CheckCircle2 size={15} />
                      İşlem başarıyla tamamlandı
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[var(--enba-text-muted)]">Silinen hareket</span>
                        <span className="font-bold">{deleteModal.result.deletedRows} adet</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--enba-text-muted)]">Silinen bakiye kaydı</span>
                        <span className="font-bold">{deleteModal.result.deletedBalances} gün</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-[var(--enba-text-muted)]">Veriler 30 gün boyunca yedekte tutulacak.</div>
                  </div>
                )}
              </div>

              {/* Footer butonları */}
              {!isDeleting && !isDone && (
                <div className="px-6 py-4 border-t border-[var(--enba-border)] flex gap-2">
                  {isWarn && (
                    <>
                      <button onClick={() => { setDeleteModal(null); setDeleteEmail(''); setDeletePassword(''); }}
                        className="flex-1 py-2 text-xs font-semibold rounded-xl border border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:text-[var(--enba-text)] transition-colors">
                        İptal
                      </button>
                      <button onClick={() => setDeleteModal(m => m ? { ...m, step: 'auth' } : null)}
                        className="flex-1 py-2 text-xs font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5">
                        <Trash2 size={13} /> Devam Et
                      </button>
                    </>
                  )}
                  {isAuth && (
                    <>
                      <button onClick={() => setDeleteModal(m => m ? { ...m, step: 'warn', error: undefined } : null)}
                        className="flex-1 py-2 text-xs font-semibold rounded-xl border border-[var(--enba-border)] text-[var(--enba-text-muted)] hover:text-[var(--enba-text)] transition-colors">
                        Geri
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        disabled={!deleteEmail || !deletePassword}
                        className="flex-1 py-2 text-xs font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5">
                        <Trash2 size={13} /> Hesabı Sil
                      </button>
                    </>
                  )}
                </div>
              )}
              {isDone && (
                <div className="px-6 py-4 border-t border-[var(--enba-border)]">
                  <button onClick={() => { setDeleteModal(null); setDeleteEmail(''); setDeletePassword(''); }}
                    className="w-full py-2 text-xs font-semibold rounded-xl bg-[var(--enba-orange)] text-white hover:opacity-90 transition-opacity">
                    Kapat
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {exportState?.done && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--enba-surface)] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[var(--enba-border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--enba-text)]">Paraşüt Aktarım Tamamlandı</h3>
              <button onClick={parasutExporter.clear} className="text-[var(--enba-text-muted)] hover:text-[var(--enba-text)]"><X size={16} /></button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <CheckCircle2 size={15} />
                {exportState.total - exportState.errors.length} / {exportState.total} işlem Paraşüt'e aktarıldı
              </div>
              {exportState.errors.length > 0 && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="text-red-600 font-semibold mb-1">{exportState.errors.length} hata:</div>
                  <ul className="text-red-500 space-y-0.5">
                    {exportState.errors.map((e, i) => <li key={i} className="truncate">{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
            <button onClick={parasutExporter.clear}
              className="mt-4 w-full py-2 text-xs font-semibold rounded-xl bg-[var(--enba-orange)] text-white hover:opacity-90 transition-opacity">
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
