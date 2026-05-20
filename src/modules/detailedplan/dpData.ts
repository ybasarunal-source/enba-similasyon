// DetailedPlan — data model, mock data, and calculation helpers
import React from 'react';

export interface Product {
  id: string;
  mcode: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  priceGrowth: number;
  seasonality: number[];
  volume: number;
  volumeGrowth: number;
  varCostRatio: number;
  color: string;
}

export interface FixedExpense {
  id: string;
  mcode: string;
  costCategory: 'purchase' | 'production' | 'overhead' | 'facility';
  name: string;
  group: string;
  monthly: number;
  growth: number;
  startOffset?: number; // 0 = plan başından, 2 = 3. aydan itibaren
  unit?: string;
  unitPrice?: number;
  monthlyQty?: number;
}

export interface ActiveProject {
  id: string;
  name: string;
  color: string;
  allocationWeight: number; // göreceli ağırlık (1, 2, 3 …)
  startOffset: number;      // 0-indexed, hangi ayda başlar
  endOffset?: number;       // 0-indexed exclusive; undefined = horizon sonuna kadar
  expenses: FixedExpense[]; // projeye özgü giderler
  revenues: Product[];      // proje gelirleri
}

export interface Scenario {
  id: string;
  label: string;
  color: string;
  rev: number;
  cost: number;
  hint: string;
}

export interface Period {
  key: string;
  label: string;
  m: number;
  y: number;
}

export interface CashEvent {
  id: string;
  name: string;
  type: 'investing' | 'financing';
  months: { idx: number; amount: number }[];
}

// ─── Plan veri modeli ────────────────────────────────────────────────────────
export interface DPlan {
  id: string;
  supabaseId?: string;
  title: string;
  baslik: string;
  status: 'draft' | 'active' | 'archived';
  year: number;
  startYear: number;
  startMonth: number;
  horizon: number;
  openingCash: number;
  actualsThrough: number;
  facilityExpenses: FixedExpense[]; // tesis sabit giderleri (her zaman akar)
  projects: ActiveProject[];        // projeler (gider + gelir)
  cashEvents: CashEvent[];
}

export interface SeriesPoint extends Period {
  idx: number;
  revenue: number;
  varCost: number;
  fixCost: number;
  opex: number;
  ebitda: number;
  net: number;
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────
export const MONTHS_TR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

export const buildMonths = (count: number, startYear = 2025, startMonth = 0): Period[] => {
  const out: Period[] = [];
  for (let i = 0; i < count; i++) {
    const m = (startMonth + i) % 12;
    const y = startYear + Math.floor((startMonth + i) / 12);
    out.push({ key: `${y}-${String(m+1).padStart(2,'0')}`, label: `${MONTHS_TR[m]} ${String(y).slice(2)}`, m, y });
  }
  return out;
};

export const PERIODS: Period[] = buildMonths(24, 2025, 0);

// Proje o dönemde aktif mi?
export const isProjectActive = (p: ActiveProject, i: number): boolean =>
  i >= p.startOffset && (p.endOffset === undefined || i < p.endOffset);

// Projenin tesis giderlerinden aldığı pay (0–1)
export const facilityShareFor = (project: ActiveProject, i: number, allProjects: ActiveProject[]): number => {
  if (!isProjectActive(project, i)) return 0;
  const active = allProjects.filter(p => isProjectActive(p, i));
  const total  = active.reduce((s, p) => s + p.allocationWeight, 0);
  return total === 0 ? 0 : project.allocationWeight / total;
};

export const SCENARIOS: Record<string, Scenario> = {
  baz:      { id: 'baz',      label: 'Baz',      color: '#E35205', rev: 1.00, cost: 1.00, hint: 'Mevcut trendin devamı.' },
  iyimser:  { id: 'iyimser',  label: 'İyimser',  color: '#3DBE7C', rev: 1.12, cost: 0.96, hint: 'Talep artışı + verimlilik kazanımı.' },
  kotumser: { id: 'kotumser', label: 'Kötümser', color: '#E5484D', rev: 0.84, cost: 1.08, hint: 'Daralan talep + maliyet baskısı.' },
};

export const OPENING_CASH    = 0;
export const ACTUALS_THROUGH = 0;

// Boş mock veriler — paneller context'ten okur, gerçek plan yokken boş görünür
export const PRODUCTS: Product[]       = [];
export const FIXED_EXPENSES: FixedExpense[] = [];
export const CASH_EVENTS: CashEvent[]  = [];

// ─── Hesaplama yardımcıları ───────────────────────────────────────────────────

export const monthlyPriceFor = (p: Product, i: number) =>
  p.price * Math.pow(1 + p.priceGrowth, i / 12);

export const monthlyVolumeFor = (p: Product, i: number) => {
  const seas = p.seasonality[i % 12];
  return p.volume * Math.pow(1 + p.volumeGrowth, i / 12) * seas;
};

export const revenueFor = (p: Product, i: number, scen: Scenario = SCENARIOS.baz) =>
  monthlyPriceFor(p, i) * monthlyVolumeFor(p, i) * scen.rev;

export const varCostFor = (p: Product, i: number, scen: Scenario = SCENARIOS.baz) =>
  revenueFor(p, i, scen) * p.varCostRatio * scen.cost;

export const fixedCostFor = (e: FixedExpense, i: number, scen: Scenario = SCENARIOS.baz) => {
  if (i < (e.startOffset ?? 0)) return 0;
  const j = i - (e.startOffset ?? 0);
  return e.monthly * Math.pow(1 + e.growth, j / 12) * scen.cost;
};

export const buildSeries = (
  products: Product[], fixedExpenses: FixedExpense[], periods: Period[],
  scen: Scenario = SCENARIOS.baz,
): SeriesPoint[] =>
  periods.map((p, i) => {
    const revenue = products.reduce((s, prod) => s + revenueFor(prod, i, scen), 0);
    const varCost = products.reduce((s, prod) => s + varCostFor(prod, i, scen), 0);
    const fixCost = fixedExpenses.reduce((s, e) => s + fixedCostFor(e, i, scen), 0);
    const opex    = varCost + fixCost;
    const ebitda  = revenue - opex;
    const tax     = Math.max(0, ebitda) * 0.22;
    const net     = ebitda - tax;
    return { ...p, idx: i, revenue, varCost, fixCost, opex, ebitda, net };
  });

export const cashFlowFor = (
  i: number, scen: Scenario,
  products: Product[], fixedExpenses: FixedExpense[], cashEvents: CashEvent[],
) => {
  const rev     = products.reduce((s, p) => s + revenueFor(p, i, scen), 0);
  const varc    = products.reduce((s, p) => s + varCostFor(p, i, scen), 0);
  const fixc    = fixedExpenses.reduce((s, e) => s + fixedCostFor(e, i, scen), 0);
  const ebitda  = rev - varc - fixc;
  const tax     = Math.max(0, ebitda) * 0.22;
  const operating = ebitda - tax;
  let investing = 0, financing = 0;
  cashEvents.forEach(ev => {
    const m = ev.months.find(x => x.idx === i);
    if (m) { if (ev.type === 'investing') investing += m.amount; else financing += m.amount; }
  });
  return { operating, investing, financing, net: operating + investing + financing };
};

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619 >>> 0;
  return h / 0xffffffff;
};

export const actualRevenueFor = (p: Product, i: number, scen: Scenario = SCENARIOS.baz, actualsThrough = ACTUALS_THROUGH): number | null => {
  if (i >= actualsThrough) return null;
  const n = (hash(p.id + '|r|' + i) - 0.5) * 0.28;
  return revenueFor(p, i, scen) * (1 + n);
};

export const actualVarCostFor = (p: Product, i: number, scen: Scenario = SCENARIOS.baz, actualsThrough = ACTUALS_THROUGH): number | null => {
  if (i >= actualsThrough) return null;
  const rev = actualRevenueFor(p, i, scen, actualsThrough)!;
  const n   = (hash(p.id + '|c|' + i) - 0.4) * 0.20;
  return rev * p.varCostRatio * (1 + n);
};

export const actualFixedCostFor = (e: FixedExpense, i: number, scen: Scenario = SCENARIOS.baz, actualsThrough = ACTUALS_THROUGH): number | null => {
  if (i >= actualsThrough) return null;
  if (i < (e.startOffset ?? 0)) return 0;
  const budget = fixedCostFor(e, i, scen);
  const n = (hash(e.id + '|f|' + i) - 0.45) * 0.16;
  return budget * (1 + n);
};

export const bvaForPeriod = (
  i: number, scen: Scenario,
  products: Product[], fixedExpenses: FixedExpense[], actualsThrough: number,
) => {
  const budgetRev  = products.reduce((s, p) => s + revenueFor(p, i, scen), 0);
  const budgetVar  = products.reduce((s, p) => s + varCostFor(p, i, scen), 0);
  const budgetFix  = fixedExpenses.reduce((s, e) => s + fixedCostFor(e, i, scen), 0);
  const budgetOpex = budgetVar + budgetFix;
  const budgetEb   = budgetRev - budgetOpex;

  if (i >= actualsThrough) return {
    hasActual: false,
    budget: { revenue: budgetRev, opex: budgetOpex, ebitda: budgetEb, varCost: budgetVar, fixCost: budgetFix },
    actual: { revenue: 0, opex: 0, ebitda: 0, varCost: 0, fixCost: 0 },
  };

  const actualRev  = products.reduce((s, p) => s + (actualRevenueFor(p, i, scen, actualsThrough) ?? 0), 0);
  const actualVar  = products.reduce((s, p) => s + (actualVarCostFor(p, i, scen, actualsThrough) ?? 0), 0);
  const actualFix  = fixedExpenses.reduce((s, e) => s + (actualFixedCostFor(e, i, scen, actualsThrough) ?? 0), 0);
  const actualOpex = actualVar + actualFix;
  const actualEb   = actualRev - actualOpex;
  return {
    hasActual: true,
    budget: { revenue: budgetRev, opex: budgetOpex, ebitda: budgetEb, varCost: budgetVar, fixCost: budgetFix },
    actual: { revenue: actualRev, opex: actualOpex, ebitda: actualEb, varCost: actualVar, fixCost: actualFix },
  };
};

// ─── Formatters ───────────────────────────────────────────────────────────────
export const fmtTL = (n: number | null | undefined, opts: { compact?: boolean; sign?: boolean } = {}): string => {
  if (n == null || isNaN(n)) return '—';
  const { compact = false, sign = false } = opts;
  const abs = Math.abs(n);
  let str: string;
  if (compact && abs >= 1_000_000) str = (n/1_000_000).toLocaleString('tr-TR', {maximumFractionDigits: 2}) + ' Mn';
  else if (compact && abs >= 1_000) str = (n/1_000).toLocaleString('tr-TR', {maximumFractionDigits: 0}) + ' Bin';
  else str = Math.round(n).toLocaleString('tr-TR');
  return (sign && n > 0 ? '+' : '') + '₺' + str;
};

export const fmtPct = (n: number | null | undefined, digits = 1): string =>
  (n == null || isNaN(n)) ? '—' : (n*100).toLocaleString('tr-TR', {minimumFractionDigits: digits, maximumFractionDigits: digits}) + '%';

export const fmtNum = (n: number | null | undefined, digits = 0): string =>
  (n == null || isNaN(n)) ? '—' : n.toLocaleString('tr-TR', {minimumFractionDigits: digits, maximumFractionDigits: digits});

// ─── Plan fabrika ─────────────────────────────────────────────────────────────
export const createNewPlan = (title: string, year: number): DPlan => ({
  id: crypto.randomUUID(),
  title,
  baslik: title,
  status: 'draft',
  year,
  startYear: year,
  startMonth: 0,
  horizon: 24,
  openingCash: 0,
  actualsThrough: 0,
  facilityExpenses: [],
  projects: [],
  cashEvents: [],
});

// ─── React context ────────────────────────────────────────────────────────────
export interface PlanDataCtxValue {
  // Yeni model
  facilityExpenses: FixedExpense[];
  projects: ActiveProject[];
  // Panel geriye dönük uyumluluk (shell tarafından flatten edilir)
  products: Product[];
  fixedExpenses: FixedExpense[];
  periods: Period[];
  cashEvents: CashEvent[];
  openingCash: number;
  actualsThrough: number;
}

export const PlanCtx = React.createContext<PlanDataCtxValue>({
  facilityExpenses: [],
  projects:         [],
  products:         PRODUCTS,
  fixedExpenses:    FIXED_EXPENSES,
  periods:          PERIODS,
  cashEvents:       CASH_EVENTS,
  openingCash:      OPENING_CASH,
  actualsThrough:   ACTUALS_THROUGH,
});

export const usePlanData = (): PlanDataCtxValue => React.useContext(PlanCtx);
