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
  onRetry: () => void;
}

export function ErrorMessageCard({ onRetry }: ErrorMessageCardProps) {
  return (
    <div className="w-full max-w-[85%] sm:max-w-[75%] md:max-w-[65%]">
      <div className="flex items-end gap-2 w-full">
        {/* Avatar */}
        <Avatar className="size-7 sm:size-8 shrink-0">
          <AvatarFallback className="bg-chili/20 text-chili font-heading font-bold text-[10px] sm:text-xs">
            !
          </AvatarFallback>
        </Avatar>

        <div className="
          bg-white/5 backdrop-blur-sm border border-chili/20 border-l-2 border-l-chili
          text-text-ondark rounded-2xl rounded-bl-sm px-4 py-3
          text-[14px] sm:text-[15px] leading-relaxed break-words shadow-sm
          font-sans w-full min-w-0
        ">
          <div className="flex items-start gap-2.5">
            <AlertIcon className="text-chili shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-text-ondark text-[14px] mb-2">
                Something went wrong while getting a response. Please try again.
              </p>
              <button
                onClick={onRetry}
                className="
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  bg-chili/10 border border-chili/20 text-chili text-[13px] font-sans font-medium
                  hover:bg-chili/20 hover:border-chili/30 active:scale-[0.97]
                  transition-all duration-200 touch-manipulation
                "
              >
                <RetryIcon className="transition-transform duration-300 hover:rotate-[-180deg]" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
