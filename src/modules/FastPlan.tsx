import React, { useState, useMemo } from 'react';
import { usePlanSync } from '../hooks/usePlanSync';
import { SyncBanner } from '../components/SyncBanner';
import {
  Zap, Package, Factory,
  Users, BarChart3,
  Plus, Trash2, Save, ChevronDown, ChevronUp,
  Play, Edit3, Copy, FileText, Layout, ArrowRight, Archive, ArchiveRestore, Tag, Scale, X, Gem
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

type GiderKalem = 'enerji' | 'kira' | 'bakim' | 'pazarlama' | 'yonetim' | 'diger';

interface GiderItem {
  id: number;
  ad: string;
  tutar: number;
  kalem: GiderKalem;
}

interface YatirimItem {
  id: number;
  ad: string;
  tutar: number;
}

interface PlanVersion {
  tarih: string;
  params: PlanParams;
  sonuc: PlanSonuc;
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
  yatirimlar: YatirimItem[];
  // Sabit Giderler
  muhasebeGider: number;
  kiraGider: number;
  forkliftGider: number;
  bakimGider: number;
  elektrikGider: number;
  cevreMuhGider: number;
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
  // Kategori bazlı kırılımlar (Standart P&L için)
  giderKırılım: Record<GiderKalem, number>;
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
  etiket?: string;
  status: 'pending' | 'active' | 'archived';
  createdAt: string;
  updatedAt?: string;
  versions?: PlanVersion[];
  params: PlanParams;
  sonuc: PlanSonuc;
}

// ─── Constants ────────────────────────────────────────────────
const KALEM_ORDER: GiderKalem[] = ['enerji', 'kira', 'bakim', 'pazarlama', 'yonetim', 'diger'];
const KALEM_LABEL: Record<GiderKalem, string> = {
  enerji: 'Enerji & Hizmetler',
  kira: 'Kira & Tesis',
  bakim: 'Bakım & Onarım',
  pazarlama: 'Pazarlama & Satış',
  yonetim: 'Yönetim & Ofis',
  diger: 'Diğer Giderler',
};

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

  const giderKırılım: Record<GiderKalem, number> = {
    enerji: p.elektrikGider || 0,
    kira: (p.kiraGider || 0) + (p.forkliftGider || 0),
    bakim: p.bakimGider || 0,
    pazarlama: 0,
    yonetim: (p.muhasebeGider || 0) + (p.cevreMuhGider || 0),
    diger: 0
  };
  p.ektraGiderler.forEach(g => {
    const k = g.kalem || 'diger';
    giderKırılım[k] = (giderKırılım[k] || 0) + g.tutar;
  });

  const toplamEktra = Object.values(giderKırılım).reduce((s, v) => s + v, 0);
  const totalGider = malAlisGideri + alisNakliyeGideri + satisNakliyeGideri +
    toplamMaas + toplamSgk + toplamYemek + toplamEktra;
  
  const toplamYatirim = p.yatirimlar.reduce((s, y) => s + y.tutar, 0);
  const aylikAmortisman = toplamYatirim > 0 ? toplamYatirim / p.amortismanAy : 0;
  const ebitda = satisGeliri - totalGider;
  const netKar = ebitda - aylikAmortisman;
  const ebitdaMarji = satisGeliri > 0 ? (ebitda / satisGeliri) * 100 : 0;
  const birimMaliyet = satisTon > 0 ? totalGider / satisTon : 0;

  return {
    satisTon, satisGeliri, malAlisGideri, alisNakliyeGideri, satisNakliyeGideri,
    toplamMaas, toplamSgk, toplamYemek, toplamEktra, giderKırılım, totalGider,
    ebitda, netKar, ebitdaMarji, aylikAmortisman, birimMaliyet,
  };
}

const VARSAYILAN_PARAMS: PlanParams = {
  aylikTon: 0, alisFiyati: 0, satisFiyati: 0,
  alisNakliye: 0, satisNakliye: 0, uretimFiresi: 0,
  copOrani: 0, ayiklamaVar: false, elektrikKwFiyat: 0,
  aylikGun: 26, gunlukSaat: 8, vardiyaSayisi: 1,
  personelListesi: [],
  ektraGiderler: [], yatirimlar: [], 
  muhasebeGider: 0,
  kiraGider: 0,
  forkliftGider: 0,
  bakimGider: 0,
  elektrikGider: 0,
  cevreMuhGider: 0,
  amortismanAy: 36,
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

// ─── Yardımcı: PlanVersion → görüntüleme için PlanCard'a dönüştür ─────
function versionToCard(plan: PlanCard, vIdx: number): PlanCard {
  const v = (plan.versions ?? [])[vIdx];
  if (!v) return plan;
  return {
    ...plan,
    baslik: `${plan.baslik} — V${vIdx + 1}`,
    params: v.params,
    sonuc: v.sonuc,
    createdAt: v.tarih,
    updatedAt: undefined,
    versions: [],
  };
}

// ─── Kayıt Seçim Modalı ────────────────────────────────────
const SaveModal: React.FC<{
  onYeniVersiyon: () => void;
  onGuncelle: () => void;
  onYeniModel: () => void;
  onIptal: () => void;
}> = ({ onYeniVersiyon, onGuncelle, onYeniModel, onIptal }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
    <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-black text-enba-dark uppercase tracking-tight italic">Değişiklikleri Kaydet</h2>
        <p className="text-sm text-gray-400 mt-2">Bu düzenlemeyi nasıl kaydetmek istersiniz?</p>
      </div>
      <div className="space-y-3">
        <button onClick={onYeniVersiyon} className="w-full text-left px-6 py-4 bg-enba-orange/5 hover:bg-enba-orange/10 border-2 border-enba-orange/30 hover:border-enba-orange rounded-2xl transition-all">
          <div className="font-black text-enba-dark text-sm">Yeni Versiyon Olarak Kaydet</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Mevcut hali geçmişe taşır, değişiklikleri yeni sürüm olarak kaydeder</div>
        </button>
        <button onClick={onGuncelle} className="w-full text-left px-6 py-4 bg-gray-50 hover:bg-gray-100 border-2 border-transparent rounded-2xl transition-all">
          <div className="font-black text-enba-dark text-sm">Mevcut Versiyonu Güncelle</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Geçmişe eklenmez, doğrudan üzerine yazılır</div>
        </button>
        <button onClick={onYeniModel} className="w-full text-left px-6 py-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 hover:border-blue-300 rounded-2xl transition-all">
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

// ─── Main Component ──────────────────────────────────────────
export const FastPlan: React.FC = () => {
  // Görünüm: 'cards' | 'form' | 'compare'
  const [view, setView] = useState<'cards' | 'form' | 'compare'>('cards');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparePair, setComparePair] = useState<[PlanCard, PlanCard] | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [duzenlemId, setDuzenlemId] = useState<string | null>(null);
  const { planlar, kaydet, sil: planSilSync, syncStatus, syncError } = usePlanSync<PlanCard>({
    localKey: STORAGE_KEY,
    planType: 'fast',
  });

  // Form state
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [etiket, setEtiket] = useState('');
  const [params, setParams] = useState<PlanParams>({ ...VARSAYILAN_PARAMS });
  const [yeniPersonel, setYeniPersonel] = useState({ unvan: '', kisiSayisi: 1, ekMaas: 0, isAyiklama: false });
  const [yeniGider, setYeniGider] = useState<{ ad: string; tutar: string; kalem: GiderKalem }>({ ad: '', tutar: '', kalem: 'enerji' });
  const [yeniYatirim, setYeniYatirim] = useState({ ad: '', tutar: '' });

  // Panel açıklıkları
  const [panelYatirim, setPanelYatirim] = useState(true);
  const [panelOp, setPanelOp] = useState(false);
  const [panelPer, setPanelPer] = useState(false);
  const [panelGider, setPanelGider] = useState(false);

  // Filtre & sıralama
  const [filterEtiket, setFilterEtiket] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'tarih' | 'marj_desc' | 'marj_asc'>('tarih');

  // ─── Anlık hesaplama (form önizlemesi) ────────────────────
  const formSonuc = useMemo(() => hesapla(params), [params]);

  // ─── Filtre & sıralama hesaplamaları ──────────────────────
  const tumEtiketler = useMemo(
    () => [...new Set(planlar.filter(p => p.etiket && p.status !== 'archived').map(p => p.etiket!))],
    [planlar]
  );

  const filtrele = (liste: PlanCard[]) => {
    let result = filterEtiket ? liste.filter(p => p.etiket === filterEtiket) : liste;
    if (sortBy === 'marj_desc') return [...result].sort((a, b) => b.sonuc.ebitdaMarji - a.sonuc.ebitdaMarji);
    if (sortBy === 'marj_asc') return [...result].sort((a, b) => a.sonuc.ebitdaMarji - b.sonuc.ebitdaMarji);
    return [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

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
  const resetForm = () => {
    setDuzenlemId(null);
    setBaslik(''); setAciklama(''); setEtiket('');
    setParams({ ...VARSAYILAN_PARAMS });
    setSaveModalOpen(false);
    setView('cards');
  };

  const planKaydetYeni = () => {
    if (!baslik.trim()) { alert('Lütfen plana bir başlık verin.'); return; }
    const now = new Date().toISOString();
    kaydet([...planlar, {
      id: Date.now().toString(),
      baslik: baslik.trim(), aciklama: aciklama.trim(),
      etiket: etiket.trim() || undefined,
      status: 'pending', createdAt: now,
      versions: [], params: { ...params }, sonuc: hesapla(params),
    }]);
    resetForm();
  };

  const planKaydetDuzenle = (mod: 'yeni_versiyon' | 'guncelle' | 'yeni_model') => {
    const now = new Date().toISOString();
    const sonuc = hesapla(params);
    const mevcut = planlar.find(p => p.id === duzenlemId);
    if (!mevcut) { resetForm(); return; }

    if (mod === 'yeni_model') {
      kaydet([...planlar, {
        id: Date.now().toString(),
        baslik: baslik.trim(), aciklama: aciklama.trim(),
        etiket: etiket.trim() || undefined,
        status: 'pending', createdAt: now,
        versions: [], params: { ...params }, sonuc,
      }]);
    } else {
      const yeniKart: PlanCard = {
        id: mevcut.id,
        supabaseId: mevcut.supabaseId,
        baslik: baslik.trim(), aciklama: aciklama.trim(),
        etiket: etiket.trim() || undefined,
        status: mevcut.status,
        createdAt: mevcut.createdAt,
        updatedAt: now,
        versions: mod === 'yeni_versiyon'
          ? [...(mevcut.versions ?? []), { tarih: mevcut.updatedAt || mevcut.createdAt, params: mevcut.params, sonuc: mevcut.sonuc }]
          : (mevcut.versions ?? []),
        params: { ...params }, sonuc,
      };
      kaydet(planlar.map(p => p.id === mevcut.id ? yeniKart : p));
    }
    resetForm();
  };

  const handleKaydetClick = () => {
    if (!baslik.trim()) { alert('Lütfen plana bir başlık verin.'); return; }
    if (duzenlemId) { setSaveModalOpen(true); } else { planKaydetYeni(); }
  };

  const planDuzenle = (plan: PlanCard) => {
    setDuzenlemId(plan.id);
    setBaslik(plan.baslik);
    setAciklama(plan.aciklama);
    setEtiket(plan.etiket || '');
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
      updatedAt: undefined,
      versions: [],
    };
    kaydet([...planlar, kopya]);
  };

  const planSil = (id: string) => {
    if (!window.confirm('Bu plan kartı silinecek. Emin misiniz?')) return;
    setCompareIds(prev => prev.filter(cid => cid !== id));
    planSilSync(id);
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(cid => cid !== id);
      if (prev.length >= 2) return [prev[1], id];
      const next = [...prev, id];
      if (next.length === 2) { setComparePair(null); setTimeout(() => setView('compare'), 0); }
      return next;
    });
  };

  const handleVersionCompare = (planId: string, vIdx: number) => {
    const plan = planlar.find(p => p.id === planId);
    if (!plan || (plan.versions?.length ?? 0) === 0) return;
    const oldCard = versionToCard(plan, vIdx);
    setComparePair([plan, oldCard]);
    setView('compare');
  };

  const statusToggle = (id: string) => {
    kaydet(planlar.map(p =>
      p.id === id && p.status !== 'archived'
        ? { ...p, status: p.status === 'active' ? 'pending' : 'active' }
        : p
    ));
  };

  const planArsivle = (id: string) => {
    kaydet(planlar.map(p =>
      p.id === id ? { ...p, status: p.status === 'archived' ? 'pending' : ('archived' as const) } : p
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
    setParam('ektraGiderler', [...params.ektraGiderler, { id: Date.now(), ad: yeniGider.ad, tutar: Number(yeniGider.tutar), kalem: yeniGider.kalem }]);
    setYeniGider({ ad: '', tutar: '', kalem: 'enerji' });
  };

  const giderSil = (id: number) =>
    setParam('ektraGiderler', params.ektraGiderler.filter(g => g.id !== id));

  const yatirimEkle = () => {
    if (!yeniYatirim.ad || !yeniYatirim.tutar) return;
    setParam('yatirimlar', [...params.yatirimlar, { id: Date.now(), ad: yeniYatirim.ad, tutar: Number(yeniYatirim.tutar) }]);
    setYeniYatirim({ ad: '', tutar: '' });
  };

  const yatirimSil = (id: number) =>
    setParam('yatirimlar', params.yatirimlar.filter(y => y.id !== id));

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
            onClick={() => { setDuzenlemId(null); setBaslik(''); setAciklama(''); setEtiket(''); setParams({ ...VARSAYILAN_PARAMS }); setView('form'); }}
            className="flex items-center gap-3 px-8 py-4 bg-enba-orange text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[3px] shadow-2xl shadow-enba-orange/30 hover:brightness-110 transition-all active:scale-95"
          >
            <Plus size={20} /> Yeni Plan Oluştur
          </button>
        </div>

        {/* Filtre & Sıralama Çubuğu */}
        {planlar.filter(p => p.status !== 'archived').length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Etiket filtresi — yalnızca etiketli plan varsa */}
            {tumEtiketler.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Etiket</span>
                <button onClick={() => setFilterEtiket(null)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!filterEtiket ? 'bg-enba-dark text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  Tümü
                </button>
                {tumEtiketler.map(t => (
                  <button key={t} onClick={() => setFilterEtiket(filterEtiket === t ? null : t)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterEtiket === t ? 'bg-enba-dark text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
            {/* Sıralama */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Sırala</span>
              {([
                { key: 'tarih', label: 'Tarih' },
                { key: 'marj_desc', label: 'Marj ↓' },
                { key: 'marj_asc', label: 'Marj ↑' },
              ] as const).map(opt => (
                <button key={opt.key} onClick={() => setSortBy(opt.key)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === opt.key ? 'bg-enba-orange text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

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

        {/* Karşılaştırma seçim banner'ı */}
        {compareIds.length === 1 && (
          <div className="flex items-center justify-between gap-4 px-8 py-4 bg-blue-50 border border-blue-200 rounded-[2rem]">
            <div className="flex items-center gap-3">
              <Scale size={18} className="text-blue-500" />
              <span className="text-[11px] font-black text-blue-700 uppercase tracking-[2px]">
                1 Plan Seçildi — Karşılaştırmak için 2. planın <Scale size={11} className="inline" /> butonuna tıklayın
              </span>
            </div>
            <button onClick={() => setCompareIds([])}
              className="text-[10px] font-black text-blue-400 hover:text-blue-600 uppercase tracking-widest transition-colors">
              İptal
            </button>
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
        {planlar.filter(p => p.status !== 'archived').length > 0 && (
          <>
            {/* Bekleyen Planlar */}
            {planlar.filter(p => p.status === 'pending').length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">
                    Bekleyen Planlar — {filtrele(planlar.filter(p => p.status === 'pending')).length} Kart
                    {filterEtiket && ` · "${filterEtiket}" filtresi`}
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtrele(planlar.filter(p => p.status === 'pending')).map(plan => (
                    <PlanKartBileseni
                      key={plan.id} plan={plan}
                      onToggle={() => statusToggle(plan.id)}
                      onEdit={() => planDuzenle(plan)}
                      onCopy={() => planKopyala(plan)}
                      onDelete={() => planSil(plan.id)}
                      onArchive={() => planArsivle(plan.id)}
                      onCompare={() => toggleCompare(plan.id)}
                      onVersionCompare={(vIdx) => handleVersionCompare(plan.id, vIdx)}
                      isSelectedForCompare={compareIds.includes(plan.id)}
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
                    Aktif Planlar — {filtrele(aktifPlanlar).length} Kart · Konsolide Hesaplamaya Dahil
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtrele(aktifPlanlar).map(plan => (
                    <PlanKartBileseni
                      key={plan.id} plan={plan}
                      onToggle={() => statusToggle(plan.id)}
                      onEdit={() => planDuzenle(plan)}
                      onCopy={() => planKopyala(plan)}
                      onDelete={() => planSil(plan.id)}
                      onArchive={() => planArsivle(plan.id)}
                      onCompare={() => toggleCompare(plan.id)}
                      onVersionCompare={(vIdx) => handleVersionCompare(plan.id, vIdx)}
                      isSelectedForCompare={compareIds.includes(plan.id)}
                      kpiColor={kpiColor} fmt={fmt} fmtDec={fmtDec}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Arşivlenmiş Planlar */}
        {planlar.filter(p => p.status === 'archived').length > 0 && (
          <ArşivBolumu
            planlar={planlar.filter(p => p.status === 'archived')}
            onRestore={(id) => planArsivle(id)}
            onDelete={(id) => planSil(id)}
            fmt={fmt} fmtDec={fmtDec}
          />
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // VIEW: KARŞILAŞTIRMA
  // ════════════════════════════════════════════════════════
  if (view === 'compare') {
    const planA = comparePair ? comparePair[0] : planlar.find(p => p.id === compareIds[0]);
    const planB = comparePair ? comparePair[1] : planlar.find(p => p.id === compareIds[1]);
    if (!planA || !planB) { setView('cards'); return null; }
    const sA = planA.sonuc; const sB = planB.sonuc;

    // Fark hesaplayıcı: pozitif fark, A'nın B'ye göre farkı
    const fark = (a: number, b: number, yuksekIyi = true) => {
      const d = a - b;
      if (d === 0) return { text: '—', cls: 'text-gray-300' };
      const iyi = yuksekIyi ? d > 0 : d < 0;
      return { text: `${d > 0 ? '+' : ''}₺${fmt(d)}`, cls: iyi ? 'text-emerald-600' : 'text-rose-500' };
    };
    const farkPct = (a: number, b: number, yuksekIyi = true) => {
      const d = a - b;
      if (d === 0) return { text: '—', cls: 'text-gray-300' };
      const iyi = yuksekIyi ? d > 0 : d < 0;
      return { text: `${d > 0 ? '+' : ''}${fmtDec(d)}pp`, cls: iyi ? 'text-emerald-600' : 'text-rose-500' };
    };

    // Aynı etikette tüm planlar — trend tablosu için
    const ortakEtiket = planA.etiket && planB.etiket && planA.etiket === planB.etiket ? planA.etiket : null;
    const trendPlanlar = ortakEtiket
      ? [...planlar].filter(p => p.etiket === ortakEtiket && p.status !== 'archived')
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      : [];

    const KARSILASTIRMA_SATIRLARI: { label: string; vA: number; vB: number; yuksekIyi?: boolean; isPct?: boolean }[] = [
      { label: 'Aylık Giren Ton', vA: planA.params.aylikTon, vB: planB.params.aylikTon },
      { label: 'Net Satış Tonu', vA: sA.satisTon, vB: sB.satisTon },
      { label: 'Alış Fiyatı (₺/ton)', vA: planA.params.alisFiyati, vB: planB.params.alisFiyati, yuksekIyi: false },
      { label: 'Satış Fiyatı (₺/ton)', vA: planA.params.satisFiyati, vB: planB.params.satisFiyati },
      { label: 'Alış Nakliyesi (₺/ton)', vA: planA.params.alisNakliye, vB: planB.params.alisNakliye, yuksekIyi: false },
      { label: 'Satış Nakliyesi (₺/ton)', vA: planA.params.satisNakliye, vB: planB.params.satisNakliye, yuksekIyi: false },
      { label: 'Satış Geliri', vA: sA.satisGeliri, vB: sB.satisGeliri },
      { label: 'Mal Alış Gideri', vA: sA.malAlisGideri, vB: sB.malAlisGideri, yuksekIyi: false },
      { label: 'Nakliye (alış+satış)', vA: sA.alisNakliyeGideri + sA.satisNakliyeGideri, vB: sB.alisNakliyeGideri + sB.satisNakliyeGideri, yuksekIyi: false },
      { label: 'Personel & SGK', vA: sA.toplamMaas + sA.toplamSgk + sA.toplamYemek, vB: sB.toplamMaas + sB.toplamSgk + sB.toplamYemek, yuksekIyi: false },
      { label: 'Diğer Giderler', vA: sA.toplamEktra, vB: sB.toplamEktra, yuksekIyi: false },
      { label: 'Toplam Gider', vA: sA.totalGider, vB: sB.totalGider, yuksekIyi: false },
      { label: 'FAVÖK', vA: sA.ebitda, vB: sB.ebitda },
      { label: 'EBITDA Marjı (%)', vA: sA.ebitdaMarji, vB: sB.ebitdaMarji, isPct: true },
      { label: 'Amortisman', vA: sA.aylikAmortisman, vB: sB.aylikAmortisman, yuksekIyi: false },
      { label: 'Net Kâr', vA: sA.netKar, vB: sB.netKar },
    ];

    return (
      <div className="flex flex-col gap-8 p-10 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex items-center gap-5">
          <button onClick={() => { setView('cards'); setCompareIds([]); setComparePair(null); }}
            className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all">
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-enba-dark tracking-tighter leading-none italic uppercase">
              {comparePair ? 'Versiyon Kıyası' : 'Karşılaştırma'}
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mt-1">
              {comparePair ? 'Aynı planın iki versiyonu arasındaki fark' : 'Plan bazlı P&L fark analizi'}
            </p>
          </div>
        </div>

        {/* Plan başlıkları */}
        <div className="grid grid-cols-3 gap-4">
          {[planA, planB].map((p, i) => {
            const label = comparePair
              ? (i === 0 ? 'Güncel' : 'Eski Versiyon')
              : (i === 0 ? 'Plan A' : 'Plan B');
            const borderCls = i === 0 ? 'border-blue-300' : 'border-enba-orange/40';
            const labelCls = i === 0 ? 'text-blue-500' : 'text-enba-orange';
            return (
              <div key={`${p.id}-${i}`} className={`bg-white rounded-[2rem] px-8 py-6 border-2 ${borderCls} shadow-sm`}>
                <div className={`text-[9px] font-black uppercase tracking-[3px] mb-1 ${labelCls}`}>{label}</div>
                <div className="font-black text-enba-dark text-sm uppercase truncate">{p.baslik}</div>
                {p.etiket && <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black uppercase rounded-full">{p.etiket}</span>}
                <div className="text-[9px] text-gray-400 mt-1">{new Date(p.createdAt).toLocaleDateString('tr-TR')}</div>
              </div>
            );
          })}
          <div className="bg-gray-50 rounded-[2rem] px-8 py-6 border border-gray-100 flex flex-col justify-center">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-[2px] mb-1">
              {comparePair ? 'Fark (Güncel − Eski)' : 'Fark (A − B)'}
            </div>
            <div className={`text-lg font-black tabular-nums ${fark(sA.netKar, sB.netKar).cls}`}>{fark(sA.netKar, sB.netKar).text}</div>
            <div className="text-[9px] text-gray-400 mt-0.5">Net Kâr</div>
          </div>
        </div>

        {/* Karşılaştırma tablosu */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-8 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-[2px] w-1/3">Kalem</th>
                <th className="px-6 py-4 text-right text-[9px] font-black text-blue-500 uppercase tracking-[2px]">{planA.baslik}</th>
                <th className="px-6 py-4 text-right text-[9px] font-black text-enba-orange uppercase tracking-[2px]">{planB.baslik}</th>
                <th className="px-8 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Fark (A−B)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {KARSILASTIRMA_SATIRLARI.map((row, i) => {
                const f = row.isPct
                  ? farkPct(row.vA, row.vB, row.yuksekIyi ?? true)
                  : fark(row.vA, row.vB, row.yuksekIyi ?? true);
                const isSection = ['Satış Geliri', 'FAVÖK', 'Net Kâr'].includes(row.label);
                return (
                  <tr key={i} className={isSection ? 'bg-gray-50' : 'hover:bg-gray-50/50'}>
                    <td className={`px-8 py-3 text-[11px] font-${isSection ? 'black' : 'medium'} text-gray-${isSection ? '700' : '500'} uppercase tracking-wider`}>{row.label}</td>
                    <td className="px-6 py-3 text-right text-sm font-black text-blue-600 tabular-nums">
                      {row.isPct ? `%${fmtDec(row.vA)}` : `₺${fmt(row.vA)}`}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-black text-enba-orange tabular-nums">
                      {row.isPct ? `%${fmtDec(row.vB)}` : `₺${fmt(row.vB)}`}
                    </td>
                    <td className={`px-8 py-3 text-right text-sm font-black tabular-nums ${f.cls}`}>{f.text}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Fiyat trendi — yalnızca aynı etikette */}
        {trendPlanlar.length > 1 && ortakEtiket && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
              <BarChart3 size={16} className="text-enba-orange" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">
                {ortakEtiket} — Fiyat Geçmişi ({trendPlanlar.length} Plan)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-8 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Plan</th>
                    <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Tarih</th>
                    <th className="px-6 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Alış ₺/ton</th>
                    <th className="px-6 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Satış ₺/ton</th>
                    <th className="px-6 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-[2px]">EBITDA %</th>
                    <th className="px-8 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Net Kâr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {trendPlanlar.map(p => {
                    const isSelected = compareIds.includes(p.id);
                    return (
                      <tr key={p.id} className={isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}>
                        <td className="px-8 py-3 text-[11px] font-black text-enba-dark truncate max-w-[180px]">
                          {p.baslik}{isSelected && <span className="ml-2 text-[9px] text-blue-500">● seçili</span>}
                        </td>
                        <td className="px-6 py-3 text-[11px] text-gray-400">{new Date(p.createdAt).toLocaleDateString('tr-TR')}</td>
                        <td className="px-6 py-3 text-right text-sm font-black text-enba-dark tabular-nums">₺{fmt(p.params.alisFiyati)}</td>
                        <td className="px-6 py-3 text-right text-sm font-black text-enba-dark tabular-nums">₺{fmt(p.params.satisFiyati)}</td>
                        <td className={`px-6 py-3 text-right text-sm font-black tabular-nums ${p.sonuc.ebitdaMarji >= 15 ? 'text-emerald-600' : p.sonuc.ebitdaMarji >= 5 ? 'text-yellow-600' : 'text-rose-500'}`}>
                          %{fmtDec(p.sonuc.ebitdaMarji)}
                        </td>
                        <td className={`px-8 py-3 text-right text-sm font-black tabular-nums ${p.sonuc.netKar >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          ₺{fmt(p.sonuc.netKar)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
          <button onClick={resetForm} className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all">
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
          <button onClick={resetForm} className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-black text-[11px] uppercase tracking-[2px] transition-all">
            İptal
          </button>
          <button onClick={handleKaydetClick} className="flex items-center gap-3 px-8 py-3.5 bg-enba-orange text-white rounded-2xl font-black text-[11px] uppercase tracking-[2px] shadow-xl shadow-enba-orange/30 hover:brightness-110 transition-all active:scale-95">
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
        {/* Etiket */}
        <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] flex items-center gap-2">
            <Tag size={12} /> İş Tipi Etiketi
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {['LDPE', 'HDPE', 'PP', 'PET', 'PVC', 'PS', 'Kağıt', 'Cam', 'Metal', 'Tekstil'].map(t => (
              <button key={t} type="button"
                onClick={() => setEtiket(etiket === t ? '' : t)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${etiket === t ? 'bg-enba-dark text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {t}
              </button>
            ))}
            <input
              type="text"
              value={etiket}
              onChange={e => setEtiket(e.target.value)}
              placeholder="veya yazın..."
              className="flex-1 min-w-28 bg-gray-50 border border-transparent rounded-2xl px-4 py-2 text-sm font-medium text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all"
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
          <Panel 
            title="I. Başlangıç Yatırımları (CAPEX)" icon={<Gem size={18} />} open={panelYatirim} 
            onToggle={() => setPanelYatirim(v => !v)}
            badge={`₺${fmt(params.yatirimlar.reduce((s, y) => s + y.tutar, 0))}`}
          >
            <div className="space-y-3 mb-5">
              {params.yatirimlar.map(y => (
                <div key={y.id} className="flex items-center gap-4 px-5 py-4 bg-gray-50 rounded-2xl">
                  <div className="flex-1">
                    <div className="font-black text-sm text-enba-dark">{y.ad}</div>
                  </div>
                  <span className="text-sm font-black text-enba-orange tabular-nums">₺{fmt(y.tutar)}</span>
                  <button onClick={() => yatirimSil(y.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-12 gap-3">
              <input type="text" placeholder="Yatırım kalemi (Örn: Makine, Lisans...)" value={yeniYatirim.ad}
                onChange={e => setYeniYatirim({ ...yeniYatirim, ad: e.target.value })}
                className="col-span-7 bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-medium text-enba-dark outline-none focus:ring-2 focus:ring-enba-orange/20" />
              <input type="number" placeholder="Tutar ₺" value={yeniYatirim.tutar}
                onFocus={e => e.target.select()}
                onChange={e => setYeniYatirim({ ...yeniYatirim, tutar: e.target.value })}
                className="col-span-3 bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-medium text-enba-dark outline-none focus:ring-2 focus:ring-enba-orange/20" />
              <button onClick={yatirimEkle} className="col-span-2 flex items-center justify-center gap-1 bg-enba-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-[1px] hover:bg-black transition-all">
                <Plus size={14} /> Ekle
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100">
               <InputRow label="Amortisman Süresi (Ay)" value={params.amortismanAy} onChange={v => setParam('amortismanAy', v)} suffix="ay" min={1} max={240} />
               <div className="mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                 Aylık Amortisman Gideri: <span className="text-enba-orange">₺{fmt(params.yatirimlar.reduce((s, y) => s + y.tutar, 0) / params.amortismanAy)}</span>
               </div>
            </div>
          </Panel>

          <Panel title="II. Operasyon Parametreleri" icon={<Factory size={18} />} open={panelOp} onToggle={() => setPanelOp(v => !v)}>
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
            title="III. Personel" icon={<Users size={18} />} open={panelPer}
            onToggle={() => setPanelPer(v => !v)}
            badge={`${params.personelListesi.reduce((s, p) => s + p.kisiSayisi * params.vardiyaSayisi, 0)} kişi`}
          >
            {/* ... (Personel listesi içeriği aynı kalıyor) ... */}
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

          <Panel title="IV. İşletme Giderleri" icon={<Package size={18} />} open={panelGider} onToggle={() => setPanelGider(v => !v)}>
            {/* Sabit Giderler */}
            <div className="mb-6 space-y-1">
              <div className="text-[10px] font-black text-enba-orange uppercase tracking-[3px] mb-3 px-1">Sabit İşletme Giderleri</div>
              <InputRow label="Elektrik Faturası" value={params.elektrikGider} onChange={v => setParam('elektrikGider', v)} suffix="₺" step={1000} />
              <InputRow label="Kira (Tesis)" value={params.kiraGider} onChange={v => setParam('kiraGider', v)} suffix="₺" step={1000} />
              <InputRow label="Forklift Kira/Gider" value={params.forkliftGider} onChange={v => setParam('forkliftGider', v)} suffix="₺" step={500} />
              <InputRow label="Muhasebe Hizmeti" value={params.muhasebeGider} onChange={v => setParam('muhasebeGider', v)} suffix="₺" step={500} />
              <InputRow label="Genel Onarım / Bakım" value={params.bakimGider} onChange={v => setParam('bakimGider', v)} suffix="₺" step={500} />
              <InputRow label="Çevre Mühendisliği" value={params.cevreMuhGider} onChange={v => setParam('cevreMuhGider', v)} suffix="₺" step={500} />
            </div>

            <div className="h-px bg-gray-100 my-6" />

            <div className="text-[10px] font-black text-enba-orange uppercase tracking-[3px] mb-4 px-1">Değişken / Ekstra Giderler</div>
            <div className="space-y-3 mb-4">
              {params.ektraGiderler.map(g => (
                <div key={g.id} className="flex items-center gap-4 px-5 py-4 bg-gray-50 rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-enba-dark truncate">{g.ad}</div>
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{KALEM_LABEL[g.kalem ?? 'diger']}</div>
                  </div>
                  <span className="font-black text-rose-500 tabular-nums text-sm flex-shrink-0">₺{fmt(g.tutar)}</span>
                  <button onClick={() => giderSil(g.id)} className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-12 gap-2">
              <input type="text" placeholder="Gider adı..." value={yeniGider.ad}
                onChange={e => setYeniGider({ ...yeniGider, ad: e.target.value })}
                className="col-span-4 bg-gray-50 rounded-2xl px-4 py-3 text-sm font-medium text-enba-dark outline-none focus:ring-2 focus:ring-enba-orange/20" />
              <select value={yeniGider.kalem}
                onChange={e => setYeniGider({ ...yeniGider, kalem: e.target.value as GiderKalem })}
                className="col-span-4 bg-gray-50 rounded-2xl px-3 py-3 text-sm font-medium text-enba-dark outline-none focus:ring-2 focus:ring-enba-orange/20 cursor-pointer">
                {KALEM_ORDER.map(k => <option key={k} value={k}>{KALEM_LABEL[k]}</option>)}
              </select>
              <input type="number" placeholder="₺" value={yeniGider.tutar}
                onFocus={e => e.target.select()}
                onChange={e => setYeniGider({ ...yeniGider, tutar: e.target.value })}
                className="col-span-2 bg-gray-50 rounded-2xl px-3 py-3 text-sm font-medium text-enba-dark outline-none focus:ring-2 focus:ring-enba-orange/20" />
              <button onClick={giderEkle} className="col-span-2 flex items-center justify-center gap-1 bg-enba-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-[1px] hover:bg-black transition-all">
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
          <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-gray-100 space-y-4">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-enba-orange" /> Standart P&L Analizi
            </div>

            {/* I. HASILAT */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-black text-enba-dark uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-lg">I. HASILAT</div>
              <div className="flex justify-between px-5 py-1 text-sm">
                <span className="text-gray-400 font-medium">Satış Geliri</span>
                <span className="font-black text-emerald-600 tabular-nums">₺{fmt(formSonuc.satisGeliri)}</span>
              </div>
              <div className="flex justify-between px-5 py-1 text-sm">
                <span className="text-gray-400 font-medium">Satış Nakliye</span>
                <span className="font-black text-rose-400 tabular-nums">-₺{fmt(formSonuc.satisNakliyeGideri)}</span>
              </div>
              <div className="flex justify-between px-5 py-2 border-t border-gray-50 font-black text-enba-dark text-[11px]">
                <span className="uppercase tracking-wider">HASILAT</span>
                <span className="tabular-nums text-emerald-600">₺{fmt(formSonuc.satisGeliri - formSonuc.satisNakliyeGideri)}</span>
              </div>
            </div>

            {/* II. MAL MALİYETLERİ */}
            <div className="space-y-1.5 pt-2">
              <div className="text-[10px] font-black text-enba-dark uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-lg">II. MAL MALİYETLERİ</div>
              <div className="flex justify-between px-5 py-1 text-sm">
                <span className="text-gray-400 font-medium">Mal Alım</span>
                <span className="font-black text-rose-400 tabular-nums">-₺{fmt(formSonuc.malAlisGideri)}</span>
              </div>
              <div className="flex justify-between px-5 py-1 text-sm">
                <span className="text-gray-400 font-medium">Alım Nakliye</span>
                <span className="font-black text-rose-400 tabular-nums">-₺{fmt(formSonuc.alisNakliyeGideri)}</span>
              </div>
              <div className="flex justify-between px-5 py-2 border-t border-gray-50 font-black text-enba-dark text-[11px]">
                <span className="uppercase tracking-wider">KATKI</span>
                <span className="tabular-nums text-emerald-600">₺{fmt((formSonuc.satisGeliri - formSonuc.satisNakliyeGideri) - (formSonuc.malAlisGideri + formSonuc.alisNakliyeGideri))}</span>
              </div>
            </div>

            {/* III. ENERJİ MALİYETLERİ */}
            {formSonuc.giderKırılım.enerji > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="text-[10px] font-black text-enba-dark uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-lg">III. ENERJİ MALİYETLERİ</div>
                <div className="flex justify-between px-5 py-1 text-sm">
                  <span className="text-gray-400 font-medium">Enerji & Hizmetler</span>
                  <span className="font-black text-rose-400 tabular-nums">-₺{fmt(formSonuc.giderKırılım.enerji)}</span>
                </div>
              </div>
            )}

            {/* IV. PERSONEL MALİYETLERİ */}
            <div className="space-y-1.5 pt-2">
              <div className="text-[10px] font-black text-enba-dark uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-lg">IV. PERSONEL MALİYETLERİ</div>
              <div className="flex justify-between px-5 py-1 text-sm">
                <span className="text-gray-400 font-medium">Maaşlar</span>
                <span className="font-black text-rose-400 tabular-nums">-₺{fmt(formSonuc.toplamMaas)}</span>
              </div>
              <div className="flex justify-between px-5 py-1 text-sm">
                <span className="text-gray-400 font-medium">Sigortalar</span>
                <span className="font-black text-rose-400 tabular-nums">-₺{fmt(formSonuc.toplamSgk)}</span>
              </div>
              <div className="flex justify-between px-5 py-1 text-sm">
                <span className="text-gray-400 font-medium">Yemek</span>
                <span className="font-black text-rose-400 tabular-nums">-₺{fmt(formSonuc.toplamYemek)}</span>
              </div>
            </div>

            {/* V. DİĞER GİDERLER */}
            {(formSonuc.giderKırılım.bakim > 0 || formSonuc.giderKırılım.kira > 0 || formSonuc.giderKırılım.pazarlama > 0 || formSonuc.giderKırılım.yonetim > 0 || formSonuc.giderKırılım.diger > 0) && (
              <div className="space-y-1.5 pt-2">
                <div className="text-[10px] font-black text-enba-dark uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-lg">V. DİĞER GİDERLER</div>
                {formSonuc.giderKırılım.bakim > 0 && (
                  <div className="flex justify-between px-5 py-1 text-sm">
                    <span className="text-gray-400 font-medium">Bakım Onarım</span>
                    <span className="font-black text-rose-400 tabular-nums">-₺{fmt(formSonuc.giderKırılım.bakim)}</span>
                  </div>
                )}
                {formSonuc.giderKırılım.kira > 0 && (
                  <div className="flex justify-between px-5 py-1 text-sm">
                    <span className="text-gray-400 font-medium">Kira & Tesis</span>
                    <span className="font-black text-rose-400 tabular-nums">-₺{fmt(formSonuc.giderKırılım.kira)}</span>
                  </div>
                )}
                {formSonuc.giderKırılım.pazarlama > 0 && (
                  <div className="flex justify-between px-5 py-1 text-sm">
                    <span className="text-gray-400 font-medium">Pazarlama & Satış</span>
                    <span className="font-black text-rose-400 tabular-nums">-₺{fmt(formSonuc.giderKırılım.pazarlama)}</span>
                  </div>
                )}
                {formSonuc.giderKırılım.yonetim > 0 && (
                  <div className="flex justify-between px-5 py-1 text-sm">
                    <span className="text-gray-400 font-medium">Yönetim & Ofis</span>
                    <span className="font-black text-rose-400 tabular-nums">-₺{fmt(formSonuc.giderKırılım.yonetim)}</span>
                  </div>
                )}
                {formSonuc.giderKırılım.diger > 0 && (
                  <div className="flex justify-between px-5 py-1 text-sm">
                    <span className="text-gray-400 font-medium">Diğer Giderler</span>
                    <span className="font-black text-rose-400 tabular-nums">-₺{fmt(formSonuc.giderKırılım.diger)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="h-px bg-gray-100 my-4" />

            <div className={`flex justify-between px-5 py-4 rounded-xl ${formSonuc.ebitda >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
              <span className="text-[10px] font-black uppercase tracking-[2px] text-gray-600">FAVÖK (EBITDA)</span>
              <span className={`font-black tabular-nums ${kpiColor(formSonuc.ebitda)}`}>₺{fmt(formSonuc.ebitda)}</span>
            </div>

            {formSonuc.aylikAmortisman > 0 && (
              <div className="flex justify-between px-5 py-1 text-sm">
                <span className="text-gray-400 font-medium">Amortisman</span>
                <span className="font-black text-gray-400 tabular-nums">-₺{fmt(formSonuc.aylikAmortisman)}</span>
              </div>
            )}

            <div className={`flex justify-between px-6 py-5 rounded-[1.25rem] ${formSonuc.netKar >= 0 ? 'bg-enba-dark' : 'bg-rose-600'} text-white shadow-xl`}>
              <span className="text-[10px] font-black uppercase tracking-[2px]">NET KÂR / ZARAR</span>
              <span className="font-black tabular-nums text-lg">₺{fmt(formSonuc.netKar)}</span>
            </div>
          </div>
        </div>
      </div>
      {saveModalOpen && (
        <SaveModal
          onYeniVersiyon={() => planKaydetDuzenle('yeni_versiyon')}
          onGuncelle={() => planKaydetDuzenle('guncelle')}
          onYeniModel={() => planKaydetDuzenle('yeni_model')}
          onIptal={() => setSaveModalOpen(false)}
        />
      )}
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
  onArchive: () => void;
  onCompare: () => void;
  onVersionCompare: (vIdx: number) => void;
  isSelectedForCompare: boolean;
  kpiColor: (v: number) => string;
  fmt: (n: number) => string;
  fmtDec: (n: number) => string;
}> = ({ plan, onToggle, onEdit, onCopy, onDelete, onArchive, onCompare, onVersionCompare, isSelectedForCompare, kpiColor, fmt, fmtDec }) => {
  const versions = plan.versions ?? [];
  const [selectedVer, setSelectedVer] = useState<'current' | number>('current');
  const aktif = plan.status === 'active';

  // Seçili versiyonun verisi
  const dispSonuc = selectedVer === 'current' ? plan.sonuc : (versions[selectedVer as number]?.sonuc ?? plan.sonuc);
  const dispParams = selectedVer === 'current' ? plan.params : (versions[selectedVer as number]?.params ?? plan.params);
  const dispDate  = selectedVer === 'current' ? (plan.updatedAt || plan.createdAt) : (versions[selectedVer as number]?.tarih ?? plan.createdAt);
  const s = dispSonuc;

  // Karlılık şeridi rengi
  const seritRenk = s.ebitdaMarji >= 15 ? 'bg-emerald-400'
    : s.ebitdaMarji >= 5 ? 'bg-yellow-400'
    : s.ebitdaMarji > 0 ? 'bg-rose-400'
    : 'bg-gray-200';

  return (
    <div className={`bg-white rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden shadow-card ${
      isSelectedForCompare ? 'border-blue-400 shadow-blue-200/50 shadow-lg' : aktif ? 'border-enba-orange shadow-enba-orange/10' : 'border-transparent'
    }`}>
      {/* Karlılık şeridi */}
      <div className={`h-1 ${seritRenk}`} />

      <div className={`px-8 py-5 ${aktif ? 'bg-enba-orange/5' : 'bg-gray-50'} border-b border-gray-100 flex items-start justify-between gap-4`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {aktif && <div className="w-2 h-2 rounded-full bg-enba-orange animate-pulse flex-shrink-0" />}
            <h3 className="font-black text-enba-dark text-sm uppercase tracking-tight truncate">{plan.baslik}</h3>
          </div>
          {plan.etiket && (
            <span className="inline-flex items-center mt-1 mb-1 px-2.5 py-0.5 bg-enba-dark/5 text-enba-dark text-[9px] font-black uppercase tracking-widest rounded-full">
              {plan.etiket}
            </span>
          )}
          {plan.aciklama && (
            <p className="text-[10px] text-gray-400 font-medium truncate">{plan.aciklama}</p>
          )}
          {versions.length === 0 ? (
            <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1.5">
              {new Date(plan.createdAt).toLocaleDateString('tr-TR')} · {fmtDec(dispParams.aylikTon)} ton/ay
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <select
                value={selectedVer === 'current' ? 'current' : String(selectedVer)}
                onChange={e => setSelectedVer(e.target.value === 'current' ? 'current' : Number(e.target.value))}
                className="text-[9px] font-black text-enba-orange bg-enba-orange/10 border-none rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                <option value="current">Güncel (V{versions.length + 1}) · {new Date(plan.updatedAt || plan.createdAt).toLocaleDateString('tr-TR')}</option>
                {[...versions].map((v, i) => (
                  <option key={i} value={String(i)}>V{i + 1} · {new Date(v.tarih).toLocaleDateString('tr-TR')}</option>
                )).reverse()}
              </select>
              <span className="text-[9px] text-gray-300 font-black">{fmtDec(dispParams.aylikTon)} ton/ay</span>
              <button onClick={() => onVersionCompare(selectedVer === 'current' ? versions.length - 1 : selectedVer as number)}
                className="text-[9px] font-black text-gray-400 hover:text-blue-500 uppercase tracking-widest transition-colors">
                Kıyasla ↔
              </button>
            </div>
          )}
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
          <button onClick={onCompare} title={isSelectedForCompare ? 'Seçimi Kaldır' : 'Karşılaştır'}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isSelectedForCompare ? 'bg-blue-500 text-white' : 'hover:bg-blue-50 text-gray-400 hover:text-blue-500'}`}>
            {isSelectedForCompare ? <X size={15} /> : <Scale size={15} />}
          </button>
          <button onClick={onArchive} title="Arşivle" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-enba-dark transition-all">
            <Archive size={15} />
          </button>
          <button onClick={onDelete} title="Sil" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-all">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

    </div>
  );
};

// ─── Arşiv Bölümü ────────────────────────────────────────────
const ArşivBolumu: React.FC<{
  planlar: PlanCard[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  fmt: (n: number) => string;
  fmtDec: (n: number) => string;
}> = ({ planlar, onRestore, onDelete, fmt, fmtDec }) => {
  const [acik, setAcik] = useState(false);
  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setAcik(v => !v)}
        className="w-full flex items-center justify-between px-8 py-5 hover:bg-gray-50/50 transition-colors">
        <div className="flex items-center gap-3">
          <Archive size={16} className="text-gray-400" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">
            Arşivlenmiş Planlar — {planlar.length} Kart
          </span>
        </div>
        {acik ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
      </button>
      {acik && (
        <div className="px-8 pb-8 space-y-3">
          {planlar.map(plan => {
            const s = plan.sonuc;
            return (
              <div key={plan.id} className="flex items-center gap-4 px-6 py-4 bg-gray-50 rounded-2xl opacity-70">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-sm text-gray-600 uppercase truncate">{plan.baslik}</span>
                    {plan.etiket && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-[9px] font-black uppercase tracking-widest rounded-full flex-shrink-0">
                        {plan.etiket}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-gray-400 font-medium">
                    {new Date(plan.createdAt).toLocaleDateString('tr-TR')} · {fmtDec(plan.params.aylikTon)} ton/ay · Net ₺{fmt(s.netKar)} · EBITDA %{fmtDec(s.ebitdaMarji)}
                  </div>
                </div>
                <button onClick={() => onRestore(plan.id)} title="Geri Al"
                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-all">
                  <ArchiveRestore size={15} />
                </button>
                <button onClick={() => onDelete(plan.id)} title="Kalıcı Sil"
                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-all">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FastPlan;
