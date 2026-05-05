import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Search, MoreVertical, Shield, AlertCircle,
  CheckCircle2, Lock, UserCheck
} from 'lucide-react';
import { profileAPI, UserProfile, UserRole, PERMISSION_MODULES } from '../api/supabase';

export const CompanyAdmin: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const profile = await profileAPI.getMyProfile();
      if (profile?.company_id) {
        const companyUsers = await profileAPI.getCompanyProfiles(profile.company_id);
        setUsers(companyUsers);
      }
    } catch (err) {
      console.error('CompanyAdmin load error:', err);
    } finally {
      setLoading(false);
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
        permissions: editingUser.permissions,
      });
      if (res) {
        setUsers(users.map(u => u.id === res.id ? res : u));
        setEditingUser(null);
      }
    } catch (err: any) {
      setActionError(err.message || 'Güncelleme hatası.');
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

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <UserCheck size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Şirket Yönetimi</h1>
          <p className="text-sm text-gray-400">Kullanıcıları ve modül erişim yetkilerini yönetin</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Toplam Kullanıcı</div>
          <div className="text-2xl font-bold text-gray-800">{users.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Yöneticiler</div>
          <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'admin').length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Standart Kullanıcı</div>
          <div className="text-2xl font-bold text-gray-800">{users.filter(u => u.role === 'user').length}</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Kullanıcılar</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kullanıcı</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aktif Modüller</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                        {u.full_name?.charAt(0) || u.email?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-700">{u.full_name || 'İsimsiz'}</div>
                        <div className="text-[10px] text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {u.role === 'admin' ? <Shield size={10} /> : <Users size={10} />}
                      {u.role === 'admin' ? 'YÖNETİCİ' : 'KULLANICI'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {Object.values(u.permissions || {}).filter(Boolean).length} / {PERMISSION_MODULES.length} modül
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === u.id ? null : u.id)}
                      className={`p-2 rounded-lg transition-colors ${activeMenuId === u.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-400'}`}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeMenuId === u.id && (
                      <div ref={menuRef} className="absolute right-6 top-12 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in zoom-in-95 duration-200">
                        <button
                          onClick={() => { setEditingUser(u); setActiveMenuId(null); }}
                          className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Lock size={14} className="text-gray-400" /> Yetkilendir
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

      {editingUser && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-blue-600 text-white">
              <div className="flex items-center gap-3">
                <Lock size={20} />
                <div>
                  <h3 className="font-bold">Kullanıcı Yetkilendirme</h3>
                  <p className="text-xs text-blue-200">{editingUser.full_name || editingUser.email}</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors text-lg leading-none">✕</button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {actionError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-semibold">
                  <AlertCircle size={14} /> {actionError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Ad Soyad</label>
                <input
                  type="text"
                  value={editingUser.full_name || ''}
                  onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Rol</label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="user">Standart Kullanıcı</option>
                  <option value="admin">Şirket Yöneticisi (Admin)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-gray-400 uppercase">Modül Erişim İzinleri</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingUser({ ...editingUser, permissions: Object.fromEntries(PERMISSION_MODULES.map(m => [m.id, true])) })}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
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
                          ? 'border-blue-200 bg-blue-50/50'
                          : 'border-gray-100 hover:border-blue-100 hover:bg-blue-50/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editingUser.permissions?.[mod.id] ?? false}
                        onChange={e => togglePermission(mod.id, e.target.checked)}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                      <span className="text-xs font-medium text-gray-700">{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-3 border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50">
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
