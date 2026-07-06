alter table public.chat_sessions
  add column if not exists pinned boolean not null default false;

-- Policy already allows updates on chat_sessions by authenticated owner,
-- so pinned can be updated using existing row-level security rules.
