-- ============================================================
-- Granül Tesisi Makineleri — Seed Verisi
-- Kaynak: is_plani_konusma.md (2026-05-23)
--
-- Hedef tablolar:
--   • assets       → Makina Parkı modülü
--   • fixed_assets → Varlık Takibi modülü (amortisman takibi)
--
-- Supabase Dashboard → SQL Editor → Run
-- Güvenli: aynı isimde kayıt varsa atlar.
-- ============================================================

-- ▸ Operasyon: 'K' = Kömürcüler  |  'M' = Merkez  |  'V' = Varsak
-- Granül tesisi hangi lokasyona aitse aşağıdaki satırı değiştir.
DO $$ BEGIN PERFORM set_config('app.granul_operation', 'K', TRUE); END $$;

-- ── 1. MAKINA PARKI (assets tablosu) ─────────────────────────

INSERT INTO public.assets
  (user_id, company_id, adi, motor_gucu, kapasite, yatirim_bedeli, satinalma_tarihi, kategori, tur)
SELECT
  auth.uid()                                                       AS user_id,
  (SELECT company_id FROM public.profiles WHERE id = auth.uid())  AS company_id,
  m.adi, m.motor_gucu, m.kapasite,
  0                AS yatirim_bedeli,
  '2026-01-01'     AS satinalma_tarihi,
  'production'     AS kategori,
  'makina'         AS tur
FROM (
  VALUES
  --  adi                  kW    ton/sa
  ('Kırma Makinesi',    45::numeric,  2.0::numeric),
  ('Dikey Çırpıcı',    15::numeric,  0.6::numeric),
  ('Turbo Kurutucu',   55::numeric,  2.0::numeric),
  ('Yatay Sıkma',      45::numeric,  2.0::numeric),
  ('Agromel + Fan',    60::numeric,  2.0::numeric),
  ('Granülatör',      150::numeric,  0.3::numeric)
) AS m(adi, motor_gucu, kapasite)
WHERE NOT EXISTS (
  SELECT 1 FROM public.assets a
  WHERE a.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND a.adi = m.adi
);

-- ── 2. VARLIK TAKİBİ (fixed_assets tablosu) ──────────────────
-- Amortisman süresi: üretim makineleri için 10 yıl (VUK Genel Tebliği)
-- Alım bedeli: iş planında belirtilmedi → 0 (sonradan güncellenebilir)
-- Kur: 1 EUR = 40 TL (güncelleme gerekirse değiştir)

INSERT INTO public.fixed_assets
  (company_id, name, category, operation,
   purchase_date, purchase_amount_tl, exchange_rate,
   useful_life_years, notes, updated_at)
SELECT
  (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AS company_id,
  v.name,
  'Üretim Makinesi'    AS category,
  current_setting('app.granul_operation') AS operation,
  '2026-01-01'         AS purchase_date,
  0                    AS purchase_amount_tl,
  40                   AS exchange_rate,
  10                   AS useful_life_years,
  v.notes,
  now()                AS updated_at
FROM (
  VALUES
  --  name                  notlar (kW ve kapasite)
  ('Kırma Makinesi',    '45 kW — 2,0 ton/sa'),
  ('Dikey Çırpıcı',    '15 kW — 0,6 ton/sa'),
  ('Turbo Kurutucu',   '55 kW — 2,0 ton/sa'),
  ('Yatay Sıkma',      '45 kW — 2,0 ton/sa'),
  ('Agromel + Fan',    '60 kW — 2,0 ton/sa'),
  ('Granülatör',       '150 kW — 0,3 ton/sa | DARBOĞAZ')
) AS v(name, notes)
WHERE NOT EXISTS (
  SELECT 1 FROM public.fixed_assets f
  WHERE f.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND f.name = v.name
);

-- ── Doğrulama ─────────────────────────────────────────────────

SELECT '=== Makina Parkı ===' AS tablo, NULL AS operation, NULL AS notes,
       adi AS name, motor_gucu AS "kW", kapasite AS "ton/sa"
FROM public.assets
WHERE tur = 'makina'
  AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND adi IN ('Kırma Makinesi','Dikey Çırpıcı','Turbo Kurutucu','Yatay Sıkma','Agromel + Fan','Granülatör')

UNION ALL

SELECT '=== Varlık Takibi ===' AS tablo, operation, notes, name, NULL, NULL
FROM public.fixed_assets
WHERE company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND name IN ('Kırma Makinesi','Dikey Çırpıcı','Turbo Kurutucu','Yatay Sıkma','Agromel + Fan','Granülatör')

ORDER BY tablo, name;
