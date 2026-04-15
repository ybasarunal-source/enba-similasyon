/**
 * Supabase İstemcisi
 * Veritabanı ve Auth işlemleri için global erişim noktası
 */

// Supabase projenizden aldğınız bilgiler
// Canlı ortamda (Vercel vb.) bu değerler ortam değişkenlerinden (Environment Variables) alınır
const SUPABASE_URL = (window.process?.env?.SUPABASE_URL) || 'https://wmkfrzfatvxzpyahkdai.supabase.co';
const SUPABASE_ANON_KEY = (window.process?.env?.SUPABASE_ANON_KEY) || 'sb_publishable_H3QZ8w1SForuOFFsJzYwVQ_RFtjNu6L';

// Supabase JS SDK'sının yüklü olduğundan emin olalım
if (!window.supabase) {
    console.error("Supabase kütüphanesi yüklenemedi. Lütfen index.html'i kontrol edin.");
}

// İstemciyi oluştur
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global erişim için window nesnesine ekle
window.supabaseClient = supabaseClient;
