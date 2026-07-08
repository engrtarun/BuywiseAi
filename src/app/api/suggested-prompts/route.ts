import { NextResponse } from "next/server";
import { getNextGroqKey } from "@/lib/agents/keyManager";

const SYSTEM_PROMPT = `
You are BuyWise AI's onboarding assistant. Your job is to generate EXACTLY 4 short, natural, and varied shopping-related suggested prompts for the user to click on.

Rules:
1. Return ONLY a valid JSON object with a single key "prompts" mapping to an array of 4 strings. No markdown formatting, no code blocks, no intro/outro text. Example: {"prompts": ["string1", "string2", "string3", "string4"]}
2. The strings should be short (under 10 words).
3. They should be natural phrases a user would type, like "Find best wireless headphones under ₹5000" or "Compare top washing machines".
4. If the user provides past history/interests, make at least 2 of the prompts related to their interests (follow-ups or complementary items) and 2 new varied items.
5. If no history is provided, generate 4 popular, diverse shopping prompts (e.g. tech, home appliances, fashion, gifts).
6. Ensure variety so it's not the exact same 4 every time.
`;

export async function POST(req: Request) {
  try {
    const { historySummaries } = await req.json().catch(() => ({ historySummaries: [] }));
    const groqApiKey = getNextGroqKey();

    if (!groqApiKey) {
      return NextResponse.json({ error: "Missing Groq API Key" }, { status: 500 });
    }

    const userMessage = historySummaries && historySummaries.length > 0
      ? `Based on this user's past shopping queries/interests: ${JSON.stringify(historySummaries)}, generate 4 short, natural, varied shopping-related suggested prompts they might want to ask next.`
      : "The user has no past history. Generate 4 generic but diverse popular shopping prompts.";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Fast and cheap model for this
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Clean up if the model wrapped it in markdown
    if (content.startsWith("```json")) {
      content = content.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (content.startsWith("```")) {
      content = content.replace(/^```/, "").replace(/```$/, "").trim();
    }

    // It might return {"prompts": [...]} or just [...]
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse Groq response:", content);
      throw new Error("Invalid JSON from Groq");
    }

    let prompts: string[] = [];
    if (Array.isArray(parsed)) {
      prompts = parsed;
    } else if (parsed.prompts && Array.isArray(parsed.prompts)) {
      prompts = parsed.prompts;
    } else {
      const vals = Object.values(parsed);
      if (Array.isArray(vals[0])) {
        prompts = vals[0] as string[];
      }
    }

    if (!prompts || prompts.length !== 4) {
      // Fallback
      prompts = [
        "Find best wireless headphones under ₹5,000",
        "Compare top 3 washing machines",
        "Best budget smartphones under ₹15,000",
        "Suggest a gift for a 25-year-old"
      ];
    }

    return NextResponse.json({ prompts: prompts.slice(0, 4) });

  } catch (error) {
    console.error("Suggested prompts API error:", error);
    // Graceful fallback
    return NextResponse.json({
      prompts: [
        "Find best wireless headphones under ₹5,000",
        "Compare top 3 washing machines",
        "Best budget smartphones under ₹15,000",
        "Suggest a gift for a 25-year-old"
      ]
    });
  }
}
