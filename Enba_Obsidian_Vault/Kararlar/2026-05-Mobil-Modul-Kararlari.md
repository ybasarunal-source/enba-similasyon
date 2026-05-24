# Mobil Modül Kararları
Tarih: 2026-05-24
Kaynak: Başar ile görüşme

---

## ✅ Mobil'de Olacaklar

| Modül | Not |
|-------|-----|
| `dashboard` | Masaüstüyle birebir aynı olmasına gerek yok — mobil özet versiyonu |
| `tasks` | Kesinlikle, çok önemli |
| `calendar` | Kesinlikle, çok önemli |
| `mail` | ⭐ **Inbox okuma odaklı uygulama haline getirilecek** — ayrı tasarım gerekiyor |
| `notes` | Olmalı |
| `fixedexpenses` | Olsun |
| `fastplan` | Kesinlikle, cep telefonu için çok önemli |
| `stock` | Olmalı |
| `production` | Olmalı |
| `cashflow` | Olmalı |
| `pnl` | Sadece özet (tam analiz masaüstünde) |
| `machinery` | Olmalı |
| `settings` | Olsun |
| `planning` (DetailedPlan) | Sadece özet — plan oluşturma/düzenleme masaüstünde |

## 🖥 Masaüstü Only

| Modül | Not |
|-------|-----|
| `profile` | Olmasa da olur |
| `modules` | Gerek yok |
| `varlik` | Gerek yok |
| `parasut` | Gerek yok |
| `ayarlar` | Gerek yok |
| `archive` | Gerek yok |
| `licensing` | Gerek yok |
| `company_admin` | Gerek yok |
| `super_admin` | Gerek yok |

## ⏳ İleride Karar Verilecek

| Modül | Not |
|-------|-----|
| `logistics` | Şu an olmasın, ileride karar |
| `hr` | Şu an olmasın, ileride karar |

---

## Özel Notlar

### Mail — Inbox Odaklı Tasarım
Kullanıcı isteği: Mail modülü mobilde **inbox okuma uygulaması** gibi davransın.
- Birincil akış: gelen kutusu → mail oku
- Masaüstündeki 3-panel layout mobilde daraltılmış / tek panel
- Compose ve folder management ikincil

### Dashboard — Mobil Özet
Masaüstü dashboard'u ağır olabilir. Mobilde:
- KPI kartları (nakit, görev sayısı, günün özeti)
- Bugünün takvim etkinlikleri
- Aktif görevler
- Tam grafik/tablo masaüstünde

### DetailedPlan — Read-Only Özet
Mobilde plan listesi + her planın özet kartı görünür.
Plan oluşturma ve düzenleme masaüstüne kilitli.

### PnL — Sadece Özet
Mobilde: toplam gelir/gider/kâr KPI kartları.
Grafik ve detay tablo masaüstünde.

---

## Teknik Yaklaşım Kararı — Hibrit (C)

**Basit modüller** (tasks, calendar, notes, fixedexpenses, settings...):
→ Tailwind breakpoint yeterli (`md:` `lg:`)

**Karmaşık modüller** (fastplan, mail, dashboard):
→ `useIsMobile()` hook + aynı dosyada ayrı JSX bloğu

```tsx
const isMobile = useIsMobile(); // window.innerWidth < 768
if (isMobile) return <FastPlanMobile ... />;
return <FastPlanDesktop ... />;
```

**Durum:** Henüz başlanmadı — ileride ele alınacak.
