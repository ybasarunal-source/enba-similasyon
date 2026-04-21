import { PublicClientApplication, Configuration, AccountInfo } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';

const CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || 'e72321c9-1eaf-47b5-8722-17b32d50dd25';
const TENANT_ID = import.meta.env.VITE_MICROSOFT_TENANT_ID || '2f458dd6-7ed0-4621-8a41-4462a2d585c1';

const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback: () => {},
      piiLoggingEnabled: false,
    },
  },
};

const loginScopes = ['User.Read', 'Tasks.ReadWrite'];

let msalInstance: PublicClientApplication | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

const clearAllMsalStorage = () => {
  try {
    [window.sessionStorage, window.localStorage].forEach(storage => {
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && (k.includes('msal.') || k.includes('login.microsoft'))) keys.push(k);
      }
      keys.forEach(k => storage.removeItem(k));
    });
  } catch { /* ignore */ }
};

const ensureInitialized = async () => {
  if (!msalInstance) msalInstance = new PublicClientApplication(msalConfig);
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await msalInstance!.initialize();

      // Redirect flow geri dönüşünde auth code'u işle
      const result = await msalInstance!.handleRedirectPromise();
      if (result?.account) {
        msalInstance!.setActiveAccount(result.account);
      }

      const accounts = msalInstance!.getAllAccounts();
      if (accounts.length > 0 && !msalInstance!.getActiveAccount()) {
        msalInstance!.setActiveAccount(accounts[0]);
      }

      isInitialized = true;
    } catch (err) {
      console.warn('MSAL: Initialization failed:', err);
      initPromise = null;
    }
  })();

  return initPromise;
};

export const microsoftService = {
  async loginRedirect(): Promise<void> {
    await ensureInitialized();
    if (!msalInstance) throw new Error('MSAL başlatılamadı.');
    localStorage.setItem('msal_redirect_origin', 'tasks');
    await msalInstance.loginRedirect({ scopes: loginScopes });
  },

  // Kaydedilmiş Microsoft hesabıyla sessiz bağlantı dene (SSO cookies üzerinden)
  async trySilentLogin(accountHint: string): Promise<AccountInfo | null> {
    try {
      await ensureInitialized();
      if (!msalInstance) return null;
      const result = await msalInstance.ssoSilent({
        scopes: loginScopes,
        loginHint: accountHint,
      });
      if (result?.account) {
        msalInstance.setActiveAccount(result.account);
        return result.account;
      }
      return null;
    } catch {
      return null; // SSO mevcut değil, kullanıcı yeniden giriş yapmalı
    }
  },

  // Redirect geri dönüşünde account'u döndürür (handleRedirectPromise zaten ensureInitialized içinde çalışıyor)
  async getRedirectAccount(): Promise<AccountInfo | null> {
    await ensureInitialized();
    return msalInstance?.getActiveAccount() ?? null;
  },

  async getAccount(): Promise<AccountInfo | null> {
    try {
      await ensureInitialized();
      if (!msalInstance) return null;
      let account = msalInstance.getActiveAccount();
      if (!account) {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          account = accounts[0];
          msalInstance.setActiveAccount(account);
        }
      }
      return account;
    } catch {
      return null;
    }
  },

  async getToken(): Promise<string | null> {
    try {
      await ensureInitialized();
      const account = await this.getAccount();
      if (!account || !msalInstance) return null;
      const response = await msalInstance.acquireTokenSilent({ scopes: loginScopes, account });
      return response.accessToken;
    } catch {
      return null;
    }
  },

  async getGraphClient() {
    const token = await this.getToken();
    if (!token) return null;
    return Client.init({ authProvider: (done) => done(null, token) });
  },

  async getTodoLists() {
    const client = await this.getGraphClient();
    if (!client) return [];
    try {
      const response = await client.api('/me/todo/lists').get();
      return response.value;
    } catch { return []; }
  },

  async ensureTodoList(name: string) {
    const client = await this.getGraphClient();
    if (!client) return null;
    try {
      const lists = await this.getTodoLists();
      let list = lists.find((l: any) => l.displayName.toLowerCase() === name.toLowerCase());
      if (!list) list = await client.api('/me/todo/lists').post({ displayName: name });
      return list;
    } catch { return null; }
  },

  async syncTask(listId: string, task: { title: string; desc: string; deadline?: string; status: 'todo' | 'doing' | 'done' }, msId?: string) {
    const client = await this.getGraphClient();
    if (!client) return null;
    const todoTask = {
      title: task.title,
      body: { content: task.desc, contentType: 'text' },
      dueDateTime: task.deadline ? {
        dateTime: new Date(task.deadline).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      } : undefined,
      status: task.status === 'done' ? 'completed' : 'notStarted',
    };
    try {
      if (msId) return await client.api(`/me/todo/lists/${listId}/tasks/${msId}`).patch(todoTask);
      return await client.api(`/me/todo/lists/${listId}/tasks`).post(todoTask);
    } catch (err) {
      console.error('MS Sync Task Error:', err);
      return null;
    }
  },

  async deleteTask(listId: string, msId: string) {
    const client = await this.getGraphClient();
    if (!client) return;
    try { await client.api(`/me/todo/lists/${listId}/tasks/${msId}`).delete(); } catch { /* ignore */ }
  },

  async getTodoListTasks(listId: string) {
    const client = await this.getGraphClient();
    if (!client) throw new Error('Microsoft bağlantısı kurulamadı. Lütfen yeniden giriş yapın.');

    const allTasks: any[] = [];
    let nextUrl: string | null = `/me/todo/lists/${listId}/tasks?$top=500`;

    while (nextUrl) {
      const response: any = await client.api(nextUrl).header('Cache-Control', 'no-cache').get();
      allTasks.push(...(response.value || []));
      const next: string | undefined = response['@odata.nextLink'];
      nextUrl = next ? next.replace('https://graph.microsoft.com/v1.0', '') : null;
    }

    return allTasks;
  },

  async logout() {
    try {
      await ensureInitialized();
      clearAllMsalStorage();
      if (msalInstance) await msalInstance.logoutRedirect();
    } catch (err) {
      console.error('MS Logout Error:', err);
    }
  }
};

if (typeof window !== 'undefined') {
  (window as any).microsoftService = microsoftService;
}
