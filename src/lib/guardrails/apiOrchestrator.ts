import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";
import { validateAndSanitizeOutput } from "./schemaGuardrails";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

interface OrchestratorInput {
  systemInstruction: string;
  formattedHistory: Array<{ role: string; parts: Array<{ text: string }> }>;
  effectiveUserMessage: string;
  groqApiKey?: string;
  historyForGroq: Array<{ role: string; content: string }>;
}

/**
 * Cross-API Schema Translation Layer & Protocol Buffers Architecture
 * Replaces direct model generation loops with a multi-vendor fallback orchestrator.
 */
export async function executeGenerativeOrchestration(input: OrchestratorInput): Promise<string> {
  let rawText = "";

  // 1. Primary Engine Execution (Google Gemini)
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: input.systemInstruction,
    });

    const chat = model.startChat({
      history: input.formattedHistory,
      generationConfig: {
        maxOutputTokens: 1500,
        responseMimeType: "application/json",
      },
    });

    // Enforce latency bounds (GUARD-RANK-GAMMA)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const result = await chat.sendMessage(input.effectiveUserMessage, { signal: controller.signal } as any);
    clearTimeout(timeoutId);

    rawText = result.response.text();
  } catch (geminiErr) {
    console.warn("[Orchestrator] Primary engine failed. Triggering cascading fallback to Groq...", geminiErr);
    
    // 2. Cascading Fallback (Groq)
    if (!input.groqApiKey) {
      throw new Error("No fallback engine available. Primary engine failed.");
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: input.systemInstruction },
          ...input.historyForGroq.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content || "",
          })),
          { role: "user", content: input.effectiveUserMessage },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
       throw new Error(`[Orchestrator] Cascading fallback failed: ${groqRes.statusText}`);
    }
    
    const groqData = await groqRes.json();
    rawText = groqData.choices[0].message.content;
  }

  // 3. Structural Determinism Check (Zod Validation)
  const validatedPayload = validateAndSanitizeOutput(rawText);

  return JSON.stringify(validatedPayload);
}
