import { getNextGeminiClient } from "./keyManager";

const ROUTER_SYSTEM_PROMPT = `You are an intent classifier for a shopping assistant.
Analyze the user's message and the recent chat history to determine the appropriate chat mode.

Output JSON only in this exact format:
{
  "target_mode": "explore" | "deep_research",
  "reasoning": "A short sentence explaining why"
}

Rules:
1. "deep_research": Use this mode whenever the user hasn't yet given budget and use-case for a specific product. This mode asks clarifying questions before showing products. It is the default for new product requests.
2. "explore": Use this mode ONLY when the user explicitly wants to just browse without answering questions, or asks for generic inspiration without a specific product goal.

Do not include any confidence scores or other fields.`;

export async function determineIntent(message: string, history: any[]): Promise<'explore' | 'deep_research'> {
  try {
    const genAI = getNextGeminiClient();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: ROUTER_SYSTEM_PROMPT,
    });
    
    // Format history just for context. We keep it brief.
    const recentHistory = history.slice(-4).map(h => `${h.role === 'assistant' ? 'AI' : 'User'}: ${h.content}`).join('\n');
    const prompt = `History:\n${recentHistory || 'None'}\n\nUser Message: ${message}`;
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 150,
        responseSchema: {
          type: "object" as any,
          properties: {
            target_mode: {
              type: "string" as any,
              enum: ["explore", "deep_research"],
            },
            reasoning: { type: "string" as any },
          },
          required: ["target_mode", "reasoning"],
        },
      }
    });
    
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return parsed.target_mode === "explore" ? "explore" : "deep_research";
  } catch (error) {
    console.error("Router failed, defaulting to deep_research", error);
    return "deep_research"; // Safe fallback to ensure clarifying questions
  }
}
