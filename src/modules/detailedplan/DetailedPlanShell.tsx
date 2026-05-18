import React, { useState } from 'react';
import { cx, I, Badge, Btn, Select, ScenarioChip } from './DPPrimitives';
import { SCENARIOS } from './dpData';
import { OverviewPanel }    from './OverviewPanel';
import { RevenuePanel }     from './RevenuePanel';
import { ExpensePanel }     from './ExpensePanel';
import { CashFlowPanel }    from './CashFlowPanel';
import { ScenarioPanel }    from './ScenarioPanel';
import { BudgetTrackPanel } from './BudgetTrackPanel';

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
  navigate?: (module: string) => void;
}

export function DetailedPlanShell({ navigate }: DetailedPlanShellProps) {
  const [active, setActive]           = useState<SectionId>('overview');
  const [scenarioId, setScenarioId]   = useState('baz');
  const [periodGran, setPeriodGran]   = useState('month');
  const [horizon, setHorizon]         = useState(24);

  return (
    <div className="h-full flex bg-enba-bg overflow-hidden">
      {/* Internal sidebar */}
      <aside className="w-[232px] bg-enba-panel border-r border-enba-line flex flex-col flex-none h-full overflow-y-auto">
        {/* Module header */}
        <div className="px-4 pt-5 pb-3 border-b border-enba-line">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-dim mb-1.5">Modül</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-enba-orange shadow-[0_0_8px] shadow-enba-orange/60" />
            <div className="text-[14px] font-semibold text-enba-text">Detaylı İş Planı</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-2 pt-3 flex-1">
          {NAV.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cx(
                  'w-full flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] transition-colors mb-0.5 relative',
                  isActive
                    ? 'bg-enba-orange/12 text-enba-orange'
                    : 'text-enba-muted hover:text-enba-text hover:bg-enba-panel-2',
                )}
              >
                {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-enba-orange rounded-r" />}
                <Icon size={16} />
                <span className="flex-1 text-left">{label}</span>
              </button>
            );
          })}

          {navigate && (
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

        {/* AI suggestion footer */}
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
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header row 1: title + actions */}
        <div className="bg-enba-panel border-b border-enba-line flex-none">
          <div className="h-[60px] flex items-center px-5 gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-[15px] font-semibold text-enba-text truncate">
                  2025-2026 Üretim &amp; Geri Dönüşüm Bütçesi
                </h1>
                <button className="text-enba-dim hover:text-enba-text flex-none" title="Plan adını düzenle">
                  <I.Edit size={13} />
                </button>
                <Badge tone="green">Aktif</Badge>
              </div>
              <div className="text-[10.5px] text-enba-dim mt-0.5 flex items-center gap-2">
                <span>v1.4</span>
                <span>·</span>
                <span>Son kaydedilme 14 dk önce</span>
                <span>·</span>
                <span>Murat K. tarafından</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-none">
              <button className="w-9 h-9 rounded-lg border border-enba-line bg-enba-panel-2 text-enba-muted hover:text-enba-text inline-flex items-center justify-center relative">
                <I.Bell size={15} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-enba-orange" />
              </button>
              <Btn variant="ghost" size="md" icon={<I.Save size={14} />}>Kaydet</Btn>
              <Btn variant="primary" size="md" icon={<I.Pdf size={14} />}>PDF</Btn>
            </div>
          </div>

          {/* Header row 2: planning controls */}
          <div className="h-[52px] flex items-center px-5 gap-3 border-t border-enba-line bg-enba-panel-2/40">
            <div className="flex items-center gap-2">
              <Select
                icon={<I.Calendar size={13} />}
                label="Dönem"
                value={periodGran}
                onChange={setPeriodGran}
                options={[
                  { value: 'month',   label: 'Aylık' },
                  { value: 'quarter', label: 'Çeyreklik' },
                  { value: 'year',    label: 'Yıllık' },
                ]}
              />
              <Select
                value={String(horizon)}
                onChange={(v) => setHorizon(Number(v))}
                options={[
                  { value: '12', label: '12 ay' },
                  { value: '18', label: '18 ay' },
                  { value: '24', label: '24 ay' },
                  { value: '36', label: '36 ay' },
                ]}
              />
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
        <main className="flex-1 overflow-y-auto p-5 grid-bg">
          <div className="max-w-[1380px] mx-auto">
            {active === 'overview'  && <OverviewPanel    scenarioId={scenarioId} periodGranularity={periodGran} />}
            {active === 'revenue'   && <RevenuePanel     scenarioId={scenarioId} periodGranularity={periodGran} />}
            {active === 'expense'   && <ExpensePanel     scenarioId={scenarioId} periodGranularity={periodGran} />}
            {active === 'cashflow'  && <CashFlowPanel    scenarioId={scenarioId} periodGranularity={periodGran} />}
            {active === 'scenario'  && <ScenarioPanel    scenarioId={scenarioId} periodGranularity={periodGran} />}
            {active === 'budget'    && <BudgetTrackPanel scenarioId={scenarioId} periodGranularity={periodGran} />}
          </div>
        </main>
      </div>
    </div>
  );
}
