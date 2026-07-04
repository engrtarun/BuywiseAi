"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";

export interface QuickBuyPreferences {
  sizes: string[];
  preferredCategories: string[];
  maxBudget: number | null;
}

const PREFS_KEY = "buywise_quickbuy_prefs";
const SAVED_ITEMS_KEY = "buywise_quickbuy_saved";
const QUANTITIES_KEY = "buywise_quickbuy_quantities";
const TOTAL_SPENT_KEY = "buywise_quickbuy_spent";

function normalizeProfilePreferences(raw: Record<string, any> | null | undefined): QuickBuyPreferences | null {
  if (!raw) return null;

  const sizes = Array.isArray(raw.sizes)
    ? raw.sizes
    : typeof raw.size === "string"
      ? raw.size.split(",").map((value: string) => value.trim()).filter(Boolean)
      : [];

  const preferredCategories = Array.isArray(raw.preferred_categories)
    ? raw.preferred_categories
    : Array.isArray(raw.preferredCategories)
      ? raw.preferredCategories
      : [];

  const maxBudget = typeof raw.max_budget === "number"
    ? raw.max_budget
    : typeof raw.budget === "number"
      ? raw.budget
      : typeof raw.maxBudget === "number"
        ? raw.maxBudget
        : null;

  if (sizes.length === 0 && preferredCategories.length === 0 && maxBudget === null) {
    return null;
  }

  return {
    sizes,
    preferredCategories,
    maxBudget,
  };
}

export function useQuickBuy() {
  const [preferences, setPreferences] = useState<QuickBuyPreferences | null>(null);
  const [savedItemIds, setSavedItemIds] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState(true);

  const [allProducts, setAllProducts] = useState<QuickBuyProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const storedPrefs = localStorage.getItem(PREFS_KEY);
        if (storedPrefs) {
          const parsedPrefs = JSON.parse(storedPrefs) as QuickBuyPreferences;
          if (isMounted) {
            setPreferences(parsedPrefs);
          }
        }

        const storedSaved = localStorage.getItem(SAVED_ITEMS_KEY);
        if (storedSaved) {
          if (isMounted) {
            setSavedItemIds(JSON.parse(storedSaved));
          }
        }

        const storedQuantities = localStorage.getItem(QUANTITIES_KEY);
        if (storedQuantities) {
          if (isMounted) {
            setItemQuantities(JSON.parse(storedQuantities));
          }
        }

        const storedSpent = sessionStorage.getItem(TOTAL_SPENT_KEY);
        if (storedSpent) {
          if (isMounted) {
            setTotalSpent(JSON.parse(storedSpent));
          }
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !isMounted) {
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("size, budget, sizes, max_budget, preferred_sizes, preferred_categories, preferences")
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        if (error) {
          console.warn("Quick Buy profile preferences are unavailable:", error.message);
          return;
        }

        const profilePreferences = normalizeProfilePreferences(profile as Record<string, any> | null);
        if (profilePreferences && !storedPrefs && isMounted) {
          setPreferences(profilePreferences);
        }
      } catch (err) {
        console.error("Failed to load QuickBuy state from localStorage or Supabase", err);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
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
        setHasMore(Boolean(json.pagination?.hasMore));
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
    setTotalSpent(0);
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
    sessionStorage.removeItem(TOTAL_SPENT_KEY);
  }, []);

  const clearPreferences = useCallback(() => {
    setPreferences(null);
    setPage(1);
    setHasMore(true);
    setAllProducts([]);
    setTotalSpent(0);
    localStorage.removeItem(PREFS_KEY);
    sessionStorage.removeItem(TOTAL_SPENT_KEY);
  }, []);

  const saveItem = useCallback((productId: string) => {
    setSavedItemIds((prev) => {
      if (prev.includes(productId)) return prev;
      const next = [...prev, productId];
      localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(next));
      return next;
    });

    const product = allProducts.find((item) => item.id === productId);
    if (!product) {
      console.warn("Quick Buy save skipped because product data was not available in the current catalog.");
      return;
    }

    void fetch("/api/quick-buy/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        image_url: (product as QuickBuyProduct & { image_url?: string }).image_url || product.image,
        is_cart: false,
      }),
    }).catch((err) => {
      console.error("Failed to persist Quick Buy save action", err);
    });
  }, [allProducts]);

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
    console.info("Quick Buy remove action is local-only for now.", productId);
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItemQuantities((prev) => {
      const next = { ...prev, [productId]: Math.max(1, quantity) };
      localStorage.setItem(QUANTITIES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addExpense = useCallback((product: QuickBuyProduct) => {
    setTotalSpent((prev) => {
      const next = prev + product.price;
      sessionStorage.setItem(TOTAL_SPENT_KEY, JSON.stringify(next));
      return next;
    });

    void fetch("/api/quick-buy/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        image_url: (product as QuickBuyProduct & { image_url?: string }).image_url || product.image,
        is_cart: false,
        action_type: 'buy'
      }),
    }).catch((err) => {
      console.error("Failed to persist Quick Buy buy action", err);
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
    fetchNextPage,
    totalSpent,
    addExpense
  };
}
