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
  MoreVertical,
  X,
  Share2
} from 'lucide-react';
import { microsoftService } from '../api/microsoft';

interface CalendarEvent {
  id: string;
  subject: string;
  bodyPreview: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  isAllDay: boolean;
}

export const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    start: '',
    startTime: '09:00',
    end: '',
    endTime: '10:00',
    location: ''
  });

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const account = await microsoftService.getAccount();
      if (account) {
        setIsAuth(true);
        // Fetch events for current month (+/- 10 days)
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        start.setDate(start.getDate() - 7);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        end.setDate(end.getDate() + 7);
        
        const msEvents = await microsoftService.getCalendarEvents(start.toISOString(), end.toISOString());
        setEvents(msEvents);
      } else {
        setIsAuth(false);
      }
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
      
      await microsoftService.createCalendarEvent({
        subject: formData.subject,
        body: formData.body,
        start: startDateTime,
        end: endDateTime,
        location: formData.location
      });
      
      setShowAddModal(false);
      loadEvents();
    } catch (err) {
      console.error('Create Event Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
    setIsLoading(true);
    try {
      await microsoftService.deleteCalendarEvent(id);
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
    
    // Padding for previous month
    const prevMonthDays = firstDayOfMonth(year, month);
    const lastDayPrevMonth = daysInMonth(year, month - 1);
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      days.push({ day: lastDayPrevMonth - i, current: false, date: new Date(year, month - 1, lastDayPrevMonth - i) });
    }
    
    // Current month days
    const totalDays = daysInMonth(year, month);
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, current: true, date: new Date(year, month, i) });
    }
    
    // Padding for next month
    const nextPadding = 42 - days.length;
    for (let i = 1; i <= nextPadding; i++) {
      days.push({ day: i, current: false, date: new Date(year, month + 1, i) });
    }
    
    return days;
  }, [currentDate]);

  const selectedDayEvents = useMemo(() => {
    return events.filter(ev => {
      const evDate = new Date(ev.start.dateTime);
      return evDate.getDate() === selectedDate.getDate() &&
             evDate.getMonth() === selectedDate.getMonth() &&
             evDate.getFullYear() === selectedDate.getFullYear();
    }).sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());
  }, [events, selectedDate]);

  const getEventsForDay = (date: Date) => {
    return events.filter(ev => {
      const evDate = new Date(ev.start.dateTime);
      return evDate.getDate() === date.getDate() &&
             evDate.getMonth() === date.getMonth() &&
             evDate.getFullYear() === date.getFullYear();
    });
  };

  if (!isAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mb-6 border border-gray-100">
          <Share2 size={40} />
        </div>
        <h2 className="text-xl font-bold text-enba-dark tracking-tight uppercase">Bağlantı Gerekli</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">Takvim verilerinize erişmek için lütfen Microsoft hesabınızı bağlayın.</p>
        <button 
          onClick={() => microsoftService.loginRedirect()}
          className="mt-8 px-8 py-3 bg-[#0078d4] text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          Microsoft Hesabını Bağla
        </button>
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
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[4px] mt-2">Kurumsal Planlayıcı</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-[10px] font-black text-enba-dark uppercase bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">Bugün</button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all"><ChevronRight size={20} /></button>
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
                      <div key={idx} className="text-[9px] font-bold text-enba-dark bg-gray-50/80 px-2 py-0.5 rounded border-l-2 border-enba-orange truncate">
                        {ev.subject}
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

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
          {selectedDayEvents.length > 0 ? selectedDayEvents.map(ev => (
            <div key={ev.id} className="group bg-gray-50/50 p-5 rounded-3xl border border-transparent hover:border-gray-100 hover:bg-white transition-all relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-enba-orange/20 group-hover:bg-enba-orange transition-colors" />
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-[9px] font-black text-enba-orange uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-lg">
                  <Clock size={12} />
                  {new Date(ev.start.dateTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <button 
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-gray-300 hover:text-rose-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <h4 className="text-sm font-black text-enba-dark leading-tight mb-2">{ev.subject}</h4>
              
              {ev.location?.displayName && (
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold italic mb-3">
                  <MapPin size={12} className="text-enba-orange/50" />
                  {ev.location.displayName}
                </div>
              )}

              <p className="text-[10px] text-gray-400 leading-relaxed truncate-2-lines line-clamp-2">
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
              end: selectedDate.toISOString().split('T')[0]
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
            <div className="h-2 bg-enba-orange" />
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <div>
                <h3 className="text-xl font-black text-enba-dark tracking-tight uppercase italic">Yeni Randevu Oluştur</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Outlook Takvimi ile eşleşecek</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 text-gray-400 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-8 space-y-6">
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

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Konum</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 pl-12 text-sm font-bold text-enba-dark"
                    placeholder="NEREDE?"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Detaylar</label>
                <textarea 
                  value={formData.body}
                  onChange={e => setFormData({...formData, body: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-enba-dark min-h-[100px]"
                  placeholder="RANDEVU DETAYLARI..."
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-enba-orange text-white rounded-2xl py-4 font-black text-[12px] uppercase tracking-[4px] shadow-xl shadow-orange-950/20 hover:brightness-110 active:scale-95 transition-all mt-4"
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
