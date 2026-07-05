"use client";

import React, { useState } from "react";
import { ArrowRight, ChevronRight, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OptionObject {
  id: string;
  label: string;
  value: string;
}

interface ClarifyingQuestionCardProps {
  question: string;
  options: (string | OptionObject)[];
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

  // Normalize options array into a standard array of objects
  const normalizedOptions = options.map((opt, idx) => {
    if (typeof opt === "string") {
      return { id: String(idx + 1), label: opt, value: opt };
    }
    return {
      id: opt.id || String(idx + 1),
      label: opt.label || "",
      value: opt.value || "",
    };
  });

  const isInteractionDisabled = disabled || hasAnswered;

  const handleOptionClick = (label: string) => {
    if (isInteractionDisabled) return;
    setHasAnswered(true);
    onSelect(label);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInteractionDisabled || !customText.trim()) return;
    setHasAnswered(true);
    onSelect(customText.trim());
  };

  const handleSkip = () => {
    if (isInteractionDisabled) return;
    setHasAnswered(true);
    onSelect("Skipped");
  };

  return (
    <div className="w-full max-w-lg bg-[#222222]/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl backdrop-blur-md my-2">
      {/* Question Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
        <h4 className="text-[14px] sm:text-[15px] font-sans font-semibold text-text-primary-light leading-snug">
          {question}
        </h4>
      </div>

      {/* Options List (Claude style) */}
      <div className="flex flex-col gap-2">
        {normalizedOptions.map((opt, idx) => (
          <button
            key={opt.id + idx}
            type="button"
            disabled={isInteractionDisabled}
            onClick={() => handleOptionClick(opt.label)}
            className={`
              flex items-center justify-between w-full p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]
              transition-all duration-200 text-left group
              ${isInteractionDisabled 
                ? "opacity-50 cursor-not-allowed" 
                : "cursor-pointer hover:bg-white/[0.08] hover:border-marigold/40 active:scale-[0.99]"}
            `}
          >
            <div className="flex items-center gap-3">
              <span className={`
                flex items-center justify-center size-6 rounded-lg bg-white/5 border border-white/10 text-xs font-mono font-bold text-text-secondary
                ${!isInteractionDisabled && "group-hover:text-marigold group-hover:border-marigold/30 transition-colors"}
              `}>
                {idx + 1}
              </span>
              <span className={`
                text-xs sm:text-sm font-sans font-medium text-text-primary-light
                ${!isInteractionDisabled && "group-hover:text-text-primary-dark transition-colors"}
              `}>
                {opt.label}
              </span>
            </div>
            <ChevronRight className={`
              size-4 text-text-secondary
              ${!isInteractionDisabled && "group-hover:text-marigold group-hover:translate-x-0.5 transition-all"}
            `} />
          </button>
        ))}
      </div>

      {/* Action Row */}
      <div className="flex justify-between items-center mt-1 border-t border-white/5 pt-3">
        {allowCustom && (
          <button
            type="button"
            disabled={isInteractionDisabled}
            onClick={() => setShowCustomInput((prev) => !prev)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-medium
              bg-white/[0.02] border border-white/[0.06] transition-all duration-200
              ${showCustomInput 
                ? "text-marigold border-marigold/40 bg-marigold/5" 
                : "text-text-secondary"}
              ${isInteractionDisabled 
                ? "opacity-50 cursor-not-allowed" 
                : "cursor-pointer hover:bg-white/[0.06] hover:border-marigold/30"}
            `}
          >
            <Pencil className="size-3 text-marigold" /> Something else
          </button>
        )}

        {allowSkip && (
          <button
            type="button"
            disabled={isInteractionDisabled}
            onClick={handleSkip}
            className={`
              px-3 py-1.5 rounded-xl text-xs sm:text-sm font-sans font-medium text-text-dim-ondark
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

      {/* Inline custom input form */}
      <AnimatePresence>
        {allowCustom && showCustomInput && !isInteractionDisabled && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleCustomSubmit}
            className="w-full flex gap-2 pt-2 border-t border-white/5 overflow-hidden"
          >
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Type your response..."
              disabled={isInteractionDisabled}
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-marigold/50 transition-colors font-sans text-text-primary-light"
            />
            <button
              type="submit"
              disabled={isInteractionDisabled || !customText.trim()}
              className="p-2 rounded-xl bg-marigold text-ink-deeper hover:bg-marigold/90 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center animate-in fade-in"
            >
              <ArrowRight className="size-4" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
