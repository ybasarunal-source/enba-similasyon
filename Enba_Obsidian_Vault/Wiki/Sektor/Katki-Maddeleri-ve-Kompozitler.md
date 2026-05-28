---
type: Sektor
status: Taslak
tarih: 2026-05-28
tags: [sektor, katki-maddeleri, kompaund, kalsit, antioksidan, masterbatch, recete]
---

# Katkı Maddeleri ve Kompozit Formülasyonlar (Compounding)

Geri dönüştürülmüş plastikler (özellikle tüketici sonrası atıklardan elde edilenler), zincir kırılmaları ve kirlilik nedeniyle orijinal (virgin) plastiklere göre daha düşük mekanik özelliklere sahiptir. Nihai granülün pazar değerini artırmak ve endüstriyel standartlara ulaştırmak için ekstrüzyon aşamasında **katkı maddeleri (additives)** ile kompozit formülasyonlar (compounding) hazırlanır.

---

## 1. Yaygın Kullanılan Katkı Maddeleri ve İşlevleri

Ekstrüzyon (granül) makinesinde reçeteye dahil edilen başlıca kimyasal ve mineral katkılar:

| Katkı Adı | İşlevi / Avantajı | Reçete Oranı (%) | Maliyet Etkisi |
| :--- | :--- | :--- | :--- |
| **Kalsit (Kalsiyum Karbonat - CaCO₃)** | Maliyeti düşürür, rijitliği (sertlik) artırır, büzülmeyi (shrinkage) azaltır. | %5 - %40 | **Düşürür** (Kalsit fiyatta plastikten ucuzdur) |
| **Darbe Dayanımı Artırıcılar** | rPP veya rPE'nin kırılganlığını azaltır, darbe emilim gücünü yükseltir. | %2 - %8 | **Artırır** (Yüksek birim fiyatlı elastomerler) |
| **Antioksidanlar (Isı Stabilizatörleri)** | Ekstrüzyondaki yüksek ısıda polimerin yanmasını, sararmasını ve zincir kopmasını önler. | %0.1 - %0.5 | **Nötr / Hafif Artış** |
| **UV Stabilizatörleri** | Dış mekanda kullanılacak plastiklerin güneş ışığı altında solmasını ve ufalanmasını engeller. | %0.5 - %1.5 | **Artırır** |
| **Masterbatch (Pigment/Boya)** | Koyu renkli veya şeffaf olmayan granülleri istenen renge boyar (siyah, gri, yeşil). | %1.0 - %3.0 | **Artırır** |

> [!CAUTION]
> **Aşırı Kalsit Kullanımı Riski:** Reçetede kalsit oranı %30'un üzerine çıktığında granülün özgül ağırlığı artar (ürün ağırlaşır) ancak elastikiyeti düşer, plastik çok kırılgan hale gelir. Ayrıca yüksek kalsit, ekstrüder vidasının aşınmasını hızlandırır.

---

## 2. Kompaund (Compounding) Proses Gereksinimleri

Katkı maddelerinin polimer matrisi içinde homojen bir şekilde dağılabilmesi için standart tek vidalı (single screw) ekstrüderler yerine **Çift Vidalı Ekstrüderler (Co-rotating Twin Screw Extruder)** tercih edilmelidir:
*   Çift vidalı sistemler yüksek yoğurma (kneading) ve karıştırma kabiliyetine sahiptir.
*   Yan besleyiciler (side-feeders) vasıtasıyla mineraller (kalsit, cam elyafı) doğrudan eriyik bölgesine enjekte edilerek vida aşınması minimuma indirilir.

---

## 3. Yazılım Entegrasyonu (DetailedPlan Reçete Yönetimi)

Enba Simülasyon, DetailedPlan modülünde katkı formülasyonlarını dinamik olarak maliyetlendirir ve optimize eder:
*   **Reçete Maliyet Motoru:** Kullanıcı granül reçetesine katkılar ekledikçe (örn: %75 rPP çapak, %20 Kalsit, %3 Elastomer, %2 Masterbatch), her katkının birim fiyatı (₺/kg) üzerinden toplam hammadde maliyeti hesaplanır.
*   **Katkı Payı ve Marj Analizi:** Kalsit oranı artırılarak hammadde birim maliyeti düşürülebilir, ancak bu durumun satış fiyatında yaratacağı olası kalite düşüşü iskontoları simülasyon ekranında duyarlılık analiziyle gösterilir.

---

## 4. İlişkili Sayfalar
*   [[HDPE-Yuksek-Yogunluk-Polietilen-Dinamikleri]] - Şişirme ve enjeksiyon sınıflarında katkı yönetimi
*   [[PP-Polipropilen-ve-Koku-Sorunu]] - Koku giderme katkıları ve masterbatch kullanımı
*   [[Tesis-Bakim-ve-Asinma-Dinamikleri]] - Kalsit dolgusunun vida/kovan ömrüne aşındırıcı etkisi
