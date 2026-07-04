"use client";

import React from "react";
import { motion } from "framer-motion";
import { LayoutDashboard } from "lucide-react";

interface ModeToggleProps {
  mode: "mix" | "canvas";
  onChange: (mode: "mix" | "canvas") => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex justify-center mb-2 px-4 z-10">
      <div className="relative bg-black/40 backdrop-blur-md rounded-full border border-white/10 p-1 flex shadow-lg">
        {/* Animated Background Indicator */}
        <motion.div
          className="absolute top-1 bottom-1 w-[128px] rounded-full bg-brand-accent shadow-[0_0_15px_rgba(255,176,103,0.4)]"
          initial={false}
          animate={{
            x: mode === "mix" ? 0 : 128,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        <button
          onClick={() => onChange("mix")}
          className={`relative z-10 w-32 py-2 rounded-full text-sm font-bold transition-colors ${
            mode === "mix" ? "text-bg-main" : "text-text-secondary hover:text-white"
          }`}
        >
          Swipe Mode
        </button>

        <button
          onClick={() => onChange("canvas")}
          className={`relative z-10 w-32 py-2 rounded-full text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${
            mode === "canvas" ? "text-bg-main" : "text-text-secondary hover:text-white"
          }`}
        >
          <LayoutDashboard className="size-4" />
          Canvas
        </button>
      </div>
    </div>
  );
}
