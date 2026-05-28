# Piyasaya Çıkış Stratejisi (Go-To-Market - GTM)

> **Tip:** Wiki Sayfası / Strateji Belgesi
> **Oluşturma:** 2026-05-28
> **Durum:** Taslak / Müşteri Değerlendirmesinde

Enba Similasyon, genel ERP'lerin (Paraşüt, Logo, vb.) çözemediği **geri dönüşüm ve üretim odaklı proses simülasyonu ile mali planlama** boşluğunu dolduran niş bir B2B SaaS ürünüdür. Bu belge, uygulamanın Türkiye pazarında başarıyla konumlandırılması, fiyatlandırılması ve satılması için yol haritasını içerir.

---

## 1. Değer Önerisi ve Konumlandırma (Unique Selling Proposition)

Geri dönüşüm tesisleri, standart üretim işletmelerinden çok farklı dinamiklere sahiptir. Enba'nın en büyük gücü, bu spesifik dinamikleri derinlemesine modellemiş olmasıdır:

*   **Nem ve Giriş Firesi Yönetimi:** Hammaddenin ıslaklığı, içindeki çöpler ve alt kalite fraksiyonlar (kağıt, LDPE, vb.) planlama aşamasında doğrudan maliyete ve yan ürün gelirine dönüştürülür.
*   **Hat Uyumluluk ve Değişim Maliyetleri:** PP, LDPE, HDPE'nin aynı hatta çalışabilmesi ama aynı anda çalışamaması, hat temizliği sırasında yaşanan zaman ve malzeme kayıpları Enba tarafından simüle edilir.
*   **M-Kodu Finansal Taksonomi:** Tek Düzen Hesap Planı ile entegre, geri dönüşüm prosesine özel 12 bölümlük finansal taksonomi (M-kodları) sayesinde nokta atışı EBITDA ve EBIT analizi sunulur.
*   **Gerçek Zamanlı Karşılaştırma (Paraşüt):** Detaylı planlar, Paraşüt muhasebe entegrasyonu sayesinde "Planlanan vs. Gerçekleşen (BudgetTrack)" olarak canlı izlenebilir.
*   **AI Danışman Desteği:** Tesisin kapasite boşluklarını, verimlilik kayıplarını ve finansal darboğazlarını otomatik analiz eden yerleşik bir yapay zeka asistanı bulunur.

> [!NOTE]
> **Slogan Önerisi:** *"Geri Dönüşüm Tesisleri İçin Akıllı Proses Planlama ve Mali Simülasyon"* veya *"Firesini Yöneten, Karlılığını Yönetir."*

---

## 2. Hedef Kitle ve Pazar Segmentasyonu

Türkiye'de plastik, kağıt, karton, metal ve cam geri dönüşümü yapan **5.000 – 20.000 arasında aktif lisanslı tesis** bulunmaktadır. Bunlar 3 ana segmente ayrılır:

### A. Küçük Ölçekli Tesisler (1-2 Hat, Elle Ayrıştırma)
*   **Profil:** Genellikle Excel kullanan, finansal analizleri manuel yapan, Paraşüt veya basit muhasebe programları kullanan işletmeler.
*   **Acı Noktası:** Karlılığı tam görememek, fireyi doğru hesaplayamamak, nakit akışını tahmin edememek.
*   **Giriş Stratejisi:** FastPlan (Hızlı Planlama) ve temel Varlık Takibi modülleri ile kolay onboarding.

### B. Orta Ölçekli Tesisler (3-5 Hat, Mekanik & Yıkama) - *Ana Hedef Kitle*
*   **Profil:** Makine yatırımı olan, birden fazla vardiyada çalışan, profesyonel yönetim kadrosuna geçiş sürecindeki firmalar.
*   **Acı Noktası:** Hat verimliliği, makine amortismanı, personel maliyetleri ve Paraşüt'teki muhasebe verileriyle üretim planlarının uyuşmaması.
*   **Giriş Stratejisi:** DetailedPlan (Proses Bazlı Planlama), BudgetTrack (Gerçek Veri Girişi), Paraşüt entegrasyonu ve AI Danışman.

### C. Büyük Ölçekli Tesisler (5+ Hat, Kimyasal Geri Dönüşüm, Çoklu Tesis)
*   **Profil:** Kurumsal ERP'ler (SAP, IFS, Logo Tiger) kullanan, gelişmiş laboratuvarları ve Ar-Ge merkezleri olan holdingler.
*   **Acı Noktası:** Kurumsal ERP'lerin hantal olması, proses simülasyonunu ve senaryo analizlerini (duyarlılık analizleri) yapamaması.
*   **Giriş Stratejisi:** Kurumsal ERP'lerin yanına "Simülasyon ve Karar Destek Sistemi" olarak konumlandırma.

---

## 3. Fiyatlandırma Modeli (SaaS Pricing)

Fiyatların **2.000 ₺ – 4.000 ₺/ay/şirket** bandında olması planlanmaktadır. Yıllık aboneliklerde **%20-25 indirim** sunulmalıdır (SaaS nakit akışını hızlandırmak için).

| Plan | Aylık Ücret (₺) | Kapsam | Kimler İçin? |
| :--- | :--- | :--- | :--- |
| **Enba Starter** | 1.999 ₺ | 1 Tesis, FastPlan, Varlık Takibi, Temel Görev Yönetimi (Maks. 3 Kullanıcı) | Küçük Tesisler / Yeni Girişimciler |
| **Enba Pro** *(Önerilen)* | 3.499 ₺ | Sınırsız Hat, DetailedPlan (Granül + İlerideki Prosesler), Paraşüt Entegrasyonu, BudgetTrack, AI Danışman (Maks. 10 Kullanıcı) | Orta Ölçekli Tesisler |
| **Enba Enterprise** | Teklif Alın | Çoklu Tesis, Özel Proses Modelleme, Sınırsız Kullanıcı, Dedicated Sunucu/Supabase, 7/24 Destek | Büyük Tesisler / Entegre Üreticiler |

> [!TIP]
> **Pilot Müşteri İndirimi:** İlk 3 ay içinde sisteme dahil olacak pilot müşterilere "Ömür Boyu %50 İndirim" veya "İlk Yıl Ücretsiz" fırsatı sunularak vaka analizi (case study) toplanmalıdır.

---

## 4. Pazarlama ve Satış Kanalları (Go-To-Market)

Geri dönüşüm sektörü geleneksel ilişkilere dayalıdır. Bu nedenle dijital reklamlardan ziyade **doğrudan satış ve sektörel network** ağırlıklı bir strateji izlenmelidir.

### Faz 1: Pilot Lansman (0 - 3 Ay)
1.  **Referans Tesis Uygulaması:** Enba'nın kendi tesisinde günlük operasyonlarda aktif kullanımı. Bu kullanımdan ekran görüntüleri, başarı hikayeleri ve "Enba öncesi vs. sonrası" karlılık raporları hazırlanmalıdır.
2.  **Dost İşletmeler (3 Tesis):** Tanıdık 3 orta ölçekli tesise sistem ücretsiz kurulmalı, onların gerçek verileriyle BudgetTrack test edilmeli ve sistemin onlara kazandırdığı para (örn: *"Nem firesini doğru yöneterek ayda 80.000 ₺ tasarruf ettik"*) belgelenmelidir.
3.  **Demo Veri Seti (`demo@enba.com`):** Potansiyel müşterilere gösterilmek üzere, tamamen gerçekçi ama anonimleştirilmiş bir "Bornova Pilot Tesis" demo verisi hazırlanmalıdır.

### Faz 2: Sektörel Nüfuz (3 - 6 Ay)
1.  **Sanayi Bölgeleri Sahası:** İzmir Kemalpaşa OSB, Bornova Pınarbaşı, İstanbul İkitelli OSB, Adana Hacı Sabancı OSB gibi geri dönüşümün kalbi olan bölgelerde doğrudan ziyaretler (soğuk satış / kapı çalma).
2.  **Sektörel Dernekler:** PAGDER, GEKADER ve TÜDAM gibi derneklere üye olunmalı, dernek bültenlerinde *"Geri Dönüşümde Maliyet Simülasyonu ve Dijitalleşme"* konulu makaleler yayınlanmalıdır.
3.  **LinkedIn İçerik Pazarlaması:** Kurucu ortaklar ve Enba profili üzerinden teknik içerikler paylaşılmalıdır. Örn:
    *   *“PP hat temizliği yaparken kaybettiğiniz 4 saat size kaça mal oluyor? Hesapladık.”*
    *   *“Paraşüt verilerini Excel'e taşımaktan sıkılmadınız mı? budgetTrack ile tanışın.”*

### Faz 3: Genişleme ve Ölçeklenme (6+ Ay)
1.  **Paraşüt App Store / Entegrasyon Pazarı:** Paraşüt entegrasyonu tamamlandığı için Paraşüt'ün kendi uygulama marketinde *"Geri Dönüşüm Sektörü İçin Entegre Simülasyon"* olarak yer alınmalı. Bu, çok büyük bir organik müşteri akışı sağlayacaktır.
2.  **Sektörel Fuarlar:** Plast Eurasia İstanbul veya REW İstanbul (Geri Dönüşüm ve Çevre Teknolojileri Fuarı) gibi fuarlara katılım.

---

## 5. Lansman Öncesi Teknik ve İdari Yapılacaklar Listesi

Ürünün yayına alınabilmesi için teknik olarak tamamlanması gereken kritik adımlar:

*   [ ] **Abonelik & Ödeme Sistemi:** Supabase ile entegre iyzico / PayTR abonelik sistemi API'lerinin yazılması veya Manuel Havale/EFT takibi için altyapı oluşturulması.
*   [ ] **KVKK & Veri Güvenliği Kontrolü:** Multi-tenant RLS (Row Level Security) politikalarının sızdırmazlık testleri. Bir şirketin verisinin diğer şirkete kesinlikle görünmediğinin doğrulanması.
*   [ ] **Onboarding & Eğitim Videoları:** Tesis yöneticileri için 2'şer dakikalık 5 temel video rehber (Sisteme kayıt, Makine ekleme, İlk planı oluşturma, Paraşüt'ü bağlama, Bütçe takibi).
*   [ ] **Hukuki Sözleşmeler:** Kullanıcı Sözleşmesi (SaaS Agreement), KVKK Açık Rıza ve Gizlilik Politikası metinlerinin uygulamaya eklenmesi.

---

## 6. Bir Sonraki Aksiyon Adımları

Enba'nın piyasaya çıkış sürecine katkı sunmak için yazılım tarafında hemen şu adımları atabiliriz:
1.  **Demo Modu İyileştirmesi:** `demo@enba.com` ile giriş yapıldığında potansiyel müşteriyi karşılayacak ve modülleri gezdirecek rehber bir ekran veya hazır veri setlerinin (granül makineleri, örnek planlar, örnek nakit akışları) iyileştirilmesi.
2.  **Onboarding Modülü:** Yeni kayıt olan bir şirketin doğrudan boş ekranlar yerine "Örnek Verileri Yükle" diyerek 10 saniyede sistemi çalışır halde görebileceği bir yapı kurulması.
3.  **Paraşüt → financial_categories Eşleştirme Modalı:** Planlama ile gerçekleşeni birleştiren son köprü olan Paraşüt kategori eşleştirmesinin Supabase tablosundan çekilerek stabil hale getirilmesi (Backlog'daki öncelikli teknik görev).
