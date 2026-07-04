"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Clock } from "lucide-react";

interface DailyLimitReachedCardProps {
  message?: string;
}

export function DailyLimitReachedCard({ message }: DailyLimitReachedCardProps) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    // Calculate time remaining until next midnight IST
    const updateCountdown = () => {
      // Get current UTC time
      const now = new Date();
      
      // Calculate current IST time (UTC + 5:30)
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + istOffset);
      
      // Calculate next midnight IST
      const nextMidnightIST = new Date(istTime);
      nextMidnightIST.setHours(24, 0, 0, 0); // 00:00:00 next day
      
      const diffMs = nextMidnightIST.getTime() - istTime.getTime();
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setCountdown(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto px-4 py-8">
      <div className="w-full max-w-[480px] sm:max-w-[560px] mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
        
        {/* Logo */}
        <div className="relative group mb-8">
          <div className="size-20 sm:size-24 rounded-3xl bg-gradient-to-br from-marigold to-marigold-dark flex items-center justify-center shadow-lg shadow-marigold/20">
            <Sparkles className="size-10 sm:size-12 text-ink-deeper" />
          </div>
          {/* Subtle glow ring */}
          <div className="absolute inset-0 rounded-3xl bg-marigold/20 blur-xl -z-10 scale-150 transition-colors duration-300 pointer-events-none" />
        </div>

        {/* Content Card */}
        <div className="w-full bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-md border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
          
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-ondark tracking-tight mb-3">
            Daily Limit Reached
          </h2>
          
          <p className="text-sm sm:text-[15px] text-text-dim-ondark font-sans leading-relaxed mb-6 max-w-sm mx-auto">
            {message ?? "You've reached today's message limit (25/25) for BuyWise AI. To ensure consistent quality for everyone, we cap daily interactions."}
          </p>

          <div className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl bg-marigold/10 border border-marigold/20 text-marigold font-medium text-[15px] mb-2">
            <Clock className="size-5 shrink-0" />
            <span>Limit resets in {countdown}</span>
          </div>
          
          <p className="text-xs text-text-dim-ondark font-sans mt-2">
            Resets automatically at Midnight IST.
          </p>

        </div>
      </div>
    </div>
  );
}
