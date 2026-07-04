"use client";

import React, { useRef, useState, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUp, Square } from "lucide-react";

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
}

export function ChatInput({ onSend, onStop, disabled, isGenerating }: ChatInputProps) {
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

  const handleSend = () => {
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

  return (
    <div className="shrink-0 bg-bg-main border-t border-border-light px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:px-4 sm:py-4 z-20">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-2">

        {/* Stop Generating button — shown above input while AI is responding */}
        {isGenerating && onStop && (
          <button
            onClick={onStop}
            className="
              self-center flex items-center gap-2 px-4 py-2 rounded-full
              bg-bg-input border border-border-light text-text-primary-light text-[13px] font-sans
              hover:border-brand-accent/50 hover:text-brand-accent active:scale-[0.97]
              transition-all duration-200 touch-manipulation shadow-sm
              animate-in fade-in slide-in-from-bottom-1 duration-200
            "
          >
            <Square className="size-3.5 fill-current" />
            Stop generating
          </button>
        )}

        <div className="flex items-end gap-2 bg-bg-input rounded-3xl border border-border-light p-1 pr-1.5 focus-within:border-brand-accent/50 transition-colors shadow-sm">

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
              className="w-full bg-transparent px-4 py-3 sm:py-3.5 text-[15px] text-text-primary-light outline-none font-sans resize-none z-10 self-center"
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
            className={`flex items-center justify-center size-10 shrink-0 rounded-full bg-brand-accent text-white transition-all duration-200 shadow-md touch-manipulation mb-[2px] ${!inputText.trim() || disabled ? "opacity-40" : "hover:scale-105 hover:brightness-110 active:scale-95"
              }`}
          >
            <ArrowUp className="size-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
