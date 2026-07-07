"use client";

import React from "react";
import { useAppMode } from "@/contexts/AppModeContext";
import { ShoppingBag, Utensils } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface FoodModeToggleProps {
  isCollapsed?: boolean;
}

export function FoodModeToggle({ isCollapsed = false }: FoodModeToggleProps) {
  const { mode, setMode } = useAppMode();

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setMode(mode === "retail" ? "food" : "retail")}
            className="flex items-center justify-center size-10 rounded-xl bg-white/[0.04] border border-border-dark text-text-primary-dark hover:bg-white/[0.08] transition-colors shrink-0"
            aria-label={`Switch to ${mode === "retail" ? "Food" : "Retail"} Mode`}
          >
            {mode === "retail" ? <Utensils className="size-5 text-text-secondary" /> : <ShoppingBag className="size-5 text-text-secondary" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Switch to {mode === "retail" ? "Food" : "Retail"} Mode</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex bg-white/5 rounded-xl p-1 border border-border-dark relative w-full h-11 items-center shrink-0">
      <motion.div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-brand-accent rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
        layoutId="mode-toggle-bg"
        initial={false}
        animate={{
          left: mode === "retail" ? "4px" : "calc(50%)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
      <button
        onClick={() => setMode("retail")}
        className={`flex-1 flex items-center justify-center gap-2 z-10 text-xs font-bold transition-colors cursor-pointer ${
          mode === "retail" ? "text-bg-main" : "text-text-secondary hover:text-white"
        }`}
      >
        <ShoppingBag className="size-4" />
        Retail
      </button>
      <button
        onClick={() => setMode("food")}
        className={`flex-1 flex items-center justify-center gap-2 z-10 text-xs font-bold transition-colors cursor-pointer ${
          mode === "food" ? "text-bg-main" : "text-text-secondary hover:text-white"
        }`}
      >
        <Utensils className="size-4" />
        Food
      </button>
    </div>
  );
}
