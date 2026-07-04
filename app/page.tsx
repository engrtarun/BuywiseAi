"use client";

import React, { useState, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Message, ChatSession, Feedback } from "@/components/chat/types";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Sidebar } from "@/components/chat/Sidebar";
import { useGuestAccess } from "@/hooks/useGuestAccess";

import { GoogleGenerativeAI } from "@google/generative-ai";

// IMPORTANT: Set up your Gemini API key as an environment variable
// Create a .env.local file in the project root and add the following line:
// GEMINI_API_KEY=your_gemini_api_key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

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

export default function Page(props: { params: Promise<any>; searchParams: Promise<any> }) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  const router = useRouter();

  // Chat sessions state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);

  // Guest access hook
  const {
    isGuest,
    canSendMessage,
    messagesRemaining,
    incrementGuestMessageCount,
  } = useGuestAccess();

  // Ref for the AbortController to cancel fetch requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derived state for guest limit
  const guestLimitReached = isGuest && !canSendMessage;

  // Derive the active session's messages
  const activeSession = chatSessions.find((s) => s.id === activeChatId);
  const activeMessages = activeSession?.messages ?? [];

  /* ── Helpers ──────────────────────────────────────── */

  /**
   * Get an AI response by calling the API route.
   */
  const getAiReply = useCallback(
    async (chatId: string, history: Message[], message: string) => {
      setIsTyping(true);
      const startTime = Date.now();
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ history, message }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          if (response.status === 429) {
            console.warn('[Handled] Gemini rate limit hit, showing user-facing retry UI');
            appendErrorMessage(chatId, "rate_limit", errorData.retryDelay);
          } else {
            if (process.env.NODE_ENV === "development") {
              console.warn("API Error (Handled):", errorData.error || errorData);
            } else {
              console.warn("API Error Summary:", response.status);
            }
            appendErrorMessage(chatId, "generic");
          }
          return;
        }

        const data = await response.json();
        const aiMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: data.text,
        };

        setChatSessions((prev) =>
          prev.map((s) =>
            s.id === chatId ? { ...s, messages: [...s.messages, aiMsg] } : s
          )
        );
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted");
        } else {
          if (process.env.NODE_ENV === "development") {
            console.warn("Fetch Error (Handled):", error);
          } else {
            console.warn("Fetch Error Summary:", error.message);
          }
          appendErrorMessage(chatId, "generic");
        }
      } finally {
        const endTime = Date.now();
        const responseTimeSeconds = (endTime - startTime) / 1000;
        const cooldownSeconds = Math.max(2, Math.min(15, responseTimeSeconds * 0.5));
        setCooldownUntil(Date.now() + cooldownSeconds * 1000);

        setIsTyping(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  /** Append an error placeholder message to a chat session */
  const appendErrorMessage = useCallback((chatId: string, errorType: "generic" | "rate_limit" = "generic", retryDelay?: number) => {
    const errMsg: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      status: "error",
      errorType,
      retryDelay,
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
    setIsTemporaryChat(false);
    setChatSessions((prev) => prev.filter((s) => !s.isTemporary));
  }, []);

  const handleNewTemporaryChat = useCallback(() => {
    setActiveChatId(null);
    setIsTyping(false);
    setIsTemporaryChat(true);
    setChatSessions((prev) => prev.filter((s) => !s.isTemporary));
  }, []);

  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id);
    setIsTyping(false);
    setIsTemporaryChat(false);
    setChatSessions((prev) => prev.filter((s) => !s.isTemporary));
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
  /** Navigate to login (used by guest limit prompt) */
  const handleLoginClick = useCallback(() => {
    router.push("/login");
  }, [router]);

  const handleSend = useCallback(
    (content: string) => {
      /* ── Guest limit gate ────────────────────── */
      if (isGuest && !canSendMessage) {
        return; // Block the message
      }

      const userMsg: Message = { id: generateId(), role: "user", content };

      let chatIdToUpdate: string;
      let history: Message[] = [];

      if (activeChatId === null) {
        // Starting a brand new chat session
        const newId = generateId();
        chatIdToUpdate = newId;
        const newSession: ChatSession = {
          id: newId,
          title: isTemporaryChat ? "Temporary Chat" : generateTitle(content),
          messages: [userMsg],
          createdAt: Date.now(),
          isTemporary: isTemporaryChat,
        };
        setChatSessions((prev) => [newSession, ...prev]);
        setActiveChatId(newId);
        history = [];
      } else {
        // Appending to the active session
        chatIdToUpdate = activeChatId;
        const session = chatSessions.find((s) => s.id === activeChatId);
        history = session?.messages ?? [];
        setChatSessions((prev) =>
          prev.map((s) =>
            s.id === activeChatId
              ? { ...s, messages: [...s.messages, userMsg] }
              : s
          )
        );
      }

      /* Increment guest message counter (no-op for non-guests) */
      if (isGuest) {
        incrementGuestMessageCount();
      }

      getAiReply(chatIdToUpdate, history, content);
    },
    [activeChatId, chatSessions, getAiReply, isGuest, canSendMessage, incrementGuestMessageCount, isTemporaryChat]
  );

  /**
   * Stop Generating:
   * Aborts the active fetch request.
   */
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Regenerate Response:
   * Removes the last AI message and re-triggers the AI reply.
   */
  const handleRegenerate = useCallback(() => {
    if (!activeChatId) return;

    let lastUserMessage: Message | undefined;
    let history: Message[] = [];

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
        history = msgs;
        lastUserMessage = msgs[msgs.length -1];
        return { ...s, messages: msgs };
      })
    );
    if(lastUserMessage){
      getAiReply(activeChatId, history, lastUserMessage.content);
    }

  }, [activeChatId, getAiReply]);

  /**
   * Retry failed request:
   * Removes the error message and re-triggers the AI reply.
   */
  const handleRetry = useCallback(() => {
    if (!activeChatId) return;
    let lastUserMessage: Message | undefined;
    let history: Message[] = [];

    // Remove error messages from the active session
    setChatSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeChatId) return s;
        const messages = s.messages.filter((m) => m.status !== "error")
        history = messages;
        lastUserMessage = messages[messages.length -1];
        return { ...s, messages };
      })
    );

    if(lastUserMessage){
      getAiReply(activeChatId, history, lastUserMessage.content);
    }
  }, [activeChatId, getAiReply]);
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
        chatHistory={chatSessions.filter((s) => !s.isTemporary)}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onNewTemporaryChat={handleNewTemporaryChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isGuest={isGuest}
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
          isGuest={isGuest}
          guestMessagesRemaining={messagesRemaining}
          guestLimitReached={guestLimitReached}
          onLoginClick={handleLoginClick}
          cooldownUntil={cooldownUntil}
          isTemporaryChat={isTemporaryChat}
          onNewChat={handleNewChat}
        />
      </div>
    </div>
  );
}
