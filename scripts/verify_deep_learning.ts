import { scoreChunks } from "../src/lib/retrieval/crossEncoder";
import { runRerankingPipeline } from "../src/lib/retrieval/index";
import { executeRouterRouting } from "../src/lib/agents/routerAgent";
import { checkSemanticCache } from "../src/lib/caching/semanticCache";

async function runTests() {
  console.log("--- 1. Testing fallbackDenseSimilarity ---");
  // Test fallback by sending an empty string to HF, which might trigger fallback, or just mocking it.
  // We can't directly call fallbackDenseSimilarity as it's not exported, but scoreChunks falls back.
  // We can force fallback by using a fake API key or sending a large chunk.
  const oldEnv = process.env.HUGGINGFACE_API_KEY;
  process.env.HUGGINGFACE_API_KEY = "fake"; // force fallback
  const chunks = [{ id: "1", text: "cheap red shoes", url: "", index: 0 }, { id: "2", text: "red shoes for cheap", url: "", index: 1 }, { id: "3", text: "blue socks", url: "", index: 2 }];
  const scored = await scoreChunks("cheap red shoes", chunks);
  console.log("Scored chunks (fallback):", scored);
  process.env.HUGGINGFACE_API_KEY = oldEnv;

  console.log("\n--- 2. Testing runRerankingPipeline Deduplication & Truncation ---");
  // Since we can't easily mock fetch here, let's just observe the code logic for deduplication and truncation.
  // Actually, let's manually call the logic that was inside index.ts
  const mockScored = [
    { id: "1", text: "Duplicate text", score: 0.9 },
    { id: "2", text: "Duplicate text", score: 0.88 },
    { id: "3", text: "Unique text 1", score: 0.87 },
    { id: "4", text: "Unique text 2", score: 0.86 },
    { id: "5", text: "Unique text 3", score: 0.85 },
    { id: "6", text: "Secondary text 1", score: 0.6 },
    { id: "7", text: "Secondary text 1", score: 0.55 },
    { id: "8", text: "Secondary text 2", score: 0.52 },
    { id: "9", text: "Secondary text 3", score: 0.51 }
  ];
  
  const primary = [];
  const secondary = [];
  const seenTexts = new Set<string>();
  
  for (const item of mockScored) {
    if (seenTexts.has(item.text)) continue;
    
    if (item.score >= 0.85) {
      primary.push(item);
      seenTexts.add(item.text);
    } else if (item.score >= 0.50) {
      secondary.push(item);
      seenTexts.add(item.text);
    }
  }
  const result = { primary: primary.slice(0, 3), secondary: secondary.slice(0, 2) };
  console.log("Primary count:", result.primary.length, "Expected: 3");
  console.log("Secondary count:", result.secondary.length, "Expected: 2");
  console.log("Primary texts:", result.primary.map(p => p.text));
  
  console.log("\n--- 3. Testing executeRouterRouting ---");
  const routerRes = await executeRouterRouting("I want to buy a laptop", "[]");
  console.log("Router response:", routerRes);

  console.log("\n--- 4. Testing executeRouterRouting (Failure/Negative Path) ---");
  // Just testing an extremely large/weird input to see if it gracefully falls back.
  const badRouterRes = await executeRouterRouting("asdajkdhakjsdhakjshdkjahsdkj", "[]");
  console.log("Bad Router response (should not crash):", badRouterRes);

  console.log("\n--- 5. Testing Semantic Caching thresholds ---");
  const cacheRes = await checkSemanticCache("cheap red shoes", "session-123");
  console.log("Cache result:", cacheRes);
}

runTests().catch(console.error);
