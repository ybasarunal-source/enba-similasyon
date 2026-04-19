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
  LogOut as LogOutIcon
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
  msTodoId?: string; // Microsoft To Do ID
  msListId?: string; // Microsoft To Do List ID
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

  const [msAccount, setMsAccount] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'doing' | 'done'>('all');

  // ── Sync with LocalStorage ───────────────────────────────
  useEffect(() => {
    const initMSAL = async () => {
      try {
        await msalInstance.initialize();
        
        // Önce redirect sonucunu işle (girişten dönüldüyse)
        const response = await msalInstance.handleRedirectPromise();
        if (response && response.account) {
          setMsAccount(response.account);
        } else {
          // Redirect yoksa mevcut hesapları kontrol et
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            setMsAccount(accounts[0]);
          }
        }
      } catch (err) {
        console.error("MSAL Init Error:", err);
      }
    };
    
    initMSAL();
    
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

    // Sync newly added task if connected
    if (msAccount && !editingTask) {
      (async () => {
        const project = projects.find(p => p.id === (newTask.projectId || 'p1'));
        const listName = project?.name || 'Enba Tasks';
        const list = await microsoftService.ensureTodoList(listName);
        if (list) {
          const result: any = await microsoftService.syncTask(list.id, newTask as any);
          if (result && result.id) {
            setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, msTodoId: result.id, msListId: list.id } : t));
          }
        }
      })();
    } else if (msAccount && editingTask) {
       // Update existing
       (async () => {
         if (newTask.msListId && newTask.msTodoId) {
            await microsoftService.syncTask(newTask.msListId, newTask as any, newTask.msTodoId);
         }
       })();
    }
  };

  const moveTask = async (id: string | number, newStatus: 'todo' | 'doing' | 'done') => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    // Sync if connected
    const taskToSync = tasks.find(t => t.id === id);
    if (msAccount && taskToSync) {
      const project = projects.find(p => p.id === taskToSync.projectId);
      const listName = project?.name || 'Enba Tasks';
      const list = await microsoftService.ensureTodoList(listName);
      if (list) {
        await microsoftService.syncTask(list.id, { ...taskToSync, status: newStatus }, taskToSync.msTodoId);
      }
    }
  };

  const handleMsLogin = () => microsoftService.login();
  const handleMsLogout = () => {
    microsoftService.logout();
    setMsAccount(null);
  };

  const handleBulkSync = async () => {
    if (!msAccount) return;
    setIsSyncing(true);
    try {
      const currentTasks = [...tasks];
      for (let i = 0; i < currentTasks.length; i++) {
        const task = currentTasks[i];
        const project = projects.find(p => p.id === task.projectId);
        const listName = project?.name || 'Enba Tasks';
        const list = await microsoftService.ensureTodoList(listName);
        
        if (list) {
          const result: any = await microsoftService.syncTask(list.id, task as any, task.msTodoId);
          if (result && result.id) {
            currentTasks[i] = { ...task, msTodoId: result.id, msListId: list.id };
          }
        }
      }
      setTasks(currentTasks);
      alert('Tüm görevler Microsoft To Do ile senkronize edildi!');
    } catch (err) {
      console.error('Bulk Sync Error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportFromMs = async () => {
    if (!msAccount) return;
    setIsSyncing(true);
    try {
      const lists = await microsoftService.getTodoLists();
      let importedCount = 0;
      let updatedCount = 0;
      const newTasksList = [...tasks];
      const currentProjects = [...projects];
      let projectsChanged = false;

      // 1. Önce eksik projeleri (listeleri) oluşturalım
      for (const list of lists) {
        const existingProject = currentProjects.find(p => 
          p.id === list.id || p.name.toLowerCase() === list.displayName.toLowerCase()
        );
        
        if (!existingProject) {
          currentProjects.push({ id: list.id, name: list.displayName });
          projectsChanged = true;
        }
      }

      if (projectsChanged) {
        setProjects(currentProjects);
        localStorage.setItem('enba_projects', JSON.stringify(currentProjects));
      }

      // 2. Şimdi görevleri aktaralım
      for (const list of lists) {
        const msTasks = await microsoftService.getTodoListTasks(list.id);
        const project = currentProjects.find(p => p.id === list.id || p.name.toLowerCase() === list.displayName.toLowerCase()) || currentProjects[0];

        for (const msTask of msTasks) {
          const existingIndex = newTasksList.findIndex(t => t.msTodoId === msTask.id);
          
          const mappedTask: Task = {
            id: existingIndex >= 0 ? newTasksList[existingIndex].id : Date.now() + Math.random(),
            title: msTask.title,
            desc: msTask.body?.content || '',
            priority: msTask.importance === 'high' ? 'high' : (msTask.importance === 'low' ? 'low' : 'medium'),
            deadline: msTask.dueDateTime?.dateTime ? new Date(msTask.dueDateTime.dateTime).toISOString() : '',
            projectId: project.id,
            moduleRef: 'genel',
            status: msTask.status === 'completed' ? 'done' : (msTask.status === 'inProgress' ? 'doing' : 'todo'),
            createdAt: existingIndex >= 0 ? newTasksList[existingIndex].createdAt : new Date().toISOString(),
            msTodoId: msTask.id,
            msListId: list.id
          };

          if (existingIndex >= 0) {
            newTasksList[existingIndex] = mappedTask;
            updatedCount++;
          } else {
            newTasksList.push(mappedTask);
            importedCount++;
          }
        }
      }

      setTasks(newTasksList);
      alert(`Senkronizasyon Tamamlandı:\n- ${importedCount} yeni görev eklendi\n- ${updatedCount} görev güncellendi\n- ${projectsChanged ? 'Yeni listeler proje olarak eklendi.' : 'Proje yapısı korundu.'}`);
    } catch (err) {
      console.error('Import Error:', err);
      alert('İçe aktarma sırasında bir hata oluştu.');
    } finally {
      setIsSyncing(false);
    }
  };

  const isOverdue = (date: string, status: string) => {
    if (!date || status === 'done') return false;
    return new Date(date) < new Date();
  };

  const { activeTasksGrouped, doneTasks } = useMemo(() => {
    const filtered = tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.desc.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const active = filtered.filter(t => t.status !== 'done');
    const done = filtered.filter(t => t.status === 'done');

    // Group active by project
    const grouped: Record<string, Task[]> = {};
    active.forEach(t => {
      if (!grouped[t.projectId]) grouped[t.projectId] = [];
      grouped[t.projectId].push(t);
    });

    return { activeTasksGrouped: grouped, doneTasks: done };
  }, [tasks, searchTerm, statusFilter]);

  const TaskRow = ({ task }: { task: Task }) => {
    const overdue = isOverdue(task.deadline, task.status);
    const project = projects.find(p => p.id === task.projectId);
    const cat = categories.find(c => c.id === task.moduleRef);

    const statusIcons = {
      todo: <Clock size={16} className="text-slate-400" />,
      doing: <RotateCw size={16} className="text-blue-500 animate-spin-slow" />,
      done: <CheckCircle size={16} className="text-emerald-500" />
    };

    return (
      <tr className="group hover:bg-slate-50/80 transition-all border-b border-gray-50">
        <td className="py-5 px-4">
          <div className="flex items-center gap-4">
             <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                {statusIcons[task.status]}
             </div>
             <div>
                <div className="text-xs font-black text-enba-dark uppercase italic tracking-tight">{task.title}</div>
                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 max-w-[250px] truncate">{task.desc || 'Açıklama yok'}</div>
             </div>
          </div>
        </td>
        <td className="py-5 px-4">
           <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
              <Package size={12} className="text-enba-orange" /> {project?.name}
           </div>
        </td>
        <td className="py-5 px-4">
           <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-[2px] italic border ${
              task.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' :
              task.priority === 'medium' ? 'bg-orange-50 text-orange-600 border-orange-100' :
              'bg-blue-50 text-blue-600 border-blue-100'
           }`}>
              {task.priority === 'high' ? 'ACİL' : task.priority === 'medium' ? 'ORTA' : 'DÜŞÜK'}
           </span>
        </td>
        <td className="py-5 px-4">
           <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest italic ${overdue ? 'text-rose-500' : 'text-gray-400'}`}>
              <Calendar size={12} /> {task.deadline ? new Date(task.deadline).toLocaleDateString('tr-TR') : 'SÜRESİZ'}
           </div>
        </td>
        <td className="py-5 px-4">
           <div className="flex items-center gap-2">
              <select 
                value={task.status} 
                onChange={(e) => moveTask(task.id, e.target.value as any)}
                className="bg-gray-50 border border-transparent rounded-lg px-2 py-1 text-[9px] font-black text-enba-dark uppercase tracking-widest italic focus:bg-white focus:border-enba-orange/20 outline-none transition-all cursor-pointer"
              >
                 <option value="todo">YAPILACAK</option>
                 <option value="doing">İŞLEMDE</option>
                 <option value="done">TAMAMLANDI</option>
              </select>
           </div>
        </td>
        <td className="py-5 px-4">
           <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingTask(task); setFormData(task); setShowTaskForm(true); }} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-enba-dark hover:text-white flex items-center justify-center transition-all">
                 <Pencil size={12} />
              </button>
              <button onClick={async () => {
                 if (msAccount && task.msListId && task.msTodoId) {
                   await microsoftService.deleteTask(task.msListId, task.msTodoId);
                 }
                 setTasks(tks => tks.filter(t => t.id !== task.id));
              }} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
                 <Trash2 size={12} />
              </button>
           </div>
        </td>
      </tr>
    );
  };

  const TaskTableHeader = () => (
    <thead>
       <tr className="bg-gray-50/50 border-b border-gray-100">
          <th className="py-4 px-6 text-[9px] font-black text-gray-400 uppercase tracking-[4px] italic">Görev Tanımı</th>
          <th className="py-4 px-4 text-[9px] font-black text-gray-400 uppercase tracking-[4px] italic">Proje</th>
          <th className="py-4 px-4 text-[9px] font-black text-gray-400 uppercase tracking-[4px] italic">Öncelik</th>
          <th className="py-4 px-4 text-[9px] font-black text-gray-400 uppercase tracking-[4px] italic">Deadline</th>
          <th className="py-4 px-4 text-[9px] font-black text-gray-400 uppercase tracking-[4px] italic">Durum</th>
          <th className="py-4 px-6 text-[9px] font-black text-gray-400 uppercase tracking-[4px] italic text-right">İşlem</th>
       </tr>
    </thead>
  );

  return (
    <div className="flex flex-col gap-10 p-10 animate-in fade-in duration-1000">
       {/* Header Code remains same but simplified */}
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
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-[4px] mt-2 italic">Gruplandırılmış Görev Yönetimi</p>
                </div>
             </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
             <div className="relative group">
                <input 
                  type="text" 
                  placeholder="ARAMA..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-100 rounded-[1.2rem] px-6 py-3 text-[10px] font-black text-enba-dark uppercase tracking-widest italic outline-none focus:ring-2 focus:ring-enba-orange/20 transition-all w-[240px] shadow-sm"
                />
                <Hash size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
             </div>
             
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value as any)}
               className="bg-white border border-gray-100 rounded-[1.2rem] px-5 py-3 text-[9px] font-black text-enba-dark uppercase tracking-widest italic outline-none shadow-sm cursor-pointer"
             >
                <option value="all">FİLTRE: TÜMÜ</option>
                <option value="todo">YAPILACAK</option>
                <option value="doing">İŞLEMDE</option>
                <option value="done">TAMAMLANDI</option>
             </select>

             <button onClick={() => setShowTaskForm(true)} className="px-8 py-3 bg-enba-dark text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-[3px] shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-95 border border-white/5">
                <PlusCircle size={18} className="text-enba-orange" />
                Yeni Atama
             </button>

             {/* Microsoft Buttons Simplified */}
             <div className="flex gap-2">
                {!msAccount ? (
                  <button onClick={handleMsLogin} className="px-5 py-3 bg-[#0078d4] text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-[2px] shadow-md hover:brightness-110 flex items-center gap-2">
                     <Share2 size={16} />
                  </button>
                ) : (
                  <>
                    <button onClick={handleImportFromMs} disabled={isSyncing} className="px-5 py-3 bg-blue-600 text-white rounded-[1.2rem] font-black text-[10px] uppercase shadow-md flex items-center gap-2 disabled:opacity-50">
                       <Download size={16} />
                    </button>
                    <button onClick={handleBulkSync} disabled={isSyncing} className="px-5 py-3 bg-emerald-600 text-white rounded-[1.2rem] font-black text-[10px] uppercase shadow-md flex items-center gap-2 disabled:opacity-50">
                       <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={handleMsLogout} className="w-10 h-10 bg-rose-500 text-white rounded-[1rem] flex items-center justify-center shadow-md">
                       <LogOutIcon size={16} />
                    </button>
                  </>
                )}
             </div>
          </div>
       </div>

       {/* ACTIVE TASKS BY PROJECT */}
       <div className="space-y-10">
          {projects.map(project => {
            const projectTasks = activeTasksGrouped[project.id] || [];
            if (projectTasks.length === 0) return null;

            return (
              <div key={project.id} className="space-y-4">
                 <div className="flex items-center gap-4 px-2">
                    <div className="w-1.5 h-6 bg-enba-orange rounded-full shadow-lg shadow-enba-orange/30"></div>
                    <h3 className="text-sm font-black text-enba-dark tracking-tighter uppercase italic">{project.name}</h3>
                    <span className="text-[9px] font-black bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">{projectTasks.length} AKTİF</span>
                 </div>
                 <div className="bg-white rounded-[2rem] shadow-xl border border-gray-50 overflow-hidden">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                          <TaskTableHeader />
                          <tbody>
                             {projectTasks.map(task => <TaskRow key={task.id} task={task} />)}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
            );
          })}

          {/* EMPTY STATE IF NO ACTIVE TASKS */}
          {Object.keys(activeTasksGrouped).length === 0 && (
              <div className="py-20 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
                 <ClipboardList size={48} className="mx-auto text-gray-200 mb-4" />
                 <div className="text-[10px] font-black text-gray-300 uppercase tracking-[4px] italic">Aktif Operasyon Bulunmamaktadır</div>
              </div>
          )}
       </div>

       {/* COMPLETED TASKS SECTION */}
       {doneTasks.length > 0 && (
         <div className="mt-10 space-y-4 opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-4 px-2">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                <h3 className="text-sm font-black text-gray-400 tracking-tighter uppercase italic">Tamamlanan Görevler</h3>
                <span className="text-[9px] font-black bg-emerald-50 text-emerald-500 px-2 py-0.5 rounded-full">{doneTasks.length} BİTEN</span>
            </div>
            <div className="bg-white rounded-[2rem] shadow-lg border border-gray-50 overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <TaskTableHeader />
                     <tbody>
                        {doneTasks.map(task => <TaskRow key={task.id} task={task} />)}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
       )}

       {/* Task Form Modal */}

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
