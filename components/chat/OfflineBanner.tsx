"use client";

import React, { useState, useEffect } from "react";

/** Animated "no wifi" SVG icon */
function NoWifiIcon({ className }: { className?: string }) {
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
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

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
      {/* Offline banner */}
      {!isOnline && (
        <div className="
          flex items-center justify-center gap-2.5 px-4 py-2.5
          bg-chili/15 border-b border-chili/25
          text-chili text-[13px] font-sans
          animate-in fade-in slide-in-from-top-2 duration-300
        ">
          <NoWifiIcon className="shrink-0 animate-pulse" />
          <span>You&apos;re offline. Check your internet connection.</span>
        </div>
      )}

      {/* Back online confirmation */}
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
