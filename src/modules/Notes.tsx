import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  PlusCircle, Sun, Layers, Archive, Trash2, X,
  Calendar, Users, FileText, Search, RotateCw, BookOpen,
  Sparkles, Check,
} from 'lucide-react';
import { notesAPI, projectsAPI, tasksAPI, SupabaseNote, supabase } from '../api/supabase';

const EDGE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://wmkfrzfatvxzpyahkdai.supabase.co') + '/functions/v1/hyper-service';

// ── Types ─────────────────────────────────────────────────
interface Note {
  id: string;
  title: string;
  content: string;
  type: 'daily' | 'meeting' | 'free';
  projectId: string;
  date: string;
  archivedAt: string;
  createdAt: string;
  updatedAt: string;
}
interface Project { id: string; name: string; color?: string; }
interface AiTask { title: string; desc: string; priority: 'high'|'medium'|'low'; deadline: string|null; projectId: string|null; }
interface AiReminder { text: string; date: string|null; }

// ── Converters ────────────────────────────────────────────
const fromSB = (n: SupabaseNote): Note => ({
  id: n.id, title: n.title, content: n.content,
  type: n.type, projectId: n.project_id || '',
  date: n.note_date, archivedAt: n.archived_at || '',
  createdAt: n.created_at || '', updatedAt: n.updated_at || '',
});

// ── Design tokens (same BOLD system as Tasks) ─────────────
const B = {
  bg: '#FAF7F1', surface: '#FFFFFF', ink: '#16151A',
  soft: '#5A554E', faint: '#A8A39C', line: '#EDE7DC',
  lineSoft: '#F4EFE5', accent: '#FF5C5C',
};

const TYPE = {
  daily:   { label: 'Günlük',   color: '#FF9500', bg: '#FFF1DC', Icon: Sun },
  meeting: { label: 'Toplantı', color: '#3D5AFE', bg: '#E8EDFF', Icon: Users },
  free:    { label: 'Not',      color: '#6BBF8A', bg: '#E5F5EB', Icon: FileText },
} as const;

const PROJ_PALETTE = ['#FF5C8A','#3D5AFE','#8B5CF6','#6BBF8A','#FFB938','#FF7757','#0EA5E9','#EC4899'];
const projColor = (p: Project, i: number) => p.color ?? PROJ_PALETTE[i % PROJ_PALETTE.length];

const todayStr = () => new Date().toISOString().split('T')[0];
const fmtDate = (d: string) => {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  const t = todayStr();
  if (d === t) return 'Bugün';
  const y = new Date(todayStr() + 'T00:00:00');
  y.setDate(y.getDate() - 1);
  if (d === y.toISOString().split('T')[0]) return 'Dün';
  return dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: dt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
};

// ── TypeChip ──────────────────────────────────────────────
const TypeChip = ({ type, sm }: { type: Note['type']; sm?: boolean }) => {
  const m = TYPE[type];
  return (
    <span className="inline-flex items-center gap-1 font-semibold whitespace-nowrap"
      style={{ padding: sm ? '2px 7px' : '3px 9px', borderRadius: 999, fontSize: sm ? 10 : 11, background: m.bg, color: m.color }}>
      <m.Icon size={sm ? 9 : 10} strokeWidth={2.5} />
      {m.label}
    </span>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────
type NavView = 'today' | 'all' | 'archive';

export const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [archived, setArchived] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<NavView>('today');
  const [typeFilter, setTypeFilter] = useState<'all' | Note['type']>('all');
  const [projFilter, setProjFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [createError, setCreateError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTasks, setAiTasks] = useState<AiTask[]>([]);
  const [aiReminders, setAiReminders] = useState<AiReminder[]>([]);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [selectedAiTasks, setSelectedAiTasks] = useState<Set<number>>(new Set());
  const [selectedAiReminders, setSelectedAiReminders] = useState<Set<number>>(new Set());
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Load ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [sbnotes, sbarc, sbprojs] = await Promise.all([
        notesAPI.getAll(),
        notesAPI.getArchived(),
        projectsAPI.getAll(),
      ]);
      setNotes(sbnotes.map(fromSB));
      setArchived(sbarc.map(fromSB));
      setProjects(sbprojs.map(p => ({ id: p.id, name: p.name })));
      setLoading(false);
    })();
  }, []);

  // ── List ──────────────────────────────────────────────
  const listNotes = useMemo(() => {
    const pool = view === 'archive' ? archived : notes;
    return pool.filter(n => {
      if (view === 'today' && n.date !== todayStr()) return false;
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      if (projFilter !== 'all' && n.projectId !== projFilter) return false;
      if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.content.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [notes, archived, view, typeFilter, projFilter, search]);

  const selectedNote = useMemo(() => {
    const pool = view === 'archive' ? archived : notes;
    return pool.find(n => n.id === selectedId) ?? null;
  }, [notes, archived, selectedId, view]);

  // ── Beforeunload guard ────────────────────────────────
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [saveStatus]);

  // ── Auto-save ─────────────────────────────────────────
  const scheduleAutoSave = useCallback((id: string, updates: Partial<SupabaseNote>) => {
    clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    saveTimer.current = setTimeout(async () => {
      const ok = await notesAPI.update(id, updates);
      if (ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('idle');
        setCreateError('Kayıt başarısız — ağ bağlantısını kontrol edin.');
      }
    }, 1200);
  }, []);

  const updateField = useCallback((field: keyof Note, value: string) => {
    if (!selectedId) return;
    const sbKey: Record<string, string> = { title: 'title', content: 'content', type: 'type', projectId: 'project_id', date: 'note_date' };
    setNotes(prev => prev.map(n => n.id === selectedId ? { ...n, [field]: value } : n));
    setArchived(prev => prev.map(n => n.id === selectedId ? { ...n, [field]: value } : n));
    scheduleAutoSave(selectedId, { [sbKey[field] ?? field]: value });
  }, [selectedId, scheduleAutoSave]);

  // ── Create ────────────────────────────────────────────
  const createNote = async (type: Note['type'] = 'free') => {
    setCreateError('');
    const created = await notesAPI.insert({ title: '', content: '', type, note_date: todayStr(), project_id: undefined });
    if (!created) {
      setCreateError('Not oluşturulamadı. Supabase migration_v25 çalıştırıldı mı?');
      return;
    }
    const note = fromSB(created);
    setNotes(prev => [note, ...prev]);
    setSelectedId(note.id);
    setView('all');
  };

  const openToday = async () => {
    setView('today');
    setTypeFilter('all');
    setProjFilter('all');
    const todayDaily = notes.find(n => n.date === todayStr() && n.type === 'daily');
    if (todayDaily) { setSelectedId(todayDaily.id); return; }
    setCreateError('');
    const created = await notesAPI.insert({ title: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }), content: '', type: 'daily', note_date: todayStr(), project_id: undefined });
    if (!created) { setCreateError('Not oluşturulamadı. Supabase migration_v25 çalıştırıldı mı?'); return; }
    const note = fromSB(created);
    setNotes(prev => [note, ...prev]);
    setSelectedId(note.id);
  };

  // ── AI Analysis ───────────────────────────────────────
  const analyzeNote = async () => {
    if (!selectedNote?.content?.trim()) return;
    setAiLoading(true);
    setCreateError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_H3QZ8w1SForuOFFsJzYwVQ_RFtjNu6L';
      const authToken = session?.access_token ?? anonKey;
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          noteContent: selectedNote.content,
          noteTitle: selectedNote.title,
          projects: projectsWithColor.map(p => ({ id: p.id, name: p.name })),
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(`HTTP ${res.status} | ${JSON.stringify(errBody)}`);
      }
      const result = await res.json();
      const tasks: AiTask[] = (result.tasks || []).map((t: string | AiTask) =>
        typeof t === 'string' ? { title: t, desc: '', priority: 'medium' as const, deadline: null, projectId: null } : t
      );
      const reminders: AiReminder[] = (result.reminders || []).map((r: string | AiReminder) =>
        typeof r === 'string' ? { text: r, date: null } : r
      );
      setAiTasks(tasks);
      setAiReminders(reminders);
      setSelectedAiTasks(new Set(tasks.map((_, i) => i)));
      setSelectedAiReminders(new Set(reminders.map((_, i) => i)));
      setAiPanelOpen(true);
    } catch (err: any) {
      setCreateError('AI analiz başarısız: ' + (err?.message || 'bilinmeyen hata'));
    } finally {
      setAiLoading(false);
    }
  };

  const applySelected = async () => {
    const tasksToCreate = aiTasks.filter((_, i) => selectedAiTasks.has(i));
    for (const t of tasksToCreate) {
      await tasksAPI.insert({
        id: crypto.randomUUID(),
        title: t.title,
        description: t.desc || '',
        priority: t.priority || 'medium',
        deadline: t.deadline || undefined,
        project_id: t.projectId || undefined,
        module_ref: 'genel',
        status: 'todo',
        source: 'local',
      });
    }
    const remindersToCreate = aiReminders.filter((_, i) => selectedAiReminders.has(i));
    for (const r of remindersToCreate) {
      await notesAPI.insert({ title: r.text, content: '', type: 'free', note_date: r.date || todayStr(), project_id: undefined });
    }
    const newNotes = await notesAPI.getAll();
    setNotes(newNotes.map(fromSB));
    setAiPanelOpen(false);
    setAiTasks([]); setAiReminders([]);
  };

  // ── Archive / Delete ──────────────────────────────────
  const toggleArchive = async (n: Note) => {
    const now = new Date().toISOString();
    if (n.archivedAt) {
      await notesAPI.update(n.id, { archived_at: undefined });
      const updated = { ...n, archivedAt: '' };
      setArchived(prev => prev.filter(x => x.id !== n.id));
      setNotes(prev => [updated, ...prev]);
      setSelectedId(updated.id);
      setView('all');
    } else {
      await notesAPI.update(n.id, { archived_at: now });
      const updated = { ...n, archivedAt: now };
      setNotes(prev => prev.filter(x => x.id !== n.id));
      setArchived(prev => [updated, ...prev]);
      if (selectedId === n.id) setSelectedId(null);
    }
  };

  const deleteNote = async (n: Note) => {
    if (!confirm(`"${n.title || 'Başlıksız Not'}" silinecek. Emin misiniz?`)) return;
    await notesAPI.delete(n.id);
    setNotes(prev => prev.filter(x => x.id !== n.id));
    setArchived(prev => prev.filter(x => x.id !== n.id));
    if (selectedId === n.id) setSelectedId(null);
  };

  // ── Counts ────────────────────────────────────────────
  const todayCount = notes.filter(n => n.date === todayStr()).length;

  const navItems: { id: NavView; label: string; Icon: React.ElementType; count?: number }[] = [
    { id: 'today',   label: 'Bugün',       Icon: Sun,     count: todayCount },
    { id: 'all',     label: 'Tüm Notlar',  Icon: Layers,  count: notes.length },
    { id: 'archive', label: 'Arşiv',       Icon: Archive, count: archived.length },
  ];

  const projectsWithColor = useMemo(() => projects.map((p, i) => ({ ...p, color: projColor(p, i) })), [projects]);

  // ── Render ────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-full gap-3">
      <RotateCw size={22} className="animate-spin" style={{ color: B.accent + '60' }} />
      <span className="text-[11px] font-bold uppercase tracking-[4px]" style={{ color: B.faint }}>Yükleniyor…</span>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden animate-fade-in" style={{ background: B.bg, fontFamily: 'Poppins,sans-serif' }}>

      {/* ── Error banner ─────────────────────────────────── */}
      {createError && (
        <div className="flex items-center justify-between px-5 py-2.5 flex-shrink-0" style={{ background: '#FFF1DC', borderBottom: `1px solid #FFB938`, color: '#92400E' }}>
          <span className="text-[12.5px] font-semibold">{createError}</span>
          <button onClick={() => setCreateError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', padding: 0 }}><X size={14} /></button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
      <aside className="flex flex-col flex-shrink-0" style={{ width: 200, borderRight: `1px solid ${B.line}`, padding: '20px 12px 16px', overflow: 'hidden' }}>

        {/* New Note buttons */}
        <button onClick={() => createNote('free')}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-1 text-[13px] font-semibold w-full transition-all hover:brightness-110"
          style={{ background: B.ink, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <PlusCircle size={14} strokeWidth={2.2} /> Yeni Not
        </button>
        <div className="grid grid-cols-2 gap-1 mb-4">
          <button onClick={() => createNote('daily')}
            className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: TYPE.daily.bg, color: TYPE.daily.color, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Sun size={10} /> Günlük
          </button>
          <button onClick={() => createNote('meeting')}
            className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: TYPE.meeting.bg, color: TYPE.meeting.color, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Users size={10} /> Toplantı
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-0.5 mb-3">
          {navItems.map(item => {
            const active = view === item.id;
            return (
              <button key={item.id}
                onClick={() => { if (item.id === 'today') openToday(); else { setView(item.id); } }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg w-full text-[13px] font-medium transition-all"
                style={{ background: active ? B.ink + '0D' : 'transparent', color: active ? B.ink : B.soft, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: active ? 600 : 500 }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = B.line + '80'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                <item.Icon size={14} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count != null && item.count > 0 && (
                  <span className="text-[10.5px] font-bold tabular-nums" style={{ fontFamily: 'JetBrains Mono,monospace', color: B.faint }}>{item.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Type filter */}
        <div className="text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 mb-1.5" style={{ color: B.faint }}>Tür</div>
        <div className="flex flex-col gap-0.5 mb-3">
          {([{ id: 'all', label: 'Hepsi' }, ...Object.entries(TYPE).map(([k, v]) => ({ id: k, label: v.label }))] as const).map(item => {
            const active = typeFilter === item.id;
            const meta = item.id !== 'all' ? TYPE[item.id as Note['type']] : null;
            return (
              <button key={item.id} onClick={() => setTypeFilter(item.id as typeof typeFilter)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium w-full transition-all"
                style={{ background: active ? (meta?.bg ?? B.ink + '0D') : 'transparent', color: active ? (meta?.color ?? B.ink) : B.soft, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = B.lineSoft; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                {meta && <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, display: 'inline-block', flexShrink: 0 }} />}
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Project filter */}
        {projectsWithColor.length > 0 && (
          <>
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 mb-1.5" style={{ color: B.faint }}>Proje</div>
            <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 custom-scrollbar">
              <button onClick={() => setProjFilter('all')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium w-full"
                style={{ background: projFilter === 'all' ? B.ink + '0D' : 'transparent', color: projFilter === 'all' ? B.ink : B.soft, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Tüm Projeler
              </button>
              {projectsWithColor.map(p => (
                <button key={p.id} onClick={() => setProjFilter(projFilter === p.id ? 'all' : p.id)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium w-full transition-all"
                  style={{ background: projFilter === p.id ? p.color + '15' : 'transparent', color: projFilter === p.id ? p.color : B.soft, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => { if (projFilter !== p.id) (e.currentTarget as HTMLButtonElement).style.background = B.line + '60'; }}
                  onMouseLeave={e => { if (projFilter !== p.id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: p.color, display: 'inline-block', flexShrink: 0 }} />
                  <span className="flex-1 text-left truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </aside>

      {/* ── NOTE LIST ────────────────────────────────────── */}
      <div className="flex flex-col flex-shrink-0" style={{ width: 272, borderRight: `1px solid ${B.line}`, background: B.surface }}>
        {/* Search */}
        <div className="p-3 flex-shrink-0" style={{ borderBottom: `1px solid ${B.line}` }}>
          <div className="relative">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Ara…" className="w-full pl-8 pr-3 py-2 rounded-xl text-[12px] outline-none"
              style={{ background: B.bg, border: `1px solid ${B.line}`, color: B.ink, fontFamily: 'inherit' }} />
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: B.faint }} />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ background: 'none', border: 'none', cursor: 'pointer', color: B.faint, padding: 0 }}><X size={12} /></button>}
          </div>
        </div>

        {/* Note cards */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {listNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
              <BookOpen size={32} style={{ color: B.line }} />
              <p className="text-[12.5px]" style={{ color: B.faint }}>
                {view === 'today' ? 'Bugün için not yok.' : view === 'archive' ? 'Arşiv boş.' : 'Not bulunamadı.'}
              </p>
              {view === 'today' && (
                <button onClick={() => createNote('daily')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold"
                  style={{ background: TYPE.daily.bg, color: TYPE.daily.color, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Sun size={12} /> Günlük not oluştur
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col p-2 gap-1">
              {listNotes.map(n => {
                const active = selectedId === n.id;
                const proj = projectsWithColor.find(p => p.id === n.projectId);
                const preview = n.content.split('\n').find(l => l.trim()) || '';
                return (
                  <button key={n.id} onClick={() => setSelectedId(n.id)}
                    className="w-full text-left rounded-xl px-3 py-3 transition-all"
                    style={{ background: active ? B.ink : 'transparent', border: `1px solid ${active ? B.ink : 'transparent'}`, cursor: 'pointer', fontFamily: 'inherit' }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = B.bg; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <TypeChip type={n.type} sm />
                      <span className="text-[10.5px] tabular-nums" style={{ color: active ? 'rgba(255,255,255,.5)' : B.faint, fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>{fmtDate(n.date)}</span>
                    </div>
                    <div className="text-[13px] font-semibold leading-snug truncate" style={{ color: active ? '#fff' : B.ink, letterSpacing: '-0.01em' }}>
                      {n.title || <span style={{ opacity: 0.4 }}>Başlıksız Not</span>}
                    </div>
                    {preview && <div className="text-[11.5px] mt-0.5 truncate" style={{ color: active ? 'rgba(255,255,255,.55)' : B.faint }}>{preview}</div>}
                    {proj && <div className="flex items-center gap-1 mt-1.5"><span style={{ width: 6, height: 6, borderRadius: 2, background: active ? '#fff' : proj.color, display: 'inline-block' }} /><span className="text-[10.5px] font-medium truncate" style={{ color: active ? 'rgba(255,255,255,.6)' : B.soft }}>{proj.name}</span></div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── EDITOR + AI PANEL ───────────────────────────── */}
      <main className="flex-1 min-w-0 flex overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {selectedNote ? (
          <>
            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-8 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${B.line}`, background: B.surface }}>
              {/* Type selector */}
              <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: B.bg, border: `1px solid ${B.line}` }}>
                {(Object.entries(TYPE) as [Note['type'], typeof TYPE[Note['type']]][]).map(([k, m]) => (
                  <button key={k} onClick={() => updateField('type', k)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all"
                    style={{ background: selectedNote.type === k ? m.color : 'transparent', color: selectedNote.type === k ? '#fff' : B.soft, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <m.Icon size={10} /> {m.label}
                  </button>
                ))}
              </div>

              {/* Date + Project */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} style={{ color: B.faint }} />
                  <input type="date" value={selectedNote.date} onChange={e => updateField('date', e.target.value)}
                    className="text-[12px] font-semibold outline-none rounded-lg px-2 py-1"
                    style={{ background: B.bg, border: `1px solid ${B.line}`, color: B.ink, fontFamily: 'inherit' }} />
                </div>
                {selectedNote.type === 'meeting' && (
                  <select value={selectedNote.projectId} onChange={e => updateField('projectId', e.target.value)}
                    className="text-[12px] font-semibold outline-none rounded-lg px-2 py-1 appearance-none"
                    style={{ background: B.bg, border: `1px solid ${B.line}`, color: B.ink, fontFamily: 'inherit', maxWidth: 140, cursor: 'pointer' }}>
                    <option value="">— Proje seç —</option>
                    {projectsWithColor.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}

                {/* Save indicator */}
                <span className="text-[10.5px] font-semibold tabular-nums transition-opacity"
                  style={{ color: saveStatus === 'saving' ? B.faint : '#22c55e', opacity: saveStatus === 'idle' ? 0 : 1, fontFamily: 'inherit' }}>
                  {saveStatus === 'saving' ? 'kaydediliyor…' : '✓ kaydedildi'}
                </span>

                {/* AI Analyse */}
                <button onClick={analyzeNote} disabled={aiLoading || !selectedNote.content.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                  style={{ background: aiPanelOpen ? B.accent : B.ink, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: !selectedNote.content.trim() ? 0.4 : 1 }}>
                  {aiLoading ? <RotateCw size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                  {aiLoading ? 'Analiz ediliyor…' : 'Analiz Et'}
                </button>

                {/* Actions */}
                <button onClick={() => toggleArchive(selectedNote)} title={selectedNote.archivedAt ? 'Arşivden çıkar' : 'Arşivle'}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
                  style={{ color: selectedNote.archivedAt ? B.accent : B.faint, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Archive size={14} />
                </button>
                <button onClick={() => deleteNote(selectedNote)} title="Sil"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                  style={{ color: B.faint, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="px-10 pt-8 pb-3 flex-shrink-0">
              <input
                value={selectedNote.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="Başlık…"
                className="w-full outline-none bg-transparent text-[28px] font-bold"
                style={{ fontFamily: 'Bricolage Grotesque,Poppins,sans-serif', letterSpacing: '-0.04em', color: B.ink, border: 'none' }}
              />
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <TypeChip type={selectedNote.type} />
                {selectedNote.date && <span className="text-[12px] font-medium" style={{ color: B.faint }}>{fmtDate(selectedNote.date)}</span>}
                {selectedNote.projectId && (() => {
                  const proj = projectsWithColor.find(p => p.id === selectedNote.projectId);
                  return proj ? <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: B.soft }}><span style={{ width: 7, height: 7, borderRadius: 2, background: proj.color, display: 'inline-block' }} />{proj.name}</span> : null;
                })()}
              </div>
              <div style={{ height: 1, background: B.line, marginTop: 16 }} />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-10 pb-10">
              <textarea
                value={selectedNote.content}
                onChange={e => updateField('content', e.target.value)}
                placeholder="Yazmaya başla…"
                className="w-full h-full outline-none bg-transparent resize-none min-h-[400px]"
                style={{ fontFamily: 'inherit', fontSize: 15, lineHeight: 1.75, color: B.soft, border: 'none', letterSpacing: '-0.005em' }}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: B.lineSoft }}>
              <BookOpen size={28} style={{ color: B.faint }} />
            </div>
            <div className="text-center">
              <div className="text-[16px] font-semibold" style={{ color: B.ink }}>Bir not seç</div>
              <div className="text-[13px] mt-1" style={{ color: B.faint }}>veya yeni bir not oluştur</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => createNote('daily')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold"
                style={{ background: TYPE.daily.bg, color: TYPE.daily.color, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Sun size={13} /> Günlük
              </button>
              <button onClick={() => createNote('meeting')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold"
                style={{ background: TYPE.meeting.bg, color: TYPE.meeting.color, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Users size={13} /> Toplantı
              </button>
              <button onClick={() => createNote('free')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold"
                style={{ background: TYPE.free.bg, color: TYPE.free.color, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <FileText size={13} /> Serbest
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── AI PANEL ─────────────────────────────────────── */}
      {aiPanelOpen && (
        <div className="flex flex-col flex-shrink-0" style={{ width: 340, borderLeft: `1px solid ${B.line}`, background: B.surface, overflow: 'hidden' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${B.line}`, background: B.ink }}>
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: B.accent }} />
              <span className="text-[13px] font-bold" style={{ color: '#fff', letterSpacing: '-0.01em' }}>AI Önerileri</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', fontFamily: 'JetBrains Mono,monospace' }}>
                {selectedAiTasks.size + selectedAiReminders.size} seçili
              </span>
            </div>
            <button onClick={() => setAiPanelOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.5)', padding: 4 }}><X size={14} /></button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">

            {/* Tasks */}
            {aiTasks.length > 0 && (
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.1em] mb-2" style={{ color: B.faint }}>Görevler — {aiTasks.length}</div>
                <div className="space-y-2">
                  {aiTasks.map((t, i) => {
                    const checked = selectedAiTasks.has(i);
                    const proj = projectsWithColor.find(p => p.id === t.projectId);
                    const prioColor = { high: '#FF3B30', medium: '#FF9500', low: '#6BBF8A' }[t.priority || 'medium'];
                    return (
                      <button key={i} onClick={() => setSelectedAiTasks(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; })}
                        className="w-full text-left rounded-xl p-3 transition-all"
                        style={{ background: checked ? B.ink + '08' : B.bg, border: `1.5px solid ${checked ? B.ink + '30' : B.line}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <div className="flex items-start gap-2.5">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5"
                            style={{ borderColor: checked ? B.ink : B.line, background: checked ? B.ink : 'transparent' }}>
                            {checked && <Check size={10} strokeWidth={3} style={{ color: '#fff' }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold leading-snug" style={{ color: B.ink }}>{t.title}</div>
                            {t.desc && <div className="text-[11.5px] mt-0.5 line-clamp-2" style={{ color: B.soft }}>{t.desc}</div>}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span style={{ fontSize: 10, fontWeight: 700, color: prioColor, background: prioColor + '18', padding: '1px 6px', borderRadius: 999 }}>
                                {t.priority === 'high' ? 'Yüksek' : t.priority === 'low' ? 'Düşük' : 'Orta'}
                              </span>
                              {t.deadline && <span className="text-[10.5px] font-medium" style={{ color: B.faint }}>{t.deadline}</span>}
                              {proj && <span className="text-[10.5px] font-medium flex items-center gap-1" style={{ color: B.soft }}><span style={{ width: 6, height: 6, borderRadius: 2, background: proj.color, display: 'inline-block' }} />{proj.name}</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reminders */}
            {aiReminders.length > 0 && (
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.1em] mb-2" style={{ color: B.faint }}>Hatırlatmalar — {aiReminders.length}</div>
                <div className="space-y-2">
                  {aiReminders.map((r, i) => {
                    const checked = selectedAiReminders.has(i);
                    return (
                      <button key={i} onClick={() => setSelectedAiReminders(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; })}
                        className="w-full text-left rounded-xl p-3 transition-all"
                        style={{ background: checked ? '#FFF1DC' : B.bg, border: `1.5px solid ${checked ? '#FF9500' : B.line}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <div className="flex items-start gap-2.5">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5"
                            style={{ borderColor: checked ? '#FF9500' : B.line, background: checked ? '#FF9500' : 'transparent' }}>
                            {checked && <Check size={10} strokeWidth={3} style={{ color: '#fff' }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold leading-snug" style={{ color: B.ink }}>{r.text}</div>
                            {r.date && <div className="text-[10.5px] mt-1 font-medium" style={{ color: B.faint }}>{r.date}</div>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {aiTasks.length === 0 && aiReminders.length === 0 && (
              <div className="text-center py-8">
                <div className="text-[13px]" style={{ color: B.faint }}>Bu notta görev veya hatırlatma bulunamadı.</div>
              </div>
            )}
          </div>

          {/* Footer */}
          {(aiTasks.length > 0 || aiReminders.length > 0) && (
            <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${B.line}` }}>
              <button onClick={applySelected}
                disabled={selectedAiTasks.size + selectedAiReminders.size === 0}
                className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
                style={{ background: B.ink, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: selectedAiTasks.size + selectedAiReminders.size === 0 ? 0.4 : 1 }}>
                <Check size={14} strokeWidth={2.5} />
                {selectedAiTasks.size} görev + {selectedAiReminders.size} hatırlatma ekle
              </button>
              <button onClick={() => setAiPanelOpen(false)}
                className="w-full py-2 mt-2 text-[11px] font-semibold"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: B.faint, fontFamily: 'inherit' }}>
                Vazgeç
              </button>
            </div>
          )}
        </div>
      )}

      </main>
      </div>
    </div>
  );
};
