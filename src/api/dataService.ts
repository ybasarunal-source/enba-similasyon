import { supabase } from './supabase';

/**
 * Enba Similasyon - Veri Servisi (TypeScript)
 * Uygulamanın veritabanı işlemlerini merkezi olarak yönetir.
 */

// --- Veri Modelleri (Interfaces) ---

export interface StockRecord {
  id?: string;
  tarih: string;
  tedarikciAdi: string;
  hammaddeTuru: string;
  brutMiktar: number;
  netMiktar: number;
  alisFiyati: number;
  nakliyeBedeli: number;
  ymFire?: number;
  nemFire?: number;
  birimMaliyet?: number;
  notlar?: string;
}

export interface SalesRecord {
  id?: string;
  tarih: string;
  musteriAdi: string;
  stokTuru: string;
  hammadde_turu?: string;
  mamul_turu?: string;
  miktar: number;
  satisFiyati: number;
  nakliyeBedeli: number;
  notlar?: string;
}

export interface Contact {
  id: string;
  name: string;
  contact_type: 'supplier' | 'customer';
  // Diğer alanlar eklenebilir
}

export interface BusinessPlan {
  id?: string;
  user_id?: string;
  title: string;
  year: number;
  status: string;
  plan_type: 'fast' | 'detailed';
  data: any;
  created_at?: string;
  updated_at?: string;
}

// --- Servis Metodları ---

export const DataService = {
  /**
   * Oturum kontrolü
   */
  async getCurrentUser() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session.user;
  },

  /**
   * Genel Kayıt Getirme
   */
  async fetchData<T>(table: string, select: string = '*'): Promise<T[]> {
    const { data, error } = await supabase.from(table).select(select);
    if (error) {
      console.error(`${table} verisi çekilemedi:`, error);
      throw error;
    }
    return (data as T[]) || [];
  },

  /**
   * Stoka ait alış kayıtlarını getir
   */
  async getAlislar(): Promise<StockRecord[]> {
    const data = await this.fetchData<any>('stock_records');
    return data.map(r => ({
      id: r.id, tarih: r.tarih, tedarikciAdi: r.tedarikci_adi, hammaddeTuru: r.hammadde_turu,
      brutMiktar: r.brut_miktar, netMiktar: r.net_miktar, alisFiyati: r.alis_fiyati,
      nakliyeBedeli: r.nakliye_bedeli, ymFire: r.ym_fire, nemFire: r.nem_fire,
      birimMaliyet: r.birim_maliyet, notlar: r.notlar
    }));
  },

  /**
   * Satış kayıtlarını getir
   */
  async getSatislar(): Promise<SalesRecord[]> {
    const data = await this.fetchData<any>('sales_records');
    return data.map(r => ({
      id: r.id, tarih: r.tarih, musteriAdi: r.musteri_adi, stokTuru: r.stok_turu,
      hammadde_turu: r.hammadde_turu, mamul_turu: r.mamul_turu, miktar: r.miktar,
      satisFiyati: r.satis_fiyati, nakliyeBedeli: r.nakliye_bedeli, notlar: r.notlar
    }));
  },

  /**
   * İş Planlarını Getir
   */
  async getPlans(): Promise<Partial<BusinessPlan>[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase
      .from('business_plans')
      .select('*')
      .or(`user_id.eq.${session.user.id},shared_with.cs.{${session.user.id}}`);

    if (error) throw error;

    return (data || []).map(r => ({
      ...r.data,
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      year: r.year,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
  },

  // --- Kayıt Ekleme ve Güncelleme ---

  async insertData(table: string, payload: any) {
    const { data: { session } } = await supabase.auth.getSession();
    const p = {
      ...payload,
      user_id: session?.user?.id || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from(table).insert([p]).select();
    if (error) throw error;
    return data?.[0];
  },

  async updateData(table: string, id: string, payload: any) {
    const p = { ...payload, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from(table).update(p).eq('id', id).select();
    if (error) throw error;
    return data?.[0];
  },

  async deleteData(table: string, id: string) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  /**
   * Plan Kaydet (Insert or Update)
   */
  async savePlan(planData: any) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const payload = {
      user_id: session?.user?.id,
      plan_type: planData.plan_type || (planData.ayVerileri ? 'detailed' : 'fast'),
      status: planData.status || 'pending',
      title: planData.baslik || planData.title || 'Adsız Plan',
      year: planData.year || new Date().getFullYear(),
      data: planData,
      updated_at: new Date().toISOString()
    };

    if (planData.id && planData.id.length > 30) {
      const { data, error } = await supabase.from('business_plans').update(payload).eq('id', planData.id).select();
      if (error) throw error;
      const r = data?.[0];
      return r ? { ...r.data, id: r.id, status: r.status } : null;
    } else {
      delete planData.id;
      const { data, error } = await supabase.from('business_plans').insert([{ ...payload, created_at: new Date().toISOString() }]).select();
      if (error) throw error;
      const r = data?.[0];
      return r ? { ...r.data, id: r.id, status: r.status } : null;
    }
  },

  // ... Diğer özel kayıt metodları (savePerson, saveAttendance vb.) ihtiyaç duyuldukça buraya eklenecek
};

// Global erişim (Legacy desteği)
if (typeof window !== 'undefined') {
  (window as any).DataService = DataService;
}
