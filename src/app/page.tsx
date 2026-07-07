"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Message, ChatSession, Feedback, ChatMode } from "@/types/chat";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Sidebar } from "@/components/chat/Sidebar";
import { useGuestAccess } from "@/hooks/useGuestAccess";
import { useDailyMessageLimit } from "@/hooks/useDailyMessageLimit";
import { useTheme } from "@/hooks/useTheme";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { createClient } from "@/lib/supabase/client";

import {
  getOrCreateActiveSession,
  getChatHistory,
  sendMessage as apiSendMessage,
  listChatSessions,
  deleteChatSession,
  createChatSession,
  generateChatTitle,
  checkAndIncrementMessageLimit,
  updateSessionRequirements,
  updateChatSessionPinned,
} from "@/app/actions/chat";

function parseJSONSafe(text: string) {
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export function getExploreLayoutParts(content: string): { intro: string; deepDive: string } {
  const text = content.trim();
  
  // Try splitting by double newline (paragraph boundary)
  const paragraphs = text.split(/\n\n+/);
  if (paragraphs.length > 1) {
    const intro = paragraphs[0].trim();
    const deepDive = paragraphs.slice(1).join("\n\n").trim();
    return { intro, deepDive };
  }

  // Try splitting by single newline if no double newline exists
  const lines = text.split(/\n+/);
  if (lines.length > 1) {
    const intro = lines[0].trim();
    const deepDive = lines.slice(1).join("\n").trim();
    return { intro, deepDive };
  }

  // Fallback: everything is intro
  return { intro: text, deepDive: "" };
}

function parseAiMessageContent(dbMessageId: string, rawContent: string): Message {
  const aiMsg: Message = {
    id: dbMessageId,
    role: "assistant",
    content: rawContent,
  };

  const parsedJson = parseJSONSafe(rawContent);
  if (parsedJson && typeof parsedJson === "object") {
    if (parsedJson.fingerprint) {
      aiMsg.fingerprint = parsedJson.fingerprint;
    }
    
    if (parsedJson.ui_type === "clarifying_question" || parsedJson.ui_type === "questionnaire" || parsedJson.type === "clarifying_question") {
      aiMsg.content = parsedJson.thought || parsedJson.acknowledgement || parsedJson.question || "";
      aiMsg.clarifyingQuestion = {
        question: parsedJson.question || "",
        options: parsedJson.options || [],
        allow_skip: parsedJson.allow_skip !== undefined ? !!parsedJson.allow_skip : true,
        allow_custom: parsedJson.allow_custom !== undefined ? !!parsedJson.allow_custom : true,
        acknowledgement: parsedJson.thought || parsedJson.acknowledgement || "",
      };
    } else if (parsedJson.ui_type === "intake_questionnaire") {
      aiMsg.content = `Intake form for ${parsedJson.category || "category"}`;
      aiMsg.intakeQuestionnaire = {
        category: parsedJson.category || "category",
        key_attributes: Array.isArray(parsedJson.key_attributes) ? parsedJson.key_attributes : [],
      };
    } else if (parsedJson.ui_type === "explore_carousel") {
      aiMsg.content = parsedJson.headline || "Here are some recommendations:";
      aiMsg.exploreIntro = parsedJson.headline || "Here are some recommendations:";
      aiMsg.exploreDeepDive = parsedJson.deep_dive || "";

      // If deep_dive is empty in JSON but headline itself has splits, parse it:
      if (!aiMsg.exploreDeepDive && aiMsg.exploreIntro) {
        const parts = getExploreLayoutParts(aiMsg.exploreIntro);
        aiMsg.exploreIntro = parts.intro;
        aiMsg.exploreDeepDive = parts.deepDive;
      }

      const items = Array.isArray(parsedJson.products) ? parsedJson.products : [];
      aiMsg.products = items.map((p: any) => ({
        id: String(p.id || Math.random()),
        name: String(p.name || "Unknown Product"),
        price: String(p.price || "₹0"),
        rating: typeof p.rating === "number" ? p.rating : 4.0,
        reviewCount: String(p.reviewCount || "42"),
        description: String(p.description || "Recommended product matching your request."),
        platform: p.platform === "Flipkart" ? "Flipkart" : "Amazon",
        image: String(p.image || "/placeholder.png"),
        link: String(p.link || "https://amazon.in"),
      }));
    } else if (parsedJson.ui_type === "deep_research_results" || parsedJson.type === "deep_research_results" || parsedJson.ui_type === "results") {
      aiMsg.content = parsedJson.summary || "Based on your options, here are the best fits:";
      aiMsg.deepResearchResults = {
        summary: parsedJson.summary,
        finalVerdict: parsedJson.final_verdict,
        comparison: Array.isArray(parsedJson.comparison) ? parsedJson.comparison : [],
      };
      const items = Array.isArray(parsedJson.recommended_products) ? parsedJson.recommended_products : [];
      
      // Recommendation Recovery: if LLM failed to output the array but gave us the verdict
      if (items.length === 0) {
         if (parsedJson.primary_query) {
             items.push({ name: parsedJson.primary_query, badge: "Best Overall" });
         }
         if (Array.isArray(parsedJson.backup_queries)) {
             parsedJson.backup_queries.forEach((q: string) => items.push({ name: q, badge: "Alternative Option" }));
         }
         if (items.length === 0 && (parsedJson.final_verdict || parsedJson.summary)) {
            items.push({
              name: "Recommended Choice",
              description: String(parsedJson.final_verdict || parsedJson.summary).substring(0, 100) + "...",
              badge: "Top Pick",
              price: "See Retailer"
            });
         }
      }

      aiMsg.products = items.map((p: any) => ({
        id: String(p.id || Math.random()),
        name: String(p.name || "Unknown Product"),
        price: String(p.price || "₹0"),
        rating: typeof p.rating === "number" ? p.rating : 4.5,
        reviewCount: String(p.reviewCount || "100+"),
        description: String(p.description || "Recommended product matching your request."),
        platform: String(p.platform || "Amazon"),
        image: String(p.image || "/placeholder.png"),
        link: String(p.link || "https://amazon.in"),
        badge: String(p.badge || "Recommended")
      }));
    } else if (parsedJson.ui_type === "unrecognized") {
      // Gibberish / unrecognized input — render as a plain clarification prompt
      aiMsg.content = parsedJson.text || "I'm not sure what product you're looking for — could you tell me more?";
    } else if (parsedJson.ui_type === "text_response") {
      aiMsg.content = parsedJson.text || "";
    }
  } else {
    // Explore Mode (prose + tags)
    let content = rawContent;
    let searchTag: string | null = null;
    let suggestedMode: string | null = null;

    const searchMatch = content.match(/\[Search:\s*(.*?)\]/i);
    if (searchMatch) {
      searchTag = searchMatch[1].trim();
      content = content.replace(searchMatch[0], "").trim();
    }

    const suggestMatch = content.match(/\[SuggestMode:\s*(.*?)\]/i);
    if (suggestMatch) {
      suggestedMode = suggestMatch[1].trim();
      content = content.replace(suggestMatch[0], "").trim();
    }

    // Bullet-proof fallback: if no search tag was explicitly generated by Gemini,
    // look for common clothing category keywords in the message content itself.
    if (!searchTag) {
      const keywords = ["jacket", "shirt", "jeans", "hoodie", "tee", "pants", "coat", "flannel", "jogger", "sneaker", "shoes", "dress", "skirt", "sweater", "suit", "blazer"];
      const lowerContent = content.toLowerCase();
      const foundKeyword = keywords.find(k => lowerContent.includes(k));
      if (foundKeyword) {
        searchTag = foundKeyword;
      }
    }

    aiMsg.content = content.trim();
    if (suggestedMode === "deep_research" || suggestedMode === "explore") {
      aiMsg.suggestedMode = suggestedMode;
    }
    if (searchTag) {
      aiMsg.searchTag = searchTag;
      const parts = getExploreLayoutParts(content);
      aiMsg.exploreIntro = parts.intro;
      aiMsg.exploreDeepDive = parts.deepDive;
    }
  }

  return aiMsg;
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

/* ── Page (top-level orchestrator) ────────────────────── */

const MAX_PINNED_SESSIONS = 5;

import { MODES_CONFIG } from "@/config/modesConfig";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";

export default function Page() {
  const router = useRouter();
  // Chat sessions state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedMode, setSelectedMode] = useState<ChatMode>("explore");
  const [pendingModeChange, setPendingModeChange] = useState<ChatMode | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false); // If you have tour logic
  const { theme, setCustomSeedColor } = useTheme();

  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [showQuickBuy, setShowQuickBuy] = useState(false);
  const [showFoodQuickBuy, setShowFoodQuickBuy] = useState(false);
  const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);

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
    tokensUsed,
    tokenLimit,
    applyLimitStatus,
    isInitializing: isDailyLimitInitializing,
  } = useDailyMessageLimit();
  const [dailyLimitMessage, setDailyLimitMessage] = useState<string | undefined>();

  // Ref for the AbortController to cancel fetch requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derived state for guest limit
  const guestLimitReached = isGuest && !canSendMessage;

  // Toggle data-ghost attribute on document root
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isTemporaryChat) {
        document.documentElement.setAttribute("data-ghost", "true");
      } else {
        document.documentElement.removeAttribute("data-ghost");
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.removeAttribute("data-ghost");
      }
    };
  }, [isTemporaryChat]);

  // Derive the active session's messages
  const activeSession = chatSessions.find((s) => s.id === activeChatId);
  const activeMessages = activeSession?.messages ?? [];
  const activeMode = activeSession && activeSession.messages.length > 0 ? (activeSession.mode || "explore") : null;

  // --- AI MOOD MATCHING ---
  // Subtly shift custom theme color based on the context of the chat
  useEffect(() => {
    if (theme !== "custom" || !activeSession || activeSession.messages.length === 0) return;

    const lastUserMessage = [...activeSession.messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      const text = lastUserMessage.content.toLowerCase();
      if (text.match(/phone|laptop|pc|computer|tv|headphone|earbud|tech|electronic|gadget/)) {
        // Tech -> Cyber Neon
        setCustomSeedColor("#00FFCC");
      } else if (text.match(/eco|organic|food|grocery|water|plant|natural|green/)) {
        // Organic -> Eco Mint
        setCustomSeedColor("#98FF98");
      } else if (text.match(/luxury|jewelry|watch|gold|premium|expensive|diamond/)) {
        // Luxury -> Luxury Gold
        setCustomSeedColor("#FFD700");
      }
    }
  }, [activeSession?.messages, theme, setCustomSeedColor]);

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
            const messages: Message[] = history.map((m) => {
              if (m.sender === "user") {
                return {
                  id: m.id,
                  role: "user",
                  content: m.message,
                };
              }
              return parseAiMessageContent(m.id, m.message);
            });

            return {
              id: s.id,
              title: s.title || (messages[0]?.content ? generateTitle(messages[0].content) : "New Chat"),
              messages,
              createdAt: new Date(s.created_at).getTime(),
              mode: s.mode,
              requirements: (s as any).requirements || {},
              pinned: (s as any).pinned ?? false,
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
          const freshMessages: Message[] = freshHistory.map((m) => {
            if (m.sender === "user") {
              return {
                id: m.id,
                role: "user",
                content: m.message,
              };
            }
            return parseAiMessageContent(m.id, m.message);
          });

          // Find the active session mode from database directly if needed, or default
          const freshSessionRecord = sessions.find(s => s.id === activeSid);
          const freshMode = freshSessionRecord?.mode || "explore";

          const freshSession: ChatSession = {
            id: activeSid,
            title: freshMessages[0]?.content ? generateTitle(freshMessages[0].content) : "New Chat",
            messages: freshMessages,
            createdAt: Date.now(),
            mode: freshMode,
            pinned: false,
          };

          setChatSessions((prev) => [freshSession, ...prev]);
        }

      } catch (err) {
        console.error("Failed to initialize chat from Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initChat();
  }, []);

  /* ── Helpers ──────────────────────────────────────── */
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

  /**
   * Get an AI response by calling the API route.
   */
  const getAiReply = useCallback(
    async (chatId: string, history: Message[], message: string, currentReqs?: Record<string, unknown>, isRegenerate = false) => {
      setIsTyping(true);
      const startTime = Date.now();
      abortControllerRef.current = new AbortController();

      try {
        const session = chatSessions.find((s) => s.id === chatId);
        const hasMessages = session && session.messages.length > 0;
        const currentMode = hasMessages ? (session.mode || "explore") : selectedMode;

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, history, message, mode: currentMode, requirements: currentReqs || session?.requirements || {}, isRegenerate }),
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
        
        const aiMsgContents = Array.isArray(data.text) ? data.text : [data.text];
        const newMessages: Message[] = [];
        let newRequirements = currentReqs || session?.requirements || {};
        
        for (const aiMsgContent of aiMsgContents) {
          let dbAiMsg;
          if (session?.isTemporary) {
            dbAiMsg = {
              id: generateId(),
              session_id: chatId,
              sender: "ai",
              message: aiMsgContent,
              created_at: new Date().toISOString(),
            };
          } else {
            // Persist AI message to Supabase
            dbAiMsg = await apiSendMessage(chatId, "ai", aiMsgContent);
          }
  
          // Parse and restore rich layout client-side
          const aiMsg = parseAiMessageContent(dbAiMsg.id, dbAiMsg.message);
  
          if (aiMsg.fingerprint) {
             newRequirements = { ...newRequirements, fingerprint: aiMsg.fingerprint };
             updateSessionRequirements(chatId, newRequirements).catch(e => console.error("Failed to update fingerprint", e));
          }

          // Persist confirmed_category if the API returned one — locks the category
          // for the rest of this session so the AI doesn't re-guess it each turn.
          if (data.confirmed_category && typeof data.confirmed_category === "string" && !newRequirements.confirmed_category) {
            newRequirements = { ...newRequirements, confirmed_category: data.confirmed_category, category: data.confirmed_category };
            updateSessionRequirements(chatId, newRequirements).catch(e => console.error("Failed to persist confirmed_category", e));
          }

          // If the API returned real product results (Serper/FakeStore fallback), attach them
          if (data.products && Array.isArray(data.products) && ((aiMsg as any).ui_type === 'explore_carousel' || aiMsg.products !== undefined)) {
             (aiMsg as any).products = data.products;
          }
          newMessages.push(aiMsg);
        }

        setChatSessions((prev) =>
          prev.map((s) =>
            s.id === chatId ? { ...s, messages: [...s.messages, ...newMessages], requirements: newRequirements } : s
          )
        );
      } catch (error: unknown) {
        const err = error as Error;
        if (err.name === "AbortError") {
          console.log("Fetch aborted");
        } else {
          if (process.env.NODE_ENV === "development") {
            console.warn("Fetch Error (Handled):", err);
          } else {
            console.warn("Fetch Error Summary:", err.message);
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
    [appendErrorMessage, chatSessions, selectedMode]
  );

  /* ── Handlers ─────────────────────────────────────── */

  const handleProductBuy = useCallback(
    async (product: any) => {
      if (!activeChatId) return;
      const session = chatSessions.find((s) => s.id === activeChatId);
      if (!session) return;
      
      setIsTyping(true);
      try {
        const payloadStr = JSON.stringify({
          name: product.name,
          price: product.price,
          platform: product.platform,
        });

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            history: session.messages, 
            message: payloadStr, 
            mode: "buy_explanation" 
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiMsgContents = Array.isArray(data.text) ? data.text : [data.text];
          const newMessages: Message[] = [];
          
          for (const aiMsgContent of aiMsgContents) {
            const dbAiMsg = await apiSendMessage(activeChatId, "ai", aiMsgContent);
            const aiMsg = parseAiMessageContent(dbAiMsg.id, dbAiMsg.message);
            newMessages.push(aiMsg);
          }

          setChatSessions((prev) =>
            prev.map((s) =>
              s.id === activeChatId ? { ...s, messages: [...s.messages, ...newMessages] } : s
            )
          );
        } else {
          // If error, inject a generic fallback directly
          const fallbackText = `Great choice! ${product.name} is a solid pick within your budget.`;
          const dbAiMsg = await apiSendMessage(activeChatId, "ai", JSON.stringify({ ui_type: "text_response", text: fallbackText }));
          const aiMsg = parseAiMessageContent(dbAiMsg.id, dbAiMsg.message);
          
          setChatSessions((prev) =>
            prev.map((s) =>
              s.id === activeChatId ? { ...s, messages: [...s.messages, aiMsg] } : s
            )
          );
        }
      } catch (err) {
        console.error("Failed to explain buy action:", err);
      } finally {
        setIsTyping(false);
      }
    },
    [activeChatId, chatSessions]
  );

  const handleNewChat = useCallback((mode?: ChatMode) => {
    setIsTyping(false);
    setIsTemporaryChat(false);
    setShowQuickBuy(false);
    setShowFoodQuickBuy(false);
    const initialMode = mode || "explore";
    setSelectedMode(initialMode);
    setActiveChatId(null);
    // Clear any temporary chats from the list
    setChatSessions((prev) => prev.filter((s) => !s.isTemporary));
  }, []);

  const handleModeChangeRequest = useCallback((newMode: ChatMode) => {
    if (isGuest && MODES_CONFIG[newMode]?.requiresAuth) {
      setShowLoginRequiredModal(true);
      return;
    }

    const session = chatSessions.find((s) => s.id === activeChatId);
    const hasMessages = session && session.messages.length > 0;
    const currentMode = hasMessages ? (session.mode || "explore") : selectedMode;

    if (hasMessages && newMode !== currentMode) {
      setPendingModeChange(newMode);
    } else {
      setSelectedMode(newMode);
    }
  }, [activeChatId, chatSessions, selectedMode, isGuest]);

  const handleNewTemporaryChat = useCallback(() => {
    setShowQuickBuy(false);
    setShowFoodQuickBuy(false);
    if (isTemporaryChat) {
      // Exit temporary chat
      setIsTemporaryChat(false);
      const firstChat = chatSessions.find(s => !s.isTemporary);
      if (firstChat) {
        setActiveChatId(firstChat.id);
      }
    } else {
      // Enter temporary chat
      setActiveChatId(null);
      setIsTyping(false);
      setIsTemporaryChat(true);
      setChatSessions((prev) => prev.filter((s) => !s.isTemporary));
    }
  }, [isTemporaryChat, chatSessions]);

  useKeyboardShortcuts({ toggleTemporaryChat: handleNewTemporaryChat });

  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id);
    setIsTyping(false);
    setIsTemporaryChat(false);
    setShowQuickBuy(false);
    setShowFoodQuickBuy(false);
    setChatSessions((prev) => prev.filter((s) => !s.isTemporary));
  }, []);

  const handleDeleteChat = useCallback(async (id: string) => {
    try {
      // Persist delete in database
      await deleteChatSession(id);
      
      setChatSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeChatId === id) {
        const remainingSessions = chatSessions.filter(s => s.id !== id && !s.isTemporary);
        if (remainingSessions.length > 0) {
          setActiveChatId(remainingSessions[0].id);
        } else {
          handleNewTemporaryChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  }, [activeChatId, chatSessions, handleNewTemporaryChat]);
  const handleToggleChatPin = useCallback(async (id: string, pinned: boolean) => {
    const currentPinnedCount = chatSessions.filter((session) => session.pinned).length;
    const isPinning = pinned;

    if (isPinning && currentPinnedCount >= MAX_PINNED_SESSIONS) {
      alert(`You can only pin up to ${MAX_PINNED_SESSIONS} chats. Unpin an existing chat before pinning a new one.`);
      return;
    }

    setChatSessions((prev) =>
      prev.map((session) => (session.id === id ? { ...session, pinned } : session))
    );

    try {
      await updateChatSessionPinned(id, pinned);
    } catch (err) {
      console.error("Failed to update pinned state:", err);
    }
  }, [chatSessions]);
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
 
      let limitStatus;
      if (!isGuest) {
        try {
          limitStatus = await checkAndIncrementMessageLimit();
          applyLimitStatus(limitStatus);
          setDailyLimitMessage(limitStatus.message);
 
          if (!limitStatus.allowed) {
            return;
          }
        } catch (err) {
          console.error("Failed to check daily message limit:", err);
          return;
        }
      }
 
      const userMsg: Message = { id: generateId(), role: "user", content };
 
      let chatIdToUpdate: string;
      let history: Message[] = [];
      let isFirstMessage = false;
      let currentReqs: Record<string, unknown> = {};

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
              mode: selectedMode,
              requirements: {},
            };
          } else {
            newId = await createChatSession(selectedMode);
            newSession = {
              id: newId,
              title: generateTitle(content),
              messages: [userMsg],
              createdAt: Date.now(),
              mode: selectedMode,
              requirements: {},
            };
            // Persist user message to Supabase
            await apiSendMessage(newId, "user", content);
            // Also set title of the chat in Supabase
            const supabase = createClient();
            const updatePayload: any = { title: generateTitle(content), mode: selectedMode };
            let { error } = await supabase
              .from("chat_sessions")
              .update(updatePayload)
              .eq("id", newId);
            
            // Graceful fallback if remote DB is missing the 'mode' column
            if (error && error.message.includes("'mode' column")) {
              console.warn("Graceful fallback: 'mode' column missing, updating without it.");
              delete updatePayload.mode;
              const fallbackResult = await supabase
                .from("chat_sessions")
                .update(updatePayload)
                .eq("id", newId);
              error = fallbackResult.error;
            }

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
          const isFirst = history.length === 0;
          currentReqs = session?.requirements || {};

          // Check if we are answering a clarifying question
          const lastMsg = history[history.length - 1];
          if (lastMsg && lastMsg.clarifyingQuestion && !session?.isTemporary) {
            const questionText = lastMsg.clarifyingQuestion.question;
            currentReqs = { ...currentReqs, [questionText]: content };
            updateSessionRequirements(activeChatId, currentReqs).catch(e => console.error("Failed to update requirements", e));
          }
          
          // Extract the latest linguistic fingerprint from history to pass into currentReqs
          let latestFingerprint = undefined;
          for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].fingerprint) {
              latestFingerprint = history[i].fingerprint;
              break;
            }
          }
          if (latestFingerprint) {
            currentReqs = { ...currentReqs, fingerprint: latestFingerprint };
          }

          setChatSessions((prev) =>
            prev.map((s) =>
              s.id === activeChatId
                ? { ...s, messages: [...s.messages, userMsg], mode: isFirst ? selectedMode : s.mode, requirements: currentReqs }
                : s
            )
          );
 
          if (!session?.isTemporary) {
            // Persist user message to Supabase
            await apiSendMessage(activeChatId, "user", content);
 
            // If the session title was default "New Chat", rename it with the first message title
            if (session && (session.title === "New Chat" || !session.title || isFirst)) {
              isFirstMessage = true;
              const newTitle = generateTitle(content);
              setChatSessions((prev) =>
                prev.map((s) => (s.id === activeChatId ? { ...s, title: newTitle, mode: selectedMode } : s))
              );
              const supabase = createClient();
              const updatePayload: any = { title: newTitle, mode: selectedMode };
              const { error } = await supabase
                .from("chat_sessions")
                .update(updatePayload)
                .eq("id", activeChatId);

              // Graceful fallback if remote DB is missing the 'mode' column
              if (error && error.message.includes("'mode' column")) {
                console.warn("Graceful fallback: 'mode' column missing, updating without it.");
                delete updatePayload.mode;
                await supabase
                  .from("chat_sessions")
                  .update(updatePayload)
                  .eq("id", activeChatId);
              }
            }
          }
        }
 
        // Trigger AI reply first (so it generates immediately and doesn't wait for titling)
        getAiReply(chatIdToUpdate, history, content, currentReqs);
 
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
      }
    },
    [activeChatId, chatSessions, getAiReply, isGuest, canSendMessage, incrementGuestMessageCount, isTemporaryChat, dailyLimitReached, applyLimitStatus, selectedMode]
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
      getAiReply(activeChatId, history, lastUserMessage.content, undefined, true);
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
        onTogglePin={handleToggleChatPin}
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
          dailyLimitReached={dailyLimitReached}
          tokensUsed={tokensUsed}
          tokenLimit={tokenLimit}
          dailyLimitMessage={dailyLimitMessage}
          onLoginClick={handleLoginClick}
          cooldownUntil={cooldownUntil}
          isTemporaryChat={isTemporaryChat}
          onNewChat={handleNewChat}
          onNewTemporaryChat={handleNewTemporaryChat}
          selectedMode={selectedMode}
          onModeChange={handleModeChangeRequest}
          activeMode={activeMode}
          onProductBuy={handleProductBuy}
          showQuickBuy={showQuickBuy}
          showFoodQuickBuy={showFoodQuickBuy}
          onOpenQuickBuy={() => {
            if (isGuest && MODES_CONFIG.quick_buy.requiresAuth) {
              setShowLoginRequiredModal(true);
              return;
            }
            setShowQuickBuy(true);
          }}
          onCloseQuickBuy={() => setShowQuickBuy(false)}
          onOpenFoodQuickBuy={() => {
            if (isGuest && MODES_CONFIG.food.requiresAuth) {
              setShowLoginRequiredModal(true);
              return;
            }
            setShowFoodQuickBuy(true);
          }}
          onCloseFoodQuickBuy={() => setShowFoodQuickBuy(false)}
        />
      </div>

      <LoginRequiredModal
        isOpen={showLoginRequiredModal}
        onClose={() => setShowLoginRequiredModal(false)}
        onLoginClick={() => {
          setShowLoginRequiredModal(false);
          router.push("/login");
        }}
      />

      {/* Persistent Chat Mode Confirmation Dialog */}
      {pendingModeChange && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1A1A18] border border-border-dark w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <h2 className="font-heading font-bold text-lg text-text-primary-dark">Change Chat Mode?</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              This conversation is currently using <strong>{activeMode === "deep_research" ? "Deep Research" : "Explore"} Mode</strong>. 
              To use <strong>{pendingModeChange === "deep_research" ? "Deep Research" : "Explore"} Mode</strong>, you need to start a new conversation.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => {
                  handleNewChat(pendingModeChange);
                  setPendingModeChange(null);
                }}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-sans font-bold text-ink-deeper bg-marigold hover:bg-marigold/90 transition-colors"
              >
                Start New Chat
              </button>
              <button
                onClick={() => setPendingModeChange(null)}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-sans font-medium text-text-primary-dark bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
              >
                Continue Current Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
