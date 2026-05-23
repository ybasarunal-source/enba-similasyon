-- Enba Simülasyon Supabase Veritabanı Şeması

-- 1. YETKİLENDİRME (PROFILES)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  full_name text,
  role text default 'operator' check (role in ('admin', 'genel_mudur', 'finance', 'production', 'logistics', 'operator')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) ayarları
alter table public.profiles enable row level security;
create policy "Profilleri herkes görebilir" on public.profiles for select using (true);
create policy "Kullanıcı kendi profilini güncelleyebilir" on public.profiles for update using (auth.uid() = id);

-- 2. STOK KAYITLARI
create table if not exists public.stock_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  type text not null check (type in ('alis', 'satis')),
  material_type text not null, -- hammadde, mamul, cuval vs.
  amount numeric not null,
  unit_price numeric,
  total_price numeric,
  supplier_customer text,
  waybill_no text, -- İrsaliye No
  vehicle_plate text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date not null default current_date
);

alter table public.stock_records enable row level security;
-- Admin ve Genel Müdür hepsini görür, diğerleri izinlileri vb. 
-- Şimdilik tüm doğrulanmış kullanıcılar şirketin stoklarını görebilir:
create policy "Oturum açanlar stokları görebilir" on public.stock_records for select using (auth.role() = 'authenticated');
create policy "Oturum açanlar stok ekleyebilir" on public.stock_records for insert with check (auth.role() = 'authenticated');
create policy "Oturum açanlar stok güncelleyebilir" on public.stock_records for update using (auth.role() = 'authenticated');
create policy "Adminler stok silebilir" on public.stock_records for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 3. ÜRETİM GÜNLÜĞÜ (VARDIYALAR)
create table if not exists public.production_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  shift_date date not null,
  shift_no integer not null,
  start_time time,
  end_time time,
  input_kg numeric,
  output_kg numeric,
  electricity_start numeric,
  electricity_end numeric,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.production_logs enable row level security;
create policy "Oturum açanlar üretimleri görebilir" on public.production_logs for select using (auth.role() = 'authenticated');
create policy "Oturum açanlar üretim ekleyebilir" on public.production_logs for insert with check (auth.role() = 'authenticated');

-- 4. DETAYLI İŞ PLANLARI (JSON olarak tutulacak - esneklik için)
create table if not exists public.business_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  title text not null,
  year integer not null,
  status text default 'draft' check (status in ('draft', 'active', 'archived')),
  data jsonb not null, -- Tüm plan verisi (ayVerileri, musteriler vs) burada duracak
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.business_plans enable row level security;
create policy "Oturum açanlar planları görebilir" on public.business_plans for select using (auth.role() = 'authenticated');
create policy "Oturum açanlar plan ekleyebilir" on public.business_plans for insert with check (auth.role() = 'authenticated');
create policy "Oturum açanlar plan güncelleyebilir" on public.business_plans for update using (auth.role() = 'authenticated');

-- Yeni üye olduğunda otomatik Profile oluşturma Trigger'ı
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'operator');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
