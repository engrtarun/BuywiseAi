
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
import { searchProducts } from "@/lib/productSearch";
import fs from "fs";
import path from "path";



const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const EXPLORE_SYSTEM_PROMPT = `You are in EXPLORE MODE. You are a category-agnostic shopping assistant. You MUST strictly follow this exact 3-step response format for EVERY query, no matter the topic:

1. THE HOOK (20%): Write a short, engaging 1-2 sentence introduction validating the user's request.
2. THE PRODUCTS (MID-CARDS): You MUST output product metadata strictly conforming to the required JSON schema (\`explore_carousel\`). Never skip this. If they ask for water, show water products. If they ask for Python, show Python books.
3. THE DEEP DIVE (80%): Complete the remaining text with a comprehensive buying guide, utility explanation, or hidden tricks related to the query.

CRITICAL: Do not add any conversational filler outside of this structure. Do not output raw markdown if a JSON wrapper is expected.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LINGUISTIC FINGERPRINTING & TONE MATCHING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyze the user's input language and conversational tone. Check the "User's accumulated session context" at the bottom of this prompt for any existing "fingerprint". You MUST mirror their language and style perfectly based on that context and their current message.
If they speak Hinglish, reply in Hinglish. If they use short casual phrases, be concise. Match their energy.
Return a \`fingerprint\` object in your JSON response tracking this on every turn.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON RESPONSE FORMATS (all responses must be valid JSON):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When you have a Shopping Intent and need to search:
{
  "ui_type": "search_intent",
  "query": "mineral water bottles",
  "fingerprint": { "language": "...", "tone": "...", "verbosity": "..." }
}

When presenting product options (after we inject real listings):
{
  "ui_type": "explore_carousel",
  "headline": "Staying hydrated is crucial! Here are some of the best water options available right now.",
  "products": [
    { "id": "1", "name": "...", "price": "₹...", "rating": 4.5, "image": "...", "reason": "...", "stretch": false }
  ],
  "deep_dive": "### The Science of Hydration\\n...",
  "fingerprint": { "language": "...", "tone": "...", "verbosity": "..." }
}

When asking a question (only if truly ambiguous):
{
  "ui_type": "clarifying_question",
  "thought": "Short reflection...",
  "question": "Your question here...",
  "options": [
    { "id": "1", "label": "Option A", "value": "A" }
  ],
  "allow_skip": true,
  "fingerprint": { "language": "...", "tone": "...", "verbosity": "..." }
}

For general text replies:
{
  "ui_type": "text_response",
  "text": "...",
  "fingerprint": { "language": "...", "tone": "...", "verbosity": "..." }
}

Return ONLY the raw JSON string. Do not wrap in markdown code blocks.`;

const DEEP_RESEARCH_SYSTEM_PROMPT = `You are in DEEP RESEARCH MODE. You are an expert product analyst. You MUST strictly follow this exact workflow:

1. CLARIFICATION PHASE: If the user's query lacks specific details (e.g., budget, exact use-case), you MUST pause and output clarifying questions using the \`clarifying_question\` JSON schema. Do not guess.
2. ANALYSIS PHASE: If the context is complete, synthesize the live web data (Serper API) into a strict 3-Part Breakdown:
   - Part A: Technical Analysis (40%) - Deep dive into Pros, Cons, and Specs.
   - Part B: Comparison Grid (30%) - Compare the top 2-3 options logically.
   - Part C: Final Recommendation (30%) - Deliver a definitive, expert verdict based on the user's budget.

CRITICAL: Do not show quick 'Explore' product cards immediately. You must provide the deep analysis first, ending with the recommended product payload.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LINGUISTIC FINGERPRINTING & TONE MATCHING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyze the user's input language and conversational tone. Check the "User's accumulated session context" at the bottom of this prompt for any existing "fingerprint". You MUST mirror their language and style perfectly based on that context and their current message.
If they speak Hinglish, reply in Hinglish. If they use short casual phrases, be concise. Match their energy.
Return a \`fingerprint\` object in your JSON response tracking this on every turn.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON RESPONSE FORMAT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on the conversation history, decide whether to ask a clarifying question
or to present final results. Usually ask 2-3 clarifying questions (one per turn)
before presenting results.

If more context is needed, return ONLY this format (no other text, no markdown blocks):
{
  "ui_type": "clarifying_question",
  "thought": "A short reflection acknowledging their input and explaining why you're asking this — casual and natural, e.g. 'Bhai laptop lena hai, nice! Use case samajh lete hain pehle...'",
  "question": "The clarifying question, e.g. 'What will you mainly use it for — coding, studies, gaming, or general use?'",
  "options": [
    { "id": "1", "label": "Coding / Dev work", "value": "coding" },
    { "id": "2", "label": "Gaming", "value": "gaming" },
    { "id": "3", "label": "College / Studies", "value": "studies" },
    { "id": "4", "label": "General use", "value": "general" }
  ],
  "allow_skip": true,
  "fingerprint": { "language": "...", "tone": "...", "verbosity": "..." }
}

If you have gathered enough details (or the user insists on results), return ONLY this format:
{
  "ui_type": "deep_research_results",
  "summary": "A cohesive paragraph summarizing your research and options.",
  "final_verdict": "A clear, decisive final recommendation.",
  "recommended_products": [
    {
      "id": "1",
      "name": "Exact Product Name",
      "price": "5000",
      "rating": 4.5,
      "reviewCount": "1200",
      "description": "Short description of key features.",
      "platform": "Amazon",
      "image": "/placeholder.png",
      "link": "https://amazon.in",
      "badge": "🏆 Best Overall"
    }
  ],
  "fingerprint": { "language": "...", "tone": "...", "verbosity": "..." }
}

Provide 2-3 products in the recommended_products array, sorted by rank. Assign appropriate badges like "🏆 Best Overall", "💰 Best Value", "⭐ Alternative Choice", etc. Use "/placeholder.png" as the default image URL.

Ensure queries match real Indian market products. Return ONLY the raw JSON string. Do not wrap in markdown code blocks.`;

export function validateModeJSONPayload(rawText: string, expectedMode: 'explore' | 'deep_research'): boolean {
  try {
    const cleanedText = rawText.replace(/```(?:json)?|```/gi, "").trim();
    const parsedData = JSON.parse(cleanedText);

    // Partial success for deep research: if it has a summary or verdict, we can recover it
    if (expectedMode === 'deep_research') {
      if (parsedData.ui_type === 'clarifying_question') return true;
      if (parsedData.ui_type === 'deep_research_results' || parsedData.ui_type === 'results' || parsedData.summary || parsedData.final_verdict) {
        return true;
      }
      return false;
    }

    if (expectedMode === 'explore') {
      if (parsedData.ui_type === 'explore_carousel') {
        return typeof parsedData.headline === 'string' && Array.isArray(parsedData.products) && typeof parsedData.deep_dive === 'string';
      }
      return parsedData.ui_type === 'text_response' || parsedData.ui_type === 'clarifying_question' || parsedData.ui_type === 'search_intent';
    }
    return false;
  } catch (err) {
    console.error("[validateModeJSONPayload] JSON Parse Error:", err);
    console.error("[validateModeJSONPayload] Raw Text was:", rawText);
    return false;
  }
}

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

    const { chatId = "default", history = [], message, mode = "explore", requirements = {}, isRegenerate = false } = body;
    userMessage = message;

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

    if (isRegenerate) {
      userMessage += `\n\n[SYSTEM NOTE: The user has requested to REGENERATE the response for this message. This means they were not fully satisfied with your previous answer. Please rethink their request, carefully consider the chat history, and provide a different, higher quality, or more accurate response.]`;
    }

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

    const isDeepResearch = mode === "deep_research" || mode === "deep-research";
    let systemInstruction = isDeepResearch ? DEEP_RESEARCH_SYSTEM_PROMPT : EXPLORE_SYSTEM_PROMPT;

    // Inject Backend JSON file data to improve message quality
    if (backendContext && backendContext.context) {
      systemInstruction += `\n\n[SYSTEM NOTE - BACKEND CONTEXT FILE]\nI have read your user profile from the backend JSON context file. Please use this data to greatly improve the quality and personalization of your response:\n${JSON.stringify(backendContext.context, null, 2)}`;
    }

    if (Object.keys(requirements).length > 0) {
      systemInstruction += `\n\nUser's accumulated session context (including linguistic fingerprint): ${JSON.stringify(requirements)}`;
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
    });

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    let text = "";
    try {
      let result = await chat.sendMessage(userMessage);
      text = (await result.response).text();
    } catch (geminiErr) {
      console.warn("Gemini API failed, triggering Groq Fallback...", geminiErr);
      if (!process.env.GROQ_API_KEY) throw geminiErr;

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemInstruction },
            ...history.map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content || "" })),
            { role: "user", content: userMessage }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!groqRes.ok) {
        throw new Error(`Groq API failed: ${groqRes.statusText}`);
      }

      const groqData = await groqRes.json();
      text = groqData.choices[0].message.content;
    }

    let isValid = validateModeJSONPayload(text, isDeepResearch ? 'deep_research' : 'explore');

    // We will accumulate texts to return to the frontend.
    let responseTexts: string[] = [text];
    let serperProducts: any[] = [];

    // Parse the initial response safely
    let parsedData = null;
    try {
      parsedData = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim());
    } catch (e) { }

    // If Gemini wants to search
    if (parsedData && parsedData.ui_type === "search_intent" && !isDeepResearch) {
      try {
        serperProducts = await searchProducts(parsedData.query, 5);
        if (!serperProducts || serperProducts.length === 0) {
          throw new Error('LIVE_DATA_EMPTY');
        }
      } catch (err) {
        console.warn('Live DB failed, falling back to mock data:', err);
        const { mockQuickBuyProducts } = await import('@/lib/quickBuyMockData');
        serperProducts = mockQuickBuyProducts.slice(0, 5).map((p: any) => ({
          id: String(p.id),
          name: p.name,
          price: p.price,
          image: p.image,
          platform: p.platform || 'BuyWise AI',
          url: "#",
          rating: p.rating || 4.5,
          source: 'mock'
        }));
      } finally {
        try {
          const searchContextMessage = `Here are product listings for your search: ${JSON.stringify(serperProducts)}. Please output the explore_carousel JSON now with the best options. Make sure to provide a valid headline, products array, and deep_dive markdown string.`;
          const secondResult = await chat.sendMessage(searchContextMessage);
          const carouselText = (await secondResult.response).text();
          responseTexts = [carouselText]; // Replace the search_intent message with the actual carousel
          isValid = validateModeJSONPayload(carouselText, 'explore');
          
          if (!isValid) throw new Error('INVALID_JSON_FROM_LLM');
        } catch (llmErr) {
          console.warn("LLM failed to generate explore_carousel, forcing fallback schema:", llmErr);
          responseTexts = [JSON.stringify({
            ui_type: "explore_carousel",
            headline: "Here are some great options for you based on your request.",
            products: serperProducts,
            deep_dive: "Explore these options carefully to find what best fits your needs."
          })];
          isValid = true;
        }
      }
    }

    if (!isValid) {
      console.warn("AI generated invalid JSON payload. Retrying or falling back...");

      // Try to aggressively extract JSON before falling back completely
      try {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const potentialJson = match[0];
          const parsed = JSON.parse(potentialJson);
          if (parsed.ui_type === 'deep_research_results' || parsed.summary || parsed.final_verdict) {
            text = potentialJson;
            isValid = true;
            responseTexts = [text];
            console.log("Successfully extracted partial JSON via regex");
          }
        }
      } catch (e) { }

      if (!isValid && isDeepResearch) {
        try {
          const retryResult = await chat.sendMessage("Your last response was not valid JSON or was missing required fields. Please return strictly the JSON payload.");
          text = (await retryResult.response).text();
          responseTexts = [text];
          isValid = validateModeJSONPayload(text, 'deep_research');
        } catch (e) {
          isValid = false;
        }
        if (!isValid) {
          responseTexts = [JSON.stringify({
            ui_type: "deep_research_results",
            summary: "We had some trouble processing the exact details, but we found some safe recommendations.",
            final_verdict: "Please try your query again or explore these popular options.",
            recommended_products: []
          })];
        }
      } else if (!isValid && !isDeepResearch) {
        responseTexts = [JSON.stringify({
          ui_type: "text_response",
          text: getFallbackChatResponse(userMessage, userHistory)
        })];
      }
    }

    return NextResponse.json({
      text: responseTexts,
      products: serperProducts.length > 0 ? serperProducts : null
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
