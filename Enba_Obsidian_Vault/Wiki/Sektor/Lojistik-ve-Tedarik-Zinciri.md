---
type: Sektor
status: Taslak
tarih: 2026-05-28
tags: [sektor, lojistik, nakliye, balyalama, dökme-yoğunluk, tedarik-zinciri]
---

# Lojistik ve Tedarik Zinciri Optimizasyonu

Geri dönüşüm sektöründe lojistik, hammadde birim maliyetinin en büyük bileşenlerinden biridir. Plastik ve kağıt atıkların dökme yoğunluklarının (bulk density) düşük olması, nakliyeyi yüksek hacimli ama düşük tonajlı hale getirerek kar marjını tehdit eder.

---

## 1. Dökme Yoğunluğu ve Taşıma Verimliliği İlişkisi

Aynı nakliye tırının (ortalama 80 m³ hacim ve 24 ton yasal yük sınırı) farklı hammadde formlarında taşıyabildiği maksimum tonajlar lojistik verimliliği gösterir:

| Malzeme Durumu | Dökme Yoğunluğu (kg/m³) | Tır Başına Taşıma Tonajı | Nakliye Maliyeti Katsayısı |
| :--- | :--- | :--- | :--- |
| **Gevşek PET Şişe / Poşet** | 20 - 35 kg/m³ | 1.6 - 2.8 Ton | **Çok Yüksek (Verimsiz)** |
| **Kırılmış Çapak (Flake)** | 250 - 350 kg/m³ | 20 - 24 Ton (Yasal limit) | **Normal / Optimal** |
| **Balyalanmış Atık** | 300 - 450 kg/m³ | 24 Ton (Tam Kapasite) | **Optimal / Düşük** |
| **Granül (Pelet)** | 550 - 650 kg/m³ | 24 Ton (Tam Kapasite) | **Çok Düşük** |

> [!WARNING]
> **Lojistik Çıkmazı:** Balyalanmamış (gevşek) hurda poşet veya şişeyi 100 km'den uzak bir mesafeden taşımak, tırın sadece hacmen dolup tonaj yapamaması nedeniyle navlun maliyetini hammadde değerinin üzerine çıkarır. Bu yüzden gevşek malzeme alım yarıçapı maksimum **50 - 70 km** ile sınırlandırılmalıdır.

---

## 2. Tedarik Zinciri ve Tersine Lojistik (Reverse Logistics)

Geri dönüşüm tedarik zinciri klasik tedarikten farklı olarak doğrusal değil, döngüseldir:

1.  **Kaynak Noktaları:** OSB fabrikaları (endüstriyel atık), belediyeler (evsel atık) ve lisanslı toplama-ayırma tesisleri (TAT).
2.  **Tersine Lojistik:** Boş konteyner bırakma, dolduğunda çekme sistemi. Bu sistemde rotalama optimizasyonu (yakıt tüketimini azaltmak için) kritik maliyet kalemidir.
3.  **Tedarikçi Kalite Puanlama (Supplier Grading):** Gelen her lotun içindeki fire ve nem oranına göre tedarikçinin lojistik verimlilik skoru hesaplanır. Fire oranı %30 olan bir tedarikçiden mal taşırken, tırın %30'u çöp taşımak için kiralanmış olur.

---

## 3. Yazılım Entegrasyonu (DetailedPlan Lojistik Modülü)

Enba Simülasyon, DetailedPlan satın alma reçetelerinde lojistik maliyetlerini dinamik hesaplar:
*   **Navlun Formülü:** Reçetedeki her tedarikçi için mesafe (km) ve birim navlun fiyatı (₺/ton-km) tanımlanır. Nakliye maliyeti hammadde maliyetinin üzerine **"Landed Cost" (Kapıya Teslim Maliyet)** olarak eklenir.
*   **Balya Presi Yatırım Analizi (CAPEX):** Toplama merkezlerine kurulacak bir balya presi yatırımının nakliye maliyetlerinde sağlayacağı tasarruf (gevşek tır navlunu vs balyalı tır navlunu farkı) üzerinden geri ödeme süresi simüle edilir.

---

## 4. İlişkili Sayfalar
*   [[Hat5-Balyalama-Sevkiyat]] - Balyalama yoğunluğu standartları
*   [[PET-Capak-Dinamikleri]] - Çapak taşıma hacimleri
*   [[Kirleticiler-ve-Kalite-Kontrol-Taksonomisi]] - Çöp taşımaktan kaynaklanan lojistik fireleri
