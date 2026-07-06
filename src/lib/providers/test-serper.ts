/**
 * src/lib/providers/test-serper.ts
 * Implements Step 01: Pulls text content fields from the top 15 links via Serper
 * and passes them into the Reranking Architecture Protocol v4.0.
 */

import { runRerankingPipeline, type RerankedContext } from "../retrieval/index";

export async function executeRerankedSearch(query: string): Promise<RerankedContext | null> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.warn("[test-serper] SERPER_API_KEY not found. Skipping reranked search.");
    return null;
  }

  try {
    // Fetch top 15 organic search results
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, gl: "in", num: 15 }),
    });

    if (!response.ok) {
      console.error(`[test-serper] Serper API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const organic = data.organic || [];
    const urls: string[] = organic.map((r: { link?: string }) => r.link).filter(Boolean);

    if (urls.length === 0) return null;

    // Trigger Steps 02 through 06 in the Reranking Pipeline
    const rerankedContext = await runRerankingPipeline(query, urls.slice(0, 15));
    
    return rerankedContext;
  } catch (err) {
    console.error("[test-serper] Execution failed:", err);
    return null;
  }
}
