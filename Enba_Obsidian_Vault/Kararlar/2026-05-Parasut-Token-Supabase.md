# Paraşüt OAuth Token — localStorage'dan Supabase'e Migrasyon

Tarih: 2026-05-19  
Durum: **Karar verildi** — implementasyon sıralanmalı

---

## Problem

Paraşüt OAuth token'ları şu an `localStorage`'da tutuluyor (`enba_parasut_token` key'i). Bu yaklaşımın temel sorunu:

**localStorage kullanıcıya değil, tarayıcıya aittir.**

Senaryo:
1. Kullanıcı A giriş yapar → Paraşüt'e bağlanır → token localStorage'a yazılır
2. Kullanıcı A çıkar, Kullanıcı B (farklı şirket) giriş yapar
3. Kullanıcı B, Kullanıcı A'nın Paraşüt token'ını görebilir/kullanabilir
4. Kullanıcı A tekrar giriş yapar → token silinmiş veya B'nin token'ıyla çakışmış → logout görünür

Bu durum hem güvenlik açığı hem UX sorunudur.

---

## Neden localStorage Yetersiz

| Özellik | localStorage | Supabase |
|---------|-------------|----------|
| Kullanıcı izolasyonu | ❌ Hayır (tarayıcı bazlı) | ✅ company_id ile izole |
| Çoklu cihaz | ❌ Hayır | ✅ Evet |
| Oturum kapatma sonrası | ❌ Veri kalır | ✅ Temizlenebilir |
| Güvenlik | ⚠️ JS ile okunabilir | ✅ RLS ile korumalı |
| Otomatik yenileme | ⚠️ Sayfa başında | ✅ Her login'de |

---

## Önerilen Çözüm

### Supabase `parasut_tokens` Tablosu

```sql
CREATE TABLE parasut_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  access_token  text NOT NULL,
  refresh_token text NOT NULL,
  expires_at    bigint NOT NULL,         -- Unix ms
  parasut_company_id  bigint,
  parasut_company_data jsonb,            -- {id, name, ...}
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Şirket başına bir satır
CREATE UNIQUE INDEX parasut_tokens_company_idx ON parasut_tokens(company_id);

-- RLS: sadece kendi şirketine ait token'ı görebilir
ALTER TABLE parasut_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parasut_tokens_company_only" ON parasut_tokens
  USING (
    company_id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
```

---

### parasut.ts Değişiklikleri

**saveToken()** → Supabase'e de yaz (upsert):
```ts
async function saveToken(data) {
  _memToken = { ...data };
  // localStorage: backward compat / offline cache
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
  // Supabase: kalıcı, company-izole depolama
  const companyId = getCurrentCompanyId(); // profiles.company_id
  if (companyId) {
    await supabase.from('parasut_tokens').upsert({
      company_id: companyId,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id' });
  }
}
```

**loadTokenFromSupabase()** → login sonrası çağrılır:
```ts
async function loadTokenFromSupabase(companyId: string) {
  const { data } = await supabase
    .from('parasut_tokens')
    .select('*')
    .eq('company_id', companyId)
    .single();
  if (data) {
    _memToken = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    };
    // localStorage'ı da senkronize et
    localStorage.setItem(TOKEN_KEY, JSON.stringify(_memToken));
    if (data.parasut_company_data) {
      localStorage.setItem(COMPANY_KEY, JSON.stringify(data.parasut_company_data));
    }
    return true;
  }
  return false;
}
```

**disconnect()** → Supabase satırını da sil:
```ts
disconnect() {
  _memToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(COMPANY_KEY);
  // Supabase'den de sil
  const companyId = getCurrentCompanyId();
  if (companyId) {
    supabase.from('parasut_tokens').delete().eq('company_id', companyId);
  }
}
```

**resumeSession()** → App.tsx login sonrası:
```ts
// App.tsx → resumeSession içinde
const restored = await parasutAPI.loadTokenFromSupabase(profile.company_id);
if (!restored) {
  // localStorage fallback (mevcut davranış)
  parasutAPI.loadFromLocalStorage();
}
```

---

## Migration Notu

⚠️ Bu migration veri kaybetmez. `parasut_tokens` yeni bir tablodur.

Ancak mevcut localStorage token'ları Supabase'e migrate edilmez — kullanıcıların tek seferlik yeniden bağlanması gerekir. Bu kabul edilebilir.

---

## Güvenlik Değerlendirmesi

- **Token şifreleme:** Supabase varsayılanda AES-256 ile at-rest şifreleme yapar. Paraşüt token'ları için yeterli.
- **RLS:** Her şirket sadece kendi satırını görebilir — yatay veri sızıntısı yok.
- **Kapsam sınırı:** Paraşüt access token sadece Paraşüt verisine erişim verir, Enba Supabase'e değil. Risk sınırlı.
- **İleride:** Supabase Vault ile ek katman şifreleme eklenebilir (şimdi gerekli değil).

---

## Uygulama Sırası

1. `migration_parasut_tokens.sql` yaz ve Supabase'de çalıştır
2. `parasut.ts` içinde `saveToken`, `loadTokenFromSupabase`, `disconnect` güncelle
3. App.tsx `resumeSession` içine `loadTokenFromSupabase` çağrısı ekle
4. Test: iki farklı Supabase hesabıyla giriş/çıkış → token izolasyonu doğrula
5. localStorage fallback'i bir süre tut (geriye dönük compat), sonra kaldır

---

## İlgili Sayfalar

[[Kararlar/2026-05-DetailedPlan-Veri-Girisi|DetailedPlan Veri Girişi Mimarisi]]  
[[Kararlar/2026-05-MKodu-Finansal-Taksonomi|M-Kodu Finansal Taksonomi]]  
[[Moduller/00-Modul-Listesi|Modül Listesi]]
