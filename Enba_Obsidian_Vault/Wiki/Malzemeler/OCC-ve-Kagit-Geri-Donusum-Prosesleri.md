---
type: Malzeme
status: Taslak
tarih: 2026-05-28
tags: [malzeme, kagit, karton, occ, pulper, lif-geri-kazanim]
---

# OCC (Eski Oluklu Mukavva) ve Kağıt/Karton Geri Dönüşüm Prosesleri

Eski Oluklu Mukavva (OCC - Old Corrugated Containers) ve karışık hurda kağıtlar, kağıt geri dönüşüm sektörünün temel hammaddeleridir. Süreç, plastiğin mekanik eriyik mantığından tamamen farklı olarak **sulu süspansiyon (pulper)** ve **selüloz lifi kazanımı** kimyasına dayanır.

---

## 1. Pulper (Lif Çözücü) ve Hamur Hazırlama Aşaması

Geri dönüşümün ilk adımı, kuru haldeki kağıt balyalarının suyla karıştırılarak liflerine ayrıştırılmasıdır.

*   **Dikey / Yatay Pulper:** Kağıt balyaları büyük mikser benzeri kazanlara (pulper) atılır. Yüksek devirli rotorun oluşturduğu mekanik kesme kuvveti ve suyun etkisiyle kağıtlar hamur haline (slurry) getirilir.
*   **Pulper Kimyası:** Liflerin şişmesini hızlandırmak ve mürekkepleri ayırmak için suya sodyum hidroksit (NaOH - kaustik soda) ve ıslatıcı kimyasallar dozajlanabilir (pH 8.5 - 9.5 seviyesinde tutulur).

---

## 2. Temizleme, Eleme ve "Stickies" (Yapışkan) Krizi

Hamur haline gelen selüloz liflerinin içindeki yabancı maddelerin elenmesi çok kademeli bir filtrasyon gerektirir:

1.  **Ağır Kirletici Temizleyiciler (High Density Cleaners):** Santrifüj kuvveti kullanarak kum, tel, zımba teli ve cam gibi yoğunluğu yüksek maddeleri dipten tahliye eder.
2.  **Basınçlı Elekler (Screening):** Hamur, mikro delikli veya ince yarıklı elek filtrelerden geçirilerek kağıt dışı hafif plastikler ve filmler ayrıştırılır.
3.  **Stickies (Yapışkanlar) Tehlikesi:** Koli bantları, etiket yapıştırıcıları ve tutkallar (hot-melt) eleklerden geçerek bitmiş kağıt üzerinde yapışkan lekeler oluşturur. Bu yapışkanlar kağıt makinesinin silindirlerine yapışarak kağıt kopmalarına ve duruşlara neden olur. 

---

## 3. Lif Kısalması ve Karışım Oranları (Fiber Degradation)

Selüloz lifleri sonsuz kez geri dönüştürülemez. 
*   Her geri dönüşüm çevriminde lif boyu kısalır, esnekliğini kaybeder ve yırtılma direnci düşer (bir lif ortalama **5 - 7 kez** geri dönüştürülebilir).
*   **Mukavemet Yönetimi:** Yüksek kaliteli oluklu mukavva (testliner/fluting) üretebilmek için geri kazanılmış hamura belirli oranda orijinal (virgin) kraft selülozu veya uzun lifli iğne yapraklı ağaç hamuru eklenmesi gerekir.

> [!IMPORTANT]
> **DetailedPlan Reçete Entegrasyonu:** Kağıt simülasyon modelinde hedeflenen kağıt mukavemet değerine göre reçetedeki **% Orijinal Selüloz** oranı arttıkça, hammadde maliyeti doğrusal olarak yükselmektedir.

---

## 4. Proses ve Simülasyon Katsayıları (DetailedPlan Entegrasyonu)

Kağıt geri dönüşüm tesisleri yüksek miktarda su ve kurutma enerjisi harcar.

| Parametre | Ortalama Değer | Detay / Etki |
| :--- | :--- | :--- |
| **Toplam Malzeme Verimi** | %82 - %88 | OCC içindeki zımbalar, plastik bantlar ve pulper altı çamurlar fire oluşturur. |
| **Su Tüketimi (Taze Su)** | 3.0 - 5.0 m³/ton | Su kapalı devre sirküle edilse de elyafların yıkanması ve temizlik için taze su girdisi şarttır. |
| **Spesifik Elektrik Tüketimi** | 180 - 250 kWh/ton | Pulper rotorları, vakum pompaları ve hamur pompaları yüksek elektrik çeker. |
| **Doğalgaz / Buhar Tüketimi** | 1.2 - 1.8 Gcal/ton | Kağıt hamurunun kurutma silindirlerinde kurutulması için yoğun buhar (doğalgaz kazanından) harcanır. |

---

## 5. İlişkili Sayfalar
*   [[EN643-Kagit-Standartlari]] - Kabul edilebilir yabancı madde ve nem sınıfları
*   [[Sektor-Rehberi]] - Tesis akış şemasında lif hazırlama (stock preparation) bölümü
*   [[Hat5-Balyalama-Sevkiyat]] - Balyalanmış hurda kağıdın nem firesi ölçümü
