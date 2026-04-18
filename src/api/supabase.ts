import { createClient } from '@supabase/supabase-js';

/**
 * Supabase İstemcisi (TypeScript)
 * Veritabanı ve Auth işlemleri için modüler erişim noktası.
 * Değerler Vite environment variables (.env) üzerinden alınır.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wmkfrzfatvxzpyahkdai.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_H3QZ8w1SForuOFFsJzYwVQ_RFtjNu6L';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase bağlantı bilgileri eksik! Lütfen .env dosyasını kontrol edin.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
