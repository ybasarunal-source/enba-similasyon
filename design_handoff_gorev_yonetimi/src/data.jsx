// Shared task data + helpers for all prototype variations.
// All state lives in window.__taskStore so variations can mount independently.

const PROJECTS = [
  { id: 'website',  name: 'Website 3.0',     color: '#FF5C8A', emoji: '◐' },
  { id: 'mobile',   name: 'Mobil Uygulama',  color: '#3D5AFE', emoji: '◑' },
  { id: 'brand',    name: 'Marka Kimliği',   color: '#8B5CF6', emoji: '◓' },
  { id: 'research', name: 'Kullanıcı Araştırması', color: '#6BBF8A', emoji: '◒' },
  { id: 'personal', name: 'Kişisel',         color: '#FFB938', emoji: '◐' },
];

const LABELS = [
  { id: 'design',   name: 'tasarım',    color: '#FF5C8A' },
  { id: 'eng',      name: 'mühendislik', color: '#3D5AFE' },
  { id: 'meeting',  name: 'toplantı',   color: '#FFB938' },
  { id: 'focus',    name: 'derin iş',   color: '#8B5CF6' },
  { id: 'quick',    name: 'hızlı iş',   color: '#6BBF8A' },
  { id: 'review',   name: 'inceleme',   color: '#FF7757' },
];

// Categories = life areas
const AREAS = [
  { id: 'work',    name: 'İş',       color: '#3D5AFE', icon: '◆' },
  { id: 'health',  name: 'Sağlık',   color: '#6BBF8A', icon: '✚' },
  { id: 'home',    name: 'Ev',       color: '#FFB938', icon: '⌂' },
  { id: 'learn',   name: 'Öğrenme',  color: '#8B5CF6', icon: '★' },
];

// Status states for kanban
const STATUSES = [
  { id: 'backlog',  name: 'Yapılacak',  emoji: '○' },
  { id: 'active',   name: 'Devam Eden', emoji: '◐' },
  { id: 'review',   name: 'İncelemede', emoji: '◑' },
  { id: 'done',     name: 'Bitti',      emoji: '●' },
];

// Date helpers
const today = new Date(2026, 4, 11); // May 11, 2026 — Monday
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const fmtTR = (d) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
const fmtShort = (d) => d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isoKey = (d) => d.toISOString().slice(0, 10);

// Seed tasks. Mix of complete/incomplete, priorities, projects, dates.
const SEED_TASKS = [
  {
    id: 't1', title: 'Tasarım sistemini Q2 için güncelle',
    project: 'brand', labels: ['design', 'focus'], area: 'work',
    priority: 'high', status: 'active', deadline: addDays(today, 0),
    subtasks: [
      { id: 's1', text: 'Renk paletini yenile', done: true },
      { id: 's2', text: 'Tipografi ölçeğini revize et', done: true },
      { id: 's3', text: 'Komponent dokümantasyonu', done: false },
      { id: 's4', text: 'Token isimlendirme', done: false },
    ],
    notes: 'Ana hedef: tutarlı bir token sistemi + dark mode varyantları. Eski sistemden 4 ay sonra güncelleme zamanı.',
    estimatedPomodoros: 4, completedPomodoros: 2,
    createdAt: addDays(today, -5),
  },
  {
    id: 't2', title: 'Müşteri sunumu için son slaytları hazırla',
    project: 'website', labels: ['design', 'meeting'], area: 'work',
    priority: 'high', status: 'active', deadline: addDays(today, 0),
    subtasks: [], notes: '14:00 toplantısı için. Maks 12 slayt.',
    estimatedPomodoros: 2, completedPomodoros: 1,
    createdAt: addDays(today, -1),
  },
  {
    id: 't3', title: 'Kullanıcı görüşmesi · Aylin K.',
    project: 'research', labels: ['meeting'], area: 'work',
    priority: 'medium', status: 'active', deadline: addDays(today, 0),
    subtasks: [
      { id: 's5', text: 'Soruları gözden geçir', done: true },
      { id: 's6', text: 'Kayıt ekipmanını test et', done: false },
    ],
    notes: '11:00 · 45 dakika · Zoom',
    estimatedPomodoros: 1, completedPomodoros: 0,
    createdAt: addDays(today, -3),
  },
  {
    id: 't4', title: 'API endpoint dokümantasyonu',
    project: 'mobile', labels: ['eng', 'focus'], area: 'work',
    priority: 'medium', status: 'backlog', deadline: addDays(today, 1),
    subtasks: [], notes: '',
    estimatedPomodoros: 3, completedPomodoros: 0,
    createdAt: addDays(today, -2),
  },
  {
    id: 't5', title: 'Spor salonu · bacak günü',
    project: 'personal', labels: ['quick'], area: 'health',
    priority: 'low', status: 'backlog', deadline: addDays(today, 0),
    subtasks: [], notes: '', recurring: 'weekly',
    estimatedPomodoros: 0, completedPomodoros: 0,
    createdAt: addDays(today, -10),
  },
  {
    id: 't6', title: 'Onboarding akışı prototipi',
    project: 'mobile', labels: ['design'], area: 'work',
    priority: 'high', status: 'review', deadline: addDays(today, 2),
    subtasks: [
      { id: 's7', text: 'Welcome screen', done: true },
      { id: 's8', text: 'İzinler', done: true },
      { id: 's9', text: 'İlk görev kurulumu', done: true },
    ],
    notes: 'Ekipten geri bildirim bekliyor.',
    estimatedPomodoros: 5, completedPomodoros: 5,
    createdAt: addDays(today, -7),
  },
  {
    id: 't7', title: 'Logo varyasyonları · mono, renkli, beyaz',
    project: 'brand', labels: ['design'], area: 'work',
    priority: 'medium', status: 'review', deadline: addDays(today, 3),
    subtasks: [], notes: 'CEO onayı bekleniyor',
    estimatedPomodoros: 2, completedPomodoros: 2,
    createdAt: addDays(today, -4),
  },
  {
    id: 't8', title: 'Hafta sonu kitap okuma · 30 sayfa',
    project: 'personal', labels: ['quick'], area: 'learn',
    priority: 'low', status: 'backlog', deadline: addDays(today, 5),
    subtasks: [], notes: '"Designing Design" — Kenya Hara',
    estimatedPomodoros: 0, completedPomodoros: 0,
    createdAt: addDays(today, -1),
  },
  {
    id: 't9', title: 'Çamaşır + bulaşık',
    project: 'personal', labels: ['quick'], area: 'home',
    priority: 'low', status: 'backlog', deadline: addDays(today, 0),
    subtasks: [], notes: '', recurring: 'weekly',
    estimatedPomodoros: 0, completedPomodoros: 0,
    createdAt: addDays(today, -1),
  },
  {
    id: 't10', title: 'Sprint retrospektifi notları',
    project: 'website', labels: ['meeting', 'review'], area: 'work',
    priority: 'medium', status: 'done',
    completedAt: addDays(today, -1),
    deadline: addDays(today, -1),
    subtasks: [], notes: 'Ekibe gönderildi ✓',
    estimatedPomodoros: 1, completedPomodoros: 1,
    createdAt: addDays(today, -3),
  },
  {
    id: 't11', title: 'Stil rehberi v2 yayını',
    project: 'brand', labels: ['design'], area: 'work',
    priority: 'high', status: 'done',
    completedAt: addDays(today, -2),
    deadline: addDays(today, -2),
    subtasks: [], notes: '',
    estimatedPomodoros: 3, completedPomodoros: 3,
    createdAt: addDays(today, -8),
  },
  {
    id: 't12', title: 'Yeni komponent: DataTable',
    project: 'website', labels: ['eng', 'focus'], area: 'work',
    priority: 'medium', status: 'done',
    completedAt: addDays(today, -3),
    deadline: addDays(today, -3),
    subtasks: [], notes: '',
    estimatedPomodoros: 4, completedPomodoros: 4,
    createdAt: addDays(today, -10),
  },
  {
    id: 't13', title: 'Hisse senedi portföyünü gözden geçir',
    project: 'personal', labels: ['focus'], area: 'work',
    priority: 'low', status: 'backlog', deadline: addDays(today, 4),
    subtasks: [], notes: '', recurring: 'monthly',
    estimatedPomodoros: 1, completedPomodoros: 0,
    createdAt: addDays(today, -2),
  },
  {
    id: 't14', title: 'A/B testi sonuçlarını analiz et',
    project: 'website', labels: ['focus', 'review'], area: 'work',
    priority: 'high', status: 'active', deadline: addDays(today, 1),
    subtasks: [
      { id: 's10', text: 'Veri ihracı', done: true },
      { id: 's11', text: 'Tablo özeti', done: false },
      { id: 's12', text: 'Tavsiye dokümanı', done: false },
    ],
    notes: '14 günlük test, +12% conversion',
    estimatedPomodoros: 3, completedPomodoros: 1,
    createdAt: addDays(today, -6),
  },
  {
    id: 't15', title: 'Yeni stajyer onboarding planı',
    project: 'personal', labels: ['focus'], area: 'work',
    priority: 'medium', status: 'backlog', deadline: addDays(today, 2),
    subtasks: [], notes: '',
    estimatedPomodoros: 2, completedPomodoros: 0,
    createdAt: addDays(today, -1),
  },
];

// Derived helpers
const getProject = (id) => PROJECTS.find(p => p.id === id) || PROJECTS[0];
const getArea = (id) => AREAS.find(a => a.id === id) || AREAS[0];
const getLabel = (id) => LABELS.find(l => l.id === id);
const getStatus = (id) => STATUSES.find(s => s.id === id) || STATUSES[0];

const PRIORITY_META = {
  high:   { name: 'Yüksek', nameEn: 'High',   color: '#FF3B30', bg: '#FFE9E7' },
  medium: { name: 'Orta',   nameEn: 'Medium', color: '#FF9500', bg: '#FFF3DC' },
  low:    { name: 'Düşük',  nameEn: 'Low',    color: '#6BBF8A', bg: '#E5F5EB' },
};

// English translations (toggle via tweak)
const T = {
  tr: {
    today: 'Bugün', all: 'Tüm görevler', kanban: 'Kanban', calendar: 'Takvim',
    stats: 'İstatistikler', completed: 'Tamamlananlar',
    inbox: 'Gelen kutusu', projects: 'Projeler', labels: 'Etiketler', areas: 'Alanlar',
    search: 'Ara', newTask: 'Yeni görev', addTask: 'Görev ekle',
    priority: 'Öncelik', deadline: 'Son tarih', subtasks: 'Alt görevler', notes: 'Notlar',
    save: 'Kaydet', cancel: 'İptal', delete: 'Sil',
    high: 'Yüksek', medium: 'Orta', low: 'Düşük',
    focus: 'Odak', start: 'Başlat', pause: 'Duraklat', reset: 'Sıfırla',
    pomodoro: 'Pomodoro', minutes: 'dk',
    morning: 'Günaydın', afternoon: 'İyi günler', evening: 'İyi akşamlar',
    completed_today: 'bugün tamamlandı', overdue: 'gecikti', upcoming: 'yaklaşan',
    streak: 'gün üst üste', completion: 'tamamlanma',
  },
  en: {
    today: 'Today', all: 'All tasks', kanban: 'Kanban', calendar: 'Calendar',
    stats: 'Stats', completed: 'Completed',
    inbox: 'Inbox', projects: 'Projects', labels: 'Labels', areas: 'Areas',
    search: 'Search', newTask: 'New task', addTask: 'Add task',
    priority: 'Priority', deadline: 'Due', subtasks: 'Subtasks', notes: 'Notes',
    save: 'Save', cancel: 'Cancel', delete: 'Delete',
    high: 'High', medium: 'Medium', low: 'Low',
    focus: 'Focus', start: 'Start', pause: 'Pause', reset: 'Reset',
    pomodoro: 'Pomodoro', minutes: 'min',
    morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening',
    completed_today: 'completed today', overdue: 'overdue', upcoming: 'upcoming',
    streak: 'day streak', completion: 'completion',
  },
};

// Small useful icon set (line, 1.6 stroke, 16px) — inline SVG
const Icon = ({ name, size = 16, stroke = 1.6, style }) => {
  const paths = {
    inbox:    'M3 13l3-8h8l3 8M3 13v6h14v-6M3 13h4l1 2h4l1-2h4',
    today:    'M3 5h14v12H3zM3 9h14M7 3v4M13 3v4M10 13l-1.5-1.5M10 13l3-3',
    all:      'M3 5h14M3 10h14M3 15h14',
    kanban:   'M4 4h3v12H4zM8.5 4h3v8h-3zM13 4h3v6h-3z',
    calendar: 'M3 5h14v12H3zM3 9h14M7 3v4M13 3v4',
    stats:    'M3 16V8M8 16V4M13 16v-5M3 16h14',
    done:     'M3 10l4 4 10-10',
    search:   'M9 16a7 7 0 110-14 7 7 0 010 14zM14 14l4 4',
    plus:     'M10 4v12M4 10h12',
    timer:    'M10 3v3M6 6l-1.5-1.5M14 6l1.5-1.5M10 18a7 7 0 100-14 7 7 0 000 14zM10 10v-3M10 10l3 1',
    bell:     'M5 14V9a5 5 0 0110 0v5M3 14h14M8 17a2 2 0 004 0',
    flag:     'M5 17V3M5 3h10l-2 3 2 3H5',
    tag:      'M3 3h7l8 8-7 7-8-8V3zM6 6.5a.5.5 0 100-1 .5.5 0 000 1z',
    folder:   'M3 6a2 2 0 012-2h3l2 2h5a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V6z',
    chevron:  'M7 4l6 6-6 6',
    chevronD: 'M4 7l6 6 6-6',
    x:        'M5 5l10 10M15 5L5 15',
    repeat:   'M3 8l3-3 3 3M17 12l-3 3-3-3M6 5h7a4 4 0 014 4v1M14 15H7a4 4 0 01-4-4v-1',
    edit:     'M3 17l4-1 10-10-3-3L4 13l-1 4zM12 4l3 3',
    arrow:    'M4 10h12M12 6l4 4-4 4',
    star:     'M10 2l2.5 5.5L18 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L10 2z',
    sparkle:  'M10 2v5M10 13v5M2 10h5M13 10h5M5 5l3 3M15 5l-3 3M5 15l3-3M15 15l-3-3',
    fire:     'M10 18c4 0 6-3 6-6 0-2-1-4-3-5 1 3-1 4-1 4-1-3-3-5-3-9-3 2-5 5-5 9 0 4 3 7 6 7z',
    grip:     'M7 5h2v2H7zM11 5h2v2h-2zM7 9h2v2H7zM11 9h2v2h-2zM7 13h2v2H7zM11 13h2v2h-2z',
    moon:     'M16 11a7 7 0 11-9-9 5 5 0 009 9z',
    sun:      'M10 5V2M10 18v-3M15 10h3M2 10h3M14.5 5.5l2-2M3.5 16.5l2-2M14.5 14.5l2 2M3.5 3.5l2 2M10 14a4 4 0 100-8 4 4 0 000 8z',
  };
  const d = paths[name];
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style}>
      {d && <path d={d} />}
    </svg>
  );
};

// Confetti burst on task complete — simple physics, ~20 particles
function confettiBurst(x, y) {
  const colors = ['#FF5C8A', '#3D5AFE', '#C8F44C', '#FFB938', '#8B5CF6', '#6BBF8A', '#FF7757'];
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;left:${x}px;top:${y}px;width:8px;height:8px;
      background:${colors[i % colors.length]};
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      pointer-events:none;z-index:9999;
      transform:translate(-50%,-50%);
    `;
    document.body.appendChild(el);
    const angle = (Math.PI * 2 * i) / 22 + Math.random() * 0.3;
    const v = 80 + Math.random() * 120;
    const dx = Math.cos(angle) * v;
    const dy = Math.sin(angle) * v - 60;
    const rot = (Math.random() - 0.5) * 720;
    el.animate(
      [
        { transform: `translate(-50%,-50%) rotate(0deg)`, opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 80}px)) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)' }
    ).onfinish = () => el.remove();
  }
}

// Shared store using simple subscription pattern
function createTaskStore(seed) {
  let state = { tasks: seed.map(t => ({ ...t })), nextId: 100 };
  const listeners = new Set();
  return {
    get: () => state,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    update: (fn) => { state = fn(state); listeners.forEach(l => l(state)); },
  };
}

// Each prototype gets its OWN store so they can be manipulated independently
function useTaskStore(storeKey = 'default') {
  const stores = (window.__taskStores ||= {});
  if (!stores[storeKey]) stores[storeKey] = createTaskStore(SEED_TASKS);
  const store = stores[storeKey];
  const [state, setState] = React.useState(store.get());
  React.useEffect(() => store.subscribe(setState), [store]);

  const actions = React.useMemo(() => ({
    toggle: (id, fromEvent) => {
      store.update(s => ({
        ...s,
        tasks: s.tasks.map(t => {
          if (t.id !== id) return t;
          const wasDone = t.status === 'done';
          if (!wasDone && fromEvent) {
            const r = fromEvent.currentTarget?.getBoundingClientRect?.();
            if (r) confettiBurst(r.left + r.width / 2, r.top + r.height / 2);
          }
          return { ...t, status: wasDone ? 'backlog' : 'done',
            completedAt: wasDone ? undefined : today };
        })
      }));
    },
    setStatus: (id, status) => store.update(s => ({
      ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, status } : t)
    })),
    add: (task) => store.update(s => ({
      ...s,
      tasks: [{ id: `t${s.nextId}`, status: 'backlog', subtasks: [], notes: '',
        labels: [], area: 'work', estimatedPomodoros: 1, completedPomodoros: 0,
        createdAt: today, ...task }, ...s.tasks],
      nextId: s.nextId + 1,
    })),
    update: (id, patch) => store.update(s => ({
      ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, ...patch } : t)
    })),
    remove: (id) => store.update(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) })),
    toggleSubtask: (taskId, subId) => store.update(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id !== taskId ? t : {
        ...t,
        subtasks: t.subtasks.map(st => st.id !== subId ? st : { ...st, done: !st.done })
      })
    })),
  }), [store]);

  return [state.tasks, actions];
}

Object.assign(window, {
  PROJECTS, LABELS, AREAS, STATUSES, PRIORITY_META, T, SEED_TASKS,
  today, addDays, fmtTR, fmtShort, sameDay, isoKey,
  getProject, getArea, getLabel, getStatus,
  Icon, confettiBurst, useTaskStore,
});
