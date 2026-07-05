"use client";

import React, { useState } from "react";
import { X, Settings2 } from "lucide-react";
import { FoodSwipeCardDeck } from "./FoodSwipeCardDeck";

interface FoodQuickBuyScreenProps {
  onClose: () => void;
}

export function FoodQuickBuyScreen({ onClose }: FoodQuickBuyScreenProps) {
  const [showSettings, setShowSettings] = useState(true);
  const [minBudget, setMinBudget] = useState<number | "">("");
  const [maxBudget, setMaxBudget] = useState<number | "">("");

  if (showSettings) {
    return (
      <div className="absolute inset-0 z-[100] bg-bg-main flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white z-50 transition-all active:scale-95 cursor-pointer"
        >
          <X className="size-6" />
        </button>
        <div className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold font-heading mb-6 text-white text-center">Set Your Budget</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary block mb-1">Minimum Budget (₹)</label>
              <input 
                type="number" 
                value={minBudget} 
                onChange={e => setMinBudget(Number(e.target.value) || "")} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-brand-accent transition-colors" 
                placeholder="e.g. 100" 
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Maximum Budget (₹)</label>
              <input 
                type="number" 
                value={maxBudget} 
                onChange={e => setMaxBudget(Number(e.target.value) || "")} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-brand-accent transition-colors" 
                placeholder="e.g. 500" 
              />
            </div>
          </div>

          <button 
            onClick={() => setShowSettings(false)} 
            className="w-full mt-8 bg-brand-accent text-bg-main font-bold text-lg py-3.5 rounded-xl hover:opacity-90 active:scale-95 transition-all"
          >
            Start Ordering
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[100] bg-bg-main flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 sm:py-4 border-b border-border-light bg-bg-main/80 backdrop-blur-md relative z-10">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 -ml-3 rounded-full hover:bg-white/5 text-text-primary-light transition-colors font-medium"
        >
          <X className="size-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
          >
            <span className="text-xs font-medium text-text-secondary hidden sm:inline">Budget:</span>
            <span className="text-sm font-bold text-brand-accent">
              ₹{minBudget || 0} - ₹{maxBudget || 'Any'}
            </span>
            <Settings2 className="size-3.5 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Swipe Deck */}
      <div className="flex-1 mt-6 z-10 relative">
        <FoodSwipeCardDeck customizations={[]} />
      </div>
    </div>
  );
}
