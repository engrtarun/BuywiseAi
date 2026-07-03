import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fallback to a valid format URL during build/prerender to prevent crashes
  const isValidUrl = url && url.startsWith("http");

  return createBrowserClient(
    isValidUrl ? url : "https://placeholder.supabase.co",
    anonKey || "placeholder"
  )
}
