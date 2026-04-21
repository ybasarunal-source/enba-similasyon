export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { path, ...rest } = req.query;
  if (!path) return res.status(400).json({ error: 'path_required' });

  const qs = new URLSearchParams(rest).toString();
  const upstream_url = `https://api.parasut.com${path}${qs ? '?' + qs : ''}`;

  try {
    const upstream = await fetch(upstream_url, {
      headers: {
        Authorization: req.headers.authorization || '',
        Accept: 'application/json',
      },
    });

    const data = await upstream.text();
    res.status(upstream.status)
      .setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
      .end(data);
  } catch (err) {
    res.status(502).json({ error: 'proxy_error', message: String(err.message) });
  }
}
