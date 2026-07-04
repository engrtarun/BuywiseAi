"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="9" r="8" />
      <line x1="9" y1="6" x2="9" y2="10" />
      <line x1="9" y1="12.5" x2="9.01" y2="12.5" />
    </svg>
  );
}

function RetryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.333 2.667v4h4" />
      <path d="M2.34 10a6 6 0 1 0 .54-5.34L1.333 6.667" />
    </svg>
  );
}

interface ErrorMessageCardProps {
  message?: string;
  onRetry: () => void;
  errorType?: "generic" | "rate_limit";
  retryDelay?: number;
}

export function ErrorMessageCard({ onRetry, errorType = "generic", retryDelay }: ErrorMessageCardProps) {
  const [countdown, setCountdown] = React.useState<number | null>(retryDelay || null);

  React.useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const isRateLimit = errorType === "rate_limit";
  const canRetry = !isRateLimit || countdown === null || countdown === 0;

  const errorMessage = isRateLimit 
    ? "BuyWise AI is experiencing high demand right now. Please wait a moment and try again."
    : "Something went wrong while getting a response. Please try again.";
  return (
    <div className="w-full max-w-[85%] sm:max-w-[75%] md:max-w-[65%]">
      <div className="flex items-end gap-2 w-full">
        {/* Avatar */}
        <Avatar className="size-7 sm:size-8 shrink-0">
          <AvatarFallback className="bg-brand-accent/20 text-brand-accent font-heading font-bold text-[10px] sm:text-xs">
            !
          </AvatarFallback>
        </Avatar>

        <div className="
          bg-[#2a2a2a] border border-brand-accent/20 border-l-2 border-l-brand-accent
          text-text-primary-light rounded-2xl rounded-bl-sm px-4 py-3
          text-[14px] sm:text-[15px] leading-relaxed break-words shadow-sm
          font-sans w-full min-w-0
        ">
          <div className="flex items-start gap-2.5">
            <AlertIcon className="text-brand-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-text-primary-light text-[14px] mb-2">
                {errorMessage}
              </p>
              <button
                onClick={canRetry ? onRetry : undefined}
                disabled={!canRetry}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  bg-chili/10 border border-chili/20 text-chili text-[13px] font-sans font-medium
                  transition-all duration-200 touch-manipulation
                  ${canRetry 
                    ? "hover:bg-chili/20 hover:border-chili/30 active:scale-[0.97] cursor-pointer" 
                    : "opacity-50 cursor-not-allowed"}
                `}
              >
                <RetryIcon className={`transition-transform duration-300 ${canRetry ? "hover:rotate-[-180deg]" : ""}`} />
                {isRateLimit && countdown && countdown > 0 ? `Retry in ${countdown}s...` : "Retry"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
