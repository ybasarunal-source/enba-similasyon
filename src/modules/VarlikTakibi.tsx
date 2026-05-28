import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus, Pencil, Trash2, X, AlertCircle, TrendingDown,
  Landmark, Wallet, ToggleLeft, ToggleRight, Camera, ImageOff, Loader2,
} from 'lucide-react';
import {
  fixedAssetsAPI, assetDepositsAPI, assetPhotosAPI, assetExpendituresAPI,
  type FixedAsset, type AssetDeposit, type AssetOperation, type AssetTur,
  type DepositType, type DepositStatus, type AssetExpenditure, type ExpenditureType,
  assetBookValue, annualDepreciation, isSold, bookValueAtSale,
} from '../api/varlikTakibi';
import type { UserProfile } from '../api/supabase';
import type { DPlan } from './detailedplan/dpData';

interface VarlikTakibiProps {
  profile: UserProfile | null;
}

type Tab = 'assets' | 'deposits';
type Currency = 'TL' | 'EUR';
type OpFilter = 'all' | AssetOperation;
type SaleFilter = 'all' | 'active' | 'sold';

const OPS: { id: AssetOperation; label: string; color: string }[] = [
  { id: 'M', label: 'Merkez',      color: 'bg-blue-100 text-blue-700' },
  { id: 'K', label: 'Kömürcüler', color: 'bg-green-100 text-green-700' },
  { id: 'V', label: 'Varsak',      color: 'bg-purple-100 text-purple-700' },
];

const DEPOSIT_TYPES: { id: DepositType; label: string }[] = [
  { id: 'rent',        label: 'Kira' },
  { id: 'electricity', label: 'Elektrik' },
  { id: 'water',       label: 'Su' },
  { id: 'other',       label: 'Diğer' },
];

function fmt(n: number, currency: Currency): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + (currency === 'EUR' ? ' €' : ' ₺');
}

function toDisplay(tl: number, rate: number, currency: Currency): number {
  return currency === 'EUR' ? tl / Math.max(0.001, rate) : tl;
}

function opLabel(op: AssetOperation) {
  return OPS.find(o => o.id === op)?.label ?? op;
}
function opColor(op: AssetOperation) {
  return OPS.find(o => o.id === op)?.color ?? '';
}
function depositTypeLabel(t: DepositType) {
  return DEPOSIT_TYPES.find(d => d.id === t)?.label ?? t;
}

// ── Asset form ──────────────────────────────────────────────
type AssetForm = Omit<FixedAsset, 'id' | 'company_id' | 'created_at' | 'updated_at'>;
type DepositForm = Omit<AssetDeposit, 'id' | 'company_id' | 'created_at' | 'updated_at'>;

const TUR_OPTIONS: { id: AssetTur; label: string }[] = [
  { id: 'makina',   label: 'Makine / Ekipman' },
  { id: 'demirbas', label: 'Demirbaş' },
];

const emptyAsset = (): AssetForm => ({
  name: '', category: '', tur: 'makina', operation: 'M',
  purchase_date: new Date().toISOString().split('T')[0],
  purchase_amount_tl: 0, exchange_rate: 40, useful_life_years: 5,
  motor_kw: undefined, kapasite_ton_saat: undefined,
  sale_date: undefined, sale_amount_tl: undefined,
  notes: '',
});
const emptyDeposit = (): DepositForm => ({
  name: '', deposit_type: 'rent', operation: 'M',
  payment_date: new Date().toISOString().split('T')[0],
  amount_tl: 0, exchange_rate: 40,
  expected_return_date: null, status: 'active', notes: '',
});

// ── Reusable form field ──────────────────────────────────────
const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    {children}
    {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
  </div>
);

const inputCls = "w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/20 focus:border-[var(--enba-orange)]/40";
const selectCls = inputCls + " bg-white cursor-pointer";

// ── Summary card ─────────────────────────────────────────────
const SumCard: React.FC<{ label: string; value: string; sub?: string; icon: React.ReactNode; color: string }> = ({ label, value, sub, icon, color }) => (
  <div className={`rounded-2xl border p-4 flex items-center gap-4 ${color}`}>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/60 flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-[10px] font-black uppercase tracking-widest opacity-60 truncate">{label}</div>
      <div className="text-lg font-bold leading-tight">{value}</div>
      {sub && <div className="text-[11px] opacity-60">{sub}</div>}
    </div>
  </div>
);

// ── Main component ───────────────────────────────────────────
export const VarlikTakibi: React.FC<VarlikTakibiProps> = ({ profile }) => {
  const companyId = profile?.company_id ?? '';

  const [tab, setTab] = useState<Tab>('assets');
  const [currency, setCurrency] = useState<Currency>('TL');
  const [opFilter, setOpFilter] = useState<OpFilter>('all');
  const [saleFilter, setSaleFilter] = useState<SaleFilter>('active'); // varsayılan: satılmışlar gizli

  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [deposits, setDeposits] = useState<AssetDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [editingDeposit, setEditingDeposit] = useState<AssetDeposit | null>(null);
  const [assetForm, setAssetForm] = useState<AssetForm>(emptyAsset());
  const [depositForm, setDepositForm] = useState<DepositForm>(emptyDeposit());

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const [a, d] = await Promise.all([
        fixedAssetsAPI.getAll(companyId),
        assetDepositsAPI.getAll(companyId),
      ]);
      setAssets(a);
      setDeposits(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  // Hangi makine hangi planlarda kullanılıyor — localStorage'dan okur
  const assetPlanMap = useMemo<Record<string, string[]>>(() => {
    try {
      const raw = localStorage.getItem('enba_detailed_plans');
      if (!raw) return {};
      const plans: DPlan[] = JSON.parse(raw);
      const map: Record<string, string[]> = {};
      for (const plan of plans) {
        const planTitle = plan.title || plan.baslik || '—';
        for (const machine of plan.productionModel?.machines ?? []) {
          if (machine.assetId) {
            if (!map[machine.assetId]) map[machine.assetId] = [];
            if (!map[machine.assetId].includes(planTitle)) {
              map[machine.assetId].push(planTitle);
            }
          }
        }
      }
      return map;
    } catch {
      return {};
    }
  }, []);

  const openAddPanel = () => {
    setEditingAsset(null);
    setEditingDeposit(null);
    setAssetForm(emptyAsset());
    setDepositForm(emptyDeposit());
    setPanelOpen(true);
  };

  const openEditAsset = (a: FixedAsset) => {
    setEditingAsset(a);
    setEditingDeposit(null);
    setAssetForm({
      name: a.name, category: a.category, tur: a.tur, operation: a.operation,
      purchase_date: a.purchase_date, purchase_amount_tl: a.purchase_amount_tl,
      exchange_rate: a.exchange_rate, useful_life_years: a.useful_life_years,
      motor_kw: a.motor_kw, kapasite_ton_saat: a.kapasite_ton_saat,
      demirbas_no: a.demirbas_no,
      sale_date: a.sale_date, sale_amount_tl: a.sale_amount_tl,
      notes: a.notes,
    });
    setPanelOpen(true);
  };

  const openEditDeposit = (d: AssetDeposit) => {
    setEditingDeposit(d);
    setEditingAsset(null);
    setDepositForm({ name: d.name, deposit_type: d.deposit_type, operation: d.operation, payment_date: d.payment_date, amount_tl: d.amount_tl, exchange_rate: d.exchange_rate, expected_return_date: d.expected_return_date, status: d.status, notes: d.notes });
    setPanelOpen(true);
  };

  const closePanel = () => { setPanelOpen(false); setEditingAsset(null); setEditingDeposit(null); };

  const handleSaveAsset = async () => {
    if (!assetForm.name.trim()) return;
    setSaving(true);
    try {
      if (editingAsset) {
        await fixedAssetsAPI.update(editingAsset.id, assetForm);
        setAssets(prev => prev.map(a => a.id === editingAsset.id ? { ...a, ...assetForm } : a));
      } else {
        const created = await fixedAssetsAPI.add(companyId, assetForm);
        setAssets(prev => [created, ...prev]);
      }
      closePanel();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDeposit = async () => {
    if (!depositForm.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...depositForm, expected_return_date: depositForm.expected_return_date || null };
      if (editingDeposit) {
        await assetDepositsAPI.update(editingDeposit.id, payload);
        setDeposits(prev => prev.map(d => d.id === editingDeposit.id ? { ...d, ...payload } : d));
      } else {
        const created = await assetDepositsAPI.add(companyId, payload);
        setDeposits(prev => [created, ...prev]);
      }
      closePanel();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAsset = async (a: FixedAsset) => {
    if (!window.confirm(`"${a.name}" varlığını silmek istediğinizden emin misiniz?`)) return;
    try {
      await fixedAssetsAPI.remove(a.id);
      setAssets(prev => prev.filter(x => x.id !== a.id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteDeposit = async (d: AssetDeposit) => {
    if (!window.confirm(`"${d.name}" deposito kaydını silmek istediğinizden emin misiniz?`)) return;
    try {
      await assetDepositsAPI.remove(d.id);
      setDeposits(prev => prev.filter(x => x.id !== d.id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const toggleDepositStatus = async (d: AssetDeposit) => {
    const newStatus: DepositStatus = d.status === 'active' ? 'returned' : 'active';
    setDeposits(prev => prev.map(x => x.id === d.id ? { ...x, status: newStatus } : x));
    try {
      await assetDepositsAPI.update(d.id, { status: newStatus });
    } catch (e: any) {
      setDeposits(prev => prev.map(x => x.id === d.id ? { ...x, status: d.status } : x));
      setError(e.message);
    }
  };

  // Filtered lists
  const opFiltered  = opFilter === 'all' ? assets : assets.filter(a => a.operation === opFilter);
  const filteredAssets = saleFilter === 'all'    ? opFiltered
                       : saleFilter === 'active' ? opFiltered.filter(a => !isSold(a))
                       :                           opFiltered.filter(a =>  isSold(a));
  const filteredDeposits = opFilter === 'all' ? deposits : deposits.filter(d => d.operation === opFilter);

  // Summary: aktif (satılmamış) varlıklar
  const activeAssets = opFiltered.filter(a => !isSold(a));
  const soldAssets   = opFiltered.filter(a =>  isSold(a));
  const totalPurchase   = activeAssets.reduce((s, a) => s + toDisplay(a.purchase_amount_tl, a.exchange_rate, currency), 0);
  const totalBook       = activeAssets.reduce((s, a) => s + toDisplay(assetBookValue(a), a.exchange_rate, currency), 0);
  const totalAnnualDep  = activeAssets.reduce((s, a) => s + toDisplay(annualDepreciation(a), a.exchange_rate, currency), 0);
  const totalSaleProceeds = soldAssets.reduce((s, a) => s + toDisplay(a.sale_amount_tl ?? 0, a.exchange_rate, currency), 0);

  // Summary: deposits
  const activeDeposits = filteredDeposits.filter(d => d.status === 'active');
  const returnedDeposits = filteredDeposits.filter(d => d.status === 'returned');
  const totalActive = activeDeposits.reduce((s, d) => s + toDisplay(d.amount_tl, d.exchange_rate, currency), 0);
  const totalReturned = returnedDeposits.reduce((s, d) => s + toDisplay(d.amount_tl, d.exchange_rate, currency), 0);
  const totalDeposits = filteredDeposits.reduce((s, d) => s + toDisplay(d.amount_tl, d.exchange_rate, currency), 0);

  if (!companyId) {
    return <div className="p-8 text-center text-gray-500">Şirket bilgisi yüklenemedi.</div>;
  }

  // ── Panel determines which form to show ─────────────────
  const showingAssetForm = panelOpen && (tab === 'assets' || editingAsset !== null) && editingDeposit === null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Main content ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-gray-900">Varlık Takibi</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {/* TL / EUR toggle */}
            <div className="flex bg-gray-100 rounded-xl p-0.5 text-sm font-semibold">
              {(['TL', 'EUR'] as Currency[]).map(c => (
                <button key={c} onClick={() => setCurrency(c)} className={`px-3 py-1.5 rounded-[10px] transition-all ${currency === c ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{c}</button>
              ))}
            </div>
            {/* Satış durumu filtresi */}
            <div className="flex bg-gray-100 rounded-xl p-0.5 text-sm font-semibold">
              {([['all','Tümü'],['active','Aktif'],['sold','Satıldı']] as [SaleFilter,string][]).map(([v,l]) => (
                <button key={v} onClick={() => setSaleFilter(v)} className={`px-3 py-1.5 rounded-[10px] transition-all ${saleFilter === v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{l}</button>
              ))}
            </div>
            {/* Op filter */}
            <div className="flex bg-gray-100 rounded-xl p-0.5 text-sm font-semibold">
              <button onClick={() => setOpFilter('all')} className={`px-3 py-1.5 rounded-[10px] transition-all ${opFilter === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Tümü</button>
              {OPS.map(o => (
                <button key={o.id} onClick={() => setOpFilter(o.id)} className={`px-3 py-1.5 rounded-[10px] transition-all ${opFilter === o.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{o.id}</button>
              ))}
            </div>
            <button onClick={openAddPanel} className="flex items-center gap-2 px-4 py-2 bg-[var(--enba-orange)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
              <Plus size={14} />
              Ekle
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
          <button onClick={() => setTab('assets')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'assets' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <Landmark size={15} /> Sabit Varlıklar
          </button>
          <button onClick={() => setTab('deposits')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'deposits' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <Wallet size={15} /> Depozitolar
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-2 border-[var(--enba-orange)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'assets' ? (
          <>
            {/* Asset summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SumCard label="Aktif Alış Değeri" value={fmt(totalPurchase, currency)} sub={`${activeAssets.length} aktif varlık`} icon={<Landmark size={18} className="text-blue-600" />} color="bg-blue-50 border-blue-100 text-blue-900" />
              <SumCard label="Net Defter Değeri" value={fmt(totalBook, currency)} sub={`${Math.round(totalBook / Math.max(1, totalPurchase) * 100)}% orijinal değerde`} icon={<TrendingDown size={18} className="text-amber-600" />} color="bg-amber-50 border-amber-100 text-amber-900" />
              <SumCard label="Yıllık Amortisman" value={fmt(totalAnnualDep, currency)} sub="Aktif varlıklar" icon={<TrendingDown size={18} className="text-slate-600" />} color="bg-slate-50 border-slate-100 text-slate-900" />
              <SumCard label="Satış Gelirleri" value={fmt(totalSaleProceeds, currency)} sub={`${soldAssets.length} satılan varlık`} icon={<TrendingDown size={18} className="text-green-600" />} color="bg-green-50 border-green-100 text-green-900" />
            </div>

            {/* Asset table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-[1fr_90px_56px_100px_110px_130px_110px_80px] border-b border-gray-100 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                {['Varlık Adı', 'Kategori', 'Op.', 'Alış Tarihi', `Alış Değeri (${currency})`, 'Durum / Satış', `Yıl. Amor. (${currency})`, ''].map((h, i) => (
                  <div key={i} className={`px-3 py-2.5 ${i >= 4 ? 'text-right' : ''}`}>{h}</div>
                ))}
              </div>
              <div className="divide-y divide-gray-50">
                {filteredAssets.length === 0 && (
                  <div className="text-center text-sm text-gray-400 py-12">Bu filtrede varlık yok.</div>
                )}
                {filteredAssets.map(a => {
                  const sold = isSold(a);
                  const bv   = assetBookValue(a);
                  const dep  = annualDepreciation(a);
                  const pct  = sold ? 0 : Math.round(bv / Math.max(1, a.purchase_amount_tl) * 100);
                  const bvAtSale = sold ? bookValueAtSale(a) : null;
                  const gain     = (sold && a.sale_amount_tl != null && bvAtSale != null) ? a.sale_amount_tl - bvAtSale : null;
                  return (
                    <div key={a.id} className={`grid grid-cols-[1fr_90px_56px_100px_110px_130px_110px_80px] items-center hover:bg-gray-50/50 transition-colors ${sold ? 'opacity-60' : ''}`}>
                      <div className="px-3 py-3 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold text-gray-800 truncate min-w-0">{a.name}</span>
                          {a.demirbas_no && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 flex-shrink-0">
                              #{a.demirbas_no}
                            </span>
                          )}
                        </div>
                        {(a.motor_kw != null || a.kapasite_ton_saat != null) && (
                          <div className="flex items-center gap-2 mt-0.5">
                            {a.motor_kw != null && <span className="text-[11px] text-gray-500">{a.motor_kw} kW</span>}
                            {a.motor_kw != null && a.kapasite_ton_saat != null && <span className="text-[11px] text-gray-300">·</span>}
                            {a.kapasite_ton_saat != null && <span className="text-[11px] text-gray-500">{a.kapasite_ton_saat} ton/sa</span>}
                          </div>
                        )}
                        {a.notes && <div className="text-[11px] text-gray-400 truncate">{a.notes}</div>}
                        {(assetPlanMap[a.id] ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assetPlanMap[a.id].map(planName => (
                              <span key={planName} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                                📋 {planName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-3 text-xs text-gray-500 truncate">{a.category || '—'}</div>
                      <div className="px-3 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opColor(a.operation)}`}>{a.operation}</span>
                      </div>
                      <div className="px-3 py-3 text-xs text-gray-600">{a.purchase_date}</div>
                      <div className="px-3 py-3 text-right text-sm font-medium text-gray-800">{fmt(toDisplay(a.purchase_amount_tl, a.exchange_rate, currency), currency)}</div>
                      {/* Durum / Satış kolonu */}
                      <div className="px-3 py-3 text-right">
                        {sold ? (
                          <div>
                            <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 mb-1">SATILDI</span>
                            {a.sale_date && <div className="text-[11px] text-gray-500">{a.sale_date}</div>}
                            {a.sale_amount_tl != null && (
                              <div className="text-[12px] font-semibold text-gray-700">{fmt(toDisplay(a.sale_amount_tl, a.exchange_rate, currency), currency)}</div>
                            )}
                            {gain != null && (
                              <div className={`text-[10px] font-semibold ${gain >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {gain >= 0 ? '+' : ''}{fmt(toDisplay(gain, a.exchange_rate, currency), currency)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm font-medium text-gray-800">{fmt(toDisplay(bv, a.exchange_rate, currency), currency)}</div>
                            <div className={`text-[10px] font-semibold ${pct < 20 ? 'text-red-500' : pct < 50 ? 'text-amber-500' : 'text-green-600'}`}>{pct}% defter</div>
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-3 text-right text-sm text-gray-600">
                        {sold ? <span className="text-gray-400">—</span> : fmt(toDisplay(dep, a.exchange_rate, currency), currency)}
                      </div>
                      <div className="px-3 py-3 flex items-center justify-end gap-1">
                        <button onClick={() => openEditAsset(a)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"><Pencil size={13} /></button>
                        <button onClick={() => handleDeleteAsset(a)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredAssets.length > 0 && (
                <div className="grid grid-cols-[1fr_90px_56px_100px_110px_130px_110px_80px] border-t border-gray-200 bg-gray-50 text-sm font-bold text-gray-700">
                  <div className="px-3 py-3 col-span-4">Toplam (aktif)</div>
                  <div className="px-3 py-3 text-right">{fmt(totalPurchase, currency)}</div>
                  <div className="px-3 py-3 text-right text-xs text-gray-500 font-normal">{fmt(totalBook, currency)} defter</div>
                  <div className="px-3 py-3 text-right">{fmt(totalAnnualDep, currency)}</div>
                  <div />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Deposit summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SumCard label="Aktif Depozitolar" value={fmt(totalActive, currency)} sub={`${activeDeposits.length} kayıt`} icon={<Wallet size={18} className="text-green-600" />} color="bg-green-50 border-green-100 text-green-900" />
              <SumCard label="İade Edildi" value={fmt(totalReturned, currency)} sub={`${returnedDeposits.length} kayıt`} icon={<Wallet size={18} className="text-gray-500" />} color="bg-gray-50 border-gray-200 text-gray-700" />
              <SumCard label="Toplam Depozito" value={fmt(totalDeposits, currency)} sub={`${filteredDeposits.length} kayıt`} icon={<Wallet size={18} className="text-blue-600" />} color="bg-blue-50 border-blue-100 text-blue-900" />
            </div>

            {/* Deposit table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-[1fr_90px_56px_100px_120px_110px_100px_80px] border-b border-gray-100 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                {['Açıklama', 'Tür', 'Op.', 'Ödeme Tarihi', `Tutar (${currency})`, 'Tahmini İade', 'Durum', ''].map((h, i) => (
                  <div key={i} className={`px-3 py-2.5 ${i === 4 ? 'text-right' : ''}`}>{h}</div>
                ))}
              </div>
              <div className="divide-y divide-gray-50">
                {filteredDeposits.length === 0 && (
                  <div className="text-center text-sm text-gray-400 py-12">Henüz depozito kaydı eklenmemiş.</div>
                )}
                {filteredDeposits.map(d => (
                  <div key={d.id} className={`grid grid-cols-[1fr_90px_56px_100px_120px_110px_100px_80px] items-center hover:bg-gray-50/50 transition-colors ${d.status === 'returned' ? 'opacity-50' : ''}`}>
                    <div className="px-3 py-3">
                      <div className="text-sm font-semibold text-gray-800 truncate">{d.name}</div>
                      {d.notes && <div className="text-[11px] text-gray-400 truncate">{d.notes}</div>}
                    </div>
                    <div className="px-3 py-3 text-xs text-gray-600">{depositTypeLabel(d.deposit_type)}</div>
                    <div className="px-3 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opColor(d.operation)}`}>{d.operation}</span>
                    </div>
                    <div className="px-3 py-3 text-xs text-gray-600">{d.payment_date}</div>
                    <div className="px-3 py-3 text-right text-sm font-medium text-gray-800">{fmt(toDisplay(d.amount_tl, d.exchange_rate, currency), currency)}</div>
                    <div className="px-3 py-3 text-xs text-gray-500">{d.expected_return_date || '—'}</div>
                    <div className="px-3 py-3">
                      <button onClick={() => toggleDepositStatus(d)} className="flex items-center gap-1.5 transition-all">
                        {d.status === 'active'
                          ? <><ToggleRight size={18} className="text-green-500" /><span className="text-[11px] font-semibold text-green-600">Aktif</span></>
                          : <><ToggleLeft size={18} className="text-gray-400" /><span className="text-[11px] font-semibold text-gray-400">İade</span></>
                        }
                      </button>
                    </div>
                    <div className="px-3 py-3 flex items-center justify-end gap-1">
                      <button onClick={() => openEditDeposit(d)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"><Pencil size={13} /></button>
                      <button onClick={() => handleDeleteDeposit(d)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
              {filteredDeposits.length > 0 && (
                <div className="grid grid-cols-[1fr_90px_56px_100px_120px_110px_100px_80px] border-t border-gray-200 bg-gray-50 text-sm font-bold text-gray-700">
                  <div className="px-3 py-3 col-span-4">Toplam</div>
                  <div className="px-3 py-3 text-right">{fmt(totalDeposits, currency)}</div>
                  <div className="col-span-3" />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Right panel ───────────────────────────────────── */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={closePanel} />
          <div className="fixed right-0 top-0 h-full z-50 w-[420px] bg-white shadow-2xl overflow-y-auto flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-base font-bold text-gray-900">
                {showingAssetForm
                  ? (editingAsset ? 'Varlık Düzenle' : 'Yeni Sabit Varlık')
                  : (editingDeposit ? 'Depozito Düzenle' : 'Yeni Depozito')}
              </h2>
              <button onClick={closePanel} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"><X size={16} /></button>
            </div>

            {/* Form */}
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              {showingAssetForm ? (
                <>
                  <Field label="Varlık Adı *">
                    <input className={inputCls} value={assetForm.name} onChange={e => setAssetForm(p => ({ ...p, name: e.target.value }))} placeholder="Ör: Forklift, Baskı Makinesi..." />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tür">
                      <select className={selectCls} value={assetForm.tur} onChange={e => setAssetForm(p => ({ ...p, tur: e.target.value as AssetTur }))}>
                        {TUR_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Demirbaş No" hint="Ör: MK-001, DM-042">
                      <input className={inputCls} value={assetForm.demirbas_no ?? ''} onChange={e => setAssetForm(p => ({ ...p, demirbas_no: e.target.value || undefined }))} placeholder="MK-001" />
                    </Field>
                  </div>
                  <Field label="Kategori">
                    <input className={inputCls} value={assetForm.category} onChange={e => setAssetForm(p => ({ ...p, category: e.target.value }))} placeholder="Ör: Üretim Makinesi, Taşıt, Bilgisayar..." />
                  </Field>
                  <Field label="Operasyon">
                    <select className={selectCls} value={assetForm.operation} onChange={e => setAssetForm(p => ({ ...p, operation: e.target.value as AssetOperation }))}>
                      {OPS.map(o => <option key={o.id} value={o.id}>{o.id} — {o.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Alış Tarihi">
                    <input type="date" className={inputCls} value={assetForm.purchase_date} onChange={e => setAssetForm(p => ({ ...p, purchase_date: e.target.value }))} />
                  </Field>
                  <Field label="Alış Tutarı (₺)">
                    <input type="number" min="0" className={inputCls} value={assetForm.purchase_amount_tl || ''} onChange={e => setAssetForm(p => ({ ...p, purchase_amount_tl: parseFloat(e.target.value) || 0 }))} placeholder="0" />
                  </Field>
                  <Field label="Kur (₺/€)" hint={`EUR değeri: ${assetForm.exchange_rate > 0 ? (assetForm.purchase_amount_tl / assetForm.exchange_rate).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : '—'} €`}>
                    <input type="number" min="0" step="0.01" className={inputCls} value={assetForm.exchange_rate || ''} onChange={e => setAssetForm(p => ({ ...p, exchange_rate: parseFloat(e.target.value) || 1 }))} placeholder="40" />
                  </Field>
                  <Field label="Kullanım Ömrü (Yıl)">
                    <input type="number" min="1" max="50" className={inputCls} value={assetForm.useful_life_years || ''} onChange={e => setAssetForm(p => ({ ...p, useful_life_years: parseInt(e.target.value) || 1 }))} placeholder="5" />
                  </Field>
                  <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                    <div className="flex justify-between text-gray-600"><span>Yıllık Amortisman:</span><span className="font-semibold">{(assetForm.purchase_amount_tl / Math.max(1, assetForm.useful_life_years)).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</span></div>
                    <div className="flex justify-between text-gray-400 text-xs"><span>Aylık:</span><span>{(assetForm.purchase_amount_tl / Math.max(1, assetForm.useful_life_years) / 12).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</span></div>
                  </div>
                  {assetForm.tur === 'makina' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Motor Gücü (kW)">
                        <input type="number" min="0" step="0.1" className={inputCls} value={assetForm.motor_kw ?? ''} onChange={e => setAssetForm(p => ({ ...p, motor_kw: e.target.value === '' ? undefined : parseFloat(e.target.value) }))} placeholder="Ör: 75" />
                      </Field>
                      <Field label="Kapasite (ton/sa)">
                        <input type="number" min="0" step="0.01" className={inputCls} value={assetForm.kapasite_ton_saat ?? ''} onChange={e => setAssetForm(p => ({ ...p, kapasite_ton_saat: e.target.value === '' ? undefined : parseFloat(e.target.value) }))} placeholder="Ör: 1.5" />
                      </Field>
                    </div>
                  )}
                  <Field label="Notlar">
                    <textarea className={inputCls + ' resize-none'} rows={2} value={assetForm.notes} onChange={e => setAssetForm(p => ({ ...p, notes: e.target.value }))} placeholder="İsteğe bağlı..." />
                  </Field>

                  {/* Satış Bilgisi */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Satış Bilgisi (Opsiyonel)</div>
                    <p className="text-[11px] text-gray-400 mb-3">Satıldıysa doldurun. Boş bırakılırsa varlık aktif sayılır.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Satış Tarihi">
                        <input
                          type="date"
                          className={inputCls}
                          value={assetForm.sale_date ?? ''}
                          onChange={e => setAssetForm(p => ({ ...p, sale_date: e.target.value || undefined }))}
                        />
                      </Field>
                      <Field label="Satış Bedeli (₺)">
                        <input
                          type="number" min="0"
                          className={inputCls}
                          value={assetForm.sale_amount_tl ?? ''}
                          onChange={e => setAssetForm(p => ({ ...p, sale_amount_tl: e.target.value === '' ? undefined : parseFloat(e.target.value) }))}
                          placeholder="0"
                        />
                      </Field>
                    </div>
                    {assetForm.sale_date && assetForm.sale_amount_tl != null && assetForm.purchase_amount_tl > 0 && (
                      <div className="mt-2 bg-gray-50 rounded-xl p-3 text-xs space-y-1">
                        <div className="flex justify-between text-gray-600">
                          <span>Satış anı defter değeri (tahmini):</span>
                          <span className="font-semibold">
                            {Math.max(0,
                              assetForm.purchase_amount_tl - (assetForm.purchase_amount_tl / Math.max(1, assetForm.useful_life_years)) *
                              Math.max(0, (new Date(assetForm.sale_date).getTime() - new Date(assetForm.purchase_date).getTime()) / (365.25 * 24 * 3600 * 1000))
                            ).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Kazanç / Kayıp:</span>
                          <span className={
                            assetForm.sale_amount_tl > assetForm.purchase_amount_tl * 0.5 ? 'text-green-600' : 'text-red-500'
                          }>
                            {(assetForm.sale_amount_tl - Math.max(0,
                              assetForm.purchase_amount_tl - (assetForm.purchase_amount_tl / Math.max(1, assetForm.useful_life_years)) *
                              Math.max(0, (new Date(assetForm.sale_date).getTime() - new Date(assetForm.purchase_date).getTime()) / (365.25 * 24 * 3600 * 1000))
                            )) >= 0 ? '+' : ''}
                            {(assetForm.sale_amount_tl - Math.max(0,
                              assetForm.purchase_amount_tl - (assetForm.purchase_amount_tl / Math.max(1, assetForm.useful_life_years)) *
                              Math.max(0, (new Date(assetForm.sale_date).getTime() - new Date(assetForm.purchase_date).getTime()) / (365.25 * 24 * 3600 * 1000))
                            )).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fotoğraflar & Harcamalar — sadece mevcut varlıklar için */}
                  {editingAsset && (
                    <>
                      <AssetPhotoSection
                        asset={editingAsset}
                        companyId={companyId}
                        onPhotosChange={(photos) => setAssets(prev =>
                          prev.map(a => a.id === editingAsset.id ? { ...a, photos } : a)
                        )}
                      />
                      <AssetExpenditureSection
                        asset={editingAsset}
                        companyId={companyId}
                      />
                    </>
                  )}
                </>
              ) : (
                <>
                  <Field label="Açıklama *">
                    <input className={inputCls} value={depositForm.name} onChange={e => setDepositForm(p => ({ ...p, name: e.target.value }))} placeholder="Ör: Kömürcüler depo elektrik depozitosu..." />
                  </Field>
                  <Field label="Tür">
                    <select className={selectCls} value={depositForm.deposit_type} onChange={e => setDepositForm(p => ({ ...p, deposit_type: e.target.value as DepositType }))}>
                      {DEPOSIT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Operasyon">
                    <select className={selectCls} value={depositForm.operation} onChange={e => setDepositForm(p => ({ ...p, operation: e.target.value as AssetOperation }))}>
                      {OPS.map(o => <option key={o.id} value={o.id}>{o.id} — {o.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Ödeme Tarihi">
                    <input type="date" className={inputCls} value={depositForm.payment_date} onChange={e => setDepositForm(p => ({ ...p, payment_date: e.target.value }))} />
                  </Field>
                  <Field label="Tutar (₺)">
                    <input type="number" min="0" className={inputCls} value={depositForm.amount_tl || ''} onChange={e => setDepositForm(p => ({ ...p, amount_tl: parseFloat(e.target.value) || 0 }))} placeholder="0" />
                  </Field>
                  <Field label="Kur (₺/€)" hint={`EUR değeri: ${depositForm.exchange_rate > 0 ? (depositForm.amount_tl / depositForm.exchange_rate).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : '—'} €`}>
                    <input type="number" min="0" step="0.01" className={inputCls} value={depositForm.exchange_rate || ''} onChange={e => setDepositForm(p => ({ ...p, exchange_rate: parseFloat(e.target.value) || 1 }))} placeholder="40" />
                  </Field>
                  <Field label="Tahmini İade Tarihi">
                    <input type="date" className={inputCls} value={depositForm.expected_return_date ?? ''} onChange={e => setDepositForm(p => ({ ...p, expected_return_date: e.target.value || null }))} />
                  </Field>
                  <Field label="Durum">
                    <select className={selectCls} value={depositForm.status} onChange={e => setDepositForm(p => ({ ...p, status: e.target.value as DepositStatus }))}>
                      <option value="active">Aktif</option>
                      <option value="returned">İade Edildi</option>
                    </select>
                  </Field>
                  <Field label="Notlar">
                    <textarea className={inputCls + ' resize-none'} rows={2} value={depositForm.notes} onChange={e => setDepositForm(p => ({ ...p, notes: e.target.value }))} placeholder="İsteğe bağlı..." />
                  </Field>
                </>
              )}
            </div>

            {/* Panel footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
              <button
                onClick={showingAssetForm ? handleSaveAsset : handleSaveDeposit}
                disabled={saving || (showingAssetForm ? !assetForm.name.trim() : !depositForm.name.trim())}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--enba-orange)] text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                Kaydet
              </button>
              <button onClick={closePanel} className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-all">
                İptal
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── AssetPhotoSection ─────────────────────────────────────────
function AssetPhotoSection({
  asset, companyId, onPhotosChange,
}: {
  asset: FixedAsset;
  companyId: string;
  onPhotosChange: (photos: string[]) => void;
}) {
  const [photos, setPhotos] = useState<string[]>(asset.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErr('Yalnızca JPG, PNG veya WEBP yükleyebilirsiniz.'); return;
    }
    if (file.size > 5 * 1024 * 1024) { setErr('Maksimum dosya boyutu 5 MB.'); return; }
    setUploading(true); setErr(null);
    try {
      const path = await assetPhotosAPI.upload(asset.id, companyId, file);
      const next = [...photos, path];
      setPhotos(next);
      onPhotosChange(next);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Yükleme başarısız.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (path: string) => {
    if (!window.confirm('Bu fotoğrafı silmek istiyor musunuz?')) return;
    try {
      const next = await assetPhotosAPI.remove(asset.id, photos, path);
      setPhotos(next);
      onPhotosChange(next);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Silme başarısız.');
    }
  };

  return (
    <div className="border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">Fotoğraflar</div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--enba-orange)] hover:opacity-80 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
          {uploading ? 'Yükleniyor...' : 'Fotoğraf Ekle'}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
      </div>

      {err && (
        <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2 flex items-center gap-2">
          <AlertCircle size={12} />{err}
          <button onClick={() => setErr(null)} className="ml-auto"><X size={11} /></button>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-6 border border-dashed border-gray-200 rounded-xl text-gray-400">
          <ImageOff size={16} />
          <span className="text-[12px]">Henüz fotoğraf yok</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(path => (
            <div key={path} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
              <img
                src={assetPhotosAPI.getUrl(path)}
                alt=""
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = ''; }}
              />
              <button
                onClick={() => handleDelete(path)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Trash2 size={16} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AssetExpenditureSection ───────────────────────────────────
const EXP_TYPE_LABELS: Record<ExpenditureType, string> = {
  kapex: 'Yatırım',  // Maliyete eklenir (kuruluş, güçlendirme, ilave malzeme)
  bakim: 'Bakım',    // Gider (periyodik bakım, küçük onarım)
};
const EXP_TYPE_COLORS: Record<ExpenditureType, string> = {
  kapex: 'bg-blue-50 text-blue-700 border-blue-200',
  bakim: 'bg-amber-50 text-amber-700 border-amber-200',
};

function AssetExpenditureSection({
  asset, companyId,
}: {
  asset: FixedAsset;
  companyId: string;
}) {
  const [items, setItems] = useState<AssetExpenditure[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<{ tarih: string; tutar: string; aciklama: string; tur: ExpenditureType }>({
    tarih: new Date().toISOString().split('T')[0],
    tutar: '', aciklama: '', tur: 'kapex',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    assetExpendituresAPI.getAll(companyId, asset.id)
      .then(setItems)
      .catch(e => setErr(e instanceof Error ? e.message : 'Yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [companyId, asset.id]);

  const totalKapex = items.filter(i => i.tur === 'kapex').reduce((s, i) => s + i.tutar, 0);
  const totalBakim = items.filter(i => i.tur === 'bakim').reduce((s, i) => s + i.tutar, 0);

  const handleAdd = async () => {
    if (!form.aciklama.trim() || !form.tutar) return;
    setSaving(true); setErr(null);
    try {
      const created = await assetExpendituresAPI.add(companyId, asset.id, {
        tarih: form.tarih,
        tutar: parseFloat(form.tutar) || 0,
        aciklama: form.aciklama.trim(),
        tur: form.tur,
      });
      setItems(prev => [created, ...prev]);
      setForm(f => ({ ...f, tutar: '', aciklama: '' }));
      setAddOpen(false);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Kayıt başarısız.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu harcama kaydı silinecek. Emin misiniz?')) return;
    try {
      await assetExpendituresAPI.remove(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Silme başarısız.');
    }
  };

  return (
    <div className="border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">Harcamalar</div>
        <button
          type="button"
          onClick={() => setAddOpen(o => !o)}
          className="flex items-center gap-1 text-[11px] font-semibold text-[var(--enba-orange)] hover:opacity-80"
        >
          <Plus size={12} />Ekle
        </button>
      </div>

      {/* Özet */}
      {items.length > 0 && (
        <div className="flex gap-2 mb-2">
          <span className="text-[10px] px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-semibold">
            Yatırım: {totalKapex.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
          </span>
          <span className="text-[10px] px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 font-semibold">
            Bakım: {totalBakim.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
          </span>
        </div>
      )}

      {err && <div className="text-[11px] text-red-600 mb-2">{err}</div>}

      {/* Yeni kayıt formu */}
      {addOpen && (
        <div className="bg-gray-50 rounded-xl p-3 mb-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Tarih</label>
              <input type="date" className={inputCls} value={form.tarih} onChange={e => setForm(f => ({ ...f, tarih: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Tür</label>
              <select className={selectCls} value={form.tur} onChange={e => setForm(f => ({ ...f, tur: e.target.value as ExpenditureType }))}>
                <option value="kapex">Yatırım Harcaması</option>
                <option value="bakim">Bakım / Onarım</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Açıklama *</label>
            <input className={inputCls} value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))} placeholder="Ör: Motor değişimi, yağ bakımı..." />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Tutar (₺) *</label>
            <input type="number" min="0" className={inputCls} value={form.tutar} onChange={e => setForm(f => ({ ...f, tutar: e.target.value }))} placeholder="0" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={saving || !form.aciklama.trim() || !form.tutar}
              className="flex-1 py-1.5 bg-[var(--enba-orange)] text-white rounded-lg text-xs font-semibold disabled:opacity-50">
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={() => setAddOpen(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg">İptal</button>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="py-3 text-center"><Loader2 size={14} className="animate-spin text-gray-400 mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="py-4 text-center text-[11px] text-gray-400">Henüz harcama kaydı yok.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2 py-2 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${EXP_TYPE_COLORS[item.tur]}`}>
                    {EXP_TYPE_LABELS[item.tur]}
                  </span>
                  <span className="text-[11px] text-gray-500">{item.tarih}</span>
                </div>
                <div className="text-[12px] text-gray-700 truncate mt-0.5">{item.aciklama}</div>
              </div>
              <div className="text-[13px] font-semibold text-gray-800 flex-shrink-0">
                {item.tutar.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
              </div>
              <button onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 rounded transition-all flex-shrink-0">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
        <strong>Yatırım:</strong> kuruluş, güçlendirme, ilave ekipman — demirbaş maliyetine işlenir.<br/>
        <strong>Bakım:</strong> periyodik bakım, onarım — işletme gideri olarak takip edilir.
      </p>
    </div>
  );
}
