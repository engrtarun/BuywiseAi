import { env } from "@/lib/env";
import { validateAndSanitizeOutput } from "./schemaGuardrails";
import { executeWithGeminiFailover } from "../agents/keyManager";

interface OrchestratorInput {
  systemInstruction: string;
  formattedHistory: Array<{ role: string; parts: Array<{ text: string }> }>;
  effectiveUserMessage: string;
  groqApiKey?: string;
  historyForGroq: Array<{ role: string; content: string }>;
}

export async function* executeStreamingOrchestration(input: OrchestratorInput): AsyncGenerator<string, void, unknown> {
  // Always use Groq for streaming since it's the requested optimization
  if (!input.groqApiKey) {
    throw new Error("Groq API key required for streaming.");
  }

  let groqRes: Response | null = null;
  try {
    groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Use a reliable groq model
        messages: [
          { role: "system", content: input.systemInstruction },
          ...input.historyForGroq.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content || "",
          })),
          { role: "user", content: input.effectiveUserMessage },
        ],
        stream: true,
      }),
    });

    if (!groqRes.ok || !groqRes.body) {
       throw new Error(`[Orchestrator] Groq streaming failed: ${groqRes.status} ${groqRes.statusText}`);
    }
  } catch (groqErr) {
    console.warn("Groq streaming failed, falling back to Gemini:", groqErr);
    
    // Fallback to Gemini Streaming with automatic key failover
    try {
      const result = await executeWithGeminiFailover(async (genAI) => {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: input.systemInstruction,
        });
        const chat = model.startChat({
          history: input.formattedHistory,
        });
        return await chat.sendMessageStream(input.effectiveUserMessage);
      });

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
        }
      }
    } catch (geminiErr) {
      console.error("Gemini fallback streaming failed completely across all keys:", geminiErr);
    }
    return; // Exit generator after Gemini finishes
  }


  const reader = groqRes.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    // Process SSE lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;

      if (trimmed.startsWith("data: ")) {
        try {
          const data = JSON.parse(trimmed.slice(6));
          const chunk = data.choices[0]?.delta?.content || "";
          if (chunk) {
            yield chunk;
          }
        } catch (e) {
          console.warn("Failed to parse SSE chunk:", trimmed);
        }
      }
    }
  }
  
  if (buffer.trim()) {
    const trimmed = buffer.trim();
    if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
        try {
          const data = JSON.parse(trimmed.slice(6));
          const chunk = data.choices[0]?.delta?.content || "";
          if (chunk) {
            yield chunk;
          }
        } catch (e) {
           // Ignore
        }
    }
  }
}

/**
 * Cross-API Schema Translation Layer & Protocol Buffers Architecture
 * Replaces direct model generation loops with a multi-vendor fallback orchestrator.
 */
export async function executeGenerativeOrchestration(input: OrchestratorInput): Promise<string> {
  let rawText = "";

  // 1. Primary Engine Execution (Google Gemini) with automatic key failover
  try {
    rawText = await executeWithGeminiFailover(async (genAI) => {
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
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      try {
        const result = await chat.sendMessage(input.effectiveUserMessage, { signal: controller.signal } as any);
        return result.response.text();
      } finally {
        clearTimeout(timeoutId);
      }
    });
  } catch (geminiErr) {
    console.warn("[Orchestrator] Primary engine failed completely across all Gemini keys. Triggering cascading fallback to Groq...", geminiErr);
    
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
