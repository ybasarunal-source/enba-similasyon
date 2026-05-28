---
type: Malzeme
status: Taslak
tarih: 2026-05-28
tags: [malzeme, pp, polipropilen, koku-giderme, enjeksiyon]
---

# PP (Polipropilen) ve Koku Giderme (Deodorization) Teknolojileri

Polipropilen (PP); ambalaj kapakları, yoğurt kapları, plastik sandalyeler ve otomotiv parçalarında yaygın olarak kullanılan, mukavemeti yüksek ve yoğunluğu düşük bir polimerdir. Geri dönüşümünde en büyük darboğaz, malzemenin gözenekli yapısı nedeniyle oluşan **koku** problemidir.

---

## 1. Malzeme Karakteristiği ve Teknik Özellikler

PP'nin kristal yapısı ve işleme kolaylığı onu enjeksiyon kalıplama sektörü için vazgeçilmez kılar.

*   **Yoğunluk:** 0.89 - 0.91 g/cm³ (Su üzerinde yüzer, PE ile aynı yüzdürme tankında ayrıştırılamaz).
*   **Erime Sıcaklığı:** ~160 - 165°C (PE'ye göre daha yüksektir, bu sayede daha yüksek sıcaklık dayanımı gerektiren yerlerde kullanılır).
*   **MFI (Melt Flow Index - Eriyik Akış Hızı):** Enjeksiyon uygulamaları için yüksek MFI (>15 g/10 dk), ekstrüzyon/şişirme uygulamaları için düşük MFI (<3 g/10 dk) PP çapakları tercih edilir.

---

## 2. PP Geri Dönüşümünde "Koku" (Odor) Krizi

PP, yapısı gereği organik molekülleri (gıda kalıntıları, deterjan kokuları, şampuan parfümleri vb.) absorbe eden bir moleküler sünger gibi davranır. Klasik yıkama ve kırma hatları bu kokuyu gideremez. Kokulu geri dönüştürülmüş PP granülleri, iç mekan mobilyalarında, beyaz eşyalarda veya kozmetik ambalajlarında kullanılamaz.

### Koku Giderme (Deodorization) Çözümleri:
1.  **Ekstrüder Üzerinde Çift Vakumlu Degazör:** Granül makinesinde yüksek vakum altında uçucu organik bileşiklerin (VOC) emilmesi.
2.  **Sıcak Hava ile Karıştırma (Hot Air Stripping / Silo Havalandırma):** Granül haline geldikten sonra, malzemenin 80 - 100°C sıcaklıkta kuru hava akımına maruz bırakılarak kokunun uçurulması (tipik olarak 4 - 8 saat sürer).
3.  **Kimyasal Katkılar:** Koku absorbe edici zeolit veya özel koku maskeleyici esansların ekstrüzyon aşamasında formüle dahil edilmesi.

> [!IMPORTANT]
> **DetailedPlan Enerji Modeli:** PP geri dönüşüm planlarında "Koku Giderme Silosu (Stripping Silo)" kullanıldığında, fırın ve fan motorlarının sürekli çalışması nedeniyle ton başına fazladan **80 - 120 kWh** elektrik maliyeti eklenmelidir.

---

## 3. Proses ve Simülasyon Katsayıları (DetailedPlan Entegrasyonu)

| Parametre | Varsayılan Değer | Açıklama / Sektörel Karşılık |
| :--- | :--- | :--- |
| **Giriş / Ayıklama Firesi** | %10 - %18 | Kapaklar ve yoğurt kaplarındaki etiketler, alüminyum folyo kapaklar ve yapışkan artıkları. |
| **Yıkama Firesi** | %4 - %7 | Yüzdürme tanklarında PE ile PP karışımını ayırmak için kullanılan tuz/yoğunluk banyosu firesi. |
| **Ortalama Verim** | %75 - %80 | Temiz granül elde etme oranı. |
| **Spesifik Elektrik Tüketimi** | 400 - 550 kWh/ton | Kırma + Sıcak Yıkama + Ekstrüzyon + Koku Giderme Silosu. |

---

## 4. İlişkili Sayfalar
*   [[Sektor-Rehberi]] - Proses akış şeması içindeki PP rotası
*   [[Hat2-Yikama-Hatti]] - Sıcak kaustik yıkama ve koku moleküllerini çözme
*   [[Hat5-Balyalama-Sevkiyat]] - PP kapak lot kartlarında koku seviyesi standartları
