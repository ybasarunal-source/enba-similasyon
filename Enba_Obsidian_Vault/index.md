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

---

## Ham Kaynaklar

| Kaynak | Tür | Özet | Eklenme |
|--------|-----|------|---------|
| [[Ham-Kaynaklar/Karpathy-LLM-Wiki\|Karpathy LLM-Wiki]] | Makale | Kalıcı wiki pattern, index+log, Obsidian+Claude Code entegrasyonu | 2026-05-04 |
| CLAUDE.md (vault içi) | Schema | Oturum protokolü, wiki bakım kuralları, mimari özet | 2026-05-04 |
| [[Ham-Kaynaklar/2026-05-Nakit-Akisi-Uretim-Ozeti\|Nakit Akışı & Üretim Özeti]] | Operasyonel özet | Gerçek nakit tablosu, üretim parametreleri, 3 ay projeksiyon, KDV mahsup — DetailedPlan için ilk gerçek veri | 2026-05-19 |
| [[Ham-Kaynaklar/2026-05-GranulUretimi-IsPlan\|Granül Üretimi İş Planı]] | Konuşma kaydı / hesap motoru | 21 iterasyonlu granül tesisi iş planı; 5 senaryo, Python motoru, modül boşlukları tespit edildi | 2026-05-23 |

---

## Orphan Takibi (bağlantısız sayfalar)
> Lint sırasında buraya ekle, bağlandıkça sil

- *(şu an yok)*

## Çelişki Takibi
> İki kaynak aynı konuda farklı şey söylüyorsa buraya not al

- *(şu an yok)*
