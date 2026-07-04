"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, LogIn, MessageCircle, Clock, Bookmark } from "lucide-react";

interface GuestLimitReachedCardProps {
  onLoginClick: () => void;
}

export function GuestLimitReachedCard({ onLoginClick }: GuestLimitReachedCardProps) {
  return (
    <div className="w-full max-w-[90%] sm:max-w-[80%] md:max-w-[70%] animate-in fade-in slide-in-from-bottom-2 duration-400">
      <div className="flex items-end gap-2 w-full">
        {/* Avatar */}
        <Avatar className="size-7 sm:size-8 shrink-0">
          <AvatarFallback className="bg-marigold/20 text-marigold font-heading font-bold text-[10px] sm:text-xs">
            <Sparkles className="size-3.5" />
          </AvatarFallback>
        </Avatar>

        {/* Card body */}
        <div
          className="
            bg-gradient-to-br from-white/[0.06] to-white/[0.02]
            backdrop-blur-md border border-marigold/20 border-l-2 border-l-marigold
            text-text-ondark rounded-2xl rounded-bl-sm
            px-5 py-4 w-full min-w-0 shadow-lg shadow-marigold/5
          "
        >
          {/* Heading */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="size-6 rounded-lg bg-marigold/15 flex items-center justify-center">
              <Sparkles className="size-3.5 text-marigold" />
            </div>
            <h3 className="font-heading font-bold text-[15px] text-marigold tracking-tight">
              Free messages used up
            </h3>
          </div>

          {/* Description */}
          <p className="text-text-ondark/90 text-[14px] font-sans leading-relaxed mb-3.5">
            You&apos;ve used your <strong className="text-marigold">3 free messages</strong>. Log in to
            continue chatting with BuyWise AI and unlock everything:
          </p>

          {/* Benefits list */}
          <ul className="flex flex-col gap-1.5 mb-4 text-[13px] text-text-dim-ondark font-sans">
            <li className="flex items-center gap-2">
              <MessageCircle className="size-3.5 text-marigold/70 shrink-0" />
              Unlimited AI conversations
            </li>
            <li className="flex items-center gap-2">
              <Bookmark className="size-3.5 text-marigold/70 shrink-0" />
              Saved chat history across devices
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-3.5 text-marigold/70 shrink-0" />
              Personalised product recommendations
            </li>
          </ul>

          {/* Login CTA */}
          <button
            onClick={onLoginClick}
            className="
              inline-flex items-center justify-center gap-2
              w-full sm:w-auto
              px-5 py-2.5 rounded-xl
              bg-marigold text-ink-deeper font-sans font-bold text-[14px]
              hover:bg-marigold-dark hover:scale-[1.02]
              active:scale-[0.98]
              transition-all duration-200 shadow-md shadow-marigold/20
              cursor-pointer touch-manipulation
            "
          >
            <LogIn className="size-4" />
            Log in to continue
          </button>
        </div>
      </div>
    </div>
  );
}
