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

const loginScopes = ['User.Read', 'Tasks.ReadWrite', 'Calendars.ReadWrite', 'Mail.ReadWrite', 'Mail.Send'];
const taskScopes = ['User.Read', 'Tasks.ReadWrite'];
const calendarScopes = ['User.Read', 'Calendars.ReadWrite'];
const mailScopes = ['User.Read', 'Mail.ReadWrite', 'Mail.Send'];

let msalInstance: PublicClientApplication | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

const clearAllMsalStorage = () => {
  try {
    [window.sessionStorage, window.localStorage].forEach(storage => {
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        // MSAL keys usually start with 'msal.' or contain 'login.microsoftonline'
        if (k && (
          k.includes('msal.') || 
          k.includes('login.microsoft') || 
          k.includes('cc633a27-') || // Often MSAL uses client IDs in keys
          k.includes('-login.windows.net')
        )) {
          keys.push(k);
        }
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
    // Her zaman hesap seçtir ki önceki profile ait hesap otomatik bağlanmasın
    await msalInstance.loginRedirect({ 
      scopes: loginScopes,
      prompt: 'select_account'
    });
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
      // Önemli: accounts[0] otomatik seçilmemeli, çünkü farklı bir profile ait olabilir.
      // resumeSession() zaten doğru hesabı setActiveAccount() ile set ediyor.
      return account;
    } catch {
      return null;
    }
  },

  async getToken(scopes = taskScopes): Promise<string | null> {
    try {
      await ensureInitialized();
      const account = await this.getAccount();
      if (!account || !msalInstance) return null;
      const response = await msalInstance.acquireTokenSilent({ scopes, account });
      return response.accessToken;
    } catch {
      return null;
    }
  },

  async getGraphClient(scopes = taskScopes) {
    const token = await this.getToken(scopes);
    if (!token) return null;
    return Client.init({ authProvider: (done) => done(null, token) });
  },

  // Profil verilerinden oturumu geri yükle
  async resumeSession(profile: any): Promise<AccountInfo | null> {
    const hint = profile.ms_account_username;
    if (!hint) {
      this.clearStorage();
      return null;
    }
    return await this.trySilentLogin(hint);
  },

  // Sadece yerel depolamayı temizle (Redirect yapmaz)
  clearStorage() {
    clearAllMsalStorage();
    if (msalInstance) {
      msalInstance.setActiveAccount(null);
    }
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
    let response: any = await client
      .api(`/me/todo/lists/${listId}/tasks`)
      .top(100)
      .header('Cache-Control', 'no-cache')
      .get();

    allTasks.push(...(response.value || []));

    while (response['@odata.nextLink']) {
      response = await client.api(response['@odata.nextLink']).get();
      allTasks.push(...(response.value || []));
    }

    return allTasks;
  },

  async getCalendarEvents(start?: string, end?: string) {
    const client = await this.getGraphClient(calendarScopes);
    if (!client) return [];
    try {
      let query = client.api('/me/calendarview');
      if (start && end) {
        query = query.query({
          startDateTime: new Date(start).toISOString(),
          endDateTime: new Date(end).toISOString()
        });
      } else {
        // Default: next 30 days
        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + 30);
        query = query.query({
          startDateTime: now.toISOString(),
          endDateTime: future.toISOString()
        });
      }
      
      const response = await query.top(50).get();
      return (response.value || []).map((ev: any) => ({ ...ev, source: 'outlook' }));
    } catch (err) {
      console.error('MS Get Calendar Events Error:', err);
      return [];
    }
  },

  async createCalendarEvent(event: { subject: string, body: string, start: string, end: string, location?: string }) {
    const client = await this.getGraphClient(calendarScopes);
    if (!client) return null;
    try {
      const msEvent = {
        subject: event.subject,
        body: {
          contentType: 'text',
          content: event.body
        },
        start: {
          dateTime: new Date(event.start).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(event.end).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: event.location ? { displayName: event.location } : undefined
      };
      return await client.api('/me/events').post(msEvent);
    } catch (err) {
      console.error('MS Create Event Error:', err);
      return null;
    }
  },

  async deleteCalendarEvent(eventId: string) {
    const client = await this.getGraphClient(calendarScopes);
    if (!client) return false;
    try {
      await client.api(`/me/events/${eventId}`).delete();
      return true;
    } catch (err) {
      console.error('MS Delete Event Error:', err);
      return false;
    }
  },

  async getRecentEmails(top: number = 20) {
    const client = await this.getGraphClient(mailScopes);
    if (!client) return [];
    try {
      const response = await client.api('/me/messages')
        .select('id,subject,bodyPreview,sender,receivedDateTime,isRead,body')
        .orderby('receivedDateTime DESC')
        .top(top)
        .get();
      return (response.value || []).map((msg: any) => ({
        id: msg.id,
        subject: msg.subject,
        bodyPreview: msg.bodyPreview,
        body: msg.body?.content || '',
        sender: msg.sender?.emailAddress?.name || msg.sender?.emailAddress?.address || 'Unknown',
        senderEmail: msg.sender?.emailAddress?.address || '',
        date: msg.receivedDateTime,
        isRead: msg.isRead,
        source: 'outlook'
      }));
    } catch (err) {
      console.error('MS Get Emails Error:', err);
      return [];
    }
  },

  async getUnreadCount(): Promise<number> {
    const client = await this.getGraphClient(mailScopes);
    if (!client) return 0;
    try {
      const response = await client.api('/me/mailFolders/Inbox').select('unreadItemCount').get();
      return response.unreadItemCount || 0;
    } catch (err) {
      console.error('MS Get Unread Count Error:', err);
      return 0;
    }
  },

  async sendEmail(to: string, subject: string, body: string) {
    const client = await this.getGraphClient(mailScopes);
    if (!client) return false;
    try {
      const message = {
        message: {
          subject: subject,
          body: {
            contentType: 'Text',
            content: body
          },
          toRecipients: [
            {
              emailAddress: {
                address: to
              }
            }
          ]
        },
        saveToSentItems: 'true'
      };
      await client.api('/me/sendMail').post(message);
      return true;
    } catch (err) {
      console.error('MS Send Email Error:', err);
      return false;
    }
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
