-- Restrict likes/comments reads to creations that are visible to the current user.

alter table public.creation_likes enable row level security;
alter table public.creation_comments enable row level security;

drop policy if exists "likes_select" on public.creation_likes;
create policy "likes_select"
  on public.creation_likes
  for select
  using (
    exists (
      select 1
      from public.creations c
      where c.id = creation_id
        and (c.is_public = true or c.user_id = auth.uid())
    )
  );

drop policy if exists "comments_select" on public.creation_comments;
create policy "comments_select"
  on public.creation_comments
  for select
  using (
    exists (
      select 1
      from public.creations c
      where c.id = creation_id
        and (c.is_public = true or c.user_id = auth.uid())
    )
  );
