# Granül Üretimi İş Planı Konuşması

Tip: konuşma kaydı / hesap motoru
Tarih: 2026-05-23
Ekleyen: Başar
Kaynak dosya: `is_plani_konusma.md` (kök dizin)

---

## Özet

Hurda naylon geri dönüşüm tesisi için geliştirilmiş, 21 iterasyonlu tam iş planı. Giriş: 110 ton/ay, %15 fire. Çıktı: 93,5 ton/ay 1. kalite granül + 8,25 ton/ay 2. kalite ürün. 6 makineli proses (kırma → çırpma → kurutma → sıkma → agromel → granül). Darboğaz: granül makinesi (300 kg/sa), fazla mesai ile çözülmüş. Tam hesap motoru Python'da mevcut — 5 senaryo (30/50/70/90/110 ton), her birinde kâr/zarar, başabaş fiyatı, başabaş tonajı hesaplanmış.

---

## Projemize Etkisi

Bu belge DetailedPlan modülü için **ilk gerçek kaynak veridir.** Wizard ve shell panellerinin ne kadarını karşıladığını, hangi yapısal boşlukların bulunduğunu ortaya koyuyor.

### Mevcut modüle doğrudan giren veriler

| Kalem | Değer | Modül Karşılığı |
|-------|-------|-----------------|
| Kira | 65.000 TL/ay | CostCenter → M420 |
| Forklift kirası | 30.000 TL/ay | CostCenter → M605 |
| Bakım-onarım | 30.000 TL/ay | CostCenter → M509 |
| Muhasebe | 20.000 TL/ay | CostCenter → M605 |
| Çevre müh. | 18.000 TL/ay | CostCenter → M529 |
| İnternet/diğer | 5.000 TL/ay | CostCenter → M999 |
| Elektrik müh. | 1.500 TL/ay | CostCenter → M605 |
| **Sabit toplam** | **169.500 TL/ay** | CostCenter ✓ |
| Hammadde | 110 t × 1000 × 19 = 2.090.000 TL/ay | Proje gider → M369 |
| İşçilik | 5×50K + 82K = 332.000 TL/ay | Proje gider → M489 |
| Gelir 1. kalite | 93,5 t × 40.000 = 3.740.000 TL/ay | Proje gelir (ürün 1) |
| Gelir 2. kalite | 8,25 t × 30.000 = 247.500 TL/ay | Proje gelir (ürün 2) |

### Modüle giren ama hesap gerektirenler

| Kalem | Formül | Modül Karşılığı |
|-------|--------|-----------------|
| Enerji | Makine × (ton/kapasite) × DF × 5 TL/kWh | M405 birim tüketim (ama makine-makine ayrı girmek gerekir) |
| Çuval | ceil(93,5/1,5) × 350 = 21.933 TL/ay | M999 veya M640 (satış gideri) |
| Atık su | 110 × 800 = 88.000 TL/ay | M529 |

### Modülde BULUNMAYAN yapılar — kritik boşluklar

| Boşluk | Açıklama | Etki |
|--------|----------|------|
| **Hacim-tabanlı senaryo** | 5 senaryo input tonajına göre (30-50-70-90-110 t). Mevcut modül baz/iyimser/kötümser'i ±% çarpanıyla yapıyor; input ton değişkeni yok | Senaryo paneli bu planı tam karşılamıyor |
| **Birim değişken maliyet** | hammadde = `ton × 19.000 TL` gibi. Modül aylık sabit rakam bekliyor; birim × hacim formulü yok | Her senaryo için ayrı plan lazım (verimsiz) |
| **Makine parametresi** | kW, kapasite, DF — enerji doğrudan formulden geliyor. Modülde bu parametreler girilemiyor | Enerji el hesabıyla girilmek zorunda |
| **Darboğaz analizi** | Granül makinesi kapasitesi kısıt oluşturuyor — modülde üretim kısıtı kavramı yok | Görünürlük yok |
| **Başabaş tonu** | ton cinsinden başabaş hesabı. FastPlan'da var, DetailedPlan'da yok | OverviewPanel'e eklenebilir |

---

## İlgili Wiki Sayfaları

[[Moduller/DetailedPlan|DetailedPlan Modülü]]  
[[Kararlar/2026-05-DetailedPlan-Veri-Girisi|DetailedPlan Veri Girişi Kararları]]  
[[Kararlar/2026-05-GranulUretimi-Parametre|Granül Üretimi Parametreleri]] ← yeni sayfa (oluşturulacak)
