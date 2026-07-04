"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";

export interface QuickBuyPreferences {
  sizes: string[];
  preferredCategories: string[];
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
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

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
  const fetchProducts = useCallback(async (currentPage: number, prefs: QuickBuyPreferences | null, isNextPage: boolean = false) => {
    if (isNextPage) setIsFetchingNextPage(true);
    else setIsLoadingProducts(true);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
      });

      if (prefs) {
        if (prefs.sizes?.length > 0) params.append("sizes", prefs.sizes.join(","));
        if (prefs.preferredCategories?.length > 0) params.append("categories", prefs.preferredCategories.join(","));
        if (prefs.maxBudget !== null) params.append("budget", prefs.maxBudget.toString());
      }

      const res = await fetch(`/api/quick-buy?${params.toString()}`);
      const json = await res.json();
      
      if (json.success && json.data) {
        if (isNextPage) {
          setAllProducts(prev => {
            // Avoid duplicates
            const newIds = new Set(json.data.map((p: any) => p.id));
            const filteredPrev = prev.filter(p => !newIds.has(p.id));
            return [...filteredPrev, ...json.data];
          });
        } else {
          setAllProducts(json.data);
        }
        setHasMore(json.pagination.hasMore);
      } else {
        // Fallback to empty if error
        if (!isNextPage) setAllProducts([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
      if (!isNextPage) setAllProducts([]);
      setHasMore(false);
    } finally {
      setIsLoadingProducts(false);
      setIsFetchingNextPage(false);
    }
  }, []);

  // Trigger initial fetch or fetch when preferences change
  useEffect(() => {
    // Only fetch if we're not initializing localStorage anymore
    if (!isInitializing) {
      // If preferences exist, it will use them for filtering. 
      // If null, it will fetch without filters.
      fetchProducts(1, preferences, false);
    }
  }, [preferences, isInitializing, fetchProducts]);

  const fetchNextPage = useCallback(() => {
    if (!hasMore || isFetchingNextPage || isLoadingProducts) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, preferences, true);
  }, [hasMore, isFetchingNextPage, isLoadingProducts, page, preferences, fetchProducts]);

  const savePreferences = useCallback((newPrefs: QuickBuyPreferences) => {
    setPreferences(newPrefs);
    setPage(1);
    setHasMore(true);
    setAllProducts([]); // Clear UI immediately while new ones load
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
  }, []);

  const clearPreferences = useCallback(() => {
    setPreferences(null);
    setPage(1);
    setHasMore(true);
    setAllProducts([]);
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

  // Since filtering is now server-side, this just returns allProducts
  const getFilteredProducts = useCallback((): QuickBuyProduct[] => {
    return allProducts;
  }, [allProducts]);

  // Derived saved items list
  const savedProducts = savedItemIds
    .map((id) => allProducts.find((p) => p.id === id))
    .filter((p): p is QuickBuyProduct => p !== undefined);

  return {
    isInitializing,
    isLoadingProducts,
    isFetchingNextPage,
    hasMore,
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
    fetchNextPage
  };
}
