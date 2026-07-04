"use client";

import React from "react";
import { Message, Feedback } from "@/types/chat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { OfflineBanner } from "./OfflineBanner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HamburgerButton } from "./HamburgerButton";
import { TemporaryChatButton } from "./TemporaryChatButton";
import { QuickBuyButton } from "@/components/quick-buy/QuickBuyButton";
import { QuickBuyScreen } from "@/components/quick-buy/QuickBuyScreen";

/* ── Header ──────────────────────────────────────────── */

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
  isGuest: boolean;
  isTemporaryChat: boolean;
  onNewTemporaryChat?: () => void;
  onQuickBuyClick: () => void;
}

function ChatHeader({ isSidebarOpen, onMenuToggle, isGuest, isTemporaryChat, onNewTemporaryChat, onQuickBuyClick }: ChatHeaderProps) {
  return (
    <header className="shrink-0 z-20 flex items-center bg-bg-main px-4 py-3 border-b border-border-light h-14">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HamburgerButton isOpen={isSidebarOpen} onClick={onMenuToggle} />
          {/* Subtle Chat Indicator Area */}
          {isTemporaryChat && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium text-text-primary-dark select-none">
              <span className="text-marigold">⚡</span> Instant
            </div>
          )}
        </div>

        {/* Top-Right Action Area */}
        <div className="flex items-center gap-2">
          {!isGuest && onNewTemporaryChat && (
            <TemporaryChatButton onClick={onNewTemporaryChat} isTemporaryChat={isTemporaryChat} />
          )}
          <QuickBuyButton onClick={onQuickBuyClick} />
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
  isGuest?: boolean;
  guestMessagesRemaining?: number;
  guestLimitReached?: boolean;
  dailyLimitReached?: boolean;
  dailyMessagesRemaining?: number;
  dailyLimit?: number;
  onLoginClick?: () => void;
  cooldownUntil?: number | null;
  isTemporaryChat?: boolean;
  onNewChat: () => void;
  onNewTemporaryChat?: () => void;
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
  dailyLimitReached = false,
  dailyMessagesRemaining,
  dailyLimit,
  onLoginClick,
  cooldownUntil = null,
  isTemporaryChat = false,
  onNewChat,
  onNewTemporaryChat,
}: ChatWindowProps) {
  const [showQuickBuy, setShowQuickBuy] = React.useState(false);
  
  const showWelcome = messages.length === 0 && !isTyping;

  return (
    <div className="flex flex-col h-dvh w-full bg-bg-main text-text-primary-light overflow-hidden relative">
      <ChatHeader 
        isSidebarOpen={isSidebarOpen} 
        onMenuToggle={onMenuToggle} 
        isGuest={isGuest} 
        isTemporaryChat={isTemporaryChat} 
        onNewTemporaryChat={onNewTemporaryChat} 
        onQuickBuyClick={() => setShowQuickBuy(true)}
      />
      <OfflineBanner />
      {showWelcome ? (
        <WelcomeScreen
          onSuggestionClick={onSend}
          isGuest={isGuest}
          guestMessagesRemaining={guestMessagesRemaining}
          guestLimitReached={guestLimitReached}
          dailyLimitReached={dailyLimitReached}
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
        dailyLimitReached={dailyLimitReached}
        dailyMessagesRemaining={dailyMessagesRemaining}
        dailyLimit={dailyLimit}
        isGuest={isGuest}
        cooldownUntil={cooldownUntil}
        onLoginClick={onLoginClick}
      />

      {/* Quick Buy Overlay */}
      {showQuickBuy && <QuickBuyScreen onClose={() => setShowQuickBuy(false)} />}
    </div>
  );
}
