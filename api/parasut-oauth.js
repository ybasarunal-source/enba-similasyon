export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // 1. Double-safeguard body parsing
    let bodyData = req.body;
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch (e) { /* ignore */ }
    }
    const { grant_type, username, password, refresh_token } = bodyData || {};

    // 2. Prioritize VITE_ prefixed variables (they are confirmed in .env)
    const rawClientId = process.env.VITE_PARASUT_CLIENT_ID || process.env.PARASUT_CLIENT_ID;
    const rawClientSecret = process.env.VITE_PARASUT_CLIENT_SECRET || process.env.PARASUT_CLIENT_SECRET;
    
    // 3. AGGRESSIVE Trimming
    const clientId = rawClientId?.toString().trim();
    const clientSecret = rawClientSecret?.toString().trim();
    const uName = username?.toString().trim();
    const uPass = password?.toString().trim();

    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        error: 'missing_credentials', 
        message: 'Client ID veya Secret bulunamadı.' 
      });
    }

    // 4. Trial Loop for Connection Methods
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
        const params = new URLSearchParams();
        params.append('grant_type', grant_type || 'password');
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        
        if (grant_type === 'refresh_token') {
          params.append('refresh_token', refresh_token?.toString().trim());
        } else {
          params.append('username', uName);
          params.append('password', uPass);
          if (config.redirect) params.append('redirect_uri', config.redirect);
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
          body: params.toString(),
        });

        const data = await upstream.json().catch(() => ({}));
        
        if (upstream.ok) {
          return res.status(200).json({ 
            ...data, 
            _diag: { attempt: config.name, success: true, source: process.env.VITE_PARASUT_CLIENT_ID ? 'VITE' : 'STANDARD' } 
          });
        }

        results.push({ attempt: config.name, status: upstream.status, error: data.error });
        lastError = { status: upstream.status, data };
      } catch (err) {
        results.push({ attempt: config.name, error: 'exception', message: err.message });
      }
    }

    // If all failed, return details
    const failSummary = results.map(r => `${r.attempt}: ${r.status || 'ERR'} ${r.error || ''}`).join(' | ');
    res.status(lastError?.status || 400).json({
      error: 'all_attempts_failed',
      error_description: `Denenen tüm bağlantı yöntemleri başarısız oldu: ${failSummary}. Lütfen bilgilerinizi (E-posta, Şifre, Firma ID ve Vercel Secret) kontrol edin.`,
      results,
      diagnostics: {
        has_client_id: !!clientId,
        has_client_secret: !!clientSecret,
        client_id_prefix: clientId ? clientId.slice(0, 6) : 'missing',
        env_source: process.env.VITE_PARASUT_CLIENT_ID ? 'VITE' : 'STANDARD',
        env_keys: Object.keys(process.env).filter(k => k.includes('PARASUT')),
        basic_auth_sent: true,
      }
    });

  } catch (err) {
    res.status(502).json({ error: 'proxy_error', message: err.message });
  }
}
