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

// ─── Aylık Ramp-Up (Faz 1) ───────────────────────────────────────────────────
/** Belirli bir ay indeksindeki hedef giriş tonajı */
export interface RampUpMonth {
  monthIdx:   number;   // plan başından 0-bazlı ay indeksi
  targetTons: number;   // bu ay için giriş tonajı (ton)
}

/** Ramp-up takvimi — tam kapasiteye kademeli ulaşım */
export interface RampUpSchedule {
  enabled:     boolean;
  months:      RampUpMonth[];  // kademeli aylar — tam kapasiteye gelinince biter
  targetMonth: number;         // bu ay indeksinden itibaren tam kapasite (bu ay dahil değil)
}

/**
 * Belirli bir ay indeksinde gelir/değişken maliyet için scale faktörü döner (0.0–1.0+).
 * Sabit giderler (kira, personel) etkilenmez.
 */
export const getRampScale = (
  rampUp: RampUpSchedule | undefined,
  monthIdx: number,
  baseInputTons: number,
): number => {
  if (!rampUp?.enabled || !baseInputTons) return 1;
  if (monthIdx >= rampUp.targetMonth) return 1;
  const entry = rampUp.months.find(m => m.monthIdx === monthIdx);
  if (!entry) return 1;
  return entry.targetTons / baseInputTons;
};

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

// ─── M-Kod Kayıt Defteri ─────────────────────────────────────────────────────

/** Plan bazlı M-kodu kayıt durumu */
export type PlanMCodeStatus =
  | 'calculated'  // wizard'dan otomatik (salt okunur)
  | 'filled'      // kullanıcı manuel tutar girdi
  | 'na'          // "bu işletmede yok" işaretlendi — uyarı üretmez
  | 'empty';      // henüz girilmemiş — sarı uyarı üretir

export interface PlanMCodeEntry {
  mcode:    string;           // 'M610', 'M509', …
  status:   PlanMCodeStatus;
  monthly:  number;           // aylık ₺ (filled → kullanıcı değeri; diğerlerinde 0)
  growth?:  number;           // yıllık büyüme oranı (0.03 = %3)
  note?:    string;           // opsiyonel not
}

// ─── P&L Satır Yapısı ────────────────────────────────────────────────────────

export type PnLRowType = 'item' | 'subtotal' | 'section';

export interface PnLRow {
  id:        string;          // benzersiz — genellikle mcode, subtotal'larda 'total_xxx'
  mcode:     string;          // boş string → subtotal/section satırı
  label:     string;
  sectionId: string;
  type:      PnLRowType;
  level:     0 | 1 | 2;      // 0=bölüm başlığı  1=kalem  2=alt kalem
  monthly:   number;          // hesaplanan aylık değer (mutlak, eksi gösterim UI'da)
  status:    PlanMCodeStatus;
  isExpense: boolean;         // true → P&L'de eksi olarak gösterilir
  editable:  boolean;         // false → hesaplanan, wizard'dan değiştirilmeli
}

// ─── Plan veri modeli — tesis giderlerini içermez ────────────────────────────
export type PlanStatus   = 'draft' | 'pending' | 'active' | 'archived';
export type PlanCategory = 'buyuk_yatirim' | 'kucuk_yatirim' | 'operasyonel' | 'ticari' | '';

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  draft:    'Taslak',
  pending:  'Onay Bekliyor',
  active:   'Bütçelenmiş',
  archived: 'Arşiv',
};

export const PLAN_CATEGORY_LABEL: Record<PlanCategory, string> = {
  buyuk_yatirim: 'Büyük Yatırım',
  kucuk_yatirim: 'Küçük Yatırım',
  operasyonel:   'Operasyonel',
  ticari:        'Ticari',
  '':            '',
};

/** Gerçekleşen (aktüel) veri deposu.
 *  Key formatları:
 *    `rev:${productId}:${periodIdx}`  → gerçekleşen gelir (TL)
 *    `fix:${expenseId}:${periodIdx}`  → gerçekleşen sabit gider (TL)
 *    `var:${productId}:${periodIdx}`  → gerçekleşen değişken maliyet (TL, opsiyonel)
 */
export type PlanActuals = Record<string, number>;

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
  productionModel?: ProductionModel;  // yeni wizard — AI'a hazır yapılandırılmış model
  actuals?: PlanActuals;              // bütçe-gerçekleşen karşılaştırma için elle girilmiş veriler
  rampUp?: RampUpSchedule;           // aylık ramp-up takvimi (Faz 1)
  /** Versiyon numarası — 1'den başlar, her "Yeni Versiyon Al"'da +1 */
  version?: number;
  /** Üst plan ID'si — versiyonlanan planın kökü */
  parentPlanId?: string;
  /** M-kod kayıt defteri — plan bazlı manuel gider/gelir kalemleri */
  mcodeEntries?: PlanMCodeEntry[];
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
  rampUp?: RampUpSchedule,
  baseInputTons = 0,
): SeriesPoint[] =>
  periods.map((p, i) => {
    const span   = p.spanMonths ?? 1;
    const offset = p.monthOffset ?? i;

    if (span === 0 && p.weekIdx !== undefined) {
      // ── Haftalık dönem ──
      const w = p.weekIdx;
      const mi = Math.floor(w / WEEKS_PER_MONTH);
      const rampScale = getRampScale(rampUp, mi, baseInputTons);
      const revenue = products.reduce((s, prod) => {
        const base = prod.weeklyRamp && w < weeklyHorizon
          ? weeklyRampAt(prod.weeklyRamp, w) * prod.price * scen.rev
          : revenueFor(prod, mi, scen) / WEEKS_PER_MONTH;
        return s + base * rampScale;
      }, 0);
      const varCost = products.reduce((s, prod) => {
        const rev = prod.weeklyRamp && w < weeklyHorizon
          ? weeklyRampAt(prod.weeklyRamp, w) * prod.price * scen.rev
          : revenueFor(prod, mi, scen) / WEEKS_PER_MONTH;
        return s + rev * prod.varCostRatio * scen.cost * rampScale;
      }, 0);
      const fixCost = fixedExpenses.reduce((s, e) => {
        if (e.weeklyRamp && w < weeklyHorizon)
          return s + weeklyRampAt(e.weeklyRamp, w) * scen.cost;
        return s + fixedCostFor(e, mi, scen) / WEEKS_PER_MONTH;
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
      const rampScale = getRampScale(rampUp, mi, baseInputTons);
      revenue  += products.reduce((acc, prod) => acc + revenueFor(prod, mi, scen), 0) * rampScale;
      varCost  += products.reduce((acc, prod) => acc + varCostFor(prod, mi, scen), 0) * rampScale;
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

export const actualRevenueFor = (
  p: Product, i: number, scen: Scenario = SCENARIOS.baz,
  actualsThrough = ACTUALS_THROUGH, actuals?: PlanActuals,
): number | null => {
  if (i >= actualsThrough) return null;
  const key = `rev:${p.id}:${i}`;
  if (actuals && key in actuals) return actuals[key];
  // Demo placeholder — gerçek veri girişi yapılmamışsa hash ile tahmin
  const n = (hash(p.id + '|r|' + i) - 0.5) * 0.28;
  return revenueFor(p, i, scen) * (1 + n);
};

export const actualVarCostFor = (
  p: Product, i: number, scen: Scenario = SCENARIOS.baz,
  actualsThrough = ACTUALS_THROUGH, actuals?: PlanActuals,
): number | null => {
  if (i >= actualsThrough) return null;
  const varKey = `var:${p.id}:${i}`;
  if (actuals && varKey in actuals) return actuals[varKey];
  const rev = actualRevenueFor(p, i, scen, actualsThrough, actuals)!;
  const n   = (hash(p.id + '|c|' + i) - 0.4) * 0.20;
  return rev * p.varCostRatio * (1 + n);
};

export const actualFixedCostFor = (
  e: FixedExpense, i: number, scen: Scenario = SCENARIOS.baz,
  actualsThrough = ACTUALS_THROUGH, actuals?: PlanActuals,
): number | null => {
  if (i >= actualsThrough) return null;
  if (i < (e.startOffset ?? 0)) return 0;
  const key = `fix:${e.id}:${i}`;
  if (actuals && key in actuals) return actuals[key];
  const budget = fixedCostFor(e, i, scen);
  const n = (hash(e.id + '|f|' + i) - 0.45) * 0.16;
  return budget * (1 + n);
};

export const bvaForPeriod = (
  i: number, scen: Scenario,
  products: Product[], fixedExpenses: FixedExpense[], actualsThrough: number,
  actuals?: PlanActuals,
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

  const actualRev  = products.reduce((s, p) => s + (actualRevenueFor(p, i, scen, actualsThrough, actuals) ?? 0), 0);
  const actualVar  = products.reduce((s, p) => s + (actualVarCostFor(p, i, scen, actualsThrough, actuals) ?? 0), 0);
  const actualFix  = fixedExpenses.reduce((s, e) => s + (actualFixedCostFor(e, i, scen, actualsThrough, actuals) ?? 0), 0);
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

// ─── Üretim Modeli Tipleri ────────────────────────────────────────────────────

export interface ProductionParams {
  energyUnitCost: number;    // TL/kWh  örn: 5
  defaultDF:      number;    // talep faktörü  örn: 0.60
  hoursPerDay:    number;    // günlük çalışma saati  örn: 10
  daysPerMonth:   number;    // aylık çalışma günü  örn: 26
}

export interface MachineEntry {
  id:                  string;
  name:                string;
  kw:                  number;
  capacityTonPerHour:  number;
  df?:                 number;   // override — boşsa params.defaultDF kullanılır
  usesNetOutput:       boolean;  // true = fire sonrası net ton işler (granül gibi)
  order:               number;   // proses sırası
  assetId?:            string;   // varlık envanterindeki karşılığı (assets.id)
}

export type WorkerMode = 'capacity' | 'fixed';
export type WorkerStage = 'sorting' | 'production' | 'sales' | 'management';

export interface WorkerGroup {
  id:                    string;
  name:                  string;
  stage:                 WorkerStage;
  mode:                  WorkerMode;
  capacityTonPerMonth?:  number;  // mode='capacity' ise
  fixedCount?:           number;  // mode='fixed' ise
  monthlyCost:           number;  // TL/kişi
}

export interface RawMaterial {
  id:             string;
  name:           string;
  mcode:          string;
  kgPerInputTon:  number;   // giriş tonu başına tüketim (hammadde için 1000)
  unitCost:       number;   // TL/kg
  supplierId?:    string;
}

export interface OutputProduct {
  id:                    string;
  name:                  string;
  mcode:                 string;
  shareOfNetTons:        number;  // net çıktı tonunun payı (0-1), toplamı 1 olmalı
  unitPrice:             number;  // TL/kg
  packagingTonPerUnit?:  number;  // ambalaj kapasitesi ton/adet
  packagingCostPerUnit?: number;  // ambalaj TL/adet
  customerId?:           string;
}

export interface OtherVariableCost {
  id:             string;
  name:           string;
  mcode:          string;
  tlPerInputTon?: number;  // giriş tonu başına TL
  monthlyFixed?:  number;  // sabit aylık TL
}

/** Giriş materyalinin içindeki bir fraksiyon (kağıt, LDPE, 2. kalite vb.) */
export interface InputFraction {
  id:           string;
  name:         string;        // örn: "Kağıt", "LDPE", "2. Kalite PP"
  percentage:   number;        // giriş tonunun payı (0-1)
  destination:  'sell' | 'production' | 'discard';
  unitPrice?:   number;        // TL/kg — destination === 'sell' ise
}

export interface ProductionModel {
  params: ProductionParams;

  // Aşama 1: Mal Girişi
  monthlyInputTons: number;    // her zaman ton cinsinden tutulur
  inputUnit?:       'ton' | 'kg';  // kullanıcının tercih ettiği giriş birimi
  inputUnitPrice?:  number;    // ₺/ton — hammaddenin alış fiyatı

  // Giriş firesi
  inputWasteRate:       number;   // (eski compat) toplam giriş fire
  moistureWasteRate?:   number;   // nem firesi (0-1)
  trashWasteRate?:      number;   // yabancı madde firesi — taş/toprak/metal (0-1)
  altKaliteMode?:       'simple' | 'detailed';
  altKaliteSimpleRate?: number;   // mod A: toplam alt kalite fire (0-1)
  inputFractions?:      InputFraction[];  // mod B: fraksiyonlar

  // Ön seçim
  sortingWasteRate: number;    // (eski compat)
  sortingEnabled?:  boolean;   // false → malzeme direkt üretime girer

  // Üretim
  machines:              MachineEntry[];
  processWasteRate:      number;
  fireAfterMachineIdx:   number;
  washingEnabled?:       boolean;  // yıkama hattı var mı?
  washingWasteRate?:     number;   // yıkama fire oranı (0-1)

  // Çıktı & Maliyetler
  outputProducts:      OutputProduct[];
  rawMaterials:        RawMaterial[];
  workers:             WorkerGroup[];
  otherVariableCosts:  OtherVariableCost[];
}

// Hesap sonuçları — her render'da yeniden hesaplanır, saklanmaz
export interface MachineCapacity {
  machine:          MachineEntry;
  maxTonsPerMonth:  number;
  requiredTons:     number;
  utilization:      number;   // 0-1+
  isBottleneck:     boolean;
}

export interface WorkerCapacity {
  worker:           WorkerGroup;
  count:            number;
  maxTonsPerMonth:  number;
  utilization:      number;
}

export interface ProductionCalcResult {
  grossInputTons:     number;
  paidInputTons:      number;  // fire indirimi sonrası ödenen ton
  afterInputWaste:    number;
  afterSortingWaste:  number;
  netOutputTons:      number;

  productOutputs: { product: OutputProduct; tons: number; revenue: number; packagingCost: number }[];
  fractionOutputs: { fraction: InputFraction; tons: number; revenue: number }[];
  totalRevenue:    number;  // ürün + fraksiyon satış geliri

  energyCostByMachine: { machine: MachineEntry; cost: number; kWh: number }[];
  totalEnergyCost:     number;

  workerDetails: { worker: WorkerGroup; count: number; cost: number }[];
  totalLaborCost: number;

  materialCosts:     { material: RawMaterial; cost: number }[];
  totalMaterialCost: number;

  otherCosts:     { item: OtherVariableCost; cost: number }[];
  totalOtherCost: number;

  inputMaterialCost:  number;  // hammadde alış maliyeti (paidInputTons × inputUnitPrice)

  totalVariableCost: number;

  machineCapacities: MachineCapacity[];
  bottleneck:        MachineEntry | null;
  workerCapacities:  WorkerCapacity[];
}

export function calcProductionResults(model: ProductionModel): ProductionCalcResult {
  const { params } = model;

  const grossInputTons = model.monthlyInputTons;

  // ── Giriş firesi hesabı ──────────────────────────────────────────────────
  let effectiveInputWasteRate: number;
  if (model.moistureWasteRate !== undefined) {
    // Yeni model: nem + çöp + alt kalite
    const moisture = model.moistureWasteRate ?? 0;
    const trash    = model.trashWasteRate ?? 0;
    let altKalite  = 0;
    if (model.altKaliteMode === 'detailed' && model.inputFractions?.length) {
      altKalite = model.inputFractions
        .filter(f => f.destination !== 'production')
        .reduce((s, f) => s + f.percentage, 0);
    } else {
      altKalite = model.altKaliteSimpleRate ?? 0;
    }
    effectiveInputWasteRate = Math.min(moisture + trash + altKalite, 0.99);
  } else {
    // Eski model: tek rate
    effectiveInputWasteRate = model.inputWasteRate;
  }

  // Üretime giren fraksiyon tonu (destination === 'production')
  const fractionToProductionTons = (model.altKaliteMode === 'detailed' && model.inputFractions?.length)
    ? grossInputTons * model.inputFractions
        .filter(f => f.destination === 'production')
        .reduce((s, f) => s + f.percentage, 0)
    : 0;

  const afterInputWaste   = grossInputTons * (1 - effectiveInputWasteRate) + fractionToProductionTons;

  // Ön seçim: enabled değilse ek kayıp yok
  const sortingRate       = (model.sortingEnabled === false) ? 0 : model.sortingWasteRate;
  const afterSortingWaste = afterInputWaste * (1 - sortingRate);

  // Yıkama
  const afterWashing = model.washingEnabled
    ? afterSortingWaste * (1 - (model.washingWasteRate ?? 0))
    : afterSortingWaste;

  const netOutputTons = afterWashing * (1 - model.processWasteRate);

  // ── Ürün çıktıları ───────────────────────────────────────────────────────
  const productOutputs = model.outputProducts.map(op => {
    const tons        = netOutputTons * op.shareOfNetTons;
    const revenue     = tons * 1000 * op.unitPrice;
    const packagingCost = (op.packagingTonPerUnit && op.packagingCostPerUnit)
      ? Math.ceil(tons / op.packagingTonPerUnit) * op.packagingCostPerUnit
      : 0;
    return { product: op, tons, revenue, packagingCost };
  });

  // ── Fraksiyon satış geliri ───────────────────────────────────────────────
  const fractionOutputs = (model.inputFractions ?? [])
    .filter(f => f.destination === 'sell')
    .map(f => {
      const tons    = grossInputTons * f.percentage;
      const revenue = tons * 1000 * (f.unitPrice ?? 0);
      return { fraction: f, tons, revenue };
    });

  const totalRevenue = productOutputs.reduce((s, p) => s + p.revenue, 0)
                     + fractionOutputs.reduce((s, f) => s + f.revenue, 0);

  // Enerji (makine bazlı)
  const energyCostByMachine = model.machines.map(m => {
    const ton        = m.usesNetOutput ? netOutputTons : afterSortingWaste;
    const hoursNeeded = ton / m.capacityTonPerHour;
    const df         = m.df ?? params.defaultDF;
    const kWh        = m.kw * hoursNeeded * df;
    return { machine: m, cost: kWh * params.energyUnitCost, kWh };
  });
  const totalEnergyCost = energyCostByMachine.reduce((s, e) => s + e.cost, 0);

  // İşçilik
  const workerDetails = model.workers.map(w => {
    const count = (w.mode === 'capacity' && w.capacityTonPerMonth)
      ? Math.ceil(grossInputTons / w.capacityTonPerMonth)
      : (w.fixedCount ?? 1);
    return { worker: w, count, cost: count * w.monthlyCost };
  });
  const totalLaborCost = workerDetails.reduce((s, w) => s + w.cost, 0);

  // Hammadde
  const materialCosts = model.rawMaterials.map(rm => ({
    material: rm,
    cost: grossInputTons * rm.kgPerInputTon * rm.unitCost,
  }));
  const totalMaterialCost = materialCosts.reduce((s, m) => s + m.cost, 0);

  // Diğer değişken
  const otherCosts = model.otherVariableCosts.map(vc => ({
    item: vc,
    cost: (vc.tlPerInputTon ?? 0) * grossInputTons + (vc.monthlyFixed ?? 0),
  }));
  const totalOtherCost = otherCosts.reduce((s, o) => s + o.cost, 0);

  const packagingTotal  = productOutputs.reduce((s, p) => s + p.packagingCost, 0);

  // Hammadde alış maliyeti — nem + yabancı madde fire indirimi uygulanmış ödenen ton üzerinden
  const purchaseFireRate  = Math.min((model.moistureWasteRate ?? 0) + (model.trashWasteRate ?? 0), 0.99);
  const paidInputTons     = grossInputTons * (1 - purchaseFireRate);
  const inputMaterialCost = model.inputUnitPrice ? paidInputTons * model.inputUnitPrice : 0;

  const totalVariableCost = totalEnergyCost + totalLaborCost + totalMaterialCost + totalOtherCost + packagingTotal + inputMaterialCost;

  // Kapasite analizi
  const machineCapacities: MachineCapacity[] = model.machines.map(m => {
    const maxTonsPerMonth = m.capacityTonPerHour * params.hoursPerDay * params.daysPerMonth;
    const requiredTons    = m.usesNetOutput ? netOutputTons : afterSortingWaste;
    return {
      machine: m,
      maxTonsPerMonth,
      requiredTons,
      utilization:   maxTonsPerMonth > 0 ? requiredTons / maxTonsPerMonth : 0,
      isBottleneck:  requiredTons > maxTonsPerMonth,
    };
  });
  const bottleneck = machineCapacities.find(c => c.isBottleneck)?.machine ?? null;

  const workerCapacities: WorkerCapacity[] = model.workers
    .filter(w => w.mode === 'capacity')
    .map(w => {
      const wd = workerDetails.find(x => x.worker.id === w.id);
      const count = wd?.count ?? 0;
      const maxTonsPerMonth = count * (w.capacityTonPerMonth ?? 0);
      return {
        worker: w,
        count,
        maxTonsPerMonth,
        utilization: maxTonsPerMonth > 0 ? grossInputTons / maxTonsPerMonth : 0,
      };
    });

  return {
    grossInputTons, paidInputTons, afterInputWaste, afterSortingWaste: afterWashing, netOutputTons,
    productOutputs, fractionOutputs, totalRevenue,
    energyCostByMachine, totalEnergyCost,
    workerDetails, totalLaborCost,
    materialCosts, totalMaterialCost,
    otherCosts, totalOtherCost,
    inputMaterialCost,
    totalVariableCost,
    machineCapacities, bottleneck, workerCapacities,
  };
}

/** ProductionModel → ActiveProject (shell paneller için) */
export function deriveProjectFromModel(
  model:           ProductionModel,
  existingProject?: Partial<ActiveProject>,
): ActiveProject {
  const calc = calcProductionResults(model);

  const expenses: FixedExpense[] = [];

  // Hammadde alış maliyeti (ana giriş malzemesi)
  if (calc.inputMaterialCost > 0) {
    expenses.push({ id: 'input_material', mcode: 'M100', costCategory: 'purchase',
      name: 'Hammadde Alışı', group: 'Hammadde', monthly: calc.inputMaterialCost, growth: 0 });
  }

  calc.materialCosts.forEach(mc => {
    expenses.push({ id: mc.material.id, mcode: mc.material.mcode, costCategory: 'purchase',
      name: mc.material.name, group: 'Hammadde', monthly: mc.cost, growth: 0 });
  });

  if (calc.totalEnergyCost > 0) {
    expenses.push({ id: 'energy', mcode: 'M405', costCategory: 'production',
      name: 'Elektrik Enerjisi', group: 'Üretim', monthly: calc.totalEnergyCost, growth: 0 });
  }

  calc.workerDetails.forEach(wd => {
    expenses.push({ id: wd.worker.id, mcode: 'M489', costCategory: 'personnel',
      name: `${wd.worker.name} (${wd.count} kişi)`, group: 'Personel',
      monthly: wd.cost, growth: 0 });
  });

  calc.otherCosts.forEach(oc => {
    expenses.push({ id: oc.item.id, mcode: oc.item.mcode, costCategory: 'overhead',
      name: oc.item.name, group: 'Diğer', monthly: oc.cost, growth: 0 });
  });

  calc.productOutputs.filter(p => p.packagingCost > 0).forEach(p => {
    expenses.push({ id: `pkg_${p.product.id}`, mcode: 'M999', costCategory: 'sales',
      name: `${p.product.name} ambalaj`, group: 'Satış', monthly: p.packagingCost, growth: 0 });
  });

  const revenues: Product[] = calc.productOutputs.map(po => ({
    id: po.product.id,
    mcode: po.product.mcode || 'M105',
    name: po.product.name,
    category: 'Mamül',
    unit: 'ton',
    price: po.product.unitPrice * 1000,     // TL/ton
    priceGrowth: 0,
    seasonality: Array(12).fill(1),          // aylık sabit hacim
    volume: po.tons,                          // ton/ay
    volumeGrowth: 0,
    varCostRatio: 0,
    color: '#E35205',
    customerId: po.product.customerId,
  }));

  return {
    id:               existingProject?.id ?? crypto.randomUUID(),
    costCenterId:     existingProject?.costCenterId ?? '',
    isActive:         true,
    name:             'Üretim Projesi',
    color:            '#E35205',
    allocationWeight: 1,
    startOffset:      0,
    expenses,
    revenues,
  };
}

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
  mcodeEntries: [],
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
    suppliers:     raw.suppliers     ?? [],
    customers:     raw.customers     ?? [],
    weeklyHorizon: raw.weeklyHorizon ?? 12,
    rampUp:        raw.rampUp        ?? undefined,
    version:       raw.version       ?? undefined,
    parentPlanId:  raw.parentPlanId  ?? undefined,
    mcodeEntries:  raw.mcodeEntries  ?? [],
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
  /** Gerçekleşen veriler (boş = henüz girilmemiş) */
  actuals:          PlanActuals;
  /** Aktüel veri kaydetme + actualsThrough güncelleme */
  onActualChange:   (actuals: PlanActuals, actualsThrough?: number) => void;
  /** Aylık ramp-up takvimi (undefined = devre dışı) */
  rampUp?:          RampUpSchedule;
  /** Üretim modelindeki hedef aylık giriş tonajı (ramp scale hesabı için) */
  baseInputTons:    number;
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
  actuals:          {},
  onActualChange:   () => {},
  rampUp:           undefined,
  baseInputTons:    0,
});

export const usePlanData = (): PlanDataCtxValue => React.useContext(PlanCtx);
