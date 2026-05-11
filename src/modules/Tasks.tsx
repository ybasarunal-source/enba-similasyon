import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  PlusCircle,
  RotateCw,
  Hash,
  Calendar,
  Trash2,
  Pencil,
  AlertTriangle,
  RefreshCw,
  Download,
  Search,
  Layers,
  Check,
  Maximize,
  Minimize,
  Pin
} from 'lucide-react';
import { microsoftService } from '../api/microsoft';
import { googleService } from '../api/google';
import { profileAPI, projectGroupsAPI, projectsAPI, tasksAPI, SupabaseTask } from '../api/supabase';

const toSupabaseTask = (t: Task): SupabaseTask => ({ id: t.id.toString(), title: t.title, description: t.desc, priority: t.priority, deadline: t.deadline, project_id: t.projectId, module_ref: t.moduleRef, status: t.status, source: t.source, ms_todo_id: t.msTodoId, ms_list_id: t.msListId, g_task_id: t.gTaskId, g_list_id: t.gListId, is_pinned: t.isPinned });
const fromSupabaseTask = (t: SupabaseTask): Task => ({ id: t.id, title: t.title, desc: t.description || '', priority: t.priority as any, deadline: t.deadline || '', projectId: t.project_id || '', moduleRef: t.module_ref || '', status: t.status as any, createdAt: t.created_at || '', source: t.source as any, msTodoId: t.ms_todo_id, msListId: t.ms_list_id, gTaskId: t.g_task_id, gListId: t.g_list_id, isPinned: t.is_pinned });

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

  // ── Data States ──────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [msAccount, setMsAccount] = useState<any>(null);
  const [googleAccount, setGoogleAccount] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
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

  // ── Load from Supabase & Silent Migration ───────────────────────────────
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [cloudTasks, cloudProjects, cloudGroups] = await Promise.all([
          tasksAPI.getAll(),
          projectsAPI.getAll(),
          projectGroupsAPI.getAll()
        ]);

        const localTasksStr = localStorage.getItem('enba_tasks');
        if (localTasksStr && cloudTasks.length === 0) {
          const lTasks = JSON.parse(localTasksStr) || [];
          const lProjects = JSON.parse(localStorage.getItem('enba_projects') || '[]');
          const lGroups = JSON.parse(localStorage.getItem('enba_project_groups') || '[]');
          
          for(const g of lGroups) await projectGroupsAPI.insert({ id: g.id, name: g.name });
          for(const p of lProjects) await projectsAPI.insert({ id: p.id, name: p.name, group_id: p.groupId });
          for(const t of lTasks) await tasksAPI.insert(toSupabaseTask(t));

          const [newT, newP, newG] = await Promise.all([tasksAPI.getAll(), projectsAPI.getAll(), projectGroupsAPI.getAll()]);
          setTasks(newT.map(fromSupabaseTask));
          setProjects(newP.map(x => ({ id: x.id, name: x.name, groupId: x.group_id })));
          setGroups(newG);

          localStorage.removeItem('enba_tasks');
          localStorage.removeItem('enba_projects');
          localStorage.removeItem('enba_project_groups');
          setIsLoading(false);
          return;
        }

        setTasks(cloudTasks.map(fromSupabaseTask));
        setProjects(cloudProjects.map(x => ({ id: x.id, name: x.name, groupId: x.group_id })));
        setGroups(cloudGroups);
      } catch (err) {
        console.error("Görev verileri yüklenemedi:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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
        } else {
          // Eğer profilde kayıtlı hesap yoksa, MSAL storage'ı temizle ki 
          // önceki app kullanıcısının oturumu "hortlamasın".
          microsoftService.clearStorage();
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
      // Profil kontrolü: Eğer profilde google verisi yoksa ama token varsa (eski kullanıcıdan kaldıysa) temizle
      profileAPI.getMyProfile().then(p => {
        if (!p?.google_data?.token) {
          googleService.logout();
          setGoogleAccount(null);
        } else {
          setGoogleAccount({ name: 'Google Kullanıcısı' });
        }
      });
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
    
    setEditingProject(null);
  };

  const handleDeleteProject = () => {
    if (!deletingProject) return;
    if (deleteTargetId === 'delete') {
      const updatedTasks = tasks.filter(t => t.projectId !== deletingProject.id);
      setTasks(updatedTasks);
      tasks.forEach(t => { if(t.projectId === deletingProject.id) tasksAPI.delete(t.id.toString()); });
    } else if (deleteTargetId !== 'none') {
      const updatedTasks = tasks.map(t =>
        t.projectId === deletingProject.id ? { ...t, projectId: deleteTargetId } : t
      );
      setTasks(updatedTasks);
      tasks.forEach(t => { if(t.projectId === deletingProject.id) tasksAPI.update(t.id.toString(), { project_id: deleteTargetId }); });
    }
    const updatedProjects = projects.filter(p => p.id !== deletingProject.id);
    setProjects(updatedProjects);
    projectsAPI.delete(deletingProject.id);
    
    if (selectedProjectId === deletingProject.id) setSelectedProjectId('all');
    setDeletingProject(null);
    setDeleteTargetId('none');
  };

  // ── Görev Listesini Değiştir ─────────────────────────────
  const handleMoveTask = (taskId: string | number, newProjectId: string) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, projectId: newProjectId } : t);
    setTasks(updated);
    tasksAPI.update(taskId.toString(), { project_id: newProjectId });
    
  };

  // ── UI States ────────────────────────────────────────────
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '', desc: '', priority: 'medium', deadline: '', projectId: projects[0]?.id || 'p1', moduleRef: 'genel'
  });


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
    if (isNew) { tasksAPI.insert(toSupabaseTask(newTask)); } else { tasksAPI.update(newTask.id.toString(), toSupabaseTask(newTask)); }
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
    tasksAPI.update(id.toString(), { status: newStatus });

    // Microsoft Update
    if (msAccount && task.msTodoId && task.msListId) {
      await microsoftService.syncTask(task.msListId, { ...task, status: newStatus }, task.msTodoId);
    }
  };

  const togglePin = (taskId: string | number) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, isPinned: !t.isPinned } : t);
    setTasks(updated);
    const tObj = tasks.find(t => t.id === taskId);
    if (tObj) tasksAPI.update(taskId.toString(), { is_pinned: !tObj.isPinned });
    
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm('Bu görev silinecek. Emin misiniz?')) return;
    
    setTasks(prev => prev.filter(t => t.id !== task.id));
    tasksAPI.delete(task.id.toString());

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

  // ── Derived lists ─────────────────────────────────────────
  const importantTasks = filteredTasks.filter(t => t.status !== 'done' && (t.priority === 'high' || t.isPinned));
  const regularTasks   = filteredTasks.filter(t => !importantTasks.find(i => i.id === t.id));

  const statChips = [
    { label: 'Bekleyen',      val: tasks.filter(t => t.status !== 'done').length,                                                                              bg: 'bg-[var(--bg-surface-low)]',       color: 'text-[var(--text-secondary)]' },
    { label: 'Acil',          val: tasks.filter(t => t.priority === 'high' && t.status !== 'done').length,                                                     bg: 'bg-[var(--highlight-error-bg)]',   color: 'text-[var(--highlight-error-text)]' },
    { label: 'Bugün Bitiyor', val: tasks.filter(t => { const d = new Date(t.deadline); const n = new Date(); return t.deadline && d.toDateString() === n.toDateString() && t.status !== 'done'; }).length, bg: 'bg-[var(--highlight-warning-bg)]', color: 'text-[var(--highlight-warning-text)]' },
    { label: 'Tamamlanan',    val: tasks.filter(t => t.status === 'done').length,                                                                               bg: 'bg-[var(--highlight-success-bg)]', color: 'text-[var(--highlight-success-text)]' },
  ];

  // ── Önemli Görev Kartı ─────────────────────────────────────
  const ImportantTaskCard = ({ task }: { task: Task }) => {
    const isOverdue = task.deadline && new Date(task.deadline) < new Date();
    const accentColor = task.priority === 'high' ? '#ef4444' : 'var(--enba-orange)';
    return (
      <div
        className="relative bg-[var(--bg-surface)] rounded-2xl overflow-hidden group transition-all hover:shadow-elevated border border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
        style={{ borderTop: `3px solid ${accentColor}` }}
      >
        <div className="p-5">
          <div className="flex items-start gap-2 mb-3 flex-wrap">
            {task.priority === 'high' && (
              <span className="px-2 py-0.5 bg-[var(--highlight-error-bg)] text-[var(--highlight-error-text)] rounded-md text-[9px] font-bold uppercase tracking-widest">ACİL</span>
            )}
            {task.isPinned && (
              <span className="px-2 py-0.5 bg-[var(--bg-surface-low)] text-[var(--enba-orange)] rounded-md text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                <Pin size={8} className="fill-current" /> SABİT
              </span>
            )}
            {isOverdue && (
              <span className="px-2 py-0.5 bg-[var(--highlight-warning-bg)] text-[var(--highlight-warning-text)] rounded-md text-[9px] font-bold uppercase tracking-widest">GECİKMİŞ</span>
            )}
            <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={() => togglePin(task.id)} className={`p-1.5 rounded-lg transition-colors ${task.isPinned ? 'bg-[var(--bg-surface-high)] text-[var(--enba-orange)]' : 'hover:bg-[var(--bg-surface-low)] text-[var(--text-muted)]'}`}>
                <Pin size={11} className={task.isPinned ? 'fill-current' : ''} />
              </button>
              <button onClick={() => { setEditingTask(task); setFormData(task); setShowTaskForm(true); }} className="p-1.5 hover:bg-[var(--bg-surface-low)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <Pencil size={11} />
              </button>
              <button onClick={() => handleDeleteTask(task)} className="p-1.5 hover:bg-[var(--highlight-error-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--highlight-error-text)] transition-colors">
                <Trash2 size={11} />
              </button>
            </div>
          </div>

          <h3 className="text-sm font-bold text-[var(--text-primary)] leading-snug mb-1.5">{task.title}</h3>
          {task.desc && <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-4 line-clamp-2">{task.desc}</p>}

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5">
              <Calendar size={11} className={isOverdue ? 'text-[var(--highlight-error-text)]' : 'text-[var(--text-muted)]'} />
              <span className={`text-[10px] font-bold uppercase tracking-wide ${isOverdue ? 'text-[var(--highlight-error-text)]' : 'text-[var(--text-muted)]'}`}>
                {task.deadline ? new Date(task.deadline).toLocaleDateString('tr-TR') : 'Süresiz'}
              </span>
            </div>
            <button onClick={() => toggleTask(task.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--highlight-success-bg)] hover:opacity-80 text-[var(--highlight-success-text)] rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all active:scale-95">
              <Check size={10} strokeWidth={3} /> Tamamlandı
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Normal Görev Kartı ─────────────────────────────────────
  const TaskCard = ({ task }: { task: Task }) => {
    const isDone    = task.status === 'done';
    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !isDone;
    const priorityAccent: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#94a3b8' };
    return (
      <div
        className={`group bg-[var(--bg-surface)] px-5 py-3.5 rounded-xl border transition-all flex items-center gap-3.5 ${
          isDone
            ? 'opacity-50 border-[var(--border-subtle)]'
            : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:shadow-card'
        }`}
        style={isDone ? undefined : { borderLeft: `3px solid ${priorityAccent[task.priority]}` }}
      >
        <button onClick={() => toggleTask(task.id)} className={`w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${isDone ? 'bg-[var(--highlight-success-text)] border-[var(--highlight-success-text)] text-white' : 'border-[var(--border-strong)] hover:border-[var(--highlight-success-text)] text-transparent'}`}>
          <Check size={10} strokeWidth={4} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {task.isPinned && <Pin size={10} className="text-[var(--enba-orange)] fill-current flex-shrink-0" />}
            <span className={`text-[13px] font-semibold truncate ${isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>{task.title}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium">
            <Calendar size={10} className={isOverdue ? 'text-[var(--highlight-error-text)]' : 'text-[var(--text-muted)]'} />
            <span className={isOverdue ? 'text-[var(--highlight-error-text)]' : 'text-[var(--text-muted)]'}>
              {task.deadline ? new Date(task.deadline).toLocaleDateString('tr-TR') : 'Süresiz'}
            </span>
            {task.source === 'outlook' && <span className="text-blue-500">· MS</span>}
            {task.source === 'google'  && <span className="text-rose-400">· Google</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <select value={task.projectId} onChange={e => handleMoveTask(task.id, e.target.value)} onClick={e => e.stopPropagation()} className="text-[9px] font-bold text-[var(--text-muted)] bg-[var(--bg-surface-low)] border-none rounded-lg px-2 py-1 cursor-pointer hover:text-[var(--enba-orange)] max-w-[80px] truncate outline-none">
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => togglePin(task.id)} className={`p-1.5 rounded-lg transition-colors ${task.isPinned ? 'bg-[var(--bg-surface-high)] text-[var(--enba-orange)]' : 'hover:bg-[var(--bg-surface-low)] text-[var(--text-muted)]'}`}>
            <Pin size={11} className={task.isPinned ? 'fill-current' : ''} />
          </button>
          <button onClick={() => { setEditingTask(task); setFormData(task); setShowTaskForm(true); }} className="p-1.5 hover:bg-[var(--bg-surface-low)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <Pencil size={11} />
          </button>
          <button onClick={() => handleDeleteTask(task)} className="p-1.5 hover:bg-[var(--highlight-error-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--highlight-error-text)] transition-colors">
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-main)] animate-fade-in overflow-hidden">

      {/* ── TOP HEADER ─────────────────────────────────────── */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-8 pt-6 pb-0 shadow-sm flex-shrink-0">
        {/* Row 1: title + actions */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-enba-dark rounded-[1.2rem] flex items-center justify-center text-enba-orange shadow-xl shadow-enba-dark/20">
              <ClipboardList size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic leading-none">Görev & İş Takibi</h1>
              <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[3px] mt-1">{tasks.filter(t => t.status !== 'done').length} Aktif Görev</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {syncStatus && <span className="text-[9px] text-enba-orange font-black uppercase animate-pulse hidden md:block">{syncStatus}</span>}
            <div className="relative hidden sm:block">
              <input type="text" placeholder="Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-[var(--bg-surface-low)] border-none rounded-xl px-8 py-2.5 text-[11px] font-medium text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--enba-orange)]/20 w-32 focus:w-48 transition-all outline-none" />
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>
            <button onClick={() => handleSyncAll()} disabled={!msAccount || isSyncing} className={`w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--enba-orange)] hover:bg-[var(--bg-surface-low)] transition-all disabled:opacity-30 ${isSyncing ? 'animate-spin text-[var(--enba-orange)]' : ''}`} title="Senkronize Et"><RotateCw size={16} /></button>
            <button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2 px-6 py-2.5 bg-enba-orange text-white rounded-xl font-black text-[10px] uppercase tracking-[2px] shadow-lg shadow-enba-orange/20 hover:brightness-110 active:scale-95 transition-all">
              <PlusCircle size={15} /> Yeni Görev
            </button>
          </div>
        </div>

        {/* Row 2: stat chips */}
        <div className="flex items-center gap-3 mb-5">
          {statChips.map((s, i) => (
            <div key={i} className={`${s.bg} ${s.color} px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2`}>
              <span className="text-lg font-black leading-none">{s.val}</span>
              <span className="opacity-60">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Row 3: project tabs + controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 custom-scrollbar">
          <button onClick={() => setSelectedProjectId('all')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedProjectId === 'all' ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-lg' : 'bg-[var(--bg-surface-low)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-high)]'}`}>
            <Layers size={13} /> Tümü <span className="opacity-50">{tasks.length}</span>
          </button>
          {projects.map(p => (
            <div key={p.id} className={`flex-shrink-0 group/tab flex items-center rounded-xl transition-all ${selectedProjectId === p.id ? 'bg-[var(--bg-surface-low)] text-[var(--enba-orange)] border border-[var(--border-strong)]' : 'bg-[var(--bg-surface-low)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-high)] border border-transparent'}`}>
              <button onClick={() => setSelectedProjectId(p.id)} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest">
                <Hash size={11} />{p.name}<span className="opacity-50">{tasks.filter(t => t.projectId === p.id).length}</span>
              </button>
              <div className="pr-2 flex gap-0.5 opacity-0 group-hover/tab:opacity-100 transition-opacity">
                <button onClick={() => { setEditingProject(p); setEditingProjectName(p.name); }} className="p-1 rounded hover:bg-black/5 text-current opacity-50 hover:opacity-100"><Pencil size={9} /></button>
                <button onClick={() => { setDeletingProject(p); setDeleteTargetId('none'); }} className="p-1 rounded hover:bg-rose-100 text-current opacity-50 hover:text-rose-500 hover:opacity-100"><Trash2 size={9} /></button>
              </div>
            </div>
          ))}
          <button onClick={() => setShowProjectForm(true)} className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 border border-dashed border-[var(--border-strong)] rounded-xl text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:border-[var(--enba-orange)] hover:text-[var(--enba-orange)] transition-all">
            <PlusCircle size={11} /> Proje
          </button>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <div className="flex bg-[var(--bg-surface-low)] p-0.5 rounded-xl">
              {([{id:'all',label:'Tümü'},{id:'google',label:'Google'},{id:'outlook',label:'MS'}] as const).map(tab => (
                <button key={tab.id} onClick={() => setSourceFilter(tab.id as any)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${sourceFilter === tab.id ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>{tab.label}</button>
              ))}
            </div>
            <button onClick={() => setIsCompact(!isCompact)} className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${isCompact ? 'border-[var(--border-strong)] bg-[var(--bg-surface-low)] text-[var(--enba-orange)]' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-low)]'}`} title={isCompact ? 'Geniş Görünüm' : 'Dar Görünüm'}>
              {isCompact ? <Maximize size={13} /> : <Minimize size={13} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── ENTEGRASYON BAR ────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-8 py-2.5 flex items-center gap-4 flex-shrink-0">
        <span className="text-[9px] font-black text-gray-300 uppercase tracking-[2px]">Entegrasyonlar</span>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${msAccount && !msAccount.needsReconnect ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <span className={`text-[9px] font-black uppercase tracking-widest ${msAccount && !msAccount.needsReconnect ? 'text-blue-600' : 'text-gray-400'}`}>
            {msAccount && !msAccount.needsReconnect ? (msAccount.username || 'Microsoft Bağlı') : 'Microsoft'}
          </span>
          {(!msAccount || msAccount.needsReconnect)
            ? <button onClick={handleConnectMs} disabled={isConnecting} className="text-[9px] font-black text-blue-500 hover:underline uppercase">{isConnecting ? 'Bağlanıyor...' : 'Bağla'}</button>
            : <><button onClick={handleImportFromMs} disabled={isSyncing} className="text-[9px] font-black text-gray-400 hover:text-enba-dark uppercase flex items-center gap-1"><Download size={10} />Çek</button><button onClick={() => microsoftService.logout()} className="text-[9px] font-black text-rose-400 hover:underline uppercase">Kes</button></>
          }
        </div>
        <div className="w-px h-3 bg-gray-100 flex-shrink-0" />
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${googleAccount ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          <span className={`text-[9px] font-black uppercase tracking-widest ${googleAccount ? 'text-emerald-600' : 'text-gray-400'}`}>{googleAccount ? 'Google Bağlı' : 'Google'}</span>
          {!googleAccount
            ? <button onClick={handleConnectGoogle} className="text-[9px] font-black text-blue-500 hover:underline uppercase">Bağla</button>
            : <><button onClick={handleSyncGoogle} disabled={isSyncing} className="text-[9px] font-black text-emerald-500 hover:underline uppercase flex items-center gap-1"><RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />Eşleştir</button><button onClick={() => { googleService.logout(); setGoogleAccount(null); }} className="text-[9px] font-black text-rose-400 hover:underline uppercase">Kes</button></>
          }
        </div>
        <div className="ml-auto">
          <button onClick={() => { if (confirm('TÜM görevleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) setTasks([]); }} className="flex items-center gap-1.5 text-[9px] font-black text-gray-300 hover:text-rose-500 uppercase tracking-widest transition-colors">
            <Trash2 size={10} /> Tümünü Temizle
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-8 space-y-8 pb-16">

          {isLoading && (
            <div className="py-24 text-center">
              <RotateCw size={24} className="animate-spin text-enba-orange/30 mx-auto mb-4" />
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[4px]">Yükleniyor...</p>
            </div>
          )}

          {/* ── ÖNEMLİ GÖREVLER SPOTLIGHT ── */}
          {!isLoading && importantTasks.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-enba-dark uppercase tracking-widest italic leading-none">Önemli & Acil</h2>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-[2px] mt-0.5">{importantTasks.length} Görev Öne Çıkarıldı</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {importantTasks.map(task => <ImportantTaskCard key={task.id} task={task} />)}
              </div>
            </section>
          )}

          {/* ── DİĞER GÖREVLER ── */}
          {!isLoading && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-black text-enba-dark uppercase tracking-widest italic">
                    {importantTasks.length > 0 ? 'Diğer Görevler' : 'Tüm Görevler'}
                  </h2>
                  <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {regularTasks.filter(t => t.status !== 'done').length} Bekleyen
                  </span>
                </div>
              </div>
              {regularTasks.length > 0 ? (
                <div className="space-y-2">
                  {regularTasks.map(task => <TaskCard key={task.id} task={task} />)}
                </div>
              ) : importantTasks.length === 0 && (
                <div className="py-24 border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-gray-300">
                  <ClipboardList size={36} className="opacity-20 mb-4" />
                  <span className="text-[10px] font-black uppercase tracking-[4px] italic">Kayıtlı Görev Bulunmuyor</span>
                </div>
              )}
            </section>
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
                    const nId = 'p-' + Date.now(); setProjects(prev => [...prev, { id: nId, name, groupId: gId }]); projectsAPI.insert({ id: nId, name, group_id: gId });
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
