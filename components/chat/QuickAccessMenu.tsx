"use client";

import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Shirt, X } from "lucide-react";
import { createPortal } from "react-dom";

interface QuickAccessMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
}

export function QuickAccessMenu({ isOpen, onClose, anchorRect }: QuickAccessMenuProps) {
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
        minWidth: '200px'
      }}
      className="z-[100] bg-bg-input border border-border-light rounded-2xl p-2 shadow-2xl flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200 backdrop-blur-xl"
    >
      <div className="px-2 py-1.5 mb-1 flex items-center justify-between border-b border-border-light">
        <span className="text-[11px] font-mono text-text-secondary uppercase tracking-wider">Quick Actions</span>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary-light">
          <X className="size-3.5" />
        </button>
      </div>
      
      <button
        onClick={() => { router.push('/quick-buy'); onClose(); }}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-all text-text-primary-dark group text-left"
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
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-all text-text-primary-dark group text-left"
      >
        <div className="size-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 group-hover:scale-110 transition-all shrink-0">
          <Shirt className="size-4 text-text-primary-light" />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold">Virtual Wardrobe</span>
          <span className="text-[10px] text-text-dim-ondark leading-tight">Mix & match saved fits</span>
        </div>
      </button>
    </div>,
    document.body
  );
}
