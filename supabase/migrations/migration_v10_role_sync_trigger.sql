-- ============================================================
-- ENBA FIX: Rol değişikliği → JWT otomatik sync
--
-- Sorun: adminUpdateProfile() sadece profiles.role güncelliyor.
-- auth.users.raw_app_meta_data değişmiyor → JWT eski rolü taşıyor
-- → kullanıcı re-login yapsa bile yeni rol devreye girmiyor.
--
-- Çözüm:
--   1. Trigger: profiles.role değişince raw_app_meta_data otomatik sync
--   2. Demo hesabını şimdi düzelt (raw_app_meta_data elle güncelle)
--
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. Trigger fonksiyonu ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_jwt()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;


-- ── 2. Trigger ──────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role_to_jwt();


-- ── 3. Demo hesabını şimdi düzelt ──────────────────────────
--    profiles.role artık ne ise raw_app_meta_data'ya yaz
UPDATE auth.users u
SET raw_app_meta_data =
  COALESCE(u.raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE u.email = 'demo@enba.com'
  AND p.id = u.id;


-- ── 4. Doğrulama ────────────────────────────────────────────
SELECT
  u.email,
  p.role           AS profiles_role,
  u.raw_app_meta_data->>'role' AS jwt_role,
  CASE WHEN p.role = (u.raw_app_meta_data->>'role')
    THEN '✓ Eşleşiyor' ELSE '✗ HATA' END AS durum
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email IN ('demo@enba.com', 'basar.unal@enbarecycling.com')
ORDER BY u.email;
