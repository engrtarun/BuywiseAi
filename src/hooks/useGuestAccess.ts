"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/* ── Constants ──────────────────────────────────────── */
const GUEST_MODE_KEY = "buywise_guest_mode";
const GUEST_COUNT_KEY = "buywise_guest_message_count";
const FREE_MESSAGE_LIMIT = 3;

/* ──────────────────────────────────────────────────────
   useGuestAccess
   Encapsulates guest-mode state + localStorage persistence.

   Current behaviour: PERMANENT per-browser limit (never
   resets unless localStorage is cleared or user logs in).

   TODO (product decision): To add a daily-reset, store a
   timestamp alongside the count (e.g. `buywise_guest_ts`)
   and reset if >24 h have elapsed since first message.
   ────────────────────────────────────────────────────── */

function readLocalInt(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function readLocalBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === "true";
}

export function useGuestAccess() {
  /* Lazy-initialise from localStorage (avoids SSR mismatch) */
  const [isGuest, setIsGuest] = useState(false);
  const [guestMessageCount, setGuestMessageCount] = useState(0);

  /* Hydrate from localStorage on mount (client only), then verify actual auth */
  useEffect(() => {
    setIsGuest(readLocalBool(GUEST_MODE_KEY, false));
    setGuestMessageCount(readLocalInt(GUEST_COUNT_KEY, 0));

    const checkAuthAndClearIfLoggedin = async () => {
      const supabase = createClient();
      if (!supabase) {
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("[useGuestAccess] User is authenticated. Resetting guest state.");
        setIsGuest(false);
        setGuestMessageCount(0);
        localStorage.removeItem(GUEST_MODE_KEY);
        localStorage.removeItem(GUEST_COUNT_KEY);
        document.cookie = `${GUEST_MODE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    };

    checkAuthAndClearIfLoggedin();
  }, []);

  /* Derived */
  const canSendMessage = !isGuest || guestMessageCount < FREE_MESSAGE_LIMIT;
  const messagesRemaining = Math.max(0, FREE_MESSAGE_LIMIT - guestMessageCount);

  /* ── Actions ─────────────────────────────────────── */

  /** Activate guest mode (called when user clicks X on login) */
  const enterGuestMode = useCallback(() => {
    setIsGuest(true);
    localStorage.setItem(GUEST_MODE_KEY, "true");
    document.cookie = `${GUEST_MODE_KEY}=true; path=/; max-age=31536000`;
    // Preserve any existing count (don't reset on re-enter)
  }, []);

  /** Increment guest message count by 1 */
  const incrementGuestMessageCount = useCallback(() => {
    setGuestMessageCount((prev) => {
      const next = prev + 1;
      localStorage.setItem(GUEST_COUNT_KEY, String(next));
      console.log(`[useGuestAccess] Incremented guestMessageCount: ${prev} -> ${next}`);
      return next;
    });
  }, []);

  /** Clear guest state entirely (call on successful login) */
  const resetGuestAccess = useCallback(() => {
    setIsGuest(false);
    setGuestMessageCount(0);
    localStorage.removeItem(GUEST_MODE_KEY);
    localStorage.removeItem(GUEST_COUNT_KEY);
    document.cookie = `${GUEST_MODE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }, []);

  return {
    isGuest,
    guestMessageCount,
    canSendMessage,
    messagesRemaining,
    freeMessageLimit: FREE_MESSAGE_LIMIT,
    enterGuestMode,
    incrementGuestMessageCount,
    resetGuestAccess,
  } as const;
}
