const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '785162351683-5ncn1udcqp6558nr3a86hgkt53imuubq.apps.googleusercontent.com';
const REDIRECT_URI = window.location.origin;
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  location?: string;
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

      if (response.status === 401) {
        localStorage.removeItem('google_access_token');
        return [];
      }

      const data = await response.json();
      // Normalize Google format to match our internal App interface
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

  logout() {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
  }
};
