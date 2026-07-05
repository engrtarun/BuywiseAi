-- Add theme_preference and mode_preference columns to the profiles table
alter table public.profiles 
  add column if not exists theme_preference text,
  add column if not exists mode_preference text check (mode_preference in ('light', 'dark'));
