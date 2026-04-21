export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { grant_type, username, password, refresh_token } = req.body || {};

    // 1. Get and normalize credentials (trimming prevents accidental spaces)
    const rawClientId = process.env.PARASUT_CLIENT_ID || process.env.VITE_PARASUT_CLIENT_ID;
    const rawClientSecret = process.env.PARASUT_CLIENT_SECRET || process.env.VITE_PARASUT_CLIENT_SECRET;
    
    const clientId = rawClientId?.trim();
    const clientSecret = rawClientSecret?.trim();

    // Diagnostic info (safe to show prefixes)
    const diag = {
      has_client_id: !!clientId,
      has_client_secret: !!clientSecret,
      client_id_prefix: clientId ? clientId.slice(0, 6) : 'missing',
      env_source: process.env.PARASUT_CLIENT_ID ? 'STANDARD' : (process.env.VITE_PARASUT_CLIENT_ID ? 'VITE_PREFIXED' : 'NONE'),
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
      // Removed redirect_uri as it is usually not required for password grant and can cause mismatches
      // Added standard scopes
      body.append('scope', 'read write');
    }

    // 3. Make the request to Paraşüt
    // Base64 encode for Basic Auth header fallback
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Authorization': `Basic ${basicAuth}`,
      'User-Agent': 'EnbaPlatform/1.0.0 (https://uygulama.basarunal.com)',
    };

    const upstream = await fetch('https://api.parasut.com/oauth/token', {
      method: 'POST',
      headers,
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
        diagnostics: {
          ...diag,
          basic_auth_sent: true,
          content_type: headers['Content-Type'],
        },
        _hint: 'Client ID/Secret still rejected. Please check Paraşüt Portal: 1. Status is Active? 2. Password Grant is enabled? 3. Redirect URI matches index origin?'
      });
    }

    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'proxy_error', error_description: String(err.message) });
  }
}
