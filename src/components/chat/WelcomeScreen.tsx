"use client";

import React from "react";
import { Sparkles, Search, Gift, Smartphone, Laptop, Scale, Compass, Brain } from "lucide-react";
import { LoginRequiredScreen } from "./LoginRequiredScreen";
import { DailyLimitReachedCard } from "./DailyLimitReachedCard";
import { motion } from "framer-motion";
import { ChatMode } from "@/types/chat";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
  isGuest?: boolean;
  guestMessagesRemaining?: number;
  guestLimitReached?: boolean;
  dailyLimitReached?: boolean;
  dailyLimitMessage?: string;
  onLoginClick?: () => void;
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
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

export function WelcomeScreen({ onSuggestionClick, isGuest = false, guestMessagesRemaining = 0, guestLimitReached = false, dailyLimitReached = false, dailyLimitMessage, onLoginClick, selectedMode, onModeChange }: WelcomeScreenProps) {
  if (guestLimitReached) {
    return <LoginRequiredScreen onLoginClick={onLoginClick} />;
  }
  
  if (dailyLimitReached) {
    return <DailyLimitReachedCard message={dailyLimitMessage} />;
  }

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto p-fluid-safe">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-fluid-lg animate-in fade-in slide-in-from-bottom-4 duration-500">

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
          <h1 className="text-fluid-3xl font-heading font-extrabold text-text-primary-light tracking-tight">
            Hi, I&apos;m <span className="text-marigold">BuyWise AI</span>
          </h1>
          <div className="text-sm sm:text-base text-text-secondary font-sans max-w-md mx-auto leading-relaxed space-y-2">
            <p>
              Your smart shopping assistant. Ask me to find, compare, or recommend
              products across Amazon &amp; Flipkart.
            </p>
            <p className="text-[13px] sm:text-sm text-text-secondary/90">
              BuyWise AI ek AI assistant hai aur kabhi-kabhi galat ho sakta hai.
              Agar aapko selection sahi nahi lage, toh thoda aur detail dein ya
              phir sawal ko dubara puchhein.
            </p>
          </div>

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
        </div>

        {/* Mode Picker Toggle */}
        <div className="flex bg-white/5 rounded-xl p-1 border border-border-dark relative w-full max-w-xs sm:max-w-sm h-11 items-center shrink-0">
          <motion.div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-brand-accent rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
            layoutId="mode-picker-bg"
            initial={false}
            animate={{
              left: selectedMode === "deep_research" ? "4px" : "calc(50%)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
          <button
            type="button"
            onClick={() => onModeChange("deep_research")}
            className={`flex-1 flex items-center justify-center gap-2 z-10 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              selectedMode === "deep_research" ? "text-bg-main" : "text-text-secondary hover:text-white"
            }`}
          >
            <Brain className="size-4" />
            Deep Research
          </button>
          <button
            type="button"
            onClick={() => onModeChange("explore")}
            className={`flex-1 flex items-center justify-center gap-2 z-10 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              selectedMode === "explore" ? "text-bg-main" : "text-text-secondary hover:text-white"
            }`}
          >
            <Compass className="size-4" />
            Explore Mode
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="w-full grid [grid-template-columns:repeat(auto-fit,minmax(clamp(200px,25vw,280px),1fr))] gap-fluid-base">
          {suggestions.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.text}
                type="button"
                onClick={() => {
                  if (!guestLimitReached) onSuggestionClick(s.text);
                }}
                disabled={guestLimitReached}
                className={`
                  w-full h-full group flex items-center gap-3 text-left
                  p-fluid-base rounded-2xl
                  bg-white/[0.03] border border-white/[0.08]
                  backdrop-blur-sm
                  transition-colors duration-200
                  hover-lift min-touch-target touch-manipulation
                  ${guestLimitReached ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-white/[0.07] hover:border-marigold/30"}
                `}
              >
                <div className="size-9 rounded-xl bg-marigold/10 flex items-center justify-center shrink-0 group-hover:bg-marigold/20 transition-colors">
                  <Icon className="size-4.5 text-marigold" />
                </div>
                <span className="text-fluid-sm text-text-primary-light font-sans leading-snug">
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
