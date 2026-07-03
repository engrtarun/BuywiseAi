"use client";

import React, { useState, useCallback, useRef } from "react";
import { Message, ChatSession, Feedback } from "@/components/chat/types";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Sidebar } from "@/components/chat/Sidebar";

/* ── Mock AI responses ───────────────────────────────── */

const fakeAIResponses = [
  "I can definitely help with that! Let me search for some top-rated options within your budget.",
  "Here are a few choices that stand out for their quality and value. Which feature is most important to you?",
  "Great choice! Did you know there's a 10% bank discount currently available for this category on Amazon?\n\nCheck it out here: [Amazon Deals](https://amazon.com)",
  "I've tracked the price history for that item, and this is actually the **lowest price** it's been in 3 months! Worth grabbing now.\n\n```json\n{\n  \"price\": \"$199.99\",\n  \"discount\": \"20%\"\n}\n```",
  "If you want to save a bit more, I can show you a slightly older model that still performs exceptionally well.",
  "Would you like me to set a price drop alert for you? I'll notify you if it goes below your target price.\n- [x] Set Alert\n- [ ] Ignore",
];

/* ── Helpers ──────────────────────────────────────────── */

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function generateTitle(firstMessage: string): string {
  const max = 32;
  const trimmed = firstMessage.trim();
  return trimmed.length > max ? trimmed.slice(0, max) + "…" : trimmed;
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
        const aiMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: fakeAIResponses[responseIndex % fakeAIResponses.length],
        };
        setChatSessions((prev) =>
          prev.map((s) =>
            s.id === chatId ? { ...s, messages: [...s.messages, aiMsg] } : s
          )
        );
        setResponseIndex((i) => i + 1);
        setIsTyping(false);
        aiTimeoutRef.current = null;
      }, 1500);
    },
    [responseIndex]
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
