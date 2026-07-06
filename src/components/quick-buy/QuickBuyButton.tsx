"use client";

import React from "react";
import { ShoppingBag } from "lucide-react";

interface QuickBuyButtonProps {
  onClick: () => void;
}

export function QuickBuyButton({ onClick }: QuickBuyButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Quick Buy — swipe to shop"
      data-tour-id="quick-cart"
      className="
        group relative flex items-center justify-center
        size-9 rounded-full
        bg-white/[0.04] border border-white/10
        hover:bg-brand-accent/20 hover:border-brand-accent/50
        transition-all duration-300 ease-out
        active:scale-95 touch-manipulation
      "
    >
      <ShoppingBag className="size-4.5 text-text-primary-dark group-hover:text-brand-accent transition-colors duration-300" />
      
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-full bg-brand-accent opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300 pointer-events-none" />
    </button>
  );
}
