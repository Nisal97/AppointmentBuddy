-- Appointment customer gender + stored gender-aware price.
-- Run this in the Supabase SQL editor (or via the Supabase CLI).

alter table public.appointments
  add column if not exists gender text not null default 'male',
  add column if not exists total_cost numeric(10, 2) not null default 0;

alter table public.appointments drop constraint if exists appointments_gender_check;
alter table public.appointments
  add constraint appointments_gender_check check (gender in ('male', 'female'));