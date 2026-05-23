// Main Bold prototype — desktop task management app
// Renders inside a fixed 1320x880 frame for the design canvas.

const BOLD = {
  bg: '#FAF7F1',          // cream
  surface: '#FFFFFF',
  ink: '#16151A',
  inkSoft: '#5A554E',
  inkFaint: '#A8A39C',
  line: '#EDE7DC',
  lineSoft: '#F4EFE5',
  // accents
  accent: '#FF5C5C',
  accentInk: '#16151A',
  // priority
  high: '#FF3B30',
  highBg: '#FFE9E7',
  med: '#FF9500',
  medBg: '#FFF1DC',
  low: '#6BBF8A',
  lowBg: '#E5F5EB',
  // category accents (project colors live in data.jsx)
};

// ─── PRIORITY CHIP ──────────────────────────────────────────────────────
function PriorityChip({ priority, size = 'sm' }) {
  const meta = PRIORITY_META[priority];
  if (!meta) return null;
  const dot = size === 'lg' ? 8 : 6;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: size === 'lg' ? '4px 10px' : '2px 8px',
      background: meta.bg, color: meta.color,
      borderRadius: 999, fontSize: size === 'lg' ? 12 : 11,
      fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: dot, height: dot, borderRadius: '50%', background: meta.color }} />
      {meta.name}
    </span>
  );
}

// ─── LABEL CHIP ─────────────────────────────────────────────────────────
function LabelChip({ labelId }) {
  const l = getLabel(labelId);
  if (!l) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 5,
      background: l.color + '18', color: l.color,
      fontSize: 11, fontWeight: 600, letterSpacing: '-0.01em',
    }}>
      <span>#</span>{l.name}
    </span>
  );
}

// ─── CHECKBOX (custom, animated) ────────────────────────────────────────
function Checkbox({ checked, onToggle, color = BOLD.ink, size = 22, priority }) {
  const ring = priority ? PRIORITY_META[priority].color : color;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onToggle?.(e); }}
      style={{
        width: size, height: size, minWidth: size,
        borderRadius: '50%',
        border: `2px solid ${checked ? ring : ring + '70'}`,
        background: checked ? ring : 'transparent',
        cursor: 'pointer', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s cubic-bezier(.4,.0,.2,1)',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = ring + '15'; }}
      onMouseLeave={(e) => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
    >
      {checked && (
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ─── TASK CARD (list view) ──────────────────────────────────────────────
function TaskRow({ task, onToggle, onOpen, density = 'regular', cardStyle = 'soft' }) {
  const p = getProject(task.project);
  const done = task.status === 'done';
  const isOverdue = task.deadline && task.deadline < today && !done;
  const subDone = task.subtasks?.filter(s => s.done).length || 0;
  const subTotal = task.subtasks?.length || 0;
  const pad = density === 'compact' ? '8px 14px' : density === 'comfy' ? '16px 18px' : '12px 16px';
  const styles = {
    soft: { background: BOLD.surface, border: `1px solid ${BOLD.line}`, boxShadow: '0 1px 0 rgba(20,18,15,.02)' },
    flat: { background: BOLD.surface, border: `1px solid ${BOLD.line}` },
    lifted: { background: BOLD.surface, border: 'none', boxShadow: '0 1px 2px rgba(20,18,15,.04), 0 4px 14px rgba(20,18,15,.06)' },
    pop: { background: BOLD.surface, border: `2px solid ${BOLD.ink}`, boxShadow: '4px 4px 0 ' + BOLD.ink },
  }[cardStyle] || styles?.soft;

  return (
    <div
      onClick={() => onOpen?.(task)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: pad, borderRadius: 'var(--radius, 12px)',
        cursor: 'pointer',
        opacity: done ? 0.6 : 1,
        transition: 'all 0.15s',
        ...styles,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
    >
      <div style={{ paddingTop: 1 }}>
        <Checkbox checked={done} onToggle={(ev) => onToggle?.(task.id, ev)} priority={task.priority} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14.5, fontWeight: 600, color: BOLD.ink, lineHeight: 1.35,
          textDecoration: done ? 'line-through' : 'none',
          letterSpacing: '-0.01em',
        }}>{task.title}</div>
        {(task.notes || subTotal > 0) && density !== 'compact' && (
          <div style={{ fontSize: 12.5, color: BOLD.inkSoft, marginTop: 4, lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subTotal > 0 ? `${subDone}/${subTotal} alt görev · ` : ''}{task.notes}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: density === 'compact' ? 4 : 8, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: BOLD.inkSoft, fontWeight: 500 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />
            {p.name}
          </span>
          {task.labels?.slice(0, 2).map(l => <LabelChip key={l} labelId={l} />)}
          {task.recurring && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: BOLD.inkFaint, fontWeight: 500 }}>
              <Icon name="repeat" size={11} /> {task.recurring === 'weekly' ? 'haftalık' : 'aylık'}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <PriorityChip priority={task.priority} />
        {task.deadline && (
          <span style={{
            fontSize: 11.5, fontWeight: 600,
            color: isOverdue ? BOLD.high : (sameDay(task.deadline, today) ? BOLD.accent : BOLD.inkFaint),
            fontVariantNumeric: 'tabular-nums',
          }}>
            {sameDay(task.deadline, today) ? 'Bugün' :
              sameDay(task.deadline, addDays(today, 1)) ? 'Yarın' :
              sameDay(task.deadline, addDays(today, -1)) ? 'Dün' :
              fmtShort(task.deadline)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── SIDEBAR ────────────────────────────────────────────────────────────
function Sidebar({ view, setView, tasks, onNewTask, lang, accent }) {
  const counts = {
    today: tasks.filter(t => t.deadline && sameDay(t.deadline, today) && t.status !== 'done').length,
    all: tasks.filter(t => t.status !== 'done').length,
    completed: tasks.filter(t => t.status === 'done').length,
  };
  const navItems = [
    { id: 'today', icon: 'today', label: T[lang].today, count: counts.today, badge: true },
    { id: 'all', icon: 'all', label: T[lang].all, count: counts.all },
    { id: 'kanban', icon: 'kanban', label: T[lang].kanban },
    { id: 'calendar', icon: 'calendar', label: T[lang].calendar },
    { id: 'stats', icon: 'stats', label: T[lang].stats },
    { id: 'completed', icon: 'done', label: T[lang].completed, count: counts.completed },
  ];

  return (
    <aside style={{
      width: 240, background: 'transparent', borderRight: `1px solid ${BOLD.line}`,
      padding: '20px 14px 16px', display: 'flex', flexDirection: 'column', gap: 4,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 18px' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800,
          fontSize: 18, letterSpacing: '-0.04em',
        }}>◆</div>
        <div style={{
          fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700,
          fontSize: 18, letterSpacing: '-0.04em', color: BOLD.ink,
        }}>tako</div>
      </div>

      {/* New task button */}
      <button
        onClick={onNewTask}
        style={{
          background: BOLD.ink, color: '#fff', border: 'none',
          padding: '11px 14px', borderRadius: 'var(--radius, 12px)',
          fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 14, justifyContent: 'space-between',
          letterSpacing: '-0.01em',
        }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="plus" size={14} stroke={2.2} />{T[lang].newTask}
        </span>
        <span style={{ fontSize: 11, opacity: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>⌘N</span>
      </button>

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8,
                background: active ? BOLD.ink + '0A' : 'transparent',
                border: 'none', cursor: 'pointer', width: '100%',
                color: active ? BOLD.ink : BOLD.inkSoft,
                fontSize: 13.5, fontWeight: active ? 600 : 500,
                letterSpacing: '-0.01em', fontFamily: 'inherit',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = BOLD.line + '60'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon name={item.icon} size={16} />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {item.count != null && item.count > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  padding: item.badge && active ? '2px 6px' : 0,
                  background: item.badge && active ? accent : 'transparent',
                  color: item.badge && active ? '#fff' : BOLD.inkFaint,
                  borderRadius: 4,
                }}>{item.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Projects */}
      <SidebarSection title={T[lang].projects} lang={lang}>
        {PROJECTS.map(p => {
          const count = tasks.filter(t => t.project === p.id && t.status !== 'done').length;
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
              fontSize: 12.5, color: BOLD.inkSoft, fontWeight: 500,
            }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color, flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              {count > 0 && <span style={{ fontSize: 10.5, color: BOLD.inkFaint, fontFamily: 'JetBrains Mono, monospace' }}>{count}</span>}
            </div>
          );
        })}
      </SidebarSection>

      {/* Labels */}
      <SidebarSection title={T[lang].labels} lang={lang}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '4px 10px' }}>
          {LABELS.map(l => (
            <span key={l.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '3px 7px', borderRadius: 4,
              background: l.color + '15', color: l.color,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>#{l.name}</span>
          ))}
        </div>
      </SidebarSection>

      <div style={{ flex: 1 }} />

      {/* Bottom user */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
        borderRadius: 8, marginTop: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg,#8B5CF6,#FF5C8A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 11.5, fontWeight: 700,
        }}>EK</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: BOLD.ink, lineHeight: 1.2 }}>Elif Kara</div>
          <div style={{ fontSize: 11, color: BOLD.inkFaint, lineHeight: 1.2, marginTop: 1 }}>Tasarımcı</div>
        </div>
      </div>
    </aside>
  );
}

function SidebarSection({ title, children, lang }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: BOLD.inkFaint, padding: '0 10px 6px',
      }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

// ─── POMODORO ───────────────────────────────────────────────────────────
function PomodoroWidget({ accent, task }) {
  const [seconds, setSeconds] = React.useState(25 * 60);
  const [running, setRunning] = React.useState(false);
  const [mode, setMode] = React.useState('work'); // work | break

  React.useEffect(() => {
    if (!running) return;
    const i = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, [running]);

  const total = mode === 'work' ? 25 * 60 : 5 * 60;
  const progress = 1 - seconds / total;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const R = 56, C = 2 * Math.PI * R;

  return (
    <div style={{
      background: BOLD.ink, color: '#fff', borderRadius: 'var(--radius, 16px)',
      padding: 18, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 140, height: 140,
        borderRadius: '50%', background: accent, opacity: 0.18,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>
          <Icon name="timer" size={12} /> Pomodoro
        </div>
        <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,.08)', borderRadius: 6, padding: 2 }}>
          {['work', 'break'].map(m => (
            <button key={m} onClick={() => { setMode(m); setSeconds(m === 'work' ? 25 * 60 : 5 * 60); }}
              style={{
                fontSize: 10.5, padding: '3px 8px', borderRadius: 4, border: 'none',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? BOLD.ink : '#fff',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>{m === 'work' ? 'Odak' : 'Mola'}</button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '6px 0 10px' }}>
        <svg width={140} height={140} viewBox="0 0 140 140">
          <circle cx={70} cy={70} r={R} stroke="rgba(255,255,255,.1)" strokeWidth={6} fill="none" />
          <circle cx={70} cy={70} r={R} stroke={accent} strokeWidth={6} fill="none"
            strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
            transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset .4s' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 30, fontWeight: 600, letterSpacing: '-0.04em' }}>
            {mm}:{ss}
          </div>
          <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
            {mode === 'work' ? '4 turdan ' + (task?.completedPomodoros || 2) + '.' : 'Mola'}
          </div>
        </div>
      </div>

      {task && (
        <div style={{
          background: 'rgba(255,255,255,.06)', borderRadius: 8, padding: '8px 10px',
          marginBottom: 10, fontSize: 12, fontWeight: 500, lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ opacity: 0.5, marginRight: 6 }}>Şu an:</span>
          {task.title}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setRunning(r => !r)}
          style={{
            flex: 1, background: accent, color: '#fff', border: 'none',
            padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
          }}>{running ? '⏸ Duraklat' : '▶ Başlat'}</button>
        <button onClick={() => { setRunning(false); setSeconds(mode === 'work' ? 25 * 60 : 5 * 60); }}
          style={{
            background: 'rgba(255,255,255,.1)', color: '#fff', border: 'none',
            padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>↻</button>
      </div>
    </div>
  );
}

// Export
Object.assign(window, { BOLD, PriorityChip, LabelChip, Checkbox, TaskRow, Sidebar, SidebarSection, PomodoroWidget });
