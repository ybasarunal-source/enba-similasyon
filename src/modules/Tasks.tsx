import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../api/i18n';
import { 
  ClipboardList, 
  PlusCircle, 
  FolderPlus, 
  Clock, 
  CheckCircle, 
  RotateCw, 
  Layout, 
  Hash, 
  Calendar, 
  Trash2, 
  Pencil, 
  ArrowRight, 
  ArrowLeft,
  AlertTriangle,
  Package
} from 'lucide-react';

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
}

interface Project {
  id: string;
  name: string;
}

export const Tasks: React.FC = () => {
  const { t } = useTranslation();

  // ── Data States ──────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('enba_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('enba_projects');
    return saved ? JSON.parse(saved) : [
      { id: 'p1', name: 'GENEL OPERASYON' },
      { id: 'p2', name: '2024 MODERNİZASYON' }
    ];
  });

  // ── Sync with LocalStorage ───────────────────────────────
  useEffect(() => {
    localStorage.setItem('enba_tasks', JSON.stringify(tasks));
    localStorage.setItem('enba_projects', JSON.stringify(projects));
  }, [tasks, projects]);

  // ── UI States ────────────────────────────────────────────
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '', desc: '', priority: 'medium', deadline: '', projectId: 'p1', moduleRef: 'genel'
  });

  const categories = [
    { id: 'genel', label: 'GENEL', color: '#94a3b8' },
    { id: 'isPlanlama', label: 'İŞ PLANLAMA', color: '#f59e0b' },
    { id: 'uretimTakip', label: 'ÜRETİM', color: '#8b5cf6' },
    { id: 'lojistikTakip', label: 'LOJİSTİK', color: '#ea580c' },
    { id: 'lisansTakip', label: 'LİSANS/BELGE', color: '#ef4444' },
    { id: 'stok', label: 'STOK', color: '#3b82f6' }
  ];

  // ── Handlers ─────────────────────────────────────────────
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      ...formData as Task,
      id: editingTask ? editingTask.id : Date.now(),
      status: editingTask ? editingTask.status : 'todo',
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString()
    };

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? newTask : t));
    } else {
      setTasks(prev => [...prev, newTask]);
    }

    setShowTaskForm(false);
    setEditingTask(null);
    setFormData({ title: '', desc: '', priority: 'medium', deadline: '', projectId: 'p1', moduleRef: 'genel' });
  };

  const moveTask = (id: string | number, newStatus: 'todo' | 'doing' | 'done') => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const isOverdue = (date: string, status: string) => {
    if (!date || status === 'done') return false;
    return new Date(date) < new Date();
  };

  const KanbanColumn = ({ title, status, icon, color }: { title: string, status: 'todo'|'doing'|'done', icon: any, color: string }) => {
    const filteredTasks = tasks.filter(t => t.status === status);
    const Icon = icon;
    
    return (
      <div className="flex-1 min-w-[380px] bg-gray-50/50 rounded-[2.5rem] p-10 flex flex-col gap-8 border border-gray-100 shadow-inner group">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-5">
               <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover:rotate-6" style={{ backgroundColor: color }}>
                  <Icon size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">{title}</h3>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mt-1.5">{filteredTasks.length} GÖREV AKTİF</div>
               </div>
            </div>
        </div>

        <div className="flex flex-col gap-6">
           {filteredTasks.map(task => {
             const overdue = isOverdue(task.deadline, task.status);
             const project = projects.find(p => p.id === task.projectId);
             const cat = categories.find(c => c.id === task.moduleRef);

             return (
               <div key={task.id} className={`bg-white p-8 rounded-[2.5rem] shadow-card border ${overdue ? 'border-rose-100' : 'border-gray-50'} group hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: cat?.color || '#eee' }}></div>
                  
                  <div className="flex justify-between items-start mb-6">
                     <span className={`text-[9px] font-black px-4 py-1.5 rounded-xl uppercase tracking-[3px] italic ${
                        task.priority === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        task.priority === 'medium' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                        'bg-blue-50 text-blue-600 border border-blue-100'
                     }`}>
                        {task.priority === 'high' ? 'ACİL' : task.priority === 'medium' ? 'ORTA' : 'DÜŞÜK'}
                     </span>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingTask(task); setFormData(task); setShowTaskForm(true); }} className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:bg-enba-dark hover:text-white flex items-center justify-center transition-all">
                           <Pencil size={14} />
                        </button>
                        <button onClick={() => setTasks(tks => tks.filter(t => t.id !== task.id))} className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
                           <Trash2 size={14} />
                        </button>
                     </div>
                  </div>

                  <h4 className="text-base font-black text-enba-dark mb-3 tracking-tight italic uppercase leading-none">{task.title}</h4>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6 line-clamp-3 italic opacity-80 group-hover:opacity-100">"{task.desc}"</p>

                  <div className="flex flex-wrap gap-3 mb-8">
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-widest italic leading-none">
                        <Package size={14} className="text-enba-orange" /> {project?.name}
                     </div>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                     <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic ${overdue ? 'text-rose-500' : 'text-gray-400'}`}>
                        <Clock size={14} /> {task.deadline ? new Date(task.deadline).toLocaleDateString('tr-TR') : 'SÜRESİZ'}
                     </div>
                     <div className="flex gap-3">
                        {status !== 'todo' && (
                          <button onClick={() => moveTask(task.id, status === 'done' ? 'doing' : 'todo')} className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 hover:bg-enba-dark hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-w-resize">
                             <ArrowLeft size={16} />
                          </button>
                        )}
                        {status !== 'done' && (
                          <button onClick={() => moveTask(task.id, status === 'todo' ? 'doing' : 'done')} className="w-10 h-10 rounded-xl bg-enba-dark text-white hover:bg-enba-orange flex items-center justify-center transition-all shadow-xl active:scale-90 cursor-e-resize">
                             <ArrowRight size={16} />
                          </button>
                        )}
                     </div>
                  </div>
                  {overdue && (
                    <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500 text-white flex items-center justify-center rotate-45 translate-x-1/2 -translate-y-1/2 shadow-lg z-20">
                       <AlertTriangle size={14} className="-rotate-45 translate-y-1" />
                    </div>
                  )}
               </div>
             );
           })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-10 p-10 animate-in fade-in duration-1000">
       <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-enba-dark rounded-[1.2rem] flex items-center justify-center text-enba-orange shadow-2xl border border-white/5">
                   <ClipboardList size={32} />
                </div>
                <div>
                   <h2 className="text-3xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">
                     Operasyon Matrixi
                   </h2>
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-[4px] mt-2 italic">Proje ve Görev Yönetim Merkezi</p>
                </div>
             </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setShowTaskForm(true)} className="px-10 py-5 bg-enba-dark text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[3px] shadow-2xl shadow-black/20 hover:bg-black transition-all flex items-center gap-4 group active:scale-95 border border-white/5">
                <PlusCircle size={20} className="text-enba-orange transition-transform group-hover:rotate-90" />
                Yeni Görev Ataması
             </button>
          </div>
       </div>

       <div className="flex gap-10 overflow-x-auto pb-20 custom-scrollbar -mx-4 px-4 h-[calc(100vh-280px)]">
          <KanbanColumn title="Backlog" status="todo" icon={Clock} color="#94a3b8" />
          <KanbanColumn title="İşlemde" status="doing" icon={RotateCw} color="#3b82f6" />
          <KanbanColumn title="Tamamlandı" status="done" icon={CheckCircle} color="#10b981" />
       </div>

       {/* Task Form Modal */}
       {showTaskForm && (
         <div className="fixed inset-0 bg-enba-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in duration-300 overflow-hidden relative group">
               <div className="absolute top-0 left-0 w-full h-2 bg-enba-orange shadow-lg shadow-enba-orange/20"></div>
               <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-enba-dark rounded-2xl flex items-center justify-center text-enba-orange shadow-2xl">
                        <PlusCircle size={32} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">Görev Matrix Girişi</h3>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-2">Yeni Operasyonel Kayıt Formu</p>
                     </div>
                  </div>
                  <button onClick={() => setShowTaskForm(false)} className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-300 transition-all hover:rotate-90">
                     <X size={32} />
                  </button>
               </div>
               <form onSubmit={handleAddTask} className="p-12 space-y-8">
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Görev Tanımı</label>
                        <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-base font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all placeholder:italic" placeholder="NE YAPILACAK?" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Operasyonel Detarlar</label>
                        <textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark min-h-[120px] focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all placeholder:italic" placeholder="GÖREV DETAYLARINI BURAYA YAZINIZ..." />
                     </div>
                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Öncelik Seviyesi</label>
                           <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all appearance-none italic">
                              <option value="low">DÜŞÜK</option>
                              <option value="medium">ORTA</option>
                              <option value="high">YÜKSEK / ACİL</option>
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Deadline</label>
                           <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Proje Bağlantısı</label>
                           <select value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all appearance-none italic">
                              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1 italic">Modül Referansı</label>
                           <select value={formData.moduleRef} onChange={e => setFormData({...formData, moduleRef: e.target.value})} className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all appearance-none italic">
                              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                           </select>
                        </div>
                     </div>
                  </div>
                  <button type="submit" className="w-full bg-enba-orange text-white rounded-[1.8rem] py-6 font-black text-xs uppercase tracking-[5px] shadow-2xl shadow-enba-orange/30 hover:brightness-110 transition-all mt-6 active:scale-95 group overflow-hidden relative">
                    <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                    SİSTEME KAYDET
                  </button>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

interface XProps {
  size: number;
}
const X: React.FC<XProps> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
export default Tasks;
