"use client";

import React, { useEffect, useState } from "react";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";
import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LiveOutfitSummaryProps {
  items: QuickBuyProduct[];
  onBuyOutfit: () => void;
}

export function LiveOutfitSummary({ items, onBuyOutfit }: LiveOutfitSummaryProps) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const newTotal = items.reduce((sum, item) => sum + item.price, 0);
    setTotal(newTotal);
  }, [items]);

  return (
    <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-2">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-input/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-auto"
      >
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Total Look</span>
          <div className="flex items-baseline gap-1">
            <span className="text-brand-accent font-black text-lg">₹</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={total}
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.8 }}
                className="text-text-primary-light font-black text-lg font-mono"
              >
                {total.toLocaleString('en-IN')}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Items</span>
          <span className="text-text-primary-light font-bold">{items.length}</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {items.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBuyOutfit}
            className="bg-brand-accent text-bg-main font-bold px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(255,176,103,0.3)] flex items-center gap-2 pointer-events-auto w-full justify-center"
          >
            <ShoppingBag className="size-4" />
            Buy Entire Look
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
