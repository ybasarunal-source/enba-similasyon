# Detaylı İş Planı Modülü

Tarih: 2026-05-20  
Durum: **Temel veri girişi tamamlandı — test bekliyor**

---

## Genel

`src/modules/detailedplan/` — geri dönüşüm ve üretim sektörü için çok projeli, çok tesisli finansal projeksiyon modülü. Wizard → Shell iki aşamalı akış.

---

## Dosya Yapısı

| Dosya | Görev |
|-------|-------|
| `dpData.ts` | Veri modeli (DPlan, ActiveProject, FixedExpense, Product, Supplier, Customer, CostCenter), hesap yardımcıları, localStorage helpers, PlanCtx |
| `DPlanWizard.tsx` | 2 adımlı plan oluşturma/düzenleme sihirbazı |
| `DetailedPlanShell.tsx` | 6 panelli okuma/analiz ekranı |
| `DetailedPlanModule.tsx` | Modül giriş noktası — list/wizard/shell/ccEditor view yönetimi |
| `DPPrimitives.tsx` | cx, Badge, Btn, Select, ScenarioChip, ikon seti |
| `OverviewPanel.tsx` | Genel bakış — gelir/EBITDA/cash özet grafikler |
| `RevenuePanel.tsx` | Gelir detayı — ürün bazlı projeksiyon |
| `ExpensePanel.tsx` | Gider detayı — kategori bazlı breakdown |
| `CashFlowPanel.tsx` | Nakit akışı — waterfall + kümülatif |
| `ScenarioPanel.tsx` | Senaryo karşılaştırma |
| `BudgetTrackPanel.tsx` | Bütçe vs. gerçekleşen |

---

## Veri Modeli (2026-05-20 itibarıyla)

```
DPlan
├── suppliers: Supplier[]         ← plana ait tedarikçi havuzu
├── customers: Customer[]         ← plana ait müşteri havuzu
├── projects: ActiveProject[]
│   ├── costCenterId              ← hangi Gider Merkezi'ne bağlı
│   ├── isActive                  ← aktif projeler tesis maliyeti alır
│   ├── allocationWeight          ← aynı tesisin paylaşım oranı
│   ├── startOffset / endOffset   ← plan içi ay ofsetleri
│   ├── expenses: FixedExpense[]  ← projeye özgü değişken/direkt giderler
│   │   └── costCategory: purchase|production|personnel|sales|overhead
│   └── revenues: Product[]
│       └── customerId?           ← müşteri havuzundan atanabilir
└── cashEvents: CashEvent[]

CostCenter (plan dışında, global)
└── fixedExpenses: FixedExpense[] (costCategory: facility)
```

### Gider Kategorileri ve M-Kodları
| Kategori | M-Kodları | Hesap Yöntemi |
|----------|-----------|---------------|
| `purchase` | M369 | birim fiyat × aylık miktar |
| `production` | M405(kWh), M410(lt), M415(m³), M509, M529, M604 | M405/410/415 birim tüketim; diğerleri direkt aylık |
| `personnel` | M489, M489.01, M489.03, M489.04, M605 | M489 grubu: kişi sayısı × birim ücret |
| `sales` | M630, M640, M650, M999 | direkt aylık |
| `facility` | M420, M405, M410, M415, M489, M509, M529, M605, M999 | direkt aylık (CostCenter'a ait) |

### localStorage Anahtarları
- `enba_dp2_plans` → plan listesi (usePlanSync → Supabase sync)
- `enba_dp2_cost_centers` → gider merkezleri

---

## Wizard Akışı

**Adım 1 — Temel Bilgiler**
Plan adı, başlangıç yılı/ayı, horizon (12/18/24/36 ay), açılış kasası

**Adım 2 — Havuzlar + Projeler** (tek adım, scrollable)
1. Tedarikçi Havuzu (SupplierList) — ad, malzeme, birim, alış fiyatı
2. Müşteri Havuzu (CustomerList) — ad, sektör, ödeme vadesi
3. Projeler (ProjectsStep) — her proje 6 sekmeli ProjectEditor:
   - **Temel:** isActive, renk, CostCenter seçici, allocationWeight, start/endOffset
   - **Alım:** M369 giderler, tedarikçiden hızlı seçim
   - **Üretim:** enerji/su/bakım giderler, birim tüketim bazlı
   - **Personel:** maaş/SGK/yemek/ulaşım, kişi×ücret bazlı
   - **Satış:** pazarlama/dağıtım giderler
   - **Gelirler:** ürün/hizmet, fiyat×hacim, müşteri ataması

---

## Shell Panelleri

Shell açılışında PlanCtx dolup 6 panel çalışır. Senaryo (baz/iyimser/kötümser) ve dönem granülaritesi (aylık/çeyreklik/yıllık) header'dan değiştirilebilir.

---

## Açık Konular

### 🔴 Kritik (test öncesi bilinmeli)

1. **Panel hesapları gerçek mi?**
   Wizard'dan gelen veri PlanCtx'e akıyor ama 6 panelin mock veri referansları tamamen temizlendi mi? Özellikle OverviewPanel/RevenuePanel/ExpensePanel. Veri girişi sonrası grafiklerin dolu gelmesi beklenir — gelmiyorsa `dpData.ts`'te `buildSeries()` fonksiyonunun proje giderlerini doğru topladığı kontrol edilmeli.

2. **CostCenter maliyeti projeye akıyor mu?**
   `facilityShareFor(project, allProjects, cc)` hesabı — aynı gider merkezine bağlı birden fazla aktif proje varsa `allocationWeight` oranında bölüşüm yapılıyor. Shell'de bu paylaşımın doğru yansıdığı test edilmeli.

3. **startOffset / endOffset etkisi**
   Proje ve gider kalemlerindeki başlangıç/bitiş ay ofsetleri `buildSeries()` içinde doğru uygulanıyor mu? 3. ayda başlayan bir proje 1. ve 2. ay sıfır gelir/gider üretmeli.

4. **Supabase sync**
   `usePlanSync` plan verisini `business_plans` tablosuna `plan_type='detailed'` ile yazıyor. Yeni `suppliers`/`customers` alanları JSON blob içinde gidiyor — mevcut RLS politikası izin veriyor. İlk kayıt sonrası Supabase Table Editor'da doğrulanmalı.

### 🟡 Önemli (sonraki adım)

5. **Bütçe Takip paneli çalışmıyor**
   `BudgetTrackPanel` `actualsThrough > 0` olan planlar için anlamlı. Aktüel veri girişi hiç yok — panel şu an boş veya örnek veriyle doluyor. Aktüel giriş formu gerekiyor.

6. **CashFlow cashEvents girişi eksik**
   Wizard'da açılış kasası giriliyor ama yatırım/finansman nakit olayları (makine alımı, kredi çekimi vb.) düzenlenemiyor. `CashFlowPanel` bu verisiz doğru çalışmaz.

7. **Shell read-only**
   Wizard dışında plan verisi değiştirilemiyor. Satış fiyatını doğrudan gelir panelinden düzeltmek için wizard'a geri dönmek gerekiyor. Inline editing yok.

### 🟢 İleride (öncelik düşük)

8. **Senaryo yönetimi**
   3 sabit senaryo (baz/iyimser/kötümser) ± çarpan. Kullanıcının kendi senaryo parametrelerini girmesi yok. Senaryo paneli anlamlı olmak için kullanıcı tanımlı iyimser/kötümser varsayımları gerekiyor.

9. **Müşteri / Tedarikçi bazlı analiz**
   Müşteri seçici gelir kalemine bağlandı ama panellerde müşteri bazlı breakdown yok. Gelir panelinde "müşteri A: %60, müşteri B: %40" gibi dağılım gösterilebilir.

10. **Paraşüt → aktüeller**
    Fatura verisi M-kodu eşleştirmesiyle BudgetTrack'e aktarılabilir. Finansal Kategoriler modülü M-kodu altyapısını hazırladı. Bağlantı henüz yok.

11. **PDF export**
    Shell'de PDF butonu var ama işlevsel değil. html2pdf.js dynamic import planlandı (FastPlan'da yapıldı — aynı yöntem uygulanabilir).

12. **Horizon değişikliği kalıcı mı?**
    Shell'de horizon dropdown'ı var (12/18/24/36 ay). Bu `plan.horizon` alanını güncellemiyor — sadece görünüm granülaritesini etkiliyor mu? Net değil, kontrol edilmeli.

---

## İlgili Sayfalar

[[Kararlar/2026-05-DetailedPlan-Veri-Girisi|Veri Girişi Mimari Kararları]]  
[[Kararlar/2026-05-MKodu-Finansal-Taksonomi|M-Kodu Taksonomi]]  
[[Moduller/Ayarlar|Finansal Kategoriler (M-kodu yönetimi)]]
