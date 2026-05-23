-- ============================================================
-- ENBA: contacts + stock_records + sales_records tabloları
-- Stok modülü + tedarikçi/müşteri rehberi
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. contacts (tedarikçi & müşteri rehberi) ────────────────
CREATE TABLE IF NOT EXISTS public.contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id   uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  name         text NOT NULL,
  telefon      text,
  eposta       text,
  adres        text,
  notlar       text,
  contact_type text NOT NULL DEFAULT 'supplier'
                 CHECK (contact_type IN ('supplier', 'customer')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin contacts yönetir"     ON public.contacts;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket contacts" ON public.contacts;

CREATE POLICY "SuperAdmin contacts yönetir"
  ON public.contacts FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket contacts"
  ON public.contacts FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );


-- ── 2. stock_records (alış / hammadde satın alma) ────────────
CREATE TABLE IF NOT EXISTS public.stock_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id      uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  tarih           date NOT NULL,
  tedarikci_adi   text NOT NULL DEFAULT '',
  hammadde_turu   text NOT NULL DEFAULT '',
  brut_miktar     numeric NOT NULL DEFAULT 0,  -- kg
  net_miktar      numeric NOT NULL DEFAULT 0,  -- kg
  alis_fiyati     numeric NOT NULL DEFAULT 0,  -- ₺/kg
  nakliye_bedeli  numeric NOT NULL DEFAULT 0,  -- ₺
  ym_fire         numeric NOT NULL DEFAULT 0,  -- %
  nem_fire        numeric NOT NULL DEFAULT 0,  -- %
  birim_maliyet   numeric NOT NULL DEFAULT 0,  -- ₺/kg hesaplanan
  notlar          text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin stock_records yönetir"     ON public.stock_records;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket stock_records" ON public.stock_records;

CREATE POLICY "SuperAdmin stock_records yönetir"
  ON public.stock_records FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket stock_records"
  ON public.stock_records FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );


-- ── 3. sales_records (satış kayıtları) ───────────────────────
CREATE TABLE IF NOT EXISTS public.sales_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id      uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  tarih           date NOT NULL,
  musteri_adi     text NOT NULL DEFAULT '',
  stok_turu       text NOT NULL DEFAULT 'hammadde'
                    CHECK (stok_turu IN ('hammadde', 'mamul')),
  hammadde_turu   text,
  mamul_turu      text,
  miktar          numeric NOT NULL DEFAULT 0,  -- kg
  satis_fiyati    numeric NOT NULL DEFAULT 0,  -- ₺/kg
  nakliye_bedeli  numeric NOT NULL DEFAULT 0,  -- ₺
  notlar          text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin sales_records yönetir"     ON public.sales_records;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket sales_records" ON public.sales_records;

CREATE POLICY "SuperAdmin sales_records yönetir"
  ON public.sales_records FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket sales_records"
  ON public.sales_records FOR ALL TO authenticated
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
  AND table_name IN ('contacts', 'stock_records', 'sales_records')
ORDER BY table_name;
