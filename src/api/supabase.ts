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
export type UserRole = 'super_admin' | 'admin' | 'user';

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
  company_id?: string; // Opsiyonel yapıldı (migration öncesi çökmemesi için)
  permissions: ModulePermissions;
  created_at: string;
  ms_account_id?: string;
  ms_account_username?: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'demo';
  created_at: string;
}

// ── Yardımcı Fonksiyonlar ──────────────────────────────────
// ── Profil & Yetki Servisleri ──────────────────────────────
let cachedProfile: UserProfile | null = null;
let lastFetchTime = 0;

export const profileAPI = {
  async getMyProfile(force = false): Promise<UserProfile | null> {
    const now = Date.now();
    if (cachedProfile && !force && (now - lastFetchTime < 10000)) {
      return cachedProfile;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.warn("Profil veritabanından alınamadı, varsayılan profil kullanılacak.");
        return null;
      }
      cachedProfile = data;
      lastFetchTime = now;
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
  },

  clearCache() {
    cachedProfile = null;
    lastFetchTime = 0;
  },

  async adminUpdateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating profile as admin:', error);
      throw error;
    }
    return data;
  },

  async deleteProfile(id: string): Promise<boolean> {
    // Note: This only deletes the profile record, not the auth user.
    // In a real SaaS, you'd call an Edge Function to delete the auth user too.
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
    return true;
  }
};

// ── Companies (Şirketler) API ──────────────────────────────
export const companiesAPI = {
  async getAll(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');
    if (error) return [];
    return data || [];
  },

  async getById(id: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  async insert(company: Partial<Company>): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .insert(company)
      .select()
      .single();
    if (error) {
      console.error('Error inserting company:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, updates: Partial<Company>): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
    return true;
  }
};

// ── Fixed Expenses (Abonelikler) API ───────────────────────
export interface SupabaseFixedExpense {
  id?: string;
  user_id?: string;
  title: string;
  amount: number;
  category: string;
  due_date: number;
  is_auto_pay: boolean;
  parasut_match_keyword?: string;
  history: Record<string, boolean>;
  created_at?: string;
}

export const fixedExpensesAPI = {
  async getAll(): Promise<SupabaseFixedExpense[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Profil üzerinden company_id al, yoksa user_id fallback kullan (migration öncesi destek)
    const profile = await profileAPI.getMyProfile();
    const query = supabase.from('fixed_expenses').select('*');
    
    if (profile?.company_id) {
      query.eq('company_id', profile.company_id);
    } else {
      query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error("Sabit giderler çekilemedi:", error);
      return [];
    }
    return data || [];
  },

  async insert(expense: SupabaseFixedExpense): Promise<SupabaseFixedExpense | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const profile = await profileAPI.getMyProfile();
    const payload: any = { ...expense, user_id: user.id };
    if (profile?.company_id) payload.company_id = profile.company_id;

    const { data, error } = await supabase
      .from('fixed_expenses')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Sabit gider eklenemedi:", error);
      return null;
    }
    return data;
  },

  async update(id: string, updates: Partial<SupabaseFixedExpense>): Promise<SupabaseFixedExpense | null> {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Sabit gider güncellenemedi:", error);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('fixed_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Sabit gider silinemedi:", error);
      return false;
    }
    return true;
  }
};

// ── Tasks (Görevler) API ──────────────────────────────────
export interface SupabaseProjectGroup {
  id: string;
  user_id?: string;
  name: string;
  created_at?: string;
}

export interface SupabaseProject {
  id: string;
  user_id?: string;
  name: string;
  group_id?: string;
  created_at?: string;
}

export interface SupabaseTask {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  priority: string;
  deadline?: string;
  project_id?: string;
  module_ref?: string;
  status: string;
  source: string;
  ms_todo_id?: string;
  ms_list_id?: string;
  g_task_id?: string;
  g_list_id?: string;
  is_pinned?: boolean;
  created_at?: string;
}

export const projectGroupsAPI = {
  async getAll(): Promise<SupabaseProjectGroup[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const profile = await profileAPI.getMyProfile();
    const query = supabase.from('project_groups').select('*');
    
    if (profile?.company_id) {
      query.eq('company_id', profile.company_id);
    } else {
      query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error("Proje grupları çekilemedi:", error);
      return [];
    }
    return data || [];
  },

  async insert(group: SupabaseProjectGroup): Promise<SupabaseProjectGroup | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const profile = await profileAPI.getMyProfile();
    const payload: any = { ...group, user_id: user.id };
    if (profile?.company_id) payload.company_id = profile.company_id;

    const { data, error } = await supabase
      .from('project_groups')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Proje grubu eklenemedi:", error);
      return null;
    }
    return data;
  },

  async update(id: string, updates: Partial<SupabaseProjectGroup>): Promise<SupabaseProjectGroup | null> {
    const { data, error } = await supabase
      .from('project_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Proje grubu güncellenemedi:", error);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('project_groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Proje grubu silinemedi:", error);
      return false;
    }
    return true;
  }
};

export const projectsAPI = {
  async getAll(): Promise<SupabaseProject[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const profile = await profileAPI.getMyProfile();
    const query = supabase.from('projects').select('*');
    
    if (profile?.company_id) {
      query.eq('company_id', profile.company_id);
    } else {
      query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error("Projeler çekilemedi:", error);
      return [];
    }
    return data || [];
  },

  async insert(project: SupabaseProject): Promise<SupabaseProject | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const profile = await profileAPI.getMyProfile();
    const payload: any = { ...project, user_id: user.id };
    if (profile?.company_id) payload.company_id = profile.company_id;

    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Proje eklenemedi:", error);
      return null;
    }
    return data;
  },

  async update(id: string, updates: Partial<SupabaseProject>): Promise<SupabaseProject | null> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Proje güncellenemedi:", error);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Proje silinemedi:", error);
      return false;
    }
    return true;
  }
};

export const tasksAPI = {
  async getAll(): Promise<SupabaseTask[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const profile = await profileAPI.getMyProfile();
    const query = supabase.from('tasks').select('*');
    
    if (profile?.company_id) {
      query.eq('company_id', profile.company_id);
    } else {
      query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("Görevler çekilemedi:", error);
      return [];
    }
    return data || [];
  },

  async insert(task: SupabaseTask): Promise<SupabaseTask | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const profile = await profileAPI.getMyProfile();
    const payload: any = { ...task, user_id: user.id };
    if (profile?.company_id) payload.company_id = profile.company_id;

    const { data, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Görev eklenemedi:", error);
      return null;
    }
    return data;
  },

  async update(id: string, updates: Partial<SupabaseTask>): Promise<SupabaseTask | null> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Görev güncellenemedi:", error);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Görev silinemedi:", error);
      return false;
    }
    return true;
  }
};

// ── PnL (Kâr/Zarar) API ──────────────────────────────────
export interface SupabasePnlReport {
  id: string;
  user_id?: string;
  name: string;
  date: string;
  payload: any;
  created_at?: string;
}

export const pnlReportsAPI = {
  async getAll(): Promise<SupabasePnlReport[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const profile = await profileAPI.getMyProfile();
    const query = supabase.from('pnl_reports').select('*');
    
    if (profile?.company_id) {
      query.eq('company_id', profile.company_id);
    } else {
      query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("PnL raporları çekilemedi:", error);
      return [];
    }
    return data || [];
  },

  async insert(report: SupabasePnlReport): Promise<SupabasePnlReport | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const profile = await profileAPI.getMyProfile();
    const payload: any = { ...report, user_id: user.id };
    if (profile?.company_id) payload.company_id = profile.company_id;

    const { data, error } = await supabase
      .from('pnl_reports')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("PnL raporu eklenemedi:", error);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('pnl_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("PnL raporu silinemedi:", error);
      return false;
    }
    return true;
  }
};

// ── Machinery (Makine & Envanter) API ──────────────────────
export interface SupabaseAsset {
  id: string;
  user_id?: string;
  adi: string;
  marka?: string;
  motor_gucu?: number;
  yatirim_bedeli: number;
  satinalma_tarihi: string;
  kategori: string;
  kapasite?: number;
  boyut?: string;
  tur: string;
  created_at?: string;
}

export interface SupabaseMaintenanceRecord {
  id: string;
  user_id?: string;
  tarih: string;
  varlik_id: string;
  varlik_adi: string;
  varlik_turu: string;
  tur: string;
  aciklama: string;
  maliyet: number;
  created_at?: string;
}

export const assetsAPI = {
  async getAll(): Promise<SupabaseAsset[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const profile = await profileAPI.getMyProfile();
    const query = supabase.from('assets').select('*');
    
    if (profile?.company_id) {
      query.eq('company_id', profile.company_id);
    } else {
      query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error("Varlıklar çekilemedi:", error);
      return [];
    }
    return data || [];
  },

  async insert(asset: SupabaseAsset): Promise<SupabaseAsset | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const profile = await profileAPI.getMyProfile();
    const payload: any = { ...asset, user_id: user.id };
    if (profile?.company_id) payload.company_id = profile.company_id;

    const { data, error } = await supabase
      .from('assets')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Varlık eklenemedi:", error);
      return null;
    }
    return data;
  },

  async update(id: string, updates: Partial<SupabaseAsset>): Promise<SupabaseAsset | null> {
    const { data, error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Varlık güncellenemedi:", error);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Varlık silinemedi:", error);
      return false;
    }
    return true;
  }
};

export const maintenanceAPI = {
  async getAll(): Promise<SupabaseMaintenanceRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const profile = await profileAPI.getMyProfile();
    const query = supabase.from('maintenance_records').select('*');
    
    if (profile?.company_id) {
      query.eq('company_id', profile.company_id);
    } else {
      query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("Bakım kayıtları çekilemedi:", error);
      return [];
    }
    return data || [];
  },

  async insert(record: SupabaseMaintenanceRecord): Promise<SupabaseMaintenanceRecord | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const profile = await profileAPI.getMyProfile();
    const payload: any = { ...record, user_id: user.id };
    if (profile?.company_id) payload.company_id = profile.company_id;

    const { data, error } = await supabase
      .from('maintenance_records')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Bakım kaydı eklenemedi:", error);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('maintenance_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Bakım kaydı silinemedi:", error);
      return false;
    }
    return true;
  }
};

// ── Licensing (Lisans ve İzinler) API ──────────────────────
export interface SupabasePermit {
  id: string;
  user_id?: string;
  ad: string;
  kategori: string;
  kurum: string;
  alinis_tarihi: string;
  yenileme_tarihi: string | null;
  is_suresiz: boolean;
  maliyet: number;
  file_id?: string;
  file_name?: string;
  created_at?: string;
}

export const permitsAPI = {
  async getAll(): Promise<SupabasePermit[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const profile = await profileAPI.getMyProfile();
    const query = supabase.from('permits').select('*');
    
    if (profile?.company_id) {
      query.eq('company_id', profile.company_id);
    } else {
      query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("Lisanslar çekilemedi:", error);
      return [];
    }
    return data || [];
  },

  async insert(permit: SupabasePermit): Promise<SupabasePermit | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const profile = await profileAPI.getMyProfile();
    const payload: any = { ...permit, user_id: user.id };
    if (profile?.company_id) payload.company_id = profile.company_id;

    const { data, error } = await supabase
      .from('permits')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Lisans eklenemedi:", error);
      return null;
    }
    return data;
  },

  async update(id: string, updates: Partial<SupabasePermit>): Promise<SupabasePermit | null> {
    const { data, error } = await supabase
      .from('permits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Lisans güncellenemedi:", error);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('permits')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Lisans silinemedi:", error);
      return false;
    }
    return true;
  }
};
