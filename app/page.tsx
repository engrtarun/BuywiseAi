"use client";

import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowUp } from "lucide-react";

/* ──────────────────────────────────────────────
   Types & Dummy AI Responses
   ────────────────────────────────────────────── */

type Role = "ai" | "user";

interface Message {
  id: string;
  role: Role;
  text: string;
}

const initialMessages: Message[] = [
  {
    id: "init-1",
    role: "ai",
    text: "Hey there! 👋 I'm BuyWise, your smart shopping assistant. Tell me what you're looking for and I'll find you the best deals.",
  },
];

const fakeAIResponses = [
  "I can definitely help with that! Let me search for some top-rated options within your budget.",
  "Here are a few choices that stand out for their quality and value. Which feature is most important to you?",
  "Great choice! Did you know there's a 10% bank discount currently available for this category on Amazon?",
  "I've tracked the price history for that item, and this is actually the lowest price it's been in 3 months! Worth grabbing now.",
  "If you want to save a bit more, I can show you a slightly older model that still performs exceptionally well.",
  "Would you like me to set a price drop alert for you? I'll notify you if it goes below your target price.",
];

/* ──────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────── */

function ChatHeader({ isTyping }: { isTyping: boolean }) {
  return (
    <header className="flex items-center gap-3 bg-ink-deeper px-4 py-3 shrink-0 border-b border-line-ondark sticky top-0 z-10 w-full">
      <div className="w-full max-w-3xl mx-auto flex items-center gap-3">
        {/* Avatar */}
        <Avatar size="lg" className="size-10 after:border-none shrink-0">
          <AvatarFallback className="bg-marigold text-ink-deeper font-heading font-extrabold text-base">
            B
          </AvatarFallback>
        </Avatar>

        {/* Name + status */}
        <div className="flex flex-col min-w-0">
          <span className="font-heading font-bold text-[15px] leading-tight text-text-ondark tracking-tight">
            BuyWise
          </span>
          <span className="font-mono text-[11px] leading-tight text-marigold flex items-center gap-1.5 mt-0.5 min-h-[14px]">
            {isTyping ? (
              <>
                <span className="inline-block size-[6px] rounded-full bg-marigold animate-pulse" />
                typing
              </>
            ) : (
              <>
                <span className="inline-block size-[6px] rounded-full bg-marigold" />
                online
              </>
            )}
          </span>
        </div>
      </div>
    </header>
  );
}

function AiBubble({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-start gap-2 w-full max-w-[85%] sm:max-w-[75%] md:max-w-[65%]">
      <div 
        dir="auto"
        className="bg-paper text-text-onlight rounded-2xl rounded-bl-sm px-4 py-3 text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-sm font-sans"
      >
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end w-full">
      <div 
        dir="auto"
        className="bg-marigold text-text-onlight rounded-2xl rounded-br-sm px-4 py-3 text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-sm max-w-[85%] sm:max-w-[75%] md:max-w-[65%] font-sans"
      >
        {text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start max-w-[85%] sm:max-w-[75%] md:max-w-[65%] animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-paper rounded-2xl rounded-bl-sm px-4 py-3.5 flex items-center gap-1.5 shadow-sm">
        <span className="size-2 rounded-full bg-text-dim-onlight animate-bounce [animation-delay:0ms]" />
        <span className="size-2 rounded-full bg-text-dim-onlight animate-bounce [animation-delay:150ms]" />
        <span className="size-2 rounded-full bg-text-dim-onlight animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Page component
   ────────────────────────────────────────────── */

export default function ChatShell() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [responseIndex, setResponseIndex] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current !== null) {
        window.clearTimeout(aiTimeoutRef.current);
      }
    };
  }, []);

  const trimmedInput = inputText.trim();
  const isSendDisabled = !trimmedInput || isTyping;

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSendDisabled) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: trimmedInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);
    inputRef.current?.focus();

    const delay = Math.floor(Math.random() * 500) + 1000;
    const responseText = fakeAIResponses[responseIndex % fakeAIResponses.length];

    aiTimeoutRef.current = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          text: responseText,
        },
      ]);
      setResponseIndex((prev) => prev + 1);
      setIsTyping(false);
      aiTimeoutRef.current = null;
    }, delay);
  };

  return (
    <main className="flex flex-col h-dvh w-full bg-ink-deeper overflow-hidden">
      {/* Header spanning full width, content constrained */}
      <ChatHeader isTyping={isTyping} />

      {/* Scrollable messages area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-hide">
        <div
          className="w-full max-w-3xl mx-auto flex flex-col gap-4 sm:gap-6 pb-2"
          aria-live="polite"
        >
          {messages.map((msg) =>
            msg.role === "ai" ? (
              <AiBubble key={msg.id} text={msg.text} />
            ) : (
              <UserBubble key={msg.id} text={msg.text} />
            )
          )}

          {isTyping && <TypingIndicator />}

          {/* Auto-scroll anchor */}
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {/* Input area, fixed to bottom */}
      <div className="shrink-0 bg-ink-deeper border-t border-line-ondark w-full p-3 sm:p-4 pb-safe">
        <div className="w-full max-w-3xl mx-auto">
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 relative bg-ink-deep rounded-full border border-line-ondark p-1 pr-1.5 focus-within:border-marigold/50 transition-colors shadow-sm"
          >
            <input
              ref={inputRef}
              type="text"
              dir="auto"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask BuyWise anything…"
              autoComplete="off"
              enterKeyHint="send"
              spellCheck={false}
              className="flex-1 h-10 sm:h-12 bg-transparent px-4 sm:px-5 text-[14px] sm:text-[15px] text-text-ondark placeholder:text-text-dim-ondark outline-none font-sans"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={isSendDisabled}
              aria-label="Send message"
              className="flex items-center justify-center size-10 sm:size-11 shrink-0 rounded-full bg-marigold text-ink-deeper hover:bg-marigold-dark active:scale-95 disabled:opacity-50 disabled:hover:bg-marigold disabled:active:scale-100 transition-all shadow-md"
            >
              <ArrowUp className="size-5 stroke-[2.5]" />
            </button>
          </form>
          {/* Small safe-area padding helper for mobile */}
          <div className="h-2 sm:h-0" />
        </div>
      </div>
    </main>
  );
}
