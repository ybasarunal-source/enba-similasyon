const CLIENT_ID = import.meta.env.VITE_PARASUT_CLIENT_ID as string;
const CLIENT_SECRET = import.meta.env.VITE_PARASUT_CLIENT_SECRET as string;

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
  type: 'sales_invoices' | 'purchase_bills';
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

function saveToken(raw: any): StoredToken {
  const data: StoredToken = {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    expires_at: Date.now() + (raw.expires_in - 120) * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
  return data;
}

function loadToken(): StoredToken | null {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null'); }
  catch { return null; }
}

export const parasutService = {
  isLoggedIn(): boolean {
    return loadToken() !== null;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(COMPANY_KEY);
  },

  saveCompany(company: ParasutCompany): void {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(company));
  },

  getCompany(): ParasutCompany | null {
    try { return JSON.parse(localStorage.getItem(COMPANY_KEY) || 'null'); }
    catch { return null; }
  },

  async login(username: string, password: string): Promise<void> {
    const resp = await fetch(OAUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        username,
        password,
        redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      let errMsg = `HTTP ${resp.status}`;
      try {
        const j = JSON.parse(text);
        errMsg = j.error_description || j.error || j.message || errMsg;
      } catch { if (text) errMsg += ': ' + text.slice(0, 120); }
      console.error('Paraşüt login error:', resp.status, text);
      throw new Error(errMsg);
    }
    saveToken(await resp.json());
  },

  async getToken(): Promise<string | null> {
    const saved = loadToken();
    if (!saved) return null;
    if (Date.now() < saved.expires_at) return saved.access_token;
    // Token expired — refresh
    try {
      const resp = await fetch(OAUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: saved.refresh_token,
        }),
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
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (resp.status === 401) { this.logout(); throw new Error('SESSION_EXPIRED'); }
    if (!resp.ok) throw new Error(`API hatası: ${resp.status}`);
    return resp.json();
  },

  async getMe(): Promise<any> {
    return this.request('/me');
  },

  async getSalesInvoices(companyId: string, dateFrom: string, dateTo: string): Promise<ParasutInvoice[]> {
    const raw = await this.request(`/${companyId}/sales_invoices`, {
      'page[size]': '100',
      'include': 'contact',
      'filter[issue_date][gte]': dateFrom,
      'filter[issue_date][lte]': dateTo,
      'sort': '-issue_date',
    });
    return this._mapInvoices(raw, 'sales_invoices');
  },

  async getPurchaseBills(companyId: string, dateFrom: string, dateTo: string): Promise<ParasutInvoice[]> {
    const raw = await this.request(`/${companyId}/purchase_bills`, {
      'page[size]': '100',
      'include': 'supplier',
      'filter[issue_date][gte]': dateFrom,
      'filter[issue_date][lte]': dateTo,
      'sort': '-issue_date',
    });
    return this._mapInvoices(raw, 'purchase_bills');
  },

  _mapInvoices(raw: any, type: 'sales_invoices' | 'purchase_bills'): ParasutInvoice[] {
    const included: any[] = raw.included || [];
    const findContact = (id: string) => {
      const c = included.find((i: any) => i.id === id && (i.type === 'contacts' || i.type === 'suppliers'));
      return c?.attributes?.name || c?.attributes?.email || '—';
    };
    return (raw.data || []).map((item: any) => {
      const a = item.attributes || {};
      const contactId =
        item.relationships?.contact?.data?.id ||
        item.relationships?.supplier?.data?.id;
      return {
        id: item.id,
        type,
        issue_date: a.issue_date || '',
        due_date: a.due_date || '',
        description: a.description || a.invoice_series || '—',
        contact_name: contactId ? findContact(contactId) : '—',
        net_total: parseFloat(a.net_total || '0'),
        gross_total: parseFloat(a.gross_total || a.total_gross || '0'),
        currency: a.currency || 'TRL',
        payment_status: a.payment_status || '',
        invoice_no: [a.invoice_series, a.invoice_id].filter(Boolean).join('-') || item.id,
      } as ParasutInvoice;
    });
  },
};
