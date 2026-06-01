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
  is_reconciled?:   boolean | null; // Paraşüt banka mutabakatı: true=tik var, false=dengeleme kaydı
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
  is_reconciled?:   boolean;
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
    is_reconciled:    r.is_reconciled    ?? null,
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

  // Günlük bakiye tablosu
  async listDailyBalances(companyId: string): Promise<{ account_name: string; parasut_account_id: string | null; tarih: string; bakiye: number }[]> {
    const { data, error } = await supabase
      .from('account_daily_balance')
      .select('account_name, parasut_account_id, tarih, bakiye')
      .eq('company_id', companyId)
      .order('tarih', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(r => ({
      account_name:       r.account_name,
      parasut_account_id: r.parasut_account_id ?? null,
      tarih:              r.tarih,
      bakiye:             Number(r.bakiye),
    }));
  },

  // Paraşüt account_id'lerini account_name eşleşmesiyle backfill et (bir kez çalışır)
  async backfillDailyBalanceIds(
    companyId: string,
    accounts: { id: string; name: string }[],
  ): Promise<void> {
    for (const acc of accounts) {
      await supabase
        .from('account_daily_balance')
        .update({ parasut_account_id: acc.id })
        .eq('company_id', companyId)
        .eq('account_name', acc.name)
        .is('parasut_account_id', null);
    }
  },

  async upsertDailyBalances(
    companyId: string,
    rows: { account_name: string; parasut_account_id?: string; tarih: string; bakiye: number }[],
  ): Promise<number> {
    if (rows.length === 0) return 0;
    const records = rows.map(r => ({ company_id: companyId, ...r }));
    const { error } = await supabase
      .from('account_daily_balance')
      .upsert(records, { onConflict: 'company_id,account_name,tarih' });
    if (error) throw error;
    return records.length;
  },

  async deleteAccountWithBackup(
    companyId: string,
    accountName: string,
    userEmail: string,
  ): Promise<{ deletedRows: number; deletedBalances: number }> {
    // 1. Silinecek hareketleri çek
    const { data: toDelete, error: fetchErr } = await supabase
      .from('founding_cashflow')
      .select('*')
      .eq('company_id', companyId)
      .eq('source_account', accountName);
    if (fetchErr) throw fetchErr;

    // 2. Yedek tabloya kopyala
    if (toDelete && toDelete.length > 0) {
      const backupRows = toDelete.map(r => ({
        ...r,
        deleted_at: new Date().toISOString(),
        deleted_by_email: userEmail,
        deletion_reason: 'Kullanıcı isteğiyle silindi',
      }));
      const CHUNK = 200;
      for (let i = 0; i < backupRows.length; i += CHUNK) {
        const { error } = await supabase
          .from('founding_cashflow_deleted')
          .insert(backupRows.slice(i, i + CHUNK));
        if (error) throw error;
      }
    }

    // 3. Ana tablodan sil
    const { error: delErr } = await supabase
      .from('founding_cashflow')
      .delete()
      .eq('company_id', companyId)
      .eq('source_account', accountName);
    if (delErr) throw delErr;

    // 4. Günlük bakiye snapshots'larını sil
    const { data: balRows, error: balErr } = await supabase
      .from('account_daily_balance')
      .select('id')
      .eq('company_id', companyId)
      .eq('account_name', accountName);
    if (balErr) throw balErr;

    if (balRows && balRows.length > 0) {
      const { error: balDelErr } = await supabase
        .from('account_daily_balance')
        .delete()
        .eq('company_id', companyId)
        .eq('account_name', accountName);
      if (balDelErr) throw balDelErr;
    }

    return { deletedRows: toDelete?.length ?? 0, deletedBalances: balRows?.length ?? 0 };
  },

  async markExported(id: string, parasutId: string): Promise<void> {
    const { error } = await supabase
      .from('founding_cashflow')
      .update({ parasut_id: parasutId, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async clearAll(companyId: string): Promise<void> {
    const { error } = await supabase
      .from('founding_cashflow')
      .delete()
      .eq('company_id', companyId);
    if (error) throw error;
  },
};
