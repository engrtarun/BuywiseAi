"use client";

import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Brain, Compass } from "lucide-react";
import { ChatMode } from "@/types/chat";

interface ThinkingIndicatorProps {
  mode?: ChatMode | null;
}

export function ThinkingIndicator({ mode = "explore" }: ThinkingIndicatorProps) {
  const [stageIndex, setStageIndex] = useState(0);

  const exploreStages = [
    "Understanding your request...",
    "Searching relevant products...",
    "Finalizing recommendations...",
  ];

  const deepResearchStages = [
    "Understanding your request...",
    "Analyzing product specifications...",
    "Cross-referencing reviews...",
    "Comparing top options...",
    "Structuring final analysis...",
  ];

  const stages = mode === "deep_research" ? deepResearchStages : exploreStages;

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % stages.length);
    }, 2500); // Change stage every 2.5 seconds
    return () => clearInterval(interval);
  }, [stages.length]);

  return (
    <div className="flex flex-col gap-2 w-full max-w-[85%] sm:max-w-[75%] md:max-w-[65%] animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-end gap-2 w-full">
        <Avatar className="size-7 sm:size-8 shrink-0 shadow-sm border border-marigold/20">
          <AvatarFallback className="bg-marigold text-ink-deeper font-heading font-bold text-[10px] sm:text-xs">
            B
          </AvatarFallback>
        </Avatar>

        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center shadow-sm relative overflow-hidden group min-w-[220px]">
          {/* Subtle animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent shimmer-bg" />

          {/* Icon */}
          <div className="relative flex items-center justify-center mr-3 shrink-0">
            {mode === "deep_research" ? (
              <Brain className="size-4 text-brand-accent animate-pulse" />
            ) : (
              <Compass className="size-4 text-brand-accent animate-pulse" />
            )}
            <Sparkles className="absolute -top-1 -right-1 size-2 text-marigold animate-[ping_2s_ease-in-out_infinite]" />
          </div>

          {/* Cycling Label with Fade Transition */}
          <div className="relative flex-1 h-5 overflow-hidden">
            {stages.map((stage, idx) => (
              <span
                key={stage}
                className={`
                  absolute inset-0 flex items-center text-[13px] font-sans text-text-primary-light/90 tracking-wide
                  transition-all duration-500 ease-in-out
                  ${idx === stageIndex 
                    ? "opacity-100 translate-y-0" 
                    : idx === (stageIndex - 1 + stages.length) % stages.length 
                      ? "opacity-0 -translate-y-2" 
                      : "opacity-0 translate-y-2"
                  }
                `}
              >
                {stage}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .shimmer-bg {
          background-size: 200% 100%;
          animation: shimmer-bg-anim 3s infinite linear;
        }
        @keyframes shimmer-bg-anim {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
