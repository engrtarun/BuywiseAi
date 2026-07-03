"use client";

import React from "react";

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

/**
 * Animated hamburger → X toggle button.
 *
 * Three `<span>` bars animated via CSS transitions:
 *  - Top bar: rotates +45° and translates down to form first arm of X
 *  - Middle bar: fades to opacity-0 and scales to 0
 *  - Bottom bar: rotates -45° and translates up to form second arm of X
 *
 * Timing: 250ms ease-in-out — tweak via the `duration-250` class.
 */
export function HamburgerButton({ isOpen, onClick }: HamburgerButtonProps) {
  const barBase =
    "block absolute left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-text-ondark transition-all duration-250 ease-in-out";

  return (
    <button
      onClick={onClick}
      className="md:hidden relative size-9 flex items-center justify-center rounded-lg hover:bg-white/[0.06] active:scale-95 transition-all touch-manipulation"
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      {/* Top bar */}
      <span
        className={`${barBase} ${
          isOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[10px]"
        }`}
      />
      {/* Middle bar */}
      <span
        className={`${barBase} top-1/2 -translate-y-1/2 ${
          isOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
        }`}
      />
      {/* Bottom bar */}
      <span
        className={`${barBase} ${
          isOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-[10px] top-auto"
        }`}
      />
    </button>
  );
}
