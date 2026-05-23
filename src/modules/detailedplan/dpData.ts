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
  customerId?: string;
  weeklyRamp?: WeeklyRamp;
  /** Plan başından itibaren ay ofseti — bu aydan önce gelir/maliyet = 0 */
  startOffset?: number;
  /** Plan başından itibaren ay ofseti — bu aydan itibaren gelir/maliyet = 0 */
  endOffset?: number;
}

export interface FixedExpense {
  id: string;
  mcode: string;
  costCategory: 'purchase' | 'production' | 'personnel' | 'sales' | 'overhead' | 'facility';
  name: string;
  group: string;
  monthly: number;
  growth: number;
  startOffset?: number;
  unit?: string;
  unitPrice?: number;
  monthlyQty?: number;
  weeklyRamp?: WeeklyRamp;
}

// ─── Haftalık Ramp ───────────────────────────────────────────────────────────
export interface WeeklyRamp {
  startValue: number;      // 1. hafta değeri
  weeklyDelta: number;     // sabit artış / hafta  (0 → % kullan)
  weeklyGrowthPct: number; // % artış / hafta      (0 → sabit kullan)
}

export const weeklyRampAt = (r: WeeklyRamp, w: number): number =>
  r.weeklyGrowthPct !== 0
    ? r.startValue * Math.pow(1 + r.weeklyGrowthPct / 100, w)
    : Math.max(0, r.startValue + r.weeklyDelta * w);

export type Granularity = 'weekly' | 'monthly' | 'quarterly' | 'annual';

// ─── Müşteri Havuzu — plan içinde yaşar ──────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  sector?: string;
  unit?: string;           // ton / kg / adet …
  salesPrice?: number;     // satış fiyatı ₺/birim
  shippingCost?: number;   // satış nakliyesi ₺/kg
  paymentTerms?: string;   // "peşin" | "7 gün" | … | "kısmi"
  prepayRatio?: number;    // kısmi: peşin oran 0-100
  deferredDays?: number;   // kısmi: vadeli kısım gün
  notes?: string;
}

// ─── Tedarikçi Havuzu — plan içinde yaşar ────────────────────────────────────
export interface Supplier {
  id: string;
  name: string;
  material: string;
  unit: string;
  unitPrice: number;       // ₺ / birim
  shippingCost?: number;   // alış nakliyesi ₺/ay
  paymentTerms?: string;   // "peşin" | "7 gün" | … | "kısmi"
  prepayRatio?: number;    // kısmi: peşin oran 0-100
  deferredDays?: number;   // kısmi: vadeli kısım gün
  notes?: string;
}

// ─── Gider Merkezi — plan dışında yaşar ─────────────────────────────────────
// Tesis, ofis, atölye vb. — bir kere tanımlanır, planlardan referanslanır.
export interface CostCenter {
  id: string;
  name: string;
  fixedExpenses: FixedExpense[];
}

// Backward compat alias (eski kod Facility kullanıyorsa)
export type Facility = CostCenter;

export const COST_CENTERS_KEY = 'enba_dp2_cost_centers';

export function loadCostCenters(): CostCenter[] {
  try {
    const raw = localStorage.getItem(COST_CENTERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveCostCenters(list: CostCenter[]): void {
  try { localStorage.setItem(COST_CENTERS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export interface ActiveProject {
  id: string;
  costCenterId: string;       // hangi Gider Merkezi'ne bağlı
  isActive: boolean;          // aktif projeler tesis maliyeti alır
  name: string;
  color: string;
  allocationWeight: number;
  startOffset: number;
  endOffset?: number;
  expenses: FixedExpense[];   // projeye özgü değişken/direkt giderler
  revenues: Product[];
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
  spanMonths?: number;   // 0=hafta, 1=ay(def), 3=çeyrek, 12=yıllık
  monthOffset?: number;  // plan başından ay indeksi (aggregasyon için)
  weekIdx?: number;      // haftalık dönemler için hafta indeksi
}

export interface CashEvent {
  id: string;
  name: string;
  type: 'investing' | 'financing';
  months: { idx: number; amount: number }[];
}

// ─── Plan veri modeli — tesis giderlerini içermez ────────────────────────────
export type PlanStatus   = 'draft' | 'pending' | 'active' | 'archived';
export type PlanCategory = 'buyuk_yatirim' | 'kucuk_yatirim' | 'operasyonel' | 'ticari' | '';

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  draft:    'Taslak',
  pending:  'Onay Bekliyor',
  active:   'Aktif',
  archived: 'Arşiv',
};

export const PLAN_CATEGORY_LABEL: Record<PlanCategory, string> = {
  buyuk_yatirim: 'Büyük Yatırım',
  kucuk_yatirim: 'Küçük Yatırım',
  operasyonel:   'Operasyonel',
  ticari:        'Ticari',
  '':            '',
};

export interface DPlan {
  id: string;
  supabaseId?: string;
  title: string;
  baslik: string;
  status: PlanStatus;
  category?: PlanCategory;
  description?: string;
  year: number;
  startYear: number;
  startMonth: number;
  horizon: number;
  weeklyHorizon: number;  // ilk N hafta haftalık girilir, sonrası aylık
  openingCash: number;
  actualsThrough: number;
  suppliers: Supplier[];
  customers: Customer[];
  projects: ActiveProject[];
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
    out.push({ key: `${y}-${String(m+1).padStart(2,'0')}`, label: `${MONTHS_TR[m]} ${String(y).slice(2)}`, m, y, spanMonths: 1, monthOffset: i });
  }
  return out;
};

const WEEKS_PER_MONTH = 4.333;

export const buildDisplayPeriods = (
  horizon: number,
  startYear: number,
  startMonth: number,
  granularity: Granularity,
  weeklyHorizon = 0,
): Period[] => {
  if (granularity === 'weekly') {
    const out: Period[] = [];
    for (let w = 0; w < weeklyHorizon; w++) {
      const absMonth = startMonth + Math.floor(w / WEEKS_PER_MONTH);
      const m = absMonth % 12;
      const y = startYear + Math.floor(absMonth / 12);
      out.push({ key: `w${w}`, label: `H${w + 1}`, m, y, spanMonths: 0, monthOffset: Math.floor(w / WEEKS_PER_MONTH), weekIdx: w });
    }
    return out;
  }
  if (granularity === 'quarterly') {
    const months = buildMonths(horizon, startYear, startMonth);
    const out: Period[] = [];
    for (let q = 0; q * 3 < horizon; q++) {
      const base = months[q * 3];
      const qNum = (Math.floor(base.m / 3) + 1);
      out.push({ key: `q${q}`, label: `Q${qNum} ${base.y}`, m: base.m, y: base.y, spanMonths: Math.min(3, horizon - q * 3), monthOffset: q * 3 });
    }
    return out;
  }
  if (granularity === 'annual') {
    const months = buildMonths(horizon, startYear, startMonth);
    const out: Period[] = [];
    for (let yr = 0; yr * 12 < horizon; yr++) {
      const base = months[yr * 12];
      out.push({ key: `y${base.y}`, label: String(base.y), m: base.m, y: base.y, spanMonths: Math.min(12, horizon - yr * 12), monthOffset: yr * 12 });
    }
    return out;
  }
  // monthly (default)
  return buildMonths(horizon, startYear, startMonth);
};

export const PERIODS: Period[] = buildMonths(24, 2025, 0);

// Proje aktif mi? isActive + zaman aralığı kontrolü
export const isProjectActive = (p: ActiveProject, i: number): boolean =>
  p.isActive && i >= p.startOffset && (p.endOffset === undefined || i < p.endOffset);

// Projenin gider merkezindeki payı — sadece aynı gider merkezinin aktif projeleri paylaşır
export const facilityShareFor = (
  project: ActiveProject, i: number, allProjects: ActiveProject[]
): number => {
  if (!isProjectActive(project, i)) return 0;
  const active = allProjects.filter(p =>
    p.costCenterId === project.costCenterId && isProjectActive(p, i)
  );
  const total = active.reduce((s, p) => s + p.allocationWeight, 0);
  return total === 0 ? 0 : project.allocationWeight / total;
};

export const SCENARIOS: Record<string, Scenario> = {
  baz:      { id: 'baz',      label: 'Baz',      color: '#E35205', rev: 1.00, cost: 1.00, hint: 'Mevcut trendin devamı.' },
  iyimser:  { id: 'iyimser',  label: 'İyimser',  color: '#3DBE7C', rev: 1.12, cost: 0.96, hint: 'Talep artışı + verimlilik kazanımı.' },
  kotumser: { id: 'kotumser', label: 'Kötümser', color: '#E5484D', rev: 0.84, cost: 1.08, hint: 'Daralan talep + maliyet baskısı.' },
};

export const OPENING_CASH    = 0;
export const ACTUALS_THROUGH = 0;

export const PRODUCTS: Product[]            = [];
export const FIXED_EXPENSES: FixedExpense[] = [];
export const CASH_EVENTS: CashEvent[]       = [];

// ─── Hesaplama yardımcıları ───────────────────────────────────────────────────

export const monthlyPriceFor = (p: Product, i: number) =>
  p.price * Math.pow(1 + p.priceGrowth, i / 12);

export const monthlyVolumeFor = (p: Product, i: number) => {
  const seas = p.seasonality[i % 12];
  return p.volume * Math.pow(1 + p.volumeGrowth, i / 12) * seas;
};

export const revenueFor = (p: Product, i: number, scen: Scenario = SCENARIOS.baz): number => {
  if (i < (p.startOffset ?? 0)) return 0;
  if (p.endOffset !== undefined && i >= p.endOffset) return 0;
  return monthlyPriceFor(p, i) * monthlyVolumeFor(p, i) * scen.rev;
};

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
  weeklyHorizon = 0,
): SeriesPoint[] =>
  periods.map((p, i) => {
    const span   = p.spanMonths ?? 1;
    const offset = p.monthOffset ?? i;

    if (span === 0 && p.weekIdx !== undefined) {
      // ── Haftalık dönem ──
      const w = p.weekIdx;
      const revenue = products.reduce((s, prod) => {
        if (prod.weeklyRamp && w < weeklyHorizon)
          return s + weeklyRampAt(prod.weeklyRamp, w) * prod.price * scen.rev;
        return s + revenueFor(prod, Math.floor(w / WEEKS_PER_MONTH), scen) / WEEKS_PER_MONTH;
      }, 0);
      const varCost = products.reduce((s, prod) => {
        const rev = prod.weeklyRamp && w < weeklyHorizon
          ? weeklyRampAt(prod.weeklyRamp, w) * prod.price * scen.rev
          : revenueFor(prod, Math.floor(w / WEEKS_PER_MONTH), scen) / WEEKS_PER_MONTH;
        return s + rev * prod.varCostRatio * scen.cost;
      }, 0);
      const fixCost = fixedExpenses.reduce((s, e) => {
        if (e.weeklyRamp && w < weeklyHorizon)
          return s + weeklyRampAt(e.weeklyRamp, w) * scen.cost;
        return s + fixedCostFor(e, Math.floor(w / WEEKS_PER_MONTH), scen) / WEEKS_PER_MONTH;
      }, 0);
      const opex   = varCost + fixCost;
      const ebitda = revenue - opex;
      const net    = ebitda - Math.max(0, ebitda) * 0.22;
      return { ...p, idx: w, revenue, varCost, fixCost, opex, ebitda, net };
    }

    // ── Aylık / Çeyreklik / Yıllık: span ay topla ──
    let revenue = 0, varCost = 0, fixCost = 0;
    for (let s = 0; s < span; s++) {
      const mi = offset + s;
      revenue  += products.reduce((acc, prod) => acc + revenueFor(prod, mi, scen), 0);
      varCost  += products.reduce((acc, prod) => acc + varCostFor(prod, mi, scen), 0);
      fixCost  += fixedExpenses.reduce((acc, e) => acc + fixedCostFor(e, mi, scen), 0);
    }
    const opex   = varCost + fixCost;
    const ebitda = revenue - opex;
    const net    = ebitda - Math.max(0, ebitda) * 0.22;
    return { ...p, idx: offset, revenue, varCost, fixCost, opex, ebitda, net };
  });

// Bir Period için hesaplama fonksiyonunu span boyunca toplar.
// monthly: span=1, quarterly: span=3, annual: span=12, weekly: span=0 (weekIdx kullan)
export const sumForPeriod = (
  period: Period,
  fallbackIdx: number,
  fn: (mi: number) => number,
): number => {
  const span   = period.spanMonths ?? 1;
  const offset = period.monthOffset ?? fallbackIdx;
  if (span === 0) return fn(period.weekIdx ?? fallbackIdx);
  let sum = 0;
  for (let s = 0; s < span; s++) sum += fn(offset + s);
  return sum;
};

export const cashFlowFor = (
  i: number, scen: Scenario,
  products: Product[], fixedExpenses: FixedExpense[], cashEvents: CashEvent[],
) => {
  const rev    = products.reduce((s, p) => s + revenueFor(p, i, scen), 0);
  const varc   = products.reduce((s, p) => s + varCostFor(p, i, scen), 0);
  const fixc   = fixedExpenses.reduce((s, e) => s + fixedCostFor(e, i, scen), 0);
  const ebitda = rev - varc - fixc;
  const tax    = Math.max(0, ebitda) * 0.22;
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
  title, baslik: title,
  status: 'draft',
  category: '',
  description: '',
  year, startYear: year, startMonth: 0,
  horizon: 24, weeklyHorizon: 12,
  openingCash: 0, actualsThrough: 0,
  suppliers: [],
  customers: [],
  projects: [],
  cashEvents: [],
});

// ─── Format migrasyonu ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const migratePlanFormat = (raw: any): DPlan => {
  if (!raw) return raw;
  return {
    ...raw,
    // facilityExpenses / facilities artık planda yaşamıyor
    facilities: undefined,
    facilityExpenses: undefined,
    projects: (raw.projects ?? []).map((p: ActiveProject & {
      facilityId?: string;
      isActive?: boolean;
      costCenterId?: string;
    }) => ({
      ...p,
      // facilityId → costCenterId migrasyonu
      costCenterId: p.costCenterId ?? p.facilityId ?? '',
      isActive:     p.isActive ?? true,
    })),
    suppliers:     raw.suppliers ?? [],
    customers:     raw.customers ?? [],
    weeklyHorizon: raw.weeklyHorizon ?? 12,
  } as DPlan;
};

// ─── React context ────────────────────────────────────────────────────────────
export interface PlanDataCtxValue {
  costCenters:      CostCenter[];
  facilityExpenses: FixedExpense[];
  projects:         ActiveProject[];
  products:         Product[];
  fixedExpenses:    FixedExpense[];
  periods:          Period[];
  cashEvents:       CashEvent[];
  openingCash:      number;
  actualsThrough:   number;
  weeklyHorizon:    number;
  granularity:      Granularity;
  /** Plan başlangıç yılı — CashFlow gibi panellerde kendi monthly periods inşası için */
  startYear:        number;
  /** Plan başlangıç ayı (0=Oca) — CashFlow gibi panellerde kendi monthly periods inşası için */
  startMonth:       number;
}

export const PlanCtx = React.createContext<PlanDataCtxValue>({
  costCenters:      [],
  facilityExpenses: FIXED_EXPENSES,
  projects:         [],
  products:         PRODUCTS,
  fixedExpenses:    FIXED_EXPENSES,
  periods:          PERIODS,
  cashEvents:       CASH_EVENTS,
  openingCash:      OPENING_CASH,
  actualsThrough:   ACTUALS_THROUGH,
  weeklyHorizon:    12,
  granularity:      'monthly',
  startYear:        2025,
  startMonth:       0,
});

export const usePlanData = (): PlanDataCtxValue => React.useContext(PlanCtx);
