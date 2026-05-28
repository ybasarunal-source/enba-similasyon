import { supabase } from './supabase';

export type FCTip = 'gelir' | 'gider';

export interface FoundingCashflow {
  id:         string;
  company_id: string;
  tarih:      string;
  tip:        FCTip;
  kategori:   string;
  tutar_tl:   number;
  aciklama:   string;
  created_at: string;
  updated_at: string;
}

export type FCForm = Omit<FoundingCashflow, 'id' | 'company_id' | 'created_at' | 'updated_at'>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFC(r: any): FoundingCashflow {
  return {
    id:         r.id,
    company_id: r.company_id,
    tarih:      r.tarih      ?? '',
    tip:        (r.tip       ?? 'gider') as FCTip,
    kategori:   r.kategori   ?? '',
    tutar_tl:   Number(r.tutar_tl ?? 0),
    aciklama:   r.aciklama   ?? '',
    created_at: r.created_at ?? '',
    updated_at: r.updated_at ?? '',
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
};
