// Main Bold prototype shell — wires sidebar + views + modals
// Renders inside a 1320x880 frame

function BoldApp({ accent, density, cardStyle, lang, dark, font }) {
  const [tasks, actions] = useTaskStore('main');
  const [view, setView] = React.useState('today');
  const [openTask, setOpenTask] = React.useState(null);
  const [showAdd, setShowAdd] = React.useState(false);

  // Find a "focus task" for the pomodoro widget
  const focusTask = React.useMemo(() => {
    return tasks.find(t => t.status === 'active' && t.priority === 'high') ||
           tasks.find(t => t.deadline && sameDay(t.deadline, today) && t.status !== 'done');
  }, [tasks]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); setShowAdd(true); }
      if (e.key === 'Escape') { setOpenTask(null); setShowAdd(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Apply font + radius
  const bg = dark ? '#16151A' : BOLD.bg;
  const ink = dark ? '#FAF7F1' : BOLD.ink;

  return (
    <div style={{
      width: 1320, height: 880, display: 'flex',
      background: bg, color: ink,
      fontFamily: font === 'system' ? '-apple-system, system-ui, sans-serif' :
                  font === 'mono' ? 'JetBrains Mono, monospace' :
                  'Geist, ui-sans-serif, sans-serif',
      letterSpacing: '-0.005em',
      position: 'relative', overflow: 'hidden',
    }}>
      <Sidebar view={view} setView={setView} tasks={tasks}
        onNewTask={() => setShowAdd(true)} lang={lang} accent={accent} />

      <main style={{ flex: 1, display: 'flex', minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          {view === 'today' && <TodayView tasks={tasks} actions={actions} onOpen={setOpenTask}
            lang={lang} accent={accent} density={density} cardStyle={cardStyle} />}
          {view === 'all' && <AllTasksView tasks={tasks} actions={actions} onOpen={setOpenTask}
            density={density} cardStyle={cardStyle} />}
          {view === 'kanban' && <KanbanView tasks={tasks} actions={actions} onOpen={setOpenTask} accent={accent} />}
          {view === 'calendar' && <CalendarView tasks={tasks} onOpen={setOpenTask} accent={accent} />}
          {view === 'stats' && <StatsView tasks={tasks} accent={accent} />}
          {view === 'completed' && <CompletedView tasks={tasks} actions={actions} onOpen={setOpenTask}
            density={density} cardStyle={cardStyle} />}
        </div>

        {/* Right rail: pomodoro */}
        <aside style={{
          width: 260, padding: '20px 18px', borderLeft: `1px solid ${BOLD.line}`,
          display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0,
          background: dark ? '#1E1D26' : '#FCFAF6',
        }}>
          <PomodoroWidget accent={accent} task={focusTask} />

          {/* Quick stats card */}
          <div style={{
            background: BOLD.surface, border: `1px solid ${BOLD.line}`,
            borderRadius: 'var(--radius, 14px)', padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: BOLD.inkFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
              <Icon name="fire" size={12} /> Bu hafta
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 28, letterSpacing: '-0.03em', color: BOLD.ink, lineHeight: 1 }}>
                  12
                </div>
                <div style={{ fontSize: 11, color: BOLD.inkSoft, marginTop: 4, fontWeight: 500 }}>tamamlandı</div>
              </div>
              <div>
                <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 28, letterSpacing: '-0.03em', color: accent, lineHeight: 1 }}>
                  87<span style={{ fontSize: 14, opacity: 0.6 }}>%</span>
                </div>
                <div style={{ fontSize: 11, color: BOLD.inkSoft, marginTop: 4, fontWeight: 500 }}>hedefte</div>
              </div>
            </div>
            <div style={{ marginTop: 14, height: 6, background: BOLD.line, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: '87%', height: '100%', background: `linear-gradient(90deg, ${accent}, #8B5CF6)`, borderRadius: 3 }} />
            </div>
          </div>

          {/* Upcoming hint */}
          <div style={{
            background: '#8B5CF6', color: '#fff', borderRadius: 'var(--radius, 14px)',
            padding: 16, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 70, opacity: 0.15, fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800 }}>↗</div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Yarın
            </div>
            <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 16, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 4 }}>
              A/B testi sonuç analizi
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>+ 4 görev daha</div>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ fontSize: 10.5, color: BOLD.inkFaint, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', letterSpacing: '0.05em' }}>
            v3.2 · tako 2026
          </div>
        </aside>
      </main>

      {openTask && <TaskDetail task={tasks.find(t => t.id === openTask.id)}
        onClose={() => setOpenTask(null)} actions={actions} accent={accent} />}
      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onSave={actions.add} accent={accent} />}
    </div>
  );
}

window.BoldApp = BoldApp;
