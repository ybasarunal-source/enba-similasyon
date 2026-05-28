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

## [2026-05-14] karar | M-Kodu uygulama geneli finansal taksonomi olarak belirlendi
- Karar: `mcodeList.ts` tüm modüllerde tek finansal sınıflandırma sistemi olacak
- Her gider/gelir girişi M-kodu ile eşleştirilecek (Supabase tablolarına `mcode VARCHAR` kolonu)
- Etkilenecek modüller: Sabit Giderler, Makina, Personel, Üretim, Satış, FastPlan, PnL
- Durum: Beklemede — talep gelince modül bazlı uygulanacak
- Yeni sayfa: [[Kararlar/2026-05-MKodu-Finansal-Taksonomi]]

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


---

## [2026-05-14] geliştirme | Finansal Ayarlar modülü — migration_v25 + Ayarlar.tsx

**Yapılan:**
- Supabase migration_v25: `financial_categories` tablosu (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active) + unique index + RLS company policy
- `src/api/financialCategories.ts`: getAll (30s cache), seedIfEmpty (MCODE_LIST'ten 72 M-kodu otomatik), add, update, remove, nextCustomCode (Ö001...), nextChildCode (M489.05...)
- `src/modules/Ayarlar.tsx`: hiyerarşik ağaç tablosu — parent/child satırlar, inline ad düzenleme (Enter/Esc), aktif toggle (optimistic update + rollback), alt/üst kategori ekleme formu, özel kategori silme
- `src/App.tsx`: 'ayarlar' ModuleType eklendi, lazy import, rawMenuItems + MENU_GROUPS g5 (Sistem)
- commit: 2531ddc

**Mimari:**
- İlk açılışta şirkette 0 kayıt varsa MCODE_LIST otomatik seed edilir
- parent_code: M489.01 → 'M489', diğerleri null
- Özel kategoriler: Ö001... prefix, is_custom=true, admin silebilir
- Standart M-kodlar: sadece ad düzenlenebilir, silinemez

**Bir sonraki:**
- VarlıkTakibi modülü (Sabit Varlıklar + Depozitolar, TL/EUR çift görünüm)
- Paraşüt matching → financial_categories Supabase tablosundan çeksin (mcodeList.ts yerine)

---

## [2026-05-14] geliştirme | Varlık Takibi modülü — migration_v26 + VarlikTakibi.tsx

**Yapılan:**
- Supabase migration_v26: `fixed_assets` (varlık adı, kategori, operasyon, alış tarihi, TL tutarı, kur, kullanım ömrü) + `asset_deposits` (depozito adı, tür, operasyon, ödeme tarihi, TL, kur, tahmini iade, durum) — her iki tabloya RLS policy
- `src/api/varlikTakibi.ts`: fixedAssetsAPI + assetDepositsAPI (CRUD), yearsElapsed, annualDepreciation, assetBookValue hesap fonksiyonları
- `src/modules/VarlikTakibi.tsx`: 2 sekme (Sabit Varlıklar / Depozitolar), TL/EUR toggle (kaydedilen kur üzerinden anlık çeviri), M/K/V operasyon filtresi, 3 özet kart, sağdan açılan form paneli, net defter değeri renk göstergesi, depozito durum toggle
- `src/App.tsx`: 'varlik' ModuleType, lazy import, Finans & Muhasebe grubuna eklendi, Landmark ikonu
- commit: 7926f57

**Mimari:**
- exchange_rate: alış anındaki TL/EUR kuru kalıcı olarak kaydedilir → historical EUR tutarı her zaman doğru
- Net defter değeri = alış değeri − (yıllık amortisman × geçen yıl) — sıfırın altına düşmez
- Depozitolar aktif/iade durumu optimistic toggle ile tek tıkla değişir

**Bir sonraki:**
- Paraşüt matching → financial_categories Supabase tablosundan çeksin (mcodeList.ts yerine)
- DetailedPlan iyileştirmeleri

---

## [2026-05-14] geliştirme | Paraşüt → financial_categories Supabase entegrasyonu

**Yapılan:**
- `Parasut.tsx`: MCODE_LIST import kaldırıldı → `financialCategoriesAPI` eklendi
- Modal açılışında `seedIfEmpty + getAll` çağrısı; aktif kategoriler `allMcodes` olarak kullanılır
- `autoMatchWith(name, mcodes)` ayrı parametre alır (state asenkronluğunu önler)
- `customMcodes` localStorage state'i tamamen kaldırıldı
- "Yeni Gider Kalemi" paneli kaldırıldı → modal toolbar'da "Finansal Ayarlar" yönlendirmesi
- Excel referans sayfası artık Supabase tablosunu yansıtır
- `Parasut` bileşenine `profile` prop eklendi
- commit: d9ab97d

**Mimari:**
- M-kodu taksonomi artık tek kaynaktan: `financial_categories` Supabase tablosu
- Kategori eşleştirme, varlık takibi, (gelecekte) tüm modüller bu tabloyu kullanacak
- localStorage tabanlı custom mcodes → Supabase tabanlı Ayarlar modülüne geçti

**Bir sonraki:**
- DetailedPlan iyileştirmeleri veya PnL operasyon bazlı ayrıştırma

---

## [2026-05-14 23:30] geliştirme | Paraşüt M-kodu açıklamaları + oturum devam

- **Yapılan:** `Parasut_TR_Muhasebe_Eslestirme.xlsx` 2. sütunundan (Açıklama/Notlar) 71 M-kodu için Türkçe muhasebe açıklamaları çıkarıldı. `src/api/mcodeNotes.ts` oluşturuldu. Paraşüt kategori eşleştirme combobox'ı her kodun altında açıklama satırı gösteriyor. Dropdown 460px genişliğe çıkarıldı.
- **Etkilenen dosyalar:** `src/api/mcodeNotes.ts` (yeni), `src/modules/Parasut.tsx`
- **Önceki oturumdan devam:** Inline Ayarlar paneli, upload hata raporu, 429 retry, özel M-kodu oluşturma, mcodeList.ts 71 kodla güncellendi (önceki oturumda tamamlanmıştı)
- **Bekleyen:** `migration_mcode_update.sql` → Supabase'de çalıştırılmalı (financial_categories tablosunu güncel TDHP adlarıyla günceller)
- **Bir sonraki:** DetailedPlan iyileştirmeleri veya PnL operasyon bazlı ayrıştırma

---

## [2026-05-18] geliştirme | DetailedPlan design handoff — tüm paneller tamamlandı

- **Yapılan:** `design_handoff_detailed_plan/` JSX prototipinden tam TypeScript dönüşümü tamamlandı. 9 dosya oluşturuldu:
  - `dpData.ts` — veri modeli, hesaplama yardımcıları, TypeScript arayüzleri
  - `DPPrimitives.tsx` — temel UI bileşenleri + ikon seti + `useChartColors`
  - `OverviewPanel.tsx`, `RevenuePanel.tsx`, `ExpensePanel.tsx`, `CashFlowPanel.tsx`, `ScenarioPanel.tsx` — plan panelleri
  - `BudgetTrackPanel.tsx` — bütçe takip, period scrubber, BVA KPI'lar, YTD karşılaştırma, kalem sapma tablosu, varyans ısı haritası
  - `DetailedPlanShell.tsx` — iç sidebar (6 bölüm), header (senaryo chip'leri, dönem kontrolü), panel yönlendirme
- **Etkilenen dosyalar:** `src/modules/detailedplan/` (yeni klasör, 9 dosya), `src/App.tsx` (import + render güncellendi), `src/modules/detailedplan/ExpensePanel.tsx` (ReferenceLine bug düzeltildi), `tailwind.config.js` + `src/index.css` (yeni CSS değişkenleri — önceki oturumda)
- **Bağımlılık eklendi:** `recharts` (npm install)
- **Bir sonraki:** Paraşüt → financial_categories bağlantısı veya PnL operasyon bazlı ayrıştırma

---

## [2026-05-19] karar | DetailedPlan veri girişi + Paraşüt token mimarisi notlandı

- **Konu:** İki mimari karar notu wiki'ye eklendi
- **DetailedPlan:** Plan oluşturma akışı (FastPlan gibi kart listesi önce önerisi), ürün girişi, Supabase şeması (business_plans JSON blob), inline editing + debounce auto-save, aktüel veri girişi (kısa vade: manuel)
- **Paraşüt token:** localStorage → Supabase `parasut_tokens` tablosu; company_id ile RLS izolasyonu; saveToken/loadTokenFromSupabase/disconnect değişiklikleri; migration plan
- **Yeni sayfalar:** `Kararlar/2026-05-DetailedPlan-Veri-Girisi.md`, `Kararlar/2026-05-Parasut-Token-Supabase.md`
- **Bir sonraki:** Önceliklendirme — DetailedPlan gerçek veri bağlantısı mı, Paraşüt token migrasyonu mu?

---

## [2026-05-19] ingest | Nakit Akışı & Üretim Planı Özeti
- Kaynak: Operasyonel finansal özet — nakit tablosu, üretim parametreleri, 3 ay projeksiyon, KDV mahsup
- Güncellenen sayfalar: `index.md`
- Yeni sayfalar: `Ham-Kaynaklar/2026-05-Nakit-Akisi-Uretim-Ozeti.md`
- Önemli çıkarım: Bu belge DetailedPlan modülünün ilk gerçek kullanım senaryosu; KDV takip ve alıcı tablosu yeni modül ihtiyacı olarak belirlendi
- Bekleyen: Hammadde fiyatı çelişkisi (18 vs 20 TL/kg) + hangi M/K/V operasyonu soruları yanıtsız

---

## [2026-05-19] oturum kapanışı | Temizlik + güvenlik + M/K/V düzeltmesi

**Bu oturumda yapılanlar:**
- Kök dizin .jsx temizliği: 26 eski prototip dosyası silindi (commit 9571b0d) — ai-assistant.jsx ve org-chart-module.jsx src/ karşılığı yok ama korunmaya değmez
- Hardcoded credential güvenlik fix: `supabase.ts` + `Notes.tsx` içindeki fallback URL ve anon key kaldırıldı, .env yoksa açık exception fırlatılıyor (commit dffb33b)
- M/K/V tanımı düzeltildi: Mamul/Komponent/Varlık değil → **Merkez/Kömürcüler/Varsak** (operasyon lokasyonları). CLAUDE.md + memory güncellendi.
- Test kullanıcısı SQL scripti hazırlandı — kullanıcı oluşturma Dashboard'dan yapılacak, company_id seçimi bekleniyor

**Etkilenen dosyalar:** 26 .jsx silindi, `src/api/supabase.ts`, `src/modules/Notes.tsx`, `CLAUDE.md`

**Sonraki oturumda:** DetailedPlan gerçek veri bağlantısı veya Paraşüt token migrasyonu — kullanıcı belirler

---

## [2026-05-19] geliştirme | Paraşüt token — localStorage'dan Supabase'e migrasyon

**Yapılan:**
- `scratch/migration_v25_parasut_tokens.sql` — `parasut_tokens` tablosu + company_id unique index + RLS politikası
- `src/api/parasut.ts`:
  - `supabase` import eklendi
  - `_companyId` in-memory state eklendi (company izolasyonu için)
  - `saveToken()` — fire-and-forget Supabase upsert eklendi (token yenilemede de çalışır)
  - `loadTokenFromSupabase(companyId)` — yeni async metod; Supabase'den token yükler, localStorage'a da sync eder
  - `logout()` — Supabase satırını da siler
  - `saveCompany()` — Supabase'deki `parasut_company_data`'yı da günceller
  - `resumeSession()` — `_companyId` set eder (backward compat için korundu)
- `src/App.tsx` — `parasutService.resumeSession(profile)` yerine `loadTokenFromSupabase` + fallback

**Etkilenen dosyalar:** `scratch/migration_v25_parasut_tokens.sql`, `src/api/parasut.ts`, `src/App.tsx`
**tsc:** temiz (exit 0)
**Bir sonraki:** Supabase'de `migration_v25_parasut_tokens.sql` çalıştır → test: iki hesapla giriş/çıkış → token izolasyonu doğrula

---

## [2026-05-19] oturum kapanışı | DetailedPlan + FastPlan reskin + mimari notlar

**Bu oturumda yapılanlar:**
- DetailedPlan design handoff tamamlandı: BudgetTrackPanel + DetailedPlanShell yazıldı, App.tsx güncellendi, ExpensePanel ReferenceLine bug düzeltildi (commit 33f43d7)
- DetailedPlan iç sidebar daraltılabilir hale getirildi — w-12 icon-only modu, chevron toggle (commit f8b1686)
- FastPlan tüm design language'ı DetailedPlan'a uyumlu reskin edildi — gray/white → enba token'ları, rounded-[2.5rem] → rounded-xl, font-black → font-semibold (commit 18d73b8)
- İki mimari karar notu wiki'ye eklendi: DetailedPlan veri girişi mimarisi (karar bekleniyor), Paraşüt token Supabase migrasyonu (karar verildi)

**CLAUDE.md Aktif Görevler güncellendi.**

**Sonraki oturumda:** DetailedPlan gerçek veri bağlantısı veya Paraşüt token migrasyonu — kullanıcı öncelik belirler.

---

## [2026-05-19] geliştirme | Paraşüt super_admin multi-tenant context fix

- **Yapılan:** parasut_tokens RLS politikası super_admin'e tüm şirket satırlarını okuma/yazma izni verecek şekilde güncellendi. parasut.ts'e `_targetCompanyId` override mekanizması + `setTargetCompanyId()` metodu eklendi. Parasut.tsx'e super_admin şirket seçici dropdown eklendi (login ekranında ve bağlı durumdayken).
- **Etkilenen dosyalar:** `src/api/parasut.ts`, `src/modules/Parasut.tsx`, `scratch/migration_v25b_parasut_superadmin_rls.sql`
- **Commit:** cd82733
- **⚠️ Manuel Adım:** Supabase SQL Editor'da `migration_v25b_parasut_superadmin_rls.sql` içeriğini çalıştır (RLS politika güncellemesi)
- **Bir sonraki:** DetailedPlan gerçek veri bağlantısı

---

## [2026-05-19] geliştirme | DetailedPlan gerçek veri bağlantısı — PlanCtx + plan listesi

- Yapılan:
  - `dpData.ts`: `DPlan` arayüzü, `PlanCtx`, `usePlanData`, `createNewPlan`, `buildMonths` export
  - 6 panel (Overview, Revenue, Expense, CashFlow, Scenario, BudgetTrack) mock sabit referanslarından `usePlanData()` hook'una geçirildi
  - `DetailedPlanShell`: `plan/onSave/onBack` prop'ları eklendi; `PlanCtx.Provider` sarmalayıcı; başlık, badge ve geri butonu plan verisinden çekiliyor
  - `DetailedPlanModule` (yeni): `usePlanSync<DPlan>` ile plan listesi + yeni plan modal + plan kartı grid + boş durum ekranı
  - `App.tsx`: `DetailedPlanShell` → `DetailedPlanModule` olarak güncellendi
- Etkilenen dosyalar: dpData.ts, 6 panel, DetailedPlanShell, DetailedPlanModule (yeni), App.tsx
- Commit: 551d054
- Bir sonraki: Panel veri girişi (ürün/gider düzenleme) veya Paraşüt → financial_categories

## [2026-05-20] geliştirme | DetailedPlan Tesis+Proje mimarisi — tam yeniden yazım

- Yapılan:
  - `dpData.ts`: `ActiveProject` arayüzü (kendi gider+geliri + allocationWeight + startOffset/endOffset); `DPlan` artık `facilityExpenses[]` + `projects[]` tutuyor (eski products/fixedExpenses kaldırıldı); `isProjectActive` + `facilityShareFor` yardımcıları eklendi; `PlanDataCtxValue` genişletildi
  - `DPlanWizard.tsx`: 3 adımlı sihirbaz (Temel / Tesis Sabit Giderleri / Projeler); FacilityStep, ProjectsStep, ProjectEditor (3 sekme), dağılım bar'ı, kenar çubuğu 12 aylık özet
  - `DetailedPlanShell.tsx`: `ctxValue` plan verilerini panel geriye uyumluluk için düzleştiriyor (projects.flatMap revenues/expenses)
  - `DetailedPlanModule.tsx`: PlanCard MiniStat projects/facilityExpenses kullanıyor
- Etkilenen dosyalar: dpData.ts, DPlanWizard.tsx, DetailedPlanShell.tsx, DetailedPlanModule.tsx
- Commit: 2fde639
- Bir sonraki: Sihirbazda proje/gider/gelir veri girişini test et; panel verilerinin doğru aktığını doğrula

## [2026-05-20] refactor | DetailedPlan Facility maliyet merkezi mimarisi

- **Yapılan:** Kullanıcı talebi doğrultusunda mimari tamamen düzeltildi.
  - `Facility { id, name, fixedExpenses[] }` arayüzü eklendi — adlandırılmış sabit gider merkezi
  - `DPlan.facilities[]` — eski `facilityExpenses[]` flat listesi kaldırıldı
  - `ActiveProject.isActive` boolean + `facilityId` bağlantısı eklendi
  - Hesap mantığı: sadece aynı tesisin **aktif** projeleri maliyeti paylaşır (`facilityShareFor` güncellendi)
  - `migratePlanFormat`: eski format planlar otomatik dönüştürülür (veri kaybı yok)
  - **Sihirbaz Adım 2:** `FacilitiesStep` — her tesis isimlendirilmiş kart, inline isim düzenleme, "+ Yeni Maliyet Merkezi" butonu
  - **Sihirbaz Adım 3:** Her proje kartında aktif/pasif toggle (yeşil switch), dağılım barı yalnızca aktif projeleri gösterir, çoklu tesis için facilityId seçici
  - `DetailedPlanModule`: lazy migration + plan kartı "N aktif" özeti
- **Etkilenen dosyalar:** dpData.ts, DPlanWizard.tsx, DetailedPlanShell.tsx, DetailedPlanModule.tsx
- **Commit:** 46f710f
- **Bir sonraki:** Sihirbazı test et — tesis oluştur, gider ekle, proje ekle, aktif/pasif toggle dene

## [2026-05-20] geliştirme | DetailedPlan — Tedarikçi Havuzu + 4 gider kategorisi

- **Yapılan:**
  - `dpData.ts`: `Supplier` arayüzü + `loadSuppliers`/`saveSuppliers` (localStorage key: `enba_dp2_suppliers`)
  - `DetailedPlanModule.tsx`: `supplierEditor` view branch, `SupplierCard`, `SupplierEmptyState`, `SupplierEditor` tam sayfa bileşenleri; liste görünümüne "Tedarikçi Havuzu" bölümü eklendi
  - `DPlanWizard.tsx`: `Supplier` import + `suppliers` prop zinciri (Wizard → ProjectsStep → ProjectEditor → AlimList); AlimList formuna "Tedarikçiden Seç" dropdown → seçince malzeme adı, birim, alış fiyatı otomatik doldurulur
  - `DPlanWizard.tsx`: AlimList/UretimList/PersonelList/SatisList — 4 ayrı maliyet kategorisi, birim bazlı hesaplamalar (elektrik kWh, personel kişi×ücret)
- **Etkilenen dosyalar:** dpData.ts, DetailedPlanModule.tsx, DPlanWizard.tsx
- **Bir sonraki:** Commit at, ardından plan oluşturma akışını uçtan uca test et

## [2026-05-20] geliştirme | DetailedPlan — Müşteri Havuzu + oturum kapanışı

- **Yapılan:**
  - `dpData.ts`: `Customer` arayüzü (name, sector, paymentTerms); `DPlan.customers: Customer[]`; `Product.customerId?: string`
  - `DPlanWizard.tsx`: `CustomerList` + `CustomerFormRow` bileşenleri; Step 2 sırası: Tedarikçi → Müşteri → Projeler; `ProjectRevenueList` formuna müşteri dropdown + display row'da müşteri adı
  - Tedarikçi Havuzu da planın içine taşındı (global → DPlan.suppliers) — önceki commit 4dc8c50
- **Commit:** 0a04a6e
- **Wiki:** `Moduller/DetailedPlan.md` oluşturuldu — tam mimari, açık konular listesi
- **Durum:** Temel veri girişi tamamlandı. Yarın bilgi girişi + test yapılacak.

## [2026-05-19] karar | Piyasaya çıkmadan önce tenant izolasyon güvenliği

- **Konu:** super_admin Paraşüt şirket seçici dropdown'ı tüm şirket adlarını listeliyor — tenantlar birbirini görmemeli.
- **Yapılacak (piyasa öncesi):**
  1. Şirket adı yerine slug/kod göster veya dropdown'ı tamamen kaldır
  2. Login akışında şirket seçimi kalkmalı — email → profile → company_id eşleşmesi otomatik (zaten böyle, ama UX netleştirilmeli)
- **Öncelik:** Düşük (şu an tek tenant), yüksek (ikinci tenant eklenmeden önce)

---

## [2026-05-21 geliştirme | Gider Merkezi M-kodu — arama özellikli combobox
- Yapılan: `DetailedPlanModule.tsx` — `<select>` kaldırıldı, `McodeCombobox` bileşeni eklendi. Açılır listede her M-kodu için kısa ad (`EXPENSE_MCODES.tr`) ve tam muhasebe açıklaması (`MCODE_NOTES`) 2 satır truncate ile gösteriliyor. Arama kutusu: kod, Türkçe ad ve açıklama içinde eşleşme yapıyor.
- Etkilenen dosyalar: `src/modules/detailedplan/DetailedPlanModule.tsx`
- Bir sonraki: DetailedPlan panel hesapları test (wizard verisi → OverviewPanel/RevenuePanel/ExpensePanel)

---

## [2026-05-21] geliştirme | Oturum özeti — haftalık granülarite, tatil, wizard bug fix

### 1. DetailedPlan — Haftalık Granülarite (commit 9dcb5be)
- **dpData.ts:** `WeeklyRamp` arayüzü + `weeklyRampAt()`, `Granularity` tipi, `buildDisplayPeriods()` (weekly/monthly/quarterly/annual), `buildSeries` güncellendi, `PlanCtx`'e `weeklyHorizon` + `granularity` eklendi
- **DPlanWizard.tsx:** Step1'de weeklyHorizon seçici (4/8/12/16/24 hafta), tüm formlara `WeeklyRampField` (AlimList, UretimList, PersonelList, SatisList, ProjectRevenueList); `weeklyHorizon` prop zinciri ProjectEditor→ProjectsStep→DPlanWizard
- **DetailedPlanShell.tsx:** Select dropdown yerine 4-button Haftalık/Aylık/Çeyreklik/Yıllık toggle; ctxValue `buildDisplayPeriods` + granularity + weeklyHorizon kullanıyor

### 2. Takvim — Resmi Tatil + Köprü Günü (commitler d762cb7, e0d59dd, 53eca3e)
- **src/api/holidays.ts:** Nager.Date API ile TR tatilleri (30 gün localStorage cache), Supabase custom_holidays ile köprü/özel günler, `getHolidays()` + `addCustomHoliday()` + `removeCustomHoliday()`
- **Calendar.tsx:** Tatil günleri kırmızı arka plan + flag ikonu, ajanda sidebar'ında tatil kartı (köprü=turuncu, resmi=kırmızı), admin/super_admin için Tatil Ekle modal + kaldır butonu
- **migration_v26_custom_holidays.sql:** custom_holidays tablosu + RLS — **ÇALIŞTIRILDI**
- **Bug fix:** `toISOString()` UTC offset kaydırması → yerel tarih parçalarıyla düzeltildi

### 3. Wizard Bug Fix — Projeyi Kaydet (commit d1135a1)
- **Sorun:** `emptyProject` → `name: ''`, disabled button `pointer-events-none`, Temel sekmesi dışında hiç tıklanamıyordu
- **Çözüm:** Proje adı inputu header'a taşındı — sekme bağımsız, her zaman görünür

### 4. Diğer (önceki oturum tamamlamalar)
- Deren Easter egg (`DerenEasterEgg.tsx`) — "deren" klavye sırası, kalp animasyonu
- McodeCombobox — portal + fixed konum, arama özellikli
- Tedarikçi/Müşteri — nakliye (₺/kg) + kısmi peşin/vade alanları

- Etkilenen dosyalar: `dpData.ts`, `DPlanWizard.tsx`, `DetailedPlanShell.tsx`, `Calendar.tsx`, `src/api/holidays.ts`, `DetailedPlanModule.tsx`, `src/components/DerenEasterEgg.tsx`, `App.tsx`
- Bir sonraki: DetailedPlan panel hesapları doğrulama — wizard verisi panellere akıyor mu?

---

## [2026-05-22] geliştirme | DetailedPlan granülasyon fix + Stock modülü sıfırdan yeniden tasarımı

### 1. DetailedPlan — granülasyon hesap hataları düzeltildi (commit 0e31fa1)
- **Sorun:** Panel hesaplamaları döngü indeksi `i` yerine `period.monthOffset` kullanmıyordu → çeyreklik/yıllık granülasyonda yanlış aylar hesaplanıyordu
- **dpData.ts:** `sumForPeriod(period, fallbackIdx, fn)` helper eklendi — `spanMonths` + `monthOffset` ile doğru ay aralığını iterate eder
- **OverviewPanel.tsx:** `grouped` useMemo kaldırıldı (zaten `buildSeries` + `buildDisplayPeriods` doğru aggregate ediyor); `periodGranularity` destructure'dan çıkarıldı (unused ESLint)
- **ExpensePanel.tsx + RevenuePanel.tsx:** Tüm toplam/seri hesaplamaları `sumForPeriod` kullanıyor

### 2. Stock modülü — sıfırdan yeniden tasarlandı (commit 64918cd)
- **Sorun:** Eski modül iç içe component tanımları (focus kayması + performans), slate/card token'ları, dağınık state
- **Yeni tasarım:** DetailedPlan design language — sol sidebar + chevron collapse, sağ-drawer formlar
- Tüm sub-component'ler modül seviyesinde: `Field`, `CalcRow`, `KpiCard`, `Drawer`, `DeleteConfirm`, `AlisFormFields`, `SatisFormFields`, `AlisPanel`, `SatisPanel`, `StokPanel`, `RaporlarPanel`
- Alış formu: canlı fire/maliyet önizlemesi; Satış formu: brüt/net gelir önizlemesi
- StokPanel: ürün bazlı özet (ort. maliyet, stok değeri, durum badge: Normal/Kritik/Tükendi)
- RaporlarPanel: tedarikçi/müşteri özeti + aylık marjin tablosu
- **LucideIcon tip fix:** `LucideIcon` type import (TS2322 çözüldü)
- Etkilenen dosyalar: `src/modules/Stock.tsx`, `src/modules/detailedplan/dpData.ts`, `OverviewPanel.tsx`, `ExpensePanel.tsx`, `RevenuePanel.tsx`
- Bir sonraki: Stock'ta gerçek veri girişi test et; Paraşüt → financial_categories eşleştirme modalı

## [2026-05-23 16:00] geliştirme | DetailedPlan panel hesap doğrulama — 5 kritik düzeltme
- Yapılan:
  1. **startOffset/endOffset proje düzeyinde ürünlere uygulanıyor**: Shell ctxValue artık projenin startOffset/endOffset'ini her gelir kalemine ve proje giderine yansıtıyor. `revenueFor()` fonksiyonuna da startOffset/endOffset kontrolü eklendi. Önceden proje offset'i yalnızca `facilityShareFor()` içinde çalışıyordu — tüm gelir ve gider hesapları ay 0'dan başlıyordu.
  2. **CashFlowPanel periods uyumsuzluğu giderildi**: Panel artık PlanCtx'in granularity'sine bağlı `periods` yerine kendi `buildMonths(horizon, startYear, startMonth)` ile monthly periods inşa ediyor. Quarterly/annual modda label hataları ortadan kalktı.
  3. **OverviewPanel investment hardcoded kaldırıldı**: `₺4,8 Mn` sabit değeri yerine `cashEvents.type === 'investing'` toplamından hesaplanıyor. cashEvents girilmemişse "Yatırım nakit olayı girilmemiş" gösteriyor.
  4. **BvaSnapshot gerçek veri**: actualsThrough === 0 ise boş durum gösteriliyor. Gerçek veri girilmişse `bvaForPeriod()` ile hesaplıyor.
  5. **weeklyHorizon + RevenueMix horizon fix**: OverviewPanel buildSeries çağrıları weeklyHorizon alıyor; RevenueMix hardcoded 24 yerine periods.length kullanıyor.
- Etkilenen dosyalar: `dpData.ts`, `DetailedPlanShell.tsx`, `CashFlowPanel.tsx`, `OverviewPanel.tsx`, `RevenuePanel.tsx`
- Build: ✅ TypeScript sıfır hata, production build başarılı
- Bir sonraki: DetailedPlan wizard gerçek veriyle doldur → panel hesaplarını manuel doğrula

## [2026-05-23 17:30] geliştirme | Modül reskin — Faz 1 global CSS katmanı
- **Yapılan:** Tüm modüllerde tutarsız tasarım sorunu için global CSS çözümü uygulandı
- `src/index.css`: `.enba-module` scope'u eklendi — `bg-white`, `bg-gray-*`, `border-gray-*`, `rounded-3xl`, `shadow-sm` sınıfları enba tokenlarına eşlendi
- `src/App.tsx`: Modül içerik div'ine `enba-module bg-enba-bg` eklendi
- **Etki:** ~80% modül otomatik düzeldi (beyaz → panel rengi, gri kenarlıklar → enba-line, rounded-3xl → rounded-xl, gölgeler kalktı)
- **Plan:** `Kararlar/2026-05-Modul-Reskin-Plani.md` — Faz 2/3 modüller tek tek el atılacak
- Etkilenen: `src/index.css`, `src/App.tsx`
- Build: ✅ TypeScript sıfır hata

## [2026-05-23 17:00] geliştirme | DetailedPlan navigasyon fix — App global ← artık plan listesine döner
- **Sorun:** Detaylı İş Planı modülündeyken App top bar ← tuşu, plan listesine değil bir önceki modüle (dashboard/modules vb.) gidiyordu
- **Çözüm:** `backOverride` ref mekanizması:
  - `App.tsx`: `backOverrideRef = useRef<(() => boolean) | null>()` eklendi; `goBack()` önce bu fonksiyonu çağırır, `true` dönerse modül navigasyonunu atlar
  - `DetailedPlanModule.tsx`: `setBackOverride` prop alıyor; `view !== 'list'` iken intercept kaydediyor (shell/wizard/ccEditor → liste), `view === 'list'` iken override kaldırıyor; unmount'ta temizleniyor
- Etkilenen dosyalar: `App.tsx`, `DetailedPlanModule.tsx`
- Commit: fa057d7
- Build: ✅ TypeScript sıfır hata

## [2026-05-23] ingest | Granül Üretimi İş Planı Konuşması
- Kaynak: konuşma kaydı — `is_plani_konusma.md` (kök dizin) — 21 iterasyon, Python hesap motoru
- Güncellenen sayfalar: `Moduller/DetailedPlan.md` (Granül Üretimi bölümü + modül boşlukları eklendi)
- Yeni sayfalar: `Ham-Kaynaklar/2026-05-GranulUretimi-IsPlan.md`, `Kararlar/2026-05-GranulUretimi-Parametre.md`
- Önemli çıkarım: Mevcut DetailedPlan modülü sabit giderler ve gelirler için yeterli; kritik boşluk = hacim-tabanlı senaryo (ton/ay input değişkeni) ve birim değişken maliyet (TL/ton × hacim) yok

---

## [2026-05-23 19:00] geliştirme | DetailedPlan — proses tabanlı wizard yeniden yazımı

### 1. dpData.ts — ProductionModel tipleri + hesap motoru
- `ProductionParams`: energyUnitCost, defaultDF, hoursPerDay, daysPerMonth
- `MachineEntry`: id, name, kw, capacityTonPerHour, df?, usesNetOutput, order
- `WorkerGroup`: stage (sorting/production/sales/management), mode (capacity/fixed), capacityTonPerMonth?, fixedCount?, monthlyCost
- `RawMaterial`, `OutputProduct`, `OtherVariableCost` — mcode etiketli
- `calcProductionResults(model)` → `ProductionCalcResult` (netOutputTons, totalRevenue, totalVariableCost, machineCapacities[], workerCapacities[], bottleneck, energyCostByMachine)
- `deriveProjectFromModel(model, existingProject?)` → shell panel uyumlu `ActiveProject` (expenses[] + revenues[])
- `DPlan.productionModel?: ProductionModel` alanı eklendi

### 2. dpAssistant.ts — yeni dosya: kural tabanlı plan asistanı
- `generateInsights(model, hasCostCenter, calc?)` → `Insight[]`
- Kurallar: darboğaz makineleri, >85% kapasite uyarısı, işçi yetersizliği, Gider Merkezi eksikliği, ambalaj tanımsız, SGK hatırlatması, negatif/düşük marj
- `calcBottleneckAlternatives()` → fazla mesai (saatlik ücret×1.5×ekstra saat) vs. yeni personel maliyeti karşılaştırması
- `calcScenariosTable()` → 5 ton senaryosu, her senaryo için gelir/gider/kâr/marj

### 3. DPlanWizard.tsx — komple yeniden yazım (proses odaklı, 4 adım)
- **Adım 1 — Plan Bilgisi:** başlık, kategori, açıklama, yıl/ay, horizon, açılış kasası, Gider Merkezi
- **Adım 2 — Parametreler:** enerji fiyatı/DF, aylık input tonu; ham maddeler; işçi grupları (kapasite veya sabit mod); çıktı ürünleri (pay%, fiyat, ambalaj); diğer değişken maliyetler
- **Adım 3 — Proses:** 4 aşama (Mal Girişi / Ayrıştırma / Üretim / Satış); fire oranları; makine listesi (kW, ton/sa, DF override, üretim sırasına göre yukarı/aşağı); fire-after-machine noktası; kapasite bar'ları
- **Adım 4 — Özet:** gider breakdown bar chart, 5 senaryo tablosu (30-50-70-90-110 ton)
- **AssistantPanel (kalıcı):** adım 2+'dan görünür; özet KPI'lar (input ton, gelir, değişken maliyet, brüt kâr); makine kapasite bar'ları; insight listesi (darboğaz alternatifleri inline)
- Kayıtta `deriveProjectFromModel()` → `projects[0]` shell panellerine uyumlu

### 4. DetailedPlanModule.tsx — 4 durum yaşam döngüsü + filtre sekmeler
- `draft → pending → active → archived` durum geçişleri
- Filtre sekmeler: Tümü / Taslak / Beklemede / Aktif / Arşiv (sayı badge'leri ile)
- PlanCard: durum badge, hızlı geçiş butonları, kategori chip, açıklama snippet
- Taslaktan direkt "Arşivle" kısayolu eklendi

- Etkilenen dosyalar: `dpData.ts`, `dpAssistant.ts` (yeni), `DPlanWizard.tsx`, `DetailedPlanModule.tsx`
- Build: ✅ TypeScript sıfır hata, production build başarılı
- Commit: 6910193
- Bir sonraki: Granül tesisi parametrelerini wizard'a gir → panel hesaplarını manuel doğrula

## [2026-05-23 21:00] geliştirme | Machinery.tsx — enba design language yeniden tasarım + migration_v28 unified assets

### Mimari değişiklik: Unified Assets Table
- `fixed_assets` tablosu kaldırıldı (migration_v28)
- `assets` tablosuna `operation`, `exchange_rate`, `useful_life_years`, `notes` kolonları eklendi
- `varlikTakibi.ts`: `fixedAssetsAPI` artık `assets` tablosunu kullanıyor; `rowToFixedAsset()` / `formToRow()` ile kolon adı çevirisi
- `VarlikTakibi.tsx`: `tur` (makina/demirbas) alanı eklendi
- `supabase.ts`: `SupabaseAsset` arayüzü genişletildi (company_id, operation, exchange_rate, useful_life_years, notes)

### Machinery.tsx yeniden tasarım
- Eski: dev yuvarlak kartlar, ortalanmış modal, bakım sekmesi hiç render edilmiyordu
- Yeni: kompakt KpiCard bileşeni, 3 sekme (Makina Parkı / Demirbaşlar / Bakım Arşivi) tümü çalışıyor
- Tablo düzeni (grid-cols), sağ taraf drawer panel
- Operasyon rozeti (M=mavi, K=yeşil, V=mor) her satırda
- Bakım Arşivi sekmesi: varlık dropdown + tip + tarih + maliyet + açıklama
- `openAddMaint(asset?)` → makine satırının ingiliz anahtarı butonu ile tetikleniyor

### Seed SQL
- `seed_granul_makineleri.sql`: 6 granül makinesi `assets` tablosuna (tek tablo)
- company_id: `a191c800-d8c3-4780-b08f-dd75faef3baf`, operation: 'K'
- Supabase SQL Editor'de çalıştırılmayı bekliyor

- Etkilenen dosyalar: `src/modules/Machinery.tsx`, `src/api/supabase.ts`, `src/api/varlikTakibi.ts`, `src/modules/VarlikTakibi.tsx`, `supabase/migrations/migration_v28_unified_assets.sql`, `supabase/migrations/seed_granul_makineleri.sql`
- Build: ✅ TypeScript sıfır hata
- Commit: 561c017
- Bir sonraki: Supabase'de seed SQL çalıştır → makineler hem Makina Parkı hem Varlık Takibi'nde görünmeli. Sonra: Paraşüt → financial_categories eşleştirme modalı

---

## [2026-05-24 09:00] geliştirme | seed_granul_makineleri.sql çalıştırıldı
- Yapılan: 6 granül makinesi `assets` tablosuna eklendi (Kömürcüler / company_id: a191c800)
- Makineler Makina Parkı (Machinery.tsx) ve Varlık Takibi (VarlikTakibi.tsx) modüllerinde görünür
- Bir sonraki: Yeni proses wizard'ını tarayıcıda test et → granül tesisi parametreleri + AssistantPanel doğrulama

---

## [2026-05-24] oturum kapanışı | Wizard yeniden yazımı + mobil kararları

**Bu oturumda yapılanlar:**
- `seed_granul_makineleri.sql` önceki gün çalıştırıldı — CLAUDE.md güncellendi
- Geri dönüşüm proses domain bilgisi arşivlendi: nem/çöp/alt kalite fire tipleri, ön seçim, hat uyumluluğu, wizard adımları netleşti
- `Wiki/Geri-Donusum-Proses-Bilgisi.md` oluşturuldu (kırpılmadan)
- Plan tipi seçim ekranı eklendi: Granül Üretimi (aktif) + Kağıt/Çapak/Levha (daha sonra)
- DPlanWizard.tsx tamamen yeniden yazıldı: 4 adım → 6 adım (Plan Bilgisi / Giriş & Fire / Ön Seçim / Üretim / Çıktı Ürünleri / Özet)
- dpData.ts: InputFraction tipi, ProductionModel yeni alanlar, calcProductionResults güncellendi
- Commit: 47bc576, push edildi
- Mobil modül kararları alındı: 14 modül mobil, geri kalanlar masaüstü — `Kararlar/2026-05-Mobil-Modul-Kararlari.md`
- Mobil teknik yaklaşım: Hibrit (C) — basit modüller breakpoint, karmaşık modüller `useIsMobile()` hook

**Bir sonraki oturumda:**
1. Wizard tarayıcı testi — granül tesisi parametreleri + AssistantPanel doğrulama
2. DetailedPlan — BudgetTrack aktüel veri girişi formu
3. Paraşüt → financial_categories eşleştirme modalı

---

## [2026-05-24] ingest | Geri dönüşüm proses domain bilgisi
- Kaynak: Başar ile wizard tasarım konuşması (tam sohbet arşivlendi)
- Güncellenen sayfalar: `index.md`
- Yeni sayfalar: `Wiki/Geri-Donusum-Proses-Bilgisi.md`
## [2026-05-24] karar | Mobil modül kararları
- Mobil olacaklar: dashboard (özet), tasks, calendar, mail (inbox odaklı), notes, fixedexpenses, fastplan, stock, production, cashflow, pnl (özet), machinery, settings, planning (sadece özet)
- Masaüstü only: profile, modules, varlik, parasut, ayarlar, archive, licensing, company_admin, super_admin
- İleride karar: logistics, hr
- Önemli: Mail mobilde inbox-okuma uygulaması gibi tasarlanacak; DetailedPlan mobilde read-only özet
- Yeni sayfa: `Kararlar/2026-05-Mobil-Modul-Kararlari.md`

---

- Önemli çıkarımlar:
  - Fire 3 tipte: nem (saf kayıp), çöp (saf kayıp), alt kalite fraksiyonlar (plan bazında gelir ya da kayıp)
  - Ön seçim malzeme bazında — bazı malzemeler bypass ederek direkt üretime girer
  - Her fraksiyon için 3 karar: direkt sat / üretime sok / at
  - PP/LDPE/HDPE aynı hat paylaşabilir ama aynı anda çalışamaz; PET ayrı hat zorunlu
  - Hat değişimi = temizlik = hammadde + zaman kaybı → çok malzeme planlaması istenen durum değil
  - Her plan tek malzeme üzerine kurulur; kapasite boşluğu AssistantPanel insight'ı olur
  - Wizard başında plan tipi seçim ekranı gelecek: Granül Üretimi ilk seçenek; kağıt balyalama, çapak, levha ileride
  - Granül wizard adımları netleşti: Plan Bilgisi → Giriş & Fire → Ön Seçim → Üretim → Çıktı → Özet

## [2026-05-25 17:30] geliştirme | DetailedPlan karşılama ekranı yeniden tasarım
- Yapılan: Liste görünümü iki panele bölündü — sol: aktif planlar dashboard + gider merkezleri, sağ: 300px sabit kompakt plan listesi
- Sol panel: KPI şeridi (aktif plan sayısı, aktif proje, tesis gideri/ay, ort. gerçekleşme), aktif plan kartları (yeşil çerçeve + progress bar), gider merkezleri
- Sağ panel: Aktif → Onay Bekliyor → Taslak → Arşiv gruplama, kompakt satır, hover'da düzenle/sil, hızlı durum butonları
- Etkilenen dosyalar: src/modules/detailedplan/DetailedPlanModule.tsx
- Bir sonraki: Sektör Bilgi Bankası (sektor_not) erişim kısıtlaması gözden geçirilecek

## [2026-05-26 14:00] geliştirme | Ramp-Up Faz 1 + BudgetTrack Faz 2
- Yapılan:
  - dpData.ts: `RampUpMonth`, `RampUpSchedule` tipleri, `getRampScale()`, `buildSeries()` ramp parametreli (gelir+değişken maliyet scale, sabit gider sabit)
  - DPlanWizard.tsx: 7. adım "Rampa Dönemi" — toggle, ay sayısı seçici, per-month ton input, Lineer Doldur, kümülatif gelir kaybı tahmini
  - DetailedPlanShell.tsx: ctxValue'ya rampUp + baseInputTons; buildSeries çağrıları güncellendi
  - OverviewPanel.tsx: Ramp özet kartı (amber), grafik ReferenceArea gölgeleme
  - BudgetTrackPanel.tsx: Tam yeniden yazım — 4 sekme modal (Finansal / Üretim / Stok / İK), 3 granülasyon (Aylık / Haftalık / Günlük), operasyonel KPI kartları, haftalık/günlük grid girişi, stok dönem sonu otomatik hesap, İK verimlilik hesabı, "tonajdan finansal hesapla" butonu
- Etkilenen dosyalar: dpData.ts, DPlanWizard.tsx, DetailedPlanShell.tsx, OverviewPanel.tsx, BudgetTrackPanel.tsx, WhatIfBar.tsx, ScenarioPanel.tsx
- Bir sonraki: Gerçek üretim/stok verisi test edilecek

## [2026-05-26 15:30] geliştirme | Plan kilitleme + versiyonlama tamamlandı
- Yapılan:
  - DPPrimitives.tsx: `I.Lock` + `I.Copy` ikonları eklendi
  - DetailedPlanShell.tsx: `onCreateVersion?` prop eklendi; aktif planda "Düzenle" yerine "Yeni Versiyon" butonu gösterilir
  - DetailedPlanModule.tsx PlanCard: aktif planda edit butonu yerine kilit ikonu; "Yeni Versiyon Al" butonu
  - DetailedPlanModule.tsx PlanSidebarRow: `onCreateVersion` prop, aktif planda Copy ikonu + "Versiyon Al" aksiyon butonu, v{n} rozeti
  - handleCreateVersion: yeni UUID, status=draft, version++, parentPlanId=root, actuals temizleme, wizard açılır
  - openWizardForEdit: aktif plan için erken return (double-guard)
  - commit: 279e258
- Etkilenen dosyalar: DPPrimitives.tsx, DetailedPlanShell.tsx, DetailedPlanModule.tsx
- Bir sonraki: BudgetTrack aktüel veri girişi test; Paraşüt → financial_categories eşleştirme modalı

## [2026-05-26 18:00] geliştirme | DetailedPlan tam P&L yeniden tasarımı — Faz 1+2 tamamlandı

- Yapılan:
  - **dpData.ts**: PlanMCodeEntry / PlanMCodeStatus / PnLRow / PnLRowType tipleri + DPlan.mcodeEntries alanı + createNewPlan/migratePlanFormat güncellendi
  - **pnlStructure.ts** (YENİ): 12 bölüm × 80+ M-kod P&L hiyerarşisi, buildPnLRows(), PNL_MILESTONE_MCODES, MCODE_CONTROL_LIST, getMcodeLabel()
  - **DPlanWizard.tsx**: 7→6 adım (Ön Seçim Giriş&Fire'a dahil), WizardState.mcodeEntries, saveDraft/handlePublishClick/confirmPublish ayrıldı, Step5MaliyetKontrol (MCodeRow + AllMCodesAccordion), Step6RampaOzet, LivePnLPreview (sağ kolon, adım 4-5), PublishModal (ön kontrol + N/A + blocker kuralları)
  - **PnLPanel.tsx** (YENİ): Shell varsayılan sekme, collapsible 12-bölüm P&L, inline edit, N/A toggle, milestone toplamlar, özet metrik kartları
  - **DetailedPlanShell.tsx**: SectionId'ye 'pnl' eklendi, varsayılan active='pnl', PnLPanel import
  - **DPPrimitives.tsx**: I.List ikonu eklendi
  - commit Faz1: 0a61784 | commit Faz2: f8d5337
- Etkilenen dosyalar: dpData.ts, pnlStructure.ts (yeni), DPlanWizard.tsx, PnLPanel.tsx (yeni), DetailedPlanShell.tsx, DPPrimitives.tsx
- Bir sonraki: Granül Üretimi planı ile test; Faz 3 (WhatIfBar→PnL simülasyon, PDF export)

## [2026-05-27 10:30] geliştirme | PnLPanel kritik hesap düzeltmeleri

- Yapılan:
  - EBITDA formülü: `(m419 + m489 + m689) * -1` → `m419 + m489 + m689`
    (section subtotal'lar zaten negatif, çarpım kaldırıldı)
  - EBIT formülü: `ebitda - m789` → `ebitda + m789`
    (m789 zaten negatif amortisman toplamı)
  - BAKIM & ÇEVRE (M509+M529): subtotalMcode='' olduğu için hiçbir section
    toplamına dahil değildi — `bakimCevre` değişkeni ile EBITDA'ya elle dahil edildi
  - PnLRow outer div'e `group` class eklendi (N/A butonu hover'da görünmüyordu)
  - CostCenter allocationWeight soruşturması: plan içi çoklu proje DOĞRU çalışıyor;
    planlar arası paylaşım bilinçli tasarım kararı (her plan bağımsız)
- Etkilenen dosyalar: PnLPanel.tsx (commit 05f8414)
- Bir sonraki: Tarayıcı testi — granül üretimi ile wizard + P&L panel

## [2026-05-27 11:00] geliştirme | PDF export — DetailedPlan shell

- Yapılan:
  - PDF butonu artık işlevsel — html2pdf.js dynamic import (FastPlan patterni)
  - DPPdfContainer bileşeni: A4 portrait, tüm stiller inline (html2canvas uyumlu)
  - İçerik: plan header, 4 KPI kartı (Net Satışlar/EBITDA/EBIT/Net Kâr + marj%),
    üretim özeti bloğu (girdi ton, çıktı, enerji, personel), tam P&L tablosu
    (bölüm başlıkları renkli, sadece dolu satırlar), milestone vurgular, footer
  - pdfMonthly useMemo: PnLPanel hesap mantığının shell-level kopyası
  - isPdfGenerating state: buton "Hazırlanıyor…" gösteriyor
  - Çoklu dil genişletme CLAUDE.md Gelecek Planlar listesine eklendi
- Etkilenen dosyalar: DetailedPlanShell.tsx (commit 2f9e4a9)
- Bir sonraki: Tarayıcı testi — wizard + P&L panel + PDF export doğrula

---

## [2026-05-28] geliştirme | PnLPanel tam düzeltmeleri + AI Danışman özelliği

**Yapılan:**
1. **PnLPanel granülarite bağlantısı** — Haftalık/Aylık/Çeyreklik/Yıllık + horizon dropdown artık P&L 2. kolonu etkiliyor; `granularityMeta()` fonksiyonu, `col2` prop'u PnLRow + SubtotalRow'a eklendi
2. **PnLPanel 5 hata düzeltmesi** — VERGİ bölümü (M919 subtotalMcode=''), M509/M529 giriş alanı (source: mcode_entry), M610 Kira girilmemiş sorunu, EBITDA pozitif→yeşil, EBIT etiketi ("Faiz Öncesi, Amortisman Sonrası"), 0 geçerli gider değeri
3. **AI Öneri** — `usePlanAI` hook (plan bazlı cache, otomatik analiz), `hyper-service` Edge Function planSummary dalı, sidebar otomatik içgörü + aksiyon
4. **AI Danışman sohbet** — `ChatMessage` tipi, `ask()`, `clearChat()`, sidebar chat UI (balonlar, input, gönder), `hyper-service` question dalı deploy edildi
- Etkilenen dosyalar: `PnLPanel.tsx`, `pnlStructure.ts`, `DetailedPlanShell.tsx`, `usePlanAI.ts`, `supabase/functions/plan-analysis/index.ts`
- Commitler: `f14b422`, `e4fb172`, `f3d4885`, `db50a4e`, `30b141c`
- Bir sonraki: AI Danışman tarayıcı testi + BudgetTrack gerçek veri testi

---

## [2026-05-28] geliştirme | DPlanWizard otomatik kayıt (autosave)

**Yapılan:**
1. `buildPlan` fonksiyonu `useCallback` + `buildPlanRef` ile ref üzerinden erişilebilir hale getirildi
2. 30 saniyelik debounce autosave: son değişiklikten 30s sonra taslak otomatik kaydedilir (başlık varsa)
3. Header'a `autoSaveStatus` göstergesi eklendi: "Kaydediliyor…" (pulse) / "✓ Kaydedildi" (yeşil)
4. `handleCancel` → X butonu ve "İptal" footer butonu artık kapatmadan önce taslak kaydeder
5. `useRef` import'a eklendi (eksikti)
- Etkilenen dosyalar: `DPlanWizard.tsx`
- TypeScript: tsc --noEmit temiz
- Bir sonraki: Active plan edit kilidi (PnLPanel inline edit engeli)

---

## [2026-05-28] geliştirme | PnLPanel bütçelenmiş plan edit kilidi + "Aktif"→"Bütçelenmiş" etiket

**Yapılan:**
1. `PnLPanel.tsx:332` — `editable` koşuluna `plan.status !== 'active'` guard'ı eklendi; bütçelenmiş planda satır düzenleme ve N/A toggle devre dışı
2. `dpData.ts`, `DetailedPlanModule.tsx`, `DetailedPlanShell.tsx` — 8 noktada "Aktif" → "Bütçelenmiş" etiket değişikliği (kod değerleri korundu)
- Etkilenen dosyalar: `PnLPanel.tsx`, `dpData.ts`, `DetailedPlanModule.tsx`, `DetailedPlanShell.tsx`
- TypeScript: tsc --noEmit temiz
- Commit: 5a4a80b

---

## [2026-05-28 12:00] sorgu | Piyasaya çıkış ve Go-to-Market (GTM) stratejileri
- Soru: Program yavaş yavaş olgunlaşıyor, piyasaya çıkmak için stratejilere ihtiyacım var.
- Detay: B2B SaaS modeli, hedef kitle (Türkiye'deki 5.000-20.000 geri dönüşüm tesisi), fiyatlandırma katmanları (Starter, Pro, Enterprise), lansman fazları ve pilot müşteri edinme planlandı.
- Cevap kaydedildi mi: Evet, [[Wiki/Piyasaya-Cikis-Stratejisi|Piyasaya Çıkış Stratejisi]] wiki sayfası oluşturuldu ve `index.md` güncellendi.

---

## [2026-05-28 12:15] geliştirme | Sektörel wiki ve alan bilgisi güçlendirildi
**Yapılan:**
- Kök dizindeki 5 adet loose `hat*.md` dosyası, Obsidian Vault içinde `Enba_Obsidian_Vault/Wiki/Hatlar/` altına taşınarak düzenlendi.
- `Wiki/Sektor-Rehberi.md` hub sayfası oluşturularak hatlar arası malzeme akışları (mermaid diyagramı ile) modellendi.
- `EN643-2014-E.pdf` belgesi analiz edilerek `Wiki/Sektor/EN643-Kagit-Standartlari.md` sayfası açıldı (5 kağıt grubu, kirlilik ve nem toleransları detaylandırıldı).
- GRS kütle dengesi (mass balance) izlenebilirliği, EFSA/FDA food-grade challenge test süreçleri için `Wiki/Sektor/GRS-ve-Gida-Mevzuatlari.md` rehberi oluşturuldu.
- `index.md` dosyası tüm yeni sayfalarla güncellendi.
**Etkilenen dosyalar:** `Enba_Obsidian_Vault/index.md`, `Enba_Obsidian_Vault/Wiki/Sektor-Rehberi.md` (yeni), `Enba_Obsidian_Vault/Wiki/Sektor/EN643-Kagit-Standartlari.md` (yeni), `Enba_Obsidian_Vault/Wiki/Sektor/GRS-ve-Gida-Mevzuatlari.md` (yeni), `Enba_Obsidian_Vault/Wiki/Hatlar/Hat1..5` (yeni)
**Bir sonraki:** Kök dizindeki eski `hat*.md` dosyalarının silinip silinmeyeceği teyit edilecek, build doğrulaması izlenecek.

---

## [2026-05-28 12:40] geliştirme / ingesting | Sektörel Wiki Canlı Dağıtımı ve Yeni Malzemeler

**Yapılan işlemler:**
- **Derleme Engellerinin Çözülmesi:** Detaylı plan modülünde yerel olarak geliştirilen ancak tamamlanmamış (`ScenarioModal` eksikliği) senaryo dosyaları stashed yapılarak projenin `npm run build` ile sorunsuz derlenmesi sağlandı.
- **Canlıya Gönderim:** `src/modules/SektorNot.tsx` güncellenerek Vercel üzerinden canlı yayına alındı. Canlı sürümde "Standartlar & GRS" sekmesi eklendi.
- **Yerel Geliştirmenin Geri Yüklenmesi:** Dağıtım sonrası `git stash pop` ile yerel senaryo çalışmaları kayıpsız olarak geri yüklendi.
- **Yeni Malzeme Sayfaları:** Bilgi havuzuna yeni bir modül eklemek üzere `Wiki/Malzemeler` klasörü açıldı ve iki kritik geri dönüşüm malzemesi detaylandırıldı:
  - [[Wiki/Malzemeler/PET-Capak-Dinamikleri|PET Çapak Dinamikleri]]: PVC limitleri, IV değerleri ve SSP reaktör katsayıları.
  - [[Wiki/Malzemeler/LDPE-Film-ve-Geri-Donusum-Zorluklari|LDPE Film ve Geri Dönüşüm]]: Aglomerasyon, hydrocyclone ayrıştırma ve nem sıkıştırma zorlukları.
- **Dizin Güncellemesi:** `index.md` dosyasına yeni malzeme sayfaları eklendi.

---

## [2026-05-28 12:45] ingesting | PP ve HDPE Malzeme Sayfaları Eklendi

**Yapılan işlemler:**
- **Wiki Genişletme:** `Wiki/Malzemeler` klasörüne iki yeni kritik sert plastik malzemesi eklendi:
  - [[Wiki/Malzemeler/PP-Polipropilen-ve-Koku-Sorunu|PP Polipropilen ve Koku Giderme]]: PP enjeksiyon MFI değerleri, koku emme problemi (sünger etkisi) ve degazör/sıcak hava stripping koku giderme teknolojileri.
  - [[Wiki/Malzemeler/HDPE-Yuksek-Yogunluk-Polietilen-Dinamikleri|HDPE ve Sert Plastik]]: Naturel (şeffaf) ve renkli HDPE arasındaki ticari fiyat farkları, şişirme (blow) ve enjeksiyon kalite MFI ayrımları ve karışma riskleri.
- **Dizin Güncellemesi:** `index.md` dosyasına yeni malzeme sayfaları eklendi.
