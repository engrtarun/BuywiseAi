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
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   env.GEMINI_API_KEY  // ✅ typed string, guaranteed non-empty
 */

import { z } from "zod";

const isServer = typeof window === "undefined";
const isProduction = process.env.NODE_ENV === "production";

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
  GEMINI_API_KEYS: z.string().trim().min(1, "GEMINI_API_KEYS is required").transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
  GROQ_API_KEY: z.string().trim().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : []),
  // Optional: when absent the app falls back to FakeStore product data.
  SERPER_API_KEY: z.string().trim().optional(),
});

const envSchema = isServer ? serverEnvSchema : clientEnvSchema;

const rawEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ...(isServer ? { GEMINI_API_KEYS: process.env.GEMINI_API_KEYS, GROQ_API_KEY: process.env.GROQ_API_KEY, SERPER_API_KEY: process.env.SERPER_API_KEY } : {}),
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
    GEMINI_API_KEYS: (process.env.GEMINI_API_KEYS || "").split(',').map(s => s.trim()).filter(Boolean),
    GROQ_API_KEY: (process.env.GROQ_API_KEY || "").split(',').map(s => s.trim()).filter(Boolean),
    SERPER_API_KEY: process.env.SERPER_API_KEY 
  } : {}),
};

export const env = (parsedResult.success ? parsedResult.data : fallbackEnv) as z.infer<typeof serverEnvSchema>;
export type Env = z.infer<typeof serverEnvSchema>;
