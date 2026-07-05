create table if not exists public.quickbuy_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'You',
  avatar_label text not null default 'Y',        -- single/double letter shown in the avatar chip
  sizes text[] not null default '{}',
  preferred_categories text[] not null default '{}',
  max_budget integer,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enforce max 4 profiles per user at the DB level too (defense in depth; UI already enforces it).
create or replace function public.enforce_quickbuy_profile_limit()
returns trigger as $$
begin
  if (select count(*) from public.quickbuy_profiles where user_id = new.user_id) >= 4 then
    raise exception 'Profile limit reached (4/4)';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_quickbuy_profile_limit on public.quickbuy_profiles;
create trigger trg_quickbuy_profile_limit
  before insert on public.quickbuy_profiles
  for each row execute function public.enforce_quickbuy_profile_limit();

alter table public.quickbuy_profiles enable row level security;

create policy "Users can view their own quickbuy profiles"
  on public.quickbuy_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own quickbuy profiles"
  on public.quickbuy_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own quickbuy profiles"
  on public.quickbuy_profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete their own quickbuy profiles"
  on public.quickbuy_profiles for delete
  using (auth.uid() = user_id);
