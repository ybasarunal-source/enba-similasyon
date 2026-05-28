---
type: Malzeme
status: Taslak
tarih: 2026-05-28
tags: [malzeme, pet, geri-donusum, gida-temas]
---

# PET (Polietilen Tereftalat) ve Çapak Dinamikleri

PET, ambalaj sektöründe (özellikle içecek şişelerinde) en yüksek geri dönüşüm oranına ve ekonomik değere sahip plastik türüdür. Geri dönüştürülmüş PET (rPET), katı kalite kriterlerine ve izlenebilirlik standartlarına tabidir.

---

## 1. Temel Malzeme Özellikleri ve Kalite Sınıfları

PET şişeler kırma makinelerinden geçirilerek **çapak (flake)** haline getirilir. Çapağın kalitesi, nihai kullanım alanını (iplik/elyaf, levha veya şişeden şişeye gıda kalitesi) doğrudan belirler.

| Kalite Sınıfı | PVC Oranı (ppm) | Nem Oranı (%) | Renk Homojenliği | Tipik Kullanım Alanı |
| :--- | :--- | :--- | :--- | :--- |
| **A Sınıfı (Premium)** | < 10 ppm | < %0.5 | Sadece Şeffaf/Açık Mavi | Şişeden Şişeye (Food-Grade) |
| **B Sınıfı** | < 50 ppm | < %1.0 | Karışık Renkli / Mat | Levha (Sheet) & Ambalaj |
| **C Sınıfı** | < 150 ppm | < %2.0 | Koyu Renkler / Karışık | Sentetik Elyaf / Tekstil |

> [!WARNING]
> **PVC Kontaminasyonu Riski:** PET geri dönüşümünde en kritik kirletici PVC'dir. 200°C civarındaki işleme sıcaklıklarında PVC bozunarak hidroklorik asit salgılar, bu da hem makineleri korozyona uğratır hem de PET zincirlerini kırarak malzemenin mekanik direncini (IV değerini) düşürür.

---

## 2. Proses ve Simülasyon Katsayıları (DetailedPlan Entegrasyonu)

Simülasyonda PET işlenirken kullanılan ortalama veriler ve fire katsayıları:

*   **Giriş Firesi (Sorting & De-baling Loss):** Toplanan balyalanmış PET şişelerde şişe dışı atıklar (kapaklar, etiketler, metal teller, taş/toprak) ortalama **%8 - %15** oranında fire oluşturur.
*   **Yıkama Firesi (Washing & Flotation Loss):** Etiket tutkallarının çözünmesi, PP/PE kapakların yüzdürülerek ayrılması sırasında **%5 - %8** ek fire oluşur.
*   **Toplam Verim:** Balyadan temiz çapağa ortalama net verim **%75 - %82** arasındadır.
*   **Spesifik Enerji Tüketimi (Yıkama ve Kırma):** Ton başına ortalama **250 - 350 kWh** elektrik tüketilir.

---

## 3. Gıda Sınıfı rPET (Bottle-to-Bottle) ve SSP Teknolojisi

PET çapağın tekrar su/meşrubat şişesinde kullanılabilmesi (EFSA ve FDA standartları) için iki kritik aşamadan geçmesi gerekir:

1.  **Challenge Test (Kirlilik Arındırma Gücü):** Yıkama ve dekontaminasyon hattının, tehlikeli kimyasalları en az %99.9 oranında temizleyebildiğini kanıtlayan test.
2.  **SSP (Solid State Polycondensation) Reaktörü:** 
    *   Yıkama sonrası PET çapağın IV (Intrinsic Viscosity - İçsel Viskozite) değeri ortalama 0.70 dL/g seviyesindedir. 
    *   SSP reaktöründe, vakum altında ve yüksek sıcaklıkta (190-210°C) polimer zincirleri tekrar uzatılarak IV değeri **0.80 - 0.84 dL/g** seviyesine (gıda ve şişeleme kalitesi) yükseltilir.

> [!NOTE]
> **DetailedPlan Bağlantısı:** Simülasyon modelinde SSP reaktörü aktif edildiğinde, işletme maliyetine ek azot (N2) gazı tüketimi ve yüksek ısıtma enerjisi maliyetleri (ton başına +150 kWh) otomatik olarak eklenmelidir.

---

## 4. İlişkili Sayfalar
*   [[Sektor-Rehberi]] - Genel geri dönüşüm akış şeması
*   [[GRS-ve-Gida-Mevzuatlari]] - EFSA/FDA limitleri ve GRS izlenebilirliği
*   [[Hat2-Yikama-Hatti]] - PET çapak sıcak yıkama prosesi detayları
