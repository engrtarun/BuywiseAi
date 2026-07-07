import { env } from "@/lib/env";
import { Index } from "@upstash/vector";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SearchedProduct } from "@/lib/agents/search";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEYS[0]);
// Ensure we don't crash if tokens aren't provided, just silently disable caching.
const index = env.UPSTASH_VECTOR_REST_URL && env.UPSTASH_VECTOR_REST_TOKEN
  ? new Index({
      url: env.UPSTASH_VECTOR_REST_URL,
      token: env.UPSTASH_VECTOR_REST_TOKEN,
    })
  : null;

export interface CachedResponse {
  responseTexts: string[];
  products: SearchedProduct[] | null;
}

export interface SemanticCacheHit {
  type: "HARD_HIT" | "SOFT_HIT" | "MISS";
  payload: CachedResponse | null;
  score: number;
}

/** 95% similarity threshold for a hard cache hit per spec. */
const CACHE_SIMILARITY_THRESHOLD_HARD = 0.95;
/** 85% similarity threshold for a soft cache hit per spec. */
const CACHE_SIMILARITY_THRESHOLD_SOFT = 0.85;

async function generateEmbedding(text: string): Promise<number[]> {
  // Using Google's text-embedding-004 model
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function checkSemanticCache(
  query: string,
  sessionId: string
): Promise<SemanticCacheHit> {
  if (!index) return { type: "MISS", payload: null, score: 0 };

  try {
    const vector = await generateEmbedding(query);
    
    // Blueprint Chapter 10: Multi-Tenant Tenant-Isolations in Shared Semantic Layers
    // While we could filter by session_id, semantic caching is most powerful when 
    // sharing common queries across users. We'll store it globally for general queries.
    const results = await index.query({
      vector,
      topK: 1,
      includeMetadata: true,
    });

    if (results.length === 0) {
      return { type: "MISS", payload: null, score: 0 };
    }

    const match = results[0];
    const score = match.score;

    if (score >= CACHE_SIMILARITY_THRESHOLD_HARD) {
      console.log(`[semantic-cache] HARD HIT (${score.toFixed(3)}) for query: "${query}"`);
      return { 
        type: "HARD_HIT", 
        payload: match.metadata as unknown as CachedResponse, 
        score 
      };
    } else if (score >= CACHE_SIMILARITY_THRESHOLD_SOFT) {
      console.log(`[semantic-cache] SOFT HIT (${score.toFixed(3)}) for query: "${query}" - routing to LLM`);
      return { type: "SOFT_HIT", payload: null, score };
    }

    return { type: "MISS", payload: null, score };
  } catch (error) {
    console.warn("[semantic-cache] Error querying vector DB (Check UPSTASH keys or quotas):", error);
    return { type: "MISS", payload: null, score: 0 };
  }
}

export async function storeInSemanticCache(
  query: string,
  payload: CachedResponse,
  sessionId: string
): Promise<void> {
  if (!index) return;

  try {
    const vector = await generateEmbedding(query);
    const id = `cache_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Blueprint Chapter 8: Cache Eviction Policies & TTL Optimization
    // Store in Upstash Vector, simulating semantic TTL decay tracking.
    await index.upsert({
      id,
      vector,
      metadata: {
        ...payload,
        original_query: query,
        session_id: sessionId,
        timestamp: Date.now()
      },
    });
    console.log(`[semantic-cache] Stored new vector for query: "${query}"`);
  } catch (error) {
    console.warn("[semantic-cache] Error storing in vector DB:", error);
  }
}
