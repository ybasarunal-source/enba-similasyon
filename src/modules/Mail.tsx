import React, { useState, useEffect, useMemo } from 'react';
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
  Plug,
  CheckCircle2,
  FileText,
  Trash2,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { tasksAPI, type SupabaseTask } from '../api/supabase';

interface Email {
  id: string;
  subject: string;
  bodyPreview: string;
  body: string;
  sender: string;
  senderEmail: string;
  date: string;
  isRead: boolean;
  isStarred?: boolean;
  source: 'outlook' | 'gmail';
}

export const Mail: React.FC = () => {
  // Kullanıcı daha önce Google'a bağlandıysa true — onboarding ekranını gizler
  const googleEverConnected = !!localStorage.getItem('google_ever_connected');

  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'outlook' | 'gmail'>('all');

  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isBodyLoading, setIsBodyLoading] = useState(false);

  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '', source: 'outlook' as 'outlook' | 'gmail' });
  const [isSending, setIsSending] = useState(false);

  const [leftPanel, setLeftPanel] = useState<'open'|'slim'>('slim');
  const [msConnected, setMsConnected] = useState(false);
  // Senkron başlat — her mount'ta localStorage'dan direkt oku, async bekleme
  const [googleConnected, setGoogleConnected] = useState(() => !!googleService.getAccessToken());
  const [isCheckingConnections, setIsCheckingConnections] = useState(
    () => !googleService.getAccessToken()
  );
  const [msConnecting, setMsConnecting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [googleNeedsReconnect, setGoogleNeedsReconnect] = useState(false);
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash'>('inbox');
  const [taskModal, setTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', desc: '', priority: 'medium', deadline: '' });
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [taskSaved, setTaskSaved] = useState(false);
  const [starToast, setStarToast] = useState(false);

  const checkConnections = async () => {
    setIsCheckingConnections(true);
    setGoogleNeedsReconnect(false);
    try {
      const msToken = await microsoftService.getToken(['User.Read', 'Mail.ReadWrite', 'Mail.Send']);
      setMsConnected(!!msToken);

      const gToken = googleService.getAccessToken();
      setGoogleConnected(!!gToken);

      if (msToken || gToken) {
        fetchEmails({ ms: !!msToken, google: !!gToken });
      }
    } finally {
      setIsCheckingConnections(false);
    }
  };

  useEffect(() => {
    checkConnections();
  }, []);

  const fetchEmails = async (override?: { ms?: boolean; google?: boolean }) => {
    const useMsConnected = override?.ms ?? msConnected;
    const useGoogleConnected = override?.google ?? googleConnected;

    setIsLoading(true);
    setFetchError(null);
    let allEmails: Email[] = [];

    try {
      if (useMsConnected) {
        const msEmails = await microsoftService.getRecentEmails(30);
        allEmails = [...allEmails, ...msEmails];
      }

      if (useGoogleConnected) {
        const token = googleService.getAccessToken();
        if (!token) {
          setFetchError('Gmail oturumu sona erdi — lütfen yeniden bağlanın.');
          setGoogleNeedsReconnect(true);
        } else {
          const testRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!testRes.ok) {
            const errBody = await testRes.json().catch(() => ({}));
            const msg = errBody?.error?.message || testRes.statusText;
            console.error(`[Mail] Gmail API ${testRes.status}:`, errBody);
            if (testRes.status === 401) {
              // Token sunucu tarafında geçersiz — localStorage'dan silme, 3-panel'de yeniden bağlan butonu göster
              setFetchError(`Gmail yetkisi geçersiz. Lütfen yeniden bağlanın.`);
              setGoogleNeedsReconnect(true);
            } else {
              setFetchError(`Gmail API hatası ${testRes.status}: ${msg}`);
            }
          } else {
            const gEmails = await googleService.getRecentEmails(30);
            allEmails = [...allEmails, ...gEmails];
          }
        }
      }

      allEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEmails(allEmails);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(`Bağlantı hatası: ${msg}`);
      console.error('Fetch emails error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectMs = async () => {
    setMsConnecting(true);
    try {
      await microsoftService.loginRedirect();
      const msToken = await microsoftService.getToken(['User.Read', 'Mail.ReadWrite', 'Mail.Send']);
      setMsConnected(!!msToken);
      if (msToken) fetchEmails();
    } catch (err) {
      console.error(err);
    } finally {
      setMsConnecting(false);
    }
  };

  const handleConnectGoogle = () => {
    // loginRedirect sayfayı terk eder — geri dönüşte App.tsx handleAuthReturn token'ı kaydeder
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

  const openTaskModal = () => {
    if (!selectedEmail) return;
    setTaskForm({
      title: selectedEmail.subject,
      desc: `Gönderen: ${selectedEmail.sender} <${selectedEmail.senderEmail}>\n\n${selectedEmail.bodyPreview}`,
      priority: 'medium',
      deadline: '',
    });
    setTaskSaved(false);
    setTaskModal(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTask(true);
    const task: SupabaseTask = {
      id: crypto.randomUUID(),
      title: taskForm.title,
      description: taskForm.desc,
      priority: taskForm.priority,
      deadline: taskForm.deadline || undefined,
      status: 'todo',
      source: 'local',
      module_ref: 'mail',
    };
    const result = await tasksAPI.insert(task);
    setIsSavingTask(false);
    if (result) {
      setTaskSaved(true);
      setTimeout(() => { setTaskSaved(false); setTaskModal(false); }, 1400);
    }
  };

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

  const handleStarEmail = async (email: Email, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStarred = !email.isStarred;

    // Optimistic UI
    const applyUpdate = (em: Email) => em.id === email.id ? { ...em, isStarred: newStarred } : em;
    setEmails(prev => prev.map(applyUpdate));
    if (selectedEmail?.id === email.id) setSelectedEmail(prev => prev ? applyUpdate(prev) : prev);

    try {
      if (email.source === 'gmail') {
        googleService.starEmail(email.id, newStarred);
      } else if (email.source === 'outlook') {
        microsoftService.flagEmail(email.id, newStarred);
      }

      if (newStarred) {
        const task: SupabaseTask = {
          id: crypto.randomUUID(),
          title: email.subject,
          description: `Gönderen: ${email.sender} <${email.senderEmail}>\n\n${email.bodyPreview}`,
          priority: 'medium',
          status: 'todo',
          source: 'local',
          module_ref: 'mail',
        };
        await tasksAPI.insert(task);
        setStarToast(true);
        setTimeout(() => setStarToast(false), 2500);
      }
    } catch (err) {
      console.error('Star email error:', err);
      // Revert
      setEmails(prev => prev.map(em => em.id === email.id ? { ...em, isStarred: !newStarred } : em));
    }
  };

  if (isCheckingConnections && !googleConnected && !msConnected) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
        <RefreshCw size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (!msConnected && !googleConnected && !googleEverConnected) {
    return (
      <div className="flex h-screen bg-[#FAFAFA] animate-fade-in overflow-hidden items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-enba-dark rounded-2xl flex items-center justify-center text-enba-orange shadow-xl mx-auto mb-5">
              <MailIcon size={28} />
            </div>
            <h1 className="text-2xl font-black text-enba-dark tracking-tight">E-Posta Hesabınızı Bağlayın</h1>
            <p className="text-sm text-gray-400 mt-2 font-medium">Microsoft veya Google hesabınızı bağlayarak tüm e-postalarınızı bu ekrandan yönetin.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Microsoft */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0078d4]/10 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 23 23" className="w-6 h-6">
                    <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
                    <rect x="12" y="1" width="10" height="10" fill="#7fba00"/>
                    <rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>
                    <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-black text-enba-dark">Microsoft</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Outlook / Office 365</p>
                </div>
              </div>
              <ul className="space-y-2">
                {['Gelen kutusu ve gönderilen e-postalar', 'Office 365 kurumsal hesaplar', 'Hotmail, Live, Outlook.com'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 size={13} className="text-[#0078d4] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleConnectMs}
                disabled={msConnecting}
                className="mt-auto w-full py-3 bg-[#0078d4] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {msConnecting ? <RefreshCw size={14} className="animate-spin" /> : <Plug size={14} />}
                {msConnecting ? 'Bağlanıyor...' : 'Microsoft ile Bağlan'}
              </button>
            </div>

            {/* Google */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-6 h-6">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.21 3.22l6.89-6.89C35.83 2.1 30.34 0 24 0 15.02 0 7.3 5.24 3.55 12.9l7.98 6.21C13.34 13.31 18.28 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.5 24.5c0-1.65-.15-3.25-.43-4.79H24v9.07h12.65c-.55 2.93-2.2 5.41-4.67 7.07l7.22 5.61C43.36 37.55 46.5 31.5 46.5 24.5z"/>
                    <path fill="#FBBC05" d="M11.53 28.51A14.5 14.5 0 0 1 9.5 24c0-1.57.26-3.09.73-4.51L2.25 13.28A23.96 23.96 0 0 0 0 24c0 3.86.91 7.51 2.55 10.73l8.98-6.22z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.92-2.15 15.9-5.85l-7.22-5.61c-2.02 1.36-4.6 2.16-8.68 2.16-5.72 0-10.66-3.81-12.47-9.1l-7.98 6.21C7.3 42.76 15.02 48 24 48z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-black text-enba-dark">Google</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gmail / Workspace</p>
                </div>
              </div>
              <ul className="space-y-2">
                {['Gmail ve Google Workspace', 'Özel domain e-posta (@sirketiniz.com)', 'Wix ile bağlı Google hesapları'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 size={13} className="text-[#34A853] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleConnectGoogle}
                className="mt-auto w-full py-3 bg-[#4285F4] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Plug size={14} />
                Google ile Bağlan
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-8">
            Birden fazla hesap ekleyebilirsiniz — her hesap ayrı filtre olarak görünür
          </p>
        </div>
      </div>
    );
  }

  const folders: { id: 'inbox' | 'sent' | 'drafts' | 'trash'; label: string; Icon: LucideIcon }[] = [
    { id: 'inbox', label: 'Gelen Kutusu', Icon: Inbox },
    { id: 'sent', label: 'Gönderilen', Icon: Send },
    { id: 'drafts', label: 'Taslaklar', Icon: FileText },
    { id: 'trash', label: 'Çöp Kutusu', Icon: Trash2 },
  ];

  return (
    <div className="flex h-screen bg-[#FAFAFA] animate-fade-in overflow-hidden" style={{ position: 'relative' }}>

      {/* ─── Bayrak toast ─────────────────────────────────── */}
      {starToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-enba-dark text-white px-4 py-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 shadow-xl pointer-events-none animate-fade-in">
          <Star size={12} className="text-amber-400" fill="currentColor"/>
          Görev oluşturuldu
        </div>
      )}

      {/* ─── SOL SIDEBAR TOGGLE ───────────────────────────── */}
      <button
        onClick={() => setLeftPanel(p => p === 'open' ? 'slim' : 'open')}
        title={leftPanel === 'open' ? 'Menüyü küçült' : 'Menüyü aç'}
        style={{
          position: 'absolute',
          left: leftPanel === 'open' ? 208 : 44,
          top: '50%', transform: 'translateY(-50%)',
          zIndex: 20, width: 18, height: 48,
          background: '#fff', border: '1px solid #F3F4F6',
          borderLeft: leftPanel === 'open' ? '1px solid #F3F4F6' : 'none',
          borderRadius: leftPanel === 'open' ? '0 6px 6px 0' : '6px 0 0 6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'left .25s',
          color: '#9CA3AF',
        }}
      >
        {leftPanel === 'open' ? <ChevronLeft size={11} strokeWidth={2.5}/> : <ChevronRight size={11} strokeWidth={2.5}/>}
      </button>

      {/* ─── SOL: Slim strip ──────────────────────────────── */}
      {leftPanel === 'slim' && (
        <aside className="flex flex-col flex-shrink-0 bg-white border-r border-gray-100 shadow-sm" style={{ width: 44, alignItems: 'center', padding: '16px 0', gap: 6 }}>
          <button
            onClick={() => setShowCompose(true)}
            title="Yeni E-Posta"
            className="flex items-center justify-center rounded-xl bg-enba-orange text-white flex-shrink-0 hover:brightness-110 transition-all"
            style={{ width: 32, height: 32, border: 'none', cursor: 'pointer' }}
          >
            <PenSquare size={14}/>
          </button>
          <div className="flex-shrink-0" style={{ width: 1, height: 16, background: '#F3F4F6' }}/>
          <button
            onClick={() => setActiveFolder('inbox')}
            title="Gelen Kutusu"
            className="flex items-center justify-center rounded-xl transition-all flex-shrink-0"
            style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', background: activeFolder === 'inbox' ? '#1A1A1A' : 'transparent', color: activeFolder === 'inbox' ? '#E35205' : '#9CA3AF' }}
          >
            <Inbox size={15}/>
          </button>
          <div style={{ flex: 1 }}/>
          {/* Hesap göstergeleri */}
          <div className="flex flex-col items-center gap-2 pb-2">
            <div title={msConnected ? 'Outlook bağlı' : 'Outlook bağlı değil'} style={{ width: 8, height: 8, borderRadius: '50%', background: msConnected ? '#34D399' : '#D1D5DB', flexShrink: 0 }}/>
            <div title={googleConnected ? 'Gmail bağlı' : 'Gmail bağlı değil'} style={{ width: 8, height: 8, borderRadius: '50%', background: googleConnected ? '#34D399' : '#D1D5DB', flexShrink: 0 }}/>
          </div>
        </aside>
      )}

      {/* ─── SOL: Klasörler (open) ────────────────────────── */}
      {leftPanel === 'open' && (
      <aside className="w-52 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 shadow-sm">
        <div className="p-5 pb-4">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 bg-enba-dark rounded-xl flex items-center justify-center text-enba-orange shadow-lg">
              <MailIcon size={18} />
            </div>
            <div>
              <h2 className="text-[11px] font-black text-enba-dark tracking-tight uppercase">E-Posta</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Merkezi Kutu</p>
            </div>
          </div>

          <button
            onClick={() => setShowCompose(true)}
            className="w-full py-3 bg-enba-orange text-white rounded-xl font-black text-[10px] uppercase tracking-[2px] shadow-lg shadow-enba-orange/20 hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 mb-5"
          >
            <PenSquare size={14} /> Yeni E-Posta
          </button>

          <div className="space-y-0.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 px-3 mb-2">Klasörler</p>
            {folders.map(({ id, label, Icon }) => (
              <button
                key={id}
                disabled={id !== 'inbox'}
                onClick={() => id === 'inbox' && setActiveFolder('inbox')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left ${
                  activeFolder === id
                    ? 'bg-enba-dark text-white shadow-md'
                    : id === 'inbox'
                      ? 'text-gray-500 hover:bg-gray-50'
                      : 'text-gray-300 cursor-default'
                }`}
              >
                <Icon size={15} className={activeFolder === id ? 'text-enba-orange' : ''} />
                <span className="text-[11px] font-semibold flex-1">{label}</span>
                {id === 'inbox' && emails.length > 0 && (
                  <span className={`text-[9px] font-black rounded-full px-1.5 py-0.5 ${activeFolder === 'inbox' ? 'bg-enba-orange text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {emails.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Hesaplar */}
        <div className="mt-auto p-4 border-t border-gray-50">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 px-1 mb-2">Hesaplar</p>
          <div className="space-y-1">
            <button
              onClick={() => setSourceFilter(sourceFilter === 'outlook' ? 'all' : 'outlook')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${sourceFilter === 'outlook' ? 'bg-[#0078d4]/10 text-[#0078d4]' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <svg viewBox="0 0 23 23" className="w-3.5 h-3.5 flex-shrink-0">
                <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
                <rect x="12" y="1" width="10" height="10" fill="#7fba00"/>
                <rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>
                <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
              </svg>
              <span className="text-[11px] font-semibold flex-1 text-left">Outlook</span>
              {msConnected
                ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                : <span onClick={e => { e.stopPropagation(); handleConnectMs(); }} className="text-[9px] text-[#0078d4] font-bold hover:underline">Bağla</span>
              }
            </button>
            <button
              onClick={() => setSourceFilter(sourceFilter === 'gmail' ? 'all' : 'gmail')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${sourceFilter === 'gmail' ? 'bg-[#EA4335]/10 text-[#EA4335]' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <svg viewBox="0 0 48 48" className="w-3.5 h-3.5 flex-shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.21 3.22l6.89-6.89C35.83 2.1 30.34 0 24 0 15.02 0 7.3 5.24 3.55 12.9l7.98 6.21C13.34 13.31 18.28 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.65-.15-3.25-.43-4.79H24v9.07h12.65c-.55 2.93-2.2 5.41-4.67 7.07l7.22 5.61C43.36 37.55 46.5 31.5 46.5 24.5z"/>
                <path fill="#FBBC05" d="M11.53 28.51A14.5 14.5 0 0 1 9.5 24c0-1.57.26-3.09.73-4.51L2.25 13.28A23.96 23.96 0 0 0 0 24c0 3.86.91 7.51 2.55 10.73l8.98-6.22z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.92-2.15 15.9-5.85l-7.22-5.61c-2.02 1.36-4.6 2.16-8.68 2.16-5.72 0-10.66-3.81-12.47-9.1l-7.98 6.21C7.3 42.76 15.02 48 24 48z"/>
              </svg>
              <span className="text-[11px] font-semibold flex-1 text-left">Gmail</span>
              {googleConnected
                ? googleNeedsReconnect
                  ? <span onClick={e => { e.stopPropagation(); handleConnectGoogle(); }} className="text-[9px] text-amber-500 font-bold hover:underline">Yenile</span>
                  : <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                : <span onClick={e => { e.stopPropagation(); handleConnectGoogle(); }} className="text-[9px] text-[#EA4335] font-bold hover:underline">Bağla</span>
              }
            </button>
          </div>
        </div>
      </aside>
      )}

      {/* ─── ORTA: E-posta Listesi ────────────────────────── */}
      <div className={`${selectedEmail ? 'w-80 flex-shrink-0' : 'flex-1'} flex flex-col border-r border-gray-100 bg-white overflow-hidden transition-all duration-200`}>
        <header className="h-14 border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex flex-col">
            <h1 className="text-[10px] font-black text-enba-dark tracking-tight uppercase leading-none">Gelen Kutusu</h1>
            <span className="text-[9px] text-gray-400 font-bold mt-0.5">{filteredEmails.length} mesaj</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-gray-50 border-none rounded-lg px-7 py-1.5 text-[10px] font-medium text-enba-dark focus:ring-2 focus:ring-enba-orange/20 w-32 transition-all"
              />
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
            </div>
            <button
              onClick={() => fetchEmails()}
              className={`p-1.5 rounded-lg text-gray-400 hover:text-enba-orange hover:bg-orange-50 transition-all ${isLoading ? 'animate-spin text-enba-orange' : ''}`}
              title="Yenile"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </header>

        {fetchError && (
          <div className="bg-rose-50 border-b border-rose-100 px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <span className="text-rose-400 text-xs flex-shrink-0">⚠</span>
            <span className="text-[10px] text-rose-700 font-medium leading-relaxed flex-1">{fetchError}</span>
            {googleNeedsReconnect && (
              <button
                onClick={handleConnectGoogle}
                className="text-[10px] font-black text-[#4285F4] hover:underline flex-shrink-0 whitespace-nowrap"
              >
                Yeniden Bağlan →
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading && emails.length === 0 ? (
            <div className="flex items-center justify-center p-10">
              <RefreshCw size={20} className="animate-spin text-gray-300" />
            </div>
          ) : !googleConnected && !msConnected && !isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
              <Inbox size={36} className="opacity-20 text-gray-400" />
              <p className="text-[11px] font-bold text-gray-400">Gmail bağlantısı kesildi</p>
              <button
                onClick={handleConnectGoogle}
                className="px-5 py-2.5 bg-[#4285F4] text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow shadow-blue-200 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              >
                <Plug size={13} /> Google ile Yeniden Bağlan
              </button>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-gray-400">
              <Inbox size={40} className="mb-3 opacity-20" />
              <p className="text-[10px] font-bold uppercase tracking-widest">E-Posta Bulunamadı</p>
            </div>
          ) : (
            filteredEmails.map(email => (
              <div
                key={email.id}
                onClick={() => handleOpenEmail(email)}
                className={`group border-b border-gray-50 px-4 py-3.5 cursor-pointer transition-all border-l-2 ${
                  selectedEmail?.id === email.id
                    ? 'bg-enba-orange/5 border-l-enba-orange'
                    : !email.isRead
                      ? 'border-l-enba-orange hover:bg-gray-50'
                      : 'border-l-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] uppercase flex-shrink-0 mt-0.5 ${email.source === 'outlook' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                    {email.source === 'outlook' ? 'O' : 'G'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-xs truncate ${email.isRead ? 'font-medium text-gray-600' : 'font-bold text-enba-dark'}`}>{email.sender}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={e => handleStarEmail(email, e)}
                          title={email.isStarred ? 'Bayraktan çıkar' : 'Bayrakla — görev oluştur'}
                          className={`p-0.5 rounded transition-all ${email.isStarred ? 'opacity-100 text-amber-400' : 'opacity-0 group-hover:opacity-100 text-gray-300 hover:text-amber-400'}`}
                        >
                          <Star size={12} fill={email.isStarred ? 'currentColor' : 'none'} strokeWidth={1.8}/>
                        </button>
                        <span className="text-[9px] text-gray-400 whitespace-nowrap">
                          {new Date(email.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <p className={`text-[11px] truncate mb-0.5 ${email.isRead ? 'text-gray-500' : 'font-semibold text-gray-800'}`}>{email.subject}</p>
                    <p className="text-[10px] text-gray-400 truncate">{email.bodyPreview}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── SAĞ: E-posta Detayı ──────────────────────────── */}
      {selectedEmail ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm uppercase flex-shrink-0 ${selectedEmail.source === 'outlook' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                {selectedEmail.source === 'outlook' ? 'O' : 'G'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-enba-dark truncate">{selectedEmail.sender}</p>
                <p className="text-[10px] text-gray-400">&lt;{selectedEmail.senderEmail}&gt;</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg whitespace-nowrap">
                {new Date(selectedEmail.date).toLocaleString('tr-TR')}
              </span>
              <button
                onClick={e => handleStarEmail(selectedEmail, e)}
                className={`p-1.5 rounded-lg transition-all ${selectedEmail.isStarred ? 'text-amber-400 bg-amber-50' : 'text-gray-400 hover:text-amber-400 hover:bg-amber-50'}`}
                title={selectedEmail.isStarred ? 'Bayraktan çıkar' : 'Bayrakla — görev oluştur'}
              >
                <Star size={16} fill={selectedEmail.isStarred ? 'currentColor' : 'none'} strokeWidth={1.8}/>
              </button>
              <button
                onClick={openTaskModal}
                className="p-1.5 text-gray-400 hover:text-enba-orange hover:bg-orange-50 rounded-lg transition-all"
                title="Görev Oluştur"
              >
                <ListTodo size={16} />
              </button>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1.5 text-gray-400 hover:text-enba-dark hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/50 flex-shrink-0">
            <h2 className="text-base font-bold text-gray-900">{selectedEmail.subject}</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 relative custom-scrollbar">
            {isBodyLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <RefreshCw size={20} className="animate-spin text-enba-orange" />
              </div>
            )}
            <div
              className="text-sm text-gray-700 leading-relaxed max-w-none prose prose-sm prose-a:text-enba-orange"
              dangerouslySetInnerHTML={{ __html: selectedEmail.body || selectedEmail.bodyPreview }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#FAFAFA] text-gray-300">
          <MailIcon size={52} className="mb-4 opacity-20" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Okumak için bir e-posta seçin</p>
        </div>
      )}

      {/* Görev Oluştur Modal */}
      {taskModal && selectedEmail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-enba-dark px-5 py-4 flex items-center justify-between text-white">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <ListTodo size={15} className="text-enba-orange" /> Görev Oluştur
              </h2>
              <button onClick={() => setTaskModal(false)} className="text-white/50 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Başlık</label>
                <input
                  required
                  type="text"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Not</label>
                <textarea
                  value={taskForm.desc}
                  onChange={e => setTaskForm({ ...taskForm, desc: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Öncelik</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Son Tarih</label>
                  <input
                    type="date"
                    value={taskForm.deadline}
                    onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-1">
                <button type="button" onClick={() => setTaskModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-colors">
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSavingTask}
                  className={`px-7 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg flex items-center gap-2 transition-all ${taskSaved ? 'bg-emerald-500' : 'bg-enba-dark hover:bg-black active:scale-95'} ${isSavingTask ? 'opacity-70' : ''}`}
                >
                  {isSavingTask && <RefreshCw size={13} className="animate-spin" />}
                  {taskSaved && <CheckCircle2 size={13} />}
                  {taskSaved ? 'Kaydedildi!' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
};
