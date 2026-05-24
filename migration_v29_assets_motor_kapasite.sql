-- migration_v29: assets tablosuna motor_gucu ve kapasite kolonları
-- (seed_granul_makineleri.sql ile aynı kolon adları)
-- Supabase SQL Editor'de çalıştır

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS motor_gucu NUMERIC,
  ADD COLUMN IF NOT EXISTS kapasite   NUMERIC;

-- motor_kw / kapasite_ton_saat adıyla yanlışlıkla eklendiyse temizle:
-- ALTER TABLE assets DROP COLUMN IF EXISTS motor_kw;
-- ALTER TABLE assets DROP COLUMN IF EXISTS kapasite_ton_saat;
