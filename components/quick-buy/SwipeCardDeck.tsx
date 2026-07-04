"use client";

import React, { useState, useEffect } from "react";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";
import { SwipeableProductCard } from "./SwipeableProductCard";
import { AnimatePresence } from "framer-motion";
import { RefreshCcw, SlidersHorizontal } from "lucide-react";

interface SwipeCardDeckProps {
  products: QuickBuyProduct[];
  onSave: (id: string) => void;
  onOpenSettings: () => void;
}

export function SwipeCardDeck({ products, onSave, onOpenSettings }: SwipeCardDeckProps) {
  const [deck, setDeck] = useState<QuickBuyProduct[]>(products);

  // Sync if products prop changes (e.g., settings updated)
  useEffect(() => {
    setDeck(products);
  }, [products]);

  const handleSwipeLeft = (id: string) => {
    setDeck((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSwipeRight = (id: string) => {
    onSave(id);
    setDeck((prev) => prev.filter((p) => p.id !== id));
  };

  const handleReset = () => {
    setDeck(products);
  };

  if (deck.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner">
          <RefreshCcw className="size-10 text-text-secondary" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-text-primary-light mb-2">
          You&apos;re all caught up!
        </h2>
        <p className="text-text-secondary mb-8 max-w-xs">
          No more items match your current size and budget preferences.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-[240px]">
          <button
            onClick={handleReset}
            className="w-full py-3.5 rounded-xl bg-brand-accent text-bg-main font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-accent/20"
          >
            Review Stack Again
          </button>
          <button
            onClick={onOpenSettings}
            className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-text-primary-light font-bold hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="size-4" />
            Change Preferences
          </button>
        </div>
      </div>
    );
  }

  // To create the stacked effect, we render the first few cards (reversed so first is on top)
  const visibleCards = deck.slice(0, 3).reverse();

  return (
    <div className="flex-1 flex items-center justify-center relative w-full overflow-hidden perspective-[1000px]">
      <AnimatePresence>
        {visibleCards.map((product, i) => {
          // Because we reversed, the original index 0 is at the END of this array.
          const isTop = i === visibleCards.length - 1;
          const index = visibleCards.length - 1 - i; // 0 for top, 1 for second, etc.
          
          return (
            <SwipeableProductCard
              key={product.id}
              product={product}
              isTop={isTop}
              index={index}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
