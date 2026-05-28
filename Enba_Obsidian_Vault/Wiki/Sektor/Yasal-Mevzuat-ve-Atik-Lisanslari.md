---
type: Sektor
status: Taslak
tarih: 2026-05-28
tags: [sektor, yasal-mevzuat, lisanslar, tat, gdt, ecbs, motat, kutle-denge]
---

# Atık Yönetimi Lisansları ve Yasal Mevzuat Uyum Süreçleri

Geri dönüşüm sektörü, Çevre, Şehircilik ve İklim Değişikliği Bakanlığı'nın sıkı denetimi altındadır. Tesislerin yasal olarak faaliyet gösterebilmesi, lisans uyumluluklarının takibi ve zorunlu devlet raporlamalarının (Kütle Denge Sistemi) yapılması yazılımsal entegrasyon gerektirir.

---

## 1. Temel Çevre İzin ve Lisans Belgeleri

Geri dönüşüm tesislerinin operasyonel sınırlarını belirleyen yasal belgeler:

### A. TAT (Toplama Ayrırma Tesisi) Lisansı
*   **Yetki:** Belediyelerden veya sanayiden gelen karışık atıkları tesisine kabul etme, ayıklama ve balyalama yetkisi verir.
*   **Sınır:** Malzemeyi eritemez veya kimyasal/fiziksel yapısını değiştiremez (granül makinesi veya yıkama hattı işletemez).

### B. GDT (Geri Kazanım Tesisi) Lisansı
*   **Yetki:** Balyalanmış veya ayıklanmış plastik/kağıt atıkları mekanik (yıkama, kırma, ekstrüzyon) veya kimyasal (piroliz) yöntemlerle işleme ve yeni hammaddeye dönüştürme yetkisi verir.
*   **Sınır:** Doğrudan kaynağında ayrışmamış evsel çöp kabul edemez.

### C. GFB (Geçici Faaliyet Belgesi)
*   Yeni kurulan tesislerin lisans başvurusu onaylandığında verilen, 1 yıl geçerli olan ve tesisin kurulup deneme üretimi yapmasına izin veren ön belgedir.

---

## 2. Devlet Bilgi Sistemleri ve Raporlama Yükümlülükleri

Tesislerin EÇBS (Entegre Çevre Bilgi Sistemi) üzerinden her ay düzenli veri bildirimleri yapması zorunludur:

*   **MoTAT (Mobil Atık Takip Sistemi):** Tehlikeli veya bazı özel tehlikesiz atıkların tırlarla nakliyesi sırasında GPS üzerinden yasal takibini sağlayan sistemdir. Her sevkiyat için sistemden benzersiz bir MoTAT kodu alınmalıdır.
*   **KDS (Kütle Denge Sistemi):** 
    *   Tesislerin en kritik yasal raporudur.
    *   Sisteme giren her ton atığın (`Tehlikesiz Atık Kodu` ile), proses sırasındaki firelerin, stok durumunun ve satılan mamul tonajının bakanlığa beyan edilmesidir. Giren atık ile çıkan mamul+fire eşit olmalıdır (`Giren Atık = Çıkan Ürün + Bakiye Atık + Fire`).

---

## 3. Yazılım Entegrasyonu (Enba Lisans ve Raporlama Modülü)

Enba platformu, tesislerin yasal denetim yükünü hafifletir:
*   **Kütle Denge Otomasyonu:** Stok ve üretim kayıtları kullanılarak, Çevre Bakanlığı KDS formatına uygun aylık kütle denge raporları tek tıkla Excel/XML formatında dışa aktarılır.
*   **Lisans Takip & Arşiv Sistemi:** GFB, TAT ve GDT belgelerinin bitiş tarihleri `Licensing.tsx` modülünde takip edilir; sürenin bitmesine 3 ay kala sistem otomatik uyarı bandı gösterir.
*   **Atık Kodları Eşleştirmesi:** Satın alınan hammaddeler sisteme kaydedilirken resmi atık kodları (örn: `15 01 02` Plastik Ambalaj, `20 01 01` Kağıt ve Karton) ile eşleştirilerek yasal uyum sağlanır.

---

## 4. İlişkili Sayfalar
*   [[Lojistik-ve-Tedarik-Zinciri]] - MoTAT kodlarının nakliye irsaliyelerine bağlanması
*   [[GRS-ve-Gida-Mevzuatlari]] - GRS kütle dengesi (Mass Balance) ile devlet KDS raporlarının karşılaştırılması
*   [[Archive]] - Resmi çevre denetim belgelerinin saklanması ve arşivlenmesi
