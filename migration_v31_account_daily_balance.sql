-- migration_v31: account_daily_balance — hesap günlük bakiye tablosu
-- Paraşüt API bakiye döndürmediği için kullanıcı Excel/HTML exporttan aktar

CREATE TABLE IF NOT EXISTS account_daily_balance (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id   UUID NOT NULL,
  account_name TEXT NOT NULL,
  tarih        DATE NOT NULL,
  bakiye       NUMERIC(14,2) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, account_name, tarih)
);

ALTER TABLE account_daily_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_isolation" ON account_daily_balance
  USING (company_id = (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));
