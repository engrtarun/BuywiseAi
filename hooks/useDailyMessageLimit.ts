"use client";

import { useCallback, useEffect, useState } from "react";
import { getDailyMessageLimitStatus } from "@/app/actions/chat";
import type { MessageLimitResult } from "@/app/actions/chat";

const DAILY_LIMIT = 25;

export function useDailyMessageLimit() {
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const applyLimitStatus = useCallback((status: MessageLimitResult) => {
    setDailyMessageCount(status.messageCount);
    setDailyLimitReached(status.messageCount >= status.dailyLimit);
  }, []);

  const refreshDailyLimitStatus = useCallback(async () => {
    const status = await getDailyMessageLimitStatus();
    applyLimitStatus(status);
    return status;
  }, [applyLimitStatus]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const status = await getDailyMessageLimitStatus();
        if (mounted) {
          applyLimitStatus(status);
        }
      } catch (error) {
        console.error("Failed to load daily message limit:", error);
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [applyLimitStatus]);

  const dailyMessagesRemaining = Math.max(0, DAILY_LIMIT - dailyMessageCount);

  return {
    dailyMessageCount,
    dailyLimitReached,
    dailyMessagesRemaining,
    refreshDailyLimitStatus,
    applyLimitStatus,
    isInitializing,
    DAILY_LIMIT,
  };
}
