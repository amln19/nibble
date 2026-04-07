-- Add visibility support to creations posts and tighten read policy for private posts.

alter table public.creations
  add column if not exists is_public boolean not null default true;

create index if not exists creations_is_public_created_at_idx
  on public.creations (is_public, created_at desc);

-- Replace overly broad read policies so private posts stay private.
drop policy if exists creations_select_public on public.creations;
drop policy if exists creations_select on public.creations;

create policy creations_select_visible
  on public.creations
  for select
  using (is_public = true or auth.uid() = user_id);
