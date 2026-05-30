# Enba Wiki — Index
> **Claude Code bu dosyayı her oturumda ilk okur.**
> Yeni sayfa eklendiğinde veya mevcut sayfa güncellendiğinde bu index'i de güncelle.
> Format: `[[Klasör/Dosya|Başlık]]` — özet — *son güncelleme*

---

## Memory (Claude Code Kalıcı Hafızası)

| Sayfa | Özet | Son Güncelleme |
|-------|------|----------------|
| [[Memory/MEMORY.md\|Memory Index]] | Tüm memory pointer'ları — her oturumda oku | 2026-05-05 |

---

## Nasıl Kullanılır (Claude Code için talimat)

1. Oturum başında bu dosyayı oku → konuyla ilgili sayfaları belirle
2. İlgili sayfalara git, oku
3. Değişiklik yaptıktan sonra ilgili sayfaları güncelle
4. Bu index'i güncelle (yeni sayfa eklendiyse)
5. `log.md`'ye oturum girişi ekle

---

## Proje

| Sayfa | Özet | Son Güncelleme |
|-------|------|----------------|
| [[Proje/Ana-Proje\|Ana Proje]] | Genel bakış, aktif görevler, son değişiklikler | 2026-05-04 |
| [[Kaynaklar/Claude-Code-Entegrasyon\|Claude Code Entegrasyon]] | Oturum başı/sonu workflow, token tasarrufu rehberi | 2026-05-04 |

---

## Mimari & Kararlar

| Sayfa | Özet | Son Güncelleme |
|-------|------|----------------|
| [[Kararlar/Mimari-Kararlar\|Mimari Kararlar]] | Custom history stack, no-Redux, Google implicit OAuth kararları | 2026-05-04 |
| [[Kararlar/2026-05-RLS-Dersleri\|RLS Dersleri]] | 5 kural: DROP POLICY tuzakları, SECURITY DEFINER, auth.jwt(), HTTP 500 teşhisi | 2026-05-05 |
| [[Kararlar/2026-05-Auth-Sorunlari\|Auth Sorunları]] | Tüm kırmızı liste kapatıldı — RLS, DataService, profil bant, SuperAdmin UI | 2026-05-05 |
| [[Kararlar/2026-05-MKodu-Finansal-Taksonomi\|M-Kodu Finansal Taksonomi]] | financial_categories tablosu aktif; Paraşüt + diğer modüller henüz bağlanmadı | 2026-05-14 |
| [[Kararlar/2026-05-DetailedPlan-Veri-Girisi\|DetailedPlan Veri Girişi]] | Karar bekleniyor — plan oluşturma akışı, Supabase şeması, inline editing, aktüeller | 2026-05-19 |
| [[Kararlar/2026-05-Parasut-Token-Supabase\|Paraşüt Token Supabase]] | Karar verildi — localStorage → parasut_tokens tablosu, RLS, company izolasyonu | 2026-05-19 |
| [[Kararlar/2026-05-Modul-Reskin-Plani\|Modül Reskin Planı]] | Tüm modüller DetailedPlan tasarım diline geçiyor — Faz 1 global CSS katmanı tamamlandı | 2026-05-23 |
| [[Kararlar/2026-05-GranulUretimi-Parametre\|Granül Üretimi Parametreleri]] | Tüm proses parametreleri, makine verileri, fiyatlar, sabit giderler — wizard veri girişi referansı | 2026-05-23 |

---

## Modüller

| Sayfa | Özet | Son Güncelleme |
|-------|------|----------------|
| [[Moduller/00-Modul-Listesi\|Modül Listesi]] | 23 modülün tam listesi, core vs izinli, sidebar grupları, yeni modül adımları | 2026-05-14 |
| [[Moduller/KurulumNakit\|KurulumNakit Modülü]] | Hesap tipi sistemi, Banka Nakdi günlük grafik mantığı, KPI hesaplamaları, export seçenekleri | 2026-05-30 |
| [[Moduller/Ayarlar\|Finansal Ayarlar]] | financial_categories Supabase tablosu, M-kodu hiyerarşi yönetimi, seed/özel kategori | 2026-05-14 |
| [[Moduller/VarlikTakibi\|Varlık Takibi]] | Sabit varlıklar (amortisman) + depozitolar, TL/EUR çift görünüm, M/K/V filtre | 2026-05-14 |

---

## Snippets & Kod Kalıpları

| Sayfa | Özet | Son Güncelleme |
|-------|------|----------------|
| [[Snippets/Supabase-Pattern\|Supabase Pattern]] | Servis nesnesi şablonu, modül bileşeni şablonu, localStorage, çeviri ekleme | 2026-05-04 |

---

## Wiki (LLM tarafından üretilen sentez sayfaları)

| Sayfa | Özet | Son Güncelleme |
|-------|------|----------------|
| [[Wiki/Entegrasyon-Mimarisi\|Entegrasyon Mimarisi]] | Microsoft/Google/Paraşüt OAuth karşılaştırması, login akışı, riskler | 2026-05-04 |
| [[Wiki/Is-Modeli\|İş Modeli & Hedefler]] | Kendi şirket ERP'i + SaaS demo/pazarlama, multi-tenancy kritik, SQL öncelikleri | 2026-05-04 |
| [[Wiki/Geri-Donusum-Proses-Bilgisi\|Geri Dönüşüm Proses Bilgisi]] | Malzeme akışı, fire tipleri, hat uyumluluğu, wizard adımları — granül + ilerideki prosesler | 2026-05-24 |
| [[Kararlar/2026-05-Mobil-Modul-Kararlari\|Mobil Modül Kararları]] | Hangi modüller mobil, hibrit teknik yaklaşım (C), mail inbox odaklı not | 2026-05-24 |
| [[Wiki/Nakit-Akis-Takip-Rehberi\|Nakit Akışı Takip Rehberi]] | Şirkete özel hesap rolleri, para akış şeması, mükerrer sayım tuzakları, analiz kuralları | 2026-05-29 |
| [[Wiki/Piyasaya-Cikis-Stratejisi\|Piyasaya Çıkış Stratejisi]] | Enba Similasyon SaaS lansmanı, konumlandırma, fiyatlandırma ve kanal stratejileri | 2026-05-28 |
| [[Wiki/Sektor-Rehberi\|Geri Dönüşüm Sektör Rehberi]] | 5 geri dönüşüm hattının ve lojistik akışının entegrasyon hub sayfası | 2026-05-28 |
| [[Wiki/Hatlar/Hat1-Mekanik-Geri-Donusum\|Hat 1 - Mekanik Geri Dönüşüm]] | Mekanik geri dönüşüm prosesi, makine listesi, kalite kriterleri ve Enba entegrasyonu | 2026-05-28 |
| [[Wiki/Hatlar/Hat2-Yikama-Hatti\|Hat 2 - Yıkama Hattı]] | rPET, HDPE/PP ve film yıkama prosesleri, kaustik banyosu ve parametreleri | 2026-05-28 |
| [[Wiki/Hatlar/Hat3-Atik-Ayristirma-Hatti\|Hat 3 - Atık Ayrıştırma Hattı]] | Trommel, balistik, eddy current ve NIR optik ayrıştırma istasyonu ve verimleri | 2026-05-28 |
| [[Wiki/Hatlar/Hat4-Kimyasal-Geri-Donusum\|Hat 4 - Kimyasal Geri Dönüşüm]] | Piroliz yağı, depolimerizasyon (glikoliz/metanoliz/hidroliz) ve solvent saflaştırma | 2026-05-28 |
| [[Wiki/Hatlar/Hat5-Balyalama-Sevkiyat\|Hat 5 - Balyalama ve Sevkiyat]] | Ambalaj seçimi, tartım kalibrasyonları, lot izlenebilirliği (GRS) ve outfeed lojistik | 2026-05-28 |
| [[Wiki/Sektor/EN643-Kagit-Standartlari\|EN 643 Kağıt Standartları]] | Avrupa standart grades listesi, kirlilik ve nem kabul tolerans limitleri | 2026-05-28 |
| [[Wiki/Sektor/GRS-ve-Gida-Mevzuatlari\|GRS ve Gıda Mevzuatları]] | Global Recycled Standard kütle dengesi izlenebilirliği, EFSA/FDA challenge testleri | 2026-05-28 |
| [[Wiki/Sektor/Kirleticiler-ve-Kalite-Kontrol-Taksonomisi\|Kirleticiler ve Kalite Kontrol]] | Geri dönüşüm kirletici taksonomisi (PVC, stickies, nem), tolerans limitleri, kalite testleri | 2026-05-28 |
| [[Wiki/Sektor/Enerji-Yonetimi-ve-Karbon-Ayak-Izi\|Enerji ve Karbon Ayak İzi]] | Proses spesifik elektrik/ısı tüketimleri, r-Polimer karbon tasarruf modelleri (Scope 1/2/3) | 2026-05-28 |
| [[Wiki/Sektor/Kimyasal-Geri-Donusum-Detay\|Kimyasal Geri Dönüşüm]] | Piroliz yağı klor engeli, solvoliz/depolimerizasyon teknolojileri, reaktör CAPEX/OPEX simülasyonu | 2026-05-28 |
| [[Wiki/Sektor/Lojistik-ve-Tedarik-Zinciri\|Lojistik ve Tedarik Zinciri]] | Geri dönüşüm lojistiği, balyalanmış vs gevşek tır navlun oranları, tedarikçi puanlama | 2026-05-28 |
| [[Wiki/Sektor/Dairesel-Ekonomi-ve-EPR\|Dairesel Ekonomi ve EPR]] | Genişletilmiş Üretici Sorumluluğu kuralları, GEKAP çevre vergisi, Depozito İade Sistemi (DİS) | 2026-05-28 |
| [[Wiki/Sektor/Tesis-Bakim-ve-Asinma-Dinamikleri\|Tesis Bakım ve Aşınma]] | Önleyici bakım duruşları (OEE), kırıcı bıçak ve ekstrüder vida aşınmaları, elektrik/toz maliyet etkisi | 2026-05-28 |
| [[Wiki/Sektor/Su-Yonetimi-ve-Aritma\|Su Yönetimi ve Arıtma]] | Yıkama atık sularının kapalı devre geri kazanımı (DAF, filtrepres), kimyasal giderler | 2026-05-28 |
| [[Wiki/Sektor/Katki-Maddeleri-ve-Kompozitler\|Katkı Maddeleri ve Kompozitler]] | Reçetede kalsit, darbe dayanımı artırıcılar, boyalar (masterbatch) kullanımı ve maliyet etkisi | 2026-05-28 |
| [[Wiki/Sektor/Finansal-Metrikler-ve-ROI\|Finansal Metrikler ve ROI]] | Ton başına EBITDA, OEE verimlilik faktörleri, vadelerden kaynaklı işletme sermayesi açığı | 2026-05-28 |
| [[Wiki/Sektor/Optik-Ayiklama-Teknolojileri\|Optik Ayıklama Teknolojileri]] | NIR spektroskopisi, renk ayıklama, AI kameralar, ejektör valfleri ve kompresör maliyetleri | 2026-05-28 |
| [[Wiki/Sektor/Laboratuvar-Testleri-ve-Akreditasyon\|Laboratuvar Testleri ve TDS]] | ISO 1133 (MFI), ISO 179/180 (Darbe), ISO 527 (Mukavemet), ISO 17025 laboratuvar akreditasyonu | 2026-05-28 |
| [[Wiki/Sektor/Yasal-Mevzuat-ve-Atik-Lisanslari\|Yasal Mevzuat ve Lisanslar]] | TAT ve GDT çevre lisansları, MoTAT atık takip sistemi, devlet kütle denge (KDS) raporlaması | 2026-05-28 |
| [[Wiki/Sektor/AI-ve-Robotik-Ayiklama-Sistemleri\|AI ve Robotik Ayıklama]] | Yapay zeka destekli robot kollar (Delta Picker), bilgisayarlı görü ve manuel ayıklama ROI karşılaştırması | 2026-05-28 |
| [[Wiki/Sektor/Endustri-4.0-ve-SCADA-Entegrasyonu\|Endüstri 4.0 ve SCADA]] | IoT sensörleri, akış/enerji analizörleri, SCADA OEE takibi ve kestirimci bakım modülü | 2026-05-28 |
| [[Wiki/Sektor/Sinirda-Karbon-Duzenleme-Mekanizmasi\|Sınırda Karbon Vergisi (SKDM)]] | AB Yeşil Mutabakatı CBAM kuralları, r-Polimer karbon tasarrufları (Scope 1/2/3) ve sertifikasyon | 2026-05-28 |
| [[Wiki/Sektor/Plastik-Ayirma-Teknolojileri\|Plastik Ayırma Teknolojileri]] | Yüzdürme-batırma (float-sink), NIR optik ayıklama, elektrostatik ve balistik ayırma yöntemleri | 2026-05-28 |
| [[Wiki/Sektor/Basit-Plastik-Tanimlama-Rehberi\|Basit Tanımlama Yöntemleri]] | Plastiklerin yakma, yüzdürme, koklama ve fiziksel yöntemlerle sahada pratik teşhis rehberi | 2026-05-28 |




| [[Wiki/Malzemeler/PET-Capak-Dinamikleri\|PET Çapak Dinamikleri]] | PET çapak kalite sınıfları, PVC kontaminasyon limitleri, IV değerleri ve SSP reaktör katsayıları | 2026-05-28 |
| [[Wiki/Malzemeler/LDPE-Film-ve-Geri-Donusum-Zorluklari\|LDPE Film ve Geri Dönüşüm]] | LDPE film esnekliği, yüksek nem tutma sorunu, aglomerasyon ve eriyik filtreleme dinamikleri | 2026-05-28 |
| [[Wiki/Malzemeler/PP-Polipropilen-ve-Koku-Sorunu\|PP Polipropilen ve Koku Sorunu]] | PP enjeksiyon/ekstrüzyon özellikleri, koku emme problemi ve koku giderme (deodorization) teknolojileri | 2026-05-28 |
| [[Wiki/Malzemeler/HDPE-Yuksek-Yogunluk-Polietilen-Dinamikleri\|HDPE ve Sert Plastik Dinamikleri]] | HDPE renk ayrımının ekonomik önemi (naturel/mix), şişirme vs enjeksiyon MFI farkı | 2026-05-28 |
| [[Wiki/Malzemeler/OCC-ve-Kagit-Geri-Donusum-Prosesleri\|OCC ve Kağıt Geri Dönüşüm]] | Kağıt/karton lif çözücü (pulper) teknolojisi, stickies yapışkan filtreleme ve selüloz lifi kısalma dinamikleri | 2026-05-28 |
| [[Wiki/Malzemeler/PVC-ve-Kontaminasyon-Yonetimi\|PVC ve Kontaminasyon Yönetimi]] | PVC'nin PET geri dönüşümündeki asit/termal kriz etkileri, ayıklama teknolojileri ve kalite limitleri | 2026-05-28 |
| [[Wiki/Malzemeler/PS-Polistiren-ve-EPS-Teknolojileri\|PS ve EPS Geri Dönüşümü]] | Polistiren özellikleri, köpük (strafor) termal sıkıştırma (densifier) ve hacimsel lojistik çözümleri | 2026-05-28 |




---

## Ham Kaynaklar

| Kaynak | Tür | Özet | Eklenme |
|--------|-----|------|---------|
| [[Ham-Kaynaklar/Karpathy-LLM-Wiki\|Karpathy LLM-Wiki]] | Makale | Kalıcı wiki pattern, index+log, Obsidian+Claude Code entegrasyonu | 2026-05-04 |
| CLAUDE.md (vault içi) | Schema | Oturum protokolü, wiki bakım kuralları, mimari özet | 2026-05-04 |
| [[Ham-Kaynaklar/2026-05-Nakit-Akisi-Uretim-Ozeti\|Nakit Akışı & Üretim Özeti]] | Operasyonel özet | Gerçek nakit tablosu, üretim parametreleri, 3 ay projeksiyon, KDV mahsup — DetailedPlan için ilk gerçek veri | 2026-05-19 |
| [[Ham-Kaynaklar/2026-05-GranulUretimi-IsPlan\|Granül Üretimi İş Planı]] | Konuşma kaydı / hesap motoru | 21 iterasyonlu granül tesisi iş planı; 5 senaryo, Python motoru, modül boşlukları tespit edildi | 2026-05-23 |
| [[Ham-Kaynaklar/2026-05-Sermaye-Analizi\|Sermaye Analizi]] | Finansal analiz / kesinleşmiş | Enes=216.911 EUR sermaye, Başar=0 kişisel sermaye + 738.793 TL şirkete borç, Enes TL geçiş kasası | 2026-05-29 |

---

## Orphan Takibi (bağlantısız sayfalar)
> Lint sırasında buraya ekle, bağlandıkça sil

- *(şu an yok)*

## Çelişki Takibi
> İki kaynak aynı konuda farklı şey söylüyorsa buraya not al

- *(şu an yok)*
