// Main app shell: sidebar + header + section router
const { useState: _useS_app } = React;

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      className="relative w-[58px] h-9 rounded-lg border border-enba-line bg-enba-panel-2 hover:bg-enba-line/60 transition-colors overflow-hidden"
    >
      <span
        className="absolute top-1 left-1 w-7 h-7 rounded-md bg-enba-panel border border-enba-line flex items-center justify-center transition-transform duration-300"
        style={{ transform: isDark ? 'translateX(0)' : 'translateX(22px)' }}
      >
        {isDark
          ? <I.Moon size={14} className="text-enba-orange"/>
          : <I.Sun  size={14} className="text-enba-orange"/>}
      </span>
      <span className={cx(
        'absolute top-0 right-2 h-full flex items-center text-enba-dim transition-opacity',
        isDark ? 'opacity-60' : 'opacity-0'
      )}>
        <I.Sun size={13}/>
      </span>
      <span className={cx(
        'absolute top-0 left-2 h-full flex items-center text-enba-dim transition-opacity',
        isDark ? 'opacity-0' : 'opacity-60'
      )}>
        <I.Moon size={13}/>
      </span>
    </button>
  );
}

const NAV = [
  { id: 'overview',  label: 'Genel Bakış',     icon: I.Dashboard },
  { id: 'revenue',   label: 'Gelir Planı',     icon: I.Revenue },
  { id: 'expense',   label: 'Gider Planı',     icon: I.Expense },
  { id: 'cashflow',  label: 'Cash Flow',       icon: I.Cash },
  { id: 'scenario',  label: 'Senaryo',         icon: I.Scenario },
  { id: 'budget',    label: 'Bütçe Takip',     icon: I.Budget },
];

function Sidebar({ active, onSelect }) {
  return (
    <aside className="w-[232px] bg-enba-panel border-r border-enba-line flex flex-col flex-none">
      {/* Brand */}
      <div className="h-[60px] px-4 flex items-center gap-2.5 border-b border-enba-line">
        <div className="w-8 h-8 rounded-lg bg-enba-orange/15 flex items-center justify-center">
          <I.Logo size={20}/>
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-enba-text leading-tight">Enba Similasyon</div>
          <div className="text-[10.5px] text-enba-dim leading-tight">Üretim & Geri Dönüşüm ERP</div>
        </div>
      </div>

      {/* Module header */}
      <div className="px-4 pt-5 pb-3">
        <div className="text-[10.5px] uppercase tracking-[0.14em] text-enba-dim mb-1.5">Modül</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-enba-orange shadow-[0_0_8px] shadow-enba-orange/60"/>
          <div className="text-[14px] font-semibold text-enba-text">Detaylı İş Planı</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-2 flex-1">
        {NAV.map(item => {
          const Active = active === item.id;
          const Disabled = item.disabled;
          return (
            <button
              key={item.id}
              onClick={() => !Disabled && onSelect(item.id)}
              disabled={Disabled}
              className={cx(
                'w-full flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] transition-colors mb-0.5 relative',
                Active && 'bg-enba-orange/12 text-enba-orange',
                !Active && !Disabled && 'text-enba-muted hover:text-enba-text hover:bg-enba-panel-2',
                Disabled && 'text-enba-dim cursor-not-allowed opacity-60',
              )}
            >
              {Active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-enba-orange rounded-r"/>}
              <item.icon size={16}/>
              <span className="flex-1 text-left">{item.label}</span>
              {Disabled && <span className="text-[9.5px] tracking-wide uppercase text-enba-dim">Yakında</span>}
            </button>
          );
        })}

        <div className="mt-4 mb-2 px-3 text-[10.5px] uppercase tracking-[0.14em] text-enba-dim">Diğer Modüller</div>
        <button className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] text-enba-muted hover:text-enba-text hover:bg-enba-panel-2 mb-0.5">
          <I.Bolt size={16}/>
          <span className="flex-1 text-left">FastPlan</span>
          <Badge tone="orange">Hızlı</Badge>
        </button>
        <button className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] text-enba-muted hover:text-enba-text hover:bg-enba-panel-2 mb-0.5">
          <I.Revenue size={16}/>
          <span className="flex-1 text-left">Satış Yönetimi</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] text-enba-muted hover:text-enba-text hover:bg-enba-panel-2 mb-0.5">
          <I.Cash size={16}/>
          <span className="flex-1 text-left">Muhasebe</span>
        </button>
      </nav>

      {/* Plan meta */}
      <div className="m-3 p-3 rounded-lg bg-gradient-to-br from-enba-orange/15 to-transparent border border-enba-orange/25">
        <div className="flex items-center gap-2 mb-2">
          <I.Sparkles size={14} className="text-enba-orange"/>
          <span className="text-[11.5px] font-semibold text-enba-orange">AI Öneri</span>
        </div>
        <p className="text-[11px] text-enba-muted leading-snug">
          Q3 2025'te PET Granül talebinde mevsimsel artış görülüyor. Hacmi <span className="text-enba-text font-medium">%8</span> artırarak <span className="text-enba-text font-medium">₺640K</span> ek gelir.
        </p>
        <button className="mt-2 text-[11px] text-enba-orange font-medium hover:underline">İncele →</button>
      </div>
    </aside>
  );
}

function Header({ scenarioId, setScenarioId, periodGran, setPeriodGran, horizon, setHorizon }) {
  return (
    <div className="bg-enba-panel border-b border-enba-line flex-none">
      {/* Row 1: title + primary actions */}
      <div className="h-[60px] flex items-center px-5 gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[15px] font-semibold text-enba-text truncate">2025-2026 Üretim &amp; Geri Dönüşüm Bütçesi</h1>
            <button className="text-enba-dim hover:text-enba-text flex-none" title="Plan adını düzenle"><I.Edit size={13}/></button>
            <Badge tone="green">Aktif</Badge>
          </div>
          <div className="text-[10.5px] text-enba-dim mt-0.5 flex items-center gap-2 truncate">
            <span>v1.4</span>
            <span>·</span>
            <span>Son kaydedilme 14 dk önce</span>
            <span>·</span>
            <span>Murat K. tarafından</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-none">
          <ThemeToggle/>
          <button className="w-9 h-9 rounded-lg border border-enba-line bg-enba-panel-2 text-enba-muted hover:text-enba-text inline-flex items-center justify-center relative">
            <I.Bell size={15}/>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-enba-orange"/>
          </button>
          <Btn variant="ghost" size="md" icon={<I.Save size={14}/>}>Kaydet</Btn>
          <Btn variant="primary" size="md" icon={<I.Pdf size={14}/>}>PDF</Btn>
        </div>
      </div>

      {/* Row 2: planning controls */}
      <div className="h-[52px] flex items-center px-5 gap-3 border-t border-enba-line bg-enba-panel-2/40">
        <div className="flex items-center gap-2">
          <Select
            icon={<I.Calendar size={13}/>}
            label="Dönem"
            value={periodGran}
            onChange={setPeriodGran}
            options={[
              { value: 'month',   label: 'Aylık' },
              { value: 'quarter', label: 'Çeyreklik' },
              { value: 'year',    label: 'Yıllık' },
            ]}
          />
          <Select
            value={horizon}
            onChange={setHorizon}
            options={[
              { value: 12, label: '12 ay' },
              { value: 18, label: '18 ay' },
              { value: 24, label: '24 ay' },
              { value: 36, label: '36 ay' },
            ]}
          />
        </div>

        <div className="flex-1"/>

        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.14em] text-enba-dim mr-1">Senaryo</span>
          <div className="flex items-center gap-1.5">
            {Object.values(SCENARIOS).map(s => (
              <ScenarioChip
                key={s.id}
                scenario={s}
                active={scenarioId === s.id}
                onClick={() => setScenarioId(s.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ title }) {
  return (
    <div className="flex items-center justify-center h-[480px]">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-enba-panel border border-enba-line flex items-center justify-center mx-auto mb-4">
          <I.Sparkles size={22} className="text-enba-orange"/>
        </div>
        <h2 className="text-lg font-semibold mb-1">{title}</h2>
        <p className="text-[13px] text-enba-muted leading-relaxed">Bu bölüm üzerinde çalışıyoruz. Genel Bakış ve Gelir Planı şu anda aktif.</p>
      </div>
    </div>
  );
}

function App() {
  const [active, setActive] = _useS_app('overview');
  const [scenarioId, setScenarioId] = _useS_app('baz');
  const [periodGran, setPeriodGran] = _useS_app('month');
  const [horizon, setHorizon] = _useS_app(24);
  const [theme, setTheme] = _useS_app(() => {
    try { return localStorage.getItem('enba-theme') || 'dark'; }
    catch(e) { return 'dark'; }
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('enba-theme', theme); } catch(e) {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
    <div className="min-h-screen flex bg-enba-bg">
      <Sidebar active={active} onSelect={setActive}/>

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          scenarioId={scenarioId} setScenarioId={setScenarioId}
          periodGran={periodGran} setPeriodGran={setPeriodGran}
          horizon={horizon} setHorizon={setHorizon}
        />

        <main className="flex-1 overflow-y-auto p-5 grid-bg">
          <div className="max-w-[1380px] mx-auto">
            {active === 'overview' && <OverviewPanel scenarioId={scenarioId} periodGranularity={periodGran}/>}
            {active === 'revenue'  && <RevenuePanel  scenarioId={scenarioId} periodGranularity={periodGran}/>}
            {active === 'expense'  && <ExpensePanel scenarioId={scenarioId} periodGranularity={periodGran}/>}
            {active === 'cashflow' && <CashFlowPanel scenarioId={scenarioId} periodGranularity={periodGran}/>}
            {active === 'scenario' && <ScenarioPanel scenarioId={scenarioId} periodGranularity={periodGran}/>}
            {active === 'budget'   && <BudgetTrackPanel scenarioId={scenarioId} periodGranularity={periodGran}/>}
          </div>
        </main>
      </div>
    </div>
    </ThemeContext.Provider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
