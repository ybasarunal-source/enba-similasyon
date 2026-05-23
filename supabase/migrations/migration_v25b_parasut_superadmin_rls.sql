-- migration_v25b_parasut_superadmin_rls
-- parasut_tokens tablosunun RLS politikasını günceller:
-- super_admin rolündeki kullanıcılar tüm şirketlerin token'larına erişebilir.
-- Veri kaybı riski: YOK — sadece politika değişikliği.

DROP POLICY IF EXISTS "parasut_tokens_company_only" ON parasut_tokens;

CREATE POLICY "parasut_tokens_company_only"
  ON parasut_tokens
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  )
  WITH CHECK (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );
