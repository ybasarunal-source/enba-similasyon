-- migration_v29: assets tablosuna motor_kw ve kapasite_ton_saat kolonları
-- Supabase SQL Editor'de çalıştır

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS motor_kw          NUMERIC,
  ADD COLUMN IF NOT EXISTS kapasite_ton_saat NUMERIC;

-- Makine seed verisini güncellemek istersen (opsiyonel):
-- UPDATE assets SET motor_kw = 75, kapasite_ton_saat = 1.5 WHERE adi = 'Granül Makinesi 1';
