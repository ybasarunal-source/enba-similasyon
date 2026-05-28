---
type: Sektor
status: Taslak
tarih: 2026-05-28
tags: [sektor, enerji, elektrik, karbon-ayak-izi, co2-tasarruf, yesil-mutabakat]
---

# Enerji Yönetimi ve Karbon Ayak İzi

Geri dönüşüm sektörü, çevresel fayda sağlarken yüksek miktarda elektrik ve kurutma ısısı tüketen enerji-yoğun bir sanayi dalıdır. Enerji maliyetlerinin yönetilmesi ve üretilen r-Polimerlerin karbon ayak izinin belgelenmesi, sürdürülebilirliğin ticari olarak kanıtlanmasını sağlar.

---

## 1. Spesifik Enerji Tüketimi (SEC - Specific Energy Consumption)

Tesislerde ton başına harcanan elektrik enerjisi (SEC), işletme karlılığının en büyük değişkenlerinden biridir. Tipik mekanik geri dönüşüm adımlarında SEC dağılımı:

| Proses İstasyonu | Ortalama Elektrik (kWh/ton) | Kritik Tüketim Elemanları |
| :--- | :--- | :--- |
| **Kırma & Yıkama** | 120 - 180 kWh | Kırma motorları, friksiyon yıkayıcılar, santrifüj kurutucular |
| **Sıkma & Aglomer** | 100 - 200 kWh | Sıkma presi hidrolikleri, aglomer bıçak motorları (sürtünme ısısı için) |
| **Ekstrüzyon (Granül)** | 250 - 350 kWh | Vida tahrik motoru (inverter), kovan rezistans ısıtıcıları, vakum pompaları |
| **Koku Giderme Siloları** | 80 - 120 kWh | Sıcak hava üfleme fanları, rezistanslı hava ısıtıcıları |
| **Atıksu Arıtma** | 10 - 25 kWh | Çamur pompaları, havalandırma blowerları, kimyasal dozaj pompaları |

> [!TIP]
> **Enerji Tasarrufu Stratejisi:** Ekstrüder kovanlarında **seramik rezistans yalıtım ceketleri** kullanılması, kovan ısı kaybını azaltarak ekstrüzyon aşamasında **%15 - %20** civarında net elektrik tasarrufu sağlar.

---

## 2. Karbon Ayak İzi ve CO₂ Emisyon Tasarruf Modeli

Avrupa Yeşil Mutabakatı (Green Deal) ve Sınırda Karbon Düzenleme Mekanizması (CBAM) uyarınca, üretilen geri dönüştürülmüş malzemenin CO2 salınım avantajını hesaplamak zorunlu hale gelmektedir.

### Orijinal (Virgin) vs. Geri Dönüştürülmüş Polimer Karşılaştırması:
Geri dönüştürülmüş polimer üretimi, orijinal polimer petrokimya üretimine kıyasla ciddi bir emisyon avantajı sağlar:

*   **Orijinal PET (Virgin):** ~2.15 kg CO₂ / kg polimer
*   **Geri Dönüştürülmüş rPET:** ~0.45 kg CO₂ / kg polimer (Yaklaşık **%79 Tasarruf**)
*   **Orijinal HDPE (Virgin):** ~1.80 kg CO₂ / kg polimer
*   **Geri Dönüştürülmüş rHDPE:** ~0.35 kg CO₂ / kg polimer (Yaklaşık **%80 Tasarruf**)

### Emisyon Sınıfları (Scope 1, 2, 3):
1.  **Scope 1 (Doğrudan):** Sıcak yıkama ve kurutma için yakılan doğalgazdan kaynaklanan doğrudan emisyonlar.
2.  **Scope 2 (Dolaylı):** Şebekeden çekilen elektrik tüketiminin karbon çarpanı (Türkiye şebekesi ortalama ~0.42 kg CO₂ / kWh).
3.  **Scope 3 (Tedarik Zinciri):** Hurda balyaların tesise nakliyesi ve son ürünün sevkiyatı sırasında oluşan karbon salınımı.

---

## 3. Yazılım Entegrasyonu (DetailedPlan Raporlama Modülü)

Enba Simülasyon, bütçelenen üretim planlarına paralel olarak otomatik bir **Karbon Tasarrufu ve Enerji Raporu** üretir:
*   **CO₂ Offset Hesaplayıcı:** Üretilen toplam rPET/rPE miktarı ile orijinal hammadde emisyon farkı çarpılarak tesisin engellediği karbon salınımı ton cinsinden hesaplanır (örn: *"Bu bütçe döneminde 1.200 ton karbon salınımı engellenmiştir"*).
*   **Bütçe Karşılaştırma:** Elektrik faturaları ile DetailedPlan'deki bütçelenmiş kWh tüketimleri karşılaştırılarak elektrik birim fiyat dalgalanmalarının EBITDA üzerindeki duyarlılığı ölçülür.

---

## 4. İlişkili Sayfalar
*   [[PET-Capak-Dinamikleri]] - SSP reaktörü enerji yoğunluğu
*   [[PP-Polipropilen-ve-Koku-Sorunu]] - Koku giderme silolarının elektrik tüketimi
*   [[OCC-ve-Kagit-Geri-Donusum-Prosesleri]] - Kağıt kurutmadaki doğalgaz/buhar kullanımı
