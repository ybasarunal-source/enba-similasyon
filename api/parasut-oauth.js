export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const upstream = await fetch('https://api.parasut.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: typeof req.body === 'string' ? req.body : new URLSearchParams(req.body).toString(),
    });

    const data = await upstream.text();
    res.status(upstream.status)
      .setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
      .end(data);
  } catch (err) {
    res.status(502).json({ error: 'proxy_error', error_description: String(err.message) });
  }
}
