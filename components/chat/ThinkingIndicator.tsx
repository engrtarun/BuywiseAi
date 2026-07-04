"use client";

import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Hourglass } from "lucide-react";

/**
 * ThinkingIndicator — Pulsing Wave Animation (Option A)
 *
 * Shows 4 vertical bars that animate in a staggered wave pattern,
 * inside a glassmorphic bubble matching AI message styling.
 *
 * To swap to Option B (skeleton shimmer), replace this component's
 * inner content with the SkeletonShimmer variant below. No other
 * files need to change — just swap what's inside the bubble div.
 *
 * ── Option B swap example ──────────────────────────────────
 * Replace the <div className="flex items-end gap-1 ..."> block with:
 *
 *   <div className="flex flex-col gap-2 w-48">
 *     <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
 *       <div className="h-full w-full shimmer-gradient" />
 *     </div>
 *     <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden w-[75%]">
 *       <div className="h-full w-full shimmer-gradient" />
 *     </div>
 *     <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden w-[45%]">
 *       <div className="h-full w-full shimmer-gradient" />
 *     </div>
 *   </div>
 *
 * And add this CSS to globals.css:
 *   .shimmer-gradient {
 *     background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
 *     background-size: 200% 100%;
 *     animation: shimmer 1.5s ease-in-out infinite;
 *   }
 *   @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
 * ────────────────────────────────────────────────────────────
 */
export function ThinkingIndicator() {
  const [isTakingLong, setIsTakingLong] = useState(false);

  useEffect(() => {
    // 15 seconds timer
    const timer = setTimeout(() => {
      setIsTakingLong(true);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-2 w-full max-w-[85%] sm:max-w-[75%] md:max-w-[65%] animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-end gap-2 w-full">
      <Avatar className="size-7 sm:size-8 shrink-0">
        <AvatarFallback className="bg-marigold text-ink-deeper font-heading font-bold text-[10px] sm:text-xs">
          B
        </AvatarFallback>
      </Avatar>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-sm px-5 py-3.5 flex items-center shadow-sm h-11">
        {/* Wave bars */}
        <div className="flex items-end gap-[3px] h-5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="thinking-bar"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>

        {/* Label */}
        <span className="ml-3 text-[12px] font-mono text-text-dim-ondark tracking-wide thinking-label">
          Thinking
        </span>
      </div>
      </div>

      {isTakingLong && (
        <div className="ml-10 flex items-center gap-2 animate-in fade-in duration-700">
          <Hourglass className="size-3.5 text-marigold/70 animate-[spin_4s_linear_infinite]" />
          <span className="text-[13px] font-sans text-text-dim-ondark">
            This is taking a little longer than usual — hang tight, we&apos;re still working on it!
          </span>
        </div>
      )}

      {/* Scoped styles — CSS keyframes for the wave animation */}
      <style jsx>{`
        .thinking-bar {
          display: block;
          width: 3px;
          height: 6px;
          border-radius: 9999px;
          background-color: var(--color-marigold, #e8a33d);
          animation: wave 1s ease-in-out infinite;
          will-change: height, opacity;
        }

        @keyframes wave {
          0%, 100% {
            height: 6px;
            opacity: 0.5;
          }
          50% {
            height: 18px;
            opacity: 1;
          }
        }

        .thinking-label {
          animation: label-pulse 2s ease-in-out infinite;
        }

        @keyframes label-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
