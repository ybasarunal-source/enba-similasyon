-- ============================================================
-- ENBA migration_v27: birim_maliyet yeniden hesaplama
-- Önceki formül: (brut_miktar * alis_fiyati + nakliye) / net_miktar  ← YANLIŞ
-- Doğru formül:  (net_miktar  * alis_fiyati + nakliye) / net_miktar
--                = alis_fiyati + nakliye / net_miktar
--
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Önce mevcut durumu gör (isteğe bağlı kontrol)
SELECT
  id,
  tarih,
  tedarikci_adi,
  brut_miktar,
  net_miktar,
  alis_fiyati,
  nakliye_bedeli,
  birim_maliyet                                          AS bm_eski,
  CASE
    WHEN net_miktar > 0
    THEN ROUND((net_miktar * alis_fiyati + nakliye_bedeli) / net_miktar, 4)
    ELSE 0
  END                                                    AS bm_yeni
FROM public.stock_records
ORDER BY tarih DESC;

-- 2. Güncelle
UPDATE public.stock_records
SET birim_maliyet =
  CASE
    WHEN net_miktar > 0
    THEN ROUND((net_miktar * alis_fiyati + nakliye_bedeli) / net_miktar, 4)
    ELSE 0
  END
WHERE net_miktar > 0;

-- 3. Doğrulama — bm_yeni ile birim_maliyet eşleşmeli
SELECT
  id,
  tarih,
  tedarikci_adi,
  birim_maliyet,
  ROUND(alis_fiyati + CASE WHEN net_miktar > 0 THEN nakliye_bedeli / net_miktar ELSE 0 END, 4) AS kontrol
FROM public.stock_records
ORDER BY tarih DESC;
