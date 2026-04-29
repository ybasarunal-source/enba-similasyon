import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../api/i18n';
import { microsoftService } from '../api/microsoft';
import { googleService } from '../api/google';
import {
  Mail as MailIcon,
  Send,
  RefreshCw,
  Inbox,
  PenSquare,
  Search,
  X,
  ChevronRight,
  Maximize,
  Minimize
} from 'lucide-react';

interface Email {
  id: string;
  subject: string;
  bodyPreview: string;
  body: string;
  sender: string;
  senderEmail: string;
  date: string;
  isRead: boolean;
  source: 'outlook' | 'gmail';
}

export const Mail: React.FC = () => {
  const { t } = useTranslation();
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'outlook' | 'gmail'>('all');
  
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isBodyLoading, setIsBodyLoading] = useState(false);

  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '', source: 'outlook' as 'outlook' | 'gmail' });
  const [isSending, setIsSending] = useState(false);

  const [msConnected, setMsConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  const checkConnections = async () => {
    const msToken = await microsoftService.getToken(['User.Read', 'Mail.ReadWrite', 'Mail.Send']);
    setMsConnected(!!msToken);

    const gToken = googleService.getAccessToken();
    setGoogleConnected(!!gToken);
    
    if (msToken || gToken) {
      fetchEmails();
    }
  };

  useEffect(() => {
    checkConnections();
  }, []);

  const fetchEmails = async () => {
    setIsLoading(true);
    let allEmails: Email[] = [];

    try {
      if (msConnected) {
        const msEmails = await microsoftService.getRecentEmails(30);
        allEmails = [...allEmails, ...msEmails];
      }
      
      if (googleConnected) {
        const gEmails = await googleService.getRecentEmails(30);
        allEmails = [...allEmails, ...gEmails];
      }

      // Sort by date descending
      allEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEmails(allEmails);
    } catch (err) {
      console.error('Fetch emails error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectMs = async () => {
    try {
      await microsoftService.loginRedirect();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnectGoogle = () => {
    googleService.loginRedirect();
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeData.to || !composeData.subject || !composeData.body) return;
    
    setIsSending(true);
    try {
      let success = false;
      if (composeData.source === 'outlook') {
        success = await microsoftService.sendEmail(composeData.to, composeData.subject, composeData.body);
      } else {
        success = await googleService.sendEmail(composeData.to, composeData.subject, composeData.body);
      }

      if (success) {
        alert('E-posta başarıyla gönderildi!');
        setShowCompose(false);
        setComposeData({ to: '', subject: '', body: '', source: 'outlook' });
      } else {
        alert('E-posta gönderilemedi.');
      }
    } catch (err) {
      console.error(err);
      alert('Bir hata oluştu.');
    } finally {
      setIsSending(false);
    }
  };

  const filteredEmails = useMemo(() => {
    return emails.filter(e => {
      const matchesSource = sourceFilter === 'all' || e.source === sourceFilter;
      const matchesSearch = e.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            e.bodyPreview.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSource && matchesSearch;
    });
  }, [emails, sourceFilter, searchTerm]);

  const handleOpenEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (email.source === 'gmail' && !email.body.includes('<')) {
      // Body is probably just a snippet, fetch full HTML body
      setIsBodyLoading(true);
      try {
        const fullBody = await googleService.getEmailBody(email.id);
        if (fullBody) {
          setSelectedEmail({ ...email, body: fullBody });
          setEmails(emails.map(e => e.id === email.id ? { ...e, body: fullBody } : e));
        }
      } catch (e) {
        console.error('Error fetching full body:', e);
      } finally {
        setIsBodyLoading(false);
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] animate-fade-in overflow-hidden">
      {/* ─── LEFT SIDEBAR ─────────────────────────────────── */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 relative z-10 shadow-sm overflow-hidden">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-enba-dark rounded-xl flex items-center justify-center text-enba-orange shadow-lg">
              <MailIcon size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-enba-dark tracking-tight uppercase">E-Posta</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Merkezi Kutu</p>
            </div>
          </div>

          <button 
            onClick={() => setShowCompose(true)} 
            className="w-full py-4 bg-enba-orange text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] shadow-lg shadow-enba-orange/20 hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 mb-6"
          >
            <PenSquare size={16} /> Yeni E-Posta
          </button>
          
          <div className="space-y-2">
            <button onClick={() => setSourceFilter('all')} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${sourceFilter === 'all' ? 'bg-enba-dark text-white shadow-xl shadow-gray-200' : 'text-gray-400 hover:bg-gray-50'}`}>
              <Inbox size={18} className={sourceFilter === 'all' ? 'text-enba-orange' : ''} />
              <span className="text-xs font-bold uppercase tracking-wide">Tüm Gelenler</span>
            </button>
            <button onClick={() => setSourceFilter('outlook')} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${sourceFilter === 'outlook' ? 'bg-[#0078d4] text-white shadow-xl shadow-blue-200' : 'text-gray-400 hover:bg-blue-50'}`}>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M22.5 12C22.5 6.2 17.8 1.5 12 1.5 6.2 1.5 1.5 6.2 1.5 12 1.5 17.8 6.2 22.5 12 22.5 17.8 22.5 22.5 17.8 22.5 12" fill="currentColor" opacity="0.8"/><path d="M14.2 15.6l2.1-7.1h1.7l-3 10H13.4l-3-10h1.7l2.1 7.1" fill="#fff"/></svg>
              <span className="text-xs font-bold uppercase tracking-wide">Outlook</span>
            </button>
            <button onClick={() => setSourceFilter('gmail')} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${sourceFilter === 'gmail' ? 'bg-[#EA4335] text-white shadow-xl shadow-red-200' : 'text-gray-400 hover:bg-red-50'}`}>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 48 48"><path fill="#fff" d="M24 9.5c3.54 0 6.72 1.22 9.21 3.22l6.89-6.89C35.83 2.1 30.34 0 24 0 15.02 0 7.3 7.46 2.89 13.85l7.78 6.03C12.55 13.47 17.81 9.5 24 9.5z"/></svg>
              <span className="text-xs font-bold uppercase tracking-wide">Gmail</span>
            </button>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-gray-50 flex flex-col gap-3">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Bağlantılar</p>
            {!msConnected ? (
              <button onClick={handleConnectMs} className="w-full py-2 bg-[#0078d4] text-white rounded-xl text-[10px] font-bold uppercase flex items-center justify-center shadow hover:bg-blue-600 transition-all">
                Outlook Bağla
              </button>
            ) : (
              <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-2 px-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Outlook Bağlı</div>
            )}
            
            {!googleConnected ? (
              <button onClick={handleConnectGoogle} className="w-full py-2 bg-[#4285F4] text-white rounded-xl text-[10px] font-bold uppercase flex items-center justify-center shadow hover:bg-blue-600 transition-all">
                Gmail Bağla
              </button>
            ) : (
               <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-2 px-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Gmail Bağlı</div>
            )}
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 shadow-sm relative z-0">
          <div className="flex items-center gap-4">
            <div className="flex flex-col border-r border-gray-100 pr-4">
              <h1 className="text-[9px] font-black text-enba-dark tracking-tight leading-none uppercase italic truncate max-w-[150px]">
                Gelen Kutusu
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">{filteredEmails.length} Mesaj</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 overflow-visible ml-2">
            <div className="relative hidden sm:block">
              <input 
                type="text" 
                placeholder="E-postalarda ara..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-gray-50 border-none rounded-lg px-8 py-2 text-[10px] font-medium text-enba-dark focus:ring-2 focus:ring-enba-orange/20 w-48 transition-all"
              />
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
            </div>
            <button 
              onClick={fetchEmails}
              className={`p-2 rounded-xl border border-gray-100 text-gray-400 hover:text-enba-orange hover:bg-orange-50 transition-all ${isLoading ? 'animate-spin border-enba-orange/20 text-enba-orange' : ''}`}
              title="Yenile"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#FAFAFA] p-6">
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            {isLoading && emails.length === 0 ? (
              <div className="flex items-center justify-center p-10">
                <RefreshCw size={24} className="animate-spin text-gray-300" />
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                <Inbox size={48} className="mb-4 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">E-Posta Bulunamadı</p>
              </div>
            ) : (
              filteredEmails.map(email => (
                <div key={email.id} onClick={() => handleOpenEmail(email)} className={`bg-white p-4 rounded-xl border ${email.isRead ? 'border-gray-100' : 'border-l-4 border-l-enba-orange border-y-gray-100 border-r-gray-100'} shadow-sm hover:shadow-md transition-all flex gap-4 cursor-pointer`}>
                  <div className="flex-shrink-0 mt-1">
                    {email.source === 'outlook' ? (
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-xs uppercase">
                        O
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold text-xs uppercase">
                        G
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm truncate pr-4 ${email.isRead ? 'font-medium text-gray-700' : 'font-bold text-enba-dark'}`}>
                        {email.sender} <span className="text-xs text-gray-400 font-normal">&lt;{email.senderEmail}&gt;</span>
                      </h3>
                      <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        {new Date(email.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className={`text-xs mb-1 truncate ${email.isRead ? 'text-gray-600' : 'font-bold text-gray-900'}`}>{email.subject}</h4>
                    <p className="text-xs text-gray-500 truncate">{email.bodyPreview}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-enba-dark px-6 py-4 flex items-center justify-between text-white">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><PenSquare size={16} className="text-enba-orange" /> Yeni E-Posta</h2>
              <button onClick={() => setShowCompose(false)} className="text-white/50 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSendEmail} className="p-6 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Kime</label>
                  <input required type="email" value={composeData.to} onChange={e => setComposeData({...composeData, to: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all" placeholder="ornek@sirket.com" />
                </div>
                <div className="w-48">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Gönderen Hesap</label>
                  <select value={composeData.source} onChange={e => setComposeData({...composeData, source: e.target.value as 'outlook'|'gmail'})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all">
                    {msConnected && <option value="outlook">Outlook</option>}
                    {googleConnected && <option value="gmail">Gmail</option>}
                    {!msConnected && !googleConnected && <option value="">Bağlı Hesap Yok</option>}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Konu</label>
                <input required type="text" value={composeData.subject} onChange={e => setComposeData({...composeData, subject: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Mesajınız</label>
                <textarea required value={composeData.body} onChange={e => setComposeData({...composeData, body: e.target.value})} rows={8} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all resize-none"></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowCompose(false)} className="px-6 py-2.5 rounded-xl text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={isSending || (!msConnected && !googleConnected)} className={`px-8 py-2.5 bg-enba-dark text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-black/10 flex items-center gap-2 transition-all ${isSending ? 'opacity-70' : 'hover:bg-black active:scale-95'}`}>
                  {isSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read Email Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedEmail.source === 'outlook' ? (
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-sm uppercase">O</div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold text-sm uppercase">G</div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-enba-dark">{selectedEmail.sender}</h3>
                  <p className="text-xs text-gray-400">&lt;{selectedEmail.senderEmail}&gt;</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
                  {new Date(selectedEmail.date).toLocaleString('tr-TR')}
                </span>
                <button onClick={() => setSelectedEmail(null)} className="p-2 text-gray-400 hover:text-enba-dark hover:bg-gray-100 rounded-xl transition-all"><X size={20} /></button>
              </div>
            </div>
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">{selectedEmail.subject}</h2>
            </div>
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar relative">
              {isBodyLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <RefreshCw size={24} className="animate-spin text-enba-orange" />
                </div>
              ) : null}
              <div 
                className="text-sm text-gray-700 leading-relaxed max-w-none prose prose-sm prose-a:text-enba-orange"
                dangerouslySetInnerHTML={{ __html: selectedEmail.body || selectedEmail.bodyPreview }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
