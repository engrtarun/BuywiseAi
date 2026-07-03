
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// IMPORTANT: Set up your Gemini API key as an environment variable
// Create a .env.local file in the project root and add the following line:
// GEMINI_API_KEY=your_gemini_api_key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * API route handler for processing chat messages.
 *
 * It receives the chat history and the user's message, then uses the
 * Google Generative AI SDK to get a response from the Gemini model.
 *
 * @param {NextRequest} req The incoming Next.js API request object.
 * @returns {Promise<NextResponse>} A Next.js API response object with the
 *   AI's text response.
 */
export async function POST(req: NextRequest) {
  try {
    const { history, message } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "Gemini API key is not configured.",
          message: "Please set up your Gemini API key as an environment variable. Create a .env.local file in the project root and add the following line: GEMINI_API_KEY=your_gemini_api_key",
        },
        { status: 500 }
      );
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("[API/chat] Error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request." },
      { status: 500 }
    );
  }
}
