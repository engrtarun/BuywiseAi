import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { checkAndIncrementMessageLimit } from "@/app/actions/chat";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEYS[0]);
const GUEST_MODE_KEY = "buywise_guest_mode";
const GUEST_COUNT_KEY = "buywise_guest_message_count";
const FREE_MESSAGE_LIMIT = 3;
const guestRequestCounts = new Map<string, number>();

export async function POST(req: NextRequest) {
  let guestCount: number | undefined;

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request: JSON body is malformed or empty." },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: 'items' array is required." },
        { status: 400 }
      );
    }

    const access = await enforceOutfitRatingAccess(req);
    if (access.response) {
      return access.response;
    }
    guestCount = access.guestCount;

    const itemsList = body.items.join(", ");
    
    const prompt = `Act as a savage fashion influencer and rate this outfit combination in 2 lines: [${itemsList}]. Output a numeric match score from 0-100 and your 2-line witty commentary.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object" as any, // SchemaType.OBJECT if we imported it, "object" string works in generative-ai
          properties: {
            score: { type: "integer" as any },
            commentary: { type: "string" as any },
          },
          required: ["score", "commentary"],
        },
      },
    });

    const responseText = result.response.text();
    
    // Parse the response with a fallback
    let score = 50;
    let commentary = "Not sure what to say about this fit.";
    try {
      const parsedData = JSON.parse(responseText.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim());
      if (typeof parsedData.score === "number") score = parsedData.score;
      if (typeof parsedData.commentary === "string") commentary = parsedData.commentary;
    } catch (e) {
      console.warn("Failed to parse outfit rating JSON", e);
    }

    const response = NextResponse.json({ score, commentary });
    applyGuestCountCookie(response, guestCount);
    return response;
    
  } catch (error: any) {
    if (isRateLimitError(error)) {
      console.error("Gemini API rate limit hit in outfit rating.");
      const fallbackResponse = NextResponse.json({
        score: 65,
        commentary: "Gemini is exhausted from too many requests. We'll safely assume this fit is mid. Try again later!"
      });
      applyGuestCountCookie(fallbackResponse, guestCount);
      return fallbackResponse;
    }

    console.error("Gemini API failed in outfit rating:", error);
    const fallbackResponse = NextResponse.json({
      score: 50,
      commentary: "Our fashion AI is currently offline. You do you!"
    });
    applyGuestCountCookie(fallbackResponse, guestCount);
    return fallbackResponse;
  }
}

async function enforceOutfitRatingAccess(req: NextRequest): Promise<{
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

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  
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
