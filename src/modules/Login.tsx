import React, { useState } from 'react';
import { supabase, companiesAPI, Company } from '../api/supabase';
import { LogIn, UserPlus, AlertCircle, Eye, EyeOff, Building2, Zap, ChevronDown } from 'lucide-react';

type Mode = 'login' | 'register' | 'forgot';

export const Login: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  React.useEffect(() => {
    companiesAPI.getAll().then(data => {
      const activeOnes = data.filter(c => c.status !== 'suspended');
      setCompanies(activeOnes);
      if (activeOnes.length > 0) setSelectedCompanyId(activeOnes[0].id);
    });
  }, []);

  const handleDemoLogin = () => {
    setEmail('demo@enba.com');
    setPassword('EnbaDemo2024!');
    const demoComp = companies.find(c => c.status === 'demo');
    if (demoComp) setSelectedCompanyId(demoComp.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo('Kayıt başarılı! E-postanızı doğrulayın, ardından giriş yapabilirsiniz.');
        setMode('login');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setInfo('Şifre sıfırlama bağlantısı e-postanıza gönderildi.');
        setMode('login');
      }
    } catch (err: any) {
      const msg = err?.message || 'Bir hata oluştu.';
      if (msg.includes('Invalid login credentials'))   setError('E-posta veya şifre hatalı.');
      else if (msg.includes('Email not confirmed'))    setError('E-postanızı doğrulamadan giriş yapamazsınız.');
      else if (msg.includes('User already registered')) setError('Bu e-posta zaten kayıtlı.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const titles = { login: 'Giriş Yap', register: 'Hesap Oluştur', forgot: 'Şifre Sıfırla' };
  const btnLabels = { login: 'Giriş Yap', register: 'Kayıt Ol', forgot: 'Sıfırlama Gönder' };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-5 text-center">
            <img src="/icons/logo.png" className="w-full h-full object-contain filter drop-shadow-2xl" alt="Enba Logo" />
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
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Bağlanılacak Şirket
              </label>
              <div className="relative">
                <select
                  value={selectedCompanyId}
                  onChange={e => setSelectedCompanyId(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white outline-none focus:border-[var(--enba-orange)] transition-colors cursor-pointer"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#1A1A1A] text-white">
                      {c.name} {c.status === 'demo' ? '(Demo)' : ''}
                    </option>
                  ))}
                </select>
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
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
                    <div className="text-[9px] text-gray-500 uppercase tracking-tighter">Şifresiz hızlı erişim</div>
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
