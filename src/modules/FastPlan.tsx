import React, { useState, useMemo, useEffect } from 'react';
import { usePlanSync } from '../hooks/usePlanSync';
import { SyncBanner } from '../components/SyncBanner';
import { ASGARI_NET } from '../utils/constants';
import {
  hesapla, type GiderKalem, type PlanParams, type PlanSonuc,
} from '../utils/fastPlanCalc';
import { settingsAPI, DEFAULT_APP_SETTINGS } from '../utils/appSettings';
import {
  Zap, Package, Factory,
  Users, BarChart3, TrendingUp,
  Plus, Trash2, Save, Scale,
  FileText, Layout, ArrowRight, Tag, Gem
} from 'lucide-react';
import type { PlanCard } from './fastplan/types';
import {
  KALEM_ORDER, KALEM_LABEL, STORAGE_KEY,
  fmt, fmtDec, makeVarsayilanParams, versionToCard,
} from './fastplan/helpers';
import { InputRow, Panel } from './fastplan/FormPrimitives';
import { SaveModal } from './fastplan/SaveModal';
import { PlanKartBileseni, ArşivBolumu } from './fastplan/PlanKartBileseni';

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

  // Settings
  const [appSettings, setAppSettings] = useState(DEFAULT_APP_SETTINGS);
  useEffect(() => {
    settingsAPI.get().then(s => {
      setAppSettings(s);
      setParams(prev => ({
        ...prev,
        asgariUcret: s.asgariUcret,
        asgariSgk: s.asgariSgk,
        yemekUcreti: s.yemekUcreti,
        elektrikKwFiyat: s.elektrikBirimFiyat,
        aylikGun: s.aylikGun,
      }));
    });
  }, []);

  // Form state
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [etiket, setEtiket] = useState('');
  const [params, setParams] = useState<PlanParams>(() => makeVarsayilanParams(DEFAULT_APP_SETTINGS));
  const [yeniPersonel, setYeniPersonel] = useState({ unvan: '', kisiSayisi: 1, ekMaas: 0, isAyiklama: false });
  const [yeniGider, setYeniGider] = useState<{ ad: string; tutar: string; kalem: GiderKalem }>({ ad: '', tutar: '', kalem: 'enerji' });
  const [yeniYatirim, setYeniYatirim] = useState({ ad: '', tutar: '' });

  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Panel açıklıkları
  const [panelSabitler, setPanelSabitler] = useState(false);
  const [panelYatirim, setPanelYatirim] = useState(true);
  const [panelOp, setPanelOp] = useState(false);
  const [panelPer, setPanelPer] = useState(false);
  const [panelGider, setPanelGider] = useState(false);

  // Filtre & sıralama
  const [filterEtiket, setFilterEtiket] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'tarih' | 'marj_desc' | 'marj_asc'>('tarih');

  // ─── Anlık hesaplama (form önizlemesi) ────────────────────
  const formSonuc = useMemo(() => hesapla(params), [params]);

  // ─── Duyarlılık tablosu: satış fiyatı ±%20 senaryoları ───
  const duyarlilik = useMemo(() =>
    [-20, -10, 0, 10, 20].map(pct => ({
      pct,
      sonuc: hesapla({ ...params, satisFiyati: params.satisFiyati * (1 + pct / 100) }),
    })),
    [params]
  );

  const pdfIndir = async () => {
    setIsPdfGenerating(true);
    await new Promise(r => setTimeout(r, 300));
    const el = document.getElementById('fastplan-pdf-container');
    if (!el) { setIsPdfGenerating(false); return; }
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Enba_Plan_${baslik || 'taslak'}.pdf`,
      image: { type: 'jpeg', quality: 0.97 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    const { default: html2pdf } = await import('html2pdf.js');
    html2pdf().set(opt).from(el).save().then(() => setIsPdfGenerating(false));
  };

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
    setParams(makeVarsayilanParams(appSettings));
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

  const planKaydetDuzenle = (mod: 'yeni_versiyon' | 'guncelle' | 'yeni_model', not?: string) => {
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
          ? [...(mevcut.versions ?? []), {
              tarih: mevcut.updatedAt || mevcut.createdAt,
              params: mevcut.params,
              sonuc: mevcut.sonuc,
              not: not?.trim() || undefined,
            }]
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
            onClick={() => { setDuzenlemId(null); setBaslik(''); setAciklama(''); setEtiket(''); setParams(makeVarsayilanParams(appSettings)); setView('form'); }}
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
              onClick={() => { setDuzenlemId(null); setBaslik(''); setAciklama(''); setParams(makeVarsayilanParams(appSettings)); setView('form'); }}
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
    // Göreli % fark: (A - B) / |B| * 100
    const farkRel = (a: number, b: number, yuksekIyi = true) => {
      if (b === 0) return { text: '—', cls: 'text-gray-300' };
      const pct = ((a - b) / Math.abs(b)) * 100;
      if (Math.abs(pct) < 0.05) return { text: '—', cls: 'text-gray-300' };
      const iyi = yuksekIyi ? pct > 0 : pct < 0;
      return { text: `${pct > 0 ? '+' : ''}${fmtDec(pct, 1)}%`, cls: iyi ? 'text-emerald-600' : 'text-rose-500' };
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
                <th className="px-8 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-[2px] w-1/4">Kalem</th>
                <th className="px-4 py-4 text-right text-[9px] font-black text-blue-500 uppercase tracking-[1px]">{planA.baslik}</th>
                <th className="px-4 py-4 text-right text-[9px] font-black text-enba-orange uppercase tracking-[1px]">{planB.baslik}</th>
                <th className="px-4 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-[1px]">Fark (A−B)</th>
                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-[1px]">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {KARSILASTIRMA_SATIRLARI.map((row, i) => {
                const f = row.isPct
                  ? farkPct(row.vA, row.vB, row.yuksekIyi ?? true)
                  : fark(row.vA, row.vB, row.yuksekIyi ?? true);
                const fr = row.isPct
                  ? farkPct(row.vA, row.vB, row.yuksekIyi ?? true)
                  : farkRel(row.vA, row.vB, row.yuksekIyi ?? true);
                const isSection = ['Satış Geliri', 'FAVÖK', 'Net Kâr'].includes(row.label);
                return (
                  <tr key={i} className={isSection ? 'bg-gray-50' : 'hover:bg-gray-50/50'}>
                    <td className={`px-8 py-3 text-[11px] font-${isSection ? 'black' : 'medium'} text-gray-${isSection ? '700' : '500'} uppercase tracking-wider`}>{row.label}</td>
                    <td className="px-4 py-3 text-right text-sm font-black text-blue-600 tabular-nums">
                      {row.isPct ? `%${fmtDec(row.vA)}` : `₺${fmt(row.vA)}`}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-black text-enba-orange tabular-nums">
                      {row.isPct ? `%${fmtDec(row.vB)}` : `₺${fmt(row.vB)}`}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-black tabular-nums ${f.cls}`}>{f.text}</td>
                    <td className={`px-6 py-3 text-right text-xs font-black tabular-nums ${fr.cls}`}>{fr.text}</td>
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
          <button
            onClick={pdfIndir}
            disabled={isPdfGenerating}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500 font-black text-[11px] uppercase tracking-[2px] transition-all disabled:opacity-50"
          >
            <FileText size={15} />
            {isPdfGenerating ? 'Hazırlanıyor...' : 'PDF'}
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
          {/* ─── Operasyonel Sabitler ─────────────────── */}
          <Panel
            title="0. Operasyonel Sabitler" icon={<Scale size={18} />} open={panelSabitler}
            onToggle={() => setPanelSabitler(v => !v)}
            badge="Ayarlardan yüklendi"
          >
            <div className="mb-3 flex items-center gap-2 text-[10px] text-gray-400 font-bold">
              <span>Varsayılanlar Ayarlar sayfasından gelir. Her plan kendi değerini taşır — değiştirirsen sadece bu planı etkiler.</span>
            </div>
            <InputRow label="Asgari Net Ücret (₺/ay)" value={params.asgariUcret} onChange={v => setParams(p => ({ ...p, asgariUcret: v }))} suffix="₺" />
            <InputRow label="İşveren SGK Payı (₺/ay)" value={params.asgariSgk} onChange={v => setParams(p => ({ ...p, asgariSgk: v }))} suffix="₺" />
            <InputRow label="Günlük Yemek Ücreti (₺/gün)" value={params.yemekUcreti} onChange={v => setParams(p => ({ ...p, yemekUcreti: v }))} suffix="₺" />
            <InputRow label="Elektrik Birim Fiyatı (₺/kWh)" value={params.elektrikKwFiyat} onChange={v => setParams(p => ({ ...p, elektrikKwFiyat: v }))} suffix="₺" step={0.1} />
            <InputRow label="Aylık Çalışma Günü" value={params.aylikGun} onChange={v => setParams(p => ({ ...p, aylikGun: v }))} suffix="gün" max={31} />
          </Panel>

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

          {/* Gider Dağılım Çizelgesi */}
          {formSonuc.totalGider > 0 && (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-gray-100">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] mb-5">Gider Dağılımı</div>
              {[
                { label: 'Mal Alım', value: formSonuc.malAlisGideri, color: 'bg-rose-400' },
                { label: 'Nakliye', value: formSonuc.alisNakliyeGideri + formSonuc.satisNakliyeGideri, color: 'bg-orange-400' },
                { label: 'Personel', value: formSonuc.toplamMaas + formSonuc.toplamSgk + formSonuc.toplamYemek, color: 'bg-blue-400' },
                { label: 'Enerji', value: formSonuc.giderKırılım.enerji, color: 'bg-yellow-400' },
                { label: 'Diğer', value: formSonuc.toplamEktra - formSonuc.giderKırılım.enerji, color: 'bg-gray-300' },
              ].filter(item => item.value > 0).map(item => {
                const pct = (item.value / formSonuc.totalGider) * 100;
                return (
                  <div key={item.label} className="mb-4 last:mb-0">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-[1px]">{item.label}</span>
                      <span className="text-[9px] font-black text-gray-600 tabular-nums">%{fmtDec(pct, 0)} · ₺{fmt(item.value)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Yatırım Analizi */}
          {params.yatirimlar.length > 0 && (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-gray-100">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] flex items-center gap-2 mb-5">
                <TrendingUp size={14} className="text-enba-orange" /> Yatırım Analizi
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[1px]">Toplam CAPEX</span>
                <span className="font-black text-enba-dark tabular-nums">₺{fmt(params.yatirimlar.reduce((s, y) => s + y.tutar, 0))}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[1px]">Başabaş Noktası</span>
                <span className={`font-black tabular-nums ${formSonuc.basabasNokta === Infinity ? 'text-rose-500' : 'text-enba-dark'}`}>
                  {formSonuc.basabasNokta === Infinity ? '— kâra geçilemiyor' : `${fmtDec(formSonuc.basabasNokta, 1)} ton/ay`}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[1px]">Kapasite Kullanımı (BB)</span>
                <span className={`font-black tabular-nums ${formSonuc.basabasNokta <= params.aylikTon ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {formSonuc.basabasNokta === Infinity || params.aylikTon === 0 ? '—'
                    : `%${fmtDec((formSonuc.basabasNokta / params.aylikTon) * 100, 1)}`}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[1px]">Geri Ödeme Süresi</span>
                <span className={`font-black tabular-nums ${formSonuc.geriOdemeSuresi === null ? 'text-gray-300' : formSonuc.geriOdemeSuresi <= 36 ? 'text-emerald-600' : formSonuc.geriOdemeSuresi <= 60 ? 'text-yellow-600' : 'text-rose-500'}`}>
                  {formSonuc.geriOdemeSuresi === null ? '— (zarar)' : `${fmtDec(formSonuc.geriOdemeSuresi, 1)} ay`}
                </span>
              </div>
            </div>
          )}

          {/* Duyarlılık Tablosu */}
          {params.satisFiyati > 0 && (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-gray-100 overflow-hidden">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] flex items-center gap-2 mb-5">
                <BarChart3 size={14} className="text-enba-orange" /> Duyarlılık — Satış Fiyatı
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-[1px]">Senaryo</th>
                    <th className="pb-2 text-right text-[8px] font-black text-gray-400 uppercase tracking-[1px]">₺/ton</th>
                    <th className="pb-2 text-right text-[8px] font-black text-gray-400 uppercase tracking-[1px]">FAVÖK</th>
                    <th className="pb-2 text-right text-[8px] font-black text-gray-400 uppercase tracking-[1px]">Marj</th>
                  </tr>
                </thead>
                <tbody>
                  {duyarlilik.map(({ pct, sonuc: ds }) => {
                    const isCurrent = pct === 0;
                    return (
                      <tr key={pct} className={isCurrent ? 'bg-enba-orange/5' : 'hover:bg-gray-50/50'}>
                        <td className={`py-2.5 text-[10px] font-black ${pct < 0 ? 'text-rose-500' : pct > 0 ? 'text-emerald-600' : 'text-enba-orange'}`}>
                          {pct === 0 ? 'Baz' : `${pct > 0 ? '+' : ''}${pct}%`}
                        </td>
                        <td className="py-2.5 text-right text-[10px] font-black text-gray-600 tabular-nums">
                          ₺{fmt(params.satisFiyati * (1 + pct / 100))}
                        </td>
                        <td className={`py-2.5 text-right text-[10px] font-black tabular-nums ${kpiColor(ds.ebitda)}`}>
                          ₺{fmt(ds.ebitda)}
                        </td>
                        <td className={`py-2.5 text-right text-[10px] font-black tabular-nums ${ds.ebitdaMarji >= 10 ? 'text-emerald-600' : ds.ebitdaMarji >= 0 ? 'text-yellow-600' : 'text-rose-500'}`}>
                          %{fmtDec(ds.ebitdaMarji)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {saveModalOpen && (
        <SaveModal
          onYeniVersiyon={(not) => planKaydetDuzenle('yeni_versiyon', not)}
          onGuncelle={(not) => planKaydetDuzenle('guncelle', not)}
          onYeniModel={(not) => planKaydetDuzenle('yeni_model', not)}
          onIptal={() => setSaveModalOpen(false)}
        />
      )}

      {/* ─── Gizli PDF Container ─────────────────────────────── */}
      <div id="fastplan-pdf-container" style={{ position: 'fixed', left: '-9999px', top: 0, width: '794px', fontFamily: 'sans-serif', color: '#1A1A1A', background: '#fff', padding: '40px' }}>
        {/* Başlık */}
        <div style={{ borderBottom: '3px solid #E35205', paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#E35205', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>Enba Similasyon — Hızlı İş Planı</div>
          <div style={{ fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -0.5 }}>{baslik || 'İsimsiz Plan'}</div>
          {aciklama && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{aciklama}</div>}
          {etiket && <div style={{ display: 'inline-block', marginTop: 8, padding: '2px 10px', background: '#f3f4f6', borderRadius: 20, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>{etiket}</div>}
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 8 }}>{new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>

        {/* KPI Özet */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Satış Geliri', value: `₺${fmt(formSonuc.satisGeliri)}`, sub: `${fmtDec(formSonuc.satisTon)} ton/ay`, color: '#059669' },
            { label: 'Toplam Gider', value: `₺${fmt(formSonuc.totalGider)}`, sub: `₺${fmt(formSonuc.birimMaliyet)}/ton`, color: '#dc2626' },
            { label: 'FAVÖK', value: `₺${fmt(formSonuc.ebitda)}`, sub: `%${fmtDec(formSonuc.ebitdaMarji)} marj`, color: formSonuc.ebitda >= 0 ? '#059669' : '#dc2626' },
            { label: 'Net Kâr', value: `₺${fmt(formSonuc.netKar)}`, sub: formSonuc.netKar >= 0 ? 'Kârlı ✓' : 'Zarar ✗', color: formSonuc.netKar >= 0 ? '#059669' : '#dc2626' },
          ].map((k, i) => (
            <div key={i} style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Gider Kırılımı + Duyarlılık yan yana */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Gider Dağılımı */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 }}>Gider Dağılımı</div>
            {[
              { label: 'Mal Alım', value: formSonuc.malAlisGideri, color: '#f87171' },
              { label: 'Nakliye', value: formSonuc.alisNakliyeGideri + formSonuc.satisNakliyeGideri, color: '#fb923c' },
              { label: 'Personel', value: formSonuc.toplamMaas + formSonuc.toplamSgk + formSonuc.toplamYemek, color: '#60a5fa' },
              { label: 'Enerji', value: formSonuc.giderKırılım.enerji, color: '#facc15' },
              { label: 'Diğer', value: formSonuc.toplamEktra - formSonuc.giderKırılım.enerji + formSonuc.giderKırılım.kira + formSonuc.giderKırılım.bakim + formSonuc.giderKırılım.pazarlama + formSonuc.giderKırılım.yonetim + formSonuc.giderKırılım.diger, color: '#d1d5db' },
            ].filter(it => it.value > 0).map(it => {
              const pct = formSonuc.totalGider > 0 ? (it.value / formSonuc.totalGider) * 100 : 0;
              return (
                <div key={it.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#374151' }}>{it.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>%{fmtDec(pct, 0)} · ₺{fmt(it.value)}</span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: it.color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Duyarlılık */}
          {params.satisFiyati > 0 && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 }}>Duyarlılık — Satış Fiyatı</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '4px 0', fontWeight: 900, color: '#9ca3af', fontSize: 9 }}>Senaryo</th>
                    <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 900, color: '#9ca3af', fontSize: 9 }}>₺/ton</th>
                    <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 900, color: '#9ca3af', fontSize: 9 }}>FAVÖK</th>
                    <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 900, color: '#9ca3af', fontSize: 9 }}>Marj</th>
                  </tr>
                </thead>
                <tbody>
                  {duyarlilik.map(({ pct, sonuc: ds }) => (
                    <tr key={pct} style={{ borderBottom: '1px solid #f3f4f6', background: pct === 0 ? '#fff7ed' : 'transparent' }}>
                      <td style={{ padding: '5px 0', fontWeight: pct === 0 ? 900 : 700 }}>{pct === 0 ? 'Baz' : pct > 0 ? `+%${pct}` : `%${pct}`}</td>
                      <td style={{ textAlign: 'right', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>₺{fmt(params.satisFiyati * (1 + pct / 100))}</td>
                      <td style={{ textAlign: 'right', fontWeight: 900, color: ds.ebitda >= 0 ? '#059669' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>₺{fmt(ds.ebitda)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 900, color: ds.ebitdaMarji >= 10 ? '#059669' : ds.ebitdaMarji >= 0 ? '#ca8a04' : '#dc2626' }}>%{fmtDec(ds.ebitdaMarji)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Yatırım Analizi */}
        {params.yatirimlar.length > 0 && (
          <div style={{ background: '#f9fafb', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 }}>Yatırım Analizi</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[
                { label: 'Toplam CAPEX', value: `₺${fmt(params.yatirimlar.reduce((s, y) => s + y.tutar, 0))}` },
                { label: 'Başabaş Noktası', value: formSonuc.basabasNokta === Infinity ? '— kâra geçilemiyor' : `${fmtDec(formSonuc.basabasNokta, 1)} ton/ay` },
                { label: 'Geri Ödeme Süresi', value: formSonuc.geriOdemeSuresi === null ? '— (zarar)' : `${fmtDec(formSonuc.geriOdemeSuresi, 1)} ay` },
              ].map((it, i) => (
                <div key={i}>
                  <div style={{ fontSize: 9, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{it.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 900 }}>{it.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: 9, color: '#d1d5db', textAlign: 'center', marginTop: 16 }}>
          Enba Similasyon · uygulama.basarunal.com · {new Date().toLocaleDateString('tr-TR')}
        </div>
      </div>
    </div>
  );
};

export default FastPlan;
