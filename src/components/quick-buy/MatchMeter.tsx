"use client";

import React, { useEffect, useState } from "react";
import { motion, useAnimation, useMotionValue, useTransform, animate } from "framer-motion";
import { Flame } from "lucide-react";

interface MatchMeterProps {
  score?: number;
  commentary?: string;
  reasons?: string[];
  compact?: boolean;
  onClick?: () => void;
}

export function MatchMeter({ score, commentary, reasons, compact = false, onClick }: MatchMeterProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const animatedScore = useMotionValue(0);
  
  // Transform score into dash offset for SVG circle
  const circumference = 2 * Math.PI * 45; // r=45
  const strokeDashoffset = useTransform(
    animatedScore,
    [0, 100],
    [circumference, 0]
  );

  useEffect(() => {
    if (score !== undefined) {
      // Slot-machine overshoot animation
      const controls = animate(animatedScore, [0, 95, score], {
        duration: 2.5,
        times: [0, 0.6, 1], // Fast to 95%, then elastic settle to actual score
        ease: ["easeOut", "anticipate"],
        onUpdate: (latest) => {
          setDisplayScore(Math.round(latest));
        }
      });
      return controls.stop;
    } else {
      animatedScore.set(0);
      setDisplayScore(0);
    }
  }, [score, animatedScore]);

  // Determine color based on actual score
  const getColor = (val: number) => {
    if (val < 40) return "#ef4444"; // red-500
    if (val < 70) return "#f59e0b"; // amber-500
    return "#10b981"; // emerald-500
  };

  const currentColor = score !== undefined ? getColor(score) : "#333333";

  if (score === undefined) return null;

  if (compact) {
    return (
      <button 
        onClick={onClick}
        className="flex items-center gap-2 bg-bg-input/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all group"
      >
        <Flame className="size-4" style={{ color: currentColor }} />
        <span className="font-bold text-sm text-text-primary-light tabular-nums">
          {displayScore} <span className="text-[10px] text-text-secondary uppercase tracking-wider ml-0.5">Match</span>
        </span>
        <div className="w-px h-3 bg-white/20 mx-1" />
        <span className="text-[10px] text-brand-accent uppercase font-bold tracking-wider group-hover:text-brand-accent/80">
          Details
        </span>
      </button>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 bg-bg-input/90 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl max-w-sm mx-auto"
    >
      <div className="relative size-32 flex items-center justify-center">
        {/* Background Track */}
        <svg className="absolute inset-0 size-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-white/10"
          />
          {/* Animated Progress Ring */}
          <motion.circle
            cx="64"
            cy="64"
            r="45"
            stroke={currentColor}
            strokeWidth="8"
            strokeLinecap="round"
            fill="transparent"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              filter: `drop-shadow(0 0 10px ${currentColor})`
            }}
          />
        </svg>

        {/* Score Value in Center */}
        <div className="flex flex-col items-center justify-center relative z-10">
          <span className="text-3xl font-black font-mono text-text-primary-light tabular-nums leading-none">
            {displayScore}
          </span>
          <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mt-1">Match</span>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }} // Wait for settle animation to finish
        className="flex flex-col items-start gap-3 bg-black/20 p-4 rounded-xl w-full border border-white/5"
      >
        <div className="flex items-start gap-3 w-full">
          <Flame className="size-5 shrink-0" style={{ color: currentColor }} />
          <div className="flex-1">
            <p className="text-sm text-text-primary-light leading-relaxed italic font-serif">
              "{commentary}"
            </p>
            {reasons && reasons.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {reasons.slice(0, 2).map((reason, idx) => (
                  <span key={idx} className="text-[11px] font-bold tracking-wide uppercase px-2 py-1 rounded-md bg-white/5 border border-white/10 text-brand-accent/80 shadow-sm backdrop-blur-sm">
                    {reason}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
