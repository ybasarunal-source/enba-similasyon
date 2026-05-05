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

## [2026-05-05] geliştirme | Rol/izin mimarisi — SuperAdmin + CompanyAdmin

**Yapılan:**
- `supabase.ts` → `PERMISSION_MODULES` sabiti (13 modül, TR etiket) + `getCompanyProfiles()` eklendi
- `CompanyAdmin.tsx` → yeni modül: şirkete scoped kullanıcı yönetimi + izin checkboxları
- `SuperAdmin.tsx` → edit user modalına izin checkboxları + loading spinner eklendi; `permissions` artık kaydediliyor
- `App.tsx` → `company_admin` ModuleType + menü + render bağlandı

**Rol davranışı:**
- `super_admin` → tüm modüller + Sistem Yönetimi (tüm şirket/kullanıcı yönetimi)
- `admin` → tüm modüller + Şirket Yönetimi (kendi şirketi, user/admin rol + izin toggle)
- `user` → yalnızca `profile.permissions`'daki modüller

**Etkilenen dosyalar:** `src/api/supabase.ts`, `src/modules/CompanyAdmin.tsx` (yeni), `src/modules/SuperAdmin.tsx`, `src/App.tsx`

**Bir sonraki:** Kullanıcı bazlı detaylı yetki matrisi görünümü
