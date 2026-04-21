import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Trash2, 
  RefreshCw,
  X,
  Share2,
  Mail,
  Zap
} from 'lucide-react';
import { microsoftService } from '../api/microsoft';
import { googleService } from '../api/google';

interface CalendarEvent {
  id: string;
  subject: string;
  bodyPreview: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  isAllDay: boolean;
  source: 'google' | 'outlook';
}

export const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isMSAuth, setIsMSAuth] = useState(false);
  const [isGAuth, setIsGAuth] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'google' | 'outlook'>('all');
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    start: '',
    startTime: '09:00',
    end: '',
    endTime: '10:00',
    location: '',
    source: 'outlook' as 'google' | 'outlook'
  });

  // Handle Google Auth Return
  useEffect(() => {
    if (googleService.handleAuthReturn()) {
      loadEvents();
    }
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const msAccount = await microsoftService.getAccount();
      const googleToken = googleService.getAccessToken();
      
      setIsMSAuth(!!msAccount);
      setIsGAuth(!!googleToken);

      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      start.setDate(start.getDate() - 7);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      end.setDate(end.getDate() + 7);

      const fetchers = [];
      if (msAccount) fetchers.push(microsoftService.getCalendarEvents(start.toISOString(), end.toISOString()));
      if (googleToken) fetchers.push(googleService.getCalendarEvents(start.toISOString(), end.toISOString()));

      const results = await Promise.all(fetchers);
      const allEvents = results.flat() as CalendarEvent[];
      
      // Sort by time
      allEvents.sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());
      setEvents(allEvents);
    } catch (err) {
      console.error('Calendar Load Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const startDateTime = `${formData.start}T${formData.startTime}:00`;
      const endDateTime = `${formData.end || formData.start}T${formData.endTime}:00`;
      
      const eventData = {
        subject: formData.subject,
        body: formData.body,
        start: startDateTime,
        end: endDateTime,
        location: formData.location
      };

      if (formData.source === 'google') {
        await googleService.createCalendarEvent(eventData);
      } else {
        await microsoftService.createCalendarEvent(eventData);
      }
      
      setShowAddModal(false);
      loadEvents();
    } catch (err) {
      console.error('Create Event Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string, source: 'google' | 'outlook') => {
    if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
    setIsLoading(true);
    try {
      if (source === 'google') {
        await googleService.deleteCalendarEvent(id);
      } else {
        await microsoftService.deleteCalendarEvent(id);
      }
      loadEvents();
    } catch (err) {
      console.error('Delete Event Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Calendar Helpers ─────────────────────────────────────
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = [];
    const prevMonthDays = firstDayOfMonth(year, month);
    const lastDayPrevMonth = daysInMonth(year, month - 1);
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      days.push({ day: lastDayPrevMonth - i, current: false, date: new Date(year, month - 1, lastDayPrevMonth - i) });
    }
    const totalDays = daysInMonth(year, month);
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, current: true, date: new Date(year, month, i) });
    }
    const nextPadding = 42 - days.length;
    for (let i = 1; i <= nextPadding; i++) {
      days.push({ day: i, current: false, date: new Date(year, month + 1, i) });
    }
    return days;
  }, [currentDate]);

  const selectedDayEvents = useMemo(() => {
    return events.filter(ev => {
      if (sourceFilter !== 'all' && ev.source !== sourceFilter) return false;
      const evDate = new Date(ev.start.dateTime);
      return evDate.getDate() === selectedDate.getDate() &&
             evDate.getMonth() === selectedDate.getMonth() &&
             evDate.getFullYear() === selectedDate.getFullYear();
    });
  }, [events, selectedDate, sourceFilter]);

  const getEventsForDay = (date: Date) => {
    return events.filter(ev => {
      const evDate = new Date(ev.start.dateTime);
      return evDate.getDate() === date.getDate() &&
             evDate.getMonth() === date.getMonth() &&
             evDate.getFullYear() === date.getFullYear();
    });
  };

  const GoogleLogo = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" className="filter drop-shadow-sm">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.87 14.11c-.22-.67-.35-1.38-.35-2.11s.13-1.44.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.69-2.83z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.69 2.83c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335"/>
    </svg>
  );

  const MicrosoftLogo = () => (
    <svg viewBox="0 0 23 23" width="14" height="14">
      <path fill="#f3f3f3" d="M0 0h23v23H0z"/><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/>
    </svg>
  );

  if (!isMSAuth && !isGAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mb-6 border border-gray-100">
          <Share2 size={40} />
        </div>
        <h2 className="text-xl font-bold text-enba-dark tracking-tight uppercase">Takvim Bağlantısı</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
          Randevularınızı yönetmek için Microsoft veya Google hesabınızı bağlayın. 
          Her iki hesabı da bağlayarak birleşik bir görünüm elde edebilirsiniz.
        </p>
        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => microsoftService.loginRedirect()}
            className="px-6 py-3 bg-[#0078d4] text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:brightness-110 transition-all flex items-center gap-3"
          >
            <MicrosoftLogo /> Outlook Bağla
          </button>
          <button 
            onClick={() => googleService.loginRedirect()}
            className="px-6 py-3 bg-white text-gray-700 border border-gray-100 shadow-xl shadow-gray-200/50 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-3"
          >
            <GoogleLogo /> Google Bağla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] overflow-hidden animate-in fade-in duration-700">
      
      {/* ─── LEFT: CALENDAR GRID ──────────────────────────── */}
      <div className="flex-1 flex flex-col p-8 gap-8 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-enba-dark rounded-2xl flex items-center justify-center text-enba-orange shadow-lg border border-white/5">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-enba-dark tracking-tighter uppercase leading-none">
                {currentDate.toLocaleDateString('tr-TR', { month: 'long' })}
                <span className="text-gray-300 ml-2">{currentDate.getFullYear()}</span>
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[4px] mt-2 italic flex items-center gap-2">
                Birleşik Planlayıcı
                <span className="text-gray-200">|</span>
                <span className="flex items-center gap-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer" onClick={() => setSourceFilter(sourceFilter === 'google' ? 'all' : 'google')}>
                  <GoogleLogo /> {isGAuth ? 'Bağlı' : 'Kapalı'}
                </span>
                <span className="flex items-center gap-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer" onClick={() => setSourceFilter(sourceFilter === 'outlook' ? 'all' : 'outlook')}>
                  <MicrosoftLogo /> {isMSAuth ? 'Bağlı' : 'Kapalı'}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {(!isMSAuth || !isGAuth) && (
              <div className="flex gap-2 mr-4">
                {!isMSAuth && (
                  <button onClick={() => microsoftService.loginRedirect()} className="flex items-center gap-2 text-[9px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-all">
                    <MicrosoftLogo /> Outlook Ekle
                  </button>
                )}
                {!isGAuth && (
                  <button onClick={() => googleService.loginRedirect()} className="flex items-center gap-2 text-[9px] font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl hover:bg-gray-200 transition-all">
                    <GoogleLogo /> Google Ekle
                  </button>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all"><ChevronLeft size={20} /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-[10px] font-black text-enba-dark uppercase bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">Bugün</button>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all"><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>

        {/* Grid Container */}
        <div className="flex-1 bg-white rounded-[2.5rem] p-8 shadow-card border border-gray-100 flex flex-col relative overflow-hidden">
          <div className="grid grid-cols-7 gap-4 mb-6">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">{d}</div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 gap-2 overflow-y-auto custom-scrollbar pr-2">
            {calendarDays.map((item, i) => {
              const dayEvents = getEventsForDay(item.date);
              const isToday = new Date().toDateString() === item.date.toDateString();
              const isSelected = selectedDate.toDateString() === item.date.toDateString();
              
              return (
                <div 
                  key={i} 
                  onClick={() => setSelectedDate(item.date)}
                  className={`
                    min-h-[100px] p-3 rounded-2xl transition-all cursor-pointer relative group
                    ${item.current ? 'bg-white border-2 border-gray-50' : 'bg-gray-50/30 border-2 border-transparent opacity-40'}
                    ${isSelected ? 'border-enba-orange shadow-lg shadow-orange-500/5 z-10' : 'hover:border-gray-200'}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-black ${isToday ? 'text-enba-orange' : 'text-gray-400'}`}>
                      {item.day}
                    </span>
                    {dayEvents.length > 0 && item.current && (
                      <span className="w-1.5 h-1.5 rounded-full bg-enba-orange animate-pulse" />
                    )}
                  </div>
                  
                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev, idx) => (
                      <div key={idx} className={`text-[9px] font-bold text-enba-dark px-2 py-0.5 rounded border-l-2 flex items-center gap-1.5 truncate ${ev.source === 'google' ? 'bg-blue-50/50 border-blue-400' : 'bg-orange-50/50 border-enba-orange'}`}>
                        {ev.source === 'google' ? <GoogleLogo /> : <MicrosoftLogo />}
                        <span className="truncate">{ev.subject}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[8px] font-black text-gray-300 uppercase ml-1">+{dayEvents.length - 3} daha</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: AGENDA SIDEBAR ────────────────────────── */}
      <aside className="w-[400px] bg-white border-l border-gray-100 flex flex-col p-8 gap-6 shadow-2xl relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-enba-dark tracking-tight uppercase">Günlük Ajanda</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[3px] mt-1">
              {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
            </p>
          </div>
          <button 
            onClick={loadEvents}
            disabled={isLoading}
            className={`p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:text-enba-orange transition-all ${isLoading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Source Filter Tabs */}
        <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100">
          {[
            { id: 'all', label: 'TÜMÜ', icon: Zap },
            { id: 'google', label: 'GOOGLE', icon: GoogleLogo },
            { id: 'outlook', label: 'OUTLOOK', icon: MicrosoftLogo }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSourceFilter(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[9px] font-black tracking-widest transition-all ${sourceFilter === tab.id ? 'bg-white text-enba-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {React.createElement(tab.icon, { size: 12 })}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
          {selectedDayEvents.length > 0 ? selectedDayEvents.map(ev => (
            <div key={ev.id} className="group bg-gray-50/50 p-5 rounded-3xl border border-transparent hover:border-gray-100 hover:bg-white transition-all relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${ev.source === 'google' ? 'bg-blue-400/20 group-hover:bg-blue-400' : 'bg-enba-orange/20 group-hover:bg-enba-orange'} transition-colors`} />
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${ev.source === 'google' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-enba-orange'}`}>
                    <Clock size={12} />
                    {new Date(ev.start.dateTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {ev.source === 'google' ? <GoogleLogo /> : <MicrosoftLogo />}
                </div>
                <button 
                  onClick={() => handleDeleteEvent(ev.id, ev.source)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-gray-300 hover:text-rose-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <h4 className="text-sm font-black text-enba-dark leading-tight mb-2">{ev.subject}</h4>
              
              {ev.location?.displayName && (
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold italic mb-3">
                  <MapPin size={12} className={ev.source === 'google' ? 'text-blue-400' : 'text-enba-orange/50'} />
                  {ev.location.displayName}
                </div>
              )}

              <p className="text-[10px] text-gray-400 leading-relaxed truncate-2-lines line-clamp-2 italic">
                {ev.bodyPreview || 'Açıklama bulunmuyor.'}
              </p>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-100 rounded-[2.5rem] text-gray-300 opacity-50">
              <Clock size={32} className="mb-4" />
              <span className="text-[10px] font-black uppercase tracking-[3px]">Etkinlik Bulunmuyor</span>
            </div>
          )}
        </div>

        <button 
          onClick={() => {
            setFormData({
              ...formData,
              start: selectedDate.toISOString().split('T')[0],
              end: selectedDate.toISOString().split('T')[0],
              source: isMSAuth ? 'outlook' : 'google'
            });
            setShowAddModal(true);
          }}
          className="w-full py-5 bg-enba-dark text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[4px] shadow-2xl shadow-black/20 hover:bg-black hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 pr-8"
        >
          <Plus size={20} className="text-enba-orange" /> Yeni Randevu
        </button>
      </aside>

      {/* ─── ADD EVENT MODAL ─────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-enba-dark/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden relative border border-white/10">
            <div className={`h-2 transition-colors ${formData.source === 'google' ? 'bg-blue-400' : 'bg-enba-orange'}`} />
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <div>
                <h3 className="text-xl font-black text-enba-dark tracking-tight uppercase italic">Yeni Randevu Oluştur</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sisteme kaydedilecek</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 text-gray-400 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-8 space-y-6">
              {/* Source Selector */}
              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={!isGAuth}
                  onClick={() => setFormData({...formData, source: 'google'})}
                  className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.source === 'google' ? 'border-blue-400 bg-blue-50' : 'border-gray-50 bg-white opacity-40 grayscale'} ${!isGAuth && 'cursor-not-allowed'}`}
                >
                  <GoogleLogo />
                  <span className="text-[10px] font-black uppercase tracking-widest">Google Takvim</span>
                </button>
                <button
                  type="button"
                  disabled={!isMSAuth}
                  onClick={() => setFormData({...formData, source: 'outlook'})}
                  className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.source === 'outlook' ? 'border-enba-orange bg-orange-50' : 'border-gray-50 bg-white opacity-40 grayscale'} ${!isMSAuth && 'cursor-not-allowed'}`}
                >
                  <MicrosoftLogo />
                  <span className="text-[10px] font-black uppercase tracking-widest">Outlook Takvim</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Konu</label>
                <input 
                  required 
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all"
                  placeholder="RANDEVU BAŞLIĞI..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Başlangıç</label>
                  <input 
                    type="date"
                    required
                    value={formData.start}
                    onChange={e => setFormData({...formData, start: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-enba-dark"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Saat</label>
                  <input 
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-enba-dark"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full text-white rounded-2xl py-4 font-black text-[12px] uppercase tracking-[4px] shadow-xl shadow-black/10 hover:brightness-110 active:scale-95 transition-all mt-4 ${formData.source === 'google' ? 'bg-blue-400' : 'bg-enba-orange'}`}
              >
                {isLoading ? 'OLUŞTURULUYOR...' : 'SİSTEME KAYDET'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
