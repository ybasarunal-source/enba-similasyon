# Supabase RLS Dersleri — 2026-05-05 Oturumu
> Kaynak: 9 migration SQL'i gerektiren hata ayıklama süreci

---

## Ne Oldu?

`profiles` tablosuna art arda migration SQL'leri çalıştırıldı. Her migration mevcut policy'leri tam silmeden üstüne yenileri ekledi. Sonunda tabloda 5-6 çakışan policy birikti; bir kısmı profiles'ı sorgulayan fonksiyonlar çağırıyordu. PostgreSQL her SELECT'te döngüye girip HTTP 500 döndürmeye başladı.

---

## Kural 1 — DROP POLICY isimlere güvenme

```sql
DROP POLICY IF EXISTS "Kullanıcı kendi profilini görebilir" ON public.profiles;
```

Orijinal policy adı `"Herkes kendi profilini görebilir"` iken IF NOT EXISTS sessizce geçti. Eski policy silindi sanıldı, aslında hâlâ ayakta.

**Doğru yaklaşım:** Migration öncesi mevcut policy'leri listele:
```sql
SELECT policyname FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';
```

---

## Kural 2 — profiles policy'si profiles sorgulayamaz

```sql
-- ❌ YANLIŞ — sonsuz döngü
CREATE POLICY "Adminler görebilir" ON public.profiles
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ❌ YANLIŞ — SECURITY DEFINER Supabase'de RLS'i bypass etmiyor
CREATE OR REPLACE FUNCTION get_my_role() RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- ✅ DOĞRU — JWT'den oku, DB sorgusu yok, döngü imkansız
CREATE POLICY "SuperAdmin görebilir" ON public.profiles
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');
```

---

## Kural 3 — SECURITY DEFINER Supabase'de RLS'i bypass etmiyor

PostgreSQL belgelerinde SECURITY DEFINER fonksiyonların RLS'i bypass ettiği yazıyor — **Supabase'de bu geçerli değil.** Fonksiyon sahibi `postgres` olsa bile RLS uygulanmaya devam ediyor.

Tek güvenli RLS-dışı okuma yöntemi: `auth.jwt()` built-in fonksiyonu.

---

## Kural 4 — auth.jwt() gerektirir: rol JWT'de olmalı

`auth.jwt() -> 'app_metadata' ->> 'role'` çalışması için:
1. `auth.users.raw_app_meta_data`'ya rol yazılmış olmalı
2. Kullanıcı çıkış yapıp tekrar giriş yapmış olmalı (JWT yenilenir)

Rol sync SQL'i:
```sql
UPDATE auth.users u
SET raw_app_meta_data =
  COALESCE(u.raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE p.id = u.id AND p.role IS NOT NULL;
```

---

## Kural 5 — Birikmiş policy sorunu için nükleer sıfırlama

```sql
-- Tablodaki TÜM policy'leri sil
DO $$
DECLARE pol text;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol);
  END LOOP;
END $$;

-- Sonra minimal, temiz policy'lerle yeniden başla
```

---

## Sonuç: profiles için doğru minimal RLS şablonu

```sql
-- Kendi profilini gör
CREATE POLICY "Kendi profilini gör"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Kendi profilini güncelle
CREATE POLICY "Kendi profilini güncelle"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- SuperAdmin her şeyi yönetir (JWT tabanlı — döngüsüz)
CREATE POLICY "SuperAdmin tüm profilleri yönetir"
  ON public.profiles FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');
```

---

## Kural 6 — FORCE ROW LEVEL SECURITY anon rolünü kırar

```sql
ALTER TABLE public.companies FORCE ROW LEVEL SECURITY;
```

Bu komut tablo sahibini (postgres) da dahil olmak üzere herkese RLS uygular. Eğer tüm policy'ler `TO authenticated` yazılmışsa, `anon` rolü (oturum açılmamış kullanıcı) hiçbir satır göremez.

**Örnek kırılma:** Login sayfası, kullanıcı henüz giriş yapmadan companies tablosunu sorgular (şirket dropdown'u için). FORCE RLS + yalnızca authenticated policy → "Kayıtlı şirket bulunamadı."

**Çözüm:** Pre-auth gerektiren tablolarda `TO anon` policy de ekle:

```sql
CREATE POLICY "Herkes aktif şirketleri görebilir"
  ON public.companies FOR SELECT TO anon
  USING (status IN ('active', 'demo'));
```

**Kontrol sorusu:** "Bu tabloyu oturum açılmadan önce de sorgulayan bir sayfa var mı?" → Varsa anon policy şart.

---

## HTTP Durum Kodları — RLS Hataları

| Kod | Anlam |
|-----|-------|
| 200 + boş dizi | RLS row'u gizledi (beklenen davranış) |
| 403 | Explicit yetki reddi |
| **500** | **Fonksiyon hatası veya sonsuz döngü — RLS policy'lerini kontrol et** |
