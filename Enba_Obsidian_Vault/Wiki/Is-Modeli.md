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

## Geliştirme Öncelikleri

1. **SQL şeması** — tüm tabloların `company_id` ile doğru izole edilmesi, RLS (Row Level Security) politikaları
2. **Modül eksikleri** — 21 modül sırayla gözden geçirilip tamamlanacak
3. **Gerçek veri girişi** — kendi şirket verileri girilecek
4. **Demo hazırlığı** — demo hesabı için örnek veri seti oluşturulacak

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
