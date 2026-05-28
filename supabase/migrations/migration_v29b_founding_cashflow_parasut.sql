-- migration_v29b_founding_cashflow_parasut.sql
-- founding_cashflow'a parasut_id kolonu ekle
-- Aynı Paraşüt kaydının tekrar import edilmesini engeller

ALTER TABLE public.founding_cashflow
  ADD COLUMN IF NOT EXISTS parasut_id text;

-- Şirket başına parasut_id unique (null değerleri exclude)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fc_parasut_unique
  ON public.founding_cashflow (company_id, parasut_id)
  WHERE parasut_id IS NOT NULL;
