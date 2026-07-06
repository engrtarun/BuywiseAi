/**
 * src/lib/retrieval/index.ts
 * Integrates the BUYWISE-AI RERANKING ARCHITECTURE PROTOCOL v4.0
 */

import { scrapeWebText } from "./scraper";
import { slidingWindowChunker, type TextChunk } from "./chunker";
import { scoreChunks, type ScoredChunk } from "./crossEncoder";

export interface RerankedContext {
  primary: ScoredChunk[];    // S >= 0.85
  secondary: ScoredChunk[];  // 0.50 <= S < 0.85
}

/**
 * Executes the full Step 01 -> Step 06 pipeline
 */
export async function runRerankingPipeline(query: string, urls: string[]): Promise<RerankedContext> {
  // Step 01 & 02: Scrape and sanitize
  const pages = await scrapeWebText(urls);
  
  // Step 03: Sliding window chunks
  const chunks = slidingWindowChunker(pages);
  
  // Step 04 & 05: Cross encoder scoring and sorting
  const scored = await scoreChunks(query, chunks);
  
  // Step 06: Context Consolidation
  const primary: ScoredChunk[] = [];
  const secondary: ScoredChunk[] = [];
  
  for (const item of scored) {
    if (item.score >= 0.85) {
      primary.push(item);
    } else if (item.score >= 0.50) {
      secondary.push(item);
    }
    // S < 0.50 is immediately dropped
  }
  
  return { primary, secondary };
}
