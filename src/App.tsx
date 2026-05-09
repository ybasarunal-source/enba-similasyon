import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from './api/i18n';
import { supabase } from './api/supabase';
import { microsoftService } from './api/microsoft';
import { googleService } from './api/google';
import { Login } from './modules/Login';
import type { Session } from '@supabase/supabase-js';
import { profileAPI, companiesAPI, type UserProfile, type UserRole } from './api/supabase';
import { parasutService } from './api/parasut';
import { ErrorBoundary } from './components/ErrorBoundary';

// Modül yükleme hatalarını (chunk load error) yakalayıp sayfayı yenileyen yardımcı fonksiyon
const lazyRetry = (componentImport: () => Promise<any>) => 
  React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error("Kritik modül yükleme hatası, sayfa yenileniyor:", error);
      // Sadece üretim ortamında veya chunk hatasıysa yenile
      window.location.reload();
      return { default: () => <div /> };
    }
  });

const Dashboard         = lazyRetry(() => import('./modules/Dashboard'));
const Stock             = lazyRetry(() => import('./modules/Stock').then(m => ({ default: m.Stock })));
const Production        = lazyRetry(() => import('./modules/Production').then(m => ({ default: m.Production })));
const Logistics         = lazyRetry(() => import('./modules/Logistics').then(m => ({ default: m.Logistics })));
const HR                = lazyRetry(() => import('./modules/HR').then(m => ({ default: m.HR })));
const Archive           = lazyRetry(() => import('./modules/Archive').then(m => ({ default: m.Archive })));
const Cashflow          = lazyRetry(() => import('./modules/Cashflow').then(m => ({ default: m.Cashflow })));
const Machinery         = lazyRetry(() => import('./modules/Machinery').then(m => ({ default: m.Machinery })));
const Tasks             = lazyRetry(() => import('./modules/Tasks').then(m => ({ default: m.Tasks })));
const Licensing         = lazyRetry(() => import('./modules/Licensing').then(m => ({ default: m.Licensing })));
const PnL               = lazyRetry(() => import('./modules/PnL').then(m => ({ default: m.PnL })));
const Settings          = lazyRetry(() => import('./modules/Settings').then(m => ({ default: m.Settings })));
const Profile           = lazyRetry(() => import('./modules/Profile').then(m => ({ default: m.Profile })));
const DetailedPlanManager = lazyRetry(() => import('./modules/planning/DetailedPlanManager').then(m => ({ default: m.DetailedPlanManager })));
const FastPlan          = lazyRetry(() => import('./modules/FastPlan').then(m => ({ default: m.FastPlan })));
const CalendarModule    = lazyRetry(() => import('./modules/Calendar').then(m => ({ default: m.Calendar })));
const Parasut           = lazyRetry(() => import('./modules/Parasut').then(m => ({ default: m.Parasut })));
const ModulesOverview   = lazyRetry(() => import('./modules/ModulesOverview').then(m => ({ default: m.ModulesOverview })));
const Mail              = lazyRetry(() => import('./modules/Mail').then(m => ({ default: m.Mail })));
const FixedExpenses     = lazyRetry(() => import('./modules/FixedExpenses').then(m => ({ default: m.FixedExpenses })));
const SuperAdmin        = lazyRetry(() => import('./modules/SuperAdmin').then(m => ({ default: m.SuperAdmin })));
const CompanyAdmin      = lazyRetry(() => import('./modules/CompanyAdmin').then(m => ({ default: m.CompanyAdmin })));
import {
  Home,
  LayoutGrid,
  Package,
  Factory,
  Truck,
  Contact,
  Archive as ArchiveIcon,
  Coins,
  Zap,
  Wrench,
  ClipboardList,
  FileBadge,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  LogOut,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  Receipt,
  Moon,
  Sun,
  Mail as MailIcon,
  CreditCard,
  Shield
} from 'lucide-react';

type ModuleType =
  | 'dashboard' | 'stock' | 'production' | 'logistics' | 'hr'
  | 'archive' | 'cashflow' | 'planning' | 'fastplan' | 'machinery'
  | 'tasks' | 'calendar' | 'licensing' | 'settings' | 'pnl' | 'profile' | 'parasut' | 'modules' | 'mail' | 'fixedexpenses' | 'super_admin' | 'company_admin';

export const App: React.FC = () => {
  const { t, language, setLanguage, isLoading } = useTranslation();
  const [activeModule, setActiveModule] = useState<ModuleType>(() => {
    // Sayfa yenileme / tarayıcıdan geri dönme sonrası aktif modülü geri yükle
    const returnMod = sessionStorage.getItem('enba_return_module');
    if (returnMod) {
      sessionStorage.removeItem('enba_return_module');
      return returnMod as ModuleType;
    }
    const lastMod = sessionStorage.getItem('enba_active_module');
    if (lastMod) return lastMod as ModuleType;
    return 'dashboard';
  });
  // Sayfa geçmişi — geri/ileri navigasyon için
  const [history, setHistory] = useState<ModuleType[]>(['dashboard']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profileAvatar, setProfileAvatar] = useState('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('enba_theme') || 'light');
  const [unreadMailCount, setUnreadMailCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('enba_theme', theme);
  }, [theme]);

  // Global hata yakalayıcı (Beyaz ekranı önlemek için)
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global Hata:", event.error);
      setRenderError(event.error?.message || "Beklenmedik bir uygulama hatası oluştu.");
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Dışarı tıklayınca menüyü kapat
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Mail okunmamış sayısı: sadece kullanıcı ID değişince yeniden kur (token refresh'te tekrar tetiklenmesin)
  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchUnreadCounts = async () => {
      let count = 0;
      try {
        const msToken = await microsoftService.getToken(['User.Read', 'Mail.ReadWrite', 'Mail.Send']);
        if (msToken) count += await microsoftService.getUnreadCount();
      } catch (e) { /* ignore */ }
      try {
        const gToken = googleService.getAccessToken();
        if (gToken) count += await googleService.getUnreadCount();
      } catch (e) { /* ignore */ }
      setUnreadMailCount(count);
    };
    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 120000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]); // Yalnızca kullanıcı değişince (login/logout) yeniden çalış — token refresh tetiklemez

  // Profil: oturum değişince yükle (basit ve güvenilir)
  useEffect(() => {
    profileAPI.clearCache(); // Oturum değişince eski önbelleği temizle
    if (session?.user) {
      setIsProfileLoading(true);
      setProfileAvatar(session.user.user_metadata?.profile_data?.avatarUrl || '');
      profileAPI.getMyProfile(true) // force fetch
        .then(profile => {
          setUserProfile(profile);
          setProfileLoadError(!profile);
          setIsProfileLoading(false);
          if (profile?.company_id) {
            companiesAPI.getById(profile.company_id).then(c => setCompanyName(c?.name ?? null));
          } else {
            setCompanyName(null);
          }
          if (profile) {
            // Otomatik Entegrasyon Geri Yükleme
            microsoftService.resumeSession(profile);
            googleService.resumeSession(profile);
            parasutService.resumeSession(profile);
          }
        })
        .catch(() => {
          console.warn("Profil yüklenemedi, varsayılan kullanılıyor.");
          setProfileLoadError(true);
          setIsProfileLoading(false);
        });
    } else {
      setUserProfile(null);
      setProfileAvatar('');
      setIsProfileLoading(false);
    }
  }, [session]);

  // Aktif modülü sessionStorage'a kaydet (her değişimde)
  useEffect(() => {
    sessionStorage.setItem('enba_active_module', activeModule);
  }, [activeModule]);

  // Buraya ulaşıldıysa session kesin vardır.
  // Rol: önce DB profili, yoksa session app_metadata, yoksa demo kuralı, son çare 'user'
  const sessionRole = (
    session?.user?.app_metadata?.role ||
    session?.user?.user_metadata?.role
  ) as UserRole | undefined;

  const user = { 
    name: userProfile?.full_name || (session && session.user?.email?.split('@')[0]) || 'User',
    role: (
      userProfile?.role ||
      sessionRole ||
      (session?.user?.email === 'demo@enba.com' ? 'super_admin' : 'user')
    ) as UserRole
  };

  const MENU_GROUPS = [
    { id: 'g1', title: 'Operasyon (Kısayollar)', items: ['modules', 'dashboard', 'tasks', 'calendar', 'mail'] },
    { id: 'g2', title: 'Finans & Muhasebe', items: ['pnl', 'cashflow', 'parasut', 'fixedexpenses'] },
    { id: 'g3', title: 'Üretim & Lojistik', items: ['fastplan', 'planning', 'production', 'stock', 'logistics', 'machinery'] },
    { id: 'g4', title: 'Kurumsal Yönetim', items: ['hr', 'licensing', 'archive'] },
    { id: 'g5', title: 'Sistem', items: ['profile', 'settings'] },
    ...(user.role === 'super_admin' ? [{ id: 'g6', title: 'Yönetim', items: ['super_admin'] }] : []),
    ...(user.role === 'admin' ? [{ id: 'g6', title: 'Yönetim', items: ['company_admin'] }] : [])
  ];

  const rawMenuItems = [
    { id: 'modules',    label: 'Ana Sayfa',                 icon: LayoutGrid },
    { id: 'dashboard',  label: t('nav.home'),              icon: Home },
    { id: 'fastplan',   label: 'Hızlı İş Planı',           icon: Zap },
    { id: 'planning',   label: 'Detaylı İş Planı',          icon: BarChart3 },
    { id: 'pnl',        label: 'P&L Analizi',              icon: BarChart3 },
    { id: 'stock',      label: t('modules.inventory'),     icon: Package },
    { id: 'production', label: t('modules.prod_tracking'), icon: Factory },
    { id: 'hr',         label: t('modules.hr'),            icon: Contact },
    { id: 'archive',    label: t('modules.archive'),       icon: ArchiveIcon },
    { id: 'licensing',  label: t('modules.licensing'),     icon: FileBadge },
    { id: 'cashflow',   label: t('modules.cashflow'),      icon: Coins },
    { id: 'parasut',    label: 'Paraşüt',                  icon: Receipt },
    { id: 'machinery',  label: t('modules.machinery'),     icon: Wrench },
    { id: 'tasks',      label: t('modules.tasks'),         icon: ClipboardList },
    { id: 'calendar',   label: 'Takvim',                   icon: CalendarIcon },
    { id: 'mail',       label: 'E-Posta',                  icon: MailIcon },
    { id: 'fixedexpenses', label: 'Abonelikler/Ödemeler', icon: CreditCard },
    { id: 'logistics',  label: t('modules.logistics'),     icon: Truck },
    { id: 'settings',   label: t('nav.sistem'),            icon: SettingsIcon },
    { id: 'profile',    label: 'Profilim',                 icon: User },
    { id: 'super_admin',   label: 'Sistem Yönetimi',   icon: Shield },
    { id: 'company_admin', label: 'Şirket Yönetimi',   icon: Shield },
  ];

  const allowedItems = rawMenuItems.filter(item => {
    try {
      // Demo kullanıcısı her şeyi görür (Sistem Yönetimi hariç)
      if (session?.user?.email === 'demo@enba.com') {
        return item.id !== 'super_admin';
      }

      // Rol bazlı erişim — rol artık profil yüklenmeden önce de bilinebilir
      if (user.role === 'super_admin' || user.role === 'admin') {
        if (item.id === 'super_admin')   return user.role === 'super_admin';
        if (item.id === 'company_admin') return user.role === 'admin';
        return true;
      }

      // Profil henüz yükleniyorsa (ve rol 'user') temel modülleri göster
      if (isProfileLoading) {
        return ['profile', 'dashboard', 'tasks', 'calendar', 'modules', 'mail', 'fixedexpenses'].includes(item.id);
      }
      
      // Core modules
      if (['profile', 'dashboard', 'tasks', 'calendar', 'modules', 'mail', 'fixedexpenses'].includes(item.id)) return true;
      
      // Yetki kontrolü
      return userProfile?.permissions?.[item.id] === true;
    } catch (e) {
      return false;
    }
  });

  const menuItems = allowedItems;

  // Splash
  if (session === undefined || isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1A1A1A] text-white">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <img src="/icons/logo.png" className="w-24 h-24 object-contain" alt="Enba Logo" />
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '11px', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.4)' }} className="uppercase">
              Recycling Platform
            </div>
          </div>
      </div>
    );
  }

  // Hata ekranı (Eğer render sırasında bir şey patlarsa)
  if (renderError) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-red-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Uygulama Başlatılamadı</h1>
        <p className="bg-black/20 p-4 rounded font-mono text-xs mb-6 max-w-xl overflow-auto">{renderError}</p>
        <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} className="bg-white text-red-900 px-6 py-2 rounded-full font-bold">Uygulamayı Sıfırla ve Yenile</button>
      </div>
    );
  }

  // Giriş yapılmamışsa Login ekranı
  if (!session) return <Login />;

  const navigate = (view: string) => {
    const mod = view as ModuleType;
    if (!mod || mod === activeModule) return;
    
    setActiveModule(mod);
    
    // Geçmişi güvenli bir şekilde güncelle
    setHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), mod];
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  };

  const goBack = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setActiveModule(history[newIndex]);
  };

  const goForward = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setActiveModule(history[newIndex]);
  };

  const canGoBack    = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const activeLabel = menuItems.find(i => i.id === activeModule)?.label ?? '';

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--enba-bg)]">

      {/* ─── Sidebar ────────────────────────────────────── */}
      <aside
        className={`
          enba-sidebar-glass text-white flex flex-col flex-shrink-0
          transition-all duration-500 ease-in-out z-20 overflow-hidden
          ${isSidebarOpen ? 'w-[240px]' : 'w-16'}
        `}
      >
        <div className={`flex items-center flex-shrink-0 border-b border-white/5 relative
          ${isSidebarOpen ? 'px-5 py-5 gap-3' : 'px-0 py-5 justify-center flex-col gap-4'}`}
        >
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <img src="/icons/logo.png" className="w-full h-full object-contain filter drop-shadow-lg" alt="e" />
          </div>
          
          {isSidebarOpen && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, lineHeight: 1, letterSpacing: '-0.01em' }} className="text-[18px] leading-none">
                <span style={{ color: 'var(--enba-orange)' }}>en</span><span style={{ color: 'white' }}>ba</span>
              </div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.18em' }} className="text-[8px] text-gray-400 uppercase leading-none mt-0.5">
                Recycling
              </div>
            </div>
          )}

          {/* Sidebar Toggle — Top Position */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Menüyü Gizle' : 'Menüyü Göster'}
            className={`
              flex items-center justify-center rounded-lg
              text-white/40 hover:text-white transition-all duration-300
              ${isSidebarOpen ? 'absolute right-3 p-1.5 hover:bg-white/10' : 'p-2 bg-white/5 hover:bg-white/10'}
            `}
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 overflow-y-auto sidebar-scrollbar flex flex-col px-2 pb-10">
          {MENU_GROUPS.map((group, gIdx) => {
            const groupItems = group.items
              .map(itemId => allowedItems.find(i => i.id === itemId))
              .filter(Boolean) as typeof allowedItems;

            if (groupItems.length === 0) return null;

            return (
              <div key={group.id} className="mb-3">
                {isSidebarOpen ? (
                  <div className={`px-3 mb-1 text-[9px] font-black uppercase tracking-[2px] text-white/30 ${gIdx === 0 ? 'mt-0' : 'mt-2'}`}>
                    {group.title}
                  </div>
                ) : (
                  gIdx > 0 && <div className="w-6 mx-auto h-[1px] bg-white/10 my-3 rounded-full" />
                )}
                
                <div className="flex flex-col gap-0.5">
                  {groupItems.map(item => {
                    const active = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        title={!isSidebarOpen ? item.label : ''}
                        className={`
                          group relative flex items-center rounded-xl transition-all duration-200
                          ${isSidebarOpen ? 'px-3 py-2.5 gap-3' : 'px-0 py-2.5 justify-center'}
                          ${active
                            ? 'bg-white/10 text-white'
                            : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'}
                        `}
                      >
                        {/* Active indicator */}
                        {active && (
                          <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[var(--enba-orange)] rounded-full" />
                        )}

                        {/* Icon */}
                        <item.icon
                          size={18}
                          className={`flex-shrink-0 transition-colors ${active ? 'text-[var(--enba-orange)]' : ''}`}
                        />

                        {/* Label — only when open */}
                        {isSidebarOpen && (
                          <span
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                            className={`text-[12px] font-medium truncate transition-colors ${active ? 'text-white' : ''}`}
                          >
                            {item.label}
                          </span>
                        )}

                        {/* Tooltip when closed */}
                        {!isSidebarOpen && (
                          <div className="
                            absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
                            bg-gray-900 text-white text-xs font-medium whitespace-nowrap
                            pointer-events-none opacity-0 group-hover:opacity-100
                            transition-opacity duration-150 z-50 shadow-xl
                            border border-white/5
                          "
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                          >
                            {item.label}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`border-t border-white/5 py-4 px-3 flex flex-col gap-2`}>
          {isSidebarOpen && (
            <button
              onClick={() => setLanguage(language === 'TR' ? 'EN' : 'TR')}
              style={{ fontFamily: "'Poppins', sans-serif" }}
              className="px-3 py-1 mb-1 text-[9px] font-bold text-white/30 hover:text-white/60 transition-colors text-left tracking-widest uppercase"
            >
              {language === 'TR' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
            </button>
          )}
          <button
            onClick={() => {
              microsoftService.clearStorage();
              googleService.logout();
              supabase.auth.signOut();
            }}
            title="Çıkış Yap"
            className={`
              flex items-center rounded-xl py-3 transition-all duration-300
              ${isSidebarOpen ? 'px-4 gap-3 bg-red-500/5 hover:bg-red-500/10 text-red-500/70 hover:text-red-500' : 'px-0 justify-center text-gray-500 hover:text-red-500 hover:bg-red-500/10'}
            `}
          >
            <LogOut size={16} />
            {isSidebarOpen && (
              <span style={{ fontFamily: "'Poppins', sans-serif" }} className="text-[12px] font-semibold">
                Çıkış Yap
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* ─── Top Header ─────────────────────────────────── */}
        <header className="h-13 bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0 z-10 transition-colors dark:bg-[#0F172A] dark:border-white/5" style={{ height: '52px' }}>
          {/* Sol: Geri/İleri + Breadcrumb */}
          <div className="flex items-center gap-3">

            {/* Geri / İleri butonları */}
            <div className="flex items-center gap-1">
              <button
                onClick={goBack}
                disabled={!canGoBack}
                title="Geri"
                style={{
                  width: '28px', height: '28px', borderRadius: '8px', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: canGoBack ? 'pointer' : 'default',
                  background: canGoBack ? 'rgba(0,0,0,0.05)' : 'transparent',
                  color: canGoBack ? '#374151' : '#d1d5db',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (canGoBack) e.currentTarget.style.background = 'rgba(0,0,0,0.09)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = canGoBack ? 'rgba(0,0,0,0.05)' : 'transparent'; }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={goForward}
                disabled={!canGoForward}
                title="İleri"
                style={{
                  width: '28px', height: '28px', borderRadius: '8px', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: canGoForward ? 'pointer' : 'default',
                  background: canGoForward ? 'rgba(0,0,0,0.05)' : 'transparent',
                  color: canGoForward ? '#374151' : '#d1d5db',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (canGoForward) e.currentTarget.style.background = 'rgba(0,0,0,0.09)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = canGoForward ? 'rgba(0,0,0,0.05)' : 'transparent'; }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Ayraç */}
            <div style={{ width: '1px', height: '16px', background: '#e5e7eb' }} />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('modules')}
                style={{ fontFamily: "'Poppins', sans-serif" }}
                className="text-[11px] font-medium text-gray-400 hover:text-[var(--enba-orange)] transition-colors uppercase tracking-widest"
              >
                Enba
              </button>
              <ChevronRight size={12} className="text-gray-300" />
              <button
                style={{ fontFamily: "'Poppins', sans-serif" }}
                className="text-[12px] font-bold text-[var(--enba-dark)] cursor-default"
              >
                {activeLabel}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* E-Posta Bildirimi */}
            <button
              onClick={() => navigate('mail')}
              className="relative p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-[var(--enba-orange)] transition-all dark:bg-white/5 dark:text-gray-500"
              title="Gelen Kutusu"
            >
              <MailIcon size={18} />
              {unreadMailCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0F172A]">
                  {unreadMailCount > 99 ? '99+' : unreadMailCount}
                </span>
              )}
            </button>

            {/* Tema Değiştirici */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-[var(--enba-orange)] transition-all dark:bg-white/5 dark:text-gray-500"
              title={theme === 'light' ? 'Karanlık Mod' : 'Aydınlık Mod'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* User area — dropdown menu */}
            <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              title="Hesap Menüsü"
            >
              <div className="flex flex-col items-end">
                <span
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                  className="text-[12px] font-semibold text-[var(--enba-dark)] leading-none"
                >
                  {user?.name || 'User'}
                </span>
                <span
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                  className="text-[10px] font-medium text-[var(--enba-orange)] mt-0.5"
                >
                  {user.role === 'super_admin' ? 'Sistem Yöneticisi' : (companyName ?? 'Şirket bilgisi yükleniyor…')}
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 relative flex-shrink-0">
                {profileAvatar
                  ? <img src={profileAvatar} className="w-full h-full object-cover" />
                  : <User size={16} className="text-gray-400" />}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow" />
              </div>
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '14px',
                padding: '6px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                minWidth: '200px',
                zIndex: 999,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                {/* Kullanıcı bilgisi */}
                <div style={{
                  padding: '10px 12px 8px',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  marginBottom: '4px'
                }}>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '13px', color: '#1a1a2e' }}>
                    {user?.name || 'User'}
                  </div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '10px', color: 'var(--enba-orange)', fontWeight: 600 }}>
                    {user.role === 'super_admin' ? 'Sistem Yöneticisi' : (companyName ?? 'Şirket bilgisi yükleniyor…')}
                  </div>
                </div>

                {/* Profili Düzenle */}
                <button
                  onClick={() => { setActiveModule('profile'); setUserMenuOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px', borderRadius: '9px', border: 'none',
                    background: 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left',
                    fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: 600,
                    color: '#374151', transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <User size={14} style={{ color: '#6b7280' }} />
                  Profili Düzenle
                </button>

                {/* Ayarlara Git */}
                <button
                  onClick={() => { setActiveModule('settings'); setUserMenuOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px', borderRadius: '9px', border: 'none',
                    background: 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left',
                    fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: 600,
                    color: '#374151', transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <SlidersHorizontal size={14} style={{ color: '#6b7280' }} />
                  Ayarlara Git
                </button>

                {/* Ayraç */}
                <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

                {/* Oturumu Kapat */}
                <button
                  onClick={() => { 
                    microsoftService.clearStorage();
                    googleService.logout();
                    supabase.auth.signOut(); 
                    setUserMenuOpen(false); 
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px', borderRadius: '9px', border: 'none',
                    background: 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left',
                    fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: 600,
                    color: '#ef4444', transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={14} />
                  Oturumu Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

        {/* ─── Profil Hata Bandı ───────────────────────────── */}
        {profileLoadError && !isProfileLoading && (
          <div className="flex items-center justify-between bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/40 dark:text-amber-300">
            <span>Profil yüklenemedi — menü kısıtlı görünüyor olabilir.</span>
            <button
              onClick={() => {
                setProfileLoadError(false);
                setIsProfileLoading(true);
                profileAPI.getMyProfile(true)
                  .then(p => { setUserProfile(p); setProfileLoadError(!p); setIsProfileLoading(false); })
                  .catch(() => { setProfileLoadError(true); setIsProfileLoading(false); });
              }}
              className="ml-4 underline font-medium hover:text-amber-900 dark:hover:text-amber-200"
            >
              Yeniden dene
            </button>
          </div>
        )}

        {/* ─── Module Content ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1200px] mx-auto min-h-full">
            <ErrorBoundary>
              <React.Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-2 border-enba-orange border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                {activeModule === 'modules'    && <ModulesOverview key="v1.3" navigate={navigate} menuItems={menuItems} />}
                {activeModule === 'dashboard'  && <Dashboard navigate={navigate} user={{ name: 'Admin' }} />}
                {activeModule === 'stock'      && <Stock />}
                {activeModule === 'production' && <Production />}
                {activeModule === 'logistics'  && <Logistics />}
                {activeModule === 'hr'         && <HR />}
                {activeModule === 'archive'    && <Archive />}
                {activeModule === 'cashflow'   && <Cashflow aktifPlanlar={JSON.parse(localStorage.getItem('enba_detailed_plans') || '[]')} />}
                {activeModule === 'machinery'  && <Machinery />}
                {activeModule === 'tasks'      && <Tasks />}
                {activeModule === 'calendar'   && <CalendarModule />}
                {activeModule === 'licensing'  && <Licensing />}
                {activeModule === 'settings'   && <Settings profile={userProfile ? { ...userProfile, role: user.role } : { role: user.role } as any} />}
                {activeModule === 'profile'    && <Profile />}
                {activeModule === 'mail'       && <Mail />}
                {activeModule === 'fixedexpenses' && <FixedExpenses />}
                {activeModule === 'super_admin'   && <SuperAdmin />}
                {activeModule === 'company_admin' && <CompanyAdmin />}
                {activeModule === 'pnl'      && <PnL />}
                {activeModule === 'fastplan' && <FastPlan />}
                {activeModule === 'planning' && <DetailedPlanManager />}
                {activeModule === 'parasut'  && <Parasut />}
              </React.Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
