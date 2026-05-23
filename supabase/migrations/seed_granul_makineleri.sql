-- ============================================================
-- Granül Tesisi Makineleri — Seed Verisi
-- Kaynak: is_plani_konusma.md (2026-05-23)
--
-- Supabase Dashboard → SQL Editor
--
-- ADIM 1: Önce şu sorguyu çalıştır, company_id'ni kopyala:
--   SELECT id, name FROM public.companies;
--
-- ADIM 2: Aşağıdaki 'BURAYA_YAPISTIR' yerine o UUID'yi yaz
-- ADIM 3: Gerekirse operasyonu değiştir: 'K'=Kömürcüler 'M'=Merkez 'V'=Varsak
-- ADIM 4: Tüm dosyayı Run
-- ============================================================

DO $$
DECLARE
  v_company_id uuid    := 'BURAYA_YAPISTIR';   -- ← company_id buraya
  v_operation  text    := 'K';                  -- ← 'K' | 'M' | 'V'
  v_eklenen    int     := 0;
  v_atlanan    int     := 0;

  -- Makine listesi: (adi, kw, kapasite_ton_sa, notlar)
  makineler text[][] := ARRAY[
    ['Kırma Makinesi',  '45',  '2.0', '45 kW — 2,0 ton/sa'],
    ['Dikey Çırpıcı',  '15',  '0.6', '15 kW — 0,6 ton/sa'],
    ['Turbo Kurutucu', '55',  '2.0', '55 kW — 2,0 ton/sa'],
    ['Yatay Sıkma',    '45',  '2.0', '45 kW — 2,0 ton/sa'],
    ['Agromel + Fan',  '60',  '2.0', '60 kW — 2,0 ton/sa'],
    ['Granülatör',    '150', '0.3', '150 kW — 0,3 ton/sa | DARBOĞAZ']
  ];
  m text[];

BEGIN

  IF v_company_id::text = 'BURAYA_YAPISTIR' THEN
    RAISE EXCEPTION 'company_id girilmedi! Önce: SELECT id, name FROM public.companies;';
  END IF;

  FOREACH m SLICE 1 IN ARRAY makineler LOOP

    -- ── Makina Parkı (assets) ────────────────────────────────
    IF EXISTS (SELECT 1 FROM public.assets WHERE company_id = v_company_id AND adi = m[1]) THEN
      RAISE NOTICE '[assets] ATLANDI (zaten var): %', m[1];
      v_atlanan := v_atlanan + 1;
    ELSE
      INSERT INTO public.assets
        (company_id, adi, motor_gucu, kapasite, yatirim_bedeli, satinalma_tarihi, kategori, tur)
      VALUES
        (v_company_id, m[1], m[2]::numeric, m[3]::numeric, 0, '2026-01-01', 'production', 'makina');
      RAISE NOTICE '[assets] EKLENDİ: %', m[1];
      v_eklenen := v_eklenen + 1;
    END IF;

    -- ── Varlık Takibi (fixed_assets) ────────────────────────
    IF EXISTS (SELECT 1 FROM public.fixed_assets WHERE company_id = v_company_id AND name = m[1]) THEN
      RAISE NOTICE '[fixed_assets] ATLANDI (zaten var): %', m[1];
    ELSE
      INSERT INTO public.fixed_assets
        (company_id, name, category, operation,
         purchase_date, purchase_amount_tl, exchange_rate,
         useful_life_years, notes, updated_at)
      VALUES
        (v_company_id, m[1], 'Üretim Makinesi', v_operation,
         '2026-01-01', 0, 40,
         10, m[4], now());
      RAISE NOTICE '[fixed_assets] EKLENDİ: %', m[1];
    END IF;

  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== assets: % yeni, % atlandı ===', v_eklenen, v_atlanan;

END $$;

-- ── Doğrulama ─────────────────────────────────────────────────
SELECT 'Makina Parkı' AS kaynak, adi AS makine, motor_gucu AS kw, kapasite AS "ton/sa", NULL AS operation
FROM   public.assets
WHERE  company_id = (SELECT id FROM public.companies LIMIT 1)
  AND  adi IN ('Kırma Makinesi','Dikey Çırpıcı','Turbo Kurutucu','Yatay Sıkma','Agromel + Fan','Granülatör')

UNION ALL

SELECT 'Varlık Takibi', name, NULL, NULL, operation
FROM   public.fixed_assets
WHERE  company_id = (SELECT id FROM public.companies LIMIT 1)
  AND  name IN ('Kırma Makinesi','Dikey Çırpıcı','Turbo Kurutucu','Yatay Sıkma','Agromel + Fan','Granülatör')

ORDER BY kaynak, makine;
