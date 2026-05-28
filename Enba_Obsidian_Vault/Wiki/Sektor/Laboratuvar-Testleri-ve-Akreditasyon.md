---
type: Sektor
status: Taslak
tarih: 2026-05-28
tags: [sektor, laboratuvar, testler, tds, mfi, darbe-dayanimi, iso-17025, kalite-kartlari]
---

# Laboratuvar Test Metotları ve Teknik Bilgi Formu (TDS)

Geri dönüştürülmüş granüllerin kurumsal sanayi alıcılarına (otomotiv, beyaz eşya, kozmetik, ambalaj) satılabilmesi için malzemenin fiziksel ve mekanik özelliklerinin belgelenmesi gerekir. Bu belgeleme, standart test metotlarına göre hazırlanan **Teknik Bilgi Formu (TDS - Technical Data Sheet)** ile yapılır.

---

## 1. Temel Polimer Test Metotları ve Standartları

Kalite kontrol laboratuvarlarında uygulanan ve TDS formuna yazılması zorunlu olan kritik testler:

### A. Eriyik Akış Hızı (MFR / MFI - Melt Flow Index - ISO 1133)
*   **Açıklama:** Plastik eriyiğin belirli bir sıcaklık ve yük altında 10 dakikada akan miktarının (gram cinsinden) ölçülmesi.
*   **Önemi:** Granülün enjeksiyona mı (yüksek MFI: 10-25) yoksa şişirme/ekstrüzyona mı (düşük MFI: < 1.0) uygun olduğunu gösterir.

### B. Izod / Charpy Darbe Dayanımı (Impact Strength - ISO 179 / ISO 180)
*   **Açıklama:** Çentikli veya çentiksiz plastik numunenin sarkaçlı bir darbe ile kırılması sırasında absorbe ettiği enerjinin (kJ/m²) ölçülmesi.
*   **Önemi:** Malzemenin kırılganlığını gösterir. Geri dönüştürülmüş PP ve PE'de darbe dayanımı orijinal polimere göre genellikle düşüktür; darbe artırıcı katkıların oranını belirlemek için kritiktir.

### C. Çekme Mukavemeti ve Kopma Uzaması (Tensile Properties - ISO 527)
*   **Açıklama:** Plastik dambıl numunenin çekme cihazında kopana kadar gerilerek uygulanan kuvvet ve uzama miktarının ölçülmesi.
*   **Önemi:** Malzemenin gerilme gücünü ve esnekliğini belgeler.

### D. Yoğunluk Ölçümü (Density - ISO 1183)
*   **Açıklama:** Arşimet prensibi kullanılarak çapağın veya granülün yoğunluğunun ölçülmesi.
*   **Önemi:** Hammaddenin içine karışan inorganik (kalsit vb.) dolguların veya diğer polimer kontaminasyonunun tespitini sağlar.

---

## 2. Laboratuvar Akreditasyonu (ISO/IEC 17025)

Bir tesisin kendi laboratuvarında yaptığı test sonuçlarının uluslararası geçerliliğe sahip olması için **ISO/IEC 17025 Laboratuvar Akreditasyonu** belgesine sahip olması gerekir.
*   Akredite laboratuvardan çıkan TDS raporları, global markaların (örneğin Unilever, Vestel) kalite onay süreçlerinden (homologasyon) doğrudan geçer.
*   Akreditasyon süreci; cihaz kalibrasyonları, test metotlarının doğrulanması ve personelin sürekli eğitilmesini kapsar.

---

## 3. Yazılım Entegrasyonu (Lot Kalite Kartları ve Supabase Entegrasyonu)

Enba yazılımında üretilen her lot (palet/bigbag) için veritabanında kalite kayıtları tutulur:
*   **Lot Kalite Kartları Şeması (`lot_quality_records`):**
    `lot_no`, `production_date`, `mfi_value`, `impact_value`, `density`, `moisture`, `color_grade`, `status (Onaylandı/Reddedildi)`.
*   **TDS Oluşturucu:** Sevkiyat aşamasında, sevk edilen lot numaraları sisteme girildiğinde, o lotların test ortalamalarını alan resmi bir **TDS PDF** dosyası otomatik oluşturulur ve irsaliyeye eklenir.

---

## 4. İlişkili Sayfalar
*   [[Katki-Maddeleri-ve-Kompozitler]] - Katkıların MFI ve darbe dayanımına etkileri
*   [[HDPE-Yuksek-Yogunluk-Polietilen-Dinamikleri]] - Şişirme / Enjeksiyon MFI değerleri farkı
*   [[Kirleticiler-ve-Kalite-Kontrol-Taksonomisi]] - Kül fırını testi ile dolgu oranı tayini
