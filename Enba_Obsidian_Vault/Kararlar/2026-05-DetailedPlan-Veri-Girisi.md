# DetailedPlan — Veri Girişi & Plan Oluşturma Mimarisi

Tarih: 2026-05-19  
Durum: **Karar bekleniyor** — alternatifleri değerlendirme aşaması

---

## Mevcut Durum

DetailedPlan modülü (`src/modules/detailedplan/`) şu an tamamen mock verilerle çalışıyor — `dpData.ts` içindeki sabit örnek veriler gösteriliyor. 6 panel (Genel Bakış, Gelir, Gider, Cash Flow, Senaryo, Bütçe Takip) tasarım olarak tamamlandı, gerçek veri bağlantısı henüz yapılmadı.

---

## Karar Gerektiren Sorular

### 1. Plan Oluşturma Akışı — Nasıl başlıyor?

**Seçenek A — FastPlan gibi kart listesi önce**
- Modül açılışında "Plan Listesi" ekranı gelir (aktif/taslak planlar kart grid)
- "Yeni Plan Oluştur" → minimal modal: plan adı + yıl aralığı + ürün/hizmet listesi
- Karttan açılınca DetailedPlanShell o planın verisiyle yüklenir
- ✅ FastPlan kullanıcıları için tanıdık, çoklu plan yönetimi doğal
- ❌ Ekstra bir ekran/akış katıyor

**Seçenek B — Shell içinden plan seçimi**
- DetailedPlanShell header'da "Plan Seç / Yeni" dropdown
- İlk kullanımda "Boş plan oluştur" ile başlanır, plan adı verilir, kaydedilir
- ✅ Daha az ekran geçişi
- ❌ Shell içinde plan yönetimi karmaşıklaşır

**Öneri:** Seçenek A — FastPlan mantığını uygula. `planning` modülü açılınca plan listesi gelir, oradan plana girilir. Tutarlılık önemli.

---

### 2. Ürün / Hizmet Girişi — Ne kadar detay?

Şu an `dpData.ts`'deki PRODUCTS sabiti 5 ürün içeriyor. Gerçek kullanımda:

- Her şirketin ürün listesi farklı (1–20 ürün)
- Her ürünün: ad, birim (ton/kg/adet), baz satış fiyatı, değişken maliyet oranı, mevsimsellik katsayıları (12 ay) olması gerekiyor
- Bu ürün listesi şirkete özgü olmalı

**Seçenek A — Plan bazlı ürün tanımı**
Her plan kendi ürün listesini taşır (JSON blob içinde). Farklı planlar için farklı ürün mix'leri olabilir.

**Seçenek B — Şirket bazlı ürün kataloğu**  
Ayrı bir `products` tablosu, her plan bu tablodan seçer. Paraşüt stok kalemiyle eşleşebilir.

**Öneri:** Şimdilik Seçenek A (plan bazlı, JSON blob). Paraşüt entegrasyonu olgunlaşınca Seçenek B'ye geçilebilir. YAGNI.

---

### 3. Veri Depolama — Supabase şeması

`business_plans` tablosu zaten mevcut (migration_v24). Mevcut kullanım: FastPlan verilerini saklamak.

DetailedPlan için iki yaklaşım:

**Seçenek A — Aynı tablo, `plan_type` ile ayırt**
```sql
business_plans:
  id, company_id, plan_type ('fast' | 'detailed'), data jsonb, created_at
```
`data` JSON içinde ürünler, giderler, cash event'ler, gerçekleşenler.

**Seçenek B — Ayrı `detailed_plans` tablosu**
Daha temiz schema, ama migration ekstra iş.

**Öneri:** Seçenek A — `business_plans.plan_type = 'detailed'` ve `data` kolonuna tam plan JSON'u sakla. Şimdilik normalize etme, tek kaynak yeterli.

---

### 4. Veri Girişi Arayüzü — Inline mi, form mu?

Design handoff'tan gelen yorum: RevenuePanel ve ExpensePanel zaten inline editable hücre tasarlıyor.

**Öneri — Hibrit:**
- **Inline editing** → RevenuePanel, ExpensePanel (fiyat, hacim, sabit gider tutarları)
- **Form/modal** → Yeni ürün ekleme, yeni sabit gider ekleme, senaryo tanımı
- **Auto-save** → Her hücre değişiminde debounce (1s) ile Supabase'e yaz
- **Gerçekleşen veri** → BudgetTrackPanel'de manuel giriş; ilerde Paraşüt API'den otomatik

---

### 5. Gerçekleşen Veri (Aktüeller) — Nereden geliyor?

`ACTUALS_THROUGH` şu an sabit bir sayı (Ocak–Mart gerçekleşmiş). Gerçekte:

- **Kısa vade:** Manuel giriş — BudgetTrackPanel'de her ay için gelir/gider aktüeli el ile girilir
- **Orta vade:** Paraşüt'ten otomatik — fatura/alış datası çekilerek M-kodu eşleştirmesiyle otomatik hesap
- **Uzun vade:** ERP modüllerinden (satış, stok, üretim) otomatik konsolidasyon

**Öneri:** İlk implementasyonda sadece manuel giriş. Paraşüt → actuals bağlantısı ayrı bir özellik olarak sıralanmalı.

---

## Önerilen Uygulama Sırası

1. **DetailedPlanListesi** bileşeni — plan kartları, yeni plan oluşturma modali
2. **Supabase bağlantısı** — `business_plans` tablosunda `plan_type='detailed'`, `data: DPlanData` JSON schema tanımla
3. **dpData.ts mock → gerçek veri** — `DetailedPlanShell` plan ID alır, Supabase'den yükler
4. **Inline kaydetme** — RevenuePanel/ExpensePanel hücre değişimlerini debounce ile yazar
5. **Gerçekleşen giriş** — BudgetTrackPanel için aktüel giriş formu
6. **Paraşüt → aktüeller** — bağımsız özellik, sıranın sonuna

---

## İlgili Sayfalar

[[Kararlar/2026-05-Parasut-Token-Supabase|Paraşüt Token Supabase Migrasyonu]]  
[[Kararlar/2026-05-MKodu-Finansal-Taksonomi|M-Kodu Finansal Taksonomi]]  
[[Moduller/00-Modul-Listesi|Modül Listesi]]
