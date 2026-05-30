# KurulumNakit Modülü
> Son güncelleme: 2026-05-30

## Genel

Paraşüt entegrasyonlu gerçek zamanlı nakit ve banka takip modülü. `founding_cashflow` Supabase tablosundan veri okur, Paraşüt API'siyle senkronize eder.

---

## Hesap Tipi Sistemi

Her Paraşüt hesabı üç tipten birine atanır. Kullanıcı Hesaplar sekmesindeki rozete tıklayarak değiştirebilir (localStorage'da kalıcı, `enba_nakit_account_types`):

| Tip | Açıklama | KPI etkisi |
|---|---|---|
| **Banka** | Gerçek nakit (banka hesabı) | Banka Nakdi + Günlük Grafik |
| **Cari** | Alacak/borç takibi (şahıs, proje) | Cari Alacak |
| **Döviz** | EUR hesaplar | Döviz Pozisyonu (EUR) |

Varsayılan: TRL hesaplar → Banka, EUR hesaplar → Döviz.  
Açılış bakiyesi (`initial_account_balance`) Paraşüt tarafından eklenir, `rows` içinde yer alır.

---

## Banka Nakdi Günlük Grafik

### Amaç
Yalnızca "Banka" tipindeki hesaplardaki nakit miktarını gün gün gösterir.

### Hesaplama Mantığı (`bankaDailyData` useMemo)

```
1. Banka hesap adlarını topla:
   accounts → getAccType(a) === 'banka' → Set<string>

2. O hesaplara ait işlemleri filtrele:
   rows → source_account ∈ bankaNames

3. Güne göre grupla, günlük net hesapla:
   gelir → +tutar_tl
   gider → -tutar_tl

4. Kronolojik sırada kümülatif toplam al:
   cum[0] = net[0]
   cum[i] = cum[i-1] + net[i]

5. chartFrom / chartTo tarih aralığına göre kırp
```

### Başlangıç Bakiyesi — Paraşüt Canlı Bakiyeye Sabitleme

Grafik 0'dan başlamaz. Bitiş noktası Paraşüt'ün bugün bildirdiği canlı bakiyedir:

```
liveBakiye  = banka hesaplarının Paraşüt canlı bakiye toplamı
totalChange = tüm geçmiş hareketlerin kümülatif net değişimi
startBalance = liveBakiye − totalChange
```

Bu sayede:
- Grafik son noktası her zaman Paraşüt canlı bakiyesiyle eşleşir
- Açılış bakiyesi hesaplama gerekmez, `initial_account_balance` ayrıca işlenmez
- Gerçek banka hesabı hiçbir zaman negatife düşmediğinden grafik de negatife gitmez

### Grafik Özellikleri
- Recharts `AreaChart`, yeşil dolgu (`#10b981`)
- Sıfır hattı: kırmızı kesikli referans çizgisi
- 30+ veri noktasında X ekseni etiketleri 35° açıyla döner, noktalar gizlenir
- Üstte: Son / Min / Max özet
- Hiç Banka hesabı yoksa: yönlendirme mesajı

### Önemli Kısıt
`rows` yalnızca kayıtlı dönemden itibaren veri içerir. Açılış bakiyesi kaydı olmayan eski hesaplarda grafik eksik görünebilir.

---

## KPI Satırı

| Kart | Hesaplama | Renk |
|---|---|---|
| Banka Nakdi | Banka tipli TRL hesapların Paraşüt canlı bakiye toplamı | Yeşil |
| Cari Alacak | Cari tipli hesapların pozitif bakiye toplamı | Mavi |
| Toplam Pozisyon | Paraşüt canlı TRL toplam (banka + cari) | Gri/yeşil |
| Döviz Pozisyonu | EUR tipli hesapların negatif bakiye mutlak değeri | Turuncu |

---

## Sekmeler

| Sekme | İçerik |
|---|---|
| Hesaplar | Banka/Cari/Döviz gruplarında hesap kartları; rozet → tip değiştir |
| Hareketler | Tüm işlemler; tip + hesap filtresi; hesap seçiliyken Excel/PDF export |
| Grafik | Banka Nakdi Günlük → Operasyonel Pozisyon → Kümülatif → Stacked Bar → Hesap Bazlı |
| Özet | Kategori bazlı gelir/gider tablosu |
| Aylık Özet | Ay × (Satış / Sermaye Girişi / Ödemeler / Net / Kümülatif) tablosu |

---

## Export

| Buton | Kapsam | Format |
|---|---|---|
| Ham Veri | Tüm rows, Paraşüt tip kodu + ID dahil | XLS (TSV) |
| Excel | Tüm rows, özet satırlı | XLS (TSV) |
| PDF | Özet tablosu (Özet sekmesi) | A4 yatay |
| Hesap Excel | Tek hesap hareketleri | XLS (TSV) |
| Hesap PDF | Tek hesap, başlık + tablo + toplam | A4 dikey |

---

## İlgili Kaynaklar
[[Ham-Kaynaklar/2026-05-Sermaye-Analizi|Sermaye Analizi]]  
[[Wiki/Nakit-Akis-Takip-Rehberi|Nakit Akışı Takip Rehberi]]
