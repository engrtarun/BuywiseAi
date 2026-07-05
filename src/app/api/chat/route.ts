
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getFallbackChatResponse } from "@/lib/fallbackResponses";
import { checkAndIncrementMessageLimit } from "@/app/actions/chat";
import { createClient } from "@/lib/supabase/server";

// IMPORTANT: Set up your Gemini API key as an environment variable
// Create a .env.local file in the project root and add the following line:
// GEMINI_API_KEY=your_gemini_api_key
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const GUEST_MODE_KEY = "buywise_guest_mode";
const GUEST_COUNT_KEY = "buywise_guest_message_count";
const FREE_MESSAGE_LIMIT = 3;
const guestRequestCounts = new Map<string, number>();

/**
 * API route handler for processing chat messages.
 *
 * It receives the chat history and the user's message, then uses the
 * Google Generative AI SDK to get a response from the Gemini model.
 *
 * Gemini free tier allows only 20 requests/day for gemini-2.5-flash. For production/higher usage, 
 * upgrade to a paid plan or implement request queuing/caching to reduce API calls. 
 * See: https://ai.google.dev/gemini-api/docs/rate-limits
 *
 * @param {NextRequest} req The incoming Next.js API request object.
 * @returns {Promise<NextResponse>} A Next.js API response object with the
 *   AI's text response.
 */
export async function POST(req: NextRequest) {
  let userMessage = "";
  let guestCount: number | undefined;

  try {
    // GEMINI_API_KEY is now guaranteed by env.ts validation at startup.
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request: JSON body is malformed or empty." },
        { status: 400 }
      );
    }

    // Validate message field
    if (!isChatRequestBody(body) || !body.message.trim()) {
      return NextResponse.json(
        { error: "Invalid request: 'message' field is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    // Validate history if provided
    if (body.history !== undefined && !Array.isArray(body.history)) {
      return NextResponse.json(
        { error: "Invalid request: 'history' must be an array if provided." },
        { status: 400 }
      );
    }

    const { history = [], message } = body;
    userMessage = message;

    const access = await enforceChatAccess(req);
    if (access.response) {
      return access.response;
    }
    guestCount = access.guestCount;

    // Map frontend conversation history ({ role: "assistant"|"user", content })
    // to the structure expected by the Gemini SDK ({ role: "model"|"user", parts: [{ text }] })
    const formattedHistory = history.map((msg) => {
      const role = msg.role === "assistant" ? "model" : "user";
      return {
        role,
        parts: [{ text: msg.content || "" }]
      };
    });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    const successResponse = NextResponse.json({ text });
    applyGuestCountCookie(successResponse, guestCount);
    return successResponse;
  } catch (error: unknown) {
    logGeminiFailure(error);

    const fallbackResponse = NextResponse.json({
      text: getFallbackChatResponse(userMessage),
      fallback: true,
    });
    applyGuestCountCookie(fallbackResponse, guestCount);
    return fallbackResponse;
  }
}

interface ChatHistoryMessage {
  role?: string;
  content?: string;
}

interface ChatRequestBody {
  message: string;
  history?: ChatHistoryMessage[];
}

function isChatRequestBody(body: unknown): body is ChatRequestBody {
  if (!body || typeof body !== "object") {
    return false;
  }

  return "message" in body && typeof body.message === "string";
}

async function enforceChatAccess(req: NextRequest): Promise<{
  response?: NextResponse;
  guestCount?: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    const limit = await checkAndIncrementMessageLimit();

    if (!limit.allowed) {
      return {
        response: NextResponse.json(
          { error: limit.message },
          { status: 429 }
        ),
      };
    }

    return {};
  }

  if (req.cookies.get(GUEST_MODE_KEY)?.value !== "true") {
    return {
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const guestLimit = checkAndIncrementGuestLimit(req);
  if (!guestLimit.allowed) {
    const response = NextResponse.json(
      { error: "You've reached your free guest message limit. Please log in to continue." },
      { status: 429 }
    );
    applyGuestCountCookie(response, guestLimit.count);
    return { response };
  }

  return { guestCount: guestLimit.count };
}

function checkAndIncrementGuestLimit(req: NextRequest): {
  allowed: boolean;
  count: number;
} {
  const key = getGuestRequestKey(req);
  const cookieCount = readGuestCookieCount(req);
  const memoryCount = guestRequestCounts.get(key) ?? 0;
  const currentCount = Math.max(cookieCount, memoryCount);

  if (currentCount >= FREE_MESSAGE_LIMIT) {
    return { allowed: false, count: currentCount };
  }

  const nextCount = currentCount + 1;
  guestRequestCounts.set(key, nextCount);

  return { allowed: true, count: nextCount };
}

function getGuestRequestKey(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();

  // TODO(backend-hardening): replace this per-process guest limiter with a shared
  // store so counts survive server restarts and scale across multiple instances.
  return forwardedFor || realIp || "unknown";
}

function readGuestCookieCount(req: NextRequest): number {
  const raw = req.cookies.get(GUEST_COUNT_KEY)?.value;
  if (!raw) {
    return 0;
  }

  const count = parseInt(raw, 10);
  return Number.isNaN(count) ? 0 : count;
}

function applyGuestCountCookie(response: NextResponse, guestCount?: number) {
  if (guestCount === undefined) {
    return;
  }

  response.cookies.set(GUEST_COUNT_KEY, String(guestCount), {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
    httpOnly: true,
  });
}

function logGeminiFailure(error: unknown) {
  if (isRateLimitError(error)) {
    console.error("Gemini API rate limit hit. Serving fallback response.", error);
    return;
  }

  console.error("Gemini API failed. Serving fallback response.", error);
}

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { status?: unknown; message?: unknown };
  const message = typeof maybeError.message === "string" ? maybeError.message.toLowerCase() : "";

  return (
    maybeError.status === 429 ||
    message.includes("429") ||
    message.includes("too many requests") ||
    message.includes("quota exceeded") ||
    message.includes("rate limit")
  );
}
