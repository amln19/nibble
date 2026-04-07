-- Persist optional source recipe linkage for community creations.

alter table public.creations
  add column if not exists recipe_id text;

alter table public.creations
  add column if not exists recipe_title text;

create index if not exists creations_recipe_id_idx
  on public.creations (recipe_id);
