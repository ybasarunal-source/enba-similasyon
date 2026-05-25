import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Trash2,
  Check,
  Plus,
} from 'lucide-react';
import { parasutService, type ParasutInvoice, type ParasutItem } from '../api/parasut';
import { financialCategoriesAPI } from '../api/financialCategories';
import { type UserProfile } from '../api/supabase';
import { Ayarlar } from './Ayarlar';

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
interface ParasutProps { profile: UserProfile | null; navigate: (view: string) => void; }
export const Parasut: React.FC<ParasutProps> = ({ profile, navigate }) => {
  const savedCompany = parasutService.getCompany();
  const [ready, setReady]         = useState(parasutService.isLoggedIn() && !!savedCompany);
  const [companyId, setCompanyId] = useState(savedCompany?.id || '');

  // Async token yüklemesi mount'tan sonra tamamlanmışsa ready'yi güncelle
  useEffect(() => {
    if (ready) return;
    const targetId = profile?.company_id;
    if (!targetId) return;
    parasutService.loadTokenFromSupabase(targetId).then(restored => {
      const co = parasutService.getCompany();
      if (!restored || !parasutService.isLoggedIn()) return;
      if (co) { setCompanyId(co.id); setReady(true); }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.company_id]);

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
  type CatRow = { id: string; name: string; prefix: string; mcode: string; newName: string; toDelete: boolean };
  type CatStep = 'idle' | 'fetching' | 'ready' | 'confirming' | 'uploading';
  type ConfirmDelete = { id: string; name: string; count: number | null };
  type ConfirmData = {
    deletes: ConfirmDelete[];
    renames: { id: string; oldName: string; newName: string }[];
    creates: { mcode: string; tr: string }[];
    createOps: string[];
  };
  const CAT_OPERATIONS = [
    { id: 'M', label: 'Merkez' },
    { id: 'K', label: 'Kömürcüler' },
    { id: 'V', label: 'Varsak' },
  ];
  const [showCatModal, setShowCatModal]   = useState(false);
  const [showAyarlarPanel, setShowAyarlarPanel] = useState(false);
  const [catStep, setCatStep]             = useState<CatStep>('idle');
  const [catRows, setCatRows]             = useState<CatRow[]>([]);
  const [catProgress, setCatProgress]     = useState({ done: 0, total: 0, errors: 0 });
  const [confirmData, setConfirmData]     = useState<ConfirmData | null>(null);
  const [subasCats, setSupabaseCats]      = useState<{ code: string; tr: string }[]>([]);
  type UploadError = { op: string; name: string; detail?: string };
  const [uploadReport, setUploadReport]   = useState<UploadError[]>([]);
  const [openMcodeFor, setOpenMcodeFor]   = useState<string | null>(null);
  const [mcodeQuery, setMcodeQuery]       = useState('');
  const [creatingMcodeFor, setCreatingMcodeFor] = useState<string | null>(null);
  const [newMcodeName, setNewMcodeName]   = useState('');
  const [createMcodeError, setCreateMcodeError] = useState('');
  const isCreatingMcodeRef = useRef(false);
  const [showNewOp, setShowNewOp]         = useState(false);
  const [newOpName, setNewOpName]         = useState('');
  const [newOpPrefix, setNewOpPrefix]     = useState('');
  const [newOpProgress, setNewOpProgress] = useState<{ done: number; total: number; errors: number } | null>(null);

  const allMcodes = subasCats;

  const autoMatchWith = (name: string, mcodes: { code: string; tr: string }[]): { prefix: string; mcode: string; newName: string } => {
    // Format: "K450-Personel", "M489-Maaş", "V369-Malzeme"
    const match = name.match(/([KMVkmv])(\d{3,4}(?:\.\d{2})?)/);
    if (match) {
      const prefix = match[1].toUpperCase() as 'K' | 'M' | 'V';
      const mcode = 'M' + match[2].toUpperCase();
      const found = mcodes.find(m => m.code === mcode);
      if (found) return { prefix, mcode, newName: `${prefix} - ${found.tr}` };
      // Kod tanımlı değil ama prefix ve numara doğru
      return { prefix, mcode, newName: '' };
    }
    // Fallback: ilk harften prefix bul
    const firstChar = name.replace(/^[\s\-_]+/, '')[0]?.toUpperCase() || '';
    const prefix = firstChar === 'K' ? 'K' : firstChar === 'V' ? 'V' : 'M';
    return { prefix, mcode: '', newName: '' };
  };

  const autoMatchCategory = (name: string) => autoMatchWith(name, allMcodes);

  const fetchCategories = async () => {
    setCatStep('fetching');
    let mcodes: { code: string; tr: string }[] = [];
    if (profile?.company_id) {
      try {
        await financialCategoriesAPI.seedIfEmpty(profile.company_id);
        const cats = await financialCategoriesAPI.getAll(profile.company_id);
        mcodes = cats.filter(c => c.is_active).map(c => ({ code: c.code, tr: c.name_tr }));
        setSupabaseCats(mcodes);
      } catch { /* devam et */ }
    }
    const cats = await parasutService.getItemCategories(companyId);
    setCatRows(cats.map(c => ({ id: c.id, name: c.name, ...autoMatchWith(c.name, mcodes), toDelete: false })));
    setCatStep('ready');
  };

  const reloadMcodes = async () => {
    if (!profile?.company_id) return;
    try {
      const cats = await financialCategoriesAPI.getAll(profile.company_id, true);
      setSupabaseCats(cats.filter(c => c.is_active).map(c => ({ code: c.code, tr: c.name_tr })));
    } catch { /* ignore */ }
  };

  const handleCreateMcode = async (rowId: string) => {
    if (!newMcodeName.trim() || !profile?.company_id) return;
    const code = mcodeQuery.trim().toUpperCase();
    const parent_code = code.includes('.') ? code.split('.')[0] : null;
    setCreateMcodeError('');
    try {
      await financialCategoriesAPI.add(profile.company_id, {
        code,
        parent_code,
        name_tr: newMcodeName.trim(),
        is_custom: true,
        sort_order: 9999,
      });
      await reloadMcodes();
      setCatRows(prev => prev.map(r => r.id !== rowId ? r : {
        ...r, mcode: code, newName: `${r.prefix} - ${code} - ${newMcodeName.trim()}`,
      }));
      // Başarıda kapat
      isCreatingMcodeRef.current = false;
      setOpenMcodeFor(null);
      setMcodeQuery('');
      setCreatingMcodeFor(null);
      setNewMcodeName('');
    } catch (e: any) {
      // Hata durumunda dropdown açık kalır, hata inline gösterilir
      setCreateMcodeError(e.message || 'Kayıt hatası');
    }
  };

  const toggleDelete = (id: string) => {
    setCatRows(prev => prev.map(r => r.id === id ? { ...r, toDelete: !r.toDelete } : r));
  };

  const updateRowPrefix = (id: string, prefix: string) => {
    setCatRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      // Mcode yoksa col 1 adından yeniden çıkart
      const mcode = r.mcode || autoMatchWith(r.name, allMcodes).mcode;
      const found = allMcodes.find(m => m.code === mcode);
      return { ...r, prefix, mcode, newName: found ? `${prefix} - ${found.tr}` : r.newName };
    }));
  };

  const updateRow = (id: string, mcode: string) => {
    const found = allMcodes.find(m => m.code === mcode.trim().toUpperCase());
    setCatRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      return { ...r, mcode: mcode.toUpperCase(), newName: found ? `${r.prefix} - ${found.tr}` : r.newName };
    }));
  };

  const updateNewName = (id: string, newName: string) => {
    setCatRows(prev => prev.map(r => r.id === id ? { ...r, newName } : r));
  };

  const exportCatExcel = async () => {
    const xlsx = await import('xlsx');
    const wb = xlsx.utils.book_new();
    const ws1 = xlsx.utils.aoa_to_sheet([
      ['ID', 'Mevcut Paraşüt Adı', 'Operasyon', 'M-Kodu', 'Yeni Ad (Otomatik / Düzenlenebilir)', 'Silinecek'],
      ...catRows.map(r => [r.id, r.name, r.prefix, r.mcode, r.newName, r.toDelete ? 'EVET' : '']),
    ]);
    ws1['!cols'] = [{ wch: 10 }, { wch: 45 }, { wch: 14 }, { wch: 14 }, { wch: 65 }, { wch: 10 }];
    xlsx.utils.book_append_sheet(wb, ws1, 'Eşleştirme');
    const ws2 = xlsx.utils.aoa_to_sheet([
      ['M-Kodu', 'Kategori Adı (TR)'],
      ...allMcodes.map(m => [m.code, m.tr]),
    ]);
    ws2['!cols'] = [{ wch: 14 }, { wch: 50 }, { wch: 70 }];
    xlsx.utils.book_append_sheet(wb, ws2, 'M-Kod Referans');
    xlsx.writeFile(wb, 'parasut_kategori_eslestirme.xlsx');
  };

  const importCatExcel = async (file: File) => {
    const xlsx = await import('xlsx');
    const rows = xlsx.utils.sheet_to_json(
      xlsx.read(await file.arrayBuffer()).Sheets[xlsx.read(await file.arrayBuffer()).SheetNames[0]],
      { header: 1 }
    ) as any[][];
    const updates: { id: string; prefix: string; mcode: string; newName: string; toDelete: boolean }[] = [];
    for (const row of rows.slice(1)) {
      const id     = String(row[0] || '').trim();
      const prefix = String(row[2] || 'M').trim().toUpperCase();
      const mcode  = String(row[3] || '').trim().toUpperCase();
      const over   = String(row[4] || '').trim();
      const del    = String(row[5] || '').trim().toUpperCase() === 'EVET';
      if (!id) continue;
      const found  = allMcodes.find(m => m.code === mcode);
      updates.push({ id, prefix, mcode, newName: over || (found ? `${prefix} - ${found.tr}` : ''), toDelete: del });
    }
    setCatRows(prev => prev.map(r => {
      const u = updates.find(x => x.id === r.id);
      return u ? { ...r, ...u } : r;
    }));
  };

  const prepareConfirm = async () => {
    const toDelete  = catRows.filter(r => r.toDelete);
    const toRename  = catRows.filter(r => !r.toDelete && r.newName.trim() && r.newName.trim() !== r.name);
    const usedCodes = new Set(catRows.filter(r => !r.toDelete && r.mcode).map(r => r.mcode));
    const toCreate  = allMcodes.filter(m => !usedCodes.has(m.code));

    setCatStep('confirming');
    // Fetch record counts sequentially to avoid rate-limiting
    const deletes: ConfirmDelete[] = [];
    for (const r of toDelete) {
      let count = 0;
      for (const ep of ['sales_invoices', 'purchase_bills', 'expenditures']) {
        try {
          const resp = await parasutService.request(
            `/${companyId}/${ep}`,
            { 'filter[category_id]': r.id, 'page[size]': '1', 'page[number]': '1' }
          );
          count += resp.meta?.total_count ?? resp.meta?.record_count ?? 0;
        } catch { /* ignore */ }
      }
      deletes.push({ id: r.id, name: r.name, count });
    }
    setConfirmData({
      deletes,
      renames: toRename.map(r => ({ id: r.id, oldName: r.name, newName: r.newName.trim() })),
      creates: toCreate.map(m => ({ mcode: m.code, tr: m.tr })),
      createOps: ['M'],
    });
  };

  const executeUpload = async () => {
    if (!confirmData) return;
    const totalOps =
      confirmData.deletes.length +
      confirmData.renames.length +
      confirmData.creates.length * confirmData.createOps.length;
    setCatProgress({ done: 0, total: totalOps, errors: 0 });
    setCatStep('uploading');
    setUploadReport([]);
    let done = 0, errors = 0;
    const errs: UploadError[] = [];
    const tick = async (ok: boolean, errEntry?: UploadError) => {
      if (ok) done++; else { errors++; if (errEntry) errs.push(errEntry); }
      setCatProgress({ done: done + errors, total: totalOps, errors });
      await new Promise(res => setTimeout(res, 600));
    };
    for (const d of confirmData.deletes) {
      const ok = await parasutService.deleteItemCategory(companyId, d.id);
      await tick(ok, ok ? undefined : { op: 'Silme', name: d.name });
    }
    for (const r of confirmData.renames) {
      const ok = await parasutService.patchCategoryName(companyId, r.id, r.newName);
      await tick(ok, ok ? undefined : { op: 'Yeniden Adlandır', name: `${r.oldName} → ${r.newName}` });
    }
    for (const op of confirmData.createOps) {
      for (const c of confirmData.creates) {
        try {
          await parasutService.requestWrite(`/${companyId}/item_categories`, 'POST', {
            data: { type: 'item_categories', attributes: { name: `${op} - ${c.tr}` } },
          });
          await tick(true);
        } catch (e: any) { await tick(false, { op: 'Yeni Oluştur', name: `${op} - ${c.tr}`, detail: e.message }); }
      }
    }
    const cats = await parasutService.getItemCategories(companyId);
    setCatRows(cats.map(c => ({ id: c.id, name: c.name, ...autoMatchWith(c.name, subasCats), toDelete: false })));
    setConfirmData(null);
    setUploadReport(errs);
    setCatStep('ready');
  };

  const createOperation = async () => {
    const prefix = newOpPrefix.trim().toUpperCase();
    if (!prefix || !companyId) return;
    const mcodes = allMcodes.length > 0 ? allMcodes : [];
    if (mcodes.length === 0) return;
    setNewOpProgress({ done: 0, total: mcodes.length, errors: 0 });
    let done = 0, errors = 0;
    for (const m of mcodes) {
      const name = `${prefix} - ${m.tr}`;
      try {
        await parasutService.requestWrite(`/${companyId}/item_categories`, 'POST', {
          data: { type: 'item_categories', attributes: { name } },
        });
        done++;
      } catch { errors++; }
      setNewOpProgress({ done: done + errors, total: mcodes.length, errors });
      await new Promise(res => setTimeout(res, 300));
    }
    // Kategorileri yenile
    const cats = await parasutService.getItemCategories(companyId);
    setCatRows(cats.map(c => ({ id: c.id, name: c.name, ...autoMatchWith(c.name, subasCats), toDelete: false })));
    setNewOpProgress(null);
    setShowNewOp(false);
    setNewOpName('');
    setNewOpPrefix('');
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



  const filtered = React.useMemo(() => {
    return invoices.filter(inv => {
      if (typeFilter === 'income'  && inv.type !== 'sales_invoices')  return false;
      if (typeFilter === 'expense' && inv.type === 'sales_invoices') return false;
      if (categoryFilter !== 'all' && inv.category_name !== categoryFilter) return false;
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

  if (!ready) return (
    <div className="p-8 animate-in fade-in duration-500">
      <LoginForm onReady={handleReady} />
    </div>
  );

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

      {/* ── Finansal Ayarlar Side Panel ───────────────────────────────────── */}
      {showAyarlarPanel && (
        <div className="fixed inset-0 z-[60] flex">
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={async () => { setShowAyarlarPanel(false); await reloadMcodes(); }}
          />
          <div className="w-[680px] bg-white shadow-2xl flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-base font-bold text-gray-800">Finansal Kategoriler</h2>
              <button
                onClick={async () => { setShowAyarlarPanel(false); await reloadMcodes(); }}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Ayarlar profile={profile} />
            </div>
          </div>
        </div>
      )}

      {/* ── Kategori Eşleştirme Modal ──────────────────────────────────────── */}
      {showCatModal && (() => {
        const toDelete  = catRows.filter(r => r.toDelete);
        const toRename  = catRows.filter(r => !r.toDelete && r.newName.trim() && r.newName.trim() !== r.name);
        const readyCount = toDelete.length + toRename.length;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => { if (catStep !== 'uploading' && catStep !== 'confirming') setShowCatModal(false); }}>
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-5xl mx-4 max-h-[88vh] flex flex-col"
              onClick={e => e.stopPropagation()}>

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-violet-500" />
                    {catStep === 'confirming' ? 'Onay — Paraşüt\'e Gönderilecekler' : 'Kategori Eşleştirme'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {catStep === 'confirming'
                      ? 'Aşağıdaki işlemleri onaylayın. Veriler kategorisiz hale gelecektir.'
                      : 'Operasyon seçin → M-kodu girin → Yeni Ad otomatik dolar → İnceleme ekranından onayla'}
                  </p>
                </div>
                {catStep !== 'uploading' && catStep !== 'confirming' && (
                  <button onClick={() => setShowCatModal(false)}
                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Toolbar — only in ready step */}
              {catStep === 'ready' && (
                <div className="flex-shrink-0 border-b border-gray-100">
                  {/* Toolbar */}
                  <div className="flex items-center gap-3 px-6 py-3 bg-gray-50/50 flex-wrap">
                    <button onClick={exportCatExcel}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600 transition-all">
                      <Download size={13} /> Excel İndir
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600 transition-all cursor-pointer">
                      <Upload size={13} /> Excel Yükle
                      <input type="file" accept=".xlsx,.xls" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) importCatExcel(f); e.target.value = ''; }} />
                    </label>
                    <button onClick={() => setShowNewOp(v => !v)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all ${showNewOp ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600'}`}>
                      <Plus size={13} /> Yeni Operasyon Kur
                    </button>
                    <button onClick={() => setShowAyarlarPanel(true)} className="text-[11px] text-gray-400 italic hover:text-violet-600 transition-colors">
                      Özel kategoriler → <span className="font-medium text-violet-500 underline underline-offset-2">Finansal Ayarlar</span>
                    </button>
                    <div className="flex-1" />
                    <span className="text-xs text-gray-400">
                      {catRows.length} kategori
                      {toRename.length > 0 && <span className="text-emerald-600 font-medium"> · {toRename.length} yeniden adlandırılacak</span>}
                      {toDelete.length > 0 && <span className="text-rose-500 font-medium"> · {toDelete.length} silinecek</span>}
                    </span>
                    <button onClick={prepareConfirm}
                      disabled={readyCount === 0}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:brightness-110 transition-all disabled:opacity-40 shadow-sm shadow-violet-200">
                      İncele ve Onayla ({readyCount})
                    </button>
                  </div>

                  {/* Yeni Operasyon Formu */}
                  {showNewOp && (
                    <div className="px-6 py-4 bg-emerald-50/60 border-t border-emerald-100">
                      {newOpProgress ? (
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-white rounded-full h-2 overflow-hidden border border-emerald-200">
                            <div className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                              style={{ width: `${Math.round((newOpProgress.done / newOpProgress.total) * 100)}%` }} />
                          </div>
                          <span className="text-xs text-emerald-700 font-medium whitespace-nowrap">
                            {newOpProgress.done} / {newOpProgress.total}
                            {newOpProgress.errors > 0 && <span className="text-rose-500"> · {newOpProgress.errors} hata</span>}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-end gap-3 flex-wrap">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Operasyon Adı</label>
                            <input
                              type="text" placeholder="ör. Ankara" value={newOpName}
                              onChange={e => setNewOpName(e.target.value)}
                              className="w-40 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-emerald-400 bg-white" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Önkod (1-2 harf)</label>
                            <input
                              type="text" placeholder="ör. A" value={newOpPrefix} maxLength={2}
                              onChange={e => setNewOpPrefix(e.target.value.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, ''))}
                              className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold uppercase outline-none focus:border-emerald-400 bg-white tracking-widest" />
                          </div>
                          {newOpPrefix.trim() && (
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Önizleme</label>
                              <span className="text-[11px] text-gray-500 font-mono bg-white border border-gray-100 rounded-lg px-2 py-1.5">
                                {newOpPrefix.trim().toUpperCase()} - {allMcodes[0]?.tr ?? 'M105 - 600.01 - Yurt İçi Satışlar'}
                                <span className="text-gray-400"> + {allMcodes.length - 1} kod</span>
                              </span>
                            </div>
                          )}
                          <button
                            onClick={createOperation}
                            disabled={!newOpPrefix.trim() || allMcodes.length === 0}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:brightness-110 transition-all disabled:opacity-40 shadow-sm shadow-emerald-200">
                            <Upload size={13} /> {allMcodes.length} Kodu Paraşüt'e Yükle
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}


              {/* Content */}
              <div className="flex-1 overflow-y-auto">

                {/* idle */}
                {catStep === 'idle' && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <FileSpreadsheet size={40} className="text-gray-200" />
                    <button onClick={fetchCategories}
                      className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-sm shadow-violet-200">
                      <RefreshCw size={14} /> Kategorileri Yükle
                    </button>
                  </div>
                )}

                {/* fetching */}
                {catStep === 'fetching' && (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                    <Loader2 size={32} className="animate-spin text-violet-500" />
                    <span className="text-sm">Paraşüt'ten kategoriler alınıyor...</span>
                  </div>
                )}

                {/* uploading */}
                {catStep === 'uploading' && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 size={32} className="animate-spin text-violet-500" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        Paraşüt güncelleniyor... {catProgress.done}/{catProgress.total}
                      </p>
                      {catProgress.errors > 0 && <p className="text-xs text-rose-500">{catProgress.errors} hata</p>}
                    </div>
                    <div className="w-64 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="h-2 bg-violet-500 rounded-full transition-all"
                        style={{ width: `${catProgress.total ? (catProgress.done / catProgress.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}

                {/* confirming */}
                {catStep === 'confirming' && confirmData && (
                  <div className="p-6 space-y-6">

                    {/* Silinecekler */}
                    {confirmData.deletes.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Trash2 size={12} /> Silinecek Kategoriler ({confirmData.deletes.length})
                        </h3>
                        <div className="rounded-xl border border-rose-100 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-rose-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-rose-400 font-semibold">Kategori Adı</th>
                                <th className="px-4 py-2 text-right text-rose-400 font-semibold">Bağlı Kayıt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {confirmData.deletes.map(d => (
                                <tr key={d.id} className="border-t border-rose-50">
                                  <td className="px-4 py-2 text-gray-700 line-through">{d.name}</td>
                                  <td className="px-4 py-2 text-right">
                                    {d.count === null
                                      ? <span className="text-gray-400 italic">kontrol ediliyor...</span>
                                      : d.count > 0
                                        ? <span className="text-rose-600 font-bold">{d.count} kayıt kategorisiz kalacak</span>
                                        : <span className="text-gray-400">0 kayıt</span>
                                    }
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {confirmData.deletes.some(d => (d.count ?? 0) > 0) && (
                          <p className="mt-2 text-xs text-rose-500 flex items-center gap-1">
                            ⚠️ Bağlı kayıtlar kategorisiz hale gelecek. Bu işlem geri alınamaz.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Yeniden adlandırılacaklar */}
                    {confirmData.renames.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">
                          Yeniden Adlandırılacaklar ({confirmData.renames.length})
                        </h3>
                        <div className="rounded-xl border border-violet-100 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-violet-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-violet-400 font-semibold">Mevcut Ad</th>
                                <th className="px-4 py-2 text-left text-violet-400 font-semibold">Yeni Ad</th>
                              </tr>
                            </thead>
                            <tbody>
                              {confirmData.renames.map(r => (
                                <tr key={r.id} className="border-t border-violet-50">
                                  <td className="px-4 py-2 text-gray-400">{r.oldName}</td>
                                  <td className="px-4 py-2 text-emerald-700 font-medium">{r.newName}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Oluşturulacak yeni kategoriler */}
                    {confirmData.creates.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                          Yeni Oluşturulacak Kategoriler — {confirmData.creates.length} M-kodu
                        </h3>
                        <p className="text-xs text-gray-400 mb-3">
                          Paraşüt'te henüz karşılığı olmayan M-kodları seçili operasyonlar için oluşturulacak.
                          Hangi operasyonlar için açılsın?
                        </p>
                        <div className="flex gap-3 mb-3">
                          {CAT_OPERATIONS.map(op => (
                            <label key={op.id} className="flex items-center gap-2 cursor-pointer select-none">
                              <input type="checkbox"
                                checked={confirmData.createOps.includes(op.id)}
                                onChange={e => setConfirmData(prev => prev ? {
                                  ...prev,
                                  createOps: e.target.checked
                                    ? [...prev.createOps, op.id]
                                    : prev.createOps.filter(x => x !== op.id),
                                } : prev)}
                                className="rounded accent-violet-600" />
                              <span className="text-xs font-medium text-gray-700">{op.id} — {op.label}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-emerald-600 font-medium">
                          Toplam {confirmData.creates.length * confirmData.createOps.length} yeni kategori oluşturulacak
                        </p>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                      <button onClick={() => { setConfirmData(null); setCatStep('ready'); }}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                        Geri Dön
                      </button>
                      <button onClick={executeUpload}
                        className="flex-1 px-5 py-2.5 rounded-xl text-sm font-bold bg-violet-600 text-white hover:brightness-110 transition-all shadow-sm shadow-violet-200">
                        Onayla ve Paraşüt'e Yükle
                      </button>
                    </div>
                  </div>
                )}

                {/* ready — hata raporu */}
                {catStep === 'ready' && uploadReport.length > 0 && (
                  <div className="mx-6 mt-5 mb-1 rounded-xl border border-rose-200 bg-rose-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-rose-100/60 border-b border-rose-200">
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                        <AlertCircle size={13} /> {uploadReport.length} işlem başarısız oldu
                      </span>
                      <button onClick={() => setUploadReport([])} className="text-rose-400 hover:text-rose-600 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-rose-100">
                          <th className="px-4 py-2 text-left text-rose-400 font-semibold">İşlem</th>
                          <th className="px-4 py-2 text-left text-rose-400 font-semibold">Kategori</th>
                          <th className="px-4 py-2 text-left text-rose-400 font-semibold">Hata</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadReport.map((e, i) => (
                          <tr key={i} className="border-t border-rose-100">
                            <td className="px-4 py-1.5 text-rose-500 font-medium whitespace-nowrap">{e.op}</td>
                            <td className="px-4 py-1.5 text-rose-700">{e.name}</td>
                            <td className="px-4 py-1.5 text-rose-400 text-[10px] max-w-xs truncate" title={e.detail}>{e.detail || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ready — main table */}
                {catStep === 'ready' && (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 z-10">
                      <tr className="border-b border-gray-100">
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Mevcut Paraşüt Adı</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left w-36">Operasyon</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left w-56">M-Kodu</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Yeni Ad</th>
                        <th className="px-3 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {catRows.map((row, i) => (
                        <tr key={row.id}
                          className={`border-b border-gray-50 transition-colors ${
                            row.toDelete ? 'bg-rose-50' : i % 2 === 0 ? '' : 'bg-gray-50/40'
                          }`}>
                          <td className="px-5 py-2 text-xs font-medium">
                            {row.toDelete
                              ? <span className="line-through text-rose-400">{row.name}</span>
                              : <span className="text-gray-700">{row.name}</span>
                            }
                            {row.toDelete && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-500">Silinecek</span>
                            )}
                          </td>
                          <td className="px-5 py-2">
                            <select
                              value={row.prefix}
                              disabled={row.toDelete}
                              onChange={e => updateRowPrefix(row.id, e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-violet-400 bg-white disabled:opacity-40">
                              {CAT_OPERATIONS.map(op => (
                                <option key={op.id} value={op.id}>{op.id} — {op.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-2 relative">
                            <input
                              value={openMcodeFor === row.id ? mcodeQuery : row.mcode}
                              disabled={row.toDelete}
                              placeholder="Ara: M489 veya 'personel'..."
                              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono outline-none focus:border-violet-400 bg-white disabled:opacity-40"
                              onFocus={() => { setOpenMcodeFor(row.id); setMcodeQuery(row.mcode); }}
                              onChange={e => setMcodeQuery(e.target.value)}
                              onBlur={() => {
                                const exact = allMcodes.find(m => m.code === mcodeQuery.trim().toUpperCase());
                                if (exact) updateRow(row.id, exact.code);
                                setTimeout(() => { if (!isCreatingMcodeRef.current) setOpenMcodeFor(null); }, 150);
                              }}
                            />
                            {openMcodeFor === row.id && (
                              <div className="absolute left-0 top-full mt-1 w-[460px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto">
                                {(() => {
                                  const q = mcodeQuery.toLowerCase();
                                  const matches = allMcodes.filter(m =>
                                    !q || m.code.toLowerCase().includes(q) || m.tr.toLowerCase().includes(q)
                                  ).slice(0, 15);
                                  const exactExists = allMcodes.some(m => m.code === mcodeQuery.trim().toUpperCase());
                                  const canCreate = mcodeQuery.trim().length >= 2 && !exactExists;
                                  return (
                                    <>
                                      {matches.length === 0 && !canCreate && (
                                        <div className="px-3 py-3 text-xs text-gray-400">Sonuç bulunamadı</div>
                                      )}
                                      {matches.map(m => (
                                        <button key={m.code} onMouseDown={() => { updateRow(row.id, m.code); setOpenMcodeFor(null); setMcodeQuery(''); }}
                                          className="w-full text-left px-3 py-2 hover:bg-violet-50 transition-colors border-b border-gray-50 last:border-0">
                                          <span className="text-[11px] text-gray-700 line-clamp-1 font-mono">{m.tr}</span>
                                        </button>
                                      ))}
                                      {canCreate && (
                                        <div className="border-t border-gray-100">
                                          {creatingMcodeFor === row.id ? (
                                                          <div className="p-2 bg-violet-50 flex flex-col gap-1">
                                              <div className="flex items-center gap-2">
                                                <span className="font-mono text-[11px] font-bold text-violet-600 flex-shrink-0">{mcodeQuery.trim().toUpperCase()}</span>
                                                <input
                                                  autoFocus
                                                  type="text"
                                                  placeholder="Kategori adı..."
                                                  value={newMcodeName}
                                                  onChange={e => { setNewMcodeName(e.target.value); setCreateMcodeError(''); }}
                                                  onKeyDown={e => { if (e.key === 'Enter') handleCreateMcode(row.id); if (e.key === 'Escape') { isCreatingMcodeRef.current = false; setCreatingMcodeFor(null); setNewMcodeName(''); setCreateMcodeError(''); } }}
                                                  className={`flex-1 text-xs border rounded-lg px-2 py-1 outline-none focus:ring-1 ${createMcodeError ? 'border-rose-300 focus:ring-rose-300' : 'border-violet-200 focus:ring-violet-400'}`}
                                                />
                                                <button onMouseDown={() => handleCreateMcode(row.id)} className="p-1 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                                                  <Check size={12} />
                                                </button>
                                                <button onMouseDown={() => { isCreatingMcodeRef.current = false; setCreatingMcodeFor(null); setNewMcodeName(''); setCreateMcodeError(''); }} className="p-1 text-gray-400 hover:text-gray-600">
                                                  <X size={12} />
                                                </button>
                                              </div>
                                              {createMcodeError && (
                                                <p className="text-[10px] text-rose-500 px-1">{createMcodeError}</p>
                                              )}
                                            </div>
                                          ) : (
                                            <button onMouseDown={() => { isCreatingMcodeRef.current = true; setCreatingMcodeFor(row.id); }}
                                              className="w-full text-left px-3 py-2.5 text-[11px] text-violet-600 hover:bg-violet-50 flex items-center gap-2 font-medium">
                                              <Plus size={11} />
                                              <span className="font-mono font-bold">{mcodeQuery.trim().toUpperCase()}</span>
                                              <span>yeni kod olarak ekle</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-2">
                            {!row.toDelete && (
                              <input
                                value={row.newName}
                                onChange={e => updateNewName(row.id, e.target.value)}
                                placeholder="Otomatik dolar..."
                                className={`w-full border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-violet-400 bg-white ${row.newName ? 'border-emerald-300 text-emerald-700 font-medium' : 'border-gray-200 text-gray-400'}`}
                              />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button onClick={() => toggleDelete(row.id)}
                              title={row.toDelete ? 'Silme işaretini kaldır' : 'Silinecek olarak işaretle'}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                row.toDelete
                                  ? 'bg-rose-100 text-rose-500 hover:bg-rose-200'
                                  : 'text-gray-300 hover:text-rose-500 hover:bg-rose-50'
                              }`}>
                              <Trash2 size={13} />
                            </button>
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
