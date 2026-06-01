-- migration_v34: Banka mutabakat durumu kolonu
-- is_reconciled = true  → Paraşüt'te tik var (banka mutabakatı sağlandı, gerçek işlem)
-- is_reconciled = false → tik yok (dengeleme/muhasebe kaydı)
-- is_reconciled = NULL  → eski kayıt, henüz bilinmiyor (Yeniden Senkronize Et ile güncellenir)

ALTER TABLE founding_cashflow
  ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN;

COMMENT ON COLUMN founding_cashflow.is_reconciled IS
  'Parasut banka mutabakati: true=tik var/gercek islem, false=denge kayd, NULL=bilinmiyor';
