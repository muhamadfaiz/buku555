-- ============================================================
-- Buku 555 — Database Initialisation
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. profiles (auto-created on signup via trigger)
create table if not exists profiles (
  id         uuid references auth.users on delete cascade primary key,
  email      text,
  created_at timestamptz default now()
);

-- 2. expenses
create table if not exists expenses (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  amount      numeric(10,2) not null check (amount > 0),
  description text,
  category    text check (category in ('Makan','Transport','Hutang','Lain-lain')),
  date        date not null default current_date,
  created_at  timestamptz default now()
);

-- 3. Row-Level Security
alter table profiles enable row level security;
alter table expenses  enable row level security;

-- profiles: users can see + edit only their own row
create policy "profiles_own" on profiles
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- expenses: full CRUD on own rows only
create policy "expenses_own" on expenses
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
