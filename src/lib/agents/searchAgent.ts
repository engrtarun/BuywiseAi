import { mockQuickBuyProducts } from "@/lib/quickBuyMockData";

export interface SearchAgentOutput {
  query_keywords: string[];
  extracted_catalog_slices: typeof mockQuickBuyProducts;
}

export async function executeCatalogSearchExtraction(extractedKeywordsPayload: string[]): Promise<SearchAgentOutput> {
  const startTime = performance.now();
  try {
    const localCatalogRef = mockQuickBuyProducts;
    
    const filteredOutputSlices = localCatalogRef.filter(item => {
      return extractedKeywordsPayload.some(keyword => 
        item.name.toLowerCase().includes(keyword.toLowerCase()) || 
        item.category?.toLowerCase().includes(keyword.toLowerCase())
      );
    });

    return {
      query_keywords: extractedKeywordsPayload,
      extracted_catalog_slices: filteredOutputSlices.slice(0, 5) // Context boundary limit protection ceiling matching bounds rules
    };
  } catch (error) {
    console.error("[searchAgent] Catalog search extraction failed:", error);
    return {
      query_keywords: extractedKeywordsPayload,
      extracted_catalog_slices: []
    };
  } finally {
    const endTime = performance.now();
    console.log(`[searchAgent] Execution completed in ${(endTime - startTime).toFixed(2)}ms`);
  }
}
