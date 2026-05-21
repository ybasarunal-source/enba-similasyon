-- migration_v26: custom_holidays tablosu
-- Resmi tatil + köprü günü yönetimi

CREATE TABLE IF NOT EXISTS custom_holidays (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date        date        NOT NULL UNIQUE,
  name        text        NOT NULL,
  is_bridge   boolean     NOT NULL DEFAULT false,
  company_id  uuid        REFERENCES companies(id) ON DELETE CASCADE,
  created_by  uuid        REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE custom_holidays ENABLE ROW LEVEL SECURITY;

-- Aynı şirketteki tüm kullanıcılar okuyabilir
CREATE POLICY "custom_holidays_select" ON custom_holidays
  FOR SELECT USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Yalnızca admin ve super_admin yazabilir
CREATE POLICY "custom_holidays_insert" ON custom_holidays
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "custom_holidays_update" ON custom_holidays
  FOR UPDATE USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "custom_holidays_delete" ON custom_holidays
  FOR DELETE USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );
