/**
 * src/lib/agents/writer.ts
 *
 * Response writer agent for BuyWise AI.
 *
 * Takes the determined mode, user message, conversation history, optional
 * product search results, and any accumulated session context â€” and calls
 * Gemini once to produce the final structured JSON response for the frontend.
 *
 * This agent owns the two system prompts (explore / deep_research) and all
 * JSON format contracts. It is the single source of truth for what the AI
 * says to the user.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";
import type { SearchedProduct } from "@/lib/agents/search";
import { getNextGeminiClient, getNextGroqKey } from "./keyManager";
import { runWriterCriticValidationLoop } from "./writerCriticLoop";

// â”€â”€â”€ System Prompts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const EXPLORE_SYSTEM_PROMPT = `You are BuyWise AI, a universal, all-category shopping assistant. You are NOT limited to tech or electronics.

RULE 1: For EVERY user intentâ€”whether they ask for water, clothes, python programming, groceries, or carsâ€”you MUST find a purchasable angle and return relevant product items.
RULE 2: Never return generic tech-buying advice (like 'camera quality' or 'battery life') for non-tech items.
RULE 3: You MUST output the \`explore_carousel\` JSON schema format every single time when presenting options.
RULE 4: Enforce the 20/80 content rule. Provide a short \`headline\` (20%), a populated \`products\` array for the Mid-Cards, and a comprehensive \`deep_dive\` markdown string (80%).
1. LANGUAGE MATCHING: You must respond in the exact language, dialect, and script spoken by the user in their latest message.
   - If the user types in English, you MUST answer exclusively in English.
   - If the user types in Romanized Hinglish (e.g., "mujhe laptop chaiye"), you MUST answer exclusively in Romanized Hinglish.
   - Strict Constraint: Never translate the user's intent into an unrequested language or script. If they speak English, keep it 100% English.

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
CONVERSATION FLOW â€” follow this exact intent-based sequence:
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

1. CLASSIFY THE INTENT FIRST:
   - Shopping Intent: The user wants to buy something, look for recommendations, or find products (e.g., "I need water", "Code in Python", "Suggest shoes").
   - Conversation: The user is just chatting (e.g., "Hi", "Who are you").
   - Vague Recommendation / "Something new": If the request is vague (e.g., "kuch naya", "surprise me"), DO NOT ask for clarification. Be highly creative, infer a trending category (like 'new smart gadgets' or 'trending fashion'), and immediately search!

2. IF SHOPPING INTENT (Direct to Search!):
   Do NOT ask for purpose or budget for everyday items unless absolutely necessary.
   IMMEDIATELY output a \`search_intent\` payload to search for real products.
   Infer the best search query based on their request. (e.g., "I need water" -> query: "mineral water bottles", "khuch naya" -> query: "trending cool gadgets").

3. PRESENT PRODUCT OPTIONS (The 20/80 Rule):
   After we provide you with real product listings (from your search), you MUST output an \`explore_carousel\` payload with the best options.
   - The \`headline\` MUST be a human-friendly, highly relevant opening paragraph validating the user's request.
   - The \`deep_dive\` MUST be category-specific. Do NOT reuse generic electronics advice for non-electronics.

4. IF CONVERSATION INTENT:
   Return a simple \`text_response\` payload. Do NOT search.

5. IF TRULY UNABLE TO INFER ANYTHING (Absolute Last Resort):
   Return a \`clarifying_question\` payload. But try your best to guess a category first!

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
LINGUISTIC FINGERPRINTING & TONE MATCHING:
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
Analyze the user's input language and conversational tone. You MUST mirror their language and style perfectly.
If they speak Hinglish, reply in Hinglish. If they use short casual phrases, be concise. Match their energy.
Return a \`fingerprint\` object in your JSON response tracking this on every turn.

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
JSON RESPONSE FORMATS (all responses must be valid JSON):
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

When you have a Shopping Intent and need to search:
{
  "ui_type": "search_intent",
  "query": "mineral water bottles",
  "fingerprint": { "language": "...", "tone": "...", "verbosity": "..." }
}

When presenting product options (after real listings are injected):
{
  "ui_type": "explore_carousel",
  "thought": "The user wants something new, so I searched for the latest cool gadgets...",
  "headline": "Staying hydrated is crucial! Here are some of the best water options available right now.",
  "products": [
    { 
      "id": "1", 
      "name": "...", 
      "price": "â‚¹...", 
      "rating": 4.5, 
      "image": "...", 
      "platform": "...", // Use diverse platforms: Amazon, Flipkart, Meesho, Shopify, Blinkit, Zomato, Swiggy, etc. based on category. Never default to just Amazon!
      "link": "...", 
      "reason": "...", 
      "stretch": false 
    }
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
The user is in Deep Research Mode â€” an interactive, guided, multi-turn flow.

1. LANGUAGE MATCHING: You must respond in the exact language, dialect, and script spoken by the user in their latest message.
   - If the user types in English, you MUST answer exclusively in English.
   - If the user types in Romanized Hinglish (e.g., "mujhe laptop chaiye"), you MUST answer exclusively in Romanized Hinglish.
   - Strict Constraint: Never translate the user's intent into an unrequested language or script. If they speak English, keep it 100% English.

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
STEP 0 â€” RECOGNIZE OR ASK FOR CLARIFICATION (ALWAYS CHECK THIS FIRST):
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

Before doing anything else, decide: does the user's message clearly reference a real, identifiable product or product category?

- A REAL category means something you can actually search for and buy: laptop, running shoes, pressure cooker, phone, blender, etc.
- NOT a real category: gibberish words ("jumla", "asdfgh"), nonsense phrases, random strings, or words you don't recognise as a product.

If the session context already contains a "confirmed_category" field, that category is already established â€” DO NOT re-derive it. Proceed directly to Step 1 using the existing confirmed_category.

If there is NO confirmed_category yet and the current message does NOT clearly describe a real product, respond with the unrecognized format below. Do NOT guess a category. Do NOT invent a plausible-sounding category for nonsense input.

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
CONVERSATION ORDERING â€” always follow this sequence:
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

Step 1 â€” QUALIFY PURPOSE & BUDGET (THE INTERVIEW STAGE).
For ANY product recommendation request, ALWAYS follow this order:
(1) ask about use-case/purpose AND whether the user has specific known specifications in mind.
   - Laptops: "What will you mainly use this laptop for â€” gaming, work, studies, or something else? Do you have any specific specs in mind â€” like RAM, processor, or brand preference?"
   - Pressure cooker: "Is this mainly for daily home cooking, or do you need something for bulk/commercial use? Are you looking for a specific size or material?"
(2) ask about budget. ALWAYS ask "What's your budget range for this?" as the guaranteed second question.

Step 2 â€” PRESENT RESULTS.
(3) THEN present final results with 2-3 options, explicitly recommending ONE as the best pick with a clear justification tied to their stated use-case and budget. Do not skip steps or reorder them, regardless of product category (electronics, kitchen appliances, furniture, clothing, or anything else).
When selecting products, treat review COUNT as a signal of reliability, not just the star rating itself. A product with a slightly lower rating but thousands of reviews is generally a safer recommendation than one with a near-perfect rating from only a handful of reviews. Factor this into which products you select and into your reasoning text.

Step 3 â€” OFFER ONE STRETCH OPTION.
After in-budget options, offer exactly one product ~10-15% above budget.
Frame as "worth mentioning", give a clear reason, reassure in-budget options are solid too.
Skip entirely if user asked for "cheapest" or showed strong price sensitivity.

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
LINGUISTIC FINGERPRINTING & TONE MATCHING:
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
Analyze the user's input language and conversational tone. You MUST mirror their language and style perfectly.
If they speak Hinglish, reply in Hinglish. If they use short casual phrases, be concise. Match their energy.
Return a \`fingerprint\` object in your JSON response tracking this on every turn.

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
JSON RESPONSE FORMAT:
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

If the user's message does not clearly describe a real, purchasable product or category, return ONLY this format:
{
  "ui_type": "unrecognized",
  "text": "I'm not sure what product you're looking for â€” could you tell me more about what you need?",
  "fingerprint": { "language": "...", "tone": "...", "verbosity": "..." }
}

If you are still gathering details (or if it is the first turn in Deep Research Mode for a recognized category), return ONLY this format (Ask ONE question at a time!):
{
  "ui_type": "clarifying_question",
  "confirmed_category": "running shoes",
  "thought": "I need to know their use case first...",
  "question": "What will you primarily use these shoes for?",
  "options": [
    { "id": "1", "label": "Daily Morning Runs", "value": "runs" },
    { "id": "2", "label": "Gym & Workouts", "value": "gym" },
    { "id": "3", "label": "Casual Walking", "value": "casual" }
  ],
  "allow_skip": false,
  "allow_custom": true,
  "fingerprint": { "language": "...", "tone": "...", "verbosity": "..." }
}

Note: "confirmed_category" must always match "category". It is used to lock the category across turns so you do not re-guess it.

If you have gathered enough details (or the user insists on results), return ONLY this format:
{
  "ui_type": "deep_research_results",
  "summary": "A cohesive paragraph summarizing your research and options.",
  "final_verdict": "A clear, decisive final recommendation.",
  "recommended_pick_reason": "Out of these, I'd recommend Option 2 â€” it offers the best value for gaming performance within your budget.",
  "recommended_pick_id": "1",
  "recommended_products": [
    {
      "id": "1",
      "name": "Exact Product Name",
      "price": "5000",
      "rating": 4.5,
      "reviewCount": "1200",
      "description": "Short description of key features.",
      "platform": "...", // Use diverse platforms like Amazon, Flipkart, Meesho, Shopify, Myntra, Blinkit, Zomato, Swiggy depending on the product!
      "image": "/placeholder.png",
      "link": "https://example.in",
      "badge": "Best Overall"
    }
  ],
  "fingerprint": { "language": "...", "tone": "...", "verbosity": "..." }
}

Provide 2-3 products in the recommended_products array, sorted by rank. Assign appropriate badges like "Best Overall", "Best Value", "Alternative Choice", etc. Make sure Name, Price, and Rating are ALL populated.

When real product data is injected below the user message, use those products in your recommended_products array rather than hallucinating product details. PRESERVE their original platform!

Ensure queries match real Indian market products. Return ONLY the raw JSON string. Do not wrap in markdown code blocks.`;

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface WriterInput {
  mode: "explore" | "deep_research";
  userMessage: string;
  history: Array<{ role: string; content: string }>;
  products?: SearchedProduct[];         // injected search results (may be empty)
  sessionContext?: Record<string, unknown>; // accumulated requirements / fingerprint
  isRegenerate?: boolean;
}

export interface WriterOutput {
  /** Raw JSON string(s) to return to the frontend */
  responseTexts: string[];
  /** Products from Serper, forwarded as-is for the frontend product list */
  serperProducts: SearchedProduct[];
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Main export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * runWriter
 *
 * Calls Gemini (with Groq fallback) to produce the final structured JSON
 * response. Handles the explore two-turn search flow and the deep_research
 * intake / results flow internally so the caller (`route.ts`) stays clean.
 */
export async function runWriter(input: WriterInput): Promise<WriterOutput> {
  const { mode, userMessage, history, products = [], sessionContext, isRegenerate } = input;

  const isDeepResearch = mode === "deep_research";
  let systemInstruction = `
You are BuyWise AI, a premium, high-performance shopping orchestration network. You must execute operations under strict compliance with the following architectural mode rules:

=========================================
CORE CONSTRAINT 1: SYSTEM PALETTE & STYLE
=========================================
- Adhere strictly to a premium, minimalistic, and professional dark aesthetic.
- Layout references must prioritize absolute scannability, clean high-quality typography, and simple white text overlays.
- CRITICAL: Reject layered glass panels, blur overlays, or heavy container shadows in any presentation layout parameters.

=======================================================
CORE CONSTRAINT 2: SCRIPITING & LANGUAGE ISOMORPHISM
=======================================================
- Identify the exact language script, dialect, and slang used by the user's latest prompt. You MUST lock your response to match it 100%.
- DEFAULT PATH: If the user prompts in plain English, answer exclusively in plain English.
- EXCEPTION PATH: If and only if the user types using Latin-script Hinglish (e.g., "mujhe phone chahiye"), you MUST reply in natural, clean, Romanized Hinglish using the Latin alphabet.
- ABSOLUTE GUARDRAIL: Never utilize Devanagari script (like à¤¹à¤¿à¤‚à¤¦à¥€, à¤²à¥ˆà¤ªà¤Ÿà¥‰à¤ª, à¤¬à¥‡à¤¹à¤¤à¤°à¥€à¤¨) under any circumstances unless the user explicitly initiates a prompt typed in Devanagari characters. Never auto-translate or allow language script drift.

======================================
CORE CONSTRAINT 3: DYNAMIC MODE RULES
======================================

[MODE 1: EXPLORE MODE ACTIVATION]
- Trigger Criteria: Automatically activated when intent classification logic or keyword scores identify product categories outside standard apparel (such as "khana", "pina", "food", "pizza", "burger", "order").
- Stage 1 Intake (20% Principle): If the user's prompt lacks vital structural parameters (budget constraints, explicit categories, restaurant names), immediately trigger clarifying options. 
- Stage 2 Micro-Layout: Format response metadata collections using dynamic parameters (e.g., item_name, price, restaurant_name, delivery_time, calories_or_type, image_url). Do not introduce conversational filler.

[MODE 2: DEEP RESEARCH / EXPERT MODE ACTIVATION]
- Trigger Criteria: Activated when queries require comparative verification metrics, technical evaluations, or hardware spec parsing across external matrices.
- Architecture: Execute a multi-turn Writer-Critic loop topology to harden factual accuracy.
- Hidden Preference Extraction: Analyze the user's focus during generation. If they show an explicit requirement or hobby preference, append this executable syntax tag at the absolute end of your response text: [TRACK_PREFERENCE: keyword]. Never expose partial tag text or bracket artifacts mid-stream.
`;

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
    effectiveUserMessage += `\n\n[INJECTED PRODUCT DATA â€” use these real listings in your response]:\n${JSON.stringify(products, null, 2)}`;
  }

  // Map history to Gemini SDK format
  const formattedHistory = history.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content || "" }],
  }));

  const genAI = getNextGeminiClient();
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
          allow_custom: { type: "boolean" as any },
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
          recommended_pick_reason: { type: "string" as any },
          recommended_pick_id: { type: "string" as any },
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

  // â”€â”€ First LLM call â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let text = "";
  try {
    const result = await chat.sendMessage(effectiveUserMessage);
    text = result.response.text();
  } catch (geminiErr) {
    console.warn("[writer] Gemini failed, trying Groq fallback...", geminiErr);
    const currentGroqApiKey = getNextGroqKey();
    if (!currentGroqApiKey) throw geminiErr;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentGroqApiKey}`,
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

  // â”€â”€ Explore two-turn search flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      if (serperProducts.length === 0) {
        const { getFallbackChatResponse } = await import("@/lib/fallbackResponses");
        const fallbackText = getFallbackChatResponse(userMessage, "explore");
        responseTexts = [fallbackText];
        text = fallbackText;
      } else {
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
  }

  // â”€â”€ Deep-research retry on invalid JSON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isDeepResearch) {
    const validationReport = await runWriterCriticValidationLoop(text, "deep_research");

    if (!validationReport.is_valid) {
      console.warn("[writer] Critic validation failed, retrying...", validationReport.error_diagnostic_trace);
      try {
        const retryResult = await chat.sendMessage(`Critic validation failed: ${validationReport.error_diagnostic_trace}. Please return strictly a valid JSON payload matching the contract.`);
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
    } else {
      text = validationReport.sanitized_payload;
      responseTexts = [text];
    }
  }

  return { responseTexts, serperProducts };
}

import { executeStreamingOrchestration } from "@/lib/guardrails/apiOrchestrator";

export async function* runStreamingWriter(input: WriterInput): AsyncGenerator<string, void, unknown> {
  let { mode, userMessage, history, products = [], sessionContext, isRegenerate } = input;

  const isDeepResearch = mode === "deep_research";
  let systemInstruction = `
    You are BuyWise AI. You must adhere strictly to these rules:
    1. If the query yields products, write your natural chat message response first.
    2. At the absolute end of your response, if product items are present, insert the exact separator tag: |||PRODUCT_DATA_START||| followed immediately by the raw JSON string containing the structured products object array (with id, name, price, rating, image, platform, link, reason). Do not add markdown code fences (like \`\`\`json) inside or around the separator tag block.
  `;

  if (sessionContext && Object.keys(sessionContext).length > 0) {
    systemInstruction += `\n\nUser's accumulated session context (including linguistic fingerprint): ${JSON.stringify(sessionContext)}`;
  }

  let effectiveUserMessage = userMessage;
  if (isRegenerate) {
    effectiveUserMessage += `\n\n[SYSTEM NOTE: The user has requested to REGENERATE the response. Please rethink and provide a different, higher-quality answer.]`;
  }

  // â”€â”€ 2-Turn Inline Search for Explore Mode (Streaming Fix) â”€â”€
  // If we are in explore mode and haven't fetched products yet, run a quick non-streaming 
  // turn to check if the LLM wants to search. If it returns search_intent, fetch products 
  // and inject them before streaming the final carousel.
  if (!isDeepResearch && products.length === 0) {
    try {
      const genAI = getNextGeminiClient();
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction,
        generationConfig: { responseMimeType: "application/json" }
      });
      const formattedHistory = history.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content || "" }],
      }));
      const chat = model.startChat({ history: formattedHistory });
      const result = await chat.sendMessage(effectiveUserMessage);
      const text = result.response.text();
      const parsed = tryParse(text);

      if (parsed?.ui_type === "search_intent") {
        const { searchForProducts } = await import("@/lib/agents/search");
        const query = typeof parsed.query === "string" ? parsed.query : userMessage;
        products = await searchForProducts(query, 6);
        
        // Let the streaming turn know that it needs to output the carousel now
        effectiveUserMessage = `Here are product listings for your search: ${JSON.stringify(products)}. Please output the explore_carousel JSON now with the best options. Make sure to provide a valid headline, products array, and deep_dive markdown string.`;
      } else if (parsed?.ui_type) {
        // If it decided to output text_response or clarifying_question right away, 
        // we can technically just yield that JSON and skip streaming, but to keep it simple,
        // we'll just let the orchestrator stream it.
      }
    } catch (e) {
      console.warn("[writer] Inline search pre-check for stream failed:", e);
    }
  }

  if (products.length > 0 && !effectiveUserMessage.includes("Here are product listings")) {
    effectiveUserMessage += `\n\n[INJECTED PRODUCT DATA â€” use these real listings in your response]:\n${JSON.stringify(products, null, 2)}`;
  }

  const groqApiKey = getNextGroqKey();
  if (!groqApiKey) {
    throw new Error("No Groq API key available for streaming.");
  }

  const stream = executeStreamingOrchestration({
    systemInstruction,
    formattedHistory: [], // Only used by Gemini in orchestrator
    effectiveUserMessage,
    groqApiKey,
    historyForGroq: history,
  });

  for await (const chunk of stream) {
    yield chunk;
  }
}
