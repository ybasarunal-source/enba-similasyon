---
type: Malzeme
status: Taslak
tarih: 2026-05-28
tags: [malzeme, ldpe, film, geri-donusum, aglomer]
---

# LDPE (Alçak Yoğunluk Polietilen) Film ve Geri Dönüşüm Zorluklari

LDPE film; market poşetleri, endüstriyel şirink ambalajlar ve tarımsal sera örtüleri şeklinde geri dönüşüm tesislerine gelen, hafif ama yüzey alanı geniş bir plastik türüdür. Geri dönüşüm prosesi mekanik zorluklar ve yüksek enerji girdileriyle doludur.

---

## 1. Malzeme Karakteristiği ve Karşılaşılan Zorluklar

LDPE filmlerin hafif yapısı ve yüksek esnekliği, geri dönüşüm makinelerinde özel çözümler gerektirir.

### A. Yüksek Nem Tutma Kapasitesi (Moisture Retention)
Filmler yüzey alanlarının genişliği nedeniyle kırma ve yıkama sonrasında suyu bir sünger gibi tutar. Santrifüj kurutuculardan sonra bile nem oranı **%15 - %25** civarında kalabilir. 
*   *Çözüm:* Ekstrüzyondan önce malzemeyi sıkıştırıp suyunu sıkan **Sıkma Presleri (Squeezer)** veya kurutarak yoğunlaştıran **Aglomer (Aglomerasyon)** makineleri zorunludur. Nem oranı ekstrüzyon girişinde **< %2** seviyesine indirilmelidir, aksi takdirde nihai granülde gaz boşlukları (gözenekler) oluşur.

### B. Yoğunluk Tabanlı Ayrışma Sorunları
LDPE'nin yoğunluğu **0.91 - 0.94 g/cm³** arasındadır. Bu nedenle su üstünde yüzer. Ancak PP (Polipropilen) de yüzer. 
*   *Çözüm:* LDPE film hatlarında PP kontaminasyonunu ayırmak için gelişmiş hydrocyclone (hidrosiklon) sistemleri veya lazerli/optik renk-malzeme ayırıcılar (NIR sensörlü) kullanılır.

---

## 2. Proses ve Simülasyon Katsayıları (DetailedPlan Entegrasyonu)

Simülasyonda LDPE film işlenirken varsayılan olarak kullanılan fire ve enerji katsayıları:

| Proses Adımı / Parametre | Değer / Oran | Açıklama / Etki |
| :--- | :--- | :--- |
| **Tüketici Sonrası (Post-Consumer) Fire** | %30 - %45 | Belediye atıklarından gelen poşetlerde organik çamur, ıslaklık ve etiket yüksektir. |
| **Sanayi Kaynaklı (Post-Industrial) Fire** | %3 - %8 | Temiz fabrika şirink atıkları, minimum temizlik gerektirir. |
| **Su Tüketimi (Yıkama)** | 4.0 - 6.0 m³/ton | Geniş yüzey alanını çamurdan arındırmak için PET hattına göre %50 daha fazla su sirkülasyonu ve arıtma gerekir. |
| **Spesifik Elektrik Tüketimi** | 450 - 600 kWh/ton | Aglomer ısıtması ve çift aşamalı ekstrüzyon (gaz alma/vakum filtreli) nedeniyle elektrik tüketimi yüksektir. |

---

## 3. Ekipman Gereksinimleri

*   **Aglomer Makinesi:** Döner bıçaklarla malzemeyi sürtünme ısısıyla eritip yarı-yoğun granül (makarna/granül öncesi cips) haline getirir. Hem kurutma hem yoğunlaştırma işlevini tek makinede birleştirir.
*   **Lazer Filtre / Otomatik Eriyik Filtresi:** LDPE filmlerdeki erimeyen yabancı maddeleri (kağıt lifleri, ahşap parçaları, alüminyum folyolar) temizlemek için ekstrüder kafasında sürekli temizlenen disk filtreler kullanılır.

> [!TIP]
> **DetailedPlan Maliyet Modeli:** LDPE simülasyonunda "Lazer Filtre" kullanımı aktif edildiğinde, sarf malzeme maliyetlerine (filtre eleği / disk aşınması) ton başına ek bir işletme gideri yansıtılmalıdır.

---

## 4. İlişkili Sayfalar
*   [[Sektor-Rehberi]] - Genel proses akışı içindeki konumu
*   [[Hat1-Mekanik-Geri-Donusum]] - LDPE kırma ve mekanik işleme detayları
*   [[Hat2-Yikama-Hatti]] - Sulu film yıkama ve flotasyon tankı işletmesi
