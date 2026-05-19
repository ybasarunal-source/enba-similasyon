import React, { useState } from 'react';
import { usePlanSync } from '../../hooks/usePlanSync';
import { SyncBanner } from '../../components/SyncBanner';
import { DetailedPlanShell } from './DetailedPlanShell';
import { DPlan, createNewPlan } from './dpData';
import { I, cx, Badge, Btn } from './DPPrimitives';

const LOCAL_KEY = 'enba_dp2_plans';

interface Props {
  navigate?: (module: string) => void;
}

export function DetailedPlanModule({ navigate }: Props) {
  const { planlar, kaydet, sil, syncStatus, syncError } = usePlanSync<DPlan>({
    localKey: LOCAL_KEY,
    planType: 'detailed',
  });

  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const activePlan = activePlanId ? planlar.find(p => p.id === activePlanId) ?? null : null;

  const handleSave = (updated: DPlan) => {
    kaydet(planlar.map(p => p.id === updated.id ? updated : p));
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Bu plan silinecek. Emin misiniz?')) return;
    sil(id);
  };

  if (activePlan) {
    return (
      <DetailedPlanShell
        plan={activePlan}
        onSave={handleSave}
        onBack={() => setActivePlanId(null)}
        navigate={navigate}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-enba-bg overflow-y-auto">
      <SyncBanner status={syncStatus} error={syncError} onRetry={() => kaydet(planlar)} />

      <div className="flex-none border-b border-enba-line bg-enba-panel px-6 h-[60px] flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-enba-orange shadow-[0_0_8px] shadow-enba-orange/60" />
        <h1 className="text-[15px] font-semibold flex-1">Detaylı İş Planı</h1>
        <Btn variant="primary" size="md" icon={<I.Plus size={14} />} onClick={() => setShowNewModal(true)}>
          Yeni Plan
        </Btn>
      </div>

      <main className="flex-1 p-6">
        {planlar.length === 0 ? (
          <EmptyState onNew={() => setShowNewModal(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-[1380px] mx-auto">
            {planlar.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onOpen={() => setActivePlanId(plan.id)}
                onDelete={() => handleDelete(plan.id)}
              />
            ))}
          </div>
        )}
      </main>

      {showNewModal && (
        <NewPlanModal
          onConfirm={(title, year) => {
            const plan = createNewPlan(title, year);
            kaydet([...planlar, plan]);
            setActivePlanId(plan.id);
            setShowNewModal(false);
          }}
          onCancel={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
}

/* ─── PlanCard ─── */
function PlanCard({ plan, onOpen, onDelete }: { plan: DPlan; onOpen: () => void; onDelete: () => void }) {
  const tone = plan.status === 'active' ? 'green' : plan.status === 'archived' ? 'neutral' : 'amber';
  const label = plan.status === 'active' ? 'Aktif' : plan.status === 'archived' ? 'Arşiv' : 'Taslak';
  return (
    <div className="bg-enba-panel border border-enba-line rounded-xl p-5 hover:border-enba-orange/40 transition-colors flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-enba-text truncate">{plan.title}</h3>
          <div className="text-[11px] text-enba-dim mt-1">
            {plan.startYear} · {plan.horizon} ay
          </div>
        </div>
        <Badge tone={tone}>{label}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-enba-panel-2 rounded-lg px-2 py-2.5">
          <div className="text-[10px] text-enba-dim uppercase tracking-wider mb-1">Ürün</div>
          <div className="text-[13px] font-semibold">{plan.products.length}</div>
        </div>
        <div className="bg-enba-panel-2 rounded-lg px-2 py-2.5">
          <div className="text-[10px] text-enba-dim uppercase tracking-wider mb-1">Gider</div>
          <div className="text-[13px] font-semibold">{plan.fixedExpenses.length}</div>
        </div>
        <div className="bg-enba-panel-2 rounded-lg px-2 py-2.5">
          <div className="text-[10px] text-enba-dim uppercase tracking-wider mb-1">Gerçek.</div>
          <div className={cx('text-[13px] font-semibold', plan.actualsThrough > 0 ? 'text-enba-green' : 'text-enba-dim')}>
            {plan.actualsThrough} ay
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-enba-line">
        <Btn variant="primary" size="sm" className="flex-1" onClick={onOpen}>Aç</Btn>
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

/* ─── EmptyState ─── */
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-enba-panel-2 border border-enba-line flex items-center justify-center">
        <I.Budget size={28} className="text-enba-dim" />
      </div>
      <div>
        <div className="text-[15px] font-semibold text-enba-text mb-1">Henüz detaylı plan yok</div>
        <div className="text-[12.5px] text-enba-dim">Yeni bir plan oluşturarak bütçe analizi yapmaya başlayın.</div>
      </div>
      <Btn variant="primary" size="md" icon={<I.Plus size={14} />} onClick={onNew}>Yeni Plan Oluştur</Btn>
    </div>
  );
}

/* ─── NewPlanModal ─── */
function NewPlanModal({ onConfirm, onCancel }: { onConfirm: (title: string, year: number) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [year, setYear]   = useState(new Date().getFullYear());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onConfirm(title.trim(), year);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
      <div className="bg-enba-panel border border-enba-line rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-[15px] font-semibold mb-4">Yeni Detaylı Plan</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-enba-dim block mb-1.5">Plan Adı</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="2025-2026 Üretim Bütçesi"
              className="w-full bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2 text-[13px] text-enba-text focus:border-enba-orange/60 focus:ring-1 focus:ring-enba-orange/30 outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-enba-dim block mb-1.5">Başlangıç Yılı</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              min={2020}
              max={2040}
              className="w-full bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2 text-[13px] text-enba-text focus:border-enba-orange/60 focus:ring-1 focus:ring-enba-orange/30 outline-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onCancel} className="flex-1 h-9 rounded-lg border border-enba-line text-[13px] text-enba-muted hover:bg-enba-panel-2 transition-colors">
              İptal
            </button>
            <button type="submit" disabled={!title.trim()} className="flex-1 h-9 rounded-lg bg-enba-orange text-white text-[13px] font-semibold hover:bg-enba-orange/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
