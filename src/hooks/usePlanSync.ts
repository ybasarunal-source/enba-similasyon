import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../api/supabase';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'synced';

interface UsePlanSyncOptions {
  localKey: string;
  planType: 'fast' | 'detailed';
}

function getDeletedSet(key: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
  catch { return new Set(); }
}
function markDeleted(key: string, ids: string[]) {
  const set = getDeletedSet(key);
  ids.forEach(id => id && set.add(id));
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* ignore */ }
}

export function usePlanSync<T extends { id: string; supabaseId?: string }>(opts: UsePlanSyncOptions) {
  const { localKey, planType } = opts;
  const deletedKey = `${localKey}_deleted`;

  const [planlar, setPlanlar] = useState<T[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState('');
  const deletedIds = useRef<Set<string>>(getDeletedSet(deletedKey));

  // ── İlk yükleme: localStorage hemen, Supabase sonra ──────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) setPlanlar(JSON.parse(raw));
    } catch { /* ignore */ }

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase
        .from('business_plans')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('plan_type', planType)
        .order('updated_at', { ascending: false });
      if (error || !data) return;

      setPlanlar(prev => {
        const deleted = deletedIds.current;
        const merged = [...prev];
        data.forEach((row: any) => {
          if (deleted.has(row.id)) return;
          const localPlan: any = row.data;
          if (!localPlan || deleted.has(localPlan.id)) return;
          const idx = merged.findIndex(p => p.supabaseId === row.id || p.id === row.id);
          const updated = { ...localPlan, supabaseId: row.id, status: row.status } as T;
          if (idx >= 0) merged[idx] = updated;
          else merged.push(updated);
        });
        localStorage.setItem(localKey, JSON.stringify(merged));
        return merged;
      });
    })();
  }, [localKey, planType, deletedKey]);

  // ── Kayıt: localStorage önce, Supabase toplu upsert/insert ──
  const kaydet = useCallback(async (guncel: T[]) => {
    setPlanlar(guncel);
    localStorage.setItem(localKey, JSON.stringify(guncel));
    setSyncStatus('syncing');
    setSyncError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Oturum bulunamadı');

      // JWT'den company_id al (profil sorgusu gerektirmez)
      const { data: { user } } = await supabase.auth.getUser();
      const companyId: string | null = (user?.app_metadata as any)?.company_id ?? null;

      const now = new Date().toISOString();
      const makePayload = (plan: any) => ({
        user_id: session.user.id,
        ...(companyId ? { company_id: companyId } : {}),
        plan_type: planType,
        status: plan.status || 'pending',
        title: plan.baslik || plan.title || 'Adsız Plan',
        year: plan.year || new Date().getFullYear(),
        data: plan,
        updated_at: now,
      });

      const mevcutlar = guncel.filter(p => (p as any).supabaseId) as any[];
      const yeniler   = guncel.filter(p => !(p as any).supabaseId) as any[];

      // Mevcut planları tek seferde güncelle (upsert)
      if (mevcutlar.length > 0) {
        const { error } = await supabase
          .from('business_plans')
          .upsert(mevcutlar.map(p => ({ id: p.supabaseId, ...makePayload(p) })));
        if (error) throw error;
      }

      // Yeni planları tek seferde ekle, dönen ID'leri local planla eşleştir
      const updated = [...guncel] as any[];
      if (yeniler.length > 0) {
        const { data: inserted, error } = await supabase
          .from('business_plans')
          .insert(yeniler.map(p => ({ ...makePayload(p), created_at: now })))
          .select('id, data');
        if (error) throw error;

        // data JSONB içindeki local id ile eşleştir
        (inserted as any[]).forEach(row => {
          const localId = (row.data as any)?.id;
          const idx = updated.findIndex(p => p.id === localId);
          if (idx >= 0) updated[idx].supabaseId = row.id;
        });
      }

      setPlanlar(updated);
      localStorage.setItem(localKey, JSON.stringify(updated));
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err: any) {
      setSyncStatus('error');
      setSyncError(err?.message || 'Supabase bağlantısı başarısız');
    }
  }, [localKey, planType]);

  // ── Tek plan sil ─────────────────────────────────────────────
  const sil = useCallback(async (id: string) => {
    const plan = planlar.find(p => p.id === id) as any;
    const guncel = planlar.filter(p => p.id !== id);

    setPlanlar(guncel);
    localStorage.setItem(localKey, JSON.stringify(guncel));

    markDeleted(deletedKey, [id, plan?.supabaseId]);
    deletedIds.current.add(id);
    if (plan?.supabaseId) deletedIds.current.add(plan.supabaseId);

    if (plan?.supabaseId) {
      try {
        await supabase.from('business_plans').delete().eq('id', plan.supabaseId);
      } catch (err: any) {
        setSyncStatus('error');
        setSyncError('Silme işlemi Supabase\'e yansıtılamadı: ' + (err?.message || ''));
      }
    }
  }, [planlar, localKey, deletedKey]);

  return { planlar, kaydet, sil, syncStatus, syncError };
}
