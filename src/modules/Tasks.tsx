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
  Check,
  Maximize,
  Minimize
} from 'lucide-react';
import { microsoftService } from '../api/microsoft';
import { profileAPI } from '../api/supabase';

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
    const parsed: ProjectGroup[] = saved ? JSON.parse(saved) : [{ id: 'g2', name: 'RUTİN İŞLER' }];
    return parsed.filter(g => g.id !== 'g1').map(g => g.id === 'g2' ? { ...g, name: 'LİSTELER' } : g);
  });

  const [msAccount, setMsAccount] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    return localStorage.getItem('enba_tasks_compact') === 'true';
  });

  // ── Sync with LocalStorage ───────────────────────────────
  useEffect(() => {
    localStorage.setItem('enba_tasks', JSON.stringify(tasks));
    localStorage.setItem('enba_projects', JSON.stringify(projects));
    localStorage.setItem('enba_project_groups', JSON.stringify(groups));
  }, [tasks, projects, groups]);

  useEffect(() => {
    const recoverSession = async () => {
      try {
        // 1. Redirect flow geri dönüşü kontrol et
        const redirectOrigin = localStorage.getItem('msal_redirect_origin');
        const redirectAccount = await microsoftService.getRedirectAccount();
        if (redirectAccount) {
          if (redirectOrigin) localStorage.removeItem('msal_redirect_origin');
          // Bağlı hesabı Supabase profile'a kaydet
          const profile = await profileAPI.getMyProfile();
          if (profile) {
            await profileAPI.updateProfile(profile.id, {
              ms_account_id: redirectAccount.homeAccountId,
              ms_account_username: redirectAccount.username,
            });
          }
          setMsAccount(redirectAccount);
          handleSyncAll(redirectAccount);
          return;
        }

        // 2. Supabase profile'dan kayıtlı MS hesabını oku, sessiz bağlantı dene
        const profile = await profileAPI.getMyProfile();
        if (profile?.ms_account_username) {
          const silentAccount = await microsoftService.trySilentLogin(profile.ms_account_username);
          if (silentAccount) {
            setMsAccount(silentAccount);
            handleSyncAll(silentAccount);
            return;
          }
          // SSO başarısız — kullanıcıya bağlı hesap bilgisini göster, yeniden bağlanmasını bekle
          setMsAccount({ username: profile.ms_account_username, needsReconnect: true });
        }
      } catch (err) {
        console.warn('MSAL: Session recovery failed:', err);
      }
    };
    recoverSession();
  }, []);

  const handleConnectMs = async () => {
    setIsConnecting(true);
    try {
      // loginRedirect sayfayı Azure AD'ye yönlendirir, geri döndüğünde useEffect hesabı yakalar
      await microsoftService.loginRedirect();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Microsoft To-Do bağlantısı başarısız oldu.');
      setIsConnecting(false);
    }
    // redirect gerçekleşirse bu satıra ulaşılmaz, finally yerine sadece hata durumunda setIsConnecting(false)
  };

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
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingTask;
    const newTask: Task = {
      ...formData as Task,
      id: isNew ? Date.now() : editingTask!.id,
      status: isNew ? 'todo' : editingTask!.status,
      createdAt: isNew ? new Date().toISOString() : editingTask!.createdAt,
      msTodoId: editingTask?.msTodoId,
      msListId: editingTask?.msListId
    };

    setTasks(prev => isNew ? [...prev, newTask] : prev.map(t => t.id === newTask.id ? newTask : t));
    setShowTaskForm(false);
    setEditingTask(null);

    // Microsoft Push
    if (msAccount) {
      try {
        const list = await microsoftService.ensureTodoList('Enba Tasks');
        if (list) {
          const result = await microsoftService.syncTask(list.id, newTask, newTask.msTodoId);
          if (result && result.id) {
            setTasks(current => current.map(t => t.id === newTask.id ? { ...t, msTodoId: result.id, msListId: list.id } : t));
          }
        }
      } catch (err) { console.error('MS Push Error:', err); }
    }
    setFormData({ title: '', desc: '', priority: 'medium', deadline: '', projectId: projects[0]?.id || 'p1', moduleRef: 'genel' });
  };

  const toggleTask = async (id: string | number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    
    // Local update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

    // Microsoft Update
    if (msAccount && task.msTodoId && task.msListId) {
      await microsoftService.syncTask(task.msListId, { ...task, status: newStatus }, task.msTodoId);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm('Bu görev silinecek. Emin misiniz?')) return;
    
    setTasks(prev => prev.filter(t => t.id !== task.id));

    if (msAccount && task.msTodoId && task.msListId) {
      await microsoftService.deleteTask(task.msListId, task.msTodoId);
    }
  };

  const handleSyncAll = async (accountInstance = msAccount) => {
    if (!accountInstance || (accountInstance as any).needsReconnect) return;
    setIsSyncing(true);
    setSyncStatus('Senkronize ediliyor...');

    try {
      const list = await microsoftService.ensureTodoList('Enba Tasks');
      if (!list) throw new Error('Task listesi bulunamadı.');

      const msTasks = await microsoftService.getTodoListTasks(list.id);

      // Karşılaştırma & birleştirme — side effect'siz saf fonksiyon
      setTasks(current => {
        const cleanText = (s: string) =>
          s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();

        const msStatusMap = (s: string): 'todo' | 'doing' | 'done' =>
          s === 'completed' ? 'done' : s === 'inProgress' ? 'doing' : 'todo';

        const updatedTasks = current.map(localTask => {
          if (!localTask.msTodoId) return localTask;
          const msTask = msTasks.find((t: any) => t.id === localTask.msTodoId);
          if (!msTask) return localTask;

          const msStatus = msStatusMap(msTask.status);
          const hasStatusDiff = localTask.status !== msStatus;
          const hasTitleDiff = cleanText(localTask.title) !== cleanText(msTask.title || '');
          const hasDescDiff  = cleanText(localTask.desc || '') !== cleanText(msTask.body?.content || '');

          if (hasStatusDiff || hasTitleDiff || hasDescDiff) {
            return { ...localTask, status: msStatus, title: msTask.title, desc: msTask.body?.content || '' };
          }
          return localTask;
        });

        const knownIds = new Set(current.map(t => t.msTodoId).filter(Boolean));
        const newTasks: Task[] = msTasks
          .filter((t: any) => !knownIds.has(t.id))
          .map((t: any) => ({
            id: 'ms-' + t.id,
            title: t.title,
            desc: t.body?.content || '',
            priority: t.importance === 'high' ? 'high' : 'medium',
            deadline: t.dueDateTime?.dateTime || '',
            projectId: projects[0]?.id || 'p1',
            moduleRef: 'genel',
            status: msStatusMap(t.status),
            createdAt: t.createdDateTime || new Date().toISOString(),
            msTodoId: t.id,
            msListId: list.id,
          } as Task));

        return [...updatedTasks, ...newTasks];
      });

      setSyncStatus(`${msTasks.length} görev kontrol edildi.`);
      setTimeout(() => setSyncStatus(''), 4000);

    } catch (err: any) {
      console.error('Sync Error:', err);
      setSyncStatus(err?.message || 'Senkronizasyon başarısız.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportFromMs = async () => {
    if (!msAccount) return;
    setIsSyncing(true);
    console.log('Importing from Microsoft...');
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

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        const matchesProject = selectedProjectId === 'all' || t.projectId === selectedProjectId;
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || (t.desc || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesProject && matchesSearch;
      })
      .sort((a, b) => {
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        return 0;
      });
  }, [tasks, selectedProjectId, searchTerm]);

  const TaskCard = ({ task }: { task: Task }) => {
    const isDone = task.status === 'done';
    
    return (
      <div className={`group bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm transition-all animate-fade-in relative overflow-hidden flex items-center gap-3 ${isDone ? 'opacity-50 grayscale-[0.5]' : 'hover:shadow-md'}`}>
        <div className={`absolute top-0 left-0 w-1 h-full ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
        
        {/* Checkbox */}
        <button 
          onClick={() => toggleTask(task.id)}
          className={`w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-transparent hover:border-emerald-500'}`}
        >
          <Check size={12} strokeWidth={4} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <h4 className={`text-[12px] font-bold text-enba-dark truncate pr-2 ${isDone ? 'line-through text-gray-400' : ''}`}>{task.title}</h4>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={() => { setEditingTask(task); setFormData(task); setShowTaskForm(true); }} className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-enba-dark transition-colors"><Pencil size={11} /></button>
              <button onClick={() => handleDeleteTask(task)} className="p-0.5 hover:bg-rose-50 rounded text-gray-400 hover:text-rose-600 transition-colors"><Trash2 size={11} /></button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
            <Calendar size={10} className={new Date(task.deadline) < new Date() && task.status !== 'done' ? 'text-rose-500' : ''} />
            <span>{task.deadline ? new Date(task.deadline).toLocaleDateString('tr-TR') : 'SÜRESİZ'}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] animate-fade-in overflow-hidden">
      {/* ─── LEFT SIDEBAR ─────────────────────────────────── */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 relative z-10 shadow-sm overflow-hidden">
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
            const groupProjects = projects.filter(p => p.groupId === group.id || (!p.groupId && group.id === 'g2'));
            
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
            <div className={`flex items-center justify-between mb-3 ${msAccount && !msAccount.needsReconnect ? 'text-emerald-600' : msAccount?.needsReconnect ? 'text-amber-500' : 'text-gray-400'}`}>
              <div className="flex items-center gap-3">
                <Share2 size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {msAccount && !msAccount.needsReconnect ? 'Bulut Bağlı' : msAccount?.needsReconnect ? 'Yeniden Bağlan' : 'Bağlı Değil'}
                </span>
              </div>
              {msAccount && !msAccount.needsReconnect && (
                <button onClick={() => microsoftService.logout()} className="text-[9px] font-black text-rose-500 hover:underline uppercase">Kes</button>
              )}
            </div>
            {msAccount?.username && (
              <p className="text-[9px] text-gray-400 font-bold truncate mb-2">{msAccount.username}</p>
            )}
            {(!msAccount || msAccount.needsReconnect) ? (
              <button
                onClick={handleConnectMs}
                disabled={isConnecting}
                className={`w-full py-2.5 bg-[#0078d4] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95 transition-all ${isConnecting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'}`}
              >
                {isConnecting ? <RotateCw size={14} className="animate-spin" /> : null}
                {isConnecting ? 'Bağlanıyor...' : msAccount?.needsReconnect ? 'Yeniden Bağlan' : 'Microsoft To Do Bağla'}
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
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 shadow-sm relative z-0">
          <div className="flex items-center gap-4">
            <div className="flex flex-col border-r border-gray-100 pr-4">
              <h1 className="text-sm font-black text-enba-dark tracking-tight leading-none uppercase italic">
                {selectedProjectId === 'all' ? 'Tüm Operasyonlar' : projects.find(p => p.id === selectedProjectId)?.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">{filteredTasks.length} Aktif</span>
                <div className="w-0.5 h-0.5 rounded-full bg-gray-200" />
                <span className="text-[9px] text-enba-orange/60 font-black uppercase tracking-widest italic">Matrix v2</span>
              </div>
            </div>

            <div className="flex bg-gray-100 p-0.5 rounded-lg">
              <button onClick={() => setViewMode('board')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'board' ? 'bg-white text-enba-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Board Görünümü">
                <Kanban size={12} /> Matrix
              </button>
              <button onClick={() => setViewMode('list')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-enba-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Liste Görünümü">
                <ListIcon size={12} /> Sıralı
              </button>
            </div>

            <button 
              onClick={() => setIsCompact(!isCompact)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isCompact ? 'bg-enba-orange/10 text-enba-orange border border-enba-orange/20' : 'bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100'}`}
            >
              {isCompact ? <Maximize size={12} /> : <Minimize size={12} />}
              {isCompact ? 'Geniş' : 'Dar'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Görevlerde ara..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-gray-50 border-none rounded-lg px-9 py-2 text-[10px] font-medium text-enba-dark focus:ring-2 focus:ring-enba-orange/20 w-48 focus:w-64 transition-all"
              />
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            </div>
            <div className="flex items-center gap-2">
              {syncStatus && <span className="text-[8px] text-enba-orange font-black uppercase animate-pulse">{syncStatus}</span>}
              <button 
                onClick={() => handleSyncAll()}
                className={`p-2 rounded-xl border border-gray-100 text-gray-400 hover:text-enba-orange hover:bg-orange-50 transition-all ${isSyncing ? 'animate-spin border-enba-orange/20 text-enba-orange' : ''}`}
                title="Senkronize Et"
                disabled={!msAccount || isSyncing}
              >
                <RotateCw size={16} />
              </button>
            </div>
            <button onClick={() => setShowTaskForm(true)} className="bg-enba-dark text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-[2px] shadow-lg shadow-black/10 hover:bg-black hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2">
              <PlusCircle size={14} /> Yeni Atama
            </button>
          </div>
        </header>

        {/* Unitfed High-Density List View */}
        <div className="flex-1 overflow-hidden h-full">
            <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <h3 className="text-sm font-black text-enba-dark uppercase tracking-widest italic">Operasyon Akışı</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[2px] mt-0.5">Tüm Görevler (Sıralı)</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-[10px] font-black text-enba-orange italic uppercase">
                  {filteredTasks.filter(t => t.status !== 'done').length} Bekleyen Görev
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-4 custom-scrollbar pb-10">
                {filteredTasks.map(task => <TaskCard key={task.id} task={task} />)}
                {filteredTasks.length === 0 && (
                  <div className="py-20 border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-gray-300">
                    <ClipboardList size={32} className="opacity-20 mb-4" />
                    <span className="text-[10px] font-black uppercase tracking-[4px] italic">Kayıtlı Görev Bulunmuyor</span>
                  </div>
                )}
              </div>
            </div>
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
