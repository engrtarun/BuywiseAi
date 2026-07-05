"use client";

import React, { useRef, useState, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUp, Square, LogIn, Clock, Bold, Italic, Eye, Plus } from "lucide-react";
import { QuickAccessMenu } from "./QuickAccessMenu";
import { SoundMuteToggle } from "@/components/shared/SoundMuteToggle";
import { UsageRing } from "@/components/ui/usage-ring";

const placeholders = [
  "BuyWise anything...",
  "Find best wireless headphones under ₹5,000",
  "Compare top 3 washing machines",
  "Best budget smartphones under ₹15,000",
  "Suggest a gift for a 25-year-old",
  "Compare iPhone vs Samsung flagship",
];

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled: boolean;
  isGenerating: boolean;
  guestLimitReached?: boolean;
  cooldownUntil?: number | null;
  onLoginClick?: () => void;
  isGuest?: boolean;
  dailyLimitReached?: boolean;
  dailyLimitMessage?: string;
  tokensUsed?: number;
  tokenLimit?: number;
}

export function ChatInput({ 
  onSend, 
  onStop, 
  disabled, 
  isGenerating, 
  guestLimitReached = false, 
  cooldownUntil = null, 
  onLoginClick,
  isGuest = false,
  dailyLimitReached = false,
  dailyLimitMessage,
  tokensUsed,
  tokenLimit
}: ChatInputProps) {
  const [inputText, setInputText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const [plusButtonRect, setPlusButtonRect] = useState<DOMRect | null>(null);

  const isDisabled = disabled || dailyLimitReached;

  // Rotate placeholder every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle cooldown timer
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!cooldownUntil || cooldownUntil <= Date.now()) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 100);

    // Set initial value immediately
    setTimeLeft(Math.ceil((cooldownUntil - Date.now()) / 1000));

    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const handleSend = () => {
    if (guestLimitReached || dailyLimitReached || timeLeft > 0) return;
    const content = inputText.trim();
    if (!content || disabled) return;

    onSend(content);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applyFormatting = (prefix: string, suffix: string = prefix) => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;

    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + selected + suffix + after;
    setInputText(newText);

    // Set cursor position after React re-renders
    setTimeout(() => {
      el.focus();
      if (selected.length > 0) {
        el.setSelectionRange(start, start + prefix.length + selected.length + suffix.length);
      } else {
        el.setSelectionRange(start + prefix.length, start + prefix.length);
      }
    }, 0);
  };

  if (guestLimitReached) {
    return (
      <div className="shrink-0 bg-bg-main border-t border-border-light px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:px-4 sm:py-4 z-20 transition-opacity duration-300">
        <div className="w-full max-w-3xl mx-auto">
          <button
            onClick={onLoginClick}
            className="
              w-full flex items-center justify-between gap-3 px-4 py-3.5 
              rounded-2xl bg-white/[0.03] border border-marigold/30 
              text-text-secondary text-[15px] cursor-pointer hover:bg-white/[0.05] 
              transition-colors group
            "
          >
            <span className="font-sans">Log in to continue chatting...</span>
            <div className="size-8 rounded-full bg-brand-accent flex items-center justify-center shrink-0 text-ink-deeper shadow-md shadow-marigold/20 group-hover:scale-105 transition-transform">
              <LogIn className="size-4" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`shrink-0 bg-bg-main border-t border-border-light px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:px-4 sm:py-4 z-20 transition-opacity duration-300 ${guestLimitReached ? "opacity-60" : ""}`}>
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-2">

        {/* Stop Generating button — shown above input while AI is responding */}
        {isGenerating && onStop && (
          <button
            onClick={onStop}
            className="
              self-center flex items-center gap-2 px-4 py-2 rounded-full
              bg-bg-input border border-border-light text-text-primary-light text-[13px] font-sans
              hover:border-brand-accent/50 hover:text-brand-accent active:scale-[0.97]
              transition-all duration-200 touch-manipulation shadow-sm cursor-pointer
              animate-in fade-in slide-in-from-bottom-1 duration-200
            "
          >
            <Square className="size-3.5 fill-current" />
            Stop generating
          </button>
        )}

        <div className="flex flex-col bg-bg-input rounded-3xl border border-border-light focus-within:border-brand-accent/50 transition-colors shadow-sm overflow-hidden">
          
          {/* Toolbar */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border-light bg-black/10">
            <button
              onClick={() => applyFormatting("**")}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary-light hover:bg-white/10 transition-colors active:scale-95"
              title="Bold (Ctrl+B)"
            >
              <Bold className="size-4" />
            </button>
            <button
              onClick={() => applyFormatting("*")}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary-light hover:bg-white/10 transition-colors active:scale-95"
              title="Italic (Ctrl+I)"
            >
              <Italic className="size-4" />
            </button>
            <div className="w-px h-4 bg-border-light mx-1" />
            <button
              onClick={() => applyFormatting("||")}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary-light hover:bg-white/10 transition-colors active:scale-95"
              title="Spoiler"
            >
              <Eye className="size-4" />
            </button>
          </div>

          <div className="flex items-end gap-2 p-1 pl-2 pr-1.5 pb-1.5">
            {/* Quick Actions + Button */}
            <SoundMuteToggle showTooltip={true} />
            <button
              ref={plusButtonRef}
              disabled={isDisabled}
              onClick={() => {
                if (plusButtonRef.current) {
                  setPlusButtonRect(plusButtonRef.current.getBoundingClientRect());
                }
                setIsQuickMenuOpen(!isQuickMenuOpen);
              }}
              className={`flex items-center justify-center size-10 shrink-0 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-text-secondary hover:text-text-primary-light self-end mb-[2px] ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
              aria-label="Quick Actions"
            >
              <Plus className={`size-5 transition-transform duration-200 ${isQuickMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
            </button>
            <QuickAccessMenu 
              isOpen={isQuickMenuOpen} 
              onClose={() => setIsQuickMenuOpen(false)} 
              anchorRect={plusButtonRect} 
            />

            <div className="relative flex-1 flex min-h-[44px] sm:min-h-[48px]">
            {/* Custom Animated Placeholder */}
            {!inputText && (
              <div className="absolute inset-0 pointer-events-none px-4 flex items-center overflow-hidden">
                {placeholders.map((text, i) => (
                  <span
                    key={i}
                    className={`
                      absolute left-4 right-4 text-[15px] text-text-secondary font-sans truncate
                      transition-all duration-500 ease-in-out
                      ${i === placeholderIndex
                        ? "opacity-100 translate-y-0"
                        : i === (placeholderIndex - 1 + placeholders.length) % placeholders.length
                          ? "opacity-0 -translate-y-3"
                          : "opacity-0 translate-y-3"
                      }
                    `}
                  >
                    {text}
                  </span>
                ))}
              </div>
            )}

            <TextareaAutosize
              ref={inputRef}
              dir="auto"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={dailyLimitReached ? (dailyLimitMessage ?? "Daily limit reached — resets at 12:00 AM") : ""}
              minRows={1}
              maxRows={5}
              disabled={guestLimitReached || dailyLimitReached}
              className={`w-full bg-transparent px-4 py-3 sm:py-3.5 text-[15px] text-text-primary-light outline-none font-sans resize-none z-10 self-center ${(guestLimitReached || dailyLimitReached) ? "cursor-not-allowed placeholder:text-text-destructive/80" : ""}`}
            />
          </div>

          {!isGuest && tokensUsed !== undefined && tokenLimit !== undefined && (
            <div className="flex items-center self-end mb-[8px] mr-1 shrink-0">
              <UsageRing value={tokensUsed} max={tokenLimit} size={26} />
            </div>
          )}

          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              if (!isDisabled) handleSend();
            }}
            onClick={(e) => {
              e.preventDefault();
              if (!isDisabled) handleSend();
            }}
            disabled={isDisabled || guestLimitReached || timeLeft > 0}
            aria-label="Send message"
            className={`flex items-center justify-center size-10 shrink-0 rounded-full bg-brand-accent text-white transition-all duration-200 shadow-md touch-manipulation mb-[2px] ${!inputText.trim() || isDisabled || guestLimitReached || timeLeft > 0 ? "opacity-40 cursor-not-allowed" : "hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer"
              }`}
          >
            {timeLeft > 0 ? (
              <span className="text-sm font-bold font-mono tracking-tighter">
                {timeLeft}s
              </span>
            ) : (
              <ArrowUp className="size-5 stroke-[2.5]" />
            )}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
