export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { grant_type, username, password, refresh_token } = req.body || {};

    // Check both standard and VITE_ prefixed env vars
    const clientId = process.env.PARASUT_CLIENT_ID || process.env.VITE_PARASUT_CLIENT_ID;
    const clientSecret = process.env.PARASUT_CLIENT_SECRET || process.env.VITE_PARASUT_CLIENT_SECRET;

    // Diagnostic info (safe to show prefixes)
    const diag = {
      has_client_id: !!clientId,
      has_client_secret: !!clientSecret,
      client_id_prefix: clientId ? clientId.slice(0, 6) : 'missing',
      env_keys: Object.keys(process.env).filter(k => k.includes('PARASUT')),
    };

    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        error: 'missing_env', 
        error_description: 'PARASUT_CLIENT_ID veya PARASUT_CLIENT_SECRET eksik.',
        diagnostics: diag
      });
    }

    const body = new URLSearchParams();
    body.append('grant_type', grant_type || 'password');
    body.append('client_id', clientId);
    body.append('client_secret', clientSecret);

    if (grant_type === 'refresh_token') {
      body.append('refresh_token', refresh_token);
    } else {
      body.append('username', username);
      body.append('password', password);
      body.append('redirect_uri', 'urn:ietf:wg:oauth:2.0:oob');
    }

    const upstream = await fetch('https://api.parasut.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: body.toString(),
    });

    const text = await upstream.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw_response: text };
    }

    // Include diagnostics on failure to help debug "unknown client"
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        ...data,
        diagnostics: diag,
        _hint: 'Client ID/Secret matching confirm and Vercel env vars check required.'
      });
    }

    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'proxy_error', error_description: String(err.message) });
  }
}
