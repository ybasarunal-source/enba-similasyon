-- ============================================================
-- ENBA: production_records + logistics_records tabloları
-- Üretim + Lojistik modülleri
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. production_records ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.production_records (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id          uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  tarih               date NOT NULL,
  vardiya             text NOT NULL DEFAULT '1. Vardiya'
                        CHECK (vardiya IN ('1. Vardiya', '2. Vardiya', '3. Vardiya')),
  baslama_saati       text NOT NULL DEFAULT '08:00',  -- HH:MM
  bitis_saati         text NOT NULL DEFAULT '16:00',  -- HH:MM
  calisanlar          jsonb NOT NULL DEFAULT '[]'::jsonb,
                      -- [{id, name, overtime}]
  giren_hammadde      numeric NOT NULL DEFAULT 0,     -- kg
  cikan_urun          numeric NOT NULL DEFAULT 0,     -- kg
  sayac_basi          numeric NOT NULL DEFAULT 0,
  sayac_sonu          numeric NOT NULL DEFAULT 0,
  fire_miktar         numeric GENERATED ALWAYS AS (giren_hammadde - cikan_urun) STORED,
  fire_oran           numeric GENERATED ALWAYS AS (
                        CASE WHEN giren_hammadde > 0
                          THEN ROUND(((giren_hammadde - cikan_urun) / giren_hammadde * 100)::numeric, 2)
                          ELSE 0
                        END
                      ) STORED,
  elektrik_sarfiyat   numeric GENERATED ALWAYS AS (sayac_sonu - sayac_basi) STORED,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin production_records yönetir"     ON public.production_records;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket production_records" ON public.production_records;

CREATE POLICY "SuperAdmin production_records yönetir"
  ON public.production_records FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket production_records"
  ON public.production_records FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );


-- ── 2. logistics_records ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logistics_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id    uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  tarih         date NOT NULL,
  arac_plaka    text NOT NULL DEFAULT '',
  kullanici     text NOT NULL DEFAULT '',
  baslangic_km  numeric NOT NULL DEFAULT 0,
  bitis_km      numeric NOT NULL DEFAULT 0,
  fark_km       numeric GENERATED ALWAYS AS (bitis_km - baslangic_km) STORED,
  guzergah      text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.logistics_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin logistics_records yönetir"     ON public.logistics_records;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket logistics_records" ON public.logistics_records;

CREATE POLICY "SuperAdmin logistics_records yönetir"
  ON public.logistics_records FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket logistics_records"
  ON public.logistics_records FOR ALL TO authenticated
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
  AND table_name IN ('production_records', 'logistics_records')
ORDER BY table_name;
