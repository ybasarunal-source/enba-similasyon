import React, { useState, useMemo, useCallback } from 'react';
import { cx, I, Badge, Btn, ScenarioChip } from './DPPrimitives';
import {
  SCENARIOS, DPlan, CostCenter, PlanCtx, Granularity, buildDisplayPeriods, PlanActuals,
  calcProductionResults, FixedExpense, fmtTL,
} from './dpData';
import { buildPnLRows, PNL_SECTIONS, getMcodeLabel } from './pnlStructure';
import { OverviewPanel }    from './OverviewPanel';
import { RevenuePanel }     from './RevenuePanel';
import { ExpensePanel }     from './ExpensePanel';
import { CashFlowPanel }    from './CashFlowPanel';
import { ScenarioPanel }    from './ScenarioPanel';
import { BudgetTrackPanel } from './BudgetTrackPanel';
import { WhatIfBar }        from './WhatIfBar';
import { PnLPanel }         from './PnLPanel';

type SectionId = 'pnl' | 'overview' | 'revenue' | 'expense' | 'cashflow' | 'scenario' | 'budget';

interface NavItem {
  id: SectionId;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV: NavItem[] = [
  { id: 'pnl',      label: 'P&L',         Icon: I.List      },
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
  onCreateVersion?: () => void;
  navigate?: (module: string) => void;
}

export function DetailedPlanShell({ plan, costCenters = [], onSave, onBack, onEdit, onCreateVersion, navigate }: DetailedPlanShellProps) {
  const [active, setActive]           = useState<SectionId>('pnl');
  const [scenarioId, setScenarioId]   = useState('baz');
  const [granularity, setGranularity] = useState<Granularity>('monthly');
  const [horizon, setHorizon]         = useState(plan?.horizon ?? 24);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // weeklyHorizon: en az 4 hafta garanti — 0 olursa haftalık görünüm periods=[] verir
  const weeklyHorizon = Math.max(4, plan?.weeklyHorizon ?? 12);

  // ─── PDF Export ──────────────────────────────────────────────────────────────
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const pdfCcExpenses = useMemo(() => {
    if (!plan) return [];
    const usedCcIds = new Set(plan.projects.map(p => p.costCenterId));
    return costCenters
      .filter(cc => usedCcIds.has(cc.id))
      .flatMap(cc => cc.fixedExpenses);
  }, [plan, costCenters]);

  const pdfCalc = useMemo(() =>
    plan?.productionModel ? calcProductionResults(plan.productionModel) : null,
  [plan?.productionModel]);

  const pdfMonthly = useMemo((): Record<string, number> => {
    if (!plan) return {};
    const rows = buildPnLRows(pdfCalc, plan.mcodeEntries ?? [], pdfCcExpenses);
    const m: Record<string, number> = {};
    for (const r of rows) {
      if (r.type === 'item') m[r.mcode] = r.monthly;
    }
    for (const section of PNL_SECTIONS) {
      let total = 0;
      for (const item of section.items) {
        const val = m[item.mcode] ?? 0;
        total += item.isExpense ? -val : val;
      }
      if (section.subtotalMcode) m[section.subtotalMcode] = total;
    }
    m['M299'] = (m['M179'] ?? 0) + (m['M249'] ?? 0);
    m['M399'] = m['M299'] + (m['M369'] ?? 0);
    const bakimCevre = (m['M509'] ?? 0) + (m['M529'] ?? 0);
    m['M769'] = m['M399'] + (m['M419'] ?? 0) + (m['M489'] ?? 0) + (m['M689'] ?? 0) - bakimCevre + (m['M739'] ?? 0);
    m['M799'] = m['M769'] + (m['M789'] ?? 0);
    m['M879'] = m['M799'] + (m['M869'] ?? 0);
    m['M899'] = m['M879'] + (m['M889'] ?? 0);
    const vergi = m['M899'] > 0 ? m['M899'] * 0.22 : 0;
    m['M909'] = -vergi;
    m['M919'] = m['M899'] - vergi;
    m['M999'] = m['M919'];
    return m;
  }, [pdfCalc, plan?.mcodeEntries, pdfCcExpenses, plan]);

  const exportPdf = async () => {
    if (!plan) return;
    setIsPdfGenerating(true);
    await new Promise(r => setTimeout(r, 400));
    const el = document.getElementById('dp-pdf-container');
    if (!el) { setIsPdfGenerating(false); return; }
    const opt = {
      margin: [8, 8, 12, 8],
      filename: `Enba_Plan_${(plan.title ?? 'plan').replace(/[^a-zA-Z0-9ÇĞİÖŞÜçğışöşü]/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.97 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    const { default: html2pdf } = await import('html2pdf.js');
    html2pdf().set(opt).from(el).save().then(() => setIsPdfGenerating(false));
  };

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
              {!onEdit && onCreateVersion && (
                <Btn variant="outline" size="md" icon={<I.Copy size={14} />} onClick={onCreateVersion}>Yeni Versiyon</Btn>
              )}
              {onSave && plan && (
                <Btn variant="ghost" size="md" icon={<I.Save size={14} />} onClick={() => onSave(plan)}>Kaydet</Btn>
              )}
              <Btn
                variant="primary" size="md"
                icon={<I.Pdf size={14} />}
                onClick={exportPdf}
                disabled={isPdfGenerating || !plan}
              >
                {isPdfGenerating ? 'Hazırlanıyor…' : 'PDF'}
              </Btn>
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
              {active === 'pnl'       && <PnLPanel plan={plan} onSave={onSave} scenarioId={scenarioId} granularity={granularity} horizon={horizon} />}
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

      {/* ─── Gizli PDF Container ─────────────────────────────────────────────── */}
      {plan && (
        <DPPdfContainer
          plan={plan}
          pdfCalc={pdfCalc}
          pdfMonthly={pdfMonthly}
        />
      )}
    </div>
  );

  if (ctxValue) {
    return <PlanCtx.Provider value={ctxValue}>{shell}</PlanCtx.Provider>;
  }
  return shell;
}

// ─── PDF Bileşeni ─────────────────────────────────────────────────────────────
// Ekran dışında (left:-9999px) render edilir, html2pdf bunu yakalar.
// Tailwind class'ları html2canvas'ta çalışmaz → tüm stil inline.

type PdfCalcResult = ReturnType<typeof calcProductionResults>;

function DPPdfContainer({
  plan,
  pdfCalc,
  pdfMonthly,
}: {
  plan:        DPlan;
  pdfCalc:     PdfCalcResult | null;
  pdfMonthly:  Record<string, number>;
}) {
  const S = {
    page:         { position: 'fixed' as const, left: -9999, top: 0, width: 794, background: '#ffffff', fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", color: '#111827', padding: '40px 48px' },
    brand:        { fontSize: 9, fontWeight: 900, color: '#E35205', letterSpacing: 3, textTransform: 'uppercase' as const, marginBottom: 4 },
    title:        { fontSize: 20, fontWeight: 900, letterSpacing: -0.5, marginBottom: 6 },
    meta:         { display: 'flex', gap: 20, fontSize: 10, color: '#6b7280', marginBottom: 0 },
    kpiGrid:      { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 },
    kpiCard:      { background: '#f9fafb', borderRadius: 10, padding: '12px 14px' },
    kpiLabel:     { fontSize: 8, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: 2, marginBottom: 3 },
    sectionHead:  { padding: '3px 8px', marginBottom: 2 },
    sectionLabel: { fontSize: 9, fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: 1 },
    row:          { display: 'grid', gridTemplateColumns: '72px 1fr 100px 100px', borderBottom: '1px solid #f3f4f6', padding: '3px 8px 3px 16px' },
    colCode:      { fontSize: 8, fontFamily: 'monospace', color: '#9ca3af' },
    colLabel:     { fontSize: 9, color: '#374151' },
    colVal:       (v: number) => ({ fontSize: 9, fontWeight: 700, textAlign: 'right' as const, color: v < 0 ? '#dc2626' : '#111827', fontVariantNumeric: 'tabular-nums' }),
    colYil:       { fontSize: 9, textAlign: 'right' as const, color: '#6b7280', fontVariantNumeric: 'tabular-nums' },
    subtotalRow:  (color: string) => ({ display: 'grid', gridTemplateColumns: '72px 1fr 100px 100px', background: '#f9fafb', padding: '4px 8px', borderTop: '1px solid #e5e7eb', marginBottom: 4 }),
    milestoneRow: (main: boolean, accent: string) => ({
      display: 'grid', gridTemplateColumns: '72px 1fr 100px 100px',
      background: main ? accent + '12' : '#f9fafb',
      borderLeft: main ? `3px solid ${accent}` : 'none',
      padding: '5px 8px', marginBottom: 3, borderRadius: 4,
    }),
    footer:       { borderTop: '1px solid #e5e7eb', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#9ca3af', marginTop: 20 },
  };

  const SECTION_COLORS: Record<string, string> = {
    hasilat: '#059669', satis_gider: '#f97316', malzeme: '#ef4444',
    enerji: '#d97706', personel: '#2563eb', bakim_cevre: '#0d9488',
    genel_gider: '#64748b', diger_gelir: '#16a34a', amortisman: '#6b7280',
    finansman: '#7c3aed', olagandisi: '#9ca3af', vergi: '#9ca3af',
  };

  const g = (mcode: string) => pdfMonthly[mcode] ?? 0;
  const rev = g('M179');
  const ebitda = g('M769');
  const ebit = g('M799');
  const netKar = g('M919');

  const MILESTONES = [
    { mcode: 'M179', label: 'TOPLAM NET SATIŞLAR',    main: false, accent: '#059669' },
    { mcode: 'M299', label: 'NET GELİR',              main: false, accent: '#059669' },
    { mcode: 'M399', label: 'BRÜT KATKI PAYI',        main: false, accent: '#059669' },
    { mcode: 'M769', label: 'EBITDA',                 main: true,  accent: '#E35205' },
    { mcode: 'M799', label: 'EBIT',                   main: false, accent: '#2563eb' },
    { mcode: 'M879', label: 'OLAĞAN FAALİYET KARI',   main: false, accent: '#059669' },
    { mcode: 'M899', label: 'VERGİ ÖNCESİ KAR (EBT)', main: false, accent: '#059669' },
    { mcode: 'M919', label: 'NET KAR',                main: true,  accent: '#059669' },
  ];

  const statusLabel = plan.status === 'active' ? 'Aktif' : plan.status === 'archived' ? 'Arşiv' : 'Taslak';
  const today = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div id="dp-pdf-container" style={S.page}>
      {/* Başlık */}
      <div style={{ borderBottom: '3px solid #E35205', paddingBottom: 14, marginBottom: 20 }}>
        <div style={S.brand}>Enba Simulasyon — Detaylı İş Planı</div>
        <div style={S.title}>{plan.title || 'İsimsiz Plan'}</div>
        {plan.description && (
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{plan.description}</div>
        )}
        <div style={S.meta}>
          <span>Başlangıç: {plan.startYear}/{String(plan.startMonth ?? 1).padStart(2, '0')}</span>
          <span>Süre: {plan.horizon ?? 24} ay</span>
          <span>Durum: {statusLabel}</span>
          <span style={{ marginLeft: 'auto' }}>{today}</span>
        </div>
      </div>

      {/* KPI Özet */}
      <div style={S.kpiGrid}>
        {([
          { label: 'Net Satışlar', val: rev,    color: '#059669', sub: '/ay' },
          { label: 'EBITDA',       val: ebitda, color: ebitda >= 0 ? '#E35205' : '#dc2626', sub: rev > 0 ? `%${(ebitda / rev * 100).toFixed(1)} marj` : '/ay' },
          { label: 'EBIT',         val: ebit,   color: ebit   >= 0 ? '#2563eb' : '#dc2626', sub: '/ay' },
          { label: 'Net Kâr',      val: netKar, color: netKar >= 0 ? '#059669' : '#dc2626', sub: rev > 0 ? `%${(netKar / rev * 100).toFixed(1)} marj` : '/ay' },
        ] as { label: string; val: number; color: string; sub: string }[]).map(k => (
          <div key={k.label} style={S.kpiCard}>
            <div style={S.kpiLabel}>{k.label}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: k.color, fontVariantNumeric: 'tabular-nums' }}>
              {fmtTL(k.val, { compact: true })}
            </div>
            <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Üretim Özeti */}
      {pdfCalc && (
        <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 16px', marginBottom: 20, border: '1px solid #d1fae5' }}>
          <div style={{ fontSize: 8, fontWeight: 900, color: '#059669', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
            Üretim Modeli
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {([
              { label: 'Aylık Girdi',   val: `${pdfCalc.grossInputTons.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ton` },
              { label: 'Ana Çıktı',     val: `${pdfCalc.productOutputs.reduce((s, p) => s + p.tons, 0).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ton` },
              { label: 'Enerji Gideri', val: fmtTL(pdfCalc.totalEnergyCost, { compact: true }) + '/ay' },
              { label: 'Personel',      val: fmtTL(pdfCalc.totalLaborCost, { compact: true }) + '/ay' },
            ] as { label: string; val: string }[]).map(it => (
              <div key={it.label}>
                <div style={{ fontSize: 8, color: '#6b7280', marginBottom: 2 }}>{it.label}</div>
                <div style={{ fontSize: 12, fontWeight: 900 }}>{it.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* P&L Tablosu */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>
          Kâr / Zarar Tablosu — Aylık Ortalama
        </div>
        {/* Kolon başlıkları */}
        <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 100px 100px', borderBottom: '2px solid #e5e7eb', paddingBottom: 3, marginBottom: 4 }}>
          <span style={{ fontSize: 8, fontWeight: 900, color: '#9ca3af' }}>M-Kodu</span>
          <span style={{ fontSize: 8, fontWeight: 900, color: '#9ca3af' }}>Kalem</span>
          <span style={{ fontSize: 8, fontWeight: 900, color: '#9ca3af', textAlign: 'right' }}>Aylık</span>
          <span style={{ fontSize: 8, fontWeight: 900, color: '#9ca3af', textAlign: 'right' }}>Yıllık</span>
        </div>

        {/* Bölümler */}
        {PNL_SECTIONS.map(section => {
          const color = SECTION_COLORS[section.id] ?? '#6b7280';
          const visibleItems = section.items.filter(item => (pdfMonthly[item.mcode] ?? 0) !== 0);
          const subtotalVal = section.subtotalMcode ? g(section.subtotalMcode) : 0;
          if (visibleItems.length === 0 && subtotalVal === 0) return null;

          return (
            <div key={section.id} style={{ marginBottom: 6 }}>
              <div style={{ ...S.sectionHead, background: color + '15', borderLeft: `3px solid ${color}` }}>
                <span style={{ ...S.sectionLabel, color }}>{section.label}</span>
              </div>
              {visibleItems.map(item => {
                const raw = pdfMonthly[item.mcode] ?? 0;
                const display = item.isExpense && raw !== 0 ? -Math.abs(raw) : raw;
                return (
                  <div key={item.mcode} style={S.row}>
                    <span style={S.colCode}>{item.mcode}</span>
                    <span style={S.colLabel}>{getMcodeLabel(item.mcode)}</span>
                    <span style={S.colVal(display)}>
                      {display !== 0 ? fmtTL(display, { compact: true }) : '—'}
                    </span>
                    <span style={S.colYil}>
                      {display !== 0 ? fmtTL(display * 12, { compact: true }) : '—'}
                    </span>
                  </div>
                );
              })}
              {section.subtotalMcode && subtotalVal !== 0 && (
                <div style={S.subtotalRow(color)}>
                  <span style={{ ...S.colCode, color }}>{section.subtotalMcode}</span>
                  <span style={{ fontSize: 9, fontWeight: 900 }}>Toplam</span>
                  <span style={{ ...S.colVal(subtotalVal), fontSize: 10 }}>
                    {fmtTL(subtotalVal, { compact: true })}
                  </span>
                  <span style={S.colYil}>{fmtTL(subtotalVal * 12, { compact: true })}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Milestone toplamlar */}
        <div style={{ marginTop: 10, borderTop: '2px solid #e5e7eb', paddingTop: 8 }}>
          {MILESTONES.map(({ mcode, label, main, accent }) => {
            const val = g(mcode);
            return (
              <div key={mcode} style={S.milestoneRow(main, accent)}>
                <span style={{ fontSize: 8, fontFamily: 'monospace', color: '#9ca3af' }}>{mcode}</span>
                <span style={{ fontSize: main ? 10 : 9, fontWeight: 900, color: '#111827' }}>{label}</span>
                <span style={{ fontSize: main ? 11 : 9, fontWeight: 900, textAlign: 'right', color: val >= 0 ? accent : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtTL(val, { compact: true })}
                </span>
                <span style={{ fontSize: 9, textAlign: 'right', color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtTL(val * 12, { compact: true })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <span>Enba Simulasyon — uygulama.basarunal.com</span>
        <span>Oluşturulma: {today}</span>
      </div>
    </div>
  );
}
