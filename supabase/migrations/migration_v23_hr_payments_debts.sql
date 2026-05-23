-- ============================================================
-- ENBA migration_v23 — personnel_payments + personnel_debts
-- user_id / company_id + RLS ekle
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. personnel_payments ────────────────────────────────────
ALTER TABLE public.personnel_payments
  ADD COLUMN IF NOT EXISTS user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

ALTER TABLE public.personnel_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can access payments" ON public.personnel_payments;
DROP POLICY IF EXISTS "SuperAdmin personnel_payments"           ON public.personnel_payments;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket payments"        ON public.personnel_payments;

CREATE POLICY "SuperAdmin personnel_payments"
  ON public.personnel_payments FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket payments"
  ON public.personnel_payments FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );

-- ── 2. personnel_debts ───────────────────────────────────────
ALTER TABLE public.personnel_debts
  ADD COLUMN IF NOT EXISTS user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

ALTER TABLE public.personnel_debts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can access debts" ON public.personnel_debts;
DROP POLICY IF EXISTS "SuperAdmin personnel_debts"           ON public.personnel_debts;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket debts"        ON public.personnel_debts;

CREATE POLICY "SuperAdmin personnel_debts"
  ON public.personnel_debts FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket debts"
  ON public.personnel_debts FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );

-- ── 3. Doğrulama ─────────────────────────────────────────────
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('personnel_payments', 'personnel_debts')
  AND column_name IN ('user_id', 'company_id')
ORDER BY table_name, column_name;
