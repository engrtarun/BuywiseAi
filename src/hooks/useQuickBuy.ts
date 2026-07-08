"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";
import { useQuickBuyProfiles } from "@/hooks/useQuickBuyProfiles";

export interface QuickBuyPreferences {
  sizes: string[];
  preferredCategories: string[];
  maxBudget: number | null;
}

const PREFS_KEY = "buywise_quickbuy_prefs";
const SAVED_ITEMS_KEY = "buywise_quickbuy_saved";
const SAVED_LATER_KEY = "buywise_quickbuy_saved_later";
const QUANTITIES_KEY = "buywise_quickbuy_quantities";
const TOTAL_SPENT_KEY = "buywise_quickbuy_spent";
const PRODUCT_CACHE_KEY = "buywise_quickbuy_product_cache";

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
  const {
    profiles,
    activeProfile,
    isInitializing: isProfilesInitializing,
    createProfile,
    switchProfile,
    updateProfile,
    deleteProfile
  } = useQuickBuyProfiles();

  const preferences = useMemo<QuickBuyPreferences | null>(() => {
    if (!activeProfile) return null;
    return {
      sizes: activeProfile.sizes,
      preferredCategories: activeProfile.preferredCategories,
      maxBudget: activeProfile.maxBudget
    };
  }, [activeProfile]);

  const [savedItemIds, setSavedItemIds] = useState<string[]>([]);
  const [savedForLaterIds, setSavedForLaterIds] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [productCache, setProductCache] = useState<Record<string, QuickBuyProduct>>({});
  const [isLocalInitializing, setIsLocalInitializing] = useState(true);

  const isInitializing = isProfilesInitializing || isLocalInitializing;

  const [allProducts, setAllProducts] = useState<QuickBuyProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const storedSaved = localStorage.getItem(SAVED_ITEMS_KEY);
        if (storedSaved) {
          if (isMounted) {
            setSavedItemIds(JSON.parse(storedSaved));
          }
        }

        const storedSavedLater = localStorage.getItem(SAVED_LATER_KEY);
        if (storedSavedLater) {
          if (isMounted) {
            setSavedForLaterIds(JSON.parse(storedSavedLater));
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

        const storedCache = localStorage.getItem(PRODUCT_CACHE_KEY);
        if (storedCache) {
          if (isMounted) {
            setProductCache(JSON.parse(storedCache));
          }
        }
      } catch (err) {
        console.error("Failed to load QuickBuy state from localStorage", err);
      } finally {
        if (isMounted) {
          setIsLocalInitializing(false);
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
    setFetchError(null);

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
        
        // Update product cache with any new products fetched
        setProductCache(prev => {
          const next = { ...prev };
          let changed = false;
          json.data.forEach((p: QuickBuyProduct) => {
            if (!next[p.id]) {
              next[p.id] = p;
              changed = true;
            }
          });
          if (changed) {
            localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(next));
            return next;
          }
          return prev;
        });

        setHasMore(Boolean(json.pagination?.hasMore));
      } else {
        // Fallback to empty if error
        if (!isNextPage) setAllProducts([]);
        setHasMore(false);
        setFetchError("Failed to fetch products.");
      }
    } catch (err: any) {
      console.error("Failed to fetch products", err);
      if (!isNextPage) setAllProducts([]);
      setHasMore(false);
      setFetchError(err.message || "Network error");
    } finally {
      setIsLoadingProducts(false);
      setIsFetchingNextPage(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch if we're not initializing localStorage anymore
    if (!isInitializing) {
      const t = setTimeout(() => fetchProducts(1, preferences, false), 0);
      return () => clearTimeout(t);
    }
  }, [preferences, isInitializing, fetchProducts]);

  const fetchNextPage = useCallback(() => {
    if (!hasMore || isFetchingNextPage || isLoadingProducts) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, preferences, true);
  }, [hasMore, isFetchingNextPage, isLoadingProducts, page, preferences, fetchProducts]);

  const retryFetch = useCallback(() => {
    fetchProducts(1, preferences, false);
  }, [fetchProducts, preferences]);

  const savePreferences = useCallback(async (newPrefs: QuickBuyPreferences) => {
    setPage(1);
    setHasMore(true);
    setAllProducts([]); // Clear UI immediately while new ones load
    setTotalSpent(0);
    sessionStorage.removeItem(TOTAL_SPENT_KEY);

    if (activeProfile) {
      await updateProfile(activeProfile.id, newPrefs);
    } else {
      await createProfile({
        name: "You",
        sizes: newPrefs.sizes,
        preferredCategories: newPrefs.preferredCategories,
        maxBudget: newPrefs.maxBudget
      });
    }
  }, [activeProfile, updateProfile, createProfile]);

  const clearPreferences = useCallback(async () => {
    setPage(1);
    setHasMore(true);
    setAllProducts([]);
    setTotalSpent(0);
    sessionStorage.removeItem(TOTAL_SPENT_KEY);

    if (activeProfile) {
      await updateProfile(activeProfile.id, {
        sizes: [],
        preferredCategories: [],
        maxBudget: null
      });
    }
  }, [activeProfile, updateProfile]);

  const handleInteractionLearn = useCallback((product: QuickBuyProduct) => {
    if (!activeProfile || !product.category) return;
    
    const currentCategories = activeProfile.preferredCategories || [];
    if (!currentCategories.includes(product.category)) {
      const nextCategories = [...currentCategories, product.category];
      
      // Silently update profile for continuous learning
      updateProfile(activeProfile.id, {
        preferredCategories: nextCategories
      }).catch(err => console.error("Failed to learn preference:", err));
    }
  }, [activeProfile, updateProfile]);

  const saveItem = useCallback((productOrId: string | QuickBuyProduct) => {
    let productId = "";
    let product: QuickBuyProduct | undefined;

    if (typeof productOrId === "string") {
      productId = productOrId;
      product = allProducts.find((item) => item.id === productId);
    } else {
      productId = productOrId.id;
      product = productOrId;
    }
    setSavedItemIds((prev) => {
      if (prev.includes(productId)) return prev;
      const next = [...prev, productId];
      localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(next));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cart-updated"));
      }
      return next;
    });

    if (!product) {
      console.warn("Quick Buy save skipped because product data was not available in the current catalog.");
      return;
    }

    handleInteractionLearn(product);

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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cart-updated"));
      }
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

  const clearCart = useCallback(() => {
    setSavedItemIds([]);
    setItemQuantities({});
    localStorage.removeItem(SAVED_ITEMS_KEY);
    localStorage.removeItem(QUANTITIES_KEY);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }
  }, []);

  const moveToSavedForLater = useCallback((productId: string) => {
    // Remove from cart
    setSavedItemIds((prev) => {
      const next = prev.filter((id) => id !== productId);
      localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(next));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cart-updated"));
      }
      return next;
    });
    // Add to saved for later
    setSavedForLaterIds((prev) => {
      if (prev.includes(productId)) return prev;
      const next = [...prev, productId];
      localStorage.setItem(SAVED_LATER_KEY, JSON.stringify(next));
      return next;
    });
    // We don't delete quantity so it's preserved if moved back
  }, []);

  const moveToCart = useCallback((productId: string) => {
    // Remove from saved for later
    setSavedForLaterIds((prev) => {
      const next = prev.filter((id) => id !== productId);
      localStorage.setItem(SAVED_LATER_KEY, JSON.stringify(next));
      return next;
    });
    // Add to cart
    setSavedItemIds((prev) => {
      if (prev.includes(productId)) return prev;
      const next = [...prev, productId];
      localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(next));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cart-updated"));
      }
      return next;
    });
  }, []);

  const addExpense = useCallback((product: QuickBuyProduct) => {
    setTotalSpent((prev) => {
      const next = prev + product.price;
      sessionStorage.setItem(TOTAL_SPENT_KEY, JSON.stringify(next));
      return next;
    });

    handleInteractionLearn(product);

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

  // Derived saved items list using cache and allProducts
  const savedProducts = savedItemIds
    .map((id) => allProducts.find((p) => p.id === id) || productCache[id])
    .filter((p): p is QuickBuyProduct => p !== undefined);

  const savedForLaterProducts = savedForLaterIds
    .map((id) => allProducts.find((p) => p.id === id) || productCache[id])
    .filter((p): p is QuickBuyProduct => p !== undefined);

  // Computed cart item count based on actual renderable products
  const cartItemCount = useMemo(() => {
    return savedProducts.length;
  }, [savedProducts]);

  return {
    isInitializing,
    isLoadingProducts,
    isFetchingNextPage,
    hasMore,
    preferences,
    savePreferences,
    clearPreferences,
    cartItemCount,
    savedItemIds,
    savedProducts,
    savedForLaterIds,
    savedForLaterProducts,
    itemQuantities,
    saveItem,
    removeSavedItem,
    updateQuantity,
    clearCart,
    moveToSavedForLater,
    moveToCart,
    getFilteredProducts,
    fetchNextPage,
    fetchError,
    retryFetch,
    totalSpent,
    addExpense,
    profiles,
    activeProfile,
    createProfile,
    switchProfile,
    updateProfile,
    deleteProfile
  };
}
