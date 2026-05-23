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

### Modüller (23 adet)
`src/modules/` — bağımsız React component. Props: `navigate`, `profile`, `user`, `onBack?`

**Core (her zaman görünür):** `dashboard`, `profile`, `tasks`, `calendar`, `modules`, `mail`, `fixedexpenses`
**İzinli:** diğerleri → `profile.permissions[moduleId]`
**Yeni (2026-05-14):** `ayarlar` (Finansal Kategoriler), `varlik` (Varlık Takibi)

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

### Tamamlanan UI/UX İyileştirmeleri (2026-05-12)
- [x] Notes AI analiz — Edge Function (hyper-service) CORS+auth+secret+JSON parse zinciri düzeltildi
- [x] Notes — hover'da silme butonu, applyLoading duplicate koruması, crypto.randomUUID
- [x] Pomodoro — App.tsx global floating widget, localStorage persistence (enba_pomodoro_active)
- [x] Tasks — çoklu seçim (bulk delete + bulk move), panel defaults (sol slim, sağ open), sağ panel 2-state
- [x] Kanban — Flexbox eşit kolonlar, richer task cards
- [x] ModulesOverview — tek satır kompakt header
- [x] Mail — provider onboarding ekranı (Microsoft / Google bağlantı kartları) (commit 7d0d237)

### Tamamlanan (2026-05-13)
- [x] FastPlan dosya bölme — `fastplan/` altında 5 dosya, ana dosya 1581→1231 satır (commit e8669f7)
- [x] FastPlan PDF export — form header'ında "PDF" butonu, html2pdf.js dynamic import (commit a50aab0)
- [x] FastPlan iyileştirmeleri — başabaş, geri ödeme, duyarlılık, gider bar chart, versiyon notları (önceki oturumda tamamlanmıştı)
- [x] Mail Gmail fix — google.resumeSession + Tasks.tsx token silme bug düzeltildi (commitler bc5ba3b, 4912064)
- [x] Mail hata göstergesi — Gmail API 403/401 görünür hata mesajı (commit ea2ac63)
- [x] PnL kaydet fix — UUID mismatch + Supabase query chaining (commit a125eed)

### Tamamlanan (2026-05-14)
- [x] **Finansal Ayarlar modülü** (`ayarlar`) — financial_categories Supabase tablosu, M-kodu hiyerarşi yönetimi, seed/özel kategori (commit 2531ddc)
- [x] **Varlık Takibi modülü** (`varlik`) — sabit varlıklar + depozitolar, TL/EUR çift görünüm, M/K/V filtre, amortisman hesabı (commit 7926f57)

### Tamamlanan (2026-05-18 – 2026-05-19)
- [x] **DetailedPlan design handoff** — 9 dosya: dpData.ts, DPPrimitives, 6 panel, DetailedPlanShell (commit 33f43d7)
- [x] **DetailedPlan sidebar daralt/genişlet** — chevron toggle, w-12 icon-only modu (commit f8b1686)
- [x] **FastPlan reskin** — DetailedPlan design language'a uyumlu: enba token'ları, rounded-xl, font-semibold (commit 18d73b8)
- [x] **Mimari karar notları** — DetailedPlan veri girişi + Paraşüt token Supabase migrasyonu wiki'ye eklendi

### Kullanıcı Öncelik Sırası
1. **DetailedPlan → gerçek veri** — plan oluşturma listesi + Supabase bağlantısı (mimari karar notu hazır)
2. **Paraşüt token → Supabase** — parasut_tokens tablosu + company izolasyonu (migration notu hazır)
3. **Paraşüt → financial_categories** — eşleştirme modalı mcodeList.ts yerine Supabase tablosundan
4. **PnL analizi güçlendirme** — operasyon (M=Merkez / K=Kömürcüler / V=Varsak) bazlı ayrıştırma
5. **Yapay zeka asistanı** — siteye entegre AI chat

### Bekleyen Teknik Görevler
- [x] **Admin test hesabı** — doğrulandı (2026-05-18)
- [x] **Kök dizin .jsx temizliği** — 26 dosya silindi (commit 9571b0d)
- [x] **DetailedPlan veri girişi** — wizard tamamlandı (Gider Merkezleri, Tedarikçi/Müşteri Havuzu, Projeler × 6 sekme). Test: 2026-05-21.
- [x] **Paraşüt token migrasyonu** — migration_v25 + v25b tamamlandı; token Supabase'e yazılıyor, super_admin şirket seçici mevcut (commit cd82733)
- [ ] **Paraşüt → financial_categories** — eşleştirme modalı Supabase tablosundan çeksin
- [ ] **E-fatura** — ertelendi
- [ ] **Bordro/muhasebe** — ertelendi

### Tamamlanan (2026-05-21)
- [x] **Haftalık granülarite** — WeeklyRamp, buildDisplayPeriods, Shell 4-button toggle (Haftalık/Aylık/Çeyreklik/Yıllık) (commit 9dcb5be)
- [x] **Takvim tatil desteği** — Nager.Date API + custom_holidays Supabase tablosu, migration_v26 çalıştırıldı (commitler d762cb7–53eca3e)
- [x] **Wizard Projeyi Kaydet fix** — proje adı header'a taşındı (commit d1135a1)
- [x] **Deren Easter egg** — "deren" klavye sırası → kalp animasyonu
- [x] **McodeCombobox** — portal + arama, TR açıklamalı
- [x] **Tedarikçi/Müşteri** — nakliye (₺/kg) + kısmi peşin/vade

### Tamamlanan (2026-05-23)
- [x] **DetailedPlan durum yönetimi** — 4 durum (draft/pending/active/archived), filtre sekmeler, PlanCard hızlı geçiş
- [x] **Granül Üretimi iş planı ingest** — `is_plani_konusma.md` wiki'ye eklendi (Ham-Kaynaklar + Kararlar)
- [x] **DetailedPlan panel hesapları** — 5 kritik düzeltme (commit önceki oturum)
- [x] **Modül reskin Faz 1** — global CSS katmanı (commit önceki oturum)
- [x] **DetailedPlan navigasyon fix** — App ← tuşu plan listesine döner (commit fa057d7)
- [x] **ProductionModel + rule engine + 4-step wizard** — proses tabanlı wizard yeniden yazımı (commit 6910193)

### DetailedPlan — Açık Konular
- [x] ~~**Panel hesapları doğrulanacak**~~ → ✅ Çözüldü (2026-05-23)
- [x] ~~**startOffset/endOffset**~~ → ✅ Çözüldü (2026-05-23)
- [x] ~~**CashFlow periods uyumsuzluğu**~~ → ✅ Çözüldü (2026-05-23)
- [ ] **CostCenter allocationWeight** — aynı tesise bağlı çoklu proje paylaşımı doğru mu?
- [ ] **BudgetTrack + aktüel veri girişi** — panel şu an boş; aktüel giriş formu eklenecek
- [ ] **CashFlow cashEvents girişi** — yatırım/finansman nakit olayları wizard'da düzenlenemiyor
- [ ] **PDF export** — shell'de buton var, işlevsiz
- [ ] **Yeni wizard tarayıcı testi** — granül üretimi parametrelerini gir, panel hesaplarını doğrula
- Detay: `Moduller/DetailedPlan.md` → Açık Konular bölümü

### ⚠️ Piyasaya Çıkmadan Önce — Güvenlik (Tenant İzolasyonu)
- [ ] **Şirket listesi gizliliği** — Paraşüt super_admin dropdown'ı şu an tüm şirket adlarını gösteriyor; kullanıcı sayısı artınca tenantlar birbirini görmemeli. Çözüm: şirket adı yerine şirket kodu (slug) göster, veya dropdown'ı kaldır (super_admin için farklı erişim mekanizması).
- [ ] **Login'de otomatik şirket eşleşmesi** — Kullanıcı email'i Supabase'deki profile kaydıyla eşleşince şirket otomatik belirlenmeli; girişte şirket seçim adımı kalkmalı. (Şu an zaten böyle çalışıyor ama super_admin seçici UX'i karışıklık yaratıyor.)

### Bir Sonraki Oturumda İlk Yapılacak
**Yeni proses wizard'ını tarayıcıda test et — granül tesisi parametrelerini Adım 2/3'e gir, AssistantPanel insights'larını doğrula, panel hesaplarını kontrol et. Sonra: Paraşüt→financial_categories eşleştirme modalı.**

### Bekleyen Kullanıcı Aksiyonu
- [x] **Supabase SQL:** `migration_v25b_parasut_superadmin_rls.sql` çalıştırıldı (2026-05-19)
- [x] **Supabase SQL:** `migration_v26_custom_holidays.sql` çalıştırıldı (2026-05-21)

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
