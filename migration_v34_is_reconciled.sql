-- migration_v34: Banka mutabakat durumu kolonu
-- is_reconciled = true  → Paraşüt'te tik var (banka mutabakatı sağlandı, gerçek işlem)
-- is_reconciled = false → tik yok (dengeleme/muhasebe kaydı)
-- is_reconciled = NULL  → eski kayıt, henüz bilinmiyor (Yeniden Senkronize Et ile güncellenir)

ALTER TABLE founding_cashflow
  ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN;

COMMENT ON COLUMN founding_cashflow.is_reconciled IS
  'Paraşüt banka mutabakatı: true=tik var/gerçek işlem, false=dengeleme kaydı, NULL=bilinmiyor';

RAISE NOTICE 'migration_v34 tamamlandı: is_reconciled kolonu eklendi';
