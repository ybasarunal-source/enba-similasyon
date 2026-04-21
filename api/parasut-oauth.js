export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Read raw body from stream (Vercel body parser disabled)
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString();

    // Parse incoming fields (username + password from frontend)
    const incoming = Object.fromEntries(new URLSearchParams(rawBody));

    // Build full OAuth body with server-side client credentials
    const body = new URLSearchParams({
      grant_type: incoming.grant_type || 'password',
      client_id: process.env.PARASUT_CLIENT_ID || '',
      client_secret: process.env.PARASUT_CLIENT_SECRET || '',
      username: incoming.username || '',
      password: incoming.password || '',
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
    });

    const upstream = await fetch('https://api.parasut.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await upstream.text();
    res.status(upstream.status)
      .setHeader('Content-Type', 'application/json')
      .end(data);
  } catch (err) {
    res.status(502).json({ error: 'proxy_error', error_description: String(err.message) });
  }
}
