import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  LogOut,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  AlertCircle,
  Loader2,
  Search,
} from 'lucide-react';
import { parasutService, type ParasutInvoice, type ParasutCompany } from '../api/parasut';

type DatePreset = 'this_month' | 'last_3' | 'this_year';
type TypeFilter = 'all' | 'income' | 'expense';

const PAYMENT_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  paid:        { label: 'Ödendi',    cls: 'bg-emerald-100 text-emerald-700' },
  overdue:     { label: 'Gecikmiş', cls: 'bg-rose-100 text-rose-700' },
  not_due:     { label: 'Vadeli',   cls: 'bg-blue-100 text-blue-700' },
  unscheduled: { label: 'Planlanmadı', cls: 'bg-gray-100 text-gray-500' },
};

function getDateRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const to = fmt(now);
  if (preset === 'this_month') {
    const from = fmt(new Date(now.getFullYear(), now.getMonth(), 1));
    return { from, to };
  }
  if (preset === 'last_3') {
    const from = fmt(new Date(now.getFullYear(), now.getMonth() - 2, 1));
    return { from, to };
  }
  return { from: `${now.getFullYear()}-01-01`, to };
}

function fmt(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Login Screen ──────────────────────────────────────────────
const LoginView: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await parasutService.login(email, password);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız.');
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
            <p className="text-xs text-gray-400">Paraşüt hesabınızla giriş yapın</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-enba-orange text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-md shadow-enba-orange/20 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Company Setup ─────────────────────────────────────────────
const CompanyView: React.FC<{ onSave: (c: ParasutCompany) => void }> = ({ onSave }) => {
  const [companyId, setCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!companyId.trim()) { setError('Firma ID giriniz.'); return; }
    onSave({ id: companyId.trim(), name: companyName.trim() || companyId.trim() });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Building2 size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Firma Seçimi</h2>
            <p className="text-xs text-gray-400">Paraşüt firma ID'nizi girin</p>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-600 mb-5 leading-relaxed">
          Firma ID'nizi Paraşüt'te giriş yaptıktan sonra URL'den bulabilirsiniz:
          <br />
          <code className="font-mono text-blue-800">uygulama.parasut.com/<strong>123456</strong>/...</code>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Firma ID</label>
            <input
              type="text"
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-enba-orange/50 focus:ring-2 focus:ring-enba-orange/10 transition-all"
              placeholder="123456"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Firma Adı (isteğe bağlı)</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-enba-orange/50 focus:ring-2 focus:ring-enba-orange/10 transition-all"
              placeholder="Firma Adı"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            className="w-full py-3 bg-enba-orange text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-md shadow-enba-orange/20"
          >
            Devam Et
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Module ───────────────────────────────────────────────
export const Parasut: React.FC = () => {
  const [authState, setAuthState] = useState<'login' | 'company' | 'ready'>(() => {
    if (!parasutService.isLoggedIn()) return 'login';
    if (!parasutService.getCompany()) return 'company';
    return 'ready';
  });

  const [company, setCompany] = useState<ParasutCompany | null>(() => parasutService.getCompany());
  const [invoices, setInvoices] = useState<ParasutInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const loadData = useCallback(async (comp: ParasutCompany, preset: DatePreset) => {
    setLoading(true);
    setError('');
    try {
      const { from, to } = getDateRange(preset);
      const [sales, purchases] = await Promise.all([
        parasutService.getSalesInvoices(comp.id, from, to),
        parasutService.getPurchaseBills(comp.id, from, to),
      ]);
      setInvoices([...sales, ...purchases].sort((a, b) => b.issue_date.localeCompare(a.issue_date)));
      setLastSync(new Date());
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') {
        setAuthState('login');
      } else {
        setError(err.message || 'Veriler alınamadı.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authState === 'ready' && company) loadData(company, datePreset);
  }, [authState, company, datePreset, loadData]);

  const handleLogin = () => {
    if (!parasutService.getCompany()) setAuthState('company');
    else { setAuthState('ready'); setCompany(parasutService.getCompany()); }
  };

  const handleCompanySave = (c: ParasutCompany) => {
    parasutService.saveCompany(c);
    setCompany(c);
    setAuthState('ready');
  };

  const handleLogout = () => {
    parasutService.logout();
    setInvoices([]);
    setCompany(null);
    setAuthState('login');
  };

  if (authState === 'login') return <LoginView onLogin={handleLogin} />;
  if (authState === 'company') return <CompanyView onSave={handleCompanySave} />;

  const filtered = invoices.filter(inv => {
    if (typeFilter === 'income' && inv.type !== 'sales_invoices') return false;
    if (typeFilter === 'expense' && inv.type !== 'purchase_bills') return false;
    if (search) {
      const q = search.toLowerCase();
      return inv.description.toLowerCase().includes(q) || inv.contact_name.toLowerCase().includes(q) || inv.invoice_no.toLowerCase().includes(q);
    }
    return true;
  });

  const totalIncome = invoices.filter(i => i.type === 'sales_invoices').reduce((s, i) => s + i.gross_total, 0);
  const totalExpense = invoices.filter(i => i.type === 'purchase_bills').reduce((s, i) => s + i.gross_total, 0);
  const netBalance = totalIncome - totalExpense;

  const PRESETS: { id: DatePreset; label: string }[] = [
    { id: 'this_month', label: 'Bu Ay' },
    { id: 'last_3', label: 'Son 3 Ay' },
    { id: 'this_year', label: 'Bu Yıl' },
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
            <h1 className="text-xl font-semibold text-gray-800">Gelir / Gider</h1>
            <p className="text-xs text-gray-400">
              {company?.name || company?.id}
              {lastSync && <span className="ml-2 text-gray-300">· {lastSync.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} güncellendi</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => company && loadData(company, datePreset)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200 transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Yenile
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-medium hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut size={13} />
            Çıkış
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Toplam Gelir</div>
            <div className="text-lg font-semibold text-gray-800 tabular-nums">{fmt(totalIncome)} ₺</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingDown size={18} className="text-rose-500" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Toplam Gider</div>
            <div className="text-lg font-semibold text-gray-800 tabular-nums">{fmt(totalExpense)} ₺</div>
          </div>
        </div>
        <div className={`bg-white rounded-2xl border shadow-sm px-6 py-5 flex items-center gap-4 ${netBalance >= 0 ? 'border-emerald-100' : 'border-rose-100'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${netBalance >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            <Wallet size={18} className={netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
          </div>
          <div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Net Bakiye</div>
            <div className={`text-lg font-semibold tabular-nums ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {netBalance >= 0 ? '+' : ''}{fmt(netBalance)} ₺
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 flex-wrap">
        {/* Date Presets */}
        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setDatePreset(p.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                datePreset === p.id ? 'bg-white text-enba-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
          {([['all', 'Tümü'], ['income', 'Gelir'], ['expense', 'Gider']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTypeFilter(id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === id ? 'bg-white text-enba-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari, açıklama veya fatura no..."
            className="bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none w-full"
          />
        </div>

        <div className="ml-auto text-xs text-gray-400 tabular-nums">
          {filtered.length} kayıt
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
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
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tarih</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tür</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Cari / Açıklama</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Fatura No</th>
                <th className="text-right px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tutar (KDV'li)</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Durum</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => {
                const isIncome = inv.type === 'sales_invoices';
                const statusInfo = PAYMENT_STATUS_LABELS[inv.payment_status] || { label: inv.payment_status, cls: 'bg-gray-100 text-gray-500' };
                return (
                  <tr key={inv.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-5 py-3.5 text-xs text-gray-500 tabular-nums whitespace-nowrap">
                      {inv.issue_date}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isIncome
                          ? <ArrowUpRight size={11} />
                          : <ArrowDownRight size={11} />}
                        {isIncome ? 'Gelir' : 'Gider'}
                      </div>
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
                        {isIncome ? '+' : '-'}{fmt(inv.gross_total)}
                        <span className="text-[10px] font-normal text-gray-400 ml-1">{inv.currency === 'TRL' ? '₺' : inv.currency}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
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
