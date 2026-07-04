"use client";

import React, { useState, useCallback, useRef, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Message, ChatSession, Feedback } from "@/components/chat/types";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Sidebar } from "@/components/chat/Sidebar";
import { useGuestAccess } from "@/hooks/useGuestAccess";
import { useDailyMessageLimit } from "@/hooks/useDailyMessageLimit";
import { createClient } from "@/lib/supabase/client";

import {
  getOrCreateActiveSession,
  getChatHistory,
  sendMessage as apiSendMessage,
  listChatSessions,
  deleteChatSession,
  createChatSession,
  generateChatTitle,
} from "@/app/actions/chat";

import { GoogleGenerativeAI } from "@google/generative-ai";

// IMPORTANT: Set up your Gemini API key as an environment variable
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
  const [isLoading, setIsLoading] = useState(true);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);

  // Guest access hook
  const {
    isGuest,
    canSendMessage,
    messagesRemaining,
    incrementGuestMessageCount,
  } = useGuestAccess();

  // Daily message limit hook
  const {
    dailyLimitReached,
    dailyMessagesRemaining,
    incrementDailyCount,
    isInitializing: isDailyLimitInitializing,
    DAILY_LIMIT,
  } = useDailyMessageLimit();

  // Ref for the AbortController to cancel fetch requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derived state for guest limit
  const guestLimitReached = isGuest && !canSendMessage;

  // Derive the active session's messages
  const activeSession = chatSessions.find((s) => s.id === activeChatId);
  const activeMessages = activeSession?.messages ?? [];

  // Load chat sessions and initial active history on mount
  useEffect(() => {
    async function initChat() {
      try {
        setIsLoading(true);
        // 1. Fetch all chat sessions for the logged-in user
        const sessions = await listChatSessions();
        
        // 2. Format database sessions to frontend ChatSession state shape
        const formattedSessions: ChatSession[] = await Promise.all(
          sessions.map(async (s) => {
            const history = await getChatHistory(s.id);
            const messages: Message[] = history.map((m) => ({
              id: m.id,
              role: m.sender === "ai" ? "assistant" : "user",
              content: m.message,
            }));

            return {
              id: s.id,
              title: s.title || (messages[0]?.content ? generateTitle(messages[0].content) : "New Chat"),
              messages,
              createdAt: new Date(s.created_at).getTime(),
            };
          })
        );

        setChatSessions(formattedSessions);

        // 3. Find or create the active session
        const activeSid = await getOrCreateActiveSession();
        setActiveChatId(activeSid);

        // If the active session is not in our list (e.g. freshly created), fetch it
        if (!formattedSessions.some((s) => s.id === activeSid)) {
          const freshHistory = await getChatHistory(activeSid);
          const freshMessages: Message[] = freshHistory.map((m) => ({
            id: m.id,
            role: m.sender === "ai" ? "assistant" : "user",
            content: m.message,
          }));

          const freshSession: ChatSession = {
            id: activeSid,
            title: freshMessages[0]?.content ? generateTitle(freshMessages[0].content) : "New Chat",
            messages: freshMessages,
            createdAt: Date.now(),
          };

          setChatSessions((prev) => [freshSession, ...prev]);
        }

      } catch (err: any) {
        console.error("Failed to initialize chat from Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initChat();
  }, []);

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
        const aiMsgContent = data.text;

        // Persist AI message to Supabase
        const dbAiMsg = await apiSendMessage(chatId, "ai", aiMsgContent);

        const aiMsg: Message = {
          id: dbAiMsg.id,
          role: "assistant",
          content: dbAiMsg.message,
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

  const handleNewChat = useCallback(async () => {
    setIsTyping(false);
    setIsTemporaryChat(false);
    setIsLoading(true);
    try {
      // Create new session in Supabase
      const newSid = await createChatSession();
      
      const newSession: ChatSession = {
        id: newSid,
        title: "New Chat",
        messages: [],
        createdAt: Date.now(),
      };
      
      setChatSessions((prev) => [newSession, ...prev].filter((s) => !s.isTemporary));
      setActiveChatId(newSid);
    } catch (err) {
      console.error("Failed to create new chat session:", err);
    } finally {
      setIsLoading(false);
    }
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

  const handleDeleteChat = useCallback(async (id: string) => {
    try {
      // Persist delete in database
      await deleteChatSession(id);
      
      setChatSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeChatId === id) {
        setActiveChatId(null);
      }
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  }, [activeChatId]);

  /** Navigate to login (used by guest limit prompt) */
  const handleLoginClick = useCallback(() => {
    router.push("/login");
  }, [router]);

  const handleRenameChat = useCallback((id: string, title: string) => {
    setChatSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  }, []);

  const handleSend = useCallback(
    async (content: string) => {
      /* ── Guest limit gate ────────────────────── */
      if (isGuest && !canSendMessage) {
        return; // Block the message
      }

      /* ── Daily limit gate (for authenticated users) ──────── */
      if (!isGuest && dailyLimitReached) {
        return;
      }

      const userMsg: Message = { id: generateId(), role: "user", content };

      let chatIdToUpdate: string;
      let history: Message[] = [];
      let isFirstMessage = false;

      try {
        if (activeChatId === null) {
          isFirstMessage = true;
          // Starting a brand new chat session
          let newId: string;
          let newSession: ChatSession;

          if (isTemporaryChat) {
            // Guest / temporary chat — no Supabase persistence
            newId = generateId();
            newSession = {
              id: newId,
              title: "Temporary Chat",
              messages: [userMsg],
              createdAt: Date.now(),
              isTemporary: true,
            };
          } else {
            newId = await createChatSession();
            newSession = {
              id: newId,
              title: generateTitle(content),
              messages: [userMsg],
              createdAt: Date.now(),
            };
            // Persist user message to Supabase
            await apiSendMessage(newId, "user", content);
            // Also set title of the chat in Supabase
            const supabase = createClient();
            const { error } = await supabase
              .from("chat_sessions")
              .update({ title: generateTitle(content) })
              .eq("id", newId);
            if (error) console.error("Failed to update session title in Supabase:", error.message);
          }

          chatIdToUpdate = newId;
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

          if (!session?.isTemporary) {
            // Persist user message to Supabase
            await apiSendMessage(activeChatId, "user", content);

            // If the session title was default "New Chat", rename it with the first message title
            if (session && (session.title === "New Chat" || !session.title || session.messages.length === 0)) {
              isFirstMessage = true;
              const newTitle = generateTitle(content);
              setChatSessions((prev) =>
                prev.map((s) => (s.id === activeChatId ? { ...s, title: newTitle } : s))
              );
              const supabase = createClient();
              await supabase
                .from("chat_sessions")
                .update({ title: newTitle })
                .eq("id", activeChatId);
            }
          }
        }

        // Trigger AI reply first (so it generates immediately and doesn't wait for titling)
        getAiReply(chatIdToUpdate, history, content);

        // Asynchronously generate chat title in the background if it's the first message
        if (isFirstMessage && !isTemporaryChat) {
          generateChatTitle(content).then(async (generatedTitle) => {
            // Update local state immediately so sidebar title refreshes dynamically
            setChatSessions((prev) =>
              prev.map((s) => (s.id === chatIdToUpdate ? { ...s, title: generatedTitle } : s))
            );
            
            // Persist the generated title to Supabase
            const supabase = createClient();
            await supabase
              .from("chat_sessions")
              .update({ title: generatedTitle })
              .eq("id", chatIdToUpdate);
          }).catch((err) => {
            console.error("Background title generation failed:", err);
          });
        }
      } catch (err) {
        console.error("Failed to send message and save to Supabase:", err);
      }
      /* Increment message counters */
      if (isGuest) {
        incrementGuestMessageCount();
      } else {
        incrementDailyCount();
      }
    },
    [activeChatId, chatSessions, getAiReply, isGuest, canSendMessage, incrementGuestMessageCount, isTemporaryChat, dailyLimitReached, incrementDailyCount]
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
  const handleRegenerate = useCallback(async () => {
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
        lastUserMessage = msgs[msgs.length - 1];
        return { ...s, messages: msgs };
      })
    );
    if (lastUserMessage) {
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
        lastUserMessage = messages[messages.length - 1];
        return { ...s, messages };
      })
    );

    if (lastUserMessage) {
      getAiReply(activeChatId, history, lastUserMessage.content);
    }
  }, [activeChatId, getAiReply]);

  /**
   * Feedback:
   * Updates the feedback field on a specific message.
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

  if (isLoading || isDailyLimitInitializing) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-bg-main text-text-primary-light">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-4 border-brand-accent/20 border-t-brand-accent animate-spin" />
          <p className="text-[13px] font-sans text-text-secondary animate-pulse">Loading BuyWise AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full bg-ink-deeper overflow-hidden">
      {/* Sidebar — always visible on desktop, overlay on mobile */}
      <Sidebar
        chatHistory={chatSessions.filter((s) => !s.isTemporary)}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
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
          onNewTemporaryChat={handleNewTemporaryChat}
        />
      </div>
    </div>
  );
}
