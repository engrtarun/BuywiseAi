"use client";

import React, { useState, useEffect } from "react";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";
import { SwipeableProductCard } from "./SwipeableProductCard";
import { AnimatePresence } from "framer-motion";
import { RefreshCcw, SlidersHorizontal, Loader2 } from "lucide-react";

interface SwipeCardDeckProps {
  products: QuickBuyProduct[];
  onSave: (id: string) => void;
  onOpenSettings: () => void;
  hasMore: boolean;
  onPrefetch: () => void;
}

export function SwipeCardDeck({ products, onSave, onOpenSettings, hasMore, onPrefetch }: SwipeCardDeckProps) {
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());

  // Reset swiped cards when the products completely change (e.g. filter change)
  useEffect(() => {
    // If products array shrinks (meaning a complete reset happened), clear swiped set
    if (products.length === 0) {
      setSwipedIds(new Set());
    }
  }, [products]);

  const handleSwipeLeft = (id: string) => {
    setSwipedIds((prev) => new Set(prev).add(id));
  };

  const handleSwipeRight = (id: string) => {
    onSave(id);
    setSwipedIds((prev) => new Set(prev).add(id));
  };

  const handleReset = () => {
    setSwipedIds(new Set());
  };

  const visibleCards = products.filter((p) => !swipedIds.has(p.id));

  // Prefetch trigger
  useEffect(() => {
    if (visibleCards.length <= 3 && hasMore) {
      onPrefetch();
    }
  }, [visibleCards.length, hasMore, onPrefetch]);

  if (visibleCards.length === 0) {
    if (hasMore) {
      // Loading next page (user swiped faster than fetch)
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
           <Loader2 className="size-10 text-brand-accent animate-spin mb-4" />
           <p className="text-text-secondary font-medium">Fetching more items...</p>
        </div>
      );
    }

    // Truly empty
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
  const renderedCards = visibleCards.slice(0, 3).reverse();

  return (
    <div className="flex-1 flex items-center justify-center relative w-full overflow-hidden perspective-[1000px]">
      <AnimatePresence>
        {renderedCards.map((product, i) => {
          // Because we reversed, the original index 0 is at the END of this array.
          const isTop = i === renderedCards.length - 1;
          const index = renderedCards.length - 1 - i; // 0 for top, 1 for second, etc.
          
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
