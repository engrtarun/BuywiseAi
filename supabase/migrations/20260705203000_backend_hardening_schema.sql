-- Create orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product jsonb not null,
  payment_method text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS for orders
alter table public.orders enable row level security;

-- RLS Policies for orders
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own orders"
  on public.orders for update
  using (auth.uid() = user_id);

create policy "Users can delete their own orders"
  on public.orders for delete
  using (auth.uid() = user_id);

-- Index for orders
create index if not exists orders_user_id_idx on public.orders (user_id);


-- Create user_saved_products table
create table if not exists public.user_saved_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  price numeric not null,
  image_url text not null,
  is_cart boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_saved_products_user_id_product_id_key unique (user_id, product_id)
);

-- Enable RLS for user_saved_products
alter table public.user_saved_products enable row level security;

-- RLS Policies for user_saved_products
create policy "Users can view their own user_saved_products"
  on public.user_saved_products for select
  using (auth.uid() = user_id);

create policy "Users can insert their own user_saved_products"
  on public.user_saved_products for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own user_saved_products"
  on public.user_saved_products for update
  using (auth.uid() = user_id);

create policy "Users can delete their own user_saved_products"
  on public.user_saved_products for delete
  using (auth.uid() = user_id);

-- Index for user_saved_products
create index if not exists user_saved_products_user_id_idx on public.user_saved_products (user_id);


-- Create daily_message_limits table
create table if not exists public.daily_message_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  message_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_message_limits_user_id_usage_date_key unique (user_id, usage_date)
);

-- Enable RLS for daily_message_limits
alter table public.daily_message_limits enable row level security;

-- RLS Policies for daily_message_limits
create policy "Users can view their own daily_message_limits"
  on public.daily_message_limits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own daily_message_limits"
  on public.daily_message_limits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own daily_message_limits"
  on public.daily_message_limits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own daily_message_limits"
  on public.daily_message_limits for delete
  using (auth.uid() = user_id);

-- Index for daily_message_limits
create index if not exists daily_message_limits_user_id_idx on public.daily_message_limits (user_id);


-- Create chat_sessions table
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  requirements jsonb not null default '{}'::jsonb,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS for chat_sessions
alter table public.chat_sessions enable row level security;

-- RLS Policies for chat_sessions
create policy "Users can view their own chat_sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chat_sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own chat_sessions"
  on public.chat_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own chat_sessions"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

-- Index for chat_sessions
create index if not exists chat_sessions_user_id_idx on public.chat_sessions (user_id);


-- Create chat_messages table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  sender text not null check (sender in ('user', 'ai')),
  message text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS for chat_messages
alter table public.chat_messages enable row level security;

-- RLS Policies for chat_messages (enforced transitively via parent chat_sessions table)
create policy "Users can view their own chat messages"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and chat_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert their own chat messages"
  on public.chat_messages for insert
  with check (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and chat_sessions.user_id = auth.uid()
    )
  );

create policy "Users can update their own chat messages"
  on public.chat_messages for update
  using (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and chat_sessions.user_id = auth.uid()
    )
  );

create policy "Users can delete their own chat messages"
  on public.chat_messages for delete
  using (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and chat_sessions.user_id = auth.uid()
    )
  );

-- Index for chat_messages
create index if not exists chat_messages_session_id_idx on public.chat_messages (session_id);
