"use client";

import React, { useState, useEffect } from "react";
import { OfflineIllustration } from "./OfflineIllustration";

/** Simple wifi icon for the "Back online" toast */
function WifiIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      // Auto-dismiss "Back online" after 2.5s
      setTimeout(() => setShowBackOnline(false), 2500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Nothing to show when online and no "back online" toast
  if (isOnline && !showBackOnline) return null;

  return (
    <div className="shrink-0 z-30">
      {/* ── Offline banner ─────────────────────────────── */}
      {!isOnline && (
        <div
          className="
            flex items-center justify-center gap-4 px-4 py-4
            bg-gradient-to-r from-ink-deeper/95 via-ink-deep/90 to-ink-deeper/95
            border-b border-marigold/15 backdrop-blur-md
            animate-in fade-in slide-in-from-top-2 duration-300
          "
        >
          {/* 3D floating orb illustration */}
          <OfflineIllustration
            className="shrink-0 scale-90 sm:scale-100"
          />

          {/* Text content */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-marigold text-[13px] sm:text-[14px] font-heading font-semibold tracking-tight">
              You&apos;re offline
            </span>
            <span className="text-text-dim-ondark text-[12px] sm:text-[13px] font-sans leading-snug">
              Check your internet connection to continue.
            </span>
          </div>
        </div>
      )}

      {/* ── Back online confirmation ───────────────────── */}
      {isOnline && showBackOnline && (
        <div className="
          flex items-center justify-center gap-2.5 px-4 py-2.5
          bg-emerald-500/15 border-b border-emerald-500/25
          text-emerald-400 text-[13px] font-sans
          animate-in fade-in slide-in-from-top-2 duration-300
        ">
          <WifiIcon className="shrink-0" />
          <span>Back online</span>
        </div>
      )}
    </div>
  );
}

