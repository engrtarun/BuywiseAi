"use client";

import React from "react";
import { Message, Feedback } from "./types";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { OfflineBanner } from "./OfflineBanner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HamburgerButton } from "./HamburgerButton";
import { TemporaryChatBadge } from "./TemporaryChatBadge";

/* ── Header ──────────────────────────────────────────── */

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

function ChatHeader({ isSidebarOpen, onMenuToggle }: ChatHeaderProps) {
  return (
    <header className="shrink-0 z-20 flex items-center gap-3 bg-bg-main px-4 py-3 border-b border-border-light md:hidden">
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
  cooldownUntil?: number | null;
  isTemporaryChat?: boolean;
  onNewChat: () => void;
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
  cooldownUntil = null,
  isTemporaryChat = false,
  onNewChat,
}: ChatWindowProps) {
  const showWelcome = messages.length === 0 && !isTyping;

  return (
    <div className="flex flex-col h-dvh w-full bg-bg-main text-text-primary-light overflow-hidden relative">
      <ChatHeader isSidebarOpen={isSidebarOpen} onMenuToggle={onMenuToggle} />
      <OfflineBanner />
      {isTemporaryChat && <TemporaryChatBadge onExit={onNewChat} />}
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
        cooldownUntil={cooldownUntil}
        onLoginClick={onLoginClick}
      />
    </div>
  );
}
