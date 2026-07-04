import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

function createFallbackClient() {
  const emptyQuery = {
    select: () => emptyQuery,
    eq: () => emptyQuery,
    order: () => emptyQuery,
    limit: () => emptyQuery,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null }),
    insert: () => emptyQuery,
    update: () => emptyQuery,
    delete: () => emptyQuery,
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signUp: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      signInWithOAuth: async () => ({ data: null, error: null }),
      verifyOtp: async () => ({ data: { user: null, session: null }, error: null }),
      resend: async () => ({ data: null, error: null }),
      exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
    },
    from: () => emptyQuery,
  };
}

export function createClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return createFallbackClient() as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
