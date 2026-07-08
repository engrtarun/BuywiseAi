/**
 * lib/env.ts
 *
 * Validated, typed environment configuration using Zod.
 * All required environment variables are validated at module load time,
 * so the app fails fast at startup/build rather than at runtime on a
 * specific route.
 *
 * Import `env` from this file instead of using `process.env` directly —
 * you get full TypeScript autocomplete and a guarantee the value exists.
 */

import { z } from "zod";

const isServer = typeof window === "undefined";
const isProduction = process.env.NODE_ENV === "production";

function gatherSequentialEnvKeys(prefix: string, filterFn?: (val: string) => boolean): string[] {
  if (!isServer) return [];
  const keys: string[] = [];
  let index = 1;
  while (true) {
    const valWithUnderscore = process.env[`${prefix}_${index}`];
    const valNoUnderscore = process.env[`${prefix}${index}`];
    const val = valWithUnderscore || valNoUnderscore;
    if (val) {
      let trimmed = val.trim();
      // Strip any leading/trailing single or double quotes
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        trimmed = trimmed.substring(1, trimmed.length - 1).trim();
      }
      if (!filterFn || filterFn(trimmed)) {
        keys.push(trimmed);
      }
      index++;
    } else {
      break;
    }
  }
  
  // Fallback to legacy single comma-separated variable if no sequential ones exist
  if (keys.length === 0) {
    const legacyVal = process.env[`${prefix}S`] || process.env[prefix];
    if (legacyVal) {
      return legacyVal
        .split(",")
        .map((s) => {
          let trimmed = s.trim();
          if (
            (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))
          ) {
            trimmed = trimmed.substring(1, trimmed.length - 1).trim();
          }
          return trimmed;
        })
        .filter(Boolean)
        .filter((k) => !filterFn || filterFn(k));
    }
  }
  
  return keys;
}

const clientEnvSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z
      .string()
      .trim()
      .min(1, "NEXT_PUBLIC_SUPABASE_URL is required")
      .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),

    NEXT_PUBLIC_SUPABASE_ANON_KEY: z
      .string()
      .trim()
      .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  })
  .strict();

const serverEnvSchema = clientEnvSchema.extend({
  GEMINI_API_KEYS: z.array(z.string().min(1)).min(1, "At least one GEMINI_API_KEY is required"),
  GROQ_API_KEY: z.array(z.string()).default([]),
  // Optional: when absent the app falls back to FakeStore product data.
  SERPER_API_KEY: z.string().trim().optional(),
  UPSTASH_VECTOR_REST_URL: z.string().trim().optional(),
  UPSTASH_VECTOR_REST_TOKEN: z.string().trim().optional(),
});

const envSchema = isServer ? serverEnvSchema : clientEnvSchema;

const geminiKeys = gatherSequentialEnvKeys("GEMINI_API_KEY");
const groqKeys = gatherSequentialEnvKeys("GROQ_API_KEY", (k) => k.startsWith("gsk_"));

const rawEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ...(isServer ? { 
    GEMINI_API_KEYS: geminiKeys, 
    GROQ_API_KEY: groqKeys, 
    SERPER_API_KEY: process.env.SERPER_API_KEY, 
    UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL, 
    UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN 
  } : {}),
};

const parsedResult = envSchema.safeParse(rawEnv);

if (!parsedResult.success && isServer && isProduction) {
  const formatted = parsedResult.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");

  throw new Error(
    `Missing/invalid environment variables:\n${formatted}\n\n` +
      `Check your .env.local file. See .env.example for required variables.`
  );
}

const fallbackEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  ...(isServer ? { 
    GEMINI_API_KEYS: geminiKeys,
    GROQ_API_KEY: groqKeys,
    SERPER_API_KEY: process.env.SERPER_API_KEY,
    UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
    UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN
  } : {}),
};

export const env = (parsedResult.success ? parsedResult.data : fallbackEnv) as z.infer<typeof serverEnvSchema>;
export type Env = z.infer<typeof serverEnvSchema>;

