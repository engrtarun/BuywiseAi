/**
 * src/lib/providers/test-serper.ts
 * Implements Step 01: Pulls text content fields from the top 15 links via Serper
 * and passes them into the Reranking Architecture Protocol v4.0.
 */

import { runRerankingPipeline, type RerankedContext } from "../retrieval/index";
import { getNextSerperKey } from "@/lib/agents/keyManager";
import { env } from "@/lib/env";

export async function executeRerankedSearch(query: string): Promise<RerankedContext> {
  // We'll try up to 3 times (the number of fallback keys) to allow failover
  const numKeys = (env.SERPER_API_KEYS?.length > 0) ? env.SERPER_API_KEYS.length : 3;

  let lastErrorMsg = "";

  for (let i = 0; i < numKeys; i++) {
    const apiKey = getNextSerperKey();
    if (!apiKey) break;

    try {
      // Fetch top 15 organic search results
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, gl: "in", hl: "en", num: 15 }),
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          console.warn(`[test-serper] Key exhausted or rate-limited. Trying next key...`);
          lastErrorMsg = `Serper Organic Search failed with status ${response.status}`;
          continue;
        }
        console.warn(`[test-serper] Serper API error: ${response.status}`);
        return { primary: [], secondary: [], error: `Serper Organic Search failed with status ${response.status}` };
      }

      const data = await response.json();
      const organic = data.organic || [];
      const urls: string[] = organic.map((r: { link?: string }) => r.link).filter(Boolean);

      if (urls.length === 0) return { primary: [], secondary: [], error: "No organic URLs found" };

      // Trigger Steps 02 through 06 in the Reranking Pipeline
      const rerankedContext = await runRerankingPipeline(query, urls.slice(0, 15));
      
      return rerankedContext;
    } catch (err: any) {
      console.warn("[test-serper] Execution failed:", err.message || err);
      // For fetch network errors, we don't necessarily retry all keys as it's likely a global network issue,
      // but to be safe, we can just return.
      return { primary: [], secondary: [], error: "Serper Organic Search execution failed" };
    }
  }

  return { primary: [], secondary: [], error: lastErrorMsg || "All Serper API keys failed" };
}
