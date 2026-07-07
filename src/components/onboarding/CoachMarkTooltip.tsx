"use client";
// ============================================================================
// BuyWise AI — CoachMarkTooltip v3.0 (3D Premium Card)
// ============================================================================
// Beautiful, tactile tooltip with deep box-shadows, 3D physical buttons,
// Framer Motion pop-in animation, and dynamic directional arrows.
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import { PartyPopper, ArrowRight, Rocket } from "lucide-react";
import type { TooltipPlacement } from "@/types/onboarding";

interface CoachMarkTooltipProps {
  title: string;
  content: string;
  stepIndex: number;
  totalSteps: number;
  placement: TooltipPlacement;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  /** Whether this is a centered modal (no target) */
  isCentered?: boolean;
}

export function CoachMarkTooltip({
  title,
  content,
  stepIndex,
  totalSteps,
  placement,
  onNext,
  onPrev,
  onSkip,
  isCentered = false,
}: CoachMarkTooltipProps) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  // Arrow direction CSS class (points towards the target element)
  const arrowClasses: Record<TooltipPlacement, string> = {
    top: "bottom-[-8px] left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#1e1e2e]",
    bottom: "top-[-8px] left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-[#1e1e2e]",
    left: "right-[-8px] top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-[#1e1e2e]",
    right: "left-[-8px] top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-[#1e1e2e]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 10 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`
        relative z-[9999]
        w-[320px] max-w-[90vw]
        bg-[#1e1e2e] text-white
        rounded-2xl overflow-hidden
        border border-white/10
        shadow-[0_8px_30px_rgba(0,0,0,0.35),_0_8px_0px_0px_rgba(0,0,0,0.25)]
      `}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Directional Arrow (hidden for centered modals) */}
      {!isCentered && (
        <div
          className={`absolute w-0 h-0 ${arrowClasses[placement]}`}
        />
      )}

      {/* Card Content */}
      <div className="p-5">
        {/* Step Counter */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
            Step {stepIndex + 1} of {totalSteps}
          </span>
          <button
            onClick={onSkip}
            className="text-xs font-semibold text-white/40 hover:text-white/70 transition-colors"
          >
            Skip Tour
          </button>
        </div>

        {/* Title */}
        <h3 className="text-lg font-extrabold text-white mb-2 leading-tight flex items-center gap-2">
          {title} {isFirst && <Rocket className="size-5 text-brand-accent" />}
        </h3>

        {/* Description */}
        <p className="text-sm text-white/70 leading-relaxed mb-5">
          {content}
        </p>

        {/* Progress Dots */}
        <div className="flex gap-1.5 mb-5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stepIndex
                  ? "w-7 bg-brand-accent"
                  : i < stepIndex
                  ? "w-3 bg-brand-accent/50"
                  : "w-3 bg-white/15"
              }`}
            />
          ))}
        </div>

        {/* 3D Physical Buttons */}
        <div className="flex gap-3">
          {!isFirst && (
            <button
              onClick={onPrev}
              className="
                flex-1 px-4 py-2.5
                bg-white/10 text-white font-bold text-sm
                border-b-[3px] border-white/20
                active:border-b-0 active:translate-y-[3px]
                rounded-xl transition-all duration-100
                hover:bg-white/15
              "
            >
              Back
            </button>
          )}
          <button
            onClick={onNext}
            className="
              flex-1 px-4 py-2.5
              bg-brand-accent text-bg-main font-bold text-sm
              border-b-[3px] border-brand-accent/60
              active:border-b-0 active:translate-y-[3px]
              rounded-xl transition-all duration-100
              hover:bg-brand-accent/90
              shadow-lg shadow-brand-accent/40
            "
          >
            {isLast ? (
              <span className="flex items-center justify-center gap-2">
                Let's Go! <PartyPopper className="size-4" />
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Next <ArrowRight className="size-4" />
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
