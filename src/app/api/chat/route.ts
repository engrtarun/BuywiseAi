
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

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let userMessage = "";
  let userHistory: ChatHistoryMessage[] = [];
  let mode = "explore";

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

    // Guardrail: Return empty chunked stream silently for empty array pings to stop frontend infinite retry locks
    if (!isChatRequestBody(body) || !body.message || !body.message.trim()) {
      const emptyStream = new ReadableStream({
        start(controller) { controller.close(); }
      });
      return new Response(emptyStream, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked" }
      });
    }

    // Validate history if provided
    if (body.history !== undefined && !Array.isArray(body.history)) {
      return NextResponse.json(
        { error: "Invalid request: 'history' must be an array if provided." },
        { status: 400 }
      );
    }

    let { chatId = "default", history = [], message, mode: bodyMode = "explore", requirements = {}, isRegenerate = false } = body;
    mode = bodyMode;
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

    let shoppingSearchFailed = false;

    if (requirementsReady) {
      const query = [
        requirements.category,
        requirements.use_case,
        requirements.budget ? `under ${requirements.budget}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      try {
        searchResults = await searchForProducts(query, 6);
      } catch (searchErr) {
        shoppingSearchFailed = true;
        console.warn("[route] Shopping API search failed:", searchErr);
      }

      try {
        // Execute Deep Web Scraping & Reranking Pipeline
        rerankedContext = await executeRerankedSearch(query);
        if (rerankedContext && rerankedContext.error) {
          console.warn("[route] Scraper/Organic search failed (partial fallback active):", rerankedContext.error);
        }
      } catch (searchErr) {
        console.warn("[route] Pre-search failed unexpectedly:", searchErr);
      }

      // If Shopping API completely failed or returned 0 results, we cannot provide product options.
      // Trigger a full fallback immediately to prevent LLM hallucinations or blank UI.
      if (shoppingSearchFailed || searchResults.length === 0) {
        return NextResponse.json({
          text: [getFallbackChatResponse(userMessage, mode)],
          fallback: true,
          products: null
        });
      }
    }

    // ── Step 4: Writer produces the final structured response (STREAMING) ─────────
    const { runStreamingWriter } = await import("@/lib/agents/writer");
    const writerStream = runStreamingWriter({
      mode: mode === "deep_research" ? "deep_research" : "explore",
      userMessage,
      history: userHistory.map((m) => ({ role: m.role ?? "user", content: m.content ?? "" })),
      products: searchResults,
      sessionContext: {
        ...backendContext.context,
        ...requirements,
        chatMemory: backendContext.memory,
        reranked_context: rerankedContext 
          ? {
              primary: rerankedContext.primary.map(c => c.text),
              secondary: rerankedContext.secondary.map(c => c.text)
            }
          : undefined
      },
      isRegenerate,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        
        // Send initial metadata (products array for frontend fallback)
        if (searchResults && searchResults.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'metadata', products: searchResults })}\n\n`));
        }

        try {
          let dataTagFound = false;
          let jsonBuffer = "";
          
          for await (const chunk of writerStream) {
            const chunkText = chunk || "";
            fullResponse += chunkText;

            if (fullResponse.includes("|||PRODUCT_DATA_START|||")) {
              dataTagFound = true;
              // Split out what belongs to the chat text vs what belongs to the raw JSON string
              const parts = chunkText.split("|||PRODUCT_DATA_START|||");
              
              if (parts[0] && !fullResponse.split("|||PRODUCT_DATA_START|||")[0].includes("[")) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: parts[0] })}\n\n`));
              }
              if (parts[1]) {
                jsonBuffer += parts[1];
              } else if (parts.length === 1 && dataTagFound) {
                 // If the tag was already found in a previous chunk, the whole chunk belongs to JSON
                 if (!chunkText.includes("|||PRODUCT_DATA_START|||")) {
                    jsonBuffer += chunkText;
                 }
              }
            } else {
              if (!dataTagFound && !fullResponse.includes("[")) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`));
              }
            }
          }

          // Once the stream finishes, save the full response to context
          let assistantCleanText = "";
          let confirmedCategory: string | null = null;
          try {
            const parsedRes = JSON.parse(fullResponse.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim());
            if (parsedRes.fingerprint && parsedRes.fingerprint.language) {
              backendContext.memory.userLanguagePreference = parsedRes.fingerprint.language;
            }
            if (typeof parsedRes.confirmed_category === "string") {
              confirmedCategory = parsedRes.confirmed_category;
            }
            assistantCleanText = String(parsedRes.headline || parsedRes.text || parsedRes.summary || "");
          } catch (err) {
            const match = fullResponse.match(/"(?:text|headline|summary)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            if (match && match[1]) {
              assistantCleanText = match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
            } else {
              assistantCleanText = fullResponse.replace(/[{}"[\]]/g, "").replace(/\b(?:ui_type|text|thought|fingerprint|language|tone|verbosity)\b/g, "").trim();
            }
          }

          if (!assistantCleanText.trim()) {
            assistantCleanText = "Hello! How can I assist you?";
          }
          
          backendContext.history.push({ role: "assistant", content: assistantCleanText });
          backendContext.messageCount = backendContext.history.length;
          backendContext.lastActive = new Date().toISOString();

          // Execute preference extraction pipeline
          const preferenceRegex = /\[TRACK_PREFERENCE:\s*(.*?)\]/;
          const match = fullResponse.match(preferenceRegex);
          if (match && match[1]) {
            if (!backendContext.memory.preferredCategories) backendContext.memory.preferredCategories = [];
            if (!backendContext.memory.preferredCategories.includes(match[1].trim())) {
              backendContext.memory.preferredCategories.push(match[1].trim());
            }
          }

          // Parse out the filled jsonBuffer to attach to metadata tracking database hooks
          if (jsonBuffer.trim()) {
             try {
                const parsedProducts = JSON.parse(jsonBuffer.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim());
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'metadata', products: parsedProducts })}\n\n`));
             } catch (err) {
                console.warn("Failed to parse split-boundary JSON buffer:", err);
             }
          }

          fs.writeFileSync(contextFilePath, JSON.stringify(backendContext, null, 2));

          if (confirmedCategory) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'metadata', confirmed_category: confirmedCategory })}\n\n`));
          }

          // Also update Redis Semantic Cache asynchronously
          storeInSemanticCache(userMessage, {
            responseTexts: [fullResponse],
            products: searchResults.length > 0 ? searchResults : null,
          }, chatId);

        } catch (streamErr: any) {
          console.warn("Switching to Groq streaming fallback orchestration channel...", streamErr.message || streamErr);
          try {
            const activeGroqKey = process.env.GROQ_API_KEY;
            if (!activeGroqKey) throw new Error("Groq credentials pool unavailable.");

            const systemInstruction = `
              You are BuyWise AI. You must adhere strictly to these rules:
              1. If the query yields products, write your natural chat message response first.
              2. At the absolute end of your response, if product items are present, insert the exact separator tag: |||PRODUCT_DATA_START||| followed immediately by the raw JSON string containing the structured products object array (with id, name, price, rating, image, platform, link, reason). Do not add markdown code fences (like \`\`\`json) inside or around the separator tag block.
            `;

            const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${activeGroqKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                stream: true,
                messages: [
                  { role: "system", content: systemInstruction },
                  ...userHistory.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content || "" })),
                  { role: "user", content: userMessage }
                ]
              })
            });

            if (!groqResponse.ok) throw new Error(`Groq stream connection error: ${groqResponse.status}`);
            
            const reader = groqResponse.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error("Failed to extract active reader stream descriptor.");

            let fallbackDataTagFound = false;
            let fallbackJsonBuffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunkStr = decoder.decode(value, { stream: true });
              const lines = chunkStr.split("\n").filter(line => line.trim() !== "");
              
              for (const line of lines) {
                if (line.includes("data: [DONE]")) break;
                if (line.startsWith("data: ")) {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    const textDelta = parsed.choices[0]?.delta?.content || "";
                    fullResponse += textDelta;
                    
                    if (fullResponse.includes("|||PRODUCT_DATA_START|||")) {
                      fallbackDataTagFound = true;
                      const parts = textDelta.split("|||PRODUCT_DATA_START|||");
                      
                      if (parts[0] && !fullResponse.split("|||PRODUCT_DATA_START|||")[0].includes("[")) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: parts[0] })}\n\n`));
                      }
                      if (parts[1]) {
                        fallbackJsonBuffer += parts[1];
                      } else if (parts.length === 1 && fallbackDataTagFound) {
                        if (!textDelta.includes("|||PRODUCT_DATA_START|||")) fallbackJsonBuffer += textDelta;
                      }
                    } else {
                      if (!fallbackDataTagFound && !fullResponse.includes("[")) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: textDelta })}\n\n`));
                      }
                    }
                  } catch (e) {}
                }
              }
            }
            
            if (fallbackJsonBuffer.trim()) {
               try {
                  const parsedProducts = JSON.parse(fallbackJsonBuffer.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim());
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'metadata', products: parsedProducts })}\n\n`));
               } catch (err) {}
            }
          } catch (fallbackError: any) {
            console.error("Critical Execution Fault across both pipelines:", fallbackError);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: `\\n[Stream Interrupted: ${fallbackError.message}]` })}\n\n`));
          }
        } finally {
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error: unknown) {
    logGeminiFailure(error);

    return NextResponse.json({
      text: [getFallbackChatResponse(userMessage, mode)],
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
