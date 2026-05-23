-- ============================================================
-- ENBA migration_v22 — profiles: kişisel bilgi kolonları
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. Kişisel bilgi kolonları ───────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS title       text,
  ADD COLUMN IF NOT EXISTS department  text,
  ADD COLUMN IF NOT EXISTS location    text,
  ADD COLUMN IF NOT EXISTS start_date  date,
  ADD COLUMN IF NOT EXISTS phone       text,
  ADD COLUMN IF NOT EXISTS bio         text,
  ADD COLUMN IF NOT EXISTS linkedin    text,
  ADD COLUMN IF NOT EXISTS twitter     text,
  ADD COLUMN IF NOT EXISTS instagram   text,
  ADD COLUMN IF NOT EXISTS github      text,
  ADD COLUMN IF NOT EXISTS website     text;

-- ── 2. Doğrulama ─────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
