"use client";

import React, { useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
          <TextareaAutosize
            ref={inputRef}
            dir="auto"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask BuyWise anything…"
            minRows={1}
            maxRows={5}
            className="flex-1 bg-transparent px-4 py-3 sm:py-3.5 text-[15px] text-text-ondark placeholder:text-text-dim-ondark outline-none font-sans resize-none"
          />
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
            className={`flex items-center justify-center size-10 shrink-0 rounded-full bg-marigold text-ink-deeper active:scale-95 transition-all shadow-md touch-manipulation mb-[2px] ${
              !inputText.trim() || disabled ? "opacity-40" : "hover:bg-marigold-dark"
            }`}
          >
            <ArrowUp className="size-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
