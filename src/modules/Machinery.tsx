import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Plus, Pencil, Trash2, X, Wrench, Factory, Armchair,
  FileSpreadsheet, FileDown, Calendar, AlertCircle, Zap, Gauge,
} from 'lucide-react';
import { fmt } from '../utils/formatters';
import { assetsAPI, maintenanceAPI, type SupabaseAsset, type SupabaseMaintenanceRecord } from '../api/supabase';

// ── Tipler & sabitler ─────────────────────────────────────────
type Tab = 'machines' | 'fixtures' | 'maintenance';

const OPS = [
  { id: 'M', label: 'Merkez',      color: 'bg-blue-100 text-blue-700' },
  { id: 'K', label: 'Kömürcüler', color: 'bg-green-100 text-green-700' },
  { id: 'V', label: 'Varsak',      color: 'bg-purple-100 text-purple-700' },
];
function opColor(op?: string) {
  return OPS.find(o => o.id === op)?.color ?? 'bg-gray-100 text-gray-500';
}

// ── Yardımcı bileşenler ───────────────────────────────────────
const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/20 focus:border-[var(--enba-orange)]/40 bg-white';
const selectCls = inputCls + ' cursor-pointer';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const KpiCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className={`rounded-2xl border p-4 flex items-center gap-3 ${color}`}>
    <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">{icon}</div>
    <div className="min-w-0">
      <div className="text-[10px] font-black uppercase tracking-widest opacity-60 truncate">{label}</div>
      <div className="text-base font-bold leading-tight">{value}</div>
    </div>
  </div>
);

const MAINT_TYPES = ['Bakım', 'Arıza', 'Revizyon', 'Yağlama', 'Kalibrasyon', 'Diğer'];

// ── Ana bileşen ───────────────────────────────────────────────
export const Machinery: React.FC = () => {
  const [tab, setTab]         = useState<Tab>('machines');
  const [assets, setAssets]   = useState<SupabaseAsset[]>([]);
  const [maint,  setMaint]    = useState<SupabaseMaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Panel state
  const [panelOpen,    setPanelOpen]    = useState(false);
  const [panelMode,    setPanelMode]    = useState<'asset' | 'maintenance'>('asset');
  const [editingAsset, setEditingAsset] = useState<SupabaseAsset | null>(null);
  const [saving,       setSaving]       = useState(false);

  // Asset form
  const emptyAsset = (): Partial<SupabaseAsset> => ({
    adi: '', marka: '', motor_gucu: undefined, yatirim_bedeli: 0,
    satinalma_tarihi: new Date().toISOString().slice(0, 10),
    kategori: 'Üretim Makinesi', kapasite: undefined, tur: 'makina',
    operation: 'K', notes: '',
  });
  const [assetForm, setAssetForm] = useState<Partial<SupabaseAsset>>(emptyAsset());

  // Maintenance form
  const emptyMaint = (): Partial<SupabaseMaintenanceRecord> => ({
    tarih: new Date().toISOString().slice(0, 10),
    varlik_id: '', varlik_adi: '', varlik_turu: 'makina',
    tur: 'Bakım', aciklama: '', maliyet: 0,
  });
  const [maintForm, setMaintForm] = useState<Partial<SupabaseMaintenanceRecord>>(emptyMaint());

  // ── Yükleme ─────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, m] = await Promise.all([assetsAPI.getAll(), maintenanceAPI.getAll()]);

      // localStorage migration (eski format)
      const mStr = localStorage.getItem('enba_makinalar_v2');
      const dStr = localStorage.getItem('enba_demirbaslar');
      const kStr = localStorage.getItem('enba_bakim_kayitlari');
      if ((mStr || dStr || kStr) && a.length === 0 && m.length === 0) {
        const ms = mStr ? JSON.parse(mStr) : [];
        const ds = dStr ? JSON.parse(dStr) : [];
        const ks = kStr ? JSON.parse(kStr) : [];
        for (const x of ms) await assetsAPI.insert({ adi: x.adi, marka: x.marka, motor_gucu: x.motorGucu, yatirim_bedeli: x.yatirimBedeli, satinalma_tarihi: x.satinalmaTarihi, kategori: x.kategori, kapasite: x.kapasite, tur: 'makina' } as SupabaseAsset);
        for (const x of ds) await assetsAPI.insert({ adi: x.adi, marka: x.marka, yatirim_bedeli: x.yatirimBedeli, satinalma_tarihi: x.satinalmaTarihi || new Date().toISOString().slice(0,10), kategori: x.kategori, tur: 'demirbas' } as SupabaseAsset);
        for (const x of ks) await maintenanceAPI.insert({ tarih: x.tarih, varlik_id: x.varlikId, varlik_adi: x.varlikAdi, varlik_turu: x.varlikTuru, tur: x.tur, aciklama: x.aciklama, maliyet: x.maliyet } as SupabaseMaintenanceRecord);
        localStorage.removeItem('enba_makinalar_v2');
        localStorage.removeItem('enba_demirbaslar');
        localStorage.removeItem('enba_bakim_kayitlari');
        const [a2, m2] = await Promise.all([assetsAPI.getAll(), maintenanceAPI.getAll()]);
        setAssets(a2); setMaint(m2);
        return;
      }
      setAssets(a); setMaint(m);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── KPI ─────────────────────────────────────────────────────
  const kpi = useMemo(() => ({
    totalInvest:  assets.reduce((s, a) => s + (a.yatirim_bedeli || 0), 0),
    machineCount: assets.filter(a => a.tur === 'makina').length,
    fixCount:     assets.filter(a => a.tur === 'demirbas').length,
    totalMaint:   maint.reduce((s, m) => s + (m.maliyet || 0), 0),
  }), [assets, maint]);

  // ── Panel yardımcıları ───────────────────────────────────────
  const openAddAsset = (tur: 'makina' | 'demirbas') => {
    setEditingAsset(null);
    setAssetForm({ ...emptyAsset(), tur });
    setPanelMode('asset');
    setPanelOpen(true);
  };

  const openEditAsset = (a: SupabaseAsset) => {
    setEditingAsset(a);
    setAssetForm({ ...a });
    setPanelMode('asset');
    setPanelOpen(true);
  };

  const openAddMaint = (asset?: SupabaseAsset) => {
    setMaintForm({
      ...emptyMaint(),
      varlik_id: asset?.id ?? '',
      varlik_adi: asset?.adi ?? '',
      varlik_turu: asset?.tur ?? 'makina',
    });
    setPanelMode('maintenance');
    setPanelOpen(true);
  };

  const closePanel = () => { setPanelOpen(false); setEditingAsset(null); };

  // ── CRUD ─────────────────────────────────────────────────────
  const handleSaveAsset = async () => {
    if (!assetForm.adi?.trim()) return;
    setSaving(true);
    try {
      if (editingAsset) {
        const updated = await assetsAPI.update(editingAsset.id, assetForm);
        if (updated) setAssets(prev => prev.map(a => a.id === editingAsset.id ? updated : a));
      } else {
        const created = await assetsAPI.insert(assetForm as SupabaseAsset);
        if (created) setAssets(prev => [...prev, created]);
      }
      closePanel();
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  const handleDeleteAsset = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" silinsin mi?`)) return;
    const ok = await assetsAPI.delete(id);
    if (ok) {
      setAssets(prev => prev.filter(a => a.id !== id));
      setMaint(prev => prev.filter(m => m.varlik_id !== id));
    }
  };

  const handleSaveMaint = async () => {
    if (!maintForm.varlik_id) return;
    setSaving(true);
    try {
      const created = await maintenanceAPI.insert(maintForm as SupabaseMaintenanceRecord);
      if (created) setMaint(prev => [...prev, created]);
      closePanel();
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  const handleDeleteMaint = async (id: string) => {
    if (!window.confirm('Bakım kaydı silinsin mi?')) return;
    await maintenanceAPI.delete(id);
    setMaint(prev => prev.filter(m => m.id !== id));
  };

  // ── Excel şablon + yükleme ───────────────────────────────────
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Makine Adı', 'Marka', 'Motor Gücü (kW)', 'Kapasite (Ton/Saat)', 'Alış Tarihi', 'Alış Fiyatı (₺)'],
      ['Kırma Makinesi', 'Metso', 45, 2.0, '2026-01-01', 0],
    ]);
    XLSX.utils.book_append_sheet(XLSX.utils.book_new(), ws, 'Şablon');
    XLSX.writeFile(XLSX.utils.book_new(), 'Enba_Makina_Sablonu.xlsx');
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const wb   = XLSX.read(new Uint8Array(evt.target?.result as ArrayBuffer), { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as unknown[][];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i] as unknown[];
        if (!r[0]) continue;
        const ins = await assetsAPI.insert({ adi: String(r[0]), marka: String(r[1] || ''), motor_gucu: Number(r[2]) || 0, kapasite: Number(r[3]) || 0, satinalma_tarihi: String(r[4] || new Date().toISOString().slice(0,10)), yatirim_bedeli: Number(r[5]) || 0, kategori: 'Üretim Makinesi', tur: 'makina' } as SupabaseAsset);
        if (ins) setAssets(prev => [...prev, ins]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const machines  = assets.filter(a => a.tur === 'makina');
  const fixtures  = assets.filter(a => a.tur === 'demirbas');

  // ── Tablo sütun başlıkları ────────────────────────────────────
  const machineHeaders = ['Ad / Marka', 'Güç (kW)', 'Kapasite (t/sa)', 'Op.', 'Alış Değeri', 'Tarih', ''];
  const fixtureHeaders = ['Ad / Marka', 'Kategori', 'Op.', 'Alış Değeri', 'Tarih', ''];
  const maintHeaders   = ['Makine', 'Tür', 'Tarih', 'Açıklama', 'Maliyet', ''];

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-gray-900">Varlık & Envanter</h1>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all cursor-pointer" title="Excel'den toplu yükle">
              <FileSpreadsheet size={14} className="text-green-600" />
              Excel Yükle
              <input type="file" accept=".xlsx,.xls" onChange={handleBulkUpload} className="hidden" />
            </label>
            <button onClick={downloadTemplate} className="p-2 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-all" title="Şablon İndir">
              <FileDown size={16} />
            </button>
            <button onClick={() => openAddAsset('makina')} className="flex items-center gap-2 px-4 py-2 bg-[var(--enba-orange)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
              <Plus size={14} /> Makine Ekle
            </button>
            <button onClick={() => openAddAsset('demirbas')} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-black transition-all">
              <Plus size={14} /> Demirbaş Ekle
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Toplam CAPEX"     value={fmt(kpi.totalInvest) + ' ₺'} icon={<Factory size={16} className="text-blue-600" />}   color="bg-blue-50 border-blue-100 text-blue-900" />
          <KpiCard label="Makine Sayısı"    value={kpi.machineCount + ' adet'}   icon={<Zap size={16} className="text-orange-500" />}      color="bg-orange-50 border-orange-100 text-orange-900" />
          <KpiCard label="Demirbaş Sayısı"  value={kpi.fixCount + ' adet'}       icon={<Armchair size={16} className="text-slate-500" />}  color="bg-slate-50 border-slate-100 text-slate-800" />
          <KpiCard label="Toplam Bakım"     value={fmt(kpi.totalMaint) + ' ₺'}   icon={<Wrench size={16} className="text-rose-500" />}     color="bg-rose-50 border-rose-100 text-rose-900" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
          {([
            { id: 'machines',    label: `Makina Parkı (${machines.length})`,  icon: <Factory size={14} /> },
            { id: 'fixtures',    label: `Demirbaşlar (${fixtures.length})`,   icon: <Armchair size={14} /> },
            { id: 'maintenance', label: `Bakım Arşivi (${maint.length})`,     icon: <Wrench size={14} /> },
          ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
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
        ) : (
          <>
            {/* ── Makina Parkı ── */}
            {tab === 'machines' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`grid border-b border-gray-100 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400`}
                  style={{ gridTemplateColumns: '1fr 80px 100px 56px 110px 90px 90px' }}>
                  {machineHeaders.map((h, i) => (
                    <div key={i} className={`px-3 py-2.5 ${i >= 4 ? 'text-right' : ''}`}>{h}</div>
                  ))}
                </div>
                <div className="divide-y divide-gray-50">
                  {machines.length === 0 && (
                    <div className="text-center text-sm text-gray-400 py-12">Henüz makine eklenmemiş.</div>
                  )}
                  {machines.map(m => (
                    <div key={m.id} className="grid items-center hover:bg-gray-50/50 transition-colors"
                      style={{ gridTemplateColumns: '1fr 80px 100px 56px 110px 90px 90px' }}>
                      <div className="px-3 py-3">
                        <div className="text-sm font-semibold text-gray-800">{m.adi}</div>
                        {m.marka && <div className="text-[11px] text-gray-400">{m.marka}</div>}
                        {m.notes && <div className="text-[11px] text-gray-400 truncate max-w-[200px]">{m.notes}</div>}
                      </div>
                      <div className="px-3 py-3 text-sm tabular-nums text-gray-700">
                        {m.motor_gucu != null ? <><span className="font-semibold">{m.motor_gucu}</span> <span className="text-gray-400 text-[10px]">kW</span></> : <span className="text-gray-300">—</span>}
                      </div>
                      <div className="px-3 py-3 text-sm tabular-nums text-[var(--enba-orange)] font-semibold">
                        {m.kapasite != null ? <>{m.kapasite} <span className="text-gray-400 text-[10px] font-normal">t/sa</span></> : <span className="text-gray-300">—</span>}
                      </div>
                      <div className="px-3 py-3">
                        {m.operation
                          ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opColor(m.operation)}`}>{m.operation}</span>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </div>
                      <div className="px-3 py-3 text-right text-sm font-medium text-gray-800 tabular-nums">
                        {fmt(m.yatirim_bedeli)} <span className="text-[10px] text-gray-400">₺</span>
                      </div>
                      <div className="px-3 py-3 text-right text-xs text-gray-500">
                        <span className="flex items-center justify-end gap-1">
                          <Calendar size={11} className="text-gray-400" />
                          {m.satinalma_tarihi ? new Date(m.satinalma_tarihi).toLocaleDateString('tr-TR') : '—'}
                        </span>
                      </div>
                      <div className="px-3 py-3 flex items-center justify-end gap-1">
                        <button onClick={() => openAddMaint(m)} className="p-1.5 text-gray-400 hover:text-[var(--enba-orange)] hover:bg-orange-50 rounded-lg transition-all" title="Bakım emri">
                          <Wrench size={13} />
                        </button>
                        <button onClick={() => openEditAsset(m)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDeleteAsset(m.id, m.adi)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Demirbaşlar ── */}
            {tab === 'fixtures' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="grid border-b border-gray-100 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400"
                  style={{ gridTemplateColumns: '1fr 130px 56px 110px 100px 80px' }}>
                  {fixtureHeaders.map((h, i) => (
                    <div key={i} className={`px-3 py-2.5 ${i >= 3 ? 'text-right' : ''}`}>{h}</div>
                  ))}
                </div>
                <div className="divide-y divide-gray-50">
                  {fixtures.length === 0 && (
                    <div className="text-center text-sm text-gray-400 py-12">Henüz demirbaş eklenmemiş.</div>
                  )}
                  {fixtures.map(f => (
                    <div key={f.id} className="grid items-center hover:bg-gray-50/50 transition-colors"
                      style={{ gridTemplateColumns: '1fr 130px 56px 110px 100px 80px' }}>
                      <div className="px-3 py-3">
                        <div className="text-sm font-semibold text-gray-800">{f.adi}</div>
                        {f.marka && <div className="text-[11px] text-gray-400">{f.marka}</div>}
                      </div>
                      <div className="px-3 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f.kategori}</span>
                      </div>
                      <div className="px-3 py-3">
                        {f.operation
                          ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opColor(f.operation)}`}>{f.operation}</span>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </div>
                      <div className="px-3 py-3 text-right text-sm font-medium text-gray-800 tabular-nums">
                        {fmt(f.yatirim_bedeli)} <span className="text-[10px] text-gray-400">₺</span>
                      </div>
                      <div className="px-3 py-3 text-right text-xs text-gray-500">
                        {f.satinalma_tarihi ? new Date(f.satinalma_tarihi).toLocaleDateString('tr-TR') : '—'}
                      </div>
                      <div className="px-3 py-3 flex items-center justify-end gap-1">
                        <button onClick={() => openEditAsset(f)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"><Pencil size={13} /></button>
                        <button onClick={() => handleDeleteAsset(f.id, f.adi)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Bakım Arşivi ── */}
            {tab === 'maintenance' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bakım Kayıtları</span>
                  <button onClick={() => openAddMaint()} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--enba-orange)] text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all">
                    <Plus size={12} /> Bakım Kaydı
                  </button>
                </div>
                <div className="grid border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400"
                  style={{ gridTemplateColumns: '1fr 90px 90px 1fr 100px 60px' }}>
                  {maintHeaders.map((h, i) => (
                    <div key={i} className={`px-3 py-2.5 ${i === 4 ? 'text-right' : ''}`}>{h}</div>
                  ))}
                </div>
                <div className="divide-y divide-gray-50">
                  {maint.length === 0 && (
                    <div className="text-center text-sm text-gray-400 py-12">Henüz bakım kaydı eklenmemiş.</div>
                  )}
                  {maint.map(r => (
                    <div key={r.id} className="grid items-center hover:bg-gray-50/50 transition-colors"
                      style={{ gridTemplateColumns: '1fr 90px 90px 1fr 100px 60px' }}>
                      <div className="px-3 py-3 text-sm font-semibold text-gray-800">{r.varlik_adi}</div>
                      <div className="px-3 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{r.tur}</span>
                      </div>
                      <div className="px-3 py-3 text-xs text-gray-500">{r.tarih ? new Date(r.tarih).toLocaleDateString('tr-TR') : '—'}</div>
                      <div className="px-3 py-3 text-xs text-gray-600 truncate">{r.aciklama || '—'}</div>
                      <div className="px-3 py-3 text-right text-sm font-medium tabular-nums text-rose-600">{fmt(r.maliyet)} ₺</div>
                      <div className="px-3 py-3 flex items-center justify-end">
                        <button onClick={() => handleDeleteMaint(r.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {maint.length > 0 && (
                  <div className="grid border-t border-gray-200 bg-gray-50 text-sm font-bold text-gray-700"
                    style={{ gridTemplateColumns: '1fr 90px 90px 1fr 100px 60px' }}>
                    <div className="px-3 py-3 col-span-4">Toplam</div>
                    <div className="px-3 py-3 text-right text-rose-600">{fmt(maint.reduce((s, r) => s + r.maliyet, 0))} ₺</div>
                    <div />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Sağ panel ─────────────────────────────────────────── */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={closePanel} />
          <div className="fixed right-0 top-0 h-full z-50 w-[400px] bg-white shadow-2xl overflow-y-auto flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-base font-bold text-gray-900">
                {panelMode === 'asset'
                  ? (editingAsset ? 'Varlık Düzenle' : assetForm.tur === 'makina' ? 'Yeni Makine' : 'Yeni Demirbaş')
                  : 'Bakım Kaydı Ekle'}
              </h2>
              <button onClick={closePanel} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              {panelMode === 'asset' ? (
                <>
                  <Field label="Varlık Adı *">
                    <input className={inputCls} value={assetForm.adi ?? ''} onChange={e => setAssetForm(p => ({ ...p, adi: e.target.value }))} placeholder="Ör: Granülatör, Klima..." autoComplete="off" />
                  </Field>
                  <Field label="Tür">
                    <select className={selectCls} value={assetForm.tur ?? 'makina'} onChange={e => setAssetForm(p => ({ ...p, tur: e.target.value }))}>
                      <option value="makina">Makine / Ekipman</option>
                      <option value="demirbas">Demirbaş</option>
                    </select>
                  </Field>
                  <Field label="Operasyon">
                    <select className={selectCls} value={assetForm.operation ?? ''} onChange={e => setAssetForm(p => ({ ...p, operation: e.target.value || undefined }))}>
                      <option value="">— Seçiniz —</option>
                      {OPS.map(o => <option key={o.id} value={o.id}>{o.id} — {o.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Kategori">
                    <input className={inputCls} value={assetForm.kategori ?? ''} onChange={e => setAssetForm(p => ({ ...p, kategori: e.target.value }))} placeholder="Üretim Makinesi, Taşıt..." autoComplete="off" />
                  </Field>
                  <Field label="Marka">
                    <input className={inputCls} value={assetForm.marka ?? ''} onChange={e => setAssetForm(p => ({ ...p, marka: e.target.value }))} placeholder="Opsiyonel" autoComplete="off" />
                  </Field>
                  {assetForm.tur === 'makina' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Motor Gücü (kW)">
                        <input type="number" min="0" className={inputCls} value={assetForm.motor_gucu ?? ''} onChange={e => setAssetForm(p => ({ ...p, motor_gucu: e.target.value ? Number(e.target.value) : undefined }))} placeholder="45" />
                      </Field>
                      <Field label="Kapasite (ton/sa)">
                        <input type="number" min="0" step="0.1" className={inputCls} value={assetForm.kapasite ?? ''} onChange={e => setAssetForm(p => ({ ...p, kapasite: e.target.value ? Number(e.target.value) : undefined }))} placeholder="2.0" />
                      </Field>
                    </div>
                  )}
                  <Field label="Alış Bedeli (₺)">
                    <input type="number" min="0" className={inputCls} value={assetForm.yatirim_bedeli ?? 0} onChange={e => setAssetForm(p => ({ ...p, yatirim_bedeli: Number(e.target.value) || 0 }))} placeholder="0" />
                  </Field>
                  <Field label="Alış Tarihi">
                    <input type="date" className={inputCls} value={assetForm.satinalma_tarihi ?? ''} onChange={e => setAssetForm(p => ({ ...p, satinalma_tarihi: e.target.value }))} />
                  </Field>
                  <Field label="Notlar">
                    <textarea className={inputCls + ' resize-none'} rows={2} value={assetForm.notes ?? ''} onChange={e => setAssetForm(p => ({ ...p, notes: e.target.value }))} placeholder="Opsiyonel..." />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Makine">
                    <select className={selectCls} value={maintForm.varlik_id ?? ''} onChange={e => {
                      const a = assets.find(x => x.id === e.target.value);
                      setMaintForm(p => ({ ...p, varlik_id: e.target.value, varlik_adi: a?.adi ?? '', varlik_turu: a?.tur ?? 'makina' }));
                    }}>
                      <option value="">— Seçiniz —</option>
                      {assets.map(a => <option key={a.id} value={a.id}>{a.adi}</option>)}
                    </select>
                  </Field>
                  <Field label="Bakım Türü">
                    <select className={selectCls} value={maintForm.tur ?? 'Bakım'} onChange={e => setMaintForm(p => ({ ...p, tur: e.target.value }))}>
                      {MAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Tarih">
                    <input type="date" className={inputCls} value={maintForm.tarih ?? ''} onChange={e => setMaintForm(p => ({ ...p, tarih: e.target.value }))} />
                  </Field>
                  <Field label="Maliyet (₺)">
                    <input type="number" min="0" className={inputCls} value={maintForm.maliyet ?? 0} onChange={e => setMaintForm(p => ({ ...p, maliyet: Number(e.target.value) || 0 }))} placeholder="0" />
                  </Field>
                  <Field label="Açıklama">
                    <textarea className={inputCls + ' resize-none'} rows={3} value={maintForm.aciklama ?? ''} onChange={e => setMaintForm(p => ({ ...p, aciklama: e.target.value }))} placeholder="Yapılan işlem, değiştirilen parça..." />
                  </Field>
                </>
              )}
            </div>

            {/* Panel footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
              <button
                onClick={panelMode === 'asset' ? handleSaveAsset : handleSaveMaint}
                disabled={saving || (panelMode === 'asset' ? !assetForm.adi?.trim() : !maintForm.varlik_id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--enba-orange)] text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
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

export default Machinery;
