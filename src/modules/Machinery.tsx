import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, X, Wrench, Factory,
  Calendar, AlertCircle, Zap, Gauge, Info,
} from 'lucide-react';
import { fmt } from '../utils/formatters';
import { assetsAPI, maintenanceAPI, type SupabaseAsset, type SupabaseMaintenanceRecord } from '../api/supabase';

// ── Tipler & sabitler ─────────────────────────────────────────
type Tab = 'machines' | 'maintenance';

const OPS = [
  { id: 'M', label: 'Merkez',      color: 'bg-blue-100 text-blue-700' },
  { id: 'K', label: 'Kömürcüler', color: 'bg-green-100 text-green-700' },
  { id: 'V', label: 'Varsak',      color: 'bg-purple-100 text-purple-700' },
];
function opColor(op?: string) {
  return OPS.find(o => o.id === op)?.color ?? 'bg-gray-100 text-gray-500';
}

const MAINT_TYPES = ['Bakım', 'Arıza', 'Revizyon', 'Yağlama', 'Kalibrasyon', 'Diğer'];

// ── Yardımcı bileşenler ───────────────────────────────────────
const inputCls  = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/20 focus:border-[var(--enba-orange)]/40 bg-white';
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

// ── Ana bileşen ───────────────────────────────────────────────
export const Machinery: React.FC = () => {
  const [tab, setTab]       = useState<Tab>('machines');
  const [assets, setAssets] = useState<SupabaseAsset[]>([]);
  const [maint,  setMaint]  = useState<SupabaseMaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Panel state (yalnızca bakım formu)
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving,    setSaving]    = useState(false);

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
      const kStr = localStorage.getItem('enba_bakim_kayitlari');
      if ((mStr || kStr) && a.length === 0 && m.length === 0) {
        const ms = mStr ? JSON.parse(mStr) : [];
        const ks = kStr ? JSON.parse(kStr) : [];
        for (const x of ms) await assetsAPI.insert({ adi: x.adi, marka: x.marka, motor_gucu: x.motorGucu, yatirim_bedeli: x.yatirimBedeli, satinalma_tarihi: x.satinalmaTarihi, kategori: x.kategori, kapasite: x.kapasite, tur: 'makina' } as SupabaseAsset);
        for (const x of ks) await maintenanceAPI.insert({ tarih: x.tarih, varlik_id: x.varlikId, varlik_adi: x.varlikAdi, varlik_turu: x.varlikTuru, tur: x.tur, aciklama: x.aciklama, maliyet: x.maliyet } as SupabaseMaintenanceRecord);
        localStorage.removeItem('enba_makinalar_v2');
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

  // Sadece makinalar (CRUD → Varlık Takibi)
  const machines = useMemo(() => assets.filter(a => a.tur === 'makina'), [assets]);

  // ── KPI ─────────────────────────────────────────────────────
  const kpi = useMemo(() => ({
    machineCount: machines.length,
    totalKw:      machines.reduce((s, m) => s + (m.motor_gucu || 0), 0),
    totalCap:     machines.reduce((s, m) => s + (m.kapasite   || 0), 0),
    totalMaint:   maint.reduce((s, r) => s + (r.maliyet || 0), 0),
  }), [machines, maint]);

  // ── Panel yardımcıları ───────────────────────────────────────
  const openAddMaint = (asset?: SupabaseAsset) => {
    setMaintForm({
      ...emptyMaint(),
      varlik_id:   asset?.id  ?? '',
      varlik_adi:  asset?.adi ?? '',
      varlik_turu: 'makina',
    });
    setPanelOpen(true);
  };

  const closePanel = () => setPanelOpen(false);

  // ── Bakım CRUD ───────────────────────────────────────────────
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

  const maintHeaders = ['Makine', 'Tür', 'Tarih', 'Açıklama', 'Maliyet', ''];

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-gray-900">Makina Bakım</h1>
          <button
            onClick={() => openAddMaint()}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--enba-orange)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Plus size={14} /> Bakım Kaydı Ekle
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Makine Sayısı"    value={kpi.machineCount + ' adet'}       icon={<Factory size={16} className="text-blue-600" />}    color="bg-blue-50 border-blue-100 text-blue-900" />
          <KpiCard label="Toplam Güç"       value={kpi.totalKw + ' kW'}              icon={<Zap size={16} className="text-orange-500" />}       color="bg-orange-50 border-orange-100 text-orange-900" />
          <KpiCard label="Toplam Kapasite"  value={kpi.totalCap.toFixed(1) + ' t/sa'} icon={<Gauge size={16} className="text-teal-500" />}      color="bg-teal-50 border-teal-100 text-teal-900" />
          <KpiCard label="Bakım Maliyeti"   value={fmt(kpi.totalMaint) + ' ₺'}       icon={<Wrench size={16} className="text-rose-500" />}      color="bg-rose-50 border-rose-100 text-rose-900" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
          {([
            { id: 'machines',    label: `Makinalar (${machines.length})`,  icon: <Factory size={14} /> },
            { id: 'maintenance', label: `Bakım Arşivi (${maint.length})`,  icon: <Wrench size={14} /> },
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
            {/* ── Makinalar (read-only) ── */}
            {tab === 'machines' && (
              <>
                {/* Bilgi notu */}
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-xs font-medium">
                  <Info size={13} className="flex-shrink-0" />
                  Makine eklemek veya düzenlemek için <strong className="mx-1">Varlık Takibi</strong> modülünü kullanın.
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="grid border-b border-gray-100 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400"
                    style={{ gridTemplateColumns: '1fr 80px 110px 56px 100px 80px' }}>
                    {['Ad / Notlar', 'Güç (kW)', 'Kapasite (t/sa)', 'Op.', 'Son Bakım', ''].map((h, i) => (
                      <div key={i} className={`px-3 py-2.5 ${i >= 4 ? 'text-right' : ''}`}>{h}</div>
                    ))}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {machines.length === 0 && (
                      <div className="text-center text-sm text-gray-400 py-12">
                        Henüz makine kaydı yok. Varlık Takibi modülünden ekleyin.
                      </div>
                    )}
                    {machines.map(m => {
                      const lastMaint = maint
                        .filter(r => r.varlik_id === m.id)
                        .sort((a, b) => (b.tarih ?? '').localeCompare(a.tarih ?? ''))[0];
                      return (
                        <div key={m.id} className="grid items-center hover:bg-gray-50/50 transition-colors"
                          style={{ gridTemplateColumns: '1fr 80px 110px 56px 100px 80px' }}>
                          <div className="px-3 py-3">
                            <div className="text-sm font-semibold text-gray-800">{m.adi}</div>
                            {m.marka && <div className="text-[11px] text-gray-400">{m.marka}</div>}
                            {m.notes && <div className="text-[11px] text-gray-400 truncate max-w-[220px]">{m.notes}</div>}
                          </div>
                          <div className="px-3 py-3 text-sm tabular-nums text-gray-700">
                            {m.motor_gucu != null
                              ? <><span className="font-semibold">{m.motor_gucu}</span> <span className="text-gray-400 text-[10px]">kW</span></>
                              : <span className="text-gray-300">—</span>}
                          </div>
                          <div className="px-3 py-3 text-sm tabular-nums text-[var(--enba-orange)] font-semibold">
                            {m.kapasite != null
                              ? <>{m.kapasite} <span className="text-gray-400 text-[10px] font-normal">t/sa</span></>
                              : <span className="text-gray-300">—</span>}
                          </div>
                          <div className="px-3 py-3">
                            {m.operation
                              ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opColor(m.operation)}`}>{m.operation}</span>
                              : <span className="text-gray-300 text-xs">—</span>}
                          </div>
                          <div className="px-3 py-3 text-right text-xs text-gray-500">
                            {lastMaint
                              ? <span className="flex items-center justify-end gap-1">
                                  <Calendar size={11} className="text-gray-400" />
                                  {new Date(lastMaint.tarih).toLocaleDateString('tr-TR')}
                                </span>
                              : <span className="text-gray-300">—</span>}
                          </div>
                          <div className="px-3 py-3 flex items-center justify-end">
                            <button
                              onClick={() => openAddMaint(m)}
                              className="p-1.5 text-gray-400 hover:text-[var(--enba-orange)] hover:bg-orange-50 rounded-lg transition-all"
                              title="Bakım kaydı ekle"
                            >
                              <Wrench size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ── Bakım Arşivi ── */}
            {tab === 'maintenance' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bakım Kayıtları</span>
                  <button
                    onClick={() => openAddMaint()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--enba-orange)] text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
                  >
                    <Plus size={12} /> Bakım Kaydı
                  </button>
                </div>
                <div className="grid border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400"
                  style={{ gridTemplateColumns: '1fr 90px 90px 1fr 100px 48px' }}>
                  {maintHeaders.map((h, i) => (
                    <div key={i} className={`px-3 py-2.5 ${i === 4 ? 'text-right' : ''}`}>{h}</div>
                  ))}
                </div>
                <div className="divide-y divide-gray-50">
                  {maint.length === 0 && (
                    <div className="text-center text-sm text-gray-400 py-12">Henüz bakım kaydı eklenmemiş.</div>
                  )}
                  {[...maint].sort((a, b) => (b.tarih ?? '').localeCompare(a.tarih ?? '')).map(r => (
                    <div key={r.id} className="grid items-center hover:bg-gray-50/50 transition-colors"
                      style={{ gridTemplateColumns: '1fr 90px 90px 1fr 100px 48px' }}>
                      <div className="px-3 py-3 text-sm font-semibold text-gray-800">{r.varlik_adi}</div>
                      <div className="px-3 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{r.tur}</span>
                      </div>
                      <div className="px-3 py-3 text-xs text-gray-500">
                        {r.tarih ? new Date(r.tarih).toLocaleDateString('tr-TR') : '—'}
                      </div>
                      <div className="px-3 py-3 text-xs text-gray-600 truncate">{r.aciklama || '—'}</div>
                      <div className="px-3 py-3 text-right text-sm font-medium tabular-nums text-rose-600">
                        {fmt(r.maliyet)} ₺
                      </div>
                      <div className="px-3 py-3 flex items-center justify-end">
                        <button
                          onClick={() => handleDeleteMaint(r.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Sil"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {maint.length > 0 && (
                  <div className="grid border-t border-gray-200 bg-gray-50 text-sm font-bold text-gray-700"
                    style={{ gridTemplateColumns: '1fr 90px 90px 1fr 100px 48px' }}>
                    <div className="px-3 py-3 col-span-4 text-xs text-gray-500">Toplam</div>
                    <div className="px-3 py-3 text-right text-rose-600">{fmt(maint.reduce((s, r) => s + r.maliyet, 0))} ₺</div>
                    <div />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Bakım formu (sağ panel) ───────────────────────────── */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={closePanel} />
          <div className="fixed right-0 top-0 h-full z-50 w-[380px] bg-white shadow-2xl overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-base font-bold text-gray-900">Bakım Kaydı Ekle</h2>
              <button onClick={closePanel} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              <Field label="Makine *">
                <select className={selectCls} value={maintForm.varlik_id ?? ''} onChange={e => {
                  const a = machines.find(x => x.id === e.target.value);
                  setMaintForm(p => ({ ...p, varlik_id: e.target.value, varlik_adi: a?.adi ?? '', varlik_turu: 'makina' }));
                }}>
                  <option value="">— Seçiniz —</option>
                  {machines.map(a => (
                    <option key={a.id} value={a.id}>{a.adi}{a.operation ? ` (${a.operation})` : ''}</option>
                  ))}
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
                <input type="number" min="0" className={inputCls} value={maintForm.maliyet ?? 0}
                  onChange={e => setMaintForm(p => ({ ...p, maliyet: Number(e.target.value) || 0 }))} placeholder="0" />
              </Field>
              <Field label="Açıklama">
                <textarea className={inputCls + ' resize-none'} rows={4}
                  value={maintForm.aciklama ?? ''}
                  onChange={e => setMaintForm(p => ({ ...p, aciklama: e.target.value }))}
                  placeholder="Yapılan işlem, değiştirilen parça, teknisyen..." />
              </Field>
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
              <button
                onClick={handleSaveMaint}
                disabled={saving || !maintForm.varlik_id}
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
