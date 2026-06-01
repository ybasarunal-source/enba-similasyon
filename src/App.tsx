import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from './api/i18n';
import { supabase } from './api/supabase';
import { microsoftService } from './api/microsoft';
import { googleService } from './api/google';
import { Login } from './modules/Login';
import type { Session } from '@supabase/supabase-js';
import { profileAPI, companiesAPI, tasksAPI, type UserProfile, type UserRole } from './api/supabase';
import { parasutService } from './api/parasut';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DerenEasterEgg } from './components/DerenEasterEgg';
import { parasutExporter, type ExportState } from './api/parasutExporter';

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
const DetailedPlanModule  = lazyRetry(() => import('./modules/detailedplan/DetailedPlanModule').then(m => ({ default: m.DetailedPlanModule })));
const FastPlan          = lazyRetry(() => import('./modules/FastPlan').then(m => ({ default: m.FastPlan })));
const CalendarModule    = lazyRetry(() => import('./modules/Calendar').then(m => ({ default: m.Calendar })));
const Parasut           = lazyRetry(() => import('./modules/Parasut').then(m => ({ default: m.Parasut })));
const ModulesOverview   = lazyRetry(() => import('./modules/ModulesOverview').then(m => ({ default: m.ModulesOverview })));
const Mail              = lazyRetry(() => import('./modules/Mail').then(m => ({ default: m.Mail })));
const FixedExpenses     = lazyRetry(() => import('./modules/FixedExpenses').then(m => ({ default: m.FixedExpenses })));
const SuperAdmin        = lazyRetry(() => import('./modules/SuperAdmin').then(m => ({ default: m.SuperAdmin })));
const SektorNot         = lazyRetry(() => import('./modules/SektorNot').then(m => ({ default: m.SektorNot })));
const CompanyAdmin      = lazyRetry(() => import('./modules/CompanyAdmin').then(m => ({ default: m.CompanyAdmin })));
const Notes             = lazyRetry(() => import('./modules/Notes').then(m => ({ default: m.Notes })));
const Ayarlar           = lazyRetry(() => import('./modules/Ayarlar').then(m => ({ default: m.Ayarlar })));
const VarlikTakibi      = lazyRetry(() => import('./modules/VarlikTakibi').then(m => ({ default: m.VarlikTakibi })));
const KurulumNakit      = lazyRetry(() => import('./modules/KurulumNakit').then(m => ({ default: m.KurulumNakit })));
import type { LucideIcon } from 'lucide-react';
import {
  Home,
  LayoutGrid,
  Package,
  Factory,
  Truck,
  Archive as ArchiveIcon,
  Coins,
  Zap,
  Wrench,
  FileBadge,
  Settings as SettingsIcon,
  NotebookPen,
  User,
  BarChart3,
  LineChart,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  LogOut,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  Receipt,
  Moon,
  Sun,
  Mail as MailIcon,
  CreditCard,
  Shield,
  ShieldCheck,
  Building2,
  Building,
  Timer,
  Upload,
  Loader2,
  Landmark,
  Users,
  MessageSquare,
  CheckSquare,
  ClipboardList,
  Briefcase,
  Banknote,
  Boxes,
  CircleUser,
  BookOpen,
  WifiOff,
  X,
} from 'lucide-react';

type ModuleType =
  | 'dashboard' | 'stock' | 'production' | 'logistics' | 'hr'
  | 'archive' | 'cashflow' | 'planning' | 'fastplan' | 'machinery'
  | 'tasks' | 'calendar' | 'licensing' | 'settings' | 'ayarlar' | 'varlik' | 'kurulusnakit' | 'pnl' | 'profile' | 'parasut' | 'modules' | 'mail' | 'fixedexpenses' | 'notes' | 'super_admin' | 'company_admin' | 'sektor_not';

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
  // Modül-içi geri navigasyonu — aktif modül kendi geri işleyicisini buraya kaydedebilir
  const backOverrideRef = useRef<(() => boolean) | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  // Alt menüsü açık olan sanal parent item'lar — hem açık hem kapalı sidebar'da
  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<string>>(new Set());
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
  const [overdueTaskCount, setOverdueTaskCount] = useState(0);
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const [gmailDisconnectBanner, setGmailDisconnectBanner] = useState(false);
  const [gmailConnectPrompt, setGmailConnectPrompt] = useState(false);

  // ── Global Pomodoro ───────────────────────────────────────
  const [pomSecs, setPomSecs] = useState<number>(() => {
    try {
      const s = localStorage.getItem('enba_pomodoro_active');
      if (s) { const { startedAt, totalSecs } = JSON.parse(s); const r = totalSecs - Math.floor((Date.now()-startedAt)/1000); if (r>0) return r; }
    } catch {}
    return 25*60;
  });
  const [pomRunning, setPomRunning] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem('enba_pomodoro_active');
      if (s) { const { startedAt, totalSecs } = JSON.parse(s); return Math.floor((Date.now()-startedAt)/1000) < totalSecs; }
    } catch {}
    return false;
  });
  const [pomMode, setPomMode] = useState<'work'|'break'>(() => {
    try { const s = localStorage.getItem('enba_pomodoro_active'); if (s) return JSON.parse(s).mode ?? 'work'; } catch {}
    return 'work';
  });
  const [pomPanelOpen, setPomPanelOpen] = useState(false);
  const [exportState, setExportState]   = useState<ExportState | null>(() => parasutExporter.getState());
  useEffect(() => parasutExporter.subscribe(setExportState), []);
  const [pomEnabled, setPomEnabled]     = useState<boolean>(() => {
    const v = localStorage.getItem('enba_pomodoro_enabled');
    return v === null ? true : v === 'true';
  });

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
    // Google OAuth redirect'ten döndüysek token hash'te gelir — hemen kaydet
    googleService.handleAuthReturn();

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

  // Görev sayaçları: gecikmiş + toplam açık — 5 dakikada bir günceller
  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchTaskCounts = async () => {
      try {
        const all = await tasksAPI.getAll();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const open = all.filter(t => t.status !== 'done');
        const overdue = open.filter(t => t.deadline && new Date(t.deadline) < today);
        setOpenTaskCount(open.length);
        setOverdueTaskCount(overdue.length);
      } catch { /* ağ hatası — sayaçları sıfırla */ }
    };
    fetchTaskCounts();
    const iv = setInterval(fetchTaskCounts, 300_000); // 5 dk
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

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
            // Google token'ı Supabase'e sync et (yeni token varsa)
            const lsToken = localStorage.getItem('google_access_token');
            const lsExpiry = localStorage.getItem('google_token_expiry');
            if (lsToken && lsExpiry && Date.now() < parseInt(lsExpiry)) {
              if (profile.google_data?.expiry !== lsExpiry) {
                profileAPI.updateProfile(session!.user.id, {
                  google_data: { token: lsToken, expiry: lsExpiry },
                });
              }
            }
            // Gmail bağlantı durumu uyarıları
            const everConnected = !!localStorage.getItem('google_ever_connected');
            const tokenValid = !!googleService.getAccessToken();
            if (everConnected && !tokenValid) {
              setGmailDisconnectBanner(true);
            } else if (!everConnected && !localStorage.getItem('enba_gmail_prompt_dismissed')) {
              setGmailConnectPrompt(true);
            }
            if (profile.company_id) {
              parasutService.loadTokenFromSupabase(profile.company_id).then(restored => {
                if (!restored) parasutService.resumeSession(profile);
              });
            } else {
              parasutService.resumeSession(profile);
            }
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

  // Aktif modül sanal bir parent'ın alt öğesiyse, o parent'ın sub-menüsünü aç
  useEffect(() => {
    const ALL_VP = [
      { id: 'iletisim',  children: ['mail', 'tasks', 'notes', 'calendar'] },
      { id: 'isplani',   children: ['fastplan', 'planning'] },
      { id: 'finans',    children: ['pnl', 'cashflow', 'parasut', 'fixedexpenses', 'varlik', 'kurulusnakit'] },
      { id: 'operasyon', children: ['stock', 'production', 'logistics', 'machinery'] },
      { id: 'kurumsal',  children: ['hr', 'licensing', 'archive'] },
      { id: 'sistem',    children: ['ayarlar', 'settings', 'profile'] },
      { id: 'yonetim',   children: ['super_admin', 'company_admin'] },
    ];
    ALL_VP.forEach(vp => {
      if (vp.children.includes(activeModule)) {
        setExpandedSubmenus(prev => {
          if (prev.has(vp.id)) return prev;
          const next = new Set(prev);
          next.add(vp.id);
          return next;
        });
      }
    });
  }, [activeModule]);

  // Aktif modülü sessionStorage'a kaydet (her değişimde)
  useEffect(() => {
    sessionStorage.setItem('enba_active_module', activeModule);
  }, [activeModule]);

  // ── Pomodoro timer interval ───────────────────────────────
  useEffect(() => {
    if (!pomRunning) return;
    const i = setInterval(() => setPomSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, [pomRunning]);

  // ── Pomodoro localStorage sync (running değişince kaydet) ─
  useEffect(() => {
    if (pomRunning) {
      localStorage.setItem('enba_pomodoro_active', JSON.stringify({ startedAt: Date.now(), totalSecs: pomSecs, mode: pomMode }));
    } else {
      localStorage.removeItem('enba_pomodoro_active');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomRunning]);

  // ── Pomodoro end sound ────────────────────────────────────
  useEffect(() => {
    if (pomSecs === 0 && pomRunning) {
      setPomRunning(false);
      try {
        const ctx = new AudioContext();
        [0, 0.4, 0.8].forEach(delay => {
          const osc = ctx.createOscillator(); const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.type = 'sine'; osc.frequency.value = 880;
          const t = ctx.currentTime + delay;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.25, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
          osc.start(t); osc.stop(t + 0.3);
        });
      } catch { /* ignore */ }
    }
  }, [pomSecs, pomRunning]);

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

  // Sanal üst menü öğeleri — kendi modülleri yoktur, alt öğelerini açar/kapar
  // Başlangıçta hepsi kapalı; aktif modül bir grubun alt öğesiyse o grup otomatik açılır
  const VIRTUAL_PARENTS = [
    { id: 'iletisim',  label: 'İletişim & Görev', icon: MessageSquare, children: ['mail', 'tasks', 'notes', 'calendar']              as string[] },
    { id: 'isplani',   label: 'İş Planı',          icon: Briefcase,     children: ['fastplan', 'planning']                            as string[] },
    { id: 'finans',    label: 'Finans',             icon: Banknote,      children: ['pnl', 'cashflow', 'parasut', 'fixedexpenses', 'varlik', 'kurulusnakit'] as string[] },
    { id: 'operasyon', label: 'Operasyon',          icon: Boxes,         children: ['stock', 'production', 'logistics', 'machinery']   as string[] },
    { id: 'kurumsal',  label: 'Kurumsal',           icon: Building,      children: ['hr', 'licensing', 'archive']                     as string[] },
    { id: 'sistem',    label: 'Sistem',             icon: CircleUser,    children: ['ayarlar', 'settings', 'profile']                 as string[] },
    { id: 'yonetim',   label: 'Yönetim',            icon: ShieldCheck,   children: ['super_admin', 'company_admin']                   as string[] },
  ] as const;

  // İki grup: üstte tek navigasyon items, altta tüm sanal parent'lar
  const MENU_GROUPS = [
    { id: 'g0', title: '', items: ['modules', 'dashboard', 'sektor_not'] },
    { id: 'g1', title: '', items: ['iletisim', 'isplani', 'finans', 'operasyon', 'kurumsal', 'sistem', 'yonetim'] },
  ];

  const rawMenuItems = [
    { id: 'modules',      label: 'Ana Sayfa',         icon: LayoutGrid     },
    { id: 'dashboard',    label: 'Gösterge Paneli',   icon: Home           },
    // İletişim alt-öğeleri — sanal parent 'iletisim' altında render edilir
    { id: 'mail',         label: 'E-Posta',           icon: MailIcon       },
    { id: 'tasks',        label: 'Yapılacaklar',      icon: CheckSquare    },
    { id: 'notes',        label: 'Notlar',            icon: NotebookPen    },
    { id: 'calendar',     label: 'Takvim',            icon: CalendarIcon   },
    // İş Planı
    { id: 'fastplan',     label: 'Hızlı Plan',        icon: Zap            },
    { id: 'planning',     label: 'Detaylı Plan',      icon: LineChart      },
    // Finans
    { id: 'pnl',          label: 'P&L Analizi',       icon: TrendingUp     },
    { id: 'cashflow',     label: 'Nakit Planlama',    icon: Coins          },
    { id: 'parasut',      label: 'Paraşüt',           icon: Receipt        },
    { id: 'fixedexpenses',label: 'Abonelikler',       icon: CreditCard     },
    { id: 'varlik',       label: 'Varlık Takibi',     icon: Landmark       },
    { id: 'kurulusnakit', label: 'Nakit Akışı',       icon: Banknote       },
    // Operasyon
    { id: 'stock',        label: 'Stok',              icon: Package        },
    { id: 'production',   label: 'Üretim',            icon: Factory        },
    { id: 'logistics',    label: 'Lojistik',          icon: Truck          },
    { id: 'machinery',    label: 'Makine Bakım',      icon: Wrench         },
    // Kurumsal
    { id: 'hr',           label: 'İnsan Kaynakları',  icon: Users          },
    { id: 'licensing',    label: 'Lisanslama',        icon: FileBadge      },
    { id: 'archive',      label: 'Arşiv',             icon: ArchiveIcon    },
    // Sistem
    { id: 'ayarlar',      label: 'Fin. Kategoriler',  icon: SlidersHorizontal },
    { id: 'settings',     label: 'Ayarlar',           icon: SettingsIcon   },
    { id: 'profile',      label: 'Profilim',          icon: User           },
    // Yönetim
    { id: 'super_admin',  label: 'Sistem Yönetimi',   icon: Shield         },
    { id: 'sektor_not',   label: 'Sektör Bilgi Bankası', icon: BookOpen     },
    { id: 'company_admin',label: 'Şirket Yönetimi',   icon: Building2      },
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
        return ['profile', 'dashboard', 'tasks', 'notes', 'calendar', 'modules', 'mail', 'fixedexpenses'].includes(item.id);
      }
      
      // Core modules (sektor_not herkese açık — ücretsiz bilgi bankası)
      if (['profile', 'dashboard', 'tasks', 'notes', 'calendar', 'modules', 'mail', 'fixedexpenses', 'sektor_not'].includes(item.id)) return true;

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
    // Modül-içi override: ör. DetailedPlan shell/wizard → plan listesine dön
    if (backOverrideRef.current?.()) return;
    // Başka modüldeyse → her zaman dashboard'a dön (üst menü)
    if (activeModule === 'dashboard') return;
    setActiveModule('dashboard');
    sessionStorage.setItem('enba_active_module', 'dashboard');
  };

  const goForward = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setActiveModule(history[newIndex]);
  };

  const canGoBack    = activeModule !== 'dashboard';
  const canGoForward = historyIndex < history.length - 1;

  const activeLabel = menuItems.find(i => i.id === activeModule)?.label ?? '';

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--enba-bg)]">

      {/* ─── Sidebar ────────────────────────────────────── */}
      <aside
        className={`
          enba-sidebar-glass text-white flex flex-col flex-shrink-0
          transition-all duration-500 ease-in-out z-20 overflow-hidden relative
          ${isSidebarOpen ? 'w-[240px]' : expandedSubmenus.size > 0 ? 'w-[72px]' : 'w-16'}
          ${!isSidebarOpen ? 'border-r-2 border-[var(--enba-orange)]/40' : ''}
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
              flex items-center justify-center rounded-lg transition-all duration-300
              ${isSidebarOpen
                ? 'absolute right-3 p-1.5 text-white/40 hover:text-white hover:bg-white/10'
                : 'p-2 text-[var(--enba-orange)] bg-[var(--enba-orange)]/10 hover:bg-[var(--enba-orange)]/20 ring-1 ring-[var(--enba-orange)]/30'}
            `}
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 overflow-y-auto sidebar-scrollbar flex flex-col px-2 pb-10">
          {MENU_GROUPS.map((group, gIdx) => {
            // Grup item'larını çöz: sanal parent'lar da dahil
            const groupItems = group.items
              .map(itemId => {
                const vp = VIRTUAL_PARENTS.find(vp => vp.id === itemId);
                if (vp) return { id: vp.id, label: vp.label, icon: vp.icon as LucideIcon, _isVirtual: true as const, _children: vp.children as string[] };
                const real = allowedItems.find(i => i.id === itemId);
                if (real) return { ...real, _isVirtual: false as const, _children: [] as string[] };
                return null;
              })
              .filter(Boolean) as { id: string; label: string; icon: LucideIcon; _isVirtual: boolean; _children: string[] }[];

            if (groupItems.length === 0) return null;

            const isCollapsed = collapsedGroups.has(group.id);
            const toggleCollapse = () => setCollapsedGroups(prev => {
              const next = new Set(prev);
              next.has(group.id) ? next.delete(group.id) : next.add(group.id);
              return next;
            });

            // Alt öğe badge'leri — unread mail + gecikmiş görev
            const NAV_BADGES: Record<string, { count: number; color: string }> = {};
            if (unreadMailCount > 0)  NAV_BADGES['mail']  = { count: unreadMailCount,  color: 'bg-red-500'   };
            if (overdueTaskCount > 0) NAV_BADGES['tasks'] = { count: overdueTaskCount, color: 'bg-amber-500' };

            const renderNavBtn = (item: { id: string; label: string; icon: LucideIcon }, opts?: { indent?: boolean }) => {
              const active = activeModule === item.id;
              const badge = NAV_BADGES[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  title={!isSidebarOpen ? item.label : ''}
                  className={[
                    'group relative flex items-center rounded-xl transition-all duration-200',
                    isSidebarOpen
                      ? `${opts?.indent ? 'pl-8 pr-3' : 'px-3'} py-2 gap-3`
                      : 'px-0 py-2.5 justify-center',
                    active ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-200',
                  ].join(' ')}
                >
                  {active && <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-[var(--enba-orange)] rounded-full" />}
                  {/* İkon — sidebar kapalıyken badge ikon üzerinde */}
                  <div className="relative flex-shrink-0">
                    <item.icon size={opts?.indent ? 14 : 17} className={`transition-colors ${active ? 'text-[var(--enba-orange)]' : opts?.indent ? 'opacity-60' : ''}`} />
                    {!isSidebarOpen && badge && (
                      <span className={`absolute -top-1.5 -right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full ${badge.color} px-0.5 text-[8px] font-bold text-white`}>
                        {badge.count > 9 ? '9+' : badge.count}
                      </span>
                    )}
                  </div>
                  {isSidebarOpen && (
                    <>
                      <span style={{ fontFamily: "'Poppins', sans-serif" }}
                        className={`flex-1 text-[12px] font-medium truncate transition-colors ${opts?.indent ? 'text-[11px]' : ''} ${active ? 'text-white' : ''}`}>
                        {item.label}
                      </span>
                      {badge && (
                        <span className={`flex-shrink-0 flex h-4 min-w-[16px] items-center justify-center rounded-full ${badge.color} px-1 text-[9px] font-bold text-white`}>
                          {badge.count > 99 ? '99+' : badge.count}
                        </span>
                      )}
                    </>
                  )}
                  {!isSidebarOpen && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-xl border border-white/5"
                      style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {item.label}
                    </div>
                  )}
                </button>
              );
            };

            return (
              <div key={group.id} className={gIdx === 0 ? 'mb-1' : 'mb-1'}>
                {/* Grup başlığı — boş title ise gösterme */}
                {isSidebarOpen && group.title && (
                  <button
                    onClick={toggleCollapse}
                    className={`w-full flex items-center justify-between px-3 mb-1 mt-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/25 hover:text-white/50 transition-colors`}
                  >
                    <span>{group.title}</span>
                    {isCollapsed ? <ChevronRight size={9} /> : <ChevronDown size={9} />}
                  </button>
                )}
                {!isSidebarOpen && gIdx > 0 && (
                  <div className="w-5 mx-auto h-[1px] bg-white/8 my-2.5 rounded-full" />
                )}

                {!isCollapsed && (
                  <div className="flex flex-col gap-0.5">
                    {groupItems.map(item => {
                      if (!item._isVirtual) return renderNavBtn(item);

                      // ── Sanal parent (İletişim & Görev vb.) ──
                      const isExpanded = expandedSubmenus.has(item.id);
                      const childItems = item._children
                        .map(cid => allowedItems.find(a => a.id === cid))
                        .filter(Boolean) as typeof allowedItems;
                      // İzinli alt öğe yoksa parent'ı hiç gösterme (ör. yönetim non-admin için)
                      if (childItems.length === 0) return null;
                      const anyChildActive = childItems.some(c => activeModule === c.id);

                      return (
                        <div key={item.id}>
                          {/* Parent satırı */}
                          <button
                            onClick={() => {
                              const expanding = !expandedSubmenus.has(item.id);
                              setExpandedSubmenus(prev => {
                                const next = new Set(prev);
                                expanding ? next.add(item.id) : next.delete(item.id);
                                return next;
                              });
                              // Açılırken ve grubun hiçbir çocuğu aktif değilse → ilk çocuğa git
                              // Bu sayede çubuk anında eski konumdan buraya taşınır
                              if (expanding && !anyChildActive && childItems.length > 0) {
                                navigate(childItems[0].id as ModuleType);
                              }
                            }}
                            title={!isSidebarOpen ? item.label : ''}
                            className={[
                              'group relative w-full flex items-center rounded-xl transition-all duration-200',
                              isSidebarOpen ? 'px-3 py-2 gap-3' : 'px-0 py-2.5 justify-center',
                              anyChildActive ? 'text-white' : 'text-white/50 hover:text-white/80',
                            ].join(' ')}
                          >
                            {anyChildActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-[var(--enba-orange)] rounded-full" />}
                            {/* İkon — chip arka planlı, sidebar kapalıyken badge ikon üstünde */}
                            <div className={[
                              'relative flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-200',
                              anyChildActive
                                ? 'bg-[var(--enba-orange)]/20'
                                : 'bg-white/[0.08] group-hover:bg-white/[0.13]',
                            ].join(' ')}>
                              <item.icon size={15} className={anyChildActive ? 'text-[var(--enba-orange)]' : 'text-white/70'} />
                              {!isSidebarOpen && item.id === 'iletisim' && (unreadMailCount + overdueTaskCount) > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[var(--enba-orange)] px-0.5 text-[8px] font-bold text-white">
                                  {(unreadMailCount + overdueTaskCount) > 9 ? '9+' : unreadMailCount + overdueTaskCount}
                                </span>
                              )}
                            </div>
                            {isSidebarOpen && (
                              <>
                                <span style={{ fontFamily: "'Poppins', sans-serif" }}
                                  className={`flex-1 text-left text-[12px] font-medium truncate ${anyChildActive ? 'text-white' : ''}`}>
                                  {item.label}
                                </span>
                                {/* İletişim & Görev toplam badge: okunmamış + gecikmiş */}
                                {item.id === 'iletisim' && (unreadMailCount + overdueTaskCount) > 0 && (
                                  <span className="flex-shrink-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--enba-orange)] px-1 text-[9px] font-bold text-white mr-1">
                                    {(unreadMailCount + overdueTaskCount) > 99 ? '99+' : unreadMailCount + overdueTaskCount}
                                  </span>
                                )}
                                {/* Tüm gruplarda toplam open görev + okunmamış mail toplamı ikon üzerinde (sidebar kapalıyken) */}
                                <ChevronRight size={12} className={`opacity-40 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                              </>
                            )}
                            {!isSidebarOpen && (
                              <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-xl border border-white/5"
                                style={{ fontFamily: "'Poppins', sans-serif" }}>
                                {item.label}
                              </div>
                            )}
                          </button>

                          {/* Alt öğeler — açık sidebar'da indentli + etiketli liste */}
                          {isSidebarOpen && isExpanded && childItems.length > 0 && (
                            <div className="flex flex-col gap-0.5 mt-0.5 ml-1 pl-3 border-l border-white/8">
                              {childItems.map(child => renderNavBtn(child, { indent: true }))}
                            </div>
                          )}

                          {/* Alt öğeler — kapalı sidebar'da ikon-only accordion */}
                          {!isSidebarOpen && isExpanded && childItems.length > 0 && (
                            <div className="relative flex flex-col gap-0.5 mt-0.5 items-center pb-1">
                              {/* Üst gruba bağlayan dikey çizgi */}
                              <div className="absolute left-1/2 -translate-x-[14px] top-0 bottom-0 w-px bg-white/15 rounded-full" />
                              {childItems.map(child => {
                                const active = activeModule === child.id;
                                const badge = NAV_BADGES[child.id];
                                return (
                                  <button
                                    key={child.id}
                                    onClick={() => navigate(child.id)}
                                    title={child.label}
                                    className={[
                                      'relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150',
                                      active
                                        ? 'bg-white/15 text-[var(--enba-orange)]'
                                        : 'text-gray-500 hover:bg-white/8 hover:text-gray-200',
                                    ].join(' ')}
                                  >
                                    {active && (
                                      <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[var(--enba-orange)] rounded-full -translate-x-1" />
                                    )}
                                    <child.icon size={14} />
                                    {badge && (
                                      <span className={`absolute -top-1 -right-1 flex h-3 min-w-[12px] items-center justify-center rounded-full ${badge.color} px-0.5 text-[7px] font-bold text-white`}>
                                        {badge.count > 9 ? '9+' : badge.count}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
              parasutService.clearSession();
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

          <div className="flex items-center gap-2">
            {/* Gecikmiş görev uyarısı */}
            {overdueTaskCount > 0 && (
              <button
                onClick={() => navigate('tasks')}
                className="relative p-2 rounded-xl bg-amber-50 text-amber-500 hover:bg-amber-100 hover:text-amber-600 transition-all dark:bg-amber-500/10 dark:text-amber-400"
                title={`${overdueTaskCount} gecikmiş görev`}
              >
                <ClipboardList size={18} />
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0F172A]">
                  {overdueTaskCount > 99 ? '99+' : overdueTaskCount}
                </span>
              </button>
            )}

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
                  {user.role === 'super_admin' ? `super_admin · ${companyName ?? '…'}` : (companyName ?? 'Şirket bilgisi yükleniyor…')}
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
                    {user.role === 'super_admin' ? `super_admin · ${companyName ?? '…'}` : (companyName ?? 'Şirket bilgisi yükleniyor…')}
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
                    parasutService.clearSession();
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

        {/* ─── Gmail Disconnect Banner ─────────────────────── */}
        {gmailDisconnectBanner && (
          <div className="flex items-center gap-3 px-6 py-2 bg-amber-50 border-b border-amber-100 flex-shrink-0">
            <WifiOff size={13} className="text-amber-500 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-amber-700 flex-1">Gmail bağlantısı kesildi — oturum süresi dolmuş olabilir.</span>
            <button
              onClick={() => { navigate('mail'); setGmailDisconnectBanner(false); }}
              className="text-[10px] font-black text-amber-600 hover:text-amber-800 uppercase tracking-widest border border-amber-200 px-3 py-1 rounded-lg hover:bg-amber-100 transition-all whitespace-nowrap"
            >
              Yeniden Bağlan
            </button>
            <button onClick={() => setGmailDisconnectBanner(false)} className="text-amber-400 hover:text-amber-600 transition-colors">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ─── Module Content ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-enba-bg enba-module">
          <div className="h-full">
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
                {activeModule === 'machinery'  && <Machinery navigate={navigate} />}
                {activeModule === 'tasks'      && <Tasks />}
                {activeModule === 'notes'      && <Notes />}
                {activeModule === 'calendar'   && <CalendarModule />}
                {activeModule === 'licensing'  && <Licensing />}
                {activeModule === 'settings'   && (
                  <Settings
                    profile={userProfile ? { ...userProfile, role: user.role } : { role: user.role } as any}
                    currentTheme={theme}
                    onThemeChange={(newTheme: string) => setTheme(newTheme)}
                    onPomodoroChange={(enabled: boolean) => setPomEnabled(enabled)}
                  />
                )}
                {activeModule === 'profile'    && <Profile />}
                {activeModule === 'mail'       && <Mail />}
                {activeModule === 'fixedexpenses' && <FixedExpenses />}
                {activeModule === 'super_admin'   && <SuperAdmin />}
                {activeModule === 'sektor_not'    && <SektorNot />}
                {activeModule === 'company_admin' && <CompanyAdmin />}
                {activeModule === 'pnl'      && <PnL />}
                {activeModule === 'fastplan' && <FastPlan />}
                {activeModule === 'planning' && <DetailedPlanModule navigate={navigate} setBackOverride={(fn: (() => boolean) | null) => { backOverrideRef.current = fn; }} />}
                {activeModule === 'parasut'  && <Parasut profile={userProfile} navigate={navigate} />}
                {activeModule === 'ayarlar'  && <Ayarlar profile={userProfile} />}
                {activeModule === 'varlik'       && <VarlikTakibi profile={userProfile} />}
                {activeModule === 'kurulusnakit' && <KurulumNakit profile={userProfile} />}
              </React.Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* ── Global Pomodoro floating widget ──────────────── */}
      {session && pomEnabled && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:1000, fontFamily:'Poppins,sans-serif' }}>
          {pomPanelOpen ? (
            <div style={{ width:260, background:'#1A1A1A', borderRadius:20, padding:16, boxShadow:'0 8px 40px rgba(0,0,0,0.28)', color:'#fff' }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', opacity:0.7 }}>
                  <Timer size={12}/>Pomodoro
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ display:'flex', gap:2, padding:2, borderRadius:6, background:'rgba(255,255,255,.08)' }}>
                    {(['work','break'] as const).map(m=>(
                      <button key={m} onClick={()=>{setPomMode(m);setPomSecs(m==='work'?25*60:5*60);setPomRunning(false);}}
                        style={{ border:'none', padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:'inherit', background:pomMode===m?'#fff':'transparent', color:pomMode===m?'#1A1A1A':'#fff', transition:'all .15s' }}>
                        {m==='work'?'Odak':'Mola'}
                      </button>
                    ))}
                  </div>
                  <button onClick={()=>setPomPanelOpen(false)} style={{ border:'none', background:'rgba(255,255,255,.1)', borderRadius:6, width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
                    <ChevronDown size={12}/>
                  </button>
                </div>
              </div>
              {/* Ring */}
              {(() => { const total=pomMode==='work'?25*60:5*60; const prog=1-pomSecs/total; const R=46,C=2*Math.PI*R; const mm=String(Math.floor(pomSecs/60)).padStart(2,'0'); const ss=String(pomSecs%60).padStart(2,'0'); return (
                <div style={{ display:'flex', justifyContent:'center', padding:'8px 0', position:'relative' }}>
                  <svg width={112} height={112} viewBox="0 0 112 112">
                    <circle cx={56} cy={56} r={R} stroke="rgba(255,255,255,.1)" strokeWidth={6} fill="none"/>
                    <circle cx={56} cy={56} r={R} stroke="#FF9500" strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-prog)} transform="rotate(-90 56 56)" style={{ transition:'stroke-dashoffset .4s' }}/>
                  </svg>
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ fontSize:26, fontWeight:600, fontFamily:'JetBrains Mono,monospace', letterSpacing:'-0.04em', lineHeight:1 }}>{mm}:{ss}</div>
                    <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', opacity:0.45, marginTop:3 }}>{pomMode==='work'?'Odak':'Mola'}</div>
                  </div>
                </div>
              ); })()}
              {/* Controls */}
              <div style={{ display:'flex', gap:6, marginTop:4 }}>
                <button onClick={()=>{ const next=!pomRunning; setPomRunning(next); if(next){ try{ const ctx=new AudioContext(); [0,0.12].forEach((delay,i)=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.type='sine'; o.frequency.value=i===0?440:660; const t=ctx.currentTime+delay; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.12,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+0.18); o.start(t);o.stop(t+0.18); }); }catch{} } }}
                  style={{ flex:1, padding:'10px 0', borderRadius:8, border:'none', background:'#FF9500', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  {pomRunning?'⏸ Duraklat':'▶ Başlat'}
                </button>
                <button onClick={()=>{setPomRunning(false);setPomSecs(pomMode==='work'?25*60:5*60);}}
                  style={{ padding:'10px 12px', borderRadius:8, border:'none', background:'rgba(255,255,255,.1)', color:'#fff', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>↻</button>
              </div>
            </div>
          ) : (
            /* Collapsed pill */
            <button onClick={()=>setPomPanelOpen(true)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:50, border:'none', background:'#1A1A1A', color:'#fff', cursor:'pointer', boxShadow:'0 4px 20px rgba(0,0,0,0.25)', fontFamily:'inherit', fontSize:13, fontWeight:600 }}>
              <Timer size={14} style={{ color: pomRunning ? '#FF9500' : 'rgba(255,255,255,0.5)' }}/>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13 }}>
                {String(Math.floor(pomSecs/60)).padStart(2,'0')}:{String(pomSecs%60).padStart(2,'0')}
              </span>
              {pomRunning && <div style={{ width:6, height:6, borderRadius:'50%', background:'#FF9500', animation:'pulse 1.5s ease-in-out infinite' }}/>}
            </button>
          )}
        </div>
      )}
      <DerenEasterEgg />

      {/* ─── Paraşüt Export Progress Pill ──── */}
      {exportState && !exportState.done && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 bg-white border border-blue-200 rounded-2xl shadow-lg shadow-blue-100/50 px-4 py-2.5 text-xs font-semibold text-blue-700">
          <Loader2 size={14} className="animate-spin text-blue-500 shrink-0" />
          <span>Paraşüt'e aktarılıyor</span>
          <span className="bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums">
            {exportState.current}/{exportState.total}
          </span>
          <Upload size={12} className="text-blue-400 shrink-0" />
        </div>
      )}

      {/* ─── Gmail Bağlan Hatırlatması (sağ alt toast) ──── */}
      {gmailConnectPrompt && (
        <div className="fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 p-4 w-72 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <MailIcon size={18} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-enba-dark mb-0.5">Gmail'inizi bağlayın</p>
              <p className="text-[10px] text-gray-400 leading-relaxed">E-postalarınıza Enba üzerinden erişmek ister misiniz?</p>
            </div>
            <button
              onClick={() => { setGmailConnectPrompt(false); localStorage.setItem('enba_gmail_prompt_dismissed', '1'); }}
              className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { navigate('mail'); setGmailConnectPrompt(false); localStorage.setItem('enba_gmail_prompt_dismissed', '1'); }}
              className="flex-1 py-2 bg-enba-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
            >
              Bağlan
            </button>
            <button
              onClick={() => { setGmailConnectPrompt(false); localStorage.setItem('enba_gmail_prompt_dismissed', '1'); }}
              className="flex-1 py-2 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
            >
              Şimdi Değil
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
