---
type: Sektor
status: Taslak
tarih: 2026-05-28
tags: [sektor, su-yonetimi, atik-su, aritma, daf, filtrepres, kimyasallar]
---

# Su Yönetimi ve Sıfır Sıvı Deşarjı (Zero Liquid Discharge)

Plastik geri dönüşümünde (özellikle poşet ve kirli şişe yıkama hatlarında) su, kirleticileri çözmek ve taşımak için birincil araçtır. Çevresel sürdürülebilirlik yasal sınırları ve yüksek şebeke suyu maliyetleri nedeniyle, suyun kapalı devre geri kazanılması (arıtılması) işletme karlılığını doğrudan etkiler.

---

## 1. Yıkama Hatlarında Su Sirkülasyonu ve Tüketim Oranları

Bir plastik yıkama hattı tek geçişli (açık devre) çalıştırılamaz; bu durum günde yüzlerce ton su israfına yol açar. Bu nedenle su kapalı devre sirküle edilir.

*   **Taze Su İhtiyacı (Top-up Rate):** Kapalı devre çalışan bir PET veya PE yıkama hattında, ıslak çapakların (flake) ve filtre çamurunun üzerinde taşınan su kayıpları nedeniyle ton başına ortalama **%5 - %10 oranında taze su takviyesi** gerekir.
*   **Kirlilik Akümülasyonu:** Sirkülasyon suyu arıtılmazsa, sudaki askıda katı madde (AKM) ve çözünmüş kimyasal yükü (KOİ) hızla artar. Bu durum temiz çapakların tekrar kirlenmesine ve nihai granül kalitesinin düşmesine yol açar.

---

## 2. Atık Su Arıtma ve Çamur Yönetimi Teknolojileri

Tesis atık suyunu temizlemek ve devri daim ettirmek için uygulanan temel prosesler:

1.  **DAF (Dissolved Air Flotation - Çözünmüş Hava Flotasyonu):** 
    *   Suya mikro hava kabarcıkları ve flokülant/koagülant kimyasalları verilir. 
    *   Hafif kirleticiler ve askıdaki katı maddeler köpük halinde su yüzeyine yükselerek sıyırıcılar vasıtasıyla atık su çamuruna dönüştürülür.
2.  **Filtrepres / Dekantör (Çamur Susuzlaştırma):**
    *   DAF ünitesinden çıkan sulu çamur, filtrepres plakalarında sıkıştırılarak katı çamur keklerine dönüştürülür. 
    *   Geri kazanılan temiz su hatta geri pompalanır. Katı çamurlar ise lisanslı bertaraf tesislerine gönderilir.
3.  **Ters Osmoz (Reverse Osmosis - RO):**
    *   Özellikle gıda sınıfı rPET yıkama hatlarında son durulama suyunun sıfır iletkenlikte olması istenir. Bu aşamada ters osmoz ile ultra saf su elde edilir.

> [!WARNING]
> **Köpürme Riski:** HDPE veya PP şişe yıkamada deterjan kalıntıları nedeniyle su aşırı köpürür. Köpük, yıkama tanklarının taşmasına ve pompaların hava yapmasına yol açar. Bu durumu engellemek için sisteme sürekli **antifoam (köpük önleyici)** dozajlanmalıdır.

---

## 3. Yazılım Entegrasyonu (DetailedPlan Su ve OPEX Modülü)

Enba Simülasyon, DetailedPlan bütçe modelinde su maliyetlerini şöyle yönetir:
*   **Su Kimyasalları Gideri:** İşlenen hammadde tonajına bağlı olarak DAF kimyasalı (flokülant) ve köpük önleyici tüketimleri (M-kodu: `M529`) ton başına değişken gider olarak işletme maliyetlerine eklenir.
*   **Çamur Bertaraf Maliyeti:** Çamur susuzlaştırma sonrası çıkan katı atık tonajı (ortalama girdi hammaddesinin %1-2'si kadar) bertaraf lojistik ve depolama maliyeti olarak opex'e yansıtılır.
*   **Çevre Cezası Risk Analizi:** Tesiste arıtma ünitesi yoksa veya kapasitesi yetersizse, yasal sınırların aşılmasından kaynaklı "Çevre Cezası" risk olasılığı simülasyon modelinde finansal risk olarak raporlanır.

---

## 4. İlişkili Sayfalar
*   [[Enerji-Yonetimi-ve-Karbon-Ayak-Izi]] - Arıtma tesisinin elektrik tüketimleri
*   [[Hat2-Yikama-Hatti]] - Flotasyon tankı su seviye ve kimyasal kontrolleri
*   [[Kirleticiler-ve-Kalite-Kontrol-Taksonomisi]] - Sudaki askıda katı madde (AKM) ölçüm yöntemleri
