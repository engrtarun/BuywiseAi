alter table public.chat_sessions
  add column if not exists mode text not null default 'explore'
  check (mode in ('deep_research', 'explore'));
