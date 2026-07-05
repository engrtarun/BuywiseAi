/**
 * src/lib/productSearch.ts
 *
 * Primary product-search abstraction for BuyWise AI.
 *
 * Strategy:
 *   1. Try Serper.dev shopping search (real India products, caches 1 h).
 *   2. If Serper fails (no key, network error, empty results) fall back to the
 *      FakeStore API — the same source used by /api/quick-buy.
 *
 * All callers receive a consistent NormalisedProduct[] array regardless of
 * which source was used.
 */

import { searchShoppingIndia, type SerperProduct } from "@/lib/providers/serper";

/** Unified product shape used throughout the app. */
export interface NormalisedProduct {
  id: string;
  name: string;
  /** INR numeric price */
  price: number;
  image: string;
  platform: string;
  url: string;
  rating: number | null;
  /** Which data source produced this result */
  source: "serper" | "fakestore";
}

// ─── FakeStore fallback ───────────────────────────────────────────────────────

interface FakeStoreProduct {
  id: number;
  title: string;
  price: number;
  image: string;
  rating?: { rate?: number };
  category?: string;
}

async function fetchFakeStoreProducts(
  query: string,
  limit = 10
): Promise<NormalisedProduct[]> {
  const res = await fetch("https://fakestoreapi.com/products", {
    cache: "force-cache",
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`FakeStore responded with ${res.status}`);

  const all: FakeStoreProduct[] = await res.json();
  const lq = query.toLowerCase();

  // Simple relevance filter — prefer title/category matches
  const filtered = all
    .filter(
      (p) =>
        p.title.toLowerCase().includes(lq) ||
        (p.category ?? "").toLowerCase().includes(lq)
    )
    .slice(0, limit);

  // If nothing matches, return the first `limit` items
  const results = filtered.length > 0 ? filtered : all.slice(0, limit);

  return results.map((p) => ({
    id: String(p.id),
    name: p.title,
    // Convert USD → INR (rough 85× multiplier, same as quick-buy route)
    price: Math.round(p.price * 85),
    image: p.image,
    platform: "FakeStore",
    url: `https://fakestoreapi.com/products/${p.id}`,
    rating: p.rating?.rate ?? null,
    source: "fakestore" as const,
  }));
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * searchProducts
 *
 * Searches for products matching `query`, targeting the Indian market.
 * Returns up to `limit` normalised results.
 *
 * @param query  - Free-text product search query
 * @param limit  - Maximum results to return (default 10)
 */
export async function searchProducts(
  query: string,
  limit = 10
): Promise<NormalisedProduct[]> {
  // ── Primary: Serper ────────────────────────────────────────────────────────
  if (process.env.SERPER_API_KEY) {
    try {
      const serperResults = await searchShoppingIndia(query);

      if (serperResults.length > 0) {
        return serperResults.slice(0, limit).map(
          (p: SerperProduct, i: number): NormalisedProduct => ({
            id: `serper-${i}-${Date.now()}`,
            name: p.name,
            price: p.price,
            image: p.image,
            platform: p.platform,
            url: p.url,
            rating: p.rating,
            source: "serper",
          })
        );
      }

      console.warn(
        "[productSearch] Serper returned 0 results for query:",
        query,
        "— falling back to FakeStore."
      );
    } catch (err) {
      console.error(
        "[productSearch] Serper call failed — falling back to FakeStore:",
        err
      );
    }
  } else {
    console.warn(
      "[productSearch] SERPER_API_KEY not set — using FakeStore fallback."
    );
  }

  // ── Fallback: FakeStore ────────────────────────────────────────────────────
  try {
    return await fetchFakeStoreProducts(query, limit);
  } catch (err) {
    console.error("[productSearch] FakeStore fallback also failed:", err);
    return [];
  }
}
