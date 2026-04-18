import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../api/i18n';
import {
  ArrowLeft,
  Zap,
  Settings,
  Users,
  Receipt,
  BarChart,
  Smartphone,
  Save,
  FileDown,
  FileUp
} from 'lucide-react';

import InvestmentStep from './steps/InvestmentStep';
import SupplyStep from './steps/SupplyStep';
import OperationsStep from './steps/OperationsStep';
import PersonnelStep from './steps/PersonnelStep';
import ExpensesStep from './steps/ExpensesStep';
import CustomerStep from './steps/CustomerStep';
import ReportStep from './steps/ReportStep';

export const DEFAULT_PLAN_DATA = {
  title: 'Yeni Detaylı Plan',
  startYear: new Date().getFullYear(),
  startMonth: 0,
  currency: 'TRY',
  unit: 'ton',
  investments: [] as any[],
  suppliers: [] as any[],
  customers: [] as any[],
  selectedMachines: [] as any[],
  packaging: { capacity: 1.15, price: 185 },
  monthlyData: Array.from({ length: 12 }, (_, i) => ({
    ay: i, tedarikler: {}, musteriler: {}, giderler: {}, personeller: {}
  })),
  personnelList: [] as any[],
  baseNetSalary: 17002,
  baseSgk: 5000,
  dailyMealCost: 200,
  shifts: 1,
  shiftHours: { 1: 8, 2: 8, 3: 8 },
  workDays: 26,
  electricPrice: 2.5,
  growth: { tonnage: 5, price: 10, fixedCost: 8, variableCost: 10 }
};

interface PlanningWizardProps {
  onCancel: () => void;
  onSave?: (planData: any) => void;
  editData?: any | null;
}

export const PlanningWizard: React.FC<PlanningWizardProps> = ({ onCancel, onSave, editData }) => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(1);
  const [planData, setPlanData] = useState<any>(
    editData ? { ...DEFAULT_PLAN_DATA, ...editData } : { ...DEFAULT_PLAN_DATA }
  );

  useEffect(() => {
    if (editData) {
      setPlanData({ ...DEFAULT_PLAN_DATA, ...editData });
      setActiveStep(1);
    }
  }, [editData]);

  const steps = [
    { id: 1, title: 'Yatırım', icon: Smartphone },
    { id: 2, title: 'Tedarik', icon: FileDown },
    { id: 3, title: 'Operasyon', icon: Settings },
    { id: 4, title: 'Personel', icon: Users },
    { id: 5, title: 'Giderler', icon: Receipt },
    { id: 6, title: 'Müşteri', icon: FileUp },
    { id: 7, title: 'Sonuç', icon: BarChart },
  ];

  const handleSave = () => {
    if (onSave) {
      onSave(planData);
    } else {
      localStorage.setItem('enba_active_plan', JSON.stringify(planData));
      alert('Plan kaydedildi!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-in fade-in duration-700">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30 px-8 py-6 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button
              onClick={onCancel}
              className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-enba-dark active:scale-90"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <Zap size={24} className="text-enba-orange fill-enba-orange" />
                <h2 className="text-2xl font-black text-enba-dark tracking-tighter uppercase italic">
                  Detaylı İş Planı
                </h2>
              </div>
              <input
                type="text"
                value={planData.title}
                onChange={e => setPlanData({ ...planData, title: e.target.value })}
                className="text-[10px] font-black text-gray-400 bg-transparent border-none focus:ring-0 p-0 hover:text-enba-orange transition-colors uppercase tracking-[3px] mt-1"
                placeholder="PROJE BAŞLIĞI GİRİNİZ..."
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={planData.currency}
              onChange={e => setPlanData({ ...planData, currency: e.target.value })}
              className="px-6 py-3 bg-gray-50 border-none rounded-2xl text-xs font-black text-enba-dark focus:ring-2 focus:ring-enba-orange/20 cursor-pointer appearance-none"
            >
              <option value="TRY">₺ TRY</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
            <button
              onClick={handleSave}
              className="flex items-center gap-3 px-8 py-3.5 bg-enba-orange text-white rounded-2xl font-black text-xs uppercase tracking-[2px] hover:brightness-110 shadow-xl shadow-enba-orange/30 transition-all active:scale-95 group"
            >
              <Save size={18} className="group-hover:rotate-12 transition-transform" />
              PLANI KARTA KAYDET
            </button>
          </div>
        </div>
      </header>

      {/* Step Indicators */}
      <div className="bg-white border-b border-gray-50 px-8 py-10">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center relative gap-4">
          <div className="absolute h-1 bg-gray-100 left-8 right-8 top-[24px] z-0 hidden md:block rounded-full"></div>
          <div
            className="absolute h-1 bg-enba-orange left-8 top-[24px] z-0 transition-all duration-700 hidden md:block rounded-full shadow-sm"
            style={{ width: `calc(${((activeStep - 1) / (steps.length - 1)) * 100}% - 64px)` }}
          ></div>

          {steps.map(step => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className="relative z-10 flex flex-col items-center gap-4 group px-4"
            >
              <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 ${
                activeStep === step.id
                  ? 'bg-enba-dark text-white scale-110 shadow-2xl shadow-gray-300 ring-4 ring-enba-orange/10'
                  : activeStep > step.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-gray-300 border-2 border-gray-100 group-hover:border-enba-orange/30 group-hover:text-enba-orange'
              }`}>
                <step.icon size={24} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[2px] transition-colors duration-300 ${
                activeStep === step.id ? 'text-enba-dark' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Wizard Content */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full p-8 pb-40">
        <div className="bg-white rounded-[2.5rem] shadow-card border border-gray-50 min-h-[700px] overflow-hidden">
          {activeStep === 1 && (
            <InvestmentStep
              investments={planData.investments}
              onUpdate={(newInv) => setPlanData({ ...planData, investments: newInv as any })}
              next={() => setActiveStep(2)}
            />
          )}
          {activeStep === 2 && (
            <SupplyStep
              planData={planData}
              onUpdate={(newData) => setPlanData(newData)}
              next={() => setActiveStep(3)}
              back={() => setActiveStep(1)}
            />
          )}
          {activeStep === 3 && (
            <OperationsStep
              planData={planData}
              onUpdate={(newData) => setPlanData(newData)}
              next={() => setActiveStep(4)}
              back={() => setActiveStep(2)}
            />
          )}
          {activeStep === 4 && (
            <PersonnelStep
              planData={planData}
              onUpdate={(newData) => setPlanData(newData)}
              next={() => setActiveStep(5)}
              back={() => setActiveStep(3)}
            />
          )}
          {activeStep === 5 && (
            <ExpensesStep
              planData={planData}
              onUpdate={(newData) => setPlanData(newData)}
              next={() => setActiveStep(6)}
              back={() => setActiveStep(4)}
            />
          )}
          {activeStep === 6 && (
            <CustomerStep
              planData={planData}
              onUpdate={(newData) => setPlanData(newData)}
              next={() => setActiveStep(7)}
              back={() => setActiveStep(5)}
            />
          )}
          {activeStep === 7 && (
            <ReportStep
              planData={planData}
              back={() => setActiveStep(6)}
            />
          )}
        </div>
      </main>

      {/* Sticky Bottom Controls */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-t border-gray-100 p-8 z-40">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <button
            disabled={activeStep === 1}
            onClick={() => setActiveStep(prev => prev - 1)}
            className="px-10 py-4 bg-gray-100 text-gray-400 rounded-3xl font-black text-xs uppercase tracking-[2px] hover:bg-gray-200 hover:text-enba-dark transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90"
          >
            Geri
          </button>

          <div className="flex items-center gap-3">
            {steps.map(s => (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-500 ${activeStep === s.id ? 'w-10 bg-enba-orange shadow-sm' : 'w-2 bg-gray-200'}`}
              ></div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-3 px-8 py-4 bg-enba-orange text-white rounded-3xl font-black text-xs uppercase tracking-[2px] hover:brightness-110 shadow-xl shadow-enba-orange/30 transition-all active:scale-95"
            >
              <Save size={16} /> Kartı Kaydet
            </button>
            <button
              disabled={activeStep === steps.length}
              onClick={() => setActiveStep(prev => prev + 1)}
              className="px-12 py-4 bg-enba-dark text-white rounded-3xl font-black text-xs uppercase tracking-[2px] hover:bg-black shadow-2xl shadow-gray-200 transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-95"
            >
              İlerle →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PlanningWizard;
