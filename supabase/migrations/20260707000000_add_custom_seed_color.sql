-- Add custom_seed_color column to the profiles table
alter table public.profiles
  add column if not exists custom_seed_color text;
