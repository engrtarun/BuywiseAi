/**
 * src/lib/retrieval/scraper.ts
 * Implements Step 01 & Step 02: Deep Web Scraping & Sanitization Loop
 */

export async function scrapeWebText(urls: string[]): Promise<{ url: string; text: string }[]> {
  const timeoutMs = 2500; // Concurrency timeout ceiling

  const fetchWithTimeout = async (url: string) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { 
        signal: controller.signal, 
        headers: { "User-Agent": "BuyWiseAI-Bot/1.0" } 
      });
      clearTimeout(id);
      if (!res.ok) return null;
      return await res.text();
    } catch (_err) {
      clearTimeout(id);
      return null;
    }
  };

  // Concurrent fetching of all links
  const results = await Promise.allSettled(urls.map(async (url) => {
    const html = await fetchWithTimeout(url);
    if (!html) return { url, text: "" };
    
    // GUARD-RANK-BETA: Sanitization loop to isolate plain text bodies
    let cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, " ")
      // Remove all remaining HTML tags
      .replace(/<[^>]+>/g, " ")
      // Unescape common entities
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .trim();
      
    // Filter out unescaped control code signals or broken characters
    cleanText = cleanText.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

    return { url, text: cleanText };
  }));

  return results
    .map(r => r.status === "fulfilled" ? r.value : { url: "", text: "" })
    .filter(r => r.text.length > 0);
}
