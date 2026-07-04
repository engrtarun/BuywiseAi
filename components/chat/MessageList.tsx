"use client";

import React, { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { ErrorMessageCard } from "./ErrorMessageCard";
import { GuestLimitReachedCard } from "./GuestLimitReachedCard";
import { Message, Feedback } from "./types";
import { ArrowDown } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  onRegenerate: () => void;
  onRetry: () => void;
  onFeedback: (id: string, feedback: Feedback) => void;
  guestLimitReached?: boolean;
  onLoginClick?: () => void;
}

export function MessageList({ messages, isTyping, onRegenerate, onRetry, onFeedback, guestLimitReached = false, onLoginClick }: MessageListProps) {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const prevMessagesLength = useRef(messages.length);

  // Find last AI message id
  const lastAiMessageId = [...messages].reverse().find((m) => m.role === "assistant" && m.status !== "error")?.id ?? null;

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

  return (
    <div className="flex-1 min-h-0 relative">
      <ScrollArea
        viewportRef={viewportRef}
        onScroll={handleScroll}
        className="h-full"
      >
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 sm:gap-6 px-4 py-4">
          {messages.map((msg) =>
            msg.status === "error" ? (
              <ErrorMessageCard 
                key={msg.id} 
                onRetry={onRetry} 
                errorType={msg.errorType}
                retryDelay={msg.retryDelay}
              />
            ) : (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLastAiMessage={msg.id === lastAiMessageId}
                onRegenerate={onRegenerate}
                onFeedback={onFeedback}
              />
            )
          )}
          {isTyping && <ThinkingIndicator />}
          {guestLimitReached && onLoginClick && (
            <GuestLimitReachedCard onLoginClick={onLoginClick} />
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 bg-ink-deep border border-line-ondark text-text-ondark text-[13px] font-mono rounded-full shadow-lg hover:border-marigold transition-all animate-in fade-in slide-in-from-bottom-2"
        >
          New message
          <ArrowDown className="size-4 text-marigold" />
        </button>
      )}
    </div>
  );
}
