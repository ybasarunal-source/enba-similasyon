import React, { useState, useEffect, useRef } from 'react';
import { usePlanSync } from '../../hooks/usePlanSync';
import { SyncBanner } from '../../components/SyncBanner';
import { DetailedPlanShell } from './DetailedPlanShell';
import { DPlanWizard } from './DPlanWizard';
import { DPlan, migratePlanFormat } from './dpData';
import { I, cx, Badge, Btn } from './DPPrimitives';

const LOCAL_KEY = 'enba_dp2_plans';

interface Props {
  navigate?: (module: string) => void;
}

type View = 'list' | 'wizard' | 'shell';

export function DetailedPlanModule({ navigate }: Props) {
  const { planlar, kaydet, sil, syncStatus, syncError } = usePlanSync<DPlan>({
    localKey: LOCAL_KEY,
    planType: 'detailed',
  });

  const [view, setView]             = useState<View>('list');
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const migratedOnce = useRef(false);

  // Eski format planları (facilityExpenses) bir kez migrate et
  useEffect(() => {
    if (migratedOnce.current || planlar.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const needsMigration = planlar.some((p: any) => !p.facilities);
    if (needsMigration) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      kaydet(planlar.map((p: any) => migratePlanFormat(p)));
    }
    migratedOnce.current = true;
  }, [planlar.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activePlan = activePlanId ? migratePlanFormat(planlar.find(p => p.id === activePlanId) as any) ?? null : null;

  const upsert = (updated: DPlan) => {
    const exists = planlar.some(p => p.id === updated.id);
    kaydet(exists ? planlar.map(p => p.id === updated.id ? updated : p) : [...planlar, updated]);
  };

  const handleShellSave = (updated: DPlan) => upsert(updated);

  const handleWizardSave = (plan: DPlan) => {
    upsert(plan);
    setActivePlanId(plan.id);
  };

  const handleWizardDone = (plan: DPlan) => {
    upsert(plan);
    setActivePlanId(plan.id);
    setView('shell');
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Bu plan silinecek. Emin misiniz?')) return;
    sil(id);
    if (activePlanId === id) { setActivePlanId(null); setView('list'); }
  };

  const openPlan = (plan: DPlan) => {
    setActivePlanId(plan.id);
    setView(plan.status === 'draft' ? 'wizard' : 'shell');
  };

  /* ── Sihirbaz görünümü ── */
  if (view === 'wizard') {
    return (
      <DPlanWizard
        initialPlan={activePlan ?? undefined}
        onDone={handleWizardDone}
        onSave={handleWizardSave}
        onCancel={() => { setView('list'); setActivePlanId(null); }}
      />
    );
  }

  const openWizardForEdit = (plan: DPlan) => { setActivePlanId(plan.id); setView('wizard'); };

  /* ── Shell görünümü ── */
  if (view === 'shell' && activePlan) {
    return (
      <DetailedPlanShell
        plan={activePlan}
        onSave={handleShellSave}
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
        {planlar.length === 0 ? (
          <EmptyState onNew={() => { setActivePlanId(null); setView('wizard'); }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-[1380px] mx-auto">
            {planlar.map(plan => (
              <PlanCard
                key={plan.id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                plan={migratePlanFormat(plan as any)}
                onOpen={() => openPlan(plan)}
                onEdit={() => openWizardForEdit(plan)}
                onDelete={() => handleDelete(plan.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── PlanCard ─── */
function PlanCard({ plan, onOpen, onEdit, onDelete }: { plan: DPlan; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const isDraft       = plan.status === 'draft';
  const tone          = plan.status === 'active' ? 'green' : plan.status === 'archived' ? 'neutral' : 'amber';
  const label         = plan.status === 'active' ? 'Aktif' : plan.status === 'archived' ? 'Arşiv' : 'Taslak';
  const activeProjects = plan.projects.filter(p => p.isActive).length;
  const totalExpenses  = plan.facilities.reduce((s, f) => s + f.fixedExpenses.length, 0);

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
        <MiniStat label="Tesis Gider" value={String(totalExpenses)} sub={plan.facilities.length > 1 ? `${plan.facilities.length} merkez` : undefined} />
        <MiniStat label="Gerçek." value={`${plan.actualsThrough} ay`} accent={plan.actualsThrough > 0} />
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-enba-line">
        <Btn
          variant={isDraft ? 'outline' : 'primary'}
          size="sm"
          className="flex-1"
          icon={isDraft ? <I.Chevron size={12} className="-rotate-90" /> : undefined}
          onClick={onOpen}
        >
          {isDraft ? 'Devam Et' : 'Aç'}
        </Btn>
        <button onClick={onEdit}
          className="w-8 h-8 rounded-lg text-enba-dim hover:text-enba-orange hover:bg-enba-orange/10 inline-flex items-center justify-center transition-colors"
          title="Düzenle">
          <I.Edit size={13} />
        </button>
        <button onClick={onDelete}
          className="w-8 h-8 rounded-lg text-enba-dim hover:text-enba-red hover:bg-enba-red/10 inline-flex items-center justify-center transition-colors"
          title="Sil">
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
