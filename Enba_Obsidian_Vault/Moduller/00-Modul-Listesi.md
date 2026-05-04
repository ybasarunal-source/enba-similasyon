# 📦 Modül Listesi

## Çekirdek Modüller (Her Zaman Görünür)
| Modül ID | Açıklama |
|----------|----------|
| `dashboard` | Gösterge Paneli |
| `profile` | Kullanıcı Profili |
| `tasks` | Görevler |
| `calendar` | Takvim |
| `modules` | Modül Yönetimi |
| `mail` | Posta (Microsoft/Google) |
| `fixedexpenses` | Sabit Giderler |

## İzne Bağlı Modüller
| Modül ID | Açıklama | Permission Key |
|----------|----------|----------------|
| _(listeyi doldur)_ | | |

---

## Yeni Modül Şablonu

Her yeni modül için şu adımları izle:
1. `src/modules/YeniModul.tsx` oluştur
2. `App.tsx` → `ModuleType` tipine ekle
3. Supabase `profiles` → `permissions.yeniModul` ekle
4. `translations.ts` → TR/EN string ekle
5. Modules sayfasına kart ekle
6. Permission check ekle (core değilse)

---

## Modül Notları
> Her modül için ayrı not: [[Moduller/Dashboard]], [[Moduller/Mail]] vb.
