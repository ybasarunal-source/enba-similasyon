import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  PlusCircle, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Pencil, 
  Calendar,
  DollarSign,
  Tag,
  AlertCircle,
  Check,
  TrendingUp,
  Receipt,
  X,
  RefreshCw,
  CloudLightning
} from 'lucide-react';
import { fmt } from '../utils/formatters';
import { parasutService } from '../api/parasut';
import { fixedExpensesAPI, SupabaseFixedExpense } from '../api/supabase';

const CATEGORIES = [
  { id: 'yazilim', label: 'Yazılım & SaaS', color: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500/20' },
  { id: 'kira', label: 'Kira & Gayrimenkul', color: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500/20' },
  { id: 'fatura', label: 'Faturalar', color: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500/20' },
  { id: 'aidat', label: 'Aidat & Operasyon', color: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500/20' },
  { id: 'personel', label: 'Personel & Maaş Dışı', color: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500/20' },
  { id: 'diger', label: 'Diğer', color: 'bg-gray-500', text: 'text-gray-500', border: 'border-gray-500/20' },
];

export const FixedExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<SupabaseFixedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupabaseFixedExpense | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<SupabaseFixedExpense>>({
    title: '', amount: 0, category: 'diger', due_date: 1, is_auto_pay: false, parasut_match_keyword: ''
  });

  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  // Fetch from Supabase + Silent Migration
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const cloudData = await fixedExpensesAPI.getAll();
        
        // Silent Migration check
        const localStr = localStorage.getItem('enba_fixed_expenses');
        if (localStr && cloudData.length === 0) {
           const localData = JSON.parse(localStr);
           if (Array.isArray(localData) && localData.length > 0) {
             console.log("Migrating local FixedExpenses to Supabase...");
             for (const item of localData) {
               await fixedExpensesAPI.insert({
                 title: item.title,
                 amount: item.amount,
                 category: item.category,
                 due_date: item.dueDate || item.due_date,
                 is_auto_pay: item.isAutoPay || item.is_auto_pay,
                 parasut_match_keyword: item.parasutMatchKeyword || item.parasut_match_keyword,
                 history: item.history || {}
               });
             }
             const migratedData = await fixedExpensesAPI.getAll();
             setExpenses(migratedData);
             localStorage.removeItem('enba_fixed_expenses');
             setIsLoading(false);
             return;
           }
        }

        setExpenses(cloudData);
      } catch (err) {
        console.error("Veriler yüklenemedi:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleTogglePayment = async (id: string) => {
    const exp = expenses.find(e => e.id === id);
    if (!exp || !exp.id) return;

    const isCurrentlyPaid = !!exp.history[currentMonthKey];
    const newHistory = { ...exp.history, [currentMonthKey]: !isCurrentlyPaid };
    
    // Optimistic Update
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, history: newHistory } : e));
    
    // API Call
    await fixedExpensesAPI.update(exp.id, { history: newHistory });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu ödemeyi silmek istediğinize emin misiniz?')) {
      const success = await fixedExpensesAPI.delete(id);
      if (success) {
        setExpenses(prev => prev.filter(e => e.id !== id));
      }
    }
  };

  const openModal = (item?: SupabaseFixedExpense) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({ title: '', amount: 0, category: 'diger', due_date: 1, is_auto_pay: false, parasut_match_keyword: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    if (editingItem && editingItem.id) {
      const updated = await fixedExpensesAPI.update(editingItem.id, formData);
      if (updated) {
        setExpenses(prev => prev.map(exp => exp.id === editingItem.id ? updated : exp));
      }
    } else {
      const newItem = await fixedExpensesAPI.insert({
        ...(formData as SupabaseFixedExpense),
        history: {}
      });
      if (newItem) {
        setExpenses(prev => [...prev, newItem]);
      }
    }
    setIsModalOpen(false);
  };

  const handleSyncParasut = async () => {
    if (!parasutService.isLoggedIn()) {
      alert("Paraşüt bağlantınız yok. Önce Paraşüt modülünden giriş yapmalısınız.");
      return;
    }
    const company = parasutService.getCompany();
    if (!company) return;

    setIsSyncing(true);
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dateFrom = `${year}-${month}-01`;
      const lastDay = new Date(year, currentDate.getMonth() + 1, 0).getDate();
      const dateTo = `${year}-${month}-${lastDay}`;

      const [expenditures, bills] = await Promise.all([
        parasutService.getExpenditures(company.id, dateFrom, dateTo).catch(() => []),
        parasutService.getPurchaseBills(company.id, dateFrom, dateTo).catch(() => [])
      ]);

      const allParasutInvoices = [...expenditures, ...bills];

      let syncCount = 0;
      let updatedExpenses = [...expenses];
      
      for (const exp of expenses) {
        if (!exp.id || !exp.parasut_match_keyword || exp.history[currentMonthKey]) continue;

        const keyword = exp.parasut_match_keyword.toLowerCase();
        
        const isMatchedAndPaid = allParasutInvoices.some(inv => {
           const matchText = `${inv.contact_name} ${inv.description} ${inv.category_name}`.toLowerCase();
           return matchText.includes(keyword) && inv.payment_status === 'paid';
        });

        if (isMatchedAndPaid) {
          syncCount++;
          const newHistory = { ...exp.history, [currentMonthKey]: true };
          await fixedExpensesAPI.update(exp.id, { history: newHistory });
          updatedExpenses = updatedExpenses.map(e => e.id === exp.id ? { ...e, history: newHistory } : e);
        }
      }

      if (syncCount > 0) {
        setExpenses(updatedExpenses);
        setTimeout(() => alert(`Senkronizasyon tamamlandı: ${syncCount} adet gider otomatik olarak "Ödendi" işaretlendi!`), 500);
      } else {
        setTimeout(() => alert('Yeni bir eşleşen "Ödenmiş" kayıt bulunamadı.'), 500);
      }

    } catch (error: any) {
      alert("Paraşüt senkronizasyonu sırasında hata oluştu: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Stats Calculations
  const stats = useMemo(() => {
    let total = 0;
    let paid = 0;

    expenses.forEach(exp => {
      total += Number(exp.amount) || 0;
      if (exp.history[currentMonthKey]) {
        paid += Number(exp.amount) || 0;
      }
    });

    return { total, paid, pending: total - paid };
  }, [expenses, currentMonthKey]);

  // Filtered List
  const filteredList = useMemo(() => {
    let list = [...expenses];
    list.sort((a, b) => a.dueDate - b.dueDate);
    
    if (filter === 'pending') {
      list = list.filter(exp => !exp.history[currentMonthKey]);
    } else if (filter === 'paid') {
      list = list.filter(exp => !!exp.history[currentMonthKey]);
    }
    return list;
  }, [expenses, filter, currentMonthKey]);

  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  return (
    <div className="flex flex-col gap-8 p-8 animate-in fade-in duration-700 min-h-full">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-enba-dark rounded-2xl flex items-center justify-center text-enba-orange shadow-2xl border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-enba-orange/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Receipt size={32} className="relative z-10" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-enba-dark tracking-tighter uppercase leading-none">Abonelikler & Ödemeler</h2>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[4px] mt-2 flex items-center gap-2">
              Sabit Gider Takip Merkezi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <button onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            {'<'}
          </button>
          <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-sm font-black text-enba-dark uppercase tracking-widest">{monthNames[currentDate.getMonth()]}</span>
            <span className="text-[10px] font-bold text-gray-400">{currentDate.getFullYear()}</span>
          </div>
          <button onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            {'>'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total */}
        <div className="bg-white rounded-[2rem] p-6 shadow-card border border-gray-100 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
             <DollarSign size={40} className="text-gray-200" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Toplam Sabit Gider</p>
          <h3 className="text-3xl font-black text-enba-dark tracking-tight relative z-10">{fmt(stats.total)} ₺</h3>
        </div>
        
        {/* Paid */}
        <div className="bg-white rounded-[2rem] p-6 shadow-card border border-emerald-500/20 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
             <CheckCircle2 size={40} className="text-emerald-200" />
          </div>
          <p className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest mb-1 relative z-10">Ödenen</p>
          <h3 className="text-3xl font-black text-emerald-600 tracking-tight relative z-10">{fmt(stats.paid)} ₺</h3>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-[2rem] p-6 shadow-card border border-enba-orange/20 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-enba-orange"></div>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
             <AlertCircle size={40} className="text-enba-orange/20" />
          </div>
          <p className="text-[10px] font-black text-enba-orange/70 uppercase tracking-widest mb-1 relative z-10">Bekleyen</p>
          <h3 className="text-3xl font-black text-enba-orange tracking-tight relative z-10">{fmt(stats.pending)} ₺</h3>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2.5rem] shadow-card border border-gray-100 flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-b border-gray-100 gap-4">
          <div className="flex bg-gray-50 p-1.5 rounded-2xl">
            <button 
              onClick={() => setFilter('all')} 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white text-enba-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Tümü ({expenses.length})
            </button>
            <button 
              onClick={() => setFilter('pending')} 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'pending' ? 'bg-white text-enba-orange shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Bekleyen
            </button>
            <button 
              onClick={() => setFilter('paid')} 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'paid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Ödenen
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleSyncParasut}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all hover:bg-blue-100 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Senkronize Ediliyor...' : 'Paraşüt Sync'}
            </button>
            <button 
              onClick={() => openModal()} 
              className="flex items-center gap-2 px-6 py-3 bg-enba-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-lg hover:bg-black transition-all hover:-translate-y-0.5"
            >
              <PlusCircle size={16} className="text-enba-orange" />
              Yeni Ekle
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 flex flex-col gap-2 bg-gray-50/50 min-h-[300px]">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Receipt size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">Bu döneme ait kayıt bulunamadı.</p>
            </div>
          ) : (
            filteredList.map(exp => {
              const isPaid = !!exp.history[currentMonthKey];
              const cat = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[CATEGORIES.length - 1];
              
              return (
                <div key={exp.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-2xl border transition-all hover:shadow-md group ${isPaid ? 'border-emerald-100 bg-emerald-50/30' : 'border-gray-100'}`}>
                  
                  {/* Left: Check & Info */}
                  <div className="flex items-center gap-5 w-full sm:w-auto">
                    <button 
                      onClick={() => handleTogglePayment(exp.id)}
                      className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isPaid ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-transparent hover:border-enba-orange'}`}
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isPaid ? 'text-gray-500 line-through' : 'text-enba-dark'}`}>
                          {exp.title}
                        </span>
                        {exp.is_auto_pay && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-500 rounded text-[9px] font-black uppercase tracking-widest">
                            Oto-Ödeme
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                        <span className={`px-2 py-1 rounded-md border ${cat.border} ${cat.text} bg-white`}>
                          {cat.label}
                        </span>
                        <span className="text-gray-400 flex items-center gap-1">
                          <Calendar size={12} />
                          Her Ayın {exp.due_date}. Günü
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto justify-end pl-13 sm:pl-0">
                    <div className="flex flex-col items-end">
                      <span className={`text-lg font-black tracking-tight ${isPaid ? 'text-emerald-600' : 'text-enba-dark'}`}>
                        {fmt(exp.amount)} ₺
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(exp)} className="p-2 text-gray-400 hover:text-enba-dark hover:bg-gray-100 rounded-xl transition-all">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(exp.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-enba-dark/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-black text-enba-dark uppercase tracking-[2px]">
                {editingItem ? 'Ödeme Düzenle' : 'Yeni Ödeme Ekle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 flex flex-col gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ödeme / Abonelik Adı</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-enba-dark focus:bg-white focus:border-enba-orange/30 outline-none transition-all"
                  placeholder="Örn: Ofis Kirası, Microsoft 365"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tutar (₺)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.amount || ''}
                    onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-enba-dark focus:bg-white focus:border-enba-orange/30 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ödeme Günü (1-31)</label>
                  <input 
                    type="number" 
                    required
                    min="1" max="31"
                    value={formData.due_date || 1}
                    onChange={e => setFormData({...formData, due_date: Number(e.target.value)})}
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-enba-dark focus:bg-white focus:border-enba-orange/30 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-enba-dark focus:bg-white focus:border-enba-orange/30 outline-none transition-all appearance-none cursor-pointer"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <CloudLightning size={14} className="text-blue-500" />
                  Paraşüt Eşleşme Kelimesi (Opsiyonel)
                </label>
                <input 
                  type="text" 
                  value={formData.parasut_match_keyword || ''}
                  onChange={e => setFormData({...formData, parasut_match_keyword: e.target.value})}
                  className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-5 py-4 text-sm font-bold text-enba-dark focus:bg-white focus:border-blue-300 outline-none transition-all"
                  placeholder="Örn: Microsoft, Yandex, Ahmet Yılmaz..."
                />
                <p className="text-[9px] text-gray-400 ml-1">Fatura açıklaması veya cari adında bu kelime geçerse otomatik eşleşir.</p>
              </div>

              <div className="flex items-center gap-3 mt-2 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 cursor-pointer" onClick={() => setFormData({...formData, is_auto_pay: !formData.is_auto_pay})}>
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${formData.is_auto_pay ? 'bg-enba-orange text-white' : 'border-2 border-gray-300'}`}>
                  {formData.is_auto_pay && <Check size={14} strokeWidth={4} />}
                </div>
                <div>
                  <span className="text-xs font-bold text-enba-dark block">Otomatik Ödeme Talimatı</span>
                  <span className="text-[10px] text-gray-400">Sadece bilgi amaçlıdır, karttan çekim yapmaz.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:bg-gray-200 transition-all">
                  İptal
                </button>
                <button type="submit" className="flex-1 py-4 bg-enba-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:bg-black transition-all shadow-xl shadow-gray-200">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
