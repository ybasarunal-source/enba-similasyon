import { supabase } from './supabase';

export type FCTip = 'gelir' | 'gider';

export interface FoundingCashflow {
  id:          string;
  company_id:  string;
  tarih:       string;
  tip:         FCTip;
  kategori:    string;
  tutar_tl:    number;
  aciklama:    string;
  parasut_id?: string | null;
  created_at:  string;
  updated_at:  string;
}

export type FCForm = Omit<FoundingCashflow, 'id' | 'company_id' | 'created_at' | 'updated_at'>;

export interface FCImportRecord {
  tarih:      string;
  tip:        FCTip;
  kategori:   string;
  tutar_tl:   number;
  aciklama:   string;
  parasut_id: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFC(r: any): FoundingCashflow {
  return {
    id:          r.id,
    company_id:  r.company_id,
    tarih:       r.tarih       ?? '',
    tip:         (r.tip        ?? 'gider') as FCTip,
    kategori:    r.kategori    ?? '',
    tutar_tl:    Number(r.tutar_tl ?? 0),
    aciklama:    r.aciklama    ?? '',
    parasut_id:  r.parasut_id  ?? null,
    created_at:  r.created_at  ?? '',
    updated_at:  r.updated_at  ?? '',
  };
}

export const kurulumNakitAPI = {
  async list(companyId: string): Promise<FoundingCashflow[]> {
    const { data, error } = await supabase
      .from('founding_cashflow')
      .select('*')
      .eq('company_id', companyId)
      .order('tarih', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToFC);
  },

  async insert(companyId: string, form: FCForm): Promise<FoundingCashflow> {
    const { data, error } = await supabase
      .from('founding_cashflow')
      .insert({ ...form, company_id: companyId })
      .select()
      .single();
    if (error) throw error;
    return rowToFC(data);
  },

  async update(id: string, form: Partial<FCForm>): Promise<FoundingCashflow> {
    const { data, error } = await supabase
      .from('founding_cashflow')
      .update(form)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return rowToFC(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('founding_cashflow')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Paraşüt'ten toplu import — zaten var olanları atlar, 100'lük chunk'larla insert
  async batchImport(companyId: string, records: FCImportRecord[]): Promise<{ inserted: number; skipped: number }> {
    if (records.length === 0) return { inserted: 0, skipped: 0 };

    // Mevcut parasut_id'leri çek
    const { data: existing } = await supabase
      .from('founding_cashflow')
      .select('parasut_id')
      .eq('company_id', companyId)
      .not('parasut_id', 'is', null);

    const existingIds = new Set((existing ?? []).map((r: { parasut_id: string | null }) => r.parasut_id));
    const toInsert = records.filter(r => !existingIds.has(r.parasut_id));
    const skipped = records.length - toInsert.length;

    if (toInsert.length === 0) return { inserted: 0, skipped };

    // 100'lük chunk'larla insert (Supabase payload limiti için)
    const CHUNK = 100;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const chunk = toInsert.slice(i, i + CHUNK).map(r => ({ ...r, company_id: companyId }));
      const { error } = await supabase.from('founding_cashflow').insert(chunk);
      if (error) throw new Error(error.message || error.details || JSON.stringify(error));
    }

    return { inserted: toInsert.length, skipped };
  },
};
