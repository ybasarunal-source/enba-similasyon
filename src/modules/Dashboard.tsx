import React, { useState, useEffect } from 'react';
import { useTranslation } from '../api/i18n';
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
  PlusCircle,
  TrendingUp
} from 'lucide-react';

interface DashboardProps {
  navigate: (view: string) => void;
  user: any;
}

const Dashboard: React.FC<DashboardProps> = ({ navigate, user }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'tasks' | 'payments' | 'licenses'>('tasks');
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
  });

  useEffect(() => {
    const loadStats = () => {
      try {
        const alislar = JSON.parse(localStorage.getItem('enba_alislar') || '[]');
        const satislar = JSON.parse(localStorage.getItem('enba_satislar') || '[]');
        const uretim = JSON.parse(localStorage.getItem('enba_uretim_kayitlari') || '[]');
        const planlar = JSON.parse(localStorage.getItem('enba_uretim_planlar') || '[]');
        const lisanslar = JSON.parse(localStorage.getItem('enba_lisans_ruhsat') || '[]');
        const tasks = JSON.parse(localStorage.getItem('enba_tasks') || '[]');
        const payments = JSON.parse(localStorage.getItem('enba_payments') || '[]');

        const rawPurchased = alislar.reduce((s: number, a: any) => s + (parseFloat(a.netMiktar) || 0), 0);
        const rawSold = satislar.filter((s: any) => s.stokTuru === 'hammadde').reduce((s: number, a: any) => s + (parseFloat(a.miktar) || 0), 0);
        const netRaw = Math.max(0, rawPurchased - rawSold);

        const totalProd = uretim.reduce((s: number, a: any) => s + (parseFloat(a.cikanUrun) || 0), 0);
        const mamulSold = satislar.filter((s: any) => s.stokTuru === 'mamul').reduce((s: number, a: any) => s + (parseFloat(a.miktar) || 0), 0);
        const netMamul = Math.max(0, totalProd - mamulSold);

        const bugun = new Date().toISOString().slice(0, 10);
        const activePlan = planlar.find((p: any) => p.baslangicTarihi <= bugun && p.bitisTarihi >= bugun);
        let perf = 0;
        let activeTitle = t('landing.no_active_plan');
        if (activePlan) {
          activeTitle = activePlan.baslik;
          const planActual = uretim
            .filter((u: any) => u.tarih >= activePlan.baslangicTarihi && u.tarih <= activePlan.bitisTarihi)
            .reduce((s: number, u: any) => s + (parseFloat(u.cikanUrun) || 0) / 1000, 0);
          perf = activePlan.hedefCikanTon > 0 ? (planActual / activePlan.hedefCikanTon) * 100 : 0;
        }

        const thisMonth = new Date().toISOString().slice(0, 7);
        const monthlyP = uretim
          .filter((u: any) => u.tarih.startsWith(thisMonth))
          .reduce((s: number, u: any) => s + (parseFloat(u.cikanUrun) || 0) / 1000, 0);

        const urgentTasks = tasks
          .filter((t: any) => t.status !== 'tamamlandi' && (t.priority === 'high' || t.priority === 'medium'))
          .slice(0, 4);

        const now = new Date();
        const soon = new Date(); soon.setDate(soon.getDate() + 30);
        const upcomingLicenses = lisanslar.filter((l: any) => {
          if (!l.yenilenmeTarihi) return false;
          const d = new Date(l.yenilenmeTarihi);
          return d >= now && d <= soon;
        });

        const pendingOut = payments.filter((p: any) => p.type === 'outgoing' && p.status === 'pending');

        setStats({
          totalStock: netRaw + netMamul,
          rawStock: netRaw,
          mamulStock: netMamul,
          prodPerformance: perf,
          monthlyProd: monthlyP,
          licenseAlerts: upcomingLicenses.length,
          activeTasksCount: urgentTasks.length,
          urgentTaskList: urgentTasks,
          upcomingPayments: pendingOut.slice(0, 5),
          totalPendingOutgoing: pendingOut.reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0),
          activePlanTitle: activeTitle,
          hasData: true,
        });
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
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-semibold text-gray-800">
            {t('landing.welcome')}{' '}
            <span className="text-enba-orange font-semibold">{user?.name || 'Administrator'}</span>
          </h1>
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
            className={`bg-white rounded-2xl px-6 py-5 border ${kpi.border} shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow`}
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
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PieChart size={18} className="text-enba-orange" />
              <h3 className="text-sm font-semibold text-gray-800">Envanter Özeti</h3>
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
              <div key={i} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
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
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {/* Tabs header */}
          <div className="border-b border-gray-100 px-6 pt-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Operasyonel Panel</h3>
                <p className="text-[10px] font-medium text-gray-400 mt-0.5">Günlük iş ve finansal akış</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            </div>
            <div className="flex gap-6">
              {[
                { id: 'tasks',    label: t('landing.tasks'),    icon: CheckSquare, count: stats.activeTasksCount },
                { id: 'payments', label: t('landing.payments'), icon: CreditCard,  count: stats.upcomingPayments.length },
                { id: 'licenses', label: t('landing.licenses'), icon: ShieldCheck, count: stats.licenseAlerts },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-3 text-xs font-medium transition-all relative border-b-2 ${
                    activeTab === tab.id
                      ? 'text-enba-dark border-enba-orange'
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
            onClick={() => navigate(activeTab === 'tasks' ? 'tasks' : activeTab === 'payments' ? 'cashflow' : 'licensing')}
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
