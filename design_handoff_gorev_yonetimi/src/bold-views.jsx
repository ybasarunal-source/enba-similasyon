// All view components for the bold prototype — today, all, kanban, calendar, stats, completed
// + AddTaskModal + TaskDetail drawer

// ─── TODAY VIEW ─────────────────────────────────────────────────────────
function TodayView({ tasks, actions, onOpen, lang, accent, density, cardStyle }) {
  const todayTasks = tasks.filter(t => t.deadline && sameDay(t.deadline, today) && t.status !== 'done');
  const overdueTasks = tasks.filter(t => t.deadline && t.deadline < today && !sameDay(t.deadline, today) && t.status !== 'done');
  const upcoming = tasks.filter(t => t.deadline && t.deadline > today && t.deadline <= addDays(today, 3) && t.status !== 'done')
    .sort((a, b) => a.deadline - b.deadline);
  const doneToday = tasks.filter(t => t.status === 'done' && t.completedAt && sameDay(t.completedAt, today)).length;
  const totalToday = todayTasks.length + doneToday;
  const completion = totalToday > 0 ? doneToday / totalToday : 0;

  const hour = 10; // pretend morning
  const greet = hour < 12 ? T[lang].morning : hour < 18 ? T[lang].afternoon : T[lang].evening;
  const focusTask = todayTasks.find(t => t.priority === 'high') || todayTasks[0];

  return (
    <div style={{ padding: '28px 36px', overflow: 'auto', height: '100%' }}>
      {/* Hero header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: BOLD.inkFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Pazartesi · {fmtTR(today)}
          </div>
          <h1 style={{
            fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700,
            fontSize: 42, letterSpacing: '-0.045em', color: BOLD.ink,
            margin: 0, lineHeight: 1,
          }}>
            {greet}, <span style={{ color: accent, fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>Elif</span>.
          </h1>
          <div style={{ fontSize: 15, color: BOLD.inkSoft, marginTop: 8, letterSpacing: '-0.01em' }}>
            Bugün için <b style={{ color: BOLD.ink }}>{todayTasks.length} görev</b> bekliyor
            {overdueTasks.length > 0 && <>, <span style={{ color: BOLD.high }}>{overdueTasks.length} tanesi gecikti</span></>}.
          </div>
        </div>

        {/* Progress ring */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: BOLD.surface, border: `1px solid ${BOLD.line}`,
          padding: '14px 18px', borderRadius: 'var(--radius, 14px)',
        }}>
          <svg width={56} height={56} viewBox="0 0 56 56">
            <circle cx={28} cy={28} r={22} stroke={BOLD.line} strokeWidth={5} fill="none" />
            <circle cx={28} cy={28} r={22} stroke={accent} strokeWidth={5} fill="none"
              strokeLinecap="round" strokeDasharray={2 * Math.PI * 22}
              strokeDashoffset={2 * Math.PI * 22 * (1 - completion)}
              transform="rotate(-90 28 28)" />
          </svg>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, color: BOLD.ink, lineHeight: 1 }}>
              {doneToday}<span style={{ color: BOLD.inkFaint, fontWeight: 500 }}>/{totalToday}</span>
            </div>
            <div style={{ fontSize: 11, color: BOLD.inkSoft, marginTop: 4, fontWeight: 500 }}>günlük ilerleme</div>
          </div>
        </div>
      </div>

      {/* Focus card */}
      {focusTask && (
        <FocusCard task={focusTask} accent={accent} onOpen={onOpen} actions={actions} />
      )}

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <Section title="Gecikti" count={overdueTasks.length} color={BOLD.high}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {overdueTasks.map(t => <TaskRow key={t.id} task={t} onToggle={actions.toggle} onOpen={onOpen} density={density} cardStyle={cardStyle} />)}
          </div>
        </Section>
      )}

      {/* Today's tasks */}
      <Section title="Bugün" count={todayTasks.length}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {todayTasks.map(t => <TaskRow key={t.id} task={t} onToggle={actions.toggle} onOpen={onOpen} density={density} cardStyle={cardStyle} />)}
          {todayTasks.length === 0 && <EmptyState text="Bugün için planlı görev yok. Bir tane ekle ✨" />}
        </div>
      </Section>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Section title="Yaklaşan · sonraki 3 gün" count={upcoming.length}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map(t => <TaskRow key={t.id} task={t} onToggle={actions.toggle} onOpen={onOpen} density={density} cardStyle={cardStyle} />)}
          </div>
        </Section>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}

function FocusCard({ task, accent, onOpen, actions }) {
  const p = getProject(task.project);
  const subDone = task.subtasks?.filter(s => s.done).length || 0;
  const subTotal = task.subtasks?.length || 0;
  return (
    <div
      onClick={() => onOpen?.(task)}
      style={{
        background: BOLD.ink, color: '#fff', borderRadius: 'var(--radius, 20px)',
        padding: '24px 26px', marginBottom: 28, position: 'relative', overflow: 'hidden',
        cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24,
      }}>
      {/* decorative blobs */}
      <div style={{ position: 'absolute', top: -60, right: 200, width: 160, height: 160,
        borderRadius: '50%', background: accent, opacity: 0.35, filter: 'blur(20px)' }} />
      <div style={{ position: 'absolute', bottom: -40, right: -20, width: 200, height: 200,
        borderRadius: '50%', background: p.color, opacity: 0.25, filter: 'blur(30px)' }} />

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 14 }}>
          <Icon name="sparkle" size={12} /> Bugünün odağı
        </div>
        <div style={{
          fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700,
          fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.035em',
          marginBottom: 12,
        }}>{task.title}</div>
        {task.notes && <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 14, lineHeight: 1.5, maxWidth: 480 }}>{task.notes}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <PriorityChip priority={task.priority} size="lg" />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, opacity: 0.85 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />{p.name}
          </span>
          {subTotal > 0 && (
            <span style={{ fontSize: 12.5, fontWeight: 500, opacity: 0.7 }}>
              {subDone}/{subTotal} alt görev
            </span>
          )}
          {task.estimatedPomodoros > 0 && (
            <span style={{ fontSize: 12.5, fontWeight: 500, opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Icon name="timer" size={12} />{task.completedPomodoros}/{task.estimatedPomodoros} pomodoro
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
        <button onClick={(e) => { e.stopPropagation(); actions.toggle(task.id, e); }}
          style={{
            background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
            color: '#fff', padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
          }}>
          <Icon name="done" size={12} stroke={2.2} />Tamamla
        </button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, opacity: 0.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Son tarih</div>
          <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 2 }}>
            Bugün
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, count, color, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <h2 style={{
          fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700,
          fontSize: 19, letterSpacing: '-0.03em', color: color || BOLD.ink, margin: 0,
        }}>{title}</h2>
        {count != null && <span style={{
          fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: BOLD.inkFaint,
        }}>{count}</span>}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{
      padding: '32px 24px', textAlign: 'center', color: BOLD.inkFaint,
      fontSize: 13.5, border: `1px dashed ${BOLD.line}`, borderRadius: 'var(--radius, 12px)',
    }}>{text}</div>
  );
}

// ─── ALL TASKS VIEW ─────────────────────────────────────────────────────
function AllTasksView({ tasks, actions, onOpen, density, cardStyle }) {
  const [filter, setFilter] = React.useState({ priority: 'all', project: 'all', status: 'all' });
  const filtered = tasks.filter(t => {
    if (filter.priority !== 'all' && t.priority !== filter.priority) return false;
    if (filter.project !== 'all' && t.project !== filter.project) return false;
    if (filter.status === 'active' && t.status === 'done') return false;
    if (filter.status === 'done' && t.status !== 'done') return false;
    return true;
  });

  return (
    <div style={{ padding: '28px 36px', overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 32,
          letterSpacing: '-0.04em', margin: 0, color: BOLD.ink,
        }}>Tüm görevler</h1>
        <div style={{ fontSize: 13.5, color: BOLD.inkSoft, marginTop: 4 }}>
          {filtered.length} sonuç · {tasks.length} toplam
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, padding: '12px 16px',
        background: BOLD.surface, border: `1px solid ${BOLD.line}`, borderRadius: 'var(--radius, 12px)' }}>
        <FilterGroup label="Durum">
          {[
            { v: 'all', n: 'Hepsi' },
            { v: 'active', n: 'Aktif' },
            { v: 'done', n: 'Tamamlanan' },
          ].map(o => (
            <Chip key={o.v} active={filter.status === o.v} onClick={() => setFilter({ ...filter, status: o.v })}>{o.n}</Chip>
          ))}
        </FilterGroup>
        <Divider />
        <FilterGroup label="Öncelik">
          <Chip active={filter.priority === 'all'} onClick={() => setFilter({ ...filter, priority: 'all' })}>Hepsi</Chip>
          {Object.entries(PRIORITY_META).map(([k, m]) => (
            <Chip key={k} active={filter.priority === k} onClick={() => setFilter({ ...filter, priority: k })} color={m.color}>{m.name}</Chip>
          ))}
        </FilterGroup>
        <Divider />
        <FilterGroup label="Proje">
          <Chip active={filter.project === 'all'} onClick={() => setFilter({ ...filter, project: 'all' })}>Hepsi</Chip>
          {PROJECTS.map(p => (
            <Chip key={p.id} active={filter.project === p.id} onClick={() => setFilter({ ...filter, project: p.id })} color={p.color}>{p.name}</Chip>
          ))}
        </FilterGroup>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(t => <TaskRow key={t.id} task={t} onToggle={actions.toggle} onOpen={onOpen} density={density} cardStyle={cardStyle} />)}
        {filtered.length === 0 && <EmptyState text="Bu filtreyle eşleşen görev yok." />}
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: BOLD.inkFaint, letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 4 }}>{label}</span>
      {children}
    </div>
  );
}
function Divider() { return <div style={{ width: 1, background: BOLD.line, alignSelf: 'stretch' }} />; }
function Chip({ active, onClick, color, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', borderRadius: 999,
      border: `1px solid ${active ? (color || BOLD.ink) : BOLD.line}`,
      background: active ? (color || BOLD.ink) : 'transparent',
      color: active ? '#fff' : BOLD.inkSoft,
      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', gap: 5,
      letterSpacing: '-0.01em',
    }}>
      {color && !active && <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />}
      {children}
    </button>
  );
}

// ─── KANBAN VIEW ────────────────────────────────────────────────────────
function KanbanView({ tasks, actions, onOpen, accent }) {
  const [dragged, setDragged] = React.useState(null);
  const [over, setOver] = React.useState(null);

  const cols = STATUSES.map(s => ({
    ...s,
    tasks: tasks.filter(t => t.status === s.id),
  }));

  return (
    <div style={{ padding: '28px 36px 0', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 32,
          letterSpacing: '-0.04em', margin: 0, color: BOLD.ink,
        }}>Kanban panosu</h1>
        <div style={{ fontSize: 13.5, color: BOLD.inkSoft, marginTop: 4 }}>
          Sürükle ve bırak ile görevleri sütunlar arasında taşı
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
        flex: 1, minHeight: 0, paddingBottom: 24,
      }}>
        {cols.map(col => (
          <div key={col.id}
            onDragOver={(e) => { e.preventDefault(); setOver(col.id); }}
            onDragLeave={() => setOver(o => o === col.id ? null : o)}
            onDrop={() => { if (dragged) { actions.setStatus(dragged, col.id); setDragged(null); setOver(null); } }}
            style={{
              background: over === col.id ? accent + '12' : BOLD.surface,
              border: over === col.id ? `2px dashed ${accent}` : `1px solid ${BOLD.line}`,
              borderRadius: 'var(--radius, 14px)', padding: 12,
              display: 'flex', flexDirection: 'column', minHeight: 0,
              transition: 'all 0.15s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: BOLD.inkSoft }}>{col.emoji}</span>
                <span style={{
                  fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700,
                  fontSize: 15, letterSpacing: '-0.02em', color: BOLD.ink,
                }}>{col.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  color: BOLD.inkFaint, background: BOLD.line + '60', padding: '2px 6px', borderRadius: 4 }}>
                  {col.tasks.length}
                </span>
              </div>
              <button style={{
                width: 22, height: 22, borderRadius: 6, border: 'none', background: 'transparent',
                color: BOLD.inkFaint, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="plus" size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
              {col.tasks.map(t => (
                <KanbanCard key={t.id} task={t}
                  onDragStart={() => setDragged(t.id)}
                  onDragEnd={() => { setDragged(null); setOver(null); }}
                  onOpen={onOpen}
                  isDragging={dragged === t.id} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KanbanCard({ task, onDragStart, onDragEnd, onOpen, isDragging }) {
  const p = getProject(task.project);
  const subDone = task.subtasks?.filter(s => s.done).length || 0;
  const subTotal = task.subtasks?.length || 0;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onOpen?.(task)}
      style={{
        background: '#fff', borderRadius: 'var(--radius, 10px)',
        border: `1px solid ${BOLD.line}`,
        padding: 12, cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        boxShadow: '0 1px 0 rgba(20,18,15,.03)',
        transition: 'box-shadow 0.15s, transform 0.15s',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(20,18,15,.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 0 rgba(20,18,15,.03)'; }}
    >
      {/* color bar on left */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: p.color }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: BOLD.inkSoft, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{p.name}</span>
        <div style={{ flex: 1 }} />
        {task.priority === 'high' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: BOLD.high }} />}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: BOLD.ink, lineHeight: 1.35, marginBottom: 8, letterSpacing: '-0.01em' }}>
        {task.title}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {task.labels?.slice(0, 2).map(l => <LabelChip key={l} labelId={l} />)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: BOLD.inkFaint, fontWeight: 500 }}>
        {subTotal > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Icon name="done" size={11} />{subDone}/{subTotal}
          </span>
        )}
        {task.deadline && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Icon name="calendar" size={11} />{fmtShort(task.deadline)}
          </span>
        )}
        {task.estimatedPomodoros > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Icon name="timer" size={11} />{task.estimatedPomodoros}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── CALENDAR VIEW ──────────────────────────────────────────────────────
function CalendarView({ tasks, onOpen, accent }) {
  const [month, setMonth] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const firstWeekday = (month.getDay() + 6) % 7; // make Monday = 0
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const monthName = month.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return (
    <div style={{ padding: '28px 36px', overflow: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{
            fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 32,
            letterSpacing: '-0.04em', margin: 0, color: BOLD.ink, textTransform: 'capitalize',
          }}>{monthName}</h1>
          <div style={{ fontSize: 13.5, color: BOLD.inkSoft, marginTop: 4 }}>
            {tasks.filter(t => t.deadline && t.deadline.getMonth() === month.getMonth()).length} görev bu ay
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={navBtn}>‹</button>
          <button onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
            style={{ ...navBtn, padding: '0 14px', fontSize: 12, fontWeight: 600, width: 'auto' }}>Bugün</button>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={navBtn}>›</button>
        </div>
      </div>

      <div style={{
        background: BOLD.surface, borderRadius: 'var(--radius, 14px)',
        border: `1px solid ${BOLD.line}`, overflow: 'hidden',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${BOLD.line}` }}>
          {dayNames.map(d => (
            <div key={d} style={{
              padding: '10px 12px', fontSize: 11, fontWeight: 700, color: BOLD.inkFaint,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(94px, 1fr)' }}>
          {Array.from({ length: totalCells }).map((_, i) => {
            const dayNum = i - firstWeekday + 1;
            const d = new Date(month.getFullYear(), month.getMonth(), dayNum);
            const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
            const isToday = inMonth && sameDay(d, today);
            const dayTasks = inMonth ? tasks.filter(t => t.deadline && sameDay(t.deadline, d)) : [];
            return (
              <div key={i} style={{
                borderRight: (i + 1) % 7 ? `1px solid ${BOLD.line}` : 'none',
                borderTop: i >= 7 ? `1px solid ${BOLD.line}` : 'none',
                padding: 8, opacity: inMonth ? 1 : 0.35,
                background: isToday ? accent + '10' : 'transparent',
                position: 'relative', display: 'flex', flexDirection: 'column',
                minHeight: 0, overflow: 'hidden',
              }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: '50%',
                  background: isToday ? accent : 'transparent',
                  color: isToday ? '#fff' : BOLD.ink,
                  fontSize: 12, fontWeight: isToday ? 700 : 600, marginBottom: 4,
                  fontVariantNumeric: 'tabular-nums',
                }}>{inMonth ? dayNum : ''}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden' }}>
                  {dayTasks.slice(0, 3).map(t => {
                    const p = getProject(t.project);
                    return (
                      <div key={t.id} onClick={(e) => { e.stopPropagation(); onOpen?.(t); }}
                        style={{
                          fontSize: 10.5, fontWeight: 600, padding: '2px 6px',
                          borderRadius: 3, background: p.color + '20', color: p.color,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          cursor: 'pointer', textDecoration: t.status === 'done' ? 'line-through' : 'none',
                          opacity: t.status === 'done' ? 0.55 : 1,
                          borderLeft: `2px solid ${p.color}`,
                        }}>{t.title}</div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div style={{ fontSize: 10, color: BOLD.inkFaint, fontWeight: 600, padding: '0 6px' }}>
                      +{dayTasks.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
const navBtn = {
  width: 32, height: 32, borderRadius: 8, border: `1px solid ${BOLD.line}`,
  background: BOLD.surface, color: BOLD.ink, cursor: 'pointer', fontSize: 16,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
};

// ─── STATS VIEW ─────────────────────────────────────────────────────────
function StatsView({ tasks, accent }) {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
  const overdue = tasks.filter(t => t.deadline && t.deadline < today && t.status !== 'done').length;
  const streak = 12;
  const pomos = tasks.reduce((s, t) => s + (t.completedPomodoros || 0), 0);

  // Last 7 days completion
  const week = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(today, i - 6);
    const c = tasks.filter(t => t.completedAt && sameDay(t.completedAt, d)).length;
    return { d, c };
  });
  const maxWeek = Math.max(...week.map(w => w.c), 4);

  // by project
  const byProject = PROJECTS.map(p => ({
    p,
    done: tasks.filter(t => t.project === p.id && t.status === 'done').length,
    total: tasks.filter(t => t.project === p.id).length,
  }));

  return (
    <div style={{ padding: '28px 36px', overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 32,
          letterSpacing: '-0.04em', margin: 0, color: BOLD.ink,
        }}>İstatistikler</h1>
        <div style={{ fontSize: 13.5, color: BOLD.inkSoft, marginTop: 4 }}>
          Son 30 günün özeti
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Tamamlanma" value={completionRate} unit="%" color={accent} icon="done" />
        <StatCard label="Üst üste" value={streak} unit="gün" color="#FF9500" icon="fire" big />
        <StatCard label="Pomodoro" value={pomos} unit="seans" color="#3D5AFE" icon="timer" />
        <StatCard label="Geciken" value={overdue} unit="görev" color={BOLD.high} icon="bell" />
      </div>

      {/* Weekly bar chart */}
      <div style={{
        background: BOLD.surface, border: `1px solid ${BOLD.line}`,
        borderRadius: 'var(--radius, 14px)', padding: 20, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{
              fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 17,
              letterSpacing: '-0.02em', margin: 0, color: BOLD.ink,
            }}>Haftalık tempo</h3>
            <div style={{ fontSize: 12, color: BOLD.inkFaint, marginTop: 2 }}>Tamamlanan görevler · son 7 gün</div>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: BOLD.inkSoft, fontWeight: 600 }}>
            {week.reduce((s, w) => s + w.c, 0)} toplam
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, alignItems: 'end', height: 180 }}>
          {week.map((w, i) => {
            const h = (w.c / maxWeek) * 150;
            const isToday = sameDay(w.d, today);
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: BOLD.inkSoft }}>{w.c || ''}</div>
                <div style={{
                  width: '100%', height: Math.max(h, 4), borderRadius: 6,
                  background: isToday ? accent : (i % 2 ? '#8B5CF6' : '#3D5AFE'),
                  opacity: w.c === 0 ? 0.15 : 1,
                  transition: 'all 0.3s',
                }} />
                <div style={{ fontSize: 11, color: BOLD.inkFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {w.d.toLocaleDateString('tr-TR', { weekday: 'short' }).slice(0, 3)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project completion */}
      <div style={{
        background: BOLD.surface, border: `1px solid ${BOLD.line}`,
        borderRadius: 'var(--radius, 14px)', padding: 20, marginBottom: 16,
      }}>
        <h3 style={{
          fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 17,
          letterSpacing: '-0.02em', margin: 0, color: BOLD.ink, marginBottom: 14,
        }}>Proje ilerlemesi</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {byProject.map(({ p, done, total }) => {
            const pct = total > 0 ? (done / total) * 100 : 0;
            return (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 70px', gap: 14, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: BOLD.ink }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color }} />
                  {p.name}
                </div>
                <div style={{ height: 8, background: BOLD.line, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: pct + '%', height: '100%', background: p.color, transition: 'width 0.4s', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: BOLD.inkSoft, textAlign: 'right' }}>
                  {done}/{total} · {Math.round(pct)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ height: 40 }} />
    </div>
  );
}

function StatCard({ label, value, unit, color, icon, big }) {
  return (
    <div style={{
      background: BOLD.surface, border: `1px solid ${BOLD.line}`,
      borderRadius: 'var(--radius, 14px)', padding: 18, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -10, right: -10, width: 56, height: 56,
        borderRadius: '50%', background: color, opacity: 0.1,
      }} />
      <div style={{ color, marginBottom: 12 }}><Icon name={icon} size={18} stroke={2} /></div>
      <div style={{
        fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700,
        fontSize: 36, letterSpacing: '-0.04em', color: BOLD.ink, lineHeight: 1,
      }}>{value}<span style={{ fontSize: 16, color: BOLD.inkFaint, fontWeight: 600, marginLeft: 4 }}>{unit}</span></div>
      <div style={{ fontSize: 12, fontWeight: 600, color: BOLD.inkSoft, marginTop: 6, letterSpacing: '-0.01em' }}>{label}</div>
    </div>
  );
}

// ─── COMPLETED VIEW ─────────────────────────────────────────────────────
function CompletedView({ tasks, actions, onOpen, density, cardStyle }) {
  const done = tasks.filter(t => t.status === 'done').sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  const grouped = {};
  done.forEach(t => {
    const k = t.completedAt ? isoKey(t.completedAt) : 'no-date';
    (grouped[k] ||= []).push(t);
  });
  const keys = Object.keys(grouped).sort().reverse();

  return (
    <div style={{ padding: '28px 36px', overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 32,
          letterSpacing: '-0.04em', margin: 0, color: BOLD.ink,
        }}>Tamamlananlar</h1>
        <div style={{ fontSize: 13.5, color: BOLD.inkSoft, marginTop: 4 }}>
          Toplam <b style={{ color: BOLD.ink }}>{done.length}</b> görev tamamlandı 🎉
        </div>
      </div>

      {keys.map(k => {
        const d = new Date(k);
        const label = sameDay(d, today) ? 'Bugün' :
          sameDay(d, addDays(today, -1)) ? 'Dün' : fmtTR(d);
        return (
          <Section key={k} title={label} count={grouped[k].length}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {grouped[k].map(t => <TaskRow key={t.id} task={t} onToggle={actions.toggle} onOpen={onOpen} density={density} cardStyle={cardStyle} />)}
            </div>
          </Section>
        );
      })}
      {done.length === 0 && <EmptyState text="Henüz tamamlanan görev yok." />}
      <div style={{ height: 40 }} />
    </div>
  );
}

// ─── ADD TASK MODAL ─────────────────────────────────────────────────────
function AddTaskModal({ onClose, onSave, accent }) {
  const [title, setTitle] = React.useState('');
  const [project, setProject] = React.useState('website');
  const [priority, setPriority] = React.useState('medium');
  const [labels, setLabels] = React.useState([]);
  const [deadline, setDeadline] = React.useState('today');
  const [notes, setNotes] = React.useState('');
  const inputRef = React.useRef(null);
  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => {
    if (!title.trim()) return;
    const dl = deadline === 'today' ? today : deadline === 'tomorrow' ? addDays(today, 1) : addDays(today, 7);
    onSave({ title: title.trim(), project, priority, labels, deadline: dl, notes });
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(20,18,15,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      backdropFilter: 'blur(6px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 560, background: BOLD.surface, borderRadius: 'var(--radius, 18px)',
        boxShadow: '0 20px 60px rgba(0,0,0,.25)', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: BOLD.inkFaint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <Icon name="sparkle" size={12} /> Yeni görev
            </div>
            <button onClick={onClose} style={{
              width: 28, height: 28, borderRadius: 8, border: 'none',
              background: BOLD.line, color: BOLD.inkSoft, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon name="x" size={12} /></button>
          </div>
          <input
            ref={inputRef}
            value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Görev başlığı..."
            style={{
              width: '100%', border: 'none', outline: 'none', padding: '14px 0 8px',
              fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700,
              fontSize: 24, letterSpacing: '-0.03em', color: BOLD.ink,
              background: 'transparent',
            }}
          />
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Not ekle (opsiyonel)..."
            rows={2}
            style={{
              width: '100%', border: 'none', outline: 'none', resize: 'none',
              fontSize: 13.5, color: BOLD.inkSoft, fontFamily: 'inherit',
              background: 'transparent', padding: '4px 0 12px',
            }}
          />
        </div>

        <div style={{ padding: '0 24px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Deadline */}
          <PickerGroup label="Son tarih">
            {[
              { v: 'today', n: 'Bugün' },
              { v: 'tomorrow', n: 'Yarın' },
              { v: 'week', n: '+7 gün' },
            ].map(o => (
              <Chip key={o.v} active={deadline === o.v} onClick={() => setDeadline(o.v)}>{o.n}</Chip>
            ))}
          </PickerGroup>

          <PickerGroup label="Öncelik">
            {Object.entries(PRIORITY_META).map(([k, m]) => (
              <Chip key={k} active={priority === k} onClick={() => setPriority(k)} color={m.color}>{m.name}</Chip>
            ))}
          </PickerGroup>
        </div>

        <div style={{ padding: '0 24px 12px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: BOLD.inkFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Proje</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PROJECTS.map(p => (
              <Chip key={p.id} active={project === p.id} onClick={() => setProject(p.id)} color={p.color}>{p.name}</Chip>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 24px 12px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: BOLD.inkFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Etiketler</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {LABELS.map(l => {
              const on = labels.includes(l.id);
              return (
                <button key={l.id} onClick={() => setLabels(on ? labels.filter(x => x !== l.id) : [...labels, l.id])}
                  style={{
                    padding: '4px 9px', borderRadius: 999,
                    border: `1px solid ${on ? l.color : BOLD.line}`,
                    background: on ? l.color + '20' : 'transparent',
                    color: on ? l.color : BOLD.inkSoft,
                    fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>#{l.name}</button>
              );
            })}
          </div>
        </div>

        <div style={{
          padding: '14px 24px', background: BOLD.lineSoft, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 11, color: BOLD.inkFaint, fontFamily: 'JetBrains Mono, monospace' }}>
            <kbd style={kbd}>↵</kbd> kaydet · <kbd style={kbd}>Esc</kbd> iptal
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{
              padding: '8px 14px', borderRadius: 8, border: 'none',
              background: 'transparent', color: BOLD.inkSoft,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>İptal</button>
            <button onClick={submit} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: accent, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              letterSpacing: '-0.01em',
            }}>Görevi ekle</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const kbd = {
  display: 'inline-block', padding: '1px 5px', borderRadius: 3,
  background: '#fff', border: `1px solid ${BOLD.line}`, fontFamily: 'inherit', fontSize: 10,
};

function PickerGroup({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: BOLD.inkFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>{children}</div>
    </div>
  );
}

// ─── TASK DETAIL DRAWER ─────────────────────────────────────────────────
function TaskDetail({ task, onClose, actions, accent }) {
  if (!task) return null;
  const p = getProject(task.project);
  const done = task.status === 'done';
  const subDone = task.subtasks?.filter(s => s.done).length || 0;
  const subTotal = task.subtasks?.length || 0;

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 380,
      background: BOLD.surface, borderLeft: `1px solid ${BOLD.line}`,
      display: 'flex', flexDirection: 'column', zIndex: 50,
      boxShadow: '-12px 0 32px rgba(20,18,15,.06)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BOLD.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: BOLD.inkFaint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color }} />{p.name}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={detailIconBtn}><Icon name="edit" size={14} /></button>
          <button onClick={() => { actions.remove(task.id); onClose(); }} style={detailIconBtn}><Icon name="x" size={14} /></button>
          <button onClick={onClose} style={detailIconBtn}><Icon name="chevron" size={14} /></button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {/* Title + check */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          <Checkbox checked={done} onToggle={(e) => actions.toggle(task.id, e)} priority={task.priority} size={26} />
          <div style={{
            fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700,
            fontSize: 22, letterSpacing: '-0.03em', color: BOLD.ink, lineHeight: 1.2,
            flex: 1, textDecoration: done ? 'line-through' : 'none',
          }}>{task.title}</div>
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 16px', marginBottom: 20, fontSize: 13 }}>
          <DetailLabel>Öncelik</DetailLabel>
          <div><PriorityChip priority={task.priority} /></div>
          <DetailLabel>Son tarih</DetailLabel>
          <div style={{ color: BOLD.ink, fontWeight: 600 }}>
            {task.deadline ? (sameDay(task.deadline, today) ? 'Bugün' : fmtTR(task.deadline)) : '—'}
          </div>
          <DetailLabel>Etiketler</DetailLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {task.labels?.map(l => <LabelChip key={l} labelId={l} />) || '—'}
          </div>
          {task.recurring && (<>
            <DetailLabel>Tekrar</DetailLabel>
            <div style={{ color: BOLD.ink, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="repeat" size={13} />{task.recurring === 'weekly' ? 'Haftalık' : 'Aylık'}
            </div>
          </>)}
        </div>

        {/* Subtasks */}
        {subTotal > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: BOLD.ink, letterSpacing: '-0.01em' }}>Alt görevler</div>
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: BOLD.inkFaint }}>{subDone}/{subTotal}</div>
            </div>
            <div style={{ height: 4, background: BOLD.line, borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(subDone / subTotal) * 100}%`, background: accent, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {task.subtasks.map(st => (
                <div key={st.id} onClick={() => actions.toggleSubtask(task.id, st.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px',
                    borderRadius: 6, cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = BOLD.lineSoft}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}
                >
                  <Checkbox checked={st.done} size={16} onToggle={() => actions.toggleSubtask(task.id, st.id)} />
                  <span style={{
                    fontSize: 13, color: st.done ? BOLD.inkFaint : BOLD.ink,
                    textDecoration: st.done ? 'line-through' : 'none', fontWeight: 500,
                  }}>{st.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {task.notes && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: BOLD.ink, marginBottom: 8, letterSpacing: '-0.01em' }}>Notlar</div>
            <div style={{
              padding: 12, background: '#FFFCEC', borderRadius: 8,
              fontSize: 13, color: BOLD.ink, lineHeight: 1.5,
              border: '1px solid #F4ECC8',
            }}>{task.notes}</div>
          </div>
        )}

        {/* Pomodoro */}
        {task.estimatedPomodoros > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: BOLD.ink, marginBottom: 8, letterSpacing: '-0.01em' }}>Pomodoro</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: task.estimatedPomodoros }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 24, borderRadius: 4,
                  background: i < task.completedPomodoros ? accent : BOLD.line,
                  position: 'relative',
                }}>
                  {i < task.completedPomodoros && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11 }}>✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailLabel({ children }) {
  return <div style={{
    fontSize: 11, fontWeight: 700, color: BOLD.inkFaint,
    letterSpacing: '0.06em', textTransform: 'uppercase', paddingTop: 3,
  }}>{children}</div>;
}

const detailIconBtn = {
  width: 26, height: 26, borderRadius: 6, border: 'none',
  background: 'transparent', color: BOLD.inkSoft, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

Object.assign(window, {
  TodayView, AllTasksView, KanbanView, CalendarView, StatsView, CompletedView,
  AddTaskModal, TaskDetail, Section, EmptyState, Chip,
});
