-- ============================================================
-- ENBA: Admin şirket izolasyonu — companies tablosu RLS
--       + migration_v11 idempotent tekrar uygulaması
--
-- migration_v11 çalışmadıysa burada da yeniden uygulanır.
-- companies tablosuna RLS eklenir: admin sadece kendi şirketini görür.
--
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================


-- ── 1. Trigger: role + company_id → JWT sync (v11 ile aynı, idempotent) ──
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_jwt()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.company_id IS DISTINCT FROM OLD.company_id
  THEN
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object(
        'role',       NEW.role,
        'company_id', NEW.company_id::text
      )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;


-- ── 2. profiles: admin kendi şirketinin üyelerini görür (idempotent) ──
DROP POLICY IF EXISTS "Admin şirket üyelerini görür" ON public.profiles;
CREATE POLICY "Admin şirket üyelerini görür"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    AND company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
  );


-- ── 3. Tüm kullanıcıların role + company_id'sini JWT'ye yaz ──────────
UPDATE auth.users u
SET raw_app_meta_data =
  COALESCE(u.raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object(
    'role',       p.role,
    'company_id', p.company_id::text
  )
FROM public.profiles p
WHERE p.id = u.id;


-- ── 4. companies tablosu RLS ─────────────────────────────────────────
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies FORCE ROW LEVEL SECURITY;

-- Mevcut tüm policy'leri temizle
DO $$
DECLARE pol text;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'companies'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.companies', pol);
  END LOOP;
END $$;

-- Super admin: tüm şirketleri yönetir
CREATE POLICY "SuperAdmin tüm şirketleri yönetir"
  ON public.companies FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

-- Admin + user: yalnızca kendi şirketini görür (JWT'deki company_id ile eşleşme)
CREATE POLICY "Kendi şirketini gör"
  ON public.companies FOR SELECT TO authenticated
  USING (id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

-- Admin: kendi şirketini güncelleyebilir
CREATE POLICY "Admin kendi şirketini günceller"
  ON public.companies FOR UPDATE TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    AND id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    AND id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
  );


-- ── 5. Doğrulama ────────────────────────────────────────────────────
-- JWT durumu:
SELECT
  u.email,
  p.role                              AS profiles_role,
  u.raw_app_meta_data->>'role'        AS jwt_role,
  p.company_id::text                  AS profiles_company,
  u.raw_app_meta_data->>'company_id'  AS jwt_company,
  CASE WHEN p.role = (u.raw_app_meta_data->>'role')
    THEN '✓' ELSE '✗ ROL HATA' END   AS rol_durum,
  CASE WHEN p.company_id::text IS NOT DISTINCT FROM (u.raw_app_meta_data->>'company_id')
    THEN '✓' ELSE '✗ ŞİRKET HATA' END AS sirket_durum
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
ORDER BY u.email;

-- companies policies:
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'companies'
ORDER BY policyname;
