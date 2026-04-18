import React, { useState, useMemo } from 'react';
import { usePlanSync } from '../../hooks/usePlanSync';
import { SyncBanner } from '../../components/SyncBanner';
import {
  BarChart3, Plus, Trash2, Edit3, Copy, FileText, Layout,
  Play, Save, ChevronDown, ChevronUp, TrendingUp, TrendingDown,
  ArrowLeft
} from 'lucide-react';
import { PlanningWizard } from './PlanningWizard';

/**
 * Enba Similasyon - Detaylı İş Planı Yönetim Ekranı
 * PlanningWizard'ı sarmalayan kart sistemi yöneticisi.
 * Her kayıt bir plan kartı olur, aktif kartlar konsolide TKKÖ'ya dahil edilir.
 */

// ── Types ──────────────────────────────────────────────────────
interface DetailedPlanCard {
  id: string;
  supabaseId?: string;
  title: string;
  status: 'pending' | 'active';
  createdAt: string;
  planData: any; // PlanningWizard's full planData object
  // Özet - 12 aylık toplamlar
  summary: {
    yillikGelir: number;
    yillikOpex: number;
    yillikEbitda: number;
    yillikNet: number;
    toplamYatirim: number;
  };
}

const STORAGE_KEY = 'enba_detailed_plans_v2';

// ── Finansal hesap (ReportStep mantığının basitleştirilmiş versiyonu) ──────────
function planOzetiHesapla(planData: any) {
  let yillikGelir = 0, yillikOpex = 0, yillikEbitda = 0, yillikNet = 0;

  for (let i = 0; i < 12; i++) {
    let revenue = 0;
    Object.values(planData.monthlyData?.[i]?.musteriler || {}).forEach((s: any) => {
      revenue += (parseFloat(s.miktar || 0) * parseFloat(s.fiyat || 0));
    });

    let cogs = 0;
    Object.values(planData.monthlyData?.[i]?.tedarikler || {}).forEach((t: any) => {
      cogs += parseFloat(t.miktar || 0) * (parseFloat(t.fiyat || 0) + parseFloat(t.nakliye || 0));
    });

    let opex = 0;
    Object.values(planData.monthlyData?.[i]?.giderler || {}).forEach((g: any) => {
      opex += parseFloat(g) || 0;
    });

    (planData.personnelList || []).forEach((role: any) => {
      for (let v = 1; v <= (planData.shifts || 1); v++) {
        const count = planData.monthlyData?.[i]?.personeller?.[`${role.id}_v${v}`] || 0;
        opex += count * ((planData.baseNetSalary || 17002) + (role.ekMaas || 0));
        opex += count * ((planData.baseSgk || 5000) + (role.ekSgk || 0));
        opex += count * (planData.workDays || 26) * (planData.dailyMealCost || 200);
      }
    });

    const shiftHrs = Object.values(planData.shiftHours || { 1: 8 })
      .slice(0, planData.shifts || 1)
      .reduce((a: any, b: any) => a + b, 0) as number;
    const monthlyHrs = shiftHrs * (planData.workDays || 26);
    let powerCost = 0;
    (planData.selectedMachines || []).forEach(() => { powerCost += 2.5 * monthlyHrs; });
    opex += powerCost * (planData.electricPrice || 2.5) * 0.4;

    const totalInvestment = (planData.investments || [])
      .reduce((acc: number, inv: any) => acc + (parseFloat(inv.maliyet) || 0), 0);
    const monthlyAmort = totalInvestment > 0 ? totalInvestment / 60 : 0;

    const ebitda = revenue - (cogs + opex);
    const net = ebitda - monthlyAmort;

    yillikGelir += revenue;
    yillikOpex += cogs + opex;
    yillikEbitda += ebitda;
    yillikNet += net;
  }

  const toplamYatirim = (planData.investments || [])
    .reduce((acc: number, inv: any) => acc + (parseFloat(inv.maliyet) || 0), 0);

  return { yillikGelir, yillikOpex, yillikEbitda, yillikNet, toplamYatirim };
}

// ── Helpers ────────────────────────────────────────────────────
const fmt = (n: number) =>
  (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec = (n: number, d = 1) =>
  (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
const kpiColor = (v: number) =>
  v > 0 ? 'text-emerald-600' : v < 0 ? 'text-rose-600' : 'text-gray-400';

// ── Main Component ─────────────────────────────────────────────
export const DetailedPlanManager: React.FC = () => {
  const [view, setView] = useState<'cards' | 'wizard'>('cards');
  const [editingCard, setEditingCard] = useState<DetailedPlanCard | null>(null);
  const { planlar, kaydet, sil: planSilSync, syncStatus, syncError } = usePlanSync<DetailedPlanCard>({
    localKey: STORAGE_KEY,
    planType: 'detailed',
  });

  // ── Wizard'dan gelen save callback'i ──────────────────────
  const handleWizardSave = (planData: any) => {
    const summary = planOzetiHesapla(planData);
    const yeniKart: DetailedPlanCard = {
      id: editingCard?.id || Date.now().toString(),
      title: planData.title || 'İsimsiz Plan',
      status: editingCard?.status || 'pending',
      createdAt: editingCard?.createdAt || new Date().toISOString(),
      planData,
      summary,
    };
    const guncel = editingCard
      ? planlar.map(p => p.id === editingCard.id ? yeniKart : p)
      : [...planlar, yeniKart];
    kaydet(guncel);
    setView('cards');
    setEditingCard(null);
  };

  const statusToggle = (id: string) => {
    kaydet(planlar.map(p =>
      p.id === id ? { ...p, status: p.status === 'active' ? 'pending' : 'active' } : p
    ));
  };

  const planDuzenle = (plan: DetailedPlanCard) => {
    setEditingCard(plan);
    setView('wizard');
  };

  const planKopyala = (plan: DetailedPlanCard) => {
    const kopya: DetailedPlanCard = {
      ...plan,
      id: Date.now().toString(),
      supabaseId: undefined,
      title: `${plan.title} (Kopya)`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      planData: { ...plan.planData, title: `${plan.planData.title} (Kopya)` },
    };
    kaydet([...planlar, kopya]);
  };

  const planSil = (id: string) => {
    if (!window.confirm('Bu plan kartı silinecek. Emin misiniz?')) return;
    planSilSync(id);
  };

  // ── Geçerli planlar (eski format Supabase kayıtlarına karşı guard) ──
  const DEFAULT_SUMMARY = { yillikGelir: 0, yillikOpex: 0, yillikEbitda: 0, yillikNet: 0, toplamYatirim: 0 };
  const gecerliPlanlar = planlar.map(p => ({
    ...p,
    summary: p.summary || (p.planData ? planOzetiHesapla(p.planData) : DEFAULT_SUMMARY),
  }));

  // ── Konsolide ─────────────────────────────────────────────
  const aktifPlanlar = gecerliPlanlar.filter(p => p.status === 'active');
  const konsolide = useMemo(() => {
    if (aktifPlanlar.length === 0) return null;
    return {
      yillikGelir: aktifPlanlar.reduce((s, p) => s + p.summary.yillikGelir, 0),
      yillikOpex: aktifPlanlar.reduce((s, p) => s + p.summary.yillikOpex, 0),
      yillikEbitda: aktifPlanlar.reduce((s, p) => s + p.summary.yillikEbitda, 0),
      yillikNet: aktifPlanlar.reduce((s, p) => s + p.summary.yillikNet, 0),
      toplamYatirim: aktifPlanlar.reduce((s, p) => s + p.summary.toplamYatirim, 0),
    };
  }, [aktifPlanlar]);

  // ── Wizard Görünümü ────────────────────────────────────────
  if (view === 'wizard') {
    return (
      <PlanningWizard
        onCancel={() => { setView('cards'); setEditingCard(null); }}
        onSave={handleWizardSave}
        editData={editingCard?.planData || null}
      />
    );
  }

  // ── Kart Listesi Görünümü ──────────────────────────────────
  return (
    <div className="flex flex-col gap-10 p-10 animate-in fade-in duration-1000">
      <SyncBanner status={syncStatus} error={syncError} onRetry={() => kaydet(planlar)} />
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-enba-dark rounded-[1.2rem] flex items-center justify-center text-enba-orange shadow-2xl border border-white/5">
              <BarChart3 size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-enba-dark tracking-tighter leading-none uppercase">
                Detaylı İş Planı
              </h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mt-2">
                7-Adımlı Sihirbaz · Kart Sistemi · Konsolide Analiz
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setEditingCard(null); setView('wizard'); }}
          className="flex items-center gap-3 px-8 py-4 bg-enba-dark text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[3px] shadow-2xl shadow-enba-dark/30 hover:bg-black transition-all active:scale-95"
        >
          <Plus size={20} /> Yeni Detaylı Plan
        </button>
      </div>

      {/* Konsolide Panel */}
      {konsolide && aktifPlanlar.length > 0 && (
        <div className="bg-enba-dark rounded-[2.5rem] p-10 border border-white/5 shadow-2xl shadow-enba-dark/30">
          <div className="flex items-center gap-4 mb-8">
            <Layout size={22} className="text-enba-orange" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">
              KONSOLİDE TESİS ÖZETI (YILLIK) — {aktifPlanlar.length} Aktif Plan
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {[
              { label: 'Yıllık Gelir', value: `₺${fmt(konsolide.yillikGelir)}`, color: 'text-emerald-400' },
              { label: 'Yıllık OPEX', value: `₺${fmt(konsolide.yillikOpex)}`, color: 'text-rose-400' },
              { label: 'FAVÖK', value: `₺${fmt(konsolide.yillikEbitda)}`, color: konsolide.yillikEbitda >= 0 ? 'text-emerald-400' : 'text-rose-400' },
              { label: 'Net Kâr', value: `₺${fmt(konsolide.yillikNet)}`, color: konsolide.yillikNet >= 0 ? 'text-enba-orange' : 'text-rose-400' },
              { label: 'Toplam CAPEX', value: `₺${fmt(konsolide.toplamYatirim)}`, color: 'text-white' },
            ].map((kpi, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="text-[9px] font-black text-gray-500 uppercase tracking-[2px]">{kpi.label}</div>
                <div className={`text-xl font-black tabular-nums ${kpi.color}`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Karşılaştırma tablosu (2+ aktif plan varsa) */}
          {aktifPlanlar.length > 1 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left" id="tkko-detailed-table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 text-[9px] font-black text-gray-500 uppercase tracking-[2px]">Finansal Kalem (Yıllık)</th>
                    {aktifPlanlar.map(p => (
                      <th key={p.id} className="py-3 px-4 text-[9px] font-black text-white text-right uppercase tracking-[1px]">
                        {p.title}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-[9px] font-black text-enba-orange text-right uppercase tracking-[2px]">TOPLAM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { label: 'Yıllık Gelir', key: 'yillikGelir' as keyof typeof aktifPlanlar[0]['summary'] },
                    { label: 'Yıllık OPEX', key: 'yillikOpex' as keyof typeof aktifPlanlar[0]['summary'] },
                    { label: 'FAVÖK', key: 'yillikEbitda' as keyof typeof aktifPlanlar[0]['summary'] },
                    { label: 'Net Kâr', key: 'yillikNet' as keyof typeof aktifPlanlar[0]['summary'] },
                    { label: 'CAPEX', key: 'toplamYatirim' as keyof typeof aktifPlanlar[0]['summary'] },
                  ].map(row => {
                    const toplam = aktifPlanlar.reduce((s, p) => s + (p.summary[row.key] as number), 0);
                    return (
                      <tr key={row.key} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 text-[11px] font-black text-gray-400 uppercase tracking-[1px]">{row.label}</td>
                        {aktifPlanlar.map(p => (
                          <td key={p.id} className="py-3 px-4 text-right text-sm font-black text-gray-300 tabular-nums">
                            ₺{fmt(p.summary[row.key] as number)}
                          </td>
                        ))}
                        <td className={`py-3 px-4 text-right text-sm font-black tabular-nums ${kpiColor(toplam)}`}>
                          ₺{fmt(toplam)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Boş durum */}
      {gecerliPlanlar.length === 0 && (
        <div className="bg-white rounded-[2.5rem] p-20 border border-gray-100 shadow-card flex flex-col items-center gap-6 text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
            <FileText size={48} className="text-gray-200" />
          </div>
          <div>
            <div className="text-xl font-black text-enba-dark italic uppercase tracking-tight">Henüz Detaylı Plan Yok</div>
            <p className="text-sm text-gray-400 font-medium mt-2">
              7 adımlı sihirbazı kullanarak ilk kapsamlı iş planınızı oluşturun.
            </p>
          </div>
          <button
            onClick={() => setView('wizard')}
            className="flex items-center gap-3 px-8 py-4 bg-enba-dark text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[3px] shadow-xl hover:bg-black transition-all"
          >
            <Plus size={18} /> Sihirbazı Başlat
          </button>
        </div>
      )}

      {/* Bekleyen Planlar */}
      {gecerliPlanlar.filter(p => p.status === 'pending').length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">
              Bekleyen Planlar — {gecerliPlanlar.filter(p => p.status === 'pending').length} Kart
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {gecerliPlanlar.filter(p => p.status === 'pending').map(plan => (
              <DetailedKartBileseni
                key={plan.id} plan={plan}
                onToggle={() => statusToggle(plan.id)}
                onEdit={() => planDuzenle(plan)}
                onCopy={() => planKopyala(plan)}
                onDelete={() => planSil(plan.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Aktif Planlar */}
      {aktifPlanlar.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2.5 h-2.5 rounded-full bg-enba-orange animate-pulse" />
            <span className="text-[10px] font-black text-enba-orange uppercase tracking-[4px]">
              Aktif Planlar — Konsolide Hesaplamaya Dahil
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {aktifPlanlar.map(plan => (
              <DetailedKartBileseni
                key={plan.id} plan={plan}
                onToggle={() => statusToggle(plan.id)}
                onEdit={() => planDuzenle(plan)}
                onCopy={() => planKopyala(plan)}
                onDelete={() => planSil(plan.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Plan Kartı Bileşeni ────────────────────────────────────────
const DetailedKartBileseni: React.FC<{
  plan: DetailedPlanCard;
  onToggle: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}> = ({ plan, onToggle, onEdit, onCopy, onDelete }) => {
  const aktif = plan.status === 'active';
  const s = plan.summary;
  const ebitdaMarj = s.yillikGelir > 0 ? (s.yillikEbitda / s.yillikGelir) * 100 : 0;

  return (
    <div className={`bg-white rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden shadow-card ${aktif ? 'border-enba-orange shadow-enba-orange/10' : 'border-transparent'}`}>
      {/* Kart Başlığı */}
      <div className={`px-8 py-5 ${aktif ? 'bg-enba-orange/5' : 'bg-gray-50'} border-b border-gray-100 flex items-start justify-between gap-4`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {aktif && <div className="w-2 h-2 rounded-full bg-enba-orange animate-pulse flex-shrink-0" />}
            <h3 className="font-black text-enba-dark text-sm uppercase tracking-tight truncate">{plan.title}</h3>
          </div>
          <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1.5">
            {new Date(plan.createdAt).toLocaleDateString('tr-TR')} ·{' '}
            {plan.planData?.currency || 'TRY'} · {plan.planData?.startYear || '—'}
          </div>
        </div>
        <button
          onClick={onToggle}
          title={aktif ? 'Pasife Al' : 'Aktifleştir'}
          className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all ${aktif ? 'bg-enba-orange text-white shadow-lg shadow-enba-orange/30' : 'bg-gray-100 text-gray-400 hover:bg-enba-orange/10 hover:text-enba-orange'}`}
        >
          <Play size={16} className={aktif ? 'fill-white' : ''} />
        </button>
      </div>

      {/* KPI Izgara (Yıllık) */}
      <div className="grid grid-cols-2 gap-px bg-gray-100">
        {[
          { label: 'Yıllık Gelir', value: `₺${fmt(s.yillikGelir)}`, color: 'text-emerald-600' },
          { label: 'Yıllık OPEX', value: `₺${fmt(s.yillikOpex)}`, color: 'text-rose-500' },
          { label: 'FAVÖK', value: `₺${fmt(s.yillikEbitda)}`, color: kpiColor(s.yillikEbitda) },
          { label: 'Net Kâr', value: `₺${fmt(s.yillikNet)}`, color: kpiColor(s.yillikNet) },
        ].map((kpi, i) => (
          <div key={i} className="bg-white px-6 py-5">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">{kpi.label}</div>
            <div className={`text-base font-black tabular-nums ${kpi.color} leading-tight mt-1`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Marj + Eylemler */}
      <div className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${ebitdaMarj >= 15 ? 'bg-emerald-100 text-emerald-700' : ebitdaMarj >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-rose-100 text-rose-700'}`}>
            EBITDA %{fmtDec(ebitdaMarj)}
          </div>
          {s.toplamYatirim > 0 && (
            <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-[9px] font-black uppercase tracking-widest">
              CAPEX ₺{fmt(s.toplamYatirim / 1000000)}M
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} title="Düzenle" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-enba-dark transition-all">
            <Edit3 size={15} />
          </button>
          <button onClick={onCopy} title="Kopyala" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-enba-dark transition-all">
            <Copy size={15} />
          </button>
          <button onClick={onDelete} title="Sil" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-all">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailedPlanManager;
