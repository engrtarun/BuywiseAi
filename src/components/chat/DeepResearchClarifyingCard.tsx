"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, ChevronRight, Pencil, X, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OptionObject {
  id: string;
  label: string;
  value: string;
}

export interface ClarifyingQuestion {
  question: string;
  options: (string | OptionObject)[];
  allowSkip?: boolean;
  allowCustom?: boolean;
}

interface ClarifyingQuestionCardProps {
  questions?: ClarifyingQuestion[];
  // Legacy single question props
  question?: string;
  options?: (string | OptionObject)[];
  allowSkip?: boolean;
  allowCustom?: boolean;
  
  onSelect: (option: string) => void;
  onDismiss?: () => void;
  disabled?: boolean;
}

export function DeepResearchClarifyingCard({
  questions,
  question: singleQuestion,
  options: singleOptions,
  allowSkip: singleAllowSkip = true,
  allowCustom: singleAllowCustom = true,
  onSelect,
  onDismiss,
  disabled = false,
}: ClarifyingQuestionCardProps) {
  // Normalize to an array of questions
  const questionsList = questions || (singleQuestion && singleOptions ? [{
    question: singleQuestion,
    options: singleOptions,
    allowSkip: singleAllowSkip,
    allowCustom: singleAllowCustom
  }] : []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const customInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentQ = questionsList[currentIndex];
  
  // Normalize options array into a standard array of objects
  const normalizedOptions = React.useMemo(() => {
    if (!currentQ) return [];
    return currentQ.options.map((opt, idx) => {
      if (typeof opt === "string") {
        return { id: String(idx + 1), label: opt, value: opt };
      }
      return {
        id: opt.id || String(idx + 1),
        label: opt.label || "",
        value: opt.value || "",
      };
    });
  }, [currentQ]);

  const isInteractionDisabled = disabled || hasAnswered;

  const handleOptionClick = (label: string) => {
    if (isInteractionDisabled) return;
    setHasAnswered(true);
    onSelect(label);
  };

  // Reset highlight and custom input when question changes
  useEffect(() => {
    setHighlightedIndex(0);
    setShowCustomInput(false);
    setCustomText("");
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (isInteractionDisabled || !currentQ || showCustomInput) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a textarea (like main chat input)
      if (document.activeElement?.tagName === "TEXTAREA") return;
      
      const optionsCount = normalizedOptions.length;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % optionsCount);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + optionsCount) % optionsCount);
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleOptionClick(normalizedOptions[highlightedIndex].label);
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (onDismiss) onDismiss();
      } else if (/^[1-9]$/.test(e.key)) {
        const num = parseInt(e.key, 10);
        if (num > 0 && num <= optionsCount) {
          e.preventDefault();
          handleOptionClick(normalizedOptions[num - 1].label);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isInteractionDisabled, currentQ, showCustomInput, highlightedIndex, normalizedOptions, onDismiss]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInteractionDisabled || !customText.trim()) return;
    setHasAnswered(true);
    onSelect(customText.trim());
  };

  const handleSkip = () => {
    if (isInteractionDisabled) return;
    if (currentIndex < questionsList.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setHasAnswered(true);
      onSelect("Skipped");
    }
  };

  if (!currentQ) return null;

  const totalQuestions = questionsList.length;

  return (
    <div className="flex flex-col gap-2 w-full max-w-[95%] sm:max-w-lg my-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div 
        ref={cardRef}
        className="w-full bg-bg-input border border-border-light rounded-2xl shadow-md backdrop-blur-xl overflow-hidden box-border flex flex-col"
      >
        {/* Header Row */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-border-light bg-bg-sidebar/50">
          <h4 className="text-[14px] sm:text-[15px] font-sans font-medium text-text-primary-light/90 leading-snug flex-1 pr-4">
            {currentQ.question}
          </h4>
          
          <div className="flex items-center gap-3 shrink-0">
            {/* Pagination Controls */}
            {totalQuestions > 1 && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-text-secondary">
                <button 
                  disabled={currentIndex === 0 || isInteractionDisabled}
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className="p-1 rounded-md hover:bg-bg-sidebar hover:text-text-primary-light disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <span className="select-none">{currentIndex + 1} of {totalQuestions}</span>
                <button 
                  disabled={currentIndex === totalQuestions - 1 || isInteractionDisabled}
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="p-1 rounded-md hover:bg-bg-sidebar hover:text-text-primary-light disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            )}
            
            {/* Dismiss Button */}
            {onDismiss && !isInteractionDisabled && (
              <button 
                onClick={onDismiss}
                className="p-1 rounded-full hover:bg-bg-sidebar text-text-secondary hover:text-text-primary-light transition-colors"
                aria-label="Dismiss clarification"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Options List (Vertical Stack) */}
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              {normalizedOptions.map((opt, idx) => {
                const isHighlighted = idx === highlightedIndex;
                
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isInteractionDisabled}
                    onClick={() => handleOptionClick(opt.label)}
                    onMouseEnter={() => !isInteractionDisabled && setHighlightedIndex(idx)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 border-b border-border-light transition-colors duration-150 text-left
                      ${isInteractionDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      ${isHighlighted && !isInteractionDisabled ? "bg-brand-accent/10 border-l-2 border-l-brand-accent" : "bg-transparent border-l-2 border-l-transparent hover:bg-bg-sidebar/50"}
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`
                        flex items-center justify-center size-6 shrink-0 rounded-md text-[11px] font-mono font-bold transition-colors
                        ${isHighlighted && !isInteractionDisabled ? "bg-brand-accent text-primary-foreground shadow-sm shadow-brand-accent/20" : "bg-bg-sidebar text-text-secondary"}
                      `}>
                        {idx + 1}
                      </div>
                      <span className={`
                        text-[13px] sm:text-[14px] font-sans truncate transition-colors
                        ${isHighlighted && !isInteractionDisabled ? "text-text-primary-dark font-medium" : "text-text-primary-light font-medium"}
                      `}>
                        {opt.label}
                      </span>
                    </div>
                    
                    {/* Right Arrow indicator on highlight */}
                    <div className={`
                      shrink-0 ml-3 transition-all duration-200
                      ${isHighlighted && !isInteractionDisabled ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}
                    `}>
                      <ArrowRight className="size-4 text-brand-accent" />
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Row (Something Else & Skip) */}
        <div className="flex justify-between items-center px-4 py-3 bg-bg-sidebar/30">
          {currentQ.allowCustom !== false ? (
            <button
              type="button"
              disabled={isInteractionDisabled}
              onClick={() => {
                setShowCustomInput(true);
                setTimeout(() => customInputRef.current?.focus(), 50);
              }}
              className={`
                flex items-center gap-2 px-2 py-1 -ml-2 rounded-lg text-[13px] font-sans font-medium transition-colors
                ${isInteractionDisabled ? "opacity-50 cursor-not-allowed text-text-secondary" : "text-text-primary-light/80 hover:text-text-primary-light hover:bg-bg-sidebar cursor-pointer"}
              `}
            >
              <Pencil className="size-3.5" /> Something else
            </button>
          ) : <div />}

          {currentQ.allowSkip !== false && (
            <button
              type="button"
              disabled={isInteractionDisabled}
              onClick={handleSkip}
              className={`
                px-3 py-1.5 rounded-lg text-[12px] font-sans font-medium transition-colors
                ${isInteractionDisabled ? "opacity-40 cursor-not-allowed text-text-secondary" : "text-text-secondary border border-border-light bg-bg-sidebar/50 hover:bg-bg-sidebar hover:text-text-primary-light cursor-pointer"}
              `}
            >
              Skip
            </button>
          )}
        </div>

        {/* Inline custom input form */}
        <AnimatePresence>
          {showCustomInput && !isInteractionDisabled && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleCustomSubmit}
              className="w-full flex gap-2 px-4 py-3 border-t border-border-light bg-black/5 overflow-hidden box-border"
            >
              <input
                ref={customInputRef}
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type your response..."
                disabled={isInteractionDisabled}
                className="flex-1 min-w-0 bg-bg-input border border-border-light rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-accent/50 focus-visible:ring-1 focus-visible:ring-brand-accent transition-all font-sans text-text-primary-light shadow-inner"
              />
              <button
                type="submit"
                disabled={isInteractionDisabled || !customText.trim()}
                className="size-9 shrink-0 rounded-xl bg-brand-accent text-primary-foreground hover:bg-brand-accent/90 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-sidebar"
              >
                <ArrowRight className="size-4" />
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Hint Text */}
      {!isInteractionDisabled && (
        <div className="text-center w-full px-2 mt-0.5">
          <span className="text-[11px] font-mono text-text-secondary select-none">
            ↑↓ to navigate &middot; Enter to select &middot; or type below
          </span>
        </div>
      )}
    </div>
  );
}
