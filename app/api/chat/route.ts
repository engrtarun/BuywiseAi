
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// IMPORTANT: Set up your Gemini API key as an environment variable
// Create a .env.local file in the project root and add the following line:
// GEMINI_API_KEY=your_gemini_api_key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing API key: GEMINI_API_KEY is not set");
    }

    let body;
    try {
      body = await req.json();
    } catch (err: any) {
      return NextResponse.json(
        { error: "Invalid request: JSON body is malformed or empty." },
        { status: 400 }
      );
    }

    // Validate message field
    if (!body || typeof body.message !== "string" || !body.message.trim()) {
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

    // Map frontend conversation history ({ role: "assistant"|"user", content })
    // to the structure expected by the Gemini SDK ({ role: "model"|"user", parts: [{ text }] })
    const formattedHistory = history.map((msg: any) => {
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
  } catch (error: any) {
    let statusCode = 500;
    let errorMessage = error.message || "Internal Server Error";
    let retryDelay: number | undefined;

    // Check for rate-limit / quota exceeded errors
    if (
      error.status === 429 ||
      errorMessage.toLowerCase().includes("429") ||
      errorMessage.toLowerCase().includes("too many requests") ||
      errorMessage.toLowerCase().includes("quota exceeded")
    ) {
      statusCode = 429;
      errorMessage = "Rate limit exceeded";
      
      // Try to parse retryDelay from the error object or message string
      if (error.retryDelay) {
        retryDelay = parseInt(error.retryDelay, 10);
      } else {
        const match = error.message?.match(/(\d+)\s*s/);
        if (match) {
          retryDelay = parseInt(match[1], 10);
        }
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.error("API route error:", error);
    } else {
      if (statusCode === 429) {
        console.error("Gemini API rate limit hit:", statusCode);
      } else {
        console.error("API route error:", error.name, error.message);
      }
    }

    return NextResponse.json(
      { error: errorMessage, retryDelay },
      { status: statusCode }
    );
  }
}
