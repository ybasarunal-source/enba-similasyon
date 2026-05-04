# SQL Şema Analizi — Mevcut Durum & Eksikler
> Oluşturulma: 2026-05-05 | Kaynak: `supabase.ts`, `dataService.ts`, `migration_v2.sql`, 8 modül incelemesi

---

## Mevcut Tablo Envanteri

### Supabase'de OLMASI GEREKEN tablolar (kod biliyor, SQL mevcut mu?)

| Tablo | supabase.ts | migration_v2.sql | Durum |
|-------|-------------|------------------|-------|
| `profiles` | ✅ | ✅ (supabase/schema.sql) | Eksik sütunlar var |
| `companies` | ✅ | ❌ | **YOK** |
| `fixed_expenses` | ✅ | ❌ | **YOK** |
| `project_groups` | ✅ | ❌ | **YOK** |
| `projects` | ✅ | ❌ | **YOK** |
| `tasks` | ✅ | ❌ | **YOK** |
| `pnl_reports` | ✅ | ❌ | **YOK** |
| `assets` | ✅ | ❌ | **YOK** |
| `maintenance_records` | ✅ | ❌ | **YOK** |
| `permits` | ✅ (`permits`) | ✅ (`permit_records`) | **İSİM UYUŞMAZLIĞI** |
| `business_plans` | ✅ (dataService) | ✅ | Eksik: `company_id` |
| `stock_records` | ✅ (dataService) | ✅ | **SÜTUN UYUŞMAZLIĞI** |
| `sales_records` | ✅ (dataService) | ✅ | OK |
| `contacts` | ✅ (dataService) | ✅ | Eksik: `notlar` |
| `personnel` | HR modülü | ✅ | Eksik: `company_id` |
| `attendance` | HR modülü | ✅ | Eksik: `company_id` |
| `personnel_payments` | HR modülü | ✅ | Eksik: `company_id` |
| `personnel_debts` | HR modülü | ✅ | Eksik: `company_id` |
| `production_records` | Production modülü | ✅ | Eksik: `company_id` |
| `production_plans` | Production modülü | ✅ | Eksik: `company_id` |
| `logistics_records` | Logistics modülü | ✅ | Eksik: `company_id` |
| `arsiv_files` | Archive modülü | ✅ | Eksik: `company_id` |
| `cashflow_parameters` | Cashflow modülü | ✅ | Eksik: `company_id` |
| `app_settings` | - | ✅ | OK |

---

## KRİTİK EKSİKLER (Öncelik Sırasıyla)

### 1. KIRMIZI — Uygulama çalışmıyor / veri kaybolabilir

#### 1a. `companies` tablosu yok
Kod `companiesAPI` ile bu tabloya yazıyor/okuyor ama SQL'de hiç yok.  
SuperAdmin paneli bu tabloyu yönetiyor.
```sql
CREATE TABLE public.companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active','suspended','demo')),
  created_at timestamptz DEFAULT now()
);
```

#### 1b. 8 tablo SQL'de yok
`fixed_expenses`, `project_groups`, `projects`, `tasks`, `pnl_reports`, `assets`, `maintenance_records` — SQL yoksa Supabase'de yoktur, tüm CRUD silent hata verir.

#### 1c. `permits` vs `permit_records` isim çakışması
`supabase.ts` → `permits` tablosunu sorgular  
`migration_v2.sql` → `permit_records` tablosunu oluşturur  
Sonuç: Licensing modülü çalışmıyor, hiç veri okunamaz.

#### 1d. `stock_records` sütun uyuşmazlığı
`dataService.ts` şu sütunları bekler:
`tarih, tedarikci_adi, hammadde_turu, brut_miktar, net_miktar, alis_fiyati, nakliye_bedeli, ym_fire, nem_fire, birim_maliyet, notlar`

`schema.sql` / `migration_v2.sql` şunları tanımlar:
`type, material_type, amount, unit_price, total_price, supplier_customer, waybill_no, vehicle_plate`

Sütun isimleri tamamen farklı. Alış kayıtları yazılamıyor.

---

### 2. TURUNCU — Multi-tenancy çöküyor

#### `company_id` eksik (neredeyse her tabloda)
Kod şu pattern ile çalışıyor:
```typescript
if (profile?.company_id) {
  query.eq('company_id', profile.company_id);
} else {
  query.eq('user_id', user.id);  // legacy fallback
}
```
Ama tablolarda `company_id` sütunu yok. Sonuç: tüm kullanıcılar birbirinin verisini görebilir.

Etkilenen tablolar: `fixed_expenses`, `project_groups`, `projects`, `tasks`, `pnl_reports`, `assets`, `maintenance_records`, `permits`, `stock_records`, `sales_records`, `contacts`, `business_plans`, `personnel`, `attendance`, `personnel_payments`, `personnel_debts`, `production_records`, `production_plans`, `logistics_records`, `arsiv_files`, `cashflow_parameters`

---

### 3. SARI — `profiles` eksik sütunlar

Kod şu alanları kullanıyor ama SQL'de yok:
```
company_id       -- tenant bağlantısı (KRİTİK)
ms_account_id    -- Microsoft entegrasyonu
ms_account_username
microsoft_data   -- JSONB
google_data      -- JSONB  
parasut_data     -- JSONB
```

---

### 4. MAVİ — Kalite / Best Practice

#### RLS politikaları eski pattern kullanıyor
`auth.role() = 'authenticated'` → deprecated  
Doğrusu: `(select auth.uid()) IS NOT NULL`

#### `is_admin()` fonksiyonu `super_admin` rolünü tanımıyor
TypeScript'te 3 rol var: `'super_admin' | 'admin' | 'user'`  
SQL fonksiyonu sadece `role = 'admin'` kontrol ediyor.

#### FastPlan verisi hala localStorage'da
`enba_fast_plans_v2` → tamamen localStorage. `business_plans` tablosuna taşınmalı.

#### `contacts` tablosunda `notlar` kolonu yok
Stock modülü contact için notlar alanı kullanıyor.

---

## Düzeltme Planı (3 Aşama)

### Aşama 1 — Temel (Bu hafta)
1. `companies` tablosunu oluştur
2. `profiles`'a eksik sütunları ekle (`company_id`, oauth data)
3. `permits` → `permit_records` ismini `permits` olarak düzelt (ya kod ya SQL değişmeli)
4. `stock_records` sütunlarını `dataService.ts`'e göre yeniden yaz

### Aşama 2 — Eksik Tablolar
5. `fixed_expenses` tablosunu oluştur
6. `project_groups`, `projects`, `tasks` tablolarını oluştur
7. `pnl_reports` tablosunu oluştur
8. `assets`, `maintenance_records` tablolarını oluştur

### Aşama 3 — Multi-Tenancy & Güvenlik
9. Tüm tablolara `company_id` sütunu ekle
10. RLS politikalarını company_id'ye göre yeniden yaz
11. `is_admin()` → `is_admin_or_super_admin()` olarak güncelle
12. `auth.role() = 'authenticated'` → modern pattern'e geç

---

## Referans: Kod Kaynaklı Tablo Şemaları

Aşağıdaki şemalar `supabase.ts`'teki TypeScript interface'lerinden türetilmiştir — SQL'de henüz yoklar.

### `fixed_expenses`
```
id uuid PK, company_id uuid, user_id uuid,
title text, amount numeric, category text,
due_date int, is_auto_pay bool,
parasut_match_keyword text, history jsonb,
created_at timestamptz
```

### `tasks`
```
id uuid PK, company_id uuid, user_id uuid,
title text, description text, priority text,
deadline text, project_id uuid, module_ref text,
status text, source text,
ms_todo_id text, ms_list_id text,
g_task_id text, g_list_id text,
is_pinned bool, created_at timestamptz
```

### `assets`
```
id uuid PK, company_id uuid, user_id uuid,
adi text, marka text, motor_gucu numeric,
yatirim_bedeli numeric, satinalma_tarihi date,
kategori text, kapasite numeric, boyut text,
tur text, created_at timestamptz
```

### `pnl_reports`
```
id uuid PK, company_id uuid, user_id uuid,
name text, date date, payload jsonb,
created_at timestamptz
```
