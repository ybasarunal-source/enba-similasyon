// DetailedPlan — kural tabanlı plan asistanı
// Şu an: deterministik kurallar.
// Gelecek: calcProductionResults() çıktısı + plan verisi AI agent'a context olarak geçilecek.

import {
  ProductionModel,
  ProductionCalcResult,
  MachineCapacity,
  calcProductionResults,
} from './dpData';

// ─── Insight tipleri ─────────────────────────────────────────────────────────

export type InsightLevel    = 'error' | 'warning' | 'info' | 'success';
export type InsightCategory = 'bottleneck' | 'missing_cost' | 'capacity' | 'financial' | 'ok';

export interface InsightAction {
  label:    string;
  type:     'select_option' | 'add_cost' | 'go_step';
  payload?: Record<string, unknown>;
}

export interface Insight {
  id:        string;
  level:     InsightLevel;
  category:  InsightCategory;
  title:     string;
  body:      string;
  actions?:  InsightAction[];
  data?:     Record<string, number | string | boolean>;
}

// ─── Geri dönüşüm tesisi yaygın gider kontrol listesi ────────────────────────
export const RECYCLING_CHECKLIST = [
  { id: 'amortisman',  label: 'Amortisman',             hint: 'Makine yatırımı varsa aylık amortisman gideri girilmeli' },
  { id: 'sigorta',     label: 'Sigorta',                 hint: 'Tesis ve makine sigortası' },
  { id: 'sgk',         label: 'SGK İşveren Payı',        hint: '~%22 işveren SGK payı brüt maaşa dahil değilse ekle' },
  { id: 'bakim',       label: 'Bakım-Onarım',            hint: 'Makine bakım gideri (CostCenter veya proje gideri)' },
  { id: 'cevre',       label: 'Çevre Mühendisliği',      hint: 'Atık yönetimi + çevre mühendisliği hizmet bedeli' },
  { id: 'forklift',    label: 'Forklift/Taşıma',         hint: 'Forklift kirası veya operatörü maliyeti' },
  { id: 'ambalaj',     label: 'Ambalaj (çuval/big-bag)', hint: 'Ürün başına ambalaj maliyeti tanımlanmamış' },
  { id: 'nakliye',     label: 'Nakliye/Lojistik',        hint: 'Hammadde gelişi veya ürün dağıtımı nakliyesi' },
];

// ─── Ana fonksiyon ───────────────────────────────────────────────────────────

export function generateInsights(
  model:         ProductionModel,
  hasCostCenter: boolean,
  calc?:         ProductionCalcResult,
): Insight[] {
  const result  = calc ?? calcProductionResults(model);
  const insights: Insight[] = [];

  // 1. Makine darboğazları ──────────────────────────────────────────────────
  result.machineCapacities.forEach((mc: MachineCapacity) => {
    if (!mc.isBottleneck) return;

    const deficitTons       = mc.requiredTons - mc.maxTonsPerMonth;
    const extraHoursPerDay  = deficitTons / mc.machine.capacityTonPerHour / model.params.daysPerMonth;

    // Fazla mesai maliyeti: mevcut saatlik ücret × 1.5 × fazla saat
    const productionWorker  = model.workers.find(w => w.stage === 'production');
    const hourlyWage        = productionWorker
      ? productionWorker.monthlyCost / (model.params.hoursPerDay * model.params.daysPerMonth)
      : 0;
    const overtimeCostMonth = hourlyWage * 1.5 * extraHoursPerDay * model.params.daysPerMonth;

    // Ek personel maliyeti: bir üretim ustası
    const hireCostMonth     = productionWorker?.monthlyCost ?? 82_000;

    const recommendation    = (overtimeCostMonth > 0 && overtimeCostMonth < hireCostMonth)
      ? 'overtime' : 'hire';

    insights.push({
      id:       `bottleneck_${mc.machine.id}`,
      level:    'error',
      category: 'bottleneck',
      title:    `Darboğaz: ${mc.machine.name}`,
      body:     `Kapasite ${fmtTon(mc.maxTonsPerMonth)}/ay, ihtiyaç ${fmtTon(mc.requiredTons)}/ay. `
              + `Günde +${extraHoursPerDay.toFixed(1)} sa fazla mesai gerekiyor.`,
      actions: [
        {
          label:   `Fazla mesai seç (+${extraHoursPerDay.toFixed(1)} sa/gün)`,
          type:    'select_option',
          payload: { type: 'overtime', machineId: mc.machine.id, extraHoursPerDay, costPerMonth: overtimeCostMonth },
        },
        {
          label:   'Ek personel / 2. vardiya',
          type:    'select_option',
          payload: { type: 'hire', machineId: mc.machine.id, costPerMonth: hireCostMonth },
        },
      ],
      data: {
        maxCapacity:    mc.maxTonsPerMonth,
        required:       mc.requiredTons,
        deficit:        deficitTons,
        extraHoursPerDay,
        overtimeCost:   overtimeCostMonth,
        hireCost:       hireCostMonth,
        recommendation,
        cheaper:        recommendation === 'overtime'
          ? `Fazla mesai ${fmtTL(overtimeCostMonth)}/ay daha ucuz`
          : `Ek personel ${fmtTL(hireCostMonth)}/ay — kıdem sonrası daha verimli`,
      },
    });
  });

  // 2. Yüksek kapasite kullanımı uyarısı (>85%, darboğaz değil) ─────────────
  result.machineCapacities.forEach((mc: MachineCapacity) => {
    if (mc.isBottleneck || mc.utilization <= 0.85) return;
    insights.push({
      id:       `high_util_${mc.machine.id}`,
      level:    'warning',
      category: 'capacity',
      title:    `Yüksek kullanım: ${mc.machine.name}`,
      body:     `%${(mc.utilization * 100).toFixed(0)} kapasitede çalışıyor. Arıza/bakım durumunda darboğaz riski var.`,
      data:     { utilization: mc.utilization },
    });
  });

  // 3. İşçi kapasitesi darboğazı ───────────────────────────────────────────
  result.workerCapacities.forEach(wc => {
    if (wc.utilization <= 1.0) return;
    const deficit      = model.monthlyInputTons - wc.maxTonsPerMonth;
    const extraWorkers = Math.ceil(deficit / (wc.worker.capacityTonPerMonth ?? 1));
    insights.push({
      id:       `worker_bn_${wc.worker.id}`,
      level:    'error',
      category: 'bottleneck',
      title:    `İşçi yetmiyor: ${wc.worker.name}`,
      body:     `${wc.count} işçi max ${fmtTon(wc.maxTonsPerMonth)}/ay işleyebilir, ihtiyaç ${fmtTon(model.monthlyInputTons)}/ay. `
              + `+${extraWorkers} işçi veya fazla mesai gerekiyor.`,
      data:     { count: wc.count, maxCapacity: wc.maxTonsPerMonth, required: model.monthlyInputTons, extraWorkers },
    });
  });

  // 4. Düşük boş kapasite uyarısı — makine %90+ kullanımda ────────────────
  const highUtilMachines = result.machineCapacities.filter(
    mc => !mc.isBottleneck && mc.utilization > 0.90
  );
  if (highUtilMachines.length > 0 && result.bottleneck === null) {
    insights.push({
      id:       'low_spare_capacity',
      level:    'warning',
      category: 'capacity',
      title:    'Düşük boş kapasite',
      body:     `${highUtilMachines.map(m => m.machine.name).join(', ')} %90+ kullanımda. `
              + 'Üretim artışı veya makine arızasına karşı tampon yok.',
    });
  }

  // 5. Sabit gider merkezi seçilmemiş ──────────────────────────────────────
  if (!hasCostCenter) {
    insights.push({
      id:       'no_cost_center',
      level:    'warning',
      category: 'missing_cost',
      title:    'Gider Merkezi seçilmemiş',
      body:     'Kira, bakım, muhasebe gibi sabit giderler Plan Bilgileri adımında Gider Merkezi seçilerek eklenmeli.',
      actions:  [{ label: 'Plan Bilgilerine Git', type: 'go_step', payload: { step: 0 } }],
    });
  }

  // 6. Ambalaj tanımlanmamış ────────────────────────────────────────────────
  const unpackaged = model.outputProducts.filter(op => !op.packagingTonPerUnit);
  if (unpackaged.length > 0) {
    insights.push({
      id:       'no_packaging',
      level:    'info',
      category: 'missing_cost',
      title:    'Ambalaj tanımlı değil',
      body:     `${unpackaged.map(p => p.name).join(', ')} için çuval/big-bag maliyeti girilmemiş.`,
      actions:  [{ label: 'Parametrelere Git', type: 'go_step', payload: { step: 1 } }],
    });
  }

  // 7. SGK hatırlatması ─────────────────────────────────────────────────────
  const hasSGKEntry = model.otherVariableCosts.some(c =>
    c.name.toLowerCase().includes('sgk') || c.mcode === 'M489.01'
  );
  const hasWorkers = model.workers.some(w => w.monthlyCost > 0);
  if (hasWorkers && !hasSGKEntry) {
    insights.push({
      id:       'check_sgk',
      level:    'info',
      category: 'missing_cost',
      title:    'SGK işveren payı kontrol edin',
      body:     'Personel maaşları brüt girilmişse SGK zaten dahildir. Net maaş girdiyseniz ~%22 işveren payı ekleyin.',
    });
  }

  // 8. Başarı mesajları ─────────────────────────────────────────────────────
  if (result.bottleneck === null && result.machineCapacities.length > 0) {
    insights.push({
      id:       'capacity_ok',
      level:    'success',
      category: 'ok',
      title:    'Kapasite yeterli',
      body:     'Tüm makineler hedef tonajı karşılıyor.',
    });
  }

  if (result.totalRevenue > 0 && result.totalVariableCost > 0) {
    const grossMargin = (result.totalRevenue - result.totalVariableCost) / result.totalRevenue;
    if (grossMargin < 0) {
      insights.push({
        id:       'negative_margin',
        level:    'error',
        category: 'financial',
        title:    'Değişken maliyetler geliri aşıyor',
        body:     `Değişken maliyetler gelirden ${fmtTL(result.totalVariableCost - result.totalRevenue)} fazla. `
                + 'Satış fiyatı veya hammadde maliyetini gözden geçirin.',
        data:     { grossMargin },
      });
    } else if (grossMargin < 0.15) {
      insights.push({
        id:       'low_margin',
        level:    'warning',
        category: 'financial',
        title:    'Brüt marj düşük',
        body:     `Değişken maliyetler sonrası brüt marj %${(grossMargin * 100).toFixed(1)}. Sabit giderler karşılanamayabilir.`,
        data:     { grossMargin },
      });
    }
  }

  return insights;
}

// ─── Darboğaz çözümü → maliyet karşılaştırması ───────────────────────────────

export interface BottleneckAlternative {
  machineId:         string;
  machineName:       string;
  deficitTons:       number;
  extraHoursPerDay:  number;

  // Seçenek A: Fazla mesai
  overtimeCostMonth: number;
  overtimeDesc:      string;

  // Seçenek B: Ek personel
  hireCostMonth:     number;
  hireDesc:          string;

  recommendation:    'overtime' | 'hire' | 'neither';
  savingsPerMonth:   number;
}

export function calcBottleneckAlternatives(
  model: ProductionModel,
  mc:    MachineCapacity,
): BottleneckAlternative {
  const deficitTons      = mc.requiredTons - mc.maxTonsPerMonth;
  const extraHoursPerDay = deficitTons / mc.machine.capacityTonPerHour / model.params.daysPerMonth;

  const productionWorker = model.workers.find(w => w.stage === 'production');
  const hourlyWage       = productionWorker
    ? productionWorker.monthlyCost / (model.params.hoursPerDay * model.params.daysPerMonth)
    : 0;

  const overtimeCostMonth = hourlyWage > 0
    ? hourlyWage * 1.5 * extraHoursPerDay * model.params.daysPerMonth
    : 0;
  const hireCostMonth     = productionWorker?.monthlyCost ?? 82_000;

  const recommendation: 'overtime' | 'hire' | 'neither' =
    overtimeCostMonth > 0 && overtimeCostMonth < hireCostMonth ? 'overtime'
    : hireCostMonth > 0 ? 'hire'
    : 'neither';

  const savingsPerMonth = Math.abs(overtimeCostMonth - hireCostMonth);

  return {
    machineId:    mc.machine.id,
    machineName:  mc.machine.name,
    deficitTons,
    extraHoursPerDay,
    overtimeCostMonth,
    overtimeDesc: `+${extraHoursPerDay.toFixed(1)} sa/gün fazla mesai → ${fmtTL(overtimeCostMonth)}/ay`,
    hireCostMonth,
    hireDesc:     `Ek personel / 2. vardiya → ${fmtTL(hireCostMonth)}/ay`,
    recommendation,
    savingsPerMonth,
  };
}

// ─── Senaryo tablosu (5 input tonu → kâr/zarar) ──────────────────────────────

export interface ScenarioRow {
  inputTons:       number;
  netOutputTons:   number;
  revenue:         number;
  variableCost:    number;
  grossProfit:     number;
  grossMarginPct:  number;
}

export function calcScenariosTable(
  model:          ProductionModel,
  fixedCostMonth: number,                        // CostCenter sabit maliyeti
  scenarioTons:   number[] = [30, 50, 70, 90, 110],
): ScenarioRow[] {
  return scenarioTons.map(inputTons => {
    const m    = { ...model, monthlyInputTons: inputTons };
    const calc = calcProductionResults(m);
    const grossProfit   = calc.totalRevenue - calc.totalVariableCost - fixedCostMonth;
    const grossMarginPct = calc.totalRevenue > 0
      ? (grossProfit / calc.totalRevenue) * 100
      : 0;
    return {
      inputTons,
      netOutputTons:  calc.netOutputTons,
      revenue:        calc.totalRevenue,
      variableCost:   calc.totalVariableCost,
      grossProfit,
      grossMarginPct,
    };
  });
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function fmtTon(n: number): string {
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' ton';
}

function fmtTL(n: number): string {
  if (Math.abs(n) >= 1_000_000)
    return '₺' + (n / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' Mn';
  if (Math.abs(n) >= 1_000)
    return '₺' + (n / 1_000).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' Bin';
  return '₺' + Math.round(n).toLocaleString('tr-TR');
}
