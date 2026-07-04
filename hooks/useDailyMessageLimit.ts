"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const DAILY_LIMIT = 25;

export function getCurrentISTDateString(): string {
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Asia/Kolkata', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(new Date()); // returns "YYYY-MM-DD"
}

/* ──────────────────────────────────────────────────────
   useDailyMessageLimit
   Encapsulates a daily message limit for authenticated users.
   
   IMPORTANT: For now, this is a client-side tracking solution 
   using localStorage, keyed by userId. 
   
   TODO (PRODUCTION-CORRECT IMPLEMENTATION):
   This limit should be strictly tracked server-side (e.g., in a 
   Supabase table/function) because localStorage can be cleared or 
   bypassed by tech-savvy users. This is an interim solution 
   until full backend quota integration is ready.
   ────────────────────────────────────────────────────── */
export function useDailyMessageLimit() {
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Refs for synchronous access in increment logic
  const countRef = useRef(0);
  const userIdRef = useRef<string | null>(null);

  const checkAndResetLimit = useCallback((uid: string) => {
    const dateKey = `buywise_daily_reset_date_${uid}`;
    const countKey = `buywise_daily_count_${uid}`;
    
    const storedDate = localStorage.getItem(dateKey);
    const currentDate = getCurrentISTDateString();
    
    if (storedDate !== currentDate) {
      // New day in IST! Reset count.
      localStorage.setItem(dateKey, currentDate);
      localStorage.setItem(countKey, "0");
      setDailyMessageCount(0);
      countRef.current = 0;
    } else {
      // Same day, load existing count
      const storedCount = parseInt(localStorage.getItem(countKey) || "0", 10);
      const validCount = Number.isNaN(storedCount) ? 0 : storedCount;
      setDailyMessageCount(validCount);
      countRef.current = validCount;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;

      if (session?.user) {
        setUserId(session.user.id);
        userIdRef.current = session.user.id;
        checkAndResetLimit(session.user.id);
      }
      setIsInitializing(false);
    };
    init();

    return () => { mounted = false; };
  }, [checkAndResetLimit]);

  const incrementDailyCount = useCallback(() => {
    const uid = userIdRef.current;
    if (!uid) return;
    
    // Always check for rollover before incrementing
    checkAndResetLimit(uid);
    
    const countKey = `buywise_daily_count_${uid}`;
    const nextCount = countRef.current + 1;
    
    localStorage.setItem(countKey, String(nextCount));
    setDailyMessageCount(nextCount);
    countRef.current = nextCount;
  }, [checkAndResetLimit]);

  const dailyLimitReached = dailyMessageCount >= DAILY_LIMIT;
  const dailyMessagesRemaining = Math.max(0, DAILY_LIMIT - dailyMessageCount);

  return {
    dailyMessageCount,
    dailyLimitReached,
    dailyMessagesRemaining,
    incrementDailyCount,
    isInitializing,
    DAILY_LIMIT,
  };
}
