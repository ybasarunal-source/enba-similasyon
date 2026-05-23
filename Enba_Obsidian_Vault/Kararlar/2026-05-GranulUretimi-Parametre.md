# Granül Üretimi — Sabit Parametreler

Kaynak: `is_plani_konusma.md` (21 iterasyon, 2026-05-23)  
Bu sayfa DetailedPlan wizard'ına veri girerken referans alınır.

---

## Proses

```
Hammadde → Kırma → Dikey Çırpma → Turbo Kurutma → Yatay Sıkma → Agromel → Granül → Çıktı
```

**Fire:** %15 (yarısı 2. kalite ürün, yarısı gerçek atık)

---

## Makineler

| Makine | Güç (kW) | Kapasite (ton/sa) | Not |
|--------|----------|-------------------|-----|
| Kırma | 45 | 2,0 | |
| Dikey çırpma | 15 | 0,6 | (başlangıçta 0,3 yazılmıştı, düzeltildi) |
| Turbo kurutma | 55 | 2,0 | |
| Yatay sıkma | 45 | 2,0 | (55 kVA = 45 kW aktif güç) |
| Agromel + Fan | 60 | 2,0 | (45+15 kW) |
| Granül | 150 | 0,3 | **DARBOĞAZ** — +4 sa/gün fazla mesaile 14 sa/gün çalışıyor |

**Talep faktörü (DF):** 0,60 (ihtiyatlı seçim; ilk elektrik faturasıyla kalibre edilecek)  
**Enerji fiyatı:** 5 TL/kWh

### Enerji hesabı (110 ton senaryosu)
```
Enerji (TL) = Σ [ kW × (geçen_ton / kapasite) × 0,60 × 5 ]
Granül için: net1kal ton kullanılır (giriş değil)
Diğerleri için: giriş ton kullanılır
```

---

## Giriş/Çıktı (110 ton senaryosu)

| Kalem | Değer |
|-------|-------|
| Giriş | 110 ton/ay |
| 1. kalite granül | 93,5 ton/ay |
| 2. kalite ürün | 8,25 ton/ay |
| Gerçek atık | 8,25 ton/ay |
| Çuval (1. kalite) | 63 adet/ay (1,5 ton/adet) |

---

## Fiyatlar

| Kalem | Birim Fiyat |
|-------|-------------|
| Hammadde alış | 19 TL/kg |
| 1. kalite granül satış | 40 TL/kg |
| 2. kalite ürün satış | 30 TL/kg |
| Çuval | 350 TL/adet |
| Atık su | 800 TL/giriş tonu |

---

## İşçilik

| Pozisyon | Kişi | Maaş (brüt) | Not |
|----------|------|-------------|-----|
| Ayrıştırma işçisi | 5 | 50.000 TL | ceil(giriş/20,8) — değişken |
| Granül ustası | 1 | 82.000 TL | sabit tüm senaryolarda |

**İşçi kapasitesi:** 80 kg/sa × 10,5 sa/gün × 26 gün = 21.840 kg = 21,8 ton/işçi/ay

---

## Sabit Giderler (Gider Merkezi)

| Kalem | Aylık (TL) | M-Kodu |
|-------|-----------|--------|
| Kira | 65.000 | M420 |
| Forklift kirası | 30.000 | M605 |
| Bakım-onarım | 30.000 | M509 |
| Muhasebe | 20.000 | M605 |
| Çevre mühendisliği | 18.000 | M529 |
| İnternet ve diğer | 5.000 | M999 |
| Elektrik mühendisi | 1.500 | M605 |
| **TOPLAM** | **169.500** | |

---

## Senaryo Özeti (Python motorundan)

| Senaryo | Giriş | Net Kâr (TL/ay) | Marj | Başabaş (ton) |
|---------|-------|-----------------|------|---------------|
| 30 ton | 30 t | — (zarar) | — | ~57 ton |
| 50 ton | 50 t | — (zarar) | — | ~57 ton |
| 70 ton | 70 t | yaklaşık başabaş | — | ~57 ton |
| 90 ton | 90 t | kârlı | — | ~57 ton |
| 110 ton | 110 t | en yüksek kâr | — | ~57 ton |

> Not: Gerçek sayılar Python motorunu çalıştırarak güncellenmeli.

---

## Önemli Kısıtlar

1. Amortisman dahil değil (makine yatırımı modele eklenmedi)
2. Vergi öncesi rakamlar
3. Finansman maliyeti yok
4. Fazla mesai ücreti ek hesaplanmadı (maaşa dahil sayıldı)
5. DF ilk fatura sonrası kalibre edilmeli

---

## İlgili Sayfalar

[[Moduller/DetailedPlan|DetailedPlan Modülü]]  
[[Ham-Kaynaklar/2026-05-GranulUretimi-IsPlan|Ham Kaynak — İş Planı Konuşması]]
