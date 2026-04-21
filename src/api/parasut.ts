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

// In-memory cache so localStorage failures don't break the session
let _memToken: StoredToken | null = null;

function saveToken(raw: any): StoredToken {
  const data: StoredToken = {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    expires_at: Date.now() + (raw.expires_in - 120) * 1000,
  };
  _memToken = data;
  try { localStorage.setItem(TOKEN_KEY, JSON.stringify(data)); } catch { /* ignore */ }
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

  logout(): void {
    _memToken = null;
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(COMPANY_KEY); } catch { /* ignore */ }
  },

  saveCompany(company: ParasutCompany): void {
    try { localStorage.setItem(COMPANY_KEY, JSON.stringify(company)); } catch { /* ignore */ }
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

  async request(path: string, params: Record<string, string> = {}): Promise<any> {
    const token = await this.getToken();
    if (!token) throw new Error('SESSION_EXPIRED');
    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.set('path', `/v4${path}`);
    url.searchParams.set('_token', token);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const resp = await fetch(url.toString());
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

  async getSalesInvoices(companyId: string, dateFrom: string, dateTo: string): Promise<ParasutInvoice[]> {
    const raw = await this.request(`/${companyId}/sales_invoices`, {
      'page[size]': '25',
      'include': 'contact,category',
      'filter[issue_date][gteq]': dateFrom,
      'filter[issue_date][lteq]': dateTo,
      'sort': '-issue_date',
    });
    return this._mapInvoices(raw, 'sales_invoices');
  },

  async getPurchaseBills(companyId: string, dateFrom: string, dateTo: string): Promise<ParasutInvoice[]> {
    const raw = await this.request(`/${companyId}/purchase_bills`, {
      'page[size]': '25',
      'include': 'supplier,category',
      'filter[issue_date][gteq]': dateFrom,
      'filter[issue_date][lteq]': dateTo,
      'sort': '-issue_date',
    });
    return this._mapInvoices(raw, 'purchase_bills');
  },

  async getExpenditures(companyId: string, dateFrom: string, dateTo: string): Promise<ParasutInvoice[]> {
    const raw = await this.request(`/${companyId}/expenditures`, {
      'page[size]': '25',
      'include': 'supplier,category',
      'filter[issue_date][gteq]': dateFrom,
      'filter[issue_date][lteq]': dateTo,
      'sort': '-issue_date',
    });
    return this._mapInvoices(raw, 'expenditures');
  },

  _mapInvoices(raw: any, type: 'sales_invoices' | 'purchase_bills' | 'expenditures'): ParasutInvoice[] {
    const included: any[] = raw.included || [];
    const findContact = (id: string) => {
      const c = included.find((i: any) => i.id === id && (i.type === 'contacts' || i.type === 'suppliers' || i.type === 'employees'));
      return c?.attributes?.name || c?.attributes?.email || '—';
    };
    const findCategory = (id: string) => {
      const c = included.find((i: any) => i.id === id && i.type === 'item_categories');
      return c?.attributes?.name || '';
    };
    return (raw.data || []).map((item: any) => {
      const a = item.attributes || {};
      const contactId =
        item.relationships?.contact?.data?.id ||
        item.relationships?.supplier?.data?.id ||
        item.relationships?.employee?.data?.id;
      const categoryId = item.relationships?.category?.data?.id;
      
      return {
        id: item.id,
        type,
        issue_date: a.issue_date || '',
        due_date: a.due_date || '',
        description: a.description || a.invoice_series || '—',
        contact_name: contactId ? findContact(contactId) : '—',
        category_name: categoryId ? findCategory(categoryId) : 'Genel',
        net_total: parseFloat(a.net_total || '0'),
        gross_total: parseFloat(a.gross_total || a.total_gross || '0'),
        currency: a.currency || 'TRL',
        payment_status: a.payment_status || '',
        invoice_no: [a.invoice_series, a.invoice_id].filter(Boolean).join('-') || item.id,
      } as ParasutInvoice;
    });
  },
};
