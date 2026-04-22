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
  Minimize,
  Pin
} from 'lucide-react';
import { microsoftService } from '../api/microsoft';
import { googleService } from '../api/google';
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
  source: 'local' | 'outlook' | 'google';
  msTodoId?: string;
  msListId?: string;
  gTaskId?: string;
  gListId?: string;
  isPinned?: boolean;
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
    const parsed: Task[] = saved ? JSON.parse(saved) : [];
    // Ensure all existing tasks have a source
    return parsed.map(t => ({ ...t, source: t.source || 'local' }));
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('enba_projects');
    return saved ? JSON.parse(saved) : [
      { id: 'p1', name: 'GENEL' }
    ];
  });

  const [groups, setGroups] = useState<ProjectGroup[]>(() => {
    const saved = localStorage.getItem('enba_project_groups');
    const parsed: ProjectGroup[] = saved ? JSON.parse(saved) : [{ id: 'g2', name: 'RUTİN İŞLER' }];
    return parsed.filter(g => g.id !== 'g1').map(g => g.id === 'g2' ? { ...g, name: 'LİSTELER' } : g);
  });

  const [msAccount, setMsAccount] = useState<any>(null);
  const [googleAccount, setGoogleAccount] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string>('none');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    return localStorage.getItem('enba_tasks_compact') === 'true';
  });
  const [sourceFilter, setSourceFilter] = useState<'all' | 'google' | 'outlook' | 'local'>('all');

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

    // Check Google Auth return
    if (googleService.handleAuthReturn()) {
      setGoogleAccount({ name: 'Google Kullanıcısı' });
    }
    const gToken = googleService.getAccessToken();
    if (gToken) {
      setGoogleAccount({ name: 'Google Kullanıcısı' });
    }
  }, []);

  const handleConnectGoogle = () => {
    googleService.loginRedirect();
  };

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

  // ── Proje Düzenle / Sil ──────────────────────────────────
  const handleRenameProject = () => {
    if (!editingProject || !editingProjectName.trim()) return;
    const updated = projects.map(p =>
      p.id === editingProject.id ? { ...p, name: editingProjectName.trim().toUpperCase() } : p
    );
    setProjects(updated);
    localStorage.setItem('enba_projects', JSON.stringify(updated));
    setEditingProject(null);
  };

  const handleDeleteProject = () => {
    if (!deletingProject) return;
    if (deleteTargetId === 'delete') {
      const updatedTasks = tasks.filter(t => t.projectId !== deletingProject.id);
      setTasks(updatedTasks);
      localStorage.setItem('enba_tasks', JSON.stringify(updatedTasks));
    } else if (deleteTargetId !== 'none') {
      const updatedTasks = tasks.map(t =>
        t.projectId === deletingProject.id ? { ...t, projectId: deleteTargetId } : t
      );
      setTasks(updatedTasks);
      localStorage.setItem('enba_tasks', JSON.stringify(updatedTasks));
    }
    const updatedProjects = projects.filter(p => p.id !== deletingProject.id);
    setProjects(updatedProjects);
    localStorage.setItem('enba_projects', JSON.stringify(updatedProjects));
    if (selectedProjectId === deletingProject.id) setSelectedProjectId('all');
    setDeletingProject(null);
    setDeleteTargetId('none');
  };

  // ── Görev Listesini Değiştir ─────────────────────────────
  const handleMoveTask = (taskId: string | number, newProjectId: string) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, projectId: newProjectId } : t);
    setTasks(updated);
    localStorage.setItem('enba_tasks', JSON.stringify(updated));
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
      source: isNew ? 'local' : editingTask!.source,
      msTodoId: editingTask?.msTodoId,
      msListId: editingTask?.msListId,
      gTaskId: editingTask?.gTaskId,
      gListId: editingTask?.gListId
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

  const togglePin = (taskId: string | number) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, isPinned: !t.isPinned } : t);
    setTasks(updated);
    localStorage.setItem('enba_tasks', JSON.stringify(updated));
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
      const lists = await microsoftService.getTodoLists();
      if (!lists.length) throw new Error('Microsoft Todo listeleri alınamadı.');

      // Tüm listelerden görev çek, her task'a liste bilgisini ekle
      const allMsTasks: any[] = [];
      for (const list of lists) {
        const listTasks = await microsoftService.getTodoListTasks(list.id);
        listTasks.forEach((t: any) => {
          t._listId = list.id;
          t._listName = list.displayName;
        });
        allMsTasks.push(...listTasks);
      }
      const msTasks = allMsTasks;

      // Eksik projeleri oluştur (MS liste → Enba proje eşleşmesi)
      const updatedProjects = [...projects];
      for (const list of lists) {
        if (!updatedProjects.find(p => p.id === list.id)) {
          updatedProjects.push({ id: list.id, name: list.displayName.toUpperCase(), groupId: 'g2' });
        }
      }
      if (updatedProjects.length !== projects.length) {
        setProjects(updatedProjects);
        localStorage.setItem('enba_projects', JSON.stringify(updatedProjects));
      }

      const cleanText = (s: string) =>
        s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
      const msStatusMap = (s: string): 'todo' | 'doing' | 'done' =>
        s === 'completed' ? 'done' : s === 'inProgress' ? 'doing' : 'todo';

      const snapshot = tasks;
      let updatedCount = 0;

      const updatedTasks = snapshot.map(localTask => {
        if (!localTask.msTodoId) return localTask;
        const msTask = msTasks.find(t => t.id === localTask.msTodoId);
        if (!msTask) return localTask;

        const msStatus = msStatusMap(msTask.status);
        const hasStatusDiff = localTask.status !== msStatus;
        const hasTitleDiff  = cleanText(localTask.title) !== cleanText(msTask.title || '');
        const hasDescDiff   = cleanText(localTask.desc || '') !== cleanText(msTask.body?.content || '');

        if (hasStatusDiff || hasTitleDiff || hasDescDiff) {
          updatedCount++;
          return { ...localTask, status: msStatus, title: msTask.title, desc: msTask.body?.content || '' };
        }
        return localTask;
      });

      const knownIds = new Set(snapshot.map(t => t.msTodoId).filter(Boolean));
      const newTasks: Task[] = msTasks
        .filter(t => !knownIds.has(t.id))
        .map(t => ({
          id: 'ms-' + t.id,
          title: t.title,
          desc: t.body?.content || '',
          priority: t.importance === 'high' ? 'high' : ('medium' as const),
          deadline: t.dueDateTime?.dateTime || '',
          projectId: t._listId,           // MS liste ID = Enba proje ID
          moduleRef: 'genel',
          status: msStatusMap(t.status),
          createdAt: t.createdDateTime || new Date().toISOString(),
          source: 'outlook',
          msTodoId: t.id,
          msListId: t._listId,
        } as Task));

      const merged = [...updatedTasks, ...newTasks];
      setTasks(merged);
      localStorage.setItem('enba_tasks', JSON.stringify(merged));

      setSyncStatus(`✓ ${msTasks.length} çekildi · ${updatedCount} güncellendi · ${newTasks.length} yeni`);
      setTimeout(() => setSyncStatus(''), 5000);

    } catch (err: any) {
      console.error('Sync Error:', err);
      setSyncStatus('Hata: ' + (err?.message || 'Senkronizasyon başarısız.'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncGoogle = async () => {
    if (!googleAccount) return;
    setIsSyncing(true);
    setSyncStatus('Google Tasks senkronize ediliyor...');

    try {
      const taskLists = await googleService.getTaskLists();
      let newCount = 0;
      let updatedCount = 0;
      const snapshot = [...tasks];
      const newProjects = [...projects];

      for (const list of taskLists) {
        // Ensure project exists for this list
        if (!newProjects.find(p => p.id === list.id)) {
          newProjects.push({ id: list.id, name: list.title.toUpperCase(), groupId: 'g2' });
        }

        const gTasks = await googleService.getTasksFromList(list.id);
        for (const gt of gTasks) {
          const existing = snapshot.find(t => t.gTaskId === gt.id);
          const gStatus: 'todo' | 'done' = gt.status === 'completed' ? 'done' : 'todo';
          
          if (existing) {
            if (existing.status !== gStatus || existing.title !== gt.title) {
              const idx = snapshot.findIndex(t => t.id === existing.id);
              snapshot[idx] = { ...existing, status: gStatus, title: gt.title, desc: gt.notes || '' };
              updatedCount++;
            }
          } else {
            snapshot.push({
              id: 'gt-' + gt.id,
              title: gt.title,
              desc: gt.notes || '',
              priority: 'medium',
              deadline: gt.due || '',
              projectId: list.id,
              moduleRef: 'genel',
              status: gStatus,
              createdAt: gt.updated || new Date().toISOString(),
              source: 'google',
              gTaskId: gt.id,
              gListId: list.id
            });
            newCount++;
          }
        }
      }

      setProjects(newProjects);
      setTasks(snapshot);
      localStorage.setItem('enba_tasks', JSON.stringify(snapshot));
      localStorage.setItem('enba_projects', JSON.stringify(newProjects));
      setSyncStatus(`✓ Google: ${newCount} yeni · ${updatedCount} güncellendi`);
      setTimeout(() => setSyncStatus(''), 5000);
    } catch (err) {
      console.error('Google Sync Error:', err);
      setSyncStatus('Google senkronizasyon hatası.');
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
              source: 'outlook',
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
        const matchesSource = sourceFilter === 'all' || t.source === sourceFilter;
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || (t.desc || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesProject && matchesSource && matchesSearch;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
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
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 items-center">
              <select
                value={task.projectId}
                onChange={e => handleMoveTask(task.id, e.target.value)}
                onClick={e => e.stopPropagation()}
                className="text-[9px] font-black text-gray-400 bg-transparent border-none outline-none cursor-pointer hover:text-enba-orange max-w-[80px] truncate"
                title="Listeye taşı"
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={() => togglePin(task.id)} className={`p-0.5 rounded transition-colors ${task.isPinned ? 'bg-orange-50 text-enba-orange' : 'hover:bg-gray-100 text-gray-400'}`} title={task.isPinned ? 'Sabitlemeyi Kaldır' : 'Başa Sabitle'}>
                <Pin size={11} className={task.isPinned ? 'fill-current' : ''} />
              </button>
              <button onClick={() => { setEditingTask(task); setFormData(task); setShowTaskForm(true); }} className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-enba-dark transition-colors"><Pencil size={11} /></button>
              <button onClick={() => handleDeleteTask(task)} className="p-0.5 hover:bg-rose-50 rounded text-gray-400 hover:text-rose-600 transition-colors"><Trash2 size={11} /></button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
            <Calendar size={10} className={new Date(task.deadline) < new Date() && task.status !== 'done' ? 'text-rose-500' : ''} />
            <span>{task.deadline ? new Date(task.deadline).toLocaleDateString('tr-TR') : 'SÜRESİZ'}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
            {task.source === 'outlook' && (
              <svg className="w-2.5 h-2.5 ml-auto" viewBox="0 0 24 24" fill="none"><path d="M22.5 12C22.5 6.2 17.8 1.5 12 1.5 6.2 1.5 1.5 6.2 1.5 12 1.5 17.8 6.2 22.5 12 22.5 17.8 22.5 22.5 17.8 22.5 12" fill="#0078D4"/><path d="M14.2 15.6l2.1-7.1h1.7l-3 10H13.4l-3-10h1.7l2.1 7.1" fill="#fff"/></svg>
            )}
            {task.source === 'google' && (
              <svg className="w-2.5 h-2.5 ml-auto" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 48c6.48 0 12.35-2.4 16.89-6.35L33.31 35.8C30.69 37.64 27.56 38.67 24 38.67c-6.19 0-11.45-4.14-13.33-9.74l-7.78 6.03C7.3 40.54 15.02 48 24 48z"/><path fill="#34A853" d="M40.89 41.65l-7.58-5.85C35.63 34.05 37.33 31.25 38 28.16L24 28.16v8.62h8.56c-.37 1.89-1.44 3.51-2.92 4.67l7.58 5.85c4.43-4.09 7.15-10.12 7.15-17.3 0-1.51-.14-3-.41-4.45H24v8.62h13.91c-.62 3.12-2.39 5.8-5.02 7.55z"/><path fill="#FBBC05" d="M10.67 28.93c-.48-1.42-.75-2.94-.75-4.53s.27-3.11.75-4.53l-7.78-6.03C1.04 17.34 0 20.55 0 24s1.04 6.66 2.89 10.15l7.78-6.22z"/><path fill="#EA4335" d="M24 9.33c3.54 0 6.72 1.22 9.21 3.22l6.89-6.89C35.83 2.1 30.34 0 24 0 15.02 0 7.3 7.46 2.89 13.85l7.78 6.03C12.55 13.47 17.81 9.33 24 9.33z"/></svg>
            )}
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

          <button 
            onClick={() => setShowTaskForm(true)} 
            className="w-full py-4 bg-enba-orange text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] shadow-lg shadow-enba-orange/20 hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 mb-6"
          >
            <PlusCircle size={16} /> Yeni Atama
          </button>
          
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
                    <div
                      key={project.id}
                      className={`group/proj flex items-center rounded-xl transition-all ${selectedProjectId === project.id ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                    >
                      <button
                        onClick={() => setSelectedProjectId(project.id)}
                        className={`flex-1 flex items-center gap-3 p-3.5 overflow-hidden ${selectedProjectId === project.id ? 'text-enba-orange' : 'text-gray-500'}`}
                      >
                        <FolderPlus size={16} className="flex-shrink-0" />
                        <span className="text-[11px] font-bold uppercase truncate">{project.name}</span>
                        <span className={`ml-auto text-[9px] font-black ${selectedProjectId === project.id ? 'text-enba-orange/50' : 'text-gray-600'}`}>
                          {tasks.filter(t => t.projectId === project.id).length}
                        </span>
                      </button>
                      <div className="flex gap-0.5 pr-2 opacity-0 group-hover/proj:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => { setEditingProject(project); setEditingProjectName(project.name); }}
                          className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-enba-dark"
                          title="Yeniden adlandır"
                        ><Pencil size={11} /></button>
                        <button
                          onClick={() => { setDeletingProject(project); setDeleteTargetId('none'); }}
                          className="p-1 rounded hover:bg-rose-100 text-gray-400 hover:text-rose-500"
                          title="Listeyi sil"
                        ><Trash2 size={11} /></button>
                      </div>
                    </div>
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

            {/* Google Tasks Section */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className={`flex items-center justify-between mb-3 ${googleAccount ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className="flex items-center gap-3">
                  <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {googleAccount ? 'Google Bağlı' : 'Google Boşta'}
                  </span>
                </div>
                {googleAccount && (
                  <button onClick={() => { googleService.logout(); setGoogleAccount(null); }} className="text-[9px] font-black text-rose-500 hover:underline uppercase">Kes</button>
                )}
              </div>
              {!googleAccount ? (
                <button
                  onClick={handleConnectGoogle}
                  className="w-full py-2.5 bg-[#4285F4] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 hover:bg-blue-600 active:scale-95 transition-all"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google Tasks Bağla
                </button>
              ) : (
                <button onClick={handleSyncGoogle} disabled={isSyncing} className="w-full py-2.5 bg-enba-dark text-white rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest gap-2 shadow-md hover:bg-black transition-all">
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} /> Görevleri Eşleştir
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Sub Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 shadow-sm relative z-0">
          <div className="flex items-center gap-4">
            <div className="flex flex-col border-r border-gray-100 pr-4">
              <h1 className="text-[9px] font-black text-enba-dark tracking-tight leading-none uppercase italic truncate max-w-[150px]">
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

              <div className="flex bg-gray-100 p-0.5 rounded-lg ml-2">
                {[
                  { id: 'all', label: 'TÜMÜ' },
                  { id: 'google', label: 'GOOGLE' },
                  { id: 'outlook', label: 'OUTLOOK' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setSourceFilter(tab.id as any)}
                    className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${sourceFilter === tab.id ? 'bg-white text-enba-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

            <button 
              onClick={() => setIsCompact(!isCompact)}
              className={`flex items-center justify-center w-10 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isCompact ? 'bg-enba-orange/10 text-enba-orange border border-enba-orange/20' : 'bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100'}`}
              title={isCompact ? 'Geniş Görünüm' : 'Dar Görünüm'}
            >
              {isCompact ? <Maximize size={14} /> : <Minimize size={14} />}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 overflow-visible ml-2">
            <div className="relative hidden sm:block">
              <input 
                type="text" 
                placeholder="Ara..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-gray-50 border-none rounded-lg px-8 py-2 text-[10px] font-medium text-enba-dark focus:ring-2 focus:ring-enba-orange/20 w-28 focus:w-40 transition-all"
              />
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {syncStatus && <span className="text-[7px] text-enba-orange font-black uppercase animate-pulse hidden md:inline ml-1">{syncStatus}</span>}
              <button 
                onClick={() => handleSyncAll()}
                className={`p-2 rounded-xl border border-gray-100 text-gray-400 hover:text-enba-orange hover:bg-orange-50 transition-all ${isSyncing ? 'animate-spin border-enba-orange/20 text-enba-orange' : ''}`}
                title="Senkronize Et"
                disabled={!msAccount || isSyncing}
              >
                <RotateCw size={16} />
              </button>
            </div>
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
      {/* ─── LİSTEYİ DÜZENLE MODALI ──────────────────────── */}
      {editingProject && (
        <div className="fixed inset-0 bg-enba-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-enba-orange" />
            <h3 className="text-xl font-black text-enba-dark tracking-tight uppercase italic mb-8">Listeyi Düzenle</h3>
            <input
              autoFocus
              value={editingProjectName}
              onChange={e => setEditingProjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRenameProject()}
              className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-enba-dark focus:ring-2 focus:ring-enba-orange/20 transition-all italic mb-6"
              placeholder="LİSTE ADI..."
            />
            <div className="flex gap-3">
              <button onClick={() => setEditingProject(null)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">İPTAL</button>
              <button onClick={handleRenameProject} className="flex-1 py-4 bg-enba-orange text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:brightness-110">KAYDET</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LİSTEYİ SİL MODALI ──────────────────────────── */}
      {deletingProject && (
        <div className="fixed inset-0 bg-enba-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />
            <h3 className="text-xl font-black text-enba-dark tracking-tight uppercase italic mb-2">Listeyi Sil</h3>
            <p className="text-[11px] text-gray-400 font-bold mb-6 italic">
              <span className="text-enba-dark">{deletingProject.name}</span> listesinde {tasks.filter(t => t.projectId === deletingProject.id).length} görev var.
            </p>
            <div className="space-y-2 mb-6">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Görevlere ne yapılsın?</label>
              <select
                value={deleteTargetId}
                onChange={e => setDeleteTargetId(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm font-bold text-enba-dark focus:ring-2 focus:ring-rose-200 transition-all appearance-none cursor-pointer"
              >
                <option value="none">Görevleri koru (listesiz kalır)</option>
                <option value="delete">Görevleri de sil</option>
                {projects.filter(p => p.id !== deletingProject.id).map(p => (
                  <option key={p.id} value={p.id}>{p.name} listesine taşı</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setDeletingProject(null); setDeleteTargetId('none'); }} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">İPTAL</button>
              <button onClick={handleDeleteProject} className="flex-1 py-4 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:bg-rose-600">SİL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
