// Mobile screens — iPhone-style task management
// 380x800 frame

function MobileTodayScreen({ accent }) {
  const [tasks, actions] = useTaskStore('mobile');
  const todayTasks = tasks.filter(t => t.deadline && sameDay(t.deadline, today) && t.status !== 'done');
  const doneCount = tasks.filter(t => t.status === 'done' && t.completedAt && sameDay(t.completedAt, today)).length;
  const total = todayTasks.length + doneCount;
  const completion = total > 0 ? doneCount / total : 0;

  return (
    <div style={{
      width: 380, height: 800, background: BOLD.bg, position: 'relative',
      fontFamily: 'Geist, ui-sans-serif, sans-serif', color: BOLD.ink,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Status bar */}
      <div style={{
        height: 44, padding: '0 22px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', fontSize: 14, fontWeight: 600,
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        <span>10:42</span>
        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ width: 16, height: 10, border: '1.4px solid currentColor', borderRadius: 2, position: 'relative' }}>
            <span style={{ position: 'absolute', inset: 1, background: 'currentColor', width: '78%', borderRadius: 1 }} />
          </span>
        </span>
      </div>

      {/* Header */}
      <div style={{ padding: '12px 22px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 18,
          }}>◆</div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#8B5CF6,#FF5C8A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 700,
          }}>EK</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: BOLD.inkFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Pzt · 11 Mayıs
        </div>
        <h1 style={{
          fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700,
          fontSize: 32, letterSpacing: '-0.04em', margin: 0, lineHeight: 1,
        }}>Günaydın, <span style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', color: accent, fontWeight: 400 }}>Elif</span></h1>

        {/* Progress card */}
        <div style={{
          marginTop: 18, background: BOLD.ink, color: '#fff',
          borderRadius: 18, padding: 18, position: 'relative', overflow: 'hidden',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: accent, opacity: 0.25, filter: 'blur(10px)' }} />
          <svg width={60} height={60} viewBox="0 0 60 60" style={{ position: 'relative' }}>
            <circle cx={30} cy={30} r={24} stroke="rgba(255,255,255,.1)" strokeWidth={5} fill="none" />
            <circle cx={30} cy={30} r={24} stroke={accent} strokeWidth={5} fill="none"
              strokeLinecap="round" strokeDasharray={2 * Math.PI * 24}
              strokeDashoffset={2 * Math.PI * 24 * (1 - completion)}
              transform="rotate(-90 30 30)" />
          </svg>
          <div style={{ position: 'relative' }}>
            <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {todayTasks.length} görev<br /><span style={{ opacity: 0.6, fontSize: 13, fontWeight: 500, letterSpacing: 0 }}>bugün için</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 16px 100px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: BOLD.inkFaint, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '8px 6px 10px' }}>
          Bugün
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {todayTasks.slice(0, 4).map(t => <MobileTaskCard key={t.id} task={t} onToggle={actions.toggle} />)}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(250,247,241,.92)', backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${BOLD.line}`, padding: '10px 22px 26px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {[
          { name: 'today', label: 'Bugün', active: true },
          { name: 'all', label: 'Tümü' },
          { name: '+', label: '', isAdd: true },
          { name: 'kanban', label: 'Pano' },
          { name: 'stats', label: 'İstat.' },
        ].map((n, i) => n.isAdd ? (
          <button key={i} style={{
            width: 52, height: 52, borderRadius: 18, background: accent,
            color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 20px ${accent}55`, cursor: 'pointer',
            marginTop: -16,
          }}><Icon name="plus" size={22} stroke={2.4} /></button>
        ) : (
          <button key={i} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: n.active ? BOLD.ink : BOLD.inkFaint, padding: 4,
          }}>
            <Icon name={n.name} size={20} stroke={n.active ? 2.2 : 1.6} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileTaskCard({ task, onToggle }) {
  const p = getProject(task.project);
  const done = task.status === 'done';
  const subTotal = task.subtasks?.length || 0;
  const subDone = task.subtasks?.filter(s => s.done).length || 0;
  return (
    <div style={{
      background: BOLD.surface, borderRadius: 14, padding: 14,
      display: 'flex', gap: 12, alignItems: 'flex-start',
      border: `1px solid ${BOLD.line}`,
    }}>
      <Checkbox checked={done} priority={task.priority} onToggle={(e) => onToggle(task.id, e)} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: BOLD.ink, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: BOLD.inkSoft, fontWeight: 500 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />{p.name}
          </span>
          {subTotal > 0 && <span style={{ fontSize: 11, color: BOLD.inkFaint, fontWeight: 600 }}>{subDone}/{subTotal}</span>}
        </div>
      </div>
      <PriorityChip priority={task.priority} />
    </div>
  );
}

// Mobile task detail
function MobileDetailScreen({ accent }) {
  const t = SEED_TASKS[0];
  const p = getProject(t.project);
  const [subtasks, setSubtasks] = React.useState(t.subtasks);
  const toggle = (id) => setSubtasks(s => s.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const subDone = subtasks.filter(s => s.done).length;

  return (
    <div style={{
      width: 380, height: 800, background: BOLD.bg, position: 'relative',
      fontFamily: 'Geist, ui-sans-serif, sans-serif', color: BOLD.ink,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 44, padding: '0 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
        <span>10:42</span>
        <span style={{ width: 16, height: 10, border: '1.4px solid currentColor', borderRadius: 2 }} />
      </div>

      <div style={{ padding: '8px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{
          width: 38, height: 38, borderRadius: '50%', background: '#fff',
          border: `1px solid ${BOLD.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon name="chevron" size={16} style={{ transform: 'rotate(180deg)' }} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: BOLD.inkSoft, fontWeight: 600 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color }} />{p.name}
        </div>
        <button style={{
          width: 38, height: 38, borderRadius: '50%', background: '#fff',
          border: `1px solid ${BOLD.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>⋯</button>
      </div>

      <div style={{ padding: '18px 22px', flex: 1, overflow: 'auto' }}>
        <PriorityChip priority={t.priority} size="lg" />
        <h1 style={{
          fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700,
          fontSize: 28, letterSpacing: '-0.035em', margin: '10px 0 14px', lineHeight: 1.15,
        }}>{t.title}</h1>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {t.labels.map(l => <LabelChip key={l} labelId={l} />)}
        </div>

        {/* Pomodoro */}
        <div style={{
          background: BOLD.ink, color: '#fff', borderRadius: 18, padding: 20,
          marginBottom: 18, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: accent, opacity: 0.2, filter: 'blur(15px)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pomodoro</div>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.6 }}>{t.completedPomodoros}/{t.estimatedPomodoros}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
              24:30
            </div>
            <button style={{
              padding: '10px 22px', borderRadius: 999, background: accent, color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
            }}>▶ Başlat</button>
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 14, position: 'relative' }}>
            {Array.from({ length: t.estimatedPomodoros }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i < t.completedPomodoros ? accent : 'rgba(255,255,255,.12)' }} />
            ))}
          </div>
        </div>

        {/* Subtasks */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>Alt görevler</div>
            <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: BOLD.inkFaint, fontWeight: 600 }}>{subDone}/{subtasks.length}</div>
          </div>
          <div style={{ background: BOLD.surface, borderRadius: 14, border: `1px solid ${BOLD.line}`, overflow: 'hidden' }}>
            {subtasks.map((st, i) => (
              <div key={st.id} onClick={() => toggle(st.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                borderTop: i > 0 ? `1px solid ${BOLD.line}` : 'none', cursor: 'pointer',
              }}>
                <Checkbox checked={st.done} size={18} onToggle={() => toggle(st.id)} />
                <span style={{
                  fontSize: 13.5, color: st.done ? BOLD.inkFaint : BOLD.ink,
                  textDecoration: st.done ? 'line-through' : 'none', fontWeight: 500,
                }}>{st.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 8 }}>Notlar</div>
          <div style={{
            padding: 14, background: '#FFFCEC', borderRadius: 12,
            fontSize: 13.5, color: BOLD.ink, lineHeight: 1.5, border: '1px solid #F4ECC8',
          }}>{t.notes}</div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 18px 30px' }}>
        <button style={{
          width: '100%', padding: '14px', borderRadius: 14,
          background: accent, color: '#fff', border: 'none',
          fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}><Icon name="done" size={16} stroke={2.4} />Tamamlandı olarak işaretle</button>
      </div>
    </div>
  );
}

Object.assign(window, { MobileTodayScreen, MobileDetailScreen });
