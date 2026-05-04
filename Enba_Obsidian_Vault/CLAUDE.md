# CLAUDE.md
> Enba Similasyon — Claude Code için proje hafızası + wiki bakım şeması.
> Her oturumda otomatik yüklenir.

---

## ⚡ Oturum Protokolü (HER OTURUMDA UYGULA)

### Oturum Başında (önce bunları yap)
1. `Enba_Obsidian_Vault/index.md` oku → konuyla ilgili sayfaları belirle
2. İlgili wiki sayfalarını oku (Kararlar/, Moduller/, Snippets/)
3. `Enba_Obsidian_Vault/log.md` son 3 girişe bak → bağlamı kur
4. `Aktif Görevler` bölümünü kontrol et

### Anlık Log — Her Önemli Adımdan Sonra Otomatik

Kullanıcı onayı bekleme. Şu durumlarda `log.md`'ye hemen giriş ekle ve ilgili wiki sayfasını güncelle:
- Yeni özellik tamamlandı
- Bug düzeltildi
- Mimari karar alındı
- Yeni modül eklendi veya güncellendi
- SQL şeması değişti

```
## [YYYY-MM-DD HH:MM] geliştirme | kısa özet
- Yapılan: ...
- Etkilenen dosyalar: ...
- Bir sonraki: ...
```

### Oturum Sonunda — "oturumu kapat" komutu geldiğinde

1. Oturumun genel özetini `log.md`'ye ekle
2. `CLAUDE.md` → `Aktif Görevler` bölümünü güncelle
3. `index.md`'yi güncelle (yeni sayfa eklendiyse)
4. Kullanıcıya söyle:
   > "Oturum kaydedildi. Obsidian Git otomatik push edecek. Hemen göndermek istersen Ctrl+P → Git: Commit → Git: Push."

---

## Wiki Bakım Kuralları

### Yeni sayfa oluşturma
- **Modül sayfası:** `Moduller/ModulAdi.md`
- **Karar sayfası:** `Kararlar/YYYY-MM-Konu.md`
- **Sentez/araştırma:** `Wiki/Konu.md`
- **Snippet:** `Snippets/Konu.md`
- Her yeni sayfayı `index.md`'ye ekle

### Sayfa güncelleme
- Mevcut sayfayı sil/yeniden yaz değil → ilgili bölümü güncelle
- Çelişki tespit edilirse → `index.md` Çelişki Takibi bölümüne ekle
- Eski bilgiyi silme — üstüne `~~eski bilgi~~` ile çiz, yeni bilgiyi yaz

### Lint (haftada bir önerilen)
Şunları kontrol et ve `index.md`'ye raporla:
- Orphan sayfalar (hiçbir yerden link almayan)
- Çelişkili bilgiler (iki sayfa aynı konuda farklı şey söylüyor)
- Güncellenmesi gereken stale bilgiler
- Sayfası olmayan ama sık geçen kavramlar

---

## Hızlı Komutlar

```bash
npm run dev        # Vite dev server (port 5173)
npm run build      # tsc + vite build
npm run lint       # ESLint --max-warnings 0
npm run preview    # Production önizleme
```

Test suite yok. `tsc` birincil doğruluk kontrolü.

---

## Proje Kimliği

**Enba Similasyon** — Geri dönüşüm ve üretim sektörü için Türkçe çok kiracılı ERP platformu.
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase
**Canlı URL:** https://uygulama.basarunal.com
**Deployment:** Vercel (SPA, tüm rotalar `index.html`)
**Demo:** `demo@enba.com` (super_admin, super_admin paneli hariç tümü)

---

## Mimari — Kritik Kararlar

### Navigasyon (React Router YOK)
Custom history stack — tüm navigasyon `App.tsx`'te:
- `activeModule` → hangi modül render edilir
- `navigate(moduleId)` → her modüle prop olarak geçilir
- `history: ModuleType[]` + `historyIndex` → geri/ileri simüle eder
- `sessionStorage` → sayfa yenilenmesinde aktif modülü korur
- **URL hiç değişmez** — embed/iframe uyumluluğu için

### State (Redux/Zustand YOK)
1. **Supabase** → auth, profiles, tasks, assets, permits, plans, maintenance
2. **localStorage** → business plans, alış/satış/üretim kayıtları, OAuth tokenlar, tema, dil
3. **useState** → modül bazlı geçici durum

> ⚠️ localStorage key'leri değiştirme: `enba_detailed_plans`, `enba_business_plans`, `enba_alislar`, `enba_satislar`, `enba_uretim_kayitlari`, `enba_language`, `enba_theme`

### Modüller (21 adet)
`src/modules/` — bağımsız React component. Props: `navigate`, `profile`, `user`, `onBack?`

**Core (her zaman görünür):** `dashboard`, `profile`, `tasks`, `calendar`, `modules`, `mail`, `fixedexpenses`
**İzinli:** diğerleri → `profile.permissions[moduleId]`

---

## Auth & Multi-Tenancy

Supabase email/şifre. `profiles` satırı:
- `company_id` → tenant (legacy: `user_id`'ye fallback)
- `role` → `'super_admin' | 'admin' | 'user'`
- `permissions` → modül bazlı boolean RBAC

---

## API Katmanı (`src/api/`)

| Dosya | Görev |
|-------|-------|
| `supabase.ts` | Client + servis nesneleri, 10s profil cache |
| `microsoft.ts` | MSAL OAuth → Outlook, Calendar, Tasks |
| `google.ts` | Implicit OAuth → Google Calendar, Tasks, Gmail |
| `parasut.ts` | Paraşüt → `/parasut-oauth` + `/parasut-api` proxy |
| `translations.ts` | TR/EN string tablosu (~59KB) |
| `dataService.ts` | localStorage helpers |

---

## Entegrasyonlar

Login'de `resumeSession(profile)` → tokenları restore eder.

| Servis | Kütüphane | Token | Oto Yenileme |
|--------|-----------|-------|--------------|
| Microsoft | `@azure/msal-browser` + Graph | localStorage | ✅ |
| Google | Implicit OAuth | localStorage | ❌ YOK |
| Paraşüt | Custom proxy | In-memory + localStorage | Var |

---

## i18n

`I18nProvider` (Context) → `useTranslation()` hook → `localStorage['enba_language']`
Tüm stringler: `src/api/translations.ts`

---

## Stil

- Tailwind: `enba-orange` (#E35205), `enba-dark` (#1A1A1A)
- Tema: `<html>` CSS variables → `localStorage['enba_theme']`
- Font: Poppins
- Path alias: `@/` → `src/`

---

## Environment Variables

```
VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
VITE_MICROSOFT_CLIENT_ID / VITE_MICROSOFT_TENANT_ID
VITE_GOOGLE_CLIENT_ID
VITE_PARASUT_CLIENT_ID / VITE_PARASUT_CLIENT_SECRET
```

---

## Bilinen Sorunlar

- Google OAuth → token yenileme yok, kullanıcı logout olabilir
- localStorage key değişirse eski kullanıcı verisi kaybolur
- React Router yok → deep link paylaşımı yok (tasarım gereği)
- ESLint sıfır tolerans → her commit öncesi `npm run lint`
- Supabase cache 10s → test sırasında stale data olabilir

---

## Aktif Görevler
> Her oturum başında güncelle

- [ ] _(şu an çalışılan özellik)_
- [ ] _(devam eden bug)_
- [ ] _(bir sonraki hedef)_

---

## Yeni Modül Kontrol Listesi

1. `src/modules/YeniModul.tsx` oluştur
2. `App.tsx` → `ModuleType`'a ekle
3. Supabase `profiles` → `permissions.yeniModul` ekle
4. `translations.ts` → TR/EN ekle
5. Modules sayfasına kart ekle
6. Permission check ekle (core değilse)
7. `Moduller/YeniModul.md` wiki sayfası oluştur
8. `index.md`'yi güncelle
