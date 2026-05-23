import React, { useState, useMemo, useCallback } from 'react';
import { cx, I, Btn, Badge } from './DPPrimitives';
import {
  DPlan, CostCenter, PlanCategory, PLAN_CATEGORY_LABEL,
  ProductionModel, ProductionParams, MachineEntry, WorkerGroup,
  RawMaterial, OutputProduct, OtherVariableCost,
  calcProductionResults, deriveProjectFromModel, fmtTL,
} from './dpData';
import {
  generateInsights, calcBottleneckAlternatives, calcScenariosTable,
  Insight, InsightLevel,
} from './dpAssistant';

// ─── Sabitler ────────────────────────────────────────────────────────────────

const DEFAULT_PARAMS: ProductionParams = {
  energyUnitCost: 5,
  defaultDF:      0.60,
  hoursPerDay:    10,
  daysPerMonth:   26,
};

const STEP_LABELS = ['Plan Bilgileri', 'Parametreler', 'Proses Akışı', 'Özet & Senaryo'];

// ─── Wizard durumu ────────────────────────────────────────────────────────────

interface WizardState {
  // Adım 1
  title:         string;
  category:      PlanCategory;
  description:   string;
  startYear:     number;
  startMonth:    number;
  horizon:       number;
  openingCash:   number;
  costCenterId:  string;

  // Adım 2
  params:              ProductionParams;
  rawMaterials:        RawMaterial[];
  workers:             WorkerGroup[];
  outputProducts:      OutputProduct[];
  otherVariableCosts:  OtherVariableCost[];

  // Adım 3
  monthlyInputTons:      number;
  inputWasteRate:        number;
  sortingWasteRate:      number;
  processWasteRate:      number;
  fireAfterMachineIdx:   number;
  machines:              MachineEntry[];
}

function initState(plan?: DPlan): WizardState {
  const pm = plan?.productionModel;
  return {
    title:        plan?.title        ?? '',
    category:     plan?.category     ?? '',
    description:  plan?.description  ?? '',
    startYear:    plan?.startYear    ?? new Date().getFullYear(),
    startMonth:   plan?.startMonth   ?? 0,
    horizon:      plan?.horizon      ?? 24,
    openingCash:  plan?.openingCash  ?? 0,
    costCenterId: plan?.projects?.[0]?.costCenterId ?? '',

    params:             pm?.params             ?? { ...DEFAULT_PARAMS },
    rawMaterials:       pm?.rawMaterials        ?? [],
    workers:            pm?.workers             ?? [],
    outputProducts:     pm?.outputProducts      ?? [],
    otherVariableCosts: pm?.otherVariableCosts  ?? [],

    monthlyInputTons:    pm?.monthlyInputTons    ?? 100,
    inputWasteRate:      pm?.inputWasteRate      ?? 0,
    sortingWasteRate:    pm?.sortingWasteRate    ?? 0,
    processWasteRate:    pm?.processWasteRate    ?? 0.10,
    fireAfterMachineIdx: pm?.fireAfterMachineIdx ?? -1,
    machines:            pm?.machines            ?? [],
  };
}

function stateToProductionModel(s: WizardState): ProductionModel {
  return {
    params:             s.params,
    monthlyInputTons:   s.monthlyInputTons,
    inputWasteRate:     s.inputWasteRate,
    sortingWasteRate:   s.sortingWasteRate,
    processWasteRate:   s.processWasteRate,
    fireAfterMachineIdx: s.fireAfterMachineIdx,
    machines:           s.machines,
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
  const [step, setStep]   = useState(0);
  const [state, setState] = useState<WizardState>(() => initState(initialPlan));

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

  const selectedCC = costCenters.find(c => c.id === state.costCenterId);
  const fixedCostMonth = selectedCC?.fixedExpenses.reduce((s, e) => s + e.monthly, 0) ?? 0;

  const savePlan = (andClose: boolean) => {
    const pm = stateToProductionModel(state);
    const derived = deriveProjectFromModel(pm, {
      id:          initialPlan?.projects?.[0]?.id,
      costCenterId: state.costCenterId,
    });
    const plan: DPlan = {
      ...(initialPlan ?? {
        id:             crypto.randomUUID(),
        supabaseId:     undefined,
        actualsThrough: 0,
        suppliers:      [],
        customers:      [],
        cashEvents:     [],
        weeklyHorizon:  0,
      }),
      title:          state.title || 'Adsız Plan',
      baslik:         state.title || 'Adsız Plan',
      status:         initialPlan?.status ?? 'draft',
      category:       state.category,
      description:    state.description,
      year:           state.startYear,
      startYear:      state.startYear,
      startMonth:     state.startMonth,
      horizon:        state.horizon,
      openingCash:    state.openingCash,
      productionModel: pm,
      projects:       [derived],
    };
    if (andClose) onDone(plan);
    else          onSave(plan);
  };

  const showAssistant = step >= 2;

  return (
    <div className="h-full flex flex-col bg-enba-bg overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-none bg-enba-panel border-b border-enba-line h-[60px] flex items-center px-5 gap-4">
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-lg text-enba-muted hover:text-enba-text hover:bg-enba-panel-2 inline-flex items-center justify-center"
        >
          <I.Chevron size={14} className="rotate-90" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-enba-text">
            {initialPlan ? 'Planı Düzenle' : 'Yeni İş Planı'}
          </div>
          <div className="text-[10.5px] text-enba-dim">{state.title || 'Başlık girilmemiş'}</div>
        </div>
        {/* Step indicators */}
        <div className="flex items-center gap-1">
          {STEP_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => i < step + 1 && setStep(i)}
              className={cx(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all',
                i === step
                  ? 'bg-enba-orange text-white'
                  : i < step
                  ? 'text-enba-orange hover:bg-enba-orange/10 cursor-pointer'
                  : 'text-enba-dim cursor-default',
              )}
            >
              <span className={cx(
                'w-4 h-4 rounded-full text-[9px] font-bold inline-flex items-center justify-center',
                i === step ? 'bg-white/20' : i < step ? 'bg-enba-orange/20' : 'bg-enba-panel-2',
              )}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden md:block">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Body: form + asistan ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Form alanı */}
        <div className={cx('flex-1 overflow-y-auto', showAssistant ? 'md:w-0' : '')}>
          <div className="p-6 max-w-[760px]">
            {step === 0 && <Step1PlanInfo state={state} set={set} costCenters={costCenters} />}
            {step === 1 && <Step2Parameters state={state} set={set} />}
            {step === 2 && <Step3Process state={state} set={set} calc={calc} />}
            {step === 3 && <Step4Summary state={state} calc={calc} fixedCostMonth={fixedCostMonth} />}
          </div>
        </div>

        {/* Asistan paneli */}
        {showAssistant && (
          <div className="hidden md:flex w-[300px] flex-none border-l border-enba-line flex-col overflow-hidden">
            <AssistantPanel
              insights={insights}
              calc={calc}
              model={model}
              fixedCostMonth={fixedCostMonth}
              onGoStep={setStep}
            />
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex-none bg-enba-panel border-t border-enba-line px-5 h-[56px] flex items-center justify-between gap-3">
        <Btn variant="ghost" size="md" onClick={() => step > 0 ? setStep(step - 1) : onCancel()}>
          {step === 0 ? 'İptal' : 'Geri'}
        </Btn>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <Btn variant="outline" size="md" onClick={() => savePlan(false)}>
              Kaydet
            </Btn>
          )}
          {step < 3 ? (
            <Btn
              variant="primary" size="md"
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && !state.title.trim()}
            >
              Devam
            </Btn>
          ) : (
            <Btn variant="primary" size="md" onClick={() => savePlan(true)}>
              Planı Oluştur
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Adım 1 — Plan Bilgileri ─────────────────────────────────────────────────

function Step1PlanInfo({ state, set, costCenters }: {
  state: WizardState;
  set: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  costCenters: CostCenter[];
}) {
  const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Plan Bilgileri" sub="Temel tanım ve zaman aralığı" />

      <FormGroup label="Plan Adı" required>
        <input
          autoFocus
          value={state.title}
          onChange={e => set('title', e.target.value)}
          placeholder="örn: Granül Üretimi Tesisi 2026"
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
        <FormGroup label="Süre">
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

// ─── Adım 2 — Parametreler ───────────────────────────────────────────────────

function Step2Parameters({ state, set }: {
  state: WizardState;
  set: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
}) {
  const setParam = (k: keyof ProductionParams, v: number) =>
    set('params', { ...state.params, [k]: v });

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader title="Parametreler" sub="Tüm birim değerler burada tanımlanır — model bu değerleri kullanır" />

      {/* Enerji */}
      <ParamSection title="Enerji" icon="⚡">
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Elektrik birim fiyatı" hint="TL/kWh">
            <NumInput value={state.params.energyUnitCost} onChange={v => setParam('energyUnitCost', v)} step={0.1} />
          </FormGroup>
          <FormGroup label="Varsayılan DF (Talep Faktörü)" hint="0.60 = ihtiyatlı tahmin">
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

      {/* Hammadde */}
      <ParamSection title="Hammadde / Malzeme" icon="📦">
        <DynamicList
          items={state.rawMaterials}
          onChange={items => set('rawMaterials', items)}
          emptyLabel="Hammadde eklenmemiş"
          renderRow={(rm, onChange, onDel) => (
            <div className="grid grid-cols-[1fr_80px_90px_100px_28px] gap-2 items-center">
              <input value={rm.name} onChange={e => onChange({ ...rm, name: e.target.value })}
                placeholder="Malzeme adı" className={inputCls} />
              <NumInput value={rm.kgPerInputTon} onChange={v => onChange({ ...rm, kgPerInputTon: v })}
                placeholder="kg/ton" />
              <NumInput value={rm.unitCost} onChange={v => onChange({ ...rm, unitCost: v })}
                placeholder="₺/kg" step={0.1} />
              <span className="text-[11px] text-enba-dim text-right">
                = {fmtTL(rm.kgPerInputTon * rm.unitCost * (1/1000) * 1000, { compact: true })}/ton
              </span>
              <DelBtn onClick={onDel} />
            </div>
          )}
          newItem={() => ({ id: crypto.randomUUID(), name: '', mcode: 'M369', kgPerInputTon: 1000, unitCost: 0 })}
          addLabel="Hammadde ekle"
        />
      </ParamSection>

      {/* Personel */}
      <ParamSection title="Personel" icon="👷">
        <DynamicList
          items={state.workers}
          onChange={items => set('workers', items)}
          emptyLabel="Personel grubu eklenmemiş"
          renderRow={(w, onChange, onDel) => (
            <div className="flex flex-col gap-2 pb-3 border-b border-enba-line last:border-0 last:pb-0">
              <div className="grid grid-cols-[1fr_120px_28px] gap-2 items-center">
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
                  <FormGroup label="Kişi sayısı (sabit)">
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

      {/* Çıktı ürünleri */}
      <ParamSection title="Çıktı Ürünleri" icon="🏭">
        <div className="text-[11px] text-enba-dim mb-3">Paylar toplamı 1 (100%) olmalı. Kalan otomatik hesaplanır.</div>
        <DynamicList
          items={state.outputProducts}
          onChange={items => set('outputProducts', items)}
          emptyLabel="Çıktı ürünü eklenmemiş"
          renderRow={(op, onChange, onDel) => (
            <div className="flex flex-col gap-2 pb-3 border-b border-enba-line last:border-0 last:pb-0">
              <div className="grid grid-cols-[1fr_90px_90px_28px] gap-2 items-center">
                <input value={op.name} onChange={e => onChange({ ...op, name: e.target.value })}
                  placeholder="Ürün adı (örn: 1. kalite granül)" className={inputCls} />
                <NumInput value={op.shareOfNetTons * 100} onChange={v => onChange({ ...op, shareOfNetTons: v / 100 })}
                  placeholder="Pay %" step={1} />
                <NumInput value={op.unitPrice} onChange={v => onChange({ ...op, unitPrice: v })}
                  placeholder="₺/kg" step={0.5} />
                <DelBtn onClick={onDel} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormGroup label="Ambalaj kapasitesi (ton/adet)">
                  <NumInput value={op.packagingTonPerUnit ?? 0} onChange={v => onChange({ ...op, packagingTonPerUnit: v || undefined })}
                    placeholder="ör: 1.5" step={0.1} />
                </FormGroup>
                <FormGroup label="Ambalaj birim fiyatı (₺/adet)">
                  <NumInput value={op.packagingCostPerUnit ?? 0} onChange={v => onChange({ ...op, packagingCostPerUnit: v || undefined })}
                    placeholder="ör: 350" />
                </FormGroup>
              </div>
            </div>
          )}
          newItem={() => ({ id: crypto.randomUUID(), name: '', mcode: 'M105', shareOfNetTons: 0.85, unitPrice: 0 })}
          addLabel="Ürün ekle"
        />
      </ParamSection>

      {/* Diğer değişken maliyetler */}
      <ParamSection title="Diğer Değişken Maliyetler" icon="📋">
        <DynamicList
          items={state.otherVariableCosts}
          onChange={items => set('otherVariableCosts', items)}
          emptyLabel="Ek değişken maliyet yok"
          renderRow={(vc, onChange, onDel) => (
            <div className="grid grid-cols-[1fr_110px_110px_28px] gap-2 items-center">
              <input value={vc.name} onChange={e => onChange({ ...vc, name: e.target.value })}
                placeholder="Maliyet adı (örn: Atık su)" className={inputCls} />
              <NumInput value={vc.tlPerInputTon ?? 0} onChange={v => onChange({ ...vc, tlPerInputTon: v || undefined })}
                placeholder="₺/giriş tonu" />
              <NumInput value={vc.monthlyFixed ?? 0} onChange={v => onChange({ ...vc, monthlyFixed: v || undefined })}
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

// ─── Adım 3 — Proses Akışı ───────────────────────────────────────────────────

function Step3Process({ state, set, calc }: {
  state: WizardState;
  set: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  calc: ReturnType<typeof calcProductionResults>;
}) {
  const machineCapMap = new Map(calc.machineCapacities.map(mc => [mc.machine.id, mc]));

  const addMachine = () => {
    const newM: MachineEntry = {
      id: crypto.randomUUID(),
      name: '',
      kw: 0,
      capacityTonPerHour: 0,
      usesNetOutput: false,
      order: state.machines.length,
    };
    set('machines', [...state.machines, newM]);
  };

  const updateMachine = (id: string, patch: Partial<MachineEntry>) => {
    set('machines', state.machines.map(m => m.id === id ? { ...m, ...patch } : m));
  };

  const removeMachine = (id: string) => {
    set('machines', state.machines.filter(m => m.id !== id).map((m, i) => ({ ...m, order: i })));
  };

  const moveMachine = (idx: number, dir: -1 | 1) => {
    const arr  = [...state.machines];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    set('machines', arr.map((m, i) => ({ ...m, order: i })));
  };

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader title="Proses Akışı" sub="4 aşamalı geri dönüşüm süreci — her aşamada fire ve kapasite tanımlanır" />

      {/* Aşama 1: Mal Girişi */}
      <ProcessStage num={1} title="Mal Girişi" color="blue">
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Aylık giriş tonu" hint="Satın alınan hammadde">
            <NumInput value={state.monthlyInputTons} onChange={v => set('monthlyInputTons', v)} step={5} />
          </FormGroup>
          <FormGroup label="Giriş fire oranı %" hint="Taşıma, nem, yabancı madde">
            <NumInput value={state.inputWasteRate * 100} onChange={v => set('inputWasteRate', v / 100)} step={0.5} min={0} max={50} />
          </FormGroup>
        </div>
        <FlowArrow
          label={`Kullanılabilir: ${calc.afterInputWaste.toFixed(1)} ton/ay`}
          dim={state.inputWasteRate === 0}
        />
      </ProcessStage>

      {/* Aşama 2: Ayrıştırma */}
      <ProcessStage num={2} title="Ayrıştırma" color="amber">
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Ayrıştırma fire oranı %" hint="Kirli, karışık, ayıklanamayan">
            <NumInput value={state.sortingWasteRate * 100} onChange={v => set('sortingWasteRate', v / 100)} step={0.5} min={0} max={50} />
          </FormGroup>
          <div className="flex items-end pb-1">
            <div className="text-[12px] text-enba-muted">
              Üretime giren: <span className="font-semibold text-enba-text">{calc.afterSortingWaste.toFixed(1)} ton/ay</span>
            </div>
          </div>
        </div>

        {/* İşçi kapasitesi özeti */}
        {calc.workerCapacities.length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {calc.workerCapacities.map(wc => (
              <CapacityBar
                key={wc.worker.id}
                label={`${wc.worker.name} (${wc.count} kişi)`}
                used={wc.utilization}
                detail={`${wc.maxTonsPerMonth.toFixed(0)} ton/ay kapasite`}
              />
            ))}
          </div>
        )}
        <FlowArrow label={`Makine girişi: ${calc.afterSortingWaste.toFixed(1)} ton/ay`} />
      </ProcessStage>

      {/* Aşama 3: Üretim (Makineler) */}
      <ProcessStage num={3} title="Üretim — Makine Sırası" color="orange">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <FormGroup label="Proses fire oranı %" hint="Tüm üretim sonrası toplam fire">
            <NumInput value={state.processWasteRate * 100} onChange={v => set('processWasteRate', v / 100)} step={0.5} min={0} max={50} />
          </FormGroup>
          <div className="flex items-end pb-1">
            <div className="text-[12px] text-enba-muted">
              Net çıktı: <span className="font-semibold text-enba-text">{calc.netOutputTons.toFixed(1)} ton/ay</span>
            </div>
          </div>
        </div>

        {/* Fire noktası seçici */}
        {state.machines.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-[12px] text-enba-muted">
            <I.Chevron size={12} className="-rotate-90 text-amber-400" />
            <span>Fire hangi makineden sonra uygulanır?</span>
            <select
              value={state.fireAfterMachineIdx}
              onChange={e => set('fireAfterMachineIdx', Number(e.target.value))}
              className="ml-1 bg-enba-panel-2 border border-enba-line rounded px-2 py-1 text-[12px] text-enba-text outline-none"
            >
              <option value={-1}>Son makine sonrası (varsayılan)</option>
              {state.machines.map((m, i) => (
                <option key={m.id} value={i}>{i + 1}. {m.name || `Makine ${i + 1}`} sonrası</option>
              ))}
            </select>
          </div>
        )}

        {/* Makine listesi */}
        <div className="flex flex-col gap-2">
          {state.machines.map((m, idx) => {
            const cap = machineCapMap.get(m.id);
            return (
              <div key={m.id} className={cx(
                'bg-enba-panel-2 border rounded-xl p-3 flex flex-col gap-3',
                cap?.isBottleneck ? 'border-red-500/50' : 'border-enba-line',
              )}>
                <div className="flex items-center gap-2">
                  {/* Sıra numarası + ok butonları */}
                  <div className="flex flex-col gap-0.5">
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

                  {/* Form alanları */}
                  <input value={m.name} onChange={e => updateMachine(m.id, { name: e.target.value })}
                    placeholder="Makine adı" className={cx(inputCls, 'flex-1')} />
                  <NumInput value={m.kw} onChange={v => updateMachine(m.id, { kw: v })}
                    placeholder="kW" className="w-[70px]" />
                  <NumInput value={m.capacityTonPerHour} onChange={v => updateMachine(m.id, { capacityTonPerHour: v })}
                    placeholder="ton/sa" step={0.1} className="w-[80px]" />
                  <NumInput
                    value={m.df !== undefined ? m.df : state.params.defaultDF}
                    onChange={v => updateMachine(m.id, { df: v })}
                    placeholder={`DF ${state.params.defaultDF}`}
                    step={0.05} min={0.1} max={1}
                    className="w-[70px]"
                  />
                  <DelBtn onClick={() => removeMachine(m.id)} />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-[11.5px] text-enba-muted cursor-pointer">
                    <input type="checkbox" checked={m.usesNetOutput}
                      onChange={e => updateMachine(m.id, { usesNetOutput: e.target.checked })}
                      className="accent-enba-orange" />
                    Fire sonrası net ton işler
                  </label>

                  {cap && (
                    <CapacityBar
                      label={`${cap.maxTonsPerMonth.toFixed(0)} ton/ay kapasite`}
                      used={cap.utilization}
                      isBottleneck={cap.isBottleneck}
                      detail={cap.isBottleneck
                        ? `⚠ ${(cap.requiredTons - cap.maxTonsPerMonth).toFixed(0)} ton eksik`
                        : `%${(cap.utilization * 100).toFixed(0)} kullanım`}
                    />
                  )}
                </div>
              </div>
            );
          })}

          <button
            onClick={addMachine}
            className="flex items-center gap-2 text-[12.5px] text-enba-muted hover:text-enba-orange transition-colors px-1 py-2"
          >
            <I.Plus size={14} /> Makine ekle
          </button>
        </div>

        <FlowArrow label={`Net çıktı: ${calc.netOutputTons.toFixed(1)} ton/ay`} />
      </ProcessStage>

      {/* Aşama 4: Satış */}
      <ProcessStage num={4} title="Satış" color="green">
        {calc.productOutputs.length === 0 ? (
          <p className="text-[12px] text-enba-dim">Parametreler adımında çıktı ürünleri tanımlayın.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {calc.productOutputs.map(po => (
              <div key={po.product.id} className="flex items-center justify-between bg-enba-panel border border-enba-line rounded-lg px-3 py-2">
                <div>
                  <div className="text-[13px] font-medium text-enba-text">{po.product.name}</div>
                  <div className="text-[11px] text-enba-dim">{po.tons.toFixed(1)} ton/ay × {po.product.unitPrice} ₺/kg</div>
                </div>
                <div className="text-[13px] font-semibold text-enba-green">{fmtTL(po.revenue, { compact: true })}</div>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-enba-line">
              <span className="text-[12px] text-enba-muted">Toplam Gelir</span>
              <span className="text-[14px] font-semibold text-enba-green">{fmtTL(calc.totalRevenue, { compact: true })}/ay</span>
            </div>
          </div>
        )}
      </ProcessStage>
    </div>
  );
}

// ─── Adım 4 — Özet & Senaryo ─────────────────────────────────────────────────

function Step4Summary({ state, calc, fixedCostMonth }: {
  state: WizardState;
  calc: ReturnType<typeof calcProductionResults>;
  fixedCostMonth: number;
}) {
  const scenarios = useMemo(() => {
    const model = stateToProductionModel(state);
    const base  = state.monthlyInputTons;
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
    <div className="flex flex-col gap-6">
      <SectionHeader title="Özet & Senaryo" sub="Otomatik hesaplanan aylık tablo" />

      {/* Ana özet */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Toplam Gelir"     value={fmtTL(calc.totalRevenue, { compact: true })}    color="green" />
        <SummaryCard label="Değişken Maliyet" value={fmtTL(calc.totalVariableCost, { compact: true })} color="red" />
        <SummaryCard label="Sabit Maliyet"    value={fmtTL(fixedCostMonth, { compact: true })}        color="neutral" />
        <SummaryCard label="Net Kâr"          value={fmtTL(profit, { compact: true, sign: true })}    color={profit >= 0 ? 'green' : 'red'} />
      </div>

      {/* Maliyet dağılımı */}
      <div className="bg-enba-panel border border-enba-line rounded-xl p-4">
        <div className="text-[11px] uppercase tracking-wider text-enba-muted mb-3">Maliyet Dağılımı</div>
        <div className="flex flex-col gap-1.5">
          {[
            { label: 'Hammadde',        val: calc.totalMaterialCost },
            { label: 'Enerji',          val: calc.totalEnergyCost },
            { label: 'İşçilik',         val: calc.totalLaborCost },
            { label: 'Diğer Değişken',  val: calc.totalOtherCost },
            { label: 'Sabit (Tesis)',    val: fixedCostMonth },
          ].filter(r => r.val > 0).map(row => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="text-[12px] text-enba-muted w-[120px]">{row.label}</span>
              <div className="flex-1 h-2 bg-enba-panel-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-enba-orange/60 rounded-full"
                  style={{ width: `${Math.min(100, (row.val / (totalCost || 1)) * 100).toFixed(1)}%` }}
                />
              </div>
              <span className="text-[12px] font-medium text-enba-text w-[90px] text-right">
                {fmtTL(row.val, { compact: true })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Senaryo tablosu */}
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
                const isBase    = row.inputTons === state.monthlyInputTons;
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

function AssistantPanel({ insights, calc, model, fixedCostMonth, onGoStep }: {
  insights:       Insight[];
  calc:           ReturnType<typeof calcProductionResults>;
  model:          ProductionModel;
  fixedCostMonth: number;
  onGoStep:       (s: number) => void;
}) {
  const LEVEL_STYLE: Record<InsightLevel, { bg: string; border: string; icon: string; dot: string }> = {
    error:   { bg: 'bg-red-500/8',    border: 'border-red-500/30',   icon: '⚠',  dot: 'bg-red-500' },
    warning: { bg: 'bg-amber-500/8',  border: 'border-amber-500/30', icon: '⚡', dot: 'bg-amber-400' },
    info:    { bg: 'bg-enba-blue/8',  border: 'border-enba-blue/30', icon: 'ℹ',  dot: 'bg-enba-blue' },
    success: { bg: 'bg-enba-green/8', border: 'border-enba-green/30',icon: '✓',  dot: 'bg-enba-green' },
  };

  const errors   = insights.filter(i => i.level === 'error');
  const warnings = insights.filter(i => i.level === 'warning');
  const infos    = insights.filter(i => i.level === 'info');
  const successes = insights.filter(i => i.level === 'success');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel başlık */}
      <div className="flex-none px-4 py-3 border-b border-enba-line bg-enba-panel-2/40">
        <div className="text-[11px] uppercase tracking-wider text-enba-muted mb-1">Plan Asistanı</div>
        <div className="flex items-center gap-2 text-[11.5px]">
          {errors.length   > 0 && <span className="text-red-400 font-medium">{errors.length} hata</span>}
          {warnings.length > 0 && <span className="text-amber-400 font-medium">{warnings.length} uyarı</span>}
          {successes.length > 0 && <span className="text-enba-green font-medium">{successes.length} tamam</span>}
          {insights.length === 0 && <span className="text-enba-dim">Henüz veri yok</span>}
        </div>
      </div>

      {/* Özet istatistik */}
      <div className="flex-none grid grid-cols-2 gap-px bg-enba-line border-b border-enba-line">
        {[
          { label: 'Gelir', val: fmtTL(calc.totalRevenue, { compact: true }), color: 'text-enba-green' },
          { label: 'Değ.Maliyet', val: fmtTL(calc.totalVariableCost, { compact: true }), color: 'text-enba-red' },
          { label: 'Sabit', val: fmtTL(fixedCostMonth, { compact: true }), color: 'text-enba-muted' },
          { label: 'Kâr', val: fmtTL(calc.totalRevenue - calc.totalVariableCost - fixedCostMonth, { compact: true, sign: true }),
            color: calc.totalRevenue - calc.totalVariableCost - fixedCostMonth >= 0 ? 'text-enba-green' : 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-enba-panel px-3 py-2">
            <div className="text-[10px] text-enba-dim">{s.label}</div>
            <div className={cx('text-[12px] font-semibold', s.color)}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Kapasite çubukları */}
      {calc.machineCapacities.length > 0 && (
        <div className="flex-none px-3 py-3 border-b border-enba-line">
          <div className="text-[10px] uppercase tracking-wider text-enba-dim mb-2">Makine Kapasitesi</div>
          <div className="flex flex-col gap-1.5">
            {calc.machineCapacities.map(mc => (
              <CapacityBar
                key={mc.machine.id}
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

      {/* Insight listesi */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {insights.length === 0 && (
          <div className="text-[12px] text-enba-dim text-center py-8">
            Proses bilgisi girildikçe öneriler burada görünür.
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

              {/* Darboğaz karşılaştırması */}
              {ins.category === 'bottleneck' && ins.data && (
                <div className="mt-2 pl-5 flex flex-col gap-1">
                  {ins.actions?.map(a => (
                    <button
                      key={a.label}
                      onClick={() => a.type === 'go_step' && onGoStep((a.payload as { step: number }).step)}
                      className="text-left text-[11px] px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-enba-text transition-colors border border-white/10"
                    >
                      {a.label}
                    </button>
                  ))}
                  {ins.data.cheaper && (
                    <div className="text-[10.5px] text-enba-orange mt-1">→ {ins.data.cheaper}</div>
                  )}
                </div>
              )}

              {ins.actions?.filter(a => a.type === 'go_step').map(a => (
                <button
                  key={a.label}
                  onClick={() => onGoStep((a.payload as { step: number }).step)}
                  className="mt-2 ml-5 text-[11px] text-enba-orange hover:underline"
                >
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

function ProcessStage({ num, title, color, children }: {
  num: number; title: string; color: 'blue' | 'amber' | 'orange' | 'green'; children: React.ReactNode;
}) {
  const colors = {
    blue:   'bg-blue-500/10 border-blue-500/30 text-blue-400',
    amber:  'bg-amber-500/10 border-amber-500/30 text-amber-400',
    orange: 'bg-enba-orange/10 border-enba-orange/30 text-enba-orange',
    green:  'bg-enba-green/10 border-enba-green/30 text-enba-green',
  };
  return (
    <div className="bg-enba-panel border border-enba-line rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className={cx('w-6 h-6 rounded-full border text-[11px] font-bold inline-flex items-center justify-center', colors[color])}>
          {num}
        </span>
        <span className="text-[13px] font-semibold text-enba-text">{title}</span>
      </div>
      {children}
    </div>
  );
}

function FlowArrow({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <div className={cx('flex flex-col items-center py-2 gap-1', dim && 'opacity-40')}>
      <div className="w-px h-3 bg-enba-line" />
      <div className="text-[10.5px] text-enba-dim bg-enba-panel-2 px-2 py-0.5 rounded border border-enba-line">{label}</div>
      <div className="w-px h-3 bg-enba-line" />
      <I.Chevron size={10} className="text-enba-dim" />
    </div>
  );
}

function CapacityBar({ label, used, detail, isBottleneck, compact }: {
  label: string; used: number; detail?: string; isBottleneck?: boolean; compact?: boolean;
}) {
  const pct = Math.min(100, used * 100);
  const barColor = isBottleneck
    ? 'bg-red-500'
    : used > 0.85 ? 'bg-amber-400'
    : 'bg-enba-green';
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
    <button
      type="button"
      onClick={onClick}
      className="w-7 h-7 rounded text-enba-dim hover:text-red-400 hover:bg-red-500/10 inline-flex items-center justify-center transition-colors flex-none"
    >
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

function DynamicList<T extends { id: string }>({
  items, onChange, renderRow, newItem, addLabel, emptyLabel,
}: DynamicListProps<T>) {
  const update = (id: string, updated: T) => onChange(items.map(it => it.id === id ? updated : it));
  const remove = (id: string) => onChange(items.filter(it => it.id !== id));
  const add    = () => onChange([...items, newItem()]);

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && (
        <div className="text-[12px] text-enba-dim py-2">{emptyLabel}</div>
      )}
      {items.map(item => (
        <div key={item.id}>
          {renderRow(item, updated => update(item.id, updated), () => remove(item.id))}
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-2 text-[12.5px] text-enba-muted hover:text-enba-orange transition-colors px-1 py-1 mt-1"
      >
        <I.Plus size={13} /> {addLabel}
      </button>
    </div>
  );
}

const inputCls = 'w-full bg-enba-panel-2 border border-enba-line rounded-lg px-2.5 py-2 text-[13px] text-enba-text outline-none focus:border-enba-orange/60 transition-colors';
