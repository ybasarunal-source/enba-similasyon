import { supabase } from './supabase';
import { MCODE_LIST } from './mcodeList';

export interface FinancialCategory {
  id: string;
  company_id: string;
  code: string;
  parent_code: string | null;
  name_tr: string;
  name_en: string | null;
  is_custom: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

let _cache: FinancialCategory[] | null = null;
let _cacheCompany: string | null = null;
let _cacheTime = 0;
const CACHE_TTL = 30_000;

export const financialCategoriesAPI = {
  clearCache() {
    _cache = null;
    _cacheTime = 0;
  },

  async getAll(companyId: string, force = false): Promise<FinancialCategory[]> {
    if (!force && _cache && _cacheCompany === companyId && Date.now() - _cacheTime < CACHE_TTL) {
      return _cache;
    }
    const { data, error } = await supabase
      .from('financial_categories')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order');
    if (error) throw error;
    _cache = data as FinancialCategory[];
    _cacheCompany = companyId;
    _cacheTime = Date.now();
    return _cache;
  },

  async seedIfEmpty(companyId: string): Promise<boolean> {
    const existing = await this.getAll(companyId);
    if (existing.length > 0) return false;

    const rows = MCODE_LIST.map((m, i) => ({
      company_id: companyId,
      code: m.code,
      parent_code: m.code.includes('.') ? m.code.split('.')[0] : null,
      name_tr: m.tr,
      name_en: m.en,
      is_custom: false,
      sort_order: i,
      is_active: true,
    }));

    const { error } = await supabase.from('financial_categories').insert(rows);
    // 23505 = unique_violation (race condition: another tab seeded first)
    if (error && error.code !== '23505') throw error;
    this.clearCache();
    return true;
  },

  async add(companyId: string, item: {
    code: string;
    parent_code: string | null;
    name_tr: string;
    name_en?: string;
    is_custom?: boolean;
    sort_order?: number;
  }): Promise<FinancialCategory> {
    const { data, error } = await supabase
      .from('financial_categories')
      .insert({
        company_id: companyId,
        code: item.code,
        parent_code: item.parent_code,
        name_tr: item.name_tr,
        name_en: item.name_en ?? null,
        is_custom: item.is_custom ?? true,
        sort_order: item.sort_order ?? 9999,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    this.clearCache();
    return data as FinancialCategory;
  },

  async update(id: string, patch: Partial<Pick<FinancialCategory, 'name_tr' | 'name_en' | 'is_active' | 'sort_order'>>): Promise<void> {
    const { error } = await supabase
      .from('financial_categories')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    this.clearCache();
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('financial_categories').delete().eq('id', id);
    if (error) throw error;
    this.clearCache();
  },

  nextCustomCode(categories: FinancialCategory[]): string {
    const nums = categories
      .filter(c => /^M9\d{2}$/.test(c.code) && c.is_custom)
      .map(c => parseInt(c.code.replace('M', ''), 10))
      .filter(n => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 949;
    return `M${max + 1}`;
  },

  nextChildCode(parentCode: string, categories: FinancialCategory[]): string {
    const children = categories.filter(c => c.parent_code === parentCode);
    const nums = children
      .map(c => {
        const parts = c.code.split('.');
        return parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `${parentCode}.${String(max + 1).padStart(2, '0')}`;
  },
};
