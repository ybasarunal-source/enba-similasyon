-- migration_v33: Hesap silme yedekleme tablosu
-- Silinen hesap hareketleri 30 gün bu tabloda tutulur.

CREATE TABLE IF NOT EXISTS founding_cashflow_deleted (
  id               UUID         NOT NULL,
  company_id       UUID         NOT NULL,
  tarih            DATE         NOT NULL,
  tip              TEXT         NOT NULL,
  kategori         TEXT         NOT NULL DEFAULT '',
  tutar_tl         NUMERIC(14,2) NOT NULL DEFAULT 0,
  aciklama         TEXT         NOT NULL DEFAULT '',
  parasut_id       TEXT,
  source_account   TEXT,
  transaction_type TEXT,
  balance_after    NUMERIC(14,2),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  -- Silme meta verisi
  deleted_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_by_email TEXT,
  deletion_reason  TEXT
);

ALTER TABLE founding_cashflow_deleted ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own deleted records"
  ON founding_cashflow_deleted
  FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1
    )
  );

-- 30 günden eski kayıtları temizlemek için cron (Supabase Dashboard > Integrations > pg_cron):
-- SELECT cron.schedule('delete-old-backups', '0 3 * * *',
--   $$DELETE FROM founding_cashflow_deleted WHERE deleted_at < NOW() - INTERVAL '30 days'$$);

RAISE NOTICE 'migration_v33 tamamlandı: founding_cashflow_deleted tablosu oluşturuldu';
