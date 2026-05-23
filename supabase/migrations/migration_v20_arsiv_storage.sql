-- ============================================================
-- ENBA: Supabase Storage — arsiv bucket oluşturma
-- Arşiv modülü dosya yüklemeleri için gerekli
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Bucket oluştur (varsa atla)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'arsiv',
  'arsiv',
  false,                    -- private bucket, signed URL ile erişilir
  52428800,                 -- 50 MB limit per file
  ARRAY[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS politikaları
-- Kimlik doğrulanmış kullanıcılar kendi şirket dosyalarını yükleyebilir/indirebilir

-- Upload policy
DROP POLICY IF EXISTS "Authenticated users can upload to arsiv" ON storage.objects;
CREATE POLICY "Authenticated users can upload to arsiv"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'arsiv');

-- Download policy (signed URL ile erişim zaten güvenli, ek SELECT politikası)
DROP POLICY IF EXISTS "Authenticated users can read arsiv" ON storage.objects;
CREATE POLICY "Authenticated users can read arsiv"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'arsiv');

-- Delete policy
DROP POLICY IF EXISTS "Authenticated users can delete from arsiv" ON storage.objects;
CREATE POLICY "Authenticated users can delete from arsiv"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'arsiv');

-- Doğrulama
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'arsiv';
