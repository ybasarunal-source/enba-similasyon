/**
 * Enba Similasyon - Detaylı İş Planı Hesaplama Motoru
 * ReportStep ve DetailedPlanManager tarafından ortak kullanılır.
 */
import { ASGARI_NET, ASGARI_SGK, DEFAULT_DAILY_MEAL, DEFAULT_WORK_DAYS, DEFAULT_ELECTRIC_PRICE } from './constants';

export interface DetailedPlanResult {
  monthlyResults: any[];
  yearlySum: {
    revenue: number;
    cogs: number;
    opex: number;
    ebitda: number;
    netProfit: number;
    amort: number;
    satisTon: number;
    alisTon: number;
  };
  investmentAnalysis: {
    basabasNokta: number;
    geriOdemeSuresi: number | null;
    kapasiteKullanim: number;
    toplamYatirim: number;
  };
  sensitivityAnalysis: Array<{
    pct: number;
    ebitda: number;
    netProfit: number;
  }>;
  expenseDistribution: {
    malAlim: number;
    nakliye: number;
    personel: number;
    enerji: number;
    diger: number;
  };
}

export function calculateDetailedPlan(planData: any): DetailedPlanResult {
  const monthlyResults = Array.from({ length: 12 }).map((_, i) => {
    // 1. Revenue
    let revenue = 0;
    let satisTon = 0;
    let satisNakliye = 0;
    Object.values(planData.monthlyData?.[i]?.musteriler || {}).forEach((s: any) => {
      const miktar = parseFloat(s.miktar || 0);
      const fiyat = parseFloat(s.fiyat || 0);
      const nakliye = parseFloat(s.nakliye || 0);
      satisTon += miktar;
      revenue += (miktar * fiyat);
      satisNakliye += (miktar * nakliye);
    });

    // 2. Direct Costs (COGS)
    let cogs = 0;
    let alisTon = 0;
    let alisNakliye = 0;
    Object.values(planData.monthlyData?.[i]?.tedarikler || {}).forEach((t: any) => {
      const miktar = parseFloat(t.miktar || 0);
      const fiyat = parseFloat(t.fiyat || 0);
      const nakliye = parseFloat(t.nakliye || 0);
      alisTon += miktar;
      cogs += (miktar * fiyat);
      alisNakliye += (miktar * nakliye);
    });

    // 3. OPEX (Fixed + Dynamic)
    let opex = 0;
    let personelGider = 0;
    let digerOpex = 0;

    // Sabit Giderler
    Object.values(planData.monthlyData?.[i]?.giderler || {}).forEach((g: any) => {
      digerOpex += (parseFloat(g) || 0);
    });
    
    // Personel Giderleri
    (planData.personnelList || []).forEach((role: any) => {
      for(let v=1; v<= (planData.shifts || 1); v++) {
         const count = planData.monthlyData?.[i]?.personeller?.[`${role.id}_v${v}`] || 0;
         personelGider += count * ((planData.baseNetSalary || ASGARI_NET) + (role.ekMaas || 0));
         personelGider += count * ((planData.baseSgk || ASGARI_SGK) + (role.ekSgk || 0));
         personelGider += count * (planData.workDays || DEFAULT_WORK_DAYS) * (planData.dailyMealCost || DEFAULT_DAILY_MEAL);
      }
    });

    // Enerji (Elektrik)
    const shiftHrs = Object.values(planData.shiftHours || {}).slice(0, planData.shifts).reduce((a, b) => (a as any) + (b as any), 0) as number;
    const monthlyHrs = shiftHrs * (planData.workDays || DEFAULT_WORK_DAYS);
    let powerCap = 0;
    (planData.selectedMachines || []).forEach(() => { powerCap += 2.5 * monthlyHrs; });
    const enerjiGider = powerCap * (planData.electricPrice || DEFAULT_ELECTRIC_PRICE) * 0.4;

    opex = personelGider + enerjiGider + digerOpex + satisNakliye + alisNakliye;

    const ebitda = revenue - (cogs + opex);
    
    // Amortisman: her yatırımın kendi geriOdeme süresi kullanılır (varsayılan 60 ay)
    const monthlyAmort = (planData.investments || []).reduce(
      (acc: number, inv: any) => acc + ((parseFloat(inv.maliyet) || 0) / (parseFloat(inv.geriOdeme) || 60)),
      0
    );

    const netProfit = ebitda - monthlyAmort;

    return { 
      revenue, cogs, opex, ebitda, netProfit, monthlyAmort, 
      satisTon, alisTon, satisNakliye, alisNakliye,
      personelGider, enerjiGider, digerOpex
    };
  });

  const yearlySum = monthlyResults.reduce((acc, curr) => ({
    revenue: acc.revenue + curr.revenue,
    cogs: acc.cogs + curr.cogs,
    opex: acc.opex + curr.opex,
    ebitda: acc.ebitda + curr.ebitda,
    netProfit: acc.netProfit + curr.netProfit,
    amort: acc.amort + curr.monthlyAmort,
    satisTon: acc.satisTon + curr.satisTon,
    alisTon: acc.alisTon + curr.alisTon
  }), { revenue: 0, cogs: 0, opex: 0, ebitda: 0, netProfit: 0, amort: 0, satisTon: 0, alisTon: 0 });

  // 4. Investment Analysis
  const totalInvestment = (planData.investments || []).reduce((acc: number, inv: any) => acc + (parseFloat(inv.maliyet) || 0), 0);
  const avgMonthlyNetProfit = yearlySum.netProfit / 12;
  const geriOdemeSuresi = totalInvestment > 0 && avgMonthlyNetProfit > 0 ? totalInvestment / avgMonthlyNetProfit : null;

  // Başabaş Noktası (ton/ay)
  // Sabit Giderler: Personel + Amortisman + DigerOpex + Enerji(sabit varsayılan)
  const monthlyFixedCosts = (yearlySum.opex - monthlyResults.reduce((s, r) => s + r.satisNakliye + r.alisNakliye, 0) + yearlySum.amort) / 12;
  const avgSalesPrice = yearlySum.satisTon > 0 ? yearlySum.revenue / yearlySum.satisTon : 0;
  const avgVariableCostPerTon = yearlySum.satisTon > 0 
    ? (yearlySum.cogs + monthlyResults.reduce((s, r) => s + r.satisNakliye + r.alisNakliye, 0)) / yearlySum.satisTon 
    : 0;

  const basabasNokta = avgSalesPrice > avgVariableCostPerTon 
    ? monthlyFixedCosts / (avgSalesPrice - avgVariableCostPerTon) 
    : Infinity;

  const kapasiteKullanim = basabasNokta > 0 && basabasNokta !== Infinity 
    ? ((yearlySum.satisTon / 12) / basabasNokta) * 100 
    : 0;

  // 5. Sensitivity Analysis (±%20 Satış Fiyatı)
  const sensitivityAnalysis = [-20, -10, 0, 10, 20].map(pct => {
    const factor = 1 + (pct / 100);
    const sRevenue = yearlySum.revenue * factor;
    const sEbitda = sRevenue - yearlySum.cogs - yearlySum.opex;
    return {
      pct,
      ebitda: sEbitda,
      netProfit: sEbitda - yearlySum.amort
    };
  });

  // 6. Expense Distribution
  const expenseDistribution = {
    malAlim: yearlySum.cogs,
    nakliye: monthlyResults.reduce((s, r) => s + r.satisNakliye + r.alisNakliye, 0),
    personel: monthlyResults.reduce((s, r) => s + r.personelGider, 0),
    enerji: monthlyResults.reduce((s, r) => s + r.enerjiGider, 0),
    diger: monthlyResults.reduce((s, r) => s + r.digerOpex, 0)
  };

  return {
    monthlyResults,
    yearlySum,
    investmentAnalysis: {
      basabasNokta,
      geriOdemeSuresi,
      kapasiteKullanim,
      toplamYatirim: totalInvestment
    },
    sensitivityAnalysis,
    expenseDistribution
  };
}
