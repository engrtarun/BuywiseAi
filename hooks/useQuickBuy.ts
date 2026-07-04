"use client";

import { useState, useEffect, useCallback } from "react";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";

export interface QuickBuyPreferences {
  sizes: string[];
  categories: string[];
  maxBudget: number | null;
}

const PREFS_KEY = "buywise_quickbuy_prefs";
const SAVED_ITEMS_KEY = "buywise_quickbuy_saved";
const QUANTITIES_KEY = "buywise_quickbuy_quantities";

export function useQuickBuy() {
  const [preferences, setPreferences] = useState<QuickBuyPreferences | null>(null);
  const [savedItemIds, setSavedItemIds] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [allProducts, setAllProducts] = useState<QuickBuyProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

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

      const storedQuantities = localStorage.getItem(QUANTITIES_KEY);
      if (storedQuantities) {
        setItemQuantities(JSON.parse(storedQuantities));
      }
    } catch (err) {
      console.error("Failed to load QuickBuy state from localStorage", err);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Fetch products from API
  useEffect(() => {
    async function fetchProducts() {
      setIsLoadingProducts(true);
      try {
        const res = await fetch("/api/quick-buy");
        const json = await res.json();
        if (json.success && json.data) {
          setAllProducts(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    fetchProducts();
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
    setItemQuantities((prev) => {
      const next = { ...prev };
      delete next[productId];
      localStorage.setItem(QUANTITIES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItemQuantities((prev) => {
      const next = { ...prev, [productId]: Math.max(1, quantity) };
      localStorage.setItem(QUANTITIES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Filter the fetched data based on preferences
  const getFilteredProducts = useCallback((): QuickBuyProduct[] => {
    if (!preferences) return [];
    
    return allProducts.filter((product) => {
      // Check budget
      if (preferences.maxBudget !== null && product.price > preferences.maxBudget) {
        return false;
      }
      
      // Check sizes (product must have at least one of the selected sizes)
      if (preferences.sizes?.length > 0) {
        const hasMatchingSize = product.sizes.some((size) => preferences.sizes.includes(size));
        if (!hasMatchingSize) return false;
      }

      // Check categories (if any selected, product must match one)
      if (preferences.categories?.length > 0) {
        if (!preferences.categories.includes(product.category)) return false;
      }
      
      return true;
    });
  }, [preferences]);

  // Derived saved items list
  const savedProducts = savedItemIds
    .map((id) => allProducts.find((p) => p.id === id))
    .filter((p): p is QuickBuyProduct => p !== undefined);

  return {
    isInitializing,
    isLoadingProducts,
    preferences,
    savePreferences,
    clearPreferences,
    savedItemIds,
    savedProducts,
    itemQuantities,
    saveItem,
    removeSavedItem,
    updateQuantity,
    getFilteredProducts,
  };
}
