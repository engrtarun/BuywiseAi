"use client";

import React from "react";
import { Message } from "./types";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu } from "lucide-react";

/* ── Header ──────────────────────────────────────────── */

interface ChatHeaderProps {
  isTyping: boolean;
  onMenuToggle: () => void;
}

function ChatHeader({ isTyping, onMenuToggle }: ChatHeaderProps) {
  return (
    <header className="shrink-0 z-20 flex items-center gap-3 bg-ink-deeper px-4 py-3 border-b border-line-ondark">
      <div className="w-full max-w-3xl mx-auto flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="md:hidden size-9 flex items-center justify-center rounded-lg hover:bg-white/[0.06] active:scale-95 transition-all touch-manipulation text-text-ondark"
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </button>

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
  onSend: (content: string) => void;
  onMenuToggle: () => void;
}

export function ChatWindow({ messages, isTyping, onSend, onMenuToggle }: ChatWindowProps) {
  const showWelcome = messages.length === 0 && !isTyping;

  return (
    <div className="flex flex-col h-dvh w-full bg-ink-deeper overflow-hidden relative">
      <ChatHeader isTyping={isTyping} onMenuToggle={onMenuToggle} />
      {showWelcome ? (
        <WelcomeScreen onSuggestionClick={onSend} />
      ) : (
        <MessageList messages={messages} isTyping={isTyping} />
      )}
      <ChatInput onSend={onSend} disabled={isTyping} />
    </div>
  );
}
