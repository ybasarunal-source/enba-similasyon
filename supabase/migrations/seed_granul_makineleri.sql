-- ============================================================
-- Granül Tesisi Makineleri — Seed Verisi
-- Kaynak: is_plani_konusma.md (2026-05-23)
--
-- ⚠️ migration_v28 çalıştırıldıktan SONRA çalıştır.
--    Artık tek tablo: public.assets
--    Hem Makina Parkı hem Varlık Takibi bu tabloyu okur.
--
-- Supabase Dashboard → SQL Editor
-- ADIM 1: SELECT id, name FROM public.companies;  → company_id kopyala
-- ADIM 2: 'BURAYA_YAPISTIR' yerine UUID yapıştır
-- ADIM 3: Run
-- ============================================================

DO $$
DECLARE
  v_company_id uuid := 'a191c800-d8c3-4780-b08f-dd75faef3baf';
  v_operation  text := 'K';                -- ← 'K'=Kömürcüler 'M'=Merkez 'V'=Varsak

  --  adi                  kW    ton/sa  not
  makineler text[][] := ARRAY[
    ['Kırma Makinesi',  '45',  '2.0', '45 kW — 2,0 ton/sa'],
    ['Dikey Çırpıcı',  '15',  '0.6', '15 kW — 0,6 ton/sa'],
    ['Turbo Kurutucu', '55',  '2.0', '55 kW — 2,0 ton/sa'],
    ['Yatay Sıkma',    '45',  '2.0', '45 kW — 2,0 ton/sa'],
    ['Agromel + Fan',  '60',  '2.0', '60 kW — 2,0 ton/sa'],
    ['Granülatör',    '150',  '0.3', '150 kW — 0,3 ton/sa | DARBOĞAZ']
  ];
  m text[];
  eklenen int := 0;

BEGIN

  IF v_company_id::text = 'BURAYA_YAPISTIR' THEN
    RAISE EXCEPTION 'company_id girilmedi! Önce: SELECT id, name FROM public.companies;';
  END IF;

  FOREACH m SLICE 1 IN ARRAY makineler LOOP
    IF EXISTS (
      SELECT 1 FROM public.assets
      WHERE company_id = v_company_id AND adi = m[1]
    ) THEN
      RAISE NOTICE 'ATLANDI (zaten var): %', m[1];
    ELSE
      INSERT INTO public.assets
        (company_id, adi, motor_gucu, kapasite,
         yatirim_bedeli, satinalma_tarihi, kategori, tur,
         operation, exchange_rate, useful_life_years, notes)
      VALUES
        (v_company_id, m[1], m[2]::numeric, m[3]::numeric,
         0, '2026-01-01', 'Üretim Makinesi', 'makina',
         v_operation, 40, 10, m[4]);
      eklenen := eklenen + 1;
      RAISE NOTICE 'EKLENDİ: %', m[1];
    END IF;
  END LOOP;

  RAISE NOTICE '=== % makine eklendi ===', eklenen;

END $$;

-- ── Doğrulama ─────────────────────────────────────────────────
SELECT adi AS "Makine", motor_gucu AS "kW", kapasite AS "ton/sa",
       operation AS "Op", notes AS "Not"
FROM   public.assets
WHERE  company_id = (SELECT id FROM public.companies LIMIT 1)
  AND  adi IN ('Kırma Makinesi','Dikey Çırpıcı','Turbo Kurutucu',
               'Yatay Sıkma','Agromel + Fan','Granülatör')
ORDER BY created_at;
