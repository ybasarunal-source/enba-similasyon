-- ============================================================
-- ENBA migration_v21 — tasks constraint + cashflow_parameters fix
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. tasks.status CHECK kısıtını düzelt ────────────────────
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('todo', 'doing', 'done', 'in_progress'));
ALTER TABLE public.tasks ALTER COLUMN source SET DEFAULT 'local';

-- ── 2. cashflow_parameters — eksik kolonları ekle ────────────
-- Tablo önceki başarısız çalışmada user_id olmadan oluşturuldu
ALTER TABLE public.cashflow_parameters
  ADD COLUMN IF NOT EXISTS user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.cashflow_parameters
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.cashflow_parameters
  ADD COLUMN IF NOT EXISTS plan_id    text NOT NULL DEFAULT '';
ALTER TABLE public.cashflow_parameters
  ADD COLUMN IF NOT EXISTS params     jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.cashflow_parameters
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.cashflow_parameters
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ── 3. cashflow_parameters RLS ───────────────────────────────
ALTER TABLE public.cashflow_parameters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin cashflow_parameters"      ON public.cashflow_parameters;
DROP POLICY IF EXISTS "Kullanıcı kendi cashflow_parameters" ON public.cashflow_parameters;

CREATE POLICY "SuperAdmin cashflow_parameters"
  ON public.cashflow_parameters FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi cashflow_parameters"
  ON public.cashflow_parameters FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );

-- ── 4. Doğrulama ─────────────────────────────────────────────
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cashflow_parameters'
ORDER BY ordinal_position;
