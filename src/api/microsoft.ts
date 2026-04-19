import { PublicClientApplication, Configuration, RedirectRequest } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';

/**
 * Microsoft Authentication & Graph API Service
 */

const CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || 'e72321c9-1eaf-47b5-8722-17b32d50dd25';
const TENANT_ID = import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common';

const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

const loginRequest: RedirectRequest = {
  scopes: ['User.Read', 'Tasks.ReadWrite'],
};

export const microsoftService = {
  async login() {
    try {
      await msalInstance.initialize();
      await msalInstance.loginRedirect(loginRequest);
    } catch (err) {
      console.error('MS Login Error:', err);
    }
  },

  async logout() {
    try {
      await msalInstance.logoutRedirect();
    } catch (err) {
      console.error('MS Logout Error:', err);
    }
  },

  async getToken() {
    try {
      await msalInstance.initialize();
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        const response = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });
        return response.accessToken;
      }
      return null;
    } catch (err) {
      console.warn('Silent token acquisition failed, trying popup...', err);
      // Optional: fallback to popup or redirect if silent fails
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
      console.error('Get Todo Lists Error:', err);
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
      console.error('Ensure Todo List Error:', err);
      return null;
    }
  },

  async syncTask(listId: string, task: { title: string; desc: string; deadline?: string; status: 'todo' | 'doing' | 'done' }, msId?: string) {
    const client = await this.getGraphClient();
    if (!client) return null;

    const todoTask = {
      title: task.title,
      body: {
        content: task.desc,
        contentType: 'text',
      },
      dueDateTime: task.deadline ? {
        dateTime: new Date(task.deadline).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      } : undefined,
      status: task.status === 'done' ? 'completed' : 'notStarted',
    };

    try {
      if (msId) {
        // Update existing
        return await client.api(`/me/todo/lists/${listId}/tasks/${msId}`).patch(todoTask);
      } else {
        // Create new
        const result = await client.api(`/me/todo/lists/${listId}/tasks`).post(todoTask);
        return result;
      }
    } catch (err) {
      console.error('Sync Task Error:', err);
      return null;
    }
  },

  async deleteTask(listId: string, msId: string) {
    const client = await this.getGraphClient();
    if (!client) return;

    try {
      await client.api(`/me/todo/lists/${listId}/tasks/${msId}`).delete();
    } catch (err) {
      console.error('Delete Task Error:', err);
    }
  },

  async getTodoListTasks(listId: string) {
    const client = await this.getGraphClient();
    if (!client) return [];

    try {
      const response = await client.api(`/me/todo/lists/${listId}/tasks`).get();
      return response.value;
    } catch (err) {
      console.error('Get Todo List Tasks Error:', err);
      return [];
    }
  }
};
