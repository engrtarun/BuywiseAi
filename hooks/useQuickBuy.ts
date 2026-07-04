"use client";

import { useState, useEffect, useCallback } from "react";
import { QuickBuyProduct, mockQuickBuyProducts } from "@/lib/quickBuyMockData";

export interface QuickBuyPreferences {
  sizes: string[];
  maxBudget: number | null;
}

const PREFS_KEY = "buywise_quickbuy_prefs";
const SAVED_ITEMS_KEY = "buywise_quickbuy_saved";

export function useQuickBuy() {
  const [preferences, setPreferences] = useState<QuickBuyPreferences | null>(null);
  const [savedItemIds, setSavedItemIds] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedPrefs = localStorage.getItem(PREFS_KEY);
      if (storedPrefs) {
        setPreferences(JSON.parse(storedPrefs));
      }

      const storedSaved = localStorage.getItem(SAVED_ITEMS_KEY);
      if (storedSaved) {
        setSavedItemIds(JSON.parse(storedSaved));
      }
    } catch (err) {
      console.error("Failed to load QuickBuy state from localStorage", err);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const savePreferences = useCallback((newPrefs: QuickBuyPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
  }, []);

  const clearPreferences = useCallback(() => {
    setPreferences(null);
    localStorage.removeItem(PREFS_KEY);
  }, []);

  const saveItem = useCallback((productId: string) => {
    setSavedItemIds((prev) => {
      if (prev.includes(productId)) return prev;
      const next = [...prev, productId];
      localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeSavedItem = useCallback((productId: string) => {
    setSavedItemIds((prev) => {
      const next = prev.filter((id) => id !== productId);
      localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Filter the mock data based on preferences
  const getFilteredProducts = useCallback((): QuickBuyProduct[] => {
    if (!preferences) return [];
    
    return mockQuickBuyProducts.filter((product) => {
      // Check budget
      if (preferences.maxBudget !== null && product.price > preferences.maxBudget) {
        return false;
      }
      
      // Check sizes (product must have at least one of the selected sizes)
      if (preferences.sizes.length > 0) {
        const hasMatchingSize = product.sizes.some((size) => preferences.sizes.includes(size));
        if (!hasMatchingSize) return false;
      }
      
      return true;
    });
  }, [preferences]);

  // Derived saved items list
  const savedProducts = savedItemIds
    .map((id) => mockQuickBuyProducts.find((p) => p.id === id))
    .filter((p): p is QuickBuyProduct => p !== undefined);

  return {
    isInitializing,
    preferences,
    savePreferences,
    clearPreferences,
    savedItemIds,
    savedProducts,
    saveItem,
    removeSavedItem,
    getFilteredProducts,
  };
}
