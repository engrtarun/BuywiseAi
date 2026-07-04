"use client";

import React, { useState } from "react";
import { EyeOff } from "lucide-react";

export function SpoilerText({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <span
      onClick={() => setRevealed(!revealed)}
      className={`
        relative inline-flex items-center mx-1 px-2 py-0.5 rounded cursor-pointer transition-all duration-300
        ${revealed ? "bg-black/10 text-inherit" : "bg-black text-transparent hover:bg-black/90"}
      `}
      title={revealed ? "Click to hide spoiler" : "Click to reveal spoiler"}
    >
      {!revealed && (
        <span className="absolute inset-0 flex items-center justify-center text-white/50">
          <EyeOff className="size-3.5" />
        </span>
      )}
      <span className={`transition-opacity duration-300 ${revealed ? "opacity-100" : "opacity-0 select-none"}`}>
        {children}
      </span>
    </span>
  );
}
