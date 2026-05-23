-- ============================================================
-- ENBA: pnl_reports tablosu
-- P&L Analizi modülü — payload JSONB (gelir/gider veri seti)
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pnl_reports (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  name       text NOT NULL,
  date       text NOT NULL,  -- "YYYY-MM-DD"
  payload    jsonb NOT NULL DEFAULT '{}'::jsonb,
             -- payload: { gelirData, giderData, capexActive, capexVade,
             --            gelirDosya, giderDosya, modelDetayAcik }
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pnl_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin pnl_reports yönetir"     ON public.pnl_reports;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket pnl_reports" ON public.pnl_reports;

CREATE POLICY "SuperAdmin pnl_reports yönetir"
  ON public.pnl_reports FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket pnl_reports"
  ON public.pnl_reports FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );

-- Doğrulama
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'pnl_reports';
