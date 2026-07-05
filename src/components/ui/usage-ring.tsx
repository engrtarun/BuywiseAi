"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface UsageRingProps extends React.SVGProps<SVGSVGElement> {
  value: number
  max: number
}

export function UsageRing({ value, max, className, ...props }: UsageRingProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = 12
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Determine color based on threshold
  let strokeColor = "stroke-brand-accent" // default orange
  if (percentage >= 100) {
    strokeColor = "stroke-destructive" // red
  } else if (percentage >= 80) {
    strokeColor = "stroke-amber-500" // amber/warning
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="relative flex items-center justify-center size-8 cursor-pointer select-none">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              className={cn("rotate-[-90deg]", className)}
              {...props}
            >
              {/* Track circle */}
              <circle
                cx="16"
                cy="16"
                r={radius}
                fill="none"
                className="stroke-border-light"
                strokeWidth="3"
              />
              {/* Progress circle */}
              <circle
                cx="16"
                cy="16"
                r={radius}
                fill="none"
                className={cn("transition-all duration-300 ease-in-out", strokeColor)}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-bg-input border border-border-light text-text-primary-light">
          <span className="font-mono text-xs">
            {value.toLocaleString()} / {max.toLocaleString()} tokens used today
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
