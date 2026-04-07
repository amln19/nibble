-- User posts: photo + story. Run in Supabase SQL Editor after 001_saved_recipes.sql.

create table if not exists public.creations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  details text,
  image_url text not null,
  author_label text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists creations_created_at_idx on public.creations (created_at desc);

alter table public.creations enable row level security;

-- Public feed is readable by anyone; private posts are owner-only.
drop policy if exists creations_select_public on public.creations;
create policy "creations_select_public"
  on public.creations
  for select
  using (is_public = true or auth.uid() = user_id);

drop policy if exists creations_insert_own on public.creations;
create policy "creations_insert_own"
  on public.creations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists creations_delete_own on public.creations;
create policy "creations_delete_own"
  on public.creations
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Storage bucket for post images (public read)
insert into storage.buckets (id, name, public)
values ('creation-photos', 'creation-photos', true)
on conflict (id) do update set public = excluded.public;

-- Anyone can view images
drop policy if exists creation_photos_select_public on storage.objects;
create policy "creation_photos_select_public"
  on storage.objects
  for select
  using (bucket_id = 'creation-photos');

-- Upload only into folder named with your user id: {uuid}/filename
drop policy if exists creation_photos_insert_own on storage.objects;
create policy "creation_photos_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'creation-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists creation_photos_delete_own on storage.objects;
create policy "creation_photos_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'creation-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );
