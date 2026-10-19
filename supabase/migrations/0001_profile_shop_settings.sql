-- Appointment Buddy: profiles, services, assignees.
-- Run this in the Supabase SQL editor (or via the Supabase CLI).

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, holds shop-level settings.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  shop_name text not null default '',
  owner_name text not null default '',
  contact_info text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- services: services offered by the shop.
-- gender_specific = true means male_* / female_* columns carry the pricing.
-- ---------------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  duration_minutes integer not null default 30,
  cost numeric(10, 2) not null default 0,
  gender_specific boolean not null default false,
  male_duration_minutes integer,
  male_cost numeric(10, 2),
  female_duration_minutes integer,
  female_cost numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_shop_id_idx on public.services (shop_id);

-- ---------------------------------------------------------------------------
-- assignees: barbers / staff members of the shop.
-- ---------------------------------------------------------------------------
create table if not exists public.assignees (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  available_today boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assignees_shop_id_idx on public.assignees (shop_id);

-- ---------------------------------------------------------------------------
-- updated_at auto-refresh.
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists services_touch_updated_at on public.services;
create trigger services_touch_updated_at
  before update on public.services
  for each row execute function public.touch_updated_at();

drop trigger if exists assignees_touch_updated_at on public.assignees;
create trigger assignees_touch_updated_at
  before update on public.assignees
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row on signup, seeding shop fields from user metadata
-- (the signup Server Action already stores shop_name / owner_name /
-- contact_info in raw_user_meta_data).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, shop_name, owner_name, contact_info)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'shop_name', ''),
    coalesce(new.raw_user_meta_data ->> 'owner_name', ''),
    coalesce(new.raw_user_meta_data ->> 'contact_info', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security: owners can only touch their own shop's rows.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.assignees enable row level security;

drop policy if exists "Owners manage own profile" on public.profiles;
create policy "Owners manage own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Owners manage own services" on public.services;
create policy "Owners manage own services"
  on public.services for all
  using (auth.uid() = shop_id)
  with check (auth.uid() = shop_id);

drop policy if exists "Owners manage own assignees" on public.assignees;
create policy "Owners manage own assignees"
  on public.assignees for all
  using (auth.uid() = shop_id)
  with check (auth.uid() = shop_id);
