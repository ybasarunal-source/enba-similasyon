-- migration_v25_parasut_tokens
-- Paraşüt OAuth token'larını localStorage yerine Supabase'e taşır.
-- Company izolasyonu: her şirketin sadece kendi token'ına RLS erişimi var.
-- Veri kaybı riski: YOK — yeni tablo, mevcut tablolara dokunmaz.
-- Kullanıcılar bir kez yeniden Paraşüt bağlantısı yapmalı (localStorage'daki eski token'lar migrate edilmez).

CREATE TABLE IF NOT EXISTS parasut_tokens (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  access_token         text NOT NULL,
  refresh_token        text NOT NULL,
  expires_at           bigint NOT NULL,         -- Unix ms
  parasut_company_data jsonb,                   -- {id, name, ...}
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- Şirket başına tek satır
CREATE UNIQUE INDEX IF NOT EXISTS parasut_tokens_company_idx
  ON parasut_tokens(company_id);

-- RLS: kullanıcı sadece kendi şirketinin token'ına erişebilir
ALTER TABLE parasut_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parasut_tokens_company_only"
  ON parasut_tokens
  USING (
    company_id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
