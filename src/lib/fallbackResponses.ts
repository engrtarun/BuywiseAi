const dynamicFallbacks = [
  "I'm having trouble fetching live results for this right now, but here's what I can help with based on general info — could you try rephrasing, or check back in a moment?",
  "It seems I can't reach the live product data at this exact second. Please give it another try shortly!",
  "I hit a small snag pulling real-time details for that. Could you try asking in a slightly different way?",
  "The connection to the live product catalog timed out. Let's try again in a few seconds!",
  "I'm currently unable to access the latest live listings for this. Please check back in a moment or try a different search!"
];

export function getFallbackChatResponse(message: string, mode: "explore" | "deep_research" | "buy_explanation" | string = "explore"): string {
  const text = dynamicFallbacks[Math.floor(Math.random() * dynamicFallbacks.length)];
  
  if (mode === "deep_research" || mode === "deep-research") {
    return JSON.stringify({
      ui_type: "deep_research_results",
      summary: text,
      final_verdict: "Please try again later.",
      recommended_products: []
    });
  } else {
    return JSON.stringify({
      ui_type: "text_response",
      text: text
    });
  }
}
