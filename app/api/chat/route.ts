
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getFallbackChatResponse } from "@/lib/fallbackResponses";

// IMPORTANT: Set up your Gemini API key as an environment variable
// Create a .env.local file in the project root and add the following line:
// GEMINI_API_KEY=your_gemini_api_key
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

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

    return NextResponse.json({ text });
  } catch (error: unknown) {
    logGeminiFailure(error);

    return NextResponse.json({
      text: getFallbackChatResponse(userMessage),
      fallback: true,
    });
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
