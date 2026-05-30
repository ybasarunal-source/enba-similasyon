import { supabase } from './supabase';

export type FCTip = 'gelir' | 'gider';

export interface FoundingCashflow {
  id:               string;
  company_id:       string;
  tarih:            string;
  tip:              FCTip;
  kategori:         string;
  tutar_tl:         number;
  aciklama:         string;
  parasut_id?:      string | null;
  source_account?:  string | null;
  transaction_type?: string | null;
  balance_after?:   number | null;  // işlem sonrası hesap bakiyesi (Paraşüt)
  created_at:       string;
  updated_at:       string;
}

export type FCForm = Omit<FoundingCashflow, 'id' | 'company_id' | 'created_at' | 'updated_at'>;

export interface FCImportRecord {
  tarih:            string;
  tip:              FCTip;
  kategori:         string;
  tutar_tl:         number;
  aciklama:         string;
  parasut_id:       string;
  source_account?:  string;
  transaction_type: string;
  balance_after?:   number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFC(r: any): FoundingCashflow {
  return {
    id:               r.id,
    company_id:       r.company_id,
    tarih:            r.tarih            ?? '',
    tip:              (r.tip             ?? 'gider') as FCTip,
    kategori:         r.kategori         ?? '',
    tutar_tl:         Number(r.tutar_tl  ?? 0),
    aciklama:         r.aciklama         ?? '',
    parasut_id:       r.parasut_id       ?? null,
    source_account:   r.source_account   ?? null,
    transaction_type: r.transaction_type ?? null,
    balance_after:    r.balance_after != null ? Number(r.balance_after) : null,
    created_at:       r.created_at       ?? '',
    updated_at:       r.updated_at       ?? '',
  };
}

export const kurulumNakitAPI = {
  async list(companyId: string): Promise<FoundingCashflow[]> {
    const PAGE = 1000;
    let all: FoundingCashflow[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('founding_cashflow')
        .select('*')
        .eq('company_id', companyId)
        .order('tarih', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      all = all.concat((data ?? []).map(rowToFC));
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }
    return all;
  },

  async batchImportWithProgress(
    companyId: string,
    records: FCImportRecord[],
    onProgress: (inserted: number) => void,
    chunkSize = 100,
  ): Promise<{ inserted: number; skipped: number }> {
    if (records.length === 0) return { inserted: 0, skipped: 0 };

    let existingRaw: { parasut_id: string | null }[] = [];
    let ep = 0;
    while (true) {
      const { data: pg } = await supabase
        .from('founding_cashflow')
        .select('parasut_id')
        .eq('company_id', companyId)
        .not('parasut_id', 'is', null)
        .range(ep, ep + 999);
      existingRaw = existingRaw.concat(pg ?? []);
      if (!pg || pg.length < 1000) break;
      ep += 1000;
    }

    const existingIds = new Set(existingRaw.map(r => r.parasut_id));
    const toInsert = records.filter(r => !existingIds.has(r.parasut_id));
    const skipped = records.length - toInsert.length;

    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize).map(r => ({ ...r, company_id: companyId }));
      const { error } = await supabase.from('founding_cashflow').insert(chunk);
      if (error && error.code !== '23505') throw new Error(error.message || error.details || JSON.stringify(error));
      inserted += chunk.length;
      onProgress(inserted);
    }

    return { inserted, skipped };
  },

  async clearAll(companyId: string): Promise<void> {
    const { error } = await supabase
      .from('founding_cashflow')
      .delete()
      .eq('company_id', companyId);
    if (error) throw error;
  },
};
