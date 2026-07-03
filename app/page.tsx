"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowUp, ArrowDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ──────────────────────────────────────────────
   Types & Dummy AI Responses
   ────────────────────────────────────────────── */

type Role = "assistant" | "user";

interface Message {
  id: string;
  role: Role;
  content: string;
}

const initialMessages: Message[] = [
  {
    id: "init-1",
    role: "assistant",
    content:
      "Hey there! 👋 I'm BuyWise AI, your smart shopping assistant. Tell me what you're looking for and I'll find you the best deals.",
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
    <header
      className="
        shrink-0 z-20
        flex items-center gap-3 bg-ink-deeper
        px-4 py-3 border-b border-line-ondark
      "
    >
      <div className="w-full max-w-3xl mx-auto flex items-center gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="bg-marigold text-ink-deeper font-heading font-extrabold text-base">
            B
          </AvatarFallback>
        </Avatar>
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
    <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%] md:max-w-[65%]">
      <Avatar className="size-7 sm:size-8 shrink-0">
        <AvatarFallback className="bg-marigold text-ink-deeper font-heading font-bold text-[10px] sm:text-xs">
          B
        </AvatarFallback>
      </Avatar>
      <div
        dir="auto"
        className="bg-white/5 backdrop-blur-sm border border-white/10 text-text-ondark rounded-2xl rounded-bl-sm px-4 py-3 text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-sm font-sans"
      >
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div
        dir="auto"
        className="bg-marigold text-ink-deeper rounded-2xl rounded-br-sm px-4 py-3 text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-sm max-w-[85%] sm:max-w-[75%] md:max-w-[65%] font-sans font-medium"
      >
        {text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Avatar className="size-7 sm:size-8 shrink-0">
        <AvatarFallback className="bg-marigold text-ink-deeper font-heading font-bold text-[10px] sm:text-xs">
          B
        </AvatarFallback>
      </Avatar>
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3.5 flex items-center gap-1.5 shadow-sm h-11">
        <span className="size-1.5 rounded-full bg-text-dim-ondark animate-bounce [animation-delay:-0.3s]" />
        <span className="size-1.5 rounded-full bg-text-dim-ondark animate-bounce [animation-delay:-0.15s]" />
        <span className="size-1.5 rounded-full bg-text-dim-ondark animate-bounce" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Page component
   ────────────────────────────────────────────── */

// No manual height offsets needed for flex layout

export default function ChatShell() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [responseIndex, setResponseIndex] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef = useRef(true);
  const prevMessagesLength = useRef(messages.length);
  const isTouchDevice = useRef(false);

  useEffect(() => {
    isTouchDevice.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }, []);

  useEffect(() => {
    const isNewMessage = messages.length > prevMessagesLength.current;
    prevMessagesLength.current = messages.length;

    const timer = setTimeout(() => {
      if (isAtBottomRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } else if (isNewMessage) {
        setShowScrollButton(true);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
    isAtBottomRef.current = true;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    isAtBottomRef.current = isNearBottom;
    if (isNearBottom && showScrollButton) setShowScrollButton(false);
  };

  const sendMessage = useCallback(() => {
    const content = inputText.trim();
    if (!content || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    isAtBottomRef.current = true;
    setShowScrollButton(false);
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fakeAIResponses[responseIndex % fakeAIResponses.length],
      };
      setMessages((prev) => [...prev, aiMessage]);
      setResponseIndex((prev) => prev + 1);
      setIsTyping(false);
    }, 1500);
  }, [inputText, isTyping, responseIndex]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-dvh w-full bg-ink-deeper overflow-hidden relative">

      {/* Header */}
      <ChatHeader isTyping={isTyping} />

      {/* Native scrollable message feed via Radix ScrollArea */}
      <ScrollArea
        viewportRef={viewportRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0"
      >
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 sm:gap-6 px-4 py-4">
          {messages.map((msg) =>
            msg.role === "assistant" ? (
              <AiBubble key={msg.id} text={msg.content} />
            ) : (
              <UserBubble key={msg.id} text={msg.content} />
            )
          )}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      {/* Floating scroll-to-bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 bg-ink-deep border border-line-ondark text-text-ondark text-[13px] font-mono rounded-full shadow-lg hover:border-marigold transition-all animate-in fade-in slide-in-from-bottom-2"
        >
          New message
          <ArrowDown className="size-4 text-marigold" />
        </button>
      )}

      {/* Input bar */}
      <div className="shrink-0 bg-ink-deeper border-t border-line-ondark px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:px-4 sm:py-4 z-20">
        <div className="w-full max-w-3xl mx-auto">
          <form
            onSubmit={handleFormSubmit}
            className="flex items-center gap-2 bg-ink-deep rounded-full border border-line-ondark p-1 pr-1.5 focus-within:border-marigold/50 transition-colors shadow-sm"
          >
            <input
              ref={inputRef}
              type="text"
              dir="auto"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask BuyWise anything…"
              autoComplete="off"
              autoCapitalize="sentences"
              enterKeyHint="send"
              className="flex-1 h-11 bg-transparent px-4 text-[15px] text-text-ondark placeholder:text-text-dim-ondark outline-none font-sans"
            />
            <button
              type="submit"
              aria-label="Send message"
              className={`flex items-center justify-center size-10 shrink-0 rounded-full bg-marigold text-ink-deeper active:scale-95 transition-all shadow-md touch-manipulation ${
                !inputText.trim() || isTyping ? "opacity-40" : "hover:bg-marigold-dark"
              }`}
            >
              <ArrowUp className="size-5 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
