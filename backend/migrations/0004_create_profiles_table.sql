-- Migration: Create profiles table linked to Supabase Auth users
-- Creates `profiles` to store lightweight user info and role

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique not null,
  username text,
  email text,
  role text not null default 'user',
  created_at timestamp with time zone default now()
);

create index if not exists idx_profiles_auth_id on profiles(auth_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname='profiles_role_check') then
    alter table profiles add constraint profiles_role_check check (role in ('user','mechanic'));
  end if;
end$$;
