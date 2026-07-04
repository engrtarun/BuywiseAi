import React from "react";
import { Ghost, X } from "lucide-react";

interface TemporaryChatBadgeProps {
  onExit: () => void;
}

export function TemporaryChatBadge({ onExit }: TemporaryChatBadgeProps) {
  return (
    <div className="w-full flex justify-center py-2 px-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-white/[0.03] border border-dashed border-white/20 backdrop-blur-md shadow-sm">
        <Ghost className="size-4 sm:size-4.5 text-text-dim-ondark" />
        <span className="text-[12px] sm:text-[13px] text-text-dim-ondark font-sans whitespace-nowrap">
          <strong className="text-text-ondark font-medium">Temporary Chat:</strong> Unsaved
        </span>
        <div className="w-px h-3.5 bg-line-ondark mx-1" />
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-medium text-text-dim-ondark hover:text-chili transition-colors cursor-pointer group"
          aria-label="Exit temporary chat"
        >
          <span>Exit</span>
          <X className="size-3.5 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}
