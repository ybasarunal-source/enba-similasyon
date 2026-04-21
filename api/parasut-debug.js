export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { token, company } = req.query;

  if (!token || !company) {
    return res.json({ error: 'token ve company parametreleri gerekli' });
  }

  // Test 1: token'ı header ile gönder
  const r1 = await fetch(`https://api.parasut.com/v4/${company}/sales_invoices?page[size]=1`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const t1 = await r1.text();

  res.json({
    header_auth: { status: r1.status, body: t1.slice(0, 300) },
    token_length: token.length,
    token_prefix: token.slice(0, 10),
    company,
  });
}
