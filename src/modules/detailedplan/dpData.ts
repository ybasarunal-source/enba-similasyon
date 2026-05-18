// DetailedPlan — data model, mock data, and calculation helpers

export interface Product {
  id: string;
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
  name: string;
  group: string;
  monthly: number;
  growth: number;
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

export interface SeriesPoint extends Period {
  idx: number;
  revenue: number;
  varCost: number;
  fixCost: number;
  opex: number;
  ebitda: number;
  net: number;
}

export const MONTHS_TR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

const buildMonths = (count: number, startYear = 2025, startMonth = 0): Period[] => {
  const out: Period[] = [];
  for (let i = 0; i < count; i++) {
    const m = (startMonth + i) % 12;
    const y = startYear + Math.floor((startMonth + i) / 12);
    out.push({ key: `${y}-${String(m+1).padStart(2,'0')}`, label: `${MONTHS_TR[m]} ${String(y).slice(2)}`, m, y });
  }
  return out;
};

export const PERIODS: Period[] = buildMonths(24, 2025, 0);

export const PRODUCTS: Product[] = [
  {
    id: 'p1', name: 'PET Granül (Şeffaf)', category: 'Granül Üretim', unit: 'ton',
    price: 28500, priceGrowth: 0.08,
    seasonality: [0.9,0.95,1.0,1.05,1.1,1.15,1.1,1.05,1.05,1.0,0.95,0.9],
    volume: 120, volumeGrowth: 0.18, varCostRatio: 0.62, color: '#E35205',
  },
  {
    id: 'p2', name: 'PET Granül (Renkli)', category: 'Granül Üretim', unit: 'ton',
    price: 22800, priceGrowth: 0.07,
    seasonality: [0.85,0.9,1.0,1.05,1.1,1.15,1.15,1.05,1.0,0.95,0.95,0.85],
    volume: 95, volumeGrowth: 0.14, varCostRatio: 0.66, color: '#FF8A3D',
  },
  {
    id: 'p3', name: 'HDPE Granül', category: 'Granül Üretim', unit: 'ton',
    price: 24200, priceGrowth: 0.06,
    seasonality: [0.95,1.0,1.05,1.05,1.0,1.0,0.95,0.95,1.0,1.05,1.05,0.95],
    volume: 60, volumeGrowth: 0.10, varCostRatio: 0.64, color: '#F2A93B',
  },
  {
    id: 'p4', name: 'Pelet (LDPE)', category: 'Granül Üretim', unit: 'ton',
    price: 19500, priceGrowth: 0.05,
    seasonality: [1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0],
    volume: 40, volumeGrowth: 0.08, varCostRatio: 0.68, color: '#9A9A9A',
  },
  {
    id: 'p5', name: 'Atık Toplama Hizmeti', category: 'Hizmet', unit: 'sefer',
    price: 1850, priceGrowth: 0.12,
    seasonality: [0.9,0.95,1.0,1.05,1.05,1.0,0.95,0.9,1.0,1.1,1.1,1.0],
    volume: 220, volumeGrowth: 0.20, varCostRatio: 0.42, color: '#5B9DFF',
  },
  {
    id: 'p6', name: 'Geri Dönüşüm Sertifikası', category: 'Hizmet', unit: 'adet',
    price: 4200, priceGrowth: 0.04,
    seasonality: [0.7,0.8,1.0,1.1,1.2,1.3,1.2,1.1,1.0,0.95,0.85,0.8],
    volume: 30, volumeGrowth: 0.25, varCostRatio: 0.18, color: '#3DBE7C',
  },
];

export const FIXED_EXPENSES: FixedExpense[] = [
  { id: 'e1', name: 'Personel Giderleri',   group: 'Sabit',           monthly: 285000, growth: 0.20 },
  { id: 'e2', name: 'Kira & Aidat',         group: 'Sabit',           monthly:  72000, growth: 0.30 },
  { id: 'e3', name: 'Elektrik & Doğalgaz',  group: 'Sabit',           monthly: 138000, growth: 0.35 },
  { id: 'e4', name: 'Bakım & Onarım',       group: 'Sabit',           monthly:  48000, growth: 0.18 },
  { id: 'e5', name: 'Lojistik & Nakliye',   group: 'Yarı Değişken',   monthly:  92000, growth: 0.22 },
  { id: 'e6', name: 'Pazarlama & Satış',    group: 'Sabit',           monthly:  36000, growth: 0.15 },
  { id: 'e7', name: 'Sigorta & Yasal',      group: 'Sabit',           monthly:  28000, growth: 0.10 },
  { id: 'e8', name: 'Yönetim & Genel',      group: 'Sabit',           monthly:  54000, growth: 0.12 },
];

export const SCENARIOS: Record<string, Scenario> = {
  baz:      { id: 'baz',      label: 'Baz',      color: '#E35205', rev: 1.00, cost: 1.00, hint: 'Mevcut trendin devamı.' },
  iyimser:  { id: 'iyimser',  label: 'İyimser',  color: '#3DBE7C', rev: 1.12, cost: 0.96, hint: 'Talep artışı + verimlilik kazanımı.' },
  kotumser: { id: 'kotumser', label: 'Kötümser', color: '#E5484D', rev: 0.84, cost: 1.08, hint: 'Daralan talep + maliyet baskısı.' },
};

export const CASH_EVENTS: CashEvent[] = [
  { id: 'inv1', name: 'Ana Üretim Hattı Yatırımı', type: 'investing', months: [{ idx: 0,  amount: -4_800_000 }] },
  { id: 'inv2', name: 'Ek Granül Makinesi',         type: 'investing', months: [{ idx: 8,  amount: -1_250_000 }] },
  { id: 'inv3', name: 'Bina Modernizasyonu',        type: 'investing', months: [{ idx: 14, amount:  -780_000 }] },
  { id: 'inv4', name: 'IT & ERP Lisansları',        type: 'investing', months: [{ idx: 2,  amount:  -180_000 }, { idx: 14, amount: -180_000 }] },
  { id: 'fin1', name: 'Banka Kredisi (Çekim)',      type: 'financing', months: [{ idx: 0,  amount: 3_000_000 }] },
  { id: 'fin2', name: 'Kredi Anapara + Faiz Ödemesi', type: 'financing',
    months: Array.from({ length: 24 }, (_, i) => ({ idx: i, amount: -150_000 })) },
  { id: 'fin3', name: 'Sermaye Artırımı',           type: 'financing', months: [{ idx: 6,  amount: 1_500_000 }] },
  { id: 'fin4', name: 'Temettü Dağıtımı',           type: 'financing', months: [{ idx: 11, amount:  -800_000 }, { idx: 23, amount: -900_000 }] },
];

export const OPENING_CASH = 1_200_000;
export const ACTUALS_THROUGH = 16;

// ---- Calculation helpers ----

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

export const fixedCostFor = (e: FixedExpense, i: number, scen: Scenario = SCENARIOS.baz) =>
  e.monthly * Math.pow(1 + e.growth, i / 12) * scen.cost;

export const buildSeries = (scen: Scenario = SCENARIOS.baz): SeriesPoint[] =>
  PERIODS.map((p, i) => {
    const revenue = PRODUCTS.reduce((s, prod) => s + revenueFor(prod, i, scen), 0);
    const varCost = PRODUCTS.reduce((s, prod) => s + varCostFor(prod, i, scen), 0);
    const fixCost = FIXED_EXPENSES.reduce((s, e) => s + fixedCostFor(e, i, scen), 0);
    const opex = varCost + fixCost;
    const ebitda = revenue - opex;
    const depreciation = 145000;
    const tax = Math.max(0, (ebitda - depreciation)) * 0.22;
    const net = ebitda - depreciation - tax;
    return { ...p, idx: i, revenue, varCost, fixCost, opex, ebitda, net };
  });

export const cashFlowFor = (i: number, scen: Scenario) => {
  const rev  = PRODUCTS.reduce((s, p) => s + revenueFor(p, i, scen), 0);
  const varc = PRODUCTS.reduce((s, p) => s + varCostFor(p, i, scen), 0);
  const fixc = FIXED_EXPENSES.reduce((s, e) => s + fixedCostFor(e, i, scen), 0);
  const ebitda = rev - varc - fixc;
  const dep = 145_000;
  const tax = Math.max(0, ebitda - dep) * 0.22;
  const operating = ebitda - tax;
  let investing = 0, financing = 0;
  CASH_EVENTS.forEach(ev => {
    const m = ev.months.find(x => x.idx === i);
    if (m) {
      if (ev.type === 'investing') investing += m.amount;
      else financing += m.amount;
    }
  });
  return { operating, investing, financing, net: operating + investing + financing };
};

// ---- Actuals (deterministic mock noise) ----

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619 >>> 0;
  return h / 0xffffffff;
};

export const actualRevenueFor = (p: Product, i: number, scen: Scenario = SCENARIOS.baz): number | null => {
  if (i >= ACTUALS_THROUGH) return null;
  const n = (hash(p.id + '|r|' + i) - 0.5) * 0.28;
  const bias = (p.id === 'p5' || p.id === 'p6') ? 0.06 : 0;
  const seasonalBoost = (i % 12 >= 4 && i % 12 <= 7) ? 0.05 : 0;
  return revenueFor(p, i, scen) * (1 + n + bias + seasonalBoost);
};

export const actualVarCostFor = (p: Product, i: number, scen: Scenario = SCENARIOS.baz): number | null => {
  if (i >= ACTUALS_THROUGH) return null;
  const rev = actualRevenueFor(p, i, scen)!;
  const n = (hash(p.id + '|c|' + i) - 0.4) * 0.20;
  return rev * p.varCostRatio * (1 + n);
};

export const actualFixedCostFor = (e: FixedExpense, i: number, scen: Scenario = SCENARIOS.baz): number | null => {
  if (i >= ACTUALS_THROUGH) return null;
  const budget = fixedCostFor(e, i, scen);
  const n = (hash(e.id + '|f|' + i) - 0.45) * 0.16;
  return budget * (1 + n);
};

export const bvaForPeriod = (i: number, scen: Scenario) => {
  const budgetRev  = PRODUCTS.reduce((s, p) => s + revenueFor(p, i, scen), 0);
  const budgetVar  = PRODUCTS.reduce((s, p) => s + varCostFor(p, i, scen), 0);
  const budgetFix  = FIXED_EXPENSES.reduce((s, e) => s + fixedCostFor(e, i, scen), 0);
  const budgetOpex = budgetVar + budgetFix;
  const budgetEb   = budgetRev - budgetOpex;

  if (i >= ACTUALS_THROUGH) return {
    hasActual: false,
    budget: { revenue: budgetRev, opex: budgetOpex, ebitda: budgetEb, varCost: budgetVar, fixCost: budgetFix },
    actual: { revenue: 0, opex: 0, ebitda: 0, varCost: 0, fixCost: 0 },
  };

  const actualRev  = PRODUCTS.reduce((s, p) => s + (actualRevenueFor(p, i, scen) ?? 0), 0);
  const actualVar  = PRODUCTS.reduce((s, p) => s + (actualVarCostFor(p, i, scen) ?? 0), 0);
  const actualFix  = FIXED_EXPENSES.reduce((s, e) => s + (actualFixedCostFor(e, i, scen) ?? 0), 0);
  const actualOpex = actualVar + actualFix;
  const actualEb   = actualRev - actualOpex;
  return {
    hasActual: true,
    budget: { revenue: budgetRev, opex: budgetOpex, ebitda: budgetEb, varCost: budgetVar, fixCost: budgetFix },
    actual: { revenue: actualRev, opex: actualOpex, ebitda: actualEb, varCost: actualVar, fixCost: actualFix },
  };
};

// ---- Formatters ----

export const fmtTL = (n: number | null | undefined, opts: { compact?: boolean; sign?: boolean } = {}): string => {
  if (n == null || isNaN(n)) return '—';
  const { compact = true, sign = false } = opts;
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
