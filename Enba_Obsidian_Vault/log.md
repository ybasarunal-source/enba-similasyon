# Enba Wiki — Log
> **Append-only.** Hiçbir zaman eski girişleri silme veya düzenleme.
> Her oturum sonunda en alta yeni giriş ekle.
> Format: `## [YYYY-MM-DD] tip | başlık`
> Tipler: `kurulum` | `ingest` | `geliştirme` | `karar` | `lint` | `sorgu`

Unix aracıyla son 5 girişi görmek için:
```bash
grep "^## \[" log.md | tail -5
```

---

## [2026-05-04] kurulum | Enba Wiki başlatıldı

**Yapılan işlemler:**
- Obsidian vault oluşturuldu (Proje, Modüller, Kararlar, Günlük, Kaynaklar, Snippets, Wiki, Ham-Kaynaklar)
- CLAUDE.md genişletildi: bilinen sorunlar, aktif görevler, geliştirme günlüğü tablosu eklendi
- NotebookLM kaynak paketi hazırlandı (Enba_NotebookLM_Kaynak.md)
- Karpathy llm-wiki pattern'i uyarlandı: index.md + log.md + wiki bakım talimatları
- CLAUDE.md'ye wiki-aware oturum protokolü eklendi

**Mevcut wiki sayfaları:** 5 sayfa (Ana-Proje, Claude-Code-Entegrasyon, Mimari-Kararlar, Modül-Listesi, Supabase-Pattern)

**Bir sonraki oturum için:** Aktif görevler bölümünü doldur, ilk modül wiki sayfasını oluştur

---

## [2026-05-04] karar | Geliştirme yol haritası ve iş modeli netleşti

**Kararlar:**
- Öncelik 1: Supabase SQL şeması tam olarak oturturulacak
- Öncelik 2: 21 modülün tümündeki eksikler sırayla giderilecek
- Uygulama kendi şirket verileriyle doldurulacak (gerçek kullanım)
- demo@enba.com → başka şirketlere satış/pazarlama demosu olarak kullanılacak
- İki paralel hedef: kendi operasyonel ERP'i + SaaS ürün demosu

**Etki:** SQL şeması her iki hedefi destekleyecek şekilde tasarlanmalı (multi-tenant yapı kritik)

## [2026-05-05 22:50] sorgu | Hafıza senkronizasyonu ve Turuncu Liste incelemesi
- Soru: Mevcut durum nedir ve Turuncu Liste neleri kapsıyor?
- Çıkarım: "Kırmızı Liste" (Kritik RLS ve Auth) tamamlanmış. "Turuncu Liste" (Modül geliştirmeleri ve eksik tablo izolasyonları) hedefleniyor.
- Bir sonraki: Admin izolasyonunun testi için test kullanıcısı hazırlığı.
- Cevap kaydedildi mi: evet (log.md)

---

## [2026-05-05] geliştirme | RLS kriz çözüldü — profiles HTTP 500 → migration_v9

**Olay:** fix_rls_infinite_recursion + migration_v6/v7/v8 birikimi sonucu profiles tablosunda 5-6 çakışan policy oluştu. Orijinal şemadan kalan "Adminler tum profilleri gorebilir" policy'si `is_admin()` çağırıyordu, `is_admin()` profiles sorguluyor, sonsuz döngü → HTTP 500.

**Kök neden:** `DROP POLICY IF EXISTS` isim uyuşmazlığı yüzünden eski policy'leri silmedi; üstüne yenileri eklendi.

**Çözüm:** migration_v9 — DO bloğuyla tüm policy'leri sil, 3 temiz policy yaz. Ayrıca is_admin() JWT tabanlı yapıldı, SECURITY DEFINER Supabase'de RLS bypass etmiyor öğrenildi.

**Yeni sayfa:** [[Kararlar/2026-05-RLS-Dersleri|RLS Dersleri]] — 5 kural, doğru şablon, HTTP 500 teşhis rehberi

**Etkilenen dosyalar:** scratch/migration_v9_profiles_rls_reset.sql (yeni)

**Bir sonraki:** Turuncu liste — kalan modüller veya yeni özellik

---

## [2026-05-05] geliştirme | Kırmızı liste tamamlandı — RLS + DataService + UX

**Yapılan:**
- `fix_rls_infinite_recursion.sql` çalıştırıldı: profiles/companies RLS döngüsü kırıldı, roller JWT'ye senkronize edildi
- `migration_v5_hr_rls_fix.sql`: attendance, personnel_payments, personnel_debts tablolarına user_id sütunu eklendi, RLS `company_id OR user_id` pattern'ine güncellendi, mevcut kayıtlara personnel tablosundan backfill yapıldı
- `dataService.ts`: `insertData()` artık `profileAPI.getMyProfile()` ile company_id ekliyor — HR/Stock/Logistics kayıtları tenant-safe oldu
- `App.tsx`: profil yüklenemezse amber bant + "Yeniden dene" butonu gösteriliyor (`profileLoadError` state)
- `SuperAdmin.tsx`: rol dropdown'una "Rol değişikliği kullanıcının yeniden giriş yapmasıyla aktif olur" notu eklendi

**Etkilenen dosyalar:** `src/api/dataService.ts`, `src/App.tsx`, `src/modules/SuperAdmin.tsx`, `scratch/migration_v5_hr_rls_fix.sql` (yeni)

**Bir sonraki:** Turuncu liste — company_id eksik tablolara migration (production, logistics, arsiv vb.) veya modül geliştirme

---

## [2026-05-05] geliştirme | Rol/izin mimarisi — SuperAdmin + CompanyAdmin

**Yapılan:**
- `supabase.ts` → `PERMISSION_MODULES` sabiti (13 modül, TR etiket) + `getCompanyProfiles()` eklendi
- `CompanyAdmin.tsx` → yeni modül: şirkete scoped kullanıcı yönetimi + izin checkboxları
- `SuperAdmin.tsx` → edit user modalına izin checkboxları + loading spinner eklendi; `permissions` artık kaydediliyor
- `App.tsx` → `company_admin` ModuleType + menü + render bağlandı

**Rol davranışı:**
- `super_admin` → tüm modüller + Sistem Yönetimi (tüm şirket/kullanıcı yönetimi)
- `admin` → tüm modüller + Şirket Yönetimi (kendi şirketi, user/admin rol + izin toggle)
- `user` → yalnızca `profile.permissions`'daki modüller

**Etkilenen dosyalar:** `src/api/supabase.ts`, `src/modules/CompanyAdmin.tsx` (yeni), `src/modules/SuperAdmin.tsx`, `src/App.tsx`

**Bir sonraki:** Kullanıcı bazlı detaylı yetki matrisi görünümü

---

## [2026-05-05] geliştirme | Admin şirket izolasyonu + header şirket adı

**Yapılan:**
- `App.tsx`: `companiesAPI` import edildi, `companyName` state eklendi, profil yüklenince `companiesAPI.getById()` çağrılıyor; header + dropdown'daki hardcoded "Platform Yöneticisi" → super_admin için "Sistem Yöneticisi", diğerleri için şirket adı
- `migration_v12_companies_rls.sql`: companies tablosuna `FORCE ROW LEVEL SECURITY` + 3 policy (SuperAdmin tümü, admin+user kendi şirketi, admin kendi şirketini günceller)
- `migration_v13_companies_anon_fix.sql`: migration_v12 login sayfasını kırdı — anon rolü companies göremez hale geldi ("Kayıtlı şirket bulunamadı"). Anon için `status IN ('active','demo')` SELECT policy eklendi
- **Öğrenilen:** `FORCE ROW LEVEL SECURITY` + `TO authenticated` policy → anon (oturum açılmamış) kullanıcılar hiçbir satır göremez. Login sayfası gibi pre-auth sorguları için ayrıca `TO anon` policy gerekir.
- `scratch/` klasörü `.gitignore`'da — SQL migration dosyaları git'e gitmiyor, Supabase Dashboard'da manuel çalıştırılıyor

**Etkilenen dosyalar:** `src/App.tsx` (push edildi), `scratch/migration_v12_companies_rls.sql` (yerel), `scratch/migration_v13_companies_anon_fix.sql` (yerel)

**SQL Durumu:** migration_v12 ve migration_v13 Supabase Dashboard'da çalıştırıldı ✓

**Önemli not — Kullanıcı yapısı henüz hazır değil:**
- Veritabanında gerçek admin/user test hesapları yok veya company_id atamaları yapılmamış
- RLS policy'leri doğru yazıldı fakat test edecek uygun rol/şirket kombinasyonu oluşturulmadı
- Admin izolasyonu teknik olarak hazır; doğrulama için önce Supabase'de test kullanıcıları oluşturulmalı: role='admin', geçerli company_id ile bir profil

**Bir sonraki:** Test kullanıcısı oluştur (role=admin, company_id atanmış) → çıkış/giriş → izolasyonu doğrula

---

## [2026-05-06] karar | Gerçek veri girişi aşaması başladı — veri güvenliği kritik

**Karar:** Uygulama artık gerçek operasyonel veri girişi aşamasına geçti. Bundan sonra yapılacak tüm geliştirmelerde veri kaybı sıfır tolerans ile ele alınacak.

**Kurallar (CLAUDE.md'ye eklendi):**
- localStorage key rename veya format değişikliği yapılmadan önce mevcut veri etkisi değerlendirilecek
- Supabase'de destructive migration (DROP, TRUNCATE, tip değişikliği) öncesi CSV export alınacak
- Her migration önce SELECT ile test edilecek, onay alındıktan sonra uygulanacak
- Veri kaybı riski olan her adım kullanıcıya açıkça bildirilecek ve onay beklenecek

**Etkilenen:** Tüm modüller — özellikle localStorage kullananlar (Stok, Üretim, Lojistik, İK, Nakit Akışı, Planlama)

---

## [2026-05-06] geliştirme | HR + Arşiv modülleri veri girişine hazır hale getirildi

**Yapılan:**
- HR.tsx: Form state'leri eklendi (name, position, salary, department, sgk_status, start_date), handleSave/handleEdit/handleDelete fonksiyonları yazıldı, modal kontrollü input'lara dönüştürüldü, edit/delete butonları wired
- Archive.tsx: supabase import eklendi, handleFileChange (Storage upload + arsiv_files insert), handleDownload (signed URL), handleDelete (storage.remove + deleteData) fonksiyonları eklendi, fetchData'ya yuklenme_tarihi→yuklenmeTarihi mapping eklendi
- scratch/migration_v20_arsiv_storage.sql: Supabase Storage 'arsiv' bucket + RLS politikaları oluşturuldu (henüz çalıştırılmadı)

**Etkilenen dosyalar:** `src/modules/HR.tsx`, `src/modules/Archive.tsx`, `scratch/migration_v20_arsiv_storage.sql`

**Bir sonraki:** Arşiv modülünde test yüklemesi yap → Admin izolasyon test hesabı oluştur

---

## [2026-05-06] geliştirme | migration_v20 çalıştırıldı — Arşiv Storage hazır

- Supabase Storage `arsiv` bucket oluşturuldu (private, 50MB limit, signed URL erişimi)
- Storage RLS politikaları aktif: authenticated kullanıcılar upload/download/delete yapabilir
- Arşiv modülü artık tamamen veri girişine hazır

---

## [2026-05-06] geliştirme | Görevler + Nakit Akışı kritik eksikler giderildi

**Yapılan:**
- scratch/migration_v21_tasks_cashflow.sql: project_groups, projects, tasks, cashflow_parameters tabloları + RLS (henüz çalıştırılmadı)
- dataService.ts: fetchCashflowParams() + saveCashflowParams() metodları eklendi
- Cashflow.tsx: loadData gerçek DB'den okuyacak şekilde düzeltildi, handleSaveParams() eklendi, "Tüm Parametreleri Güncelle" butonu wired, tahsilatVadesi/tedarikciVadesi controlled input'a dönüştürüldü
- Tasks modülü: tablolar oluşturulunca migration_v21 sonrası localStorage'dan otomatik Supabase'e geçiş yapacak (kod zaten hazır)

**Etkilenen dosyalar:** `scratch/migration_v21_tasks_cashflow.sql`, `src/api/dataService.ts`, `src/modules/Cashflow.tsx`

## [2026-05-06] geliştirme | Dashboard localStorage → Supabase geçişi

**Yapılan:**
- Dashboard.tsx: stock/satış/üretim verileri artık localStorage yerine Supabase'den okunuyor
- Promise.all genişletildi: `stock_records`, `sales_records`, `production_records` tabloları eklendi
- Alan adları snake_case'e güncellendi: `netMiktar→net_miktar`, `stokTuru→stok_turu`, `cikanUrun→cikan_urun`
- tsc type check temiz

**Etkilenen dosyalar:** `src/modules/Dashboard.tsx`

## [2026-05-06] geliştirme | Profile modülü → profiles tablosuna taşındı

**Yapılan:**
- scratch/migration_v22_profiles_extended.sql: profiles tablosuna title, department, location, start_date, phone, bio, linkedin, twitter, instagram, github, website kolonları eklendi
- Profile.tsx: useEffect → profileAPI.getMyProfile() ile profiles tablosundan yüklüyor
- Profile.tsx: handleSave → profileAPI.updateProfile() ile profiles tablosuna kaydediyor + cache temizleniyor
- Önceden kullanılan user_metadata kaydı kaldırıldı
- tsc temiz

**Notlar:**
- is_admin() → migration_v8'de zaten 'super_admin' kapsıyor, ek fix gerekmedi
- FastPlan → usePlanSync hook ile zaten Supabase sync yapıyor, ek çalışma gerekmedi
- Profiles OAuth kolonları (ms_account_id vb.) → migration_v3'te zaten eklendi

**Etkilenen dosyalar:** `scratch/migration_v22_profiles_extended.sql`, `src/modules/Profile.tsx`

## [2026-05-06] geliştirme | HR tabları tamamlandı + Settings kayıt düzeltildi

**Yapılan:**
- HR.tsx: attendance, payments, debts tab'ları tam CRUD ile tamamlandı
  - Puantaj: person_id + month + year + work_hours + overtime — unique constraint hata mesajı ile yakalanıyor
  - Maaş: ekle / durum toggle (Bekliyor ↔ Ödendi) / sil
  - Avans & Borç: ekle / sil — tür: avans / borç / diğer
  - Header butonu aktif taba göre dinamik (Kadro Tahsis Et / Puantaj Ekle / Ödeme Ekle / Kayıt Ekle)
- scratch/migration_v23_hr_payments_debts.sql: personnel_payments + personnel_debts tablolarına user_id, company_id ekledi, RLS kurdu
- Settings.tsx: handleSave → artık localStorage'a kaydediyor (enba_settings), başlangıçta okuyuyor; mock setTimeout kaldırıldı

**Etkilenen dosyalar:** `src/modules/HR.tsx`, `src/modules/Settings.tsx`, `scratch/migration_v23_hr_payments_debts.sql`

## [2026-05-06] geliştirme | Debug temizliği — Parasut + PnL

**Yapılan:**
- Parasut.tsx: handleDebug() fonksiyonu ve Debug butonu kaldırıldı, 3 adet console.log silindi
- PnL.tsx: 10 adet "PnL Debug" console.log silindi (top-level, mount, parseExcel, M109 match, file select, Paraşüt invoice, onClick handler'ları)

**Notlar:**
- SuperAdmin şirket silme + Licensing silme → zaten tam çalışıyordu, audit raporu yanlış tespit etmişti

**Etkilenen dosyalar:** `src/modules/Parasut.tsx`, `src/modules/PnL.tsx`

## [2026-05-06] karar | Piyasa değerlendirmesi + bir sonraki fazın kararı

**Değerlendirme özeti:**
- Ürün kategorisi: Geri dönüşüm/üretim sektörü için dikey operasyon yönetim platformu
- Mevcut iç kullanım değeri: 200.000–400.000 ₺ (geliştirme maliyeti bazlı)
- Tamamlanmış SaaS değeri: 7M–24M ₺ (ARR çarpanı)
- Şu anki gerçekçi değer: 1.5M–3M ₺

**Eksik olan 4 kritik özellik:**
1. Muhasebe motoru (Tek Düzen Hesap Planı, yevmiye, mizan)
2. E-fatura (GİB entegratör üzerinden)
3. Bordro + SGK e-Bildirge
4. Resmi finansal raporlama (bilanço, gelir tablosu)

**Süre kararı (Claude Code yazacak, kullanıcı çalıştıracak):**
- Kodlama: toplam 9–14 oturum (~3–5 hafta)
- Darboğaz: mali mühür temini + entegratör sözleşmesi (2–4 hafta, paralel ilerler)
- Net takvim: 6–8 hafta

**Başlangıç noktası kararı:** Dışsal bağımlılığı olmayan **bordro hesaplama** ile başlanacak.

## [2026-05-06] karar | Oturum kapanışı — Bu oturumda yapılanlar

**Tamamlanan işler:**
- Dashboard.tsx: localStorage → Supabase (stock/satış/üretim)
- Profile.tsx: user_metadata → profiles tablosu
- HR.tsx: attendance + payments + debts tab'ları tam CRUD
- Settings.tsx: mock save → gerçek localStorage kayıt
- Parasut.tsx + PnL.tsx: tüm debug kodları temizlendi
- migration_v22: profiles kişisel bilgi kolonları
- migration_v23: personnel_payments + personnel_debts RLS

**Çalıştırılması bekleyen migration:**
- migration_v23 (personnel_payments + personnel_debts user_id/company_id + RLS)

## [2026-05-07] karar | Stratejik pivot — Paraşüt + e-fatura önce, muhasebe sonra

**Karar:** Muhasebe motoru / bordro / SGK geliştirmelerini ertele. Önce Paraşüt'ü tamamla + e-fatura ekle, sonra pazara çık.
- Gerekçe: 10–16 aylık muhasebe geliştirmesi müşteri olmadan anlamsız. 6–8 haftada pazara girilir.
- Yeni öncelik sırası: Paraşüt tamamlama → e-fatura → pazar çıkışı → müşteri talebi olursa muhasebe

## [2026-05-07] geliştirme | Parasut.tsx — Stok tab'ı eklendi + debug string temizliği

**Yapılan:**
- LoginForm handleSubmit: 4 adet `setError('ADIM...')` debug string'i kaldırıldı (kullanıcıya yanlış hata gösteriyordu)
- Parasut.tsx'e "Stok" tab'ı eklendi (Faturalar / Stok tab switcher)
- Paraşüt'teki tüm stok kalemleri listeleniyor: ad, kod, stok miktarı, birim, liste fiyatı, kategori
- Stok tab lazy load: sadece açıldığında API çağrısı yapıyor
- Arama filtresi: ürün adı veya koduna göre

**Etkilenen dosyalar:** `src/modules/Parasut.tsx`, `src/api/parasut.ts` (import eklendi)
**Bir sonraki:** Paraşüt → Enba stok eşleştirmesi (item ↔ malzeme), yazma uç noktaları

---

## [2026-05-08] geliştirme | Altyapı iyileştirmeleri (10 item tamamlandı)

**Tamamlanan işler:**

1. **Supabase RLS (migration_v24 + v24b)** — business_plans için JWT tabanlı politikalar; super_admin tüm planları görür, company_id varsa tenant filtresi, yoksa user_id
2. **usePlanSync toplu upsert/insert** — mevcutlar tek seferde upsert, yeniler tek seferde insert; `supabaseId` geri yazılıyor (commit e58b135)
3. **React.lazy 22 modül** — tüm modüller lazy-load; Suspense fallback spinner; bundle ~60% küçülme (commit e353e67)
4. **PnL html2pdf dynamic import** — ilk tıklamada yükle, bundle'a girmiyor (commit ec9a095)
5. **profileAPI cache invalidation** — `updateProfile` + `adminUpdateProfile` başarı sonrası `cachedProfile = null; lastFetchTime = 0;` (commit a5bcb0a)
6. **React ErrorBoundary** — `src/components/ErrorBoundary.tsx`; lazy-load crash → boş ekran yerine "Tekrar dene" butonu (commit 4003d97)
7. **Calendar → Supabase tasks fix** — Calendar.tsx hâlâ silinmiş `enba_tasks` localStorage'ı okuyordu; `tasksAPI.getAll()` ile değiştirildi, `desc→description` field fix (commit 933b668)
8. **useSupabaseQuery genişletme** — Archive.tsx + HR.tsx (4 query) hook'a taşındı; AbortController cleanup (commit 38ade78)
9. **console.log temizliği** — Tasks/Machinery/FixedExpenses/PnL migration log'ları + Tasks Microsoft import log'u (commit 903934a)
10. **TypeScript any azaltma** — usePlanSync: `BusinessPlanRow`, `InsertedRow`, `EnbaAppMeta` interfaces + type predicate; dataService: `StockRow`, `SalesRow` interfaces + `Record<string, unknown>` payload'lar (commit 200a123)

**F (büyük component bölme) ertelendi** — kullanıcı kararı, acil değil

**Etkilenen dosyalar:** `src/api/supabase.ts`, `src/App.tsx`, `src/components/ErrorBoundary.tsx`, `src/modules/Calendar.tsx`, `src/modules/Archive.tsx`, `src/modules/HR.tsx`, `src/modules/FixedExpenses.tsx`, `src/modules/Machinery.tsx`, `src/modules/PnL.tsx`, `src/modules/Tasks.tsx`, `src/hooks/usePlanSync.ts`, `src/api/dataService.ts`

---

## [2026-05-08] karar | Yeni öncelik sırası netleşti

**Kullanıcı kararı:** Bordro/muhasebe/e-fatura belirsiz vadede ertelendi. Şu anki sıra:
1. FastPlan iyileştirmeleri (hesaplama, versiyonlama, karşılaştırma, görsel)
2. DetailedPlan iyileştirmeleri
3. Paraşüt entegrasyonunu tamamla
4. PnL analizi güçlendir
5. Yapay zeka asistanı

**FastPlan analizi tamamlandı** — eksikler tespit edildi:
- Hesaplama: başabaş noktası, geri ödeme süresi, duyarlılık tablosu, yıllık projeksiyon eksik
- Versiyonlama: not alanı yok, delta özeti yok
- Karşılaştırma: % fark sütunu yok, kazanan özeti yok
- Görsel: gider dağılım grafiği yok, PDF çıktısı yok

**Bir sonraki oturum:** FastPlan hesaplama iyileştirmeleri — `hesapla()` fonksiyonuna başabaş + geri ödeme + duyarlılık tablosu ekle

---

## [2026-05-09] geliştirme | FastPlan iyileştirmeleri + DetailedPlan bug fix + birim maliyet analizi

**Yapılan:**
- FastPlan: başabaş noktası, geri ödeme süresi, duyarlılık tablosu, gider dağılım bar chart, versiyon notu, % fark sütunu
- `detailedPlanCalculations.ts`: asgari ücret düzeltmesi (17002→28075.5 net, 5000→12799.13 SGK), amortisman hardcode kaldırıldı (per-investment `geriOdeme` kullanılıyor)
- `PlanningWizard.tsx` + `PersonnelStep.tsx`: DEFAULT_PLAN_DATA asgari ücret güncellendi
- `ReportStep.tsx`: birim maliyet analizi eklendi (Yatırım Analizi kartı + Birim Maliyet aylık tablo + katkı payı KPI'ları)
- Tüm dosyalarda kullanılmayan import temizliği

**Etkilenen dosyalar:**
- `src/modules/FastPlan.tsx`
- `src/utils/detailedPlanCalculations.ts`
- `src/modules/planning/PlanningWizard.tsx`
- `src/modules/planning/steps/PersonnelStep.tsx`
- `src/modules/planning/steps/ReportStep.tsx`

**Bir sonraki:** Kayıt mekanizması derinleştirme (DetailedPlan versiyonlama + Supabase sync)

---

## [2026-05-13] geliştirme | FastPlan dosya bölme + PDF + Mail Gmail fix + PnL kaydet fix

### FastPlan dosya bölme
- `src/modules/FastPlan.tsx` 1581 → 1231 satıra indirildi
- 5 yeni dosya: `src/modules/fastplan/types.ts`, `helpers.ts`, `FormPrimitives.tsx`, `SaveModal.tsx`, `PlanKartBileseni.tsx`
- ArşivBolumu de PlanKartBileseni.tsx'e taşındı
- Commits: e8669f7

### FastPlan PDF export
- Form header'ına "PDF" butonu eklendi (html2pdf.js dynamic import)
- A4 portrait: başlık/KPI/gider bar chart/duyarlılık tablosu/yatırım analizi
- Gizli `#fastplan-pdf-container` div ile render
- Commit: a50aab0

### Mail — Google OAuth token bug (3 katmanlı sorun)
1. `src/api/google.ts` `resumeSession()`: profilde token yoksa `logout()` çağırıyordu → token siliyordu → düzeltildi (commit bc5ba3b)
2. `src/modules/Tasks.tsx` satır 543: aynı pattern, profil yüklenince token siliyordu → düzeltildi (commit 4912064)
3. Gmail API Google Cloud Console'da etkin değildi → kullanıcı manuel etkinleştirdi
4. Mail modülüne görünür hata göstergesi eklendi (commit ea2ac63)
- Etkilenen: `src/api/google.ts`, `src/modules/Tasks.tsx`, `src/modules/Mail.tsx`

### PnL kaydet hatası
- `pnlReportsAPI.insert`: `id: Date.now().toString()` gönderiliyordu, tablo `uuid` bekliyordu → id strip edildi
- `pnlReportsAPI.getAll`: Supabase JS v2 immutable builder — `.eq()` atanmadan kullanılıyordu, filtre uygulanmıyordu → düzeltildi
- Etkilenen: `src/api/supabase.ts` (commit a125eed)

**Bir sonraki:** DetailedPlan iyileştirmeleri veya Paraşüt tamamlama

---

## [2026-05-13] geliştirme | Mail 3-panel layout — klasörler + inline detay

- Eski yapı: 2-panel (sol sidebar + geniş liste) + okuma modal'ı
- Yeni yapı: **3-panel** — Sol klasörler (w-52) / Orta liste (daralan) / Sağ inline detay
- Sol panel: Gelen/Gönderilen/Taslaklar/Çöp Kutusu + Hesaplar (Outlook/Gmail bağlantı göstergesi)
- E-postaya tıklayınca modal açılmıyor, sağda yerleşik panel açılıyor; liste w-80'e daralıyor
- Gönderilen/Taslaklar/Çöp şimdilik pasif (API desteği gelince aktifleşir)
- Etkilenen: `src/modules/Mail.tsx` (commit cb82f83)
- Bir sonraki: Başka UI iyileştirmesi veya DetailedPlan

---

## [2026-05-13] bug | Gmail token navigasyon sonrası kayboluyor — ÇÖZÜLEMEDI

**Sorun:** Mail'e gidip Gmail bağlanıyor, mailler yükleniyor. Başka modüle geçip geri dönünce "Gmail bağlantısı kesildi" butonu çıkıyor (`googleConnected = false`). Her navigasyonda tekrar bağlanmak gerekiyor.

**Bu oturumda denenenler:**
- `prompt=select_account` → `prompt=consent` değiştirildi (commit `9a8ceb9`) → Gmail 401 düzeldi, mailler yükleniyor. Ama navigasyon sorunu devam ediyor.
- `google_ever_connected` localStorage flag eklendi (önceki oturum) → Onboarding ekranı artık çıkmıyor ✓
- `fetchEmails` 401 handler'dan `googleService.logout()` kaldırıldı (önceki oturum) ✓
- App.tsx logout butonlarından `googleService.logout()` kaldırıldı (önceki oturum) ✓

**Eliminasyon:**
- `localStorage.clear()` yok (grep doğruladı)
- `microsoftService.clearStorage()` sadece MSAL key'leri temizliyor
- `resumeSession` etkisiz (profile.google_data = null)
- Token expiry formülü doğru
- 1 saat içinde gerçekleşiyor → expiry sorunu değil

**Güçlü hipotez:** Token localStorage'dan kayboluyor ama NEDEN bilinmiyor. `getAccessToken()` lazy init'te null dönüyor — token ya hiç kaydedilmiyor ya da aradan siliniyor.

**Sonraki adım için:** Önce diagnostic logging ekle (konsol çıktısını gör), sonra fix yap. Detaylar memory dosyasında: `handoff_gmail_token_2026_05_13.md`

- Etkilenen dosyalar: `src/modules/Mail.tsx`, `src/api/google.ts`
- Bir sonraki: Diagnostic log → token'ın nerede kaybolduğunu tespit et

---

## [2026-05-13 00:00] geliştirme | Gmail token sessionStorage backup fix (commit ea482cd)
- Yapılan: localStorage token kaybı sorununa karşı savunmacı fix uygulandı
  - `google.ts`: token hem localStorage hem sessionStorage'a kaydediliyor; `getAccessToken()` localStorage boşsa sessionStorage'dan kurtarıp localStorage'ı yeniden doldururuyor; `logout()` her ikisini de temizliyor; `history.replaceState` ile hash temizleme iyileştirildi
  - `Mail.tsx`: `fetchEmails` içinde token yoksa `setGoogleConnected(false)` yerine `setGoogleNeedsReconnect(true)` — error banner göster, paneli kapatma; diagnostic log kaldırıldı
  - `Calendar.tsx` + `Tasks.tsx`: redundant `handleAuthReturn()` çağrıları kaldırıldı (App.tsx yönetiyor)
- Etkilenen dosyalar: `src/api/google.ts`, `src/modules/Mail.tsx`, `src/modules/Calendar.tsx`, `src/modules/Tasks.tsx`

---

## [2026-05-14 00:00] geliştirme | Dashboard.tsx — özelleştirilebilir widget/kart sistemi
- Yapılan: Dashboard.tsx tamamen yeniden yazıldı (481 → 851 satır)
  - 13 kart tipi tanımlandı (6 KPI + 7 liste/grafik)
  - `CardConfig[]` layoutu `localStorage['enba_dashboard_layout_v1']` ile kalıcı
  - Varsayılan layout: 8 kart (4 KPI + tasks_list, calendar_list, stock_chart, payments_list)
  - Düzenleme modu: Settings butonu → turuncu çerçeve + kırmızı ✕ kaldır + HTML5 drag-and-drop sıralama
  - "Kart Ekle" modal: tüm 13 kart tipini gösterir, tıklayınca `crypto.randomUUID()` ile ekler
  - "Varsayılana sıfırla" linki
  - Mevcut veri yükleme mantığı aynen korundu (Supabase sorguları, hesaplamalar)
  - `unreadMailCount`: Google + Microsoft unread sayıları toplanıyor
  - TypeScript strict — `tsc --noEmit` hatasız geçti
- Etkilenen dosyalar: `src/modules/Dashboard.tsx`
- Bir sonraki: DetailedPlan iyileştirmeleri (kullanıcı öncelik sırası #1)
- Bir sonraki: Test — Gmail bağla → navigasyon → Mail'e dön → token hâlâ geçerli mi?
