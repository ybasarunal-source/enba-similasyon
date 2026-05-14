# 📦 Modül Listesi

**Son Güncelleme:** 2026-05-14 — 23 modül

---

## Çekirdek Modüller (Her Zaman Görünür)
| Modül ID | Açıklama | Dosya |
|----------|----------|-------|
| `modules` | Ana Sayfa / Modül Yönetimi | ModulesOverview.tsx |
| `dashboard` | Gösterge Paneli | Dashboard.tsx |
| `tasks` | Görevler (Supabase + Kanban) | Tasks.tsx |
| `notes` | Notlar + AI Analiz | Notes.tsx |
| `calendar` | Takvim (Supabase tasks) | Calendar.tsx |
| `mail` | E-Posta (Outlook / Gmail) | Mail.tsx |
| `fixedexpenses` | Abonelikler & Sabit Ödemeler | FixedExpenses.tsx |
| `profile` | Kullanıcı Profili | Profile.tsx |
| `settings` | Uygulama Ayarları (tema, dil) | Settings.tsx |

---

## İzne Bağlı Modüller
| Modül ID | Açıklama | Permission Key | Dosya |
|----------|----------|----------------|-------|
| `pnl` | P&L Analizi | `pnl` | PnL.tsx |
| `cashflow` | Nakit Akışı | `cashflow` | Cashflow.tsx |
| `parasut` | Paraşüt Entegrasyonu | `parasut` | Parasut.tsx |
| `varlik` | Varlık Takibi (Sabit + Depozito) | `varlik` | VarlikTakibi.tsx |
| `fastplan` | Hızlı İş Planı | `fastplan` | FastPlan.tsx |
| `planning` | Detaylı İş Planı | `planning` | planning/DetailedPlanManager.tsx |
| `stock` | Stok Yönetimi | `stock` | Stock.tsx |
| `production` | Üretim Takibi | `production` | Production.tsx |
| `logistics` | Lojistik | `logistics` | Logistics.tsx |
| `machinery` | Makine / Ekipman | `machinery` | Machinery.tsx |
| `hr` | İnsan Kaynakları | `hr` | HR.tsx |
| `licensing` | Lisans Yönetimi | `licensing` | Licensing.tsx |
| `archive` | Arşiv | `archive` | Archive.tsx |
| `ayarlar` | Finansal Kategoriler Yönetimi | `ayarlar` | Ayarlar.tsx |

---

## Admin / SuperAdmin Modülleri
| Modül ID | Açıklama | Görünürlük |
|----------|----------|-----------|
| `super_admin` | Sistem Yönetimi | Yalnızca super_admin |
| `company_admin` | Şirket Yönetimi | Yalnızca admin |

---

## Sidebar Grupları (MENU_GROUPS)
| Grup | Modüller |
|------|----------|
| Operasyon (Kısayollar) | modules, dashboard, tasks, notes, calendar, mail |
| Finans & Muhasebe | pnl, cashflow, parasut, fixedexpenses, varlik |
| Üretim & Lojistik | fastplan, planning, production, stock, logistics, machinery |
| Kurumsal Yönetim | hr, licensing, archive |
| Sistem | profile, settings, ayarlar |
| Yönetim | super_admin (veya company_admin) |

---

## Yeni Modül Kontrol Listesi

1. `src/modules/YeniModul.tsx` oluştur
2. `App.tsx` → `ModuleType`'a ekle, lazy import ekle
3. `App.tsx` → rawMenuItems'a ekle (id, label, icon)
4. `App.tsx` → MENU_GROUPS'a ekle
5. `App.tsx` → render block ekle (`{activeModule === 'x' && <X />}`)
6. Supabase `profiles.permissions.yeniModul` ekle (core değilse)
7. `Moduller/YeniModul.md` wiki sayfası oluştur
8. `index.md` Modüller tablosuna ekle

---

## İlgili Sayfalar
- [[Moduller/Ayarlar|Finansal Ayarlar]]
- [[Moduller/VarlikTakibi|Varlık Takibi]]
