function LoginPage({ onLogin }) {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [beniHatirla, setBeniHatirla] = React.useState(true);
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const [isRegister, setIsRegister] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!window.supabaseClient) {
                throw new Error("Supabase bağlantısı eksik!");
            }

            // Using email instead of username for Supabase Auth
            const email = username.includes('@') ? username : `${username}@enbacompany.com`;

            if (isRegister) {
                // Kayıt Ol
                const { data, error: signUpError } = await window.supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: username,
                            role: 'operator'
                        }
                    }
                });
                
                if (signUpError) throw signUpError;
                
                // Başarılı ise login'e geç ya da direkt gir
                alert("Kayıt başarılı! Lütfen giriş yapın.");
                setIsRegister(false);
                setLoading(false);
                
            } else {
                // Giriş Yap
                const { data, error: signInError } = await window.supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (signInError) throw signInError;
                
                // MOCK_USERS uyumluluğu için
                const mappedUser = {
                    id: data.user.id,
                    username: username,
                    name: data.user.user_metadata?.full_name || username,
                    role: 'admin', // Şimdilik herkes admin, role tablosundan alacağız normalde
                    avatar: null
                };
                
                onLogin(mappedUser, beniHatirla);
            }
        } catch (err) {
            console.error("Auth hatası:", err);
            setError(err.message || window.t('auth.error_invalid'));
            setLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-card">
                <div className="login-logo">
                    <span className="enba">enba</span>
                    <span className="recycling">recycling</span>
                </div>

                <div className="login-welcome">
                    <h1>{window.t('auth.welcome')}</h1>
                    <p>{window.t('auth.welcome_desc')}</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-input-group">
                        <label className="auth-label">{window.t('auth.user_label')}</label>
                        <input 
                            type="text" 
                            className="auth-input" 
                            placeholder={window.t('auth.user_placeholder')}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="auth-input-group">
                        <label className="auth-label">{window.t('auth.pass_label')}</label>
                        <input 
                            type="password" 
                            className="auth-input" 
                            placeholder={window.t('auth.pass_placeholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-footer">
                        <label className="remember-me">
                            <input 
                                type="checkbox" 
                                checked={beniHatirla}
                                onChange={(e) => setBeniHatirla(e.target.checked)}
                            />
                            {window.t('auth.remember')}
                        </label>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading 
                            ? (isRegister ? "Kayıt Olunuyor..." : window.t('auth.logging_in')) 
                            : (isRegister ? "Kayıt Ol" : window.t('auth.login_btn'))}
                    </button>
                    
                    <div style={{marginTop: '15px', textAlign: 'center'}}>
                        <button type="button" onClick={() => setIsRegister(!isRegister)} 
                            style={{background: 'none', border: 'none', color: '#FFB380', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px'}}>
                            {isRegister ? "Zaten hesabınız var mı? Giriş yapın" : "Hesabınız yok mu? Kayıt Olun"}
                        </button>
                    </div>
                    
                    <div style={{marginTop: '20px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.3)'}}>
                        Tesis Yönetim & Planlama Platformu v2.1 (Cloud)
                    </div>
                </form>
            </div>
            
            {/* Background design elements */}
            <div style={{
                position: 'absolute',
                bottom: '10%',
                left: '5%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(227,82,5,0.08) 0%, transparent 70%)',
                filter: 'blur(40px)',
                zIndex: 1
            }} />
        </div>
    );
}

window.LoginPage = LoginPage;

