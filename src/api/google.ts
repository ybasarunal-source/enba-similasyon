const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '785162351683-5ncn1udcqp6558nr3a86hgkt53imuubq.apps.googleusercontent.com';
const REDIRECT_URI = window.location.origin;
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  location?: string;
}

interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
  selfLink: string;
}

interface GoogleTask {
  id: string;
  title: string;
  updated: string;
  selfLink: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
}

export const googleService = {
  loginRedirect() {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${encodeURIComponent(SCOPES)}&include_granted_scopes=true&state=google_auth`;
    window.location.href = authUrl;
  },

  handleAuthReturn(): boolean {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const expires = params.get('expires_in');
      
      if (token) {
        localStorage.setItem('google_access_token', token);
        localStorage.setItem('google_token_expiry', (Date.now() + parseInt(expires || '3600') * 1000).toString());
        window.location.hash = ''; // Clear hash
        return true;
      }
    }
    return false;
  },

  getAccessToken(): string | null {
    const token = localStorage.getItem('google_access_token');
    const expiry = localStorage.getItem('google_token_expiry');
    
    if (token && expiry && Date.now() < parseInt(expiry)) {
      return token;
    }
    return null;
  },

  // Profil verilerinden token'ı geri yükle ve yerel depolamaya yaz
  resumeSession(profile: any) {
    if (profile.google_data?.token) {
      localStorage.setItem('google_access_token', profile.google_data.token);
      localStorage.setItem('google_token_expiry', profile.google_data.expiry);
    }
  },

  async getCalendarEvents(start?: string, end?: string) {
    const token = this.getAccessToken();
    if (!token) return [];

    try {
      const timeMin = start ? new Date(start).toISOString() : new Date().toISOString();
      const timeMax = end ? new Date(end).toISOString() : undefined;
      
      let url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&orderBy=startTime`;
      if (timeMax) url += `&timeMax=${encodeURIComponent(timeMax)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('google_access_token');
          localStorage.removeItem('google_token_expiry');
        }
        console.warn(`Google API Error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      return (data.items || []).map((item: GoogleCalendarEvent) => ({
        id: item.id,
        subject: item.summary,
        bodyPreview: item.description || '',
        start: { 
          dateTime: item.start.dateTime || item.start.date || '', 
          timeZone: item.start.timeZone 
        },
        end: { 
          dateTime: item.end.dateTime || item.end.date || '', 
          timeZone: item.end.timeZone 
        },
        location: item.location ? { displayName: item.location } : undefined,
        isAllDay: !!item.start.date,
        source: 'google'
      }));
    } catch (err) {
      console.error('Google Calendar API Error:', err);
      return [];
    }
  },

  async getTaskLists(): Promise<GoogleTaskList[]> {
    const token = this.getAccessToken();
    if (!token) return [];
    try {
      const response = await fetch('https://www.googleapis.com/tasks/v1/users/@me/tasklists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data.items || [];
    } catch (err) {
      console.error('Google TaskLists Error:', err);
      return [];
    }
  },

  async getTasksFromList(listId: string): Promise<GoogleTask[]> {
    const token = this.getAccessToken();
    if (!token) return [];
    try {
      const response = await fetch(`https://www.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data.items || [];
    } catch (err) {
      console.error('Google Tasks Error:', err);
      return [];
    }
  },

  async createCalendarEvent(event: { subject: string, body: string, start: string, end: string, location?: string }) {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const gEvent = {
        summary: event.subject,
        description: event.body,
        start: {
          dateTime: new Date(event.start).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(event.end).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: event.location
      };

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gEvent)
      });

      return await response.json();
    } catch (err) {
      console.error('Google Create Event Error:', err);
      return null;
    }
  },

  async deleteCalendarEvent(eventId: string) {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.status === 204;
    } catch (err) {
      console.error('Google Delete Event Error:', err);
      return false;
    }
  },

  async getRecentEmails(maxResults: number = 20) {
    const token = this.getAccessToken();
    if (!token) return [];

    try {
      // Get message list
      const listResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!listResponse.ok) {
        if (listResponse.status === 401 || listResponse.status === 403) {
          localStorage.removeItem('google_access_token');
          localStorage.removeItem('google_token_expiry');
        }
        throw new Error('Failed to fetch gmail messages');
      }
      const listData = await listResponse.json();
      const messages = listData.messages || [];

      // Fetch details for each message
      const detailedMessages = await Promise.all(
        messages.map(async (msg: any) => {
          const detailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const detailData = await detailResponse.json();
          
          const headers = detailData.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
          const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
          const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
          
          // Parse "Name <email@domain.com>" format
          let senderName = from;
          let senderEmail = from;
          const match = from.match(/(.*)<(.*)>/);
          if (match) {
            senderName = match[1].trim() || match[2].trim();
            senderEmail = match[2].trim();
          }

          return {
            id: detailData.id,
            subject: subject,
            bodyPreview: detailData.snippet || '',
            body: detailData.snippet || '', // Just snippet for now to save API calls
            sender: senderName,
            senderEmail: senderEmail,
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
            isRead: !(detailData.labelIds || []).includes('UNREAD'),
            source: 'gmail'
          };
        })
      );

      return detailedMessages;
    } catch (err) {
      console.error('Google Get Emails Error:', err);
      return [];
    }
  },

  async getEmailBody(id: string) {
    const token = this.getAccessToken();
    if (!token) return '';
    try {
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      const getBodyStr = (payload: any): string => {
        if (!payload) return '';
        if (payload.body && payload.body.data) {
          return decodeURIComponent(escape(atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))));
        }
        if (payload.parts) {
          const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
          if (htmlPart) return getBodyStr(htmlPart);
          const plainPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
          if (plainPart) return getBodyStr(plainPart);
          for (const part of payload.parts) {
            const res = getBodyStr(part);
            if (res) return res;
          }
        }
        return '';
      };
      
      return getBodyStr(data.payload);
    } catch (err) {
      console.error('Google Get Body Error:', err);
      return '';
    }
  },

  async getUnreadCount(): Promise<number> {
    const token = this.getAccessToken();
    if (!token) return 0;
    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('google_access_token');
          localStorage.removeItem('google_token_expiry');
        }
        return 0;
      }
      const data = await response.json();
      return data.messagesUnread || 0;
    } catch (err) {
      console.error('Google Unread Count Error:', err);
      return 0;
    }
  },

  async sendEmail(to: string, subject: string, body: string) {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const emailContent = [
        `To: ${to}`,
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        body
      ].join('\r\n');

      // Base64URL encode
      const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: encodedEmail })
      });

      return response.ok;
    } catch (err) {
      console.error('Google Send Email Error:', err);
      return false;
    }
  },

  logout() {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
  }
};
