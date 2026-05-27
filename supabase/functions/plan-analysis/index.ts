/**
 * plan-analysis — Supabase Edge Function
 * hyper-service ile aynı pattern: raw fetch + 'uygulama-notes' secret
 *
 * body.planSummary (question yok) → otomatik analiz → { result: jsonString }
 * body.planSummary + body.question → serbest soru → { answer: string }
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('uygulama-notes');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();

    // ── Serbest soru (planSummary + question) ────────────────────────────────
    if (body.planSummary && body.question) {
      const historyLines = ((body.history ?? []) as { role: string; text: string }[])
        .map(m => `${m.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${m.text}`)
        .join('\n');

      const prompt = `Sen Enba Simulasyon iş planı danışmanısın. Türk geri dönüşüm ve üretim sektörü uzmanısın.

Kullanıcının iş planı:
${JSON.stringify(body.planSummary)}

${historyLines ? `Önceki konuşma:\n${historyLines}\n` : ''}Kullanıcı sorusu: ${body.question as string}

Türkçe, kısa ve anlaşılır yanıt ver (max 4 cümle). Sayısal analiz gerekiyorsa hesapla ve sonucu belirt.`;

      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!anthropicRes.ok) {
        const err = await anthropicRes.json();
        return new Response(JSON.stringify({ error: err.error?.message ?? 'Anthropic error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await anthropicRes.json();
      const answer = (data.content?.[0]?.text as string | undefined) ?? 'Yanıt alınamadı.';

      return new Response(JSON.stringify({ answer }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Otomatik analiz (sadece planSummary) ─────────────────────────────────
    const { planSummary } = body;

    const prompt = `Sen Enba Simulasyon iş planı danışmanısın. Türk geri dönüşüm ve üretim sektörü uzmanısın.

Sektör kıyaslamaları (plastik/geri dönüşüm):
- EBITDA marjı: %15-25 normal, %25+ iyi, %10 altı kritik
- Hammadde/gelir oranı: %40-60 normal
- Enerji/gelir oranı: %5-12 normal
- Personel/gelir oranı: %8-15 normal

Plan verisi:
${JSON.stringify(planSummary)}

SADECE aşağıdaki JSON formatında yanıt ver. Başka hiçbir şey yazma:
{"insights":["kısa Türkçe öneri 1 (max 12 kelime)","kısa Türkçe öneri 2 (max 12 kelime)"],"action":"en acil aksiyon (max 15 kelime)"}`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json();
      return new Response(JSON.stringify({ error: err.error?.message ?? 'Anthropic error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await anthropicRes.json();
    const raw = (data.content?.[0]?.text as string | undefined) ?? '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    const result = match ? match[0] : '{"insights":[],"action":""}';

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
