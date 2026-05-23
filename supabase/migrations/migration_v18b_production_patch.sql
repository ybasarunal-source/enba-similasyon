-- ============================================================
-- ENBA: production_records eksik kolon ekleme
-- migration_v18'de unutulan calisma_sure_saat
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

ALTER TABLE public.production_records
  ADD COLUMN IF NOT EXISTS calisma_sure_saat numeric NOT NULL DEFAULT 0;

-- Doğrulama
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'production_records'
ORDER BY ordinal_position;
