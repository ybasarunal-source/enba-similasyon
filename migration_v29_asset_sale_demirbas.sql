-- migration_v29: Varlık takibi genişletme
-- Supabase SQL Editor'de çalıştır
-- ⚠️ Veri kaybı riski yok — mevcut satırlar etkilenmez

-- 1. assets tablosuna yeni opsiyonel kolonlar
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS demirbas_no  TEXT,
  ADD COLUMN IF NOT EXISTS satis_tarihi DATE,
  ADD COLUMN IF NOT EXISTS satis_bedeli NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS photos       TEXT[] DEFAULT '{}';

COMMENT ON COLUMN assets.demirbas_no  IS 'Demirbaş / sabit kıymet numarası (ör: MK-001, DM-042)';
COMMENT ON COLUMN assets.satis_tarihi IS 'Satış tarihi — dolu ise varlık aktiften çıkmıştır';
COMMENT ON COLUMN assets.satis_bedeli IS 'Satış bedeli (₺)';
COMMENT ON COLUMN assets.photos       IS 'Supabase storage path listesi (asset-photos bucket)';

-- 2. Varlık harcamaları tablosu
CREATE TABLE IF NOT EXISTS asset_expenditures (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  asset_id    UUID NOT NULL REFERENCES assets(id)    ON DELETE CASCADE,
  tarih       DATE           NOT NULL,
  tutar       NUMERIC(15, 2) NOT NULL DEFAULT 0,
  aciklama    TEXT           NOT NULL DEFAULT '',
  tur         TEXT           NOT NULL DEFAULT 'kapex'
              CHECK (tur IN ('kapex', 'bakim')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE asset_expenditures IS
  'Varlık bazlı harcamalar: kapex = maliyete eklenir, bakim = gider olarak takip edilir';

-- RLS
ALTER TABLE asset_expenditures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON asset_expenditures
  USING (
    company_id = COALESCE(
      (SELECT company_id FROM profiles WHERE id = auth.uid()),
      (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    )
  )
  WITH CHECK (
    company_id = COALESCE(
      (SELECT company_id FROM profiles WHERE id = auth.uid()),
      (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    )
  );

-- 3. Supabase Storage: asset-photos bucket
--    Aşağıdaki adımı SQL ile yapamayız — Supabase Dashboard'da manuel yap:
--    Storage → New bucket → Name: "asset-photos" → Public: KAPALI
--    Ardından şu policy'yi ekle:

/*
-- Storage bucket policy (Dashboard → Storage → asset-photos → Policies):
CREATE POLICY "company_access" ON storage.objects FOR ALL
  USING (
    bucket_id = 'asset-photos'
    AND auth.role() = 'authenticated'
  )
  WITH CHECK (
    bucket_id = 'asset-photos'
    AND auth.role() = 'authenticated'
  );
*/
