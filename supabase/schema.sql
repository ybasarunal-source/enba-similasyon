-- Detaylı ve Hızlı İş Planlarını saklayan tablo
CREATE TABLE IF NOT EXISTS public.business_plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text DEFAULT 'Adsız Plan',
    year integer DEFAULT date_part('year', CURRENT_DATE),
    plan_type text DEFAULT 'fast', -- 'fast' veya 'detailed'
    status text DEFAULT 'pending', -- 'pending' veya 'active'
    data jsonb DEFAULT '{}'::jsonb, -- Planın tüm detaylarını (aylar, maliyetler vb.) burada saklıyoruz
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    shared_with uuid[] DEFAULT ARRAY[]::uuid[] -- Gelecekte paylaşım özelliği için
);

-- RLS (Row Level Security) Politikaları
ALTER TABLE public.business_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes kendi planını görebilir" ON public.business_plans
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = ANY(shared_with));

CREATE POLICY "Herkes kendi planını ekleyebilir" ON public.business_plans
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Herkes kendi planını güncelleyebilir" ON public.business_plans
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Herkes kendi planını silebilir" ON public.business_plans
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
