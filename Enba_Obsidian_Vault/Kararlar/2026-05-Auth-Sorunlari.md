# Auth & Yetkilendirme Sorunları — Planlama Notu
> Oluşturulma: 2026-05-05 | Durum: Bir sonraki oturumda çözülecek

---

## Bu Oturumda Tespit Edilen Sorunlar

### 1. UPDATE SQL rolü yanlışlıkla düşürdü
**Olay:** `role = 'super_admin'` olan basar.unal için "tüm yetkiler ver" SQL'i çalıştırıldı. SQL `role = 'admin'` yazdı, `super_admin` → `admin`'e düştü. Sistem Yönetimi menüsü kayboldu, kullanıcı "kısıtlı" algıladı.  
**Kök neden:** Admin işlemleri için safe SQL şablonu yok; role her UPDATE'te elle belirtilmeli.  
**Geçici düzeltme:** El ile `role = 'super_admin'` geri verildi.

### 2. `is_admin()` fonksiyonu `super_admin`'i tanımıyordu
**Olay:** Orijinal `is_admin()` sadece `role = 'admin'` kontrol ediyordu. `super_admin` rolü RLS'te admin sayılmıyordu.  
**Durum:** Migration_v3'te `IN ('admin', 'super_admin')` ile düzeltildi. ✓

### 3. RLS `attendance`, `personnel_payments`, `personnel_debts`'te sadece `company_id` bakıyor
**Olay:** Bu tablolarda `user_id` fallback yok. `company_id`'si olmayan kullanıcılar veri okuyamaz/yazamaz.  
**Durum:** Henüz düzeltilmedi.

### 4. `DataService.insertData()` `company_id` set etmiyor
**Olay:** HR, Stock, Logistics modülleri `DataService` kullanıyor. `DataService` sadece `user_id` ekliyor, `company_id` yok. Multi-tenant izolasyon kırık.  
**Etkilenen modüller:** HR (`personnel`, `attendance`), Logistics (`logistics_records`), Stock (kısmen — `stock_records`/`sales_records` user_id fallback ile RLS'i geçiyor ama izolasyon yok).  
**Durum:** Henüz düzeltilmedi.

### 5. `userProfile` null kalırsa menü kısıtlanıyor
**Olay:** `profileAPI.getMyProfile()` hata dönerse `userProfile = null` kalıyor. Menu `!userProfile` kontrolünde sadece 7 core modülü gösteriyor. Kullanıcı "kısıtlı" görüyor ama aslında profile yüklenemedi.  
**Kök neden:** Sessiz hata — kullanıcıya hiçbir hata mesajı yok.  
**Durum:** Henüz düzeltilmedi.

### 6. Admin kullanıcı yönetimi için safe SQL şablonu yok
**Olay:** Kullanıcı rolü/izin değişikliklerini elle SQL ile yapıyoruz. Hata marjı yüksek.  
**İdeal çözüm:** SuperAdmin paneline kullanıcı rol/izin yönetimi UI'ı.  
**Durum:** SuperAdmin paneli var ama rol değiştirme özelliği eksik.

---

## Bir Sonraki Oturum Planı

### Öncelik 1 — RLS Düzeltmeleri (30 dk)
```sql
-- attendance, personnel_payments, personnel_debts tablolarına
-- user_id sütunu ekle + RLS'e OR user_id = auth.uid() fallback ekle
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.personnel_payments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.personnel_debts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- RLS politikalarını güncelle: company_id OR user_id
```

### Öncelik 2 — DataService'e company_id desteği (20 dk)
`src/api/dataService.ts` → `insertData()` fonksiyonuna:
```typescript
const profile = await profileAPI.getMyProfile();
if (profile?.company_id) p.company_id = profile.company_id;
```
Bu tek değişiklik HR, Stock, Logistics yazmalarını tenant-safe yapar.

### Öncelik 3 — Profile yüklenemezse kullanıcıya bildir (15 dk)
`src/App.tsx` → `!userProfile` durumunda sessiz kalmak yerine:
- Header'da "Profil yüklenemedi, yenileyin" uyarısı
- Veya otomatik retry (3x)

### Öncelik 4 — SuperAdmin paneline rol yönetimi (45 dk)
`src/modules/SuperAdmin.tsx`:
- Kullanıcı listesinde rol değiştirme dropdown'u
- İzin toggle'ları (her modül için checkbox)
- Kaydet butonu → `profileAPI.adminUpdateProfile(id, { role, permissions })`

---

## Güvenlik Notları
- SQL UPDATE'lerde `WHERE id = 'uuid'` kullan, ILIKE ile isim araması yapma
- Role değiştirirken mevcut rolü önce SELECT ile oku
- `super_admin` rolü hiçbir zaman permissions JSON'una bağlı olmamalı — kod bunu doğru yapıyor (role kontrolü permissions'dan önce geliyor) ✓
