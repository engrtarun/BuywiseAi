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
    <div className="w-full h-auto max-h-none max-w-lg box-border bg-bg-input border border-border-light rounded-3xl p-4 sm:p-5 flex flex-col gap-4 shadow-md backdrop-blur-xl my-2 overflow-hidden scrollbar-none">
      {/* Question Header */}
      <div className="flex justify-between items-center pb-1">
        <h4 className="text-[14px] sm:text-[15px] font-sans font-semibold text-text-primary-light leading-snug">
          {question}
        </h4>
      </div>

      {/* Options List (Cloud style pills) */}
      <div className="flex flex-wrap gap-2.5 min-w-0">
        {normalizedOptions.map((opt, idx) => (
          <button
            key={opt.id + idx}
            type="button"
            disabled={isInteractionDisabled}
            onClick={() => handleOptionClick(opt.label)}
            className={`
              inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-bg-sidebar border border-border-light
              transition-all duration-200 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-sidebar
              ${isInteractionDisabled 
                ? "opacity-50 cursor-not-allowed" 
                : "cursor-pointer hover:bg-bg-sidebar/80 hover:border-brand-accent/40 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"}
            `}
          >
            <span className="text-xs sm:text-sm font-sans font-medium text-text-primary-light">
              {opt.label}
            </span>
          </button>
        ))}
      </div>

      {/* Action Row */}
      <div className="flex justify-between items-center mt-1 border-t border-border-light pt-3">
        {allowCustom && (
          <button
            type="button"
            disabled={isInteractionDisabled}
            onClick={() => setShowCustomInput((prev) => !prev)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-medium
              bg-bg-sidebar/50 border border-border-light transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent
              ${showCustomInput 
                ? "text-brand-accent border-brand-accent/40 bg-brand-accent/5" 
                : "text-text-primary-light/80"}
              ${isInteractionDisabled 
                ? "opacity-50 cursor-not-allowed" 
                : "cursor-pointer hover:bg-bg-sidebar hover:text-text-primary-light hover:border-brand-accent/30"}
            `}
          >
            <Pencil className="size-3 text-brand-accent" /> Something else
          </button>
        )}

        {allowSkip && (
          <button
            type="button"
            disabled={isInteractionDisabled}
            onClick={handleSkip}
            className={`
              px-3 py-1.5 rounded-full text-xs sm:text-sm font-sans font-medium text-text-secondary
              bg-transparent border border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent
              ${isInteractionDisabled 
                ? "opacity-40 cursor-not-allowed" 
                : "cursor-pointer hover:bg-bg-sidebar/50 hover:text-text-primary-light"}
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
            className="w-full flex gap-2 pt-2 border-t border-border-light overflow-hidden box-border"
          >
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Type your response..."
              disabled={isInteractionDisabled}
              className="flex-1 min-w-0 bg-bg-main border border-border-light rounded-full px-4 py-2 text-xs sm:text-sm outline-none focus:border-brand-accent/50 focus-visible:ring-2 focus-visible:ring-brand-accent transition-all font-sans text-text-primary-light"
            />
            <button
              type="submit"
              disabled={isInteractionDisabled || !customText.trim()}
              className="size-9 sm:size-10 shrink-0 rounded-full bg-brand-accent text-primary-foreground hover:bg-brand-accent/90 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center animate-in fade-in focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-sidebar"
            >
              <ArrowRight className="size-4" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
