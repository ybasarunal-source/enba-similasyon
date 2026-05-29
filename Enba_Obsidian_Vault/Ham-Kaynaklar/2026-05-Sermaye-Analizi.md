# Enba Recycling — Sermaye Analizi Notları
Tip: Finansal analiz / kesinleşmiş rakamlar  
Tarih: 2026-05-29  
Ekleyen: Başar  

## Özet
Enba Recycling'in tüm hesap hareketleri incelenerek sermaye yapısı kesinleştirildi. Tek gerçek sermaye kaynağı Enes Eşşiz'in EUR katkısıdır (216.911,64 EUR). Başar hesabı kişisel sermaye değil, şirket parasını yöneten ara hesaptır (738.793,02 TL şirkete borç). Enes TL hesabı geçiş/dağıtım kasasıdır — bu hesabın hareketlerini ayrıca sermaye saymak mükerrer olur.

## Kesinleşmiş Rakamlar

| | |
|---|---|
| **Enes'in şirkete sermaye katkısı** | **216.911,64 EUR** |
| **Enes'in şirketten alacağı** | 216.911,64 EUR (henüz ödenmemiş) |
| **Kısmi geri ödeme yapıldı** | 35.292,72 EUR (460.000 TL, 21.05.2026) |
| **Başar'ın sermaye katkısı** | **0 TL** (kişisel sermaye koymadı) |
| **Başar'ın şirkete borcu** | **738.793,02 TL** (hesabında kalan şirket parası) |

## Para Akış Yapısı

```
Enes Eşşiz (Euro)       ← sermayenin tek ve gerçek kaynağı
    │
    ├── Enes Eşşiz (TL) ← geçiş/dağıtım kasası (Euro'yu TL'ye çevirip dağıtır)
    │       │
    │       ├── VakıfBank (şirket hesabı)
    │       ├── Tedarikçi/çalışan ödemeleri
    │       └── Başar hesabına (~1.926.917 TL)
    │
    ├── Yıldırım Başar Ünal ← Enes'ten ~47.115 EUR doğrudan gönderildi
    │       │               Başar'ın kişisel geliri/maaşı YOK
    │       ├── Ziraat TL (şirkete transfer)
    │       ├── VakıfBank (şirkete transfer)
    │       └── Fiş/fatura/çalışan ödemeleri
    │
    └── Ziraat Euro     ← döviz bozdurmak kanalı
            └── Ziraat TL
```

## Temel Kurallar (Kesinleşmiş)

1. **Enes TL hesabı** = geçiş/dağıtım kasası. Mükerrer sayılmamalı.
2. **Enes TL dışındaki tüm hesaplara dışarıdan gelen para = şirket parası** (Başar dahil).
3. **VakıfBank Geçmiş + VakıfBank Canlı** = aynı hesabın iki dönemi. Kapanış = açılış bakiyesi.
4. **Başar hesabı** = şirket parasını yöneten ara hesap. Başar'ın kişisel maaşı/ödemesi bu hesaptan yapılmıyor.
5. **460.000 TL** (21.05.2026, Başar→Enes) = Enes'in EUR sermaye alacağının kısmi TL geri ödemesi.

## 137 Transfer İşleminin Ayrıştırması

| Kategori | Adet | Anlam |
|---|---|---|
| Ortak Sermaye Girişi (Enes) | 39 | Enes TL→VakıfBank banka kayıtları |
| Döviz Çevrimi (Euro→TL) | 32 | Enes Euro→TL ve Ziraat Euro→TL |
| Hesaplar Arası Virman | 17 | Şirket içi para hareketi |
| Ortak Sermaye Girişi (Başar) | 14 | Başar'ın Garanti'den şirkete EFT |
| Kart Harcaması (Google) | 14 | Dışarıya gerçek ödeme |
| Nakit Çekim (Başar→Şirkete Borç) | 11 | ATM çekimleri |
| Kart Harcaması (POS) | 7 | Dışarıya gerçek ödeme |
| Hesap Dönem Devri (VakıfBank) | 2 | Geçmiş→canlı hesap devri |
| Banka Bozdurma | 1 | — |

⚠️ Gerçek sermaye ölçüsü EUR bazında — TL toplamları kur farkı ve mükerrer hareketlerden şişkin.

## Projemize Etkisi

- **KurulumNakit "Net Sermaye Girişi" KPI'sı**: Mevcut `transferGelir − transferGider` hesabı yetersiz. Gerçek sermaye = Enes Euro hesabı bakiyesi = −216.911,64 EUR. Bu değer zaten Hesaplar sekmesinde kart olarak görünüyor.
- **Başar hesabı borcu takibi**: 738.793,02 TL'nin şirkete transfer edilmesi gereken bekleyen borç — modülde gösterilmeli.
- **Mükerrer sayım önlemi**: Enes TL hesabı transfer hareketleri KPI hesaplamalarından çıkarılmalı (zaten `nonTransfer` filtresiyle kısmen yapılıyor ama tam değil).
- **Nakit Akışı Aylık Özet**: Enes TL geçiş hareketlerini temizlediğinde gerçek operasyonel gelir/gider tablosu ortaya çıkıyor.

## Yapılacaklar (Kaynaкtan)

- [ ] Tüm hesapların konsolide bakiyesini çıkar (şirketin net nakit pozisyonu)
- [ ] Nakit akış analizini tamamla (gerçek gelir/gider vs iç transferler)
- [ ] Enes'in EUR alacağının geri ödeme planı
- [ ] Başar'ın 738.793 TL borcunun şirkete transferi

## İlgili Wiki Sayfaları
[[Ham-Kaynaklar/2026-05-Nakit-Akisi-Uretim-Ozeti|Nakit Akışı & Üretim Özeti]]  
[[Moduller/DetailedPlan|DetailedPlan]]
