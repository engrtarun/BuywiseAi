import React from "react";
import { PlusCircle } from "lucide-react";

interface TemporaryChatButtonProps {
  onClick: () => void;
  isTemporaryChat: boolean;
}

export function TemporaryChatButton({ onClick, isTemporaryChat }: TemporaryChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center justify-center size-9 rounded-full
        transition-all duration-200 cursor-pointer
        hover:bg-white/[0.08] active:scale-95
        ${isTemporaryChat ? 'text-marigold' : 'text-text-dim-ondark hover:text-marigold'}
      `}
      title="New temporary chat"
      aria-label="New temporary chat"
    >
      <PlusCircle className="size-5 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
    </button>
  );
}
