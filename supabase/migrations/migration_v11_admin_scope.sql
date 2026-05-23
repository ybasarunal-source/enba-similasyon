-- ============================================================
-- ENBA: Admin kapsam izolasyonu + şirket adı JWT'ye ekleme
--
-- 1. Trigger güncelle: company_id de JWT'ye sync edilsin
-- 2. profiles'a "Admin şirket üyelerini görür" policy ekle
-- 3. Tüm kullanıcılar için company_id'yi JWT'ye şimdi yaz
-- 4. Demo hesabını yeniden sync et
--
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. Trigger: company_id değişince de sync et ─────────────
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


-- ── 2. profiles: admin kendi şirketinin tüm üyelerini görür ─
--    JWT'deki company_id kullanılır → DB sorgusu yok, döngü yok
DROP POLICY IF EXISTS "Admin şirket üyelerini görür" ON public.profiles;
CREATE POLICY "Admin şirket üyelerini görür"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    AND company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
  );


-- ── 3. Tüm kullanıcıların company_id'sini JWT'ye yaz ────────
UPDATE auth.users u
SET raw_app_meta_data =
  COALESCE(u.raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object(
    'role',       p.role,
    'company_id', p.company_id::text
  )
FROM public.profiles p
WHERE p.id = u.id;


-- ── 4. Doğrulama ────────────────────────────────────────────
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
