import { supabase } from './supabase';

const OAUTH_URL = '/api/parasut-oauth';
const API_BASE = '/api/parasut-data';

const TOKEN_KEY = 'enba_parasut_token';
const COMPANY_KEY = 'enba_parasut_company';

interface StoredToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface ParasutCompany {
  id: string;
  name: string;
}

export interface ParasutInvoice {
  id: string;
  type: 'sales_invoices' | 'purchase_bills' | 'expenditures';
  category_name?: string;
  issue_date: string;
  due_date: string;
  description: string;
  contact_name: string;
  net_total: number;
  gross_total: number;
  currency: string;
  payment_status: string;
  invoice_no: string;
}

export interface ParasutItem {
  id: string;
  name: string;
  code: string;
  stock_count: number;
  unit: string;
  list_price: number;
  currency: string;
  category_name?: string;
}

// In-memory cache so localStorage failures don't break the session
let _memToken: StoredToken | null = null;
let _companyId: string | null = null;
// super_admin için hedef şirket override — null ise saveToken kendi profile'dan çeker
let _targetCompanyId: string | null = null;

function saveToken(raw: any): StoredToken {
  const data: StoredToken = {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    expires_at: Date.now() + (raw.expires_in - 120) * 1000,
  };
  _memToken = data;
  try { localStorage.setItem(TOKEN_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  // Supabase'e kaydet — super_admin için _targetCompanyId, diğerleri için auth'tan çek
  (async () => {
    try {
      let useCid = _targetCompanyId;
      if (!useCid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .maybeSingle();
        if (!profile?.company_id) return;
        useCid = profile.company_id;
      }
      _companyId = useCid;
      // saveCompany localStorage'ı senkron set eder, buraya gelindiğinde hazırdır
      const savedComp = (() => { try { return JSON.parse(localStorage.getItem(COMPANY_KEY) || 'null'); } catch { return null; } })();
      const { error } = await supabase.from('parasut_tokens').upsert({
        company_id: useCid,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        ...(savedComp ? { parasut_company_data: savedComp } : {}),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id' });
      if (error) console.error('[parasut] upsert error:', error.message);
    } catch (e) { console.error('[parasut] saveToken exception:', e); }
  })();
  return data;
}

function loadToken(): StoredToken | null {
  if (_memToken) return _memToken;
  try {
    const t = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
    if (t) _memToken = t;
    return t;
  } catch { return null; }
}

export const parasutService = {
  isLoggedIn(): boolean {
    return loadToken() !== null;
  },

  // Supabase'den token yükle — login sonrası çağrılır, localStorage fallback'ten önce gelir
  async loadTokenFromSupabase(companyId: string): Promise<boolean> {
    _companyId = companyId;
    try {
      const { data, error } = await supabase
        .from('parasut_tokens')
        .select('access_token, refresh_token, expires_at, parasut_company_data')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error || !data) { return false; }
      _memToken = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
      };
      try { localStorage.setItem(TOKEN_KEY, JSON.stringify(_memToken)); } catch { /* ignore */ }
      if (data.parasut_company_data) {
        try { localStorage.setItem(COMPANY_KEY, JSON.stringify(data.parasut_company_data)); } catch { /* ignore */ }
      }
      return true;
    } catch { return false; }
  },

  // Profil verilerinden oturumu geri yükle (localStorage fallback)
  resumeSession(profile: any) {
    if (profile.company_id) _companyId = profile.company_id;
    if (profile.parasut_data?.token) {
      _memToken = profile.parasut_data.token;
      try { localStorage.setItem(TOKEN_KEY, JSON.stringify(_memToken)); } catch { /* ignore */ }
    } else {
      this.clearSession();
    }
    if (profile.parasut_data?.company) {
      try { localStorage.setItem(COMPANY_KEY, JSON.stringify(profile.parasut_data.company)); } catch { /* ignore */ }
    } else {
      try { localStorage.removeItem(COMPANY_KEY); } catch { /* ignore */ }
    }
  },

  // Sadece bellek ve localStorage temizle — Supabase'e dokunma.
  // Enba oturumu kapanırken çağrılır; Paraşüt token'ı Supabase'de kalır.
  clearSession(): void {
    _memToken = null;
    _targetCompanyId = null;
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(COMPANY_KEY); } catch { /* ignore */ }
  },

  // Tam bağlantı kesme: bellek + localStorage + Supabase satırını sil.
  // Kullanıcı Paraşüt'ten "bağlantıyı kes" butonuna bastığında çağrılır.
  logout(): void {
    _memToken = null;
    _targetCompanyId = null;
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(COMPANY_KEY); } catch { /* ignore */ }
    const cid = _companyId;
    if (cid) {
      supabase.from('parasut_tokens').delete().eq('company_id', cid).then(() => {});
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle()
          .then(({ data: p }) => {
            if (p?.company_id) supabase.from('parasut_tokens').delete().eq('company_id', p.company_id).then(() => {});
          });
      });
    }
  },

  saveCompany(company: ParasutCompany): void {
    try { localStorage.setItem(COMPANY_KEY, JSON.stringify(company)); } catch { /* ignore */ }
    (async () => {
      try {
        const cid = _targetCompanyId || _companyId || await (async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return null;
          const { data: p } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle();
          if (p?.company_id) _companyId = p.company_id;
          return p?.company_id ?? null;
        })();
        if (!cid) return;
        const { error } = await supabase.from('parasut_tokens').update({
          parasut_company_data: company,
          updated_at: new Date().toISOString(),
        }).eq('company_id', cid);
        if (error) console.warn('Paraşüt şirket Supabase kayıt hatası:', error.message);
      } catch { /* ignore */ }
    })();
  },

  // super_admin için hedef şirket override — login/saveCompany bu company_id'ye yazar
  setTargetCompanyId(id: string | null): void {
    _targetCompanyId = id;
    if (id) _companyId = id;
  },

  getCompany(): ParasutCompany | null {
    try { return JSON.parse(localStorage.getItem(COMPANY_KEY) || 'null'); }
    catch { return null; }
  },

  async login(username: string, password: string): Promise<void> {
    const resp = await fetch(OAUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'password', username, password }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      let data: any = {};
      try { data = JSON.parse(text); } catch { /* ignore */ }
      
      const errMsg = data.error_description || data.error || data.message || `HTTP ${resp.status}: ${text.slice(0, 200)}`;
      
      // Attach the full data to the error so the UI can use it
      const error = new Error(errMsg);
      (error as any).data = data;
      throw error;
    }
    saveToken(await resp.json());
  },

  async getToken(): Promise<string | null> {
    const saved = loadToken();
    if (!saved) return null;
    if (Date.now() < saved.expires_at) return saved.access_token;
    try {
      const resp = await fetch(OAUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: saved.refresh_token }),
      });
      if (!resp.ok) { this.logout(); return null; }
      return saveToken(await resp.json()).access_token;
    } catch { this.logout(); return null; }
  },

  async _sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  async request(path: string, params: Record<string, string> = {}, retryCount = 0): Promise<any> {
    const token = await this.getToken();
    if (!token) throw new Error('SESSION_EXPIRED');
    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.set('path', `/v4${path}`);
    url.searchParams.set('_token', token);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    
    const resp = await fetch(url.toString());
    
    if (resp.status === 429 && retryCount < 3) {
      const wait = (retryCount + 1) * 3000; // 3s, 6s, 9s
      console.warn(`Rate limited (429). Retrying in ${wait/1000}s...`);
      await this._sleep(wait);
      return this.request(path, params, retryCount + 1);
    }

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      let parsed: any = {};
      try { parsed = JSON.parse(body); } catch { /* ignore */ }
      if (resp.status === 401) {
        this.logout();
        const detail = parsed.parasut_response || parsed.error || body.slice(0, 200);
        throw new Error(`401_UNAUTHORIZED: token_prefix=${parsed.token_prefix} token_len=${parsed.token_length} | ${detail}`);
      }
      throw new Error(`API hatası ${resp.status}: ${body.slice(0, 200)}`);
    }
    return resp.json();
  },

  async requestAll(path: string, params: Record<string, string> = {}): Promise<any> {
    let allData: any[] = [];
    let allIncluded: any[] = [];
    let page = 1;
    const pageSize = '25';

    while (page <= 200) { // Safety limit: max 5000 records (200 pages * 25)
      const resp = await this.request(path, { ...params, 'page[size]': pageSize, 'page[number]': String(page) });
      allData = [...allData, ...(resp.data || [])];
      allIncluded = [...allIncluded, ...(resp.included || [])];
      
      if (!resp.links?.next) break;
      page++;
    }

    return { data: allData, included: allIncluded };
  },

  async getSalesInvoices(companyId: string, dateFrom: string, dateTo: string): Promise<ParasutInvoice[]> {
    const raw = await this.requestAll(`/${companyId}/sales_invoices`, {
      'filter[issue_date][gteq]': dateFrom,
      'filter[issue_date][lteq]': dateTo,
      'sort': '-issue_date',
    });
    return this._mapInvoices(raw, 'sales_invoices');
  },

  async getPurchaseBills(companyId: string, dateFrom: string, dateTo: string): Promise<ParasutInvoice[]> {
    const raw = await this.requestAll(`/${companyId}/purchase_bills`, {
      'filter[issue_date][gteq]': dateFrom,
      'filter[issue_date][lteq]': dateTo,
      'sort': '-issue_date',
    });
    return this._mapInvoices(raw, 'purchase_bills');
  },

  async getExpenditures(companyId: string, dateFrom: string, dateTo: string): Promise<ParasutInvoice[]> {
    const raw = await this.requestAll(`/${companyId}/expenditures`, {
      'filter[issue_date][gteq]': dateFrom,
      'filter[issue_date][lteq]': dateTo,
      'sort': '-issue_date',
    });
    return this._mapInvoices(raw, 'expenditures');
  },

  async getSalaries(companyId: string, dateFrom: string, dateTo: string): Promise<ParasutInvoice[]> {
    const raw = await this.requestAll(`/${companyId}/salaries`, {
      'filter[issue_date][gteq]': dateFrom,
      'filter[issue_date][lteq]': dateTo,
      'sort': '-issue_date',
    });
    return this._mapInvoices(raw, 'expenditures'); // Salaries are also expenses
  },

  async getTaxes(companyId: string, dateFrom: string, dateTo: string): Promise<ParasutInvoice[]> {
    const raw = await this.requestAll(`/${companyId}/taxes`, {
      'filter[issue_date][gteq]': dateFrom,
      'filter[issue_date][lteq]': dateTo,
      'sort': '-issue_date',
    });
    return this._mapInvoices(raw, 'expenditures'); // Taxes are expenses
  },

  async getItems(companyId: string): Promise<ParasutItem[]> {
    const raw = await this.requestAll(`/${companyId}/items`, {
      'sort': 'name',
    });
    return this._mapItems(raw);
  },

  _mapInvoices(raw: any, type: 'sales_invoices' | 'purchase_bills' | 'expenditures'): ParasutInvoice[] {
    const included: any[] = raw.included || [];
    const findContact = (id: string) => {
      const c = included.find((i: any) => i.id === id && (i.type === 'contacts' || i.type === 'suppliers' || i.type === 'employees'));
      return c?.attributes?.name || c?.attributes?.email || '—';
    };
    const findCategory = (id: string) => {
      const c = included.find((i: any) => i.id === id && i.type === 'item_categories');
      if (!c) return '';
      const ct: string = c.attributes?.category_type?.toLowerCase() || '';
      if (ct.includes('contact') || ct.includes('employee') || ct.includes('item')) return '';
      return c.attributes?.name || '';
    };
    return (raw.data || []).filter((item: any) => item.attributes?.status !== 'cancelled' && item.attributes?.status !== 'void').map((item: any) => {
      const a = item.attributes || {};
      const itemType = item.type;
      const contactId =
        item.relationships?.contact?.data?.id ||
        item.relationships?.supplier?.data?.id ||
        item.relationships?.employee?.data?.id;
      const categoryId = item.relationships?.category?.data?.id;
      
      let catName = categoryId ? findCategory(categoryId) : '';
      
      if (!catName) {
        if (itemType === 'sales_invoices') catName = '600 Genel Satış Gelirleri';
        else if (itemType === 'purchase_bills') catName = '150 Genel Alış Maliyetleri';
        else if (itemType === 'expenditures') catName = '770 Genel İşletme Giderleri';
        else if (itemType === 'salaries') catName = '770 Personel Maaş ve Giderleri';
        else if (itemType === 'taxes') catName = '770 Vergi ve Fonlar';
        else catName = 'Genel';
      }
      
      const rawNet = parseFloat(a.net_total || a.total_net || '0');
      const rawGross = parseFloat(a.gross_total || a.total_gross || a.total_amount || a.amount || '0');
      const trlRate = parseFloat(a.exchange_rate || '1');
      
      // Calculate TL amount
      // If the currency is not TRL, we should use total_trl or multiply by rate
      let netTL = rawNet;
      if (a.currency && a.currency !== 'TRL' && a.currency !== 'TRY') {
          if (a.total_trl) {
              // total_trl is gross. We need net_trl.
              const ratio = rawGross > 0 ? (rawNet / rawGross) : 1;
              netTL = parseFloat(a.total_trl) * ratio;
          } else {
              netTL = rawNet * trlRate;
          }
      } else {
          // It's already TL
          netTL = rawNet;
      }

      return {
        id: item.id,
        type,
        issue_date: a.issue_date || '',
        due_date: a.due_date || '',
        description: a.description || a.invoice_series || '—',
        contact_name: contactId ? findContact(contactId) : '—',
        category_name: catName,
        net_total: netTL > 0 ? netTL : rawGross * trlRate, 
        gross_total: rawGross * trlRate,
        currency: a.currency || 'TRL',
        payment_status: a.payment_status || '',
        invoice_no: [a.invoice_series, a.invoice_id].filter(Boolean).join('-') || item.id,
      } as ParasutInvoice;
    });
  },

  async requestWrite(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: any, retryCount = 0): Promise<any> {
    const token = await this.getToken();
    if (!token) throw new Error('SESSION_EXPIRED');
    const url = new URL('/api/parasut-data', window.location.origin);
    url.searchParams.set('path', `/v4${path}`);
    const resp = await fetch(url.toString(), {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (resp.status === 429 && retryCount < 4) {
      const wait = (retryCount + 1) * 4000; // 4s, 8s, 12s, 16s
      await this._sleep(wait);
      return this.requestWrite(path, method, body, retryCount + 1);
    }
    if (resp.status === 204 || (resp.status === 200 && resp.headers.get('content-length') === '0')) return null;
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Paraşüt yazma hatası ${resp.status}: ${text.slice(0, 300)}`);
    }
    return resp.json();
  },

  async getItemCategories(companyId: string): Promise<{ id: string; name: string; code: string }[]> {
    try {
      const raw = await this.requestAll(`/${companyId}/item_categories`);
      return (raw.data || [])
        .filter((cat: any) => {
          const ct: string = cat.attributes?.category_type?.toLowerCase() || '';
          return !ct.includes('contact') && !ct.includes('employee') && !ct.includes('item');
        })
        .map((cat: any) => ({
          id: cat.id,
          name: cat.attributes?.name || '',
          code: cat.attributes?.code || '',
        }));
    } catch { return []; }
  },

  async deleteItemCategory(companyId: string, categoryId: string): Promise<boolean> {
    try {
      await this.requestWrite(`/${companyId}/item_categories/${categoryId}`, 'DELETE');
      return true;
    } catch (err) {
      console.error('Kategori silme hatası:', err);
      return false;
    }
  },

  async patchCategoryName(companyId: string, categoryId: string, newName: string): Promise<boolean> {
    try {
      await this.requestWrite(`/${companyId}/item_categories/${categoryId}`, 'PATCH', {
        data: {
          id: categoryId,
          type: 'item_categories',
          attributes: { name: newName },
        },
      });
      return true;
    } catch (err) {
      console.error('Kategori güncelleme hatası:', err);
      return false;
    }
  },

  _mapItems(raw: any): ParasutItem[] {
    const included: any[] = raw.included || [];
    const findCategory = (id: string) => {
      const c = included.find((i: any) => i.id === id && i.type === 'item_categories');
      return c?.attributes?.name || '';
    };

    return (raw.data || []).map((item: any) => {
      const a = item.attributes || {};
      const categoryId = item.relationships?.category?.data?.id;

      return {
        id: item.id,
        name: a.name || '—',
        code: a.code || '',
        stock_count: parseFloat(a.stock_count || '0'),
        unit: a.unit || 'Adet',
        list_price: parseFloat(a.list_price || '0'),
        currency: a.currency || 'TRL',
        category_name: categoryId ? findCategory(categoryId) : '',
      } as ParasutItem;
    });
  },
};
