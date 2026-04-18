-- Kullanıcı Profilleri ve Yetki Yönetimi Tablosu
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text,
    full_name text,
    avatar_url text,
    role text DEFAULT 'user', -- 'admin' veya 'user'
    permissions jsonb DEFAULT '{"dashboard": true}'::jsonb, -- Varsayılan olarak sadece Ana Sayfa açık
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS (Row Level Security) - Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes kendi profilini görebilir" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Adminler tüm profilleri görebilir" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Adminler profilleri güncelleyebilir" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Yeni kullanıcı kaydı olduğunda otomatik profil oluşturan fonksiyon
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, permissions)
    VALUES (
        new.id, 
        new.email, 
        split_part(new.email, '@', 1), 
        'user', 
        '{"dashboard": true}'::jsonb
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auth.users tablosuna kayıt geldiğinde çalışır
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Detaylı ve Hızlı İş Planlarını saklayan tablo
CREATE TABLE IF NOT EXISTS public.business_plans (
...
);

-- RLS (Row Level Security) Politikaları - Business Plans
-- Adminlerin tüm planları görebilmesi için SELECT politikası güncellendi
CREATE POLICY "Adminler tüm planları görebilir" ON public.business_plans
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
...
