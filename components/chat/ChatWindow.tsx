"use client";

import React, { useState, useCallback } from "react";
import { Message } from "./types";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const initialMessages: Message[] = [];

const fakeAIResponses = [
  "I can definitely help with that! Let me search for some top-rated options within your budget.",
  "Here are a few choices that stand out for their quality and value. Which feature is most important to you?",
  "Great choice! Did you know there's a 10% bank discount currently available for this category on Amazon?\n\nCheck it out here: [Amazon Deals](https://amazon.com)",
  "I've tracked the price history for that item, and this is actually the lowest price it's been in 3 months! Worth grabbing now.\n\n```json\n{\n  \"price\": \"$199.99\",\n  \"discount\": \"20%\"\n}\n```",
  "If you want to save a bit more, I can show you a slightly older model that still performs exceptionally well.",
  "Would you like me to set a price drop alert for you? I'll notify you if it goes below your target price.\n- [x] Set Alert\n- [ ] Ignore",
];

function ChatHeader({ isTyping }: { isTyping: boolean }) {
  return (
    <header className="shrink-0 z-20 flex items-center gap-3 bg-ink-deeper px-4 py-3 border-b border-line-ondark">
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

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [responseIndex, setResponseIndex] = useState(0);

  const handleSend = useCallback((content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response delay
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
  }, [responseIndex]);

  const showWelcome = messages.length === 0 && !isTyping;

  return (
    <div className="flex flex-col h-dvh w-full bg-ink-deeper overflow-hidden relative">
      <ChatHeader isTyping={isTyping} />
      {showWelcome ? (
        <WelcomeScreen onSuggestionClick={handleSend} />
      ) : (
        <MessageList messages={messages} isTyping={isTyping} />
      )}
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}
