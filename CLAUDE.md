# CLAUDE.md
> Enba Similasyon — Claude Code için proje hafızası + wiki bakım şeması.
> Her oturumda otomatik yüklenir.

---

## ⚡ Oturum Protokolü (HER OTURUMDA UYGULA)

### Oturum Başında (önce bunları yap)
1. `Enba_Obsidian_Vault/Memory/MEMORY.md` oku → kalıcı hafızayı yükle, ilgili memory dosyalarını oku
2. `Enba_Obsidian_Vault/index.md` oku → konuyla ilgili sayfaları belirle
3. İlgili wiki sayfalarını oku (Kararlar/, Moduller/, Snippets/)
4. `Enba_Obsidian_Vault/log.md` son 3 girişe bak → bağlamı kur
5. `Aktif Görevler` bölümünü kontrol et

### Anlık Log — Her Önemli Adımdan Sonra Otomatik

Kullanıcı onayı bekleme. Şu durumlarda `log.md`'ye hemen giriş ekle ve ilgili wiki sayfasını güncelle:
- Yeni özellik tamamlandı
- Bug düzeltildi
- Mimari karar alındı
- Yeni modül eklendi veya güncellendi
- SQL şeması değişti

```
## [YYYY-MM-DD HH:MM] geliştirme | kısa özet
- Yapılan: ...
- Etkilenen dosyalar: ...
- Bir sonraki: ...
```

### Oturum Sonunda — "oturumu kapat" komutu geldiğinde

1. Oturumun genel özetini `log.md`'ye ekle
2. `CLAUDE.md` → `Aktif Görevler` bölümünü güncelle
3. `index.md`'yi güncelle (yeni sayfa eklendiyse)
4. Kullanıcıya söyle:
   > "Oturum kaydedildi. Obsidian Git otomatik push edecek. Hemen göndermek istersen Ctrl+P → Git: Commit → Git: Push."

---

---

## 📥 Ingest Protokolü — Yeni Kaynak Eklendiğinde

Kullanıcı yeni bir kaynak getirdiğinde (toplantı notu, müşteri geri bildirimi, makale, kod parçası, SQL değişikliği, ekran görüntüsü) şu adımları sırayla uygula. Kullanıcı onayı bekleme — direkt başla.

### Adım 1: Kaynağı Oku ve Özetle
- Kaynağı baştan sona oku
- Şu soruları cevapla: Ne söylüyor? Projemizle nasıl ilgili? Hangi modülleri/kararları etkiliyor?
- `Ham-Kaynaklar/` klasörüne özet sayfası oluştur:
  ```
  # [Kaynak Başlığı]
  Tip: [toplantı notu / makale / geri bildirim / SQL / kod]
  Tarih: YYYY-MM-DD
  Ekleyen: Başar
  
  ## Özet
  [3-5 cümle]
  
  ## Projemize Etkisi
  [hangi modüller, kararlar, tablolar etkileniyor]
  
  ## İlgili Wiki Sayfaları
  [[...]], [[...]]
  ```

### Adım 2: Etkilenen Wiki Sayfalarını Güncelle
- `index.md`'yi oku → etkilenen sayfaları belirle
- Her etkilenen sayfaya git ve güncelle:
  - Yeni bilgiyi ilgili bölüme ekle
  - Çelişki varsa `~~eski bilgi~~` ile üstünü çiz, yeni bilgiyi yaz
  - Çelişki varsa `index.md` Çelişki Takibi'ne ekle
- Tek bir kaynak 5-15 sayfayı etkileyebilir — hepsini güncelle

### Adım 3: Gerekiyorsa Yeni Sayfa Aç
Kaynakta wikide sayfası olmayan ama önemli bir kavram/modül/karar varsa:
- `Wiki/YeniKonu.md` veya `Moduller/YeniModul.md` oluştur
- `index.md`'ye ekle
- İlgili mevcut sayfalardan bu yeni sayfaya link ver

### Adım 4: index.md ve log.md Güncelle
- `index.md` → Ham Kaynaklar tablosuna yeni satır ekle
- `log.md` → ingest girişi ekle:
  ```
  ## [YYYY-MM-DD HH:MM] ingest | Kaynak Adı
  - Kaynak: [tip ve başlık]
  - Güncellenen sayfalar: [liste]
  - Yeni sayfalar: [liste veya "yok"]
  - Önemli çıkarım: [1 cümle]
  ```

### Adım 5: Kullanıcıya Özet Sun
İngest tamamlanınca şunu söyle:
- Kaynaktan ne öğrenildi (1-2 cümle)
- Kaç sayfa güncellendi
- Varsa çelişki veya dikkat edilmesi gereken şey
- Önerilen sonraki adım

---

## 🔍 Sorgu Protokolü — Soru Sorulduğunda

Kullanıcı wikideki bilgiyle ilgili soru sorduğunda:

1. `index.md`'yi oku → ilgili sayfaları belirle
2. İlgili sayfaları oku
3. Cevabı sentezle ve kaynak sayfaları belirt
4. Cevap değerliyse (karşılaştırma, analiz, keşif) → `Wiki/` altına yeni sayfa olarak kaydet
5. `log.md`'ye sorgu girişi ekle:
   ```
   ## [YYYY-MM-DD HH:MM] sorgu | Soru özeti
   - Soru: ...
   - Cevap kaydedildi mi: evet/hayır
   ```

---

## 🧹 Lint Protokolü — "wiki lint" komutu geldiğinde

1. Tüm wiki sayfalarını tara
2. Şunları tespit et ve `index.md` Çelişki/Orphan bölümlerine raporla:
   - Orphan sayfalar (hiçbir sayfadan link almayan)
   - Çelişkili bilgiler
   - Stale (eski) bilgiler
   - Sayfası olmayan ama sık geçen kavramlar
   - Eksik cross-reference'lar
3. `log.md`'ye lint girişi ekle
4. Kullanıcıya öneri listesi sun: hangi kaynaklar eklenmeli, hangi sorular sorulmalı

## Wiki Bakım Kuralları

### Yeni sayfa oluşturma
- **Modül sayfası:** `Moduller/ModulAdi.md`
- **Karar sayfası:** `Kararlar/YYYY-MM-Konu.md`
- **Sentez/araştırma:** `Wiki/Konu.md`
- **Snippet:** `Snippets/Konu.md`
- Her yeni sayfayı `index.md`'ye ekle

### Sayfa güncelleme
- Mevcut sayfayı sil/yeniden yaz değil → ilgili bölümü güncelle
- Çelişki tespit edilirse → `index.md` Çelişki Takibi bölümüne ekle
- Eski bilgiyi silme — üstüne `~~eski bilgi~~` ile çiz, yeni bilgiyi yaz

### Lint (haftada bir önerilen)
Şunları kontrol et ve `index.md`'ye raporla:
- Orphan sayfalar (hiçbir yerden link almayan)
- Çelişkili bilgiler (iki sayfa aynı konuda farklı şey söylüyor)
- Güncellenmesi gereken stale bilgiler
- Sayfası olmayan ama sık geçen kavramlar

---

## Hızlı Komutlar

```bash
npm run dev        # Vite dev server (port 5173)
npm run build      # tsc + vite build
npm run lint       # ESLint --max-warnings 0
npm run preview    # Production önizleme
```

Test suite yok. `tsc` birincil doğruluk kontrolü.

---

## Proje Kimliği

**Enba Similasyon** — Geri dönüşüm ve üretim sektörü için Türkçe çok kiracılı ERP platformu.
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase
**Canlı URL:** https://uygulama.basarunal.com
**Deployment:** Vercel (SPA, tüm rotalar `index.html`)
**Demo:** `demo@enba.com` (super_admin, super_admin paneli hariç tümü)

---

## Mimari — Kritik Kararlar

### Navigasyon (React Router YOK)
Custom history stack — tüm navigasyon `App.tsx`'te:
- `activeModule` → hangi modül render edilir
- `navigate(moduleId)` → her modüle prop olarak geçilir
- `history: ModuleType[]` + `historyIndex` → geri/ileri simüle eder
- `sessionStorage` → sayfa yenilenmesinde aktif modülü korur
- **URL hiç değişmez** — embed/iframe uyumluluğu için

### State (Redux/Zustand YOK)
1. **Supabase** → auth, profiles, tasks, assets, permits, plans, HR, arşiv, stok, satış, üretim, lojistik, nakit akışı
2. **localStorage** → FastPlan/DetailedPlan önbellek (Supabase'e sync edilir), OAuth tokenlar, tema, dil
3. **useState** → modül bazlı geçici durum

> ⚠️ localStorage key'leri değiştirme: `enba_fast_plans_v2`, `enba_detailed_plans`, `enba_language`, `enba_theme`

### Modüller (21 adet)
`src/modules/` — bağımsız React component. Props: `navigate`, `profile`, `user`, `onBack?`

**Core (her zaman görünür):** `dashboard`, `profile`, `tasks`, `calendar`, `modules`, `mail`, `fixedexpenses`
**İzinli:** diğerleri → `profile.permissions[moduleId]`

---

## Auth & Multi-Tenancy

Supabase email/şifre. `profiles` satırı:
- `company_id` → tenant (legacy: `user_id`'ye fallback)
- `role` → `'super_admin' | 'admin' | 'user'`
- `permissions` → modül bazlı boolean RBAC

---

## API Katmanı (`src/api/`)

| Dosya | Görev |
|-------|-------|
| `supabase.ts` | Client + servis nesneleri, 10s profil cache |
| `microsoft.ts` | MSAL OAuth → Outlook, Calendar, Tasks |
| `google.ts` | Implicit OAuth → Google Calendar, Tasks, Gmail |
| `parasut.ts` | Paraşüt → `/parasut-oauth` + `/parasut-api` proxy |
| `translations.ts` | TR/EN string tablosu (~59KB) |
| `dataService.ts` | localStorage helpers |

---

## Entegrasyonlar

Login'de `resumeSession(profile)` → tokenları restore eder.

| Servis | Kütüphane | Token | Oto Yenileme |
|--------|-----------|-------|--------------|
| Microsoft | `@azure/msal-browser` + Graph | localStorage | ✅ |
| Google | Implicit OAuth | localStorage | ❌ YOK |
| Paraşüt | Custom proxy | In-memory + localStorage | Var |

---

## i18n

`I18nProvider` (Context) → `useTranslation()` hook → `localStorage['enba_language']`
Tüm stringler: `src/api/translations.ts`

---

## Stil

- Tailwind: `enba-orange` (#E35205), `enba-dark` (#1A1A1A)
- Tema: `<html>` CSS variables → `localStorage['enba_theme']`
- Font: Poppins
- Path alias: `@/` → `src/`

---

## Environment Variables

```
VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
VITE_MICROSOFT_CLIENT_ID / VITE_MICROSOFT_TENANT_ID
VITE_GOOGLE_CLIENT_ID
VITE_PARASUT_CLIENT_ID / VITE_PARASUT_CLIENT_SECRET
```

---

## ⚠️ Veri Güvenliği — KRİTİK KURAL (2026-05-06'dan itibaren)

Uygulama artık gerçek veri girişi aşamasına geçti. **Bundan sonra hiçbir geliştirme mevcut veriyi kaybettiremez.**

Her yeni özellik veya migration öncesinde şunları kontrol et:
- localStorage'daki mevcut kayıtlar silinmiyor mu? (key rename, format değişikliği)
- Supabase tablosunda mevcut satırlar etkileniyor mu? (DROP, truncate, ALTER tip değişikliği)
- Migration geri alınabilir mi? Önce `SELECT` ile test et, sonra `UPDATE/DELETE` uygula
- Supabase'de destructive işlem öncesi tablo export al (Table Editor → Download CSV)

Veri kaybı riski olan her adımı kullanıcıya açıkça belirt ve onay al.

---

## Bilinen Sorunlar

- Google OAuth → token yenileme yok, kullanıcı logout olabilir
- localStorage key değişirse eski kullanıcı verisi kaybolur
- React Router yok → deep link paylaşımı yok (tasarım gereği)
- ESLint sıfır tolerans → her commit öncesi `npm run lint`
- Supabase cache 10s → test sırasında stale data olabilir

---

## Aktif Görevler
> Her oturum başında güncelle

### Tamamlanan Migrationlar
- [x] migration_v12 (companies RLS)
- [x] migration_v13 (anon policy fix)
- [x] migration_v20 (arsiv Storage bucket)
- [x] migration_v21 (tasks constraint + cashflow kolonları)
- [x] migration_v22 (profiles kişisel bilgi kolonları)
- [x] migration_v23 (personnel_payments + personnel_debts RLS)
- [x] migration_v24 + v24b (business_plans RLS, JWT tabanlı politikalar)

### Tamamlanan Altyapı İyileştirmeleri (2026-05-08)
- [x] usePlanSync toplu upsert/insert (commit e58b135)
- [x] React.lazy 22 modül + Suspense (commit e353e67)
- [x] PnL html2pdf dynamic import (commit ec9a095)
- [x] useSupabaseQuery hook + Licensing/Archive/HR refactor (commitler 62bebe2, 38ade78)
- [x] profileAPI cache invalidation fix (commit a5bcb0a)
- [x] React ErrorBoundary (commit 4003d97)
- [x] Calendar → Supabase tasks (commit 933b668)
- [x] console.log temizliği (commit 903934a)
- [x] TypeScript any azaltma: usePlanSync + dataService (commit 200a123)

### Kullanıcı Öncelik Sırası
1. **FastPlan iyileştirmeleri** — başabaş, geri ödeme, duyarlılık, versiyon notları, gider grafiği, PDF
2. **DetailedPlan iyileştirmeleri**
3. **Paraşüt tamamlama** — Enba stok ↔ Paraşüt item eşleştirmesi, yazma uç noktaları
4. **PnL analizi güçlendirme**
5. **Yapay zeka asistanı** — siteye entegre AI chat

### Bekleyen Teknik Görevler
- [ ] **Admin test hesabı** — Supabase'de `role='admin'` + geçerli `company_id` → şirket izolasyonunu doğrula
- [ ] **Paraşüt tamamlama** — stok eşleştirmesi, kalan uç noktalar
- [ ] **E-fatura** — ertelendi (müşteri talebi olursa)
- [ ] **Bordro/muhasebe** — ertelendi (müşteri talebi olursa)

### Bir Sonraki Oturumda İlk Yapılacak
**FastPlan hesaplama iyileştirmeleri** — `hesapla()` fonksiyonuna ekle + form sağ panel'e göster:
1. **Başabaş noktası** — sabit giderler ÷ (satış fiyatı/ton - değişken maliyet/ton) = başabaş ton/ay
2. **Geri ödeme süresi** — toplam CAPEX ÷ aylık net kâr = kaç ay
3. **Duyarlılık tablosu** — alış/satış fiyatı ±%10, ±%20 → net kâr senaryoları
4. **Versiyon notları** — PlanVersion'a `not?: string` ekle, SaveModal'da not giriş alanı
5. **Gider dağılım bar chart** — CSS tabanlı, harici kütüphane yok
6. **PDF çıktısı** — html2pdf ile plan özeti A4 çıktısı

---

## Yeni Modül Kontrol Listesi

1. `src/modules/YeniModul.tsx` oluştur
2. `App.tsx` → `ModuleType`'a ekle
3. Supabase `profiles` → `permissions.yeniModul` ekle
4. `translations.ts` → TR/EN ekle
5. Modules sayfasına kart ekle
6. Permission check ekle (core değilse)
7. `Moduller/YeniModul.md` wiki sayfası oluştur
8. `index.md`'yi güncelle
