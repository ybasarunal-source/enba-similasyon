import React, { useState, useMemo } from 'react';
import { usePlanSync } from '../hooks/usePlanSync';
import { SyncBanner } from '../components/SyncBanner';
import {
  Zap, Package, Factory,
  Users, BarChart3,
  Plus, Trash2, Save, ChevronDown, ChevronUp,
  Play, Edit3, Copy, FileText, Layout, ArrowRight
} from 'lucide-react';

/**
 * Enba Similasyon - Hızlı İş Planı Modülü
 * Plan Kartı Sistemi: Kaydet → Kartta görüntüle → Aktifleştir → Konsolide analiz
 */

// ─── Types ────────────────────────────────────────────────────
interface PersonelItem {
  id: number;
  unvan: string;
  kisiSayisi: number;
  ekMaas: number;
  isAyiklama: boolean;
}

interface GiderItem {
  id: number;
  ad: string;
  tutar: number;
}

interface PlanParams {
  aylikTon: number;
  alisFiyati: number;
  satisFiyati: number;
  alisNakliye: number;
  satisNakliye: number;
  uretimFiresi: number;
  copOrani: number;
  ayiklamaVar: boolean;
  elektrikKwFiyat: number;
  aylikGun: number;
  gunlukSaat: number;
  vardiyaSayisi: number;
  personelListesi: PersonelItem[];
  ektraGiderler: GiderItem[];
  capex: number;
  amortismanAy: number;
}

interface PlanSonuc {
  satisTon: number;
  satisGeliri: number;
  malAlisGideri: number;
  alisNakliyeGideri: number;
  satisNakliyeGideri: number;
  toplamMaas: number;
  toplamSgk: number;
  toplamYemek: number;
  toplamEktra: number;
  totalGider: number;
  ebitda: number;
  netKar: number;
  ebitdaMarji: number;
  aylikAmortisman: number;
  birimMaliyet: number;
}

interface PlanCard {
  id: string;
  supabaseId?: string;
  baslik: string;
  aciklama: string;
  status: 'pending' | 'active';
  createdAt: string;
  params: PlanParams;
  sonuc: PlanSonuc;
}

// ─── Constants ────────────────────────────────────────────────
const ASGARI_NET = 28075.5;
const ASGARI_SGK = 12799.13;
const YEMEK = 200;
const STORAGE_KEY = 'enba_fast_plans_v2';

// ─── Helpers ────────────────────────────────────────────────
const fmt = (n: number) =>
  (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec = (n: number, d = 1) =>
  (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });

function hesapla(p: PlanParams): PlanSonuc {
  const copTon = p.ayiklamaVar ? p.aylikTon * (p.copOrani / 100) : 0;
  const satisTon = (p.aylikTon - copTon) * (1 - p.uretimFiresi / 100);
  const satisGeliri = satisTon * p.satisFiyati;
  const malAlisGideri = p.aylikTon * p.alisFiyati;
  const alisNakliyeGideri = p.aylikTon * p.alisNakliye;
  const satisNakliyeGideri = satisTon * p.satisNakliye;
  let toplamMaas = 0, toplamSgk = 0, toplamYemek = 0;
  p.personelListesi.forEach(per => {
    const kisi = per.kisiSayisi * p.vardiyaSayisi;
    toplamMaas += (ASGARI_NET + per.ekMaas) * kisi;
    toplamSgk += ASGARI_SGK * kisi;
    toplamYemek += YEMEK * p.aylikGun * kisi;
  });
  const toplamEktra = p.ektraGiderler.reduce((s, g) => s + g.tutar, 0);
  const totalGider = malAlisGideri + alisNakliyeGideri + satisNakliyeGideri +
    toplamMaas + toplamSgk + toplamYemek + toplamEktra;
  const aylikAmortisman = p.capex > 0 ? p.capex / p.amortismanAy : 0;
  const ebitda = satisGeliri - totalGider;
  const netKar = ebitda - aylikAmortisman;
  const ebitdaMarji = satisGeliri > 0 ? (ebitda / satisGeliri) * 100 : 0;
  const birimMaliyet = satisTon > 0 ? totalGider / satisTon : 0;
  return {
    satisTon, satisGeliri, malAlisGideri, alisNakliyeGideri, satisNakliyeGideri,
    toplamMaas, toplamSgk, toplamYemek, toplamEktra, totalGider,
    ebitda, netKar, ebitdaMarji, aylikAmortisman, birimMaliyet,
  };
}

const VARSAYILAN_PARAMS: PlanParams = {
  aylikTon: 0, alisFiyati: 0, satisFiyati: 0,
  alisNakliye: 0, satisNakliye: 0, uretimFiresi: 0,
  copOrani: 0, ayiklamaVar: false, elektrikKwFiyat: 0,
  aylikGun: 26, gunlukSaat: 8, vardiyaSayisi: 1,
  personelListesi: [],
  ektraGiderler: [], capex: 0, amortismanAy: 36,
};

// ─── InputRow (dışarıda — her render'da yeniden oluşturulmasın) ──
const InputRow: React.FC<{
  label: string; value: number;
  onChange: (v: number) => void;
  suffix?: string; min?: number; max?: number; step?: number;
}> = ({ label, value, onChange, suffix = '', min = 0, max = 9999999, step = 1 }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] flex-shrink-0">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        onFocus={e => e.target.select()}
        className="w-32 text-right bg-gray-50 border border-transparent rounded-xl px-4 py-2 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all tabular-nums"
      />
      {suffix && <span className="text-[10px] font-black text-gray-400 uppercase w-10">{suffix}</span>}
    </div>
  </div>
);

// ─── Panel (dışarıda — her render'da yeniden oluşturulmasın) ─────
const Panel: React.FC<{
  title: string; icon: React.ReactNode; open: boolean;
  onToggle: () => void; children: React.ReactNode; badge?: string;
}> = ({ title, icon, open, onToggle, children, badge }) => (
  <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center justify-between px-8 py-5 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-enba-dark/5 rounded-xl flex items-center justify-center text-enba-orange">{icon}</div>
        <span className="text-[11px] font-black text-enba-dark uppercase tracking-[2px] italic">{title}</span>
        {badge && <span className="px-2 py-0.5 bg-enba-orange/10 text-enba-orange text-[9px] font-black uppercase tracking-widest rounded-full">{badge}</span>}
      </div>
      {open ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
    </button>
    {open && <div className="px-8 pb-8">{children}</div>}
  </div>
);

// ─── Main Component ──────────────────────────────────────────
export const FastPlan: React.FC = () => {
  // Görünüm: 'cards' (plan listesi) veya 'form' (yeni/düzenleme formu)
  const [view, setView] = useState<'cards' | 'form'>('cards');
  const [duzenlemId, setDuzenlemId] = useState<string | null>(null);
  const { planlar, kaydet, sil: planSilSync, syncStatus, syncError } = usePlanSync<PlanCard>({
    localKey: STORAGE_KEY,
    planType: 'fast',
  });

  // Form state
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [params, setParams] = useState<PlanParams>({ ...VARSAYILAN_PARAMS });
  const [yeniPersonel, setYeniPersonel] = useState({ unvan: '', kisiSayisi: 1, ekMaas: 0, isAyiklama: false });
  const [yeniGider, setYeniGider] = useState({ ad: '', tutar: '' });

  // Panel açıklıkları
  const [panelOp, setPanelOp] = useState(true);
  const [panelPer, setPanelPer] = useState(true);
  const [panelGider, setPanelGider] = useState(false);


  // ─── Anlık hesaplama (form önizlemesi) ────────────────────
  const formSonuc = useMemo(() => hesapla(params), [params]);

  // ─── Aktif planların konsolide sonucu ─────────────────────
  const aktifPlanlar = planlar.filter(p => p.status === 'active');
  const konsolide = useMemo(() => {
    if (aktifPlanlar.length === 0) return null;
    return {
      satisGeliri: aktifPlanlar.reduce((s, p) => s + p.sonuc.satisGeliri, 0),
      totalGider: aktifPlanlar.reduce((s, p) => s + p.sonuc.totalGider, 0),
      ebitda: aktifPlanlar.reduce((s, p) => s + p.sonuc.ebitda, 0),
      netKar: aktifPlanlar.reduce((s, p) => s + p.sonuc.netKar, 0),
      satisTon: aktifPlanlar.reduce((s, p) => s + p.sonuc.satisTon, 0),
    };
  }, [aktifPlanlar]);

  // ─── CRUD ────────────────────────────────────────────────
  const planKaydet = () => {
    if (!baslik.trim()) { alert('Lütfen plana bir başlık verin.'); return; }
    const sonuc = hesapla(params);
    const yeniKart: PlanCard = {
      id: duzenlemId || Date.now().toString(),
      baslik: baslik.trim(),
      aciklama: aciklama.trim(),
      status: duzenlemId
        ? (planlar.find(p => p.id === duzenlemId)?.status || 'pending')
        : 'pending',
      createdAt: duzenlemId
        ? (planlar.find(p => p.id === duzenlemId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
      params: { ...params },
      sonuc,
    };
    const yeniPlanlar = duzenlemId
      ? planlar.map(p => p.id === duzenlemId ? yeniKart : p)
      : [...planlar, yeniKart];
    kaydet(yeniPlanlar);
    setView('cards');
    setDuzenlemId(null);
    setBaslik(''); setAciklama(''); setParams({ ...VARSAYILAN_PARAMS });
  };

  const planDuzenle = (plan: PlanCard) => {
    setDuzenlemId(plan.id);
    setBaslik(plan.baslik);
    setAciklama(plan.aciklama);
    setParams({ ...plan.params });
    setView('form');
  };

  const planKopyala = (plan: PlanCard) => {
    const kopya: PlanCard = {
      ...plan,
      id: Date.now().toString(),
      supabaseId: undefined,
      baslik: `${plan.baslik} (Kopya)`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    kaydet([...planlar, kopya]);
  };

  const planSil = (id: string) => {
    if (!window.confirm('Bu plan kartı silinecek. Emin misiniz?')) return;
    planSilSync(id);
  };

  const statusToggle = (id: string) => {
    kaydet(planlar.map(p =>
      p.id === id ? { ...p, status: p.status === 'active' ? 'pending' : 'active' } : p
    ));
  };

  // ─── Param helpers ───────────────────────────────────────
  const setParam = <K extends keyof PlanParams>(key: K, val: PlanParams[K]) =>
    setParams(prev => ({ ...prev, [key]: val }));

  const personelEkle = () => {
    if (!yeniPersonel.unvan || yeniPersonel.kisiSayisi < 1) return;
    setParam('personelListesi', [...params.personelListesi, { ...yeniPersonel, id: Date.now() }]);
    setYeniPersonel({ unvan: '', kisiSayisi: 1, ekMaas: 0, isAyiklama: false });
  };

  const personelSil = (id: number) =>
    setParam('personelListesi', params.personelListesi.filter(p => p.id !== id));

  const giderEkle = () => {
    if (!yeniGider.ad || !yeniGider.tutar) return;
    setParam('ektraGiderler', [...params.ektraGiderler, { id: Date.now(), ad: yeniGider.ad, tutar: Number(yeniGider.tutar) }]);
    setYeniGider({ ad: '', tutar: '' });
  };

  const giderSil = (id: number) =>
    setParam('ektraGiderler', params.ektraGiderler.filter(g => g.id !== id));

  // ─── UI Helpers ──────────────────────────────────────────
  const kpiColor = (val: number) =>
    val > 0 ? 'text-emerald-600' : val < 0 ? 'text-rose-600' : 'text-gray-400';

  // ════════════════════════════════════════════════════════
  // VIEW: PLAN KARTLARI
  // ════════════════════════════════════════════════════════
  if (view === 'cards') {
    return (
      <div className="flex flex-col gap-10 p-10 animate-in fade-in duration-1000">
        <SyncBanner status={syncStatus} error={syncError} onRetry={() => kaydet(planlar)} />
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-enba-dark rounded-[1.2rem] flex items-center justify-center text-enba-orange shadow-2xl border border-white/5">
                <Zap size={28} className="fill-enba-orange" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-enba-dark tracking-tighter leading-none uppercase">Hızlı İş Planı</h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mt-2">Anlık Kârlılık & Fizibilite — Kart Sistemi</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setDuzenlemId(null); setBaslik(''); setAciklama(''); setParams({ ...VARSAYILAN_PARAMS }); setView('form'); }}
            className="flex items-center gap-3 px-8 py-4 bg-enba-orange text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[3px] shadow-2xl shadow-enba-orange/30 hover:brightness-110 transition-all active:scale-95"
          >
            <Plus size={20} /> Yeni Plan Oluştur
          </button>
        </div>

        {/* Konsolide Panel — aktif planlar varsa */}
        {konsolide && aktifPlanlar.length > 0 && (
          <div className="bg-enba-dark rounded-[2.5rem] p-10 border border-white/5 shadow-2xl shadow-enba-dark/30">
            <div className="flex items-center gap-4 mb-8">
              <Layout size={22} className="text-enba-orange" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">
                KONSOLİDE TESIS ÖZETI — {aktifPlanlar.length} Aktif Plan
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { label: 'Toplam Satış Tonu', value: `${fmtDec(konsolide.satisTon)} ton`, color: 'text-white' },
                { label: 'Toplam Gelir', value: `₺${fmt(konsolide.satisGeliri)}`, color: 'text-emerald-400' },
                { label: 'Toplam Gider', value: `₺${fmt(konsolide.totalGider)}`, color: 'text-rose-400' },
                { label: 'FAVÖK', value: `₺${fmt(konsolide.ebitda)}`, color: konsolide.ebitda >= 0 ? 'text-emerald-400' : 'text-rose-400' },
                { label: 'Net Kâr / Zarar', value: `₺${fmt(konsolide.netKar)}`, color: konsolide.netKar >= 0 ? 'text-enba-orange' : 'text-rose-400' },
              ].map((kpi, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="text-[9px] font-black text-gray-500 uppercase tracking-[2px]">{kpi.label}</div>
                  <div className={`text-xl font-black tabular-nums ${kpi.color}`}>{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* Aktif plan bazlı tablo */}
            {aktifPlanlar.length > 1 && (
              <div className="mt-8 overflow-x-auto">
                <table className="w-full text-left" id="tkko-table">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-3 text-[9px] font-black text-gray-500 uppercase tracking-[2px]">Finansal Kalem</th>
                      {aktifPlanlar.map(p => (
                        <th key={p.id} className="py-3 px-4 text-[9px] font-black text-white text-right uppercase tracking-[1px]">{p.baslik}</th>
                      ))}
                      <th className="py-3 px-4 text-[9px] font-black text-enba-orange text-right uppercase tracking-[2px]">TOPLAM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { label: 'Satış Geliri', key: 'satisGeliri' as keyof PlanSonuc },
                      { label: 'Toplam Gider', key: 'totalGider' as keyof PlanSonuc },
                      { label: 'FAVÖK', key: 'ebitda' as keyof PlanSonuc },
                      { label: 'Net Kâr', key: 'netKar' as keyof PlanSonuc },
                    ].map(row => {
                      const toplam = aktifPlanlar.reduce((s, p) => s + (p.sonuc[row.key] as number), 0);
                      return (
                        <tr key={row.key} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 text-[11px] font-black text-gray-400 uppercase tracking-[1px]">{row.label}</td>
                          {aktifPlanlar.map(p => (
                            <td key={p.id} className="py-3 px-4 text-right text-sm font-black text-gray-300 tabular-nums">
                              ₺{fmt(p.sonuc[row.key] as number)}
                            </td>
                          ))}
                          <td className={`py-3 px-4 text-right text-sm font-black tabular-nums ${toplam >= 0 ? 'text-enba-orange' : 'text-rose-400'}`}>
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
        {planlar.length === 0 && (
          <div className="bg-white rounded-[2.5rem] p-20 border border-gray-100 shadow-card flex flex-col items-center gap-6 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
              <FileText size={48} className="text-gray-200" />
            </div>
            <div>
              <div className="text-xl font-black text-enba-dark italic uppercase tracking-tight">Henüz Plan Yok</div>
              <p className="text-sm text-gray-400 font-medium mt-2">Yeni Plan Oluştur butonuna tıklayarak ilk planınızı oluşturun.</p>
            </div>
            <button
              onClick={() => { setDuzenlemId(null); setBaslik(''); setAciklama(''); setParams({ ...VARSAYILAN_PARAMS }); setView('form'); }}
              className="flex items-center gap-3 px-8 py-4 bg-enba-dark text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[3px] shadow-xl hover:bg-black transition-all"
            >
              <Plus size={18} /> İlk Planı Oluştur
            </button>
          </div>
        )}

        {/* Plan Kartları Izgara */}
        {planlar.length > 0 && (
          <>
            {/* Bekleyen Planlar */}
            {planlar.filter(p => p.status === 'pending').length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">
                    Bekleyen Planlar — {planlar.filter(p => p.status === 'pending').length} Kart
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {planlar.filter(p => p.status === 'pending').map(plan => (
                    <PlanKartBileseni
                      key={plan.id} plan={plan}
                      onToggle={() => statusToggle(plan.id)}
                      onEdit={() => planDuzenle(plan)}
                      onCopy={() => planKopyala(plan)}
                      onDelete={() => planSil(plan.id)}
                      kpiColor={kpiColor} fmt={fmt} fmtDec={fmtDec}
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
                    <PlanKartBileseni
                      key={plan.id} plan={plan}
                      onToggle={() => statusToggle(plan.id)}
                      onEdit={() => planDuzenle(plan)}
                      onCopy={() => planKopyala(plan)}
                      onDelete={() => planSil(plan.id)}
                      kpiColor={kpiColor} fmt={fmt} fmtDec={fmtDec}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // VIEW: FORM
  // ════════════════════════════════════════════════════════
  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={() => { setDuzenlemId(null); setBaslik(''); setAciklama(''); setParams({ ...VARSAYILAN_PARAMS }); setView('cards'); }} className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all">
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-enba-dark tracking-tighter leading-none italic uppercase">
              {duzenlemId ? 'Planı Düzenle' : 'Yeni Hızlı Plan'}
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mt-1">Parametreleri girin, anlık sonuçları görün, kaydedin</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => { setDuzenlemId(null); setBaslik(''); setAciklama(''); setParams({ ...VARSAYILAN_PARAMS }); setView('cards'); }} className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-black text-[11px] uppercase tracking-[2px] transition-all">
            İptal
          </button>
          <button onClick={planKaydet} className="flex items-center gap-3 px-8 py-3.5 bg-enba-orange text-white rounded-2xl font-black text-[11px] uppercase tracking-[2px] shadow-xl shadow-enba-orange/30 hover:brightness-110 transition-all active:scale-95">
            <Save size={16} /> Planı Kaydet
          </button>
        </div>
      </div>

      {/* Plan Başlığı */}
      <div className="bg-white rounded-[2.5rem] px-10 py-8 shadow-card border border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Plan Başlığı *</label>
            <input
              type="text"
              value={baslik}
              onChange={e => setBaslik(e.target.value)}
              placeholder="Örn: 2026 LDPE Geri Dönüşüm Projesi..."
              className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 text-base font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Kısa Açıklama</label>
            <input
              type="text"
              value={aciklama}
              onChange={e => setAciklama(e.target.value)}
              placeholder="Bu plan neyi hedefliyor?"
              className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 text-base font-medium text-gray-600 focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Anlık KPI Önizleme */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Satış Geliri', value: `₺${fmt(formSonuc.satisGeliri)}`, sub: `${fmtDec(formSonuc.satisTon)} ton`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Toplam Gider', value: `₺${fmt(formSonuc.totalGider)}`, sub: `₺${fmt(formSonuc.birimMaliyet)}/ton`, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'FAVÖK', value: `₺${fmt(formSonuc.ebitda)}`, sub: `%${fmtDec(formSonuc.ebitdaMarji)} marj`, color: kpiColor(formSonuc.ebitda), bg: formSonuc.ebitda >= 0 ? 'bg-emerald-50' : 'bg-rose-50' },
          { label: 'Net Kâr', value: `₺${fmt(formSonuc.netKar)}`, sub: formSonuc.netKar >= 0 ? 'Kârlı ✓' : 'Zarar ✗', color: kpiColor(formSonuc.netKar), bg: formSonuc.netKar >= 0 ? 'bg-emerald-50' : 'bg-rose-50' },
        ].map((kpi, i) => (
          <div key={i} className={`${kpi.bg} rounded-[2.5rem] p-7`}>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-[2px] mb-1">{kpi.label}</div>
            <div className={`text-2xl font-black ${kpi.color} tabular-nums leading-none`}>{kpi.value}</div>
            <div className="text-[10px] text-gray-400 mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Sol: Giriş Panelleri */}
        <div className="xl:col-span-7 space-y-5">
          <Panel title="Operasyon Parametreleri" icon={<Factory size={18} />} open={panelOp} onToggle={() => setPanelOp(v => !v)}>
            <InputRow label="Aylık Giren Ton" value={params.aylikTon} onChange={v => setParam('aylikTon', v)} suffix="ton" step={10} />
            <InputRow label="Alış Fiyatı" value={params.alisFiyati} onChange={v => setParam('alisFiyati', v)} suffix="₺/ton" step={100} />
            <InputRow label="Satış Fiyatı" value={params.satisFiyati} onChange={v => setParam('satisFiyati', v)} suffix="₺/ton" step={100} />
            <InputRow label="Alış Nakliyesi" value={params.alisNakliye} onChange={v => setParam('alisNakliye', v)} suffix="₺/ton" />
            <InputRow label="Satış Nakliyesi" value={params.satisNakliye} onChange={v => setParam('satisNakliye', v)} suffix="₺/ton" />
            <InputRow label="Üretim Firesi" value={params.uretimFiresi} onChange={v => setParam('uretimFiresi', v)} suffix="%" max={99} step={0.5} />
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Ayıklama / Ayrıştırma</label>
              <button onClick={() => setParam('ayiklamaVar', !params.ayiklamaVar)}
                className={`w-12 h-6 rounded-full transition-colors relative ${params.ayiklamaVar ? 'bg-enba-orange' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow ${params.ayiklamaVar ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            {params.ayiklamaVar && (
              <InputRow label="Çöp / Fire Oranı" value={params.copOrani} onChange={v => setParam('copOrani', v)} suffix="%" max={99} step={0.5} />
            )}
            <InputRow label="Elektrik ₺/kWh" value={params.elektrikKwFiyat} onChange={v => setParam('elektrikKwFiyat', v)} suffix="₺/kWh" step={0.1} />
            <InputRow label="Aylık Çalışma Günü" value={params.aylikGun} onChange={v => setParam('aylikGun', v)} suffix="gün" min={1} max={31} />
            <InputRow label="Vardiya Sayısı" value={params.vardiyaSayisi} onChange={v => setParam('vardiyaSayisi', v)} suffix="vardiya" min={1} max={3} />
          </Panel>

          <Panel
            title="Personel" icon={<Users size={18} />} open={panelPer}
            onToggle={() => setPanelPer(v => !v)}
            badge={`${params.personelListesi.reduce((s, p) => s + p.kisiSayisi * params.vardiyaSayisi, 0)} kişi`}
          >
            <div className="space-y-3 mb-5">
              {params.personelListesi.map(p => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 bg-gray-50 rounded-2xl">
                  <div className="flex-1">
                    <div className="font-black text-sm text-enba-dark">{p.unvan}</div>
                    <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                      {p.kisiSayisi}×{params.vardiyaSayisi} = {p.kisiSayisi * params.vardiyaSayisi} kişi
                      {p.isAyiklama && ' · Ayıklama'}
                    </div>
                  </div>
                  <span className="text-sm font-black text-enba-orange tabular-nums">
                    ₺{fmt((ASGARI_NET + p.ekMaas) * p.kisiSayisi * params.vardiyaSayisi)}
                  </span>
                  <button onClick={() => personelSil(p.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-3">
              <input type="text" placeholder="Unvan..." value={yeniPersonel.unvan}
                onChange={e => setYeniPersonel({ ...yeniPersonel, unvan: e.target.value })}
                className="col-span-2 bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-medium text-enba-dark outline-none focus:ring-2 focus:ring-enba-orange/20" />
              <input type="number" placeholder="Kişi" min={1} value={yeniPersonel.kisiSayisi}
                onFocus={e => e.target.select()}
                onChange={e => setYeniPersonel({ ...yeniPersonel, kisiSayisi: Number(e.target.value) })}
                className="bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-medium text-enba-dark outline-none focus:ring-2 focus:ring-enba-orange/20" />
              <div className="relative">
                <input type="number" placeholder="0" min={0} value={yeniPersonel.ekMaas || ''}
                  onFocus={e => e.target.select()}
                  onChange={e => setYeniPersonel({ ...yeniPersonel, ekMaas: e.target.value === '' ? 0 : Number(e.target.value) })}
                  className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-medium text-enba-dark outline-none focus:ring-2 focus:ring-enba-orange/20" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">+₺</span>
              </div>
              <button onClick={personelEkle} className="flex items-center justify-center gap-1 bg-enba-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-[1px] hover:bg-black transition-all">
                <Plus size={14} /> Ekle
              </button>
            </div>
            <div className="flex gap-2 mt-2 text-[9px] font-black text-gray-300 uppercase tracking-widest px-1">
              <span className="col-span-2 flex-[2]">Unvan</span>
              <span className="flex-1 text-center">Kişi</span>
              <span className="flex-1 text-center">Asgari Üzeri Ek</span>
            </div>
          </Panel>

          <Panel title="CAPEX & Diğer Giderler" icon={<Package size={18} />} open={panelGider} onToggle={() => setPanelGider(v => !v)}>
            <div className="p-5 bg-enba-dark/5 rounded-2xl mb-5 space-y-3">
              <div className="text-[10px] font-black text-enba-dark uppercase tracking-[2px]">Yatırım Maliyeti (CAPEX)</div>
              <InputRow label="Toplam CAPEX" value={params.capex} onChange={v => setParam('capex', v)} suffix="₺" step={10000} />
              <InputRow label="Amortisman (Ay)" value={params.amortismanAy} onChange={v => setParam('amortismanAy', v)} suffix="ay" min={1} max={240} />
              {params.capex > 0 && (
                <div className="text-[11px] font-black text-enba-orange">→ Aylık: ₺{fmt(params.capex / params.amortismanAy)}</div>
              )}
            </div>
            <div className="space-y-3 mb-4">
              {params.ektraGiderler.map(g => (
                <div key={g.id} className="flex items-center gap-4 px-5 py-4 bg-gray-50 rounded-2xl">
                  <div className="flex-1 text-sm font-medium text-enba-dark">{g.ad}</div>
                  <span className="font-black text-rose-500 tabular-nums text-sm">₺{fmt(g.tutar)}</span>
                  <button onClick={() => giderSil(g.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <input type="text" placeholder="Gider adı..." value={yeniGider.ad}
                onChange={e => setYeniGider({ ...yeniGider, ad: e.target.value })}
                className="flex-1 bg-gray-50 rounded-2xl px-5 py-3 text-sm font-medium text-enba-dark outline-none focus:ring-2 focus:ring-enba-orange/20" />
              <input type="number" placeholder="₺" value={yeniGider.tutar}
                onChange={e => setYeniGider({ ...yeniGider, tutar: e.target.value })}
                className="w-28 bg-gray-50 rounded-2xl px-4 py-3 text-sm font-medium text-enba-dark outline-none focus:ring-2 focus:ring-enba-orange/20" />
              <button onClick={giderEkle} className="flex items-center gap-2 px-5 py-3 bg-enba-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-[1px] hover:bg-black transition-all">
                <Plus size={14} /> Ekle
              </button>
            </div>
          </Panel>
        </div>

        {/* Sağ: Detaylı P&L önizleme */}
        <div className="xl:col-span-5 space-y-5 sticky top-10">
          {/* Kütle Dengesi */}
          <div className="bg-enba-dark rounded-[2.5rem] p-8 text-white border border-white/5">
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-[3px] mb-5 flex items-center gap-2">
              <Factory size={14} className="text-enba-orange" /> Kütle Dengesi
            </div>
            {[
              { label: 'Giren Hammadde', value: `${fmtDec(params.aylikTon)} ton`, color: 'text-white' },
              { label: 'Çöp / Ayrışma', value: params.ayiklamaVar ? `-${fmtDec(params.aylikTon * params.copOrani / 100)} ton` : 'Yok', color: 'text-yellow-400' },
              { label: 'Üretim Firesi', value: `-${fmtDec(params.aylikTon * params.uretimFiresi / 100)} ton`, color: 'text-rose-400' },
              { label: 'Net Satış Tonu', value: `${fmtDec(formSonuc.satisTon)} ton`, color: 'text-emerald-400' },
            ].map((r, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[1px]">{r.label}</span>
                <span className={`font-black tabular-nums ${r.color}`}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* P&L Tablosu */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-gray-100 space-y-3">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-enba-orange" /> Aylık P&L
            </div>
            <div className="px-5 py-4 bg-emerald-50 rounded-xl flex justify-between">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Satış Geliri</span>
              <span className="font-black text-emerald-700 tabular-nums">₺{fmt(formSonuc.satisGeliri)}</span>
            </div>
            {[
              ['Mal Alış', formSonuc.malAlisGideri],
              ['Alış Nakliye', formSonuc.alisNakliyeGideri],
              ['Satış Nakliye', formSonuc.satisNakliyeGideri],
              ['Personel Maaş', formSonuc.toplamMaas],
              ['SGK İşveren', formSonuc.toplamSgk],
              ['Yemek', formSonuc.toplamYemek],
              ...(formSonuc.toplamEktra > 0 ? [['Diğer', formSonuc.toplamEktra]] : []),
            ].map(([label, val], i) => (
              <div key={i} className="flex justify-between px-5 py-1.5 text-sm">
                <span className="text-gray-400 font-medium">{label as string}</span>
                <span className="font-black text-rose-400 tabular-nums">-₺{fmt(val as number)}</span>
              </div>
            ))}
            <div className="h-px bg-gray-100" />
            <div className={`flex justify-between px-5 py-4 rounded-xl ${formSonuc.ebitda >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
              <span className="text-[10px] font-black uppercase tracking-[2px] text-gray-600">FAVÖK</span>
              <span className={`font-black tabular-nums ${kpiColor(formSonuc.ebitda)}`}>₺{fmt(formSonuc.ebitda)}</span>
            </div>
            {formSonuc.aylikAmortisman > 0 && (
              <div className="flex justify-between px-5 py-1.5 text-sm">
                <span className="text-gray-400 font-medium">Amortisman</span>
                <span className="font-black text-gray-400 tabular-nums">-₺{fmt(formSonuc.aylikAmortisman)}</span>
              </div>
            )}
            <div className={`flex justify-between px-6 py-5 rounded-[1.25rem] ${formSonuc.netKar >= 0 ? 'bg-enba-dark' : 'bg-rose-600'} text-white`}>
              <span className="text-[10px] font-black uppercase tracking-[2px]">NET KÂR / ZARAR</span>
              <span className="font-black tabular-nums text-lg">₺{fmt(formSonuc.netKar)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Plan Kartı Bileşeni ─────────────────────────────────────
const PlanKartBileseni: React.FC<{
  plan: PlanCard;
  onToggle: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  kpiColor: (v: number) => string;
  fmt: (n: number) => string;
  fmtDec: (n: number) => string;
}> = ({ plan, onToggle, onEdit, onCopy, onDelete, kpiColor, fmt, fmtDec }) => {
  const aktif = plan.status === 'active';
  const s = plan.sonuc;
  return (
    <div className={`bg-white rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden shadow-card ${aktif ? 'border-enba-orange shadow-enba-orange/10' : 'border-transparent'}`}>
      <div className={`px-8 py-5 ${aktif ? 'bg-enba-orange/5' : 'bg-gray-50'} border-b border-gray-100 flex items-start justify-between gap-4`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {aktif && <div className="w-2 h-2 rounded-full bg-enba-orange animate-pulse flex-shrink-0" />}
            <h3 className="font-black text-enba-dark text-sm uppercase tracking-tight truncate">{plan.baslik}</h3>
          </div>
          {plan.aciklama && (
            <p className="text-[10px] text-gray-400 font-medium truncate">{plan.aciklama}</p>
          )}
          <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1.5">
            {new Date(plan.createdAt).toLocaleDateString('tr-TR')} · {fmtDec(plan.params.aylikTon)} ton/ay
          </div>
        </div>
        <button
          onClick={onToggle}
          title={aktif ? 'Pasife Al' : 'Aktifleştir'}
          className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all ${aktif ? 'bg-enba-orange text-white shadow-lg shadow-enba-orange/30' : 'bg-gray-100 text-gray-400 hover:bg-enba-orange/10 hover:text-enba-orange'}`}
        >
          {aktif ? <Play size={16} className="fill-white" /> : <Play size={16} />}
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-px bg-gray-100">
        {[
          { label: 'Gelir', value: `₺${fmt(s.satisGeliri)}`, color: 'text-emerald-600' },
          { label: 'Gider', value: `₺${fmt(s.totalGider)}`, color: 'text-rose-500' },
          { label: 'FAVÖK', value: `₺${fmt(s.ebitda)}`, color: kpiColor(s.ebitda) },
          { label: 'Net Kâr', value: `₺${fmt(s.netKar)}`, color: kpiColor(s.netKar) },
        ].map((kpi, i) => (
          <div key={i} className="bg-white px-6 py-5">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">{kpi.label}</div>
            <div className={`text-base font-black tabular-nums ${kpi.color} leading-tight mt-1`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Marj + Actions */}
      <div className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.ebitdaMarji >= 15 ? 'bg-emerald-100 text-emerald-700' : s.ebitdaMarji >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-rose-100 text-rose-700'}`}>
            EBITDA %{fmtDec(s.ebitdaMarji)}
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

export default FastPlan;
