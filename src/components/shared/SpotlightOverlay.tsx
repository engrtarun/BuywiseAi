"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand } from "lucide-react";

interface SpotlightOverlayProps {
  targetId: string | null;
  padding?: number;
  showDragHint?: boolean;
}

export function SpotlightOverlay({ targetId, padding = 10, showDragHint = false }: SpotlightOverlayProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!targetId) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.getElementById(targetId);
      if (el) {
        setRect(el.getBoundingClientRect());
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

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <AnimatePresence>
        {rect && (
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full pointer-events-none"
          >
            <defs>
              <mask id="spotlight-mask">
                {/* White background means fully visible overlay */}
                <rect width="100%" height="100%" fill="white" />
                {/* Black cutout means transparent hole */}
                <motion.rect
                  animate={{
                    x: rect.x - padding,
                    y: rect.y - padding,
                    width: rect.width + padding * 2,
                    height: rect.height + padding * 2,
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  fill="black"
                  rx={padding}
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.75)"
              mask="url(#spotlight-mask)"
            />
          </motion.svg>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {rect && showDragHint && (
          <motion.div
            initial={{ opacity: 0, top: rect.top + rect.height / 2 }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              top: [rect.top + rect.height / 2, rect.top - 120] 
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="fixed z-[120] pointer-events-none text-white drop-shadow-[0_5px_15px_rgba(255,255,255,0.5)]"
            style={{ left: rect.left + rect.width / 2 - 16 }}
          >
            <Hand className="size-8" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
