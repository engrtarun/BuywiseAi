"use client";

import React from "react";
import { Sparkles, Search, Gift, Smartphone, Laptop, Scale, Compass, Brain, User } from "lucide-react";
import { LoginRequiredScreen } from "./LoginRequiredScreen";
import { DailyLimitReachedCard } from "./DailyLimitReachedCard";
import Logo from "@/components/ui/logo";
import { motion } from "framer-motion";
import { ChatMode } from "@/types/chat";
import { useI18n } from "@/contexts/I18nContext";

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
  dynamicPrompts?: string[];
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

export function WelcomeScreen({ onSuggestionClick, isGuest = false, guestMessagesRemaining = 0, guestLimitReached = false, dailyLimitReached = false, dailyLimitMessage, onLoginClick, selectedMode, onModeChange, dynamicPrompts }: WelcomeScreenProps) {
  const { t } = useI18n();
  
  if (guestLimitReached) {
    return <LoginRequiredScreen onLoginClick={onLoginClick} />;
  }
  
  if (dailyLimitReached) {
    return <DailyLimitReachedCard message={dailyLimitMessage} />;
  }

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto px-4 py-8">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Logo */}
        <div className="flex flex-col items-center justify-center pt-12 pb-4 overflow-visible">
          <Logo 
            showText={false}
            iconClassName="w-24 h-24 md:w-32 md:h-32 text-marigold drop-shadow-[0_4px_20px_rgba(232,163,61,0.25)]"
          />
        </div>

        {/* Welcome text */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-primary-light tracking-tight">
            {t("welcome.greeting")} <span className="text-marigold">BuyWise AI</span>
          </h1>
          <div className="text-sm sm:text-base text-text-secondary font-sans max-w-md mx-auto leading-relaxed space-y-2">
            <p>{t("welcome.subtitle")}</p>
            <p className="text-[13px] sm:text-sm text-text-secondary/90">
              {t("welcome.disclaimer")}
            </p>
          </div>

          {/* Guest mode indicator badge */}
          {isGuest && (
            <div className="inline-flex items-center gap-2 mt-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.10] backdrop-blur-sm animate-in fade-in duration-500">
              <span className="text-xs font-mono text-text-dim-ondark flex items-center gap-1.5">
                <User className="size-3.5" /> {t("welcome.guestMode")}
              </span>
              <span className="w-px h-3 bg-line-ondark" />
              <span className="text-xs font-mono text-marigold font-medium">
                {guestMessagesRemaining} {guestMessagesRemaining === 1 ? t("welcome.freeMessageLeft") : t("welcome.freeMessagesLeft")}
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
            {t("welcome.deepResearch")}
          </button>
          <button
            type="button"
            onClick={() => onModeChange("explore")}
            className={`flex-1 flex items-center justify-center gap-2 z-10 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              selectedMode === "explore" ? "text-bg-main" : "text-text-secondary hover:text-white"
            }`}
          >
            <Compass className="size-4" />
            {t("welcome.exploreMode")}
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {(dynamicPrompts && dynamicPrompts.length > 0 ? dynamicPrompts : suggestions.slice(0, 4).map(s => s.text)).map((promptText, index) => {
            const Icon = [Search, Compass, Brain, Sparkles][index % 4];
            return (
              <button
                key={promptText}
                type="button"
                onClick={() => {
                  if (!guestLimitReached) onSuggestionClick(promptText);
                }}
                disabled={guestLimitReached}
                className={`
                  w-full h-full group flex items-center gap-3 text-left
                  px-4 py-3.5 rounded-2xl
                  bg-white/[0.03] border border-white/[0.08]
                  backdrop-blur-sm
                  transition-all duration-200 ease-out
                  touch-manipulation
                  ${guestLimitReached ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-white/[0.07] hover:border-marigold/30 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"}
                `}
              >
                <div className="size-9 rounded-xl bg-marigold/10 flex items-center justify-center shrink-0 group-hover:bg-marigold/20 transition-colors">
                  <Icon className="size-4.5 text-marigold" />
                </div>
                <span className="text-[13px] sm:text-[14px] text-text-primary-light font-sans leading-snug">
                  {promptText}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
