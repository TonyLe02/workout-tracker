create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text,
  avatar_url text,
  daily_goal_reps integer not null default 400,
  daily_goal_active_kcal integer not null default 300,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workouts (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  reps integer not null default 0,
  active_kcal integer not null default 0,
  total_kcal integer not null default 0,
  exercise_type text,
  timestamp bigint not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists workouts_user_id_idx on public.workouts (user_id);
create index if not exists workouts_user_id_timestamp_idx on public.workouts (user_id, timestamp);

alter table public.profiles enable row level security;
alter table public.workouts enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = user_id);

drop policy if exists "Users can read their own workouts" on public.workouts;
create policy "Users can read their own workouts"
on public.workouts
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own workouts" on public.workouts;
create policy "Users can insert their own workouts"
on public.workouts
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own workouts" on public.workouts;
create policy "Users can update their own workouts"
on public.workouts
for update
using (auth.uid() = user_id);
