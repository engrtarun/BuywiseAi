"use client";

import React from "react";
import { Lock, Plus, X } from "lucide-react";

interface QuickBuyLockedStateProps {
  onCreateProfile: () => void;
  onClose: () => void;
}

export function QuickBuyLockedState({ onCreateProfile, onClose }: QuickBuyLockedStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-bg-main relative z-50 h-full w-full">
      {/* Close button to go back to chat */}
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 cursor-pointer z-50"
        title="Back to Chat"
      >
        <X className="size-6" />
      </button>

      <div className="w-full max-w-md bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center text-center">
        <div className="size-16 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center mb-6">
          <Lock className="size-8 text-brand-accent animate-pulse" />
        </div>

        <h2 className="text-2xl font-heading font-bold text-text-primary-light mb-3">
          QuickBuy needs a profile to work
        </h2>
        <p className="text-[15px] text-text-secondary leading-relaxed mb-8">
          Personalize your preferences so we can source and filter products tailored just for you.
        </p>

        <button
          onClick={onCreateProfile}
          className="w-full flex items-center justify-center gap-2 py-4 bg-brand-accent text-bg-main hover:brightness-110 shadow-lg shadow-brand-accent/20 font-bold rounded-xl text-[16px] transition-all duration-300 cursor-pointer active:scale-95"
        >
          <Plus className="size-5" />
          Create Profile
        </button>
      </div>
    </div>
  );
}
