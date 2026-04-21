export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    let bodyData = req.body;
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch (e) { /* ignore */ }
    }
    const { grant_type, username, password, refresh_token } = bodyData || {};

    // 1. Get raw values
    const rawId = process.env.VITE_PARASUT_CLIENT_ID || process.env.PARASUT_CLIENT_ID;
    const rawSecret = process.env.VITE_PARASUT_CLIENT_SECRET || process.env.PARASUT_CLIENT_SECRET;

    // 2. Aggressive Quote Stripping for IDs and Secrets
    const clean = (s) => s?.toString().replace(/['"]/g, '').trim() || '';
    
    const clientId = clean(rawId);
    const clientSecret = clean(rawSecret);

    // 3. NO TRIMMING on Username/Password (intentional spaces might exist)
    const uName = username?.toString() || '';
    const uPass = password?.toString() || '';

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'missing_env', message: 'Client ID veya Secret eksik.' });
    }

    const attempts = [
      { name: 'OOB Redirect',  redirect: 'urn:ietf:wg:oauth:2.0:oob', useHeader: true },
      { name: 'No Redirect',   redirect: null,                       useHeader: true },
      { name: 'Body Only',     redirect: null,                       useHeader: false },
      { name: 'Platform URL',  redirect: 'https://uygulama.basarunal.com', useHeader: true },
    ];

    let lastError = null;
    const results = [];

    for (const config of attempts) {
      try {
        const body = new URLSearchParams();
        body.append('grant_type', grant_type || 'password');
        body.append('client_id', clientId);
        body.append('client_secret', clientSecret);
        
        if (grant_type === 'refresh_token') {
          body.append('refresh_token', refresh_token?.toString() || '');
        } else {
          body.append('username', uName);
          body.append('password', uPass);
          if (config.redirect) body.append('redirect_uri', config.redirect);
        }

        const headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'EnbaPlatform/1.0.0 (https://uygulama.basarunal.com)',
        };

        if (config.useHeader) {
          const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
          headers['Authorization'] = `Basic ${basicAuth}`;
        }

        const upstream = await fetch('https://api.parasut.com/oauth/token', {
          method: 'POST',
          headers,
          body: body.toString(),
        });

        const data = await upstream.json().catch(() => ({}));
        
        if (upstream.ok) {
          return res.status(200).json({ 
            ...data, 
            _diag: { attempt: config.name, success: true } 
          });
        }

        results.push({ attempt: config.name, status: upstream.status, error: data.error, desc: data.error_description });
        lastError = { status: upstream.status, data };
      } catch (err) {
        results.push({ attempt: config.name, error: 'exception', message: err.message });
      }
    }

    // Report final failure with verbose diagnostics
    const failSummary = results.map(r => `${r.attempt}: ${r.status || 'ERR'} ${r.error || ''}`).join(' | ');
    res.status(lastError?.status || 400).json({
      error: 'all_attempts_failed',
      error_description: `Hata: ${failSummary}`,
      results,
      diagnostics: {
        has_client_id: !!clientId,
        has_client_secret: !!clientSecret,
        client_id_prefix: clientId.slice(0, 6),
        client_secret_len: clientSecret.length,
        env_source: process.env.VITE_PARASUT_CLIENT_ID ? 'VITE' : 'STANDARD',
        env_keys: Object.keys(process.env).filter(k => k.includes('PARASUT')),
        username_len: uName.length,
        password_len: uPass.length,
      },
      _hint: 'Lütfen Vercel Paneli -> Environment Variables kısmındaki şifreleri kontrol edin. Tırnak işaretleri (\' veya ") olmadığından emin olun.'
    });

  } catch (err) {
    res.status(502).json({ error: 'proxy_error', message: err.message });
  }
}
