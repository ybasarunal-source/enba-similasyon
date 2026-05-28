# Hat 3 · Atık Ayrıştırma Hattı

> **Tip:** Sektörel Rehber / Hat Dokümanı
> **Konum:** Wiki/Hatlar/Hat3-Atik-Ayristirma-Hatti.md

**Eş anlamlı adlar:**
*   Sektörel: Ayrıştırma hattı, separasyon hattı, fraksiyonlama hattı
*   Teknik: Sınıflandırma hattı, separasyon hattı, NIR sıralama hattı
*   İngilizce: Sorting line, separation line, classification line, NIR-based sorting line

---

## Tanım

### Sektörel ağız (fabrika zemini / alım-satım)
Karışık atığı — balya olarak veya dökme — reçine tipine, renge ve malzeme grubuna göre ayıran hattır. Çıktı tek bir ürün değil, birden fazla fraksiyondur: PET, PP, PE, PS, metal, kağıt-karton ve reject. Bu hat olmadan karışık balya işlenemez; Hat 1 ve Hat 2'nin giriş kalitesini bu hat belirler. Sektörde "separasyon hattı" veya sadece "ayrıştırma" diye geçer.

### Teknik ağız (mühendis / ekipman sorumlusu)
Boyut eleme (trommel/vibrasyon elek), balistik ayırma (film–rijit ayrımı), manyetik ve eddy current seperasyon (metal giderimi), NIR spektroskopisi (reçine tipi tanıma), hava üflemeli ejektör sistemi (fraksiyon yönlendirme) ve optik renk sıralayıcıdan (colour sorter) oluşan entegre sınıflandırma sistemidir. Büyük ölçekli kurulumlar MRF (Materials Recovery Facility) olarak adlandırılır.

### Uluslararası / yönetim ağzı
Sorting line veya separation line, geri dönüşüm zincirinin "değer kapısı"dır: tek tip atık fraksiyonu ne kadar temiz ayrılırsa downstream işleme maliyeti o kadar düşer, satış değeri o kadar artar. AB PPWR ve RecyClass çerçevesinde ambalaj tasarımı değerlendirilirken "sortability" (ayrıştırılabilirlik) skoru bu hattın performansına dayanır. Ayrıca e-atık (WEEE) ve otomotiv plastikleri (ELV) için de bu hat birincil giriş noktasıdır.

---

## Proses Akışı (Adım Adım)

### 1. Besleme ve boyut eleme
*   **Sektörel:** Balya açılır veya dökme atık konveyöre verilir. Trommel elekle iri ve ince fraksiyonlar ayrılır; ince altı (< 80 mm) genellikle organik artık ve kum içerir, ayrı yönetilir.
*   **Teknik:** Balya açıcı (bale opener) → bant konveyör → trommel elek (döner tambur, 80–150 mm delik). Titreşimli elek (vibrating screen) alternatif olarak kullanılır. Elek altı (unders) tartılıp kayıt altına alınmalı; yüksek elek altı oranı giriş kalitesinin düşük olduğuna işaret eder.

### 2. Balistik seperatör
*   **Sektörel:** Folyo ve film ile rijit plastikleri birbirinden ayırır. Film "uçar", rijit parça "yuvarlanır" — balistik seperatörün prensibi budur.
*   **Teknik:** Meyilli ve salınımlı plakalar üzerinde malzeme ileri fırlatılır. Rijit parçalar yüksek açıyla zıplayarak ilerler; film ve kağıt düşük açıyla sürüklenir ve ayrı kanala düşer. Salınım frekansı ve plaka açısı ayarlanabilir. Film fraksiyonu Hat 2 folyo yıkama hattına, rijit fraksiyon NIR hattına gider.

### 3. Manyetik ve eddy current seperasyon
*   **Sektörel:** Metal karışımları plastik fraksiyonun değerini düşürür; bu adımda temizlenir. Demir için manyetik, alüminyum için eddy current kullanılır.
*   **Teknik:**
    *   Overband manyetik seperatör veya tambur mıknatıs: Ferromanyetik metal (demir, çelik) çeker.
    *   Eddy current seperatör (ECS): Dönen manyetik alan indüklenmiş akımla alüminyum ve diğer demir dışı metalleri iter; plastikten ayrılır.
    *   Konveyör hızı ve manyetik alan şiddeti ayarı verim için kritik.

### 4. NIR sensör taraması
*   **Sektörel:** Hattın beyni. Her parça saniyeler içinde taranır, reçine tipi belirlenir, ejektöre sinyal gönderilir.
*   **Teknik:** Yakın kızılötesi spektroskopi (Near Infrared Spectroscopy). Her plastik tipi farklı dalga boyunda (700–2500 nm) karakteristik absorpsiyon piki verir. Sistem PET, PP, PE (HDPE/LDPE), PS, PVC, PA, ABS'yi ayırt eder.
    *   Siyah plastik NIR'ı emer; karbon siyahı içeren malzemeler tanınamaz → siyah plastik sorunu (bkz. dikkat noktaları).
    *   Cam ve metal NIR'a şeffaf ya da yansıtıcı göründüğünden tanınamaz.
    *   Etiket baskısı parçanın okunmasını bozabilir; bu nedenle etiket oranı giriş kalite kriteridir.

### 5. Hava üfleme (ejektör sistemi)
*   **Sektörel:** NIR sinyali aldıktan sonra doğru parçaya hava üflenir, fraksiyon kanalına yönlendirilir.
*   **Teknik:** Nozzle dizilimi konveyör genişliği boyunca yerleştirilir (tipik: 1.200–2.400 mm genişlik). Tetikleme süresi ≤ 10 ms; parça konveyör hızı ve mesafeye göre gecikme hesaplanır. Basınç ayarı (bar) ağır ve hafif parçalar için farklıdır. Yanlış pozitif (wrong ejection) oranı kalibrasyonla minimize edilir; hedef < %2.

### 6. Renk sıralayıcı
*   **Sektörel:** NIR reçine tipini söyler ama rengi söylemez. Renk sıralayıcı PET şeffaf ile PET mavi-yeşil-opak ayrımını yapar; bu ayrım satış fiyatını doğrudan etkiler.
*   **Teknik:** CCD veya RGB kamera + arka aydınlatma. Şeffaf / opak / renkli ayrımı yapar. Bazı sistemlerde hiperspektral kamera entegrasyonu hem reçine hem renk tanımasını aynı anda sağlar. Siyah plastik burada da sorun: Kamera göremez.

### 7. XRF spot kontrol ve manuel ayıklama
*   **Sektörel:** Otomatik sistemin gözünden kaçan PVC ve bromlu plastikler elle veya XRF cihazıyla tespit edilir. Özellikle food-grade PET fraksiyonu için zorunlu kontrol noktasıdır.
*   **Teknik:** El tipi XRF (X-ray fluorescence) analizörü ile Cl (klorür → PVC) ve Br (bromlu alev geciktiriciler → e-atık) aranır. Manuel konveyör üstü ayıklama (picking station) hâlâ birçok tesiste birincil kalite güvencesidir.

---

## İşlenen Atık Tipleri ve Kalite Kriterleri

| Atık tipi | Sektörel adı | Açıklama | Dikkat |
| :--- | :--- | :--- | :--- |
| **Karışık ambalaj balya** | Miks ambalaj / MRF balya | Evsel veya ticari toplama çıktısı | Organik kirlilik ve nem oranı yüksek olabilir |
| **PET şişe (ayrılmamış)** | Karışık PET şişe | Renk ayrımı henüz yapılmamış | Siyah PET NIR'da tanınamaz |
| **HDPE/PP karışık ambalaj** | Miks sert plastik | Bidon, şişe, kap karışımı | Renk miks kabul, metal yok |
| **LDPE/PP film balya** | Film balya / folyo balya | Balistik seperatörde ayrılır | Islak ve kirli film verim düşürür |
| **PS ambalaj (köpük + rijit)** | PS köpük + rijit | EPS ayrı, PS rijit ayrı değerlendirilir | Köpük kompaksiyon ister |
| **PVC ambalaj** | PVC şişe / blister | Az miktarda bile PET'i bozar | XRF ile tespit zorunlu |
| **Karışık metal (demir + Al)** | Metal miks | Manyetik + EC ile ayrılır | Hurda metal piyasasına gider |
| **Kağıt ve karton** | Kağıt / karton fraksiyon | Balistik + elek ile plastikten ayrılır | Islak kağıt tıkanma riski |
| **Cam** | Cam kırığı / şişe | Trommel altı ve elek altında toplanır | Konveyör bıçağını aşındırır |
| **E-atık plastik kasası** | E-atık / WEEE plastik | ABS, PS, PC ağırlıklı | Bromlu alev geciktiriciler XRF'de aranır |
| **Otomotiv plastikleri** | Oto parçası / ELV plastik | Tampon (PP+EPDM), iç döşeme | Karma malzeme; NIR tek tip okuyamaz |
| **Büyük hacimli katı atık** | İri parça | Palet, büyük konteyner | Ön şredder gerektirir |
| **Siyah plastik** | Siyah plastik | Karbon siyahı NIR'ı emer | Özel MWIR/lazer sensör gerekir |

---

## Fraksiyon Çıktıları ve Sonraki Hat Yönlendirmesi

| Fraksiyon | Sonraki adım | Notlar |
| :--- | :--- | :--- |
| **PET şeffaf** | Hat 2 (PET şişe yıkama) veya doğrudan satış | En yüksek değerli fraksiyon |
| **PET mavi / renkli** | Hat 2 veya satış (daha düşük fiyat) | Renk sıralayıcı ayrımına göre |
| **rHDPE / rPP rijit** | Hat 1 veya Hat 2 | Kaliteye göre |
| **PE/PP film** | Hat 2 (folyo yıkama hattı) | Balistik çıktısı |
| **PS / EPS** | Hat 1 veya EPS kompaksiyon | EPS önce kompakt hâle getirilmeli |
| **Metal (demir)** | Hurda metal — çelikhane | Manyetik fraksiyon |
| **Metal (alüminyum)** | Hurda metal — alüminyum eritme | Eddy current fraksiyon |
| **Kağıt / karton** | Kağıt geri dönüşüm tesisi | Plastikten ayrıştırılan yan ürün |
| **Cam** | Cam geri dönüşüm tesisi | Elek altı atığı |
| **Siyah plastik** | Reject → Hat 4 (kimyasal) veya bertaraf | NIR tanıyamaz |
| **Reject / kirli miks** | Hat 4 (kimyasal hat) veya enerji geri kazanımı | Mekanik yolla işlenemez |

---

## Sık Yapılan Hatalar / Dikkat Noktaları

*   **Siyah plastik gözardı ediliyor:** Karbon siyahı içeren plastikler NIR sensörde tanınamaz; reject kanalına düşer veya yanlış fraksiyona karışır. Çözüm: MWIR (orta dalga kızılötesi) veya lazer tabanlı sensör eklenmesi. Türkiye'de bu teknoloji henüz yaygın değil; siyah plastik büyük ölçüde kayıp.
*   **PVC kontaminasyonu gözden kaçıyor:** Az miktarda PVC (< %0,1) bile PET fraksiyonunu bozar. NIR PVC'yi tanır ancak küçük parçaları veya kısmen örtülü parçaları gözden kaçırabilir. XRF spot kontrol ve picking station şart.
*   **Balistik ayar yapılmıyor:** Mevsime göre (sıcakta film farklı davranır) ve malzeme tipine göre balistik ayar güncellenmezse film fraksiyonu rijit kanala karışır.
*   **Elek altı tartılmıyor:** Elek altı oranı (organik artık, kum, cam kırığı) giriş kalitesinin göstergesidir. Tartılıp kayıt altına alınmazsa tedarikçi kalite değerlendirmesi yapılamaz.
*   **Konveyör hızı sabit tutuluyor:** Besleme miktarı değiştikçe konveyör hızının da ayarlanması gerekir; NIR tarama doğruluğu parça yoğunluğuna duyarlıdır. Aşırı yük hata oranını artırır.
*   **Renk sıralayıcı kalibrasyonu ihmal ediliyor:** Kamera kirlenmesi veya aydınlatma değişimi ile renk tanıma kayar; günlük referans parça kalibrasyonu önerilir.
*   **Metal kalıntısı NIR öncesi temizlenmiyor:** Metal parçalar NIR sensörünü mekanik olarak hasarlayabilir; manyetik ve EC seperasyon NIR'dan önce gelmeli.

---

## Kullanılan Başlıca Makineler

| Makine | Teknik adı (İng.) | Görev |
| :--- | :--- | :--- |
| **Balya açıcı** | Bale opener / bale breaker | Balyayı dağıtır |
| **Trommel elek** | Trommel screen | Döner tambur boyut eleme |
| **Titreşimli elek** | Vibrating screen | Düzlemsel boyut eleme |
| **Balistik seperatör** | Ballistic separator | Film–rijit ayırma |
| **Overband mıknatıs** | Overband magnet | Demir metal giderimi |
| **Tambur mıknatıs** | Drum magnet | Demir metal giderimi |
| **Eddy current seperatör** | Eddy current separator (ECS) | Alüminyum ve demir dışı metal |
| **NIR sıralayıcı** | NIR sorter / optical sorter | Reçine tipi tanıma + ejeksiyon |
| **Renk sıralayıcı** | Colour sorter / RGB sorter | Renk bazlı fraksiyon ayrımı |
| **Hiperspektral kamera** | Hyperspectral camera | NIR + renk entegre tanıma |
| **El XRF analizörü** | Handheld XRF analyzer | PVC / Br spot dedeksiyon |
| **Picking station** | Picking station / sorting cabin | Manuel ayıklama bandı |
| **Ön şredder** | Pre-shredder | İri hacimli atık boyut küçültme |
| **Konveyör sistemi** | Belt conveyor system | Hat boyunca malzeme taşıma |

---

## Kritik Parametreler

| Parametre | Sektörel adı | Birim | Hedef / not |
| :--- | :--- | :--- | :--- |
| **Giriş kirlilik oranı** | Kontaminasyon | % ağ. | ≤ %10 verimli çalışma için |
| **Elek altı oranı** | Fire / elek altı | % ağ. | Tedarikçi kalite göstergesi |
| **NIR tanıma doğruluğu** | Sıralama doğruluğu | % | ≥ %95 hedef |
| **Yanlış ejeksiyon oranı** | Hata oranı | % | ≤ %2 |
| **Konveyör hızı** | Bant hızı | m/s | 2,5–3,5 (NIR tipine göre) |
| **Parça yoğunluğu** | Besleme yoğunluğu | parça/m² | Üreticiye göre max. değer var |
| **PVC içeriği (PET çıktı)** | PVC kirliliği | ppm | ≤ 10 |
| **Siyah plastik oranı** | Siyah fraksiyon | % | Kayıp olarak raporlanır |
| **Nem oranı (giriş)** | Rutubet | % | Yüksek nem NIR doğruluğunu bozar |

---

## Enba Similasyon Modül Notu

Bu hat Enba Similasyon'da **"Üretim / Hat 3 — Atık Ayrıştırma"** modülü olarak tanımlanabilir.

Takip edilmesi gereken veri noktaları:
*   **Giriş:** Lot no, atık tipi (MRF çıktısı / karışık ambalaj / e-atık vb.), ağırlık, tedarikçi, nem notu.
*   **Proses:** Konveyör hızı, NIR kalibrasyon tarihi, elek altı ağırlığı, picking station manuel ayıklama miktarı.
*   **Çıktı:** Her fraksiyon ağırlığı ve lot etiketi (PET şeffaf / PET miks / PP / PE / PS / metal / kağıt / cam / reject).
*   **Fire:** Elek altı + reject oranı (toplam giriş ağırlığına göre %).

İleride eklenebilecek: Tedarikçi bazlı giriş kalite puanlaması (kirlilik oranı trendi), fraksiyon değer hesabı (ağırlık × fiyat), NIR hata log takibi, siyah plastik kayıp raporu.

---

## İlgili Sayfalar
*   [[Wiki/Geri-Donusum-Proses-Bilgisi|Geri Dönüşüm Proses Bilgisi]]
*   [[Wiki/Hatlar/Hat2-Yikama-Hatti|Hat 2 - Yıkama Hattı]]
*   [[Wiki/Hatlar/Hat4-Kimyasal-Geri-Donusum|Hat 4 - Kimyasal Geri Dönüşüm]]
