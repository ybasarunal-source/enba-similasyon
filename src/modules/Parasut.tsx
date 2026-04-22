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
} from 'lucide-react';
import { parasutService, type ParasutInvoice } from '../api/parasut';

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
    setError('ADIM 1: handleSubmit çalıştı');
    if (!companyId.trim()) { setError('Firma ID zorunludur.'); return; }
    setLoading(true);
    try {
      setError('ADIM 1.5: login çağrılıyor...');
      await parasutService.login(email, password);
      setError('ADIM 2: Login başarılı, token alındı');
      parasutService.saveCompany({ id: companyId.trim(), name: companyId.trim() });
      setError('ADIM 3: Firma kaydedildi, ready tetikleniyor');
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

// ─── Ana Modül ────────────────────────────────────────────────────
export const Parasut: React.FC = () => {
  const savedCompany = parasutService.getCompany();
  const [ready, setReady]         = useState(parasutService.isLoggedIn() && !!savedCompany);
  const [companyId, setCompanyId] = useState(savedCompany?.id || '');
  const [invoices, setInvoices]   = useState<ParasutInvoice[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch]       = useState('');
  const [lastSync, setLastSync]   = useState<Date | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ParasutInvoice; direction: 'asc' | 'desc' }>({ key: 'issue_date', direction: 'desc' });

  // Custom Dates (New Feature Kept)
  const [dateFrom, setDateFrom] = useState(() => getRange('this_month').from);
  const [dateTo,   setDateTo]   = useState(() => getRange('this_month').to);

  const loadData = useCallback(async (cid: string, from: string, to: string) => {
    console.log('[Parasut] loadData called, cid:', cid, 'from:', from, 'to:', to);
    if (!cid) return;
    setLoading(true);
    setError('');
    try {
      const [sales, purchases, expenditures] = await Promise.all([
        parasutService.getSalesInvoices(cid, from, to),
        parasutService.getPurchaseBills(cid, from, to),
        parasutService.getExpenditures(cid, from, to),
      ]);
      const combined = [...sales, ...purchases, ...expenditures];
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

  const handlePresetChange = (p: DatePreset) => {
    setDatePreset(p);
    if (p !== 'custom') {
      const range = getRange(p);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  };

  const handleReady = (cid: string) => {
    console.log('[Parasut] handleReady called, cid:', cid);
    console.log('[Parasut] isLoggedIn:', parasutService.isLoggedIn());
    setCompanyId(cid);
    setReady(true);
    console.log('[Parasut] setReady(true) called');
  };

  const handleLogout = () => {
    parasutService.logout();
    setReady(false);
    setInvoices([]);
    setError('');
  };

  // Re-added working Debug button
  const handleDebug = async () => {
    const token = await parasutService.getToken();
    if (!token) { setError('DEBUG: Token yok!'); return; }
    try {
      const r = await fetch(`/api/parasut-debug?token=${token}&company=${companyId}`);
      const j = await r.json();
      setError(`DEBUG: status=${j.header_auth?.status} | token_prefix=${j.token_prefix} | body=${String(j.header_auth?.body || '').slice(0, 150)}`);
    } catch (e: any) {
      setError('DEBUG hata: ' + e.message);
    }
  };

  if (!ready) return <LoginForm onReady={handleReady} />;

  const filtered = React.useMemo(() => {
    return invoices.filter(inv => {
      if (typeFilter === 'income'  && inv.type !== 'sales_invoices')  return false;
      if (typeFilter === 'expense' && inv.type === 'sales_invoices') return false;
      if (categoryFilter !== 'all' && inv.category_name !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return inv.description.toLowerCase().includes(q)
          || inv.contact_name.toLowerCase().includes(q)
          || inv.invoice_no.toLowerCase().includes(q)
          || inv.category_name?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [invoices, typeFilter, categoryFilter, search]);

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
              {lastSync && <span className="ml-2 text-gray-300">· Güncelleme: {lastSync.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadData(companyId, dateFrom, dateTo)} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200 transition-all">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Yenile
          </button>
          <button onClick={handleDebug}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl text-xs font-medium hover:bg-yellow-200 transition-all">
            Debug
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-medium hover:bg-red-50 hover:text-red-500 transition-all">
            <LogOut size={13} /> Çıkış
          </button>
        </div>
      </div>

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
            className="bg-transparent text-xs font-semibold text-gray-600 outline-none cursor-pointer min-w-[100px]"
          >
            <option value="all">Tümü</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
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
    </div>
  );
};
