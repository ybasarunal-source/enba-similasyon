---
type: Sektor
status: Taslak
tarih: 2026-05-28
tags: [sektor, bakim-onarim, durus-suresi, kirici-bicaklari, ekstruder-asinmasi, oee]
---

# Tesis Bakım-Onarım ve Aşınma Dinamikleri

Geri dönüşüm tesisleri, yüksek miktarda kum, toprak, metal ve sert kalsit dolgulu malzemeler işledikleri için mekanik aşınmanın en şiddetli olduğu üretim alanlarıdır. Önleyici bakımın planlanmaması, beklenmedik duruşlara (unplanned downtime) ve yüksek amortisman kayıplarına yol açar.

---

## 1. Kritik Aşınma Noktaları ve Bakım Takvimi

Sistem verimliliğini etkileyen temel mekanik aşınma elemanları ve ortalama servis ömürleri:

| Ekipman / Aşınma Elemanı | Aşınma Nedeni | Bileme / Temizlik Sıklığı | Değişim Ömrü |
| :--- | :--- | :--- | :--- |
| **Kırıcı Bıçakları (Granulator)** | Kağıt/plastik içindeki kum, çakıl ve zımba telleri bıçak ağızlarını körleştirir. | Her 40 - 80 çalışma saatinde (Bileme) | 300 - 500 saat (Tam değişim) |
| **Ekstrüder Vida ve Kovanı** | Hammaddedeki yüksek kalsit (CaCO₃) dolgusu ve mikro metal parçacıkları vidayı aşındırır. | Yılda 1 kez (Aşınma ölçümü) | 8.000 - 15.000 saat (Bimetalik kaplama vidalar) |
| **Eriyik Filtresi Elekleri** | Plastik eriyik içindeki erimeyen kağıt lifi, alüminyum ve kirleticiler filtreyi tıkar. | Lazer filtrede otomatik sıyırma; manuel filtrede her 4-8 saatte bir. | 8 - 24 saat (Manuel elek ömrü) |
| **Friksiyon Yıkayıcı Kanatları** | Yüksek devirli sürtünme ve kum erozyonu yıkayıcı rotor kanatlarını inceltir. | Her 3 ayda bir kaynak dolgu kontrolü | 3.000 - 5.000 saat |

---

## 2. Kör Bıçakların Enerji ve Verim Maliyeti

Önleyici bakımın aksatılması (bıçakların zamanında bilenmemesi) tesis maliyetlerini zincirleme etkiler:
*   **Artan Elektrik Tüketimi:** Kör bıçaklar plastiği/kağıdı kesmek yerine ezmeye başlar. Bu durum motor üzerindeki yükü (amper) artırarak elektrik tüketimini **%15 - %30** oranında yükseltir.
*   **Toz Çapak Oranı (Fines):** Ezerek kırma sonucunda çapakların yanında yüksek miktarda "toz" oluşur. Yıkama tanklarında bu tozlar suyla birlikte tahliye edilerek **%3 - %5 ek malzeme firesine** (lif/plastik kaybı) yol açar.

---

## 3. Yazılım Entegrasyonu (DetailedPlan OPEX ve OEE Modülü)

Enba Simülasyon, tesis üretim kapasitesini (OEE) hesaplarken bakım duruşlarını hesaba katar:
*   **OEE Planlaması:** Tesis kapasitesi hesaplanırken otomatik olarak haftalık **4 saatlik planlı duruş** (bıçak değişimi ve temizlik) kapasiteden düşülür.
*   **Bıçak Bileme OPEX Gideri:** Simülasyon motorunda, işlenen her ton hammadde için bıçak aşınma ve bileme maliyetleri (sarf malzeme M-kodu: `M509`) ton başına **₺/ton** bazında değişken gider olarak maliyetlendirilir.
*   **Planlanmamış Duruş Risk Simülasyonu:** Kullanıcı önleyici bakımı "Pasif" seçerse, elektrik tüketim katsayısı %15 artırılır ve tesiste rastgele arıza duruş süresi risk çarpanı yükseltilir.

---

## 4. İlişkili Sayfalar
*   [[Hat1-Mekanik-Geri-Donusum]] - Kırma bıçaklarının mekanik yerleşimi
*   [[Enerji-Yonetimi-ve-Karbon-Ayak-Izi]] - Aşınmanın spesifik elektrik tüketimine (SEC) etkisi
*   [[Kirleticiler-ve-Kalite-Kontrol-Taksonomisi]] - İnorganik kalsit ve kül oranının vida aşınmasına etkisi
