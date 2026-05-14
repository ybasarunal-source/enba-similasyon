import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Loader2,
  Search,
  X,
  Download,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import { parasutService, type ParasutInvoice, type ParasutItem } from '../api/parasut';
import { MCODE_LIST } from '../api/mcodeList';

type DatePreset = 'this_month' | 'last_3' | 'this_year' | 'custom';
type TypeFilter = 'all' | 'income' | 'expense';

const STATUS: Record<string, { label: string; cls: string }> = {
  paid:        { label: 'Ödendi',       cls: 'bg-emerald-100 text-emerald-700' },
  overdue:     { label: 'Gecikmiş',     cls: 'bg-rose-100 text-rose-700' },
  not_due:     { label: 'Vadeli',       cls: 'bg-blue-100 text-blue-700' },
  unscheduled: { label: 'Planlanmadı', cls: 'bg-gray-100 text-gray-500' },
};

function getRange(preset: DatePreset) {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const f = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const to = f(now);
  if (preset === 'this_month') return { from: f(new Date(now.getFullYear(), now.getMonth(), 1)), to };
  if (preset === 'last_3')     return { from: f(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to };
  if (preset === 'this_year')  return { from: `${now.getFullYear()}-01-01`, to };
  return { from: f(new Date(now.getFullYear(), now.getMonth(), 1)), to }; // fallback
}

const money = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Login + Company ID (tek form) ───────────────────────────────
const LoginForm: React.FC<{ onReady: (companyId: string) => void }> = ({ onReady }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [companyId, setCompanyId] = useState(() => parasutService.getCompany()?.id || '');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId.trim()) { setError('Firma ID zorunludur.'); return; }
    setLoading(true);
    setError('');
    try {
      await parasutService.login(email, password);
      parasutService.saveCompany({ id: companyId.trim(), name: companyId.trim() });
      onReady(companyId.trim());
    } catch (err: any) {
      // Capture detailed error data for the diagnostic UI
      (window as any)._lastParasutError = err.data || { error: err.message };
      setError('HATA: ' + (err.message || 'Giriş başarısız.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-enba-orange rounded-2xl flex items-center justify-center shadow-lg shadow-enba-orange/25">
            <Receipt size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Paraşüt Bağlantısı</h2>
            <p className="text-xs text-gray-400">Hesap bilgilerini girin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Firma ID</label>
            <input
              type="text"
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-enba-orange/50 focus:ring-2 focus:ring-enba-orange/10 transition-all"
              placeholder="uygulama.parasut.com/123456/..."
            />
            <p className="text-[10px] text-gray-400 mt-1">Paraşüt URL'indeki firma numarası</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-enba-orange/50 focus:ring-2 focus:ring-enba-orange/10 transition-all"
              placeholder="ornek@firma.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-enba-orange/50 focus:ring-2 focus:ring-enba-orange/10 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex flex-col gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
              {/* @ts-ignore - diagnostics from backend */}
              {window._lastParasutError?.diagnostics && (
                <div className="mt-2 pt-2 border-t border-rose-100 space-y-1 font-mono text-[10px] opacity-80">
                  <p>DEBUG BILGISI:</p>
                  {/* @ts-ignore */}
                  <p>ID Found: {String(window._lastParasutError.diagnostics.has_client_id)}</p>
                  {/* @ts-ignore */}
                  <p>Source: {window._lastParasutError.diagnostics.env_source || 'LEGACY'}</p>
                  {/* @ts-ignore */}
                  <p>ID Prefix: {window._lastParasutError.diagnostics.client_id_prefix}</p>
                  {/* @ts-ignore */}
                  <p>Secret Mask: <span className="text-enba-orange">{window._lastParasutError.diagnostics.client_secret_masked}</span> ({window._lastParasutError.diagnostics.client_secret_len || 0} ch)</p>
                  {/* @ts-ignore */}
                  <p>Account: {window._lastParasutError.diagnostics.username_len || 0} ch email, {window._lastParasutError.diagnostics.password_len || 0} ch pass</p>
                  {/* @ts-ignore */}
                  <p>Available Env Vars: {window._lastParasutError.diagnostics.env_keys?.join(', ') || 'NONE'}</p>
                  <p className="italic text-rose-400 mt-2 font-bold underline">İpucu: Secret Mask'ı Paraşüt portaldaki şifrenizle karşılaştırın.</p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-enba-orange text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-md shadow-enba-orange/20 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Bağlanıyor...' : 'Bağlan'}
          </button>
        </form>
      </div>
    </div>
  );
};

type ActiveTab = 'invoices' | 'stock';

// ─── Ana Modül ────────────────────────────────────────────────────
export const Parasut: React.FC = () => {
  const savedCompany = parasutService.getCompany();
  const [ready, setReady]         = useState(parasutService.isLoggedIn() && !!savedCompany);
  const [companyId, setCompanyId] = useState(savedCompany?.id || '');
  const [activeTab, setActiveTab] = useState<ActiveTab>('invoices');

  // Fatura state
  const [invoices, setInvoices]   = useState<ParasutInvoice[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [catSearch, setCatSearch]           = useState('');
  const [search, setSearch]                 = useState('');
  const [lastSync, setLastSync]   = useState<Date | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ParasutInvoice; direction: 'asc' | 'desc' }>({ key: 'issue_date', direction: 'desc' });

  // Stok state
  const [items, setItems]           = useState<ParasutItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [itemsLoaded, setItemsLoaded] = useState(false);

  // Custom Dates
  const [dateFrom, setDateFrom] = useState(() => getRange('this_month').from);
  const [dateTo,   setDateTo]   = useState(() => getRange('this_month').to);

  // Kategori eşleştirme
  type CatRow = { id: string; name: string; prefix: string; mcode: string; newName: string };
  type CatStep = 'idle' | 'fetching' | 'ready' | 'uploading';
  const CAT_OPERATIONS = [
    { id: 'M', label: 'Merkez' },
    { id: 'K', label: 'Kömürcüler' },
    { id: 'V', label: 'Varsak' },
  ];
  const [showCatModal, setShowCatModal]     = useState(false);
  const [catStep, setCatStep]               = useState<CatStep>('idle');
  const [catRows, setCatRows]               = useState<CatRow[]>([]);
  const [catProgress, setCatProgress]       = useState({ done: 0, total: 0, errors: 0 });

  const fetchCategories = async () => {
    setCatStep('fetching');
    const cats = await parasutService.getItemCategories(companyId);
    setCatRows(cats.map(c => ({ id: c.id, name: c.name, prefix: 'M', mcode: '', newName: '' })));
    setCatStep('ready');
  };

  const updateRowPrefix = (id: string, prefix: string) => {
    setCatRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const found = MCODE_LIST.find(m => m.code === r.mcode);
      const newName = found ? `${prefix} - ${found.tr}` : r.newName;
      return { ...r, prefix, newName };
    }));
  };

  const updateRow = (id: string, mcode: string) => {
    const found = MCODE_LIST.find(m => m.code === mcode.trim().toUpperCase());
    setCatRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const newName = found ? `${r.prefix} - ${found.tr}` : r.newName;
      return { ...r, mcode: mcode.toUpperCase(), newName };
    }));
  };

  const updateNewName = (id: string, newName: string) => {
    setCatRows(prev => prev.map(r => r.id === id ? { ...r, newName } : r));
  };

  const exportCatExcel = async () => {
    const xlsx = await import('xlsx');
    const wb = xlsx.utils.book_new();
    const data1 = [
      ['ID', 'Mevcut Paraşüt Adı', 'Operasyon', 'M-Kodu', 'Yeni Ad (Otomatik / Düzenlenebilir)'],
      ...catRows.map(r => [r.id, r.name, r.prefix, r.mcode, r.newName]),
    ];
    const ws1 = xlsx.utils.aoa_to_sheet(data1);
    ws1['!cols'] = [{ wch: 10 }, { wch: 45 }, { wch: 14 }, { wch: 14 }, { wch: 65 }];
    xlsx.utils.book_append_sheet(wb, ws1, 'Eşleştirme');
    const data2 = [
      ['M-Kodu', 'İngilizce Açıklama', 'Paraşüt Kategori Adı (TR)'],
      ...MCODE_LIST.map(m => [m.code, m.en, m.tr]),
    ];
    const ws2 = xlsx.utils.aoa_to_sheet(data2);
    ws2['!cols'] = [{ wch: 14 }, { wch: 50 }, { wch: 70 }];
    xlsx.utils.book_append_sheet(wb, ws2, 'M-Kod Referans');
    xlsx.writeFile(wb, 'parasut_kategori_eslestirme.xlsx');
  };

  const importCatExcel = async (file: File) => {
    const xlsx = await import('xlsx');
    const buf = await file.arrayBuffer();
    const wb = xlsx.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    const updates: { id: string; prefix: string; mcode: string; newName: string }[] = [];
    for (const row of rows.slice(1)) {
      const id       = String(row[0] || '').trim();
      const prefix   = String(row[2] || 'M').trim().toUpperCase();
      const mcode    = String(row[3] || '').trim().toUpperCase();
      const override = String(row[4] || '').trim();
      if (!id) continue;
      const found = MCODE_LIST.find(m => m.code === mcode);
      const newName = override || (found ? `${prefix} - ${found.tr}` : '');
      updates.push({ id, prefix, mcode, newName });
    }
    setCatRows(prev => prev.map(r => {
      const u = updates.find(x => x.id === r.id);
      return u ? { ...r, prefix: u.prefix, mcode: u.mcode, newName: u.newName } : r;
    }));
  };

  const applyMappings = async () => {
    const toUpdate = catRows.filter(r => r.newName.trim());
    if (!toUpdate.length) return;
    setCatProgress({ done: 0, total: toUpdate.length, errors: 0 });
    setCatStep('uploading');
    let done = 0, errors = 0;
    for (const row of toUpdate) {
      const ok = await parasutService.patchCategoryName(companyId, row.id, row.newName.trim());
      if (ok) done++; else errors++;
      setCatProgress({ done: done + errors, total: toUpdate.length, errors });
      await new Promise(r => setTimeout(r, 400));
    }
    // Refresh
    const cats = await parasutService.getItemCategories(companyId);
    setCatRows(cats.map(c => ({ id: c.id, name: c.name, prefix: 'M', mcode: '', newName: '' })));
    setCatStep('ready');
  };

  const loadItems = useCallback(async (cid: string) => {
    if (!cid) return;
    setItemsLoading(true);
    setItemsError('');
    try {
      const data = await parasutService.getItems(cid);
      setItems(data);
      setItemsLoaded(true);
    } catch (err: any) {
      setItemsError(err.message || 'Stok verileri alınamadı.');
    } finally {
      setItemsLoading(false);
    }
  }, []);

  const loadData = useCallback(async (cid: string, from: string, to: string) => {
    if (!cid) return;
    setLoading(true);
    setError('');
    try {
      // Sequential fetching to avoid rate limit (429)
      const sales = await parasutService.getSalesInvoices(cid, from, to);
      const purchases = await parasutService.getPurchaseBills(cid, from, to);
      const expenditures = await parasutService.getExpenditures(cid, from, to);
      const salaries = await parasutService.getSalaries(cid, from, to);
      const taxes = await parasutService.getTaxes(cid, from, to);
      
      const combined = [...sales, ...purchases, ...expenditures, ...salaries, ...taxes];
      const unique = Array.from(new Map(combined.map(i => [i.id, i])).values());
      setInvoices(unique.sort((a, b) => b.issue_date.localeCompare(a.issue_date)));
      setLastSync(new Date());
    } catch (err: any) {
      console.error('[Parasut] loadData error:', err.message);
      setError(err.message || 'Veriler alınamadı.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready && companyId) loadData(companyId, dateFrom, dateTo);
  }, [ready, companyId, dateFrom, dateTo, loadData]);

  useEffect(() => {
    if (ready && companyId && activeTab === 'stock' && !itemsLoaded) {
      loadItems(companyId);
    }
  }, [ready, companyId, activeTab, itemsLoaded, loadItems]);

  const handlePresetChange = (p: DatePreset) => {
    setDatePreset(p);
    if (p !== 'custom') {
      const range = getRange(p);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  };

  const handleReady = (cid: string) => {
    setCompanyId(cid);
    setReady(true);
  };

  const handleLogout = () => {
    parasutService.logout();
    setReady(false);
    setInvoices([]);
    setItems([]);
    setItemsLoaded(false);
    setError('');
  };


  if (!ready) return <LoginForm onReady={handleReady} />;

  const filtered = React.useMemo(() => {
    return invoices.filter(inv => {
      if (typeFilter === 'income'  && inv.type !== 'sales_invoices')  return false;
      if (typeFilter === 'expense' && inv.type === 'sales_invoices') return false;
      
      // Category selection filter
      if (categoryFilter !== 'all' && inv.category_name !== categoryFilter) return false;
      
      // Dedicated category search filter
      if (catSearch && !inv.category_name?.toLowerCase().includes(catSearch.toLowerCase())) return false;
      
      if (search) {
        const q = search.toLowerCase();
        return inv.description.toLowerCase().includes(q)
          || inv.contact_name.toLowerCase().includes(q)
          || inv.invoice_no.toLowerCase().includes(q)
          || inv.category_name?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [invoices, typeFilter, categoryFilter, catSearch, search]);

  const sorted = React.useMemo(() => {
    const { key, direction } = sortConfig;
    return [...filtered].sort((a, b) => {
      let aVal: any = a[key];
      let bVal: any = b[key];
      
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      
      let res = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        res = aVal.localeCompare(bVal, 'tr');
      } else {
        res = aVal < bVal ? -1 : 1;
      }
      
      return direction === 'asc' ? res : -res;
    });
  }, [filtered, sortConfig]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(inv => { if (inv.category_name) set.add(inv.category_name); });
    return Array.from(set).sort();
  }, [invoices]);

  const totalIncome  = invoices.filter(i => i.type === 'sales_invoices').reduce((s, i) => s + i.gross_total, 0);
  const totalExpense = invoices.filter(i => i.type !== 'sales_invoices').reduce((s, i) => s + i.gross_total, 0);
  const netBalance   = totalIncome - totalExpense;

  const PRESETS: { id: DatePreset; label: string }[] = [
    { id: 'this_month', label: 'Bu Ay' },
    { id: 'last_3',     label: 'Son 3 Ay' },
    { id: 'this_year',  label: 'Bu Yıl' },
  ];

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-enba-orange rounded-xl flex items-center justify-center shadow shadow-enba-orange/20">
            <Receipt size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">Finansal Takip</h1>
              <span className="bg-gray-100 text-gray-400 text-[9px] font-black px-2 py-0.5 rounded-full">VER 1.5 - Paraşüt</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Bağlı</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Firma ID: <span className="font-medium text-gray-500">{companyId}</span>
              {lastSync && activeTab === 'invoices' && <span className="ml-2 text-gray-300">· Güncelleme: {lastSync.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setActiveTab('invoices')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'invoices' ? 'bg-white text-enba-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              Faturalar
            </button>
            <button onClick={() => setActiveTab('stock')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'stock' ? 'bg-white text-enba-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              Stok
            </button>
          </div>
          {activeTab === 'invoices' && (
            <button onClick={() => loadData(companyId, dateFrom, dateTo)} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200 transition-all">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Yenile
            </button>
          )}
          {activeTab === 'stock' && (
            <button onClick={() => { setItemsLoaded(false); loadItems(companyId); }} disabled={itemsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200 transition-all">
              <RefreshCw size={13} className={itemsLoading ? 'animate-spin' : ''} /> Yenile
            </button>
          )}
          <button
            onClick={() => { setShowCatModal(true); if (catStep === 'idle') fetchCategories(); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-600 border border-violet-200 rounded-xl text-xs font-medium hover:bg-violet-100 transition-all"
          >
            <FileSpreadsheet size={13} /> Kategori Eşleştir
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-medium hover:bg-red-50 hover:text-red-500 transition-all">
            <LogOut size={13} /> Çıkış
          </button>
        </div>
      </div>

      {activeTab === 'invoices' && <>
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Toplam Gelir',  value: totalIncome,  icon: TrendingUp,   color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Toplam Gider',  value: totalExpense, icon: TrendingDown, color: 'text-rose-500',    bg: 'bg-rose-50' },
          { label: 'Net Bakiye',    value: netBalance,   icon: Wallet,       color: netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500', bg: netBalance >= 0 ? 'bg-emerald-50' : 'bg-rose-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-4">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <card.icon size={18} className={card.color} />
            </div>
            <div>
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{card.label}</div>
              <div className={`text-lg font-semibold tabular-nums ${card.label === 'Net Bakiye' ? (netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600') : 'text-gray-800'}`}>
                {card.label === 'Net Bakiye' && netBalance > 0 ? '+' : ''}{money(card.value)} ₺
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => handlePresetChange(p.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${datePreset === p.id ? 'bg-white text-enba-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 px-2 border border-gray-100/50">
          <input 
            type="date" 
            value={dateFrom} 
            onChange={e => { setDateFrom(e.target.value); setDatePreset('custom'); }}
            className="bg-transparent text-[11px] font-semibold text-gray-600 outline-none p-1 cursor-pointer"
          />
          <span className="text-gray-300">—</span>
          <input 
            type="date" 
            value={dateTo} 
            onChange={e => { setDateTo(e.target.value); setDatePreset('custom'); }}
            className="bg-transparent text-[11px] font-semibold text-gray-600 outline-none p-1 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
          {([['all', 'Tümü'], ['income', 'Gelir'], ['expense', 'Gider']] as const).map(([id, label]) => (
            <button key={id} onClick={() => { setTypeFilter(id); setCategoryFilter('all'); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === id ? 'bg-white text-enba-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Kategori:</span>
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-transparent text-xs font-semibold text-gray-600 outline-none cursor-pointer min-w-[80px]"
          >
            <option value="all">Tümü</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <input 
            type="text" 
            placeholder="Ara..." 
            value={catSearch}
            onChange={e => setCatSearch(e.target.value)}
            className="bg-transparent text-xs text-gray-600 outline-none w-20 focus:w-32 transition-all placeholder:text-gray-300"
          />
        </div>
        <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari, açıklama veya fatura no..."
            className="bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none w-full" />
        </div>
        <div className="ml-auto text-xs text-gray-400 tabular-nums">{filtered.length} kayıt</div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600 font-mono whitespace-pre-wrap">
          <AlertCircle size={16} className="flex-shrink-0" />{error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 size={32} className="animate-spin text-enba-orange mb-3" />
            <span className="text-sm">Paraşüt'ten veriler alınıyor...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-300">
            <Receipt size={36} className="mb-3 opacity-40" />
            <span className="text-sm font-medium text-gray-400">Kayıt bulunamadı</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  { id: 'issue_date', label: 'Tarih' },
                  { id: 'type', label: 'Tür' },
                  { id: 'category_name', label: 'Kategori' },
                  { id: 'contact_name', label: 'Cari / Açıklama' },
                  { id: 'invoice_no', label: 'Fatura No' },
                  { id: 'gross_total', label: 'Tutar (KDV\'li)' },
                  { id: 'payment_status', label: 'Durum' },
                ].map(h => (
                  <th 
                    key={h.id} 
                    onClick={() => {
                      setSortConfig(prev => ({
                        key: h.id as keyof ParasutInvoice,
                        direction: prev.key === h.id && prev.direction === 'asc' ? 'desc' : 'asc'
                      }));
                    }}
                    className={`px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors ${h.id === 'gross_total' ? 'text-right' : 'text-left'}`}
                  >
                    <div className={`flex items-center gap-1 ${h.id === 'gross_total' ? 'justify-end' : ''}`}>
                      {h.label}
                      {sortConfig.key === h.id && (
                        <span className="text-enba-orange">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((inv, i) => {
                const isIncome = inv.type === 'sales_invoices';
                const st = STATUS[inv.payment_status] || { label: inv.payment_status, cls: 'bg-gray-100 text-gray-500' };
                return (
                  <tr key={inv.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-5 py-3.5 text-xs text-gray-500 tabular-nums whitespace-nowrap">{inv.issue_date}</td>
                    <td className="px-5 py-3.5">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isIncome ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {isIncome ? 'Gelir' : 'Gider'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {inv.category_name ? (
                        <div className="text-xs font-semibold text-gray-700">{inv.category_name}</div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Kategorisiz</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 max-w-[200px]">
                      <div className="text-xs font-medium text-gray-800 truncate">{inv.contact_name}</div>
                      {inv.description && inv.description !== '—' && (
                        <div className="text-[10px] text-gray-400 truncate mt-0.5">{inv.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 font-mono tabular-nums">{inv.invoice_no}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-sm font-semibold tabular-nums ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIncome ? '+' : '-'}{money(inv.gross_total)}
                        <span className="text-[10px] font-normal text-gray-400 ml-1">{inv.currency === 'TRL' ? '₺' : inv.currency}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide ${st.cls}`}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      </>}

      {/* ─── Stok Tab ─────────────────────────────────────────────── */}
      {activeTab === 'stock' && <>
        {/* Stok arama */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input type="text" value={itemSearch} onChange={e => setItemSearch(e.target.value)}
              placeholder="Ürün adı veya kodu..."
              className="bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none w-full" />
          </div>
          <div className="text-xs text-gray-400 tabular-nums">
            {items.filter(it => !itemSearch || it.name.toLowerCase().includes(itemSearch.toLowerCase()) || it.code.toLowerCase().includes(itemSearch.toLowerCase())).length} ürün
          </div>
        </div>

        {itemsError && (
          <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600">
            <AlertCircle size={16} className="flex-shrink-0" />{itemsError}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {itemsLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Loader2 size={32} className="animate-spin text-enba-orange mb-3" />
              <span className="text-sm">Paraşüt'ten stok verileri alınıyor...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-300">
              <Wallet size={36} className="mb-3 opacity-40" />
              <span className="text-sm font-medium text-gray-400">Stok kalemi bulunamadı</span>
            </div>
          ) : (() => {
            const filteredItems = items.filter(it =>
              !itemSearch || it.name.toLowerCase().includes(itemSearch.toLowerCase()) || it.code.toLowerCase().includes(itemSearch.toLowerCase())
            );
            return (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Ürün Adı', 'Kod', 'Stok Miktarı', 'Birim', 'Liste Fiyatı', 'Kategori'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, i) => (
                    <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                      <td className="px-5 py-3.5">
                        <div className="text-xs font-semibold text-gray-800">{item.name}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">{item.code || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold tabular-nums ${item.stock_count > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {item.stock_count.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{item.unit}</td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-gray-700 tabular-nums">
                        {item.list_price > 0 ? `${money(item.list_price)} ${item.currency === 'TRL' ? '₺' : item.currency}` : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        {item.category_name
                          ? <span className="text-xs font-medium text-gray-600">{item.category_name}</span>
                          : <span className="text-xs text-gray-300 italic">Kategorisiz</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      </>}

      {/* ── Kategori Eşleştirme Modal ──────────────────────────────────────── */}
      {showCatModal && (() => {
        const toUpdate = catRows.filter(r => r.newName.trim());
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => { if (catStep !== 'uploading') setShowCatModal(false); }}>
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-5xl mx-4 max-h-[88vh] flex flex-col"
              onClick={e => e.stopPropagation()}>

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-violet-500" /> Kategori Eşleştirme
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Operasyon seçin → M-kodu girin → Yeni Ad otomatik dolar → Uygula ile Paraşüt'e yükle
                  </p>
                </div>
                <button onClick={() => setShowCatModal(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
                  <X size={15} />
                </button>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 flex-wrap">
                <button onClick={exportCatExcel} disabled={catStep !== 'ready'}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600 transition-all disabled:opacity-40">
                  <Download size={13} /> Excel İndir
                </button>
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600 transition-all cursor-pointer">
                  <Upload size={13} /> Excel Yükle
                  <input type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) importCatExcel(f); e.target.value = ''; }} />
                </label>
                <div className="flex-1" />
                {catStep === 'ready' && (
                  <span className="text-xs text-gray-400">{catRows.length} kategori · {toUpdate.length} eşleştirildi</span>
                )}
                <button onClick={applyMappings}
                  disabled={catStep !== 'ready' || toUpdate.length === 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:brightness-110 transition-all disabled:opacity-40 shadow-sm shadow-violet-200">
                  Paraşüt'e Uygula ({toUpdate.length})
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {catStep === 'idle' && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <FileSpreadsheet size={40} className="text-gray-200" />
                    <button onClick={fetchCategories}
                      className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-sm shadow-violet-200">
                      <RefreshCw size={14} /> Kategorileri Yükle
                    </button>
                  </div>
                )}

                {catStep === 'fetching' && (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                    <Loader2 size={32} className="animate-spin text-violet-500" />
                    <span className="text-sm">Paraşüt'ten kategoriler alınıyor...</span>
                  </div>
                )}

                {catStep === 'uploading' && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 size={32} className="animate-spin text-violet-500" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        Güncelleniyor... {catProgress.done}/{catProgress.total}
                      </p>
                      {catProgress.errors > 0 && (
                        <p className="text-xs text-rose-500">{catProgress.errors} hata</p>
                      )}
                    </div>
                    <div className="w-64 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 bg-violet-500 rounded-full transition-all"
                        style={{ width: `${catProgress.total ? (catProgress.done / catProgress.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {catStep === 'ready' && (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 z-10">
                      <tr className="border-b border-gray-100">
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Mevcut Paraşüt Adı</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left w-36">Operasyon</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left w-36">M-Kodu</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Yeni Ad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catRows.map((row, i) => (
                        <tr key={row.id} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                          <td className="px-5 py-2 text-xs text-gray-700 font-medium">{row.name}</td>
                          <td className="px-5 py-2">
                            <select
                              value={row.prefix}
                              onChange={e => updateRowPrefix(row.id, e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-violet-400 bg-white">
                              {CAT_OPERATIONS.map(op => (
                                <option key={op.id} value={op.id}>{op.id} — {op.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-2">
                            <input
                              list={`mcode-list-${row.id}`}
                              value={row.mcode}
                              onChange={e => updateRow(row.id, e.target.value)}
                              placeholder="M105"
                              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono outline-none focus:border-violet-400 bg-white"
                            />
                            <datalist id={`mcode-list-${row.id}`}>
                              {MCODE_LIST.map(m => (
                                <option key={m.code} value={m.code}>{m.code} — {m.tr}</option>
                              ))}
                            </datalist>
                          </td>
                          <td className="px-5 py-2">
                            <input
                              value={row.newName}
                              onChange={e => updateNewName(row.id, e.target.value)}
                              placeholder="Otomatik dolar..."
                              className={`w-full border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-violet-400 bg-white ${row.newName ? 'border-emerald-300 text-emerald-700 font-medium' : 'border-gray-200 text-gray-400'}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
