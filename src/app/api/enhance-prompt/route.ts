import { NextResponse } from "next/server";
import { getNextGroqKey } from "@/lib/agents/keyManager";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = getNextGroqKey();
    if (!apiKey) {
      return NextResponse.json({ error: "No API keys configured" }, { status: 500 });
    }

    const systemPrompt = `You are a shopping prompt engineer for BuyWise AI. Your job is to take a user's short or vague shopping query and expand it into a highly detailed, comprehensive prompt that will yield the best possible results from the main AI. 

Follow these rules:
1. Make it specific (add details like budget range, use cases, preferences if they make sense).
2. Keep it natural and conversational.
3. Only return the enhanced prompt text. No quotes, no intro, no explanation. Just the enhanced prompt.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const enhancedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      throw new Error("Empty response from Groq");
    }

    return NextResponse.json({ enhancedPrompt });
  } catch (error) {
    console.error("[EnhancePrompt] Error:", error);
    return NextResponse.json(
      { error: "Failed to enhance prompt" },
      { status: 500 }
    );
  }
}
