# Varlık Takibi Modülü

**Modül ID:** `varlik`  
**Dosya:** `src/modules/VarlikTakibi.tsx`  
**API:** `src/api/varlikTakibi.ts`  
**Supabase Tabloları:** `fixed_assets` + `asset_deposits` (migration_v26)  
**Görünürlük:** admin / super_admin + permissions.varlik  
**Sidebar Grubu:** Finans & Muhasebe  
**Eklendi:** 2026-05-14

---

## Amaç

Şirketin duran varlıklarını (makine, araç, ekipman) ve verilen depozito/teminatları (TDHP 126) takip etmek.  
Bunlar **P&L kalemi değil, bilanço kalemidir** — gider olarak yazılmaz.

- **Sabit Varlıklar** → Amortisman hesabı, net defter değeri
- **Depozitolar** → Kira/elektrik/su/diğer; iade takibi

---

## Özellikler

### Sabit Varlıklar
- Alış tarihi + TL tutarı + kur (tarihi EUR değeri sabit kalır)
- Kullanım ömrü → yıllık amortisman otomatik
- Net defter değeri = alış - birikmiş amortisman (günlük hesaplama)
- Defter değeri renk göstergesi: kırmızı (<20%), sarı (<50%), yeşil
- Operasyon etiketleri: M / K / V

### Depozitolar
- Tür: kira / elektrik / su / diğer
- Tahmini iade tarihi
- Tek tıkla aktif ↔ iade toggle (optimistic)

### Genel
- TL / EUR toggle — kaydedilen kur üzerinden anlık çeviri
- M / K / V operasyon filtresi
- Özet kartlar (3 adet, sekmeye göre değişir)
- Sağdan açılan form paneli (ekle / düzenle)

---

## Supabase Şeması

```sql
fixed_assets (
  id, company_id FK,
  name, category, operation (M|K|V),
  purchase_date, purchase_amount_tl, exchange_rate,
  useful_life_years, notes
)

asset_deposits (
  id, company_id FK,
  name, deposit_type (rent|electricity|water|other),
  operation (M|K|V),
  payment_date, amount_tl, exchange_rate,
  expected_return_date NULL,
  status (active|returned),
  notes
)
```

Her iki tabloda RLS: company_id bazlı şirket izolasyonu.

---

## Hesaplama Mantığı

```
yearsElapsed(purchase_date) = (now - purchase_date) / 365.25
annualDepreciation = purchase_amount_tl / useful_life_years
bookValue = max(0, purchase_amount_tl - annualDepreciation * yearsElapsed)

eurAmount = tl_amount / exchange_rate   (kaydedilen kur)
```

Kur, alış anında kaydedilir → tarihi EUR değeri her zaman doğru.

---

## EUR/TL Çift Görünüm Mimarisi

**Karar:** TL tutarı + kur birlikte saklanır, EUR tutarı saklanmaz (hesaplanır).

- Doğru yaklaşım: her işlem anındaki kuru kaydet
- TL/EUR toggle: `toDisplay(tl, rate, currency)` — sadece görüntü
- PnL entegrasyonu: EUR bazlı raporlama için aynı mantık kullanılacak

---

## İlgili Sayfalar

- [[Kararlar/2026-05-MKodu-Finansal-Taksonomi|M-Kodu Finansal Taksonomi]]
- [[Moduller/00-Modul-Listesi|Modül Listesi]]
</content>
