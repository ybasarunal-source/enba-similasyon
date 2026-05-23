import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePlanSync } from '../../hooks/usePlanSync';
import { SyncBanner } from '../../components/SyncBanner';
import { DetailedPlanShell } from './DetailedPlanShell';
import { DPlanWizard } from './DPlanWizard';
import {
  DPlan, CostCenter, FixedExpense,
  migratePlanFormat, loadCostCenters, saveCostCenters, fmtTL,
} from './dpData';
import { I, cx, Badge, Btn } from './DPPrimitives';
import { MCODE_NOTES } from '@/api/mcodeNotes';
import { SharedContactsService } from '../../api/dataService';

const LOCAL_KEY = 'enba_dp2_plans';

interface Props {
  navigate?: (module: string) => void;
  /** App'in global ← tuşunu kesmek için: fn null → override kaldır */
  setBackOverride?: (fn: (() => boolean) | null) => void;
}

type View = 'list' | 'wizard' | 'shell' | 'ccEditor';

export function DetailedPlanModule({ navigate, setBackOverride }: Props) {
  const { planlar, kaydet, sil, syncStatus, syncError } = usePlanSync<DPlan>({
    localKey: LOCAL_KEY,
    planType: 'detailed',
  });

  const [costCenters, setCostCenters] = useState<CostCenter[]>(() => loadCostCenters());
  const [view, setView]               = useState<View>('list');
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [activeCcId, setActiveCcId]     = useState<string | null>(null);
  const migratedOnce = useRef(false);

  // Eski key'lerden tek seferlik veri göçü
  // enba_detailed_plans_v2 → enba_dp2_plans (eğer yeni key boşsa)
  useEffect(() => {
    if (migratedOnce.current) return;
    migratedOnce.current = true;
    const current = localStorage.getItem(LOCAL_KEY);
    const currentPlans: DPlan[] = current ? (JSON.parse(current) as DPlan[]) : [];
    if (currentPlans.length > 0) return; // zaten veri var
    // Eski key'leri sırayla dene
    for (const oldKey of ['enba_detailed_plans_v2', 'enba_detailed_plans']) {
      const old = localStorage.getItem(oldKey);
      if (!old) continue;
      try {
        const oldPlans = JSON.parse(old) as DPlan[];
        if (oldPlans.length > 0) {
          kaydet(oldPlans); // localStorage + Supabase'e yaz
          break;
        }
      } catch { /* ignore */ }
    }
  }, [kaydet]);

  useEffect(() => { saveCostCenters(costCenters); }, [costCenters]);

  // App'in global ← tuşunu modül-içi navigasyon için intercept et.
  // Shell/wizard/ccEditor açıkken ← → plan listesine döner (modüle değil).
  useEffect(() => {
    if (!setBackOverride) return;
    if (view !== 'list') {
      setBackOverride(() => {
        setView('list');
        setActivePlanId(null);
        setActiveCcId(null);
        return true; // App'in goBack'ini durdur
      });
    } else {
      setBackOverride(null); // Liste görünümünde normal modül geri navigasyonu
    }
    return () => setBackOverride(null); // Unmount'ta temizle
  }, [view, setBackOverride]);

  useEffect(() => {
    if (migratedOnce.current || planlar.length === 0) return;
    migratedOnce.current = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kaydet(planlar.map((p: any) => migratePlanFormat(p)));

    // Mevcut planlardaki tedarikçi/müşteri adlarını paylaşımlı cari havuzuna sync et.
    // Bu, özelliğin eklenmesinden önce oluşturulan planların isimlerini taşır.
    planlar.forEach(p => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plan = p as any;
      (plan.suppliers ?? []).forEach((s: { name?: string }) => {
        if (s.name) SharedContactsService.upsertByName(s.name, 'supplier');
      });
      (plan.customers ?? []).forEach((c: { name?: string }) => {
        if (c.name) SharedContactsService.upsertByName(c.name, 'customer');
      });
      // Projeler içindeki tedarikçi/müşteri adları (varsa)
      (plan.projects ?? []).forEach((proj: { expenses?: { supplierName?: string }[]; revenues?: { customerName?: string }[] }) => {
        (proj.expenses ?? []).forEach(e => {
          if (e.supplierName) SharedContactsService.upsertByName(e.supplierName, 'supplier');
        });
        (proj.revenues ?? []).forEach(r => {
          if (r.customerName) SharedContactsService.upsertByName(r.customerName, 'customer');
        });
      });
    });
  }, [planlar.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activePlan = activePlanId ? migratePlanFormat(planlar.find(p => p.id === activePlanId) as any) ?? null : null;
  const activeCc   = activeCcId ? costCenters.find(c => c.id === activeCcId) ?? null : null;

  const upsertPlan = (updated: DPlan) => {
    const exists = planlar.some(p => p.id === updated.id);
    kaydet(exists ? planlar.map(p => p.id === updated.id ? updated : p) : [...planlar, updated]);
  };

  const upsertCc = (cc: CostCenter) => {
    setCostCenters(prev => {
      const exists = prev.some(c => c.id === cc.id);
      return exists ? prev.map(c => c.id === cc.id ? cc : c) : [...prev, cc];
    });
  };

  const deleteCc = (id: string) => {
    if (!window.confirm('Bu gider merkezi silinecek. Emin misiniz?')) return;
    setCostCenters(prev => prev.filter(c => c.id !== id));
  };

  const openCcEditor = (ccId: string | null) => {
    if (ccId === null) {
      const newCc: CostCenter = { id: crypto.randomUUID(), name: 'Yeni Gider Merkezi', fixedExpenses: [] };
      setCostCenters(prev => [...prev, newCc]);
      setActiveCcId(newCc.id);
    } else {
      setActiveCcId(ccId);
    }
    setView('ccEditor');
  };

  const openPlan = (plan: DPlan) => {
    setActivePlanId(plan.id);
    setView('shell'); // Wizard sadece kalem (Düzenle) tuşundan açılır
  };

  const openWizardForEdit = (plan: DPlan) => { setActivePlanId(plan.id); setView('wizard'); };

  const handleDelete = (id: string) => {
    if (!window.confirm('Bu plan silinecek. Emin misiniz?')) return;
    sil(id);
    if (activePlanId === id) { setActivePlanId(null); setView('list'); }
  };

  /* ── Gider Merkezi Editörü ── */
  if (view === 'ccEditor' && activeCc) {
    return (
      <CostCenterEditor
        cc={activeCc}
        onChange={upsertCc}
        onBack={() => { setView('list'); setActiveCcId(null); }}
      />
    );
  }

  /* ── Sihirbaz görünümü ── */
  if (view === 'wizard') {
    return (
      <DPlanWizard
        initialPlan={activePlan ?? undefined}
        costCenters={costCenters}
        onDone={(plan) => { upsertPlan(plan); setActivePlanId(plan.id); setView('shell'); }}
        onSave={(plan) => { upsertPlan(plan); setActivePlanId(plan.id); }}
        onCancel={() => { setView('list'); setActivePlanId(null); }}
      />
    );
  }

  /* ── Shell görünümü ── */
  if (view === 'shell' && activePlan) {
    return (
      <DetailedPlanShell
        plan={activePlan}
        costCenters={costCenters}
        onSave={upsertPlan}
        onBack={() => { setView('list'); setActivePlanId(null); }}
        onEdit={() => openWizardForEdit(activePlan)}
        navigate={navigate}
      />
    );
  }

  /* ── Liste görünümü ── */
  return (
    <div className="h-full flex flex-col bg-enba-bg overflow-y-auto">
      <SyncBanner status={syncStatus} error={syncError} onRetry={() => kaydet(planlar)} />

      <div className="flex-none border-b border-enba-line bg-enba-panel px-6 h-[60px] flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-enba-orange shadow-[0_0_8px] shadow-enba-orange/60" />
        <h1 className="text-[15px] font-semibold flex-1">Detaylı İş Planı</h1>
        <Btn variant="primary" size="md" icon={<I.Plus size={14} />} onClick={() => { setActivePlanId(null); setView('wizard'); }}>
          Yeni Plan
        </Btn>
      </div>

      <main className="flex-1 p-6">
        <div className="max-w-[1380px] mx-auto flex flex-col gap-8">

          {/* Gider Merkezleri */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-0.5">Sabit Maliyet</div>
                <h2 className="text-[14px] font-semibold text-enba-text">Gider Merkezleri</h2>
              </div>
              <Btn variant="outline" size="sm" icon={<I.Plus size={13} />} onClick={() => openCcEditor(null)}>
                Yeni Merkez
              </Btn>
            </div>
            {costCenters.length === 0 ? (
              <CostCenterEmptyState onNew={() => openCcEditor(null)} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {costCenters.map(cc => (
                  <CostCenterCard
                    key={cc.id}
                    cc={cc}
                    onEdit={() => openCcEditor(cc.id)}
                    onDelete={() => deleteCc(cc.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* İş Planları */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-enba-muted mb-0.5">Finansal Projeksiyon</div>
                <h2 className="text-[14px] font-semibold text-enba-text">İş Planları</h2>
              </div>
            </div>
            {planlar.length === 0 ? (
              <PlanEmptyState onNew={() => { setActivePlanId(null); setView('wizard'); }} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {planlar.map(plan => (
                  <PlanCard
                    key={plan.id}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    plan={migratePlanFormat(plan as any)}
                    costCenters={costCenters}
                    onOpen={() => openPlan(plan)}
                    onEdit={() => openWizardForEdit(plan)}
                    onDelete={() => handleDelete(plan.id)}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}

/* ─── CostCenterCard ─── */
function CostCenterCard({ cc, onEdit, onDelete }: { cc: CostCenter; onEdit: () => void; onDelete: () => void }) {
  const totalMonthly = cc.fixedExpenses.reduce((s, e) => s + e.monthly, 0);
  return (
    <div className="bg-enba-panel border border-enba-line rounded-xl p-4 hover:border-enba-orange/40 transition-colors flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-enba-orange flex-none" />
            <h3 className="text-[13px] font-semibold text-enba-text truncate">{cc.name}</h3>
          </div>
          <div className="text-[11px] text-enba-dim ml-3.5">
            {cc.fixedExpenses.length === 0 ? 'Henüz gider kalemi yok' : `${cc.fixedExpenses.length} gider kalemi`}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-none">
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded-lg text-enba-dim hover:text-enba-orange hover:bg-enba-orange/10 inline-flex items-center justify-center transition-colors"
            title="Düzenle"
          >
            <I.Edit size={13} />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg text-enba-dim hover:text-enba-red hover:bg-enba-red/10 inline-flex items-center justify-center transition-colors"
            title="Sil"
          >
            <I.Trash size={13} />
          </button>
        </div>
      </div>
      {cc.fixedExpenses.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-enba-line">
          <span className="text-[11px] text-enba-muted">Aylık toplam</span>
          <span className="text-[13px] font-semibold text-enba-text">{fmtTL(totalMonthly, { compact: true })}</span>
        </div>
      )}
    </div>
  );
}

/* ─── CostCenterEmptyState ─── */
function CostCenterEmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div
      onClick={onNew}
      className="border border-dashed border-enba-line rounded-xl p-6 flex items-center gap-4 cursor-pointer hover:border-enba-orange/50 hover:bg-enba-orange/5 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-enba-panel-2 border border-enba-line flex items-center justify-center flex-none">
        <I.Plus size={18} className="text-enba-dim" />
      </div>
      <div>
        <div className="text-[13px] font-medium text-enba-text">Gider merkezi oluştur</div>
        <div className="text-[11.5px] text-enba-dim mt-0.5">Tesis, ofis, atölye vb. — bir kere tanımlanır, projelerden referanslanır.</div>
      </div>
    </div>
  );
}

/* ─── CostCenterEditor ─── */
const EXPENSE_MCODES = [
  { code: 'M420', tr: 'Kira Gideri' },
  { code: 'M405', tr: 'Elektrik Enerjisi Giderleri' },
  { code: 'M410', tr: 'Isınma, Yakıt ve Buhar Giderleri' },
  { code: 'M415', tr: 'Su Tüketim Giderleri' },
  { code: 'M489', tr: 'Brüt Personel Maaş ve Ücret Giderleri' },
  { code: 'M489.01', tr: 'SGK İşveren Payı Giderleri' },
  { code: 'M489.03', tr: 'Personel Yemek ve Mutfak Giderleri' },
  { code: 'M489.04', tr: 'Personel Ulaşım ve Yol Giderleri' },
  { code: 'M509', tr: 'Bakım Onarım Giderleri' },
  { code: 'M529', tr: 'Çevre, Atık Yönetimi ve İSG Giderleri' },
  { code: 'M605', tr: 'Dışarıdan Sağlanan Hizmetler' },
  { code: 'M999', tr: 'Diğer Giderler' },
];

interface ExpenseFormState {
  name: string;
  mcode: string;
  monthly: string;
  growth: string;
}

const emptyForm = (): ExpenseFormState => ({ name: '', mcode: 'M420', monthly: '', growth: '0' });

function CostCenterEditor({ cc, onChange, onBack }: {
  cc: CostCenter;
  onChange: (cc: CostCenter) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState(cc.name);
  const [expenses, setExpenses] = useState<FixedExpense[]>(cc.fixedExpenses);
  const [addForm, setAddForm] = useState<ExpenseFormState | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExpenseFormState>(emptyForm());

  const push = (updated: { name: string; expenses: FixedExpense[] }) => {
    onChange({ ...cc, name: updated.name, fixedExpenses: updated.expenses });
  };

  const handleNameBlur = () => push({ name, expenses });

  const startAdd = () => { setAddForm(emptyForm()); setEditId(null); };

  const commitAdd = () => {
    if (!addForm || !addForm.name.trim() || !addForm.monthly) return;
    const entry: FixedExpense = {
      id: crypto.randomUUID(),
      mcode: addForm.mcode,
      costCategory: 'facility',
      name: addForm.name.trim(),
      group: 'Tesis',
      monthly: parseFloat(addForm.monthly) || 0,
      growth: parseFloat(addForm.growth) / 100 || 0,
    };
    const next = [...expenses, entry];
    setExpenses(next);
    setAddForm(null);
    push({ name, expenses: next });
  };

  const startEdit = (e: FixedExpense) => {
    setEditId(e.id);
    setEditForm({ name: e.name, mcode: e.mcode, monthly: String(e.monthly), growth: String(e.growth * 100) });
    setAddForm(null);
  };

  const commitEdit = () => {
    if (!editId || !editForm.name.trim() || !editForm.monthly) return;
    const next = expenses.map(e => e.id === editId ? {
      ...e,
      name: editForm.name.trim(),
      mcode: editForm.mcode,
      monthly: parseFloat(editForm.monthly) || 0,
      growth: parseFloat(editForm.growth) / 100 || 0,
    } : e);
    setExpenses(next);
    setEditId(null);
    push({ name, expenses: next });
  };

  const deleteExpense = (id: string) => {
    const next = expenses.filter(e => e.id !== id);
    setExpenses(next);
    push({ name, expenses: next });
  };

  const totalMonthly = expenses.reduce((s, e) => s + e.monthly, 0);

  return (
    <div className="h-full flex flex-col bg-enba-bg overflow-hidden">
      {/* Header */}
      <div className="bg-enba-panel border-b border-enba-line flex-none h-[60px] flex items-center px-5 gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg text-enba-muted hover:text-enba-text hover:bg-enba-panel-2 inline-flex items-center justify-center flex-none"
        >
          <I.Chevron size={14} className="rotate-90" />
        </button>
        <div className="flex-1 min-w-0">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleNameBlur}
            className="bg-transparent text-[15px] font-semibold text-enba-text outline-none border-b border-transparent focus:border-enba-orange/60 transition-colors w-full min-w-0"
            placeholder="Gider merkezi adı"
          />
          <div className="text-[10.5px] text-enba-dim mt-0.5">Gider Merkezi · {expenses.length} kalem · {fmtTL(totalMonthly, { compact: true })}/ay</div>
        </div>
        <Btn variant="ghost" size="md" onClick={onBack}>Tamam</Btn>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[860px] mx-auto">

          {/* Expenses list */}
          <div className="bg-enba-panel border border-enba-line rounded-xl overflow-hidden mb-3">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_100px_90px_80px_36px] gap-3 px-4 py-2.5 border-b border-enba-line bg-enba-panel-2/60">
              <span className="text-[10.5px] uppercase tracking-wider text-enba-dim">Gider Adı</span>
              <span className="text-[10.5px] uppercase tracking-wider text-enba-dim text-right">Aylık (₺)</span>
              <span className="text-[10.5px] uppercase tracking-wider text-enba-dim text-right">Büyüme %</span>
              <span className="text-[10.5px] uppercase tracking-wider text-enba-dim text-center">M-Kodu</span>
              <span />
            </div>

            {expenses.length === 0 && !addForm && (
              <div className="px-4 py-8 text-center text-[12.5px] text-enba-dim">
                Henüz gider kalemi yok. Aşağıdan ekleyin.
              </div>
            )}

            {expenses.map(e => (
              editId === e.id ? (
                <ExpenseEditRow
                  key={e.id}
                  form={editForm}
                  onChange={setEditForm}
                  onCommit={commitEdit}
                  onCancel={() => setEditId(null)}
                />
              ) : (
                <div
                  key={e.id}
                  className="grid grid-cols-[1fr_100px_90px_80px_36px] gap-3 px-4 py-3 border-b border-enba-line last:border-0 hover:bg-enba-panel-2/40 transition-colors items-center group"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] text-enba-text truncate">{e.name}</div>
                  </div>
                  <div className="text-[13px] text-enba-text text-right tabular-nums">{fmtTL(e.monthly)}</div>
                  <div className="text-[12px] text-enba-muted text-right">{e.growth > 0 ? `+${(e.growth*100).toFixed(1)}%` : '—'}</div>
                  <div className="text-center">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-enba-panel-2 border border-enba-line text-[10.5px] font-mono text-enba-orange">{e.mcode}</span>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(e)} className="w-7 h-7 rounded text-enba-dim hover:text-enba-orange inline-flex items-center justify-center"><I.Edit size={12} /></button>
                    <button onClick={() => deleteExpense(e.id)} className="w-7 h-7 rounded text-enba-dim hover:text-enba-red inline-flex items-center justify-center"><I.Trash size={12} /></button>
                  </div>
                </div>
              )
            ))}

            {/* Add form row */}
            {addForm && (
              <ExpenseEditRow
                form={addForm}
                onChange={setAddForm as (f: ExpenseFormState) => void}
                onCommit={commitAdd}
                onCancel={() => setAddForm(null)}
              />
            )}

            {/* Footer total */}
            {expenses.length > 0 && (
              <div className="px-4 py-2.5 bg-enba-panel-2/40 flex items-center justify-between border-t border-enba-line">
                <span className="text-[11px] text-enba-muted">Toplam / ay</span>
                <span className="text-[13px] font-semibold text-enba-text tabular-nums">{fmtTL(totalMonthly)}</span>
              </div>
            )}
          </div>

          {!addForm && (
            <button
              onClick={startAdd}
              className="flex items-center gap-2 text-[12.5px] text-enba-muted hover:text-enba-orange transition-colors px-1 py-1"
            >
              <I.Plus size={14} />
              Gider kalemi ekle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function McodeCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const openDrop = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    setQuery('');
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        !dropRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const q = query.toLowerCase();
  const filtered = EXPENSE_MCODES.filter(m =>
    !q ||
    m.code.toLowerCase().includes(q) ||
    m.tr.toLowerCase().includes(q) ||
    (MCODE_NOTES[m.code] ?? '').toLowerCase().includes(q)
  );

  const dropdown = open && pos ? createPortal(
    <div
      ref={dropRef}
      style={{ position: 'fixed', top: pos.top, right: pos.right, width: 360, zIndex: 9999 }}
      className="bg-enba-panel border border-enba-line rounded-xl shadow-2xl overflow-hidden"
    >
      <div className="p-2 border-b border-enba-line">
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Kod veya açıklama ara..."
          className="w-full bg-enba-panel-2 border border-enba-line rounded-lg px-2.5 py-1.5 text-[12px] text-enba-text outline-none focus:border-enba-orange/60"
          onKeyDown={e => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Enter' && filtered.length > 0) { onChange(filtered[0].code); setOpen(false); }
          }}
        />
      </div>
      <div className="max-h-[280px] overflow-y-auto">
        {filtered.map(m => (
          <button
            key={m.code}
            type="button"
            onMouseDown={e => { e.preventDefault(); onChange(m.code); setOpen(false); }}
            className={cx(
              'w-full text-left px-3 py-2.5 hover:bg-enba-orange/10 transition-colors border-b border-enba-line last:border-0',
              value === m.code ? 'bg-enba-orange/5' : ''
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-enba-orange font-semibold w-[64px] flex-none">{m.code}</span>
              <span className="text-[12.5px] text-enba-text font-medium leading-tight">{m.tr}</span>
            </div>
            {MCODE_NOTES[m.code] && (
              <p className="text-[10.5px] text-enba-dim mt-0.5 pl-[72px] leading-snug line-clamp-2">
                {MCODE_NOTES[m.code]}
              </p>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-5 text-[12px] text-enba-dim text-center">Sonuç bulunamadı</div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openDrop}
        className="w-full bg-enba-panel-2 border border-enba-line rounded-lg px-1.5 py-1.5 text-[11px] font-mono text-enba-orange outline-none focus:border-enba-orange/60 text-left truncate"
      >
        {value}
      </button>
      {dropdown}
    </>
  );
}

function ExpenseEditRow({ form, onChange, onCommit, onCancel }: {
  form: ExpenseFormState;
  onChange: (f: ExpenseFormState) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const set = (k: keyof ExpenseFormState) => (v: string) => onChange({ ...form, [k]: v });
  return (
    <div className="grid grid-cols-[1fr_100px_90px_80px_36px] gap-3 px-4 py-2.5 border-b border-enba-line bg-enba-orange/5 items-center">
      <input
        autoFocus
        value={form.name}
        onChange={e => set('name')(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onCommit(); if (e.key === 'Escape') onCancel(); }}
        placeholder="Gider adı (örn. Kira)"
        className="w-full bg-enba-panel-2 border border-enba-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-enba-text outline-none focus:border-enba-orange/60"
      />
      <input
        type="number"
        value={form.monthly}
        onChange={e => set('monthly')(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onCommit(); if (e.key === 'Escape') onCancel(); }}
        placeholder="0"
        className="w-full bg-enba-panel-2 border border-enba-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-enba-text text-right outline-none focus:border-enba-orange/60"
      />
      <input
        type="number"
        value={form.growth}
        onChange={e => set('growth')(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onCommit(); if (e.key === 'Escape') onCancel(); }}
        placeholder="0"
        className="w-full bg-enba-panel-2 border border-enba-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-enba-text text-right outline-none focus:border-enba-orange/60"
      />
      <McodeCombobox value={form.mcode} onChange={set('mcode')} />
      <div className="flex items-center gap-0.5">
        <button onClick={onCommit} className="w-7 h-7 rounded text-enba-green hover:bg-enba-green/10 inline-flex items-center justify-center"><I.Check size={13} /></button>
        <button onClick={onCancel} className="w-7 h-7 rounded text-enba-dim hover:text-enba-text inline-flex items-center justify-center text-[16px] leading-none">×</button>
      </div>
    </div>
  );
}

/* ─── PlanCard ─── */
function PlanCard({ plan, costCenters, onOpen, onEdit, onDelete }: {
  plan: DPlan;
  costCenters: CostCenter[];
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isDraft        = plan.status === 'draft';
  const tone           = plan.status === 'active' ? 'green' : plan.status === 'archived' ? 'neutral' : 'amber';
  const label          = plan.status === 'active' ? 'Aktif' : plan.status === 'archived' ? 'Arşiv' : 'Taslak';
  const activeProjects = plan.projects.filter(p => p.isActive).length;
  const usedCcIds      = new Set(plan.projects.map(p => p.costCenterId).filter(Boolean));
  const usedCcs        = costCenters.filter(c => usedCcIds.has(c.id));
  const totalExpenses  = usedCcs.reduce((s, c) => s + c.fixedExpenses.length, 0);

  return (
    <div className="bg-enba-panel border border-enba-line rounded-xl p-5 hover:border-enba-orange/40 transition-colors flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-enba-text truncate">{plan.title}</h3>
          <div className="text-[11px] text-enba-dim mt-1">{plan.startYear} · {plan.horizon} ay</div>
        </div>
        <Badge tone={tone}>{label}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <MiniStat label="Proje" value={String(plan.projects.length)} sub={activeProjects > 0 ? `${activeProjects} aktif` : undefined} />
        <MiniStat label="Tesis Gider" value={String(totalExpenses)} sub={usedCcs.length > 1 ? `${usedCcs.length} merkez` : undefined} />
        <MiniStat label="Gerçek." value={`${plan.actualsThrough} ay`} accent={plan.actualsThrough > 0} />
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-enba-line">
        <Btn
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={onOpen}
        >
          Aç
        </Btn>
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-lg text-enba-dim hover:text-enba-orange hover:bg-enba-orange/10 inline-flex items-center justify-center transition-colors"
          title="Düzenle"
        >
          <I.Edit size={13} />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-lg text-enba-dim hover:text-enba-red hover:bg-enba-red/10 inline-flex items-center justify-center transition-colors"
          title="Sil"
        >
          <I.Trash size={13} />
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent, sub }: { label: string; value: string; accent?: boolean; sub?: string }) {
  return (
    <div className="bg-enba-panel-2 rounded-lg px-2 py-2.5">
      <div className="text-[10px] text-enba-dim uppercase tracking-wider mb-1">{label}</div>
      <div className={cx('text-[13px] font-semibold', accent ? 'text-enba-green' : '')}>{value}</div>
      {sub && <div className="text-[10px] text-enba-dim mt-0.5">{sub}</div>}
    </div>
  );
}

/* ─── PlanEmptyState ─── */
function PlanEmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-enba-panel-2 border border-enba-line flex items-center justify-center">
        <I.Budget size={24} className="text-enba-dim" />
      </div>
      <div>
        <div className="text-[14px] font-semibold text-enba-text mb-1">Henüz iş planı yok</div>
        <div className="text-[12px] text-enba-dim">Gider merkezini tanımladıktan sonra yeni plan oluşturun.</div>
      </div>
      <Btn variant="primary" size="md" icon={<I.Plus size={14} />} onClick={onNew}>Yeni Plan Oluştur</Btn>
    </div>
  );
}
