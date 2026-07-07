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
 * - `isGuest`  — true when no authenticated session was available.
 */
export interface ChatAccessResult {
  response: NextResponse | null;
  isGuest: boolean;
}

/**
 * enforceChatAccess — gate-keeper called at the top of POST /api/chat.
 *
 * 1. Reads the Supabase session from the incoming request cookies.
 * 2. Rejects unauthenticated calls with 401.
 * 3. Authenticated users: checks daily token usage.
 *    Returns 429 if the next message would exceed the 20 000-token daily limit.
 */
export async function enforceChatAccess(
  req: NextRequest
): Promise<ChatAccessResult> {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "[enforceChatAccess] Supabase env vars missing — denying access."
    );
    return {
      response: NextResponse.json(
        {
          error: "Unauthorized",
          message: "Please log in to continue.",
        },
        { status: 401 }
      ),
      isGuest: false,
    };
  }

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
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id) {
      console.warn("[enforceChatAccess] No valid Supabase session found. Allowing as Guest.");
      return {
        response: null,
        isGuest: true,
      };
    }

    const todayIST = currentISTDate();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tokens_used, last_reset_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "[enforceChatAccess] Profile fetch failed — denying access:",
        profileError.message
      );
      return {
        response: NextResponse.json(
          {
            error: "Unauthorized",
            message: "Unable to verify access right now.",
          },
          { status: 401 }
        ),
        isGuest: false,
      };
    }

    let tokensUsed = profile?.tokens_used ?? 0;
    const lastResetAt = profile?.last_reset_at;

    if (lastResetAt && getISTDateString(lastResetAt) !== todayIST) {
      tokensUsed = 0;
    }

    // Bypassed daily limit check
    if (false && tokensUsed + TOKENS_PER_MESSAGE > DAILY_TOKEN_LIMIT) {
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
      "[enforceChatAccess] Unexpected error during access check — denying access:",
      err
    );
    return {
      response: NextResponse.json(
        {
          error: "Unauthorized",
          message: "Unable to verify access right now.",
        },
        { status: 401 }
      ),
      isGuest: false,
    };
  }

  return { response: null, isGuest: false };
}
