
/**
 * CHAT MODES CONVENTION DOCUMENTATION:
 * 
 * 1. EXPLORE MODE (default):
 *    - Gemini responds with plain prose text (max 2 lines).
 *    - It appends a tag `[Search: <query>]` at the end to trigger the product carousel.
 *    - Example: "Here are some awesome jackets. [Search: jackets]"
 *    - If a complex query is sent, it can append `[SuggestMode: deep_research]`.
 * 
 * 2. DEEP RESEARCH MODE:
 *    - Gemini returns ONLY a raw JSON payload (no markdown code blocks, no other text).
 *    - Clarifying Question payload format:
 *      {
 *        "type": "clarifying_question",
 *        "acknowledgement": "A short comment on their answer...",
 *        "question": "The question string",
 *        "options": ["Option A", "Option B", "Option C"],
 *        "allow_skip": true,
 *        "allow_custom": true
 *      }
 *    - Final Results payload format:
 *      {
 *        "type": "results",
 *        "acknowledgement": "Hero products found...",
 *        "primary_query": "Urban Classic Black Denim Jacket",
 *        "backup_queries": ["Minimalist White Cotton Tee", "Vintage Wash Relaxed Jeans"]
 *      }
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getFallbackChatResponse } from "@/lib/fallbackResponses";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const EXPLORE_SYSTEM_PROMPT = `You are BuyWise AI, a shopping assistant.
The user is in Explore Mode. This is a lightweight, visual, browse-first experience.

If the user's request is PRODUCT-RELATED (e.g., asking for recommendations, comparisons, or specific items):
You MUST NOT return standard markdown lists. Instead, optimize for a layout where the response is split into:
1. A brief, catchy hook/intro text (~20% of content) in "headline".
2. A list of relevant products in "products".
3. A detailed deep dive explanation with technical details, educational descriptions, or comparison text (~80% of content) in "deep_dive".

You MUST return ONLY a raw valid JSON object in the following format (no other conversational prose outside the JSON, do not wrap in markdown code blocks):

{
  "ui_type": "explore_carousel",
  "headline": "Here are the best budget products matching your prompt!",
  "products": [
    { "id": "1", "name": "Product Name 1", "price": "₹14,999", "rating": 4.2, "image": "/placeholder.png" },
    { "id": "2", "name": "Product Name 2", "price": "₹15,499", "rating": 4.5, "image": "/placeholder.png" }
  ],
  "deep_dive": "### Deep Dive\\nHere is a detailed breakdown of these models. The first option features high-durability design, while the second option focuses on pure performance specs."
}

Ensure the products returned are highly relevant to the user request. Construct reasonable product objects dynamically with approximate real-world specifications, names, prices, and ratings. Use "/placeholder.png" for the image path.

If the user's request is a GENERAL/NON-PRODUCT question (e.g., "what's a good gift idea for a 25-year-old", "hello", "how are you"):
You MUST return ONLY a raw valid JSON object in the following format:
{
  "ui_type": "text_response",
  "text": "Your helpful response here using markdown."
}

Return ONLY the raw JSON in both cases.`;

const DEEP_RESEARCH_SYSTEM_PROMPT = `You are BuyWise AI, a shopping assistant.
The user is in Deep Research Mode (an interactive, guided flow).
Based on the conversation history, you must decide whether to ask a clarifying question to narrow down the choices or to present the final recommendation results.
Usually, ask 2 to 3 clarifying questions (one per turn) about key preferences like budget, use-case, brand, style, size, etc., before presenting results.

If more context is needed, you MUST return ONLY a JSON object in the following format (no other text, do not wrap in markdown code blocks):
{
  "ui_type": "clarifying_question",
  "thought": "A short reflection or thought process acknowledging their input and explaining why this question is being asked, e.g. 'Bhai laptop lena hai, nice! Chal jaldi se figure out karte hain...'",
  "question": "The clarifying question to ask, e.g. 'Budget kitna hai roughly?'",
  "options": [
    { "id": "1", "label": "₹40-50k tak", "value": "40000-50000" },
    { "id": "2", "label": "₹50-70k", "value": "50000-70000" },
    { "id": "3", "label": "₹70k-1L", "value": "70000-100000" },
    { "id": "4", "label": "1L+", "value": "100000+" }
  ],
  "allow_skip": true
}

If you have gathered enough details (or if the user insists on seeing results), you MUST present the final results by returning ONLY a JSON object in the following format (no other text, do not wrap in markdown code blocks):
{
  "ui_type": "results",
  "acknowledgement": "Based on our research, here is the best match for you and a few other options to consider.",
  "primary_query": "The exact name or specific keyword query for the best match hero product (e.g., 'Urban Classic Black Denim Jacket')",
  "backup_queries": [
    "Exact name or keyword for backup product 1 (e.g., 'Minimalist White Cotton Tee')",
    "Exact name or keyword for backup product 2 (e.g., 'Vintage Wash Relaxed Jeans')"
  ]
}

Ensure the queries match typical products in the catalog. Return ONLY the raw JSON string. Do not wrap in markdown code blocks.`;

export async function POST(req: NextRequest) {
  let userMessage = "";

  try {
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

    const { history = [], message, mode = "explore" } = body;
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

    const isDeepResearch = mode === "deep_research" || mode === "deep-research";
    const systemInstruction = isDeepResearch ? DEEP_RESEARCH_SYSTEM_PROMPT : EXPLORE_SYSTEM_PROMPT;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
    });

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
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
  mode?: "deep_research" | "deep-research" | "explore";
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
