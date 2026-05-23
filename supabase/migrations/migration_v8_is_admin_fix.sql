-- ============================================================
-- ENBA FIX: is_admin() fonksiyonu — profiles sorgusuz versiyon
--
-- Sorun: Orijinal is_admin() fonksiyonu profiles tablosunu
-- sorguluyor. "Adminler tum profilleri gorebilir" policy'si
-- bu fonksiyonu çağırıyor → her profiles SELECT'inde döngü
-- → getMyProfile() dahil tüm profil sorguları patlıyor.
--
-- Çözüm: is_admin() → auth.jwt()'den oku, DB sorgusu atma.
-- Kullanıcı zaten yeniden giriş yaptı → JWT güncel.
--
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── is_admin() → JWT tabanlı, döngüsüz ─────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'),
    false
  )
$$ LANGUAGE sql STABLE;


-- ── Doğrulama ───────────────────────────────────────────────
-- Fonksiyon güncellenmiş mi?
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'is_admin';
