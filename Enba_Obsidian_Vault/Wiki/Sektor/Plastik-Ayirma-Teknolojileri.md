# Plastik Ayırma Teknolojileri

Geri dönüşüm tesislerinde karışık haldeki plastik atıkların polimer türüne (PET, PP, HDPE, LDPE, PVC, PS) ve renklerine göre ayrıştırılması, nihai ürünün kalitesini ve ekonomik değerini doğrudan belirler. Doğru ayırma teknolojisi seçimi, tesisin fire oranlarını azaltıp OEE değerlerini yükseltir.

## Temel Plastik Ayırma Yöntemleri

### 1. Yoğunluk Farkı ile Ayırma (Float-Sink)
Sıvı ortamda polimerlerin özgül ağırlık farklarından yararlanılarak yapılan ayırmadır.
*   **Su Yoğunluğu ($1.0 \text{ g/cm}^3$):** PP ve PE su yüzeyinde yüzerken, PET, PVC ve PS dibe batar.
*   **Tuzlu Su Banyoları:** Suya $\text{NaCl}$ veya diğer yoğunluk artırıcılar eklenerek yoğunluk $1.05 - 1.20 \text{ g/cm}^3$ seviyesine kalibre edilir. Bu sayede PS yüzdürülerek batmaya devam eden PET/PVC'den ayrıştırılır.

### 2. Spektroskopik ve Optik Ayırma (NIR / VIS Sorting)
Bant üzerinden yüksek hızda akan plastiklerin ışık altındaki davranışına dayanır.
*   **NIR (Kızılötesi) Teşhisi:** Her polimer türü (PET, PE, PP, PS, PVC, ABS) $700 - 2500 \text{ nm}$ dalga boyunda benzersiz bir kızılötesi yansıma spektrumu ("parmak izi") verir.
*   **Ejektör Hava Jetleri:** Kızılötesi kameranın teşhis ettiği hedeflenen polimer, yüksek hızlı pnömatik valflerle hava üflenerek banttan fırlatılır.
*   **Renk Ayırma (VIS):** Kamera görüntülerinden yararlanılarak plastikler renk sınıflarına (naturel, beyaz, mavi, miks) ayrılır.

### 3. Elektrostatik Ayrıştırma (Triboelektrik)
Yoğunluğu çakışan kuru çapakların (örn. PP/PE karışımları) statik yük farklarıyla ayrıştırılmasıdır.
*   **Sürtünmeyle Yüklenme:** Plastikler tamburda sürtünerek zıt kutuplarla (+/-) yüklenir.
*   **Yüksek Voltaj Ayrımı:** Statik yüklü çapaklar yüksek voltajlı bir elektrostatik alandan düşerken zıt kutuplara çekilerek havada yön değiştirir ve ayrışır.

---

## Teknolojilerin Karşılaştırmalı Parametreleri

Aşağıdaki tablo, geri dönüşüm tesislerinde kullanılan ayırma yöntemlerinin teknik sınırlarını ve verimliliklerini göstermektedir:

| Ayırma Teknolojisi | Ayırma Doğruluğu (%) | Hız / Kapasite | Sarf Giderleri | Tipik Kullanım Alanı |
| :--- | :--- | :--- | :--- | :--- |
| **Float-Sink Tankı** | %92 - %96 | 1.0 - 3.0 ton/saat | Su ve kimyasal giderleri | PE/PP yüzenlerin, PET/PVC batanlardan ayrımı |
| **NIR Optik Seperatör** | %96 - %99 | 2.0 - 5.0 ton/saat | Elektrik ve yüksek basınçlı hava | Ambalaj ayıklama (şişe formunda) |
| **Triboelektrik Seperatör** | %90 - %95 | 0.5 - 1.5 ton/saat | Düşük kuru elektrik gideri | Yoğunluğu çakışan PP/PE çapak ayrımı |
| **Lazer Flake Sorter** | %98 - %99.9 | 0.8 - 2.0 ton/saat | Lazer tüp aşınması ve elektrik | rPET çapak içindeki PVC ve metal ayıklama |

---

## Simülasyon ve Fizibilite Katsayıları (DetailedPlan)

*   **Hatalı Üfleme Firesi (False Reject):** NIR ve Lazer ayıklayıcılarda ideal malzemenin yanlışlıkla yabancı maddeyle beraber üflenmesi oranına denir. Proses modellemelerinde hatalı üfleme firesi **%1.5 - %3.0** olarak hesaplara dahil edilir.
*   **Kompresör Güç Tüketimi:** Optik ve AI ayıklama valfleri sürekli basınçlı hava kullandığı için, sisteme bağlı kompresör ton başına ek **15 - 25 kWh** elektrik tüketimi yansıtır.
*   **Yıkama Hattı Bypass:** Girdideki yabancı polimer oranı (örn: PET içindeki PVC veya PE) **%1'in altında** ise, optik flake sorting ile yıkama hattı kimyasal banyosu bypass edilerek işletme giderleri (OPEX) düşürülebilir.
