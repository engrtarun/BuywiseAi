"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useAnimation, PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { MatchMeter } from "./MatchMeter";

interface MatchMeterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  score?: number;
  commentary?: string;
  reasons?: string[];
}

export function MatchMeterBottomSheet({ isOpen, onClose, score, commentary, reasons }: MatchMeterBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      controls.start({ y: 0, transition: { type: "spring", damping: 25, stiffness: 200 } });
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, controls]);

  const handleDragEnd = async (event: any, info: PanInfo) => {
    try {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        await controls.start({ y: "100%", transition: { duration: 0.2 } });
        onClose();
      } else {
        controls.start({ y: 0, transition: { type: "spring", damping: 25, stiffness: 200 } });
      }
    } catch (error) {
      // Ignore unmounted component animation errors
    }
  };

  const handleBackdropClick = async () => {
    try {
      await controls.start({ y: "100%", transition: { duration: 0.2 } });
      onClose();
    } catch (error) {
      // Ignore unmounted component animation errors
    }
  };

  if (!mounted || score === undefined) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={controls}
            exit={{ y: "100%" }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="relative w-full max-w-2xl mx-auto bg-bg-main rounded-t-3xl border border-line-ondark flex flex-col overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)] touch-pan-y"
          >
            <div className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            <button
              onClick={handleBackdropClick}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 border border-white/10 text-text-secondary hover:text-white hover:bg-white/10 transition-all z-10"
            >
              <X className="size-5" />
            </button>

            <div className="p-6 md:p-8 pt-4 flex flex-col gap-6">
              <h3 className="font-heading font-bold text-xl text-center text-text-ondark">Outfit Match Analysis</h3>
              
              <div className="w-full flex justify-center">
                <MatchMeter score={score} commentary={commentary} reasons={reasons} compact={false} />
              </div>
              
              <button
                onClick={handleBackdropClick}
                className="w-full mt-4 py-4 rounded-xl border border-white/10 font-bold text-text-ondark hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                Close Breakdown
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
