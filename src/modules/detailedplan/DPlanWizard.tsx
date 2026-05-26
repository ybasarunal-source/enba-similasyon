import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { cx, I, Btn, Badge } from './DPPrimitives';
import {
  DPlan, CostCenter, PlanCategory, PLAN_CATEGORY_LABEL,
  ProductionModel, ProductionParams, MachineEntry, WorkerGroup,
  RawMaterial, OutputProduct, OtherVariableCost, InputFraction,
  calcProductionResults, deriveProjectFromModel, fmtTL,
  RampUpSchedule, RampUpMonth,
  PlanMCodeEntry, PlanMCodeStatus,
} from './dpData';
import { fixedAssetsAPI, FixedAsset, FixedAssetForm } from '../../api/varlikTakibi';
import { supabase } from '../../api/supabase';
import {
  generateInsights, calcScenariosTable,
  Insight, InsightLevel,
} from './dpAssistant';
import { MCODE_CONTROL_LIST, getMcodeLabel, buildPnLRows, PNL_SECTIONS } from './pnlStructure';

// ─── Sabitler ────────────────────────────────────────────────────────────────

const DEFAULT_PARAMS: ProductionParams = {
  energyUnitCost: 5,
  defaultDF:      0.60,
  hoursPerDay:    10,
  daysPerMonth:   26,
};

const STEP_LABELS = [
  'Plan Bilgisi',
  'Giriş & Fire',
  'Üretim',
  'Çıktı & Gelir',
  'Maliyet Kontrol',
  'Rampa & Özet',
];

// ─── Wizard durumu ────────────────────────────────────────────────────────────

interface WizardState {
  // Adım 1 — Plan Bilgisi
  title:        string;
  category:     PlanCategory;
  description:  string;
  startYear:    number;
  startMonth:   number;
  horizon:      number;
  openingCash:  number;
  costCenterId: string;

  // Adım 2 — Giriş & Fire
  inputUnit:           'ton' | 'kg';
  monthlyInputAmount:  number;     // inputUnit cinsinden
  inputUnitPrice:      number;     // ₺/ton — hammadde alış fiyatı
  moistureWasteRate:   number;     // nem (0-1)
  trashWasteRate:      number;     // yabancı madde (taş/toprak/metal) (0-1)
  altKaliteMode:       'simple' | 'detailed';
  altKaliteSimpleRate: number;     // mod A: toplam alt kalite fire (0-1)
  inputFractions:      InputFraction[];  // mod B
  sortingEnabled:      boolean;    // ön seçim var mı? (Giriş & Fire'ın son bölümü)

  // Adım 3 — Üretim (eski Adım 4)
  params:              ProductionParams;
  machines:            MachineEntry[];
  processWasteRate:    number;
  fireAfterMachineIdx: number;
  washingEnabled:      boolean;
  washingWasteRate:    number;
  workers:             WorkerGroup[];
  rawMaterials:        RawMaterial[];
  otherVariableCosts:  OtherVariableCost[];

  // Adım 4 — Çıktı Ürünleri (eski Adım 5)
  outputProducts: OutputProduct[];

  // Adım 5 — Maliyet Kontrol (YENİ)
  mcodeEntries: PlanMCodeEntry[];

  // Adım 6 — Rampa & Özet (eski Adım 6+7)
  rampUp: RampUpSchedule;
}

function initState(plan?: DPlan): WizardState {
  const pm = plan?.productionModel;
  // Eski planlar monthlyInputTons kullanıyor, yeni format monthlyInputAmount
  const monthlyInputAmount = pm?.monthlyInputTons ?? 100;
  return {
    title:        plan?.title        ?? '',
    category:     plan?.category     ?? '',
    description:  plan?.description  ?? '',
    startYear:    plan?.startYear    ?? new Date().getFullYear(),
    startMonth:   plan?.startMonth   ?? 0,
    horizon:      plan?.horizon      ?? 24,
    openingCash:  plan?.openingCash  ?? 0,
    costCenterId: plan?.projects?.[0]?.costCenterId ?? '',

    inputUnit:           pm?.inputUnit           ?? 'ton',
    monthlyInputAmount,
    inputUnitPrice:      pm?.inputUnitPrice      ?? 0,
    moistureWasteRate:   pm?.moistureWasteRate   ?? 0,
    trashWasteRate:      pm?.trashWasteRate       ?? 0,
    altKaliteMode:       pm?.altKaliteMode        ?? 'simple',
    altKaliteSimpleRate: pm?.altKaliteSimpleRate  ?? 0,
    inputFractions:      pm?.inputFractions       ?? [],

    sortingEnabled: pm?.sortingEnabled ?? true,

    params:              pm?.params             ?? { ...DEFAULT_PARAMS },
    machines:            pm?.machines           ?? [],
    processWasteRate:    pm?.processWasteRate   ?? 0.05,
    fireAfterMachineIdx: pm?.fireAfterMachineIdx ?? -1,
    washingEnabled:      pm?.washingEnabled      ?? false,
    washingWasteRate:    pm?.washingWasteRate    ?? 0.03,
    workers:             pm?.workers             ?? [],
    rawMaterials:        pm?.rawMaterials        ?? [],
    otherVariableCosts:  pm?.otherVariableCosts  ?? [],

    outputProducts: pm?.outputProducts ?? [],

    mcodeEntries: plan?.mcodeEntries ?? [],

    rampUp: plan?.rampUp ?? { enabled: false, months: [], targetMonth: 3 },
  };
}

function stateToProductionModel(s: WizardState): ProductionModel {
  const monthlyInputTons = s.inputUnit === 'kg'
    ? s.monthlyInputAmount / 1000
    : s.monthlyInputAmount;

  // Etkin giriş fire oranı (calc fonksiyonu zaten yeni alanları kullanıyor ama
  // eski panellere/dpAssistant'a model geçildiğinde backward compat için tutuyoruz)
  const altKaliteEff = s.altKaliteMode === 'simple'
    ? s.altKaliteSimpleRate
    : s.inputFractions
        .filter(f => f.destination !== 'production')
        .reduce((sum, f) => sum + f.percentage, 0);
  const inputWasteRate = Math.min(
    s.moistureWasteRate + s.trashWasteRate + altKaliteEff,
    0.99,
  );

  return {
    params:             s.params,
    monthlyInputTons,
    inputUnit:          s.inputUnit,
    inputUnitPrice:     s.inputUnitPrice || undefined,
    inputWasteRate,
    moistureWasteRate:  s.moistureWasteRate,
    trashWasteRate:     s.trashWasteRate,
    altKaliteMode:      s.altKaliteMode,
    altKaliteSimpleRate: s.altKaliteSimpleRate,
    inputFractions:     s.inputFractions,
    sortingEnabled:     s.sortingEnabled,
    sortingWasteRate:   0,  // ön seçim kayıpları inputFractions içinde
    machines:           s.machines,
    processWasteRate:   s.processWasteRate,
    fireAfterMachineIdx: s.fireAfterMachineIdx,
    washingEnabled:     s.washingEnabled,
    washingWasteRate:   s.washingWasteRate,
    outputProducts:     s.outputProducts,
    rawMaterials:       s.rawMaterials,
    workers:            s.workers,
    otherVariableCosts: s.otherVariableCosts,
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialPlan?:  DPlan;
  costCenters:   CostCenter[];
  onDone:        (plan: DPlan) => void;
  onSave:        (plan: DPlan) => void;
  onCancel:      () => void;
}

// ─── Ana wizard bileşeni ─────────────────────────────────────────────────────

export function DPlanWizard({ initialPlan, costCenters, onDone, onSave, onCancel }: Props) {
  const [step, setStep]               = useState(0);
  const [state, setState]             = useState<WizardState>(() => initState(initialPlan));
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const set = useCallback(<K extends keyof WizardState>(key: K, val: WizardState[K]) => {
    setState(prev => ({ ...prev, [key]: val }));
  }, []);

  const model   = useMemo(() => stateToProductionModel(state), [state]);
  const calc    = useMemo(() => calcProductionResults(model), [model]);
  const hasCostCenter = Boolean(state.costCenterId);
  const insights = useMemo(
    () => generateInsights(model, hasCostCenter, calc),
    [model, hasCostCenter, calc],
  );

  const selectedCC    = costCenters.find(c => c.id === state.costCenterId);
  const fixedCostMonth = selectedCC?.fixedExpenses.reduce((s, e) => s + e.monthly, 0) ?? 0;

  const buildPlan = (targetStatus?: DPlan['status']): DPlan => {
    const pm      = stateToProductionModel(state);
    const derived = deriveProjectFromModel(pm, {
      id:           initialPlan?.projects?.[0]?.id,
      costCenterId: state.costCenterId,
    });
    return {
      ...(initialPlan ?? {
        id:             crypto.randomUUID(),
        supabaseId:     undefined,
        actualsThrough: 0,
        suppliers:      [],
        customers:      [],
        cashEvents:     [],
        weeklyHorizon:  0,
      }),
      title:           state.title || 'Adsız Plan',
      baslik:          state.title || 'Adsız Plan',
      status:          targetStatus ?? initialPlan?.status ?? 'draft',
      category:        state.category,
      description:     state.description,
      year:            state.startYear,
      startYear:       state.startYear,
      startMonth:      state.startMonth,
      horizon:         state.horizon,
      openingCash:     state.openingCash,
      productionModel: pm,
      projects:        [derived],
      rampUp:          state.rampUp.enabled ? state.rampUp : undefined,
      mcodeEntries:    state.mcodeEntries,
    };
  };

  // Taslak kaydet — validasyon yok, plan durumu korunur
  const saveDraft = () => {
    if (!state.title.trim()) {
      setSaveError('Plan başlığı zorunludur. Lütfen "Plan Bilgisi" adımında bir başlık girin.');
      return;
    }
    setSaveError(null);
    onSave(buildPlan());
  };

  // Yayınla — ön kontrol modalı açar (Faz 1: direkt kaydet, modal gelecek)
  const handlePublishClick = () => {
    if (!state.title.trim()) {
      setSaveError('Plan başlığı zorunludur. Lütfen "Plan Bilgisi" adımında bir başlık girin.');
      return;
    }
    setSaveError(null);
    setShowPublishModal(true);
  };

  // Modal'da "Yayınla" onaylandı → active olarak kaydet
  const confirmPublish = () => {
    setShowPublishModal(false);
    onDone(buildPlan('active'));
  };

  const handleOvertimePlan = useCallback((hoursPerDay: number) => {
    setState(prev => ({ ...prev, params: { ...prev.params, hoursPerDay } }));
  }, []);

  const showRightPanel = step >= 2;
  const showAssistant  = step >= 2 && step <= 3;  // Üretim + Çıktı adımlarında asistan
  const showPnLPreview = step === 4 || step === 5; // Maliyet + Rampa&Özet'te P&L önizleme
  const isLastStep     = step === STEP_LABELS.length - 1;

  return (
    <div className="h-full flex flex-col bg-enba-bg overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-none bg-enba-panel border-b border-enba-line">
        {/* Üst satır: geri + başlık */}
        <div className="h-[52px] flex items-center px-5 gap-4 border-b border-enba-line/60">
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg text-enba-muted hover:text-enba-text hover:bg-enba-panel-2 inline-flex items-center justify-center flex-none"
          >
            <I.Chevron size={14} className="rotate-90" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-enba-text">
              {initialPlan ? 'Planı Düzenle' : 'Yeni İş Planı — Granül Üretimi'}
            </div>
            <div className="text-[10.5px] text-enba-dim">{state.title || 'Başlık girilmemiş'}</div>
          </div>
          <div className="text-[10.5px] text-enba-muted flex-none">
            Adım <span className="font-semibold text-enba-text">{step + 1}</span> / {STEP_LABELS.length}
          </div>
        </div>
        {/* Alt satır: adım göstergesi — tam genişlik */}
        <div className="flex items-stretch overflow-x-auto px-5 py-1.5 gap-0.5 scrollbar-none">
          {STEP_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => {
                if (i === step) return;
                if (i > 0 && !state.title.trim()) {
                  setSaveError('Plan başlığı zorunludur. Lütfen önce bir başlık girin.');
                  return;
                }
                setSaveError(null);
                setStep(i);
              }}
              className={cx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap flex-1 justify-center',
                i === step
                  ? 'bg-enba-orange text-white'
                  : i < step
                  ? 'text-enba-orange hover:bg-enba-orange/10'
                  : 'text-enba-dim hover:bg-enba-panel-2 hover:text-enba-text',
              )}
            >
              <span className={cx(
                'w-4 h-4 rounded-full text-[9px] font-bold inline-flex items-center justify-center flex-none',
                i === step ? 'bg-white/20' : i < step ? 'bg-enba-orange/20' : 'bg-enba-panel-2',
              )}>
                {i < step ? '✓' : i + 1}
              </span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">
        <div className={cx('flex-1 overflow-y-auto', showRightPanel ? 'md:w-0' : '')}>
          <div className="p-6 max-w-[640px] mx-auto">
            {step === 0 && <Step1PlanInfo     state={state} set={set} costCenters={costCenters} />}
            {step === 1 && <Step2GirisFire    state={state} set={set} calc={calc} />}
            {step === 2 && <Step3Uretim       state={state} set={set} calc={calc} />}
            {step === 3 && <Step4CiktiUrunler state={state} set={set} calc={calc} />}
            {step === 4 && (
              <Step5MaliyetKontrol
                state={state}
                calc={calc}
                ccExpenses={selectedCC?.fixedExpenses ?? []}
                onUpdateEntries={entries => setState(prev => ({ ...prev, mcodeEntries: entries }))}
              />
            )}
            {step === 5 && <Step6RampaOzet state={state} set={set} calc={calc} fixedCostMonth={fixedCostMonth} />}
          </div>
        </div>

        {/* Sağ panel: Adım 2-3 → Asistan, Adım 4-5 → P&L Önizleme */}
        {showAssistant && (
          <div className="hidden md:flex w-[300px] flex-none border-l border-enba-line flex-col overflow-y-auto">
            <AssistantPanel
              insights={insights}
              calc={calc}
              model={model}
              fixedCostMonth={fixedCostMonth}
              onGoStep={setStep}
              onOvertimePlan={handleOvertimePlan}
            />
          </div>
        )}
        {showPnLPreview && (
          <div className="hidden md:flex w-[340px] flex-none border-l border-enba-line flex-col overflow-y-auto">
            <LivePnLPreview
              calc={calc}
              mcodeEntries={state.mcodeEntries}
              ccExpenses={selectedCC?.fixedExpenses ?? []}
            />
          </div>
        )}
      </div>

      {/* Yayınla Ön Kontrol Modalı */}
      {showPublishModal && (
        <PublishModal
          calc={calc}
          mcodeEntries={state.mcodeEntries}
          ccExpenses={selectedCC?.fixedExpenses ?? []}
          onClose={() => setShowPublishModal(false)}
          onConfirm={confirmPublish}
          onUpdateEntries={entries => setState(prev => ({ ...prev, mcodeEntries: entries }))}
        />
      )}

      {/* ── Footer ── */}
      <div className="flex-none bg-enba-panel border-t border-enba-line">
        {/* Hata mesajı */}
        {saveError && (
          <div className="px-5 py-2 bg-red-50 border-b border-red-100 text-[12px] text-red-600 flex items-center gap-2">
            <I.Info size={13} className="flex-shrink-0" />
            {saveError}
          </div>
        )}
        <div className="px-5 h-[56px] flex items-center justify-between gap-3">
          <Btn variant="ghost" size="md" onClick={() => step > 0 ? setStep(step - 1) : onCancel()}>
            {step === 0 ? 'İptal' : 'Geri'}
          </Btn>
          <div className="flex items-center gap-2">
            {/* Taslak Kaydet — her adımda görünür */}
            <Btn variant="outline" size="md" onClick={saveDraft}>
              <I.Save size={13} className="mr-1" />Taslak Kaydet
            </Btn>
            {!isLastStep ? (
              <Btn
                variant="primary" size="md"
                onClick={() => {
                  if (step === 0 && !state.title.trim()) {
                    setSaveError('Plan başlığı zorunludur. Devam etmek için bir başlık girin.');
                    return;
                  }
                  setSaveError(null);
                  setStep(step + 1);
                }}
              >
                Devam
              </Btn>
            ) : (
              <Btn variant="primary" size="md" onClick={handlePublishClick}>
                <I.Lock size={13} className="mr-1" />Yayınla
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Adım 1 — Plan Bilgisi ────────────────────────────────────────────────────

function Step1PlanInfo({ state, set, costCenters }: {
  state: WizardState;
  set: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  costCenters: CostCenter[];
}) {
  const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Plan Bilgisi" sub="Planın adı, kapsamı ve zaman aralığı" />

      <FormGroup label="Plan Adı" required>
        <input
          autoFocus
          value={state.title}
          onChange={e => set('title', e.target.value)}
          placeholder="örn: Kömürcüler PET Granül Tesisi 2026"
          className={inputCls}
        />
      </FormGroup>

      <FormGroup label="Kategori">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PLAN_CATEGORY_LABEL) as PlanCategory[]).filter(k => k !== '').map(k => (
            <button
              key={k}
              onClick={() => set('category', state.category === k ? '' : k)}
              className={cx(
                'px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors',
                state.category === k
                  ? 'bg-enba-orange/15 border-enba-orange/50 text-enba-orange'
                  : 'bg-enba-panel-2 border-enba-line text-enba-muted hover:text-enba-text',
              )}
            >
              {PLAN_CATEGORY_LABEL[k]}
            </button>
          ))}
        </div>
      </FormGroup>

      <FormGroup label="Açıklama">
        <textarea
          value={state.description}
          onChange={e => set('description', e.target.value)}
          rows={2}
          placeholder="Kısa özet — ürün, hedef, bağlam"
          className={cx(inputCls, 'resize-none')}
        />
      </FormGroup>

      <div className="grid grid-cols-3 gap-4">
        <FormGroup label="Başlangıç Yılı">
          <input type="number" value={state.startYear}
            onChange={e => set('startYear', Number(e.target.value))}
            className={inputCls} />
        </FormGroup>
        <FormGroup label="Başlangıç Ayı">
          <select value={state.startMonth} onChange={e => set('startMonth', Number(e.target.value))} className={inputCls}>
            {MONTHS_TR.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Plan Süresi">
          <select value={state.horizon} onChange={e => set('horizon', Number(e.target.value))} className={inputCls}>
            {[12, 18, 24, 36, 48].map(h => <option key={h} value={h}>{h} ay</option>)}
          </select>
        </FormGroup>
      </div>

      <FormGroup label="Açılış Kasası (₺)">
        <NumInput value={state.openingCash} onChange={v => set('openingCash', v)} placeholder="0" />
      </FormGroup>

      <FormGroup label="Sabit Gider Merkezi">
        <select value={state.costCenterId} onChange={e => set('costCenterId', e.target.value)} className={inputCls}>
          <option value="">— Seçin —</option>
          {costCenters.map(cc => {
            const total = cc.fixedExpenses.reduce((s, e) => s + e.monthly, 0);
            return (
              <option key={cc.id} value={cc.id}>
                {cc.name} — {fmtTL(total, { compact: true })}/ay
              </option>
            );
          })}
        </select>
        {!state.costCenterId && (
          <p className="text-[11px] text-enba-dim mt-1">Kira, bakım, muhasebe gibi sabit giderler için liste ekranından Gider Merkezi oluşturun.</p>
        )}
      </FormGroup>
    </div>
  );
}

// ─── Adım 2 — Giriş & Fire ───────────────────────────────────────────────────

function Step2GirisFire({ state, set, calc }: {
  state: WizardState;
  set: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  calc: ReturnType<typeof calcProductionResults>;
}) {
  const totalFireRate = state.moistureWasteRate + state.trashWasteRate + (
    state.altKaliteMode === 'simple'
      ? state.altKaliteSimpleRate
      : state.inputFractions.filter(f => f.destination !== 'production').reduce((s, f) => s + f.percentage, 0)
  );
  const toProduction    = calc.afterInputWaste;
  const paidTons        = calc.paidInputTons;
  const monthlyMatCost  = state.inputUnitPrice > 0 ? paidTons * state.inputUnitPrice : 0;

  const updateFraction = (id: string, patch: Partial<InputFraction>) =>
    set('inputFractions', state.inputFractions.map(f => f.id === id ? { ...f, ...patch } : f));
  const removeFraction = (id: string) =>
    set('inputFractions', state.inputFractions.filter(f => f.id !== id));
  const addFraction = () =>
    set('inputFractions', [...state.inputFractions, {
      id: crypto.randomUUID(), name: '', percentage: 0.05,
      destination: 'discard' as const,
    }]);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader title="Giriş & Fire" sub="Tesise giren malzeme miktarı ve fire dağılımı" />

      {/* Giriş miktarı */}
      <ParamSection title="Giriş Miktarı" icon="📥">
        <div className="grid grid-cols-[1fr_120px] gap-3 items-end">
          <FormGroup label="Aylık giriş miktarı">
            <NumInput value={state.monthlyInputAmount} onChange={v => set('monthlyInputAmount', v)} step={5} />
          </FormGroup>
          <FormGroup label="Birim">
            <div className="flex rounded-lg overflow-hidden border border-enba-line">
              {(['ton', 'kg'] as const).map(u => (
                <button key={u} onClick={() => set('inputUnit', u)}
                  className={cx('flex-1 py-2 text-[13px] font-medium transition-colors',
                    state.inputUnit === u
                      ? 'bg-enba-orange text-white'
                      : 'bg-enba-panel-2 text-enba-muted hover:text-enba-text',
                  )}>
                  {u}
                </button>
              ))}
            </div>
          </FormGroup>
        </div>
        <div className="mt-4 pt-4 border-t border-enba-line">
          <FormGroup label="Alış Fiyatı" hint="₺/ton">
            <NumInput value={state.inputUnitPrice} onChange={v => set('inputUnitPrice', v)} step={100} placeholder="örn: 5000" />
          </FormGroup>
          {state.inputUnitPrice > 0 && (
            <div className="mt-2 flex items-center gap-2 text-[12px]">
              <span className="text-enba-dim">Aylık hammadde maliyeti:</span>
              <span className="font-semibold text-enba-text">{fmtTL(monthlyMatCost, { compact: true })}</span>
              <span className="text-enba-dim">({paidTons.toFixed(1)} ton × {fmtTL(state.inputUnitPrice, { compact: true })}/ton)</span>
            </div>
          )}
        </div>
      </ParamSection>

      {/* Fire dağılımı */}
      <ParamSection title="Fire Dağılımı" icon="🔥">
        <div className="flex flex-col gap-4">

          {/* Nem */}
          <div className="grid grid-cols-[1fr_120px] gap-3 items-center">
            <div>
              <div className="text-[13px] font-medium text-enba-text">Nem Firesi</div>
              <div className="text-[11px] text-enba-dim">Malzeme ıslaksa nem oranı</div>
            </div>
            <div className="flex items-center gap-2">
              <NumInput value={state.moistureWasteRate * 100}
                onChange={v => set('moistureWasteRate', v / 100)}
                step={0.5} min={0} max={50} placeholder="0" className="w-20" />
              <span className="text-[13px] text-enba-dim">%</span>
            </div>
          </div>

          <div className="border-t border-enba-line" />

          {/* Yabancı madde */}
          <div className="grid grid-cols-[1fr_120px] gap-3 items-center">
            <div>
              <div className="text-[13px] font-medium text-enba-text">Yabancı Madde Firesi</div>
              <div className="text-[11px] text-enba-dim">Taş, toprak, metal ve diğer katışkılar</div>
            </div>
            <div className="flex items-center gap-2">
              <NumInput value={state.trashWasteRate * 100}
                onChange={v => set('trashWasteRate', v / 100)}
                step={0.5} min={0} max={50} placeholder="0" className="w-20" />
              <span className="text-[13px] text-enba-dim">%</span>
            </div>
          </div>

          <div className="border-t border-enba-line" />

          {/* Alt kalite fraksiyonlar */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[13px] font-medium text-enba-text">Alt Kalite Fraksiyonlar</div>
                <div className="text-[11px] text-enba-dim">Kağıt, LDPE, 2. kalite PP vb.</div>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-enba-line text-[11px]">
                <button onClick={() => set('altKaliteMode', 'simple')}
                  className={cx('px-3 py-1.5 font-medium transition-colors',
                    state.altKaliteMode === 'simple'
                      ? 'bg-enba-orange text-white'
                      : 'bg-enba-panel-2 text-enba-muted hover:text-enba-text')}>
                  Basit
                </button>
                <button onClick={() => set('altKaliteMode', 'detailed')}
                  className={cx('px-3 py-1.5 font-medium transition-colors',
                    state.altKaliteMode === 'detailed'
                      ? 'bg-enba-orange text-white'
                      : 'bg-enba-panel-2 text-enba-muted hover:text-enba-text')}>
                  Detaylı
                </button>
              </div>
            </div>

            {state.altKaliteMode === 'simple' ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 text-[12px] text-enba-dim">Toplam alt kalite fire oranı</div>
                <div className="flex items-center gap-2">
                  <NumInput value={state.altKaliteSimpleRate * 100}
                    onChange={v => set('altKaliteSimpleRate', v / 100)}
                    step={0.5} min={0} max={80} placeholder="0" className="w-20" />
                  <span className="text-[13px] text-enba-dim">%</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {state.inputFractions.length === 0 && (
                  <div className="text-[12px] text-enba-dim py-1">Fraksiyon eklenmemiş</div>
                )}
                {state.inputFractions.map(f => (
                  <div key={f.id} className="bg-enba-panel-2 border border-enba-line rounded-xl p-3 flex flex-col gap-3">
                    <div className="grid grid-cols-[1fr_80px_28px] gap-2 items-center">
                      <input value={f.name} onChange={e => updateFraction(f.id, { name: e.target.value })}
                        placeholder="Fraksiyon adı (örn: Kağıt)" className={inputCls} />
                      <div className="flex items-center gap-1">
                        <NumInput value={f.percentage * 100}
                          onChange={v => updateFraction(f.id, { percentage: v / 100 })}
                          step={0.5} min={0} max={80} placeholder="%" className="w-full" />
                        <span className="text-[11px] text-enba-dim flex-none">%</span>
                      </div>
                      <DelBtn onClick={() => removeFraction(f.id)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <FormGroup label="Ne yapılacak?">
                        <select value={f.destination}
                          onChange={e => updateFraction(f.id, { destination: e.target.value as InputFraction['destination'] })}
                          className={inputCls}>
                          <option value="discard">At (fire)</option>
                          <option value="sell">Direkt sat</option>
                          <option value="production">Üretime sok</option>
                        </select>
                      </FormGroup>
                      {f.destination === 'sell' && (
                        <FormGroup label="Satış fiyatı (₺/kg)">
                          <NumInput value={f.unitPrice ?? 0}
                            onChange={v => updateFraction(f.id, { unitPrice: v })}
                            step={0.1} placeholder="0.00" />
                        </FormGroup>
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={addFraction}
                  className="flex items-center gap-2 text-[12.5px] text-enba-muted hover:text-enba-orange transition-colors px-1 py-1 mt-1">
                  <I.Plus size={13} /> Fraksiyon ekle
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Özet */}
        <div className="mt-4 pt-4 border-t border-enba-line grid grid-cols-2 gap-3 text-[12px]">
          <div className="bg-enba-panel-2 rounded-lg px-3 py-2">
            <div className="text-enba-dim mb-0.5">Toplam fire</div>
            <div className="font-semibold text-red-400">{(totalFireRate * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-enba-panel-2 rounded-lg px-3 py-2">
            <div className="text-enba-dim mb-0.5">Ödenen ton / ay</div>
            <div className="font-semibold text-enba-text">{paidTons.toFixed(1)} ton</div>
          </div>
          <div className="bg-enba-panel-2 rounded-lg px-3 py-2">
            <div className="text-enba-dim mb-0.5">Üretime giren</div>
            <div className="font-semibold text-enba-green">{toProduction.toFixed(1)} ton/ay</div>
          </div>
          {monthlyMatCost > 0 && (
            <div className="bg-enba-panel-2 rounded-lg px-3 py-2">
              <div className="text-enba-dim mb-0.5">Hammadde maliyeti</div>
              <div className="font-semibold text-enba-orange">{fmtTL(monthlyMatCost, { compact: true })}/ay</div>
            </div>
          )}
        </div>
      </ParamSection>

      {/* Ön Seçim — Giriş & Fire'a dahil */}
      <ParamSection title="Ön Seçim" icon="🔀">
        <div className={cx(
          'rounded-xl border p-4 flex items-start gap-4 cursor-pointer transition-all -mx-1',
          state.sortingEnabled
            ? 'bg-enba-panel border-enba-orange/40'
            : 'bg-enba-panel-2 border-enba-line',
        )} onClick={() => set('sortingEnabled', !state.sortingEnabled)}>
          <div className={cx(
            'w-11 h-6 rounded-full flex-none mt-0.5 relative transition-colors',
            state.sortingEnabled ? 'bg-enba-orange' : 'bg-enba-panel-2 border border-enba-line',
          )}>
            <div className={cx(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all',
              state.sortingEnabled ? 'left-[22px]' : 'left-0.5',
            )} />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-enba-text mb-0.5">
              {state.sortingEnabled ? 'Ön seçim var' : 'Ön seçim yok'}
            </div>
            <div className="text-[11px] text-enba-dim">
              {state.sortingEnabled
                ? 'Malzeme kırma hattına girmeden önce ayrıştırılıyor. Fraksiyonlar yukarıda tanımlı şekilde yönlendirilecek.'
                : 'Malzeme direkt üretime giriyor. Fraksiyonlar ayrıştırılmadan fire olarak sayılıyor.'}
            </div>
          </div>
        </div>

        {/* Fraksiyon özeti */}
        {state.sortingEnabled && state.altKaliteMode === 'detailed' && state.inputFractions.length > 0 && (
          <div className="flex flex-col gap-2 mt-3">
            {state.inputFractions.map(f => {
              const tons      = calc.grossInputTons * f.percentage;
              const destLabel = f.destination === 'sell'
                ? `Direkt sat — ${fmtTL(tons * 1000 * (f.unitPrice ?? 0), { compact: true })}/ay`
                : f.destination === 'production' ? 'Üretime sok' : 'At (fire)';
              const destColor = f.destination === 'sell'
                ? 'text-enba-green'
                : f.destination === 'production' ? 'text-enba-orange' : 'text-enba-dim';
              return (
                <div key={f.id} className="flex items-center justify-between bg-enba-panel-2 border border-enba-line rounded-lg px-3 py-2">
                  <div>
                    <span className="text-[12px] font-medium text-enba-text">{f.name || '—'}</span>
                    <span className="text-[10.5px] text-enba-dim ml-2">{(f.percentage * 100).toFixed(1)}% → {tons.toFixed(1)} ton/ay</span>
                  </div>
                  <span className={cx('text-[11.5px] font-medium', destColor)}>{destLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </ParamSection>
    </div>
  );
}

// ─── Adım 3 — Üretim (eski Adım 4) ──────────────────────────────────────────

function Step3Uretim({ state, set, calc }: {
  state: WizardState;
  set: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  calc: ReturnType<typeof calcProductionResults>;
}) {
  const machineCapMap = new Map(calc.machineCapacities.map(mc => [mc.machine.id, mc]));
  const setParam = (k: keyof ProductionParams, v: number) =>
    set('params', { ...state.params, [k]: v });

  // Varlık envanterinden makineler
  const [inventoryMachines,   setInventoryMachines]   = useState<FixedAsset[]>([]);
  const [companyId,           setCompanyId]           = useState<string>('');
  const [addingToInventory,   setAddingToInventory]   = useState<Set<string>>(new Set());
  const [addedToInventory,    setAddedToInventory]    = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const cid = (data.session?.user?.app_metadata?.company_id as string) ?? '';
      setCompanyId(cid);
      if (!cid) return;
      fixedAssetsAPI.getAll(cid).then(assets =>
        setInventoryMachines(assets.filter(a => a.tur === 'makina'))
      ).catch(() => {});
    });
  }, []);

  const addToInventory = async (m: MachineEntry) => {
    if (!companyId || addingToInventory.has(m.id)) return;
    setAddingToInventory(prev => new Set([...prev, m.id]));
    try {
      const form: FixedAssetForm = {
        name:               m.name || 'İsimsiz Makine',
        category:           'Makine',
        tur:                'makina',
        operation:          'M',
        purchase_date:      new Date().toISOString().split('T')[0],
        purchase_amount_tl: 0,
        exchange_rate:      40,
        useful_life_years:  10,
        motor_kw:           m.kw           > 0 ? m.kw           : undefined,
        kapasite_ton_saat:  m.capacityTonPerHour > 0 ? m.capacityTonPerHour : undefined,
        notes:              '',
      };
      const asset = await fixedAssetsAPI.add(companyId, form);
      updateMachine(m.id, { assetId: asset.id });
      setInventoryMachines(prev => [...prev, asset]);
      setAddedToInventory(prev => new Set([...prev, m.id]));
    } catch { /* sessiz hata */ } finally {
      setAddingToInventory(prev => { const n = new Set(prev); n.delete(m.id); return n; });
    }
  };

  const addMachine = () => {
    set('machines', [...state.machines, {
      id: crypto.randomUUID(), name: '', kw: 0,
      capacityTonPerHour: 0, usesNetOutput: false, order: state.machines.length,
    }]);
  };

  const addFromInventory = (asset: FixedAsset) => {
    set('machines', [...state.machines, {
      id:                 crypto.randomUUID(),
      name:               asset.name,
      kw:                 asset.motor_kw          ?? 0,
      capacityTonPerHour: asset.kapasite_ton_saat ?? 0,
      usesNetOutput:      false,
      order:              state.machines.length,
      assetId:            asset.id,
    }]);
  };

  const updateMachine = (id: string, patch: Partial<MachineEntry>) =>
    set('machines', state.machines.map(m => m.id === id ? { ...m, ...patch } : m));
  const removeMachine = (id: string) =>
    set('machines', state.machines.filter(m => m.id !== id).map((m, i) => ({ ...m, order: i })));
  const moveMachine = (idx: number, dir: -1 | 1) => {
    const arr  = [...state.machines];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    set('machines', arr.map((m, i) => ({ ...m, order: i })));
  };

  // Envanterde olup henüz eklenmemiş makineler
  const addedAssetIds = new Set(state.machines.map(m => m.assetId).filter(Boolean));
  const unaddedInventory = inventoryMachines.filter(a => !addedAssetIds.has(a.id));

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader title="Üretim" sub="Makineler, personel, fire ve yardımcı malzemeler" />

      {/* Enerji */}
      <ParamSection title="Enerji Parametreleri" icon="⚡">
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Elektrik birim fiyatı" hint="₺/kWh">
            <NumInput value={state.params.energyUnitCost} onChange={v => setParam('energyUnitCost', v)} step={0.1} />
          </FormGroup>
          <FormGroup label="Varsayılan DF" hint="Talep Faktörü, 0.60 önerilir">
            <NumInput value={state.params.defaultDF} onChange={v => setParam('defaultDF', v)} step={0.05} min={0.1} max={1} />
          </FormGroup>
          <FormGroup label="Günlük çalışma saati">
            <NumInput value={state.params.hoursPerDay} onChange={v => setParam('hoursPerDay', v)} />
          </FormGroup>
          <FormGroup label="Aylık çalışma günü">
            <NumInput value={state.params.daysPerMonth} onChange={v => setParam('daysPerMonth', v)} />
          </FormGroup>
        </div>
      </ParamSection>

      {/* Makineler */}
      <ParamSection title="Makineler" icon="⚙️">

        {/* Varlık envanterinden hızlı ekle */}
        {unaddedInventory.length > 0 && (
          <div className="mb-4 pb-4 border-b border-enba-line">
            <div className="text-[11px] text-enba-dim mb-2">Varlık envanterinden ekle:</div>
            <div className="flex flex-wrap gap-2">
              {unaddedInventory.map(asset => (
                <button key={asset.id} onClick={() => addFromInventory(asset)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-enba-panel-2 border border-enba-line text-[12px] text-enba-muted hover:border-enba-orange/50 hover:text-enba-orange transition-colors">
                  <I.Plus size={11} />
                  {asset.name}
                  <span className="text-[10px] text-enba-dim ml-1">
                    {asset.operation}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 mb-3">
          {state.machines.map((m, idx) => {
            const cap    = machineCapMap.get(m.id);
            const isFromInventory = Boolean(m.assetId);
            return (
              <div key={m.id} className={cx(
                'bg-enba-panel-2 border rounded-xl p-3 flex flex-col gap-2',
                cap?.isBottleneck ? 'border-red-500/50' : 'border-enba-line',
              )}>
                {/* Satır 1: sıra + isim + sil */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5 flex-none">
                    <button onClick={() => moveMachine(idx, -1)} disabled={idx === 0}
                      className="w-5 h-5 rounded text-enba-dim hover:text-enba-text disabled:opacity-30 inline-flex items-center justify-center">
                      <I.Chevron size={10} className="rotate-180" />
                    </button>
                    <span className="text-[10px] text-enba-dim text-center">{idx + 1}</span>
                    <button onClick={() => moveMachine(idx, 1)} disabled={idx === state.machines.length - 1}
                      className="w-5 h-5 rounded text-enba-dim hover:text-enba-text disabled:opacity-30 inline-flex items-center justify-center">
                      <I.Chevron size={10} />
                    </button>
                  </div>
                  <input value={m.name} onChange={e => updateMachine(m.id, { name: e.target.value })}
                    placeholder="Makine adı" className={cx(inputCls, 'flex-1')} />
                  {isFromInventory ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-enba-orange/10 border border-enba-orange/30 text-enba-orange flex-none">
                      envanter
                    </span>
                  ) : addedToInventory.has(m.id) ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-enba-green/10 border border-enba-green/30 text-enba-green flex-none">
                      ✓ eklendi
                    </span>
                  ) : companyId ? (
                    <button
                      onClick={() => addToInventory(m)}
                      disabled={addingToInventory.has(m.id) || !m.name.trim()}
                      title={!m.name.trim() ? 'Önce makine adı girin' : 'Varlık envanterine ekle'}
                      className="text-[10px] px-2 py-0.5 rounded border border-enba-line text-enba-muted hover:border-enba-orange/60 hover:text-enba-orange transition-colors flex-none disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {addingToInventory.has(m.id) ? '…' : '+ Envantere Ekle'}
                    </button>
                  ) : null}
                  <DelBtn onClick={() => removeMachine(m.id)} />
                </div>
                {/* Satır 2: kW + ton/sa (kompakt) */}
                <div className="flex items-center gap-3 pl-7">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-enba-dim w-6">kW</span>
                    <NumInput value={m.kw} onChange={v => updateMachine(m.id, { kw: v })}
                      placeholder="0" className="w-20" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-enba-dim w-12">ton/sa</span>
                    <NumInput value={m.capacityTonPerHour} onChange={v => updateMachine(m.id, { capacityTonPerHour: v })}
                      placeholder="0" step={0.5} className="w-20" />
                  </div>
                </div>
                {/* Kapasite bar */}
                {cap && (
                  <div className="pl-7">
                    <CapacityBar
                      label={`${cap.maxTonsPerMonth.toFixed(0)} ton/ay kapasite`}
                      used={cap.utilization}
                      isBottleneck={cap.isBottleneck}
                      detail={`%${(cap.utilization * 100).toFixed(0)}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={addMachine}
          className="flex items-center gap-2 text-[12.5px] text-enba-muted hover:text-enba-orange transition-colors px-1 py-1">
          <I.Plus size={13} /> Yeni makine ekle
        </button>
      </ParamSection>

      {/* Proses fire + yıkama */}
      <ParamSection title="Üretim Firesi" icon="🔥">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Proses fire oranı %">
              <NumInput value={state.processWasteRate * 100}
                onChange={v => set('processWasteRate', v / 100)}
                step={0.5} min={0} max={50} />
            </FormGroup>
          </div>

          {/* Yıkama hattı toggle */}
          <div className={cx(
            'rounded-xl border p-4 flex items-start gap-3 cursor-pointer transition-all',
            state.washingEnabled
              ? 'bg-enba-panel border-enba-orange/40'
              : 'bg-enba-panel-2 border-enba-line',
          )} onClick={() => set('washingEnabled', !state.washingEnabled)}>
            <div className={cx(
              'w-9 h-5 rounded-full flex-none mt-0.5 relative transition-colors',
              state.washingEnabled ? 'bg-enba-orange' : 'bg-enba-panel border border-enba-line',
            )}>
              <div className={cx(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                state.washingEnabled ? 'left-[18px]' : 'left-0.5',
              )} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-medium text-enba-text">Yıkama Hattı</div>
              <div className="text-[11px] text-enba-dim">Pislikler ve bir miktar malzeme yıkama suyuna karışır</div>
            </div>
          </div>
          {state.washingEnabled && (
            <div className="pl-12">
              <FormGroup label="Yıkama fire oranı %">
                <NumInput value={state.washingWasteRate * 100}
                  onChange={v => set('washingWasteRate', v / 100)}
                  step={0.5} min={0} max={30} className="w-32" />
              </FormGroup>
            </div>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-enba-line text-[12px] text-enba-dim">
          Net üretim çıktısı: <span className="font-semibold text-enba-text">{calc.netOutputTons.toFixed(1)} ton/ay</span>
        </div>
      </ParamSection>

      {/* Personel */}
      <ParamSection title="Personel" icon="👷">
        <DynamicList
          items={state.workers}
          onChange={items => set('workers', items)}
          emptyLabel="Personel grubu eklenmemiş"
          renderRow={(w, onChange, onDel) => (
            <div className="flex flex-col gap-2 pb-3 border-b border-enba-line last:border-0 last:pb-0">
              <div className="grid grid-cols-[1fr_130px_28px] gap-2 items-center">
                <input value={w.name} onChange={e => onChange({ ...w, name: e.target.value })}
                  placeholder="Pozisyon adı" className={inputCls} />
                <select value={w.mode} onChange={e => onChange({ ...w, mode: e.target.value as WorkerGroup['mode'] })} className={inputCls}>
                  <option value="capacity">Kapasite bazlı</option>
                  <option value="fixed">Sabit sayı</option>
                </select>
                <DelBtn onClick={onDel} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {w.mode === 'capacity' ? (
                  <FormGroup label="Kapasite (ton/kişi/ay)">
                    <NumInput value={w.capacityTonPerMonth ?? 0} onChange={v => onChange({ ...w, capacityTonPerMonth: v })} />
                  </FormGroup>
                ) : (
                  <FormGroup label="Kişi sayısı">
                    <NumInput value={w.fixedCount ?? 1} onChange={v => onChange({ ...w, fixedCount: v })} />
                  </FormGroup>
                )}
                <FormGroup label="Aylık maliyet (₺/kişi)">
                  <NumInput value={w.monthlyCost} onChange={v => onChange({ ...w, monthlyCost: v })} />
                </FormGroup>
              </div>
            </div>
          )}
          newItem={() => ({ id: crypto.randomUUID(), name: '', stage: 'production' as const, mode: 'capacity' as const, capacityTonPerMonth: 20, monthlyCost: 50_000 })}
          addLabel="Personel grubu ekle"
        />
      </ParamSection>

      {/* Hammadde (yardımcı) */}
      <ParamSection title="Yardımcı Malzemeler" icon="📦">
        <div className="text-[11px] text-enba-dim mb-3">Torba, boya, katkı maddesi gibi — hammadde için Adım 2'yi kullanın.</div>
        <DynamicList
          items={state.rawMaterials}
          onChange={items => set('rawMaterials', items)}
          emptyLabel="Yardımcı malzeme eklenmemiş"
          renderRow={(rm, onChange, onDel) => (
            <div className="grid grid-cols-[1fr_80px_90px_100px_28px] gap-2 items-center">
              <input value={rm.name} onChange={e => onChange({ ...rm, name: e.target.value })}
                placeholder="Malzeme adı" className={inputCls} />
              <NumInput value={rm.kgPerInputTon} onChange={v => onChange({ ...rm, kgPerInputTon: v })}
                placeholder="kg/ton" />
              <NumInput value={rm.unitCost} onChange={v => onChange({ ...rm, unitCost: v })}
                placeholder="₺/kg" step={0.1} />
              <span className="text-[11px] text-enba-dim text-right">
                = {fmtTL(rm.kgPerInputTon * rm.unitCost, { compact: true })}/ton
              </span>
              <DelBtn onClick={onDel} />
            </div>
          )}
          newItem={() => ({ id: crypto.randomUUID(), name: '', mcode: 'M369', kgPerInputTon: 1, unitCost: 0 })}
          addLabel="Malzeme ekle"
        />
      </ParamSection>
    </div>
  );
}

// ─── Adım 4 — Çıktı & Gelir (eski Adım 5) ───────────────────────────────────

function Step4CiktiUrunler({ state, set, calc }: {
  state: WizardState;
  set: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  calc: ReturnType<typeof calcProductionResults>;
}) {
  const totalShare = state.outputProducts.reduce((s, op) => s + op.shareOfNetTons, 0);
  const shareOk    = Math.abs(totalShare - 1) < 0.01 || state.outputProducts.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader title="Çıktı Ürünleri" sub={`Net üretim: ${calc.netOutputTons.toFixed(1)} ton/ay — ürünler bu miktarı paylaşır`} />

      <ParamSection title="Ürün Listesi" icon="🏭">
        {!shareOk && (
          <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[12px] text-amber-400">
            Payların toplamı {(totalShare * 100).toFixed(1)}% — 100% olmalı
          </div>
        )}
        <DynamicList
          items={state.outputProducts}
          onChange={items => set('outputProducts', items)}
          emptyLabel="Çıktı ürünü eklenmemiş"
          renderRow={(op, onChange, onDel) => (
            <div className="flex flex-col gap-2 pb-3 border-b border-enba-line last:border-0 last:pb-0">
              <div className="grid grid-cols-[1fr_80px_90px_28px] gap-2 items-center">
                <input value={op.name} onChange={e => onChange({ ...op, name: e.target.value })}
                  placeholder="Ürün adı (örn: 1. kalite granül)" className={inputCls} />
                <NumInput value={op.shareOfNetTons * 100}
                  onChange={v => onChange({ ...op, shareOfNetTons: v / 100 })}
                  placeholder="Pay %" step={1} />
                <NumInput value={op.unitPrice} onChange={v => onChange({ ...op, unitPrice: v })}
                  placeholder="Satış ₺/kg" step={0.5} />
                <DelBtn onClick={onDel} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormGroup label="Ambalaj kapasitesi (ton/adet)" hint="örn: big-bag = 1.5">
                  <NumInput value={op.packagingTonPerUnit ?? 0}
                    onChange={v => onChange({ ...op, packagingTonPerUnit: v || undefined })}
                    placeholder="ton/adet" step={0.1} />
                </FormGroup>
                <FormGroup label="Ambalaj birim maliyeti (₺/adet)">
                  <NumInput value={op.packagingCostPerUnit ?? 0}
                    onChange={v => onChange({ ...op, packagingCostPerUnit: v || undefined })}
                    placeholder="₺/adet" />
                </FormGroup>
              </div>
              {op.name && op.unitPrice > 0 && (
                <div className="text-[11px] text-enba-dim">
                  {(calc.netOutputTons * op.shareOfNetTons).toFixed(1)} ton/ay ×
                  {op.unitPrice} ₺/kg →&nbsp;
                  <span className="font-semibold text-enba-green">
                    {fmtTL(calc.netOutputTons * op.shareOfNetTons * 1000 * op.unitPrice, { compact: true })}/ay
                  </span>
                </div>
              )}
            </div>
          )}
          newItem={() => ({ id: crypto.randomUUID(), name: '', mcode: 'M105', shareOfNetTons: 1, unitPrice: 0 })}
          addLabel="Ürün ekle"
        />
      </ParamSection>

      {/* Diğer değişken maliyetler */}
      <ParamSection title="Diğer Değişken Maliyetler" icon="📋">
        <div className="text-[11px] text-enba-dim mb-3">Atık su, analiz, lojistik vb.</div>
        <DynamicList
          items={state.otherVariableCosts}
          onChange={items => set('otherVariableCosts', items)}
          emptyLabel="Ek değişken maliyet yok"
          renderRow={(vc, onChange, onDel) => (
            <div className="grid grid-cols-[1fr_110px_110px_28px] gap-2 items-center">
              <input value={vc.name} onChange={e => onChange({ ...vc, name: e.target.value })}
                placeholder="Maliyet adı" className={inputCls} />
              <NumInput value={vc.tlPerInputTon ?? 0}
                onChange={v => onChange({ ...vc, tlPerInputTon: v || undefined })}
                placeholder="₺/giriş tonu" />
              <NumInput value={vc.monthlyFixed ?? 0}
                onChange={v => onChange({ ...vc, monthlyFixed: v || undefined })}
                placeholder="₺/ay sabit" />
              <DelBtn onClick={onDel} />
            </div>
          )}
          newItem={() => ({ id: crypto.randomUUID(), name: '', mcode: 'M529', tlPerInputTon: 0 })}
          addLabel="Maliyet ekle"
        />
      </ParamSection>
    </div>
  );
}

// ─── Adım 6 — Rampa & Özet (eski Adım 6+7 birleşimi) ────────────────────────

function Step6RampaOzet({ state, set, calc, fixedCostMonth }: {
  state: WizardState;
  set:   <K extends keyof WizardState>(key: K, val: WizardState[K]) => void;
  calc:  ReturnType<typeof calcProductionResults>;
  fixedCostMonth: number;
}) {
  const model        = useMemo(() => stateToProductionModel(state), [state]);
  const baseInputTons = model.monthlyInputTons ?? 0;

  const rampUp     = state.rampUp;
  const setRampUp  = (r: RampUpSchedule) => set('rampUp', r);

  // Hedef ay sayısı değişince month listesini yeniden oluştur
  const handleTargetMonthChange = (newTargetMonth: number) => {
    const existingMap = new Map(rampUp.months.map(m => [m.monthIdx, m.targetTons]));
    const newMonths: RampUpMonth[] = Array.from({ length: newTargetMonth }, (_, i) => ({
      monthIdx:   i,
      targetTons: existingMap.get(i) ?? 0,
    }));
    setRampUp({ ...rampUp, targetMonth: newTargetMonth, months: newMonths });
  };

  // Lineer doldur: eşit artışla hedef kapasiteye böler
  const fillLinear = () => {
    const newMonths: RampUpMonth[] = Array.from({ length: rampUp.targetMonth }, (_, i) => ({
      monthIdx:   i,
      targetTons: Math.round(baseInputTons * (i + 1) / (rampUp.targetMonth + 1)),
    }));
    setRampUp({ ...rampUp, months: newMonths });
  };

  // Kümülatif gelir kaybı tahmini (basit: fark × ortalama gelir/ton giriş)
  const cumulativeLoss = (() => {
    if (!rampUp.enabled || !baseInputTons) return 0;
    let totalMissTons = 0;
    rampUp.months.forEach(m => { totalMissTons += Math.max(0, baseInputTons - m.targetTons); });
    // calcProductionResults'tan net çıktı tonunu al, output ürün fiyatından gelir/ton hesapla
    const calc2 = calcProductionResults(model);
    const netOutputPerInputTon = baseInputTons > 0 ? calc2.netOutputTons / baseInputTons : 0;
    const avgRevPerInputTon = (model.outputProducts ?? []).reduce((s, op) => {
      // unitPrice TL/kg → TL/ton = × 1000; shareOfNetTons = pay (0-1)
      return s + op.shareOfNetTons * netOutputPerInputTon * (op.unitPrice * 1000);
    }, 0);
    return totalMissTons * avgRevPerInputTon;
  })();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold text-enba-text mb-1">Rampa Dönemi</h2>
        <p className="text-[12.5px] text-enba-muted leading-relaxed">
          Projenin tam kapasiteye kademeli ulaşmasını modelleyin.
          Gelir ve değişken maliyetler ramp-up faktörüyle ölçeklenir; sabit giderler etkilenmez.
        </p>
      </div>

      {/* Etkin / Devre Dışı toggle */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-enba-panel border border-enba-line">
        <button
          onClick={() => setRampUp({ ...rampUp, enabled: !rampUp.enabled })}
          className={cx(
            'relative w-10 h-5 rounded-full transition-colors flex-none',
            rampUp.enabled ? 'bg-enba-orange' : 'bg-enba-line',
          )}
        >
          <span className={cx(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
            rampUp.enabled ? 'translate-x-5' : 'translate-x-0.5',
          )} />
        </button>
        <div>
          <div className="text-[13px] font-medium text-enba-text">
            {rampUp.enabled ? 'Rampa Dönemi Etkin' : 'Rampa Dönemi Devre Dışı'}
          </div>
          <div className="text-[11.5px] text-enba-muted">
            {rampUp.enabled
              ? 'İlk aylarda düşük kapasite ile başlanır.'
              : 'Plan boyunca tam kapasitede çalışılır.'}
          </div>
        </div>
      </div>

      {rampUp.enabled && (
        <>
          {/* Hedef kapasite göstergesi */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-enba-orange/8 border border-enba-orange/20">
            <span className="text-[11.5px] text-enba-muted">Üretim modelinden hedef kapasite:</span>
            <span className="text-[13px] font-semibold text-enba-orange">
              {baseInputTons > 0 ? `${baseInputTons.toLocaleString('tr-TR')} ton/ay` : '—'}
            </span>
          </div>

          {/* Kaç ayda tam kapasiteye ulaşılacak */}
          <div className="space-y-2">
            <label className="text-[12.5px] font-medium text-enba-text">
              Tam kapasiteye kaç ayda ulaşılacak?
            </label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 6, 9, 12].map(n => (
                <button
                  key={n}
                  onClick={() => handleTargetMonthChange(n)}
                  className={cx(
                    'px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors',
                    rampUp.targetMonth === n
                      ? 'bg-enba-orange text-white border-enba-orange'
                      : 'bg-enba-panel border-enba-line text-enba-dim hover:text-enba-text hover:border-enba-orange/40',
                  )}
                >
                  {n} ay
                </button>
              ))}
            </div>
          </div>

          {/* Per-month ton inputs */}
          {rampUp.targetMonth > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-enba-text">Aylık hedef tonajlar</span>
                <button
                  onClick={fillLinear}
                  className="text-[11.5px] text-enba-orange hover:underline font-medium"
                >
                  Lineer Doldur
                </button>
              </div>
              <div className="space-y-2">
                {rampUp.months.map((m, idx) => {
                  const pct = baseInputTons > 0 ? (m.targetTons / baseInputTons) * 100 : 0;
                  return (
                    <div key={m.monthIdx} className="flex items-center gap-3">
                      <span className="text-[11.5px] text-enba-muted w-10 flex-none">
                        Ay {idx + 1}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={baseInputTons || undefined}
                        value={m.targetTons || ''}
                        placeholder="0"
                        onChange={e => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          const newMonths = rampUp.months.map((x, xi) =>
                            xi === idx ? { ...x, targetTons: val } : x,
                          );
                          setRampUp({ ...rampUp, months: newMonths });
                        }}
                        className="w-24 px-2.5 py-1.5 rounded-lg border border-enba-line bg-enba-panel text-[12.5px] text-enba-text focus:outline-none focus:border-enba-orange"
                      />
                      <span className="text-[11px] text-enba-muted w-8">ton</span>
                      {/* Progress bar */}
                      <div className="flex-1 h-1.5 rounded-full bg-enba-line overflow-hidden">
                        <div
                          className="h-full rounded-full bg-enba-orange/70 transition-all"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-enba-muted w-10 text-right tabular-nums">
                        %{pct.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
                {/* Full capacity indicator */}
                <div className="flex items-center gap-3 pt-1 border-t border-enba-line">
                  <span className="text-[11.5px] text-enba-muted w-10 flex-none">
                    Ay {rampUp.targetMonth + 1}+
                  </span>
                  <span className="text-[12px] text-enba-green font-medium">
                    Tam Kapasite ({baseInputTons > 0 ? `${baseInputTons} ton` : '—'})
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-enba-green/25 overflow-hidden">
                    <div className="h-full rounded-full bg-enba-green/70" style={{ width: '100%' }} />
                  </div>
                  <span className="text-[11px] text-enba-green w-10 text-right">%100</span>
                </div>
              </div>
            </div>
          )}

          {/* Kümülatif etki */}
          {cumulativeLoss > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-700/30">
              <div className="text-[11.5px] text-amber-700 dark:text-amber-400 font-medium mb-1">
                Tahmini Kümülatif Gelir Kaybı
              </div>
              <div className="text-[18px] font-bold text-amber-700 dark:text-amber-400">
                {fmtTL(cumulativeLoss)}
              </div>
              <div className="text-[11px] text-amber-600/70 dark:text-amber-500/60 mt-0.5">
                Tam kapasiteye göre rampa dönemindeki kümülatif fark
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Özet bölümü ─────────────────────────────────────────────────────────── */}
      <OzetSection state={state} calc={calc} fixedCostMonth={fixedCostMonth} />
    </div>
  );
}

// ─── Özet Bölümü (Step6RampaOzet içinde kullanılır) ──────────────────────────

function OzetSection({ state, calc, fixedCostMonth }: {
  state: WizardState;
  calc: ReturnType<typeof calcProductionResults>;
  fixedCostMonth: number;
}) {
  const scenarios = useMemo(() => {
    const model = stateToProductionModel(state);
    const base  = model.monthlyInputTons;
    const steps = [
      Math.round(base * 0.27),
      Math.round(base * 0.45),
      Math.round(base * 0.64),
      Math.round(base * 0.82),
      base,
    ].filter((v, i, a) => a.indexOf(v) === i && v > 0);
    return calcScenariosTable(model, fixedCostMonth, steps);
  }, [state, fixedCostMonth]);

  const totalCost = calc.totalVariableCost + fixedCostMonth;
  const profit    = calc.totalRevenue - totalCost;

  return (
    <div className="flex flex-col gap-6 pt-6 mt-6 border-t border-enba-line">
      <SectionHeader title="Özet" sub="Aylık tahmini sonuçlar ve senaryo analizi" />

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Toplam Gelir"     value={fmtTL(calc.totalRevenue, { compact: true })}      color="green" />
        <SummaryCard label="Değişken Maliyet" value={fmtTL(calc.totalVariableCost, { compact: true })}  color="red" />
        <SummaryCard label="Sabit Maliyet"    value={fmtTL(fixedCostMonth, { compact: true })}          color="neutral" />
        <SummaryCard label="Net Kâr"          value={fmtTL(profit, { compact: true, sign: true })}      color={profit >= 0 ? 'green' : 'red'} />
      </div>

      <div className="bg-enba-panel border border-enba-line rounded-xl p-4">
        <div className="text-[11px] uppercase tracking-wider text-enba-muted mb-3">Maliyet Dağılımı</div>
        <div className="flex flex-col gap-1.5">
          {[
            { label: 'Hammadde Alışı',   val: calc.inputMaterialCost },
            { label: 'Yardımcı Malzeme', val: calc.totalMaterialCost },
            { label: 'Enerji',           val: calc.totalEnergyCost },
            { label: 'İşçilik',          val: calc.totalLaborCost },
            { label: 'Diğer Değişken',   val: calc.totalOtherCost },
            { label: 'Sabit (Tesis)',     val: fixedCostMonth },
          ].filter(r => r.val > 0).map(row => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="text-[12px] text-enba-muted w-[140px]">{row.label}</span>
              <div className="flex-1 h-2 bg-enba-panel-2 rounded-full overflow-hidden">
                <div className="h-full bg-enba-orange/60 rounded-full"
                  style={{ width: `${Math.min(100, (row.val / (totalCost || 1)) * 100).toFixed(1)}%` }} />
              </div>
              <span className="text-[12px] font-medium text-enba-text w-[90px] text-right">
                {fmtTL(row.val, { compact: true })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-enba-panel border border-enba-line rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-enba-line bg-enba-panel-2/60">
          <div className="text-[11px] uppercase tracking-wider text-enba-muted">Senaryo Analizi</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-enba-line">
                <th className="text-left px-4 py-2 text-enba-dim font-medium">Giriş</th>
                <th className="text-right px-3 py-2 text-enba-dim font-medium">Net Çıktı</th>
                <th className="text-right px-3 py-2 text-enba-dim font-medium">Gelir</th>
                <th className="text-right px-3 py-2 text-enba-dim font-medium">Maliyet</th>
                <th className="text-right px-4 py-2 text-enba-dim font-medium">Kâr/Zarar</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((row, i) => {
                const isBase       = row.inputTons === state.monthlyInputAmount;
                const totalCostRow = row.variableCost + fixedCostMonth;
                return (
                  <tr key={i} className={cx('border-b border-enba-line last:border-0', isBase && 'bg-enba-orange/5')}>
                    <td className="px-4 py-2.5 font-medium">
                      {row.inputTons} ton {isBase && <span className="text-[10px] text-enba-orange ml-1">← baz</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-enba-muted">{row.netOutputTons.toFixed(1)} ton</td>
                    <td className="px-3 py-2.5 text-right">{fmtTL(row.revenue, { compact: true })}</td>
                    <td className="px-3 py-2.5 text-right">{fmtTL(totalCostRow, { compact: true })}</td>
                    <td className={cx('px-4 py-2.5 text-right font-semibold', row.grossProfit >= 0 ? 'text-enba-green' : 'text-enba-red')}>
                      {fmtTL(row.grossProfit, { compact: true, sign: true })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Asistan Paneli ───────────────────────────────────────────────────────────

function AssistantPanel({ insights, calc, model, fixedCostMonth, onGoStep, onOvertimePlan }: {
  insights:        Insight[];
  calc:            ReturnType<typeof calcProductionResults>;
  model:           ProductionModel;
  fixedCostMonth:  number;
  onGoStep:        (s: number) => void;
  onOvertimePlan:  (hoursPerDay: number) => void;
}) {
  const LEVEL_STYLE: Record<InsightLevel, { bg: string; border: string; icon: string }> = {
    error:   { bg: 'bg-red-500/8',    border: 'border-red-500/30',   icon: '⚠' },
    warning: { bg: 'bg-amber-500/8',  border: 'border-amber-500/30', icon: '⚡' },
    info:    { bg: 'bg-enba-blue/8',  border: 'border-enba-blue/30', icon: 'ℹ' },
    success: { bg: 'bg-enba-green/8', border: 'border-enba-green/30',icon: '✓' },
  };

  // ── Fazla mesai hesabı ────────────────────────────────────────────────────────
  const overtimeSuggestion = useMemo(() => {
    const bottlenecks = calc.machineCapacities.filter(mc => mc.isBottleneck && mc.machine.capacityTonPerHour > 0);
    if (bottlenecks.length === 0) return null;

    // Her darboğaz için gereken minimum günlük saat
    const perMachine = bottlenecks.map(mc => {
      const rawHours = mc.requiredTons / (mc.machine.capacityTonPerHour * model.params.daysPerMonth);
      const needed   = Math.ceil(rawHours * 2) / 2; // 0.5 saat adımıyla yukarı yuvarla
      return { mc, needed };
    });
    const suggestedHours = Math.max(...perMachine.map(x => x.needed));
    if (suggestedHours <= model.params.hoursPerDay) return null; // zaten yeterli
    if (suggestedHours > 16) return null; // gerçekçi değil — kapasite artışı gerekir

    // Fazla mesai gerektirmeyen makineler (mevcut yükün %85'inin altında)
    const noOvertimeNeeded = calc.machineCapacities.filter(
      mc => !mc.isBottleneck && mc.utilization < 0.85 && mc.machine.name
    );

    // Fazla mesai sonrası tahmin edilen kullanım (kapasiteler artar)
    const afterOtMap = new Map(
      calc.machineCapacities.map(mc => [
        mc.machine.id,
        mc.machine.capacityTonPerHour > 0
          ? (mc.requiredTons / (mc.machine.capacityTonPerHour * suggestedHours * model.params.daysPerMonth))
          : mc.utilization,
      ])
    );

    return { perMachine, suggestedHours, noOvertimeNeeded, afterOtMap };
  }, [calc.machineCapacities, model.params]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-none px-4 py-3 border-b border-enba-line bg-enba-panel-2/40">
        <div className="text-[11px] uppercase tracking-wider text-enba-muted mb-1">Plan Asistanı</div>
        <div className="flex items-center gap-2 text-[11.5px]">
          {insights.filter(i => i.level === 'error').length > 0 &&
            <span className="text-red-400 font-medium">{insights.filter(i => i.level === 'error').length} hata</span>}
          {insights.filter(i => i.level === 'warning').length > 0 &&
            <span className="text-amber-400 font-medium">{insights.filter(i => i.level === 'warning').length} uyarı</span>}
          {insights.filter(i => i.level === 'success').length > 0 &&
            <span className="text-enba-green font-medium">{insights.filter(i => i.level === 'success').length} tamam</span>}
          {insights.length === 0 && <span className="text-enba-dim">Henüz veri yok</span>}
        </div>
      </div>

      <div className="flex-none grid grid-cols-2 gap-px bg-enba-line border-b border-enba-line">
        {[
          { label: 'Gelir',        val: fmtTL(calc.totalRevenue, { compact: true }),               color: 'text-enba-green' },
          { label: 'Değ.Maliyet', val: fmtTL(calc.totalVariableCost, { compact: true }),           color: 'text-enba-red' },
          { label: 'Sabit',        val: fmtTL(fixedCostMonth, { compact: true }),                  color: 'text-enba-muted' },
          { label: 'Kâr',          val: fmtTL(calc.totalRevenue - calc.totalVariableCost - fixedCostMonth, { compact: true, sign: true }),
            color: calc.totalRevenue - calc.totalVariableCost - fixedCostMonth >= 0 ? 'text-enba-green' : 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-enba-panel px-3 py-2">
            <div className="text-[10px] text-enba-dim">{s.label}</div>
            <div className={cx('text-[12px] font-semibold', s.color)}>{s.val}</div>
          </div>
        ))}
      </div>

      {calc.machineCapacities.length > 0 && (
        <div className="flex-none px-3 py-3 border-b border-enba-line">
          <div className="text-[10px] uppercase tracking-wider text-enba-dim mb-2">Makine Kapasitesi</div>
          <div className="flex flex-col gap-1.5">
            {calc.machineCapacities.map(mc => (
              <CapacityBar key={mc.machine.id}
                label={mc.machine.name || '—'}
                used={mc.utilization}
                isBottleneck={mc.isBottleneck}
                detail={`%${(mc.utilization * 100).toFixed(0)}`}
                compact
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">

        {/* ── Fazla Mesai Önerisi — kaydırılabilir alanda, her zaman görünür ── */}
        {overtimeSuggestion && (
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/8 p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[14px]">🕐</span>
              <span className="text-[12px] font-semibold text-enba-text">Fazla Mesai Önerisi</span>
            </div>

            {/* Darboğaz makineler */}
            <div className="flex flex-col gap-1.5 mb-2.5">
              {overtimeSuggestion.perMachine.map(({ mc, needed }) => {
                const afterPct = Math.round((overtimeSuggestion.afterOtMap.get(mc.machine.id) ?? 0) * 100);
                return (
                  <div key={mc.machine.id} className="text-[11px]">
                    <span className="font-medium text-amber-300">{mc.machine.name}</span>
                    <span className="text-enba-dim"> — şu an </span>
                    <span className="font-semibold text-red-400">%{Math.round(mc.utilization * 100)}</span>
                    <span className="text-enba-dim"> → {needed} saat/gün ile </span>
                    <span className="font-semibold text-enba-green">%{afterPct}</span>
                  </div>
                );
              })}
            </div>

            {/* Fazla mesai gerektirmeyen makineler */}
            {overtimeSuggestion.noOvertimeNeeded.length > 0 && (
              <div className="flex flex-col gap-1 mb-2.5 pl-1 border-l-2 border-enba-line">
                {overtimeSuggestion.noOvertimeNeeded.slice(0, 3).map(mc => (
                  <div key={mc.machine.id} className="text-[10.5px] text-enba-dim">
                    {mc.machine.name} <span className="text-enba-green">%{Math.round(mc.utilization * 100)}</span> — fazla mesai gerekmez
                  </div>
                ))}
              </div>
            )}

            <div className="text-[11px] text-enba-dim mb-3">
              Günde{' '}
              <span className="line-through text-enba-dim">{model.params.hoursPerDay} saat</span>
              {' '}yerine{' '}
              <span className="font-semibold text-enba-text">{overtimeSuggestion.suggestedHours} saat</span>
              {' '}çalışarak tüm darboğazlar çözülür.
            </div>

            <button
              onClick={() => onOvertimePlan(overtimeSuggestion.suggestedHours)}
              className="w-full py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[11.5px] font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
            >
              Fazla Mesai Planla → {overtimeSuggestion.suggestedHours} saat/gün
            </button>
          </div>
        )}

        {insights.length === 0 && !overtimeSuggestion && (
          <div className="text-[12px] text-enba-dim text-center py-8">
            Üretim bilgisi girildikçe öneriler burada görünür.
          </div>
        )}
        {insights.map(ins => {
          const style = LEVEL_STYLE[ins.level];
          return (
            <div key={ins.id} className={cx('rounded-xl border p-3', style.bg, style.border)}>
              <div className="flex items-start gap-2 mb-1">
                <span className="text-[13px] leading-none mt-0.5">{style.icon}</span>
                <div className="text-[12px] font-semibold text-enba-text leading-snug">{ins.title}</div>
              </div>
              <p className="text-[11px] text-enba-dim leading-relaxed pl-5">{ins.body}</p>
              {ins.actions?.filter(a => a.type === 'go_step').map(a => (
                <button key={a.label}
                  onClick={() => onGoStep((a.payload as { step: number }).step)}
                  className="mt-2 ml-5 text-[11px] text-enba-orange hover:underline">
                  {a.label} →
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Yardımcı bileşenler ──────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="text-[16px] font-semibold text-enba-text">{title}</h2>
      <p className="text-[12px] text-enba-dim mt-0.5">{sub}</p>
    </div>
  );
}

function FormGroup({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11.5px] font-medium text-enba-muted">
        {label}{required && <span className="text-enba-orange ml-0.5">*</span>}
        {hint && <span className="text-enba-dim font-normal ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function ParamSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[14px]">{icon}</span>
        <span className="text-[13px] font-semibold text-enba-text">{title}</span>
      </div>
      <div className="bg-enba-panel border border-enba-line rounded-xl p-4">
        {children}
      </div>
    </div>
  );
}

function FlowArrow({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <div className={cx('flex flex-col items-center py-1 gap-1', dim && 'opacity-40')}>
      <div className="w-px h-3 bg-enba-line" />
      <div className="text-[10.5px] text-enba-dim bg-enba-panel-2 px-2 py-0.5 rounded border border-enba-line">{label}</div>
      <div className="w-px h-3 bg-enba-line" />
      <I.Chevron size={10} className="text-enba-dim" />
    </div>
  );
}

function FlowBox({ label, color }: { label: string; color: 'blue' | 'amber' | 'orange' | 'green' }) {
  const colors = {
    blue:   'bg-blue-500/10 border-blue-500/30 text-blue-300',
    amber:  'bg-amber-500/10 border-amber-500/30 text-amber-300',
    orange: 'bg-enba-orange/10 border-enba-orange/30 text-enba-orange',
    green:  'bg-enba-green/10 border-enba-green/30 text-enba-green',
  };
  return (
    <div className={cx('px-4 py-2 rounded-xl border text-[12px] font-medium', colors[color])}>
      {label}
    </div>
  );
}

function CapacityBar({ label, used, detail, isBottleneck, compact }: {
  label: string; used: number; detail?: string; isBottleneck?: boolean; compact?: boolean;
}) {
  const pct      = Math.min(100, used * 100);
  const barColor = isBottleneck ? 'bg-red-500' : used > 0.85 ? 'bg-amber-400' : 'bg-enba-green';
  return (
    <div className={cx('flex items-center gap-2', compact && 'text-[10.5px]')}>
      <span className={cx('text-enba-muted truncate', compact ? 'w-[90px]' : 'w-[140px]', 'text-[11px]')}>{label}</span>
      <div className="flex-1 h-1.5 bg-enba-panel-2 rounded-full overflow-hidden">
        <div className={cx('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>
      {detail && <span className={cx('flex-none text-enba-dim', compact ? 'w-[28px] text-[9px]' : 'w-[80px] text-[11px]')}>{detail}</span>}
      {isBottleneck && <Badge tone="red">⚠</Badge>}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: 'green' | 'red' | 'neutral' }) {
  const colors = { green: 'text-enba-green', red: 'text-red-400', neutral: 'text-enba-muted' };
  return (
    <div className="bg-enba-panel border border-enba-line rounded-xl p-4">
      <div className="text-[11px] text-enba-dim mb-1">{label}</div>
      <div className={cx('text-[16px] font-semibold', colors[color])}>{value}</div>
    </div>
  );
}

function NumInput({ value, onChange, placeholder, step = 1, min, max, className = '' }: {
  value: number; onChange: (v: number) => void; placeholder?: string;
  step?: number; min?: number; max?: number; className?: string;
}) {
  return (
    <input
      type="number"
      value={value || ''}
      onChange={e => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) {
          if (min !== undefined && v < min) return;
          if (max !== undefined && v > max) return;
          onChange(v);
        } else if (e.target.value === '') {
          onChange(0);
        }
      }}
      placeholder={placeholder}
      step={step}
      className={cx(inputCls, className)}
    />
  );
}

function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-7 h-7 rounded text-enba-dim hover:text-red-400 hover:bg-red-500/10 inline-flex items-center justify-center transition-colors flex-none">
      <I.Trash size={12} />
    </button>
  );
}

interface DynamicListProps<T extends { id: string }> {
  items:      T[];
  onChange:   (items: T[]) => void;
  renderRow:  (item: T, onChange: (updated: T) => void, onDelete: () => void) => React.ReactNode;
  newItem:    () => T;
  addLabel:   string;
  emptyLabel: string;
}

function DynamicList<T extends { id: string }>({ items, onChange, renderRow, newItem, addLabel, emptyLabel }: DynamicListProps<T>) {
  const update = (id: string, updated: T) => onChange(items.map(it => it.id === id ? updated : it));
  const remove = (id: string) => onChange(items.filter(it => it.id !== id));
  const add    = () => onChange([...items, newItem()]);
  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && <div className="text-[12px] text-enba-dim py-2">{emptyLabel}</div>}
      {items.map(item => (
        <div key={item.id}>
          {renderRow(item, updated => update(item.id, updated), () => remove(item.id))}
        </div>
      ))}
      <button onClick={add}
        className="flex items-center gap-2 text-[12.5px] text-enba-muted hover:text-enba-orange transition-colors px-1 py-1 mt-1">
        <I.Plus size={13} /> {addLabel}
      </button>
    </div>
  );
}

const inputCls = 'w-full bg-enba-panel-2 border border-enba-line rounded-lg px-2.5 py-2 text-[13px] text-enba-text outline-none focus:border-enba-orange/60 transition-colors';

// ─── Adım 5 — Maliyet Kontrol Defteri ────────────────────────────────────────

interface MCodeRowProps {
  mcode:    string;
  label:    string;
  status:   PlanMCodeStatus;
  monthly:  number;
  editable: boolean;
  priority: 'recommended' | 'optional';
  onUpdate: (e: Partial<PlanMCodeEntry>) => void;
}

function MCodeRow({ mcode, label, status, monthly, editable, onUpdate }: MCodeRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft  ] = useState(monthly);

  useEffect(() => { setDraft(monthly); }, [monthly]);

  const isNA         = status === 'na';
  const isCalculated = status === 'calculated';
  const isEmpty      = status === 'empty' && monthly === 0 && !isNA && !isCalculated;

  return (
    <div className={cx(
      'flex items-center gap-3 px-3 py-2 rounded-lg border transition-all',
      isNA         ? 'opacity-40 border-enba-line bg-enba-panel-2' :
      isEmpty      ? 'border-amber-500/30 bg-amber-500/5' :
      isCalculated ? 'border-enba-green/25 bg-enba-green/5' :
                     'border-enba-line bg-enba-panel',
    )}>
      {/* M-kodu rozeti */}
      <span className={cx(
        'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-none',
        isCalculated ? 'bg-enba-orange/15 text-enba-orange' : 'bg-enba-panel-2 text-enba-dim',
      )}>
        {mcode}
      </span>

      {/* Etiket */}
      <span className={cx(
        'flex-1 text-[12.5px] truncate',
        isNA ? 'text-enba-dim line-through' : isEmpty ? 'text-amber-300' : 'text-enba-text',
      )}>
        {label}
      </span>

      {/* Durum göstergesi */}
      {isCalculated && (
        <span className="text-[11.5px] font-medium text-enba-green flex-none">
          {fmtTL(monthly, { compact: true })}/ay
          <span className="text-[10px] text-enba-dim ml-1">otom.</span>
        </span>
      )}

      {/* Tutar girişi (düzenlenebilir kodlar için) */}
      {editable && !isNA && !isCalculated && (
        editing ? (
          <div className="flex items-center gap-1 flex-none">
            <input
              type="number"
              autoFocus
              value={draft || ''}
              placeholder="0"
              step={1000}
              onChange={e => setDraft(Number(e.target.value) || 0)}
              onBlur={() => { onUpdate({ monthly: draft, status: 'filled' }); setEditing(false); }}
              onKeyDown={e => {
                if (e.key === 'Enter') { onUpdate({ monthly: draft, status: 'filled' }); setEditing(false); }
                if (e.key === 'Escape') setEditing(false);
              }}
              className="w-28 px-2 py-1 rounded border border-enba-orange/60 bg-enba-panel text-[12px] text-enba-text outline-none"
            />
            <span className="text-[11px] text-enba-dim">₺/ay</span>
          </div>
        ) : (
          <button
            onClick={() => { setDraft(monthly); setEditing(true); }}
            className={cx(
              'text-[11.5px] flex-none px-2 py-0.5 rounded border transition-colors',
              monthly > 0
                ? 'border-enba-line text-enba-text hover:border-enba-orange/50'
                : 'border-dashed border-amber-500/40 text-amber-400 hover:border-amber-500/70',
            )}
          >
            {monthly > 0 ? fmtTL(monthly, { compact: true }) + '/ay' : '+ Tutar gir'}
          </button>
        )
      )}

      {isEmpty && (
        <span className="text-[10px] text-amber-400 flex-none">⚠ Girilmemiş</span>
      )}

      {/* N/A toggle */}
      {editable && !isCalculated && (
        <button
          onClick={() => onUpdate({ status: isNA ? 'empty' : 'na', monthly: isNA ? 0 : monthly })}
          title={isNA ? 'Aktife al' : 'Bu işletmede yok (N/A)'}
          className={cx(
            'text-[10px] px-1.5 py-0.5 rounded border transition-colors flex-none',
            isNA
              ? 'bg-enba-panel-2 border-enba-line text-enba-dim hover:border-enba-orange/40 hover:text-enba-orange'
              : 'border-enba-line text-enba-dim hover:border-amber-500/40 hover:text-amber-400',
          )}
        >
          {isNA ? 'N/A ✓' : 'N/A'}
        </button>
      )}
    </div>
  );
}

function Step5MaliyetKontrol({ state, calc, ccExpenses, onUpdateEntries }: {
  state:           WizardState;
  calc:            ReturnType<typeof calcProductionResults>;
  ccExpenses:      import('./dpData').FixedExpense[];
  onUpdateEntries: (entries: PlanMCodeEntry[]) => void;
}) {
  const pnlRows = useMemo(
    () => buildPnLRows(calc, state.mcodeEntries, ccExpenses),
    [calc, state.mcodeEntries, ccExpenses],
  );

  const updateEntry = (mcode: string, patch: Partial<PlanMCodeEntry>) => {
    const existing = state.mcodeEntries.find(e => e.mcode === mcode);
    if (existing) {
      onUpdateEntries(state.mcodeEntries.map(e => e.mcode === mcode ? { ...e, ...patch } : e));
    } else {
      onUpdateEntries([...state.mcodeEntries, {
        mcode, status: 'filled', monthly: 0, ...patch,
      }]);
    }
  };

  // pnlRows'tan gerekli satırları grupla
  const calculatedRows = pnlRows.filter(r => r.type === 'item' && r.status === 'calculated');
  const controlRows = MCODE_CONTROL_LIST.map(ctrl => {
    const row = pnlRows.find(r => r.mcode === ctrl.mcode);
    return row ? { ...row, priority: ctrl.priority } : null;
  }).filter(Boolean) as (typeof pnlRows[0] & { priority: string })[];

  const recommendedRows = controlRows.filter(r => r.priority === 'recommended');
  const optionalRows    = controlRows.filter(r => r.priority === 'optional');

  const missingRequired = recommendedRows.filter(r => r.status === 'empty' && r.monthly === 0).length;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Maliyet Kontrol Defteri"
        sub="Tüm gider kalemleri burada — her satırı kontrol edin, eksik bırakmayın"
      />

      {missingRequired > 0 && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[12px] text-amber-300">
          <span className="flex-none mt-0.5">⚠</span>
          <span><span className="font-semibold">{missingRequired} kalem</span> henüz girilmemiş. Önerilen kalemleri tamamlayın veya N/A olarak işaretleyin.</span>
        </div>
      )}

      {/* Hesaplanan (salt okunur) */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] uppercase tracking-wider text-enba-dim">Otomatik Hesaplanan</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-enba-orange/15 text-enba-orange">wizard'dan</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {calculatedRows.slice(0, 8).map(r => (
            <MCodeRow key={r.mcode} mcode={r.mcode} label={r.label} status={r.status}
              monthly={r.monthly} editable={r.editable} priority="recommended"
              onUpdate={patch => updateEntry(r.mcode, patch)} />
          ))}
        </div>
      </div>

      {/* Önerilen (girilen) */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] uppercase tracking-wider text-enba-dim">Önerilen Kalemler</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">tamamlayın</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {recommendedRows.map(r => (
            <MCodeRow key={r.mcode} mcode={r.mcode} label={r.label} status={r.status}
              monthly={r.monthly} editable={r.editable} priority="recommended"
              onUpdate={patch => updateEntry(r.mcode, patch)} />
          ))}
        </div>
      </div>

      {/* İsteğe bağlı */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] uppercase tracking-wider text-enba-dim">İsteğe Bağlı</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {optionalRows.map(r => (
            <MCodeRow key={r.mcode} mcode={r.mcode} label={r.label} status={r.status}
              monthly={r.monthly} editable={r.editable} priority="optional"
              onUpdate={patch => updateEntry(r.mcode, patch)} />
          ))}
        </div>
      </div>

      {/* Diğer tüm M-kodları (accordion) */}
      <AllMCodesAccordion pnlRows={pnlRows} mcodeEntries={state.mcodeEntries} onUpdate={updateEntry} />
    </div>
  );
}

function AllMCodesAccordion({ pnlRows, mcodeEntries, onUpdate }: {
  pnlRows:      ReturnType<typeof buildPnLRows>;
  mcodeEntries: PlanMCodeEntry[];
  onUpdate:     (mcode: string, patch: Partial<PlanMCodeEntry>) => void;
}) {
  const [open, setOpen] = useState(false);

  // Show only non-control-list, non-calculated items
  const controlMcodes = new Set(MCODE_CONTROL_LIST.map(c => c.mcode));
  const extraRows = pnlRows.filter(r =>
    r.type === 'item' && r.editable && !controlMcodes.has(r.mcode)
  );

  return (
    <div className="border border-enba-line rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-enba-panel-2 hover:bg-enba-panel transition-colors"
      >
        <span className="text-[12.5px] font-medium text-enba-text">Diğer M-Kodları ({extraRows.length} kalem)</span>
        <I.Chevron size={12} className={cx('text-enba-dim transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="p-3 flex flex-col gap-1.5">
          {PNL_SECTIONS.map(section => {
            const sectionRows = extraRows.filter(r => r.sectionId === section.id);
            if (sectionRows.length === 0) return null;
            return (
              <div key={section.id} className="mb-3">
                <div className="text-[10.5px] uppercase tracking-wider text-enba-dim mb-1.5 px-1">{section.label}</div>
                {sectionRows.map(r => {
                  const entry = mcodeEntries.find(e => e.mcode === r.mcode);
                  return (
                    <MCodeRow key={r.mcode} mcode={r.mcode} label={r.label}
                      status={entry?.status ?? 'empty'} monthly={entry?.monthly ?? 0}
                      editable={r.editable} priority="optional"
                      onUpdate={patch => onUpdate(r.mcode, patch)} />
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Canlı P&L Önizleme (Sağ Kolon) ─────────────────────────────────────────

function LivePnLPreview({ calc, mcodeEntries, ccExpenses }: {
  calc:         ReturnType<typeof calcProductionResults>;
  mcodeEntries: PlanMCodeEntry[];
  ccExpenses:   import('./dpData').FixedExpense[];
}) {
  const pnlRows = useMemo(
    () => buildPnLRows(calc, mcodeEntries, ccExpenses),
    [calc, mcodeEntries, ccExpenses],
  );

  // Sadece dolu veya hesaplanan ana kalemleri göster (subtotal satırları dahil)
  const displayRows = pnlRows.filter(r =>
    r.type === 'section' ||
    r.type === 'subtotal' ||
    (r.type === 'item' && (r.monthly !== 0 || r.status === 'empty'))
  );

  // Toplam hesapları (aylık)
  const totalRevenue = pnlRows
    .filter(r => r.type === 'item' && !r.isExpense && r.sectionId === 'hasilat')
    .reduce((s, r) => s + r.monthly, 0);
  const totalVarCost = pnlRows
    .filter(r => r.type === 'item' && r.isExpense && ['malzeme','enerji','personel'].includes(r.sectionId))
    .reduce((s, r) => s + r.monthly, 0);
  const totalFixedCost = pnlRows
    .filter(r => r.type === 'item' && r.isExpense && ['bakim_cevre','genel_gider'].includes(r.sectionId))
    .reduce((s, r) => s + r.monthly, 0);
  const ebitda = totalRevenue - totalVarCost - totalFixedCost;
  const grossMarginPct = totalRevenue > 0 ? ((totalRevenue - totalVarCost) / totalRevenue * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Başlık */}
      <div className="flex-none px-4 py-3 border-b border-enba-line bg-enba-panel-2/40">
        <div className="text-[11px] uppercase tracking-wider text-enba-muted mb-0.5">P&L Önizleme</div>
        <div className="text-[10.5px] text-enba-dim">Aylık ortalama (tahmini)</div>
      </div>

      {/* Özet metrik kartları */}
      <div className="flex-none grid grid-cols-2 gap-px bg-enba-line border-b border-enba-line">
        {[
          { label: 'Hasılat',  val: fmtTL(totalRevenue, { compact: true }),  color: 'text-enba-green' },
          { label: 'Değ.Mal.', val: fmtTL(totalVarCost, { compact: true }),  color: 'text-red-400' },
          { label: 'Sabit',    val: fmtTL(totalFixedCost, { compact: true }), color: 'text-enba-muted' },
          { label: 'EBITDA',   val: fmtTL(ebitda, { compact: true, sign: true }),
            color: ebitda >= 0 ? 'text-enba-orange' : 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-enba-panel px-3 py-2">
            <div className="text-[10px] text-enba-dim">{s.label}</div>
            <div className={cx('text-[12px] font-semibold', s.color)}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Brüt marj göstergesi */}
      {totalRevenue > 0 && (
        <div className="flex-none px-4 py-2 border-b border-enba-line bg-enba-panel-2/20">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-enba-dim">Brüt Marj</span>
            <span className={cx('font-semibold', grossMarginPct >= 20 ? 'text-enba-green' : grossMarginPct >= 10 ? 'text-amber-400' : 'text-red-400')}>
              %{grossMarginPct.toFixed(1)}
            </span>
          </div>
          <div className="h-1.5 bg-enba-panel-2 rounded-full overflow-hidden">
            <div
              className={cx('h-full rounded-full', grossMarginPct >= 20 ? 'bg-enba-green' : grossMarginPct >= 10 ? 'bg-amber-400' : 'bg-red-400')}
              style={{ width: `${Math.min(100, grossMarginPct)}%` }}
            />
          </div>
        </div>
      )}

      {/* P&L satırları */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-0.5">
        {displayRows.map(row => {
          if (row.type === 'section') {
            return (
              <div key={row.id} className="flex items-center gap-1 mt-3 mb-1 first:mt-0">
                <span className="text-[9.5px] uppercase tracking-wider text-enba-dim font-semibold">{row.label}</span>
                <div className="flex-1 h-px bg-enba-line" />
              </div>
            );
          }
          if (row.type === 'subtotal') {
            return (
              <div key={row.id} className="flex items-center justify-between px-2 py-1 bg-enba-panel-2/60 rounded text-[11.5px] font-semibold mt-1">
                <span className="text-enba-text">{row.label}</span>
                <span className={row.monthly >= 0 ? 'text-enba-green' : 'text-red-400'}>
                  {row.monthly !== 0 ? fmtTL(row.monthly, { compact: true }) : '—'}
                </span>
              </div>
            );
          }
          const isEmpty = row.status === 'empty' && row.monthly === 0;
          return (
            <div key={row.id} className={cx(
              'flex items-center justify-between px-2 py-0.5 rounded text-[11.5px]',
              isEmpty ? 'text-amber-400/70' : 'text-enba-muted',
            )}>
              <span className={cx('truncate flex-1', 'pl-' + (row.level * 3))}>
                <span className="text-[9.5px] font-mono text-enba-dim/50 mr-1">{row.mcode}</span>
                {row.label}
              </span>
              <span className={cx('flex-none ml-2 tabular-nums', isEmpty ? 'text-amber-400/50 italic' : row.isExpense ? 'text-red-400/80' : 'text-enba-green/80')}>
                {isEmpty ? 'girilmemiş' : (row.isExpense ? '- ' : '') + fmtTL(row.monthly, { compact: true })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Yayınla Ön Kontrol Modalı ────────────────────────────────────────────────

interface PublishIssue {
  id:      string;
  level:   'error' | 'warning' | 'info';
  mcode?:  string;
  title:   string;
  body:    string;
  resolved: boolean;
}

function buildPublishIssues(
  calc:         ReturnType<typeof calcProductionResults> | null,
  mcodeEntries: PlanMCodeEntry[],
  ccExpenses:   import('./dpData').FixedExpense[],
): PublishIssue[] {
  const issues: PublishIssue[] = [];
  const entryFor = (mcode: string) => mcodeEntries.find(e => e.mcode === mcode);
  const ccHas    = (mcode: string) => ccExpenses.some(e => e.mcode === mcode && e.monthly > 0);
  const isFilled = (mcode: string) => {
    const e = entryFor(mcode);
    return (e && (e.status === 'filled' || e.status === 'na') && e.monthly > 0) || ccHas(mcode);
  };
  const isNA = (mcode: string) => entryFor(mcode)?.status === 'na';

  // Makine varsa amortisman zorunlu
  const hasMachines = calc && calc.machineCapacities.length > 0;
  if (hasMachines && !isFilled('M775') && !isFilled('M789') && !isNA('M789')) {
    issues.push({ id: 'missing_amortisman', level: 'error', mcode: 'M789',
      title: 'Amortisman girilmemiş',
      body: 'Makine yatırımı var ama amortisman kaydı yok. Makine maliyetini doğru yansıtmak için girin.',
      resolved: false });
  }
  // Bakım-onarım
  if (!isFilled('M509') && !isNA('M509')) {
    issues.push({ id: 'missing_bakim', level: 'warning', mcode: 'M509',
      title: 'Bakım-Onarım girilmemiş',
      body: 'Periyodik bakım, yedek parça ve onarım giderleri her tesiste oluşur.',
      resolved: false });
  }
  // Sigorta
  if (!isFilled('M635') && !isNA('M635')) {
    issues.push({ id: 'missing_sigorta', level: 'warning', mcode: 'M635',
      title: 'Sigorta girilmemiş',
      body: 'Tesis ve makine sigortası önerilir. Bu işletmede yoksa N/A olarak işaretleyin.',
      resolved: false });
  }
  // Çevre / atık
  if (!isFilled('M529') && !isNA('M529')) {
    issues.push({ id: 'missing_cevre', level: 'warning', mcode: 'M529',
      title: 'Çevre/Atık/İSG girilmemiş',
      body: 'Geri dönüşüm tesislerinde çevre ve atık yönetim giderleri zorunlu olabilir.',
      resolved: false });
  }
  // Düşük brüt marj
  const totalRev  = calc?.totalRevenue ?? 0;
  const totalVar  = calc?.totalVariableCost ?? 0;
  const grossMargin = totalRev > 0 ? (totalRev - totalVar) / totalRev : 0;
  if (totalRev > 0 && grossMargin < 0.15) {
    issues.push({ id: 'low_gross_margin', level: 'warning',
      title: `Brüt marj %${(grossMargin * 100).toFixed(1)} — düşük`,
      body: 'Sabit giderler karşılanamayabilir. Hammadde maliyeti veya satış fiyatlarını gözden geçirin.',
      resolved: false });
  }
  // Gelir tanımlanmamış
  if (totalRev === 0) {
    issues.push({ id: 'no_revenue', level: 'error',
      title: 'Gelir tanımlanmamış',
      body: 'Çıktı ürünleri ve fiyatları girilmeden plan yayınlanamaz.',
      resolved: false });
  }

  return issues;
}

function PublishModal({ calc, mcodeEntries, ccExpenses, onClose, onConfirm, onUpdateEntries }: {
  calc:            ReturnType<typeof calcProductionResults>;
  mcodeEntries:    PlanMCodeEntry[];
  ccExpenses:      import('./dpData').FixedExpense[];
  onClose:         () => void;
  onConfirm:       () => void;
  onUpdateEntries: (entries: PlanMCodeEntry[]) => void;
}) {
  const [issues, setIssues] = useState<PublishIssue[]>(() =>
    buildPublishIssues(calc, mcodeEntries, ccExpenses)
  );

  const resolveIssue = (id: string) =>
    setIssues(prev => prev.map(i => i.id === id ? { ...i, resolved: true } : i));

  const markNA = (id: string, mcode: string) => {
    const existing = mcodeEntries.find(e => e.mcode === mcode);
    if (existing) {
      onUpdateEntries(mcodeEntries.map(e => e.mcode === mcode ? { ...e, status: 'na' } : e));
    } else {
      onUpdateEntries([...mcodeEntries, { mcode, status: 'na', monthly: 0 }]);
    }
    resolveIssue(id);
  };

  const hasBlocker = issues.some(i => !i.resolved && (i.level === 'error' || i.level === 'warning'));
  const LEVEL_ICON: Record<string, string> = { error: '🔴', warning: '🟡', info: 'ℹ️' };
  const LEVEL_LABEL: Record<string, string> = { error: 'KRİTİK', warning: 'DİKKAT', info: 'BİLGİ' };

  const grouped = {
    error:   issues.filter(i => i.level === 'error'),
    warning: issues.filter(i => i.level === 'warning'),
    info:    issues.filter(i => i.level === 'info'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-enba-panel border border-enba-line rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Başlık */}
        <div className="flex-none px-5 py-4 border-b border-enba-line">
          <div className="text-[15px] font-semibold text-enba-text mb-0.5">Plan Yayınlanmaya Hazır mı?</div>
          <div className="text-[12px] text-enba-dim">Aşağıdaki sorunları çözün veya ilgisiz kalemleri N/A olarak işaretleyin.</div>
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {issues.length === 0 && (
            <div className="text-center py-8 text-[13px] text-enba-green">
              ✅ Tüm kontroller geçti. Plan yayınlanmaya hazır!
            </div>
          )}

          {(['error', 'warning', 'info'] as const).map(level => {
            const group = grouped[level];
            if (group.length === 0) return null;
            return (
              <div key={level}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{LEVEL_ICON[level]}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-enba-muted">{LEVEL_LABEL[level]}</span>
                  <span className="text-[10.5px] text-enba-dim">({group.length})</span>
                </div>
                <div className="flex flex-col gap-2">
                  {group.map(issue => (
                    <div key={issue.id} className={cx(
                      'rounded-xl border p-3 transition-all',
                      issue.resolved ? 'opacity-40 border-enba-line' :
                        level === 'error' ? 'border-red-500/30 bg-red-500/5' :
                        level === 'warning' ? 'border-amber-500/30 bg-amber-500/5' :
                        'border-enba-line bg-enba-panel-2',
                    )}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={cx(
                          'text-[12.5px] font-semibold',
                          issue.resolved ? 'line-through text-enba-dim' :
                            level === 'error' ? 'text-red-400' :
                            level === 'warning' ? 'text-amber-300' : 'text-enba-text',
                        )}>
                          {issue.mcode && <span className="font-mono text-[10.5px] mr-1 opacity-70">{issue.mcode}</span>}
                          {issue.title}
                        </span>
                        {issue.resolved && <span className="text-[11px] text-enba-green flex-none">✓ Çözüldü</span>}
                      </div>
                      {!issue.resolved && (
                        <>
                          <p className="text-[11px] text-enba-dim mb-2">{issue.body}</p>
                          <div className="flex gap-2">
                            {issue.mcode && (
                              <button
                                onClick={() => markNA(issue.id, issue.mcode!)}
                                className="text-[11px] px-2.5 py-1 rounded border border-enba-line text-enba-dim hover:border-amber-500/40 hover:text-amber-400 transition-colors"
                              >
                                Bu planda yok (N/A)
                              </button>
                            )}
                            {!issue.mcode && (
                              <button
                                onClick={() => resolveIssue(issue.id)}
                                className="text-[11px] px-2.5 py-1 rounded border border-enba-line text-enba-dim hover:border-enba-orange/40 hover:text-enba-orange transition-colors"
                              >
                                Biliyorum, devam et
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex-none px-5 py-4 border-t border-enba-line flex items-center justify-between gap-3">
          <Btn variant="ghost" size="md" onClick={onClose}>İptal</Btn>
          <Btn
            variant="primary" size="md"
            onClick={onConfirm}
            disabled={hasBlocker}
          >
            {hasBlocker ? 'Sorunları Çözün' : '✓ Yayınla'}
          </Btn>
        </div>
      </div>
    </div>
  );
}
