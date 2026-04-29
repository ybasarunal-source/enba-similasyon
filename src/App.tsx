import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from './api/i18n';
import { supabase } from './api/supabase';
import { microsoftService } from './api/microsoft';
import { googleService } from './api/google';
import { Login } from './modules/Login';
import type { Session } from '@supabase/supabase-js';
import { profileAPI, type UserProfile } from './api/supabase';
import Dashboard from './modules/Dashboard';
import { Stock } from './modules/Stock';
import { Production } from './modules/Production';
import { Logistics } from './modules/Logistics';
import { HR } from './modules/HR';
import { Archive } from './modules/Archive';
import { Cashflow } from './modules/Cashflow';
import { Machinery } from './modules/Machinery';
import { Tasks } from './modules/Tasks';
import { Licensing } from './modules/Licensing';
import { PnL } from './modules/PnL';
import { Settings } from './modules/Settings';
import { Profile } from './modules/Profile';
import { DetailedPlanManager } from './modules/planning/DetailedPlanManager';
import { FastPlan } from './modules/FastPlan';
import { Calendar as CalendarModule } from './modules/Calendar';
import { Parasut } from './modules/Parasut';
import { ModulesOverview } from './modules/ModulesOverview';
import { Mail } from './modules/Mail';
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
  Mail as MailIcon
} from 'lucide-react';

type ModuleType =
  | 'dashboard' | 'stock' | 'production' | 'logistics' | 'hr'
  | 'archive' | 'cashflow' | 'planning' | 'fastplan' | 'machinery'
  | 'tasks' | 'calendar' | 'licensing' | 'settings' | 'pnl' | 'profile' | 'parasut' | 'modules' | 'mail';

const getProfileAvatar = () => {
  try { return JSON.parse(localStorage.getItem('enba_profile_data') || '{}').avatar || ''; }
  catch { return ''; }
};

export const App: React.FC = () => {
  const { t, language, setLanguage, isLoading } = useTranslation();
  const [activeModule, setActiveModule] = useState<ModuleType>(() => {
    // Redirect sonrası kalınan yerden devam etmek için kontrol
    const saved = sessionStorage.getItem('enba_return_module');
    if (saved) {
      sessionStorage.removeItem('enba_return_module');
      return saved as ModuleType;
    }
    return 'dashboard';
  });
  // Sayfa geçmişi — geri/ileri navigasyon için
  const [history, setHistory] = useState<ModuleType[]>(['dashboard']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profileAvatar, setProfileAvatar] = useState(getProfileAvatar);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('enba_theme') || 'light');
  const [unreadMailCount, setUnreadMailCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('enba_theme', theme);
  }, [theme]);

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

  useEffect(() => {
    if (session) {
      const fetchUnreadCounts = async () => {
        let count = 0;
        try {
          // Sadece daha önce izin verilmişse (sessizce) al, login penceresi açmamak için.
          // microsoftService graph client alırken hata fırlatmaz, token yoksa boş döner.
          const msToken = await microsoftService.getToken(['User.Read', 'Mail.ReadWrite', 'Mail.Send'], true);
          if (msToken) {
            count += await microsoftService.getUnreadCount();
          }
        } catch (e) { /* ignore */ }

        try {
          const gToken = googleService.getAccessToken();
          if (gToken) {
            count += await googleService.getUnreadCount();
          }
        } catch (e) { /* ignore */ }

        setUnreadMailCount(count);
      };

      fetchUnreadCounts();
      const interval = setInterval(fetchUnreadCounts, 120000); // 2 dakikada bir kontrol
      return () => clearInterval(interval);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      setIsProfileLoading(true);
      profileAPI.getMyProfile()
        .then(profile => {
          setUserProfile(profile);
          setIsProfileLoading(false);
        })
        .catch(() => {
          console.warn("Profil yüklenirken hata oluştu, varsayılan görünümle devam ediliyor.");
          setIsProfileLoading(false);
        });
    } else {
      setUserProfile(null);
      setIsProfileLoading(false);
    }
  }, [session]);

  const user = { 
    name: userProfile?.full_name || session?.user?.email?.split('@')[0] || 'User',
    role: userProfile?.role || 'user'
  };

  // Auth veya i18n veya Profil yüklenirken splash
  if (session === undefined || isLoading || isProfileLoading) {
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

  // Giriş yapılmamışsa Login ekranı
  if (!session) return <Login />;

  const menuItems = [
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
    { id: 'logistics',  label: t('modules.logistics'),     icon: Truck },
    { id: 'settings',   label: t('nav.sistem'),            icon: SettingsIcon },
    { id: 'profile',    label: 'Profilim',                 icon: User },
  ].filter(item => {
    // Admin ise her şeyi görür
    if (user.role === 'admin') return true;
    // FALLBACK: Veritabanı hatası (RLS) durumunda oturum varsa tam erişim sağla
    if (!userProfile && session?.user) return true;
    // Core modules always visible, others depend on permissions
    if (item.id === 'profile' || item.id === 'dashboard' || item.id === 'tasks' || item.id === 'calendar' || item.id === 'modules' || item.id === 'mail') return true;
    // Others depend on permissions
    return userProfile?.permissions?.[item.id] === true;
  });

  const navigate = (view: string) => {
    const mod = view as ModuleType;
    if (!mod || mod === activeModule) return;
    
    setActiveModule(mod);
    setProfileAvatar(getProfileAvatar());
    
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
    setProfileAvatar(getProfileAvatar());
  };

  const goForward = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setActiveModule(history[newIndex]);
    setProfileAvatar(getProfileAvatar());
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
        <nav className="flex-1 py-3 overflow-y-auto sidebar-scrollbar flex flex-col gap-0.5 px-2">
          {menuItems.map(item => {
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
            onClick={() => supabase.auth.signOut()}
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
                  {user.name}
                </span>
                <span
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                  className="text-[10px] font-medium text-[var(--enba-orange)] mt-0.5"
                >
                  Platform Yöneticisi
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
                    {user.name}
                  </div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '10px', color: 'var(--enba-orange)', fontWeight: 600 }}>
                    Platform Yöneticisi
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
                  onClick={() => { supabase.auth.signOut(); setUserMenuOpen(false); }}
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

        {/* ─── Module Content ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1200px] mx-auto min-h-full">
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
            {activeModule === 'pnl'        && <PnL />}
            {activeModule === 'settings'   && <Settings profile={userProfile ? { ...userProfile, role: user.role as any } : { role: user.role } as any} />}
            {activeModule === 'fastplan'   && <FastPlan />}
            {activeModule === 'planning'   && <DetailedPlanManager />}
            { activeModule === 'profile'    && <Profile /> }
            { activeModule === 'parasut'    && <Parasut /> }
            { activeModule === 'mail'       && <Mail /> }
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
