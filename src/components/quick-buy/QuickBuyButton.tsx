"use client";

import React from "react";
import { ShoppingBag } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface QuickBuyButtonProps {
  onClick: () => void;
}

export function QuickBuyButton({ onClick }: QuickBuyButtonProps) {
  const [count, setCount] = React.useState(0);

  const updateCount = React.useCallback(() => {
    try {
      const stored = localStorage.getItem("buywise_cart_items");
      if (stored) {
        setCount(JSON.parse(stored).length);
      } else {
        setCount(0);
      }
    } catch {
      setCount(0);
    }
  }, []);

  React.useEffect(() => {
    updateCount();
    window.addEventListener("cart-updated", updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener("cart-updated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, [updateCount]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
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
          
          {count > 0 && (
            <span className="
              absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-chili px-1 text-[9px] font-bold text-white shadow-md animate-in zoom-in duration-200
            ">
              {count}
            </span>
          )}

          {/* Subtle glow effect on hover */}
          <div className="absolute inset-0 rounded-full bg-brand-accent opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300 pointer-events-none" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Quick Buy — swipe to shop</TooltipContent>
    </Tooltip>
  );
}
