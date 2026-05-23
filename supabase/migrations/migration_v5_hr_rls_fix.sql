-- ============================================================
-- ENBA FIX: HR tabloları RLS — user_id fallback
-- attendance, personnel_payments, personnel_debts
--
-- Sorun: Bu tablolar company_id sütunu var ama user_id yok.
-- RLS sadece company_id kontrol ediyor → company_id olmayan
-- kullanıcılar (legacy) hiç veri okuyamıyor/yazamıyor.
--
-- Çözüm: user_id sütunu ekle + RLS'e OR user_id = auth.uid() ekle
-- Mevcut kayıtlar: personnel.user_id'den backfill edilir.
--
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. user_id sütunu ekle ─────────────────────────────────
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.personnel_payments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.personnel_debts
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;


-- ── 2. Mevcut kayıtlara backfill (personnel tablosundan) ────
--    person_id üzerinden üst personnel kaydının user_id'sini kopyala
UPDATE public.attendance a
SET user_id = p.user_id
FROM public.personnel p
WHERE a.person_id = p.id
  AND a.user_id IS NULL
  AND p.user_id IS NOT NULL;

UPDATE public.personnel_payments pp
SET user_id = p.user_id
FROM public.personnel p
WHERE pp.person_id = p.id
  AND pp.user_id IS NULL
  AND p.user_id IS NOT NULL;

UPDATE public.personnel_debts pd
SET user_id = p.user_id
FROM public.personnel p
WHERE pd.person_id = p.id
  AND pd.user_id IS NULL
  AND p.user_id IS NOT NULL;


-- ── 3. RLS güncelle: company_id OR user_id ─────────────────
DROP POLICY IF EXISTS "Puantajı yönet" ON public.attendance;
CREATE POLICY "Puantajı yönet" ON public.attendance
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Ödemeleri yönet" ON public.personnel_payments;
CREATE POLICY "Ödemeleri yönet" ON public.personnel_payments
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Borçları yönet" ON public.personnel_debts;
CREATE POLICY "Borçları yönet" ON public.personnel_debts
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );


-- ── 4. Doğrulama ────────────────────────────────────────────
-- user_id sütunları eklendi mi?
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('attendance', 'personnel_payments', 'personnel_debts')
  AND column_name = 'user_id'
ORDER BY table_name;

-- Backfill ne kadar kayıt güncelledi? (manuel kontrol için)
SELECT 'attendance'         AS tablo, COUNT(*) FILTER (WHERE user_id IS NOT NULL) AS user_id_dolu,
                                      COUNT(*) FILTER (WHERE user_id IS NULL)     AS user_id_bos FROM public.attendance
UNION ALL
SELECT 'personnel_payments' AS tablo, COUNT(*) FILTER (WHERE user_id IS NOT NULL),
                                      COUNT(*) FILTER (WHERE user_id IS NULL)     FROM public.personnel_payments
UNION ALL
SELECT 'personnel_debts'    AS tablo, COUNT(*) FILTER (WHERE user_id IS NOT NULL),
                                      COUNT(*) FILTER (WHERE user_id IS NULL)     FROM public.personnel_debts;
