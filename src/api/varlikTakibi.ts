// varlikTakibi.ts
// Sabit varlıklar (makina + demirbas) ve depozitolar
//
// ⚠️ migration_v28 sonrası fixed_assets tablosu kaldırıldı.
//    fixedAssetsAPI artık public.assets tablosunu kullanır;
//    kolon adı çevirisi bu dosyada (DB ← → TS) yapılır.
//    VarlikTakibi.tsx değişmedi.

import { supabase } from './supabase';

export type AssetOperation = 'M' | 'K' | 'V';
export type AssetTur       = 'makina' | 'demirbas';
export type DepositType    = 'rent' | 'electricity' | 'water' | 'other';
export type DepositStatus  = 'active' | 'returned';

// ── FixedAsset: VarlikTakibi bileşeninin gördüğü yapı ────────
// (DB kolon adları farklı — rowToFixedAsset / assetToRow eşler)
export interface FixedAsset {
  id:                  string;
  company_id:          string;
  name:                string;         // ← assets.adi
  category:            string;         // ← assets.kategori
  tur:                 AssetTur;       // ← assets.tur
  operation:           AssetOperation;
  purchase_date:       string;         // ← assets.satinalma_tarihi
  purchase_amount_tl:  number;         // ← assets.yatirim_bedeli
  exchange_rate:       number;
  useful_life_years:   number;
  notes:               string;
  created_at:          string;
}

export interface AssetDeposit {
  id:                   string;
  company_id:           string;
  name:                 string;
  deposit_type:         DepositType;
  operation:            AssetOperation;
  payment_date:         string;
  amount_tl:            number;
  exchange_rate:        number;
  expected_return_date: string | null;
  status:               DepositStatus;
  notes:                string;
  created_at:           string;
  updated_at:           string;
}

// ── Kolon çevirisi: DB satırı → FixedAsset ───────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFixedAsset(r: any): FixedAsset {
  return {
    id:                 r.id,
    company_id:         r.company_id,
    name:               r.adi           ?? '',
    category:           r.kategori      ?? '',
    tur:                (r.tur          ?? 'makina') as AssetTur,
    operation:          (r.operation    ?? 'M')      as AssetOperation,
    purchase_date:      r.satinalma_tarihi            ?? '',
    purchase_amount_tl: Number(r.yatirim_bedeli       ?? 0),
    exchange_rate:      Number(r.exchange_rate         ?? 40),
    useful_life_years:  Number(r.useful_life_years     ?? 10),
    notes:              r.notes         ?? '',
    created_at:         r.created_at    ?? '',
  };
}

// ── Kolon çevirisi: FixedAsset form → DB satırı ──────────────
type FixedAssetForm = Omit<FixedAsset, 'id' | 'company_id' | 'created_at'>;

function formToRow(item: FixedAssetForm): Record<string, unknown> {
  return {
    adi:               item.name,
    kategori:          item.category || 'Diğer',
    tur:               item.tur ?? 'makina',
    operation:         item.operation,
    satinalma_tarihi:  item.purchase_date,
    yatirim_bedeli:    item.purchase_amount_tl,
    exchange_rate:     item.exchange_rate,
    useful_life_years: item.useful_life_years,
    notes:             item.notes,
  };
}

const ASSET_SELECT =
  'id,company_id,adi,kategori,tur,operation,satinalma_tarihi,yatirim_bedeli,exchange_rate,useful_life_years,notes,created_at';

// ── fixedAssetsAPI — artık assets tablosuna yazıyor ───────────
export const fixedAssetsAPI = {
  async getAll(companyId: string): Promise<FixedAsset[]> {
    const { data, error } = await supabase
      .from('assets')
      .select(ASSET_SELECT)
      .eq('company_id', companyId)
      .in('tur', ['makina', 'demirbas'])
      .order('satinalma_tarihi', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToFixedAsset);
  },

  async add(companyId: string, item: FixedAssetForm): Promise<FixedAsset> {
    const { data, error } = await supabase
      .from('assets')
      .insert({ ...formToRow(item), company_id: companyId })
      .select(ASSET_SELECT)
      .single();
    if (error) throw error;
    return rowToFixedAsset(data);
  },

  async update(id: string, patch: Partial<FixedAssetForm>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (patch.name               !== undefined) row.adi               = patch.name;
    if (patch.category           !== undefined) row.kategori          = patch.category || 'Diğer';
    if (patch.tur                !== undefined) row.tur               = patch.tur;
    if (patch.operation          !== undefined) row.operation         = patch.operation;
    if (patch.purchase_date      !== undefined) row.satinalma_tarihi  = patch.purchase_date;
    if (patch.purchase_amount_tl !== undefined) row.yatirim_bedeli    = patch.purchase_amount_tl;
    if (patch.exchange_rate      !== undefined) row.exchange_rate     = patch.exchange_rate;
    if (patch.useful_life_years  !== undefined) row.useful_life_years = patch.useful_life_years;
    if (patch.notes              !== undefined) row.notes             = patch.notes;

    const { error } = await supabase.from('assets').update(row).eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── assetDepositsAPI — değişmedi ─────────────────────────────
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

// ── Yardımcı hesaplamalar ─────────────────────────────────────
export function yearsElapsed(dateStr: string): number {
  return Math.max(0, (Date.now() - new Date(dateStr).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export function annualDepreciation(asset: FixedAsset): number {
  return asset.purchase_amount_tl / Math.max(1, asset.useful_life_years);
}

export function assetBookValue(asset: FixedAsset): number {
  const annual      = annualDepreciation(asset);
  const accumulated = Math.min(annual * yearsElapsed(asset.purchase_date), asset.purchase_amount_tl);
  return Math.max(0, asset.purchase_amount_tl - accumulated);
}
