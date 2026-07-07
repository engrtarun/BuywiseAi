import { env } from "@/lib/env";
import { GoogleGenerativeAI } from "@google/generative-ai";

let geminiKeyIndex = 0;
let groqKeyIndex = 0;

export function getNextGeminiClient() {
  if (!env.GEMINI_API_KEYS || env.GEMINI_API_KEYS.length === 0) {
    throw new Error("No Gemini API keys configured");
  }
  const key = env.GEMINI_API_KEYS[geminiKeyIndex % env.GEMINI_API_KEYS.length];
  geminiKeyIndex++;
  return new GoogleGenerativeAI(key);
}

export function getNextGroqKey() {
  if (!env.GROQ_API_KEY || env.GROQ_API_KEY.length === 0) {
    return undefined;
  }
  const key = env.GROQ_API_KEY[groqKeyIndex % env.GROQ_API_KEY.length];
  groqKeyIndex++;
  return key;
}
