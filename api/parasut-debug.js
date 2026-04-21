export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const clientId = process.env.PARASUT_CLIENT_ID || '';
  const clientSecret = process.env.PARASUT_CLIENT_SECRET || '';

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'password',
    username: 'test@test.com',
    password: 'wrongpassword',
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
  });

  const upstream = await fetch('https://api.parasut.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  const text = await upstream.text();

  res.json({
    env_client_id_length: clientId.length,
    env_client_id_prefix: clientId.slice(0, 6),
    env_secret_length: clientSecret.length,
    parasut_status: upstream.status,
    parasut_response: text,
  });
}
