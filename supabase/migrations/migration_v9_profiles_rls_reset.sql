-- ============================================================
-- ENBA FIX: profiles RLS tam sıfırlama
--
-- Sorun: Orijinal şema + birden fazla migration birikimi →
-- profiles tablosunda çakışan ve recursive policy'ler var.
-- Her SELECT HTTP 500 döndürüyor.
--
-- Çözüm: Tüm policy'leri temizle, minimum 3 policy ile yeniden başla.
--
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. profiles üzerindeki TÜM policy'leri sil ─────────────
DO $$
DECLARE
  pol text;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol);
  END LOOP;
END $$;


-- ── 2. Temiz, minimal policy'ler ───────────────────────────
CREATE POLICY "Kendi profilini gör"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Kendi profilini güncelle"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "SuperAdmin tüm profilleri yönetir"
  ON public.profiles FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');


-- ── 3. Doğrulama: kaç policy var? ──────────────────────────
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;
-- Beklenen: tam 3 satır
