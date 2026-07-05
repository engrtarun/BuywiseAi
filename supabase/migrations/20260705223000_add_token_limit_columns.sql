-- Add tokens_used and last_reset_at columns to the profiles table
alter table public.profiles 
  add column if not exists tokens_used integer not null default 0,
  add column if not exists last_reset_at timestamptz;
