# Handoff: DetailedPlan (Detaylı İş Planı) — Enba Similasyon ERP Modülü

## Genel Bakış

DetailedPlan, Enba Similasyon ERP'sinin (geri dönüşüm/üretim) **çok dönemli, çok ürünlü bütçeleme ve planlama** modülüdür. Mevcut FastPlan modülünün (tek ürün, anlık karlılık) üzerinde yer alır ve şirketin **24 aya kadar gelir/gider/cash flow projeksiyonlarını**, **bütçe vs gerçekleşen karşılaştırmasını** ve **senaryo bazlı planlamayı** kapsar.

Hedef kullanıcılar: CFO, finans yöneticisi, operasyon direktörü.

## Bu Dosyalar Hakkında — ÖNEMLİ

Bu paketteki dosyalar **HTML ile yapılmış tasarım referansıdır** — production kodu olarak doğrudan kopyalanmak için değil, hedef kod tabanının (React/Vue/SwiftUI vb.) mevcut ortamı ve kalıpları kullanılarak **yeniden inşa edilmek üzere** hazırlanmış prototiplerdir.

Hedef kod tabanı henüz seçilmediyse, projeye en uygun framework'ü seçip orada uygulayın. Mevcut codebase varsa onun:
- Component kütüphanesini (mevcut Button, Card, Input bileşenleri)
- Routing, state ve form yönetim kalıplarını
- Tema/token sistemini kullanın

## Fidelity Seviyesi

**Yüksek (hi-fi).** Renkler, tipografi, boşluklar, etkileşim durumları ve mikro-davranışlar son halindedir. Geliştiricinin görevi, hedef ortamda bu tasarımları piksel düzeyinde yeniden üretmektir. Veri/iş kuralları gerçekçi mock'larla simüle edilmiştir; gerçek API'ya bağlanması gerekir.

---

## Modül Yapısı

```
DetailedPlan
├── Header (plan adı + meta, dönem/horizon, senaryo, tema, bildirim, Kaydet, PDF)
├── Sidebar (modül navigasyonu)
└── Ana içerik (6 bölüm, sidebar'dan switch)
    ├── 1. Genel Bakış
    ├── 2. Gelir Planı
    ├── 3. Gider Planı
    ├── 4. Cash Flow
    ├── 5. Senaryo Yönetimi
    └── 6. Bütçe Takip
```

### Global State (App seviyesinde)
| Key | Tip | Açıklama |
|---|---|---|
| `activeSection` | string | Hangi panel aktif (`overview`/`revenue`/`expense`/`cashflow`/`scenario`/`budget`) |
| `scenarioId` | `'baz' \| 'iyimser' \| 'kotumser'` | Tüm hesaplamalar bu senaryoyu kullanır |
| `periodGranularity` | `'month' \| 'quarter' \| 'year'` | Grafiklerin gruplama düzeyi |
| `horizon` | `12 \| 18 \| 24 \| 36` | Toplam plan ufku (ay) |
| `theme` | `'dark' \| 'light'` | Tema; `localStorage('enba-theme')` |

---

## Tasarım Token'ları

### Renkler — CSS Custom Properties

Her token RGB triplet olarak tanımlanır; Tailwind config `rgb(var(--token) / <alpha-value>)` formatıyla okur (opacity modifier desteği için).

#### Dark Tema
```css
--enba-orange:    227 82 5;      /* #E35205 - primary */
--enba-orange-2:  255 106 31;    /* hover */
--enba-orange-d:  179 63 2;      /* pressed */
--enba-bg:        20 20 20;      /* page background */
--enba-dark:      26 26 26;      /* sidebar, header */
--enba-panel:     33 33 33;      /* card surface */
--enba-panel-2:   38 38 38;      /* nested / subtle bg */
--enba-line:      46 46 46;      /* primary border */
--enba-line-2:    58 58 58;      /* stronger border */
--enba-text:      237 237 237;
--enba-muted:     154 154 154;
--enba-dim:       107 107 107;
--enba-green:     61 190 124;    /* başarı / pozitif sapma */
--enba-red:       229 72 77;     /* kritik / negatif */
--enba-amber:     242 169 59;    /* uyarı / orta */
--enba-blue:      91 157 255;    /* bilgi / finansman */
```

#### Light Tema (override)
```css
--enba-bg:        245 244 240;   /* warm off-white */
--enba-dark:      255 255 255;
--enba-panel:     255 255 255;
--enba-panel-2:   249 247 242;
--enba-line:      229 226 217;
--enba-line-2:    214 210 200;
--enba-text:      28 28 28;
--enba-muted:     109 109 109;
--enba-dim:       150 150 150;
--enba-green:     27 156 90;
--enba-red:       209 49 55;
--enba-amber:     201 130 12;
--enba-blue:      57 113 213;
```

### Senaryo Renkleri (iki temada da sabit)
- Baz: `#E35205` (turuncu)
- İyimser: `#3DBE7C` (yeşil)
- Kötümser: `#E5484D` (kırmızı)

### Ürün Renkleri (kategori paleti)
- PET Granül Şeffaf: `#E35205`
- PET Granül Renkli: `#FF8A3D`
- HDPE Granül: `#F2A93B`
- LDPE Pelet: `#9A9A9A`
- Atık Toplama (hizmet): `#5B9DFF`
- Sertifika (hizmet): `#3DBE7C`

### Tipografi
- Font ailesi: **Poppins** (300, 400, 500, 600, 700) — Google Fonts
- Mono font (tablo sayıları için): **JetBrains Mono**
- Sayısal değerler için `.tabular` utility: `font-variant-numeric: tabular-nums;`

| Kullanım | Boyut | Weight | Line-height |
|---|---|---|---|
| H1 başlık (plan adı) | 15px | 600 | 1.2 |
| H3 kart başlığı | 16px | 600 | 1.2 |
| H4 alt başlık | 13px | 600 | 1.2 |
| KPI değeri (büyük) | 26-28px | 600 | 1.0 |
| KPI değeri (orta) | 22px | 600 | 1.0 |
| Body | 12.5-13px | 400 | 1.4 |
| Meta / muted | 11px | 400 | 1.3 |
| Eyebrow (kapital) | 10.5-11px | 400/500 | 1.2, `letter-spacing: 0.14em`, `text-transform: uppercase` |
| Sayı (tablo) | 12.5px | 400-500 | 1.2, tabular |

### Boşluklar / Radius / Shadow
- Tailwind spacing scale (4px adım)
- Border-radius: `rounded` 4px, `rounded-md` 6px, `rounded-lg` 8px, `rounded-xl` 12px (kart)
- Kart shadow (dark): `0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35)`
- Kart shadow (light): `0 1px 0 rgba(255,255,255,0.5) inset, 0 6px 18px rgba(50,38,20,0.08)`

### Grid Background Pattern
Ana içerik alanında subtle grid:
```css
.grid-bg {
  background-image:
    linear-gradient(to right, var(--enba-grid) 1px, transparent 1px),
    linear-gradient(to bottom, var(--enba-grid) 1px, transparent 1px);
  background-size: 32px 32px;
}
/* --enba-grid: dark = rgba(255,255,255,0.025); light = rgba(0,0,0,0.04); */
```

---

## Ortak Bileşenler (UI Primitives)

Hepsi dark + light temayı destekler ve tablo gibi yoğun alanlar için optimize edilmiştir.

### 1. Card
- `bg-enba-panel border border-enba-line rounded-xl p-5`
- `padded={false}` prop'u ile padding kapatılabilir (içinde tablo varsa)

### 2. KpiCard
- Üst sıra: ikon + label + (opsiyonel) trend pill
- Büyük sayı (26px, accent renkli)
- Alt: sub-text (dim)
- Accent: `orange | green | red | amber | blue`

### 3. Btn
- Variants: `primary` (turuncu dolgu), `ghost` (panel-2 bg), `outline` (transparent), `danger` (kırmızı outline)
- Sizes: `sm` (h-7), `md` (h-9)

### 4. Select (dropdown)
- 36px yüksekliğinde, kendi açılır listesi, dışarı tıklayınca kapanır

### 5. Segmented (segmented control)
- Tab-like switching for periods/options
- Active state: turuncu dolgu

### 6. ScenarioChip
- Senaryo renkli (turuncu/yeşil/kırmızı)
- Active state: senaryo rengine göre translucent bg + colored text

### 7. Badge
- Tones: `neutral, orange, green, red, amber, blue`
- 10.5px, kapsül, ince border

### 8. ThemeToggle
- 58px genişlik, kayar Sun/Moon
- localStorage'a yazar

---

## Veri Modeli

Tüm hesaplamalar deterministiktir — aynı girdi her zaman aynı sonucu verir. Backend bu fonksiyonların aynısını implement etmelidir.

### Ürün/Hizmet Şeması (`PRODUCTS`)
```ts
{
  id: string,
  name: string,             // TR
  category: string,         // "Granül Üretim" | "Hizmet"
  unit: string,             // "ton" | "sefer" | "adet"
  price: number,            // başlangıç birim fiyat (TL)
  priceGrowth: number,      // yıllık % artış (ondalık, örn. 0.08)
  seasonality: number[12],  // ay endeksleri, ortalama 1.0
  volume: number,           // başlangıç aylık hacim
  volumeGrowth: number,     // yıllık % artış
  varCostRatio: number,     // gelirin % kadarı (0-1)
  color: string,            // hex
}
```

### Sabit Gider Şeması (`FIXED_EXPENSES`)
```ts
{
  id: string,
  name: string,
  group: 'Sabit' | 'Yarı Değişken',
  monthly: number,          // başlangıç aylık tutar
  growth: number,           // yıllık % artış
}
```

### Senaryo Şeması (`SCENARIOS`)
```ts
{
  id: 'baz' | 'iyimser' | 'kotumser',
  label: string,
  color: string,
  rev: number,    // gelir çarpanı (örn. 1.12 = +%12)
  cost: number,   // maliyet çarpanı
  hint: string,   // kısa açıklama
}
```

### Çekirdek Hesaplama Fonksiyonları

```js
// i: 0-indexed ay; scen: senaryo objesi
monthlyPriceFor(p, i)   = p.price * (1 + p.priceGrowth) ** (i/12)
monthlyVolumeFor(p, i)  = p.volume * (1 + p.volumeGrowth) ** (i/12) * p.seasonality[i % 12]
revenueFor(p, i, scen)  = monthlyPriceFor(p, i) * monthlyVolumeFor(p, i) * scen.rev
varCostFor(p, i, scen)  = revenueFor(p, i, scen) * p.varCostRatio * scen.cost
fixedCostFor(e, i, scen)= e.monthly * (1 + e.growth) ** (i/12) * scen.cost

// Net karın hesabı (overview/cash flow):
ebitda = revenue - varCost - fixedCost
tax = max(0, ebitda - depreciation) * 0.22  // depreciation = 145_000/ay
net = ebitda - depreciation - tax
```

### Cash Flow Eventleri (`CASH_EVENTS`)
Tekrarlı veya tek seferlik gider/gelir olayları:
```ts
{
  id: string,
  name: string,
  type: 'investing' | 'financing',
  months: Array<{ idx: number, amount: number }>,  // amount: negative = outflow
}
```
Örnek olaylar dosyada (`src/data.jsx`): Ana üretim hattı yatırımı, banka kredisi çekimi/ödemesi, sermaye artırımı, temettü dağıtımı.

### Aktualler (Bütçe Takip)
- `ACTUALS_THROUGH = 16` — bu ay endeksine kadar fiili veri vardır.
- Mock fiili veri: bütçeye deterministik gürültü uygulanarak üretilir (`hash(productId + i)`).
- Production'da bu fonksiyon gerçek muhasebe API'sından gelir.

---

## Bölüm Detayları

### 1. Header
- 2 satır × 60px + 52px = 112px toplam
- **Üst satır:** brand sidebar + plan başlığı (h1 15px + meta dim) + Aktif badge + sağda Tema toggle, Bildirim (turuncu nokta), Kaydet (ghost), PDF (primary)
- **Alt satır:** Dönem select + Horizon select | sağda "SENARYO" eyebrow + 3 chip
- Plan başlığı düzenlenebilir (kalem ikonu — şu an placeholder)

### 2. Sidebar (232px sabit)
- Üstte 60px brand bloğu (logo + Enba Similasyon + alt yazı)
- Modül başlığı (turuncu yanan nokta + Detaylı İş Planı)
- 6 nav item, ikon + label, aktif state = turuncu bg + sol kenar 2px turuncu çizgi
- "DİĞER MODÜLLER" sub-section: FastPlan (Hızlı badge), Satış Yönetimi, Muhasebe
- Alt: AI Öneri kartı (orange gradient bg + turuncu border, kısa öneri metni)

### 3. Genel Bakış
- 4 KPI: Toplam Gelir, EBITDA, Net Kâr, Geri Ödeme Süresi (sparkline + trend pill)
- ComposedChart: Gelir (area, turuncu gradient) + Toplam Gider (dashed gri line) + EBITDA (yeşil line)
- 2 kolon: Kümülatif nakit akışı (geri ödeme noktasında yeşil dikey çizgi) | Senaryo özet kartları (3 satır)
- BvA snapshot: 4 satırlık mini bar
- 2 kolon: Aylık gelir dağılımı stacked bar (12 ay) | Son değişiklikler aktivite akışı (5 item, renkli ikon)

### 4. Gelir Planı
- Üst: Toplam Gelir + Brüt Kâr büyük rakam + 300px sparkline
- 2 mini KPI: Ürün sayısı, Ortalama hacim büyümesi
- Controls: Kategori filtre + Horizon segmented (6/12/18/24 ay) | Bilgi metni
- **Ana grid**: Ürün × Dönem tablosu (sticky sol kolon)
  - Her satır: chevron expand, renkli kenar bar, ürün adı + kategori + unit
  - Birim Fiyat (editable hücre), Aylık Hacim, Maliyet %, sonra her ay K cinsinden gelir
  - Expand edilince 3 alt satır açılır: Hacim, Değ. Maliyet (kırmızı), Brüt Kâr (yeşil)
  - Quarter sınırları daha kalın border
- Toplam satırı: turuncu vurgu
- 2 kolon: Donut chart (ürün payı) + legend | Mevsimsellik line chart (12 ay, 6 ürün ince çizgi, 1.0 referans)

### 5. Gider Planı
- 2 kolon: Toplam Gider kartı (büyük rakam + Sabit/Değişken kompozisyon barı) | Aylık trend stacked bar chart
- Tab strip: Tümü / Sabit / Değişken (sayı badge'leri ile)
- **Sabit Giderler grid**: kalem (renkli initials avatar), Aylık Tutar (edit), Yıllık Artış (renkli badge), period × ay
- **Değişken Giderler grid**: ürüne bağlı, "%gelir" badge, hesaplanan aylık değerler
- Alt: Donut (sabit kompozisyon) + Gider/Gelir oranı line chart (yeşil %70 hedef referansı)

### 6. Cash Flow
- 5 KPI yan yana (span 2/3/2/2/3): Dönem başı, Faaliyet, Yatırım, Finansman, Dönem sonu
- ComposedChart: Stacked bars (Faaliyet yeşil + Yatırım kırmızı + Finansman mavi, sol y-eksen) + Bakiye line (turuncu, sağ y-eksen, dots)
- Negatif bakiye uyarısı (kırmızı bg kart) — sadece minBalance < 0 ise göster
- Çeyreklik özet tablosu: Dönem Başı / Faaliyet / Yatırım / Finansman / Net / Dönem Sonu satırları
- 2 kolon: Yatırım faaliyetleri listesi | Finansman faaliyetleri listesi
- Her item: yön ikonu (yeşil up / kırmızı down) + ad + schedule + tutar (signed)

### 7. Senaryo Yönetimi
- Açıklama kartı + Yeni Senaryo butonu
- 3 senaryo kartı: Odaklanmış olan üst sağda "ODAKLANMIŞ" rozet + gradient bg
  - Gelir/Maliyet çarpanı boxları
  - Toplam Gelir, EBITDA (+ marj), Net Kâr, Geri Ödeme metrikleri
- Karşılaştırma tablosu: 8 metrik × 3 senaryo, Baz'a göre delta % renkli badge
- 2 kolon: Çeyreklik gruplu bar chart (3 senaryo yan yana, 8 çeyrek) | **Hassasiyet Analizi**
- Hassasiyet: 3 slider (Fiyat, Hacim, Maliyet, -30%/+30%), turuncu thumb, canlı sonuç (Gelir/EBITDA/Marj)
- Alt: Kümülatif EBITDA line chart (3 senaryo eğrisi)

### 8. Bütçe Takip
- **PeriodScrubber**: 24 hücreli scrubber barı; ilk 16 yeşilimsi (kapanan), seçili turuncu, sonrası kesik border (projeksiyon). Yıl başlarında üstte "2025"/"2026" etiketi
- Ön/sonraki ay butonları
- 3 BvA KPI kartı: Gelir, Toplam Gider, EBITDA — her biri Bütçe / Gerçekleşen / Fark + delta % pill (yeşil/amber/kırmızı). Alt: çift bar ("Bütçe" silik gri vs "Gerç." renkli)
- Trend chart: dashed bütçe line + dolu gerçekleşen area (turuncu), mavi "Bugün" referans çizgisi
- YTD Comparison Bars: 3 satır bullet chart — silik bütçe taban + dolu gerçek bar + dikey bütçe işaretçi çizgisi
- Kalem bazlı sapma tablosu: kalem, grup, bütçe, gerç., sapma, sapma %, mini bullet bar. Sapma büyüklüğüne göre sıralı
- Sapma ısı haritası: 4 kategori × 24 ay grid; gerçek dönemler renkli (yeşil iyi, kırmızı kötü, opaklık sapma büyüklüğüne bağlı), projeksiyon dönemleri boş hücre. Renk skalası alt legend ile gösterilir.

---

## Etkileşim & Davranış

### Senaryo Değişimi
- Header'daki chip tıklanınca state güncellenir → tüm bölümlerdeki sayılar, grafikler, hesaplamalar canlı yeniden render. Hiçbir loading state yok (anlık hesap).
- Senaryo değişimi kümülatif nakit grafiğindeki gradient rengi de günceller.

### Dönem & Horizon Değişimi
- `periodGranularity` = `quarter`/`year` → bazı grafiklerde 3'er/12'şer aylık gruplama
- `horizon` = 12/18/24/36 → tablo kolonları + grafik veri noktaları sayısı

### Tema Toggle
- Tıklayınca data-theme attribute değişir (root)
- localStorage'a yazılır
- Animasyon: `transition: background 0.18s, color 0.18s` ve toggle thumb kaydı

### Tablo Etkileşimleri
- **Hücre düzenleme**: tıklayınca input açılır, Enter/Esc/blur ile kaydet (şu an placeholder)
- **Satır expand**: chevron tıklanınca 3 alt satır açılır (Hacim, Maliyet, Brüt Kâr)
- **Hover**: tüm satırlar `bg-enba-panel-2/40` ile hover state'i
- **Filtre**: kategori değişimi anlık tablo + grafikleri günceller

### Hassasiyet Slider
- Range input + custom turuncu thumb (`::-webkit-slider-thumb` + `::-moz-range-thumb`)
- Track: `rgb(var(--enba-line))`, thumb: turuncu yuvarlak + panel border
- Değer değişince Gelir/EBITDA/Marj kartları canlı güncellenir
- "Sıfırla" linki tüm sliderları 0'a alır

### Period Scrubber
- Sadece aktual dönemler (ilk 16) tıklanabilir
- Projeksiyon hücreleri `disabled + cursor-not-allowed + dashed border`
- Tıklayınca seçili periodIdx güncellenir → tüm BvA panel yeniden hesaplar

### Negatif Bakiye Uyarısı
- Cash Flow panel'da sadece minBalance < 0 ise göster
- Kırmızı bg kart + uyarı metni + "Çözüm Öner" outline butonu (placeholder)

---

## Recharts Konfigürasyon Notları

- **Grid çizgileri:** CSS ile theme-aware (`stroke: rgb(var(--enba-line))`). Bunun yanında bazı chart prop'larıyla da geçilir (`cc.grid`).
- **Tooltip:** CSS override ile temaya uyumlu (`.recharts-default-tooltip`)
- **Defaultprops uyarısı:** Recharts 2.x React 18 ile deprecation warning yayar (kullanıma engel değil). Üst seviye `<script>` ile `console.error` filtrelemesi yapıldı:
  ```js
  const _err = console.error;
  console.error = function(...args) {
    if ((args[0]||'').includes('Support for defaultProps will be removed')) return;
    _err.apply(console, args);
  };
  ```
- React + recharts pinned versions: React 18.3.1, recharts 2.12.7

---

## Bağımlılıklar

- **React 18.3.1**
- **TailwindCSS** — CDN'de kullanıldı, production'da PostCSS/CLI ile build edin
- **Recharts 2.12.7** — gerekli `prop-types` peer dep
- **Google Fonts: Poppins** + **JetBrains Mono**
- Babel sadece tarayıcıda inline JSX transpile için kullanıldı (production gereksiz)

---

## Dosya Yapısı (kaynak referansı)

```
Detaylı İş Planı.html          <- ana giriş; tema vars + tailwind config + bağımlılıklar
src/
├── icons.jsx        <- SVG icon set (stroke-based, 24x24 viewBox)
├── data.jsx         <- PRODUCTS, FIXED_EXPENSES, SCENARIOS, CASH_EVENTS, hesaplama fonksiyonları, mock actuals
├── ui.jsx           <- Card, KpiCard, Btn, Select, Segmented, ScenarioChip, Badge, Sparkline, ThemeContext, useChartColors
├── overview.jsx     <- Genel Bakış paneli
├── revenue.jsx      <- Gelir Planı paneli
├── expense.jsx      <- Gider Planı paneli
├── cashflow.jsx     <- Cash Flow paneli
├── budget.jsx       <- Bütçe Takip paneli
├── scenario.jsx     <- Senaryo Yönetimi paneli
└── app.jsx          <- App shell (Sidebar, Header, router) + ThemeToggle
```

---

## Yapılacaklar (production'a alırken)

1. **Backend API**: Hesaplama fonksiyonlarını backend'e taşıyın (deterministik, aynı formüller). Frontend sadece display + edit.
2. **Persistence**: PRODUCTS/FIXED_EXPENSES/CASH_EVENTS/SCENARIOS düzenlenebilir hâle gelmeli, DB'ye yazılmalı.
3. **Actuals**: Mock noise yerine gerçek muhasebe entegrasyonu (her ay için kapanmış değerler).
4. **PDF Export**: Şu an placeholder; server-side render (Puppeteer) veya jsPDF + html2canvas önerilir.
5. **Excel Export**: `Bütçe Takip`'in "Excel" butonu — server CSV/xlsx üretir.
6. **AI Öneri kartı**: Sidebar'daki öneri rule-based veya LLM çağrısı ile dinamikleştirilebilir.
7. **Auth & Authorization**: Plan adı, senaryo düzenleme ve "Yeni Senaryo" yetkileri kullanıcı rolüne bağlı olmalı.
8. **Versiyonlama**: Plan başlığındaki "v1.4" gerçek bir version history sistemine bağlanmalı (snapshot + diff).
9. **Yeni Senaryo akışı**: Şu an placeholder buton — Modal aç → ad, gelir/maliyet çarpanları, açıklama → yeni senaryo eklensin.
10. **Hücre düzenleme commit**: Editable hücreler şu an blur'da reset oluyor; backend'e PATCH gönderecek.
11. **Erişilebilirlik**: Tablo header'ları, ARIA, klavye navigasyonu, focus halkaları (özellikle senaryo kartları clickable).
12. **i18n**: Şu an sadece TR; ileride EN/AR desteği gerekirse i18next önerilir.

---

## Notlar

- Tüm metinler Türkçedir; "İ"/"ı"/"ş"/"ğ" karakter desteği için UTF-8 zorunlu.
- Sayısal formatlama TR locale (`tr-TR`): binlik ayırıcı **nokta**, ondalık **virgül**.
- Para birimi: **₺ TRY**. Compact format (`₺1,5 Mn`, `₺72 Bin`) çoğu yerde kullanıldı; tam değer tablo hücrelerinde.
- Negatif değerler ön ek `−` ile (typographic minus), pozitif değerler trend gösteriminde `+` ile.
