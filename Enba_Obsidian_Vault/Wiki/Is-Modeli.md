# İş Modeli & Hedefler

> **Tip:** Wiki sayfası
> **Oluşturma:** 2026-05-04

---

## İki Paralel Hedef

### 1. Kendi Şirket ERP'i
Uygulamanın gerçek verilerle (kendi şirket bilgileriyle) doldurulması ve günlük operasyonların buradan yürütülmesi. Gerçek kullanım aynı zamanda ürünü test eder ve geliştirir.

### 2. SaaS Demo & Pazarlama
`demo@enba.com` hesabı (super_admin) başka geri dönüşüm/üretim şirketlerine ürünü tanıtmak için kullanılacak. Demo verisi gerçekçi ama anonim olmalı.

---

## Kritik Tasarım Kısıtı: Multi-Tenancy

Her iki hedef multi-tenant yapının sağlam çalışmasını zorunlu kılıyor:
- `company_id` → her tenant'ın verisi birbirinden kesinlikle izole olmalı
- Demo verisi → gerçek müşteri verisinden ayrı tutulmalı
- SQL şeması bu izolasyonu garantilemeli

---

## Geliştirme Öncelikleri (2026-05-06 güncel)

### Faz 1 — Tamamlandı ✅
- Tüm 20 modül Supabase'e bağlı, CRUD çalışıyor
- Multi-tenant RLS v23'e kadar tüm tablolarda
- localStorage → Supabase göçleri tamamlandı

### Faz 2 — Bir Sonraki (6–8 hafta)
1. **Bordro hesaplama** — SGK/gelir vergisi/damga formülleri, bordro fişi (dışsal bağımlılık yok, hemen başlanabilir)
2. **E-fatura** — entegratör seçimi + sözleşme + UBL XML + API (mali mühür gerekli)
3. **Paraşüt tamamlama** — stok eşleştirmesi, kalan uç noktalar
4. **Muhasebe motoru** — Tek Düzen Hesap Planı, yevmiye, mizan (en karmaşık, en sona)
5. **Finansal raporlama** — bilanço, gelir tablosu (muhasebe motoru tamamlandıktan sonra)

### Piyasa Hedefi
- Faz 2 tamamlandığında SaaS olarak pazarlanabilir
- Hedef: Türkiye'de 5.000–20.000 geri dönüşüm/plastik/kağıt üreticisi
- Fiyat aralığı: 2.000–4.000 ₺/ay/şirket

---

## SQL Şeması Öncelikleri

- [ ] Mevcut tablo yapısını dökümle
- [ ] Her tablonun `company_id` ile izole edildiğini doğrula
- [ ] RLS politikalarını gözden geçir
- [ ] Eksik tablo/alan varsa belirle
- [ ] Migration planı oluştur

---

## İlgili Sayfalar

- [[Kararlar/Mimari-Kararlar]]
- [[Wiki/Entegrasyon-Mimarisi]]
- [[Moduller/00-Modul-Listesi]]
