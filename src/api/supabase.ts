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

    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Sabit giderler çekilemedi:", error);
      return [];
    }
    return data || [];
  },

  async insert(expense: SupabaseFixedExpense): Promise<SupabaseFixedExpense | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('fixed_expenses')
      .insert({ ...expense, user_id: user.id })
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

    const { data, error } = await supabase
      .from('project_groups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Proje grupları çekilemedi:", error);
      return [];
    }
    return data || [];
  },

  async insert(group: SupabaseProjectGroup): Promise<SupabaseProjectGroup | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('project_groups')
      .insert({ ...group, user_id: user.id })
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

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Projeler çekilemedi:", error);
      return [];
    }
    return data || [];
  },

  async insert(project: SupabaseProject): Promise<SupabaseProject | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('projects')
      .insert({ ...project, user_id: user.id })
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

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Görevler çekilemedi:", error);
      return [];
    }
    return data || [];
  },

  async insert(task: SupabaseTask): Promise<SupabaseTask | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, user_id: user.id })
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
