import { env } from "@/lib/env";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEYS[0]);

export interface RouterOutput {
  target_mode: "explore" | "deep_research";
  confidence_score: number;
  reasoning_trace: string;
}

export async function executeRouterRouting(userMessage: string, contextHistory: string): Promise<RouterOutput> {
  const routerPrompt = `You are the Intent Interception Router Agent for BuyWise AI.
Analyze the user incoming message and previous history trace. Categorize into exact 
operational mode:
1. 'explore': User wants quick browsing, casual viewing, broad list of options.
2. 'deep_research': User asks deep questions, provides metrics, specs, wants comparison 
guides, interactive choices.
Return ONLY a valid JSON string structure format matching contract. No markdown formatting 
code blocks.
Contract schema:
{
  "target_mode": "explore" | "deep_research",
  "confidence_score": 0.0 to 1.0,
  "reasoning_trace": "short analytical comment"
}`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
    systemInstruction: routerPrompt,
  });

  const sessionExecution = model.startChat({});
  const communicationResult = await sessionExecution.sendMessage(`History context: ${contextHistory} \n Message: ${userMessage}`);
  const payloadResponse = await communicationResult.response;
  const targetText = payloadResponse.text().trim();
  return JSON.parse(targetText) as RouterOutput;
}
