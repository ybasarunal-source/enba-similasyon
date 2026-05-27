/**
 * usePlanAI — Plan verilerini Claude Haiku ile analiz eder.
 *
 * - Plan ID değişince otomatik tetiklenir (farklı plan seçildi)
 * - refresh() ile manuel yenilenebilir
 * - Sonuç in-memory cache'lenir (aynı plan ID için tekrar fetch yok)
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabase';
import type { DPlan } from './dpData';

export interface PlanAIResult {
  insights: string[];
  action:   string;
}

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plan-analysis`;

// ─── Plan özetini oluştur ─────────────────────────────────────────────────────
function buildSummary(plan: DPlan, monthly: Record<string, number>) {
  const rev    = monthly['M179'] ?? 0;
  const mat    = monthly['M369'] ?? 0;  // negatif
  const labor  = monthly['M489'] ?? 0;  // negatif
  const energy = monthly['M419'] ?? 0;  // negatif
  const ebitda = monthly['M769'] ?? 0;
  const net    = monthly['M919'] ?? 0;

  const pct = (v: number) =>
    rev > 0 ? Math.round(Math.abs(v) / rev * 1000) / 10 : 0;

  return {
    title:   plan.title ?? 'İsimsiz Plan',
    horizon: plan.horizon ?? 24,
    monthly: {
      revenueK:  Math.round(rev    / 1000),
      materialK: Math.round(mat    / 1000),
      energyK:   Math.round(energy / 1000),
      laborK:    Math.round(labor  / 1000),
      ebitdaK:   Math.round(ebitda / 1000),
      netProfitK:Math.round(net    / 1000),
    },
    margins: {
      ebitdaPct:   pct(ebitda),
      netPct:      pct(net),
      materialPct: pct(mat),
      laborPct:    pct(labor),
      energyPct:   pct(energy),
    },
    production: plan.productionModel ? {
      monthlyInputTons: plan.productionModel.monthlyInputTons,
      inputUnitPriceTL: plan.productionModel.inputUnitPrice ?? 0,
    } : null,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function usePlanAI(
  plan:    DPlan | undefined,
  monthly: Record<string, number>,
) {
  const [result,  setResult]  = useState<PlanAIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Plan ID'ye göre cache: aynı plan için tekrar fetch yok
  const cacheRef = useRef<Record<string, PlanAIResult>>({});
  const lastIdRef = useRef<string | null>(null);

  const analyze = async (force = false) => {
    if (!plan) return;

    // Cache hit
    if (!force && cacheRef.current[plan.id]) {
      setResult(cacheRef.current[plan.id]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(EDGE_URL, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ planSummary: buildSummary(plan, monthly) }),
      });

      const data = await res.json() as { result?: string; error?: string };

      if (data.error) throw new Error(data.error);
      if (!data.result) throw new Error('Boş yanıt');

      // JSON parse — Claude bazen ```json blok``` içinde verebilir, temizle
      const clean = data.result
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/,       '')
        .replace(/\s*```$/,       '')
        .trim();

      const parsed: PlanAIResult = JSON.parse(clean);
      cacheRef.current[plan.id] = parsed;
      setResult(parsed);
      lastIdRef.current = plan.id;
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  // Plan değişince (farklı plan) otomatik analiz
  useEffect(() => {
    if (plan && plan.id !== lastIdRef.current) {
      void analyze();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id]);

  return {
    result,
    loading,
    error,
    refresh: () => analyze(true),  // zorla yenile
  };
}
