import { env } from "@/lib/env";
import { GoogleGenerativeAI } from "@google/generative-ai";

let geminiKeyIndex = 0;
let groqKeyIndex = 0;
let serperKeyIndex = 0;

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

export function getNextSerperKey() {
  const fallbackKeys = [
    "7e1bc4c209c2b980597e5b5e3be408d07082c609",
    "3caee5f52382792cb8501f149a698ace9989feff",
    "7bf18ae35cdd9d966ccc2253089961547063277d"
  ];
  
  const keysToUse = (env.SERPER_API_KEYS && env.SERPER_API_KEYS.length > 0) 
    ? env.SERPER_API_KEYS 
    : fallbackKeys;

  const key = keysToUse[serperKeyIndex % keysToUse.length];
  serperKeyIndex++;
  return key;
}
