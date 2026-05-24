# Hurda Naylon Geri Dönüşüm Tesisi — İş Planı Geliştirme Konuşması

Bu dosya Claude ile yapılan iş planı geliştirme konuşmasının tam kaydıdır.
Claude Code'a context olarak verilmek üzere hazırlanmıştır.

---

## 1. İlk Tanım

**Kullanıcı:** Bir iş planı yapacağız. İşin özeti:
- Ayda 100 ton hurda naylon, %10 fire ile ayrıştırılacak
- Bir ayrıştırma işçisinin saatlik kapasitesi: 80 kg/sa
- İşçiler 10 saat çalışacak, ayda 26 gün
- Süreç adımları sırasıyla:
  1. Kırma makinesi: 45 kW, 2 ton/sa
  2. Dikey çırpma makinesi: 15 kW, 300 kg/sa (sonradan 600 kg/sa olarak düzeltildi)
  3. Turbo kurutma makinesi: 55 kW, 2 ton/sa
  4. Yatay sıkma makinesi: 55 kVA / 45 kW, 2 ton/sa
  5. Fan (15 kW) + Agromel makinesi (45 kW)
  6. Granül makinesi: toplam güç 150 kW, 300 kg/sa

---

## 2. Kapasite Hesapları ve Darboğaz Analizi

### İşçi başı kapasite
- 80 kg/sa × 10 sa/gün × 26 gün = **20.800 kg = 20,8 ton/ay/işçi**
- 100 ton için minimum **5 işçi** gerekir

### Makine kapasiteleri (ton/ay, 10 sa/gün × 26 gün)
| Makine | Güç | Kapasite | Aylık maks |
|--------|-----|----------|------------|
| Kırma | 45 kW | 2 ton/sa | 520 ton |
| Dikey çırpma | 15 kW | 600 kg/sa | 156 ton |
| Turbo kurutma | 55 kW | 2 ton/sa | 520 ton |
| Yatay sıkma | 45 kW | 2 ton/sa | 520 ton |
| Agromel+Fan | 60 kW | 2 ton/sa | 520 ton |
| Granül | 150 kW | 300 kg/sa | 78 ton — DARBOĞAZ |

### Darboğaz çözümü: Granül makinesi fazla mesai
- Hedef: 90 ton/ay net çıktı
- Çözüm: Granül makinesine **günde 4 saat fazla mesai**
- 300 kg/sa × 14 sa/gün × 26 gün = **109 ton/ay** — yeterli

---

## 3. Giriş Tonajı Güncellemeleri

### 110 tona çıkış
- Yeni net çıktı: 110 × 0,90 = **99 ton/ay**
- İşçi sorunu: 5 × 20,8 = 104 ton — yetersiz
- Çözüm: **5 işçiye 0,5 saat/gün fazla mesai**
  - 5 × 10,5 sa × 26 gün × 80 kg = 110,4 ton — yeterli
- Granül: 14 sa/gün (normal 10 + fazla mesai 4) → 109 ton/ay — yeterli

---

## 4. Enerji Hesabı Metodolojisi

### Yanlış yaklaşım (düzeltildi)
- İlk hesapta: kurulu güç × toplam çalışma saati = kWh — **HATALI**
- Sorun: Makineler sürekli tam yükte çalışmaz; her makine sadece üzerinden geçen malzeme kadar çalışır

### Doğru yaklaşım — Adım 1: Malzeme bazlı çalışma süresi
```
Çalışma süresi (sa) = Geçen malzeme (ton) / Kapasite (ton/sa)
Teorik kWh = Güç (kW) × Çalışma süresi (sa)
```

### Doğru yaklaşım — Adım 2: Talep faktörü (Demand Factor)
```
Gerçek kWh = Teorik kWh × DF
```

| Senaryo | Talep Faktörü |
|---------|--------------|
| Tam kapasite | 0,85–0,95 |
| Normal üretim | 0,60–0,75 |
| Kısmi üretim | 0,30–0,50 |
| Rölanti/bekleme | 0,10–0,20 |

**Karar: DF = 0,60** (ihtiyatlı/düşük tahmin olarak seçildi)

### Malzeme akışı
- Kırma, çırpma, kurutma, sıkma, agromel: **giriş tonu** üzerinden çalışır (fire bu aşamalardan sonra)
- Granül: **net çıktı tonu** üzerinden çalışır (fire düşüldükten sonra)

### Enerji hesabı formülü (tüm senaryolar için)
```python
enerji = 0
for kw, kap in makineler:
    ton = net1kal if makine == "granul" else giris
    enerji += kw * (ton / kap) * DF * KWH_FIYAT
```

---

## 5. İşçilik Maliyeti

| Pozisyon | Kişi sayısı | Kişi başı maliyet | Hesap |
|----------|-------------|-------------------|-------|
| Ayrıştırma işçisi | ceil(giriş_ton / 20.8) | 50.000 TL | değişken |
| Granül ustası | 1 (tüm senaryolarda sabit) | 82.000 TL | sabit |

**Senaryo bazlı işçilik:**
| Senaryo | İşçi | İşçilik Toplamı |
|---------|------|-----------------|
| 30 ton | 2 + 1 usta | 182.000 TL |
| 50 ton | 3 + 1 usta | 232.000 TL |
| 70 ton | 4 + 1 usta | 282.000 TL |
| 90 ton | 5 + 1 usta | 332.000 TL |
| 110 ton | 5 + 1 usta | 332.000 TL |

---

## 6. Sabit Giderler

| Kalem | Aylık Tutar |
|-------|-------------|
| Kira | 65.000 TL |
| Forklift kirası | 30.000 TL |
| Bakım-onarım | 30.000 TL |
| Muhasebe | 20.000 TL |
| Çevre mühendisliği hizmeti | 18.000 TL |
| İnternet ve diğer giderler | 5.000 TL |
| Elektrik mühendisi | 1.500 TL |
| **Toplam sabit** | **169.500 TL** |

---

## 7. Değişken Giderler

| Kalem | Formül |
|-------|--------|
| Hammadde | giriş_ton × 1000 × 19 TL |
| Enerji | makine bazlı hesap, DF=0,60 |
| Atık su | giriş_ton × 800 TL (50 ton için 40.000 TL baz alındı) |
| Çuval | ceil(net1kal / 1,5) × 350 TL |

---

## 8. Gelir Yapısı

### Fire oranı değişimi
- Başlangıç: %10 fire, tamamı atık
- Güncelleme: **%15 fire**, yarısı 2. kalite ürün olarak satılır

### Gelir formülleri
```python
net1kal  = giris * (1 - 0.15)       # 1. kalite granül (ton)
net2kal  = giris * 0.15 / 2         # 2. kalite ürün (ton)
fire_atik = giris * 0.15 / 2        # gerçek atık (ton)

gelir_1kal = net1kal * 1000 * 40    # TL
gelir_2kal = net2kal * 1000 * 30    # TL
toplam_gelir = gelir_1kal + gelir_2kal
```

### Çuval bilgisi
- Her çuval: 1,5 ton kapasiteli
- Çuval fiyatı: 350 TL/adet
- Sadece 1. kalite granül çuvalla satılır
- `cuval_adet = ceil(net1kal / 1.5)`

---

## 9. Başabaş Analizi

### Başabaş fiyatı (TL/kg)
```python
basabas_fiyati = toplam_gider / ((net1kal + net2kal) * 1000)
```

### Başabaş tonajı
```python
gelir_per_ton  = (1 - FIRE) * 1000 * 40 + (FIRE/2) * 1000 * 30
cuval_per_ton  = (1 / 1.5) * 350
enerji_per_ton = sum(kw * (1/kap) * 0.60 * 5 for each makine)
degisken_per_ton = 19*1000 + enerji_per_ton + 800 + cuval_per_ton
katki_payi     = gelir_per_ton - degisken_per_ton
sabit_gercek   = iscilik + 169500 + atiksu
basabas_ton    = ceil(sabit_gercek / katki_payi)
guvenlik_tamponu = giris_ton - basabas_ton
```

---

## 10. Senaryo Listesi

5 senaryo karşılaştırılmıştır: **30, 50, 70, 90, 110 ton**

Her senaryo için hesaplanan çıktılar:
- Giriş tonu
- 1. kalite granül (ton)
- 2. kalite ürün (ton)
- Gerçek fire/atık (ton)
- Çuval adedi
- İşçi sayısı
- Hammadde maliyeti (TL)
- Enerji maliyeti (TL)
- Çuval maliyeti (TL)
- İşçilik maliyeti (TL)
- Sabit + atık su (TL)
- Toplam gider (TL)
- Gelir 1. kalite (TL)
- Gelir 2. kalite (TL)
- Toplam gelir (TL)
- **Net kâr (TL/ay)**
- Net marj (%)
- Başabaş fiyatı (TL/kg)
- **Başabaş tonajı (ton)**
- Güvenlik tamponu (ton)

---

## 11. Karar ve İterasyon Geçmişi

| Adım | Değişiklik | Neden |
|------|-----------|-------|
| 1 | İlk proses tanımı: 100 ton, %10 fire | başlangıç |
| 2 | Dikey çırpma düzeltildi: 300 → 600 kg/sa | kullanıcı yanlış yazmış |
| 3 | Granül kapasitesi: 300 kg/sa darboğaz tespiti | hesap sonucu |
| 4 | Granül: +4 sa/gün fazla mesai ile darboğaz çözüldü | kullanıcı kararı |
| 5 | Giriş 110 tona çıktı | kullanıcı kararı |
| 6 | Ayrıştırma: 6. işçi yerine +0,5 sa fazla mesai tercih edildi | kullanıcı kararı |
| 7 | Enerji hesabı: kurulu güç yerine malzeme bazlı hesap | kullanıcı düzeltmesi |
| 8 | Talep faktörü (DF) eklendi | kullanıcı talebi |
| 9 | DF = 0,60 seçildi (ihtiyatlı tahmin) | kullanıcı seçimi |
| 10 | İşçilik eklendi: 5×50K + 1×82K | kullanıcı bilgisi |
| 11 | Hammadde 19 TL/kg, satış 40 TL/kg girildi | kullanıcı bilgisi |
| 12 | Sabit giderler eklendi | kullanıcı bilgisi |
| 13 | Atık su: sabit 40K → değişken 800 TL/ton (50 ton baz) | kullanıcı düzeltmesi |
| 14 | Fire %10 → %15, yarısı 2. kalite (30 TL/kg) | kullanıcı kararı |
| 15 | 4 senaryo: 50, 70, 90, 110 ton | kullanıcı talebi |
| 16 | Başabaş tonajı eklendi | kullanıcı talebi |
| 17 | 30 ton senaryosu eklendi | kullanıcı talebi |
| 18 | Yıllık kâr satırı kaldırıldı, sadece aylık | kullanıcı düzeltmesi |
| 19 | İnternet/diğer: 5.000 TL eklendi | kullanıcı bilgisi |
| 20 | Çuval: 1,5 ton/adet, 350 TL (değişken gider) | kullanıcı bilgisi |
| 21 | Elektrik mühendisi: 1.500 TL/ay eklendi | kullanıcı bilgisi |

---

## 12. Tam Hesap Motoru (Python)

```python
import math

# PARAMETRELER
FIYAT_ALIS  = 19        # TL/kg
FIYAT_1KAL  = 40        # TL/kg  (1. kalite granül)
FIYAT_2KAL  = 30        # TL/kg  (2. kalite ürün)
FIRE        = 0.15      # fire oranı
DF          = 0.60      # talep faktörü
KWH_FIYAT   = 5         # TL/kWh
SABIT_DIGER = 169500    # TL/ay (atık su hariç)
ATIKSU_TON  = 800       # TL/ton giriş
CUVAL_KAP   = 1.5       # ton/adet
CUVAL_FIYAT = 350       # TL/adet

# (ad, kW, ton/sa)
MAKINELER = [
    ("Kirma",         45,  2.0),
    ("Dikey cirpma",  15,  0.6),
    ("Turbo kurutma", 55,  2.0),
    ("Yatay sikma",   45,  2.0),
    ("Agromel+Fan",   60,  2.0),
    ("Granul",        150, 0.3),
]

def hesapla(giris):
    fireToplam   = giris * FIRE
    net1kal      = giris - fireToplam        # 1. kalite granül
    net2kal      = fireToplam / 2            # 2. kalite ürün
    fireAtik     = fireToplam / 2            # gerçek atık

    cuvalAdet    = math.ceil(net1kal / CUVAL_KAP)
    cuvalMaliyet = cuvalAdet * CUVAL_FIYAT

    hammadde     = giris * 1000 * FIYAT_ALIS
    gelir1kal    = net1kal * 1000 * FIYAT_1KAL
    gelir2kal    = net2kal * 1000 * FIYAT_2KAL
    toplamGelir  = gelir1kal + gelir2kal

    atiksu       = giris * ATIKSU_TON
    sabit        = SABIT_DIGER + atiksu

    # Enerji: her makine geçen malzeme kadar çalışır
    enerji = 0
    for ad, kw, kap in MAKINELER:
        ton = net1kal if ad == "Granul" else giris
        enerji += kw * (ton / kap) * DF * KWH_FIYAT

    iscilSayi    = math.ceil(giris / 20.8)
    iscil        = iscilSayi * 50000 + 82000

    toplamGider  = hammadde + enerji + iscil + sabit + cuvalMaliyet
    kar          = toplamGelir - toplamGider
    marj         = kar / toplamGelir * 100
    bbasFiyat    = toplamGider / ((net1kal + net2kal) * 1000)

    # Başabaş tonajı
    enerjiPT  = sum(kw * (1/kap) * DF * KWH_FIYAT for _, kw, kap in MAKINELER)
    gelirPT   = (1-FIRE)*1000*FIYAT_1KAL + (FIRE/2)*1000*FIYAT_2KAL
    cuvalPT   = (1/CUVAL_KAP) * CUVAL_FIYAT
    degPT     = FIYAT_ALIS*1000 + enerjiPT + ATIKSU_TON + cuvalPT
    katki     = gelirPT - degPT
    sabitG    = iscil + SABIT_DIGER + atiksu
    bb        = math.ceil((sabitG / katki) * 10) / 10 if katki > 0 else None

    return {
        "giris": giris,
        "net1kal": round(net1kal, 1),
        "net2kal": round(net2kal, 1),
        "fireAtik": round(fireAtik, 1),
        "cuvalAdet": cuvalAdet,
        "cuvalMaliyet": round(cuvalMaliyet),
        "hammadde": round(hammadde),
        "enerji": round(enerji),
        "iscil": iscil,
        "iscilSayi": iscilSayi,
        "atiksu": round(atiksu),
        "sabit": round(sabit),
        "gelir1kal": round(gelir1kal),
        "gelir2kal": round(gelir2kal),
        "toplamGelir": round(toplamGelir),
        "toplamGider": round(toplamGider),
        "kar": round(kar),
        "marj": round(marj, 1),
        "bbasFiyat": round(bbasFiyat, 2),
        "basabasTon": bb,
        "guvenlik": round(giris - bb, 1) if bb else None,
    }

# Çalıştır
for ton in [30, 50, 70, 90, 110]:
    s = hesapla(ton)
    print(f"{ton:3d} ton -> Kar: {s['kar']:>12,} TL/ay | "
          f"Marj: %{s['marj']:>5} | Basabas: {s['basabasTon']} ton")
```

---

## 13. Proses Akış Şeması

```
Hammadde girisi (110 ton/ay, %15 fire)
        |
        v
1. AYRISTIRMA (manuel)
   5 isci x 10,5 sa/gun x 26 gun x 80 kg = 110,4 ton/ay
        |
        v
2. KIRMA MAKINESI
   45 kW | 2 ton/sa | 520 ton/ay kapasite
        |
        v
3. DIKEY CIRPMA MAKINESI
   15 kW | 600 kg/sa | 156 ton/ay kapasite
        |
        v
4. TURBO KURUTMA MAKINESI
   55 kW | 2 ton/sa | 520 ton/ay kapasite
        |
        v
5. YATAY SIKMA MAKINESI
   55 kVA / 45 kW | 2 ton/sa | 520 ton/ay
        |
        v
6. FAN (15 kW) + AGROMEL (45 kW)
   Nem giderme | 60 kW toplam
        |
   [%15 fire buradan sonra dusulur]
   -> 93,5 ton 1. kalite
   -> 8,25 ton 2. kalite
   -> 8,25 ton atik
        |
        v
7. GRANUL MAKINESI
   150 kW | 300 kg/sa
   14 sa/gun (10 normal + 4 fazla mesai)
   109 ton/ay kapasite
        |
        v
CIKTI:
  1. kalite granul : 93,5 ton/ay @ 40 TL/kg = 3.740.000 TL
  2. kalite urun   : 8,25 ton/ay @ 30 TL/kg = 247.500 TL
  Gercek atik      : 8,25 ton/ay
  Toplam gelir     : 3.987.500 TL/ay (110 ton senaryosu)
```

---

## 14. Önemli Notlar ve Kısıtlar

1. **Amortisman dahil değil** — makine yatırım maliyetleri henüz modele eklenmedi
2. **Vergi dahil değil** — net kâr vergi öncesi rakamdır
3. **Finansman maliyeti dahil değil** — kredi faizi veya özkaynak maliyeti yok
4. **Fazla mesai ücreti** — 0,5 sa/gün ayrıştırma fazla mesaisi maaşa dahil sayılmış, ayrıca hesaplanmamış
5. **DF gerçek fatura ile kalibre edilmeli** — 0,60 ihtiyatlı tahmin, ilk elektrik faturası gelince güncellenmeli
6. **Başabaş tonajı işçilik basamaklarından etkilenir** — işçi sayısı değiştiğinde başabaş tonajı sıçrama yapar

---

*Dosya sonu. Bu konusma Claude Code ile iş planını gelistirmek, yeni senaryolar eklemek veya mevcut parametreleri güncellemek icin kullanilabilir.*
