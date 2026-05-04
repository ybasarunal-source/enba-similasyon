import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../api/supabase';
import { 
  LogIn, UserPlus, Mail, Lock, AlertCircle, Building2, 
  ChevronDown, Check, Eye, EyeOff, Zap 
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  status: string;
}

export const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyList, setShowCompanyList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('companies')
      .select('*')
      .in('status', ['active', 'demo'])
      .order('name')
      .then(({ data }) => {
        const companyData = data || [];
        setCompanies(companyData);
        if (companyData.length > 0) setSelectedCompany(companyData[0]);
      });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCompanyList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDemoLogin = async () => {
    const dEmail = 'demo@enba.com';
    const dPass = 'EnbaDemo2024!';
    setEmail(dEmail);
    setPassword(dPass);
    
    const demoComp = companies.find(c => c.status === 'demo');
    if (demoComp) setSelectedCompany(demoComp);

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: dEmail, password: dPass });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Demo girişi yapılamadı.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!selectedCompany) {
      setError('Lütfen bağlanmak istediğiniz şirketi seçin.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: email.split('@')[0] }
          }
        });
        if (error) throw error;
        setInfo('Kayıt başarılı! Lütfen e-postanızı doğrulayın.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setInfo('Şifre sıfırlama bağlantısı e-postanıza gönderildi.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const titles = { login: 'Giriş Yap', register: 'Yeni Kayıt', forgot: 'Şifremi Unuttum' };
  const btnLabels = { login: 'Giriş Yap', register: 'Kayıt Ol', forgot: 'Sıfırlama Linki Gönder' };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-[var(--enba-orange)] selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--enba-orange)] opacity-[0.03] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 opacity-[0.03] blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--enba-orange)] to-orange-600 rounded-[22px] flex items-center justify-center shadow-2xl shadow-orange-500/20 mb-4 group hover:scale-105 transition-transform duration-500">
            <LogIn className="text-white group-hover:rotate-12 transition-transform" size={28} />
          </div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '28px', letterSpacing: '-0.01em', lineHeight: 1 }}>
            <span style={{ color: 'var(--enba-orange)' }}>en</span><span style={{ color: 'white' }}>ba</span>
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.2em', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }} className="uppercase mt-1">
            Recycling
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <h2 className="text-white font-black text-lg mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {titles[mode]}
          </h2>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 mb-5 text-red-400 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          {info && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 mb-5 text-emerald-400 text-sm">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Şirket Seçimi */}
            <div className="relative" ref={dropdownRef} style={{ zIndex: 100 }}>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2 ml-1">
                Bağlanılacak Şirket
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCompanyList(!showCompanyList)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-left flex items-center justify-between hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-[var(--enba-orange)] shadow-sm">
                      <Building2 size={16} />
                    </div>
                    <span className={`text-sm font-bold ${selectedCompany ? 'text-white' : 'text-gray-500'}`}>
                      {selectedCompany ? selectedCompany.name : 'Şirket Seçiniz...'}
                    </span>
                  </div>
                  <ChevronDown size={18} className={`text-gray-500 transition-transform duration-300 ${showCompanyList ? 'rotate-180' : ''}`} />
                </button>

                {showCompanyList && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ zIndex: 9999, maxHeight: '200px', overflowY: 'auto' }}
                  >
                    {companies.length > 0 ? (
                      companies.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCompany(c);
                            setShowCompanyList(false);
                          }}
                          className={`w-full px-5 py-3.5 text-left text-sm font-bold transition-colors hover:bg-white/5 flex items-center justify-between border-b border-white/5 last:border-0 ${selectedCompany?.id === c.id ? 'bg-white/10 text-[var(--enba-orange)]' : 'text-gray-400'}`}
                        >
                          <div className="flex items-center gap-2">
                            {c.name}
                            {c.status === 'demo' && (
                              <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Demo</span>
                            )}
                          </div>
                          {selectedCompany?.id === c.id && <Check size={14} />}
                        </button>
                      ))
                    ) : (
                      <div className="px-5 py-4 text-xs text-gray-500 italic text-center">
                        Kayıtlı şirket bulunamadı.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                E-posta
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@enba.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[var(--enba-orange)] transition-colors"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Şifre
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-gray-600 outline-none focus:border-[var(--enba-orange)] transition-colors"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-[var(--enba-orange)] text-white rounded-2xl py-3.5 font-black text-[11px] uppercase tracking-[2px] hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : mode === 'login' ? <LogIn size={14} /> : <UserPlus size={14} />
              }
              {loading ? 'Lütfen bekleyin...' : btnLabels[mode]}
            </button>
          </form>

          {/* Alt linkler */}
          <div className="mt-6 flex flex-col items-center gap-2.5 text-[11px]" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {mode === 'login' && (
              <>
                <button onClick={() => { setMode('register'); setError(''); setInfo(''); }} className="text-gray-500 hover:text-gray-300 transition-colors">
                  Hesabınız yok mu? <span className="text-[var(--enba-orange)] font-semibold">Kayıt olun</span>
                </button>
                <button onClick={() => { setMode('forgot'); setError(''); setInfo(''); }} className="text-gray-600 hover:text-gray-400 transition-colors">
                  Şifremi unuttum
                </button>
              </>
            )}
            {mode !== 'login' && (
              <button onClick={() => { setMode('login'); setError(''); setInfo(''); }} className="text-gray-500 hover:text-gray-300 transition-colors">
                ← Giriş ekranına dön
              </button>
            )}
          </div>

          {/* Demo Girişi - Hızlı Erişim */}
          {mode === 'login' && (
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-3">Sunum & Deneme</p>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="group w-full bg-white/5 border border-white/10 hover:border-indigo-500/50 rounded-2xl py-3 px-4 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <Zap size={16} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-gray-300">Demo Hesabı ile Dene</div>
                    <div className="text-[9px] text-gray-500 uppercase tracking-tighter">Tek tıkla hızlı giriş</div>
                  </div>
                </div>
                <ChevronDown size={14} className="text-gray-600 -rotate-90" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
