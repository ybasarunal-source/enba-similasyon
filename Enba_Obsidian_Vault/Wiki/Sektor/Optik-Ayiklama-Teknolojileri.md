---
type: Sektor
status: Taslak
tarih: 2026-05-28
tags: [sektor, optik-ayiklama, nir, renk-ayirici, hava-kompresoru, ejektor, saflik]
---

# Optik Ayıklama Teknolojileri ve Algoritmaları

Optik ayıklama, modern geri dönüşüm tesislerinde el ile ayıklama işçiliğini minimuma indiren ve ürün saflığını %99.5'in üzerine çıkaran en kritik otomasyon teknolojisidir. Sistemler, farklı sensörler ve yüksek hızlı hava jetleri (ejektörler) kullanarak malzemeleri türüne ve rengine göre ayırır.

---

## 1. Algılama Sensörleri ve Çalışma Mekanizmaları

Optik ayıklayıcılarda (sorter) kullanılan 3 ana algılama teknolojisi:

### A. NIR (Near-Infrared - Yakın Kızılötesi) Spektroskopisi
*   **Çalışma Prensibi:** Her polimerin (PET, HDPE, PP, PS, PVC, kağıt) kızılötesi ışık altında yansıttığı spektral imza (moleküler parmak izi) farklıdır. NIR sensörü, konveyör bandından saatte tonlarca hızla geçen atıkların polimer türünü milisaniyeler içinde teşhis eder.
*   **Sınırı:** Karbon siyahı içeren (siyah renkli plastikler) ışığı tamamen soğurduğu için standart NIR sensörleri tarafından algılanamaz. Siyah plastikler için özel lazer spektroskopi sensörleri gerekir.

### B. VIS (Görünür Işık - Kamera) Sensörleri
*   **Çalışma Prensibi:** RGB kameralar ile malzemenin rengini tarar. Özellikle PET çapak yıkama hatlarında naturel (şeffaf) çapakların arasına karışan renkli (yeşil, mavi, kahverengi) çapakları ayırmak için kullanılır.

### C. AI / Derin Öğrenme (Deep Learning) Kameraları
*   **Çalışma Prensibi:** Sadece kimyasal bileşimi değil, nesnenin şeklini de analiz eder. Örneğin, gıda ile temas etmiş bir rPET tepsiyi (tray) gıda sınıfı bir PET şişeden ayırmak için şekil tanıma algoritmaları kullanır.

---

## 2. Ejektör (Hava Jetli Valf) Mekanizması ve Kompresör Yükü

Polimer türü veya rengi belirlenen malzeme, bant çıkışında havada süzülürken yüksek hızlı solenoid valfler (ejektörler) tarafından basınçlı hava püskürtülerek hedef hazneye üflenir.

*   **Püskürtme Çözünürlüğü:** Valf memeleri arasındaki mesafe (nozzle spacing - genellikle 6.25 mm veya 12.5 mm) ne kadar dar olursa, ayıklama hassasiyeti o kadar artar ve hedef dışı malzemenin yanlışlıkla üflenmesi (fire kaybı) o kadar azalır.
*   **Basınçlı Hava Maliyeti:** Sürekli devreye giren yüzlerce ejektör valfi devasa miktarda basınçlı hava tüketir. Bu durum tesiste yüksek güçte (37 - 75 kW) vida vidalı hava kompresörlerinin sürekli çalışmasını gerektirir.

> [!IMPORTANT]
> **DetailedPlan Enerji Modeli:** Tesis tasarımına "Optik Ayırıcı" eklendiğinde, sadece makinenin kendi elektrik tüketimi değil, kompresörün tükettiği ton başına ek **15 - 25 kWh** elektrik maliyeti de eklenmelidir.

---

## 3. Proses ve Simülasyon Katsayıları (DetailedPlan Entegrasyonu)

*   **Tek Geçişli (Single Pass) Saflık Verimi:** Standart bir optik ayırıcı tek geçişte ortalama **%95 - %97** saflık sağlar. İlaç veya gıda kalitesinde %99.5 saflığa ulaşmak için **Çift Geçişli (Double Pass - ikinci kez ayıklama)** veya arka arkaya iki optik ayırıcı konumlandırılmalıdır.
*   **Hatalı Üfleme Firesi (False Reject):** Ayıklama sırasında hedef kirleticinin yanında ortalama **%2 - %4 oranında temiz hammadde** de yanlışlıkla atık haznesine üflenir. Bu "verimli atık", katsayı olarak simülasyon firesine eklenmelidir.

---

## 4. İlişkili Sayfalar
*   [[Hat3-Atik-Ayristirma-Hatti]] - Mekanik ve optik ayıklama istasyonlarının yerleşimi
*   [[Kirleticiler-ve-Kalite-Kontrol-Taksonomisi]] - Optik ayırıcının PVC ve yabancı polimer ppm limitlerine etkisi
*   [[Enerji-Yonetimi-ve-Karbon-Ayak-Izi]] - Kompresör hava tüketimlerinin elektrik maliyet trendleri
