"use client";

import React from "react";
import { Message, Feedback } from "./types";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { OfflineBanner } from "./OfflineBanner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HamburgerButton } from "./HamburgerButton";

/* ── Header ──────────────────────────────────────────── */

interface ChatHeaderProps {
  isTyping: boolean;
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

function ChatHeader({ isTyping, isSidebarOpen, onMenuToggle }: ChatHeaderProps) {
  return (
    <header className="shrink-0 z-20 flex items-center gap-3 bg-ink-deeper px-4 py-3 border-b border-line-ondark">
      <div className="w-full max-w-3xl mx-auto flex items-center gap-3">
        {/* Animated hamburger ↔ X — mobile only */}
        <HamburgerButton isOpen={isSidebarOpen} onClick={onMenuToggle} />

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

/* ── ChatWindow ──────────────────────────────────────── */

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  isSidebarOpen: boolean;
  onSend: (content: string) => void;
  onStop: () => void;
  onRegenerate: () => void;
  onRetry: () => void;
  onFeedback: (id: string, feedback: Feedback) => void;
  onMenuToggle: () => void;
}

export function ChatWindow({
  messages,
  isTyping,
  isSidebarOpen,
  onSend,
  onStop,
  onRegenerate,
  onRetry,
  onFeedback,
  onMenuToggle,
}: ChatWindowProps) {
  const showWelcome = messages.length === 0 && !isTyping;

  return (
    <div className="flex flex-col h-dvh w-full bg-ink-deeper overflow-hidden relative">
      <ChatHeader isTyping={isTyping} isSidebarOpen={isSidebarOpen} onMenuToggle={onMenuToggle} />
      <OfflineBanner />
      {showWelcome ? (
        <WelcomeScreen onSuggestionClick={onSend} />
      ) : (
        <MessageList
          messages={messages}
          isTyping={isTyping}
          onRegenerate={onRegenerate}
          onRetry={onRetry}
          onFeedback={onFeedback}
        />
      )}
      <ChatInput onSend={onSend} onStop={onStop} disabled={isTyping} isGenerating={isTyping} />
    </div>
  );
}
