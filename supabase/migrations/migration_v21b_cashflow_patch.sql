-- cashflow_parameters id + primary key ekle
ALTER TABLE public.cashflow_parameters
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

-- Mevcut satırlar id almadıysa doldur
UPDATE public.cashflow_parameters SET id = gen_random_uuid() WHERE id IS NULL;

-- Primary key yap
ALTER TABLE public.cashflow_parameters ADD PRIMARY KEY (id);

-- Doğrulama
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cashflow_parameters'
ORDER BY ordinal_position;
