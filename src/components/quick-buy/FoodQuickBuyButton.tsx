"use client";

import React, { useState, useEffect } from "react";
import { Pizza } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface FoodQuickBuyButtonProps {
  onClick: () => void;
}

export function FoodQuickBuyButton({ onClick }: FoodQuickBuyButtonProps) {
  const [isHot, setIsHot] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsHot(true);
      setTimeout(() => setIsHot(false), 800);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {isHot && (
        <div className="absolute -top-1 -right-2 z-50 bg-red-400 text-white text-[9px] font-black px-1 rounded shadow-[0_0_8px_rgba(248,113,113,0.8)] pointer-events-none animate-in fade-in zoom-in duration-200">
          HOT
        </div>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
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
        </TooltipTrigger>
        <TooltipContent side="bottom">Food Quick Buy</TooltipContent>
      </Tooltip>
    </div>
  );
}
