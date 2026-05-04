# 🔧 Kod Snippets

## Supabase Servis Nesnesi Pattern

```typescript
// src/api/supabase.ts içine ekle
const yeniModulAPI = {
  getAll: (userId: string, companyId?: string) =>
    supabase
      .from('yeni_tablo')
      .select('*')
      .eq(companyId ? 'company_id' : 'user_id', companyId || userId),

  insert: (data: YeniModulInsert) =>
    supabase.from('yeni_tablo').insert(data).select().single(),

  update: (id: string, data: Partial<YeniModul>) =>
    supabase.from('yeni_tablo').update(data).eq('id', id).select().single(),

  delete: (id: string) =>
    supabase.from('yeni_tablo').delete().eq('id', id),
};
```

---

## Modül Bileşeni Şablonu

```typescript
// src/modules/YeniModul.tsx
import { useTranslation } from '@/api/translations';
import type { Profile, User, ModuleType } from '@/types';

interface YeniModulProps {
  profile: Profile;
  user: User;
  navigate: (module: ModuleType) => void;
  onBack?: () => void;
}

export default function YeniModul({ profile, user, navigate, onBack }: YeniModulProps) {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-enba-dark dark:text-white">
        {t('yeniModul.title')}
      </h1>
    </div>
  );
}
```

---

## localStorage Okuma/Yazma

```typescript
import { dataService } from '@/api/dataService';

// Okuma
const plans = dataService.getBusinessPlans();

// Yazma
dataService.saveBusinessPlans(updatedPlans);

// Doğrudan (key değiştirme!)
const raw = localStorage.getItem('enba_alislar');
const data = raw ? JSON.parse(raw) : [];
localStorage.setItem('enba_alislar', JSON.stringify(updated));
```

---

## Çeviri Ekleme

```typescript
// src/api/translations.ts içinde:
const translations = {
  tr: {
    yeniModul: {
      title: 'Yeni Modül',
      description: 'Açıklama metni',
    }
  },
  en: {
    yeniModul: {
      title: 'New Module',
      description: 'Description text',
    }
  }
}
```
