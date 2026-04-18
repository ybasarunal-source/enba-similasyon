import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/supabase';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'synced';

interface UsePlanSyncOptions {
  localKey: string;       // localStorage key
  planType: 'fast' | 'detailed';
}

export function usePlanSync<T extends { id: string; supabaseId?: string }>(opts: UsePlanSyncOptions) {
  const { localKey, planType } = opts;
  const [planlar, setPlanlar] = useState<T[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState('');

  // ── İlk yükleme: localStorage hemen, Supabase sonra ──────────
  useEffect(() => {
    // 1. localStorage'dan anında göster
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) setPlanlar(JSON.parse(raw));
    } catch { /* ignore */ }

    // 2. Supabase'den çek, daha güncel varsa birleştir
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
        // Supabase kayıtlarını localId → supabaseId eşleşmesiyle birleştir
        const merged = [...prev];
        data.forEach((row: any) => {
          const localPlan: any = row.data;
          if (!localPlan) return;
          const idx = merged.findIndex(p => p.supabaseId === row.id || p.id === row.id);
          const updated = { ...localPlan, supabaseId: row.id, status: row.status } as T;
          if (idx >= 0) merged[idx] = updated;
          else merged.push(updated);
        });
        localStorage.setItem(localKey, JSON.stringify(merged));
        return merged;
      });
    })();
  }, [localKey, planType]);

  // ── Kayıt: localStorage önce, Supabase arka planda ──────────
  const kaydet = useCallback(async (guncel: T[]) => {
    // 1. localStorage'a anında yaz (veri kayıpsız)
    setPlanlar(guncel);
    localStorage.setItem(localKey, JSON.stringify(guncel));
    setSyncStatus('syncing');
    setSyncError('');

    // 2. Arka planda Supabase'e sync et
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Oturum bulunamadı');

      // Her planı ayrı ayrı upsert et (değişmiş olanları bul)
      const updated: T[] = [...guncel];
      for (let i = 0; i < guncel.length; i++) {
        const plan = guncel[i] as any;
        const payload = {
          user_id: session.user.id,
          plan_type: planType,
          status: plan.status || 'pending',
          title: plan.baslik || plan.title || 'Adsız Plan',
          year: plan.year || new Date().getFullYear(),
          data: plan,
          updated_at: new Date().toISOString(),
        };
        if (plan.supabaseId) {
          // Güncelle
          const { error } = await supabase
            .from('business_plans')
            .update(payload)
            .eq('id', plan.supabaseId);
          if (error) throw error;
        } else {
          // Yeni kayıt
          const { data, error } = await supabase
            .from('business_plans')
            .insert({ ...payload, created_at: new Date().toISOString() })
            .select('id')
            .single();
          if (error) throw error;
          (updated[i] as any).supabaseId = data.id;
        }
      }

      // supabaseId güncellendiyse localStorage'ı da güncelle
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

    if (plan?.supabaseId) {
      try {
        await supabase.from('business_plans').delete().eq('id', plan.supabaseId);
      } catch (err: any) {
        setSyncStatus('error');
        setSyncError('Silme işlemi Supabase\'e yansıtılamadı: ' + (err?.message || ''));
      }
    }
  }, [planlar, localKey]);

  return { planlar, kaydet, sil, syncStatus, syncError };
}
