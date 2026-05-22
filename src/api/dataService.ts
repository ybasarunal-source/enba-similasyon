import { supabase, profileAPI } from './supabase';

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

// ─── Paylaşımlı Cari Havuzu (Tedarikçi / Müşteri) ─────────────────────────────
// localStorage key: enba_contacts_v1
// Hem Stok modülü hem DetailedPlan Wizard bu kaynaktan okur / yazar.
// Paraşüt entegrasyonu gelince bu liste Paraşüt'ten beslenecek.
export interface SharedContact {
  id: string;
  name: string;
  type: 'supplier' | 'customer';
  phone?: string;
  email?: string;
  notes?: string;
}

export const SHARED_CONTACTS_KEY = 'enba_contacts_v1';

export const SharedContactsService = {
  getAll(): SharedContact[] {
    try { return JSON.parse(localStorage.getItem(SHARED_CONTACTS_KEY) || '[]'); }
    catch { return []; }
  },
  save(list: SharedContact[]): void {
    try { localStorage.setItem(SHARED_CONTACTS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  },
  add(c: Omit<SharedContact, 'id'>): SharedContact {
    const record: SharedContact = { ...c, id: crypto.randomUUID() };
    SharedContactsService.save([...SharedContactsService.getAll(), record]);
    return record;
  },
  update(c: SharedContact): void {
    SharedContactsService.save(SharedContactsService.getAll().map(x => x.id === c.id ? c : x));
  },
  /** Wizard'dan isim ile kayıt geldiğinde: yoksa ekle, varsa güncelleme. */
  upsertByName(name: string, type: 'supplier' | 'customer'): void {
    if (!name.trim()) return;
    const list = SharedContactsService.getAll();
    const exists = list.some(
      x => x.name.trim().toLowerCase() === name.trim().toLowerCase() && x.type === type,
    );
    if (!exists) SharedContactsService.save([...list, { id: crypto.randomUUID(), name: name.trim(), type }]);
  },
  remove(id: string): void {
    SharedContactsService.save(SharedContactsService.getAll().filter(x => x.id !== id));
  },
};

// ─── Stok Kalemleri (SKU / Ürün Kataloğu) ─────────────────────────────────────
// localStorage key: enba_stock_items_v1
export interface StockItem {
  id: string;
  code: string;      // örn. PET-001, HDPE-002
  name: string;
  unit: string;      // kg | ton | adet | m² | litre
  category: string;  // Hammadde | Mamul | Yardımcı | Ambalaj | Diğer
  defaultBuyPrice?: number;
  defaultSellPrice?: number;
  notes?: string;
}

export const STOCK_ITEMS_KEY = 'enba_stock_items_v1';

export const StockItemsService = {
  getAll(): StockItem[] {
    try { return JSON.parse(localStorage.getItem(STOCK_ITEMS_KEY) || '[]'); }
    catch { return []; }
  },
  save(list: StockItem[]): void {
    try { localStorage.setItem(STOCK_ITEMS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  },
  add(item: Omit<StockItem, 'id'>): StockItem {
    const record: StockItem = { ...item, id: crypto.randomUUID() };
    StockItemsService.save([...StockItemsService.getAll(), record]);
    return record;
  },
  update(item: StockItem): void {
    StockItemsService.save(StockItemsService.getAll().map(x => x.id === item.id ? item : x));
  },
  remove(id: string): void {
    StockItemsService.save(StockItemsService.getAll().filter(x => x.id !== id));
  },
};

export interface BusinessPlan {
  id?: string;
  user_id?: string;
  title: string;
  year: number;
  status: string;
  plan_type: 'fast' | 'detailed';
  data: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

// --- Supabase row shapes (snake_case) ---

interface StockRow {
  id: string; tarih: string; tedarikci_adi: string; hammadde_turu: string;
  brut_miktar: number; net_miktar: number; alis_fiyati: number;
  nakliye_bedeli: number; ym_fire?: number; nem_fire?: number;
  birim_maliyet?: number; notlar?: string;
}

interface SalesRow {
  id: string; tarih: string; musteri_adi: string; stok_turu: string;
  hammadde_turu?: string; mamul_turu?: string; miktar: number;
  satis_fiyati: number; nakliye_bedeli: number; notlar?: string;
}

// --- Mapping Helpers ---

function mapAlis(r: StockRow): StockRecord {
  return {
    id: r.id, tarih: r.tarih, tedarikciAdi: r.tedarikci_adi,
    hammaddeTuru: r.hammadde_turu, brutMiktar: Number(r.brut_miktar) || 0,
    netMiktar: Number(r.net_miktar) || 0, alisFiyati: Number(r.alis_fiyati) || 0,
    nakliyeBedeli: Number(r.nakliye_bedeli) || 0, ymFire: Number(r.ym_fire) || 0,
    nemFire: Number(r.nem_fire) || 0, birimMaliyet: Number(r.birim_maliyet) || 0,
    notlar: r.notlar,
  };
}

function mapSatis(r: SalesRow): SalesRecord {
  return {
    id: r.id, tarih: r.tarih, musteriAdi: r.musteri_adi, stokTuru: r.stok_turu,
    hammadde_turu: r.hammadde_turu, mamul_turu: r.mamul_turu,
    miktar: Number(r.miktar) || 0, satisFiyati: Number(r.satis_fiyati) || 0,
    nakliyeBedeli: Number(r.nakliye_bedeli) || 0, notlar: r.notlar,
  };
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

  async insertData(table: string, payload: Record<string, unknown>) {
    const { data: { session } } = await supabase.auth.getSession();
    const profile = await profileAPI.getMyProfile();
    const p: Record<string, unknown> = {
      ...payload,
      user_id: session?.user?.id || null,
      created_at: new Date().toISOString()
    };
    if (profile?.company_id) p.company_id = profile.company_id;

    const { data, error } = await supabase.from(table).insert([p]).select();
    if (error) throw error;
    return data?.[0];
  },

  async updateData(table: string, id: string, payload: Record<string, unknown>) {
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
  async savePlan(planData: Record<string, unknown>) {
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

    const planId = planData.id as string | undefined;
    if (planId && planId.length > 30) {
      const { data, error } = await supabase.from('business_plans').update(payload).eq('id', planId).select();
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

  // --- Stok: snake_case dönüşümlü typed metodlar ---

  async insertAlis(record: Omit<StockRecord, 'id'>): Promise<StockRecord> {
    const { data: { session } } = await supabase.auth.getSession();
    const profile = await profileAPI.getMyProfile();
    const payload: Record<string, unknown> = {
      tarih: record.tarih, tedarikci_adi: record.tedarikciAdi,
      hammadde_turu: record.hammaddeTuru, brut_miktar: record.brutMiktar,
      net_miktar: record.netMiktar, alis_fiyati: record.alisFiyati,
      nakliye_bedeli: record.nakliyeBedeli, ym_fire: record.ymFire ?? 0,
      nem_fire: record.nemFire ?? 0, birim_maliyet: record.birimMaliyet ?? 0,
      notlar: record.notlar ?? '', user_id: session?.user?.id || null,
      created_at: new Date().toISOString(),
    };
    if (profile?.company_id) payload.company_id = profile.company_id;
    const { data, error } = await supabase.from('stock_records').insert([payload]).select().single();
    if (error) throw error;
    return mapAlis(data as StockRow);
  },

  async updateAlis(id: string, record: Partial<StockRecord>): Promise<StockRecord> {
    const { data, error } = await supabase.from('stock_records').update({
      tarih: record.tarih, tedarikci_adi: record.tedarikciAdi,
      hammadde_turu: record.hammaddeTuru, brut_miktar: record.brutMiktar,
      net_miktar: record.netMiktar, alis_fiyati: record.alisFiyati,
      nakliye_bedeli: record.nakliyeBedeli, ym_fire: record.ymFire,
      nem_fire: record.nemFire, birim_maliyet: record.birimMaliyet, notlar: record.notlar,
    }).eq('id', id).select().single();
    if (error) throw error;
    return mapAlis(data as StockRow);
  },

  async insertSatis(record: Omit<SalesRecord, 'id'>): Promise<SalesRecord> {
    const { data: { session } } = await supabase.auth.getSession();
    const profile = await profileAPI.getMyProfile();
    const payload: Record<string, unknown> = {
      tarih: record.tarih, musteri_adi: record.musteriAdi, stok_turu: record.stokTuru,
      hammadde_turu: record.hammadde_turu ?? null, mamul_turu: record.mamul_turu ?? null,
      miktar: record.miktar, satis_fiyati: record.satisFiyati,
      nakliye_bedeli: record.nakliyeBedeli, notlar: record.notlar ?? '',
      user_id: session?.user?.id || null, created_at: new Date().toISOString(),
    };
    if (profile?.company_id) payload.company_id = profile.company_id;
    const { data, error } = await supabase.from('sales_records').insert([payload]).select().single();
    if (error) throw error;
    return mapSatis(data as SalesRow);
  },

  async updateSatis(id: string, record: Partial<SalesRecord>): Promise<SalesRecord> {
    const { data, error } = await supabase.from('sales_records').update({
      tarih: record.tarih, musteri_adi: record.musteriAdi, stok_turu: record.stokTuru,
      hammadde_turu: record.hammadde_turu, mamul_turu: record.mamul_turu,
      miktar: record.miktar, satis_fiyati: record.satisFiyati,
      nakliye_bedeli: record.nakliyeBedeli, notlar: record.notlar,
    }).eq('id', id).select().single();
    if (error) throw error;
    return mapSatis(data as SalesRow);
  },

  // --- Nakit Akışı Parametreleri ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async fetchCashflowParams(planId: string): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const profile = await profileAPI.getMyProfile();

    let query = supabase.from('cashflow_parameters').select('params').eq('plan_id', planId);
    if (profile?.company_id) {
      query = query.eq('company_id', profile.company_id);
    } else {
      query = query.eq('user_id', session.user.id);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data?.params ?? null;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveCashflowParams(planId: string, params: any): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const profile = await profileAPI.getMyProfile();

    const payload: Record<string, unknown> = {
      plan_id: planId,
      params,
      user_id: session.user.id,
      updated_at: new Date().toISOString(),
    };
    if (profile?.company_id) payload.company_id = profile.company_id;

    let delQuery = supabase.from('cashflow_parameters').delete().eq('plan_id', planId);
    if (profile?.company_id) {
      delQuery = delQuery.eq('company_id', profile.company_id);
    } else {
      delQuery = delQuery.eq('user_id', session.user.id);
    }
    await delQuery;

    await supabase.from('cashflow_parameters').insert([{ ...payload, created_at: new Date().toISOString() }]);
  },

  // --- Lojistik: snake_case dönüşümlü insert ---

  async insertLogistics(record: {
    tarih: string; aracPlaka: string; kullanici: string;
    baslangicKm: number; bitisKm: number; guzergah: string;
  }) {
    const { data: { session } } = await supabase.auth.getSession();
    const profile = await profileAPI.getMyProfile();
    const payload: Record<string, unknown> = {
      tarih: record.tarih, arac_plaka: record.aracPlaka, kullanici: record.kullanici,
      baslangic_km: record.baslangicKm, bitis_km: record.bitisKm,
      guzergah: record.guzergah, user_id: session?.user?.id || null,
      created_at: new Date().toISOString(),
    };
    if (profile?.company_id) payload.company_id = profile.company_id;
    const { data, error } = await supabase.from('logistics_records').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },
};

// Global erişim (Legacy desteği)
if (typeof window !== 'undefined') {
  (window as any).DataService = DataService;
}
