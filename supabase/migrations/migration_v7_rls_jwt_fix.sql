-- ============================================================
-- ENBA FIX: RLS super_admin — auth.jwt() ile döngüsüz çözüm
--
-- Sorun: get_my_role() SECURITY DEFINER Supabase'de RLS'i
-- bypass etmiyor → profiles sorgusu kendi kendini çağırıyor
-- → her kullanıcının profil yüklemesi bozuluyor.
--
-- Çözüm: auth.jwt() — veritabanı sorgusu atmadan JWT token'dan
-- doğrudan rol okur. Döngü imkansız.
--
-- ⚠️  Bu SQL'den sonra bir kez çıkış yapıp tekrar giriş yap.
--     (JWT yenilenmeli — raw_app_meta_data zaten sync edildi)
--
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. Gereksiz fonksiyonu kaldır ──────────────────────────
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;


-- ── 2. profiles: super_admin policy → auth.jwt() ───────────
DROP POLICY IF EXISTS "Super adminler tüm profilleri yönetebilir" ON public.profiles;
CREATE POLICY "Super adminler tüm profilleri yönetebilir"
  ON public.profiles FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );


-- ── 3. companies: super_admin policy → auth.jwt() ──────────
DROP POLICY IF EXISTS "Super adminler tüm şirketleri yönetebilir" ON public.companies;
CREATE POLICY "Super adminler tüm şirketleri yönetebilir"
  ON public.companies FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );


-- ── 4. Doğrulama ────────────────────────────────────────────
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'companies')
ORDER BY tablename, policyname;
