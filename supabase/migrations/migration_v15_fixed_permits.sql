-- ============================================================
-- ENBA: fixed_expenses + permits tabloları
-- Sabit Giderler + Lisans Yönetimi modülleri
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. fixed_expenses ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fixed_expenses (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id            uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  title                 text NOT NULL,
  amount                numeric NOT NULL DEFAULT 0,
  category              text NOT NULL DEFAULT 'diger'
                          CHECK (category IN ('yazilim','kira','fatura','aidat','personel','diger')),
  due_date              int NOT NULL DEFAULT 1 CHECK (due_date BETWEEN 1 AND 31),
  is_auto_pay           boolean NOT NULL DEFAULT false,
  parasut_match_keyword text,
  history               jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin fixed_expenses yönetir"     ON public.fixed_expenses;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket fixed_expenses" ON public.fixed_expenses;

CREATE POLICY "SuperAdmin fixed_expenses yönetir"
  ON public.fixed_expenses FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket fixed_expenses"
  ON public.fixed_expenses FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );


-- ── 2. permits ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.permits (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id       uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ad               text NOT NULL,
  kategori         text NOT NULL DEFAULT 'Diğer'
                     CHECK (kategori IN ('Ruhsat','Lisans','Sertifika','Sigorta','Sözleşme','Diğer')),
  kurum            text NOT NULL DEFAULT '',
  alinis_tarihi    date NOT NULL,
  yenileme_tarihi  date,
  is_suresiz       boolean NOT NULL DEFAULT false,
  maliyet          numeric NOT NULL DEFAULT 0,
  file_id          text,
  file_name        text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin permits yönetir"     ON public.permits;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket permits" ON public.permits;

CREATE POLICY "SuperAdmin permits yönetir"
  ON public.permits FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket permits"
  ON public.permits FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );


-- ── 3. Doğrulama ─────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('fixed_expenses', 'permits')
ORDER BY table_name;
