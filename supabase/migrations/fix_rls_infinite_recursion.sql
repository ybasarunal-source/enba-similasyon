-- ============================================================
-- ENBA FIX: SuperAdmin veri erişimi — Tek Çalıştırmada Düzeltme
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. Kırık recursive policy'leri temizle ─────────────────
DROP POLICY IF EXISTS "Super adminler tüm profilleri yönetebilir" ON public.profiles;
DROP POLICY IF EXISTS "Kullanıcı kendi profilini görebilir"       ON public.profiles;
DROP POLICY IF EXISTS "Kullanıcı kendi profilini güncelleyebilir" ON public.profiles;
DROP POLICY IF EXISTS "Super adminler tüm şirketleri yönetebilir" ON public.companies;
DROP POLICY IF EXISTS "Adminler kendi şirketini görebilir"         ON public.companies;

-- ── 2. profiles.role → auth.users.raw_app_meta_data senkronizasyonu ──
--    (SQL Editor service_role ile çalışır, RLS bypass)
UPDATE auth.users u
SET raw_app_meta_data =
  COALESCE(u.raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE p.id = u.id
  AND p.role IS NOT NULL;

-- ── 3. profiles için yeni, döngüsüz policy'ler ─────────────
--    auth.users tablosundan okur → profiles'a bakmaz → döngü yok

CREATE POLICY "Kullanıcı kendi profilini görebilir"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Kullanıcı kendi profilini güncelleyebilir"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Super adminler tüm profilleri yönetebilir"
  ON public.profiles FOR ALL TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'super_admin'
  );

-- ── 4. companies için yeni policy'ler ──────────────────────
CREATE POLICY "Super adminler tüm şirketleri yönetebilir"
  ON public.companies FOR ALL TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "Adminler kendi şirketini görebilir"
  ON public.companies FOR SELECT TO authenticated
  USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- ── 5. Doğrulama: Kullanıcı rolleri senkronize mi? ─────────
SELECT
  u.email,
  p.role           AS profiles_role,
  u.raw_app_meta_data->>'role' AS jwt_role,
  CASE WHEN p.role = (u.raw_app_meta_data->>'role') THEN '✓ Eşleşiyor' ELSE '✗ HATA' END AS durum
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
ORDER BY u.email;
