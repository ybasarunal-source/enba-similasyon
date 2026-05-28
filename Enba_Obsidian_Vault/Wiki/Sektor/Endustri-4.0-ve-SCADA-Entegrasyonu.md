# Endüstri 4.0 ve SCADA Entegrasyonu

Geri dönüşüm sektörü, marjların dar olduğu ve girdi kalitesinin sürekli değiştiği yüksek riskli bir imalat alanıdır. Tesislerin kârlı kalabilmesi için makinelerin anlık performansını, enerji tüketimlerini ve arıza belirtilerini Endüstri 4.0 ve SCADA (Supervisory Control and Data Acquisition) altyapısıyla anlık olarak izlemek kritik önem taşır.

## Tesis İçi IoT Sensör Ağı ve Veri Toplama

Enba Similasyon modellemesinde, bir geri dönüşüm hattındaki her ana ekipman (kırıcı, yıkama tankı, santrifüj, ekstrüder) dijital ikiz mantığıyla sensörler üzerinden takip edilir:

1.  **Enerji Analizörleri (Modbus/TCP):** Her makinenin spesifik elektrik tüketimi (SEC - kWh/ton) anlık ölçülür. Kırıcı bıçaklarının körelmesi veya ekstrüder filtresinin tıkanması ilk olarak anlık akım çekimindeki (amper) anomalilerden teşhis edilir.
2.  **Titreşim (Vibrasyon) Sensörleri:** Santrifüj ve kırıcı rotorlarındaki rulman aşınmalarını önceden tespit etmek için yüksek frekanslı ivmeölçerler kullanılır.
3.  **Sıcaklık Sensörleri (PT100):** Ekstrüder kovan ısıtma bölgelerinin ve rulman yataklarının sıcaklık takibi yapılır.
4.  **Akış ve Seviye Sensörleri:** Yıkama hattına beslenen su debisi ve DAF kimyasal dozaj tanklarının seviyeleri anlık okunur.

---

## SCADA Arayüzü ve OEE (Toplam Ekipman Etkinliği) Takibi

SCADA sistemi, sahadan gelen PLC (Programmable Logic Controller) verilerini tek bir merkezde birleştirir ve tesis yöneticisine anlık OEE raporu sunar.

$$\text{OEE} = \text{Kullanılabilirlik (Availability)} \times \text{Performans (Performance)} \times \text{Kalite (Quality)}$$

### OEE Kayıpları ve SCADA Teşhisi
*   **Kullanılabilirlik Kaybı:** Plansız duruşlar (elektrik kesintisi, hammadde yokluğu, lazer filtre tıkanması). SCADA, duruş başladığı an operatörden duruş kodu seçmesini ister.
*   **Performans Kaybı:** Makinenin tasarlanan tonajın altında çalışması. Besleme konveyörünün boş kalması durumunda sistem uyarı verir.
*   **Kalite Kaybı:** İskartaya çıkan veya nemi yüksek çıkan ürün miktarı. Çıkış nem sensörleri r-Polimer nemi %1'i aştığında kurutucuyu otomatik hızlandırır.

---

## SCADA Entegrasyon Metrikleri

Aşağıdaki tablo, Endüstri 4.0 entegrasyonu yapılmış bir tesisin operasyonel kazanımlarını özetlemektedir:

| Metrik | Entegrasyon Öncesi | Entegrasyon Sonrası | Gelişme / Etki |
| :--- | :--- | :--- | :--- |
| **Ortalama OEE** | %65 - %72 | %82 - %88 | Verimlilikte ~%20 artış |
| **Plansız Duruş Süresi** | Vardiya başına 45 dk | Vardiya başına 12 dk | Kestirimci bakım ile duruşlar engellenir |
| **Hatalı Granül (Rejection)** | %2.5 - %4.0 | < %0.8 | Anlık proses parametresi düzeltmesi |
| **Spesifik Enerji (SEC)** | 420 kWh/ton (Ortalama) | 365 kWh/ton (Optimize) | Pik yük yönetimi ve makine kalibrasyonu |

---

## Simülasyon Katsayıları (DetailedPlan)

*   **IoT Entegrasyon Katsayısı:** Tesis genelinde SCADA ve IoT aktif edildiğinde, planlanan genel OEE değeri otomatik olarak **1.1 kat** çarpanla iyileştirilir.
*   **Bakım OPEX İndirimi:** Kestirimci bakım altyapısı sayesinde yıllık planlı/plansız makine parça değişim bütçesi (kırıcı rulmanı, ekstrüder kovanı vb.) **%15 oranında düşürülür**.
