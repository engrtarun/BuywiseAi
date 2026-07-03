"use client";

import React from "react";
import { Sparkles, Search, Gift, Smartphone, Laptop, Scale } from "lucide-react";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
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

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
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
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-ondark tracking-tight">
            Hi, I&apos;m <span className="text-marigold">BuyWise AI</span>
          </h1>
          <p className="text-sm sm:text-base text-text-dim-ondark font-sans max-w-md mx-auto leading-relaxed">
            Your smart shopping assistant. Ask me to find, compare, or recommend
            products across Amazon &amp; Flipkart.
          </p>
        </div>

        {/* Suggestion chips */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {suggestions.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.text}
                type="button"
                onClick={() => onSuggestionClick(s.text)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  onSuggestionClick(s.text);
                }}
                className="
                  w-full h-full group flex items-center gap-3 text-left
                  px-4 py-3.5 rounded-2xl
                  bg-white/[0.03] border border-white/[0.08]
                  backdrop-blur-sm
                  hover:bg-white/[0.07] hover:border-marigold/30 hover:-translate-y-0.5 hover:shadow-md
                  active:scale-[0.98]
                  transition-all duration-200 ease-out
                  touch-manipulation
                "
              >
                <div className="size-9 rounded-xl bg-marigold/10 flex items-center justify-center shrink-0 group-hover:bg-marigold/20 transition-colors">
                  <Icon className="size-4.5 text-marigold" />
                </div>
                <span className="text-[13px] sm:text-[14px] text-text-ondark font-sans leading-snug">
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
