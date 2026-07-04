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
  const [isInitializing, setIsInitializing] = useState(true);

  const [allProducts, setAllProducts] = useState<QuickBuyProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

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

  useEffect(() => {
    async function fetchProducts() {
      setIsLoadingProducts(true);
      try {
        const params = new URLSearchParams();
        if (preferences?.sizes?.length) {
          params.set("size", preferences.sizes.join(","));
        }
        if (preferences?.maxBudget !== null && preferences?.maxBudget !== undefined) {
          params.set("budget", String(preferences.maxBudget));
        }

        const url = `/api/quick-buy${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url);
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

    if (!isInitializing) {
      void fetchProducts();
    }
  }, [preferences, isInitializing]);

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

    // No DELETE endpoint exists yet, so removal is only local until the backend is added.
    console.info("Quick Buy remove action is local-only for now.", productId);
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItemQuantities((prev) => {
      const next = { ...prev, [productId]: Math.max(1, quantity) };
      localStorage.setItem(QUANTITIES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getFilteredProducts = useCallback((): QuickBuyProduct[] => {
    if (!preferences) return [];

    return allProducts.filter((product) => {
      if (preferences.maxBudget !== null && product.price > preferences.maxBudget) {
        return false;
      }

      if (preferences.sizes?.length > 0) {
        const hasMatchingSize = product.sizes.some((size) => preferences.sizes.includes(size));
        if (!hasMatchingSize) return false;
      }

      if (preferences.preferredCategories?.length > 0) {
        if (!preferences.preferredCategories.includes(product.category)) return false;
      }

      return true;
    });
  }, [preferences, allProducts]);

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
