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
  motor_kw?:           number;         // ← assets.motor_gucu (sadece makina)
  kapasite_ton_saat?:  number;         // ← assets.kapasite (sadece makina)
  demirbas_no?:        string;         // ← assets.demirbas_no (sabit kodu, ör: MK-001)
  photos?:             string[];       // ← assets.photos (storage path listesi)
  sale_date?:          string;         // ← assets.satis_tarihi (dolu ise satılmış)
  sale_amount_tl?:     number;         // ← assets.satis_bedeli
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
    motor_kw:           r.motor_gucu  != null ? Number(r.motor_gucu)  : undefined,
    kapasite_ton_saat:  r.kapasite    != null ? Number(r.kapasite)    : undefined,
    demirbas_no:        r.demirbas_no  ? String(r.demirbas_no)  : undefined,
    photos:             Array.isArray(r.photos) ? (r.photos as string[]) : [],
    sale_date:          r.satis_tarihi ? String(r.satis_tarihi) : undefined,
    sale_amount_tl:     r.satis_bedeli != null ? Number(r.satis_bedeli) : undefined,
    notes:              r.notes         ?? '',
    created_at:         r.created_at    ?? '',
  };
}

// ── Kolon çevirisi: FixedAsset form → DB satırı ──────────────
export type FixedAssetForm = Omit<FixedAsset, 'id' | 'company_id' | 'created_at'>;

function formToRow(item: FixedAssetForm): Record<string, unknown> {
  return {
    adi:                item.name,
    kategori:           item.category || 'Diğer',
    tur:                item.tur ?? 'makina',
    operation:          item.operation,
    satinalma_tarihi:   item.purchase_date,
    yatirim_bedeli:     item.purchase_amount_tl,
    exchange_rate:      item.exchange_rate,
    useful_life_years:  item.useful_life_years,
    motor_gucu:         item.motor_kw          ?? null,
    kapasite:           item.kapasite_ton_saat ?? null,
    demirbas_no:        item.demirbas_no        ?? null,
    satis_tarihi:       item.sale_date          ?? null,
    satis_bedeli:       item.sale_amount_tl     ?? null,
    notes:              item.notes,
  };
}

const ASSET_SELECT =
  'id,company_id,adi,kategori,tur,operation,satinalma_tarihi,yatirim_bedeli,exchange_rate,useful_life_years,motor_gucu,kapasite,demirbas_no,photos,satis_tarihi,satis_bedeli,notes,created_at';

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
    if (patch.demirbas_no       !== undefined) row.demirbas_no       = patch.demirbas_no    ?? null;
    if (patch.sale_date         !== undefined) row.satis_tarihi      = patch.sale_date      ?? null;
    if (patch.sale_amount_tl    !== undefined) row.satis_bedeli      = patch.sale_amount_tl ?? null;

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
export function yearsElapsed(dateStr: string, untilDate?: string): number {
  const until = untilDate ? new Date(untilDate).getTime() : Date.now();
  return Math.max(0, (until - new Date(dateStr).getTime()) / (365.25 * 24 * 3600 * 1000));
}

/** Satılmış mı? sale_date dolu ise evet. */
export function isSold(asset: FixedAsset): boolean {
  return !!asset.sale_date;
}

/** Satılmış varlık için yıllık amortisman = 0; aktif için normal hesap. */
export function annualDepreciation(asset: FixedAsset): number {
  if (isSold(asset)) return 0;
  return asset.purchase_amount_tl / Math.max(1, asset.useful_life_years);
}

/** Satılmış varlık için defter değeri = 0 (aktiften çıkmış);
 *  aktif varlık için satın alma tarihinden bugüne birikmiş amortisman düşülür. */
export function assetBookValue(asset: FixedAsset): number {
  if (isSold(asset)) return 0;
  const annual = asset.purchase_amount_tl / Math.max(1, asset.useful_life_years);
  const accumulated = Math.min(annual * yearsElapsed(asset.purchase_date), asset.purchase_amount_tl);
  return Math.max(0, asset.purchase_amount_tl - accumulated);
}

/** Satış anındaki defter değeri (kazanç/kayıp hesabı için). */
export function bookValueAtSale(asset: FixedAsset): number {
  if (!asset.sale_date) return assetBookValue(asset);
  const annual = asset.purchase_amount_tl / Math.max(1, asset.useful_life_years);
  const accumulated = Math.min(annual * yearsElapsed(asset.purchase_date, asset.sale_date), asset.purchase_amount_tl);
  return Math.max(0, asset.purchase_amount_tl - accumulated);
}

// ── Fotoğraf API (asset-photos bucket) ───────────────────────
const PHOTO_BUCKET = 'asset-photos';

export const assetPhotosAPI = {
  /** Storage path → tam public URL */
  getUrl(path: string): string {
    const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  /** Dosyayı yükle, DB'deki photos dizisini güncelle → storage path döner */
  async upload(assetId: string, companyId: string, file: File): Promise<string> {
    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${companyId}/${assetId}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, { upsert: false });
    if (uploadErr) throw uploadErr;

    // Mevcut photos dizisini çek, yeni path'i ekle
    const { data: row, error: fetchErr } = await supabase
      .from('assets').select('photos').eq('id', assetId).single();
    if (fetchErr) { await supabase.storage.from(PHOTO_BUCKET).remove([path]); throw fetchErr; }

    const existing: string[] = Array.isArray(row?.photos) ? (row.photos as string[]) : [];
    const { error: updateErr } = await supabase
      .from('assets').update({ photos: [...existing, path] }).eq('id', assetId);
    if (updateErr) { await supabase.storage.from(PHOTO_BUCKET).remove([path]); throw updateErr; }

    return path;
  },

  /** Fotoğrafı storage'dan sil, DB dizisinden çıkar → güncel dizi döner */
  async remove(assetId: string, currentPhotos: string[], pathToRemove: string): Promise<string[]> {
    await supabase.storage.from(PHOTO_BUCKET).remove([pathToRemove]);
    const next = currentPhotos.filter(p => p !== pathToRemove);
    await supabase.from('assets').update({ photos: next }).eq('id', assetId);
    return next;
  },
};

// ── Harcama tipleri ───────────────────────────────────────────
export type ExpenditureType = 'kapex' | 'bakim';

export interface AssetExpenditure {
  id:         string;
  company_id: string;
  asset_id:   string;
  tarih:      string;
  tutar:      number;
  aciklama:   string;
  tur:        ExpenditureType;  // 'kapex' = maliyete eklenir | 'bakim' = gider
  created_at: string;
}

export type AssetExpenditureForm = Omit<AssetExpenditure, 'id' | 'company_id' | 'asset_id' | 'created_at'>;

// ── Harcama API ───────────────────────────────────────────────
export const assetExpendituresAPI = {
  async getAll(companyId: string, assetId: string): Promise<AssetExpenditure[]> {
    const { data, error } = await supabase
      .from('asset_expenditures')
      .select('*')
      .eq('company_id', companyId)
      .eq('asset_id', assetId)
      .order('tarih', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AssetExpenditure[];
  },

  async add(companyId: string, assetId: string, form: AssetExpenditureForm): Promise<AssetExpenditure> {
    const { data, error } = await supabase
      .from('asset_expenditures')
      .insert({ ...form, company_id: companyId, asset_id: assetId })
      .select()
      .single();
    if (error) throw error;
    return data as AssetExpenditure;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('asset_expenditures').delete().eq('id', id);
    if (error) throw error;
  },
};
