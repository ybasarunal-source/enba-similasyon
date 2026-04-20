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
  Package,
  Share2,
  RefreshCw,
  Download,
  LogOut as LogOutIcon,
  ChevronRight,
  Search,
  Kanban,
  List as ListIcon,
  MoreVertical,
  Layers,
  Filter,
  Check
} from 'lucide-react';
import { microsoftService, msalInstance } from '../api/microsoft';

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
  msTodoId?: string;
  msListId?: string;
}

interface Project {
  id: string;
  name: string;
  groupId?: string; // Custom grouping support
}

interface ProjectGroup {
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

  const [groups, setGroups] = useState<ProjectGroup[]>(() => {
    const saved = localStorage.getItem('enba_project_groups');
    return saved ? JSON.parse(saved) : [
      { id: 'g1', name: 'KRİTİK PROJELER' },
      { id: 'g2', name: 'RUTİN İŞLER' }
    ];
  });

  const [msAccount, setMsAccount] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ── Sync with LocalStorage ───────────────────────────────
  useEffect(() => {
    localStorage.setItem('enba_tasks', JSON.stringify(tasks));
    localStorage.setItem('enba_projects', JSON.stringify(projects));
    localStorage.setItem('enba_project_groups', JSON.stringify(groups));
  }, [tasks, projects, groups]);

  useEffect(() => {
    const initMSAL = async () => {
      const account = await microsoftService.getAccount();
      if (account) setMsAccount(account);
    };
    initMSAL();
  }, []);

  // ── UI States ────────────────────────────────────────────
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '', desc: '', priority: 'medium', deadline: '', projectId: projects[0]?.id || 'p1', moduleRef: 'genel'
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

    setTasks(prev => editingTask ? prev.map(t => t.id === editingTask.id ? newTask : t) : [...prev, newTask]);
    setShowTaskForm(false);
    setEditingTask(null);
    setFormData({ title: '', desc: '', priority: 'medium', deadline: '', projectId: projects[0]?.id || 'p1', moduleRef: 'genel' });

    if (msAccount) {
      const sync = async () => {
        const project = projects.find(p => p.id === newTask.projectId);
        const list = await microsoftService.ensureTodoList(project?.name || 'Enba Tasks');
        if (list) {
          const result: any = await microsoftService.syncTask(list.id, newTask as any, newTask.msTodoId);
          if (result?.id) {
            setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, msTodoId: result.id, msListId: list.id } : t));
          }
        }
      }
      sync();
    }
  };

  const moveTask = async (id: string | number, newStatus: 'todo' | 'doing' | 'done') => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    const task = tasks.find(t => t.id === id);
    if (msAccount && task?.msTodoId && task.msListId) {
      await microsoftService.syncTask(task.msListId, { ...task, status: newStatus }, task.msTodoId);
    }
  };

  const handleImportFromMs = async () => {
    if (!msAccount) return;
    setIsSyncing(true);
    try {
      const lists = await microsoftService.getTodoLists();
      let importedCount = 0;
      const newProjects = [...projects];
      const newTasks = [...tasks];

      for (const list of lists) {
        if (!newProjects.find(p => p.id === list.id)) {
          newProjects.push({ id: list.id, name: list.displayName, groupId: 'g2' });
        }
        const msTasks = await microsoftService.getTodoListTasks(list.id);
        for (const msTask of msTasks) {
          if (!newTasks.find(t => t.msTodoId === msTask.id)) {
            newTasks.push({
              id: Date.now() + Math.random(),
              title: msTask.title,
              desc: msTask.body?.content || '',
              priority: msTask.importance === 'high' ? 'high' : 'medium',
              deadline: msTask.dueDateTime?.dateTime || '',
              projectId: list.id,
              moduleRef: 'genel',
              status: msTask.status === 'completed' ? 'done' : (msTask.status === 'inProgress' ? 'doing' : 'todo'),
              createdAt: msTask.createdDateTime || new Date().toISOString(),
              msTodoId: msTask.id,
              msListId: list.id
            });
            importedCount++;
          }
        }
      }
      setProjects(newProjects);
      setTasks(newTasks);
      alert(`${importedCount} yeni görev ve eksik listeler aktarıldı.`);
    } catch (err) { console.error(err); }
    finally { setIsSyncing(false); }
  };

  // ── Computed ─────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesProject = selectedProjectId === 'all' || t.projectId === selectedProjectId;
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.desc.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesProject && matchesSearch;
    });
  }, [tasks, selectedProjectId, searchTerm]);

  // ── Components ───────────────────────────────────────────
  const TaskCard = ({ task }: { task: Task }) => (
    <div className="group bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all animate-fade-in relative overflow-hidden flex flex-col min-h-[110px]">
      <div className={`absolute top-0 left-0 w-1 h-full ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
      
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
          task.priority === 'high' ? 'bg-rose-50 text-rose-600' : task.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
        }`}>
          {task.priority === 'high' ? 'Acil' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
        </span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { setEditingTask(task); setFormData(task); setShowTaskForm(true); }} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-enba-dark transition-colors"><Pencil size={12} /></button>
          <button onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))} className="p-1 hover:bg-rose-50 rounded text-gray-400 hover:text-rose-600 transition-colors"><Trash2 size={12} /></button>
        </div>
      </div>

      <h4 className="text-[12px] font-bold text-enba-dark mb-0.5 line-clamp-1">{task.title}</h4>
      <p className="text-[10px] text-gray-400 mb-2 line-clamp-2 leading-tight">{task.desc}</p>

      <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
        <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-medium">
          <Calendar size={10} className={new Date(task.deadline) < new Date() && task.status !== 'done' ? 'text-rose-500' : ''} />
          {task.deadline ? new Date(task.deadline).toLocaleDateString('tr-TR') : 'Süresiz'}
        </div>
        <div className="flex gap-0.5">
          {task.status !== 'todo' && <button onClick={() => moveTask(task.id, task.status === 'done' ? 'doing' : 'todo')} className="w-5 h-5 flex items-center justify-center rounded bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors"><ArrowLeft size={10} /></button>}
          {task.status !== 'done' && <button onClick={() => moveTask(task.id, task.status === 'todo' ? 'doing' : 'done')} className="w-5 h-5 flex items-center justify-center rounded bg-enba-dark text-white hover:bg-black transition-colors"><ArrowRight size={10} /></button>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-[#FAFAFA] animate-fade-in">
      {/* ─── LEFT SIDEBAR ─────────────────────────────────── */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 relative z-10 shadow-sm">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-enba-dark rounded-xl flex items-center justify-center text-enba-orange shadow-lg">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-enba-dark tracking-tight uppercase">Operasyon</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Matrix v2.0</p>
            </div>
          </div>
          
          <button onClick={() => setSelectedProjectId('all')} className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all mb-4 ${selectedProjectId === 'all' ? 'bg-enba-dark text-white shadow-xl shadow-gray-200' : 'text-gray-400 hover:bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <Layers size={18} className={selectedProjectId === 'all' ? 'text-enba-orange' : ''} />
              <span className="text-xs font-bold uppercase tracking-wide">Tüm Görevler</span>
            </div>
            <span className="text-[10px] font-black opacity-50">{tasks.length}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sidebar-scrollbar custom-scrollbar pb-10">
          {groups.map(group => {
            const groupProjects = projects.filter(p => p.groupId === group.id || (!p.groupId && group.id === 'g1'));
            
            return (
              <div key={group.id} className="mb-8">
                <div className="px-4 mb-3 flex items-center justify-between group">
                  <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[2px]">{group.name}</h3>
                </div>
                <div className="space-y-1">
                  {groupProjects.map(project => (
                    <button 
                      key={project.id} 
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all ${selectedProjectId === project.id ? 'bg-orange-50 text-enba-orange' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FolderPlus size={16} className="flex-shrink-0" />
                        <span className="text-[11px] font-bold uppercase truncate">{project.name}</span>
                      </div>
                      <span className={`text-[9px] font-black ${selectedProjectId === project.id ? 'text-enba-orange/50' : 'text-gray-300'}`}>
                        {tasks.filter(t => t.projectId === project.id).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-gray-50 flex flex-col gap-3">
          <button 
            onClick={() => {
              if (confirm('TÜM görevleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
                setTasks([]);
              }
            }} 
            className="w-full py-3 border border-rose-100 bg-rose-50/30 rounded-xl text-[10px] font-black text-rose-400 uppercase tracking-[2px] hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={14} /> Tümünü Temizle
          </button>

          <button onClick={() => setShowProjectForm(true)} className="w-full py-3 border border-dashed border-gray-200 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-[2px] hover:border-enba-orange hover:text-enba-orange transition-all flex items-center justify-center gap-2">
            <PlusCircle size={14} /> Proje Ekle
          </button>
          
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className={`flex items-center justify-between mb-3 ${msAccount ? 'text-emerald-600' : 'text-gray-400'}`}>
              <div className="flex items-center gap-3">
                <Share2 size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">{msAccount ? 'Bulut Bağlı' : 'Bağlı Değil'}</span>
              </div>
              {msAccount && <button onClick={() => microsoftService.logout()} className="text-[9px] font-black text-rose-500 hover:underline uppercase">Bağlantıyı Kes</button>}
            </div>
            {!msAccount ? (
              <button 
                type="button"
                disabled={isConnecting}
                onClick={async () => {
                  setIsConnecting(true);
                  try {
                    const account = await microsoftService.loginPopup();
                    if (account) setMsAccount(account);
                  } finally {
                    setIsConnecting(false);
                  }
                }} 
                className={`w-full py-2.5 bg-[#0078d4] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95 transition-all ${isConnecting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'}`}
              >
                {isConnecting ? <RotateCw size={14} className="animate-spin" /> : null}
                {isConnecting ? 'Bağlanıyor...' : 'Microsoft To Do Bağla'}
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleImportFromMs} disabled={isSyncing} className="flex-1 py-2.5 bg-enba-dark text-white rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest gap-2 shadow-md hover:bg-black transition-all">
                  <Download size={14} className={isSyncing ? 'animate-bounce' : ''} /> Görevleri Çek
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Sub Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 flex-shrink-0 shadow-sm relative z-0">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-enba-dark tracking-tight leading-none uppercase italic">
                {selectedProjectId === 'all' ? 'Tüm Operasyonlar' : projects.find(p => p.id === selectedProjectId)?.name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">{filteredTasks.length} Aktif Görev</span>
                <div className="w-1 h-1 rounded-full bg-gray-200" />
                <span className="text-[10px] text-enba-orange font-black uppercase tracking-widest italic">Matrix v2</span>
              </div>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setViewMode('board')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'board' ? 'bg-white text-enba-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                <Kanban size={14} /> Matrix
              </button>
              <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-enba-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                <ListIcon size={14} /> Sıralı
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Görevlerde ara..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-gray-50 border-none rounded-xl px-10 py-2.5 text-[11px] font-medium text-enba-dark focus:ring-2 focus:ring-enba-orange/20 w-64 transition-all"
              />
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
            </div>
            <button onClick={() => setShowTaskForm(true)} className="px-6 py-2.5 bg-enba-orange text-white rounded-xl text-[10px] font-black uppercase tracking-[2px] shadow-lg shadow-orange-900/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
              <PlusCircle size={16} /> Yeni Atama
            </button>
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
          {viewMode === 'board' ? (
            <div className="h-full flex gap-5 p-6 min-w-[1000px]">
              {/* Kanban Columns */}
              {['todo', 'doing', 'done'].map((status) => {
                const columnTasks = filteredTasks.filter(t => t.status === status);
                const statusInfo = {
                  todo: { label: 'Yapılacak', icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100' },
                  doing: { label: 'İşlemde', icon: RotateCw, color: 'text-blue-500', bg: 'bg-blue-50' },
                  done: { label: 'Bitti', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                }[status as 'todo' | 'doing' | 'done'];

                return (
                  <div key={status} className="flex-1 flex flex-col min-w-[260px] max-w-[320px]">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${statusInfo.bg} flex items-center justify-center ${statusInfo.color}`}>
                          <statusInfo.icon size={14} className={status === 'doing' ? 'animate-spin-slow' : ''} />
                        </div>
                        <h3 className="text-[11px] font-black text-enba-dark font-uppercase tracking-widest">{statusInfo.label}</h3>
                        <span className="bg-white border border-gray-100 px-2 py-0.5 rounded-full text-[9px] font-black text-gray-400 shadow-sm">{columnTasks.length}</span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-20">
                      {columnTasks.map(task => <TaskCard key={task.id} task={task} />)}
                      {columnTasks.length === 0 && (
                        <div className="py-20 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-gray-300">
                          <Check size={24} className="opacity-20 mb-2" />
                          <span className="text-[9px] font-black uppercase tracking-widest italic">Görev Bulunmuyor</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 pb-20">
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/30">
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Operasyon Tanımı</th>
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Öncelik</th>
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Bitiş</th>
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map(task => (
                      <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-10 rounded-full ${task.status === 'done' ? 'bg-emerald-500' : task.status === 'doing' ? 'bg-blue-500' : 'bg-gray-200'}`} />
                            <div>
                              <div className="text-[13px] font-bold text-enba-dark tracking-tight">{task.title}</div>
                              <div className="text-[10px] text-gray-400 font-medium truncate max-w-sm mt-0.5">{task.desc}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-wider italic ${
                            task.priority === 'high' ? 'bg-rose-50 text-rose-600' : task.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {task.priority === 'high' ? 'Acil' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                          </span>
                        </td>
                        <td className="p-6">
                           <div className="text-[11px] font-bold text-enba-dark flex items-center gap-2 uppercase tracking-tight italic">
                             <Calendar size={14} className="text-gray-300" />
                             {task.deadline ? new Date(task.deadline).toLocaleDateString('tr-TR') : 'SÜRESİZ'}
                           </div>
                        </td>
                        <td className="p-6">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingTask(task); setFormData(task); setShowTaskForm(true); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-all"><Pencil size={14} /></button>
                            <button onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))} className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition-all"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredTasks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-[4px]">
                          Bu görünümde görev bulunmamaktadır
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── MODALS ───────────────────────────────────────── */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-enba-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden relative">
            <div className="h-2 bg-enba-orange" />
            <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <div>
                <h3 className="text-xl font-black text-enba-dark tracking-tight uppercase italic">{editingTask ? 'Görevi Düzenle' : 'Yeni Atama'}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Sisteme operasyonel kayıt girişi</p>
              </div>
              <button onClick={() => setShowTaskForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all">✕</button>
            </div>
            <form onSubmit={handleAddTask} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Görev Tanımı</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-bold text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all italic" placeholder="NE YAPILACAK?" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Detaylar</label>
                <textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-bold text-enba-dark min-h-[100px] focus:ring-2 focus:ring-enba-orange/20 transition-all italic" placeholder="DETAYLI AÇIKLAMA..." />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Öncelik</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-bold text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all italic appearance-none cursor-pointer">
                    <option value="low">DÜŞÜK</option>
                    <option value="medium">ORTA SEVİYE</option>
                    <option value="high">YÜKSEK / ACİL</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Deadline</label>
                  <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-bold text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Proje Bağlantısı</label>
                <select value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-bold text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all italic appearance-none cursor-pointer">
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-enba-orange text-white rounded-2xl py-5 font-black text-[12px] uppercase tracking-[4px] shadow-xl shadow-orange-950/20 hover:brightness-110 active:scale-95 transition-all mt-4">
                {editingTask ? 'GÜNCELLE' : 'SİSTEME KAYDET'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showProjectForm && (
        <div className="fixed inset-0 bg-enba-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-10 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-enba-dark" />
            <h3 className="text-xl font-black text-enba-dark tracking-tight uppercase italic mb-8">Yeni Proje</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1 mb-2 block">Proje Adı</label>
                <input id="newProjName" className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all italic" placeholder="PROJE ADI..." />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1 mb-2 block">Grup</label>
                <select id="newProjGroup" className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all italic appearance-none cursor-pointer">
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowProjectForm(false)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">İPTAL</button>
                <button onClick={() => {
                  const name = (document.getElementById('newProjName') as HTMLInputElement).value;
                  const gId = (document.getElementById('newProjGroup') as HTMLSelectElement).value;
                  if (name) {
                    setProjects(prev => [...prev, { id: 'p-' + Date.now(), name, groupId: gId }]);
                    setShowProjectForm(false);
                  }
                }} className="flex-1 py-4 bg-enba-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-black/10 transition-all">EKLE</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
