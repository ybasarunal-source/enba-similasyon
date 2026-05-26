import React, { useState, useMemo, useCallback } from 'react';
import { cx, I, Badge, Btn, ScenarioChip } from './DPPrimitives';
import {
  SCENARIOS, DPlan, CostCenter, PlanCtx, Granularity, buildDisplayPeriods, PlanActuals,
  calcProductionResults, FixedExpense,
} from './dpData';
import { OverviewPanel }    from './OverviewPanel';
import { RevenuePanel }     from './RevenuePanel';
import { ExpensePanel }     from './ExpensePanel';
import { CashFlowPanel }    from './CashFlowPanel';
import { ScenarioPanel }    from './ScenarioPanel';
import { BudgetTrackPanel } from './BudgetTrackPanel';
import { WhatIfBar }        from './WhatIfBar';

type SectionId = 'overview' | 'revenue' | 'expense' | 'cashflow' | 'scenario' | 'budget';

interface NavItem {
  id: SectionId;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV: NavItem[] = [
  { id: 'overview',  label: 'Genel Bakış', Icon: I.Dashboard },
  { id: 'revenue',   label: 'Gelir Planı', Icon: I.Revenue   },
  { id: 'expense',   label: 'Gider Planı', Icon: I.Expense   },
  { id: 'cashflow',  label: 'Cash Flow',   Icon: I.Cash      },
  { id: 'scenario',  label: 'Senaryo',     Icon: I.Scenario  },
  { id: 'budget',    label: 'Bütçe Takip', Icon: I.Budget    },
];

interface DetailedPlanShellProps {
  plan?: DPlan;
  costCenters?: CostCenter[];
  onSave?: (p: DPlan) => void;
  onBack?: () => void;
  onEdit?: () => void;
  navigate?: (module: string) => void;
}

export function DetailedPlanShell({ plan, costCenters = [], onSave, onBack, onEdit, navigate }: DetailedPlanShellProps) {
  const [active, setActive]           = useState<SectionId>('overview');
  const [scenarioId, setScenarioId]   = useState('baz');
  const [granularity, setGranularity] = useState<Granularity>('monthly');
  const [horizon, setHorizon]         = useState(plan?.horizon ?? 24);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // weeklyHorizon: en az 4 hafta garanti — 0 olursa haftalık görünüm periods=[] verir
  const weeklyHorizon = Math.max(4, plan?.weeklyHorizon ?? 12);

  // Aktüel veriler — plan.actuals'tan başlatılır, local state'te tutulur
  const [actuals, setActuals] = useState<PlanActuals>(() => plan?.actuals ?? {});
  const [actualsThrough, setActualsThrough] = useState(() => plan?.actualsThrough ?? 0);

  const onActualChange = useCallback((newActuals: PlanActuals, newThrough?: number) => {
    setActuals(newActuals);
    if (newThrough !== undefined) setActualsThrough(newThrough);
    if (onSave && plan) {
      onSave({
        ...plan,
        actuals: newActuals,
        actualsThrough: newThrough ?? actualsThrough,
      });
    }
  }, [onSave, plan, actualsThrough]);

  const ctxValue = useMemo(() => {
    if (!plan) return undefined;
    const usedCcIds = new Set(plan.projects.map(p => p.costCenterId));
    const usedCostCenters = costCenters.filter(cc => usedCcIds.has(cc.id));
    const facilityExpenses = usedCostCenters.flatMap(cc => cc.fixedExpenses);

    // Proje startOffset/endOffset'i her gelir kalemine yansıt.
    // Böylece buildSeries ve revenueFor proje aktivasyon aralığını doğru uygular.
    const products = plan.projects.flatMap(p =>
      p.revenues.map(rev => ({
        ...rev,
        startOffset: Math.max(rev.startOffset ?? 0, p.startOffset),
        endOffset:
          p.endOffset !== undefined
            ? rev.endOffset !== undefined
              ? Math.min(rev.endOffset, p.endOffset)
              : p.endOffset
            : rev.endOffset,
      }))
    );

    // Proje startOffset'i proje giderlerine de yansıt.
    // productionModel varsa hammadde alış maliyetini dinamik hesapla
    // (plan eski versiyonda kaydedilmiş olsa bile doğru tutar görünür)
    const rawProjectExpenses: FixedExpense[] = plan.projects.flatMap(p =>
      p.expenses.map(e => ({
        ...e,
        startOffset: Math.max(e.startOffset ?? 0, p.startOffset),
      }))
    );

    // productionModel.inputUnitPrice girilmişse dinamik hammadde giderini upsert et
    const fixedExpenses: FixedExpense[] = (() => {
      const pm = plan.productionModel;
      if (!pm?.inputUnitPrice) return [...facilityExpenses, ...rawProjectExpenses];

      const calcResult      = calcProductionResults(pm);
      const inputMatCost    = calcResult.inputMaterialCost;
      if (inputMatCost <= 0) return [...facilityExpenses, ...rawProjectExpenses];

      const hammaddeExpense: FixedExpense = {
        id: 'input_material', mcode: 'M100', costCategory: 'purchase',
        name: 'Hammadde Alışı', group: 'Hammadde',
        monthly: inputMatCost, growth: 0,
      };

      // Zaten varsa güncelle, yoksa ekle
      const others = rawProjectExpenses.filter(e => e.id !== 'input_material');
      return [...facilityExpenses, hammaddeExpense, ...others];
    })();

    const baseInputTons = plan.productionModel?.monthlyInputTons ?? 0;

    return {
      costCenters:      usedCostCenters,
      facilityExpenses,
      projects:         plan.projects,
      products,
      fixedExpenses,
      periods:          buildDisplayPeriods(horizon, plan.startYear, plan.startMonth, granularity, weeklyHorizon),
      cashEvents:       plan.cashEvents,
      openingCash:      plan.openingCash,
      actualsThrough,
      weeklyHorizon,
      granularity,
      startYear:        plan.startYear,
      startMonth:       plan.startMonth,
      actuals,
      onActualChange,
      rampUp:           plan.rampUp,
      baseInputTons,
    };
  }, [plan, costCenters, horizon, granularity, weeklyHorizon, actuals, actualsThrough, onActualChange]);

  const shell = (
    <div className="h-full flex bg-enba-bg overflow-hidden">
      {/* Internal sidebar */}
      <aside className={cx(
        'bg-enba-panel border-r border-enba-line flex flex-col flex-none h-full overflow-y-auto transition-all duration-200',
        sidebarOpen ? 'w-[232px]' : 'w-12',
      )}>
        {/* Module header / toggle */}
        <div className={cx(
          'flex items-center border-b border-enba-line flex-none',
          sidebarOpen ? 'h-[60px] px-4 gap-2' : 'h-[60px] justify-center',
        )}>
          {sidebarOpen && (
            <>
              <span className="w-2 h-2 rounded-full bg-enba-orange shadow-[0_0_8px] shadow-enba-orange/60 flex-none" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.14em] text-enba-dim leading-none mb-0.5">Modül</div>
                <div className="text-[13px] font-semibold text-enba-text truncate">Detaylı İş Planı</div>
              </div>
            </>
          )}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? 'Menüyü gizle' : 'Menüyü göster'}
            className="w-7 h-7 rounded-md text-enba-muted hover:text-enba-text hover:bg-enba-panel-2 inline-flex items-center justify-center flex-none transition-colors"
          >
            <I.Chevron size={13} className={cx('transition-transform duration-200', sidebarOpen ? 'rotate-90' : '-rotate-90')} />
          </button>
        </div>

        {/* Nav */}
        <nav className={cx('pt-2 flex-1', sidebarOpen ? 'px-2' : 'px-1.5')}>
          {NAV.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                title={sidebarOpen ? undefined : label}
                className={cx(
                  'w-full flex items-center rounded-lg transition-colors mb-0.5 relative',
                  sidebarOpen ? 'gap-3 px-3 h-9 text-[13px]' : 'justify-center h-9',
                  isActive
                    ? 'bg-enba-orange/12 text-enba-orange'
                    : 'text-enba-muted hover:text-enba-text hover:bg-enba-panel-2',
                )}
              >
                {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-enba-orange rounded-r" />}
                <Icon size={16} />
                {sidebarOpen && <span className="flex-1 text-left">{label}</span>}
              </button>
            );
          })}

          {navigate && sidebarOpen && (
            <>
              <div className="mt-4 mb-2 px-3 text-[10.5px] uppercase tracking-[0.14em] text-enba-dim">Diğer Modüller</div>
              <button
                onClick={() => navigate('fastplan')}
                className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] text-enba-muted hover:text-enba-text hover:bg-enba-panel-2 mb-0.5"
              >
                <I.Bolt size={16} />
                <span className="flex-1 text-left">FastPlan</span>
                <Badge tone="orange">Hızlı</Badge>
              </button>
            </>
          )}
        </nav>

        {/* AI suggestion footer — only when expanded */}
        {sidebarOpen && (
          <div className="m-3 p-3 rounded-lg bg-gradient-to-br from-enba-orange/15 to-transparent border border-enba-orange/25">
            <div className="flex items-center gap-2 mb-2">
              <I.Sparkles size={14} className="text-enba-orange" />
              <span className="text-[11.5px] font-semibold text-enba-orange">AI Öneri</span>
            </div>
            <p className="text-[11px] text-enba-muted leading-snug">
              Q3 2025'te PET Granül talebinde mevsimsel artış görülüyor. Hacmi{' '}
              <span className="text-enba-text font-medium">%8</span> artırarak{' '}
              <span className="text-enba-text font-medium">₺640K</span> ek gelir.
            </p>
            <button className="mt-2 text-[11px] text-enba-orange font-medium hover:underline">İncele →</button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header row 1: title + actions */}
        <div className="bg-enba-panel border-b border-enba-line flex-none">
          <div className="h-[60px] flex items-center px-5 gap-2">
            {/* Breadcrumb: ← Planlar / Plan Adı
                App'in global ← → tuşları modüller arası geçiş yapar.
                Bu breadcrumb modül içi navigasyon için — ikisini ayırt eder. */}
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] font-medium text-enba-muted hover:text-enba-orange hover:bg-enba-orange/8 transition-colors flex-none"
                title="Plan listesine dön"
              >
                <I.Chevron size={12} className="rotate-90 flex-none" />
                <span>Planlar</span>
              </button>
            )}
            {onBack && (
              <span className="text-enba-line text-[16px] font-light select-none flex-none">/</span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-[15px] font-semibold text-enba-text truncate">
                  {plan?.title ?? 'Detaylı İş Planı'}
                </h1>
                <Badge tone={plan?.status === 'active' ? 'green' : plan?.status === 'archived' ? 'neutral' : 'amber'}>
                  {plan?.status === 'active' ? 'Aktif' : plan?.status === 'archived' ? 'Arşiv' : 'Taslak'}
                </Badge>
              </div>
              <div className="text-[10.5px] text-enba-dim mt-0.5 flex items-center gap-2">
                <span>{plan?.startYear ?? 2025}</span>
                <span>·</span>
                <span>{plan?.horizon ?? 24} ay</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-none">
              {onEdit && (
                <Btn variant="ghost" size="md" icon={<I.Edit size={14} />} onClick={onEdit}>Düzenle</Btn>
              )}
              {onSave && plan && (
                <Btn variant="ghost" size="md" icon={<I.Save size={14} />} onClick={() => onSave(plan)}>Kaydet</Btn>
              )}
              <Btn variant="primary" size="md" icon={<I.Pdf size={14} />}>PDF</Btn>
            </div>
          </div>

          {/* Header row 2: planning controls */}
          <div className="h-[52px] flex items-center px-5 gap-3 border-t border-enba-line bg-enba-panel-2/40">
            <div className="flex items-center gap-2">
              {/* Granularity toggle */}
              <div className="flex rounded-lg border border-enba-line overflow-hidden h-8 text-[12px] font-medium">
                {([
                  { id: 'weekly',    label: 'Haftalık' },
                  { id: 'monthly',   label: 'Aylık'    },
                  { id: 'quarterly', label: 'Çeyreklik'},
                  { id: 'annual',    label: 'Yıllık'   },
                ] as { id: Granularity; label: string }[]).map((g, idx, arr) => (
                  <button
                    key={g.id}
                    onClick={() => setGranularity(g.id)}
                    className={cx(
                      'px-3 h-full transition-colors',
                      idx < arr.length - 1 ? 'border-r border-enba-line' : '',
                      granularity === g.id
                        ? 'bg-enba-orange/12 text-enba-orange'
                        : 'text-enba-muted hover:text-enba-text hover:bg-enba-panel-2',
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              {/* Horizon selector */}
              <select
                value={horizon}
                onChange={e => setHorizon(Number(e.target.value))}
                className="h-8 px-2 rounded-lg border border-enba-line bg-enba-panel text-[12px] text-enba-text focus:outline-none focus:border-enba-orange"
              >
                <option value={12}>12 ay</option>
                <option value={18}>18 ay</option>
                <option value={24}>24 ay</option>
                <option value={36}>36 ay</option>
              </select>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.14em] text-enba-dim mr-1">Senaryo</span>
              <div className="flex items-center gap-1.5">
                {Object.values(SCENARIOS).map(s => (
                  <ScenarioChip
                    key={s.id}
                    scenario={s}
                    active={scenarioId === s.id}
                    onClick={() => setScenarioId(s.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 grid-bg">
            <div className="max-w-[1380px] mx-auto">
              {active === 'overview'  && <OverviewPanel    scenarioId={scenarioId} periodGranularity={granularity} />}
              {active === 'revenue'   && <RevenuePanel     scenarioId={scenarioId} periodGranularity={granularity} />}
              {active === 'expense'   && <ExpensePanel     scenarioId={scenarioId} periodGranularity={granularity} />}
              {active === 'cashflow'  && <CashFlowPanel    scenarioId={scenarioId} periodGranularity={granularity} />}
              {active === 'scenario'  && <ScenarioPanel    scenarioId={scenarioId} periodGranularity={granularity} />}
              {active === 'budget'    && <BudgetTrackPanel scenarioId={scenarioId} periodGranularity={granularity} />}
            </div>
          </div>
          {/* Anlık Simülasyon — sadece Genel Bakış'ta görünür */}
          {active === 'overview' && <WhatIfBar scenarioId={scenarioId} productionModel={plan?.productionModel} />}
        </main>
      </div>
    </div>
  );

  if (ctxValue) {
    return <PlanCtx.Provider value={ctxValue}>{shell}</PlanCtx.Provider>;
  }
  return shell;
}
