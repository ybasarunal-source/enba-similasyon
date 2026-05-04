# Entegrasyon Mimarisi — Sentez

> **Tip:** Wiki sentez sayfası (LLM tarafından üretildi)
> **Oluşturma:** 2026-05-04
> **Kaynaklar:** CLAUDE.md, Karpathy-LLM-Wiki

---

## Genel Bakış

Enba Similasyon üç dış servisle entegre çalışır: Microsoft (Outlook/Calendar/Tasks), Google (Calendar/Tasks/Gmail) ve Paraşüt (muhasebe). Her entegrasyon farklı OAuth akışı kullanır ve farklı risk profiline sahiptir.

---

## Karşılaştırma

| Özellik | Microsoft | Google | Paraşüt |
|---------|-----------|--------|---------|
| OAuth tipi | MSAL (auth code) | Implicit flow | Custom proxy |
| Token yenileme | ✅ Otomatik | ❌ YOK | ✅ Var |
| Token yeri | localStorage | localStorage | In-memory + localStorage |
| Kütüphane | msal-browser + Graph | Doğrudan OAuth | Özel |
| Risk | Düşük | **Yüksek** | Orta |

---

## Kritik Risk: Google Token Yenileme Yok

Google implicit flow token expire olduğunda kullanıcı yeniden giriş yapmak zorunda. Bu bilinçli bir tasarım kararı (server-side callback gerekmemesi için) ama kullanıcı deneyimini olumsuz etkileyebilir.

**Olası çözümler:**
1. Kullanıcıya token expire uyarısı göster
2. Google Identity Services (GIS) yeni akışına geç
3. Backend proxy ekle (Paraşüt gibi)

---

## Login Akışı

```
Kullanıcı giriş yapar
    ↓
App.tsx → profiles satırını yükler
    ↓
resumeSession(profile) çağrılır
    ↓
Microsoft + Google + Paraşüt tokenları localStorage'dan restore edilir
    ↓
Modüller kullanıma hazır
```

---

## İlgili Sayfalar

- [[Kararlar/Mimari-Kararlar]]
- [[Snippets/Supabase-Pattern]]
- [[Ham-Kaynaklar/Karpathy-LLM-Wiki]]
