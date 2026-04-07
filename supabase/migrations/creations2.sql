-- ══════════════════════════════════════════════════════════
--  003_creations_social.sql
--  Tables for post likes and comments on creations
-- ══════════════════════════════════════════════════════════

-- ── creations (base table, if not already created) ────────────────────────────
create table if not exists public.creations (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  title        text        not null check (char_length(title) between 1 and 120),
  details      text        check (char_length(details) <= 2000),
  image_url    text        not null,
  author_label text,
  recipe_id    text,
  recipe_title text,
  created_at   timestamptz not null default now()
);

alter table public.creations
  add column if not exists is_public boolean not null default true;
alter table public.creations
  add column if not exists recipe_id text;
alter table public.creations
  add column if not exists recipe_title text;

alter table public.creations enable row level security;

create policy "creations_select" on public.creations
  for select using (is_public = true or auth.uid() = user_id);
create policy "creations_insert" on public.creations
  for insert with check (auth.uid() = user_id);
create policy "creations_delete" on public.creations
  for delete using (auth.uid() = user_id);

create index if not exists creations_user_id_idx    on public.creations(user_id);
create index if not exists creations_created_at_idx on public.creations(created_at desc);


-- ── creation_likes ────────────────────────────────────────────────────────────
create table if not exists public.creation_likes (
  id          uuid        primary key default gen_random_uuid(),
  creation_id uuid        not null references public.creations(id) on delete cascade,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (creation_id, user_id)          -- one like per user per post
);

alter table public.creation_likes enable row level security;

drop policy if exists "likes_select" on public.creation_likes;
create policy "likes_select" on public.creation_likes
  for select using (
    exists (
      select 1
      from public.creations c
      where c.id = creation_id
        and (c.is_public = true or c.user_id = auth.uid())
    )
  );
create policy "likes_insert" on public.creation_likes
  for insert with check (auth.uid() = user_id);
create policy "likes_delete" on public.creation_likes
  for delete using (auth.uid() = user_id);

create index if not exists creation_likes_creation_id_idx on public.creation_likes(creation_id);
create index if not exists creation_likes_user_id_idx     on public.creation_likes(user_id);


-- ── creation_comments ─────────────────────────────────────────────────────────
create table if not exists public.creation_comments (
  id           uuid        primary key default gen_random_uuid(),
  creation_id  uuid        not null references public.creations(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  author_label text,
  comment_text text        not null check (char_length(comment_text) between 1 and 500),
  created_at   timestamptz not null default now()
);

alter table public.creation_comments enable row level security;

drop policy if exists "comments_select" on public.creation_comments;
create policy "comments_select" on public.creation_comments
  for select using (
    exists (
      select 1
      from public.creations c
      where c.id = creation_id
        and (c.is_public = true or c.user_id = auth.uid())
    )
  );
create policy "comments_insert" on public.creation_comments
  for insert with check (auth.uid() = user_id);
create policy "comments_delete" on public.creation_comments
  for delete using (auth.uid() = user_id);

create index if not exists creation_comments_creation_id_idx on public.creation_comments(creation_id);
create index if not exists creation_comments_user_id_idx     on public.creation_comments(user_id);


-- ── Storage bucket policy (run in Supabase dashboard > Storage) ───────────────
-- If the bucket "creation-photos" doesn't exist yet, create it as PUBLIC.
-- Then add these policies via Dashboard > Storage > creation-photos > Policies:
--
--   SELECT (public read):   true
--   INSERT (authenticated): auth.uid()::text = (storage.foldername(name))[1]
--   DELETE (own files):     auth.uid()::text = (storage.foldername(name))[1]