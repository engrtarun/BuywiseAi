"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string; // For the container
  iconClassName?: string; // For the logo mask
  showText?: boolean; // Whether to show BuyWise AI text
}

export default function Logo({ className, iconClassName, showText = true }: LogoProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <svg 
        viewBox="0 0 100 100" 
        className={cn("w-12 h-12 text-current transition-colors duration-300", iconClassName)}
        fill="none" 
        stroke="currentColor" 
        strokeWidth="12"
      >
        {/* Handle */}
        <path d="M 38 38 V 25 A 12 12 0 0 1 62 25 V 38" strokeLinecap="round" />
        
        {/* Left Stem */}
        <path d="M 28 38 V 85" strokeLinecap="square" />
        
        {/* Top horizontal & right curve */}
        <path d="M 28 38 H 65 A 15 15 0 0 1 65 62" strokeLinecap="square" />
        
        {/* Bottom horizontal & right curve */}
        <path d="M 28 85 H 60 A 20 20 0 0 0 78 68" strokeLinecap="square" />
        
        {/* Checkmark */}
        <path d="M 42 64 L 56 78 L 88 42" strokeLinecap="round" strokeLinejoin="round" strokeWidth="14" />
      </svg>
      {showText && (
        <span className="font-heading font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          BuyWise AI
        </span>
      )}
    </div>
  );
}
