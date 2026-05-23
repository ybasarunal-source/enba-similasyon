-- ============================================================
-- ENBA FIX: RLS super_admin kontrolü — SECURITY DEFINER
--
-- Sorun: fix_rls_infinite_recursion.sql'deki policy'ler
--   (SELECT raw_app_meta_data FROM auth.users WHERE id = auth.uid())
-- kullanıyor. authenticated rolü auth.users tablosunu okuyamaz
-- → policy NULL dönüyor → super_admin erişimi açılmıyor.
--
-- Çözüm: SECURITY DEFINER fonksiyon — profiles'ı RLS atlayarak
-- okur, döngü olmaz, permission sorunu olmaz.
--
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. Helper fonksiyon: mevcut kullanıcının rolünü getir ──
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;


-- ── 2. profiles politikalarını düzelt ──────────────────────
DROP POLICY IF EXISTS "Super adminler tüm profilleri yönetebilir" ON public.profiles;
CREATE POLICY "Super adminler tüm profilleri yönetebilir"
  ON public.profiles FOR ALL TO authenticated
  USING (public.get_my_role() = 'super_admin');


-- ── 3. companies politikalarını düzelt ─────────────────────
DROP POLICY IF EXISTS "Super adminler tüm şirketleri yönetebilir" ON public.companies;
CREATE POLICY "Super adminler tüm şirketleri yönetebilir"
  ON public.companies FOR ALL TO authenticated
  USING (public.get_my_role() = 'super_admin');


-- ── 4. Doğrulama ────────────────────────────────────────────
-- Fonksiyon oluşturuldu mu?
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'get_my_role';

-- profiles politikaları doğru mu?
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('profiles', 'companies')
ORDER BY tablename, policyname;
