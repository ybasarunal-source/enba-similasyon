# PVC (Polivinil Klorür) ve Kontaminasyon Yönetimi

Polivinil Klorür (PVC), ambalaj, inşaat (boru, profil) ve tıbbi malzemelerde yaygın olarak kullanılan, ancak geri dönüşüm tesislerinde yönetilmesi en zor olan polimerlerden biridir. Özellikle PET (Polietilen Tereftalat) geri dönüşümünde PVC, en kritik kirletici (kontaminant) konumundadır.

## PET Geri Dönüşümünde PVC Kontaminasyonu ve Kriz Dinamikleri

PET ve PVC polimerlerinin yoğunlukları birbirine çok yakındır (PET: ~1.38 g/cm³, PVC: ~1.35-1.40 g/cm³). Bu nedenle geleneksel yüzdürme-batırma (sink-float) tanklarında bu iki malzemeyi birbirinden ayırmak neredeyse imkansızdır.

### Termal Kararsızlık ve Asit Hasarı
*   **PET Erime Sıcaklığı:** ~250-260°C'dir.
*   **PVC Bozunma Sıcaklığı:** ~180-200°C civarındadır.
*   PET ekstrüderde erime sıcaklığına ulaştığında, içindeki PVC çoktan bozunarak hidroklorik asit (HCl) gazı açığa çıkarır.
*   Bu asit salınımı:
    1.  Ekstrüder vidası ve kovanında ciddi korozyona yol açar.
    2.  PET polimer zincirlerinin termal bozunmasını (hidroliz) hızlandırarak IV (İntrinsik Viskozite) değerini düşürür.
    3.  Nihai granülde siyah/kahverengi yanık lekelerine neden olur ve rPET'in gıda temas uygunluğunu (challenge test) tamamen engeller.

---

## Teknik Parametreler ve Sınırlar

Aşağıdaki tablo, PET çapak veya granül işleme süreçlerindeki PVC kabul limitlerini ve fiziksel özellikleri özetlemektedir:

| Parametre | Değer | Açıklama / Standart |
| :--- | :--- | :--- |
| **Yoğunluk** | 1.35 - 1.45 g/cm³ | Yüzdürme tanklarında PET ile çakışır |
| **Erime Sıcaklığı** | 100 - 210°C | Düşük sıcaklıkta yumuşamaya başlar |
| **Bozunma Başlangıcı** | > 180°C | HCl gazı çıkışı ve karbonlaşma |
| **PET Çapak Maks PVC Limiti** | < 50 ppm | Pro-grade rPET üretimi için üst sınır |
| **A Sınıfı PET Çapak Sınırı** | < 10 ppm | Premium elyaf ve şişelik (bottle-to-bottle) rPET |
| **C Sınıfı PET Çapak Sınırı** | < 500 ppm | Düşük kaliteli levha (sheet) veya bağlama çemberi |

---

## Ayrıştırma ve Yönetim Teknolojileri

Tesislerde PVC kontaminasyonunu yönetmek için üç kademeli bir otomasyon uygulanır:

1.  **Optik Flake Sorting (NIR):** Çapak boyutunda ayıklamada Yakın Kızılötesi (NIR) sensörler kullanılarak PVC çapaklar milisaniyeler içinde ejektör valflerle üflenir.
2.  **Kızılötesi Bant Ayıklayıcılar (Tabaka Halinde):** Kırma makinesine girmeden önce şişe formundaki PVC'lerin ayıklanması.
3.  **Elektrostatik Ayrıştırma (Triboelektrik):** Polimerlerin sürtünmeyle kazandığı statik yük farkından yararlanarak kuru ortamda ayrıştırma.

---

## Simülasyon Katsayıları (Land Cost & Yield)

DetailedPlan modülünde PVC kontaminasyonu yüksek girdilerin işlenmesi durumunda uygulanacak varsayılan katsayılar:

*   **PVC Kontaminasyonu > 500 ppm:** Girdi fiyatında ton başına %15 ila %30 **Kalite İskontosu** uygulanır.
*   **Filtre Değişim Katsayısı:** Her 100 ppm ek PVC için lazer filtre elek temizleme periyodu %25 kısalır (OPEX artışı).
*   **Ekstrüder Aşınma Çarpanı:** Asit korozyonundan dolayı vida/kovan ömrü normalin 0.6 katına düşer.
