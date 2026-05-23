-- ============================================================
-- ENBA: Login sayfası şirket listesi düzeltmesi
--
-- Sorun: migration_v12 FORCE ROW LEVEL SECURITY ekledi.
-- Login sayfası anon (oturum açılmamış) olarak companies sorgular.
-- anon için policy yok → boş liste → "Kayıtlı şirket bulunamadı."
--
-- Çözüm: anon role için SELECT policy ekle (sadece active/demo şirketler).
-- ============================================================

-- Login sayfası anon olarak aktif/demo şirketleri görebilir
CREATE POLICY "Herkes aktif şirketleri görebilir"
  ON public.companies FOR SELECT TO anon
  USING (status IN ('active', 'demo'));

-- Doğrulama: policies listesi
SELECT policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'companies'
ORDER BY policyname;
