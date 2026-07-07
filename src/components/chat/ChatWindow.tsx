"use client";

import React from "react";
import { Message, Feedback, ChatMode } from "@/types/chat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { OfflineBanner } from "./OfflineBanner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HamburgerButton } from "./HamburgerButton";
import { TemporaryChatButton } from "./TemporaryChatButton";
import { QuickBuyButton } from "@/components/quick-buy/QuickBuyButton";
import { QuickBuyScreen } from "@/components/quick-buy/QuickBuyScreen";
import { ModeToggle } from "./ModeToggle";
import { Ghost } from "lucide-react";
import { FoodQuickBuyButton } from "@/components/quick-buy/FoodQuickBuyButton";
import { FoodQuickBuyScreen } from "@/components/quick-buy/FoodQuickBuyScreen";

/* ── Header ──────────────────────────────────────────── */

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
  isGuest: boolean;
  isTemporaryChat: boolean;
  onNewTemporaryChat?: () => void;
  onOpenQuickBuy: () => void;
  onOpenFoodQuickBuy: () => void;
}

function ChatHeader({ isSidebarOpen, onMenuToggle, isGuest, isTemporaryChat, onNewTemporaryChat, onOpenQuickBuy, onOpenFoodQuickBuy }: ChatHeaderProps) {
  return (
    <header className="shrink-0 z-20 flex items-center bg-bg-main border-b border-border-light h-14 transition-colors duration-500">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HamburgerButton isOpen={isSidebarOpen} onClick={onMenuToggle} />
          {/* Subtle Chat Indicator Area */}
          {isTemporaryChat && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2a2a2a] border border-white/10 text-xs font-semibold text-text-primary-dark select-none shadow-sm">
              <Ghost className="size-3.5 text-gray-400" /> Temporary Chat
            </div>
          )}
        </div>

        {/* Top-Right Action Area */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          {!isGuest && onNewTemporaryChat && (
            <TemporaryChatButton onClick={onNewTemporaryChat} isTemporaryChat={isTemporaryChat} />
          )}
          <QuickBuyButton onClick={onOpenQuickBuy} />
          <FoodQuickBuyButton onClick={onOpenFoodQuickBuy} />
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
  tokensUsed?: number;
  tokenLimit?: number;
  dailyLimitMessage?: string;
  onLoginClick?: () => void;
  cooldownUntil?: number | null;
  isTemporaryChat?: boolean;
  onNewChat: (mode?: ChatMode) => void;
  onNewTemporaryChat?: () => void;
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  activeMode: ChatMode | null;
  onProductBuy?: (product: any) => void;
  showQuickBuy: boolean;
  showFoodQuickBuy: boolean;
  onOpenQuickBuy: () => void;
  onCloseQuickBuy: () => void;
  onOpenFoodQuickBuy: () => void;
  onCloseFoodQuickBuy: () => void;
  dynamicPrompts?: string[];
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
  tokensUsed,
  tokenLimit,
  dailyLimitMessage,
  onLoginClick,
  cooldownUntil = null,
  isTemporaryChat = false,
  onNewChat,
  onNewTemporaryChat,
  selectedMode,
  onModeChange,
  activeMode,
  onProductBuy,
  showQuickBuy,
  showFoodQuickBuy,
  onOpenQuickBuy,
  onCloseQuickBuy,
  onOpenFoodQuickBuy,
  onCloseFoodQuickBuy,
  dynamicPrompts,
}: ChatWindowProps) {
  const [inputText, setInputText] = React.useState("");
  
  const showWelcome = messages.length === 0 && !isTyping;

  const isClarifyingActive = React.useMemo(() => {
    if (messages.length === 0) return false;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant") return false;
    // Fast check for clarifying_question or questionnaire in the raw JSON payload
    return !!last.clarifyingQuestion || last.content.includes('"ui_type":"clarifying_question"') || last.content.includes('"ui_type": "clarifying_question"') || last.content.includes('"ui_type":"questionnaire"') || last.content.includes('"ui_type": "questionnaire"');
  }, [messages]);

  const userMessageCount = React.useMemo(() => {
    return messages.filter(m => m.role === "user").length;
  }, [messages]);

  return (
    <div className="flex flex-col h-dvh w-full bg-bg-main text-text-primary-light overflow-hidden relative transition-colors duration-500">
      
      {/* Ghost Watermark Background for Temporary Chat */}
      {isTemporaryChat && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
          <Ghost className="w-[400px] h-[400px] text-white" strokeWidth={1} />
        </div>
      )}

      <ChatHeader 
        isSidebarOpen={isSidebarOpen} 
        onMenuToggle={onMenuToggle} 
        isGuest={isGuest} 
        isTemporaryChat={isTemporaryChat} 
        onNewTemporaryChat={onNewTemporaryChat} 
        onOpenQuickBuy={onOpenQuickBuy}
        onOpenFoodQuickBuy={onOpenFoodQuickBuy}
      />
      <OfflineBanner />
      {showWelcome ? (
        isTemporaryChat ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center animate-in fade-in zoom-in-95 duration-500">
            <Ghost className="size-24 text-gray-500 mb-6 drop-shadow-2xl opacity-60" strokeWidth={1} />
            <h2 className="text-3xl font-bold text-gray-200 font-heading mb-3 tracking-tight">You are in Ghost Mode</h2>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              Your messages in this temporary chat will not be saved to your history. Once you leave, they vanish forever.
            </p>
          </div>
        ) : (
          <WelcomeScreen
            onSuggestionClick={onSend}
            isGuest={isGuest}
            guestMessagesRemaining={guestMessagesRemaining}
            guestLimitReached={guestLimitReached}
            dailyLimitReached={dailyLimitReached}
            dailyLimitMessage={dailyLimitMessage}
            onLoginClick={onLoginClick}
            selectedMode={selectedMode}
            onModeChange={onModeChange}
            dynamicPrompts={dynamicPrompts}
          />
        )
      ) : (
        <MessageList
          messages={messages}
          isTyping={isTyping}
          onRegenerate={onRegenerate}
          onRetry={onRetry}
          onFeedback={onFeedback}
          onSend={onSend}
          onNewChat={onNewChat}
          setInputText={setInputText}
          mode={activeMode}
          onProductBuy={onProductBuy}
        />
      )}
      <ChatInput
        inputText={inputText}
        setInputText={setInputText}
        onSend={onSend}
        onStop={onStop}
        disabled={isTyping}
        isGenerating={isTyping}
        guestLimitReached={guestLimitReached}
        dailyLimitReached={dailyLimitReached}
        dailyLimitMessage={dailyLimitMessage}
        tokensUsed={tokensUsed}
        tokenLimit={tokenLimit}
        isGuest={isGuest}
        cooldownUntil={cooldownUntil}
        onLoginClick={onLoginClick}
        mode={activeMode || selectedMode}
        isClarifyingActive={isClarifyingActive}
        onModeChange={onModeChange}
        isModeLocked={!!activeMode}
        userMessageCount={userMessageCount}
        onNewChat={onNewChat}
        messages={messages}
      />

      {/* Quick Buy Overlay */}
      {showQuickBuy && <QuickBuyScreen onClose={onCloseQuickBuy} />}
      
      {/* Food Quick Buy Overlay */}
      {showFoodQuickBuy && <FoodQuickBuyScreen onClose={onCloseFoodQuickBuy} />}
    </div>
  );
}
