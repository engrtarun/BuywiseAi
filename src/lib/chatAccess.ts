import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

const DAILY_TOKEN_LIMIT = 20_000;
const TOKENS_PER_MESSAGE = 1_000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getISTDateString(date: Date | string | number): string {
  const d =
    typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const istTime = new Date(d.getTime() + IST_OFFSET_MS);
  return istTime.toISOString().slice(0, 10);
}

function currentISTDate(): string {
  return getISTDateString(new Date());
}

/**
 * Result returned from enforceChatAccess.
 *
 * - `response` — set when the request must be rejected; return this early from the route.
 * - `isGuest`  — true for unauthenticated/guest visitors who are still allowed.
 */
export interface ChatAccessResult {
  response: NextResponse | null;
  isGuest: boolean;
}

/**
 * enforceChatAccess — gate-keeper called at the top of POST /api/chat.
 *
 * 1. Reads the Supabase session from the incoming request cookies.
 * 2. Guests (unauthenticated): allowed through; isGuest = true.
 *    The client enforces a separate 5-message guest cap.
 * 3. Authenticated users: checks daily token usage.
 *    Returns 429 if the next message would exceed the 20 000-token daily limit.
 *
 * Fails open on unexpected errors so a DB hiccup never hard-blocks users.
 */
export async function enforceChatAccess(
  req: NextRequest
): Promise<ChatAccessResult> {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase env vars are missing (e.g. local dev without .env), let through.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "[enforceChatAccess] Supabase env vars missing — skipping access check."
    );
    return { response: null, isGuest: true };
  }

  // Build a lightweight Supabase client from the request cookies.
  // We use createServerClient here because API routes cannot use next/headers
  // cookies() — that is only available in Server Components / Server Actions.
  let userId: string | null = null;

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          // No-op: cookie mutations in API routes are handled by middleware.
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    userId = user?.id ?? null;
  } catch (err) {
    console.error(
      "[enforceChatAccess] Failed to read Supabase session — allowing through:",
      err
    );
    return { response: null, isGuest: true };
  }

  // ── Guest path ────────────────────────────────────────────────────────────
  if (!userId) {
    return { response: null, isGuest: true };
  }

  // ── Authenticated path: token-limit check ─────────────────────────────────
  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    });

    const todayIST = currentISTDate();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("tokens_used, last_reset_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      // Cannot read profile → fail open rather than blocking the user.
      console.error(
        "[enforceChatAccess] Profile fetch failed — allowing through:",
        error.message
      );
      return { response: null, isGuest: false };
    }

    let tokensUsed = profile?.tokens_used ?? 0;
    const lastResetAt = profile?.last_reset_at;

    // Reset counter if it's a new calendar day (IST).
    if (lastResetAt && getISTDateString(lastResetAt) !== todayIST) {
      tokensUsed = 0;
    }

    if (tokensUsed + TOKENS_PER_MESSAGE > DAILY_TOKEN_LIMIT) {
      return {
        response: NextResponse.json(
          {
            error: "Daily token limit reached",
            message:
              "You have reached your daily usage limit. It resets at 12:00 AM IST.",
            tokensUsed,
            tokenLimit: DAILY_TOKEN_LIMIT,
          },
          { status: 429 }
        ),
        isGuest: false,
      };
    }
  } catch (err) {
    console.error(
      "[enforceChatAccess] Unexpected error during token check — allowing through:",
      err
    );
    return { response: null, isGuest: false };
  }

  return { response: null, isGuest: false };
}
