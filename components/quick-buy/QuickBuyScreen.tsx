"use client";

import React, { useState } from "react";
import { useQuickBuy } from "@/hooks/useQuickBuy";
import { SizeBudgetForm } from "./SizeBudgetForm";
import { SwipeCardDeck } from "./SwipeCardDeck";
import { SavedItemsList } from "./SavedItemsList";
import { X, Settings2, Heart } from "lucide-react";

interface QuickBuyScreenProps {
  onClose: () => void;
}

export function QuickBuyScreen({ onClose }: QuickBuyScreenProps) {
  const { 
    isInitializing, 
    isLoadingProducts,
    preferences, 
    savePreferences, 
    savedItemIds, 
    savedProducts, 
    itemQuantities,
    saveItem, 
    removeSavedItem, 
    updateQuantity,
    getFilteredProducts 
  } = useQuickBuy();

  const [showSettings, setShowSettings] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Still loading localStorage
  if (isInitializing) {
    return (
      <div className="absolute inset-0 z-[100] bg-bg-main flex items-center justify-center">
        <div className="size-8 rounded-full border-4 border-brand-accent/20 border-t-brand-accent animate-spin" />
      </div>
    );
  }

  // If preferences aren't set, force them to set them first (unless they explicitly opened settings)
  if (!preferences || showSettings) {
    return (
      <div className="absolute inset-0 z-[100] bg-bg-main flex flex-col">
        {/* Simple header for settings */}
        {preferences && (
          <div className="flex items-center justify-between px-4 py-4 border-b border-border-light bg-bg-main/80 backdrop-blur-md">
            <button onClick={() => setShowSettings(false)} className="p-2 -ml-2 rounded-full hover:bg-white/5 text-text-primary-light">
              <X className="size-6" />
            </button>
            <div className="font-bold text-text-primary-light">Quick Buy Settings</div>
            <div className="w-10" />
          </div>
        )}
        <SizeBudgetForm 
          initialPreferences={preferences} 
          onSave={(prefs) => {
            savePreferences(prefs);
            setShowSettings(false);
          }} 
        />
        {/* Allow closing the entire screen if they don't want to set preferences */}
        {!preferences && (
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white z-50">
            <X className="size-6" />
          </button>
        )}
      </div>
    );
  }

  if (showSaved) {
    return (
      <div className="absolute inset-0 z-[100] bg-bg-main">
        <SavedItemsList 
          items={savedProducts} 
          itemQuantities={itemQuantities}
          onBack={() => setShowSaved(false)} 
          onRemove={removeSavedItem} 
          onUpdateQuantity={updateQuantity}
        />
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <div className="absolute inset-0 z-[100] bg-bg-main flex flex-col overflow-hidden animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 sm:py-4 border-b border-border-light bg-bg-main/80 backdrop-blur-md relative z-10">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 -ml-3 rounded-full hover:bg-white/5 text-text-primary-light transition-colors font-medium"
        >
          <X className="size-5" />
          <span className="hidden sm:inline">Back to Chat</span>
        </button>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Budget Display/Edit */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group"
            title="Change Budget & Sizes"
          >
            <span className="text-xs font-medium text-text-secondary hidden sm:inline">Budget:</span>
            <span className="text-sm font-bold text-brand-accent">
              {preferences?.maxBudget ? `₹${preferences.maxBudget}` : "Any"}
            </span>
            <Settings2 className="size-3.5 text-text-secondary group-hover:text-text-primary-light" />
          </button>
          <button
            onClick={() => setShowSaved(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-text-primary-light transition-colors relative"
          >
            <Heart className="size-4.5 text-red-400" />
            <span className="font-bold text-[13px]">{savedItemIds.length}</span>
          </button>
        </div>
      </div>

      {/* Swipe Deck */}
      {isLoadingProducts ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="size-8 rounded-full border-4 border-brand-accent/20 border-t-brand-accent animate-spin mb-4" />
          <p className="text-text-secondary font-medium animate-pulse">Loading live collection...</p>
        </div>
      ) : (
        <SwipeCardDeck 
          products={filteredProducts} 
          onSave={saveItem} 
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

    </div>
  );
}
