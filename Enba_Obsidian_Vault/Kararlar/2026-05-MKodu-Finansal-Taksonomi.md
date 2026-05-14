# M-Kodu: Uygulama Geneli Finansal Taksonomi

**Tarih:** 2026-05-14  
**Durum:** Kısmen Uygulandı — financial_categories tablosu aktif, diğer modüller beklemede

## Karar

`src/api/mcodeList.ts` içindeki M-kodu listesi Supabase `financial_categories` tablosuna taşındı. Tablo her şirket için bağımsız — admin yönetebilir, özel kalemler eklenebilir. `mcodeList.ts` artık yalnızca seed kaynağı olarak kullanılıyor.

Her gider veya gelir girişi bu listeden bir M-kodu ile eşleştirilecek.

## Neden

Operasyon bazlı (Merkez / Kömürcüler / Varsak) ve kategori bazlı (M-kodu) gelir/gider takibi yapılabilmesi için tüm verilerin ortak bir sınıflandırma sisteminde buluşması gerekiyor. Şu an Paraşüt kategori eşleştirmesi bu altyapıyı kuruyor; diğer modüller de aynı sisteme bağlanacak.

## Kapsam — Etkilenecek Modüller

| Modül | Gider/Gelir Türü | Örnek M-Kodu |
|---|---|---|
| Sabit Giderler | Her kalem | M610 Kira, M620 İletişim, M635 Sigorta |
| Makina / Ekipman | Bakım, amortisman | M509 Bakım Onarım, M775 Amortisman |
| Personel / HR | Maaş, SGK, yan haklar | M489, M489.01–.04 |
| Üretim | Hammadde, enerji | M369 Malzeme, M405–M419 Enerji |
| Satış | Gelirler, iadeler | M105, M149, M299 Net Gelir |
| FastPlan / DetailedPlan | Tüm kalemler | Zaten M-kodu yapısında |
| PnL | Raporlama | Zaten M-kodu bazlı |

## Mimari Yaklaşım (Karar Verildi)

**Supabase'de `mcode` kolonu** — Her gider/gelir tablosuna `mcode VARCHAR` eklenir, veri girilirken dropdown ile seçilir.  
~~Kategori adı üzerinden eşleştirme~~ — kırılgan, reddedildi.

## Uygulama Sırası

### ✅ Tamamlanan
- `financial_categories` Supabase tablosu (migration_v25) — hiyerarşik, şirket bazlı
- `src/api/financialCategories.ts` — servis + cache + seed
- `src/modules/Ayarlar.tsx` — admin yönetim arayüzü (inline edit, toggle, özel kategori)
- `src/modules/VarlikTakibi.tsx` — `operation` alanıyla M/K/V bazlı varlık takibi

### ⏳ Bekleyen
- Paraşüt matching → `financial_categories` tablosundan çeksin (`mcodeList.ts` yerine)
- Sabit Giderler modülü → M-kodu dropdown ekle
- Makina/Ekipman → M509, M775 bağlantısı
- HR → M489 serisi bağlantısı
- PnL → operasyon (M/K/V) bazlı aggregation

## İlgili Dosyalar

- `src/api/mcodeList.ts` — 72 M-kodu seed kaynağı (artık doğrudan kullanılmıyor)
- `src/api/financialCategories.ts` — ✅ Supabase servis katmanı
- `src/modules/Ayarlar.tsx` — ✅ Yönetim arayüzü
- `src/modules/Parasut.tsx` — Paraşüt kategori eşleştirme (mcodeList.ts'e bağlı, taşınacak)
- `src/api/parasut.ts` — `getItemCategories`, `patchCategoryName`
