"use client";

import { useCallback, useEffect, useState } from "react";
import { getDailyMessageLimitStatus } from "@/app/actions/chat";
import type { MessageLimitResult } from "@/app/actions/chat";

const DEFAULT_TOKEN_LIMIT = 20000;

export function useDailyMessageLimit() {
  const [tokensUsed, setTokensUsed] = useState(0);
  const [tokenLimit, setTokenLimit] = useState(DEFAULT_TOKEN_LIMIT);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const applyLimitStatus = useCallback((status: MessageLimitResult) => {
    const used = status.tokensUsed ?? status.messageCount ?? 0;
    const limit = status.tokenLimit ?? status.dailyLimit ?? DEFAULT_TOKEN_LIMIT;
    setTokensUsed(used);
    setTokenLimit(limit);
    setDailyLimitReached(used >= limit);
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
        console.error("Failed to load daily limit:", error);
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

  const tokensRemaining = Math.max(0, tokenLimit - tokensUsed);

  return {
    tokensUsed,
    tokenLimit,
    dailyLimitReached,
    tokensRemaining,
    refreshDailyLimitStatus,
    applyLimitStatus,
    isInitializing,
    // Legacy mapping to avoid typescript errors in files we haven't touched yet
    dailyMessageCount: tokensUsed,
    dailyMessagesRemaining: tokensRemaining,
    DAILY_LIMIT: tokenLimit,
  };
}
