"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 mb-2">
      <div className="flex items-center justify-center size-12 rounded-2xl bg-gradient-to-tr from-marigold to-yellow-400 text-ink-deeper shadow-lg shadow-marigold/20">
        <Sparkles className="size-6 text-zinc-900 fill-zinc-900" />
      </div>
      <span className="font-heading font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
        BuyWise AI
      </span>
    </div>
  );
}
