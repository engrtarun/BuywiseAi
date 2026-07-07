"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 mb-2">
      <div className="flex items-center justify-center size-12 min-w-[48px] min-h-[48px] shrink-0 rounded-2xl bg-gradient-to-tr from-marigold to-yellow-400 text-ink-deeper shadow-lg shadow-marigold/20 overflow-visible">
        <Sparkles className="size-6 text-zinc-900 fill-zinc-900 shrink-0" />
      </div>
      <span className="font-heading font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
        BuyWise AI
      </span>
    </div>
  );
}
