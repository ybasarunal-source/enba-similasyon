-- ENBA SIMULASYON - SQL MIGRATION V2
-- Bu script eksik tabloları oluşturur ve mevcut tabloları günceller.

-- 1. business_plans tablosuna eksik sütunların eklenmesi
ALTER TABLE public.business_plans ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'fast';
ALTER TABLE public.business_plans ADD COLUMN IF NOT EXISTS shared_with UUID[] DEFAULT '{}';

-- status kısıtlamasını güncelleme (pending ekleniyor)
ALTER TABLE public.business_plans DROP CONSTRAINT IF EXISTS business_plans_status_check;
ALTER TABLE public.business_plans ADD CONSTRAINT business_plans_status_check 
  CHECK (status IN ('draft', 'active', 'archived', 'pending'));

-- content -> data mapping'i kodda yapılacak, tablo 'data' olarak kalacak.

-- 2. app_settings tablosu
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. contacts (Tedarikçiler ve Müşteriler)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_type TEXT CHECK (contact_type IN ('supplier', 'customer')),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. sales_records (Satış Kayıtları - stock_records ile paylaşımlı veya ayrı tutulabilir, DataService ayrı bekliyor)
CREATE TABLE IF NOT EXISTS public.sales_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tarih DATE DEFAULT CURRENT_DATE,
  musteri_adi TEXT,
  stok_turu TEXT,
  hammadde_turu TEXT,
  mamul_turu TEXT,
  miktar NUMERIC,
  satis_fiyati NUMERIC,
  nakliye_bedeli NUMERIC,
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. personnel (Personel Listesi)
CREATE TABLE IF NOT EXISTS public.personnel (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT,
  department TEXT,
  salary NUMERIC,
  sgk_status TEXT,
  start_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. attendance (Puantaj)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  person_id UUID REFERENCES public.personnel(id) ON DELETE CASCADE,
  month INTEGER,
  year INTEGER,
  work_hours NUMERIC,
  overtime_hours NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. personnel_payments (Ödemeler)
CREATE TABLE IF NOT EXISTS public.personnel_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  person_id UUID REFERENCES public.personnel(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  amount NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. personnel_debts (Borçlar/Avanslar)
CREATE TABLE IF NOT EXISTS public.personnel_debts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  person_id UUID REFERENCES public.personnel(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  amount NUMERIC,
  type TEXT, -- avans, borc vb.
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. production_records (Üretim Kayıtları)
CREATE TABLE IF NOT EXISTS public.production_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tarih DATE DEFAULT CURRENT_DATE,
  vardiya INTEGER,
  baslama_saati TIME,
  bitis_saati TIME,
  calisanlar TEXT[],
  giren_hammadde NUMERIC,
  cikan_urun NUMERIC,
  sayac_basi NUMERIC,
  sayac_sonu NUMERIC,
  fire_miktar NUMERIC,
  fire_oran NUMERIC,
  elektrik_sarfiyat NUMERIC,
  calisma_sure_saat NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. production_plans (Üretim Planları)
CREATE TABLE IF NOT EXISTS public.production_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT,
  start_date DATE,
  end_date DATE,
  target_output NUMERIC,
  efficiency_rate NUMERIC,
  shift_count INTEGER,
  shift_hours NUMERIC,
  working_days INTEGER[],
  product_type TEXT,
  special_days JSONB,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. cashflow_parameters (Nakit Akışı Ayarları)
CREATE TABLE IF NOT EXISTS public.cashflow_parameters (
  plan_id UUID REFERENCES public.business_plans(id) ON DELETE CASCADE PRIMARY KEY,
  parameters JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. logistics_records (Lojistik)
CREATE TABLE IF NOT EXISTS public.logistics_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tarih DATE DEFAULT CURRENT_DATE,
  arac_plaka TEXT,
  kullanici TEXT,
  baslangic_km NUMERIC,
  bitis_km NUMERIC,
  fark_km NUMERIC,
  guzergah TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. arsiv_files (Dosya Metadata)
CREATE TABLE IF NOT EXISTS public.arsiv_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad TEXT NOT NULL,
  mime TEXT,
  boyut INTEGER,
  kategori TEXT,
  etiketler TEXT[],
  notlar TEXT,
  storage_path TEXT,
  yuklenme_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. permit_records (Lisanslar)
CREATE TABLE IF NOT EXISTS public.permit_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad TEXT NOT NULL,
  kurum TEXT,
  kategori TEXT,
  alinis_tarihi DATE,
  yenileme_tarihi DATE,
  is_suresiz BOOLEAN DEFAULT FALSE,
  maliyet NUMERIC,
  file_id UUID REFERENCES public.arsiv_files(id),
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Enablement (Hepsi için)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflow_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arsiv_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_records ENABLE ROW LEVEL SECURITY;

-- Basit Politikalar (Tüm doğrulanmış kullanıcılar için)
CREATE POLICY "Authenticated users can access settings" ON public.app_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access contacts" ON public.contacts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access sales" ON public.sales_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access personnel" ON public.personnel FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access attendance" ON public.attendance FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access payments" ON public.personnel_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access debts" ON public.personnel_debts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access records" ON public.production_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access prod plans" ON public.production_plans FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access cashflow" ON public.cashflow_parameters FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access logistics" ON public.logistics_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access files" ON public.arsiv_files FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access permits" ON public.permit_records FOR ALL USING (auth.role() = 'authenticated');
