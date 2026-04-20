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

-- 1. Helper Function: SECURITY DEFINER ile yetki kontrolü (Recursion'ı önler)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
    is_admin_role boolean;
BEGIN
    SELECT (role = 'admin') INTO is_admin_role
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN COALESCE(is_admin_role, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Politikalar
CREATE POLICY "Herkes kendi profilini görebilir" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Admin çekirdek yetki kontrolü (is_admin fonksiyonu üzerinden)
CREATE POLICY "Adminler tum profilleri gorebilir" ON public.profiles
    FOR ALL TO authenticated
    USING (public.is_admin());

-- Yeni kullanıcı kaydı olduğunda otomatik profil oluşturan fonksiyon
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, permissions)
    VALUES (
        new.id, 
        new.email, 
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
        'user', 
        '{"dashboard": true}'::jsonb
    )
    ON CONFLICT (id) DO NOTHING;
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
    USING (public.is_admin());
...
