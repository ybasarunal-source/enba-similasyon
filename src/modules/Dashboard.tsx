import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../api/i18n';
import { microsoftService } from '../api/microsoft';
import { googleService } from '../api/google';
import { supabase, tasksAPI, permitsAPI, fixedExpensesAPI } from '../api/supabase';
import { DataService } from '../api/dataService';
import {
  PieChart, Zap, Factory, Coins, Package, CheckSquare, CreditCard,
  ShieldCheck, ArrowRight, Info, Ghost, Receipt, BadgeCheck, TrendingUp,
  Search, Calendar, MapPin, Clock, Mail as MailIcon, Settings, Plus, X,
  ExternalLink, Pencil
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardProps {
  navigate: (view: string) => void;
  user: any;
}

type CardType =
  | 'tasks_kpi' | 'mail_kpi' | 'calendar_kpi' | 'payments_kpi'
  | 'stock_kpi' | 'production_kpi'
  | 'tasks_list' | 'calendar_list' | 'payments_list' | 'licenses'
  | 'stock_chart' | 'mail_list' | 'fastplan'
  | 'app_link';

interface CardConfig {
  id: string;
  type: CardType;
  cols: 1 | 2 | 4;
  config?: Record<string, string>;
}

interface Stats {
  totalStock: number;
  rawStock: number;
  mamulStock: number;
  prodPerformance: number;
  monthlyProd: number;
  licenseAlerts: number;
  activeTasksCount: number;
  urgentTaskList: { id: string; title: string; priority: string; deadline: string }[];
  upcomingPayments: { id: string; title: string; dueDate: string; category: string; amount: number }[];
  totalPendingOutgoing: number;
  activePlanTitle: string;
  appointments: any[];
  unreadMailCount: number;
  hasData: boolean;
}

// ─── Card catalogue ──────────────────────────────────────────────────────────

interface CardMeta {
  type: CardType;
  label: string;
  desc: string;
  icon: React.ElementType;
  defaultCols: 1 | 2 | 4;
}

const CARD_CATALOGUE: CardMeta[] = [
  { type: 'tasks_kpi',      label: 'Görev Sayacı',          desc: 'Aktif görev sayısı',             icon: CheckSquare, defaultCols: 1 },
  { type: 'mail_kpi',       label: 'Okunmamış Mail',         desc: 'Toplam okunmamış mesaj',         icon: MailIcon,    defaultCols: 1 },
  { type: 'calendar_kpi',   label: "Bugünün Etkinlikleri",   desc: "Bugünkü randevu sayısı",         icon: Calendar,    defaultCols: 1 },
  { type: 'payments_kpi',   label: 'Ödeme Yükü',             desc: 'Bekleyen toplam ödemeler',       icon: Coins,       defaultCols: 1 },
  { type: 'stock_kpi',      label: 'Envanter',               desc: 'Toplam stok (ton)',              icon: Package,     defaultCols: 1 },
  { type: 'production_kpi', label: 'Üretim Verimliliği',     desc: 'Aylık üretim performansı',      icon: TrendingUp,  defaultCols: 1 },
  { type: 'tasks_list',     label: 'Görev Listesi',          desc: 'Öncelikli görev kartları',       icon: CheckSquare, defaultCols: 2 },
  { type: 'calendar_list',  label: 'Takvim',                 desc: "Bugünün randevuları",            icon: Calendar,    defaultCols: 2 },
  { type: 'payments_list',  label: 'Ödemeler',               desc: 'Bekleyen sabit gider ödemeleri', icon: CreditCard,  defaultCols: 2 },
  { type: 'licenses',       label: 'Lisans Uyarıları',       desc: 'Yaklaşan lisans yenilemeleri',   icon: ShieldCheck, defaultCols: 2 },
  { type: 'stock_chart',    label: 'Envanter Grafiği',       desc: 'Hammadde / mamul donut grafiği', icon: PieChart,    defaultCols: 2 },
  { type: 'mail_list',      label: 'Maillerim',              desc: 'Okunmamış mail özeti',           icon: MailIcon,    defaultCols: 2 },
  { type: 'fastplan',       label: 'Aktif Plan',             desc: 'Aktif iş planı özeti',           icon: Zap,         defaultCols: 2 },
  { type: 'app_link',       label: 'Uygulama Kısayolu',     desc: 'Harici uygulamaya tek tıkla git', icon: ExternalLink, defaultCols: 1 },
];

// ─── Default layout ──────────────────────────────────────────────────────────

const DEFAULT_LAYOUT: CardConfig[] = [
  { id: 'default_tasks_kpi',     type: 'tasks_kpi',     cols: 1 },
  { id: 'default_mail_kpi',      type: 'mail_kpi',      cols: 1 },
  { id: 'default_calendar_kpi',  type: 'calendar_kpi',  cols: 1 },
  { id: 'default_payments_kpi',  type: 'payments_kpi',  cols: 1 },
  { id: 'default_tasks_list',    type: 'tasks_list',    cols: 2 },
  { id: 'default_calendar_list', type: 'calendar_list', cols: 2 },
  { id: 'default_stock_chart',   type: 'stock_chart',   cols: 2 },
  { id: 'default_payments_list', type: 'payments_list', cols: 2 },
];

const LAYOUT_KEY = 'enba_dashboard_layout_v1';

function loadLayout(): CardConfig[] {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw) return JSON.parse(raw) as CardConfig[];
  } catch {
    // ignore
  }
  return DEFAULT_LAYOUT;
}

function saveLayout(layout: CardConfig[]) {
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
}

// ─── Card content renderer ───────────────────────────────────────────────────

function renderCardContent(
  type: CardType,
  stats: Stats,
  navigate: (v: string) => void,
  fmt: (n: number) => string,
  t: (key: string) => string,
  config?: Record<string, string>,
): React.ReactNode {

  // ── KPI cards ──────────────────────────────────────────────────────────────
  if (type === 'tasks_kpi') {
    return (
      <button
        onClick={() => navigate('tasks')}
        className="flex items-center gap-4 w-full px-5 py-4 hover:shadow-md transition-shadow rounded-2xl"
      >
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
          <CheckSquare size={20} className="text-orange-500" />
        </div>
        <div className="min-w-0 text-left">
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Aktif Görev</div>
          <div className="text-xl font-semibold text-gray-800 tabular-nums leading-tight mt-0.5">{stats.activeTasksCount}</div>
        </div>
      </button>
    );
  }

  if (type === 'mail_kpi') {
    return (
      <button
        onClick={() => navigate('mail')}
        className="flex items-center gap-4 w-full px-5 py-4 hover:shadow-md transition-shadow rounded-2xl"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <MailIcon size={20} className="text-blue-500" />
        </div>
        <div className="min-w-0 text-left">
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Okunmamış Mail</div>
          <div className="text-xl font-semibold text-gray-800 tabular-nums leading-tight mt-0.5">{stats.unreadMailCount}</div>
        </div>
      </button>
    );
  }

  if (type === 'calendar_kpi') {
    return (
      <button
        onClick={() => navigate('calendar')}
        className="flex items-center gap-4 w-full px-5 py-4 hover:shadow-md transition-shadow rounded-2xl"
      >
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
          <Calendar size={20} className="text-violet-500" />
        </div>
        <div className="min-w-0 text-left">
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Bugünün Etkinlikleri</div>
          <div className="text-xl font-semibold text-gray-800 tabular-nums leading-tight mt-0.5">{stats.appointments.length}</div>
        </div>
      </button>
    );
  }

  if (type === 'payments_kpi') {
    return (
      <button
        onClick={() => navigate('cashflow')}
        className="flex items-center gap-4 w-full px-5 py-4 hover:shadow-md transition-shadow rounded-2xl"
      >
        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
          <Coins size={20} className="text-rose-500" />
        </div>
        <div className="min-w-0 text-left">
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Ödeme Yükü</div>
          <div className="text-xl font-semibold text-gray-800 tabular-nums leading-tight mt-0.5">{fmt(stats.totalPendingOutgoing)} ₺</div>
        </div>
      </button>
    );
  }

  if (type === 'stock_kpi') {
    return (
      <button
        onClick={() => navigate('stock')}
        className="flex items-center gap-4 w-full px-5 py-4 hover:shadow-md transition-shadow rounded-2xl"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <Package size={20} className="text-amber-500" />
        </div>
        <div className="min-w-0 text-left">
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{t('landing.stock_status')}</div>
          <div className="text-xl font-semibold text-gray-800 tabular-nums leading-tight mt-0.5">{fmt(stats.totalStock)} T</div>
        </div>
      </button>
    );
  }

  if (type === 'production_kpi') {
    return (
      <button
        onClick={() => navigate('production')}
        className="flex items-center gap-4 w-full px-5 py-4 hover:shadow-md transition-shadow rounded-2xl"
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={20} className="text-emerald-500" />
        </div>
        <div className="min-w-0 text-left">
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{t('landing.prod_efficiency')}</div>
          <div className="text-xl font-semibold text-gray-800 tabular-nums leading-tight mt-0.5">%{fmt(stats.prodPerformance)}</div>
        </div>
      </button>
    );
  }

  // ── List / chart cards ─────────────────────────────────────────────────────

  if (type === 'tasks_list') {
    return (
      <div className="px-5 pb-4">
        {stats.urgentTaskList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.urgentTaskList.map(task => (
              <div key={task.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-enba-orange/30 hover:bg-white hover:shadow-md transition-all flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${task.priority === 'high' ? 'bg-rose-100 text-rose-500' : 'bg-orange-100 text-orange-500'}`}>
                    <CheckSquare size={16} />
                  </div>
                  <span className={`text-[9px] font-medium px-2 py-0.5 rounded uppercase tracking-wider ${task.priority === 'high' ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {task.priority || 'Normal'}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800 leading-snug">{task.title}</div>
                  <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-enba-orange" />
                    Son Tarih: {task.deadline}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-300">
            <Ghost size={32} className="mb-3 opacity-40" />
            <span className="text-xs font-medium text-gray-400">{t('landing.no_tasks')}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'calendar_list') {
    return (
      <div className="px-5 pb-4 space-y-2">
        {stats.appointments.length > 0 ? stats.appointments.map((ev: any) => (
          <div key={ev.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[9px] font-black text-enba-orange uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-lg">
                <Clock size={12} />
                {new Date(ev.start.dateTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {ev.location?.displayName && (
                <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold italic">
                  <MapPin size={10} />
                  {ev.location.displayName}
                </div>
              )}
            </div>
            <h4 className="text-sm font-semibold text-gray-800 leading-tight">{ev.subject}</h4>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-300">
            <Calendar size={32} className="mb-3 opacity-40" />
            <span className="text-xs font-medium text-gray-400">Bugün için etkinlik yok</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'payments_list') {
    return (
      <div className="px-5 pb-4 space-y-2">
        {stats.upcomingPayments.length > 0 ? stats.upcomingPayments.map(p => (
          <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-400 flex items-center justify-center">
                <Receipt size={16} />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">{p.title}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{p.dueDate} · {p.category}</div>
              </div>
            </div>
            <span className="text-sm font-semibold text-rose-500 tabular-nums">-{fmt(p.amount)} ₺</span>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-300">
            <Receipt size={32} className="mb-3 opacity-40" />
            <span className="text-xs font-medium text-gray-400">{t('landing.no_payments')}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'licenses') {
    return (
      <div className="flex items-center justify-center px-5 pb-5 min-h-[160px]">
        {stats.licenseAlerts > 0 ? (
          <div className="w-full max-w-sm p-6 bg-rose-50 rounded-2xl border border-rose-100 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-rose-100">
              <ShieldCheck size={24} className="text-rose-400" />
            </div>
            <div>
              <div className="text-base font-semibold text-rose-800">{stats.licenseAlerts} {t('landing.license_alerts')}</div>
              <p className="text-xs text-rose-500 mt-1 leading-relaxed">{t('landing.alerts_desc')}</p>
            </div>
            <button
              onClick={() => navigate('licensing')}
              className="w-full py-2 bg-enba-dark text-white rounded-xl text-xs font-medium hover:bg-black transition-all"
            >
              Detayları Gör
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-300">
            <BadgeCheck size={32} className="mb-3 opacity-40" />
            <span className="text-xs font-medium text-gray-400">{t('landing.no_alerts')}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'stock_chart') {
    const mamulPct = stats.totalStock > 0 ? (stats.mamulStock / stats.totalStock) * 100 : 0;
    return (
      <div className="px-5 pb-4 flex flex-col gap-4">
        <div className="flex items-center justify-center py-2">
          <div className="relative w-36 h-36">
            <div className="w-full h-full rounded-full border-[16px] border-gray-100" />
            <div
              className="absolute inset-0 rounded-full border-[16px] border-enba-orange"
              style={{ clipPath: `conic-gradient(transparent ${100 - mamulPct}%, white 0)`, filter: 'drop-shadow(0 0 8px rgba(227,82,5,0.15))' }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-semibold text-gray-800 tabular-nums">{fmt(stats.totalStock)}</span>
              <span className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">TON</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { label: t('landing.raw_stock'),   value: `${fmt(stats.rawStock)} T`,   dot: 'bg-gray-400' },
            { label: t('landing.mamul_stock'),  value: `${fmt(stats.mamulStock)} T`, dot: 'bg-enba-orange' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 bg-[var(--bg-surface-low)] rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${row.dot}`} />
                <span className="text-xs font-medium text-gray-600">{row.label}</span>
              </div>
              <span className="text-sm font-semibold text-gray-800 tabular-nums">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-400 leading-relaxed">
          <Info size={14} className="text-enba-orange flex-shrink-0 mt-0.5" />
          <span>{t('landing.stock_tip')}</span>
        </div>
      </div>
    );
  }

  if (type === 'mail_list') {
    return (
      <div className="flex flex-col items-center justify-center px-5 pb-6 gap-4 min-h-[160px]">
        <div className="text-5xl font-bold text-gray-800 tabular-nums leading-none">{stats.unreadMailCount}</div>
        <div className="text-xs font-medium text-gray-400">okunmamış mesaj</div>
        <button
          onClick={() => navigate('mail')}
          className="flex items-center gap-2 px-5 py-2.5 bg-enba-dark text-white rounded-xl text-xs font-medium hover:bg-black transition-all"
        >
          Maile Git <ArrowRight size={13} />
        </button>
      </div>
    );
  }

  if (type === 'fastplan') {
    return (
      <div className="flex flex-col items-center justify-center px-5 pb-6 gap-4 min-h-[160px]">
        {stats.activePlanTitle ? (
          <>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Zap size={24} className="text-enba-orange" />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-800 leading-snug">{stats.activePlanTitle}</div>
              <div className="text-[10px] text-gray-400 mt-1">Aktif iş planı</div>
            </div>
            <button
              onClick={() => navigate('fastplan')}
              className="flex items-center gap-2 px-5 py-2.5 bg-enba-dark text-white rounded-xl text-xs font-medium hover:bg-black transition-all"
            >
              Plana git <ArrowRight size={13} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-gray-300">
            <Zap size={32} className="mb-3 opacity-40" />
            <span className="text-xs font-medium text-gray-400">{t('landing.no_active_plan')}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'app_link') {
    const emoji = config?.emoji || '🔗';
    const name = config?.name || 'Uygulama';
    const url = config?.url ? (config.url.startsWith('http') ? config.url : `https://${config.url}`) : '#';
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 w-full px-5 py-4 hover:shadow-md transition-all rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl flex-shrink-0">
          {emoji}
        </div>
        <div className="min-w-0 text-left">
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Kısayol</div>
          <div className="text-sm font-semibold text-gray-800 truncate">{name}</div>
        </div>
        <ExternalLink size={14} className="text-gray-300 flex-shrink-0 ml-auto" />
      </a>
    );
  }

  return null;
}

// ─── Card header meta ─────────────────────────────────────────────────────────

interface CardHeaderInfo {
  icon: React.ElementType;
  title: string;
  navigateTo: string | null;
  iconClass: string;
}

function getCardHeader(type: CardType, t: (k: string) => string): CardHeaderInfo {
  const map: Record<CardType, CardHeaderInfo> = {
    tasks_kpi:      { icon: CheckSquare, title: 'Görev Sayacı',          navigateTo: 'tasks',      iconClass: 'text-orange-500' },
    mail_kpi:       { icon: MailIcon,    title: 'Okunmamış Mail',         navigateTo: 'mail',       iconClass: 'text-blue-500' },
    calendar_kpi:   { icon: Calendar,    title: "Bugünün Etkinlikleri",   navigateTo: 'calendar',   iconClass: 'text-violet-500' },
    payments_kpi:   { icon: Coins,       title: 'Ödeme Yükü',             navigateTo: 'cashflow',   iconClass: 'text-rose-500' },
    stock_kpi:      { icon: Package,     title: t('landing.stock_status'), navigateTo: 'stock',     iconClass: 'text-amber-500' },
    production_kpi: { icon: TrendingUp,  title: t('landing.prod_efficiency'), navigateTo: 'production', iconClass: 'text-emerald-500' },
    tasks_list:     { icon: CheckSquare, title: 'Görev Listesi',          navigateTo: 'tasks',      iconClass: 'text-orange-500' },
    calendar_list:  { icon: Calendar,    title: 'Takvim',                 navigateTo: 'calendar',   iconClass: 'text-violet-500' },
    payments_list:  { icon: CreditCard,  title: 'Ödemeler',               navigateTo: 'cashflow',   iconClass: 'text-blue-500' },
    licenses:       { icon: ShieldCheck, title: 'Lisans Uyarıları',       navigateTo: 'licensing',  iconClass: 'text-rose-500' },
    stock_chart:    { icon: PieChart,    title: 'Envanter Özeti',         navigateTo: 'stock',      iconClass: 'text-enba-orange' },
    mail_list:      { icon: MailIcon,    title: 'Maillerim',              navigateTo: 'mail',       iconClass: 'text-blue-500' },
    fastplan:       { icon: Zap,         title: 'Aktif Plan',             navigateTo: 'fastplan',   iconClass: 'text-enba-orange' },
    app_link:       { icon: ExternalLink, title: 'Uygulama',              navigateTo: null,         iconClass: 'text-gray-400' },
  };
  return map[type];
}

// ─── KPI cards skip the generic header ───────────────────────────────────────

const KPI_TYPES: CardType[] = ['tasks_kpi', 'mail_kpi', 'calendar_kpi', 'payments_kpi', 'stock_kpi', 'production_kpi', 'app_link'];

// ─── Main component ───────────────────────────────────────────────────────────

const Dashboard: React.FC<DashboardProps> = ({ navigate, user }) => {
  const { t } = useTranslation();

  const [stats, setStats] = useState<Stats>({
    totalStock: 0, rawStock: 0, mamulStock: 0,
    prodPerformance: 0, monthlyProd: 0,
    licenseAlerts: 0, activeTasksCount: 0,
    urgentTaskList: [], upcomingPayments: [],
    totalPendingOutgoing: 0, activePlanTitle: '',
    appointments: [], unreadMailCount: 0, hasData: false,
  });

  const [layout, setLayout] = useState<CardConfig[]>(loadLayout);
  const [editMode, setEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalStep, setAddModalStep] = useState<'catalog' | 'configure'>('catalog');
  const [appForm, setAppForm] = useState({ name: '', url: '', emoji: '🔗' });
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragNode = useRef<EventTarget | null>(null);

  // Persist layout changes
  useEffect(() => { saveLayout(layout); }, [layout]);

  // ── Data loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const [cloudTasks, cloudPermits, cloudPayments, { data: cloudPlans }, stockData, salesData, productionData] = await Promise.all([
          tasksAPI.getAll(),
          permitsAPI.getAll(),
          fixedExpensesAPI.getAll(),
          supabase.from('business_plans').select('*').eq('user_id', authUser.id),
          DataService.fetchData<any>('stock_records'),
          DataService.fetchData<any>('sales_records'),
          DataService.fetchData<any>('production_records'),
        ]);

        const rawPurchased = stockData.reduce((s: number, a: any) => s + (parseFloat(a.net_miktar) || 0), 0);
        const rawSold = salesData.filter((s: any) => s.stok_turu === 'hammadde').reduce((s: number, a: any) => s + (parseFloat(a.miktar) || 0), 0);
        const netRaw = Math.max(0, rawPurchased - rawSold);

        const totalProd = productionData.reduce((s: number, a: any) => s + (parseFloat(a.cikan_urun) || 0), 0);
        const mamulSold = salesData.filter((s: any) => s.stok_turu === 'mamul').reduce((s: number, a: any) => s + (parseFloat(a.miktar) || 0), 0);
        const netMamul = Math.max(0, totalProd - mamulSold);

        const activePlans = (cloudPlans || []).filter((p: any) => p.status === 'active');
        const activePlanTitle = activePlans.length > 0 ? activePlans[0].title : '';

        const thisMonth = new Date().toISOString().slice(0, 7);
        const monthlyP = productionData
          .filter((u: any) => u.tarih?.startsWith(thisMonth))
          .reduce((s: number, u: any) => s + (parseFloat(u.cikan_urun) || 0) / 1000, 0);

        let targetMonthlyTon = 0;
        activePlans.forEach((p: any) => {
          if (p.plan_type === 'fast' && p.data?.params?.aylikTon) {
            targetMonthlyTon += p.data.params.aylikTon;
          }
        });
        const perf = targetMonthlyTon > 0 ? (monthlyP / targetMonthlyTon) * 100 : 0;

        const urgentTasks = cloudTasks
          .filter((task: any) => task.status !== 'done' && (task.priority === 'high' || task.priority === 'medium'))
          .slice(0, 4);

        const now = new Date();
        const soon = new Date(); soon.setDate(soon.getDate() + 30);
        const upcomingLicenses = cloudPermits.filter((l: any) => {
          if (!l.yenileme_tarihi || l.is_suresiz) return false;
          const d = new Date(l.yenileme_tarihi);
          return d >= now && d <= soon;
        });

        const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
        const pendingOut = cloudPayments.filter((p: any) => !p.history?.[currentMonthKey]).map((p: any) => ({
          id: p.id,
          title: p.title,
          dueDate: `${p.due_date}. Gün`,
          category: p.category,
          amount: p.amount,
        }));

        setStats(prev => ({
          ...prev,
          totalStock: netRaw + netMamul,
          rawStock: netRaw,
          mamulStock: netMamul,
          prodPerformance: perf,
          monthlyProd: monthlyP,
          licenseAlerts: upcomingLicenses.length,
          activeTasksCount: urgentTasks.length,
          urgentTaskList: urgentTasks.map((task: any) => ({ id: task.id, title: task.title, priority: task.priority, deadline: task.deadline || 'Belirtilmedi' })),
          upcomingPayments: pendingOut.slice(0, 5),
          totalPendingOutgoing: pendingOut.reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0),
          activePlanTitle,
          hasData: true,
        }));

        // Load mail unread counts
        const mailCounts = await Promise.all([
          microsoftService.getUnreadCount().catch(() => 0),
          googleService.getUnreadCount().catch(() => 0),
        ]);
        setStats(prev => ({ ...prev, unreadMailCount: mailCounts[0] + mailCounts[1] }));

        // Load calendar appointments
        const msAcc = await microsoftService.getAccount();
        const gToken = googleService.getAccessToken();
        const today = new Date().toISOString().split('T')[0];
        const calRequests = [];
        if (msAcc) calRequests.push(microsoftService.getCalendarEvents(today, today));
        if (gToken) calRequests.push(googleService.getCalendarEvents(today, today));
        const calResults = await Promise.all(calRequests);
        const merged = calResults.flat().sort((a: any, b: any) =>
          new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
        );
        setStats(prev => ({ ...prev, appointments: merged }));

      } catch (e) {
        console.error('Stats load error', e);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [t]);

  const fmt = (n: number) =>
    (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });

  // ── Drag-and-drop handlers ──────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragNode.current = e.target;
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragOverId) setDragOverId(id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === dragNode.current) return;
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragOverId(null); return; }
    setLayout(prev => {
      const next = [...prev];
      const fromIdx = next.findIndex(c => c.id === dragId);
      const toIdx = next.findIndex(c => c.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
  };

  // ── Layout mutations ────────────────────────────────────────────────────────
  const removeCard = (id: string) => {
    setLayout(prev => prev.filter(c => c.id !== id));
  };

  const addCard = (meta: CardMeta) => {
    const newCard: CardConfig = { id: crypto.randomUUID(), type: meta.type, cols: meta.defaultCols };
    setLayout(prev => [...prev, newCard]);
    setShowAddModal(false);
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {t('landing.welcome')}{' '}
              <span className="text-enba-orange font-semibold">{user?.name || 'Administrator'}</span>
            </h1>
            <form
              action="https://www.google.com/search"
              method="GET"
              target="_blank"
              className="group flex items-center bg-[var(--bg-surface)] border-2 border-[var(--bg-surface-low)] rounded-2xl px-4 py-2 hover:border-enba-orange/20 focus-within:border-enba-orange/50 shadow-sm hover:shadow-md focus-within:shadow-lg transition-all duration-300 w-full max-w-[360px]"
            >
              <Search size={18} className="text-gray-400 group-focus-within:text-enba-orange transition-colors" />
              <input
                type="text"
                name="q"
                placeholder="Google'da bir şeyler ara..."
                className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 placeholder-gray-400 ml-3 w-full"
              />
              <button
                type="submit"
                className="ml-2 p-2 bg-gray-50 group-focus-within:bg-enba-orange group-focus-within:text-white rounded-xl text-gray-400 transition-all duration-300 flex items-center justify-center hover:brightness-110 shadow-sm"
                title="Google'da Ara"
              >
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('fastplan')}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-200 transition-all flex items-center gap-2 border border-gray-200"
          >
            <Zap size={15} className="text-enba-orange" />
            Hızlı Plan
          </button>
          <button
            onClick={() => navigate('stock')}
            className="px-5 py-2.5 bg-enba-orange text-white rounded-xl text-xs font-medium hover:brightness-110 transition-all flex items-center gap-2 shadow-md shadow-enba-orange/20"
          >
            <Package size={15} />
            {t('landing.purchase_record')}
          </button>
        </div>
      </div>

      {/* ── Kart düzenleme çubuğu ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          {editMode ? 'Sürükle & bırak ile yeniden düzenle · kaldırmak için ✕' : 'Panel'}
        </p>
        <div className="flex items-center gap-2">
          {editMode && (
            <button
              onClick={resetLayout}
              className="px-3 py-1.5 text-[10px] font-bold text-gray-400 hover:text-rose-500 transition-colors"
            >
              Varsayılana sıfırla
            </button>
          )}
          <button
            onClick={() => setEditMode(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              editMode
                ? 'bg-enba-orange text-white border-enba-orange shadow-md shadow-enba-orange/20'
                : 'bg-white text-gray-600 border-gray-200 hover:border-enba-orange/40 hover:text-enba-orange'
            }`}
          >
            <Settings size={14} />
            {editMode ? 'Bitti' : 'Düzenle'}
          </button>
        </div>
      </div>

      {/* ── Card grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {layout.map(card => {
          const colClass = card.cols === 4
            ? 'col-span-2 lg:col-span-4'
            : card.cols === 2
            ? 'col-span-2'
            : 'col-span-1';

          const header = getCardHeader(card.type, t);
          const isKpi = KPI_TYPES.includes(card.type);
          const isDragTarget = dragOverId === card.id && dragId !== card.id;

          return (
            <div
              key={card.id}
              className={`${colClass} relative`}
              draggable={editMode}
              onDragStart={editMode ? (e) => handleDragStart(e, card.id) : undefined}
              onDragOver={editMode ? (e) => handleDragOver(e, card.id) : undefined}
              onDragLeave={editMode ? handleDragLeave : undefined}
              onDrop={editMode ? (e) => handleDrop(e, card.id) : undefined}
              onDragEnd={editMode ? handleDragEnd : undefined}
              style={{ opacity: dragId === card.id ? 0.5 : 1, cursor: editMode ? 'grab' : 'default' }}
            >
              <div className={`bg-[var(--bg-surface)] rounded-2xl border shadow-sm h-full flex flex-col overflow-hidden transition-all ${
                editMode ? 'border-dashed border-enba-orange/60' : 'border-[var(--border-subtle)]'
              }`}>
                {/* Card header — skipped for KPI cards since content IS the full card */}
                {!isKpi && (
                  <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                      <header.icon size={16} className={header.iconClass} />
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{header.title}</h3>
                    </div>
                    {header.navigateTo && (
                      <button
                        onClick={() => header.navigateTo && navigate(header.navigateTo)}
                        className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-enba-dark hover:text-white transition-all"
                      >
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                )}
                <div className="flex-1">
                  {renderCardContent(card.type, stats, navigate, fmt, t, card.config)}
                </div>
              </div>

              {/* Edit mode overlay: drag-over ring */}
              {editMode && isDragTarget && (
                <div className="absolute inset-0 rounded-2xl ring-2 ring-enba-orange ring-offset-2 pointer-events-none" />
              )}

              {/* Edit mode: pencil button for app_link cards */}
              {editMode && card.type === 'app_link' && (
                <button
                  onClick={() => {
                    setAppForm({ name: card.config?.name || '', url: card.config?.url || '', emoji: card.config?.emoji || '🔗' });
                    setEditingCardId(card.id);
                  }}
                  className="absolute top-2 right-9 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors z-10 shadow"
                >
                  <Pencil size={11} />
                </button>
              )}

              {/* Edit mode: remove button */}
              {editMode && (
                <button
                  onClick={() => removeCard(card.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10 shadow"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}

        {/* Add card button (edit mode only) */}
        {editMode && (
          <div className="col-span-1">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full h-full min-h-[100px] rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-enba-orange hover:text-enba-orange transition-all"
            >
              <Plus size={24} />
              <span className="text-xs font-medium">Kart Ekle</span>
            </button>
          </div>
        )}
      </div>

      {/* Edit mode footer */}
      {editMode && (
        <div className="flex justify-center pt-2">
          <button
            onClick={resetLayout}
            className="text-xs font-medium text-gray-400 hover:text-enba-orange transition-colors underline underline-offset-2"
          >
            Varsayılana sıfırla
          </button>
        </div>
      )}

      {/* ── Add card modal ──────────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => { setShowAddModal(false); setAddModalStep('catalog'); }}
        >
          <div
            className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] w-full max-w-2xl mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                {addModalStep === 'configure' && (
                  <button
                    onClick={() => setAddModalStep('catalog')}
                    className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    ← Geri
                  </button>
                )}
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  {addModalStep === 'catalog' ? 'Kart Ekle' : 'Uygulama Kısayolu'}
                </h2>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setAddModalStep('catalog'); }}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {addModalStep === 'catalog' && (
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {CARD_CATALOGUE.map(meta => {
                  const Icon = meta.icon;
                  return (
                    <button
                      key={meta.type}
                      onClick={() => {
                        if (meta.type === 'app_link') {
                          setAppForm({ name: '', url: '', emoji: '🔗' });
                          setAddModalStep('configure');
                        } else {
                          addCard(meta);
                        }
                      }}
                      className="flex flex-col items-start gap-2 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-low)] hover:border-enba-orange hover:bg-orange-50/40 transition-all text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                        <Icon size={18} className="text-enba-orange" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[var(--text-primary)] leading-snug">{meta.label}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{meta.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {addModalStep === 'configure' && (
              <div className="p-6 space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Emoji</label>
                    <input
                      value={appForm.emoji}
                      onChange={e => setAppForm(p => ({ ...p, emoji: e.target.value }))}
                      maxLength={2}
                      className="w-16 text-center text-2xl border border-gray-200 rounded-xl px-2 py-2 outline-none focus:border-enba-orange bg-[var(--bg-surface-low)]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Uygulama adı</label>
                    <input
                      value={appForm.name}
                      onChange={e => setAppForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="örn. Google Drive"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-enba-orange bg-[var(--bg-surface-low)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">URL</label>
                  <input
                    value={appForm.url}
                    onChange={e => setAppForm(p => ({ ...p, url: e.target.value }))}
                    placeholder="drive.google.com"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-enba-orange bg-[var(--bg-surface-low)]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setAddModalStep('catalog')}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    disabled={!appForm.name.trim() || !appForm.url.trim()}
                    onClick={() => {
                      const url = appForm.url.startsWith('http') ? appForm.url : `https://${appForm.url}`;
                      const newCard: CardConfig = { id: crypto.randomUUID(), type: 'app_link', cols: 1, config: { name: appForm.name.trim(), url, emoji: appForm.emoji || '🔗' } };
                      setLayout(prev => [...prev, newCard]);
                      setShowAddModal(false);
                      setAddModalStep('catalog');
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-enba-orange text-white hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-enba-orange/20"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit app_link modal ─────────────────────────────────────────────── */}
      {editingCardId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setEditingCardId(null)}
        >
          <div
            className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] w-full max-w-sm mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Kısayolu Düzenle</h2>
              <button
                onClick={() => setEditingCardId(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Emoji</label>
                  <input
                    value={appForm.emoji}
                    onChange={e => setAppForm(p => ({ ...p, emoji: e.target.value }))}
                    maxLength={2}
                    className="w-16 text-center text-2xl border border-gray-200 rounded-xl px-2 py-2 outline-none focus:border-enba-orange bg-[var(--bg-surface-low)]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Uygulama adı</label>
                  <input
                    value={appForm.name}
                    onChange={e => setAppForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="örn. Google Drive"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-enba-orange bg-[var(--bg-surface-low)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">URL</label>
                <input
                  value={appForm.url}
                  onChange={e => setAppForm(p => ({ ...p, url: e.target.value }))}
                  placeholder="drive.google.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-enba-orange bg-[var(--bg-surface-low)]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingCardId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  disabled={!appForm.name.trim() || !appForm.url.trim()}
                  onClick={() => {
                    const url = appForm.url.startsWith('http') ? appForm.url : `https://${appForm.url}`;
                    setLayout(prev => prev.map(c => c.id === editingCardId ? { ...c, config: { name: appForm.name.trim(), url, emoji: appForm.emoji || '🔗' } } : c));
                    setEditingCardId(null);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-enba-orange text-white hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-enba-orange/20"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
