import { NextResponse } from "next/server";
import { getNextGroqKey } from "@/lib/agents/keyManager";

export const dynamic = 'force-dynamic';

export async function GET() {
  const activeGroqKey = getNextGroqKey();
  if (!activeGroqKey) {
    // Return static default suggestions if Groq is not configured
    return NextResponse.json([
      "Find best wireless headphones under ₹5,000",
      "Compare top 3 washing machines for home",
      "Best budget smartphones under ₹15,000",
      "Find deals on laptops for college students"
    ]);
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${activeGroqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are suggestions engine for BuyWise AI. Generate exactly 4 diverse and highly scannable shopping prompts. Use a mix of plain English and clean Romanized Hinglish (e.g. 'mujhe running shoes chahiye' or 'compare iPhone 15 vs Samsung S23'). Do not add any bullet points or numbering. Return ONLY a valid JSON string containing an array of 4 strings.",
          },
          {
            role: "user",
            content: "Generate 4 fresh suggestions.",
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    });

    if (!response.ok) throw new Error("Groq API request failed");
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content);
    
    // Support either direct array or wrapping object
    const suggestionsArray = Array.isArray(parsed) ? parsed : parsed.suggestions || Object.values(parsed)[0];
    
    if (Array.isArray(suggestionsArray) && suggestionsArray.length >= 4) {
      return NextResponse.json(suggestionsArray.slice(0, 4));
    }
    
    throw new Error("Invalid suggestions format from Groq");
  } catch (err) {
    console.error("Failed to generate Groq suggestions:", err);
    // Dynamic list fallback
    return NextResponse.json([
      "Find best wireless headphones under ₹5,000",
      "Compare top 3 washing machines for home",
      "Best budget smartphones under ₹15,000",
      "Find deals on laptops for college students"
    ]);
  }
}
