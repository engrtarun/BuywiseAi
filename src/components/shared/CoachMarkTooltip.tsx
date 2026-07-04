"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface CoachMarkTooltipProps {
  targetId: string | null;
  text: string;
  step: number;
  totalSteps: number;
  onNext?: () => void;
  onSkip?: () => void;
  actionText?: string;
}

export function CoachMarkTooltip({
  targetId,
  text,
  step,
  totalSteps,
  onNext,
  onSkip,
  actionText = "Next",
}: CoachMarkTooltipProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    
    if (!targetId) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.getElementById(targetId);
      if (el) {
        setRect(el.getBoundingClientRect());
      }
      if (typeof window !== "undefined") {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    const interval = setInterval(updateRect, 500);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      clearInterval(interval);
    };
  }, [targetId]);

  if (!rect || windowSize.width === 0) return null;

  const padding = 20;
  const tooltipHeight = 150;
  const tooltipWidth = 280;
  
  let top = rect.bottom + padding;
  let left = rect.left + rect.width / 2 - tooltipWidth / 2;
  
  if (top + tooltipHeight > windowSize.height) {
    top = rect.top - tooltipHeight - padding;
  }
  
  if (left < 10) left = 10;
  if (left + tooltipWidth > windowSize.width - 10) left = windowSize.width - tooltipWidth - 10;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1, top, left }}
      transition={{ type: "spring", stiffness: 250, damping: 25 }}
      className="fixed z-[110] w-[280px] bg-bg-input/95 backdrop-blur-xl border border-brand-accent/30 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto"
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`size-1.5 rounded-full ${i + 1 === step ? "bg-brand-accent" : "bg-white/20"}`}
            />
          ))}
        </div>
        {onSkip && (
          <button onClick={onSkip} className="text-xs text-text-secondary hover:text-white font-medium cursor-pointer">
            Skip Tour
          </button>
        )}
      </div>

      <p className="text-sm text-text-primary-light leading-relaxed mb-4 font-sans">
        {text}
      </p>

      {onNext && (
        <div className="flex justify-end">
          <button
            onClick={onNext}
            className="px-4 py-2 bg-brand-accent text-bg-main text-xs font-bold rounded-full hover:scale-105 active:scale-95 transition-transform flex items-center gap-1 shadow-md shadow-brand-accent/20 cursor-pointer"
          >
            {actionText} <ChevronRight className="size-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
