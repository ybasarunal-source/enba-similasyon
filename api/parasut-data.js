export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Token can come from Authorization header OR _token query param (fallback for header stripping)
  const { path, _token, ...rest } = req.query;
  if (!path) return res.status(400).json({ error: 'path_required' });

  const token = _token || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'no_token' });

  const qs = new URLSearchParams(rest).toString();
  const upstream_url = `https://api.parasut.com${path}${qs ? '?' + qs : ''}`;

  try {
    const upstream = await fetch(upstream_url, {
      headers: {
        Authorization: `Bearer ${token}`,
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
