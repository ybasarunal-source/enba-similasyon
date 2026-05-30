-- migration_v30: founding_cashflow tablosuna balance_after kolonu ekle
-- Paraşüt'ün her işlem sonrası kaydettiği hesap bakiyesi
-- Bu kolon dolduktan sonra bankaDailyData grafiği gerçek bakiye değerlerini kullanır

ALTER TABLE founding_cashflow
  ADD COLUMN IF NOT EXISTS balance_after NUMERIC(14,2);

-- İndeks: banka hesabı günlük bakiye sorgularını hızlandırır
CREATE INDEX IF NOT EXISTS idx_fc_balance_after
  ON founding_cashflow (source_account, tarih)
  WHERE balance_after IS NOT NULL;
