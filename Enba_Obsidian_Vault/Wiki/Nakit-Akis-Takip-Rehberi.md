# Enba Recycling — Nakit Akışı Takip Rehberi
> Şirkete özel para akış yapısı ve doğru analiz kuralları.  
> Kaynak: 29.05.2026 sermaye analizi kesinleşmiş bulgular.  
> Son güncelleme: 2026-05-29

---

## 1. Hesap Yapısı ve Roller

| Hesap | Para Birimi | Rol | Nakit Akışına Dahil? |
|---|---|---|---|
| **Enes Eşşiz (Euro)** | EUR | Sermaye kaynağı | ✅ Sermaye KPI'ına dahil (bakiye = alacak) |
| **Enes Eşşiz (TL)** | TRL | Geçiş/dağıtım kasası | ⚠️ Operasyonel analizden HARİÇ tut |
| **VakıfBank Ana** | TRL | Şirket ana hesabı | ✅ Dahil |
| **VakıfBank 1062** | TRL | Şirket hesabı (canlı dönem) | ✅ Dahil |
| **Ziraat TL** | TRL | Şirket hesabı | ✅ Dahil |
| **Ziraat Euro** | EUR | Döviz bozdurmak kanalı | ⚠️ Sermaye KPI'ına dahil (bakiye izle) |
| **Yıldırım Başar Ünal** | TRL | Ara yönetim hesabı | ✅ Dahil (bakiye = şirkete borç) |
| **KDV Kasası** | TRL | KDV takip hesabı | ✅ Dahil |
| **PET Deşe** | TRL | Satış tahsilat kasası | ✅ Dahil |

---

## 2. Para Akış Şeması

```
[Dış Dünya / Müşteriler]
        │
        ▼
Enes Eşşiz (Euro)          ← TEK GERÇEK SERMAYE KAYNAĞI
        │
        ├──► Enes Eşşiz (TL)    ← GEÇIŞ KASASI (burayı sermaye sayma)
        │           │
        │           ├──► VakıfBank / Ziraat (şirket ödemeleri)
        │           ├──► Tedarikçi / çalışan ödemeleri
        │           └──► Başar hesabına (~1.926.917 TL aktarıldı)
        │
        ├──► Başar Ünal          ← ARA YÖNETİM HESABI
        │           │              (738.793 TL bakiye = şirkete borç)
        │           ├──► Şirket hesaplarına EFT
        │           └──► Fatura / çalışan / fiş ödemeleri
        │
        └──► Ziraat Euro         ← DÖVİZ BOZDURMAK KANALI
                    └──► Ziraat TL
```

---

## 3. Kesinleşmiş Sermaye Rakamları

| | Değer |
|---|---|
| **Enes'in şirkete sermaye katkısı** | **216.911,64 EUR** |
| **Enes'in şirketten alacağı** | 216.911,64 EUR |
| **Kısmi geri ödeme** | 35.292,72 EUR (460.000 TL, 21.05.2026) |
| **Başar'ın kişisel sermayesi** | **0 TL** |
| **Başar'ın şirkete borcu** | **738.793,02 TL** |

> ⚠️ Gerçek sermaye ölçüsü **EUR bazında**. TL toplamları kur farkı ve mükerrer hareketler nedeniyle şişiktir.

---

## 4. Mükerrer Sayım Tuzakları

### Tuzak 1 — Enes TL Hareketleri
Enes Euro → Enes TL → VakıfBank zincirinde:
- Enes Euro çıkışı → **bir kez sayıldı** (sermaye)
- Enes TL → VakıfBank transferi → **tekrar sayma**

**Kural:** Enes TL hesabının tüm hareketlerini operasyonel analizden çıkar.

### Tuzak 2 — Başar→Enes Geri Ödeme
460.000 TL (21.05.2026) Başar→Enes transferi:
- Başar hesabından çıkış → gider gibi görünür
- Enes Euro hesabına giriş → 35.292,72 EUR iade

**Kural:** Bu işlem sermaye iadesidir, operasyonel gider değildir.

### Tuzak 3 — Şirket İçi Virmanlar
VakıfBank → Ziraat, Ziraat → VakıfBank gibi transferler:
- Her iki taraf da sync'leniyor
- Net = 0, toplam hem gelir hem gider şişiyor

**Kural:** `money_transfer` tipindeki işlemleri operasyonel analiz dışında tut.

### Tuzak 4 — VakıfBank Hesap Dönem Devri
VakıfBank Geçmiş + VakıfBank Canlı = aynı hesabın iki dönemi.
Kapanış bakiyesi = açılış bakiyesi → toplamda çift sayılmaz.

---

## 5. Analiz Kuralları

### Operasyonel Nakit Akışı (Gerçek Gelir/Gider)
**Dahil et:**
- `contact_credit` → müşteri tahsilatı
- `contact_debit` → tedarikçi ödemesi
- `purchase_bill_payment` → fatura ödemesi
- `employee_debit` → personel ödemesi
- `bank_fee_payment` → banka masrafı
- `expense_*` → genel gider

**Hariç tut:**
- `money_transfer` → hesaplar arası transfer (şirket içi)
- `initial_account_balance` → açılış bakiyesi
- `balance_adjustment` → mutabakat kaydı
- Enes TL hesabının tüm hareketleri

### Sermaye Takibi
- **Enes sermayesi** = Enes Euro hesabının negatif bakiyesinin mutlak değeri (Paraşüt canlı)
- **Başar borcu** = Başar hesabının pozitif bakiyesi (Paraşüt canlı)
- TL toplamlarına dayalı sermaye hesabı yapma — kur farkı yanıltır

### Aylık Nakit Özeti
- `nonTransfer` verisi kullan (money_transfer kategorisi hariç)
- Enes TL hesabını exclude et
- Kümülatif net = operasyonel nakit pozisyonu (sermaye girişleri hariç)

---

## 6. KurulumNakit Modülü — Mevcut KPI Mantığı

| KPI | Hesaplama | Not |
|---|---|---|
| Satış Tahsilatı | `contact_credit` + `sales_*` tipindeki gelirler | ✅ Doğru |
| Sermaye (Enes) | Enes Euro hesabı negatif bakiye (mutlak değer) | ✅ Doğru — Paraşüt canlı |
| Toplam Çıktı | Tüm gider kayıtları (`tip === 'gider'`) | ⚠️ Transfer çıkışlarını da içeriyor |
| Net Bakiye | TRL hesapların Paraşüt canlı toplamı | ✅ Doğru |

---

## 7. Yapılacaklar (Bekleyen)

- [ ] Enes'in EUR alacağının geri ödeme planı
- [ ] Başar'ın 738.793 TL borcunun şirkete transferi
- [ ] Tüm hesapların konsolide nakit pozisyonu raporu
- [ ] Enes TL hesabını sync dışı bırak (exclude toggle)

---

## İlgili Kaynaklar
[[Ham-Kaynaklar/2026-05-Sermaye-Analizi|Sermaye Analizi (29.05.2026)]]  
[[Ham-Kaynaklar/2026-05-Nakit-Akisi-Uretim-Ozeti|Nakit Akışı & Üretim Özeti]]
