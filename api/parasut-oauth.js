export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { grant_type, username, password, refresh_token } = req.body || {};

    const clientId = process.env.PARASUT_CLIENT_ID;
    const clientSecret = process.env.PARASUT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'missing_env', error_description: 'PARASUT_CLIENT_ID veya PARASUT_CLIENT_SECRET eksik.' });
    }

    // Paraşüt requires multipart/form-data (curl -F style)
    const form = new FormData();
    form.append('client_id', clientId);
    form.append('client_secret', clientSecret);

    if (grant_type === 'refresh_token') {
      form.append('grant_type', 'refresh_token');
      form.append('refresh_token', refresh_token);
    } else {
      form.append('grant_type', 'password');
      form.append('username', username);
      form.append('password', password);
      form.append('redirect_uri', 'urn:ietf:wg:oauth:2.0:oob');
    }

    const upstream = await fetch('https://api.parasut.com/oauth/token', {
      method: 'POST',
      body: form,
    });

    const data = await upstream.text();
    res.status(upstream.status)
      .setHeader('Content-Type', 'application/json')
      .end(data);
  } catch (err) {
    res.status(502).json({ error: 'proxy_error', error_description: String(err.message) });
  }
}
