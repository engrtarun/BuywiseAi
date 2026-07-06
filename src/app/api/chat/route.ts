
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
import { enforceChatAccess } from "@/lib/chatAccess";
import fs from "fs";
import path from "path";
import { determineIntent } from "@/lib/agents/router";
import { searchForProducts, type SearchedProduct } from "@/lib/agents/search";
import { runWriter } from "@/lib/agents/writer";
import { executeRerankedSearch } from "@/lib/providers/test-serper";
import type { RerankedContext } from "@/lib/retrieval/index";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);



export async function POST(req: NextRequest) {
  let userMessage = "";
  let userHistory: ChatHistoryMessage[] = [];

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

    let { chatId = "default", history = [], message, mode = "explore", requirements = {}, isRegenerate = false } = body;
    userMessage = message;

    if (mode !== "buy_explanation") {
      mode = await determineIntent(userMessage, history);
    }

    // Backend JSON file logic (Msg Quality Improvement)
    const chatDataDir = path.join(process.cwd(), "chat_data");
    if (!fs.existsSync(chatDataDir)) {
      fs.mkdirSync(chatDataDir);
    }
    const contextFilePath = path.join(chatDataDir, `${chatId}.json`);

    let backendContext = {
      messageCount: history.length,
      lastActive: new Date().toISOString(),
      context: requirements
    };

    if (fs.existsSync(contextFilePath)) {
      try {
        backendContext = JSON.parse(fs.readFileSync(contextFilePath, "utf8"));
      } catch (e) {
        console.warn("Failed to parse backend JSON file:", e);
      }
    }

    // Update and write back
    backendContext.messageCount = history.length;
    backendContext.lastActive = new Date().toISOString();
    backendContext.context = { ...backendContext.context, ...requirements };
    fs.writeFileSync(contextFilePath, JSON.stringify(backendContext, null, 2));


    userHistory = history;

    const access = await enforceChatAccess(req);
    if (access.response) {
      return access.response;
    }
    // access.isGuest indicates whether this is an unauthenticated guest request.

    // Map frontend conversation history ({ role: "assistant"|"user", content })
    // to the structure expected by the Gemini SDK ({ role: "model"|"user", parts: [{ text }] })
    const formattedHistory = history.map((msg) => {
      const role = msg.role === "assistant" ? "model" : "user";
      return {
        role,
        parts: [{ text: msg.content || "" }]
      };
    });

    if (mode === "buy_explanation") {
      try {
        let product = JSON.parse(userMessage);
        const explanationPrompt = `The user selected the product "${product.name}" priced at ${product.price}. Their stated need was their previous conversation context. Write a short, genuine 2-3 sentence explanation of why this specific product is a good fit for their stated need, referencing whatever real specs/features are available from the product title/description. Be honest — if the product isn't a perfect fit, say so briefly rather than oversell it. Output your response as a valid JSON object in this format: { "ui_type": "text_response", "text": "Your explanation here" }`;

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
        });
        const chat = model.startChat({
          history: formattedHistory,
          generationConfig: {
            maxOutputTokens: 500,
            responseMimeType: "application/json",
          },
        });

        const result = await chat.sendMessage(explanationPrompt);
        const text = (await result.response).text();

        // Simple check
        const parsedData = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim());
        if (parsedData && parsedData.ui_type === "text_response") {
          return NextResponse.json({ text: [text], products: null });
        } else {
          throw new Error("Invalid format from Gemini");
        }
      } catch (e) {
        console.error("Failed to generate buy explanation:", e);
        let product: any = { name: "this product" };
        try { product = JSON.parse(userMessage); } catch { }
        const fallback = JSON.stringify({
          ui_type: "text_response",
          text: `Great choice! ${product.name} is a solid pick within your budget.`
        });
        return NextResponse.json({ text: [fallback], products: null });
      }
    }

    // ── Step 1: Router determines mode (already done above) ──────────────────
    // `mode` is now set to "explore" or "deep_research" by determineIntent.

    // ── Step 2: Search & Deep Reranking (only in deep_research) ───────────────
    let searchResults: SearchedProduct[] = [];
    let rerankedContext: RerankedContext | null = null;
    const requirementsReady =
      mode === "deep_research" &&
      requirements &&
      typeof requirements === "object" &&
      Object.keys(requirements).length >= 2;

    if (requirementsReady) {
      try {
        const query = [
          requirements.category,
          requirements.use_case,
          requirements.budget ? `under ${requirements.budget}` : "",
        ]
          .filter(Boolean)
          .join(" ");
        searchResults = await searchForProducts(query, 6);
        
        // Execute Deep Web Scraping & Reranking Pipeline
        rerankedContext = await executeRerankedSearch(query);
      } catch (searchErr) {
        console.warn("[route] Pre-search failed, writer will proceed without products:", searchErr);
      }
    }

    // ── Step 3: Writer produces the final structured response ─────────────────
    const { responseTexts, serperProducts } = await runWriter({
      mode: mode === "deep_research" ? "deep_research" : "explore",
      userMessage,
      history: userHistory.map((m) => ({ role: m.role ?? "user", content: m.content ?? "" })),
      products: searchResults,
      sessionContext: {
        ...backendContext.context,
        ...requirements,
        reranked_context: rerankedContext 
          ? {
              primary: rerankedContext.primary.map(c => c.text),
              secondary: rerankedContext.secondary.map(c => c.text)
            }
          : undefined
      },
      isRegenerate,
      groqApiKey: process.env.GROQ_API_KEY,
    });

    return NextResponse.json({
      text: responseTexts,
      products: serperProducts.length > 0 ? serperProducts : null,
    });

  } catch (error: unknown) {
    logGeminiFailure(error);

    return NextResponse.json({
      text: getFallbackChatResponse(userMessage, userHistory),
      fallback: true,
      products: null
    });
  }
}

interface ChatHistoryMessage {
  role?: string;
  content?: string;
}

interface ChatRequestBody {
  message: string;
  chatId?: string;
  history?: ChatHistoryMessage[];
  mode?: "deep_research" | "deep-research" | "explore" | "buy_explanation";
  requirements?: Record<string, unknown>;
  isRegenerate?: boolean;
}

function isChatRequestBody(body: unknown): body is ChatRequestBody {
  if (!body || typeof body !== "object") {
    return false;
  }

  return "message" in body && typeof body.message === "string";
}

function sanitizeError(error: unknown): unknown {
  if (!error) return error;

  try {
    // If it's a standard Error object, we might want to sanitize its message or stack
    let errorStr = "";
    if (error instanceof Error) {
      errorStr = error.stack || error.message;
    } else if (typeof error === "object") {
      errorStr = JSON.stringify(error);
    } else {
      errorStr = String(error);
    }

    // Redact ?key=... in URLs
    errorStr = errorStr.replace(/([?&]key=)[^&\s"\\]+/gi, '$1REDACTED');
    // Redact Authorization headers or tokens if present
    errorStr = errorStr.replace(/(Authorization:\s*Bearer\s+)[^\s"\\]+/gi, '$1REDACTED');
    errorStr = errorStr.replace(/(x-goog-api-key:\s*)[^\s"\\]+/gi, '$1REDACTED');

    // Return the sanitized string so it doesn't leak raw objects with hidden properties
    return errorStr;
  } catch (e) {
    return "[Un-stringifiable Error Object]";
  }
}

function logGeminiFailure(error: unknown) {
  const sanitized = sanitizeError(error);

  if (isRateLimitError(error)) {
    if (process.env.NODE_ENV === "development") {
      console.error("Gemini API rate limit hit. Serving fallback response.", sanitized);
    } else {
      console.error("Gemini API rate limit hit. Serving fallback response.");
    }
    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.error("Gemini API failed. Serving fallback response.", sanitized);
  } else {
    console.error("Gemini API failed. Serving fallback response.");
  }
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
