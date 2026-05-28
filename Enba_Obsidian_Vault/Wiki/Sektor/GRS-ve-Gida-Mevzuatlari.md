# GRS Sertifikasyonu ve Gıda Temaslı Geri Dönüşüm Mevzuatları

> **Tip:** Sektörel Mevzuat / Domain Dokümanı
> **Konum:** Wiki/Sektor/GRS-ve-Gida-Mevzuatlari.md

Plastik geri dönüşümünde katma değeri belirleyen iki temel standart vardır: (1) Ürünün geri dönüştürülmüş olduğunu kanıtlayan **GRS (Global Recycled Standard)** sertifikası, (2) rPET veya rPP'nin gıda ambalajında kullanılabilirliğini onaylayan **EFSA / FDA gıda temas uygunluğu**. 

Enba Similasyon, bu sertifikaların gerektirdiği izlenebilirlik ve kütle dengesi (mass balance) verilerini modellemek üzere tasarlanmıştır.

---

## 🌍 1. GRS (Global Recycled Standard) Sertifikasyonu

GRS, nihai üründeki geri dönüştürülmüş içeriğin miktarını doğrulamak, sosyal, çevresel ve kimyasal uygulamaları izlemek amacıyla oluşturulmuş uluslararası bir standarttır.

### GRS'nin 3 Temel Koşulu
1.  **Geri Dönüştürülmüş İçerik Oranı:** Bir ürünün GRS etiketli satılabilmesi için **minimum %20** geri dönüştürülmüş malzeme içermesi gerekir. GRS logo kullanımı ve reklam hakkı için ise bu oran **minimum %50** olmalıdır.
2.  **Kütle Dengesi (Mass Balance) Modeli:** Fabrikaya giren GRS belgeli hammadde miktarı (balya) ile çıkan GRS belgeli ürün miktarı (granül) arasındaki fire oranları ve kütlesel çevrim tam olarak belgelenmelidir.
3.  **Çevresel ve Sosyal Uyumluluk:** Proses su yönetimi (kapalı devre kullanımı, pH ve KOİ ölçümleri), atık su deşarj limitleri, işçi hakları ve iş güvenliği kayıtları denetimlerde incelenir.

### Enba Similasyon GRS İzlenebilirlik Entegrasyonu
*   **Lot Takip Sistemi:** Giriş yapılan her atık balyasına tedarikçinin GRS sertifika numarası (TC - Transaction Certificate) bağlanır.
*   **Reçete ve Çevrim Katsayısı:** Hat 1 ve Hat 2'de uygulanan fire oranları kütle dengesinden düşülerek, nihai lot etiketine otomatik GRS-PCR (Post-Consumer Recycled) oranı yazılır (örn: *%92 rHDPE PCR*).
*   **Su ve Enerji Loglama:** Hat 2 (Yıkama) ve Hat 3'te harcanan su/elektrik oranları, GRS çevresel denetim raporu şablonuna uygun olarak kaydedilir.

---

## 🍽️ 2. Gıda Temaslı Geri Dönüşüm Mevzuatları (Food-Grade)

Kullanılmış PET şişelerin temizlenip tekrar gıda ambalajına (şişe, kap) dönüştürülmesi, en yüksek katma değere sahip geri dönüşüm dalıdır. Ancak gıda güvenliği kuralları çok katıdır.

### EFSA (Avrupa Gıda Güvenliği Otoritesi) & FDA Standartları
*   **Challenge Test:** Geri dönüşüm hattının (özellikle yıkama ve ekstrüzyon adımlarının) kontaminasyonu (yabancı kimyasalları) temizleme gücü kanıtlanmalıdır. Yapay olarak kirletilmiş hammaddeler hatta sokulur ve çıktıdaki arınma oranı test edilir.
*   **Kontaminasyon Limiti:** Gıda ile temas edecek pullarda (flake) veya peletlerde maksimum kontaminasyon miktarı **≤ 50 ppm** olmalıdır (Standart ambalajlarda bu limit 200 ppm'dir).
*   **SSP (Solid State Polycondensation) Reaktörü:** PET'in mekanik özelliklerini artırmak ve eriyik akışkanlığını (IV - Intrinsic Viscosity) gıda kalitesine yükseltmek için 200-220°C'de vakum altında kristalize edilmesi sürecidir (Bkz: [[Wiki/Hatlar/Hat2-Yikama-Hatti|Hat 2 - Yıkama Hattı]]).

---

## 🧪 3. Kimyasal Geri Dönüşüm ve Gıda Uyumu

Piroliz ve depolimerizasyon gibi kimyasal yöntemler (Bkz: [[Wiki/Hatlar/Hat4-Kimyasal-Geri-Donusum|Hat 4 - Kimyasal Geri Dönüşüm]]), gıda temas engellerini aşmanın en kesin yoludur.
*   **Depolimerizasyon (Glikoliz/Metanoliz):** Polimeri monomerlerine kadar parçaladığı ve ardından damıtarak saflaştırdığı için elde edilen hammadde (BHET/DMT) doğrudan *sıfır (virgin)* plastik kalitesindedir ve hiçbir EFSA gıda engeline takılmaz.
*   **Piroliz Yağı (Mass Balance):** Piroliz yağı petrokimya tesisinde işlendiğinde, kütle dengesi (ISCC PLUS sertifikası) yöntemiyle elde edilen plastiklere "döngüsel plastik" etiketi yapıştırılır.

---

## 💡 Tesis Yöneticileri İçin Denetim Kontrol Listesi

Bir geri dönüşüm tesisinin GRS veya Food-Grade denetiminden geçebilmesi için Enba üzerinde hazır tutması gereken veri setleri:

*   [ ] **Tedarikçi Giriş Bilgileri:** Gelen her balyanın ağırlığı, tedarikçi TC numarası, atık tipi ve GRS durumu.
*   [ ] **Kimyasal ve Su Logları:** Yıkama hattında (Hat 2) kullanılan NaOH (kaustik) miktarı ve deşarj suyu pH/KOİ analiz raporları.
*   [ ] **Kütle Çevrim Raporu:** `Toplam Giriş Tonu = Çıktı Ürün + Satılan Fraksiyonlar + Proses Firesi (atık su çökeltisi, kırma tozu, reject)` dengesinin sıfır hata ile doğrulanması.
*   [ ] **Kalite Lot Kartları:** Sevkiyata çıkan her big bag için laboratuvarda yapılan MFI, nem ve kül testi sonuçları.

---

## İlgili Sayfalar
*   [[Wiki/Sektor-Rehberi|Geri Dönüşüm Sektör Rehberi]]
*   [[Wiki/Hatlar/Hat2-Yikama-Hatti|Hat 2 - Yıkama Hattı]]
*   [[Wiki/Hatlar/Hat4-Kimyasal-Geri-Donusum|Hat 4 - Kimyasal Geri Dönüşüm]]
