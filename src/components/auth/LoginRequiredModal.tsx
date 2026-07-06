"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

export function LoginRequiredModal({
  isOpen,
  onClose,
  onLoginClick,
}: LoginRequiredModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.7,
              rotateX: 45,
              y: 50,
              transformPerspective: 1000,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotateX: 0,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              rotateX: -20,
              y: 30,
              transformPerspective: 1000,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              duration: 0.5,
            }}
            className="relative w-full max-w-sm rounded-3xl bg-ink-deeper p-8 shadow-2xl overflow-hidden"
          >
            {/* Gradient Border/Glow Effect */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-marigold/20 via-transparent to-brand-accent/20 opacity-50" />
            <div className="absolute inset-0 z-0 rounded-3xl border border-white/10" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-marigold/50 to-transparent" />

            <div className="relative z-10 flex flex-col items-center text-center gap-6">
              {/* Icon Container */}
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-marigold to-brand-accent shadow-[0_0_30px_rgba(252,128,25,0.4)]">
                <div className="absolute inset-[2px] rounded-2xl bg-ink-deeper flex items-center justify-center">
                  <Lock className="h-8 w-8 text-marigold" />
                </div>
              </div>

              {/* Text Content */}
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-text-primary-light">
                  Premium Feature Locked
                </h2>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  Unlock <span className="text-white font-medium">Deep Research</span>, <span className="text-white font-medium">Quick Buy</span>, and <span className="text-white font-medium">Food</span> modes by creating a free account. Save your history and get personalized recommendations!
                </p>
              </div>

              {/* Actions */}
              <div className="w-full space-y-3 mt-2">
                <button
                  onClick={onLoginClick}
                  className="w-full flex items-center justify-center py-3.5 rounded-xl font-bold text-ink-deeper bg-gradient-to-r from-marigold to-brand-accent hover:opacity-90 transition-opacity shadow-lg shadow-marigold/20 active:scale-[0.98]"
                >
                  Create Free Account
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-xl font-medium text-text-primary-dark hover:text-white hover:bg-white/5 transition-colors active:scale-[0.98]"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
