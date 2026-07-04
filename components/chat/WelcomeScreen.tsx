"use client";

import React from "react";
import { Sparkles, Search, Gift, Smartphone, Laptop, Scale } from "lucide-react";
import { GuestLimitReachedCard } from "./GuestLimitReachedCard";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
  isGuest?: boolean;
  guestMessagesRemaining?: number;
  guestLimitReached?: boolean;
  onLoginClick?: () => void;
}

const suggestions = [
  {
    icon: Search,
    text: "Find best wireless headphones under ₹5,000",
  },
  {
    icon: Scale,
    text: "Compare top 3 washing machines",
  },
  {
    icon: Smartphone,
    text: "Best budget smartphones under ₹15,000",
  },
  {
    icon: Gift,
    text: "Suggest a gift for a 25-year-old",
  },
  {
    icon: Scale,
    text: "Compare iPhone vs Samsung flagship",
  },
  {
    icon: Laptop,
    text: "Find deals on laptops for students",
  },
];

export function WelcomeScreen({ onSuggestionClick, isGuest = false, guestMessagesRemaining = 0, guestLimitReached = false, onLoginClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto px-4 py-8">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Logo */}
        <div className="relative group cursor-pointer transition-all duration-300 hover:scale-105">
          <div className="size-20 sm:size-24 rounded-3xl bg-gradient-to-br from-marigold to-marigold-dark flex items-center justify-center shadow-lg shadow-marigold/20">
            <Sparkles className="size-10 sm:size-12 text-ink-deeper" />
          </div>
          {/* Subtle glow ring */}
          <div className="absolute inset-0 rounded-3xl bg-marigold/20 blur-xl -z-10 scale-150 group-hover:bg-marigold/30 transition-colors duration-300 pointer-events-none" />
        </div>

        {/* Welcome text */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-primary-light tracking-tight">
            Hi, I&apos;m <span className="text-marigold">BuyWise AI</span>
          </h1>
          <p className="text-sm sm:text-base text-text-secondary font-sans max-w-md mx-auto leading-relaxed">
            Your smart shopping assistant. Ask me to find, compare, or recommend
            products across Amazon &amp; Flipkart.
          </p>

          {/* Guest mode indicator badge */}
          {isGuest && (
            <div className="inline-flex items-center gap-2 mt-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.10] backdrop-blur-sm animate-in fade-in duration-500">
              <span className="text-xs font-mono text-text-dim-ondark">
                👋 Guest mode
              </span>
              <span className="w-px h-3 bg-line-ondark" />
              <span className="text-xs font-mono text-marigold font-medium">
                {guestMessagesRemaining} free message{guestMessagesRemaining !== 1 ? "s" : ""} left
              </span>
            </div>
          )}
          {/* Guest limit card */}
          {guestLimitReached && onLoginClick && (
            <div className="mt-6 flex justify-center w-full">
              <GuestLimitReachedCard onLoginClick={onLoginClick} />
            </div>
          )}
        </div>

        {/* Suggestion chips */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {suggestions.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.text}
                type="button"
                onClick={() => {
                  if (!guestLimitReached) onSuggestionClick(s.text);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  if (!guestLimitReached) onSuggestionClick(s.text);
                }}
                disabled={guestLimitReached}
                className={`
                  w-full h-full group flex items-center gap-3 text-left
                  px-4 py-3.5 rounded-2xl
                  bg-white/[0.03] border border-white/[0.08]
                  backdrop-blur-sm
                  transition-all duration-200 ease-out
                  touch-manipulation
                  ${guestLimitReached ? "opacity-50 cursor-not-allowed" : "hover:bg-white/[0.07] hover:border-marigold/30 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"}
                `}
              >
                <div className="size-9 rounded-xl bg-marigold/10 flex items-center justify-center shrink-0 group-hover:bg-marigold/20 transition-colors">
                  <Icon className="size-4.5 text-marigold" />
                </div>
                <span className="text-[13px] sm:text-[14px] text-text-primary-light font-sans leading-snug">
                  {s.text}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
