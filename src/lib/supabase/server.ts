import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

function createFallbackClient() {
  const emptyQuery = {
    select: () => emptyQuery,
    eq: () => emptyQuery,
    order: () => emptyQuery,
    limit: () => emptyQuery,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null }),
    insert: () => ({
      select: () => ({ single: async () => ({ data: null, error: null }) }),
      single: async () => ({ data: null, error: null }),
    }),
    update: () => ({
      eq: () => ({
        select: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      }),
    }),
    delete: () => ({ eq: async () => ({ data: null, error: null }) }),
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

export async function createClient() {
  const cookieStore = await cookies();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return createFallbackClient();
  }

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
