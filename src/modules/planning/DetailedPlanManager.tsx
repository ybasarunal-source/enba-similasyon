import React, { useState, useMemo } from 'react';
import { usePlanSync } from '../../hooks/usePlanSync';
import { SyncBanner } from '../../components/SyncBanner';
import {
  BarChart3, Plus, Trash2, Edit3, Copy, FileText, Layout,
  Play, Save, ChevronDown, ChevronUp, TrendingUp, TrendingDown,
  ArrowLeft
} from 'lucide-react';
import { PlanningWizard } from './PlanningWizard';
import { calculateDetailedPlan } from '../../utils/detailedPlanCalculations';

/**
 * Enba Similasyon - Detaylı İş Planı Yönetim Ekranı
 * PlanningWizard'ı sarmalayan kart sistemi yöneticisi.
 * Her kayıt bir plan kartı olur, aktif kartlar konsolide TKKÖ'ya dahil edilir.
 */

// ── Types ──────────────────────────────────────────────────────
interface PlanVersion {
  tarih: string;
  planData: any;
  summary: {
    yillikGelir: number;
    yillikOpex: number;
    yillikEbitda: number;
    yillikNet: number;
    toplamYatirim: number;
    birimMaliyet: number;
    basabasNokta: number;
    geriOdemeSuresi: number | null;
  };
  not?: string;
}

interface DetailedPlanCard {
  id: string;
  supabaseId?: string;
  title: string;
  status: 'pending' | 'active';
  createdAt: string;
  updatedAt?: string;
  planData: any; // PlanningWizard's full planData object
  // Özet - 12 aylık toplamlar
  summary: {
    yillikGelir: number;
    yillikOpex: number;
    yillikEbitda: number;
    yillikNet: number;
    toplamYatirim: number;
    birimMaliyet: number;
    basabasNokta: number;
    geriOdemeSuresi: number | null;
  };
  versions?: PlanVersion[];
}

const STORAGE_KEY = 'enba_detailed_plans_v2';

// ── Finansal hesap (ReportStep mantığının basitleştirilmiş versiyonu) ──────────
function planOzetiHesapla(planData: any) {
  const result = calculateDetailedPlan(planData);
  return {
    yillikGelir: result.yearlySum.revenue,
    yillikOpex: result.yearlySum.opex + result.yearlySum.cogs,
    yillikEbitda: result.yearlySum.ebitda,
    yillikNet: result.yearlySum.netProfit,
    toplamYatirim: result.investmentAnalysis.toplamYatirim,
    birimMaliyet: result.yearlySum.satisTon > 0 ? (result.yearlySum.cogs + result.yearlySum.opex) / result.yearlySum.satisTon : 0,
    basabasNokta: result.investmentAnalysis.basabasNokta,
    geriOdemeSuresi: result.investmentAnalysis.geriOdemeSuresi
  };
}

// ── Kayıt Seçim Modalı ────────────────────────────────────
const SaveModal: React.FC<{
  onYeniVersiyon: (not: string) => void;
  onGuncelle: (not: string) => void;
  onYeniModel: (not: string) => void;
  onIptal: () => void;
}> = ({ onYeniVersiyon, onGuncelle, onYeniModel, onIptal }) => {
  const [not, setNot] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl space-y-5">
        <div className="text-center">
          <h2 className="text-xl font-black text-enba-dark uppercase tracking-tight italic">Değişiklikleri Kaydet</h2>
          <p className="text-sm text-gray-400 mt-2">Bu düzenlemeyi nasıl kaydetmek istersiniz?</p>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Versiyon Notu (opsiyonel)</label>
          <input
            type="text"
            value={not}
            onChange={e => setNot(e.target.value)}
            placeholder="Bu versiyonda ne değişti?"
            className="mt-2 w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-3 text-sm font-medium text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all"
          />
        </div>
        <div className="space-y-3">
          <button onClick={() => onYeniVersiyon(not)} className="w-full text-left px-6 py-4 bg-enba-orange/5 hover:bg-enba-orange/10 border-2 border-enba-orange/30 hover:border-enba-orange rounded-2xl transition-all">
            <div className="font-black text-enba-dark text-sm">Yeni Versiyon Olarak Kaydet</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Mevcut hali geçmişe taşır, değişiklikleri yeni sürüm olarak kaydeder</div>
          </button>
          <button onClick={() => onGuncelle(not)} className="w-full text-left px-6 py-4 bg-gray-50 hover:bg-gray-100 border-2 border-transparent rounded-2xl transition-all">
            <div className="font-black text-enba-dark text-sm">Mevcut Versiyonu Güncelle</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Geçmişe eklenmez, doğrudan üzerine yazılır</div>
          </button>
          <button onClick={() => onYeniModel(not)} className="w-full text-left px-6 py-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 hover:border-blue-300 rounded-2xl transition-all">
            <div className="font-black text-enba-dark text-sm">Farklı İş Modeli Olarak Kaydet</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Ayrı, bağımsız bir plan kartı oluşturur</div>
          </button>
        </div>
        <button onClick={onIptal} className="w-full text-center text-[11px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-[3px] transition-colors pt-1">
          İptal
        </button>
      </div>
    </div>
  );
};

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
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [pendingPlanData, setPendingPlanData] = useState<any>(null);

  const { planlar, kaydet, sil: planSilSync, syncStatus, syncError } = usePlanSync<DetailedPlanCard>({
    localKey: STORAGE_KEY,
    planType: 'detailed',
  });

  // ── Wizard'dan gelen save callback'i ──────────────────────
  const handleWizardSave = (planData: any) => {
    if (editingCard) {
      setPendingPlanData(planData);
      setSaveModalOpen(true);
    } else {
      const summary = planOzetiHesapla(planData);
      const yeniKart: DetailedPlanCard = {
        id: Date.now().toString(),
        title: planData.title || 'İsimsiz Plan',
        status: 'pending',
        createdAt: new Date().toISOString(),
        planData,
        summary,
        versions: [],
      };
      kaydet([...planlar, yeniKart]);
      setView('cards');
    }
  };

  const planKaydetDuzenle = (mod: 'yeni_versiyon' | 'guncelle' | 'yeni_model', not?: string) => {
    const now = new Date().toISOString();
    const summary = planOzetiHesapla(pendingPlanData);
    const mevcut = editingCard;
    if (!mevcut) return;

    if (mod === 'yeni_model') {
      kaydet([...planlar, {
        id: Date.now().toString(),
        title: pendingPlanData.title || 'İsimsiz Plan',
        status: 'pending', createdAt: now,
        planData: { ...pendingPlanData },
        summary,
        versions: [],
      }]);
    } else {
      const yeniKart: DetailedPlanCard = {
        ...mevcut,
        title: pendingPlanData.title || 'İsimsiz Plan',
        updatedAt: now,
        versions: mod === 'yeni_versiyon'
          ? [...(mevcut.versions || []), {
              tarih: mevcut.updatedAt || mevcut.createdAt,
              planData: mevcut.planData,
              summary: mevcut.summary,
              not: not?.trim() || undefined,
            }]
          : (mevcut.versions || []),
        planData: { ...pendingPlanData },
        summary,
      };
      kaydet(planlar.map(p => p.id === mevcut.id ? yeniKart : p));
    }
    setSaveModalOpen(false);
    setPendingPlanData(null);
    setEditingCard(null);
    setView('cards');
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
  const DEFAULT_SUMMARY = { yillikGelir: 0, yillikOpex: 0, yillikEbitda: 0, yillikNet: 0, toplamYatirim: 0, birimMaliyet: 0, basabasNokta: 0, geriOdemeSuresi: null };
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
                    <th className="py-3 px-4 text-[9px] font-black text-gray-300 text-right uppercase tracking-[1px]">% Fark</th>
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
                    // İlk iki plan arasındaki fark %
                    const vA = aktifPlanlar[0].summary[row.key] as number;
                    const vB = aktifPlanlar[1].summary[row.key] as number;
                    const farkRel = vB !== 0 ? ((vA - vB) / Math.abs(vB)) * 100 : 0;

                    return (
                      <tr key={row.key} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 text-[11px] font-black text-gray-400 uppercase tracking-[1px]">{row.label}</td>
                        {aktifPlanlar.map(p => (
                          <td key={p.id} className="py-3 px-4 text-right text-sm font-black text-gray-300 tabular-nums">
                            ₺{fmt(p.summary[row.key] as number)}
                          </td>
                        ))}
                        <td className={`py-3 px-4 text-right text-[10px] font-black tabular-nums ${farkRel > 0 ? 'text-emerald-400' : farkRel < 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                          {farkRel !== 0 ? `${farkRel > 0 ? '+' : ''}${fmtDec(farkRel)}%` : '—'}
                        </td>
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

      {saveModalOpen && (
        <SaveModal
          onYeniVersiyon={(not) => planKaydetDuzenle('yeni_versiyon', not)}
          onGuncelle={(not) => planKaydetDuzenle('guncelle', not)}
          onYeniModel={(not) => planKaydetDuzenle('yeni_model', not)}
          onIptal={() => { setSaveModalOpen(false); setPendingPlanData(null); }}
        />
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
                onRestoreVersion={(vIdx) => {
                  const v = plan.versions?.[vIdx];
                  if (!v) return;
                  kaydet(planlar.map(p => p.id === plan.id ? { ...p, planData: v.planData, summary: v.summary } : p));
                }}
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
                onRestoreVersion={(vIdx) => {
                  const v = plan.versions?.[vIdx];
                  if (!v) return;
                  kaydet(planlar.map(p => p.id === plan.id ? { ...p, planData: v.planData, summary: v.summary } : p));
                }}
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
  onRestoreVersion: (vIdx: number) => void;
}> = ({ plan, onToggle, onEdit, onCopy, onDelete, onRestoreVersion }) => {
  const aktif = plan.status === 'active';
  const s = plan.summary;
  const ebitdaMarj = s.yillikGelir > 0 ? (s.yillikEbitda / s.yillikGelir) * 100 : 0;
  const [vOpen, setVOpen] = useState(false);

  return (
    <div className={`bg-white rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden shadow-card ${aktif ? 'border-enba-orange shadow-enba-orange/10' : 'border-transparent'}`}>
      {/* Kart Başlığı */}
      <div className={`px-8 py-5 ${aktif ? 'bg-enba-orange/5' : 'bg-gray-50'} border-b border-gray-100 flex items-start justify-between gap-4`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {aktif && <div className="w-2 h-2 rounded-full bg-enba-orange animate-pulse flex-shrink-0" />}
            <h3 className="font-black text-enba-dark text-sm uppercase tracking-tight truncate">{plan.title}</h3>
          </div>
          <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <span>{new Date(plan.createdAt).toLocaleDateString('tr-TR')}</span>
            <span>·</span>
            <span>{plan.planData?.currency || 'TRY'}</span>
            {plan.versions && plan.versions.length > 0 && (
              <button onClick={() => setVOpen(!vOpen)} className="flex items-center gap-1 px-2 py-0.5 bg-enba-dark text-white rounded-md hover:bg-black transition-colors">
                V{plan.versions.length + 1} {vOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            )}
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

      {/* Versiyon Listesi Dropdown */}
      {vOpen && plan.versions && (
        <div className="bg-gray-900 text-white p-4 space-y-3 animate-in slide-in-from-top duration-300">
          <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Geçmiş Versiyonlar</div>
          {plan.versions.map((v, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 group">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black text-gray-300">V{idx + 1} · {new Date(v.tarih).toLocaleDateString('tr-TR')}</div>
                <div className="text-[9px] text-gray-500 truncate mt-0.5">{v.not || 'Not eklenmemiş'}</div>
              </div>
              <button onClick={() => { onRestoreVersion(idx); setVOpen(false); }} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">Geri Yükle</button>
            </div>
          )).reverse()}
        </div>
      )}

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

      {/* Ek KPI'lar: Başabaş & Geri Ödeme */}
      <div className="grid grid-cols-2 gap-px bg-gray-100 border-t border-gray-100">
        <div className="bg-white px-6 py-4 border-r border-gray-50">
           <div className="text-[8px] font-black text-gray-400 uppercase tracking-[2px]">Başabaş Noktası</div>
           <div className="text-[11px] font-black text-enba-dark mt-1">{s.basabasNokta === Infinity ? '∞' : `${fmt(s.basabasNokta)} ton/ay`}</div>
        </div>
        <div className="bg-white px-6 py-4">
           <div className="text-[8px] font-black text-gray-400 uppercase tracking-[2px]">Geri Ödeme</div>
           <div className={`text-[11px] font-black mt-1 ${!s.geriOdemeSuresi ? 'text-gray-400' : s.geriOdemeSuresi <= 36 ? 'text-emerald-500' : s.geriOdemeSuresi <= 60 ? 'text-yellow-500' : 'text-rose-500'}`}>
              {s.geriOdemeSuresi ? `${fmtDec(s.geriOdemeSuresi)} ay` : '—'}
           </div>
        </div>
      </div>

      {/* Marj + Eylemler */}
      <div className="px-8 py-5 flex items-center justify-between border-t border-gray-50">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${ebitdaMarj >= 15 ? 'bg-emerald-100 text-emerald-700' : ebitdaMarj >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-rose-100 text-rose-700'}`}>
            EBITDA %{fmtDec(ebitdaMarj)}
          </div>
          <div className="px-3 py-1 rounded-full bg-enba-dark/5 text-enba-dark text-[9px] font-black uppercase tracking-widest">
            ₺{fmt(s.birimMaliyet)}/ton
          </div>
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
