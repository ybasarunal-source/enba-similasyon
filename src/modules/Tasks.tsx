import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle, RotateCw, Calendar, Trash2, Pencil,
  RefreshCw, Download, Search, Check, Pin, Layers,
  Timer, Sun, X, CheckSquare, Kanban as KanbanIcon,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { microsoftService } from '../api/microsoft';
import { googleService } from '../api/google';
import { profileAPI, projectGroupsAPI, projectsAPI, tasksAPI, SupabaseTask } from '../api/supabase';

// ── Types ─────────────────────────────────────────────────────────────────
interface Task {
  id: string | number;
  title: string;
  desc: string;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  projectId: string;
  moduleRef: string;
  status: 'todo' | 'doing' | 'done';
  createdAt: string;
  source: 'local' | 'outlook' | 'google';
  msTodoId?: string;
  msListId?: string;
  gTaskId?: string;
  gListId?: string;
  isPinned?: boolean;
  completedAt?: string;
}
interface Project { id: string; name: string; groupId?: string; color?: string; }
interface ProjectGroup { id: string; name: string; }

const toSupabaseTask = (t: Task): SupabaseTask => ({ id: t.id.toString(), title: t.title, description: t.desc, priority: t.priority, deadline: t.deadline, project_id: t.projectId, module_ref: t.moduleRef, status: t.status, source: t.source, ms_todo_id: t.msTodoId, ms_list_id: t.msListId, g_task_id: t.gTaskId, g_list_id: t.gListId, is_pinned: t.isPinned });
const fromSupabaseTask = (t: SupabaseTask): Task => ({ id: t.id, title: t.title, desc: t.description || '', priority: t.priority as Task['priority'], deadline: t.deadline || '', projectId: t.project_id || '', moduleRef: t.module_ref || '', status: t.status as Task['status'], createdAt: t.created_at || '', source: t.source as Task['source'], msTodoId: t.ms_todo_id, msListId: t.ms_list_id, gTaskId: t.g_task_id, gListId: t.g_list_id, isPinned: t.is_pinned });

// ── Design tokens ─────────────────────────────────────────────────────────
const BOLD = { bg: '#FAF7F1', surface: '#FFFFFF', ink: '#16151A', inkSoft: '#5A554E', inkFaint: '#A8A39C', line: '#EDE7DC', lineSoft: '#F4EFE5', accent: '#FF5C5C' };
const PRIO: Record<string, { color: string; bg: string; name: string }> = {
  high:   { color: '#FF3B30', bg: '#FFE9E7', name: 'Yüksek' },
  medium: { color: '#FF9500', bg: '#FFF1DC', name: 'Orta' },
  low:    { color: '#6BBF8A', bg: '#E5F5EB', name: 'Düşük' },
};
const PROJ_PALETTE = ['#FF5C8A', '#3D5AFE', '#8B5CF6', '#6BBF8A', '#FFB938', '#FF7757', '#0EA5E9', '#EC4899'];
const projColor = (p: Project, idx: number) => p.color ?? PROJ_PALETTE[idx % PROJ_PALETTE.length];

// ── Date helpers ──────────────────────────────────────────────────────────
const todayDate = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
const sameDay = (a: Date, b: Date) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const fmtTR = (d: Date) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
const deadlineLabel = (deadline: string, done: boolean): { label: string; color: string } | null => {
  if (!deadline) return null;
  const d = new Date(deadline); d.setHours(0,0,0,0);
  const isOverdue = d < todayDate && !done;
  const isToday = sameDay(d, todayDate);
  const isTomorrow = sameDay(d, new Date(todayDate.getTime() + 86400000));
  return {
    label: isToday ? 'Bugün' : isTomorrow ? 'Yarın' : fmtTR(d),
    color: isOverdue ? '#FF3B30' : isToday ? '#FF9500' : BOLD.inkFaint,
  };
};

// ── UI: PriorityChip ──────────────────────────────────────────────────────
const PriorityChip = ({ priority, lg }: { priority: string; lg?: boolean }) => {
  const m = PRIO[priority]; if (!m) return null;
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold whitespace-nowrap"
      style={{ padding: lg ? '4px 10px' : '2px 8px', borderRadius: 999, fontSize: lg ? 12 : 11, background: m.bg, color: m.color }}>
      <span style={{ width: lg?7:6, height: lg?7:6, borderRadius:'50%', background: m.color, flexShrink: 0, display:'inline-block' }} />
      {m.name}
    </span>
  );
};

// ── UI: BoldCheckbox ──────────────────────────────────────────────────────
const BoldCheckbox = ({ checked, onToggle, priority, size = 22 }: { checked: boolean; onToggle: (e: React.MouseEvent) => void; priority?: string; size?: number }) => {
  const color = priority ? (PRIO[priority]?.color ?? BOLD.ink) : BOLD.ink;
  return (
    <button type="button" onClick={e => { e.stopPropagation(); onToggle(e); }}
      className="flex items-center justify-center flex-shrink-0 rounded-full transition-all duration-[180ms]"
      style={{ width: size, height: size, minWidth: size, border: `2px solid ${checked ? color : color+'70'}`, background: checked ? color : 'transparent', cursor: 'pointer' }}>
      {checked && <svg width={size*0.55} height={size*0.55} viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  );
};

// ── UI: TaskRow ───────────────────────────────────────────────────────────
interface RowActions { projects: Project[]; onToggle: (id: string|number, e: React.MouseEvent) => void; onOpen: (t: Task) => void; onPin: (id: string|number) => void; onDelete: (t: Task) => void; onEdit: (t: Task) => void; }
const TaskRow = ({ task, projects, onToggle, onOpen, onPin, onDelete, onEdit }: { task: Task } & RowActions) => {
  const pidx = projects.findIndex(p => p.id === task.projectId);
  const proj = pidx >= 0 ? projects[pidx] : null;
  const pc = proj ? projColor(proj, pidx) : '#94a3b8';
  const done = task.status === 'done';
  const dl = deadlineLabel(task.deadline, done);
  return (
    <div onClick={() => onOpen(task)}
      className="group flex items-start gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-150"
      style={{ background: BOLD.surface, border: `1px solid ${BOLD.line}`, opacity: done ? 0.6 : 1, boxShadow: '0 1px 0 rgba(20,18,15,.02)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform='translateY(-1px)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 2px rgba(20,18,15,.04),0 4px 14px rgba(20,18,15,.06)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform=''; (e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 0 rgba(20,18,15,.02)'; }}>
      <div className="pt-0.5"><BoldCheckbox checked={done} onToggle={e => onToggle(task.id, e)} priority={task.priority} /></div>
      <div className="flex-1 min-w-0">
        <div className="text-[14.5px] font-semibold leading-snug" style={{ color: BOLD.ink, textDecoration: done?'line-through':'none', letterSpacing:'-0.01em' }}>
          {task.isPinned && <Pin size={11} className="inline mr-1 mb-0.5" style={{ opacity: 0.4 }} />}{task.title}
        </div>
        {task.desc && <div className="text-[12.5px] mt-1 leading-snug truncate" style={{ color: BOLD.inkSoft }}>{task.desc}</div>}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {proj && <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: BOLD.inkSoft }}><span style={{ width:7, height:7, borderRadius:'50%', background:pc, flexShrink:0, display:'inline-block' }} />{proj.name}</span>}
          {task.source==='outlook' && <span className="text-[10px] font-bold tracking-widest" style={{ color:'#3D5AFE' }}>MS</span>}
          {task.source==='google' && <span className="text-[10px] font-bold tracking-widest" style={{ color:'#EA4335' }}>GGL</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <PriorityChip priority={task.priority} />
        {dl && <span className="text-[11.5px] font-semibold tabular-nums" style={{ color: dl.color }}>{dl.label}</span>}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity self-center ml-1">
        <button onClick={e=>{e.stopPropagation();onPin(task.id);}} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" style={{ color: task.isPinned?'#FF9500':BOLD.inkFaint }}><Pin size={11} className={task.isPinned?'fill-current':''} /></button>
        <button onClick={e=>{e.stopPropagation();onEdit(task);}} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" style={{ color: BOLD.inkFaint }}><Pencil size={11} /></button>
        <button onClick={e=>{e.stopPropagation();onDelete(task);}} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: BOLD.inkFaint }}><Trash2 size={11} /></button>
      </div>
    </div>
  );
};

// ── UI: FocusCard (hero dark card) ────────────────────────────────────────
const FocusCard = ({ task, projects, onToggle, onOpen }: { task: Task; projects: Project[]; onToggle: (id:string|number, e:React.MouseEvent)=>void; onOpen:(t:Task)=>void }) => {
  const pidx = projects.findIndex(p => p.id === task.projectId);
  const proj = pidx >= 0 ? projects[pidx] : null;
  const pc = proj ? projColor(proj, pidx) : BOLD.accent;
  return (
    <div onClick={() => onOpen(task)} className="rounded-3xl p-6 mb-7 cursor-pointer relative overflow-hidden" style={{ background: BOLD.ink, color:'#fff' }}>
      <div style={{ position:'absolute', top:-60, right:200, width:160, height:160, borderRadius:'50%', background:BOLD.accent, opacity:0.35, filter:'blur(20px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-40, right:-20, width:200, height:200, borderRadius:'50%', background:pc, opacity:0.25, filter:'blur(30px)', pointerEvents:'none' }} />
      <div className="relative" style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:24 }}>
        <div>
          <div className="flex items-center gap-2 mb-3 text-[11px] font-bold tracking-[0.1em] uppercase" style={{ opacity:0.6 }}><Sun size={12} /> Bugünün Odağı</div>
          <div className="text-[28px] font-bold leading-tight mb-3" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.035em' }}>{task.title}</div>
          {task.desc && <div className="text-sm mb-4 leading-relaxed" style={{ color:'rgba(255,255,255,.65)', maxWidth:480 }}>{task.desc}</div>}
          <div className="flex items-center gap-3 flex-wrap">
            <PriorityChip priority={task.priority} lg />
            {proj && <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color:'rgba(255,255,255,.8)' }}><span style={{ width:8, height:8, borderRadius:'50%', background:pc, display:'inline-block' }} />{proj.name}</span>}
          </div>
        </div>
        <div className="flex flex-col justify-between items-end relative">
          <button onClick={e=>{e.stopPropagation();onToggle(task.id,e);}} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold transition-all hover:bg-white/20" style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', color:'#fff' }}>
            <Check size={12} strokeWidth={2.5} /> Tamamla
          </button>
          <div className="text-right">
            <div className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ opacity:0.5 }}>Son tarih</div>
            <div className="text-[22px] font-bold" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.03em' }}>Bugün</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── UI: Section heading ───────────────────────────────────────────────────
const BoldSection = ({ title, count, color, children }: { title:string; count?:number; color?:string; children:React.ReactNode }) => (
  <section className="mb-7">
    <div className="flex items-baseline gap-2.5 mb-3">
      <h2 className="text-[19px] font-bold m-0" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.03em', color: color??BOLD.ink }}>{title}</h2>
      {count != null && <span className="text-[12px] font-semibold tabular-nums" style={{ color:BOLD.inkFaint, fontFamily:'JetBrains Mono,monospace' }}>{count}</span>}
    </div>
    {children}
  </section>
);

// ── UI: FilterChip ────────────────────────────────────────────────────────
const FilterChip = ({ active, onClick, color, children }: { active:boolean; onClick:()=>void; color?:string; children:React.ReactNode }) => (
  <button onClick={onClick} className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-full transition-all"
    style={{ border:`1px solid ${active?(color??BOLD.ink):BOLD.line}`, background: active?(color??BOLD.ink):'transparent', color: active?'#fff':BOLD.inkSoft, cursor:'pointer', letterSpacing:'-0.01em', fontFamily:'inherit' }}>
    {color && !active && <span style={{ width:7, height:7, borderRadius:'50%', background:color, display:'inline-block' }} />}
    {children}
  </button>
);
const FGroup = ({ label, children }: { label:string; children:React.ReactNode }) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] font-bold tracking-[0.06em] uppercase mr-1" style={{ color:BOLD.inkFaint }}>{label}</span>
    {children}
  </div>
);

// ── View: Today ───────────────────────────────────────────────────────────
interface VP { tasks:Task[]; projects:Project[]; onToggle:(id:string|number,e:React.MouseEvent)=>void; onOpen:(t:Task)=>void; onPin:(id:string|number)=>void; onDelete:(t:Task)=>void; onEdit:(t:Task)=>void; onStatus?:(id:string|number,s:Task['status'])=>void; }
const TodayView = ({ tasks, projects, onToggle, onOpen, onPin, onDelete, onEdit }: VP) => {
  const day0 = (s:string) => { const d=new Date(s); d.setHours(0,0,0,0); return d; };
  const todayTasks = tasks.filter(t => t.status!=='done' && t.deadline && sameDay(day0(t.deadline), todayDate));
  const overdue    = tasks.filter(t => t.status!=='done' && t.deadline && day0(t.deadline) < todayDate && !sameDay(day0(t.deadline), todayDate));
  const upcoming   = tasks.filter(t => t.status!=='done' && t.deadline && day0(t.deadline)>todayDate && day0(t.deadline)<=new Date(todayDate.getTime()+3*86400000)).sort((a,b)=>new Date(a.deadline).getTime()-new Date(b.deadline).getTime());
  const doneToday  = tasks.filter(t => t.status==='done' && t.completedAt && sameDay(new Date(t.completedAt), todayDate)).length;
  const totalToday = todayTasks.length + doneToday;
  const completion = totalToday > 0 ? doneToday/totalToday : 0;
  const hour = new Date().getHours();
  const greet = hour<12 ? 'Günaydın' : hour<18 ? 'İyi günler' : 'İyi akşamlar';
  const focusTask = todayTasks.find(t=>t.priority==='high') ?? todayTasks[0];
  const rp = { projects, onToggle, onOpen, onPin, onDelete, onEdit };
  const R=20, C=2*Math.PI*R;
  return (
    <div className="p-8 overflow-y-auto h-full custom-scrollbar">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[0.08em] mb-1" style={{ color:BOLD.inkFaint }}>{new Date().toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'})}</div>
          <h1 className="text-[38px] font-bold leading-none m-0" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.045em', color:BOLD.ink }}>{greet}</h1>
          <p className="text-[15px] mt-2" style={{ color:BOLD.inkSoft, letterSpacing:'-0.01em' }}>
            Bugün için <strong style={{ color:BOLD.ink }}>{todayTasks.length} görev</strong> bekliyor{overdue.length>0&&<>, <span style={{ color:'#FF3B30' }}>{overdue.length} tanesi gecikti</span></>}.
          </p>
        </div>
        <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl flex-shrink-0" style={{ background:BOLD.surface, border:`1px solid ${BOLD.line}` }}>
          <svg width={52} height={52} viewBox="0 0 52 52">
            <circle cx={26} cy={26} r={R} stroke={BOLD.line} strokeWidth={5} fill="none" />
            <circle cx={26} cy={26} r={R} stroke={BOLD.accent} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-completion)} transform="rotate(-90 26 26)" style={{ transition:'stroke-dashoffset .4s' }} />
          </svg>
          <div>
            <div className="text-[20px] font-bold leading-none tabular-nums" style={{ fontFamily:'JetBrains Mono,monospace', color:BOLD.ink }}>{doneToday}<span style={{ color:BOLD.inkFaint, fontWeight:500 }}>/{totalToday}</span></div>
            <div className="text-[11px] font-medium mt-1" style={{ color:BOLD.inkSoft }}>günlük ilerleme</div>
          </div>
        </div>
      </div>
      {focusTask && <FocusCard task={focusTask} projects={projects} onToggle={onToggle} onOpen={onOpen} />}
      {overdue.length>0 && <BoldSection title="Gecikti" count={overdue.length} color="#FF3B30"><div className="flex flex-col gap-2">{overdue.map(t=><TaskRow key={t.id} task={t} {...rp}/>)}</div></BoldSection>}
      <BoldSection title="Bugün" count={todayTasks.length}>
        <div className="flex flex-col gap-2">
          {todayTasks.map(t=><TaskRow key={t.id} task={t} {...rp}/>)}
          {todayTasks.length===0&&!focusTask&&<div className="py-8 text-center rounded-2xl text-[13.5px]" style={{ border:`1px dashed ${BOLD.line}`, color:BOLD.inkFaint }}>Bugün için planlı görev yok ✨</div>}
        </div>
      </BoldSection>
      {upcoming.length>0&&<BoldSection title="Yaklaşan — sonraki 3 gün" count={upcoming.length}><div className="flex flex-col gap-2">{upcoming.map(t=><TaskRow key={t.id} task={t} {...rp}/>)}</div></BoldSection>}
      <div className="h-10" />
    </div>
  );
};

// ── View: All Tasks ───────────────────────────────────────────────────────
const AllTasksView = ({ tasks, projects, onToggle, onOpen, onPin, onDelete, onEdit }: VP) => {
  const [pf, setPf] = useState('all');
  const [projF, setProjF] = useState('all');
  const [sf, setSf] = useState('active');
  const [q, setQ] = useState('');
  const filtered = useMemo(() => tasks.filter(t => {
    if (pf!=='all' && t.priority!==pf) return false;
    if (projF!=='all' && t.projectId!==projF) return false;
    if (sf==='active' && t.status==='done') return false;
    if (sf==='done' && t.status!=='done') return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [tasks, pf, projF, sf, q]);
  const rp = { projects, onToggle, onOpen, onPin, onDelete, onEdit };
  return (
    <div className="p-8 overflow-y-auto h-full custom-scrollbar">
      <div className="mb-5">
        <h1 className="text-[30px] font-bold m-0 leading-none" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.04em', color:BOLD.ink }}>Tüm Görevler</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color:BOLD.inkSoft }}>{filtered.length} sonuç · {tasks.length} toplam</p>
      </div>
      <div className="p-3.5 rounded-2xl mb-5 flex flex-wrap gap-4 items-center" style={{ background:BOLD.surface, border:`1px solid ${BOLD.line}` }}>
        <FGroup label="Durum">
          {([{v:'active',n:'Aktif'},{v:'done',n:'Tamamlanan'},{v:'all',n:'Hepsi'}] as const).map(o=><FilterChip key={o.v} active={sf===o.v} onClick={()=>setSf(o.v)}>{o.n}</FilterChip>)}
        </FGroup>
        <div style={{ width:1, background:BOLD.line, alignSelf:'stretch' }}/>
        <FGroup label="Öncelik">
          <FilterChip active={pf==='all'} onClick={()=>setPf('all')}>Hepsi</FilterChip>
          {Object.entries(PRIO).map(([k,m])=><FilterChip key={k} active={pf===k} onClick={()=>setPf(k)} color={m.color}>{m.name}</FilterChip>)}
        </FGroup>
        <div style={{ width:1, background:BOLD.line, alignSelf:'stretch' }}/>
        <FGroup label="Proje">
          <FilterChip active={projF==='all'} onClick={()=>setProjF('all')}>Hepsi</FilterChip>
          {projects.slice(0,5).map((p,i)=><FilterChip key={p.id} active={projF===p.id} onClick={()=>setProjF(p.id)} color={projColor(p,i)}>{p.name}</FilterChip>)}
        </FGroup>
        <div className="ml-auto relative">
          <input type="text" placeholder="Ara..." value={q} onChange={e=>setQ(e.target.value)} className="pl-8 pr-3 py-1.5 rounded-lg text-[12px] outline-none" style={{ background:BOLD.bg, border:`1px solid ${BOLD.line}`, color:BOLD.ink, width:140 }} />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color:BOLD.inkFaint }} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {filtered.map(t=><TaskRow key={t.id} task={t} {...rp}/>)}
        {filtered.length===0&&<div className="py-8 text-center rounded-2xl text-[13.5px]" style={{ border:`1px dashed ${BOLD.line}`, color:BOLD.inkFaint }}>Bu filtreyle eşleşen görev yok.</div>}
      </div>
      <div className="h-10" />
    </div>
  );
};

// ── View: Kanban ──────────────────────────────────────────────────────────
const KanbanView = ({ tasks, projects, onToggle, onOpen, onStatus }: VP & { onStatus:(id:string|number,s:Task['status'])=>void }) => {
  const [dragged, setDragged] = useState<string|number|null>(null);
  const [over, setOver] = useState<string|null>(null);
  const cols: { id:Task['status']; name:string; emoji:string }[] = [
    { id:'todo', name:'Yapılacak', emoji:'○' },
    { id:'doing', name:'Devam Eden', emoji:'◐' },
    { id:'done', name:'Tamamlanan', emoji:'●' },
  ];
  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      <div className="mb-5 flex-shrink-0">
        <h1 className="text-[30px] font-bold m-0 leading-none" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.04em', color:BOLD.ink }}>Kanban Panosu</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color:BOLD.inkSoft }}>Sürükle bırak ile görevleri taşı</p>
      </div>
      <div className="grid gap-4 flex-1 min-h-0" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
        {cols.map(col => {
          const colTasks = tasks.filter(t=>t.status===col.id);
          return (
            <div key={col.id}
              onDragOver={e=>{e.preventDefault();setOver(col.id);}}
              onDragLeave={()=>setOver(o=>o===col.id?null:o)}
              onDrop={()=>{if(dragged){onStatus(dragged,col.id);setDragged(null);setOver(null);}}}
              className="flex flex-col min-h-0 rounded-2xl p-3 transition-all duration-150"
              style={{ background: over===col.id ? BOLD.accent+'12' : BOLD.lineSoft, border: over===col.id ? `2px dashed ${BOLD.accent}` : `1px solid ${BOLD.line}` }}>
              <div className="flex items-center gap-2 px-2 py-1.5 mb-3">
                <span className="text-[14px]" style={{ color:BOLD.inkSoft }}>{col.emoji}</span>
                <span className="text-[15px] font-bold" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.02em', color:BOLD.ink }}>{col.name}</span>
                <span className="text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded" style={{ background:BOLD.line, color:BOLD.inkFaint, fontFamily:'JetBrains Mono,monospace' }}>{colTasks.length}</span>
              </div>
              <div className="flex flex-col gap-2 overflow-y-auto flex-1 custom-scrollbar">
                {colTasks.map(task => {
                  const pidx = projects.findIndex(p=>p.id===task.projectId);
                  const proj = pidx>=0 ? projects[pidx] : null;
                  const pc = proj ? projColor(proj,pidx) : '#94a3b8';
                  return (
                    <div key={task.id} draggable onDragStart={()=>setDragged(task.id)} onDragEnd={()=>{setDragged(null);setOver(null);}} onClick={()=>onOpen(task)}
                      className="rounded-xl p-3 cursor-grab transition-all duration-150 relative overflow-hidden"
                      style={{ background:'#fff', border:`1px solid ${BOLD.line}`, opacity:dragged===task.id?0.4:1, borderLeft:`3px solid ${pc}`, boxShadow:'0 1px 0 rgba(20,18,15,.03)' }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 2px 8px rgba(20,18,15,.08)';}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 0 rgba(20,18,15,.03)';}}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span style={{ width:6, height:6, borderRadius:'50%', background:pc, flexShrink:0, display:'inline-block' }} />
                        <span className="text-[10.5px] font-bold uppercase tracking-widest truncate flex-1" style={{ color:BOLD.inkSoft }}>{proj?.name??''}</span>
                        {task.priority==='high'&&<span style={{ width:6, height:6, borderRadius:'50%', background:'#FF3B30', flexShrink:0, display:'inline-block' }} />}
                      </div>
                      <div className="text-[13px] font-semibold leading-snug mb-2" style={{ color:BOLD.ink, letterSpacing:'-0.01em' }}>{task.title}</div>
                      {task.deadline&&<div className="flex items-center gap-1 text-[11px] font-medium" style={{ color:BOLD.inkFaint }}><Calendar size={10}/>{new Date(task.deadline).toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit'})}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── View: Completed ───────────────────────────────────────────────────────
const CompletedView = ({ tasks, projects, onToggle, onOpen, onPin, onDelete, onEdit }: VP) => {
  const done = tasks.filter(t=>t.status==='done');
  const rp = { projects, onToggle, onOpen, onPin, onDelete, onEdit };
  return (
    <div className="p-8 overflow-y-auto h-full custom-scrollbar">
      <div className="mb-5">
        <h1 className="text-[30px] font-bold m-0 leading-none" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.04em', color:BOLD.ink }}>Tamamlananlar</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color:BOLD.inkSoft }}>Toplam <strong style={{ color:BOLD.ink }}>{done.length}</strong> görev tamamlandı 🎉</p>
      </div>
      <div className="flex flex-col gap-2">
        {done.map(t=><TaskRow key={t.id} task={t} {...rp}/>)}
        {done.length===0&&<div className="py-8 text-center rounded-2xl text-[13.5px]" style={{ border:`1px dashed ${BOLD.line}`, color:BOLD.inkFaint }}>Henüz tamamlanan görev yok.</div>}
      </div>
      <div className="h-10" />
    </div>
  );
};

// ── Pomodoro Widget ───────────────────────────────────────────────────────
const PomodoroWidget = ({ focusTask }: { focusTask: Task|null }) => {
  const [secs, setSecs] = useState(25*60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<'work'|'break'>('work');
  useEffect(() => {
    if (!running) return;
    const i = setInterval(()=>setSecs(s=>Math.max(0,s-1)),1000);
    return ()=>clearInterval(i);
  }, [running]);
  const total = mode==='work'?25*60:5*60;
  const prog = 1-secs/total;
  const mm = String(Math.floor(secs/60)).padStart(2,'0');
  const ss2 = String(secs%60).padStart(2,'0');
  const R=50, C=2*Math.PI*R;
  return (
    <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background:BOLD.ink, color:'#fff' }}>
      <div style={{ position:'absolute', top:-40, right:-40, width:140, height:140, borderRadius:'50%', background:BOLD.accent, opacity:0.18, pointerEvents:'none' }}/>
      <div className="flex items-center justify-between mb-3 relative">
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] uppercase" style={{ opacity:0.7 }}><Timer size={12}/>Pomodoro</div>
        <div className="flex gap-0.5 p-0.5 rounded-md" style={{ background:'rgba(255,255,255,.08)' }}>
          {(['work','break'] as const).map(m=>(
            <button key={m} onClick={()=>{setMode(m);setSecs(m==='work'?25*60:5*60);setRunning(false);}} className="px-2.5 py-1 rounded text-[10.5px] font-semibold transition-all" style={{ border:'none', background:mode===m?'#fff':'transparent', color:mode===m?BOLD.ink:'#fff', cursor:'pointer', fontFamily:'inherit' }}>{m==='work'?'Odak':'Mola'}</button>
          ))}
        </div>
      </div>
      <div className="flex justify-center py-2 relative">
        <svg width={124} height={124} viewBox="0 0 124 124">
          <circle cx={62} cy={62} r={R} stroke="rgba(255,255,255,.1)" strokeWidth={6} fill="none"/>
          <circle cx={62} cy={62} r={R} stroke={BOLD.accent} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-prog)} transform="rotate(-90 62 62)" style={{ transition:'stroke-dashoffset .4s' }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[28px] font-semibold leading-none" style={{ fontFamily:'JetBrains Mono,monospace', letterSpacing:'-0.04em' }}>{mm}:{ss2}</div>
          <div className="text-[10px] uppercase tracking-widest font-semibold mt-1" style={{ opacity:0.5 }}>{mode==='work'?'Odak süresi':'Mola'}</div>
        </div>
      </div>
      {focusTask&&<div className="rounded-lg px-3 py-2 mb-3 text-[12px] font-medium leading-snug truncate" style={{ background:'rgba(255,255,255,.06)' }}><span style={{ opacity:0.5, marginRight:6 }}>Şu an:</span>{focusTask.title}</div>}
      <div className="flex gap-1.5">
        <button onClick={()=>setRunning(r=>!r)} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold" style={{ border:'none', background:BOLD.accent, color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>{running?'⏸ Duraklat':'▶ Başlat'}</button>
        <button onClick={()=>{setRunning(false);setSecs(mode==='work'?25*60:5*60);}} className="px-3.5 py-2.5 rounded-lg text-[13px] font-medium" style={{ border:'none', background:'rgba(255,255,255,.1)', color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>↻</button>
      </div>
    </div>
  );
};

// ── Task Detail Drawer ────────────────────────────────────────────────────
const TaskDetail = ({ task, projects, onClose, onToggle, onEdit, onDelete }: { task:Task; projects:Project[]; onClose:()=>void; onToggle:(id:string|number,e:React.MouseEvent)=>void; onEdit:(t:Task)=>void; onDelete:(t:Task)=>void }) => {
  const pidx = projects.findIndex(p=>p.id===task.projectId);
  const proj = pidx>=0 ? projects[pidx] : null;
  const pc = proj ? projColor(proj,pidx) : '#94a3b8';
  const done = task.status==='done';
  const isOverdue = task.deadline && new Date(task.deadline)<todayDate && !done;
  return (
    <div className="absolute top-0 right-0 bottom-0 flex flex-col z-50" style={{ width:360, background:BOLD.surface, borderLeft:`1px solid ${BOLD.line}`, boxShadow:'-12px 0 32px rgba(20,18,15,.06)' }}>
      <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom:`1px solid ${BOLD.line}` }}>
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.08em] uppercase" style={{ color:BOLD.inkFaint }}>
          <span style={{ width:9, height:9, borderRadius:3, background:pc, display:'inline-block' }}/>{proj?.name??'Proje Yok'}
        </div>
        <div className="flex gap-1">
          <button onClick={()=>onEdit(task)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors" style={{ color:BOLD.inkFaint }}><Pencil size={14}/></button>
          <button onClick={()=>{onDelete(task);onClose();}} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors" style={{ color:BOLD.inkFaint }}><Trash2 size={14}/></button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors" style={{ color:BOLD.inkFaint }}><X size={14}/></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        <div className="flex gap-3 mb-5">
          <div className="pt-0.5"><BoldCheckbox checked={done} onToggle={e=>onToggle(task.id,e)} priority={task.priority} size={26}/></div>
          <div className="text-[22px] font-bold leading-snug" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.03em', color:BOLD.ink, textDecoration:done?'line-through':'none' }}>{task.title}</div>
        </div>
        <div className="grid gap-3 mb-5 text-[13px]" style={{ gridTemplateColumns:'auto 1fr' }}>
          <span className="text-[11px] font-bold uppercase tracking-widest pt-0.5" style={{ color:BOLD.inkFaint }}>Öncelik</span><PriorityChip priority={task.priority}/>
          <span className="text-[11px] font-bold uppercase tracking-widest pt-0.5" style={{ color:BOLD.inkFaint }}>Son tarih</span>
          <span className="font-semibold" style={{ color:isOverdue?'#FF3B30':BOLD.ink }}>{task.deadline?new Date(task.deadline).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}):'—'}</span>
          <span className="text-[11px] font-bold uppercase tracking-widest pt-0.5" style={{ color:BOLD.inkFaint }}>Durum</span>
          <span className="font-semibold" style={{ color:BOLD.ink }}>{task.status==='todo'?'Yapılacak':task.status==='doing'?'Devam Ediyor':'Tamamlandı'}</span>
          {task.source!=='local'&&<><span className="text-[11px] font-bold uppercase tracking-widest pt-0.5" style={{ color:BOLD.inkFaint }}>Kaynak</span><span className="font-semibold" style={{ color:BOLD.ink }}>{task.source==='outlook'?'Microsoft To-Do':'Google Tasks'}</span></>}
        </div>
        {task.desc&&<div className="mb-5"><div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color:BOLD.inkFaint }}>Notlar</div><div className="text-[13.5px] leading-relaxed rounded-xl p-4" style={{ background:'#FFFCEC', color:BOLD.inkSoft, border:`1px solid ${BOLD.line}` }}>{task.desc}</div></div>}
      </div>
    </div>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
type ViewId = 'today'|'all'|'kanban'|'completed';

export const Tasks: React.FC = () => {
  // ── Data ──────────────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Integration ───────────────────────────────────────────
  const [msAccount, setMsAccount] = useState<any>(null);
  const [googleAccount, setGoogleAccount] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // ── UI ────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<ViewId>('today');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task|null>(null);
  const [openTask, setOpenTask] = useState<Task|null>(null);
  const [editingProject, setEditingProject] = useState<Project|null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [deletingProject, setDeletingProject] = useState<Project|null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState('none');
  const [formData, setFormData] = useState<Partial<Task>>({ title:'', desc:'', priority:'medium', deadline:'', projectId:'', moduleRef:'genel' });
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // ── Load data ──────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [cloudTasks, cloudProjects, cloudGroups] = await Promise.all([tasksAPI.getAll(), projectsAPI.getAll(), projectGroupsAPI.getAll()]);
        const localTasksStr = localStorage.getItem('enba_tasks');
        if (localTasksStr && cloudTasks.length === 0) {
          const lTasks = JSON.parse(localTasksStr) || [];
          const lProjects = JSON.parse(localStorage.getItem('enba_projects')||'[]');
          const lGroups = JSON.parse(localStorage.getItem('enba_project_groups')||'[]');
          for(const g of lGroups) await projectGroupsAPI.insert({ id:g.id, name:g.name });
          for(const p of lProjects) await projectsAPI.insert({ id:p.id, name:p.name, group_id:p.groupId });
          for(const t of lTasks) await tasksAPI.insert(toSupabaseTask(t));
          const [newT,newP,newG] = await Promise.all([tasksAPI.getAll(),projectsAPI.getAll(),projectGroupsAPI.getAll()]);
          setTasks(newT.map(fromSupabaseTask));
          setProjects(newP.map(x=>({ id:x.id, name:x.name, groupId:x.group_id })));
          setGroups(newG);
          localStorage.removeItem('enba_tasks'); localStorage.removeItem('enba_projects'); localStorage.removeItem('enba_project_groups');
          setIsLoading(false); return;
        }
        setTasks(cloudTasks.map(fromSupabaseTask));
        setProjects(cloudProjects.map(x=>({ id:x.id, name:x.name, groupId:x.group_id })));
        setGroups(cloudGroups);
      } catch(err) { console.error('Görev verileri yüklenemedi:', err); }
      finally { setIsLoading(false); }
    }
    loadData();
  }, []);

  // ── Session recovery (MS + Google) ────────────────────────
  useEffect(() => {
    const recoverSession = async () => {
      try {
        const redirectOrigin = localStorage.getItem('msal_redirect_origin');
        const redirectAccount = await microsoftService.getRedirectAccount();
        if (redirectAccount) {
          if (redirectOrigin) localStorage.removeItem('msal_redirect_origin');
          const profile = await profileAPI.getMyProfile();
          if (profile) await profileAPI.updateProfile(profile.id, { ms_account_id: redirectAccount.homeAccountId, ms_account_username: redirectAccount.username });
          setMsAccount(redirectAccount);
          handleSyncAll(redirectAccount); return;
        }
        const profile = await profileAPI.getMyProfile();
        if (profile?.ms_account_username) {
          const silentAccount = await microsoftService.trySilentLogin(profile.ms_account_username);
          if (silentAccount) { setMsAccount(silentAccount); handleSyncAll(silentAccount); return; }
          setMsAccount({ username: profile.ms_account_username, needsReconnect: true });
        } else { microsoftService.clearStorage(); }
      } catch(err) { console.warn('MSAL: Session recovery failed:', err); }
    };
    recoverSession();
    if (googleService.handleAuthReturn()) setGoogleAccount({ name:'Google Kullanıcısı' });
    const gToken = googleService.getAccessToken();
    if (gToken) {
      profileAPI.getMyProfile().then(p => {
        if (!p?.google_data?.token) { googleService.logout(); setGoogleAccount(null); }
        else setGoogleAccount({ name:'Google Kullanıcısı' });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──────────────────────────────────────────────
  const toggleTask = async (id: string|number) => {
    const task = tasks.find(t=>t.id===id); if (!task) return;
    const newStatus = task.status==='done' ? 'todo' : 'done';
    setTasks(prev=>prev.map(t=>t.id===id ? { ...t, status:newStatus, completedAt: newStatus==='done'?new Date().toISOString():undefined } : t));
    tasksAPI.update(id.toString(), { status:newStatus });
    if (msAccount && task.msTodoId && task.msListId) await microsoftService.syncTask(task.msListId, { ...task, status:newStatus }, task.msTodoId);
  };
  const handleToggle = (id: string|number, _e: React.MouseEvent) => toggleTask(id);

  const togglePin = (taskId: string|number) => {
    const updated = tasks.map(t=>t.id===taskId ? { ...t, isPinned:!t.isPinned } : t);
    setTasks(updated);
    const tObj = tasks.find(t=>t.id===taskId);
    if (tObj) tasksAPI.update(taskId.toString(), { is_pinned:!tObj.isPinned });
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm('Bu görev silinecek. Emin misiniz?')) return;
    setTasks(prev=>prev.filter(t=>t.id!==task.id));
    tasksAPI.delete(task.id.toString());
    if (msAccount && task.msTodoId && task.msListId) await microsoftService.deleteTask(task.msListId, task.msTodoId);
    if (openTask?.id === task.id) setOpenTask(null);
  };

  const handleEditTask = (task: Task) => { setEditingTask(task); setFormData(task); setShowTaskForm(true); };

  const handleStatusChange = (id: string|number, status: Task['status']) => {
    setTasks(prev=>prev.map(t=>t.id===id ? { ...t, status } : t));
    tasksAPI.update(id.toString(), { status });
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingTask;
    const newTask: Task = { ...formData as Task, id: isNew?Date.now():editingTask!.id, status: isNew?'todo':editingTask!.status, createdAt: isNew?new Date().toISOString():editingTask!.createdAt, source: isNew?'local':editingTask!.source, msTodoId:editingTask?.msTodoId, msListId:editingTask?.msListId, gTaskId:editingTask?.gTaskId, gListId:editingTask?.gListId };
    setTasks(prev=>isNew ? [...prev,newTask] : prev.map(t=>t.id===newTask.id?newTask:t));
    if (isNew) tasksAPI.insert(toSupabaseTask(newTask)); else tasksAPI.update(newTask.id.toString(), toSupabaseTask(newTask));
    if (msAccount) {
      try {
        const list = await microsoftService.ensureTodoList('Enba Tasks');
        if (list) {
          const result = await microsoftService.syncTask(list.id, newTask, newTask.msTodoId);
          if (result?.id) setTasks(cur=>cur.map(t=>t.id===newTask.id?{ ...t, msTodoId:result.id, msListId:list.id }:t));
        }
      } catch(err) { console.error('MS Push Error:', err); }
    }
    setShowTaskForm(false); setEditingTask(null);
    setFormData({ title:'', desc:'', priority:'medium', deadline:'', projectId:projects[0]?.id||'', moduleRef:'genel' });
  };

  const handleRenameProject = () => {
    if (!editingProject||!editingProjectName.trim()) return;
    setProjects(projects.map(p=>p.id===editingProject.id?{ ...p, name:editingProjectName.trim().toUpperCase() }:p));
    setEditingProject(null);
  };

  const handleDeleteProject = () => {
    if (!deletingProject) return;
    if (deleteTargetId==='delete') { const upd=tasks.filter(t=>t.projectId!==deletingProject.id); setTasks(upd); tasks.forEach(t=>{if(t.projectId===deletingProject.id)tasksAPI.delete(t.id.toString());}); }
    else if (deleteTargetId!=='none') { setTasks(tasks.map(t=>t.projectId===deletingProject.id?{...t,projectId:deleteTargetId}:t)); tasks.forEach(t=>{if(t.projectId===deletingProject.id)tasksAPI.update(t.id.toString(),{project_id:deleteTargetId});}); }
    setProjects(projects.filter(p=>p.id!==deletingProject.id));
    projectsAPI.delete(deletingProject.id);
    if (selectedProjectId===deletingProject.id) setSelectedProjectId('all');
    setDeletingProject(null); setDeleteTargetId('none');
  };

  const handleSyncAll = async (accountInstance = msAccount) => {
    if (!accountInstance||(accountInstance as any).needsReconnect) return;
    setIsSyncing(true); setSyncStatus('Senkronize ediliyor...');
    try {
      const lists = await microsoftService.getTodoLists();
      if (!lists.length) throw new Error('Microsoft Todo listeleri alınamadı.');
      const allMsTasks: any[] = [];
      for (const list of lists) {
        const lt = await microsoftService.getTodoListTasks(list.id);
        lt.forEach((t: any)=>{ t._listId=list.id; t._listName=list.displayName; });
        allMsTasks.push(...lt);
      }
      const updatedProjects = [...projects];
      for (const list of lists) { if (!updatedProjects.find(p=>p.id===list.id)) updatedProjects.push({ id:list.id, name:list.displayName.toUpperCase(), groupId:'g2' }); }
      if (updatedProjects.length!==projects.length) setProjects(updatedProjects);
      const cleanText=(s:string)=>s.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').trim();
      const msStatusMap=(s:string):Task['status']=>s==='completed'?'done':s==='inProgress'?'doing':'todo';
      const snapshot=tasks; let updatedCount=0;
      const updatedTasks=snapshot.map(lt=>{
        if (!lt.msTodoId) return lt;
        const mt=allMsTasks.find(t=>t.id===lt.msTodoId); if (!mt) return lt;
        const msStatus=msStatusMap(mt.status);
        if (lt.status!==msStatus||cleanText(lt.title)!==cleanText(mt.title||'')||cleanText(lt.desc||'')!==cleanText(mt.body?.content||'')) { updatedCount++; return { ...lt, status:msStatus, title:mt.title, desc:mt.body?.content||'' }; }
        return lt;
      });
      const knownIds=new Set(snapshot.map(t=>t.msTodoId).filter(Boolean));
      const newTasks:Task[]=allMsTasks.filter(t=>!knownIds.has(t.id)).map(t=>({ id:'ms-'+t.id, title:t.title, desc:t.body?.content||'', priority:t.importance==='high'?'high':'medium', deadline:t.dueDateTime?.dateTime||'', projectId:t._listId, moduleRef:'genel', status:msStatusMap(t.status), createdAt:t.createdDateTime||new Date().toISOString(), source:'outlook', msTodoId:t.id, msListId:t._listId } as Task));
      setTasks([...updatedTasks,...newTasks]);
      setSyncStatus(`✓ ${allMsTasks.length} çekildi · ${updatedCount} güncellendi · ${newTasks.length} yeni`);
      setTimeout(()=>setSyncStatus(''),5000);
    } catch(err:any) { console.error('Sync Error:', err); setSyncStatus('Hata: '+(err?.message||'Senkronizasyon başarısız.')); }
    finally { setIsSyncing(false); }
  };

  const handleSyncGoogle = async () => {
    if (!googleAccount) return;
    setIsSyncing(true); setSyncStatus('Google Tasks senkronize ediliyor...');
    try {
      const taskLists = await googleService.getTaskLists();
      let newCount=0, updatedCount=0;
      const snapshot=[...tasks], newProjects=[...projects];
      for (const list of taskLists) {
        if (!newProjects.find(p=>p.id===list.id)) newProjects.push({ id:list.id, name:list.title.toUpperCase(), groupId:'g2' });
        const gTasks = await googleService.getTasksFromList(list.id);
        for (const gt of gTasks) {
          const existing=snapshot.find(t=>t.gTaskId===gt.id);
          const gStatus:'todo'|'done'=gt.status==='completed'?'done':'todo';
          if (existing) { if (existing.status!==gStatus||existing.title!==gt.title) { const idx=snapshot.findIndex(t=>t.id===existing.id); snapshot[idx]={ ...existing, status:gStatus, title:gt.title, desc:gt.notes||'' }; updatedCount++; } }
          else { snapshot.push({ id:'gt-'+gt.id, title:gt.title, desc:gt.notes||'', priority:'medium', deadline:gt.due||'', projectId:list.id, moduleRef:'genel', status:gStatus, createdAt:gt.updated||new Date().toISOString(), source:'google', gTaskId:gt.id, gListId:list.id }); newCount++; }
        }
      }
      setProjects(newProjects); setTasks(snapshot);
      setSyncStatus(`✓ Google: ${newCount} yeni · ${updatedCount} güncellendi`);
      setTimeout(()=>setSyncStatus(''),5000);
    } catch(err) { console.error('Google Sync Error:', err); setSyncStatus('Google senkronizasyon hatası.'); }
    finally { setIsSyncing(false); }
  };

  const handleImportFromMs = async () => {
    if (!msAccount) return;
    setIsSyncing(true);
    try {
      const lists = await microsoftService.getTodoLists();
      let importedCount=0;
      const newProjects=[...projects], newTasks=[...tasks];
      for (const list of lists) {
        if (!newProjects.find(p=>p.id===list.id)) newProjects.push({ id:list.id, name:list.displayName, groupId:'g2' });
        const msTasks = await microsoftService.getTodoListTasks(list.id);
        for (const mt of msTasks) {
          if (!newTasks.find(t=>t.msTodoId===mt.id)) { newTasks.push({ id:Date.now()+Math.random(), title:mt.title, desc:mt.body?.content||'', priority:mt.importance==='high'?'high':'medium', deadline:mt.dueDateTime?.dateTime||'', projectId:list.id, moduleRef:'genel', status:mt.status==='completed'?'done':mt.status==='inProgress'?'doing':'todo', createdAt:mt.createdDateTime||new Date().toISOString(), source:'outlook', msTodoId:mt.id, msListId:list.id }); importedCount++; }
        }
      }
      setProjects(newProjects); setTasks(newTasks);
      alert(`${importedCount} yeni görev aktarıldı.`);
    } catch(err) { console.error(err); }
    finally { setIsSyncing(false); }
  };

  // ── Derived ────────────────────────────────────────────────
  const filteredTasks = useMemo(() => tasks.filter(t => selectedProjectId==='all'||t.projectId===selectedProjectId), [tasks, selectedProjectId]);

  const focusTask = useMemo(() => tasks.find(t=>t.status!=='done'&&t.priority==='high'&&t.deadline&&sameDay(new Date(t.deadline),todayDate)) ?? tasks.find(t=>t.status!=='done'&&t.deadline&&sameDay(new Date(t.deadline),todayDate)), [tasks]);

  const projectsWithColor = useMemo(() => projects.map((p,i) => ({ ...p, color: projColor(p,i) })), [projects]);

  // ── Nav items ──────────────────────────────────────────────
  const navItems: { id:ViewId; icon:React.ElementType; label:string; count?:number }[] = [
    { id:'today', icon:Sun, label:'Bugün', count: tasks.filter(t=>t.status!=='done'&&t.deadline&&sameDay(new Date(t.deadline),todayDate)).length },
    { id:'all', icon:Layers, label:'Tüm Görevler', count: tasks.filter(t=>t.status!=='done').length },
    { id:'kanban', icon:KanbanIcon, label:'Kanban' },
    { id:'completed', icon:CheckSquare, label:'Tamamlananlar', count: tasks.filter(t=>t.status==='done').length },
  ];

  const sharedViewProps = { tasks:filteredTasks, projects:projectsWithColor, onToggle:handleToggle, onOpen:setOpenTask, onPin:togglePin, onDelete:handleDeleteTask, onEdit:handleEditTask };

  return (
    <div className="flex h-screen overflow-hidden animate-fade-in" style={{ background:BOLD.bg, fontFamily:'Poppins,sans-serif', letterSpacing:'-0.005em', position:'relative' }}>

      {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
      <aside className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width:220, background:'transparent', borderRight:`1px solid ${BOLD.line}`, padding:'20px 12px 16px' }}>
        {/* New task button */}
        <button onClick={()=>setShowTaskForm(true)}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl mb-4 text-[13.5px] font-semibold w-full transition-all hover:brightness-110"
          style={{ background:BOLD.ink, color:'#fff', border:'none', cursor:'pointer', letterSpacing:'-0.01em', fontFamily:'inherit' }}>
          <span className="flex items-center gap-2"><PlusCircle size={14} strokeWidth={2.2} /> Yeni Görev</span>
          <span className="text-[11px] opacity-50" style={{ fontFamily:'JetBrains Mono,monospace' }}>⌘N</span>
        </button>

        {/* View nav */}
        <div className="flex flex-col gap-0.5 mb-2">
          {navItems.map(item => {
            const active = activeView===item.id;
            return (
              <button key={item.id} onClick={()=>setActiveView(item.id)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg w-full text-[13.5px] font-medium transition-all"
                style={{ background:active?BOLD.ink+'0D':'transparent', color:active?BOLD.ink:BOLD.inkSoft, border:'none', cursor:'pointer', letterSpacing:'-0.01em', fontFamily:'inherit', fontWeight:active?600:500 }}
                onMouseEnter={e=>{if(!active)(e.currentTarget as HTMLButtonElement).style.background=BOLD.line+'80';}}
                onMouseLeave={e=>{if(!active)(e.currentTarget as HTMLButtonElement).style.background='transparent';}}>
                <item.icon size={15} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count!=null && item.count>0 && (
                  <span className="text-[11px] font-bold tabular-nums" style={{ fontFamily:'JetBrains Mono,monospace', color:active?BOLD.inkFaint:BOLD.inkFaint }}>{item.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Projects */}
        <div className="mt-4">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] px-2.5 mb-2" style={{ color:BOLD.inkFaint }}>Projeler</div>
          <div className="flex flex-col gap-0.5">
            {projectsWithColor.map(p => {
              const cnt = tasks.filter(t=>t.projectId===p.id&&t.status!=='done').length;
              const sel = selectedProjectId===p.id;
              return (
                <button key={p.id} onClick={()=>setSelectedProjectId(sel?'all':p.id)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg w-full text-[12.5px] font-medium transition-all group/p"
                  style={{ background:sel?p.color+'15':'transparent', color:sel?p.color:BOLD.inkSoft, border:'none', cursor:'pointer', fontFamily:'inherit' }}
                  onMouseEnter={e=>{if(!sel)(e.currentTarget as HTMLButtonElement).style.background=BOLD.line+'60';}}
                  onMouseLeave={e=>{if(!sel)(e.currentTarget as HTMLButtonElement).style.background='transparent';}}>
                  <span style={{ width:9, height:9, borderRadius:3, background:p.color, flexShrink:0, display:'inline-block' }}/>
                  <span className="flex-1 text-left truncate">{p.name}</span>
                  {cnt>0&&<span className="text-[10.5px]" style={{ fontFamily:'JetBrains Mono,monospace', color:BOLD.inkFaint }}>{cnt}</span>}
                  <div className="flex gap-0.5 opacity-0 group-hover/p:opacity-100 transition-opacity">
                    <button onClick={e=>{e.stopPropagation();setEditingProject(p);setEditingProjectName(p.name);}} className="p-0.5 rounded hover:bg-black/5"><Pencil size={9}/></button>
                    <button onClick={e=>{e.stopPropagation();setDeletingProject(p);setDeleteTargetId('none');}} className="p-0.5 rounded hover:bg-red-100 hover:text-red-500"><Trash2 size={9}/></button>
                  </div>
                </button>
              );
            })}
            <button onClick={()=>setShowProjectForm(true)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium w-full transition-all" style={{ border:`1px dashed ${BOLD.line}`, color:BOLD.inkFaint, background:'transparent', cursor:'pointer', fontFamily:'inherit', marginTop:4 }}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=BOLD.accent;(e.currentTarget as HTMLButtonElement).style.color=BOLD.accent;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=BOLD.line;(e.currentTarget as HTMLButtonElement).style.color=BOLD.inkFaint;}}>
              <PlusCircle size={11}/> Proje Ekle
            </button>
          </div>
        </div>

        <div className="flex-1"/>

        {/* Entegrasyon bottom */}
        <div className="pt-4" style={{ borderTop:`1px solid ${BOLD.line}` }}>
          {syncStatus && <div className="text-[10px] font-bold text-center mb-2 animate-pulse" style={{ color:BOLD.accent }}>{syncStatus}</div>}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 px-1">
              <span style={{ width:6, height:6, borderRadius:'50%', background:msAccount&&!msAccount.needsReconnect?'#3D5AFE':'#D1D5DB', flexShrink:0, display:'inline-block' }}/>
              <span className="text-[11px] font-medium flex-1 truncate" style={{ color:BOLD.inkSoft }}>{msAccount&&!msAccount.needsReconnect?(msAccount.username||'Microsoft'):'Microsoft'}</span>
              {(!msAccount||msAccount.needsReconnect)?<button onClick={()=>{setIsConnecting(true);microsoftService.loginRedirect().catch(()=>setIsConnecting(false));}} disabled={isConnecting} className="text-[10px] font-bold" style={{ color:'#3D5AFE', background:'none', border:'none', cursor:'pointer' }}>{isConnecting?'...':'Bağla'}</button>
                :<><button onClick={()=>handleImportFromMs()} disabled={isSyncing} className="text-[10px] font-bold flex items-center gap-0.5" style={{ color:BOLD.inkFaint, background:'none', border:'none', cursor:'pointer' }}><Download size={9}/>Çek</button><button onClick={()=>microsoftService.logout()} className="text-[10px] font-bold" style={{ color:'#ef4444', background:'none', border:'none', cursor:'pointer' }}>Kes</button></>
              }
            </div>
            <div className="flex items-center gap-2 px-1">
              <span style={{ width:6, height:6, borderRadius:'50%', background:googleAccount?'#34A853':'#D1D5DB', flexShrink:0, display:'inline-block' }}/>
              <span className="text-[11px] font-medium flex-1 truncate" style={{ color:BOLD.inkSoft }}>{googleAccount?'Google Bağlı':'Google'}</span>
              {!googleAccount?<button onClick={()=>googleService.loginRedirect()} className="text-[10px] font-bold" style={{ color:'#3D5AFE', background:'none', border:'none', cursor:'pointer' }}>Bağla</button>
                :<><button onClick={handleSyncGoogle} disabled={isSyncing} className="text-[10px] font-bold flex items-center gap-0.5" style={{ color:'#34A853', background:'none', border:'none', cursor:'pointer' }}><RefreshCw size={9} className={isSyncing?'animate-spin':''}/>Eşleştir</button><button onClick={()=>{googleService.logout();setGoogleAccount(null);}} className="text-[10px] font-bold" style={{ color:'#ef4444', background:'none', border:'none', cursor:'pointer' }}>Kes</button></>
              }
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <main className="flex-1 min-w-0 relative overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <RotateCw size={24} className="animate-spin" style={{ color:BOLD.accent+'60' }}/>
            <p className="text-[10px] font-bold uppercase tracking-[4px]" style={{ color:BOLD.inkFaint }}>Yükleniyor...</p>
          </div>
        ) : (
          <>
            {activeView==='today' && <TodayView {...sharedViewProps}/>}
            {activeView==='all' && <AllTasksView {...sharedViewProps}/>}
            {activeView==='kanban' && <KanbanView {...sharedViewProps} onStatus={handleStatusChange}/>}
            {activeView==='completed' && <CompletedView {...sharedViewProps}/>}
          </>
        )}
        {openTask && <TaskDetail task={openTask} projects={projectsWithColor} onClose={()=>setOpenTask(null)} onToggle={handleToggle} onEdit={t=>{handleEditTask(t);setOpenTask(null);}} onDelete={handleDeleteTask}/>}
      </main>

      {/* ── RIGHT PANEL TOGGLE ───────────────────────────────── */}
      <button
        onClick={() => setRightPanelOpen(o => !o)}
        title={rightPanelOpen ? 'Paneli gizle' : 'Pomodoro panelini aç'}
        style={{
          position:'absolute', right: rightPanelOpen ? 248 : 0, top:'50%', transform:'translateY(-50%)',
          zIndex:20, width:18, height:48,
          background:BOLD.surface, border:`1px solid ${BOLD.line}`,
          borderRight: rightPanelOpen ? `1px solid ${BOLD.line}` : 'none',
          borderRadius: rightPanelOpen ? '6px 0 0 6px' : '0 6px 6px 0',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', transition:'right .25s',
          color:BOLD.inkFaint,
        }}
      >
        {rightPanelOpen
          ? <ChevronRight size={11} strokeWidth={2.5}/>
          : <ChevronLeft size={11} strokeWidth={2.5}/>
        }
      </button>

      {/* ── RIGHT PANEL ──────────────────────────────────────── */}
      {rightPanelOpen && (
      <aside className="flex flex-col flex-shrink-0 gap-3.5 overflow-y-auto custom-scrollbar" style={{ width:248, padding:'20px 16px', borderLeft:`1px solid ${BOLD.line}`, background:'#FCFAF6' }}>
        <PomodoroWidget focusTask={focusTask??null}/>

        {/* Quick stats */}
        <div className="rounded-2xl p-4" style={{ background:BOLD.surface, border:`1px solid ${BOLD.line}` }}>
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.08em] uppercase mb-3.5" style={{ color:BOLD.inkFaint }}>
            <span>🔥</span> Bu hafta
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <div className="text-[28px] font-bold leading-none" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.03em', color:BOLD.ink }}>{tasks.filter(t=>t.status==='done').length}</div>
              <div className="text-[11px] font-medium mt-1" style={{ color:BOLD.inkSoft }}>tamamlandı</div>
            </div>
            <div>
              <div className="text-[28px] font-bold leading-none" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.03em', color:BOLD.accent }}>
                {tasks.length>0?Math.round((tasks.filter(t=>t.status==='done').length/tasks.length)*100):0}<span className="text-[14px] opacity-60">%</span>
              </div>
              <div className="text-[11px] font-medium mt-1" style={{ color:BOLD.inkSoft }}>tamamlanma</div>
            </div>
          </div>
          <div className="mt-3.5 h-1.5 rounded-full overflow-hidden" style={{ background:BOLD.line }}>
            <div style={{ width: tasks.length>0?`${Math.round((tasks.filter(t=>t.status==='done').length/tasks.length)*100)}%`:'0%', height:'100%', background:`linear-gradient(90deg,${BOLD.accent},#8B5CF6)`, borderRadius:999 }}/>
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="rounded-2xl p-4" style={{ background:BOLD.surface, border:`1px solid ${BOLD.line}` }}>
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase mb-3" style={{ color:BOLD.inkFaint }}>Öncelik Dağılımı</div>
          {Object.entries(PRIO).map(([k,m])=>{
            const cnt = tasks.filter(t=>t.priority===k&&t.status!=='done').length;
            const total2 = tasks.filter(t=>t.status!=='done').length;
            const pct = total2>0?Math.round((cnt/total2)*100):0;
            return (
              <div key={k} className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-semibold w-14" style={{ color:m.color }}>{m.name}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:BOLD.line }}>
                  <div style={{ width:`${pct}%`, height:'100%', background:m.color, borderRadius:999, transition:'width .3s' }}/>
                </div>
                <span className="text-[11px] tabular-nums w-5 text-right" style={{ fontFamily:'JetBrains Mono,monospace', color:BOLD.inkFaint }}>{cnt}</span>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize:10.5, color:BOLD.inkFaint, fontFamily:'JetBrains Mono,monospace', textAlign:'center', letterSpacing:'0.05em', marginTop:'auto', paddingTop:8 }}>
          {tasks.length} görev · {projects.length} proje
        </div>
      </aside>
      )}

      {/* ── MODALS ───────────────────────────────────────────── */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in" style={{ background:'rgba(22,21,26,.5)', backdropFilter:'blur(6px)' }}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl" style={{ background:BOLD.surface }}>
            <div className="h-1" style={{ background:BOLD.accent }}/>
            <div className="flex justify-between items-start px-8 py-7" style={{ borderBottom:`1px solid ${BOLD.line}` }}>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] mb-2" style={{ color:BOLD.inkFaint }}>✦ {editingTask?'Görevi Düzenle':'Yeni Atama'}</div>
                <h3 className="text-[20px] font-bold m-0" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.03em', color:BOLD.ink }}>{editingTask?'Görevi Güncelle':'Görevi Kaydet'}</h3>
              </div>
              <button onClick={()=>{setShowTaskForm(false);setEditingTask(null);}} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background:BOLD.line, color:BOLD.inkSoft, border:'none', cursor:'pointer' }}><X size={14}/></button>
            </div>
            <form onSubmit={handleAddTask} className="px-8 py-6 space-y-5">
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-2 ml-0.5" style={{ color:BOLD.inkFaint }}>Görev Tanımı</label>
                <input required value={formData.title} onChange={e=>setFormData({...formData,title:e.target.value})} className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold outline-none transition-all" style={{ background:BOLD.bg, border:`1px solid ${BOLD.line}`, color:BOLD.ink }} placeholder="Ne yapılacak?" autoFocus/>
              </div>
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-2 ml-0.5" style={{ color:BOLD.inkFaint }}>Detaylar</label>
                <textarea value={formData.desc} onChange={e=>setFormData({...formData,desc:e.target.value})} className="w-full rounded-xl px-4 py-3.5 text-sm font-medium outline-none transition-all min-h-[80px] resize-none" style={{ background:BOLD.bg, border:`1px solid ${BOLD.line}`, color:BOLD.ink }} placeholder="Açıklama..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-2 ml-0.5" style={{ color:BOLD.inkFaint }}>Öncelik</label>
                  <select value={formData.priority} onChange={e=>setFormData({...formData,priority:e.target.value as Task['priority']})} className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold outline-none appearance-none cursor-pointer" style={{ background:BOLD.bg, border:`1px solid ${BOLD.line}`, color:BOLD.ink }}>
                    <option value="low">Düşük</option><option value="medium">Orta</option><option value="high">Yüksek / Acil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-2 ml-0.5" style={{ color:BOLD.inkFaint }}>Son Tarih</label>
                  <input type="date" value={formData.deadline} onChange={e=>setFormData({...formData,deadline:e.target.value})} className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold outline-none" style={{ background:BOLD.bg, border:`1px solid ${BOLD.line}`, color:BOLD.ink }}/>
                </div>
              </div>
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-2 ml-0.5" style={{ color:BOLD.inkFaint }}>Proje</label>
                <select value={formData.projectId} onChange={e=>setFormData({...formData,projectId:e.target.value})} className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold outline-none appearance-none cursor-pointer" style={{ background:BOLD.bg, border:`1px solid ${BOLD.line}`, color:BOLD.ink }}>
                  {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>{setShowTaskForm(false);setEditingTask(null);}} className="flex-1 py-3.5 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all" style={{ background:BOLD.bg, color:BOLD.inkSoft, border:'none', cursor:'pointer' }}>İptal</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all hover:brightness-110" style={{ background:BOLD.ink, color:'#fff', border:'none', cursor:'pointer' }}>{editingTask?'Güncelle':'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProjectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in" style={{ background:'rgba(22,21,26,.5)', backdropFilter:'blur(6px)' }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-8 relative" style={{ background:BOLD.surface }}>
            <div className="absolute top-0 left-0 w-full h-1" style={{ background:BOLD.ink }}/>
            <h3 className="text-[20px] font-bold mb-6" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.03em', color:BOLD.ink }}>Yeni Proje</h3>
            <div className="space-y-4">
              <div><label className="block text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color:BOLD.inkFaint }}>Proje Adı</label><input id="newProjName" className="w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none" style={{ background:BOLD.bg, border:`1px solid ${BOLD.line}`, color:BOLD.ink }} placeholder="Proje adı..."/></div>
              <div><label className="block text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color:BOLD.inkFaint }}>Grup</label><select id="newProjGroup" className="w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none appearance-none" style={{ background:BOLD.bg, border:`1px solid ${BOLD.line}`, color:BOLD.ink }}>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowProjectForm(false)} className="flex-1 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest" style={{ background:BOLD.bg, color:BOLD.inkSoft, border:'none', cursor:'pointer' }}>İptal</button>
                <button onClick={()=>{const name=(document.getElementById('newProjName') as HTMLInputElement).value;const gId=(document.getElementById('newProjGroup') as HTMLSelectElement).value;if(name){const nId='p-'+Date.now();setProjects(prev=>[...prev,{id:nId,name,groupId:gId}]);projectsAPI.insert({id:nId,name,group_id:gId});setShowProjectForm(false);}}} className="flex-1 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest" style={{ background:BOLD.ink, color:'#fff', border:'none', cursor:'pointer' }}>Ekle</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in" style={{ background:'rgba(22,21,26,.5)', backdropFilter:'blur(6px)' }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-8 relative" style={{ background:BOLD.surface }}>
            <div className="absolute top-0 left-0 w-full h-1" style={{ background:BOLD.accent }}/>
            <h3 className="text-[20px] font-bold mb-6" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.03em', color:BOLD.ink }}>Listeyi Düzenle</h3>
            <input autoFocus value={editingProjectName} onChange={e=>setEditingProjectName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleRenameProject()} className="w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none mb-5" style={{ background:BOLD.bg, border:`1px solid ${BOLD.line}`, color:BOLD.ink }} placeholder="Liste adı..."/>
            <div className="flex gap-3">
              <button onClick={()=>setEditingProject(null)} className="flex-1 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest" style={{ background:BOLD.bg, color:BOLD.inkSoft, border:'none', cursor:'pointer' }}>İptal</button>
              <button onClick={handleRenameProject} className="flex-1 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:brightness-110" style={{ background:BOLD.accent, color:'#fff', border:'none', cursor:'pointer' }}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in" style={{ background:'rgba(22,21,26,.5)', backdropFilter:'blur(6px)' }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-8 relative" style={{ background:BOLD.surface }}>
            <div className="absolute top-0 left-0 w-full h-1" style={{ background:'#FF3B30' }}/>
            <h3 className="text-[20px] font-bold mb-2" style={{ fontFamily:'Bricolage Grotesque,Poppins,sans-serif', letterSpacing:'-0.03em', color:BOLD.ink }}>Listeyi Sil</h3>
            <p className="text-[11px] font-medium mb-5" style={{ color:BOLD.inkSoft }}><span style={{ color:BOLD.ink }}>{deletingProject.name}</span> listesinde {tasks.filter(t=>t.projectId===deletingProject.id).length} görev var.</p>
            <div className="mb-5"><label className="block text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color:BOLD.inkFaint }}>Görevlere ne yapılsın?</label>
              <select value={deleteTargetId} onChange={e=>setDeleteTargetId(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none appearance-none cursor-pointer" style={{ background:BOLD.bg, border:`1px solid ${BOLD.line}`, color:BOLD.ink }}>
                <option value="none">Görevleri koru</option>
                <option value="delete">Görevleri de sil</option>
                {projects.filter(p=>p.id!==deletingProject.id).map(p=><option key={p.id} value={p.id}>{p.name} listesine taşı</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>{setDeletingProject(null);setDeleteTargetId('none');}} className="flex-1 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest" style={{ background:BOLD.bg, color:BOLD.inkSoft, border:'none', cursor:'pointer' }}>İptal</button>
              <button onClick={handleDeleteProject} className="flex-1 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest" style={{ background:'#FF3B30', color:'#fff', border:'none', cursor:'pointer' }}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
