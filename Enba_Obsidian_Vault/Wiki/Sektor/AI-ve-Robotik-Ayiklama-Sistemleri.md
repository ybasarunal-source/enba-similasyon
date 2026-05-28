# Yapay Zeka ve Robotik Ayıklama Sistemleri

Geri dönüşüm tesislerinde girdi kalitesinin düşmesi ve işgücü maliyetlerinin artması, ayıklama hatlarında otomasyonu zorunlu kılmaktadır. Son yıllarda, geleneksel NIR (Yakın Kızılötesi) ayıklayıcıların ötesinde, yapay zeka (AI) destekli robotik kollar (Delta Picker) ve bilgisayarlı görü (Computer Vision) sistemleri ön plana çıkmaktadır.

## AI Tabanlı Ayıklama Mekanizması

AI ayıklama sistemleri, bant üzerinden akan malzemeleri sadece polimer tipine göre değil, nesnenin şekli, markası, üzerindeki etiket veya kullanım amacına (örn. gıda temaslı şişe vs. kimyasal şişesi) göre de ayırt edebilir.

### Sensör ve Kamera Teknolojileri
*   **RGB Kameralar & Derin Öğrenme:** Konveyör üzerindeki nesnelerin 2D/3D görüntülerini yakalar. Derin evrişimli sinir ağları (CNN), nesneyi milisaniyeler içinde sınıflandırır (örneğin: "Pet şişe - Su markası X" veya "PE deterjan kutusu").
*   **Çok Bantlı Spektral Kameralar (Hyperspectral Imaging):** Nesnenin yüzey yansımasını tarayarak polimer yapısını (PET, PP, HDPE, PS vb.) %99 doğrulukla teşhis eder.
*   **Delta Robotlar (AI Pickers):** Tespit edilen yabancı maddeleri veya hedeflenen polimerleri banttan alarak toplama gözlerine fırlatan pnömatik/vantuzlu robotik kollar.

---

## Manuel Ayıklama vs. AI Robotik Karşılaştırması

Aşağıdaki tablo, 1 metrelik bant genişliği ve 1.0 m/s bant hızındaki manuel işçi ile AI robotik kol performansını kıyaslamaktadır:

| Metrik | Manuel Ayıklama (1 İşçi) | AI Robotik Kol (Single Delta) | Açıklama |
| :--- | :--- | :--- | :--- |
| **Ayıklama Hızı (Pick Rate)** | 30 - 45 adet/dakika | 70 - 90 adet/dakika | Robotik sistem insan hızının en az 2 katıdır |
| **Doğruluk Oranı (Accuracy)** | %70 - %85 (Yorulmaya bağlı) | %95 - %98 (7/24 sabit) | AI yorulmaz ve konsantrasyon kaybı yaşamaz |
| **Maksimum Taşıma Ağırlığı** | Sınırsız (Hafif/Ağır ayrımı) | < 1.5 kg (Vantuz limiti) | Büyük/Ağır parçalarda insan veya 3D robot gerekir |
| **Çalışma Süresi (Vardiya)** | 8 saat (Mola gereksinimli) | 24 saat (Sadece bakım duruşu) | OEE çarpanını doğrudan yükseltir |
| **Yıllık Arıza / Duruş Süresi**| Hastalık, izin vb. (Değişken) | < %3 planlanmamış duruş | Planlı bakım periyotları vardır |

---

## Yatırımın Geri Dönüşü (ROI) Hesaplama Parametreleri

DetailedPlan modülünde robotik ayıklama yatırımlarının simülasyonu için kullanılan parametreler:

*   **CAPEX (Yatırım Bedeli):** Sistem başına (Kamera + Yazılım Lisansı + Delta Robot) ortalama **90.000 € - 140.000 €**.
*   **OPEX (İşletme Gideri):** Vakum pompası ve kontrol ünitesi elektrik tüketimi **4 - 6 kWh/ton** ve yıllık yazılım/bakım bedeli (CAPEX'in %5'i).
*   **İşçilik Tasarrufu:** 3 vardiya çalışan bir tesiste 1 AI Robot, ortalama **3.2 FTE (Tam Zaman Eşdeğer) işçi tasarrufu** sağlar.
*   **Amortisman Süresi (Payback Period):** Türkiye asgari ücret seviyesinde **2.5 - 3.5 yıl**, Avrupa standartlarında ise **1.0 - 1.5 yıldır**.
