# Enba Wiki — Log
> **Append-only.** Hiçbir zaman eski girişleri silme veya düzenleme.
> Her oturum sonunda en alta yeni giriş ekle.
> Format: `## [YYYY-MM-DD] tip | başlık`
> Tipler: `kurulum` | `ingest` | `geliştirme` | `karar` | `lint` | `sorgu`

Unix aracıyla son 5 girişi görmek için:
```bash
grep "^## \[" log.md | tail -5
```

---

## [2026-05-04] kurulum | Enba Wiki başlatıldı

**Yapılan işlemler:**
- Obsidian vault oluşturuldu (Proje, Modüller, Kararlar, Günlük, Kaynaklar, Snippets, Wiki, Ham-Kaynaklar)
- CLAUDE.md genişletildi: bilinen sorunlar, aktif görevler, geliştirme günlüğü tablosu eklendi
- NotebookLM kaynak paketi hazırlandı (Enba_NotebookLM_Kaynak.md)
- Karpathy llm-wiki pattern'i uyarlandı: index.md + log.md + wiki bakım talimatları
- CLAUDE.md'ye wiki-aware oturum protokolü eklendi

**Mevcut wiki sayfaları:** 5 sayfa (Ana-Proje, Claude-Code-Entegrasyon, Mimari-Kararlar, Modül-Listesi, Supabase-Pattern)

**Bir sonraki oturum için:** Aktif görevler bölümünü doldur, ilk modül wiki sayfasını oluştur

---

## [2026-05-04] karar | Geliştirme yol haritası ve iş modeli netleşti

**Kararlar:**
- Öncelik 1: Supabase SQL şeması tam olarak oturturulacak
- Öncelik 2: 21 modülün tümündeki eksikler sırayla giderilecek
- Uygulama kendi şirket verileriyle doldurulacak (gerçek kullanım)
- demo@enba.com → başka şirketlere satış/pazarlama demosu olarak kullanılacak
- İki paralel hedef: kendi operasyonel ERP'i + SaaS ürün demosu

**Etki:** SQL şeması her iki hedefi destekleyecek şekilde tasarlanmalı (multi-tenant yapı kritik)

*Yeni girişleri buraya ekle ↓*

---

## [2026-05-05] analiz | SQL şema tam analizi yapıldı — 4 kritik sorun belirlendi

**Yapılan:**
- `supabase.ts`, `dataService.ts`, `migration_v2.sql`, `schema.sql` ve 8 modül incelendi
- Kapsamlı şema karşılaştırması yapıldı (kod ↔ SQL)
- `Wiki/SQL-Sema-Analizi.md` sayfası oluşturuldu

**Bulunan kritik sorunlar:**
1. **KIRMIZI — `companies` tablosu SQL'de yok** (SuperAdmin paneli ve tüm multi-tenancy bozuk)
2. **KIRMIZI — 8 tablo SQL'de yok**: `fixed_expenses`, `project_groups`, `projects`, `tasks`, `pnl_reports`, `assets`, `maintenance_records` + isim çakışması: `permits` vs `permit_records`
3. **KIRMIZI — `stock_records` sütun uyuşmazlığı**: SQL ile kod tamamen farklı sütun isimleri
4. **TURUNCU — `company_id` neredeyse hiç tabloda yok**: Tüm kullanıcılar birbirinin datasını görebilir

**Etkilenen dosyalar:** `supabase/schema.sql`, `scratch/migration_v2.sql`, `src/api/supabase.ts`

**Bir sonraki:** `scratch/migration_v3_kirmizi.sql` Supabase'de çalıştırılacak

---

## [2026-05-05] geliştirme | migration_v3_kirmizi.sql oluşturuldu

- **Yapılan:** 4 kırmızı sorunu gideren SQL migration dosyası yazıldı
- **Etkilenen dosyalar:** `scratch/migration_v3_kirmizi.sql` (yeni)
- **Kapsam:**
  - `companies` tablosu oluşturuldu (multi-tenancy temeli)
  - `profiles`'a 6 eksik sütun eklendi (company_id, ms/google/parasut data)
  - `stock_records` yeniden oluşturuldu (doğru sütunlarla, eski tablo backup olarak korunuyor)
  - `permit_records` silindi → `permits` adıyla doğru şekilde oluşturuldu
  - 7 eksik tablo oluşturuldu: `fixed_expenses`, `project_groups`, `projects`, `tasks`, `pnl_reports`, `assets`, `maintenance_records`
  - 12 mevcut tabloya `company_id` sütunu eklendi
- **Bir sonraki:** Supabase Dashboard → SQL Editor'da migration'ı çalıştır

---

## [2026-05-05] geliştirme | migration_v3 Supabase'de başarıyla çalıştı

- **Yapılan:** `scratch/migration_v3_kirmizi.sql` Supabase'e uygulandı
- **Sonuç:** Tüm kırmızı sorunlar giderildi — 18 tablo/değişiklik tamamlandı
- **Durum:** Supabase şeması artık kodla uyumlu
- **Bir sonraki:** Modülleri test et (Licensing, Tasks, FixedExpenses, Machinery, PnL)
