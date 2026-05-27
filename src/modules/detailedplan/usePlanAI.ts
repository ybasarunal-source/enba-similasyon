/**
 * usePlanAI — Plan verilerini Claude Haiku ile analiz eder + sohbet desteği.
 *
 * - Plan ID değişince otomatik tetiklenir (farklı plan seçildi)
 * - refresh() ile manuel analiz yenilenebilir
 * - ask(question) ile serbest soru sorulabilir
 * - Analiz sonucu in-memory cache'lenir (aynı plan ID için tekrar fetch yok)
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabase';
import type { DPlan } from './dpData';

export interface PlanAIResult {
  insights: string[];
  action:   string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hyper-service`;

// ─── Plan özetini oluştur ─────────────────────────────────────────────────────
function buildSummary(plan: DPlan, monthly: Record<string, number>) {
  const rev    = monthly['M179'] ?? 0;
  const mat    = monthly['M369'] ?? 0;
  const labor  = monthly['M489'] ?? 0;
  const energy = monthly['M419'] ?? 0;
  const ebitda = monthly['M769'] ?? 0;
  const net    = monthly['M919'] ?? 0;

  const pct = (v: number) =>
    rev > 0 ? Math.round(Math.abs(v) / rev * 1000) / 10 : 0;

  return {
    title:   plan.title ?? 'İsimsiz Plan',
    horizon: plan.horizon ?? 24,
    monthly: {
      revenueK:   Math.round(rev    / 1000),
      materialK:  Math.round(mat    / 1000),
      energyK:    Math.round(energy / 1000),
      laborK:     Math.round(labor  / 1000),
      ebitdaK:    Math.round(ebitda / 1000),
      netProfitK: Math.round(net    / 1000),
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

// ─── Auth token yardımcısı ────────────────────────────────────────────────────
async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? (import.meta.env.VITE_SUPABASE_ANON_KEY as string);
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function usePlanAI(
  plan:    DPlan | undefined,
  monthly: Record<string, number>,
) {
  const [result,   setResult]   = useState<PlanAIResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [asking,   setAsking]   = useState(false);

  const cacheRef   = useRef<Record<string, PlanAIResult>>({});
  const lastIdRef  = useRef<string | null>(null);
  // Mevcut mesajları ask() içinde okumak için ref
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  // ── Otomatik analiz ─────────────────────────────────────────────────────────
  const analyze = async (force = false) => {
    if (!plan) return;

    if (!force && cacheRef.current[plan.id]) {
      setResult(cacheRef.current[plan.id]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authToken = await getAuthToken();
      const res = await fetch(EDGE_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body:    JSON.stringify({ planSummary: buildSummary(plan, monthly) }),
      });

      const data = await res.json() as { result?: string; error?: string };
      if (data.error) throw new Error(data.error);
      if (!data.result) throw new Error('Boş yanıt');

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

  // ── Serbest soru ─────────────────────────────────────────────────────────────
  const ask = async (question: string) => {
    if (!plan || !question.trim() || asking) return;

    const userMsg: ChatMessage = { role: 'user', text: question.trim() };
    setMessages(prev => [...prev, userMsg]);
    setAsking(true);

    try {
      const authToken = await getAuthToken();
      // Son 6 mesajı (3 çift) geçmiş olarak gönder — current ref'te mevcut liste var
      const history = messagesRef.current.slice(-6);

      const res = await fetch(EDGE_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body:    JSON.stringify({
          planSummary: buildSummary(plan, monthly),
          question:    userMsg.text,
          history,
        }),
      });

      const data = await res.json() as { answer?: string; error?: string };
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: data.answer ?? 'Yanıt alınamadı.',
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Hata oluştu, tekrar dene.',
      }]);
    } finally {
      setAsking(false);
    }
  };

  // ── Plan değişince sohbeti sıfırla + yeni analiz ──────────────────────────
  useEffect(() => {
    if (plan && plan.id !== lastIdRef.current) {
      setMessages([]);
      void analyze();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id]);

  return {
    result,
    loading,
    error,
    refresh: () => analyze(true),
    messages,
    asking,
    ask,
    clearChat: () => setMessages([]),
  };
}
