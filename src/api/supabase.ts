import { createClient } from '@supabase/supabase-js';

/**
 * Supabase İstemcisi (TypeScript)
 * Veritabanı ve Auth işlemleri için modüler erişim noktası.
 * Değerler Vite environment variables (.env) üzerinden alınır.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wmkfrzfatvxzpyahkdai.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_H3QZ8w1SForuOFFsJzYwVQ_RFtjNu6L';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase bağlantı bilgileri eksik! Lütfen .env dosyasını kontrol edin.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Profil & Yetki Tipleri ────────────────────────────────
export type UserRole = 'admin' | 'user';

export interface ModulePermissions {
  dashboard?: boolean;
  stock?: boolean;
  production?: boolean;
  logistics?: boolean;
  hr?: boolean;
  archive?: boolean;
  cashflow?: boolean;
  planning?: boolean;
  fastplan?: boolean;
  machinery?: boolean;
  tasks?: boolean;
  licensing?: boolean;
  pnl?: boolean;
  settings?: boolean;
  profile?: boolean;
  [key: string]: boolean | undefined;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  permissions: ModulePermissions;
  created_at: string;
  ms_account_id?: string;
  ms_account_username?: string;
}

// ── Yardımcı Fonksiyonlar ──────────────────────────────────
export const profileAPI = {
  async getMyProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        // RLS recursion errors often return 500, we catch it here and return null
        console.warn("Profil veritabanından alınamadı (RLS hatası), varsayılan profil kullanılacak.");
        return null;
      }
      return data;
    } catch (err) {
      console.error("Profil servis hatası:", err);
      return null;
    }
  },

  async getAllProfiles(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Profiller listelenemedi:", error);
      return [];
    }
    return data || [];
  },

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
      
    if (error) {
      console.error("Profil güncellenemedi:", error);
      return false;
    }
    return true;
  },

  async resetPassword(email: string): Promise<boolean> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return !error;
  }
};
