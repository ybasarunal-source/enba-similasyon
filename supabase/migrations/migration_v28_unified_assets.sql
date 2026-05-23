-- ============================================================
-- migration_v28: Unified assets — fixed_assets tablosu kaldırılıyor
--
-- fixed_assets.name             → assets.adi
-- fixed_assets.category         → assets.kategori
-- fixed_assets.operation        → assets.operation (YENİ)
-- fixed_assets.purchase_date    → assets.satinalma_tarihi
-- fixed_assets.purchase_amount  → assets.yatirim_bedeli
-- fixed_assets.exchange_rate    → assets.exchange_rate (YENİ)
-- fixed_assets.useful_life_years→ assets.useful_life_years (YENİ)
-- fixed_assets.notes            → assets.notes (YENİ)
--
-- asset_deposits tablosu dokunulmadı.
-- maintenance tablosu dokunulmadı (assets.id referansı korundu).
--
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. assets tablosuna yeni kolonlar ────────────────────────
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS operation         text    CHECK (operation IN ('M','K','V')),
  ADD COLUMN IF NOT EXISTS exchange_rate     numeric NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS useful_life_years integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS notes             text    NOT NULL DEFAULT '';

-- ── 2. fixed_assets varsa migrate et, sonra drop et ──────────
DO $$ BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fixed_assets'
  ) THEN
    RAISE NOTICE 'fixed_assets tablosu bulunamadı — migration atlandı.';
    RETURN;
  END IF;

  -- 2a. Eşleşen kayıtları güncelle (aynı şirket + aynı ad)
  UPDATE public.assets a
  SET
    operation          = f.operation,
    exchange_rate      = COALESCE(f.exchange_rate,      40),
    useful_life_years  = COALESCE(f.useful_life_years,  10),
    notes              = COALESCE(NULLIF(f.notes, ''),  a.notes)
  FROM public.fixed_assets f
  WHERE a.company_id = f.company_id
    AND a.adi        = f.name;

  RAISE NOTICE '2a tamamlandı: mevcut assets güncellendi.';

  -- 2b. Sadece fixed_assets'te olan kayıtları aktar
  INSERT INTO public.assets
    (company_id, adi, yatirim_bedeli, satinalma_tarihi,
     kategori, tur, operation, exchange_rate, useful_life_years, notes)
  SELECT
    f.company_id,
    f.name,
    COALESCE(f.purchase_amount_tl, 0),
    f.purchase_date::date,
    COALESCE(NULLIF(f.category,''), 'Diğer'),
    'makina',                              -- tur varsayılanı
    f.operation,
    COALESCE(f.exchange_rate,      40),
    COALESCE(f.useful_life_years,  10),
    COALESCE(f.notes,              '')
  FROM public.fixed_assets f
  WHERE NOT EXISTS (
    SELECT 1 FROM public.assets a
    WHERE a.company_id = f.company_id AND a.adi = f.name
  );

  RAISE NOTICE '2b tamamlandı: eksik kayıtlar assets''e eklendi.';

  -- 2c. Drop
  DROP TABLE public.fixed_assets;
  RAISE NOTICE '2c tamamlandı: fixed_assets tablosu silindi.';

END $$;

-- ── 3. Doğrulama ──────────────────────────────────────────────
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'assets'
ORDER BY ordinal_position;
