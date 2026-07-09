/**
 * src/lib/providers/serper.ts
 *
 * Thin wrapper around the Serper.dev Shopping API for India product search.
 *
 * Confirmed live response field names (2026-07-06):
 *   title        – product name string
 *   source       – platform / seller name (e.g. "Flipkart", "Amazon")
 *   link         – product URL (Google Shopping link)
 *   price        – price string, e.g. "?2,699" (rupee symbol may render as "?")
 *   imageUrl     – product image URL (encrypted-tbn Google CDN)
 *   rating       – number or absent
 *   ratingCount  – number or absent
 *   productId    – string catalog ID
 *   position     – 1-based rank in the result set
 */

const SERPER_ENDPOINT = "https://google.serper.dev/shopping";

/** Normalised product shape used across the BuyWise app. */
export interface SerperProduct {
  name: string;
  price: number;       // numeric INR value; 0 if unparseable
  image: string;
  platform: string;
  url: string;
  rating: number | null;
  reviewCount: number | null;
}

/** Raw shape returned by Serper (only the fields we use). */
interface SerperShoppingItem {
  title?: string;
  source?: string;
  link?: string;
  price?: string;
  imageUrl?: string;
  rating?: number;
  ratingCount?: number;
}

/**
 * Parse a Serper price string (e.g. "?2,699", "₹14,999", "Rs. 5,499") into
 * an integer INR value. Returns 0 when the string cannot be parsed.
 */
function parsePrice(raw: string | undefined): number {
  if (!raw) return 0;
  // Strip everything that isn't a digit or decimal point
  const digits = raw.replace(/[^\d.]/g, "");
  const parsed = parseFloat(digits);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

/**
 * searchShoppingIndia
 *
 * POSTs to google.serper.dev/shopping with India geo-location.
 * fetch is called with `next: { revalidate: 3600 }` so Next.js caches
 * results for 1 hour, conserving free API credits.
 *
 * @param query  - Shopping search query string
 * @returns      - Array of normalised SerperProduct objects (may be empty)
 * @throws       - Rethrows on network / API key errors so callers can handle
 */
import { getNextSerperKey } from "@/lib/agents/keyManager";
import { env } from "@/lib/env";

export async function searchShoppingIndia(
  query: string
): Promise<SerperProduct[]> {
  const numKeys = env.SERPER_API_KEYS?.length || 0;
  if (numKeys === 0) {
    throw new Error(
      "[serper] SERPER_API_KEYS is not set. Add it to .env.local and src/lib/env.ts."
    );
  }

  let lastError: Error | null = null;
  
  for (let i = 0; i < numKeys; i++) {
    const apiKey = getNextSerperKey();
    if (!apiKey) break;

    const response = await fetch(SERPER_ENDPOINT, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, gl: "in", hl: "en" })
    });

    if (!response.ok) {
      const errText = await response.text();
      lastError = new Error(`[serper] API responded with ${response.status}: ${errText}`);
      
      // If unauthorized/forbidden (often means out of credits) or rate limited, try next key.
      if (response.status === 403 || response.status === 429) {
        console.warn(`[serper] Key exhausted or rate-limited. Trying next key...`);
        continue;
      }
      
      // For other errors (like 400 Bad Request), it's likely a query issue, not a key issue.
      throw lastError;
    }

    const data = (await response.json()) as { shopping?: SerperShoppingItem[] };
    const items = data.shopping ?? [];

    return items.map(
      (item): SerperProduct => ({
        name: item.title ?? "Unknown Product",
        price: parsePrice(item.price),
        image: item.imageUrl ?? "",
        platform: item.source ?? "Google Shopping",
        url: item.link ?? "",
        rating: typeof item.rating === "number" ? item.rating : null,
        reviewCount: typeof item.ratingCount === "number" ? item.ratingCount : null,
      })
    );
  }

  throw lastError || new Error("[serper] All Serper API keys failed.");
}

