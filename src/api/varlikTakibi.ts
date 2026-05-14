import { supabase } from './supabase';

export type AssetOperation = 'M' | 'K' | 'V';
export type DepositType = 'rent' | 'electricity' | 'water' | 'other';
export type DepositStatus = 'active' | 'returned';

export interface FixedAsset {
  id: string;
  company_id: string;
  name: string;
  category: string;
  operation: AssetOperation;
  purchase_date: string;
  purchase_amount_tl: number;
  exchange_rate: number;
  useful_life_years: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AssetDeposit {
  id: string;
  company_id: string;
  name: string;
  deposit_type: DepositType;
  operation: AssetOperation;
  payment_date: string;
  amount_tl: number;
  exchange_rate: number;
  expected_return_date: string | null;
  status: DepositStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export const fixedAssetsAPI = {
  async getAll(companyId: string): Promise<FixedAsset[]> {
    const { data, error } = await supabase
      .from('fixed_assets')
      .select('*')
      .eq('company_id', companyId)
      .order('purchase_date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as FixedAsset[];
  },

  async add(companyId: string, item: Omit<FixedAsset, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<FixedAsset> {
    const { data, error } = await supabase
      .from('fixed_assets')
      .insert({ ...item, company_id: companyId })
      .select()
      .single();
    if (error) throw error;
    return data as FixedAsset;
  },

  async update(id: string, patch: Partial<Omit<FixedAsset, 'id' | 'company_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const { error } = await supabase
      .from('fixed_assets')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('fixed_assets').delete().eq('id', id);
    if (error) throw error;
  },
};

export const assetDepositsAPI = {
  async getAll(companyId: string): Promise<AssetDeposit[]> {
    const { data, error } = await supabase
      .from('asset_deposits')
      .select('*')
      .eq('company_id', companyId)
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AssetDeposit[];
  },

  async add(companyId: string, item: Omit<AssetDeposit, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<AssetDeposit> {
    const { data, error } = await supabase
      .from('asset_deposits')
      .insert({ ...item, company_id: companyId })
      .select()
      .single();
    if (error) throw error;
    return data as AssetDeposit;
  },

  async update(id: string, patch: Partial<Omit<AssetDeposit, 'id' | 'company_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const { error } = await supabase
      .from('asset_deposits')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('asset_deposits').delete().eq('id', id);
    if (error) throw error;
  },
};

export function yearsElapsed(dateStr: string): number {
  return Math.max(0, (Date.now() - new Date(dateStr).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export function annualDepreciation(asset: FixedAsset): number {
  return asset.purchase_amount_tl / Math.max(1, asset.useful_life_years);
}

export function assetBookValue(asset: FixedAsset): number {
  const annual = annualDepreciation(asset);
  const accumulated = Math.min(annual * yearsElapsed(asset.purchase_date), asset.purchase_amount_tl);
  return Math.max(0, asset.purchase_amount_tl - accumulated);
}
