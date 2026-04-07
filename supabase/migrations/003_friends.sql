-- Friends system migration
-- Adds profiles, friend_requests, friendships, and RLS policies.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, username)
select id, split_part(email, '@', 1)
from auth.users
on conflict (id) do nothing;

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique (from_user, to_user)
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_a, user_b)
);

alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_insert on public.profiles;
create policy profiles_select on public.profiles
  for select using (true);
create policy profiles_update on public.profiles
  for update using (auth.uid() = id);
create policy profiles_insert on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists fr_select on public.friend_requests;
drop policy if exists fr_insert on public.friend_requests;
drop policy if exists fr_update on public.friend_requests;
drop policy if exists fr_delete on public.friend_requests;
create policy fr_select on public.friend_requests
  for select using (auth.uid() = from_user or auth.uid() = to_user);
create policy fr_insert on public.friend_requests
  for insert with check (auth.uid() = from_user);
create policy fr_update on public.friend_requests
  for update using (auth.uid() = to_user);
create policy fr_delete on public.friend_requests
  for delete using (auth.uid() = from_user or auth.uid() = to_user);

drop policy if exists fs_select on public.friendships;
drop policy if exists fs_insert on public.friendships;
drop policy if exists fs_delete on public.friendships;
create policy fs_select on public.friendships
  for select using (auth.uid() = user_a or auth.uid() = user_b);
create policy fs_insert on public.friendships
  for insert with check (auth.uid() = user_a or auth.uid() = user_b);
create policy fs_delete on public.friendships
  for delete using (auth.uid() = user_a or auth.uid() = user_b);
