const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '785162351683-5ncn1udcqp6558nr3a86hgkt53imuubq.apps.googleusercontent.com';
const REDIRECT_URI = window.location.origin;
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send';

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

export interface GmailAttachment {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
}

function extractAttachments(parts: any[]): GmailAttachment[] {
  const result: GmailAttachment[] = [];
  for (const part of parts || []) {
    if (part.filename && part.body?.attachmentId) {
      result.push({
        attachmentId: part.body.attachmentId as string,
        filename: part.filename as string,
        mimeType: (part.mimeType || 'application/octet-stream') as string,
        size: (part.body.size || 0) as number,
      });
    }
    if (part.parts) result.push(...extractAttachments(part.parts));
  }
  return result;
}

export const googleService = {
  loginRedirect() {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${encodeURIComponent(SCOPES)}&include_granted_scopes=true&state=google_auth&prompt=consent`;
    window.location.href = authUrl;
  },

  handleAuthReturn(): boolean {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const expires = params.get('expires_in');

      if (token) {
        const expiry = (Date.now() + parseInt(expires || '3600') * 1000).toString();
        localStorage.setItem('google_access_token', token);
        localStorage.setItem('google_token_expiry', expiry);
        localStorage.setItem('google_ever_connected', '1');
        // Aynı sekme içinde navigasyon için sessionStorage yedek
        sessionStorage.setItem('google_access_token', token);
        sessionStorage.setItem('google_token_expiry', expiry);
        // Hash'i sayfayı yeniden yüklemeden temizle
        try {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch {
          window.location.hash = '';
        }
        return true;
      }
    }
    return false;
  },

  getAccessToken(): string | null {
    const lsToken = localStorage.getItem('google_access_token');
    const lsExpiry = localStorage.getItem('google_token_expiry');

    if (lsToken && lsExpiry && Date.now() < parseInt(lsExpiry)) {
      return lsToken;
    }

    // localStorage'dan alınamadıysa sessionStorage yedeğine bak (aynı sekme)
    const ssToken = sessionStorage.getItem('google_access_token');
    const ssExpiry = sessionStorage.getItem('google_token_expiry');
    if (ssToken && ssExpiry && Date.now() < parseInt(ssExpiry)) {
      // localStorage'ı yeniden doldur
      localStorage.setItem('google_access_token', ssToken);
      localStorage.setItem('google_token_expiry', ssExpiry);
      return ssToken;
    }

    return null;
  },

  // Profil verilerinden token'ı geri yükle (sadece Supabase'de kayıtlıysa)
  resumeSession(profile: any) {
    const profileToken = profile.google_data?.token;
    const profileExpiry = profile.google_data?.expiry;
    if (profileToken && profileExpiry) {
      // Zaten geçerli bir token varsa üstüne yazma
      if (this.getAccessToken()) return;
      localStorage.setItem('google_access_token', profileToken);
      localStorage.setItem('google_token_expiry', profileExpiry);
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
        console.warn(`Google Calendar API Error: ${response.status} ${response.statusText}`);
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

  async getLabels(): Promise<{id: string, name: string, type: string}[]> {
    const token = this.getAccessToken();
    if (!token) return [];
    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.labels || [];
    } catch (err) {
      console.error('Google Labels Error:', err);
      return [];
    }
  },

  async getRecentEmails(maxResults: number = 20, labelId?: string, unreadOnly = false) {
    const token = this.getAccessToken();
    if (!token) return [];

    try {
      let listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
      if (labelId) listUrl += `&labelIds=${encodeURIComponent(labelId)}`;
      if (unreadOnly) listUrl += '&labelIds=UNREAD';
      const listResponse = await fetch(listUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!listResponse.ok) {
        throw new Error(`Gmail messages fetch failed: ${listResponse.status}`);
      }
      const listData = await listResponse.json();
      const messages = (listData.messages || []).filter((m: any) => m?.id);

      // 10'arlı batch: 50 paralel istek rate limit'e çarpıyor
      const BATCH = 10;
      const FIELDS = 'id,snippet,labelIds,payload(headers(name,value),parts(mimeType,filename,body(attachmentId,size),parts(mimeType,filename,body(attachmentId,size))))';
      const fetchOne = async (msg: any) => {
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full&fields=${encodeURIComponent(FIELDS)}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (!detailResponse.ok) return null;
        const detailData = await detailResponse.json();

        const headers: { name: string; value: string }[] = detailData.payload?.headers || [];
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || 'Konu Yok';
        const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Bilinmiyor';
        const date = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';
        const labelIds: string[] = detailData.labelIds || [];

        let senderName = from;
        let senderEmail = from;
        const match = from.match(/(.*)<(.*)>/);
        if (match) {
          senderName = match[1].trim() || match[2].trim();
          senderEmail = match[2].trim();
        }

        const attachments = extractAttachments(detailData.payload?.parts || []);

        return {
          id: detailData.id as string,
          subject,
          bodyPreview: detailData.snippet || '',
          body: '',
          sender: senderName,
          senderEmail,
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
          isRead: !labelIds.includes('UNREAD'),
          isStarred: labelIds.includes('STARRED'),
          source: 'gmail' as const,
          hasAttachments: attachments.length > 0,
        };
      };

      const detailedMessages = [];
      for (let i = 0; i < messages.length; i += BATCH) {
        const batch = messages.slice(i, i + BATCH);
        const results = await Promise.all(batch.map(fetchOne));
        detailedMessages.push(...results.filter((m): m is NonNullable<typeof m> => m !== null));
      }

      return detailedMessages;
    } catch (err) {
      console.error('Google Get Emails Error:', err);
      return [];
    }
  },

  async getEmailBody(id: string): Promise<{ body: string; attachments: GmailAttachment[] }> {
    const empty = { body: '', attachments: [] };
    const token = this.getAccessToken();
    if (!token) return empty;
    try {
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return empty;
      const data = await response.json();

      const decodeB64 = (b64: string): string => {
        try {
          const binary = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          return new TextDecoder('utf-8').decode(bytes);
        } catch {
          return '';
        }
      };

      const getBodyStr = (payload: any): string => {
        if (!payload) return '';
        if (payload.body?.data) return decodeB64(payload.body.data);
        if (payload.parts) {
          const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
          if (htmlPart) return getBodyStr(htmlPart);
          const plainPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
          if (plainPart) {
            const text = getBodyStr(plainPart);
            return text ? `<pre style="white-space:pre-wrap;font-family:inherit">${text}</pre>` : '';
          }
          for (const part of payload.parts) {
            const res = getBodyStr(part);
            if (res) return res;
          }
        }
        return '';
      };

      return {
        body: getBodyStr(data.payload),
        attachments: extractAttachments(data.payload?.parts || []),
      };
    } catch (err) {
      console.error('Google Get Body Error:', err);
      return empty;
    }
  },

  async downloadAttachment(messageId: string, attachmentId: string, filename: string, mimeType: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) return;
    try {
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!response.ok) return;
      const data = await response.json();
      const base64 = (data.data as string).replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download attachment error:', err);
    }
  },

  async getUnreadCount(): Promise<number> {
    const token = this.getAccessToken();
    if (!token) return 0;
    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels/CATEGORY_PERSONAL', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        return 0;
      }
      const data = await response.json();
      return data.threadsUnread || 0;
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

  async markAsRead(id: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) return;
    try {
      await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
      });
    } catch { /* ignore */ }
  },

  async starEmail(id: string, starred: boolean): Promise<boolean> {
    const token = this.getAccessToken();
    if (!token) return false;
    try {
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(starred ? { addLabelIds: ['STARRED'] } : { removeLabelIds: ['STARRED'] }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  logout() {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
    localStorage.removeItem('google_ever_connected');
    sessionStorage.removeItem('google_access_token');
    sessionStorage.removeItem('google_token_expiry');
  }
};
