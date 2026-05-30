# KurulumNakit Modülü — Alınan Kararlar
> Tarih: 2026-05-30 | Durum: Grafik dışı her şey çalışıyor

---

## 1. Tasarım Kararları (Kesinleşmiş)

### Sekmeler
- **Hesaplar** — Paraşüt canlı bakiye, hesap kartları
- **Hareketler** — işlem listesi, filtreler
- **Grafik** — grafikler
- **Özet** — kategori bazlı tablo
- **Aylık Özet** — Ay × (Satış / Sermaye Girişi / Ödemeler / Net / Kümülatif)

### KPI Satırı (4 kart)
| Kart | Açıklama |
|---|---|
| Banka Nakdi | Banka tipli TRL hesapların Paraşüt canlı toplamı (yeşil) |
| Cari Alacak | Cari tipli hesapların pozitif bakiye toplamı (mavi) |
| Toplam Pozisyon | Paraşüt canlı TRL toplam (gri/yeşil) |
| Döviz Pozisyonu | EUR tipli hesapların negatif bakiye mutlak değeri (turuncu) |

### Hesap Tipi Sistemi
Her hesap 3 tipten birinde: **Banka** / **Cari** / **Döviz**
- Kullanıcı Hesaplar sekmesinde rozete tıklayarak değiştirir
- localStorage'da kalıcı (`enba_nakit_account_types`)
- Varsayılan: TRL → Banka, EUR → Döviz

### Aylık Özet Tablosu
Kolonlar: Ay | Satış (yeşil) | Sermaye Girişi (mavi) | Ödemeler (kırmızı) | Net | Kümülatif
- Hesaplar arası transferler HARİÇ
- Net negatif + kümülatif negatif = satır kırmızı vurgu

### Export
- **Ham Veri**: Paraşüt tip kodu + ID dahil (XLS)
- **Excel**: özet satırlı (XLS)
- **PDF**: Özet sekmesi A4 yatay
- **Hesap Excel/PDF**: her kart üzerinde ikona tıklayarak
- Hareketler sekmesinde hesap filtresi aktifken filtreli export butonu

### Hesap Kartı Özellikleri
- Sol üst: tip rozeti (tıklayınca Banka→Cari→Döviz döngüsü)
- Sağ üst: Dahil/Hariç toggle (localStorage: `enba_nakit_excluded_accounts`)
- Sağ alt: Excel + PDF ikon butonu
- Tıklayınca Hareketler sekmesine geçer, o hesabı filtreler
- Alt: "Bu hesap şunun devamı" dropdown (devam hesabı kuralı)

### Devam Hesabı Kuralı
- VakıfBank 1062 (canlı) = VakıfBank Ana Hesap (geçmiş) hesabının devamı
- Aynı fiziksel banka hesabı, Paraşüt'te iki farklı kayıt olarak tutuluyor
- Kullanıcı Hesaplar sekmesinde seçer, localStorage'da kalıcı (`enba_nakit_continuation`)
- **⚠️ Uyarı notu**: Paraşüt'te hesap silmeyin, "devamı" ile birleştirin

---

## 2. İş Mantığı Kararları (Kesinleşmiş)

### Hesap Sınıflandırması
| Hesap | Tip | Açıklama |
|---|---|---|
| VakıfBank - 1062 | Banka | Şirket ana hesabı (Ekim 2025+) |
| Vakıfbank Ana Hesap (geçmiş) | Banka | Aynı hesabın önceki dönemi |
| Ziraat Bankası TL Hesabı | Banka | Aktif: May–Eyl 2025, kapandı. Açılış bakiyesi: 0, hiçbir zaman negatife düşmedi |
| Yıldırım Başar Ünal | Cari | Şirkete borçlu 738.793 TL (şirket parasını yönetiyor) |
| Enes Eşşiz (TL) | Cari | Geçiş/dağıtım kasası — sermaye sayılmaz, mükerrer olur |
| PET Deşe | Cari | Proje kasası |
| Enes Eşşiz (Euro) | Döviz | Sermaye kaynağı: 216.911,64 EUR (şirketten alacak) |
| Ziraat Euro | Döviz | Döviz bozdurma kanalı |

### Sermaye Yapısı
- **Tek gerçek sermaye**: Enes EUR = 216.911,64 EUR (Paraşüt Enes Euro bakiyesi ile eşleşir)
- **Başar**: kişisel sermaye yok; hesabındaki 738.793 TL şirkete borç
- **Enes TL**: geçiş kasası, hareketleri mükerrer sayılmamalı

### Para Akış Kuralları
- Satış geliri: `contact_credit`, `sales_*` tipleri
- Sermaye girişi: `money_transfer` gelirleri (Enes/transferler)
- Ödemeler: `contact_debit`, `purchase_*`, `employee_debit`, `bank_fee_payment`, vb.
- Döviz bozdurma: `account_debit` + "DÖVİZ" açıklaması = Banka hesabına TL girişi
- Hesaplar arası transfer: nakit akış analizinden hariç, bakiye grafiğine dahil

---

## 3. Teknik Kararlar (Kesinleşmiş)

### Veritabanı Tabloları
- `founding_cashflow` — tüm işlemler (migration_v29)
- `account_daily_balance` — günlük bakiye snapshot'ları (migration_v31)
- `custom_holidays` — tatil takvimi

### Paraşüt API Gerçekleri
- **19 alan döndürüyor**: `transaction_type`, `date`, `amount_in_trl`, `debit_amount`, `credit_amount`, `description`, `auto_description`, vb.
- **`balance` alanı YOK** — per-transaction bakiye API'den gelmiyor
- Paraşüt Excel exportunda bakiye var (her satırda) — API'de yok

### Transaction Type Mantığı
- `initial_account_balance` → 'Açılış Bakiyesi' — grafiğe dahil, nakit akışından hariç
- `money_transfer` → 'Hesaplar Arası Transfer' — grafiğe dahil, nakit akışından hariç
- `döviz_bozdurma` (custom) → 'Hesaplar Arası Transfer' — `account_debit` DÖVİZ kayıtları
- `balance_adjustment` → FİLTRELE, hiçbir yerde kullanma

---

## 4. Banka Nakdi Günlük Grafik — Açık Sorun

### Problem
Paraşüt API per-transaction balance döndürmüyor. İşlem bazlı hesaplama:
- Ziraat TL: açılış 0, ama hesaplama negatife düşüyor
- VakıfBank Geçmiş: arşivlenmiş, `initial_account_balance` gelmeyebilir
- Devam hesabı mantığı: Geçmiş'in kapanış transferi hesaplamayı bozuyor

### Doğru Veri Kaynağı
`banka_nakit_grafik.html` (Paraşüt Excel exporttan üretildi):
- VakıfBank: Oct 2025 – May 2026, 227 günlük bakiye serisi
- Min: 11.22 TL, Max: 739.609 TL, Son: 101.658 TL
- Hiç negatife gitmiyor

### Yöntem A (account_daily_balance) — ÇALIŞIYOR
HTML'deki RAW dizisini `account_daily_balance` tablosuna aktarınca VakıfBank grafiği doğru çıkıyor.

### Yöntem B (işlem bazlı hesaplama) — BOZUK
Her deneme farklı şekilde negatife düşüyor. Temel sorun:
transaction bazlı hesaplama için:
- Tüm transfer kayıtları tam ve doğru yakalanmalı
- Hesaplar arası transfer çift sayımı çözülmeli
- Devam hesabı geçiş mantığı düzgün kurgulanmalı

### Kalan Görev
Yaklaşım sıfırdan tasarlanacak.

---

## 5. Çalışmayan Yaklaşımlar (Tekrar Deneme)

1. ~~`balance_after` API field~~ → API dönmüyor
2. ~~İç transfer hariç + live bakiye anchor~~ → yanlış şekil (6.3M başlangıç)
3. ~~initial_account_balance + tüm hareketler kümülatif~~ → devam hesabı geçişi bozuyor
4. ~~döviz_bozdurma ekleme~~ → hâlâ yanlış (Ziraat -221K bitiyor)
5. ~~live bakiye offset~~ → şekil doğru değil (push edilmedi)
