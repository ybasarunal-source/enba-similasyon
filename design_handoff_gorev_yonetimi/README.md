# Handoff: Görev Yönetimi Uygulaması — "Bold" Yönü

## Genel Bakış

Bu paket, profesyonel/proje yönetimi kullanımına yönelik bir görev takip uygulamasının **Bold** tasarım yönünün hi-fi referansını içerir. Hem masaüstü web uygulaması hem de iOS-tarzı mobil uygulama için tasarlanmıştır.

Uygulama temel olarak şunları sağlar:
- Görev oluşturma, düzenleme, tamamlama, silme
- Projeler, etiketler ve yaşam alanları (areas) ile sınıflandırma
- 3 seviyeli öncelik (Yüksek / Orta / Düşük)
- Son tarih (deadline), alt görevler (subtasks), notlar, tekrarlayan görevler
- Pomodoro zamanlayıcısı
- Bugün / Tüm görevler / Kanban / Takvim / İstatistikler / Tamamlananlar görünümleri

## Bu Tasarım Dosyaları Hakkında

Bu paketteki HTML/JSX dosyaları **tasarım referansıdır** — niyet edilen görsel ve davranışı gösteren prototiplerdir, doğrudan kopyalanacak production kodu değildir. Görev, bu tasarımları hedef kod tabanının mevcut ortamında (React, Vue, SwiftUI, Next.js, native vb.) yerleşik desenleri ve kütüphaneleri kullanarak **yeniden inşa etmektir**. Henüz bir kod tabanı yoksa, projeye en uygun framework'ü seçip orada uygulayın.

Mevcut prototip:
- React 18 + Babel standalone (CDN, in-browser transpilation)
- Tüm stil **inline style** olarak yazılmış — production'da Tailwind / CSS modules / styled-components vb. tercih edilmeli
- State `window.__taskStore` üzerinde paylaşılıyor (varyasyonlar tek sayfada birlikte mount oluyor) — production'da Zustand / Redux / React Context kullanılmalı

## Fidelity

**Hi-fi.** Tüm renkler, tipografi, boşluklar ve etkileşimler son haline yakındır. Geliştirici, kod tabanının mevcut kütüphaneleriyle bunu piksel-piksel yeniden üretmelidir.

## Design Tokens

### Renkler
```
/* Yüzeyler */
--bg:          #FAF7F1   /* krem arka plan */
--surface:     #FFFFFF
--line:        #EDE7DC
--line-soft:   #F4EFE5

/* Mürekkep (metin) */
--ink:         #16151A
--ink-soft:    #5A554E
--ink-faint:   #A8A39C

/* Vurgu (kullanıcı seçebilir) */
--accent:      #FF5C5C   /* coral kırmızı, varsayılan */
/* Diğer hazır seçenekler */
#FF8A3D #FFB800 #34D399 #3B82F6 #8B5CF6 #EC4899

/* Öncelik */
--p-high:      #FF3B30   bg: #FFE9E7
--p-med:       #FF9500   bg: #FFF1DC
--p-low:       #6BBF8A   bg: #E5F5EB

/* Proje renkleri */
website  #FF5C8A
mobile   #3D5AFE
brand    #8B5CF6
research #6BBF8A
personal #FFB938

/* Karanlık mod */
--dark-bg:      #16151A
--dark-surface: #1E1D26
--dark-ink:     #FAF7F1
```

### Tipografi
| Rol | Aile | Stil |
|---|---|---|
| Display başlık | **Bricolage Grotesque** | weight 700, letter-spacing -0.03em ila -0.04em |
| Editorial vurgu | **Instrument Serif** italic | "Elif" gibi vurgular için |
| Gövde / UI | **Geist** | 400/500/600/700 |
| Mono (rakamlar, etiketler, timer) | **JetBrains Mono** | 500/600 |

Tipografi ölçeği (Bold ana tasarımı):
- H1 hero (Günaydın, Elif): 42px, weight 700, letter-spacing -0.035em
- H2 başlık: 22px, weight 700
- Görev başlığı: 14.5px, weight 600, letter-spacing -0.01em
- Gövde küçük: 12.5px, weight 500
- Etiket/eyebrow (uppercase): 10.5–11px, weight 700, letter-spacing 0.08em–0.12em
- Mobil hero: 32px, Bricolage 700, letter-spacing -0.04em

### Spacing
4px tabanlı ölçek: `4, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44`

### Köşe yuvarlama
- Küçük UI (chip/tag/pill): 999 (full pill) veya 5–6
- Görev kartı: **14** (CSS değişkeni `--radius`, 0–24 arası tweakable)
- Modal / büyük kart: 18–24
- Daire (avatar, checkbox): 50%

### Gölgeler
```
soft:    0 1px 0 rgba(20,18,15,.02)
lifted:  0 1px 2px rgba(20,18,15,.04), 0 4px 14px rgba(20,18,15,.06)
pop:     4px 4px 0 #16151A      /* neo-brutalist varyant */
modal:   0 24px 80px rgba(20,18,15,.18)
```

### Yoğunluk (density)
Görev kartları için 3 mod:
- `compact`: padding 8px 14px
- `regular`: padding 12px 16px (varsayılan)
- `comfy`: padding 16px 18px

---

## Ekranlar

### 1. Ana yerleşim — Masaüstü (1320×880)
3 sütunlu yerleşim:
- **Sol kenar çubuğu** (240px): Logo + ana navigasyon (Bugün, Tümü, Pano, Takvim, İstatistik, Tamamlananlar) + Projeler listesi + "Yeni görev" CTA
- **Ana içerik** (esnek): Aktif view (Bugün/Tümü/Kanban/Takvim/İstatistik/Tamamlananlar)
- **Sağ kenar (260px)**: Pomodoro widget + bu haftaki istatistik kartı + yarınki görevler kartı + sürüm etiketi

### 2. Bugün Görünümü (TodayView)
- Üst kısımda büyük "Günaydın, **Elif**" karşılaması (italic serif vurgu)
- Tarih + hava bilgisi eyebrow
- 3 KPI kartı: bugünkü görev sayısı, tahmini odak süresi, tamamlama yüzdesi
- Görev listesi (öncelik sırasıyla)

### 3. Tüm Görevler (AllTasksView)
- Filtreler: proje, etiket, öncelik, son tarih
- Sıralama: deadline, öncelik, oluşturma tarihi
- Toplu işlem (multi-select)

### 4. Kanban (KanbanView)
4 sütun: Yapılacak → Devam Eden → İncelemede → Bitti  
Görev kartları sürüklenebilir (HTML5 drag & drop)

### 5. Takvim (CalendarView)
Aylık grid, her gün hücresinde o güne düşen görevler (renkli noktalar + isim)

### 6. İstatistikler (StatsView)
- Haftalık tamamlanan görev bar chart
- Pomodoro süresi
- Proje bazlı dağılım (donut)
- Streak takibi

### 7. Tamamlananlar (CompletedView)
Liste, tarih başlıkları altında gruplanmış, "geri al" butonu

### 8. Görev Detay Modal'ı (TaskDetail)
Sağdan açılan panel (~520px):
- Başlık (inline editable)
- Proje + öncelik + son tarih
- Alt görevler checklist
- Notlar (markdown)
- Pomodoro mini-zamanlayıcı
- Etiketler
- Sil / kopyala / arşivle aksiyonları

### 9. Yeni Görev Modal'ı (AddTaskModal)
Cmd/Ctrl+N ile açılır. Quick-add: başlık + proje + öncelik + deadline + etiketler

### 10. Mobil — Bugün Ekranı (380×800)
- Status bar (saat + pil)
- Header: küçük logo + avatar
- Tarih eyebrow + serif italic karşılama
- Bugünkü ilerleme kartı (siyah, daire grafiği + sayı)
- Görev listesi
- Alt navigasyon: 5 sekme + ortada büyük "+" FAB (52×52, vurgu rengi, 18px yarıçap)

### 11. Mobil — Görev Detay Ekranı
- Geri butonu (38×38 daire) + proje rozeti + menü
- Öncelik chip + büyük Bricolage başlık
- Etiket sıraları
- **Pomodoro kartı**: siyah, vurgu blob'u, büyük mono sayaç + "Başlat" butonu, pomodoro noktaları
- Alt görevler kartı (interaktif checkbox)
- Notlar (sarı sticky-note tarzı, #FFFCEC bg)
- Alt CTA: tam genişlik vurgu butonu

---

## Etkileşimler & Davranış

### Genel
- **Görev tamamlama**: Checkbox tıklanır → konfeti efekti (`confettiBurst` helper'a bak) + 180ms ease ile silme/işaretleme
- **Hover**: Görev kartları `translateY(-1px)` ile yumuşak yükseliş
- **Klavye kısayolları**: `Cmd/Ctrl+N` yeni görev, `Esc` modal kapat
- **Sürükle-bırak**: Kanban'da sütunlar arası, ana listede sıralama

### Pomodoro
- 25 dk çalışma / 5 dk mola döngüsü
- Bir görevin altında `estimatedPomodoros` ve `completedPomodoros` alanları var
- Tamamlanan her pomodoro vurgu renginde nokta olarak görünür
- Çalışma sırasında dakika rakamı mono fontla, iki nokta vurgu renginde yanıp söner

### Animasyonlar
- Checkbox toggle: 0.18s cubic-bezier(.4,.0,.2,1)
- Hover lift: 0.15s ease
- Modal: alttan kaydırma (mobil) / sağdan kaydırma (desktop), 0.24s
- Konfeti: tamamlama anında, ~1.2s

### Form Doğrulama
- Görev başlığı zorunlu (boş bırakılamaz)
- Deadline geçmiş tarih olursa kırmızı uyarı
- Alt görev metni boşsa kaydetme

---

## State Yönetimi

### Veri modeli
```ts
type Task = {
  id: string;
  title: string;
  project: string;           // PROJECTS[].id
  labels: string[];          // LABELS[].id
  area: string;              // AREAS[].id
  priority: 'high' | 'medium' | 'low';
  status: 'backlog' | 'active' | 'review' | 'done';
  deadline: Date | null;
  subtasks: { id: string; text: string; done: boolean }[];
  notes: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  recurring?: 'weekly' | 'monthly';
  createdAt: Date;
  completedAt?: Date;
};
```

### Aksiyonlar
- `add(task)` — yeni görev ekle
- `toggle(id, event?)` — done ↔ active geçişi (event varsa konfeti tetiklenir)
- `update(id, patch)` — kısmi güncelleme
- `delete(id)`
- `toggleSubtask(taskId, subId)`
- `setStatus(id, status)` — Kanban sürükle-bırak için

### Veri kaynağı
Prototipte `SEED_TASKS` dizisi var (`data.jsx`). Production'da REST/GraphQL API'sine bağlanmalı. Local-first çalışma için IndexedDB (Dexie) önerilir.

---

## Tweak'lenebilir Parametreler

Production uygulamada da bu parametrelerin kullanıcı ayarı olarak sunulması önerilir:

| Parametre | Değerler | Varsayılan |
|---|---|---|
| `accent` | 7 renk paleti | `#FF5C5C` |
| `dark` | bool | false |
| `radius` | 0–24px | 14px |
| `density` | compact / regular / comfy | regular |
| `font` | geist / system / mono | geist |
| `lang` | tr / en | tr |

---

## Assets

- **Fontlar**: Tümü Google Fonts'tan — Bricolage Grotesque, Instrument Serif, Geist, JetBrains Mono. Production'da self-host edilmesi önerilir.
- **İkonlar**: `Icon` adında özel SVG bileşeni (`data.jsx` içinde tanımlı). İsim listesi: `plus, search, chevron, done, fire, repeat, today, all, kanban, calendar, stats, completed, settings, ...`. Lucide-react veya Phosphor ile değiştirilebilir.
- **Resim yok**: Tasarım tipografi ve renk üzerine kurulu, raster asset gerektirmiyor.

---

## Dosyalar

`src/` altında:

- **`data.jsx`** — Tüm paylaşılan veri: PROJECTS, LABELS, AREAS, STATUSES, PRIORITY_META, SEED_TASKS, Icon bileşeni, useTaskStore hook'u, tarih helper'ları, confettiBurst
- **`bold-core.jsx`** — Atomik bileşenler: PriorityChip, LabelChip, Checkbox, TaskRow, Sidebar, PomodoroWidget
- **`bold-views.jsx`** — Tam ekran view'ları: TodayView, AllTasksView, KanbanView, CalendarView, StatsView, CompletedView, TaskDetail modal, AddTaskModal
- **`bold-app.jsx`** — Ana shell (`BoldApp`): sidebar + view router + sağ rail
- **`bold-mobile.jsx`** — Mobil ekranlar: MobileTodayScreen, MobileDetailScreen

`preview.html` — Tüm üç ekranı tek sayfada render eden öngörüleme dosyası. Tarayıcıda doğrudan açılabilir (internet bağlantısı gerekir — React/Babel CDN).

---

## Önerilen Production Stack

Yeşil alan başlangıç için:
- **Framework**: Next.js 14 (App Router) veya Vite + React
- **Styling**: Tailwind CSS — token'lar `tailwind.config.js`'e taşınmalı
- **State**: Zustand veya TanStack Query + React Context
- **DB**: Supabase / Postgres + Drizzle ORM. Local-first için Dexie
- **Drag & drop**: dnd-kit
- **Tarih**: date-fns (locale: tr)
- **İkonlar**: lucide-react
- **Fontlar**: `next/font` ile self-hosted Geist + Bricolage + Instrument Serif
- **Animasyon**: Framer Motion (özellikle modal ve konfeti için)

Mobil için: React Native + Expo, yukarıdaki token'ları paylaşan bir `@app/tokens` paketi.

---

## Açık Sorular / Sonraki Adımlar

- [ ] Çok-kullanıcılı senkron mu, tek-kullanıcılı local-first mi?
- [ ] Doğal dil ile görev ekleme ("yarın 3'te toplantı") — eklensin mi?
- [ ] Bildirim sistemi (push, e-posta, web) gereksinimleri
- [ ] Entegrasyonlar (Google Calendar, Slack, GitHub issues) öncelik sırası
- [ ] Görev arama: full-text mi, semantik mi?
- [ ] Klavye kısayolları için tam komut paleti (Cmd+K)
