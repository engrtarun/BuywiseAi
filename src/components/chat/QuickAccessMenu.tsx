"use client";

import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Shirt, X, Brain, Compass } from "lucide-react";
import { createPortal } from "react-dom";
import { ChatMode } from "@/types/chat";

interface QuickAccessMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  isModeLocked: boolean;
}

export function QuickAccessMenu({ 
  isOpen, 
  onClose, 
  anchorRect,
  selectedMode,
  onModeChange,
  isModeLocked
}: QuickAccessMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !anchorRect || typeof window === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: anchorRect.left,
        bottom: window.innerHeight - anchorRect.top + 8, // Just above the anchor
        minWidth: '240px'
      }}
      className="z-[100] bg-bg-input border border-border-light rounded-2xl p-2 shadow-2xl flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200 backdrop-blur-xl"
    >
      <div className="px-2 py-1.5 mb-1 flex items-center justify-between border-b border-border-light">
        <span className="text-[11px] font-mono text-text-secondary uppercase tracking-wider">Quick Actions</span>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary-light cursor-pointer">
          <X className="size-3.5" />
        </button>
      </div>
      
      <button
        onClick={() => { router.push('/quick-buy'); onClose(); }}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.06] transition-all text-text-primary-dark group text-left cursor-pointer"
      >
        <div className="size-8 rounded-full bg-brand-accent/20 flex items-center justify-center border border-brand-accent/30 group-hover:scale-110 transition-transform shrink-0">
          <Sparkles className="size-4 text-brand-accent" />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold">Quick Buy</span>
          <span className="text-[10px] text-text-dim-ondark leading-tight">Swipe product recommendations</span>
        </div>
      </button>

      <button
        onClick={() => { router.push('/virtual-wardrobe'); onClose(); }}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.06] transition-all text-text-primary-dark group text-left cursor-pointer"
      >
        <div className="size-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 group-hover:scale-110 transition-all shrink-0">
          <Shirt className="size-4 text-text-primary-light" />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold">Virtual Wardrobe</span>
          <span className="text-[10px] text-text-dim-ondark leading-tight">Mix & match saved fits</span>
        </div>
      </button>

      <div className="px-2 py-1 mt-1 mb-1 flex items-center justify-between border-t border-border-light pt-2">
        <span className="text-[11px] font-mono text-text-secondary uppercase tracking-wider">Chat Mode</span>
        {isModeLocked && (
          <span className="text-[9px] font-sans text-text-secondary/60 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">Locked for chat</span>
        )}
      </div>

      <button
        onClick={() => {
          if (!isModeLocked) {
            onModeChange("deep_research");
          }
          onClose();
        }}
        disabled={isModeLocked}
        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left w-full group
          ${isModeLocked && selectedMode !== "deep_research" ? "opacity-40 cursor-not-allowed" : "hover:bg-white/[0.06] cursor-pointer"}
          ${selectedMode === "deep_research" ? "bg-white/[0.04] border border-marigold/20" : "border border-transparent"}
        `}
      >
        <div className={`size-8 rounded-full flex items-center justify-center transition-all shrink-0
          ${selectedMode === "deep_research" 
            ? "bg-marigold/20 border border-marigold/30 scale-105" 
            : "bg-white/10 border border-white/10 group-hover:scale-110"
          }
        `}>
          <Brain className={`size-4 ${selectedMode === "deep_research" ? "text-marigold" : "text-text-primary-light"}`} />
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-text-primary-dark">Deep Research</span>
            {selectedMode === "deep_research" && (
              <span className="text-[9px] bg-marigold/20 text-marigold px-1.5 py-0.5 rounded-full font-sans font-bold">Active</span>
            )}
          </div>
          <span className="text-[10px] text-text-dim-ondark leading-tight">Comprehensive detailed reports</span>
        </div>
      </button>

      <button
        onClick={() => {
          if (!isModeLocked) {
            onModeChange("explore");
          }
          onClose();
        }}
        disabled={isModeLocked}
        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left w-full group
          ${isModeLocked && selectedMode !== "explore" ? "opacity-40 cursor-not-allowed" : "hover:bg-white/[0.06] cursor-pointer"}
          ${selectedMode === "explore" ? "bg-white/[0.04] border border-marigold/20" : "border border-transparent"}
        `}
      >
        <div className={`size-8 rounded-full flex items-center justify-center transition-all shrink-0
          ${selectedMode === "explore" 
            ? "bg-marigold/20 border border-marigold/30 scale-105" 
            : "bg-white/10 border border-white/10 group-hover:scale-110"
          }
        `}>
          <Compass className={`size-4 ${selectedMode === "explore" ? "text-marigold" : "text-text-primary-light"}`} />
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-text-primary-dark">Explore Mode</span>
            {selectedMode === "explore" && (
              <span className="text-[9px] bg-marigold/20 text-marigold px-1.5 py-0.5 rounded-full font-sans font-bold">Active</span>
            )}
          </div>
          <span className="text-[10px] text-text-dim-ondark leading-tight">Quick shopping & recommendations</span>
        </div>
      </button>
    </div>,
    document.body
  );
}
