import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  MoreVertical, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Shield,
  ExternalLink,
  Trash2,
  Lock,
  Zap
} from 'lucide-react';
import { companiesAPI, Company, profileAPI, UserProfile } from '../api/supabase';

export const SuperAdmin: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'companies' | 'users' | 'system'>('companies');
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
        setActionError("Şirket oluşturulamadı. Lütfen veritabanı bağlantısını kontrol edin.");
      }
    } catch (err: any) {
      setActionError(err.message || "Bir hata oluştu.");
    } finally {
      setActionLoading(false);
    }
  };

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

        <div className="overflow-x-auto">
          {activeTab === 'companies' && (
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
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'users' && (
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
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                        <Settings size={16} />
                      </button>
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
    </div>
  );
};
