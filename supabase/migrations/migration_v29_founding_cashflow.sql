-- migration_v29_founding_cashflow.sql
-- Kuruluş nakit akışı tablosu (gelir + gider kayıtları)
-- Çalıştırma: Supabase SQL Editor → Run

CREATE TABLE IF NOT EXISTS public.founding_cashflow (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tarih       date        NOT NULL,
  tip         text        NOT NULL CHECK (tip IN ('gelir', 'gider')),
  kategori    text        NOT NULL DEFAULT '',
  tutar_tl    numeric     NOT NULL DEFAULT 0,
  aciklama    text        NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.founding_cashflow ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi şirketlerinin kayıtlarını görebilir/düzenleyebilir
CREATE POLICY "fc_select" ON public.founding_cashflow
  FOR SELECT USING (
    company_id = (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "fc_insert" ON public.founding_cashflow
  FOR INSERT WITH CHECK (
    company_id = (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "fc_update" ON public.founding_cashflow
  FOR UPDATE USING (
    company_id = (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "fc_delete" ON public.founding_cashflow
  FOR DELETE USING (
    company_id = (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- super_admin tüm kayıtlara erişebilir
CREATE POLICY "fc_superadmin" ON public.founding_cashflow
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- updated_at otomatik güncelle
CREATE OR REPLACE FUNCTION public.fc_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER fc_updated_at
  BEFORE UPDATE ON public.founding_cashflow
  FOR EACH ROW EXECUTE FUNCTION public.fc_set_updated_at();

-- İndeks
CREATE INDEX IF NOT EXISTS idx_fc_company_tarih
  ON public.founding_cashflow (company_id, tarih DESC);
