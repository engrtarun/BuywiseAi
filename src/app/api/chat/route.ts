
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



const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const EXPLORE_SYSTEM_PROMPT = `You are BuyWise AI, a smart shopping assistant for the Indian market.
The user is in Explore Mode — a lightweight, visual, browse-first experience.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION FLOW — follow this exact sequence:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. QUALIFY PURPOSE FIRST.
   If the user has not stated their use case, ask ONE short question using a clarifying_question payload.

2. ASK BUDGET SECOND.
   Only after you understand their purpose, ask about budget using a clarifying_question payload. Skip if they already stated it.

3. SEARCH INTENT (IN-BUDGET).
   Once BOTH purpose and budget are known, DO NOT output product options directly. Instead, output a search_intent payload so our backend can search real products.

4. PRESENT PRODUCT OPTIONS.
   After we provide you with real product listings, output an explore_carousel payload with 2-3 in-budget options.

5. FOLLOW-UP WITH STRETCH BUDGET QUESTION.
   IMMEDIATELY AFTER outputting the explore_carousel, you MUST output a clarifying_question payload asking: "Want me to check options about 10% above your budget too?" with options "Yes, show me" and "No, these are fine."

6. HANDLE STRETCH BUDGET RESPONSE.
   - If they say "Yes, show me" or similar: Output a search_intent payload with the budget increased by 10%.
   - If they say "No, these are fine." or similar: Output a text_response with a short closing message ("Got it! Let me know if you'd like to buy one of these.").

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON RESPONSE FORMATS (all responses must be valid JSON):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When asking a question (purpose, budget, or the yes/no stretch question):
{
  "ui_type": "clarifying_question",
  "thought": "Short reflection...",
  "question": "Your question here...",
  "options": [
    { "id": "1", "label": "Option A", "value": "A" }
  ],
  "allow_skip": true
}

When you have both purpose and budget and are ready to search (or expanding budget):
{
  "ui_type": "search_intent",
  "query": "laptop for coding under 60000"
}

When presenting product options (after we inject real listings):
{
  "ui_type": "explore_carousel",
  "headline": "Here are the top picks...",
  "products": [
    { "id": "1", "name": "...", "price": "₹...", "rating": 4.5, "image": "...", "reason": "...", "stretch": false }
  ],
  "deep_dive": "### Why these picks?\\n..."
}

For general text replies:
{
  "ui_type": "text_response",
  "text": "..."
}

Return ONLY the raw JSON string. Do not wrap in markdown code blocks.`;

const DEEP_RESEARCH_SYSTEM_PROMPT = `You are BuyWise AI, a smart shopping assistant for the Indian market.
The user is in Deep Research Mode — an interactive, guided, multi-turn flow.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION ORDERING — always follow this sequence:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1 — QUALIFY PURPOSE FIRST.
  If the user has not stated their use case / reason for needing this product,
  ask about purpose BEFORE asking about budget.
  Examples: coding vs gaming (laptop), camera vs battery (phone), work vs casual (headphones).

Step 2 — ASK BUDGET SECOND.
  Only after you understand their purpose. Skip if they already stated a budget.

Step 3 — PRESENT RESULTS.
  Show 2-3 top-rated options matched to their stated purpose AND budget.
  Each product needs a one-line reason connecting it to their specific use case.

Step 4 — OFFER ONE STRETCH OPTION.
  After in-budget options, offer exactly one product ~10-15% above budget.
  Frame as "worth mentioning", give a clear reason, reassure in-budget options are solid too.
  Skip entirely if user asked for "cheapest" or showed strong price sensitivity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON RESPONSE FORMAT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on the conversation history, decide whether to ask a clarifying question
or to present final results. Usually ask 2-3 clarifying questions (one per turn)
before presenting results — USE THE PURPOSE → BUDGET ORDER above.

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
  "allow_skip": true
}

If you have gathered enough details (or the user insists on results), return ONLY this format:
{
  "ui_type": "results",
  "acknowledgement": "Based on our conversation, here are the best picks for you.",
  "primary_query": "Exact product name or keyword for the best-match hero product — tailored to their stated use case and budget",
  "backup_queries": [
    "Exact keyword for backup option 1",
    "Exact keyword for backup option 2"
  ],
  "stretch_query": "Exact keyword for the ONE stretch option — ~10-15% above budget, clearly better for their specific use case",
  "stretch_note": "One sentence explaining why the stretch option is worth the extra cost, e.g. 'The RTX 3050 makes a real difference for gaming and will last longer before feeling outdated.'"
}

Omit stretch_query and stretch_note if the user asked for cheapest or showed price sensitivity.

Ensure queries match real Indian market products. Return ONLY the raw JSON string. Do not wrap in markdown code blocks.`;

export function validateModeJSONPayload(rawText: string, expectedMode: 'explore' | 'deep_research'): boolean {
  try {
    const cleanedText = rawText.replace(/```json|```/gi, "").trim();
    const parsedData = JSON.parse(cleanedText);
    if (expectedMode === 'explore') {
      return (parsedData.ui_type === 'explore_carousel' && Array.isArray(parsedData.products)) || parsedData.ui_type === 'text_response' || parsedData.ui_type === 'clarifying_question' || parsedData.ui_type === 'search_intent';
    } else {
      return parsedData.ui_type === 'clarifying_question' || parsedData.ui_type === 'results';
    }
  } catch {
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

    const { history = [], message, mode = "explore", requirements = {} } = body;
    userMessage = message;
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
        try { product = JSON.parse(userMessage); } catch {}
        const fallback = JSON.stringify({
          ui_type: "text_response",
          text: `Great choice! ${product.name} is a solid pick within your budget.`
        });
        return NextResponse.json({ text: [fallback], products: null });
      }
    }

    const isDeepResearch = mode === "deep_research" || mode === "deep-research";
    let systemInstruction = isDeepResearch ? DEEP_RESEARCH_SYSTEM_PROMPT : EXPLORE_SYSTEM_PROMPT;
    
    if (isDeepResearch && Object.keys(requirements).length > 0) {
      systemInstruction += `\n\nUser's accumulated requirements so far: ${JSON.stringify(requirements)}`;
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
      },
    });

    let result = await chat.sendMessage(userMessage);
    let text = (await result.response).text();

    let isValid = validateModeJSONPayload(text, isDeepResearch ? 'deep_research' : 'explore');
    
    // We will accumulate texts to return to the frontend.
    let responseTexts: string[] = [text];
    let serperProducts: any[] = [];

    // Parse the initial response safely
    let parsedData = null;
    try {
       parsedData = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim());
    } catch (e) {}

    // If Gemini wants to search
    if (parsedData && parsedData.ui_type === "search_intent" && !isDeepResearch) {
       try {
         serperProducts = await searchProducts(parsedData.query, 5);
         const searchContextMessage = serperProducts.length > 0 
           ? `Here are real current product listings for your search: ${JSON.stringify(serperProducts)}. Please output the explore_carousel JSON now with the best options.`
           : `No products found for: ${parsedData.query}. Please output a text_response explaining that no products were found.`;
         
         const secondResult = await chat.sendMessage(searchContextMessage);
         const carouselText = (await secondResult.response).text();
         responseTexts = [carouselText]; // Replace the search_intent message with the actual carousel
         isValid = validateModeJSONPayload(carouselText, 'explore');

         let parsedCarousel = null;
         try { parsedCarousel = JSON.parse(carouselText.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim()); } catch (e) {}
         
         // Immediately follow-up with stretch question if we just showed a carousel
         if (parsedCarousel && parsedCarousel.ui_type === "explore_carousel") {
            const stretchPrompt = `You just showed the products. Now output the clarifying_question JSON asking: "Want me to check options about 10% above your budget too?" with exactly two options: "Yes, show me" and "No, these are fine."`;
            const thirdResult = await chat.sendMessage(stretchPrompt);
            const stretchText = (await thirdResult.response).text();
            responseTexts.push(stretchText); // Append the second message
         }
       } catch (err) {
         console.error("[chat route] Failed to search products:", err);
         responseTexts = [JSON.stringify({ ui_type: "text_response", text: getFallbackChatResponse(userMessage, userHistory) })];
       }
    }

    if (!isValid) {
      console.warn("AI generated invalid JSON payload. Retrying or falling back...");
      if (isDeepResearch) {
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
            ui_type: "results",
            acknowledgement: "We had some trouble processing the details, but here are some safe recommendations.",
            primary_query: "Top rated products",
            backup_queries: []
          })];
        }
      } else {
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
  history?: ChatHistoryMessage[];
  mode?: "deep_research" | "deep-research" | "explore" | "buy_explanation";
  requirements?: Record<string, unknown>;
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
