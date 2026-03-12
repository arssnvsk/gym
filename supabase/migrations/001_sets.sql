-- Run this in Supabase SQL Editor

create table if not exists public.sets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  exercise_id text not null,
  reps        integer not null check (reps > 0),
  weight      numeric(6, 2) not null check (weight >= 0),
  created_at  timestamptz not null default now()
);

-- Index for fast per-user queries
create index if not exists sets_user_id_idx on public.sets(user_id);
create index if not exists sets_exercise_id_idx on public.sets(user_id, exercise_id, created_at);

-- Row Level Security
alter table public.sets enable row level security;

create policy "Users can view their own sets"
  on public.sets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sets"
  on public.sets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sets"
  on public.sets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own sets"
  on public.sets for delete
  using (auth.uid() = user_id);
