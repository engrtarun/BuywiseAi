"use client";

import React, { useRef, useState, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUp } from "lucide-react";

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
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
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
    <div className="shrink-0 bg-ink-deeper border-t border-line-ondark px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:px-4 sm:py-4 z-20">
      <div className="w-full max-w-3xl mx-auto">
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
                          ? "opacity-0 -translate-y-3" // previous one slides up
                          : "opacity-0 translate-y-3" // next ones wait below
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
              placeholder="" // Handled manually above
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
            className={`flex items-center justify-center size-10 shrink-0 rounded-full bg-marigold text-ink-deeper transition-all duration-200 shadow-md touch-manipulation mb-[2px] ${!inputText.trim() || disabled ? "opacity-40" : "hover:scale-105 hover:brightness-110 active:scale-95"
              }`}
          >
            <ArrowUp className="size-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
