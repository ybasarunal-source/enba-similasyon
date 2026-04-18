import React, { useState } from 'react';
import { useTranslation } from './api/i18n';
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
import { DetailedPlanManager } from './modules/planning/DetailedPlanManager';
import { FastPlan } from './modules/FastPlan';
import {
  Home,
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
  ChevronRight
} from 'lucide-react';

type ModuleType =
  | 'dashboard' | 'stock' | 'production' | 'logistics' | 'hr'
  | 'archive' | 'cashflow' | 'planning' | 'fastplan' | 'machinery'
  | 'tasks' | 'licensing' | 'settings' | 'pnl';

export const App: React.FC = () => {
  const { t, language, setLanguage, isLoading } = useTranslation();
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const user = { name: 'Administrator' };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1A1A1A] text-white">
        <div className="flex flex-col items-center gap-2 animate-pulse">
          <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '32px', letterSpacing: '-0.5px', lineHeight: 1 }}>
            <span style={{ color: '#E35205' }}>en</span><span style={{ color: 'white' }}>ba</span>
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '11px', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.4)' }} className="uppercase">
            Recycling
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard',  label: t('nav.home'),              icon: Home },
    { id: 'stock',      label: t('modules.inventory'),     icon: Package },
    { id: 'production', label: t('modules.prod_tracking'), icon: Factory },
    { id: 'fastplan',   label: 'Hızlı İş Planı',           icon: Zap },
    { id: 'planning',   label: 'Detaylı İş Planı',          icon: BarChart3 },
    { id: 'logistics',  label: t('modules.logistics'),     icon: Truck },
    { id: 'hr',         label: t('modules.hr'),            icon: Contact },
    { id: 'archive',    label: t('modules.archive'),       icon: ArchiveIcon },
    { id: 'cashflow',   label: t('modules.cashflow'),      icon: Coins },
    { id: 'machinery',  label: t('modules.machinery'),     icon: Wrench },
    { id: 'tasks',      label: t('modules.tasks'),         icon: ClipboardList },
    { id: 'licensing',  label: t('modules.licensing'),     icon: FileBadge },
    { id: 'pnl',        label: 'P&L Analizi',              icon: BarChart3 },
    { id: 'settings',   label: t('nav.sistem'),            icon: SettingsIcon },
  ];

  const navigate = (view: string) => setActiveModule(view as ModuleType);
  const activeLabel = menuItems.find(i => i.id === activeModule)?.label ?? '';

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--enba-bg)]">

      {/* ─── Sidebar ────────────────────────────────────── */}
      <aside
        className={`
          enba-sidebar-glass text-white flex flex-col flex-shrink-0
          transition-all duration-500 ease-in-out z-20
          ${isSidebarOpen ? 'w-[240px]' : 'w-16'}
        `}
      >
        {/* Logo row */}
        <div className={`flex items-center flex-shrink-0 border-b border-white/5
          ${isSidebarOpen ? 'px-5 py-5 gap-3' : 'px-0 py-5 justify-center'}`}
        >
          <div className="w-9 h-9 bg-[var(--enba-orange)] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-950/40">
            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '20px', color: 'white', lineHeight: 1 }}>e</span>
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
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 px-2">
          {menuItems.map(item => {
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id as ModuleType)}
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
        <div className={`border-t border-white/5 py-3 px-2 flex flex-col gap-1`}>
          {isSidebarOpen && (
            <button
              onClick={() => setLanguage(language === 'TR' ? 'EN' : 'TR')}
              style={{ fontFamily: "'Poppins', sans-serif" }}
              className="px-3 py-2 text-[10px] font-semibold text-gray-500 hover:text-gray-300 transition-colors text-left tracking-wider uppercase"
            >
              {language === 'TR' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
            </button>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Menüyü Gizle' : 'Menüyü Göster'}
            className={`
              flex items-center justify-center rounded-xl py-2.5
              text-gray-500 hover:text-gray-200 hover:bg-white/5
              transition-all duration-200
              ${isSidebarOpen ? 'px-3 gap-3' : 'px-0'}
            `}
          >
            {isSidebarOpen
              ? <PanelLeftClose size={18} />
              : <PanelLeftOpen size={18} />
            }
            {isSidebarOpen && (
              <span
                style={{ fontFamily: "'Poppins', sans-serif" }}
                className="text-[11px] font-medium"
              >
                Menüyü Gizle
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* ─── Top Header ─────────────────────────────────── */}
        <header className="h-13 bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0 z-10" style={{ height: '52px' }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-gray-400">
            <span
              style={{ fontFamily: "'Poppins', sans-serif" }}
              className="text-[11px] font-medium text-gray-400 uppercase tracking-widest"
            >
              Enba
            </span>
            <ChevronRight size={12} className="text-gray-300" />
            <span
              style={{ fontFamily: "'Poppins', sans-serif" }}
              className="text-[12px] font-semibold text-[var(--enba-dark)]"
            >
              {activeLabel}
            </span>
          </div>

          {/* User area */}
          <div className="flex items-center gap-3">
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
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 relative">
              <User size={16} className="text-gray-400" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow" />
            </div>
          </div>
        </header>

        {/* ─── Module Content ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1200px] mx-auto min-h-full">
            {activeModule === 'dashboard'  && <Dashboard navigate={navigate} user={{ name: 'Admin' }} />}
            {activeModule === 'stock'      && <Stock />}
            {activeModule === 'production' && <Production />}
            {activeModule === 'logistics'  && <Logistics />}
            {activeModule === 'hr'         && <HR />}
            {activeModule === 'archive'    && <Archive />}
            {activeModule === 'cashflow'   && <Cashflow aktifPlanlar={JSON.parse(localStorage.getItem('enba_detailed_plans') || '[]')} />}
            {activeModule === 'machinery'  && <Machinery />}
            {activeModule === 'tasks'      && <Tasks />}
            {activeModule === 'licensing'  && <Licensing />}
            {activeModule === 'pnl'        && <PnL />}
            {activeModule === 'settings'   && <Settings />}
            {activeModule === 'fastplan'   && <FastPlan />}
            {activeModule === 'planning'   && <DetailedPlanManager />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
