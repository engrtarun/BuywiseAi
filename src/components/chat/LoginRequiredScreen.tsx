"use client";

import React from "react";
import { Sparkles, MessageCircle, Bookmark, Clock, LogIn, ArrowRight } from "lucide-react";

interface LoginRequiredScreenProps {
  onLoginClick?: () => void;
}

export function LoginRequiredScreen({ onLoginClick }: LoginRequiredScreenProps) {
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
            Unlock the full <span className="text-marigold">BuyWise AI</span> experience
          </h2>
          
          <p className="text-sm sm:text-[15px] text-text-dim-ondark font-sans leading-relaxed mb-6 max-w-sm mx-auto">
            You&apos;ve explored BuyWise AI as a guest — log in to keep going and unlock:
          </p>

          <ul className="flex flex-col gap-3.5 mb-8 w-full max-w-xs mx-auto text-left">
            <li className="flex items-center gap-3 text-[14px] sm:text-[15px] text-text-ondark/90 font-medium">
              <div className="size-8 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                <MessageCircle className="size-4 text-marigold" />
              </div>
              Unlimited AI conversations
            </li>
            <li className="flex items-center gap-3 text-[14px] sm:text-[15px] text-text-ondark/90 font-medium">
              <div className="size-8 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                <Bookmark className="size-4 text-marigold" />
              </div>
              Saved chat history across all your devices
            </li>
            <li className="flex items-center gap-3 text-[14px] sm:text-[15px] text-text-ondark/90 font-medium">
              <div className="size-8 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                <Clock className="size-4 text-marigold" />
              </div>
              Personalised product recommendations
            </li>
          </ul>

          <button
            onClick={onLoginClick}
            className="
              flex items-center justify-center gap-2
              w-full max-w-xs
              px-6 py-3.5 rounded-xl
              bg-marigold text-ink-deeper font-sans font-bold text-[15px]
              hover:bg-marigold-dark hover:scale-[1.02]
              active:scale-[0.98]
              transition-all duration-200 shadow-lg shadow-marigold/20
              cursor-pointer touch-manipulation
            "
          >
            Log in to continue
            <ArrowRight className="size-4.5" />
          </button>

          <div className="mt-5 text-sm font-sans text-text-dim-ondark">
            New here?{" "}
            <a href="/signup" className="text-marigold hover:underline font-medium transition-colors">
              Sign up for free
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
