
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
import { executeRouterRouting } from "@/lib/agents/routerAgent";
import { searchForProducts, type SearchedProduct } from "@/lib/agents/search";
import { runWriter } from "@/lib/agents/writer";
import { executeRerankedSearch } from "@/lib/providers/test-serper";
import type { RerankedContext } from "@/lib/retrieval/index";
import { executeGenerativeOrchestration } from "@/lib/guardrails/apiOrchestrator";
import { checkSemanticCache, storeInSemanticCache } from "@/lib/caching/semanticCache";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEYS[0]);


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
      try {
        const routerOutput = await executeRouterRouting(userMessage, JSON.stringify(history));
        mode = routerOutput.target_mode;
      } catch (err) {
        console.warn("Router agent failed, falling back to deep_research", err);
        mode = "deep_research";
      }
    }

    // Backend JSON file logic (Msg Quality Improvement & History Tracking like Gemini Ecosystem)
    const chatDataDir = path.join(process.cwd(), "chat_data");
    if (!fs.existsSync(chatDataDir)) {
      fs.mkdirSync(chatDataDir);
    }
    const contextFilePath = path.join(chatDataDir, `${chatId}.json`);

    let backendContext: {
      chatId: string;
      messageCount: number;
      lastActive: string;
      history: ChatHistoryMessage[];
      context: Record<string, any>;
      memory: {
        userLanguagePreference?: string;
        generalProfileSummary?: string;
        preferredCategories?: string[];
      };
    } = {
      chatId,
      messageCount: history.length,
      lastActive: new Date().toISOString(),
      history: history || [],
      context: requirements || {},
      memory: {}
    };

    if (fs.existsSync(contextFilePath)) {
      try {
        const fileContent = fs.readFileSync(contextFilePath, "utf8");
        const parsed = JSON.parse(fileContent);
        backendContext = {
          chatId: parsed.chatId || chatId,
          messageCount: parsed.messageCount ?? history.length,
          lastActive: parsed.lastActive || new Date().toISOString(),
          history: parsed.history || history || [],
          context: { ...parsed.context, ...requirements },
          memory: parsed.memory || {}
        };
      } catch (e) {
        console.warn("Failed to parse backend JSON file:", e);
      }
    }

    // Append current user message to backend history if not present
    const lastMsg = backendContext.history[backendContext.history.length - 1];
    if (!lastMsg || lastMsg.content !== userMessage || lastMsg.role !== "user") {
      backendContext.history.push({ role: "user", content: userMessage });
    }

    // Use full history from the JSON file to feed the agent
    userHistory = backendContext.history;
    backendContext.messageCount = userHistory.length;
    backendContext.lastActive = new Date().toISOString();

    // Dynamically detect language from the user's prompt to store in memory
    const userPromptLower = userMessage.toLowerCase();
    if (
      userPromptLower.includes("kya") ||
      userPromptLower.includes("hai") ||
      userPromptLower.includes("chahiye") ||
      userPromptLower.includes("batao") ||
      userPromptLower.includes("krde") ||
      userPromptLower.includes("thik")
    ) {
      backendContext.memory.userLanguagePreference = "Hinglish/Hindi";
    }

    // Update memory summary based on categories or items searched
    if (requirements.category) {
      if (!backendContext.memory.preferredCategories) {
        backendContext.memory.preferredCategories = [];
      }
      if (!backendContext.memory.preferredCategories.includes(String(requirements.category))) {
        backendContext.memory.preferredCategories.push(String(requirements.category));
      }
    }
    
    // Save current state before LLM call
    fs.writeFileSync(contextFilePath, JSON.stringify(backendContext, null, 2));

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
        const product = JSON.parse(userMessage);
        const explanationPrompt = `The user selected the product "${product.name}" priced at ${product.price}. Their stated need was their previous conversation context. Write a short, genuine 2-3 sentence explanation of why this specific product is a good fit for their stated need, referencing whatever real specs/features are available from the product title/description. Be honest — if the product isn't a perfect fit, say so briefly rather than oversell it. Output your response as a valid JSON object in this format: { "ui_type": "text_response", "text": "Your explanation here" }`;

        const text = await executeGenerativeOrchestration({
          systemInstruction: explanationPrompt,
          formattedHistory,
          effectiveUserMessage: "Provide explanation",
          groqApiKey: process.env.GROQ_API_KEY,
          historyForGroq: history.map((m) => ({ role: m.role ?? "user", content: m.content ?? "" }))
        });

        // The orchestrator already parses and validates the output using Zod, ensuring structural determinism
        const parsedData = JSON.parse(text);
        if (parsedData && parsedData.ui_type === "text_response") {
          return NextResponse.json({ text: [text], products: null });
        } else {
          throw new Error("Invalid format from Generative Orchestrator");
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

    // ── Step 2: Cache check ───────────────────────────────────────────────────
    // Skip cache for regenerate requests and buy_explanation (handled above).
    if (!isRegenerate) {
      const cacheResult = await checkSemanticCache(userMessage, chatId);
      if (cacheResult.type === "HARD_HIT" && cacheResult.payload) {
        return NextResponse.json({
          text: cacheResult.payload.responseTexts,
          products: cacheResult.payload.products,
          cached: true,
        });
      }
    }

    // ── Step 3: Search & Deep Reranking (only in deep_research) ───────────────
    // In explore mode the writer handles inline search via search_intent.
    // In deep_research mode we only search when the user has already supplied
    // both use-case and budget (i.e. requirements is non-empty).

    // ── Step 3: Search & Deep Reranking (only in deep_research) ───────────────
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

    // ── Step 4: Writer produces the final structured response ─────────────────
    const { responseTexts, serperProducts } = await runWriter({
      mode: mode === "deep_research" ? "deep_research" : "explore",
      userMessage,
      history: userHistory.map((m) => ({ role: m.role ?? "user", content: m.content ?? "" })),
      products: searchResults,
      sessionContext: {
        ...backendContext.context,
        ...requirements,
        chatMemory: backendContext.memory, // Pass session memory to personalize answers
        reranked_context: rerankedContext 
          ? {
              primary: rerankedContext.primary.map(c => c.text),
              secondary: rerankedContext.secondary.map(c => c.text)
            }
          : undefined
      },
      isRegenerate,
    });

    // Append the assistant's reply to the JSON file's history (saving only clean text, no raw JSON with thoughts)
    if (responseTexts && responseTexts.length > 0) {
      const rawText = responseTexts[0];
      let assistantCleanText = "";
      
      try {
        const parsedRes = JSON.parse(rawText.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim());
        if (parsedRes.fingerprint && parsedRes.fingerprint.language) {
          backendContext.memory.userLanguagePreference = parsedRes.fingerprint.language;
        }
        assistantCleanText = String(parsedRes.headline || parsedRes.text || parsedRes.summary || "");
      } catch (err) {
        // Regex fallback to extract clean text/headline/summary value without parsing the full JSON
        const match = rawText.match(/"(?:text|headline|summary)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (match && match[1]) {
          assistantCleanText = match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
        } else {
          // Strip braces and quotes to get a clean text representation
          assistantCleanText = rawText.replace(/[{}"[\]]/g, "").replace(/\b(?:ui_type|text|thought|fingerprint|language|tone|verbosity)\b/g, "").trim();
        }
      }

      if (!assistantCleanText.trim()) {
        assistantCleanText = "Hello! How can I assist you?";
      }
      
      backendContext.history.push({ role: "assistant", content: assistantCleanText });
      backendContext.messageCount = backendContext.history.length;
      backendContext.lastActive = new Date().toISOString();
      fs.writeFileSync(contextFilePath, JSON.stringify(backendContext, null, 2));
    }

    // ── Step 5: Extract confirmed_category and store in cache ─────────────────
    // Parse the first response to pull out confirmed_category if the AI set it.
    // Send it back to the client so it can be persisted into session requirements,
    // preventing the category from being re-guessed on subsequent turns.
    let confirmedCategory: string | null = null;
    try {
      const firstResponse = responseTexts[0];
      if (firstResponse) {
        const parsed = JSON.parse(firstResponse.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim());
        if (typeof parsed?.confirmed_category === "string") {
          confirmedCategory = parsed.confirmed_category;
        }
      }
    } catch {
      // Non-critical — ignore parse failures
    }

    // Store in Redis VSS asynchronously
    storeInSemanticCache(userMessage, {
      responseTexts,
      products: serperProducts.length > 0 ? serperProducts : null,
    }, chatId);

    return NextResponse.json({
      text: responseTexts,
      products: serperProducts.length > 0 ? serperProducts : null,
      ...(confirmedCategory ? { confirmed_category: confirmedCategory } : {}),
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
      return String(error);
    }
    return JSON.stringify(error, Object.getOwnPropertyNames(error));
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
