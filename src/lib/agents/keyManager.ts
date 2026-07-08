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

export async function executeWithGeminiFailover<T>(
  fn: (client: GoogleGenerativeAI) => Promise<T>
): Promise<T> {
  const keys = env.GEMINI_API_KEYS;
  if (!keys || keys.length === 0) {
    throw new Error("No Gemini API keys configured");
  }

  let lastError: any = null;
  for (let i = 0; i < keys.length; i++) {
    const targetIndex = (geminiKeyIndex + i) % keys.length;
    const currentKey = keys[targetIndex];
    const client = new GoogleGenerativeAI(currentKey);
    try {
      const result = await fn(client);
      // Update index so that subsequent queries start with the successful key
      geminiKeyIndex = targetIndex;
      return result;
    } catch (err: any) {
      console.warn(`[keyManager] Gemini API call failed with key index ${targetIndex}, trying next:`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini API keys failed");
}
