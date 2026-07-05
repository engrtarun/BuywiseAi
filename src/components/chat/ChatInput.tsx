"use client";

import React, { useRef, useState, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUp, Square, LogIn, Clock, Bold, Italic, Eye, Plus, Compass, Brain } from "lucide-react";
import { QuickAccessMenu } from "./QuickAccessMenu";
import { ChatMode } from "@/types/chat";

const placeholders = [
  "BuyWise anything...",
  "Find best wireless headphones under ₹5,000",
  "Compare top 3 washing machines",
  "Best budget smartphones under ₹15,000",
  "Suggest a gift for a 25-year-old",
  "Compare iPhone vs Samsung flagship",
];

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
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
  dailyMessagesRemaining?: number;
  dailyLimit?: number;
  mode?: ChatMode | null;
  onModeChange?: (mode: ChatMode) => void;
  isModeLocked?: boolean;
}

export function ChatInput({ 
  inputText,
  setInputText,
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
  dailyMessagesRemaining,
  dailyLimit,
  mode = "explore",
  onModeChange,
  isModeLocked = false
}: ChatInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const [plusButtonRect, setPlusButtonRect] = useState<DOMRect | null>(null);

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
      Promise.resolve().then(() => {
        setTimeLeft(0);
      });
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
    }, 250);

    const initial = Math.ceil((cooldownUntil - Date.now()) / 1000);
    Promise.resolve().then(() => {
      setTimeLeft(initial);
    });

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

  if (guestLimitReached || dailyLimitReached) {
    return (
      <div className="shrink-0 bg-bg-main border-t border-border-light px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:px-4 sm:py-4 z-20 transition-opacity duration-300">
        <div className="w-full max-w-3xl mx-auto">
          {guestLimitReached ? (
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
          ) : (
            <div className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-marigold/10 border border-marigold/20 text-marigold text-[15px]">
              <Clock className="size-4" />
              <span className="font-sans font-medium">{dailyLimitMessage ?? "You've reached your daily limit of 25 messages. Please come back tomorrow!"}</span>
            </div>
          )}
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
          {/* Toolbar with Mode Badge and Formatting Options */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-light bg-black/15 select-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-text-primary-light animate-in fade-in duration-200">
              {mode === "deep_research" ? (
                <>
                  <Brain className="size-3 text-marigold" />
                  <span className="text-text-secondary">Deep Research</span>
                </>
              ) : (
                <>
                  <Compass className="size-3 text-marigold" />
                  <span className="text-text-secondary">Explore Mode</span>
                </>
              )}
              {isModeLocked && (
                <span className="text-[9px] text-text-dim-ondark/60 font-mono ml-1 px-1 bg-white/5 rounded border border-white/5">Locked</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => applyFormatting("**")}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary-light hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
                title="Bold (Ctrl+B)"
              >
                <Bold className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting("*")}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary-light hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
                title="Italic (Ctrl+I)"
              >
                <Italic className="size-4" />
              </button>
              <div className="w-px h-4 bg-border-light mx-1" />
              <button
                type="button"
                onClick={() => applyFormatting("||")}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary-light hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
                title="Spoiler"
              >
                <Eye className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex items-end gap-2 p-1 pl-2 pr-1.5 pb-1.5">
            {/* Quick Actions + Button */}
            <button
              ref={plusButtonRef}
              onClick={() => {
                if (plusButtonRef.current) {
                  setPlusButtonRect(plusButtonRef.current.getBoundingClientRect());
                }
                setIsQuickMenuOpen(!isQuickMenuOpen);
              }}
              className="flex items-center justify-center size-10 shrink-0 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-text-secondary hover:text-text-primary-light self-end mb-[2px]"
              aria-label="Quick Actions"
            >
              <Plus className={`size-5 transition-transform duration-200 ${isQuickMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
            </button>
            <QuickAccessMenu 
              isOpen={isQuickMenuOpen} 
              onClose={() => setIsQuickMenuOpen(false)} 
              anchorRect={plusButtonRect} 
              selectedMode={mode || "explore"}
              onModeChange={onModeChange || (() => {})}
              isModeLocked={!!isModeLocked}
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
              placeholder=""
              minRows={1}
              maxRows={5}
              disabled={guestLimitReached}
              className={`w-full bg-transparent px-4 py-3 sm:py-3.5 text-[15px] text-text-primary-light outline-none font-sans resize-none z-10 self-center scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${guestLimitReached ? "cursor-not-allowed placeholder:text-text-dim-ondark/80" : ""}`}
            />
          </div>

          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              handleSend();
            }}
            onClick={(e) => {
              e.preventDefault();
              handleSend();
            }}
            aria-label="Send message"
            className={`flex items-center justify-center size-10 shrink-0 rounded-full bg-brand-accent text-white transition-all duration-200 shadow-md touch-manipulation mb-[2px] ${!inputText.trim() || disabled || guestLimitReached || timeLeft > 0 ? "opacity-40 cursor-not-allowed" : "hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer"
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

        {/* Daily Usage Indicator */}
        {!isGuest && dailyMessagesRemaining !== undefined && dailyLimit !== undefined && (
          <div className="text-center mt-1">
            <span className="text-[11px] font-mono text-text-dim-ondark opacity-60">
              {dailyLimit - dailyMessagesRemaining}/{dailyLimit} messages today
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
