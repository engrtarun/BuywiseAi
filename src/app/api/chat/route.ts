
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


const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const EXPLORE_SYSTEM_PROMPT = `You are BuyWise AI, a smart shopping assistant for the Indian market.
The user is in Explore Mode — a lightweight, visual, browse-first experience.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION FLOW — follow this for ANY product purchase request:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. QUALIFY PURPOSE FIRST, BUDGET SECOND.
   If the user says they need a product but hasn't stated WHY, ask ONE short,
   natural question about their primary use case before asking about budget.
   Examples by category:
   - Laptop   → "What will you mainly use it for — coding/dev, studies, video editing, gaming, or general use?"
   - Phone    → "What matters most to you — camera, gaming, battery life, or an all-rounder?"
   - Headphones → "Are these mainly for calls/work, music, workouts, or gaming?"
   - TV/Monitor → "Mainly for movies/streaming, gaming, or work?"
   - Gift     → "Who's it for, and what are they into?"
   Keep it conversational — one question, not a list of forms.

2. ONLY AFTER knowing their purpose, ask about budget.
   Skip this step if they already stated a budget or say "you decide".

3. PRESENT 2-3 TOP OPTIONS WITHIN BUDGET.
   Each option must include a one-line reason connecting it to the stated purpose.
   Never recommend something irrelevant to their use case.

4. OFFER EXACTLY ONE STRETCH OPTION.
   After the in-budget options, offer one product that is ~10-15% above budget
   (or ₹2,000-15,000 more, depending on price range).
   Frame it as "worth mentioning" or "if you're open to spending a bit more".
   Give a clear one-sentence reason WHY it's worth the extra.
   Always reassure them the in-budget options are solid too.
   NEVER repeat the upsell if the user declines or ignores it.

5. SKIP THE STRETCH OFFER if the user explicitly asks for "cheapest"
   or signals strong price sensitivity. Respect that signal.

6. IF THE USER PROVIDES BOTH PURPOSE AND BUDGET IN THE SAME MESSAGE,
   skip straight to presenting options — do not re-ask what they've already told you.

7. ONCE THE USER PICKS AN OPTION, confirm clearly and guide toward checkout.
   Do not re-litigate or re-present other options after they have decided.

8. IF THE USER REJECTS ALL OPTIONS, ask what specifically is missing
   (brand, colour, a spec) rather than showing more of the same list.

9. IF THE USER SKIPS GIVING A BUDGET ("whatever's good, you decide"),
   present 3 tiers: budget-friendly, mid-range, and premium — with prices shown.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON RESPONSE FORMAT (all responses must be valid JSON):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When you are ASKING A QUALIFYING QUESTION (purpose or budget) or having a
conversational exchange (not yet presenting product options), return:
{
  "ui_type": "text_response",
  "text": "Your conversational question or reply here."
}

When you are PRESENTING PRODUCT OPTIONS (after purpose and budget are known),
return the explore_carousel format. If you are also including a stretch-offer
product, include it in the products array AFTER the in-budget options and add a
"stretch": true flag on that product object, plus a "stretch_note" field at the
top level with the framing sentence:
{
  "ui_type": "explore_carousel",
  "headline": "Based on [purpose], here are the top picks under [budget]:",
  "products": [
    { "id": "1", "name": "Product A", "price": "₹58,999", "rating": 4.5, "image": "/placeholder.png", "reason": "16GB RAM is ideal for running multiple dev environments.", "stretch": false },
    { "id": "2", "name": "Product B", "price": "₹54,499", "rating": 4.3, "image": "/placeholder.png", "reason": "Best balance of CPU performance and battery life for students.", "stretch": false },
    { "id": "3", "name": "Product C (Stretch)", "price": "₹67,500", "rating": 4.7, "image": "/placeholder.png", "reason": "RTX 3050 makes a real difference for gaming and will last longer.", "stretch": true }
  ],
  "stretch_note": "One more worth mentioning — it's about ₹8,000 over budget, but the dedicated RTX GPU is genuinely better for gaming long-term. Totally your call — the in-budget options above are solid too.",
  "deep_dive": "### Why these picks?\\nMarkdown-formatted reasoning for the selections."
}

If there is no stretch offer relevant, omit stretch_note and set stretch: false on all products.

For GENERAL/NON-PRODUCT questions:
{
  "ui_type": "text_response",
  "text": "Your helpful response here using markdown."
}

Return ONLY the raw JSON in ALL cases. Never wrap in markdown code blocks.
Construct product objects with realistic Indian market names, prices in ₹, and accurate specs relevant to the stated use case.`;

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
      return (parsedData.ui_type === 'explore_carousel' && Array.isArray(parsedData.products)) || parsedData.ui_type === 'text_response';
    } else {
      return parsedData.ui_type === 'clarifying_question' || parsedData.ui_type === 'results';
    }
  } catch {
    return false;
  }
}

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

    const { history = [], message, mode = "explore", requirements = {} } = body;
    userMessage = message;

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

    let text = (await result.response).text();

    let isValid = validateModeJSONPayload(text, isDeepResearch ? 'deep_research' : 'explore');
    if (!isValid) {
      console.warn("AI generated invalid JSON payload. Retrying or falling back...");
      if (isDeepResearch) {
        try {
          const retryResult = await chat.sendMessage("Your last response was not valid JSON or was missing required fields. Please return strictly the JSON payload.");
          text = (await retryResult.response).text();
          isValid = validateModeJSONPayload(text, 'deep_research');
        } catch (e) {
          isValid = false;
        }
        if (!isValid) {
          text = JSON.stringify({
            ui_type: "results",
            acknowledgement: "We had some trouble processing the details, but here are some safe recommendations.",
            primary_query: "Top rated products",
            backup_queries: []
          });
        }
      } else {
        text = JSON.stringify({
          ui_type: "text_response",
          text: getFallbackChatResponse(userMessage)
        });
      }
    }

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
