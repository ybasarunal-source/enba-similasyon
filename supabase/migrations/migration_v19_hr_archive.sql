-- ============================================================
-- ENBA: personnel + attendance + arsiv_files tabloları
-- İK + Arşiv modülleri
-- Not: personnel/attendance zaten varsa company_id sütunu eklenir
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. personnel ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.personnel (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id  uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  name        text NOT NULL,
  position    text NOT NULL DEFAULT '',
  department  text NOT NULL DEFAULT '',
  salary      numeric NOT NULL DEFAULT 0,
  sgk_status  text NOT NULL DEFAULT 'Aktif',
  start_date  date NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- company_id yoksa ekle (tablo önceden oluşturulmuşsa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'personnel' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.personnel ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin personnel yönetir"     ON public.personnel;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket personnel" ON public.personnel;

CREATE POLICY "SuperAdmin personnel yönetir"
  ON public.personnel FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket personnel"
  ON public.personnel FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );


-- ── 2. attendance ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id     uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  person_id      uuid REFERENCES public.personnel(id) ON DELETE CASCADE,
  month          int NOT NULL CHECK (month BETWEEN 1 AND 12),
  year           int NOT NULL,
  work_hours     numeric NOT NULL DEFAULT 0,
  overtime_hours numeric NOT NULL DEFAULT 0,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_id, month, year)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.attendance ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin attendance yönetir"     ON public.attendance;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket attendance" ON public.attendance;

CREATE POLICY "SuperAdmin attendance yönetir"
  ON public.attendance FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket attendance"
  ON public.attendance FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );


-- ── 3. arsiv_files (Arşiv modülü) ────────────────────────────
-- Not: dosya içerikleri Supabase Storage'da saklanır (bucket: arsiv)
-- Bu tablo yalnızca metadata tutar
CREATE TABLE IF NOT EXISTS public.arsiv_files (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id      uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ad              text NOT NULL,
  mime            text NOT NULL DEFAULT 'application/octet-stream',
  boyut           bigint NOT NULL DEFAULT 0,  -- bytes
  kategori        text NOT NULL DEFAULT 'Diğer'
                    CHECK (kategori IN (
                      'Sözleşmeler','Faturalar','Ruhsat & Lisans',
                      'Teknik Belgeler','Mali Belgeler','Yazışmalar','Raporlar','Diğer'
                    )),
  etiketler       text[] NOT NULL DEFAULT '{}',
  notlar          text,
  storage_path    text NOT NULL DEFAULT '',
  yuklenme_tarihi timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.arsiv_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin arsiv_files yönetir"     ON public.arsiv_files;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket arsiv_files" ON public.arsiv_files;

CREATE POLICY "SuperAdmin arsiv_files yönetir"
  ON public.arsiv_files FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket arsiv_files"
  ON public.arsiv_files FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );


-- ── 4. Doğrulama ─────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('personnel', 'attendance', 'arsiv_files')
ORDER BY table_name;
