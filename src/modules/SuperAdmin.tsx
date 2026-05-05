import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Users,
  Settings,
  Plus,
  Search,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Shield,
  ExternalLink,
  Trash2,
  Lock
} from 'lucide-react';
import { companiesAPI, Company, profileAPI, UserProfile, UserRole, PERMISSION_MODULES } from '../api/supabase';

export const SuperAdmin: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'companies' | 'users' | 'system'>('companies');
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeUserMenuId, setActiveUserMenuId] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingCompanyPerms, setEditingCompanyPerms] = useState<Company | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [newCompany, setNewCompany] = useState({
    name: '',
    slug: '',
    status: 'active' as const
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, uData] = await Promise.all([
        companiesAPI.getAll(),
        profileAPI.getAllProfiles() // Note: This might need scoping or a new superadmin API if profiles table is large
      ]);
      setCompanies(cData);
      setUsers(uData);
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name || !newCompany.slug) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await companiesAPI.insert(newCompany);
      if (res) {
        setCompanies([res, ...companies]);
        setShowNewCompanyModal(false);
        setNewCompany({ name: '', slug: '', status: 'active' });
      } else {
        setActionError("Şirket oluşturulamadı.");
      }
    } catch (err: any) {
      setActionError(err.message || "Bir hata oluştu.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await companiesAPI.update(editingCompany.id, {
        name: editingCompany.name,
        slug: editingCompany.slug,
        status: editingCompany.status
      });
      if (res) {
        setCompanies(companies.map(c => c.id === res.id ? res : c));
        setEditingCompany(null);
      }
    } catch (err: any) {
      setActionError(err.message || "Güncelleme hatası.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCompanyPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompanyPerms) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await companiesAPI.update(editingCompanyPerms.id, {
        module_permissions: editingCompanyPerms.module_permissions,
      });
      if (res) {
        setCompanies(companies.map(c => c.id === res.id ? res : c));
        setEditingCompanyPerms(null);
      }
    } catch (err: any) {
      setActionError(err.message || 'Güncelleme hatası.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!window.confirm('Bu şirketi ve tüm verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;

    setActionLoading(true);
    try {
      const success = await companiesAPI.delete(id);
      if (success) {
        setCompanies(companies.filter(c => c.id !== id));
      }
    } catch (err: any) {
      alert("Silme hatası: " + err.message);
    } finally {
      setActionLoading(false);
      setActiveMenuId(null);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await profileAPI.adminUpdateProfile(editingUser.id, {
        full_name: editingUser.full_name,
        role: editingUser.role,
        company_id: editingUser.company_id,
        permissions: editingUser.permissions,
      });
      if (res) {
        setUsers(users.map(u => u.id === res.id ? res : u));
        setEditingUser(null);
      }
    } catch (err: any) {
      setActionError(err.message || "Kullanıcı güncelleme hatası.");
    } finally {
      setActionLoading(false);
    }
  };

  const togglePermission = (moduleId: string, value: boolean) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      permissions: { ...editingUser.permissions, [moduleId]: value },
    });
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;

    setActionLoading(true);
    try {
      const success = await profileAPI.deleteProfile(id);
      if (success) {
        setUsers(users.filter(u => u.id !== id));
      }
    } catch (err: any) {
      alert("Kullanıcı silme hatası: " + err.message);
    } finally {
      setActionLoading(false);
      setActiveUserMenuId(null);
    }
  };

  // Click outside to close menus
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setActiveUserMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Sistem Yönetimi</h1>
            <p className="text-sm text-gray-400">Tüm şirketleri ve kullanıcıları buradan yönetin</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowNewCompanyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus size={18} /> Yeni Şirket
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-100 w-fit shadow-sm">
        <button 
          onClick={() => setActiveTab('companies')}
          className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'companies' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Şirketler
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Kullanıcılar
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'system' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Sistem Durumu
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Toplam Şirket</div>
          <div className="text-2xl font-bold text-gray-800">{companies.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Aktif Kullanıcı</div>
          <div className="text-2xl font-bold text-gray-800">{users.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Demo Şirketler</div>
          <div className="text-2xl font-bold text-indigo-600">{companies.filter(c => c.status === 'demo').length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sistem Yükü</div>
          <div className="text-2xl font-bold text-emerald-500">Normal</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">
            {activeTab === 'companies' ? 'Kayıtlı Şirketler' : activeTab === 'users' ? 'Tüm Kullanıcılar' : 'Sistem Ayarları'}
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Ara..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all w-64"
            />
          </div>
        </div>

        {loading && (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}
        <div className="overflow-x-auto">
          {!loading && activeTab === 'companies' && (
            <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Şirket Adı</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Oluşturulma</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companies.map(company => (
                  <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                          <Building2 size={16} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{company.slug}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        company.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                        company.status === 'demo' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {company.status === 'active' ? 'Aktif' : company.status === 'demo' ? 'Demo' : 'Askıda'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{new Date(company.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === company.id ? null : company.id)}
                        className={`p-2 rounded-lg transition-colors ${activeMenuId === company.id ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-400'}`}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuId === company.id && (
                        <div ref={menuRef} className="absolute right-6 top-12 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in zoom-in-95 duration-200">
                          <button
                            onClick={() => { setEditingCompany(company); setActiveMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Settings size={14} className="text-gray-400" /> Düzenle
                          </button>
                          <button
                            onClick={() => { setEditingCompanyPerms({ ...company, module_permissions: company.module_permissions ?? {} }); setActiveMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                          >
                            <Lock size={14} /> Modül İzinleri
                          </button>
                          <button
                            onClick={() => { /* Gelecekte: Şirket Verilerini Gör */ setActiveMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <ExternalLink size={14} className="text-gray-400" /> Verileri İncele
                          </button>
                          <div className="h-[1px] bg-gray-50 my-1" />
                          <button 
                            onClick={() => handleDeleteCompany(company.id)}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Şirketi Sil
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && activeTab === 'users' && (
            <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kullanıcı</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Şirket ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kayıt</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} className="w-8 h-8 rounded-full border border-gray-100 shadow-sm" alt="" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs font-bold">
                            {u.full_name?.charAt(0) || u.email?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-gray-700">{u.full_name || 'İsimsiz'}</div>
                          <div className="text-[10px] text-gray-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'super_admin' ? 'bg-purple-50 text-purple-600' :
                        u.role === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
                      }`}>
                        {u.role === 'super_admin' ? <Shield size={10} /> : u.role === 'admin' ? <Shield size={10} /> : <Users size={10} />}
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-mono">{u.company_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{new Date(u.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setActiveUserMenuId(activeUserMenuId === u.id ? null : u.id)}
                        className={`p-2 rounded-lg transition-colors ${activeUserMenuId === u.id ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-400'}`}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeUserMenuId === u.id && (
                        <div ref={userMenuRef} className="absolute right-6 top-12 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in zoom-in-95 duration-200">
                          <button 
                            onClick={() => { setEditingUser(u); setActiveUserMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Settings size={14} className="text-gray-400" /> Düzenle / Yetkilendir
                          </button>
                          <div className="h-[1px] bg-gray-50 my-1" />
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Kullanıcıyı Sil
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New Company Modal */}
      {showNewCompanyModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <Building2 size={20} />
                <h3 className="font-bold">Yeni Şirket Tanımla</h3>
              </div>
              <button onClick={() => setShowNewCompanyModal(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-semibold animate-shake">
                  <AlertCircle size={14} />
                  {actionError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Şirket Tam Adı</label>
                <input 
                  type="text" 
                  value={newCompany.name}
                  onChange={e => setNewCompany({...newCompany, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Örn: Enba Recycling Ltd."
                  required
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Slug (URL Kimliği)</label>
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-gray-300 text-sm">enba.app/</span>
                  <input 
                    type="text" 
                    value={newCompany.slug}
                    onChange={e => setNewCompany({...newCompany, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')})}
                    className="flex-1 bg-transparent border-none text-sm focus:outline-none text-indigo-600 font-semibold"
                    placeholder="sirket-adi"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Başlangıç Durumu</label>
                <select 
                  value={newCompany.status}
                  onChange={e => setNewCompany({...newCompany, status: e.target.value as any})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="active">Aktif</option>
                  <option value="demo">Demo Modu</option>
                  <option value="suspended">Askıda</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowNewCompanyModal(false)}
                  className="flex-1 py-3 border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className={`flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Şirketi Oluştur
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {editingCompany && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <Settings size={20} />
                <h3 className="font-bold">Şirket Bilgilerini Düzenle</h3>
              </div>
              <button onClick={() => setEditingCompany(null)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateCompany} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-semibold animate-shake">
                  <AlertCircle size={14} />
                  {actionError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Şirket Tam Adı</label>
                <input 
                  type="text" 
                  value={editingCompany.name}
                  onChange={e => setEditingCompany({...editingCompany, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Slug (URL Kimliği)</label>
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-gray-300 text-sm">enba.app/</span>
                  <input 
                    type="text" 
                    value={editingCompany.slug}
                    onChange={e => setEditingCompany({...editingCompany, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')})}
                    className="flex-1 bg-transparent border-none text-sm focus:outline-none text-indigo-600 font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Durum</label>
                <select 
                  value={editingCompany.status}
                  onChange={e => setEditingCompany({...editingCompany, status: e.target.value as any})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="active">Aktif</option>
                  <option value="demo">Demo Modu</option>
                  <option value="suspended">Askıda</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="flex-1 py-3 border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className={`flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {actionLoading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <Users size={20} />
                <h3 className="font-bold">Kullanıcı Düzenle</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {actionError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-semibold">
                  <AlertCircle size={14} />
                  {actionError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Kullanıcı Adı</label>
                <input
                  type="text"
                  value={editingUser.full_name || ''}
                  onChange={e => setEditingUser({...editingUser, full_name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Rol / Yetki</label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none"
                >
                  <option value="user">Standart Kullanıcı</option>
                  <option value="admin">Şirket Yöneticisi (Admin)</option>
                  <option value="super_admin">Sistem Yöneticisi (SuperAdmin)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Bağlı Olduğu Şirket</label>
                <select
                  value={editingUser.company_id || ''}
                  onChange={e => setEditingUser({...editingUser, company_id: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">Şirket Seçilmedi</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5">
                    <Lock size={11} /> Modül İzinleri
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingUser({ ...editingUser, permissions: Object.fromEntries(PERMISSION_MODULES.map(m => [m.id, true])) })}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                      Tümünü Aç
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUser({ ...editingUser, permissions: Object.fromEntries(PERMISSION_MODULES.map(m => [m.id, false])) })}
                      className="text-[10px] font-bold text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Tümünü Kapat
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSION_MODULES.map(mod => (
                    <label
                      key={mod.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        editingUser.permissions?.[mod.id]
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-gray-100 hover:border-emerald-100 hover:bg-emerald-50/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editingUser.permissions?.[mod.id] ?? false}
                        onChange={e => togglePermission(mod.id, e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                      <span className="text-xs font-medium text-gray-700">{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 ${actionLoading ? 'opacity-50' : ''}`}
                >
                  {actionLoading ? 'Güncelleniyor...' : <><CheckCircle2 size={16} /> Kaydet</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company Module Permissions Modal */}
      {editingCompanyPerms && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <Lock size={20} />
                <div>
                  <h3 className="font-bold">Modül İzinleri</h3>
                  <p className="text-xs text-indigo-200">{editingCompanyPerms.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingCompanyPerms(null)} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors text-lg leading-none">✕</button>
            </div>

            <form onSubmit={handleSaveCompanyPermissions} className="p-6 space-y-5">
              {actionError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-semibold">
                  <AlertCircle size={14} /> {actionError}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-400">İşaretlenen modüller bu şirketteki kullanıcılara açılabilir.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCompanyPerms({ ...editingCompanyPerms, module_permissions: Object.fromEntries(PERMISSION_MODULES.map(m => [m.id, true])) })}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      Tümünü Aç
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCompanyPerms({ ...editingCompanyPerms, module_permissions: Object.fromEntries(PERMISSION_MODULES.map(m => [m.id, false])) })}
                      className="text-[10px] font-bold text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Tümünü Kapat
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSION_MODULES.map(mod => {
                    const active = editingCompanyPerms.module_permissions?.[mod.id] ?? false;
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          active ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/20'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={e => setEditingCompanyPerms({
                            ...editingCompanyPerms,
                            module_permissions: { ...editingCompanyPerms.module_permissions, [mod.id]: e.target.checked },
                          })}
                          className="w-4 h-4 accent-indigo-600 rounded"
                        />
                        <span className="text-xs font-medium text-gray-700">{mod.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingCompanyPerms(null)} className="flex-1 py-3 border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50">
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {actionLoading ? 'Kaydediliyor...' : <><CheckCircle2 size={16} /> Kaydet</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

