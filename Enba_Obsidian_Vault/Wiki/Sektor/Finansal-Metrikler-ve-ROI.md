---
type: Sektor
status: Taslak
tarih: 2026-05-28
tags: [sektor, finans, ebitda-ton, oee, amortisman, roi, nakit-akisi, detailed-plan]
---

# Sektörel Finansal Metrikler ve Yatırımın Geri Dönüşü (ROI)

Geri dönüşüm tesisleri, yüksek ilk yatırım maliyetleri (CAPEX) ve ham madde fiyat dalgalanmalarına duyarlı işletme giderleri (OPEX) ile karakterize edilir. Bu tesislerin finansal başarısını ölçmek, standart üretim fabrikalarından farklı metriklere odaklanmayı gerektirir.

---

## 1. Anahtar Sektörel Finansal Metrikler (Recycling KPIs)

Enba Simülasyon mali analiz modüllerinde kullanılan temel finansal performans göstergeleri:

### A. Ton Başına EBITDA (EBITDA / Ton)
Geri dönüşüm finansal verimliliğinin altın standardıdır. Toplam EBITDA'nın üretilen net ürün tonajına bölünmesiyle bulunur.
*   *Sektör Standartları:*
    *   Mekanik PP/PE Granül: **120 - 180 € / Ton**
    *   Premium PET Çapak (Elyaflık): **150 - 220 € / Ton**
    *   Gıda Sınıfı rPET (Bottle-to-Bottle): **300 - 450 € / Ton**

### B. Hammadde Makası (Spread / Margin Buffer)
Nihai ürünün satış fiyatı ile hurda hammaddenin alış fiyatı arasındaki farktır.
*   *Hesaplama:* `Birim Satış Fiyatı (₺/kg) − (Birim Alış Fiyatı (₺/kg) / Net Verim Oranı)`
*   Bu makas, elektrik fiyat artışları veya işçilik zamlarına karşı tesisin dayanma gücünü (marj tamponunu) gösterir.

### C. İşletme Sermayesi Döngüsü (Working Capital Gap)
Geri dönüşümde en büyük nakit tıkanıklığı vadelerden kaynaklanır:
*   **Hurda Alımı:** Sokak toplayıcıları veya küçük hurdacılar ödemeyi peşin veya maksimum 7-15 gün vadeli ister.
*   **Mamul Satışı:** Büyük ambalaj üreticileri veya FMCG markaları ödemeyi 60 - 90 gün vadeyle yapar.
*   *Sonuç:* Hızlı büyüyen tesislerde ciddi bir **nakit açığı (cash gap)** oluşur. Simülasyonda bu açık işletme kredisi ihtiyacı olarak bütçelenmelidir.

---

## 2. CAPEX ve ROI (Yatırımın Geri Dönüşü) Hesaplama Modeli

Geri dönüşüm hatları (örneğin 1.5M € değerinde bir yıkama ve ekstrüzyon hattı) için fizibilite hesaplama parametreleri:

1.  **Ekipman Amortismanı:** Aşındırıcı ortam nedeniyle makinelerin ekonomik ömrü genel sanayideki 10 yıl yerine **5 - 7 yıl** olarak hesaplanmalıdır.
2.  **OEE (Toplam Ekipman Etkinliği):** 
    *   `OEE = Kullanılabilirlik (Duruşlar hariç) × Performans (Fiili hız / Nominal hız) × Kalite (Net verim)`
    *   Fizibilite planlarında OEE hedefi maksimum **%80 - %85** olarak alınmalıdır (planlı bakım duruşları nedeniyle %100 imkansızdır).
3.  **Geri Ödeme Süresi (Payback Period):**
    *   `Kurulum CAPEX / Yıllık Net Nakit Akışı (EBITDA - Vergi - Faiz)`
    *   Sağlıklı bir geri dönüşüm projesinde hedef geri ödeme süresi **2.5 - 4 yıl** arasındadır.

---

## 3. Yazılım Entegrasyonu (DetailedPlan Finans Analiz Motoru)

Enba'nın `DetailedPlanShell` ve `PnLPanel` modülleri bu metrikleri otomatik hesaplar:
*   **Dinamik Nakit Akışı Simülasyonu:** Müşteri vadeleri ve tedarikçi vadeleri girildiğinde, 24 aylık nakit akışı projeksiyonunda en yüksek nakit ihtiyacı (pik finansman açığı) grafiklerle raporlanır.
*   **EBITDA/Ton Grafik Gösterimi:** P&L tablosunun altında aylık bazda ton başına elde edilen kar marjı Euro ve TL cinsinden trend çizgisiyle gösterilir, böylece hammadde fiyat dalgalanmalarının etkisi anlık izlenir.

---

## 4. İlişkili Sayfalar
*   [[Is-Modeli]] - İş modeli ve gelir akışları
*   [[Lojistik-ve-Tedarik-Zinciri]] - Lojistik maliyetlerinin landed cost ve hammadde makasına etkisi
*   [[Tesis-Bakim-ve-Asinma-Dinamikleri]] - Bakım maliyetlerinin ve duruşların OEE'ye etkisi
