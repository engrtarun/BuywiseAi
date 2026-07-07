/**
 * src/lib/retrieval/index.ts
 * Integrates the BUYWISE-AI RERANKING ARCHITECTURE PROTOCOL v4.0
 */

import { scrapeWebText } from "./scraper";
import { slidingWindowChunker } from "./chunker";
import { scoreChunks, type ScoredChunk } from "./crossEncoder";

export interface RerankedContext {
  primary: ScoredChunk[];    // S >= 0.85
  secondary: ScoredChunk[];  // 0.50 <= S < 0.85
  error?: string;            // Signal if scraping failed completely
}

/**
 * Executes the full Step 01 -> Step 06 pipeline
 */
export async function runRerankingPipeline(query: string, urls: string[]): Promise<RerankedContext> {
  // Step 01 & 02: Scrape and sanitize
  const scrapeResponse = await scrapeWebText(urls);
  
  if (!scrapeResponse.success) {
    return { primary: [], secondary: [], error: scrapeResponse.error };
  }
  
  // Step 03: Sliding window chunks
  const chunks = slidingWindowChunker(scrapeResponse.results);
  
  // Step 04 & 05: Cross encoder scoring and sorting
  const scored = await scoreChunks(query, chunks);
  
  // Step 06: Context Consolidation with Deduplication & Truncation
  const primary: ScoredChunk[] = [];
  const secondary: ScoredChunk[] = [];
  const seenTexts = new Set<string>();
  
  for (const item of scored) {
    if (seenTexts.has(item.text)) continue;
    
    if (item.score >= 0.85) {
      primary.push(item);
      seenTexts.add(item.text);
    } else if (item.score >= 0.50) {
      secondary.push(item);
      seenTexts.add(item.text);
    }
    // S < 0.50 is immediately dropped
  }
  
  // Truncate to avoid context window bloat and attention dilution
  return { 
    primary: primary.slice(0, 3), 
    secondary: secondary.slice(0, 2) 
  };
}
