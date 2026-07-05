alter table public.chat_sessions
  add column if not exists requirements jsonb not null default '{}'::jsonb;
