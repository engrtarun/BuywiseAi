"use client";

import React, { useState, useCallback } from "react";
import { Message, ChatSession } from "@/components/chat/types";
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

  // Derive the active session's messages
  const activeSession = chatSessions.find((s) => s.id === activeChatId);
  const activeMessages = activeSession?.messages ?? [];

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

  const handleSend = useCallback((content: string) => {
    const userMsg: Message = { id: generateId(), role: "user", content };

    if (activeChatId === null) {
      // Starting a new chat session
      const newId = generateId();
      const newSession: ChatSession = {
        id: newId,
        title: generateTitle(content),
        messages: [userMsg],
        createdAt: Date.now(),
      };
      setChatSessions((prev) => [newSession, ...prev]);
      setActiveChatId(newId);

      // Simulate AI reply
      setIsTyping(true);
      setTimeout(() => {
        const aiMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: fakeAIResponses[responseIndex % fakeAIResponses.length],
        };
        setChatSessions((prev) =>
          prev.map((s) => s.id === newId ? { ...s, messages: [...s.messages, aiMsg] } : s)
        );
        setResponseIndex((i) => i + 1);
        setIsTyping(false);
      }, 1500);
    } else {
      // Appending to the active session
      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === activeChatId ? { ...s, messages: [...s.messages, userMsg] } : s
        )
      );

      setIsTyping(true);
      setTimeout(() => {
        const aiMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: fakeAIResponses[responseIndex % fakeAIResponses.length],
        };
        setChatSessions((prev) =>
          prev.map((s) =>
            s.id === activeChatId ? { ...s, messages: [...s.messages, aiMsg] } : s
          )
        );
        setResponseIndex((i) => i + 1);
        setIsTyping(false);
      }, 1500);
    }
  }, [activeChatId, responseIndex]);

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
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />
      </div>
    </div>
  );
}
