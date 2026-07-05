"use client";

import React, { useState, useEffect } from "react";
import { FoodSwipeCard } from "./FoodSwipeCard";
import { quickBuyMockFoodData } from "@/lib/quickBuyMockFoodData";
import { motion, AnimatePresence } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";

export function FoodSwipeCardDeck({ customizations, onOrder, minBudget, maxBudget }: { customizations: string[], onOrder?: () => void, minBudget?: number | "", maxBudget?: number | "" }) {
  const [items, setItems] = useState(() => {
    return quickBuyMockFoodData.filter((item) => {
      if (minBudget !== "" && minBudget !== undefined && item.price < minBudget) return false;
      if (maxBudget !== "" && maxBudget !== undefined && item.price > maxBudget) return false;
      return true;
    });
  });

  const handleSwipeLeft = (id: string) => {
    setItems((prev) => {
      const item = prev.find(i => i.id === id);
      const rest = prev.filter((i) => i.id !== id);
      return item ? [...rest, item] : rest;
    });
  };

  const handleSwipeRight = (id: string) => {
    setItems((prev) => {
      const item = prev.find(i => i.id === id);
      const rest = prev.filter((i) => i.id !== id);
      return item ? [...rest, item] : rest;
    });
    if (onOrder) onOrder();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (items.length === 0) return;
      const topItem = items[0];
      if (e.key === "ArrowLeft") {
        handleSwipeLeft(topItem.id);
      } else if (e.key === "ArrowRight") {
        handleSwipeRight(topItem.id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary h-full">
        <UtensilsCrossed className="size-16 mb-4 opacity-50" />
        <h3 className="text-xl font-heading font-bold text-text-primary-light mb-2">No more food items!</h3>
        <p className="text-sm">Check back later for more delicious options.</p>
      </div>
    );
  }

  // To give the deck stacking effect, we reverse the list so the first item is on top
  const visibleItems = items.slice(0, 3).reverse();

  return (
    <div className="flex-1 flex items-center justify-center relative w-full h-full p-4 touch-none overflow-hidden">
      <AnimatePresence>
        {visibleItems.map((item, idx) => {
          // Because we reversed, the real index in the 3-item stack is (visibleItems.length - 1 - idx)
          // So if length is 3: idx 2 is real index 0 (top). idx 1 is real index 1 (middle).
          const realIndex = visibleItems.length - 1 - idx;
          const isTop = realIndex === 0;

          return (
            <FoodSwipeCard
              key={item.id}
              product={item}
              index={realIndex}
              isTop={isTop}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              customizations={isTop ? customizations : []} // Only apply customization badges to top card
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
