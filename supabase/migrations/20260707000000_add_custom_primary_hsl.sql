-- Add custom_primary_hsl column to profiles table to store custom color wheel hex
alter table public.profiles 
  add column if not exists custom_primary_hsl text;
