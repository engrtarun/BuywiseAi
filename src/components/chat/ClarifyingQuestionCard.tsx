"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ClarifyingQuestionCardProps {
  question: string;
  options: string[];
  allowSkip?: boolean;
  allowCustom?: boolean;
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export function ClarifyingQuestionCard({
  question,
  options,
  allowSkip = true,
  allowCustom = true,
  onSelect,
  disabled = false,
}: ClarifyingQuestionCardProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);

  const handleOptionClick = (option: string) => {
    if (disabled || hasAnswered) return;
    setHasAnswered(true);
    onSelect(option);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || hasAnswered || !customText.trim()) return;
    setHasAnswered(true);
    onSelect(customText.trim());
  };

  const handleSkip = () => {
    if (disabled || hasAnswered) return;
    setHasAnswered(true);
    onSelect("Skip");
  };

  const isInteractionDisabled = disabled || hasAnswered;

  return (
    <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5 flex flex-col gap-4 backdrop-blur-md shadow-lg my-2">
      {/* Question Label */}
      <h4 className="text-[14px] sm:text-[15px] font-sans font-semibold text-text-primary-light leading-snug">
        {question}
      </h4>

      {/* Options Grid */}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={isInteractionDisabled}
            onClick={() => handleOptionClick(opt)}
            className={`
              px-3.5 py-2 rounded-xl text-xs sm:text-sm font-sans font-medium text-text-primary-light
              bg-white/[0.04] border border-white/[0.08]
              transition-all duration-200 ease-out
              ${isInteractionDisabled 
                ? "opacity-50 cursor-not-allowed" 
                : "cursor-pointer hover:bg-white/[0.08] hover:border-marigold/40 hover:-translate-y-0.5 active:scale-[0.98]"}
            `}
          >
            {opt}
          </button>
        ))}

        {allowCustom && (
          <button
            type="button"
            disabled={isInteractionDisabled}
            onClick={() => setShowCustomInput((prev) => !prev)}
            className={`
              px-3.5 py-2 rounded-xl text-xs sm:text-sm font-sans font-medium
              bg-white/[0.04] border border-white/[0.08] transition-all duration-200
              ${showCustomInput 
                ? "text-marigold border-marigold/40 bg-marigold/5" 
                : "text-text-secondary"}
              ${isInteractionDisabled 
                ? "opacity-50 cursor-not-allowed" 
                : "cursor-pointer hover:bg-white/[0.08] hover:border-marigold/40"}
            `}
          >
            Something else...
          </button>
        )}

        {allowSkip && (
          <button
            type="button"
            disabled={isInteractionDisabled}
            onClick={handleSkip}
            className={`
              px-3.5 py-2 rounded-xl text-xs sm:text-sm font-sans font-medium text-text-dim-ondark
              bg-transparent border border-transparent transition-all duration-200
              ${isInteractionDisabled 
                ? "opacity-40 cursor-not-allowed" 
                : "cursor-pointer hover:bg-white/[0.04] hover:text-text-primary-light"}
            `}
          >
            Skip
          </button>
        )}
      </div>

      {/* Sliding Custom Input Panel */}
      <AnimatePresence>
        {allowCustom && showCustomInput && !isInteractionDisabled && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleCustomSubmit}
            className="overflow-hidden w-full flex flex-col gap-2 pt-1"
          >
            <div className="relative flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl focus-within:border-marigold/50 transition-all">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type your response here..."
                disabled={isInteractionDisabled}
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-text-primary-light outline-none font-sans"
              />
              <button
                type="submit"
                disabled={isInteractionDisabled || !customText.trim()}
                className="absolute right-1.5 p-1.5 rounded-lg bg-marigold text-ink-deeper hover:bg-marigold/90 disabled:opacity-40 disabled:hover:bg-marigold transition-all cursor-pointer flex items-center justify-center"
              >
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
