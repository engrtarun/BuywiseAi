"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 w-full max-w-[85%] sm:max-w-[75%] md:max-w-[65%] animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Avatar className="size-7 sm:size-8 shrink-0">
        <AvatarFallback className="bg-marigold text-ink-deeper font-heading font-bold text-[10px] sm:text-xs">
          B
        </AvatarFallback>
      </Avatar>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3.5 flex items-center gap-1.5 shadow-sm h-11">
        <span className="size-1.5 rounded-full bg-text-dim-ondark animate-bounce [animation-delay:-0.3s]" />
        <span className="size-1.5 rounded-full bg-text-dim-ondark animate-bounce [animation-delay:-0.15s]" />
        <span className="size-1.5 rounded-full bg-text-dim-ondark animate-bounce" />
      </div>
    </div>
  );
}
