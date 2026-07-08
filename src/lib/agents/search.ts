/**
 * src/lib/agents/search.ts
 *
 * Product search agent for BuyWise AI.
 *
 * Takes a set of extracted keywords / requirements and calls the Serper
 * Shopping API (India geo) to retrieve real, live product listings.
 * Returns a clean, normalised array — no mock data, no fallback catalog.
 *
 * Error handling:
 *   - If Serper is unreachable or returns a non-2xx status, the function
 *     throws so the caller can decide how to recover (e.g. show a friendly
 *     message rather than silently serving stale data).
 */

import { searchShoppingIndia } from "@/lib/providers/serper";

/** The clean shape returned by this agent. */
export interface SearchedProduct {
  title: string;
  price: number;        // INR integer; 0 when not available
  rating: number | null;
  reviewCount: number | null;
  image: string;
  store: string;        // e.g. "Amazon", "Flipkart", "Google Shopping"
  url: string;
}

/**
 * searchForProducts
 *
 * Sends `keywords` to the Serper Shopping API and returns up to `limit`
 * normalised products.
 *
 * @param keywords  - A concise search query built from the user's requirements
 *                    (e.g. "budget gaming laptop under 60000 rupees")
 * @param limit     - Max results to return (default: 8)
 * @throws          - Rethrows Serper errors so the caller can handle them
 */
export async function searchForProducts(
  keywords: string,
  limit = 8
): Promise<SearchedProduct[]> {
  const raw = await searchShoppingIndia(keywords);

  // Group by store and limit to 2 per store
  const storeCounts: Record<string, number> = {};
  const diverseProducts = raw.filter((item) => {
    const store = (item.platform || "Google Shopping").toLowerCase();
    storeCounts[store] = (storeCounts[store] || 0) + 1;
    return storeCounts[store] <= 2;
  });

  // Shuffle the diverse products to ensure variety on regenerate
  const shuffled = diverseProducts.sort(() => Math.random() - 0.5);

  return shuffled.slice(0, limit).map((item) => ({
    title: item.name,
    price: item.price,
    rating: item.rating,
    reviewCount: item.reviewCount,
    image: item.image,
    store: item.platform,
    url: item.url,
  }));
}
