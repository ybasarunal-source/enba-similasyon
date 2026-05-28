---
type: Sektor
status: Taslak
tarih: 2026-05-28
tags: [sektor, kalite-kontrol, kirleticiler, pvc, stickies, testler]
---

# Kirleticiler ve Kalite Kontrol Taksonomisi

Geri dönüşüm tesislerinde proses verimliliğinin ve ürün kalitesinin en büyük düşmanı kirleticilerdir (contaminants). Satın alınan hammaddelerin içindeki yabancı maddelerin sınıflandırılması ve ppm (milyonda bir) düzeyinde kontrolü, finansal kayıpları önlemenin tek yoludur.

---

## 1. Kritik Kirletici Taksonomisi ve Tolerans Sınırları

Farklı malzeme türleri için geri dönüşüm kalitesini bozan temel kirleticiler ve kabul edilebilir maksimum limitleri:

| Kirletici Adı | Etkilediği Malzeme | Neden Zararlı? | Maksimum Tolerans |
| :--- | :--- | :--- | :--- |
| **PVC (Polivinil Klorür)** | PET / Polyester | 200°C işleme sıcaklığında HCl asit salgılar, makineleri çürütür, PET lif yapısını bozar. | < 20 - 50 ppm (Gıda kalitesi için < 10 ppm) |
| **Stickies (Tutkal/Yapışkan)** | Kağıt / Karton | Kurutma silindirlerine yapışır, kağıdın kopmasına ve makinenin durmasına yol açar. | %1.0 - %1.5 (Ağırlıkça) |
| **PP / PE Karışımı** | PE / PP (Sert Plastik) | Birbirleriyle tam karışmayan polimerlerdir. Mekanik dayanımı ve darbe direncini ciddi oranda düşürür. | < %3.0 - %5.0 |
| **Nem (Moisture)** | Tüm Malzemeler | Plastikte ekstrüderde gaz kabarcığı ve gözenek yapar. Kağıtta çürümeye ve tonaj hilelerine yol açar. | Plastikte < %1.0, Kağıtta referans %10.0 |
| **Metaller ve Cam** | Tüm Prosesler | Kırıcı bıçaklarını köreltir, ekstrüder vidalarını ve kovanlarını çizer. | %0.0 (Kesinlikle bulunmamalıdır) |

---

## 2. Kalite Kontrol Test Yöntemleri

Tesis girişinde ve çıkışında uygulanan temel laboratuvar testleri:

*   **FTIR Spektroskopisi (Kızılötesi Analiz):** Polimer türünü (PET, PP, HDPE) ve saflık derecesini saniyeler içinde belirlemek için kullanılır.
*   **Yoğunluk (Yüzdürme) Testi:** Malzemenin su (yoğunluk 1.0) veya alkol/tuzlu su karışımları içindeki yüzme/batma davranışına göre sınıf ayrımı yapılması.
*   **Nem Tayin Cihazı (Moisture Analyzer):** Balyalardan alınan numunelerin yüksek ısı altında kurutularak nem kaybının hassas tartılması.
*   **Kül Testi (Ash Test):** Malzemenin fırında 600°C'de yakılarak içindeki kalsiyum karbonat (kalsit) gibi inorganik dolgu maddelerinin oranının bulunması.

> [!WARNING]
> **Kalsit Kontaminasyonu:** Özellikle poşet (LDPE) geri dönüşümünde hammadde tedarikçileri ağırlığı artırmak için kalsit dolgulu plastikler kullanır. Yüksek kalsit oranı nihai granülün esnekliğini bozar. %5'in üzerindeki kül oranı alım fiyatında iskonto sebebidir.

---

## 3. Yazılım Entegrasyonu (DetailedPlan Satın Alma Modülü)

Enba Simülasyon satın alma sihirbazında hammadde giriş kalitesi tanımlanırken kirletici oranları girilir:
*   **Otomatik İskonto Hesaplama:** Girilen nem oranı referans değerin (%10 kağıt için, %1-2 plastik için) üzerindeyse, fatura tonajından nem fazlalığı kadar ağırlık doğrudan düşülür (Nem İskontosu).
*   **Fire Çarpanı:** Kirletici oranı yüksek olan lotların fire katsayısı simülasyon motorunda dinamik olarak artırılır, böylece nihai granül maliyeti gerçekçi hesaplanır.

---

## 4. İlişkili Sayfalar
*   [[PET-Capak-Dinamikleri]] - PVC kirleticisi detayları
*   [[OCC-ve-Kagit-Geri-Donusum-Prosesleri]] - Yapışkan (stickies) ve kağıt nem yönetimi
*   [[GRS-ve-Gida-Mevzuatlari]] - Gıda temaslı rPET için metal ve PVC limitleri
