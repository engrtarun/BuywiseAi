"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TourStep } from "@/config/tourSteps";
import { X, ChevronRight } from "lucide-react";

interface CoachMarkTooltipProps {
  step: TourStep;
  targetRect: DOMRect;
  onNext: () => void;
  onSkip: () => void;
  isLastStep: boolean;
  stepIndex: number;
  totalSteps: number;
}

export function CoachMarkTooltip({
  step,
  targetRect,
  onNext,
  onSkip,
  isLastStep,
  stepIndex,
  totalSteps,
}: CoachMarkTooltipProps) {
  const [tooltipStyle, setTooltipStyle] = useState<{ top?: number; left?: number; bottom?: number; right?: number; transform?: string }>({});

  useEffect(() => {
    // Calculate tooltip position based on target rect and requested position
    // Adding some padding
    const PADDING = 16;
    let newStyle: any = {};

    // Standard positioning logic, with basic viewport boundary fallback
    switch (step.position) {
      case "bottom":
        newStyle = {
          top: targetRect.bottom + PADDING,
          left: targetRect.left + targetRect.width / 2,
          transform: "translateX(-50%)",
        };
        break;
      case "top":
        newStyle = {
          top: targetRect.top - PADDING,
          left: targetRect.left + targetRect.width / 2,
          transform: "translate(-50%, -100%)",
        };
        break;
      case "left":
        newStyle = {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left - PADDING,
          transform: "translate(-100%, -50%)",
        };
        break;
      case "right":
        newStyle = {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + PADDING,
          transform: "translateY(-50%)",
        };
        break;
    }

    setTooltipStyle(newStyle);
  }, [targetRect, step.position]);

  return (
    <>
      {/* The cutout mask (darkens screen except the target) */}
      <motion.div
        className="fixed inset-0 z-[9998] pointer-events-auto mix-blend-hard-light"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          background: `radial-gradient(
            circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px,
            transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 10}px,
            rgba(0, 0, 0, 0.75) ${Math.max(targetRect.width, targetRect.height) / 2 + 20}px
          )`,
        }}
      />

      {/* The Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.targetId}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed z-[9999] w-72 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-5 overflow-hidden font-sans"
          style={tooltipStyle}
        >
          {/* Decorative background glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-marigold/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-marigold uppercase tracking-wider bg-marigold/10 px-2 py-0.5 rounded-full">
                Step {stepIndex + 1}/{totalSteps}
              </span>
            </div>
            <button
              onClick={onSkip}
              className="text-zinc-400 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
              aria-label="Skip tour"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Content */}
          <div className="relative z-10">
            <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-5">
              {step.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center relative z-10">
            <button
              onClick={onSkip}
              className="text-xs text-zinc-400 hover:text-white transition-colors font-medium"
            >
              Skip tour
            </button>
            <button
              onClick={onNext}
              className="flex items-center gap-1.5 bg-marigold text-ink-deeper px-4 py-2 rounded-xl text-sm font-semibold hover:bg-marigold/90 transition-all shadow-[0_0_15px_rgba(255,204,0,0.3)] hover:shadow-[0_0_20px_rgba(255,204,0,0.5)] active:scale-95"
            >
              {isLastStep ? "Finish" : "Next"}
              {!isLastStep && <ChevronRight className="size-4" />}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
