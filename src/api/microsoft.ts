import { PublicClientApplication, Configuration, RedirectRequest, PopupRequest, AccountInfo } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';

/**
 * Microsoft Authentication & Graph API Service
 * v2.0 - Robust Persistence & Sync Edition
 */

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
};

let msalInstance: PublicClientApplication | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;
let lastInteractionTime = 0;

const clearAllMsalStorage = () => {
  try {
    const storages = [window.sessionStorage, window.localStorage];
    storages.forEach(storage => {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && (key.includes('msal.') || key.includes('login.microsoft'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => storage.removeItem(key));
    });
    console.log('MSAL: Global storage cleanup completed.');
  } catch (e) {
    console.error('MSAL: Error during storage cleanup:', e);
  }
};

const ensureInitialized = async () => {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }

  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!msalInstance) return;
      await msalInstance.initialize();
      
      try {
        await msalInstance.handleRedirectPromise();
      } catch (redirectErr: any) {
        // Ignore "no_token_request_cache_error" as it's common in popup-only flows
        if (redirectErr.errorCode !== 'no_token_request_cache_error') {
          console.warn('MSAL: Redirect error during init:', redirectErr);
        }
      }
      
      // Auto-set active account if exactly one account is present
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
        msalInstance.setActiveAccount(accounts[0]);
      }
      
      isInitialized = true;
    } catch (err) {
      console.warn('MSAL: Initialization failed:', err);
      initPromise = null;
    }
  })();

  return initPromise;
};

const checkAndLockInteraction = () => {
  const now = Date.now();
  if (lastInteractionTime > 0 && (now - lastInteractionTime) < 5000) return false;
  lastInteractionTime = now;
  return true;
};

const unlockInteraction = () => {
  lastInteractionTime = 0;
};

const loginRequest: PopupRequest = {
  scopes: ['User.Read', 'Tasks.ReadWrite'],
};

export const microsoftService = {
  async loginPopup() {
    if (!checkAndLockInteraction()) return null;
    try {
      await ensureInitialized();
      if (!msalInstance) return null;
      
      const result = await msalInstance.loginPopup(loginRequest);
      if (result.account) {
        msalInstance.setActiveAccount(result.account);
        return result.account;
      }
      return null;
    } catch (err: any) {
      if (err.errorCode === 'interaction_in_progress') {
        alert('Şu an bir giriş penceresi zaten açık. Lütfen tarayıcınızdaki diğer pencereleri kontrol edin.');
      } else if (err.errorCode === 'timed_out') {
        alert('Giriş işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.');
      } else {
        console.error('MS Popup Login Error:', err);
      }
      return null;
    } finally {
      unlockInteraction();
    }
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
    } catch (err) {
      return null;
    }
  },

  async getToken() {
    try {
      await ensureInitialized();
      const account = await this.getAccount();
      if (!account || !msalInstance) return null;
      
      const response = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: account,
      });
      return response.accessToken;
    } catch (err) {
      console.warn('Silent token acquisition failed, re-auth might be needed.', err);
      return null;
    }
  },

  async getGraphClient() {
    const token = await this.getToken();
    if (!token) return null;
    return Client.init({
      authProvider: (done) => done(null, token),
    });
  },

  // ── To Do Operations ──────────────────────────────────────

  async getTodoLists() {
    const client = await this.getGraphClient();
    if (!client) return [];
    try {
      const response = await client.api('/me/todo/lists').get();
      return response.value;
    } catch (err) {
      return [];
    }
  },

  async ensureTodoList(name: string) {
    const client = await this.getGraphClient();
    if (!client) return null;
    try {
      const lists = await this.getTodoLists();
      let list = lists.find((l: any) => l.displayName.toLowerCase() === name.toLowerCase());
      if (!list) {
        list = await client.api('/me/todo/lists').post({ displayName: name });
      }
      return list;
    } catch (err) {
      return null;
    }
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
    try {
      await client.api(`/me/todo/lists/${listId}/tasks/${msId}`).delete();
    } catch (err) {}
  },

  async getTodoListTasks(listId: string) {
    const client = await this.getGraphClient();
    if (!client) return [];
    try {
      const response = await client.api(`/me/todo/lists/${listId}/tasks`)
        .header('Cache-Control', 'no-cache')
        .get();
      return response.value;
    } catch (err) {
      return [];
    }
  },

  async logout() {
    try {
      await ensureInitialized();
      clearAllMsalStorage();
      if (msalInstance) {
        await msalInstance.logoutRedirect();
      }
    } catch (err) {
      console.error('MS Logout Error:', err);
    }
  }
};

// Expose to window for legacy modules
if (typeof window !== 'undefined') {
  (window as any).microsoftService = microsoftService;
  // Note: We no longer expose msalInstance directly to prevent reference drift
}
