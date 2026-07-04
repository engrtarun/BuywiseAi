"use client";

import React, { useState, useEffect } from "react";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";
import { SwipeableProductCard } from "./SwipeableProductCard";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCcw, SlidersHorizontal, Loader2, PartyPopper, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

interface SwipeCardDeckProps {
  products: QuickBuyProduct[];
  onSave: (id: string) => void;
  onOpenSettings: () => void;
  hasMore: boolean;
  onPrefetch: () => void;
  onBuy?: (product: QuickBuyProduct) => void;
}

export function SwipeCardDeck({ products, onSave, onOpenSettings, hasMore, onPrefetch, onBuy }: SwipeCardDeckProps) {
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Initialize from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("buywise_quickbuy_swiped_ids");
      if (stored) {
        try {
          setSwipedIds(new Set(JSON.parse(stored)));
        } catch (e) {
          console.error("Failed to parse swiped IDs", e);
        }
      }
    }
  }, []);

  // Reset swiped cards when the products completely change (e.g. filter change), or just rely on the IDs.
  // Actually, keeping the swiped IDs is better even if products change, so they don't see them again if they switch back.
  // We will let the Set grow.

  const saveToSession = (newSet: Set<string>) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("buywise_quickbuy_swiped_ids", JSON.stringify(Array.from(newSet)));
    }
  };

  const handleSwipeLeft = (id: string) => {
    setSwipedIds((prev) => {
      const next = new Set(prev).add(id);
      saveToSession(next);
      return next;
    });
  };

  const handleSwipeRight = (id: string) => {
    onSave(id);
    setSwipedIds((prev) => {
      const next = new Set(prev).add(id);
      saveToSession(next);
      return next;
    });
  };

  const handleReset = () => {
    setSwipedIds(new Set());
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("buywise_quickbuy_swiped_ids");
    }
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500 relative overflow-hidden">
        
        {/* Subtle Confetti background element */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-marigold/40 via-bg-main to-bg-main"></div>

        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
          className="size-24 rounded-full bg-brand-accent/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,176,103,0.3)] border border-brand-accent/30"
        >
          <PartyPopper className="size-10 text-brand-accent" />
        </motion.div>
        
        <h2 className="text-2xl sm:text-3xl font-heading font-black text-text-primary-light mb-3 max-w-sm leading-tight">
          You've unlocked all personalized recommendations for today! 🎉
        </h2>
        
        <p className="text-text-secondary mb-10 max-w-sm text-sm sm:text-base leading-relaxed">
          Great job! You've reviewed your entire curated stack. Want to change your sizing or budget to see more?
        </p>
        
        <div className="flex flex-col gap-3 w-full max-w-[280px] relative z-10">
          <button
            onClick={() => router.push('/chat')}
            className="w-full py-4 rounded-xl bg-brand-accent text-bg-main font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2"
          >
            <MessageSquare className="size-5" />
            Back to AI Chat
          </button>
          
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={handleReset}
              className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-text-primary-light font-bold hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <RefreshCcw className="size-4" />
              Refresh
            </button>
            <button
              onClick={onOpenSettings}
              className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-text-primary-light font-bold hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <SlidersHorizontal className="size-4" />
              Settings
            </button>
          </div>
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
              index={index}
              isTop={isTop}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onBuy={onBuy}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
