import React, { useState, useEffect } from 'react';
import { DataService } from '../api/dataService';
import { fmt } from '../utils/formatters';
import { Contact as ContactIcon, UserPlus, Pencil, Trash2, X, Clock, CreditCard, TrendingDown } from 'lucide-react';

interface Person {
  id: string;
  name: string;
  position: string;
  department: string;
  salary: number;
  sgk_status: string;
  start_date: string;
}

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const inputCls = 'w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-8 py-5 text-sm font-black text-enba-dark focus:bg-white focus:ring-2 focus:ring-enba-orange/20 outline-none transition-all';
const labelCls = 'text-[10px] font-black text-gray-400 uppercase tracking-[4px] ml-1';

export const HR: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'personnel' | 'attendance' | 'payments' | 'debts'>('personnel');
  const [loading, setLoading] = useState(true);
  const [personel, setPersonel] = useState<Person[]>([]);

  // ── Personnel modal ──────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formDepartment, setFormDepartment] = useState('ÜRETİM HATTI');
  const [formSgk, setFormSgk] = useState('Aktif');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  // ── Attendance ───────────────────────────────────────────────
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [showAttModal, setShowAttModal] = useState(false);
  const [attPersonId, setAttPersonId] = useState('');
  const [attMonth, setAttMonth] = useState(new Date().getMonth() + 1);
  const [attYear, setAttYear] = useState(new Date().getFullYear());
  const [attWorkHours, setAttWorkHours] = useState('');
  const [attOvertime, setAttOvertime] = useState('0');
  const [attNotes, setAttNotes] = useState('');
  const [savingAtt, setSavingAtt] = useState(false);

  // ── Payments ─────────────────────────────────────────────────
  const [paymentList, setPaymentList] = useState<any[]>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payPersonId, setPayPersonId] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState('');
  const [payStatus, setPayStatus] = useState('pending');
  const [savingPay, setSavingPay] = useState(false);

  // ── Debts ────────────────────────────────────────────────────
  const [debtList, setDebtList] = useState<any[]>([]);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtPersonId, setDebtPersonId] = useState('');
  const [debtDate, setDebtDate] = useState(new Date().toISOString().split('T')[0]);
  const [debtAmount, setDebtAmount] = useState('');
  const [debtType, setDebtType] = useState('avans');
  const [debtDesc, setDebtDesc] = useState('');
  const [savingDebt, setSavingDebt] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────
  const fetchPersonnel = async () => {
    setLoading(true);
    try {
      const p = await DataService.fetchData<any>('personnel', '*');
      setPersonel(p || []);
    } catch (e) {
      console.error('İK verileri çekilemedi:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try { setAttendanceList(await DataService.fetchData<any>('attendance', '*')); } catch { /* ignore */ }
  };
  const fetchPayments = async () => {
    try { setPaymentList(await DataService.fetchData<any>('personnel_payments', '*')); } catch { /* ignore */ }
  };
  const fetchDebts = async () => {
    try { setDebtList(await DataService.fetchData<any>('personnel_debts', '*')); } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchPersonnel();
    fetchAttendance();
    fetchPayments();
    fetchDebts();
  }, []);

  // ── Personnel CRUD ───────────────────────────────────────────
  const resetForm = () => {
    setEditingId(null); setFormName(''); setFormPosition(''); setFormSalary('');
    setFormDepartment('ÜRETİM HATTI'); setFormSgk('Aktif');
    setFormStartDate(new Date().toISOString().split('T')[0]);
  };

  const handleOpenNew = () => { resetForm(); setShowModal(true); };

  const handleEdit = (p: Person) => {
    setEditingId(p.id); setFormName(p.name); setFormPosition(p.position || '');
    setFormSalary(p.salary?.toString() || ''); setFormDepartment(p.department || 'ÜRETİM HATTI');
    setFormSgk(p.sgk_status || 'Aktif');
    setFormStartDate(p.start_date || new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const payload = { name: formName.trim(), position: formPosition.trim(), salary: Number(formSalary) || 0, department: formDepartment, sgk_status: formSgk, start_date: formStartDate };
      if (editingId) await DataService.updateData('personnel', editingId, payload);
      else await DataService.insertData('personnel', payload);
      await fetchPersonnel();
      setShowModal(false); resetForm();
    } catch { alert('Kayıt hatası oluştu'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu personel kaydı silinecek. Onaylıyor musunuz?')) return;
    try { await DataService.deleteData('personnel', id); await fetchPersonnel(); }
    catch { alert('Silme hatası'); }
  };

  // ── Attendance CRUD ──────────────────────────────────────────
  const handleSaveAtt = async () => {
    if (!attPersonId || !attWorkHours) return;
    setSavingAtt(true);
    try {
      await DataService.insertData('attendance', {
        person_id: attPersonId, month: attMonth, year: attYear,
        work_hours: Number(attWorkHours), overtime_hours: Number(attOvertime) || 0, notes: attNotes,
      });
      await fetchAttendance();
      setShowAttModal(false);
      setAttPersonId(''); setAttWorkHours(''); setAttOvertime('0'); setAttNotes('');
    } catch (e: any) {
      alert(e?.message?.includes('unique') ? 'Bu personel için bu ay zaten kayıt var.' : 'Puantaj kaydedilemedi');
    } finally { setSavingAtt(false); }
  };

  const handleDeleteAtt = async (id: string) => {
    if (!confirm('Puantaj kaydı silinecek?')) return;
    try { await DataService.deleteData('attendance', id); await fetchAttendance(); }
    catch { alert('Silme hatası'); }
  };

  // ── Payments CRUD ────────────────────────────────────────────
  const handleSavePay = async () => {
    if (!payPersonId || !payAmount) return;
    setSavingPay(true);
    try {
      await DataService.insertData('personnel_payments', {
        person_id: payPersonId, date: payDate, amount: Number(payAmount), status: payStatus,
      });
      await fetchPayments();
      setShowPayModal(false);
      setPayPersonId(''); setPayAmount(''); setPayStatus('pending');
    } catch { alert('Ödeme kaydedilemedi'); }
    finally { setSavingPay(false); }
  };

  const handleTogglePay = async (id: string, current: string) => {
    try {
      await DataService.updateData('personnel_payments', id, { status: current === 'paid' ? 'pending' : 'paid' });
      await fetchPayments();
    } catch { alert('Güncelleme hatası'); }
  };

  const handleDeletePay = async (id: string) => {
    if (!confirm('Ödeme kaydı silinecek?')) return;
    try { await DataService.deleteData('personnel_payments', id); await fetchPayments(); }
    catch { alert('Silme hatası'); }
  };

  // ── Debts CRUD ───────────────────────────────────────────────
  const handleSaveDebt = async () => {
    if (!debtPersonId || !debtAmount) return;
    setSavingDebt(true);
    try {
      await DataService.insertData('personnel_debts', {
        person_id: debtPersonId, date: debtDate, amount: Number(debtAmount), type: debtType, description: debtDesc,
      });
      await fetchDebts();
      setShowDebtModal(false);
      setDebtPersonId(''); setDebtAmount(''); setDebtType('avans'); setDebtDesc('');
    } catch { alert('Kayıt eklenemedi'); }
    finally { setSavingDebt(false); }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!confirm('Kayıt silinecek?')) return;
    try { await DataService.deleteData('personnel_debts', id); await fetchDebts(); }
    catch { alert('Silme hatası'); }
  };

  // ── Helpers ──────────────────────────────────────────────────
  const personName = (id: string) => personel.find(p => p.id === id)?.name || '—';

  const tabConfig = {
    personnel: { label: 'Personel Matrix',   addLabel: 'Kadro Tahsis Et', Icon: UserPlus,    onAdd: handleOpenNew },
    attendance: { label: 'Puantaj Kayıtları', addLabel: 'Puantaj Ekle',   Icon: Clock,       onAdd: () => { setAttPersonId(personel[0]?.id || ''); setShowAttModal(true); } },
    payments:   { label: 'Maaş Rejimi',       addLabel: 'Ödeme Ekle',     Icon: CreditCard,  onAdd: () => { setPayPersonId(personel[0]?.id || ''); setShowPayModal(true); } },
    debts:      { label: 'Avans & Borç',      addLabel: 'Kayıt Ekle',     Icon: TrendingDown, onAdd: () => { setDebtPersonId(personel[0]?.id || ''); setShowDebtModal(true); } },
  };
  const current = tabConfig[activeTab];

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-10 p-10 animate-in fade-in duration-1000">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-enba-dark rounded-[1.2rem] flex items-center justify-center text-enba-orange shadow-2xl border border-white/5">
              <ContactIcon size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">İnsan Kaynakları Yönetimi</h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[4px] mt-2 italic">Organizasyonel Yapı ve Personel Matrix</p>
            </div>
          </div>
        </div>
        <button
          onClick={current.onAdd}
          className="px-10 py-5 bg-enba-dark text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[3px] shadow-2xl shadow-black/20 hover:bg-black transition-all flex items-center gap-4 group active:scale-95 border border-white/5"
        >
          <current.Icon size={20} className="text-enba-orange transition-transform group-hover:scale-125" />
          {current.addLabel}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-[2rem] self-start border border-gray-100 shadow-inner">
        {(['personnel', 'attendance', 'payments', 'debts'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[2px] transition-all ${activeTab === tab ? 'bg-enba-dark text-white shadow-xl' : 'text-gray-400 hover:text-enba-dark'}`}>
            {tab === 'personnel' && 'Personel Matrix'}
            {tab === 'attendance' && 'Puantaj Kayıtları'}
            {tab === 'payments' && 'Maaş Rejimi'}
            {tab === 'debts' && 'Avans & Borç'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-[2.5rem] shadow-card border border-gray-100 overflow-hidden">
        <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
          <div>
            <h3 className="text-lg font-black text-enba-dark italic uppercase tracking-tighter">{current.label}</h3>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-[3px] mt-1">
              {activeTab === 'personnel' && `Sistem Kayıtlı ${personel.length} Personel`}
              {activeTab === 'attendance' && `${attendanceList.length} Puantaj Kaydı`}
              {activeTab === 'payments' && `${paymentList.length} Ödeme Kaydı`}
              {activeTab === 'debts' && `${debtList.length} Avans / Borç Kaydı`}
            </p>
          </div>
        </div>

        {loading && activeTab === 'personnel' ? (
          <div className="py-32 text-center animate-pulse flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-enba-orange border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-gray-300 font-black uppercase text-[10px] tracking-[4px]">Veritabanı Senkronize Ediliyor...</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">

            {/* ── PERSONEL ── */}
            {activeTab === 'personnel' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Kimlik & Pozisyon</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Departman</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Hakediş</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">SGK</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Yönetim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {personel.map(p => (
                    <tr key={p.id} className="group hover:bg-gray-50/80 transition-all">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-[1rem] bg-enba-dark text-white flex items-center justify-center font-black italic shadow-lg group-hover:scale-110 transition-transform">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-base font-black text-enba-dark italic tracking-tight uppercase leading-none mb-2">{p.name}</div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">{p.position}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block border border-gray-200/50">
                          {p.department || 'GENEL MERKEZ'}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-base font-black text-enba-dark tabular-nums italic">
                        {fmt(p.salary)} <span className="text-[10px] text-gray-300 font-bold ml-1">₺</span>
                      </td>
                      <td className="px-10 py-8">
                        <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                          p.sgk_status === 'Aktif' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-100'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${p.sgk_status === 'Aktif' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {p.sgk_status}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(p)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-enba-dark text-white hover:bg-black transition-all shadow-lg active:scale-90">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90 border border-rose-100">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {personel.length === 0 && (
                    <tr><td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <ContactIcon size={40} className="text-gray-200 mb-6" />
                        <span className="font-black text-[10px] tracking-[4px] uppercase italic text-gray-200">Kayıtlı personel bulunamadı.</span>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}

            {/* ── PUANTAJ ── */}
            {activeTab === 'attendance' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Personel</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Dönem</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Çalışma (sa)</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Fazla Mesai (sa)</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Not</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendanceList.map(a => (
                    <tr key={a.id} className="group hover:bg-gray-50/80 transition-all">
                      <td className="px-10 py-6 font-black text-enba-dark uppercase text-sm">{personName(a.person_id)}</td>
                      <td className="px-10 py-6 text-sm text-gray-600 font-semibold">{MONTHS[(a.month ?? 1) - 1]} {a.year}</td>
                      <td className="px-10 py-6 text-base font-black text-enba-dark tabular-nums">{a.work_hours}</td>
                      <td className="px-10 py-6 text-sm font-semibold text-orange-500">{a.overtime_hours || 0}</td>
                      <td className="px-10 py-6 text-sm text-gray-400">{a.notes || '—'}</td>
                      <td className="px-10 py-6 text-right">
                        <button onClick={() => handleDeleteAtt(a.id)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 ml-auto border border-rose-100">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {attendanceList.length === 0 && (
                    <tr><td colSpan={6} className="py-24 text-center">
                      <Clock size={36} className="text-gray-200 mx-auto mb-4" />
                      <p className="font-black text-[10px] tracking-[4px] uppercase italic text-gray-200">Puantaj kaydı bulunamadı.</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}

            {/* ── ÖDEMELER ── */}
            {activeTab === 'payments' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Personel</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Tarih</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Tutar</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Durum</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paymentList.map(pay => (
                    <tr key={pay.id} className="group hover:bg-gray-50/80 transition-all">
                      <td className="px-10 py-6 font-black text-enba-dark uppercase text-sm">{personName(pay.person_id)}</td>
                      <td className="px-10 py-6 text-sm text-gray-600 font-semibold">{pay.date}</td>
                      <td className="px-10 py-6 text-base font-black text-enba-dark tabular-nums italic">{fmt(pay.amount)} ₺</td>
                      <td className="px-10 py-6">
                        <button onClick={() => handleTogglePay(pay.id, pay.status)}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 transition-all ${
                            pay.status === 'paid' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 ring-1 ring-amber-100 hover:bg-amber-100'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${pay.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                          {pay.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                        </button>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button onClick={() => handleDeletePay(pay.id)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 ml-auto border border-rose-100">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paymentList.length === 0 && (
                    <tr><td colSpan={5} className="py-24 text-center">
                      <CreditCard size={36} className="text-gray-200 mx-auto mb-4" />
                      <p className="font-black text-[10px] tracking-[4px] uppercase italic text-gray-200">Ödeme kaydı bulunamadı.</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}

            {/* ── AVANS & BORÇ ── */}
            {activeTab === 'debts' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Personel</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Tarih</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Tür</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Tutar</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">Açıklama</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100 italic">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {debtList.map(d => (
                    <tr key={d.id} className="group hover:bg-gray-50/80 transition-all">
                      <td className="px-10 py-6 font-black text-enba-dark uppercase text-sm">{personName(d.person_id)}</td>
                      <td className="px-10 py-6 text-sm text-gray-600 font-semibold">{d.date}</td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          d.type === 'avans' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-100'
                        }`}>{d.type}</span>
                      </td>
                      <td className="px-10 py-6 text-base font-black text-enba-dark tabular-nums italic">{fmt(d.amount)} ₺</td>
                      <td className="px-10 py-6 text-sm text-gray-400">{d.description || '—'}</td>
                      <td className="px-10 py-6 text-right">
                        <button onClick={() => handleDeleteDebt(d.id)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 ml-auto border border-rose-100">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {debtList.length === 0 && (
                    <tr><td colSpan={6} className="py-24 text-center">
                      <TrendingDown size={36} className="text-gray-200 mx-auto mb-4" />
                      <p className="font-black text-[10px] tracking-[4px] uppercase italic text-gray-200">Avans / borç kaydı bulunamadı.</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}

          </div>
        )}
      </div>

      {/* ── Personnel Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-enba-dark/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-500 px-6">
          <div className="bg-white rounded-[3.5rem] p-12 w-full max-w-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-enba-orange" />
            <button onClick={() => { setShowModal(false); resetForm(); }} className="absolute top-8 right-8 text-gray-300 hover:text-enba-dark transition-all hover:rotate-90 duration-300">
              <X size={32} />
            </button>
            <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 bg-enba-dark rounded-2xl flex items-center justify-center text-enba-orange shadow-2xl"><UserPlus size={32} /></div>
              <div>
                <h3 className="text-2xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">Personel Kayıt Matrixi</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-2">{editingId ? 'Kadro Güncelleme Formu' : 'Yeni Kadro Tahsis Formu'}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className={labelCls}>Kadro Ad Soyad</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className={inputCls + ' uppercase placeholder:opacity-30'} placeholder="TAM İSİM GİRİNİZ" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className={labelCls}>Pozisyon / Unvan</label>
                  <input type="text" value={formPosition} onChange={e => setFormPosition(e.target.value)} className={inputCls + ' uppercase placeholder:opacity-30'} placeholder="OPERATÖR" />
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>İşe Başlama</label>
                  <input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Hakediş (NET ₺)</label>
                  <input type="number" value={formSalary} onChange={e => setFormSalary(e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Saha / Departman</label>
                  <select value={formDepartment} onChange={e => setFormDepartment(e.target.value)} className={inputCls + ' appearance-none'}>
                    <option>ÜRETİM HATTI</option>
                    <option>LOJİSTİK & SEVKİYAT</option>
                    <option>İDARİ İŞLER</option>
                    <option>LABORATUVAR</option>
                  </select>
                </div>
                <div className="space-y-3 col-span-2">
                  <label className={labelCls}>SGK Durumu</label>
                  <select value={formSgk} onChange={e => setFormSgk(e.target.value)} className={inputCls + ' appearance-none'}>
                    <option>Aktif</option>
                    <option>Pasif</option>
                  </select>
                </div>
              </div>
              <button onClick={handleSave} disabled={saving || !formName.trim()}
                className="w-full bg-enba-orange text-white rounded-[1.8rem] py-6 font-black text-xs uppercase tracking-[5px] shadow-2xl shadow-enba-orange/30 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'KAYDEDİLİYOR...' : 'SİSTEME KAYDET'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Attendance Modal ── */}
      {showAttModal && (
        <div className="fixed inset-0 bg-enba-dark/80 backdrop-blur-md flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-[3.5rem] p-12 w-full max-w-lg shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-enba-orange" />
            <button onClick={() => setShowAttModal(false)} className="absolute top-8 right-8 text-gray-300 hover:text-enba-dark transition-all hover:rotate-90 duration-300"><X size={32} /></button>
            <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 bg-enba-dark rounded-2xl flex items-center justify-center text-enba-orange shadow-2xl"><Clock size={28} /></div>
              <div>
                <h3 className="text-2xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">Puantaj Kaydı</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-2">Aylık Çalışma Saati Girişi</p>
              </div>
            </div>
            <div className="space-y-5">
              <div className="space-y-3">
                <label className={labelCls}>Personel</label>
                <select value={attPersonId} onChange={e => setAttPersonId(e.target.value)} className={inputCls + ' appearance-none'}>
                  <option value="">— Seçiniz —</option>
                  {personel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <label className={labelCls}>Ay</label>
                  <select value={attMonth} onChange={e => setAttMonth(Number(e.target.value))} className={inputCls + ' appearance-none'}>
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Yıl</label>
                  <input type="number" value={attYear} onChange={e => setAttYear(Number(e.target.value))} className={inputCls} />
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Çalışma Saati</label>
                  <input type="number" value={attWorkHours} onChange={e => setAttWorkHours(e.target.value)} className={inputCls} placeholder="0" />
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Fazla Mesai (sa)</label>
                  <input type="number" value={attOvertime} onChange={e => setAttOvertime(e.target.value)} className={inputCls} placeholder="0" />
                </div>
              </div>
              <div className="space-y-3">
                <label className={labelCls}>Not (opsiyonel)</label>
                <input type="text" value={attNotes} onChange={e => setAttNotes(e.target.value)} className={inputCls} placeholder="..." />
              </div>
              <button onClick={handleSaveAtt} disabled={savingAtt || !attPersonId || !attWorkHours}
                className="w-full bg-enba-orange text-white rounded-[1.8rem] py-6 font-black text-xs uppercase tracking-[5px] shadow-2xl shadow-enba-orange/30 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {savingAtt ? 'KAYDEDİLİYOR...' : 'PUANTAJ KAYDET'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showPayModal && (
        <div className="fixed inset-0 bg-enba-dark/80 backdrop-blur-md flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-[3.5rem] p-12 w-full max-w-lg shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-enba-orange" />
            <button onClick={() => setShowPayModal(false)} className="absolute top-8 right-8 text-gray-300 hover:text-enba-dark transition-all hover:rotate-90 duration-300"><X size={32} /></button>
            <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 bg-enba-dark rounded-2xl flex items-center justify-center text-enba-orange shadow-2xl"><CreditCard size={28} /></div>
              <div>
                <h3 className="text-2xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">Maaş / Ödeme</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-2">Personel Ödeme Kaydı</p>
              </div>
            </div>
            <div className="space-y-5">
              <div className="space-y-3">
                <label className={labelCls}>Personel</label>
                <select value={payPersonId} onChange={e => setPayPersonId(e.target.value)} className={inputCls + ' appearance-none'}>
                  <option value="">— Seçiniz —</option>
                  {personel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <label className={labelCls}>Tarih</label>
                  <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Tutar (₺)</label>
                  <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className={inputCls} placeholder="0" />
                </div>
              </div>
              <div className="space-y-3">
                <label className={labelCls}>Durum</label>
                <select value={payStatus} onChange={e => setPayStatus(e.target.value)} className={inputCls + ' appearance-none'}>
                  <option value="pending">Bekliyor</option>
                  <option value="paid">Ödendi</option>
                </select>
              </div>
              <button onClick={handleSavePay} disabled={savingPay || !payPersonId || !payAmount}
                className="w-full bg-enba-orange text-white rounded-[1.8rem] py-6 font-black text-xs uppercase tracking-[5px] shadow-2xl shadow-enba-orange/30 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {savingPay ? 'KAYDEDİLİYOR...' : 'ÖDEME KAYDET'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Debt Modal ── */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-enba-dark/80 backdrop-blur-md flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-[3.5rem] p-12 w-full max-w-lg shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-enba-orange" />
            <button onClick={() => setShowDebtModal(false)} className="absolute top-8 right-8 text-gray-300 hover:text-enba-dark transition-all hover:rotate-90 duration-300"><X size={32} /></button>
            <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 bg-enba-dark rounded-2xl flex items-center justify-center text-enba-orange shadow-2xl"><TrendingDown size={28} /></div>
              <div>
                <h3 className="text-2xl font-black text-enba-dark tracking-tighter uppercase italic leading-none">Avans & Borç</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-2">Avans / Borç Kaydı Ekle</p>
              </div>
            </div>
            <div className="space-y-5">
              <div className="space-y-3">
                <label className={labelCls}>Personel</label>
                <select value={debtPersonId} onChange={e => setDebtPersonId(e.target.value)} className={inputCls + ' appearance-none'}>
                  <option value="">— Seçiniz —</option>
                  {personel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <label className={labelCls}>Tarih</label>
                  <input type="date" value={debtDate} onChange={e => setDebtDate(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Tutar (₺)</label>
                  <input type="number" value={debtAmount} onChange={e => setDebtAmount(e.target.value)} className={inputCls} placeholder="0" />
                </div>
              </div>
              <div className="space-y-3">
                <label className={labelCls}>Tür</label>
                <select value={debtType} onChange={e => setDebtType(e.target.value)} className={inputCls + ' appearance-none'}>
                  <option value="avans">Avans</option>
                  <option value="borç">Borç</option>
                  <option value="diğer">Diğer</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className={labelCls}>Açıklama</label>
                <input type="text" value={debtDesc} onChange={e => setDebtDesc(e.target.value)} className={inputCls} placeholder="..." />
              </div>
              <button onClick={handleSaveDebt} disabled={savingDebt || !debtPersonId || !debtAmount}
                className="w-full bg-enba-orange text-white rounded-[1.8rem] py-6 font-black text-xs uppercase tracking-[5px] shadow-2xl shadow-enba-orange/30 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {savingDebt ? 'KAYDEDİLİYOR...' : 'KAYDET'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HR;
