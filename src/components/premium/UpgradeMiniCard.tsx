import React from "react";

interface UpgradeMiniCardProps {
  onClick: () => void;
  isCollapsed: boolean;
}

export function UpgradeMiniCard({ onClick, isCollapsed }: UpgradeMiniCardProps) {
  if (isCollapsed) {
    return (
      <button
        onClick={onClick}
        className="w-8 h-8 mx-auto rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white hover:brightness-110 transition-all shadow-[0_0_10px_rgba(168,85,247,0.4)]"
        title="Upgrade to Pro"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      className="relative w-full rounded-2xl p-3 cursor-pointer group overflow-hidden border border-purple-500/30 hover:border-purple-400/60 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.15)]"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-fuchsia-900/40 group-hover:from-purple-800/50 group-hover:to-fuchsia-800/50 transition-colors" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
      
      <div className="relative z-10 flex items-center gap-3">
        <div className="size-8 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(192,132,252,0.5)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-bold text-white tracking-wide truncate">
            Upgrade to Pro
          </span>
          <span className="text-[11px] text-purple-200/70 truncate">
            Unlock instant speed
          </span>
        </div>
      </div>
    </div>
  );
}
