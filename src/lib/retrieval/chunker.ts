/**
 * src/lib/retrieval/chunker.ts
 * Implements Step 03: Sliding-Window Chunking
 */

export interface TextChunk {
  url: string;
  text: string;
  index: number;
}

/**
 * Splits document texts into granular text chunks based on constraints:
 * - Window limit: 400 characters (~150 tokens)
 * - Overlap boundary: exactly 50 characters between subsequent arrays
 */
export function slidingWindowChunker(pages: { url: string; text: string }[]): TextChunk[] {
  const chunks: TextChunk[] = [];
  const WINDOW_SIZE = 400;
  const OVERLAP = 50;
  const STEP = WINDOW_SIZE - OVERLAP;
  
  let chunkIndex = 0;

  for (const page of pages) {
    if (!page.text) continue;
    
    for (let i = 0; i < page.text.length; i += STEP) {
      const chunkText = page.text.substring(i, i + WINDOW_SIZE).trim();
      
      // Filter out overly small, non-contextual garbage nodes at the tail ends
      if (chunkText.length > OVERLAP) {
        chunks.push({
          url: page.url,
          text: chunkText,
          index: chunkIndex++
        });
      }
    }
  }
  
  return chunks;
}
