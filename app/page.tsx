"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowUp, ArrowDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getOrCreateActiveSession,
  getChatHistory,
  sendMessage as apiSendMessage,
} from "@/app/actions/chat";

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
    content: "Hey there! 👋 I'm BuyWise AI, your smart shopping assistant. Tell me what you're looking for and I'll find you the best deals.",
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
      <div className="bg-paper rounded-2xl rounded-bl-sm px-4 py-4 flex flex-col gap-2.5 shadow-sm w-[120px]">
        <Skeleton className="h-2.5 w-full bg-line-onlight rounded-full" />
        <Skeleton className="h-2.5 w-2/3 bg-line-onlight rounded-full" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Page component
   ────────────────────────────────────────────── */

export default function ChatShell() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [responseIndex, setResponseIndex] = useState(0);
  
  // Supabase states
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Auto-scroll refs and state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const prevMessagesLength = useRef(messages.length);

  // Load session & chat history on mount
  useEffect(() => {
    async function initChat() {
      try {
        setIsLoading(true);
        setError(null);
        const sid = await getOrCreateActiveSession();
        setSessionId(sid);
        const history = await getChatHistory(sid);
        if (history.length > 0) {
          setMessages(
            history.map((msg) => ({
              id: msg.id,
              role: msg.sender === "ai" ? "assistant" : "user",
              content: msg.message,
            }))
          );
        } else {
          setMessages(initialMessages);
        }
      } catch (err: any) {
        console.error("Failed to initialize chat:", err);
        const errMsg = err.message || "";
        if (
          errMsg.includes("User is not logged in") ||
          errMsg.includes("Unauthorized") ||
          errMsg.includes("Authentication failed")
        ) {
          router.push("/login");
        } else {
          setError("Failed to load chat history. Please try refreshing.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    initChat();
  }, [router]);

  // Auto-scroll logic triggered on messages or typing state change
  useEffect(() => {
    const isNewMessage = messages.length > prevMessagesLength.current;
    prevMessagesLength.current = messages.length;

    // Use a short timeout to ensure the DOM has painted the new bubble/skeleton
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
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // We consider the user "at the bottom" if they are within 100px of the absolute bottom
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    isAtBottomRef.current = isNearBottom;
    
    // Hide the floating button if they manually scroll to the bottom
    if (isNearBottom && showScrollButton) {
      setShowScrollButton(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || isTyping || !sessionId) return;

    const tempUserMsgId = Date.now().toString();

    // 1. Add user message locally
    const userMessage: Message = {
      id: tempUserMsgId,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setError(null);
    
    // Force scroll to bottom for the user's own sent message
    isAtBottomRef.current = true;
    setShowScrollButton(false);
    setTimeout(() => inputRef.current?.focus(), 0);

    try {
      // Persist user message to Supabase
      await apiSendMessage(sessionId, "user", content);

      // 2. Show typing indicator and wait
      setIsTyping(true);
      
      // Simulate network/thinking delay (1.5 seconds)
      setTimeout(async () => {
        try {
          const aiReplyText = fakeAIResponses[responseIndex % fakeAIResponses.length];
          
          // Persist AI reply to Supabase
          const aiMsg = await apiSendMessage(sessionId, "ai", aiReplyText);
          
          const aiMessage: Message = {
            id: aiMsg.id,
            role: "assistant",
            content: aiMsg.message,
          };
          
          setMessages((prev) => [...prev, aiMessage]);
          setResponseIndex((prev) => prev + 1);
        } catch (err: any) {
          console.error("Failed to save AI response:", err);
          setError("Failed to save AI message in database.");
        } finally {
          setIsTyping(false);
          // Refocus input if the user is still at the bottom
          if (isAtBottomRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }
      }, 1500);

    } catch (err: any) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Please check your connection.");
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-ink-deeper overflow-hidden relative">
      {/* Header */}
      <ChatHeader isTyping={isTyping} />

      {/* Scrollable messages area */}
      <ScrollArea 
        className="flex-1 min-h-0" 
        viewportRef={viewportRef}
        onScroll={handleScroll}
      >
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 sm:gap-6 p-4 pb-2">
          {isLoading ? (
            <div className="flex flex-col gap-4 sm:gap-6 w-full animate-pulse">
              <div className="flex flex-col items-start gap-2.5 max-w-[70%]">
                <Skeleton className="h-4 w-32 bg-line-onlight rounded-full" />
                <div className="bg-paper rounded-2xl rounded-bl-sm px-4 py-4 w-[280px] h-12 shadow-sm" />
              </div>
              <div className="flex flex-col items-end gap-2.5 max-w-[70%] ml-auto">
                <Skeleton className="h-4 w-24 bg-line-onlight rounded-full" />
                <div className="bg-marigold/40 rounded-2xl rounded-br-sm px-4 py-4 w-[200px] h-12 shadow-sm" />
              </div>
              <div className="flex flex-col items-start gap-2.5 max-w-[70%]">
                <Skeleton className="h-4 w-36 bg-line-onlight rounded-full" />
                <div className="bg-paper rounded-2xl rounded-bl-sm px-4 py-4 w-[250px] h-16 shadow-sm" />
              </div>
            </div>
          ) : (
            messages.map((msg) =>
              msg.role === "assistant" ? (
                <AiBubble key={msg.id} text={msg.content} />
              ) : (
                <UserBubble key={msg.id} text={msg.content} />
              )
            )
          )}

          {isTyping && <TypingIndicator />}
          
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      {/* Floating Scroll-to-bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-2 px-4 py-2 bg-ink-deep border border-line-ondark text-text-ondark text-[13px] font-mono rounded-full shadow-lg hover:bg-ink-deeper hover:border-marigold transition-all animate-in fade-in slide-in-from-bottom-2"
        >
          New message
          <ArrowDown className="size-4 text-marigold" />
        </button>
      )}

      {/* Input area, fixed to bottom */}
      <div className="shrink-0 relative bg-ink-deeper border-t border-line-ondark w-full p-3 sm:p-4 pb-safe z-10">
        <div className="w-full max-w-3xl mx-auto">
          {error && (
            <div className="mb-3 px-4 py-2 bg-destructive/15 border border-destructive/30 rounded-lg text-destructive text-[13px] flex items-center justify-between animate-in fade-in duration-300">
              <span className="font-sans">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-destructive hover:text-destructive/80 font-bold ml-2 text-[14px]"
              >
                ✕
              </button>
            </div>
          )}
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
              placeholder={isLoading ? "Loading chat..." : "Ask BuyWise anything…"}
              className="flex-1 h-10 sm:h-12 bg-transparent px-4 sm:px-5 text-[14px] sm:text-[15px] text-text-ondark placeholder:text-text-dim-ondark outline-none font-sans"
              disabled={isTyping || isLoading}
            />
            <button
              type="submit"
              onClick={handleSend}
              onTouchEnd={(e) => {
                // Prevent ghost clicks on mobile devices
                e.preventDefault();
                handleSend(e);
              }}
              disabled={!inputText.trim() || isTyping || isLoading}
              aria-label="Send message"
              className="flex items-center justify-center size-10 sm:size-11 shrink-0 rounded-full bg-marigold text-ink-deeper hover:bg-marigold-dark active:scale-95 disabled:opacity-50 disabled:hover:bg-marigold disabled:active:scale-100 transition-all shadow-md touch-manipulation"
            >
              <ArrowUp className="size-5 stroke-[2.5]" />
            </button>
          </form>
          {/* Small safe-area padding helper for mobile */}
          <div className="h-2 sm:h-0" />
        </div>
      </div>
    </div>
  );
}
