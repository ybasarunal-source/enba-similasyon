import { PublicClientApplication, Configuration, RedirectRequest, PopupRequest } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';

/**
 * Microsoft Authentication & Graph API Service
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
    // IMPORTANT: switched to sessionStorage to isolate interactions per tab
    cacheLocation: 'sessionStorage',
  },
};

// Instance managed by a factory to allow recreation
export let msalInstance = new PublicClientApplication(msalConfig);

let isInitialized = false;
let initPromise: Promise<void> | null = null;
let isInteractionInProgress = false;

/**
 * Wipes EVERY MSAL related key from the browser storage.
 */
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

/**
 * Re-creates the MSAL instance to reset internal memory state.
 */
const resetMsalInstance = () => {
    console.warn('MSAL: Resetting library instance to clear internal locks...');
    clearAllMsalStorage();
    msalInstance = new PublicClientApplication(msalConfig);
    isInitialized = false;
    initPromise = null;
    isInteractionInProgress = false;
};

const ensureInitialized = async (force = false) => {
  if (isInitialized && !force) return;
  
  if (!initPromise || force) {
    initPromise = (async () => {
      try {
        await Promise.race([
          msalInstance.initialize(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Init Timeout')), 3000))
        ]);
        
        // Handle redirect only if we are forced or if it's the first time
        await Promise.race([
          msalInstance.handleRedirectPromise(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redirect Timeout')), 2000))
        ]);
      } catch (err: any) {
        console.warn('MSAL: Initialization warning (usually safe to ignore):', err);
      } finally {
        isInitialized = true;
      }
    })();
  }
  
  return initPromise;
};

const loginRequest: PopupRequest = {
  scopes: ['User.Read', 'Tasks.ReadWrite'],
};

let lastInteractionTime = 0;

const checkAndLockInteraction = (force = false) => {
  const now = Date.now();
  if (!force && lastInteractionTime > 0 && (now - lastInteractionTime) < 10000) {
    return false;
  }
  lastInteractionTime = now;
  return true;
};

const unlockInteraction = () => {
  lastInteractionTime = 0;
};

export const microsoftService = {
  async login() {
    if (!checkAndLockInteraction()) return;
    try {
      await ensureInitialized();
      await msalInstance.loginRedirect(loginRequest as any);
    } catch (err: any) {
      console.error('MS Login Error:', err);
      resetMsalInstance();
    } finally {
      unlockInteraction();
    }
  },

  async loginPopup(): Promise<any> {
    // Save current state so we can return here after redirect
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('enba_return_module', 'tasks');
    }
    
    const canProceed = checkAndLockInteraction();
    if (!canProceed) {
      console.warn('MSAL: Interaction locked (safety clock).');
      return null;
    }
    
    try {
      await ensureInitialized();
      // Directly using redirect for maximum reliability as requested
      await msalInstance.loginRedirect(loginRequest as any);
      return null; // Page will unload
    } catch (err: any) {
      console.error('MS Redirect Login Error:', err);
      resetMsalInstance();
      return null;
    } finally {
      unlockInteraction();
    }
  },

  async getAccount() {
    try {
      ensureInitialized();
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) return accounts[0];
      return null;
    } catch (err) {
      return null;
    }
  },

  async getToken() {
    try {
      const account = await this.getAccount();
      if (!account) return null;
      await new Promise(r => setTimeout(r, 100));
      const response = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: account,
      });
      return response.accessToken;
    } catch (err) {
      console.warn('Silent token acquisition failed...', err);
      return null;
    }
  },

  async getGraphClient() {
    const token = await this.getToken();
    if (!token) return null;
    return Client.init({
      authProvider: (done) => {
        done(null, token);
      },
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
      const response = await client.api(`/me/todo/lists/${listId}/tasks`).get();
      return response.value;
    } catch (err) {
      return [];
    }
  },

  async logout() {
    if (!checkAndLockInteraction()) return;
    try {
      await ensureInitialized();
      await msalInstance.logoutRedirect();
    } catch (err) {
      resetMsalInstance();
    } finally {
      unlockInteraction();
    }
  }
};

// Expose to window for legacy modules
if (typeof window !== 'undefined') {
  (window as any).microsoftService = microsoftService;
  (window as any).msalInstance = msalInstance;
}
