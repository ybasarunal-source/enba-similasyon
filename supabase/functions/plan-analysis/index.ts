/**
 * plan-analysis — Supabase Edge Function
 *
 * Plan özeti alır, Claude Haiku ile Türkçe iş planı analizi döner.
 * Deploy: npx supabase functions deploy plan-analysis
 * Secret: npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */

import Anthropic from 'npm:@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Sen Enba Simulasyon iş planı danışmanısın. Türk geri dönüşüm ve üretim sektörü uzmanısın.

Sektör kıyaslamaları (geri dönüşüm/plastik):
- EBITDA marjı: %15-25 normal, %25+ iyi, %10 altı kritik
- Hammadde/gelir oranı: %40-60 normal
- Enerji/gelir oranı: %5-12 normal
- Personel/gelir oranı: %8-15 normal

Verilen plan özetine bakarak YALNIZCA şu JSON formatını dön (başka hiçbir şey yazma):
{
  "insights": ["kısa Türkçe öneri 1", "kısa Türkçe öneri 2"],
  "action": "en acil aksiyon (tek cümle, somut rakam içerirse daha iyi)"
}

Her insight max 12 kelime. Action max 15 kelime.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { planSummary } = await req.json();

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY secret eksik' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(planSummary) }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}';

    return new Response(
      JSON.stringify({ result: text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
