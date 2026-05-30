import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, FileSpreadsheet, FileText,
  Loader2, ChevronDown, ChevronUp, RefreshCw, CheckCircle2,
  Link2, AlertCircle, Building2, X,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { kurulumNakitAPI, type FoundingCashflow, type FCTip, type FCImportRecord } from '../api/kurulumNakit';
import { parasutService, type ParasutAccount } from '../api/parasut';
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
  const [sortKey, setSortKey]       = useState<SortKey>('tarih');
  const [sortDir, setSortDir]       = useState<SortDir>('desc');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [chartFrom, setChartFrom]   = useState('');
  const [chartTo, setChartTo]       = useState(() => new Date().toISOString().slice(0, 10));
  const [exportMsg, setExportMsg]   = useState('');

  const [accounts, setAccounts]           = useState<ParasutAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const [syncing, setSyncing]             = useState(false);
  const [syncProgress, setSyncProgress]   = useState<{ label: string; pct: number } | null>(null);
  const [syncResult, setSyncResult]       = useState<{ inserted: number; skipped: number } | null>(null);

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
      const data = await kurulumNakitAPI.list(companyId);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yükleme hatası');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

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

  // Hesaplar arası transferler görsel listede gösterilir ama KPI'dan hariç (chart/ozet için)
  const nonTransfer   = useMemo(() => rows.filter(r => r.kategori !== 'Hesaplar Arası Transfer'), [rows]);

  // KPI 1: Satış Tahsilatı — contact_credit, sales_* tipler
  const totalSatisGeliri = useMemo(() =>
    rows.filter(r => r.tip === 'gelir' && SATIS_TYPES.includes(r.transaction_type ?? '')).reduce((s, r) => s + r.tutar_tl, 0),
  [rows]);

  // KPI 2: Diğer Girdi — money_transfer girdi (sermaye/borç) ve diğerleri
  const totalDigerGelir = useMemo(() =>
    rows.filter(r => r.tip === 'gelir' && !SATIS_TYPES.includes(r.transaction_type ?? '')).reduce((s, r) => s + r.tutar_tl, 0),
  [rows]);

  // KPI 3: Toplam Gider — tüm çıkışlar (transferler dahil, gerçek harcama)
  const totalGider = useMemo(() => rows.filter(r => r.tip === 'gider').reduce((s, r) => s + r.tutar_tl, 0), [rows]);

  // Transfer detayları (Özet tablosu için)
  const transferGelir = useMemo(() =>
    rows.filter(r => r.kategori === 'Hesaplar Arası Transfer' && r.tip === 'gelir').reduce((s, r) => s + r.tutar_tl, 0),
  [rows]);
  const transferGider = useMemo(() =>
    rows.filter(r => r.kategori === 'Hesaplar Arası Transfer' && r.tip === 'gider').reduce((s, r) => s + r.tutar_tl, 0),
  [rows]);

  // Eskiyle uyumluluk
  const totalGelir = totalSatisGeliri + totalDigerGelir;
  const bakiye     = totalGelir - totalGider;
  const transferCount = useMemo(() => rows.filter(r => r.kategori === 'Hesaplar Arası Transfer').length, [rows]);

  // Hesap tipi: Banka (gerçek nakit) | Cari (alacak/borç) | Sermaye EUR
  function getAccountType(name: string): 'banka' | 'cari' | 'sermaye_eur' {
    const bankaKeywords = ['VakıfBank', 'Vakıfbank', 'Ziraat Bankası TL', 'Ziraat TL Hesabı'];
    if (bankaKeywords.some(k => name.toLowerCase().includes(k.toLowerCase()))) return 'banka';
    const eurKeywords = ['Euro', 'euro'];
    if (eurKeywords.some(k => name.includes(k))) return 'sermaye_eur';
    return 'cari';
  }

  // Paraşüt canlı bakiyesi (TRL hesaplar toplamı) — DB hesabından daha güvenilir
  const parasutNetTRL = useMemo(() => {
    if (accounts.length === 0) return null;
    const trlAccs = accounts.filter(a => a.currency === 'TRL' || a.currency === 'TRY');
    if (trlAccs.length === 0) return null;
    return trlAccs.reduce((s, a) => s + a.balance, 0);
  }, [accounts]);

  // Banka nakdi: sadece gerçek banka hesapları
  const bankaNakdi = useMemo(() => {
    if (accounts.length === 0) return null;
    const bankaAccs = accounts.filter(a =>
      (a.currency === 'TRL' || a.currency === 'TRY') && getAccountType(a.name) === 'banka'
    );
    if (bankaAccs.length === 0) return null;
    return bankaAccs.reduce((s, a) => s + a.balance, 0);
  }, [accounts]);

  // Cari alacaklar: Başar, Enes TL, PET Deşe — pozitif bakiye = şirkete borçlu
  const cariAlacak = useMemo(() => {
    if (accounts.length === 0) return null;
    const cariAccs = accounts.filter(a =>
      (a.currency === 'TRL' || a.currency === 'TRY') && getAccountType(a.name) === 'cari'
    );
    if (cariAccs.length === 0) return null;
    return cariAccs.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  }, [accounts]);

  // Sermaye: EUR hesaplarının negatif bakiyeleri = o kişilerin şirketten alacağı = katkıları
  // Negatif bakiye → şirkete borç verdiler demek → mutlak değer = sermaye
  const enesSermai = useMemo(() => {
    if (accounts.length === 0) return null;
    const eurAccs = accounts.filter(a => a.currency === 'EUR');
    if (eurAccs.length === 0) return null;
    const total = eurAccs.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0);
    return Math.abs(total);
  }, [accounts]);

  const allAccountNames = useMemo(() => {
    const names = new Set(rows.map(r => r.source_account).filter(Boolean) as string[]);
    return [...names].sort((a, b) => a.localeCompare(b, 'tr'));
  }, [rows]);

  const displayed = useMemo(() => {
    let list = rows;
    if (tipFilter !== 'tümü') list = list.filter(r => r.tip === tipFilter);
    if (accountFilter) list = list.filter(r => r.source_account === accountFilter);
    list = [...list].sort((a, b) => {
      let d = 0;
      if (sortKey === 'tarih')         d = a.tarih.localeCompare(b.tarih);
      else if (sortKey === 'kategori') d = a.kategori.localeCompare(b.kategori, 'tr');
      else if (sortKey === 'tutar_tl') d = a.tutar_tl - b.tutar_tl;
      return sortDir === 'asc' ? d : -d;
    });
    return list;
  }, [rows, tipFilter, accountFilter, sortKey, sortDir]);

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

  const AYLAR = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  const aylikData = useMemo(() => {
    const byMonth: Record<string, { satis: number; sermaye: number; gider: number }> = {};
    for (const r of rows) {
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
  }, [rows]);

  const hesapOdemeler = useMemo(() => {
    const byAcc: Record<string, number> = {};
    for (const r of rows) {
      if (r.tip === 'gider' && r.source_account) {
        byAcc[r.source_account] = (byAcc[r.source_account] ?? 0) + r.tutar_tl;
      }
    }
    return Object.entries(byAcc)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [rows]);

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
            <TrendingDown size={11} className="text-orange-400" /> Enes Alacağı
          </div>
          <div className="text-base font-bold text-orange-500">
            {enesSermai !== null
              ? enesSermai.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR'
              : '— EUR'}
          </div>
          <div className="text-[10px] text-[var(--enba-text-muted)] mt-0.5">şirkete kredi · Paraşüt canlı</div>
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
                      const renderCard = (acc: ParasutAccount) => {
                        const accType  = getAccountType(acc.name);
                        const isTRL    = acc.currency === 'TRL' || acc.currency === 'TRY';
                        const excluded = excludedAccounts.has(acc.id);
                        const dbRows   = rows.filter(r => r.source_account === acc.name);
                        const dbGelir  = dbRows.filter(r => r.tip === 'gelir').reduce((s, r) => s + r.tutar_tl, 0);
                        const dbGider  = dbRows.filter(r => r.tip === 'gider').reduce((s, r) => s + r.tutar_tl, 0);
                        const cariYorum = !isTRL ? null : accType === 'cari'
                          ? (acc.balance > 0 ? 'şirkete borçlu' : acc.balance < 0 ? 'şirket borçlu' : 'bakiye sıfır')
                          : null;
                        return (
                          <div key={acc.id} className={`relative bg-[var(--enba-surface)] border rounded-2xl p-4 transition-all ${excluded ? 'border-dashed border-[var(--enba-border)] opacity-60' : 'border-[var(--enba-border)] hover:border-[var(--enba-orange)]/50 hover:shadow-md'}`}>
                            <span className={`absolute top-3 left-3 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              accType === 'banka' ? 'bg-emerald-100 text-emerald-700' :
                              accType === 'cari'  ? 'bg-blue-100 text-blue-700' :
                                                    'bg-orange-100 text-orange-700'
                            }`}>
                              {accType === 'banka' ? 'Banka' : accType === 'cari' ? 'Cari' : 'EUR'}
                            </span>
                            <button
                              onClick={() => toggleAccountExclusion(acc.id)}
                              className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${excluded ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'}`}
                            >
                              {excluded ? 'Hariç' : 'Dahil'}
                            </button>
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
                              {dbRows.length > 0 && !excluded && (
                                <div className="mt-2 pt-2 border-t border-[var(--enba-border)] flex items-center justify-between text-[10px]">
                                  <span className="text-emerald-600">+{fmtTL(dbGelir)}</span>
                                  <span className="text-red-500">−{fmtTL(dbGider)}</span>
                                  <span className="text-[var(--enba-text-muted)]">{dbRows.length} hk.</span>
                                </div>
                              )}
                            </button>
                          </div>
                        );
                      };

                      const bankaAccs = accounts.filter(a => (a.currency === 'TRL' || a.currency === 'TRY') && getAccountType(a.name) === 'banka');
                      const cariAccs  = accounts.filter(a => (a.currency === 'TRL' || a.currency === 'TRY') && getAccountType(a.name) === 'cari');
                      const eurAccs   = accounts.filter(a => a.currency === 'EUR');

                      return (
                        <div className="space-y-4">
                          {bankaAccs.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Banka Hesapları</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{bankaAccs.map(renderCard)}</div>
                            </div>
                          )}
                          {cariAccs.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2">Cari Hesaplar</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{cariAccs.map(renderCard)}</div>
                            </div>
                          )}
                          {eurAccs.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Sermaye (EUR)</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{eurAccs.map(renderCard)}</div>
                            </div>
                          )}
                          {accounts.length > 0 && (
                            <div className="bg-[var(--enba-surface)] border border-[var(--enba-border)] rounded-2xl px-5 py-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-semibold text-[var(--enba-text)]">Toplam Pozisyon</div>
                                  <div className="text-[10px] text-[var(--enba-text-muted)] mt-0.5">
                                    {bankaNakdi !== null ? `Banka: ${fmtTL(bankaNakdi)}` : ''}{cariAlacak !== null ? ` · Cari Alacak: +${fmtTL(cariAlacak)}` : ''}
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

                  <span className="ml-auto text-xs text-[var(--enba-text-muted)]">{displayed.length} kayıt</span>
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
                            <td className="px-4 py-2.5 text-xs text-[var(--enba-text-muted)] whitespace-nowrap">{fmtDate(r.tarih)}</td>
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
    </div>
  );
};
