-- ============================================================
-- ENBA: assets + maintenance tabloları
--
-- Makine Parkı modülü için Supabase tabloları.
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================


-- ── 1. assets tablosu ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id       uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  adi              text NOT NULL,
  marka            text,
  motor_gucu       numeric,
  yatirim_bedeli   numeric NOT NULL DEFAULT 0,
  satinalma_tarihi date NOT NULL,
  kategori         text NOT NULL DEFAULT 'production',
  kapasite         numeric,
  boyut            text,
  tur              text NOT NULL CHECK (tur IN ('makina', 'demirbas')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── 2. maintenance tablosu ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.maintenance (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id   uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  tarih        date NOT NULL,
  varlik_id    uuid REFERENCES public.assets(id) ON DELETE CASCADE,
  varlik_adi   text NOT NULL,
  varlik_turu  text NOT NULL,
  tur          text NOT NULL,
  aciklama     text NOT NULL DEFAULT '',
  maliyet      numeric NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);


-- ── 3. RLS ───────────────────────────────────────────────────
ALTER TABLE public.assets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

-- assets
DROP POLICY IF EXISTS "SuperAdmin assets yönetir"      ON public.assets;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket assets"  ON public.assets;

CREATE POLICY "SuperAdmin assets yönetir"
  ON public.assets FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket assets"
  ON public.assets FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );

-- maintenance
DROP POLICY IF EXISTS "SuperAdmin maintenance yönetir"     ON public.maintenance;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket maintenance" ON public.maintenance;

CREATE POLICY "SuperAdmin maintenance yönetir"
  ON public.maintenance FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket maintenance"
  ON public.maintenance FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );


-- ── 4. Doğrulama ─────────────────────────────────────────────
SELECT table_name, (SELECT count(*) FROM public.assets) AS asset_sayisi
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('assets', 'maintenance');
