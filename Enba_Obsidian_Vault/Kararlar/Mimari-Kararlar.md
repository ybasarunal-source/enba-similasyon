# 🏛️ Mimari Kararlar

> Önemli teknik kararları ve gerekçelerini burada kaydet.
> Format: Tarih · Karar · Neden · Alternatifleri

---

## 2026 — Kuruluş Kararları

### React Router Kullanılmadı
- **Karar:** Custom history stack (App.tsx içinde)
- **Neden:** URL değişmemeli; embed/iframe senaryolarında uyumluluk
- **Alternatif:** React Router — URL değişimi sorun yaratırdı
- **Etki:** Deep link paylaşımı mümkün değil (kabul edildi)

### Redux/Zustand Kullanılmadı
- **Karar:** 3 katmanlı state (Supabase + localStorage + useState)
- **Neden:** Modüller izole, merkezi store gereksiz karmaşıklık
- **Etki:** Modüller arası veri paylaşımı yoktur

### Google Implicit OAuth
- **Karar:** Server-side callback yerine implicit flow
- **Neden:** Backend gerektirmez, daha basit kurulum
- **Risk:** Token yenileme yok → kullanıcı logout olabilir
- **Çözüm:** Kullanıcıya yeniden giriş yaptır

### Supabase Profil Cache (10s)
- **Karar:** 10 saniyelik önbellek
- **Neden:** Her navigasyonda DB sorgusu yapmamak
- **Risk:** Test sırasında stale data

---

## Yeni Karar Şablonu

### [Karar Başlığı]
- **Tarih:** 
- **Karar:** 
- **Neden:** 
- **Alternatif:** 
- **Etki/Risk:** 
