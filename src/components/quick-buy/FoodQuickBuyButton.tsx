"use client";

import React from "react";
import { Pizza } from "lucide-react";

interface FoodQuickBuyButtonProps {
  onClick: () => void;
}

export function FoodQuickBuyButton({ onClick }: FoodQuickBuyButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Food Quick Buy"
      className="
        group relative flex items-center justify-center
        size-9 rounded-full
        bg-white/[0.04] border border-white/10
        hover:bg-orange-500/20 hover:border-orange-500/50
        transition-all duration-300 ease-out
        active:scale-95 touch-manipulation
      "
    >
      <Pizza className="size-4.5 text-text-primary-dark group-hover:text-orange-500 transition-colors duration-300" />
      
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-full bg-orange-500 opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300 pointer-events-none" />
    </button>
  );
}
