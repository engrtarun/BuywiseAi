/**
 * src/lib/agents/writer.ts
 *
 * Response writer agent for BuyWise AI.
 *
 * Takes the determined mode, user message, conversation history, optional
 * product search results, and any accumulated session context — and calls
 * Gemini once to produce the final structured JSON response for the frontend.
 *
 * This agent owns the two system prompts (explore / deep_research) and all
 * JSON format contracts. It is the single source of truth for what the AI
 * says to the user.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";
import type { SearchedProduct } from "@/lib/agents/search";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// ─── System Prompts ───────────────────────────────────────────────────────────

const EXPLORE_SYSTEM_PROMPT = `You are BuyWise AI, a universal, all-category shopping assistant. You are NOT limited to tech or electronics.

RULE 1: For EVERY user intent—whether they ask for water, clothes, python programming, groceries, or cars—you MUST find a purchasable angle and return relevant product items.
RULE 2: Never return generic tech-buying advice (like 'camera quality' or 'battery life') for non-tech items.
RULE 3: You MUST output the \`explore_carousel\` JSON schema format every single time when presenting options.
RULE 4: Enforce the 20/80 content rule. Provide a short \`headline\` (20%), a populated \`products\` array for the Mid-Cards, and a comprehensive \`deep_dive\` markdown string (80%).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION FLOW — follow this exact intent-based sequence:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CLASSIFY THE INTENT FIRST:
   - Shopping Intent: The user wants to buy something, look for recommendations, or find products (e.g., "I need water", "Code in Python", "Suggest shoes").
   - Conversation: The user is just chatting (e.g., "Hi", "Who are you").
   - Clarification Needed: The request is too vague to search for ANYTHING.

2. IF SHOPPING INTENT (Direct to Search!):
   Do NOT ask for purpose or budget for everyday items unless absolutely necessary.
   IMMEDIATELY output a \`search_intent\` payload to search for real products.
   Infer the best search query based on their request. (e.g., "I need water" -> query: "mineral water bottles", "Code in Python" -> query: "Python programming books").

3. PRESENT PRODUCT OPTIONS (The 20/80 Rule):
   After we provide you with real product listings (from your search), you MUST output an \`explore_carousel\` payload with the best options.
   - The \`headline\` MUST be a human-friendly, highly relevant opening paragraph validating the user's request.
   - The \`deep_dive\` MUST be category-specific. Do NOT reuse generic electronics advice for non-electronics.

4. IF CONVERSATION INTENT:
   Return a simple \`text_response\` payload. Do NOT search.

5. IF CLARIFICATION TRULY NEEDED:
   Return a \`clarifying_question\` payload.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LINGUISTIC FINGERPRINTING & TONE MATCHING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyze the user's input language and conversational tone. You MUST mirror their language and style perfectly.
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

When presenting product options (after real listings are injected):
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

const DEEP_RESEARCH_SYSTEM_PROMPT = `You are a shopping consultant's intake specialist for BuyWise AI.
The user is in Deep Research Mode — an interactive, guided, multi-turn flow.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 0 — RECOGNIZE OR ASK FOR CLARIFICATION (ALWAYS CHECK THIS FIRST):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before doing anything else, decide: does the user's message clearly reference a real, identifiable product or product category?

- A REAL category means something you can actually search for and buy: laptop, running shoes, pressure cooker, phone, blender, etc.
- NOT a real category: gibberish words ("jumla", "asdfgh"), nonsense phrases, random strings, or words you don't recognise as a product.

If the session context already contains a "confirmed_category" field, that category is already established — DO NOT re-derive it. Proceed directly to Step 1 using the existing confirmed_category.

If there is NO confirmed_category yet and the current message does NOT clearly describe a real product, respond with the unrecognized format below. Do NOT guess a category. Do NOT invent a plausible-sounding category for nonsense input.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION ORDERING — always follow this sequence:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1 — QUALIFY PURPOSE & BUDGET (THE INTAKE STAGE).
Given a user's initial product request, identify the product category and ask EXACTLY TWO questions in this specific order. Always phrase every question in plain, non-technical language about USE, never about specs. Users often don't know technical terminology:
1. Use-Case Question: Tailor this to the specific category.
   - Laptops: "What will you use it for — study, gaming, work, editing?"
   - Shoes: "What are they for — running, casual, gym?"
   - Pressure cooker: "How many people do you usually cook for?"
2. Budget Question: Always ask "What's your budget range?" as the guaranteed second question.

Step 2 — PRESENT RESULTS.
Once the user has answered the use-case and budget, show 2-3 top-rated options matched to their answers.
When selecting products, treat review COUNT as a signal of reliability, not just the star rating itself. A product with a slightly lower rating but thousands of reviews is generally a safer recommendation than one with a near-perfect rating from only a handful of reviews — the small-sample product may just be new or unproven. Factor this into which products you select and into your reasoning text. When helpful, mention the review count explicitly in your reason (e.g. "rated 4.3 across 12,000+ buyers, showing it holds up at scale" vs "rated 4.9 but only 8 reviews so far, too early to fully trust").
Each product needs a one-line reason connecting it to their specific use case.

Step 3 — OFFER ONE STRETCH OPTION.
After in-budget options, offer exactly one product ~10-15% above budget.
Frame as "worth mentioning", give a clear reason, reassure in-budget options are solid too.
Skip entirely if user asked for "cheapest" or showed strong price sensitivity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LINGUISTIC FINGERPRINTING & TONE MATCHING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyze the user's input language and conversational tone. You MUST mirror their language and style perfectly.
If they speak Hinglish, reply in Hinglish. If they use short casual phrases, be concise. Match their energy.
Return a \`fingerprint\` object in your JSON response tracking this on every turn.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON RESPONSE FORMAT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If the user's message does not clearly describe a real, purchasable product or category, return ONLY this format:
{
  "ui_type": "unrecognized",
  "text": "I'm not sure what product you're looking for — could you tell me more about what you need?",
  "fingerprint": { "language": "...", "tone": "...", "verbosity": "..." }
}

If you are still gathering details (or if it is the first turn in Deep Research Mode for a recognized category), return ONLY this format:
{
  "ui_type": "intake_questionnaire",
  "confirmed_category": "running shoes",
  "category": "running shoes",
  "key_attributes": [
    {"name": "use_case", "question": "What are they for — running, casual, gym?"},
    {"name": "budget", "question": "What's your budget range?"}
  ],
  "fingerprint": { "language": "...", "tone": "...", "verbosity": "..." }
}

Note: "confirmed_category" must always match "category". It is used to lock the category across turns so you do not re-guess it.

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

Provide 2-3 products in the recommended_products array, sorted by rank. Assign appropriate badges like "🏆 Best Overall", "💰 Best Value", "⭐ Alternative Choice", etc.

When real product data is injected below the user message, use those products in your recommended_products array rather than hallucinating product details.

Ensure queries match real Indian market products. Return ONLY the raw JSON string. Do not wrap in markdown code blocks.`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WriterInput {
  mode: "explore" | "deep_research";
  userMessage: string;
  history: Array<{ role: string; content: string }>;
  products?: SearchedProduct[];         // injected search results (may be empty)
  sessionContext?: Record<string, unknown>; // accumulated requirements / fingerprint
  isRegenerate?: boolean;
  /** Groq fallback key — used when Gemini fails */
  groqApiKey?: string;
}

export interface WriterOutput {
  /** Raw JSON string(s) to return to the frontend */
  responseTexts: string[];
  /** Products from Serper, forwarded as-is for the frontend product list */
  serperProducts: SearchedProduct[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanJson(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
}

function tryParse(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(cleanJson(text));
  } catch {
    return null;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * runWriter
 *
 * Calls Gemini (with Groq fallback) to produce the final structured JSON
 * response. Handles the explore two-turn search flow and the deep_research
 * intake / results flow internally so the caller (`route.ts`) stays clean.
 */
export async function runWriter(input: WriterInput): Promise<WriterOutput> {
  const { mode, userMessage, history, products = [], sessionContext, isRegenerate, groqApiKey } = input;

  const isDeepResearch = mode === "deep_research";
  let systemInstruction = isDeepResearch ? DEEP_RESEARCH_SYSTEM_PROMPT : EXPLORE_SYSTEM_PROMPT;

  // Inject accumulated session context so the AI can personalize responses
  if (sessionContext && Object.keys(sessionContext).length > 0) {
    systemInstruction += `\n\nUser's accumulated session context (including linguistic fingerprint): ${JSON.stringify(sessionContext)}`;
  }

  // If we already have products from the search agent, inject them into the
  // user message so the AI can reference real data instead of hallucinating.
  let effectiveUserMessage = userMessage;
  if (isRegenerate) {
    effectiveUserMessage += `\n\n[SYSTEM NOTE: The user has requested to REGENERATE the response. Please rethink and provide a different, higher-quality answer.]`;
  }
  if (products.length > 0) {
    effectiveUserMessage += `\n\n[INJECTED PRODUCT DATA — use these real listings in your response]:\n${JSON.stringify(products, null, 2)}`;
  }

  // Map history to Gemini SDK format
  const formattedHistory = history.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content || "" }],
  }));

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
  });

  const chat = model.startChat({
    history: formattedHistory,
    generationConfig: {
      maxOutputTokens: 1500,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object" as any,
        properties: {
          ui_type: { type: "string" as any },
          text: { type: "string" as any },
          query: { type: "string" as any },
          headline: { type: "string" as any },
          deep_dive: { type: "string" as any },
          products: {
            type: "array" as any,
            items: {
              type: "object" as any,
              properties: {
                id: { type: "string" as any },
                name: { type: "string" as any },
                price: { type: "string" as any },
                rating: { type: "number" as any },
                image: { type: "string" as any },
                reason: { type: "string" as any },
                stretch: { type: "boolean" as any }
              }
            }
          },
          thought: { type: "string" as any },
          question: { type: "string" as any },
          options: {
            type: "array" as any,
            items: {
              type: "object" as any,
              properties: {
                id: { type: "string" as any },
                label: { type: "string" as any },
                value: { type: "string" as any }
              }
            }
          },
          allow_skip: { type: "boolean" as any },
          confirmed_category: { type: "string" as any },
          category: { type: "string" as any },
          key_attributes: {
            type: "array" as any,
            items: {
              type: "object" as any,
              properties: {
                name: { type: "string" as any },
                question: { type: "string" as any }
              }
            }
          },
          summary: { type: "string" as any },
          final_verdict: { type: "string" as any },
          recommended_products: {
            type: "array" as any,
            items: {
              type: "object" as any,
              properties: {
                id: { type: "string" as any },
                name: { type: "string" as any },
                price: { type: "string" as any },
                rating: { type: "number" as any },
                reviewCount: { type: "string" as any },
                description: { type: "string" as any },
                platform: { type: "string" as any },
                image: { type: "string" as any },
                link: { type: "string" as any },
                badge: { type: "string" as any }
              }
            }
          },
          fingerprint: {
            type: "object" as any,
            properties: {
              language: { type: "string" as any },
              tone: { type: "string" as any },
              verbosity: { type: "string" as any }
            }
          }
        },
        required: ["ui_type"]
      }
    },
  });

  // ── First LLM call ──────────────────────────────────────────────────────────
  let text = "";
  try {
    const result = await chat.sendMessage(effectiveUserMessage);
    text = result.response.text();
  } catch (geminiErr) {
    console.warn("[writer] Gemini failed, trying Groq fallback...", geminiErr);
    if (!groqApiKey) throw geminiErr;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemInstruction },
          ...history.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content || "",
          })),
          { role: "user", content: effectiveUserMessage },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) throw new Error(`[writer] Groq fallback failed: ${groqRes.statusText}`);
    const groqData = await groqRes.json();
    text = groqData.choices[0].message.content;
  }

  let responseTexts: string[] = [text];
  let serperProducts: SearchedProduct[] = products;

  // ── Explore two-turn search flow ────────────────────────────────────────────
  // In explore mode the AI may return a search_intent first. When that happens
  // (and no products were injected), we run the second turn inline to get the
  // carousel.  If products were already injected from search.ts the AI should
  // already have produced the carousel directly.
  if (!isDeepResearch) {
    const parsed = tryParse(text);
    if (parsed?.ui_type === "search_intent" && products.length === 0) {
      // The AI asked to search but no products were pre-fetched; run an inline
      // search and do a second writer turn.
      try {
        const { searchForProducts } = await import("@/lib/agents/search");
        const query = typeof parsed.query === "string" ? parsed.query : userMessage;
        serperProducts = await searchForProducts(query, 6);
      } catch (searchErr) {
        console.warn("[writer] Inline search failed:", searchErr);
      }

      const searchContextMessage = `Here are product listings for your search: ${JSON.stringify(serperProducts)}. Please output the explore_carousel JSON now with the best options. Make sure to provide a valid headline, products array, and deep_dive markdown string.`;
      try {
        const secondResult = await chat.sendMessage(searchContextMessage);
        const carouselText = secondResult.response.text();
        responseTexts = [carouselText];
        text = carouselText;
      } catch (secondErr) {
        console.warn("[writer] Second-turn carousel failed, using inline fallback:", secondErr);
        responseTexts = [JSON.stringify({
          ui_type: "explore_carousel",
          headline: "Here are some great options for you based on your request.",
          products: serperProducts,
          deep_dive: "Explore these options carefully to find what best fits your needs.",
        })];
      }
    }
  }

  // ── Deep-research retry on invalid JSON ────────────────────────────────────
  if (isDeepResearch) {
    const parsed = tryParse(text);
    const validTypes = ["intake_questionnaire", "deep_research_results", "clarifying_question", "unrecognized"];
    const isValid = parsed && validTypes.includes(parsed.ui_type as string);

    if (!isValid) {
      console.warn("[writer] Deep research produced invalid JSON, retrying...");
      try {
        const retryResult = await chat.sendMessage("Your last response was not valid JSON or was missing required fields. Please return strictly the JSON payload.");
        text = retryResult.response.text();
        responseTexts = [text];
      } catch {
        // Emit a safe fallback
        responseTexts = [JSON.stringify({
          ui_type: "deep_research_results",
          summary: "We had some trouble processing the exact details, but we found some safe recommendations.",
          final_verdict: "Please try your query again or explore these popular options.",
          recommended_products: [],
        })];
      }
    }
  }

  return { responseTexts, serperProducts };
}
