import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request: JSON body is malformed or empty." },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: 'items' array is required." },
        { status: 400 }
      );
    }

    const itemsList = body.items.join(", ");
    
    const prompt = `Act as a savage fashion influencer and rate this outfit combination in 2 lines: [${itemsList}]. Also provide a numeric match score from 0-100 as the first line in the exact format 'SCORE: XX', followed by your 2-line witty commentary.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.8,
      },
    });

    const responseText = result.response.text();
    
    // Parse the response
    const scoreMatch = responseText.match(/SCORE:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 50; // default to 50 if parsing fails
    
    // Extract commentary by removing the SCORE line
    const commentary = responseText.replace(/SCORE:\s*\d+/i, '').trim();

    return NextResponse.json({ score, commentary });
    
  } catch (error: any) {
    if (isRateLimitError(error)) {
      console.error("Gemini API rate limit hit in outfit rating.");
      return NextResponse.json({
        score: 65,
        commentary: "Gemini is exhausted from too many requests. We'll safely assume this fit is mid. Try again later!"
      });
    }

    console.error("Gemini API failed in outfit rating:", error);
    return NextResponse.json({
      score: 50,
      commentary: "Our fashion AI is currently offline. You do you!"
    });
  }
}

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  
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
