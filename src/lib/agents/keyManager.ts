import { env } from "@/lib/env";
import { GoogleGenerativeAI } from "@google/generative-ai";

let geminiKeyIndex = 0;
let groqKeyIndex = 0;
let serperKeyIndex = 0;

export function getNextGeminiClient(): GoogleGenerativeAI {
  const numKeys = env.GEMINI_API_KEYS.length;
  const key = env.GEMINI_API_KEYS[geminiKeyIndex % numKeys];
  geminiKeyIndex++;
  return new GoogleGenerativeAI(key);
}

export function getNextGroqKey(): string {
  if (!env.GROQ_API_KEY || env.GROQ_API_KEY.length === 0) return "";
  const numKeys = env.GROQ_API_KEY.length;
  const key = env.GROQ_API_KEY[groqKeyIndex % numKeys];
  groqKeyIndex++;
  return key;
}

const fallbackSerperKeys = [
  "7e1bc4c209c2b980597e5b5e3be408d07082c609",
  "3caee5f52382792cb8501f149a698ace9989feff",
  "7bf18ae35cdd9d966ccc2253089961547063277d"
];

let allSerperKeys: string[] = [];

function initSerperKeys() {
  if (allSerperKeys.length > 0) return;
  const envKeys = (env.SERPER_API_KEYS && env.SERPER_API_KEYS.length > 0) 
    ? env.SERPER_API_KEYS.filter(k => k && k.trim() !== "") 
    : [];
  allSerperKeys = [...envKeys, ...fallbackSerperKeys];
}

export function getSerperKeysCount() {
  initSerperKeys();
  return allSerperKeys.length;
}

export function getNextSerperKey() {
  initSerperKeys();
  const key = allSerperKeys[serperKeyIndex % allSerperKeys.length];
  serperKeyIndex++;
  return key;
}
