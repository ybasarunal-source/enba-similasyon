import React, { useState, useEffect } from 'react';
import { useTranslation } from '../api/i18n';
import { microsoftService } from '../api/microsoft';
import { googleService } from '../api/google';
import { supabase, tasksAPI, permitsAPI, fixedExpensesAPI } from '../api/supabase';
import {
  PieChart,
  Zap,
  Factory,
  Coins,
  Package,
  CheckSquare,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Info,
  Ghost,
  Receipt,
  BadgeCheck,
  TrendingUp,
  Search,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';

interface DashboardProps {
  navigate: (view: string) => void;
  user: any;
}

const Dashboard: React.FC<DashboardProps> = ({ navigate, user }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'tasks' | 'payments' | 'licenses' | 'appointments'>('tasks');
  const [stats, setStats] = useState({
    totalStock: 0,
    rawStock: 0,
    mamulStock: 0,
    prodPerformance: 0,
    monthlyProd: 0,
    licenseAlerts: 0,
    activeTasksCount: 0,
    urgentTaskList: [] as any[],
    upcomingPayments: [] as any[],
    totalPendingOutgoing: 0,
    activePlanTitle: '',
    hasData: false,
    appointments: [] as any[],
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [cloudTasks, cloudPermits, cloudPayments, { data: cloudPlans }] = await Promise.all([
          tasksAPI.getAll(),
          permitsAPI.getAll(),
          fixedExpensesAPI.getAll(),
          supabase.from('business_plans').select('*').eq('user_id', user.id)
        ]);

        const alislar = JSON.parse(localStorage.getItem('enba_alislar') || '[]');
        const satislar = JSON.parse(localStorage.getItem('enba_satislar') || '[]');
        const uretim = JSON.parse(localStorage.getItem('enba_uretim_kayitlari') || '[]');

        const rawPurchased = alislar.reduce((s: number, a: any) => s + (parseFloat(a.netMiktar) || 0), 0);
        const rawSold = satislar.filter((s: any) => s.stokTuru === 'hammadde').reduce((s: number, a: any) => s + (parseFloat(a.miktar) || 0), 0);
        const netRaw = Math.max(0, rawPurchased - rawSold);

        const totalProd = uretim.reduce((s: number, a: any) => s + (parseFloat(a.cikanUrun) || 0), 0);
        const mamulSold = satislar.filter((s: any) => s.stokTuru === 'mamul').reduce((s: number, a: any) => s + (parseFloat(a.miktar) || 0), 0);
        const netMamul = Math.max(0, totalProd - mamulSold);

        const activePlans = (cloudPlans || []).filter(p => p.status === 'active');
        const activePlanTitle = activePlans.length > 0 ? activePlans[0].title : t('landing.no_active_plan');
        let perf = 0;

        const thisMonth = new Date().toISOString().slice(0, 7);
        const monthlyP = uretim
          .filter((u: any) => u.tarih.startsWith(thisMonth))
          .reduce((s: number, u: any) => s + (parseFloat(u.cikanUrun) || 0) / 1000, 0);

        let targetMonthlyTon = 0;
        activePlans.forEach(p => {
          if (p.plan_type === 'fast' && p.data?.params?.aylikTon) {
            targetMonthlyTon += p.data.params.aylikTon;
          }
        });

        if (targetMonthlyTon > 0) {
          perf = (monthlyP / targetMonthlyTon) * 100;
        }

        const urgentTasks = cloudTasks
          .filter(t => t.status !== 'done' && (t.priority === 'high' || t.priority === 'medium'))
          .slice(0, 4);

        const now = new Date();
        const soon = new Date(); soon.setDate(soon.getDate() + 30);
        const upcomingLicenses = cloudPermits.filter(l => {
          if (!l.yenileme_tarihi || l.is_suresiz) return false;
          const d = new Date(l.yenileme_tarihi);
          return d >= now && d <= soon;
        });

        const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
        const pendingOut = cloudPayments.filter(p => !p.history?.[currentMonthKey]).map(p => ({
          id: p.id,
          title: p.title,
          dueDate: `${p.due_date}. Gün`,
          category: p.category,
          amount: p.amount
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
          urgentTaskList: urgentTasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, deadline: t.deadline || 'Belirtilmedi' })),
          upcomingPayments: pendingOut.slice(0, 5),
          totalPendingOutgoing: pendingOut.reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0),
          activePlanTitle: activePlanTitle,
          hasData: true,
        }));

        const loadUnifiedAppointments = async () => {
          const msAcc = await microsoftService.getAccount();
          const gToken = googleService.getAccessToken();
          const today = new Date().toISOString().split('T')[0];
          
          const requests = [];
          if (msAcc) requests.push(microsoftService.getCalendarEvents(today, today));
          if (gToken) requests.push(googleService.getCalendarEvents(today, today));
          
          const results = await Promise.all(requests);
          const merged = results.flat().sort((a, b) => 
            new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
          );
          
          setStats(prev => ({ ...prev, appointments: merged }));
        };
        
        loadUnifiedAppointments();
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

  // KPI cards
  const kpis = [
    { label: t('landing.stock_status'),    value: `${fmt(stats.totalStock)} T`,        icon: Package, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: t('landing.prod_efficiency'), value: `%${fmt(stats.prodPerformance)}`,     icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: t('landing.monthly_prod'),    value: `${fmt(stats.monthlyProd)} T`,        icon: Factory, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: t('landing.payment_burden'),  value: `${fmt(stats.totalPendingOutgoing)} ₺`, icon: Coins, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">

      {/* ── Header ───────────────────────────────────────── */}
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
        <div className="flex items-center gap-3">
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

      {/* ── KPI Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className={`bg-[var(--bg-surface)] rounded-2xl px-6 py-5 border ${kpi.border} shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow`}
          >
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
              <kpi.icon size={20} className={kpi.color} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider truncate">
                {kpi.label}
              </div>
              <div className="text-lg font-semibold text-gray-800 leading-tight mt-0.5 tabular-nums">
                {kpi.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Stock Panel */}
        <div className="lg:col-span-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PieChart size={18} className="text-enba-orange" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Envanter Özeti</h3>
            </div>
            <button
              onClick={() => navigate('stock')}
              className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-enba-dark hover:text-white transition-all"
            >
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Donut chart */}
          <div className="flex items-center justify-center py-4">
            <div className="relative w-40 h-40">
              <div className="w-full h-full rounded-full border-[16px] border-gray-100" />
              <div
                className="absolute inset-0 rounded-full border-[16px] border-enba-orange"
                style={{
                  clipPath: `conic-gradient(transparent ${100 - (stats.mamulStock / (stats.totalStock || 1) * 100)}%, white 0)`,
                  filter: 'drop-shadow(0 0 8px rgba(227,82,5,0.15))',
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold text-gray-800 tabular-nums">{fmt(stats.totalStock)}</span>
                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">TON</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: t('landing.raw_stock'), value: `${fmt(stats.rawStock)} T`, dot: 'bg-gray-400' },
              { label: t('landing.mamul_stock'), value: `${fmt(stats.mamulStock)} T`, dot: 'bg-enba-orange' },
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

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-400 leading-relaxed">
            <Info size={15} className="text-enba-orange flex-shrink-0 mt-0.5" />
            <span>{t('landing.stock_tip')}</span>
          </div>
        </div>

        {/* Operational Panel */}
        <div className="lg:col-span-8 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden flex flex-col">
          {/* Tabs header */}
          <div className="border-b border-[var(--border-subtle)] px-6 pt-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Operasyonel Panel</h3>
                <p className="text-[10px] font-medium text-gray-400 mt-0.5">Günlük iş ve finansal akış</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            </div>
            <div className="flex gap-6">
              {[
                { id: 'tasks',    label: t('landing.tasks'),    icon: CheckSquare, count: stats.activeTasksCount },
                { id: 'appointments', label: 'Randevular', icon: Calendar, count: stats.appointments.length },
                { id: 'payments', label: t('landing.payments'), icon: CreditCard,  count: stats.upcomingPayments.length },
                { id: 'licenses', label: t('landing.licenses'), icon: ShieldCheck, count: stats.licenseAlerts },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-3 text-xs font-medium transition-all relative border-b-2 ${
                    activeTab === tab.id
                      ? 'text-[var(--text-primary)] border-enba-orange'
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  <tab.icon size={14} className={activeTab === tab.id ? 'text-enba-orange' : ''} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="bg-enba-dark text-white px-1.5 py-0.5 rounded text-[9px] font-medium">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar max-h-[420px]">
            {activeTab === 'tasks' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stats.urgentTaskList.length > 0 ? stats.urgentTaskList.map(task => (
                  <div key={task.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-enba-orange/30 hover:bg-white hover:shadow-md transition-all flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        task.priority === 'high' ? 'bg-rose-100 text-rose-500' : 'bg-orange-100 text-orange-500'
                      }`}>
                        <CheckSquare size={16} />
                      </div>
                      <span className={`text-[9px] font-medium px-2 py-0.5 rounded uppercase tracking-wider ${
                        task.priority === 'high' ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
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
                )) : (
                  <div className="col-span-2 flex flex-col items-center justify-center py-16 text-gray-300">
                    <Ghost size={36} className="mb-3 opacity-40" />
                    <span className="text-xs font-medium text-gray-400">{t('landing.no_tasks')}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-3">
                {stats.appointments.length > 0 ? stats.appointments.map(ev => (
                  <div key={ev.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2 text-[9px] font-black text-enba-orange uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-lg">
                        <Clock size={12} />
                        {new Date(ev.start.dateTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-1.5 grayscale opacity-60">
                        {ev.source === 'google' ? (
                          <svg viewBox="0 0 24 24" width="10" height="10"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.87 14.11c-.22-.67-.35-1.38-.35-2.11s.13-1.44.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.69-2.83z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.69 2.83c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335"/></svg>
                        ) : (
                          <svg viewBox="0 0 23 23" width="10" height="10"><path fill="#f3f3f3" d="M0 0h23v23H0z"/><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
                        )}
                        {ev.location?.displayName && (
                          <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold italic">
                            <MapPin size={10} />
                            {ev.location.displayName}
                          </div>
                        )}
                      </div>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800 leading-tight">{ev.subject}</h4>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                    <Calendar size={36} className="mb-3 opacity-40" />
                    <span className="text-xs font-medium text-gray-400">Bugün için randevu bulunmuyor</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-2">
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
                  <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                    <Receipt size={36} className="mb-3 opacity-40" />
                    <span className="text-xs font-medium text-gray-400">{t('landing.no_payments')}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'licenses' && (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                {stats.licenseAlerts > 0 ? (
                  <div className="w-full max-w-sm p-8 bg-rose-50 rounded-2xl border border-rose-100 text-center flex flex-col items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm border border-rose-100">
                      <ShieldCheck size={28} className="text-rose-400" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-rose-800">
                        {stats.licenseAlerts} {t('landing.license_alerts')}
                      </div>
                      <p className="text-xs text-rose-500 mt-1 leading-relaxed">{t('landing.alerts_desc')}</p>
                    </div>
                    <button
                      onClick={() => navigate('licensing')}
                      className="w-full py-2.5 bg-enba-dark text-white rounded-xl text-xs font-medium hover:bg-black transition-all"
                    >
                      {t('landing.view_details')}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                    <BadgeCheck size={36} className="mb-3 opacity-40" />
                    <span className="text-xs font-medium text-gray-400">{t('landing.no_alerts')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate(activeTab === 'tasks' ? 'tasks' : activeTab === 'payments' ? 'cashflow' : activeTab === 'appointments' ? 'calendar' : 'licensing')}
            className="py-4 border-t border-gray-100 text-xs font-medium text-gray-400 hover:text-enba-orange transition-colors flex items-center justify-center gap-2"
          >
            {t('common.view_all')}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
