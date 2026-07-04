"use client";

import React, { useRef, useState, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUp, Square, LogIn } from "lucide-react";

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
}

export function ChatInput({ onSend, onStop, disabled, isGenerating, guestLimitReached = false, cooldownUntil = null, onLoginClick }: ChatInputProps) {
  const [inputText, setInputText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    if (guestLimitReached || timeLeft > 0) return;
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

  if (guestLimitReached) {
    return (
      <div className="shrink-0 bg-ink-deeper border-t border-line-ondark px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:px-4 sm:py-4 z-20 transition-opacity duration-300">
        <div className="w-full max-w-3xl mx-auto">
          <button
            onClick={onLoginClick}
            className="
              w-full flex items-center justify-between gap-3 px-4 py-3.5 
              rounded-2xl bg-white/[0.03] border border-marigold/30 
              text-text-dim-ondark text-[15px] cursor-pointer hover:bg-white/[0.05] 
              transition-colors group
            "
          >
            <span className="font-sans">Log in to continue chatting...</span>
            <div className="size-8 rounded-full bg-marigold flex items-center justify-center shrink-0 text-ink-deeper shadow-md shadow-marigold/20 group-hover:scale-105 transition-transform">
              <LogIn className="size-4" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 bg-ink-deeper border-t border-line-ondark px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:px-4 sm:py-4 z-20 transition-opacity duration-300">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-2">

        {/* Stop Generating button — shown above input while AI is responding */}
        {isGenerating && onStop && (
          <button
            onClick={onStop}
            className="
              self-center flex items-center gap-2 px-4 py-2 rounded-full
              bg-ink-deep border border-line-ondark text-text-ondark text-[13px] font-sans
              hover:border-chili/50 hover:text-chili active:scale-[0.97]
              transition-all duration-200 touch-manipulation shadow-sm cursor-pointer
              animate-in fade-in slide-in-from-bottom-1 duration-200
            "
          >
            <Square className="size-3.5 fill-current" />
            Stop generating
          </button>
        )}

        <div className="flex items-end gap-2 bg-ink-deep rounded-3xl border border-line-ondark p-1 pr-1.5 focus-within:border-marigold/50 transition-colors shadow-sm">

          <div className="relative flex-1 flex min-h-[44px] sm:min-h-[48px]">
            {/* Custom Animated Placeholder */}
            {!inputText && (
              <div className="absolute inset-0 pointer-events-none px-4 flex items-center overflow-hidden">
                {placeholders.map((text, i) => (
                  <span
                    key={i}
                    className={`
                      absolute left-4 right-4 text-[15px] text-text-dim-ondark font-sans truncate
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
              className="w-full bg-transparent px-4 py-3 sm:py-3.5 text-[15px] text-text-ondark outline-none font-sans resize-none z-10 self-center"
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
            className={`flex items-center justify-center size-10 shrink-0 rounded-full bg-marigold text-ink-deeper transition-all duration-200 shadow-md touch-manipulation mb-[2px] ${!inputText.trim() || disabled || timeLeft > 0 ? "opacity-40 cursor-not-allowed" : "hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer"
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
  );
}
