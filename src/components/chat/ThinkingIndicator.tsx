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
    <div className="flex flex-col gap-2 w-full animate-in fade-in duration-300 py-2">
      <div className="flex items-center gap-3 w-full px-2">
        <div className="relative flex items-center justify-center shrink-0">
          {mode === "deep_research" ? (
            <Brain className="size-5 text-brand-accent animate-pulse" />
          ) : (
            <Sparkles className="size-5 text-brand-accent animate-pulse" />
          )}
          <div className="absolute inset-0 rounded-full bg-brand-accent/20 animate-ping opacity-75" style={{ animationDuration: '2s' }} />
        </div>

        {/* Cycling Label with Fade Transition */}
        <div className="relative flex-1 h-6 overflow-hidden">
          {stages.map((stage, idx) => (
            <span
              key={stage}
              className={`
                absolute inset-0 flex items-center text-[14px] font-medium font-sans text-foreground/80 tracking-wide
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
