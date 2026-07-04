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
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

function ChatHeader({ isSidebarOpen, onMenuToggle }: ChatHeaderProps) {
  return (
    <header className="shrink-0 z-20 flex items-center gap-3 bg-ink-deeper px-4 py-3 border-b border-line-ondark md:hidden">
      <div className="w-full max-w-3xl mx-auto flex items-center gap-3">
        <HamburgerButton isOpen={isSidebarOpen} onClick={onMenuToggle} />
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
  /* Guest mode props */
  isGuest?: boolean;
  guestMessagesRemaining?: number;
  guestLimitReached?: boolean;
  onLoginClick?: () => void;
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
  isGuest = false,
  guestMessagesRemaining = 0,
  guestLimitReached = false,
  onLoginClick,
}: ChatWindowProps) {
  const showWelcome = messages.length === 0 && !isTyping;

  return (
    <div className="flex flex-col h-dvh w-full bg-ink-deeper overflow-hidden relative">
      <ChatHeader isSidebarOpen={isSidebarOpen} onMenuToggle={onMenuToggle} />
      <OfflineBanner />
      {showWelcome ? (
        <WelcomeScreen
          onSuggestionClick={onSend}
          isGuest={isGuest}
          guestMessagesRemaining={guestMessagesRemaining}
          guestLimitReached={guestLimitReached}
          onLoginClick={onLoginClick}
        />
      ) : (
        <MessageList
          messages={messages}
          isTyping={isTyping}
          onRegenerate={onRegenerate}
          onRetry={onRetry}
          onFeedback={onFeedback}
          guestLimitReached={guestLimitReached}
          onLoginClick={onLoginClick}
        />
      )}
      <ChatInput
        onSend={onSend}
        onStop={onStop}
        disabled={isTyping}
        isGenerating={isTyping}
        guestLimitReached={guestLimitReached}
      />
    </div>
  );
}
