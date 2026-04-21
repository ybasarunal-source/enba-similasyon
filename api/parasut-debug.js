export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const clientId = process.env.PARASUT_CLIENT_ID || '';
  const clientSecret = process.env.PARASUT_CLIENT_SECRET || '';

  const form = new FormData();
  form.append('grant_type', 'password');
  form.append('client_id', clientId);
  form.append('client_secret', clientSecret);
  form.append('username', 'test@test.com');
  form.append('password', 'wrongpassword');
  form.append('redirect_uri', 'urn:ietf:wg:oauth:2.0:oob');

  const upstream = await fetch('https://api.parasut.com/oauth/token', {
    method: 'POST',
    body: form,
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
