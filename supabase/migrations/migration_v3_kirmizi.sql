-- ============================================================
-- ENBA SIMULASYON — Migration v3: Tam Kurulum (Self-Contained)
-- Tarih: 2026-05-05
-- Çalıştırma: Supabase Dashboard → SQL Editor → Run
--
-- Bu dosya hem migration_v2'nin hem de kırmızı düzeltmelerin
-- tamamını kapsar. Önceki migration'lar çalıştırılmamış olsa da
-- bu tek dosya yeterlidir. Tüm CREATE'ler IF NOT EXISTS ile
-- idempotent yazılmıştır — birden fazla çalıştırmak güvenlidir.
--
-- ⚠️  stock_records yeniden oluşturuluyor (eski sütunlar yanlıştı).
--     Canlı veri varsa önce: SELECT * FROM public.stock_records;
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- 1. COMPANIES (Şirketler / Multi-Tenancy temeli)
--    supabase.ts'te companiesAPI bunu kullanıyor, SQL'de yoktu.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text        NOT NULL,
  slug       text        UNIQUE NOT NULL,
  status     text        DEFAULT 'active'
             CHECK (status IN ('active', 'suspended', 'demo')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super adminler tüm şirketleri yönetebilir" ON public.companies;
CREATE POLICY "Super adminler tüm şirketleri yönetebilir"
  ON public.companies FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "Adminler kendi şirketini görebilir" ON public.companies;
CREATE POLICY "Adminler kendi şirketini görebilir"
  ON public.companies FOR SELECT TO authenticated
  USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );


-- ──────────────────────────────────────────────────────────
-- 2. PROFILES — Eksik sütunlar
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id          uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ms_account_id       text,
  ADD COLUMN IF NOT EXISTS ms_account_username text,
  ADD COLUMN IF NOT EXISTS microsoft_data      jsonb,
  ADD COLUMN IF NOT EXISTS google_data         jsonb,
  ADD COLUMN IF NOT EXISTS parasut_data        jsonb;

-- is_admin() → super_admin rolünü de kapsar
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Super adminler tüm profilleri yönetebilir" ON public.profiles;
CREATE POLICY "Super adminler tüm profilleri yönetebilir"
  ON public.profiles FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'super_admin')
  );


-- ──────────────────────────────────────────────────────────
-- 3. STOCK_RECORDS — Doğru sütunlarla yeniden oluştur
--    Eski şema (type, material_type, amount...) kodla uyuşmuyordu.
--    Eski tablo _v1_backup olarak saklanıyor.
-- ──────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='stock_records') THEN
    ALTER TABLE public.stock_records RENAME TO stock_records_v1_backup;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.stock_records (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id     uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  tarih          date        NOT NULL DEFAULT current_date,
  tedarikci_adi  text,
  hammadde_turu  text        NOT NULL,
  brut_miktar    numeric     NOT NULL,
  net_miktar     numeric,
  alis_fiyati    numeric,
  nakliye_bedeli numeric     DEFAULT 0,
  ym_fire        numeric,
  nem_fire       numeric,
  birim_maliyet  numeric,
  notlar         text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.stock_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Şirket verilerini gör" ON public.stock_records;
CREATE POLICY "Şirket verilerini gör" ON public.stock_records
  FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Şirket verisi ekle" ON public.stock_records;
CREATE POLICY "Şirket verisi ekle" ON public.stock_records
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Şirket verisi güncelle" ON public.stock_records;
CREATE POLICY "Şirket verisi güncelle" ON public.stock_records
  FOR UPDATE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admin şirket verisini silebilir" ON public.stock_records;
CREATE POLICY "Admin şirket verisini silebilir" ON public.stock_records
  FOR DELETE TO authenticated USING (public.is_admin());


-- ──────────────────────────────────────────────────────────
-- 4. SALES_RECORDS (migration_v2'de vardı — şimdi company_id ile)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sales_records (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id     uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  tarih          date        DEFAULT current_date,
  musteri_adi    text,
  stok_turu      text,
  hammadde_turu  text,
  mamul_turu     text,
  miktar         numeric,
  satis_fiyati   numeric,
  nakliye_bedeli numeric,
  notlar         text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Satış kayıtlarını yönet" ON public.sales_records;
CREATE POLICY "Satış kayıtlarını yönet" ON public.sales_records
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );


-- ──────────────────────────────────────────────────────────
-- 5. CONTACTS (Tedarikçiler & Müşteriler)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contacts (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id   uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_type text        CHECK (contact_type IN ('supplier', 'customer')),
  name         text        NOT NULL,
  phone        text,
  email        text,
  address      text,
  notlar       text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kişileri yönet" ON public.contacts;
CREATE POLICY "Kişileri yönet" ON public.contacts
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );


-- ──────────────────────────────────────────────────────────
-- 6. BUSINESS_PLANS (company_id + plan_type + shared_with ekle)
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.business_plans
  ADD COLUMN IF NOT EXISTS company_id  uuid      REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS plan_type   text      DEFAULT 'fast',
  ADD COLUMN IF NOT EXISTS shared_with uuid[]    DEFAULT '{}';

ALTER TABLE public.business_plans
  DROP CONSTRAINT IF EXISTS business_plans_status_check;
ALTER TABLE public.business_plans
  ADD CONSTRAINT business_plans_status_check
  CHECK (status IN ('draft', 'active', 'archived', 'pending'));


-- ──────────────────────────────────────────────────────────
-- 7. PERMITS (permit_records adıyla yanlış oluşturulmuştu)
-- ──────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.permit_records;

CREATE TABLE IF NOT EXISTS public.permits (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id      uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  ad              text        NOT NULL,
  kategori        text,
  kurum           text,
  alinis_tarihi   date,
  yenileme_tarihi date,
  is_suresiz      boolean     DEFAULT false,
  maliyet         numeric     DEFAULT 0,
  file_id         uuid,
  file_name       text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Şirket lisanslarını yönet" ON public.permits;
CREATE POLICY "Şirket lisanslarını yönet" ON public.permits
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );


-- ──────────────────────────────────────────────────────────
-- 8. FIXED_EXPENSES (Sabit Giderler — supabase.ts'te vardı, SQL'de yoktu)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fixed_expenses (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id            uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id               uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  title                 text        NOT NULL,
  amount                numeric     NOT NULL,
  category              text        NOT NULL,
  due_date              integer     NOT NULL,
  is_auto_pay           boolean     DEFAULT false,
  parasut_match_keyword text,
  history               jsonb       DEFAULT '{}'::jsonb,
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sabit giderleri yönet" ON public.fixed_expenses;
CREATE POLICY "Sabit giderleri yönet" ON public.fixed_expenses
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );


-- ──────────────────────────────────────────────────────────
-- 9. PROJECT_GROUPS → PROJECTS → TASKS (Görev Modülü)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_groups (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  name       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.project_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Proje gruplarını yönet" ON public.project_groups;
CREATE POLICY "Proje gruplarını yönet" ON public.project_groups
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

-- ----
CREATE TABLE IF NOT EXISTS public.projects (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  name       text        NOT NULL,
  group_id   uuid        REFERENCES public.project_groups(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Projeleri yönet" ON public.projects;
CREATE POLICY "Projeleri yönet" ON public.projects
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

-- ----
CREATE TABLE IF NOT EXISTS public.tasks (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id  uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  title       text        NOT NULL,
  description text,
  priority    text        DEFAULT 'medium'
              CHECK (priority IN ('low', 'medium', 'high')),
  deadline    text,
  project_id  uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  module_ref  text,
  status      text        DEFAULT 'todo'
              CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  source      text        DEFAULT 'manual',
  ms_todo_id  text,
  ms_list_id  text,
  g_task_id   text,
  g_list_id   text,
  is_pinned   boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Görevleri yönet" ON public.tasks;
CREATE POLICY "Görevleri yönet" ON public.tasks
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );


-- ──────────────────────────────────────────────────────────
-- 10. PNL_REPORTS (Kâr/Zarar — supabase.ts'te vardı, SQL'de yoktu)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pnl_reports (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  name       text        NOT NULL,
  date       date        NOT NULL DEFAULT current_date,
  payload    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pnl_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PnL raporlarını yönet" ON public.pnl_reports;
CREATE POLICY "PnL raporlarını yönet" ON public.pnl_reports
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );


-- ──────────────────────────────────────────────────────────
-- 11. ASSETS → MAINTENANCE_RECORDS (Makine & Ekipman)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assets (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id       uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id          uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  adi              text        NOT NULL,
  marka            text,
  motor_gucu       numeric,
  yatirim_bedeli   numeric     NOT NULL DEFAULT 0,
  satinalma_tarihi date        NOT NULL,
  kategori         text        NOT NULL,
  kapasite         numeric,
  boyut            text,
  tur              text        NOT NULL,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Varlıkları yönet" ON public.assets;
CREATE POLICY "Varlıkları yönet" ON public.assets
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

-- ----
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id  uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  tarih       date        NOT NULL DEFAULT current_date,
  varlik_id   uuid        REFERENCES public.assets(id) ON DELETE SET NULL,
  varlik_adi  text        NOT NULL,
  varlik_turu text,
  tur         text        NOT NULL,
  aciklama    text,
  maliyet     numeric     DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bakım kayıtlarını yönet" ON public.maintenance_records;
CREATE POLICY "Bakım kayıtlarını yönet" ON public.maintenance_records
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );


-- ──────────────────────────────────────────────────────────
-- 12. İNSAN KAYNAKLARI (migration_v2'deydi — company_id ile)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.personnel (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  name       text        NOT NULL,
  position   text,
  department text,
  salary     numeric,
  sgk_status text,
  start_date date,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Personeli yönet" ON public.personnel;
CREATE POLICY "Personeli yönet" ON public.personnel
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

-- ----
CREATE TABLE IF NOT EXISTS public.attendance (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id     uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  person_id      uuid        REFERENCES public.personnel(id) ON DELETE CASCADE,
  month          integer,
  year           integer,
  work_hours     numeric,
  overtime_hours numeric,
  notes          text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Puantajı yönet" ON public.attendance;
CREATE POLICY "Puantajı yönet" ON public.attendance
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- ----
CREATE TABLE IF NOT EXISTS public.personnel_payments (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  person_id  uuid        REFERENCES public.personnel(id) ON DELETE CASCADE,
  date       date        DEFAULT current_date,
  amount     numeric,
  status     text        DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.personnel_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ödemeleri yönet" ON public.personnel_payments;
CREATE POLICY "Ödemeleri yönet" ON public.personnel_payments
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- ----
CREATE TABLE IF NOT EXISTS public.personnel_debts (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id  uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  person_id   uuid        REFERENCES public.personnel(id) ON DELETE CASCADE,
  date        date        DEFAULT current_date,
  amount      numeric,
  type        text,
  description text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.personnel_debts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Borçları yönet" ON public.personnel_debts;
CREATE POLICY "Borçları yönet" ON public.personnel_debts
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );


-- ──────────────────────────────────────────────────────────
-- 13. ÜRETİM (migration_v2'deydi — company_id ile)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.production_records (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id           uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id              uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  tarih                date        DEFAULT current_date,
  vardiya              integer,
  baslama_saati        time,
  bitis_saati          time,
  calisanlar           text[],
  giren_hammadde       numeric,
  cikan_urun           numeric,
  sayac_basi           numeric,
  sayac_sonu           numeric,
  fire_miktar          numeric,
  fire_oran            numeric,
  elektrik_sarfiyat    numeric,
  calisma_sure_saat    numeric,
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Üretim kayıtlarını yönet" ON public.production_records;
CREATE POLICY "Üretim kayıtlarını yönet" ON public.production_records
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

-- ----
CREATE TABLE IF NOT EXISTS public.production_plans (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id      uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  title           text,
  start_date      date,
  end_date        date,
  target_output   numeric,
  efficiency_rate numeric,
  shift_count     integer,
  shift_hours     numeric,
  working_days    integer[],
  product_type    text,
  special_days    jsonb,
  notes           text,
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.production_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Üretim planlarını yönet" ON public.production_plans;
CREATE POLICY "Üretim planlarını yönet" ON public.production_plans
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );


-- ──────────────────────────────────────────────────────────
-- 14. LOJİSTİK (migration_v2'deydi — company_id ile)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logistics_records (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id   uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  tarih        date        DEFAULT current_date,
  arac_plaka   text,
  kullanici    text,
  baslangic_km numeric,
  bitis_km     numeric,
  fark_km      numeric,
  guzergah     text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.logistics_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lojistik kayıtlarını yönet" ON public.logistics_records;
CREATE POLICY "Lojistik kayıtlarını yönet" ON public.logistics_records
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );


-- ──────────────────────────────────────────────────────────
-- 15. ARŞİV (migration_v2'deydi — company_id ile)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.arsiv_files (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id     uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  ad             text        NOT NULL,
  mime           text,
  boyut          integer,
  kategori       text,
  etiketler      text[],
  notlar         text,
  storage_path   text,
  yuklenme_tarihi timestamptz DEFAULT now()
);

ALTER TABLE public.arsiv_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Arşiv dosyalarını yönet" ON public.arsiv_files;
CREATE POLICY "Arşiv dosyalarını yönet" ON public.arsiv_files
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );


-- ──────────────────────────────────────────────────────────
-- 16. CASHFLOW_PARAMETERS (migration_v2'deydi — company_id ile)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cashflow_parameters (
  plan_id    uuid        REFERENCES public.business_plans(id) ON DELETE CASCADE PRIMARY KEY,
  company_id uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  parameters jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.cashflow_parameters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nakit akışı parametrelerini yönet" ON public.cashflow_parameters;
CREATE POLICY "Nakit akışı parametrelerini yönet" ON public.cashflow_parameters
  FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );


-- ──────────────────────────────────────────────────────────
-- 17. APP_SETTINGS (migration_v2'deydi — değişmedi)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        text        PRIMARY KEY,
  value      jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can access settings" ON public.app_settings;
CREATE POLICY "Authenticated users can access settings"
  ON public.app_settings FOR ALL TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);


-- ──────────────────────────────────────────────────────────
-- 18. MEVCUT TABLOLARA GÜVENLE company_id EKLE
--     Tablolar zaten varsa ve company_id yoksa ekler.
--     Tablolar yoksa hata vermez (DO bloğu sayesinde).
-- ──────────────────────────────────────────────────────────
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'sales_records', 'contacts', 'business_plans', 'personnel',
    'attendance', 'personnel_payments', 'personnel_debts',
    'production_records', 'production_plans', 'logistics_records',
    'arsiv_files', 'cashflow_parameters', 'permits', 'fixed_expenses',
    'project_groups', 'projects', 'tasks', 'pnl_reports',
    'assets', 'maintenance_records'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE',
        tbl
      );
    END IF;
  END LOOP;
END $$;
