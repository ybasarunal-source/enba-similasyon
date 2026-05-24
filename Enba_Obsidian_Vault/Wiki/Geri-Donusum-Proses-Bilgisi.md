# Geri Dönüşüm Proses Bilgisi
> Sektör domain bilgisi — DetailedPlan wizard tasarımının temeli.
> Kaynak: Başar ile konuşmalar (2026-05-24)
> ⚠️ Bu bilgiler yazılımı niş hale getirecek kritik sektör bilgisidir. Kırpılmadan saklanmalı.

---

## Genel Malzeme Akışı

```
Tesise Giriş (kg veya ton — kullanıcı tercihi)
    ↓
Giriş Firesi (nem, çöp, fraksiyonlar)
    ↓
Ön Seçim? (malzeme bazında karar — bazı malzemeler bypass eder)
    ├── EVET → fraksiyonlar ayrıştırılır (sat / üretime sok / at)
    └── HAYIR → direkt üretime
    ↓
Üretim (proses firesi, opsiyonel yıkama, filtre kayıpları)
    ↓
Çıktı Ürünler (1 veya birden fazla — kullanıcı tanımlar)
    ↓
Ambalaj (çuval kapasitesi + birim maliyet) → Satış
```

---

## 1. Giriş

- Birim: **kg veya ton** — kullanıcı tercihi
- Her plan **tek malzeme tipi** üzerine kurulur (bkz. Hat Uyumluluğu)

---

## 2. Giriş Firesi

Giriş firesi = ön seçimde fiziksel olarak ayrıştırılan malzemelerin ölçümüdür. İkisi aynı şeydir.

### Fire Tipleri

| Tip | Açıklama | Alt Kaliteye Dönüşür mü? |
|-----|----------|--------------------------|
| **Nem firesi** | Malzeme ıslaksa nem oranı fire olarak uygulanır | ❌ Hayır — saf kayıp |
| **Geri dönüşümsüz çöp** | Hiçbir değeri olmayan atık | ❌ Hayır — saf kayıp |
| **Alt kalite fraksiyonlar** | Kağıt, LDPE, 2./3. kalite vb. | ✅ Koşullu (bkz. mod seçimi) |

### Alt Kalite Fraksiyonlar — İki Mod (plan bazında seçilir)

**Mod A — Basit Fire:**
- Fraksiyonlar tek toplam % olarak girilir
- Tamamı kayıp, gelir yok

**Mod B — Alt Kalite Aktif:**
- Her fraksiyon ayrı tanımlanır: ad + % + birim fiyat
- Örn: kağıt %5 → 0.05 TL/kg, LDPE %3 → 2 TL/kg
- Her fraksiyon için ayrı satış geliri hesaplanır
- Bazı işletmeler bu fraksiyonlara ayrı ödeme yapar, bazıları tamamen fire kabul eder

---

## 3. Ön Seçim

- **Malzeme bazında karar** — her akış için ayrı ayrı belirlenir
- Bazı malzemeler ön seçimi bypass ederek direkt üretime girer
- Kırma hattına girmeden önce elle yapılır

### Ön Seçimde Yapılanlar
- Gözle görülen çöpler ayıklanır
- 2. ve 3. kalite malzemeler ayrılır
- Ayıklanan her fraksiyon için kullanıcı 3 seçenekten birini seçer:
  - **Direkt sat** → gelir hesabına girer, üretime katılmaz
  - **Üretime sok** → granül hattına giriyor, orada da fire verebilir
  - **At (fire)** → saf kayıp

### Yan Ürün Satışı
- Kağıt → biriktirilerek satılabilir
- Balya → balya presinde sıkıştırılarak satılabilir
- Granül üretimine girmek zorunda değiller
- Bu tercihler kullanıcıya bırakılmalı

---

## 4. Hat Uyumluluğu (Kritik Sektör Bilgisi)

- **PP, LDPE, HDPE** → aynı hatta çalışabilir, ama **aynı anda çalışamaz**
- **PET** → ayrı hat zorunludur, PP/LDPE/HDPE hatlarıyla uyumsuz
- Hat değişimi (örn. PP'den LDPE'ye) → hat temizliği gerektirir → **hem hammadde hem zaman kaybı**
- Bu nedenle **çok malzeme planlaması istenen bir durum değildir**

### Wizard Kararı
- Her plan tek malzeme üzerine kurulur
- Kapasite boşluğu varsa (örn. %40 boşta) → AssistantPanel insight olarak önerilir:
  *"Hattınızın %40 kapasitesi boşta. Başka bir ürün planlayabilir ya da daha fazla hammadde alabilirsiniz."*
- Bu öneri wizard adımı değil, yardımcı tavsiyedir

---

## 5. Üretim

- Giriş: 1. kalite malzeme + varsa üretime sokulan fraksiyonlar
- Proses firesi %
- **Yıkama hattı** (opsiyonel):
  - Pislikler ve bir miktar malzeme yıkama suyuna karışır → fire
- **Filtre kayıpları** (granül çekerken):
  - Filtrelere takılan pislikler → fire
- Çıktı: **1 veya birden fazla ürün** (kullanıcı tanımlar)
  - Örn: aynı hattan hem şeffaf granül hem renkli granül çıkabilir

---

## 6. Ambalaj & Satış

- Her çıktı ürün için:
  - Çuval kapasitesi (ton/adet)
  - Çuval birim maliyeti (₺/adet)
- Çuval başına maliyet + kapasitesi yeterli (farklı ambalaj tipi yok)

---

## Wizard Tasarım Kararları

### Plan Tipi Seçim Ekranı
DetailedPlan'a yeni plan eklenirken önce **proses tipi seçilir**:
1. 🏭 **Granül Üretimi** ← ilk ve şu an tek tamamlanan
2. 📦 Kağıt Balyalama *(ileride)*
3. ⚙️ Çapak Üretimi *(ileride)*
4. 🪟 Levha Üretimi *(ileride)*
5. Diğer geri dönüşüm prosesleri *(ileride)*

Her proses tipi kendi wizard adımlarına sahip olacak.

### Granül Üretimi Wizard Adımları
```
Adım 1 — Plan Bilgisi (başlık, kategori, dönem, horizon)
Adım 2 — Giriş & Fire (birim, nem %, çöp %, fraksiyon modu)
Adım 3 — Ön Seçim (bypass mı / fraksiyonlar ne olacak)
Adım 4 — Üretim (makineler, proses fire %, opsiyonel yıkama)
Adım 5 — Çıktı Ürünler (ad, fiyat, ambalaj)
Adım 6 — Özet (hesaplamalar, senaryo tablosu)
```

---

## İlgili Sayfalar
[[DetailedPlan]] | [[Kararlar/2026-05-GranulUretimi-Parametre]]
