-- migration_v4: Şirket bazlı modül izinleri
-- Supabase Dashboard > SQL Editor'da çalıştır

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS module_permissions jsonb DEFAULT '{}';

COMMENT ON COLUMN public.companies.module_permissions IS
  'Şirkete tanımlı modül lisansları. SuperAdmin tarafından işaretlenir. Örnek: {"stock": true, "hr": false}';
