"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function CanvasThinkingWave() {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-bg-main/60 backdrop-blur-sm rounded-3xl overflow-hidden pointer-events-none">
      
      {/* Background Pulse Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[200px] h-[200px] bg-brand-accent/20 rounded-full blur-[60px]"
      />

      {/* Floating Sparkle Icon */}
      <motion.div
        animate={{
          y: [-5, 5, -5],
          rotate: [-10, 10, -10]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="mb-6 relative z-10 p-4 rounded-full bg-bg-input border border-white/10 shadow-[0_0_30px_rgba(255,176,103,0.3)]"
      >
        <Sparkles className="size-8 text-brand-accent" />
      </motion.div>

      {/* Neon Wave Animation */}
      <div className="flex items-center justify-center gap-1.5 h-8 relative z-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ height: "20%", opacity: 0.3 }}
            animate={{ height: ["20%", "100%", "20%"], opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
            className="w-1.5 rounded-full bg-gradient-to-t from-brand-accent/50 to-brand-accent shadow-[0_0_10px_rgba(255,176,103,0.8)]"
          />
        ))}
      </div>
      
      <p className="mt-6 text-sm font-bold font-mono tracking-widest text-text-secondary uppercase relative z-10">
        AI is judging your fit...
      </p>
    </div>
  );
}
