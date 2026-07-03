"use client";

import React, { useState, useCallback, useRef } from "react";
import { Message, ChatSession, Feedback } from "@/components/chat/types";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Sidebar } from "@/components/chat/Sidebar";

/* ── Mock AI responses ───────────────────────────────── */

const fakeAIResponses: any[] = [
  "I can definitely help with that! Let me search for some top-rated options within your budget.",
  // Mock Gemini API JSON response to test the extraction logic
  {
    candidates: [
      {
        content: {
          parts: [
            { text: "Here is a simulated response coming from a **Gemini API JSON object**!\n\nAs you can see, the text was properly extracted from `candidates[0].content.parts[0].text` instead of showing raw JSON." }
          ]
        }
      }
    ]
  },
  "Great choice! Did you know there's a 10% bank discount currently available for this category on Amazon?\n\nCheck it out here: [Amazon Deals](https://amazon.com)",
  "I've tracked the price history for that item, and this is actually the **lowest price** it's been in 3 months! Worth grabbing now.\n\n```json\n{\n  \"price\": \"$199.99\",\n  \"discount\": \"20%\"\n}\n```",
  "If you want to save a bit more, I can show you a slightly older model that still performs exceptionally well.",
  "Would you like me to set a price drop alert for you? I'll notify you if it goes below your target price.\n- [x] Set Alert\n- [ ] Ignore",
];

/**
 * Mock comparison table response — returned when the user asks to compare products.
 *
 * In a real Gemini integration, you'd add this to the system prompt:
 * "When the user asks to compare 2+ products, respond with a markdown table
 * (one column per product, rows for price/specs/pros/cons/rating). For all
 * other queries, respond conversationally. Do NOT use tables unless a
 * comparison is genuinely requested."
 */
const COMPARISON_TABLE_RESPONSE = `Here's a side-by-side comparison:

| Feature | iPhone 15 | Samsung Galaxy S24 | Google Pixel 8 |
|---|---|---|---|
| **Price** | ₹69,900 | ₹64,999 | ₹59,999 |
| **Display** | 6.1" Super Retina XDR, 60Hz | 6.2" Dynamic AMOLED, 120Hz | 6.2" OLED, 120Hz |
| **Processor** | A16 Bionic | Snapdragon 8 Gen 3 | Tensor G3 |
| **RAM** | 6 GB | 8 GB | 8 GB |
| **Battery** | 3,349 mAh | 4,000 mAh | 4,575 mAh |
| **Camera** | 48 MP + 12 MP | 50 MP + 12 MP + 10 MP | 50 MP + 12 MP |
| **OS** | iOS 17 | Android 14 (One UI 6.1) | Android 14 (Stock) |
| **Rating** | ⭐ 4.5/5 | ⭐ 4.6/5 | ⭐ 4.4/5 |

**Verdict:** The Samsung S24 offers the best specs for the price with a 120Hz display and triple camera. The Pixel 8 is the best value pick with stock Android and the longest battery life. The iPhone 15 is ideal if you're already in the Apple ecosystem.

Would you like me to check current prices or deals on any of these?`;

const COMPARE_KEYWORDS = /\b(compare|vs\.?|versus|difference between|which is better|head to head|comparison)\b/i;

function isComparisonQuery(text: string): boolean {
  return COMPARE_KEYWORDS.test(text);
}

/* ── Helpers ──────────────────────────────────────────── */

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function generateTitle(firstMessage: string): string {
  const max = 32;
  const trimmed = firstMessage.trim();
  return trimmed.length > max ? trimmed.slice(0, max) + "…" : trimmed;
}

/**
 * Safely extracts text from various AI API response shapes (Gemini, Claude, OpenAI).
 */
function extractAiText(raw: any): string {
  if (typeof raw === "string") return raw;
  if (!raw) return "";

  // Gemini style: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
  if (raw.candidates && Array.isArray(raw.candidates) && raw.candidates.length > 0) {
    const candidate = raw.candidates[0];
    if (candidate.content && Array.isArray(candidate.content.parts)) {
      return candidate.content.parts
        .map((p: any) => p.text || "")
        .join("");
    }
  }

  // Anthropic style: { content: [{ type: "text", text: "..." }] }
  if (raw.content && Array.isArray(raw.content)) {
    return raw.content
      .filter((block: any) => block.type === "text")
      .map((block: any) => block.text || "")
      .join("");
  }

  // OpenAi style: { choices: [{ message: { content: "..." } }] }
  if (raw.choices && Array.isArray(raw.choices) && raw.choices.length > 0) {
    const choice = raw.choices[0];
    if (choice.message && typeof choice.message.content === "string") {
      return choice.message.content;
    }
  }

  // Generic fallback if it's an object with a content string
  if (typeof raw.content === "string") {
    return raw.content;
  }

  return "Unable to parse AI response. Please check API response format.";
}

/* ── Page (top-level orchestrator) ────────────────────── */

export default function Page() {
  // Chat sessions state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [responseIndex, setResponseIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ref for the AI response timeout so we can cancel it (Stop Generating)
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive the active session's messages
  const activeSession = chatSessions.find((s) => s.id === activeChatId);
  const activeMessages = activeSession?.messages ?? [];

  /* ── Helpers ──────────────────────────────────────── */

  /**
   * Simulate an AI response with cancel support.
   *
   * In a real integration, replace setTimeout with a fetch() call using an
   * AbortController. Store the controller in a ref and call .abort() in
   * handleStop to cancel mid-stream. Wrap the fetch in try/catch and call
   * appendErrorMessage(chatId) in the catch block.
   */
  const simulateAiReply = useCallback(
    (chatId: string) => {
      setIsTyping(true);

      aiTimeoutRef.current = setTimeout(() => {
        // Check the last user message in this chat for comparison intent
        const session = chatSessions.find((s) => s.id === chatId);
        const lastUserMsg = session?.messages
          .slice()
          .reverse()
          .find((m) => m.role === "user");

        const isComparison = lastUserMsg && isComparisonQuery(lastUserMsg.content);

        const rawResponse = isComparison
          ? COMPARISON_TABLE_RESPONSE
          : fakeAIResponses[responseIndex % fakeAIResponses.length];

        const extractedText = extractAiText(rawResponse);

        // Temporary logs for debugging API response extraction
        console.log("[API DEBUG] Raw API response before extraction:", JSON.stringify(rawResponse, null, 2));
        console.log("[API DEBUG] Final extracted text:", extractedText);

        const aiMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: extractedText,
        };

        setChatSessions((prev) =>
          prev.map((s) =>
            s.id === chatId ? { ...s, messages: [...s.messages, aiMsg] } : s
          )
        );
        if (!isComparison) setResponseIndex((i) => i + 1);
        setIsTyping(false);
        aiTimeoutRef.current = null;
      }, 1500);
    },
    [responseIndex, chatSessions]
  );

  /** Append an error placeholder message to a chat session */
  const appendErrorMessage = useCallback((chatId: string) => {
    const errMsg: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      status: "error",
    };
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === chatId ? { ...s, messages: [...s.messages, errMsg] } : s
      )
    );
    setIsTyping(false);
  }, []);

  /* ── Handlers ─────────────────────────────────────── */

  const handleNewChat = useCallback(() => {
    setActiveChatId(null);
    setIsTyping(false);
  }, []);

  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id);
    setIsTyping(false);
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    setChatSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  }, [activeChatId]);

  /**
   * handleSend — FIXED DUPLICATE BUG:
   *
   * Previous code called setChatSessions INSIDE a setActiveChatId functional
   * updater. React 18 StrictMode double-invokes functional updaters in dev,
   * causing the session to be created twice.
   *
   * Fix: Generate the new ID in a ref BEFORE calling any state setters,
   * then use separate setState calls (not nested functional updaters).
   */
  const handleSend = useCallback(
    (content: string) => {
      const userMsg: Message = { id: generateId(), role: "user", content };

      let chatIdToUpdate: string;

      if (activeChatId === null) {
        // Starting a brand new chat session
        const newId = generateId();
        chatIdToUpdate = newId;
        const newSession: ChatSession = {
          id: newId,
          title: generateTitle(content),
          messages: [userMsg],
          createdAt: Date.now(),
        };
        setChatSessions((prev) => [newSession, ...prev]);
        setActiveChatId(newId);
      } else {
        // Appending to the active session
        chatIdToUpdate = activeChatId;
        setChatSessions((prev) =>
          prev.map((s) =>
            s.id === activeChatId
              ? { ...s, messages: [...s.messages, userMsg] }
              : s
          )
        );
      }

      simulateAiReply(chatIdToUpdate);
    },
    [activeChatId, simulateAiReply]
  );

  /**
   * Stop Generating:
   * Clears the pending AI timeout so no AI message is appended.
   * In a real integration, you'd call abortController.abort() here.
   */
  const handleStop = useCallback(() => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setIsTyping(false);
  }, []);

  /**
   * Regenerate Response:
   * Removes the last AI message and re-triggers the AI reply.
   */
  const handleRegenerate = useCallback(() => {
    if (!activeChatId) return;

    setChatSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeChatId) return s;
        const msgs = [...s.messages];
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === "assistant") {
            msgs.splice(i, 1);
            break;
          }
        }
        return { ...s, messages: msgs };
      })
    );

    simulateAiReply(activeChatId);
  }, [activeChatId, simulateAiReply]);

  /**
   * Retry failed request:
   * Removes the error message and re-triggers the AI reply.
   */
  const handleRetry = useCallback(() => {
    if (!activeChatId) return;

    // Remove error messages from the active session
    setChatSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeChatId) return s;
        return { ...s, messages: s.messages.filter((m) => m.status !== "error") };
      })
    );

    simulateAiReply(activeChatId);
  }, [activeChatId, simulateAiReply]);

  /**
   * Feedback:
   * Updates the feedback field on a specific message.
   * In production, you'd POST this to an analytics endpoint.
   */
  const handleFeedback = useCallback((messageId: string, feedback: Feedback) => {
    setChatSessions((prev) =>
      prev.map((s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === messageId ? { ...m, feedback } : m
        ),
      }))
    );
    console.log(`[Feedback] Message ${messageId}: ${feedback ?? "cleared"}`);
  }, []);

  return (
    <div className="flex h-dvh w-full bg-ink-deeper overflow-hidden">
      {/* Sidebar — always visible on desktop, overlay on mobile */}
      <Sidebar
        chatHistory={chatSessions}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main chat area */}
      <div className="flex-1 min-w-0">
        <ChatWindow
          messages={activeMessages}
          isTyping={isTyping}
          isSidebarOpen={sidebarOpen}
          onSend={handleSend}
          onStop={handleStop}
          onRegenerate={handleRegenerate}
          onRetry={handleRetry}
          onFeedback={handleFeedback}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />
      </div>
    </div>
  );
}
