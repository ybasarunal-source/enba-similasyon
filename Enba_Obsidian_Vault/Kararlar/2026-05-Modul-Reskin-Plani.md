# Modül Reskin Planı — DetailedPlan Tasarım Diline Geçiş

Tarih: 2026-05-23  
Durum: **Faz 1 tamamlandı, Faz 2–3 beklemede**

---

## Hedef

Tüm modüller `DetailedPlan` tasarım diline geçsin:
- `bg-enba-panel` / `bg-enba-bg` / `border-enba-line` tokenları
- `rounded-xl` (artık `rounded-3xl` yok)
- Gölgesiz kartlar, `border border-enba-line`
- `font-medium text-[13px]` tipografi (artık `font-black uppercase tracking-widest` yok)
- Hem light hem dark modda tutarlı

---

## Tasarım Token Referansı

| Eski sınıf | Yeni karşılık |
|-----------|---------------|
| `bg-white` | `bg-enba-panel` |
| `bg-gray-50` / `bg-gray-100` | `bg-enba-panel-2` |
| `border-gray-100` / `border-gray-200` | `border-enba-line` |
| `text-enba-dark` / `text-gray-900` | `text-enba-text` |
| `text-gray-500` / `text-gray-600` | `text-enba-muted` |
| `text-gray-400` | `text-enba-dim` |
| `rounded-3xl` | `rounded-xl` |
| `shadow-sm` / `shadow-card` | sil — `border border-enba-line` yeter |
| `font-black uppercase tracking-widest` | `font-medium uppercase tracking-[0.14em]` |

---

## Faz 1 — Global CSS Katmanı ✅ (2026-05-23)

`src/index.css`'e `.enba-module` scope'u eklendi. `App.tsx`'te modül içerik div'ine `enba-module bg-enba-bg` eklendi.

**Otomatik düzelen:**
- Tüm `bg-white` kartlar → `bg-enba-panel` (light: #FFF, dark: #1A1A1A)
- Tüm `bg-gray-50/100` → `bg-enba-panel-2`
- Tüm `border-gray-100/200` → `border-enba-line`
- Tüm `rounded-3xl/2xl` → `rounded-xl`
- `shadow-sm` → gölgesiz + `border-enba-line`
- Yazı renkleri `text-gray-*` → enba token'ları
- Input/select/textarea renkleri

**Kapsam:** ~80% otomatik düzelir. Kalan ~20% hardcoded inline style veya çok spesifik sınıflardır.

---

## Faz 2 — Yüksek Öncelikli Modüller (sıradaki 2-3 oturumda)

Her modül için: eski `bg-white`, `rounded-3xl`, `font-black uppercase tracking-widest` kalıplarını manuel temizle.

| Modül | Dosya | Öncelik | Durum |
|-------|-------|---------|-------|
| P&L Analizi | `PnL.tsx` | 🔴 Yüksek | Bekliyor |
| Dashboard | `Dashboard.tsx` | 🔴 Yüksek | Bekliyor |
| Cashflow | `Cashflow.tsx` | 🔴 Yüksek | Bekliyor |
| Stock | `Stock.tsx` | 🟡 Orta | Bekliyor — son reskin yapıldı |
| HR | `HR.tsx` | 🟡 Orta | Bekliyor |
| Varlık Takibi | `VarlikTakibi.tsx` | 🟡 Orta | Bekliyor |
| Ayarlar | `Ayarlar.tsx` | 🟡 Orta | Bekliyor |
| Parasut | `Parasut.tsx` | 🟡 Orta | Bekliyor |

---

## Faz 3 — Düşük Öncelikli Modüller (ileride)

| Modül | Dosya | Not |
|-------|-------|-----|
| Production | `Production.tsx` | |
| Logistics | `Logistics.tsx` | |
| Archive | `Archive.tsx` | |
| Machinery | `Machinery.tsx` | |
| Licensing | `Licensing.tsx` | |
| FixedExpenses | `FixedExpenses.tsx` | |
| Tasks | `Tasks.tsx` | Kapsamlı → dikkatli |
| Notes | `Notes.tsx` | |
| Calendar | `Calendar.tsx` | |
| Mail | `Mail.tsx` | |
| ModulesOverview | `ModulesOverview.tsx` | |
| Settings | `Settings.tsx` | |
| Profile | `Profile.tsx` | |

---

## Faz 4 — Dokunulmayacaklar

| Modül | Sebep |
|-------|-------|
| `Login.tsx` | Ayrı context — değişmemeli |
| `SuperAdmin.tsx` | İç kullanım |
| `CompanyAdmin.tsx` | İç kullanım |
| `DetailedPlanModule` + alt dosyalar | Kaynak tasarım — bu zaten doğru |
| `FastPlan.tsx` | Geçen oturumda reskin yapıldı |

---

## Her Modül İçin Standart Adımlar

1. `rounded-3xl` / `rounded-2xl` → `rounded-xl`
2. `bg-white` → `bg-enba-panel`
3. `bg-gray-50` / `bg-gray-100` → `bg-enba-panel-2`
4. `border-gray-100` / `border-gray-200` → `border-enba-line`
5. `shadow-sm` / `shadow-card` → sil (veya `shadow-enba`)
6. `text-enba-dark` → `text-enba-text`
7. `text-gray-500` / `text-gray-600` → `text-enba-muted`
8. Header: `font-black uppercase tracking-[2px]` → `font-semibold text-[12px] uppercase tracking-[0.14em]`
9. Butonlar: `bg-enba-dark text-white` → `Btn variant="primary"` veya `Btn variant="ghost"` (`DPPrimitives`)
10. `tsc --noEmit` + `npm run build` ile doğrula

---

## İlgili Sayfalar

[[Moduller/DetailedPlan]] — kaynak tasarım  
[[Moduller/FastPlan]] — zaten reskin yapıldı
