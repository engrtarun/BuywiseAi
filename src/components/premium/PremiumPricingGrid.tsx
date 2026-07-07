"use client";

import React from "react";
import { motion } from "framer-motion";
import { usePremium } from "@/contexts/PremiumContext";
import { Rocket, Crown } from "lucide-react";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function PremiumPricingGrid() {
  const { closePremium } = usePremium();

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
      <div className="text-center mb-10 space-y-4">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-purple-400">Shopping Velocity</span>
        </h2>
        <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto">
          Say goodbye to limits, unlock instant AI intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full px-4">
        
        {/* Tier 1: Free Explorer */}
        <motion.div
          whileHover={{ y: -5, rotateX: 2, rotateY: -2 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative flex flex-col bg-[#1a1b26]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden"
        >
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Free Explorer</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">₹0</span>
              <span className="text-text-secondary text-sm">/ Forever</span>
            </div>
            <p className="text-text-secondary text-sm mt-2">Perfect for casual shoppers.</p>
          </div>

          <div className="flex-1 space-y-4 mb-8">
            <div className="flex items-center gap-3 text-sm text-text-ondark">
              <CrossIcon className="text-white/30" />
              <span>6-second Smart Cooldown</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-text-ondark">
              <CheckIcon className="text-white/60" />
              <span>Basic AI Advice</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-text-ondark">
              <CheckIcon className="text-white/60" />
              <span>Live Product Fetching</span>
            </div>
          </div>

          <button
            onClick={closePremium}
            className="w-full py-3.5 rounded-xl border border-white/20 text-white/50 font-bold tracking-wide hover:bg-white/5 transition-colors cursor-not-allowed"
          >
            Current Plan
          </button>
        </motion.div>

        {/* Tier 2: BuyWise Pro (Most Popular) */}
        <motion.div
          whileHover={{ y: -5, scale: 1.02, rotateX: 2, rotateY: 2 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative flex flex-col bg-[#1a1b26] rounded-3xl p-6 lg:-mt-4 lg:mb-4 overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.15)] z-10"
        >
          {/* Animated Glowing Border */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,#A855F7_360deg)] animate-[spin_4s_linear_infinite]" />
            <div className="absolute inset-[2px] bg-[#1a1b26] rounded-3xl" />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-purple-700 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-purple-500/30">
              Most Popular
            </div>

            <div className="mb-6 mt-4">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                BuyWise Pro <Rocket className="size-5 text-purple-400" />
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-white">₹199</span>
                <span className="text-purple-300 text-sm">/ Month</span>
              </div>
              <p className="text-purple-200/70 text-sm mt-2">For power shoppers who want speed.</p>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-white font-medium">
                <CheckIcon className="text-purple-400" />
                <span>ZERO Waiting Time (Instant Chat)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/80">
                <CheckIcon className="text-purple-400" />
                <span>Advanced AI Outfit Rating</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/80">
                <CheckIcon className="text-purple-400" />
                <span>Multi-Session Save</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/80">
                <CheckIcon className="text-purple-400" />
                <span>5% Extra Partner Cashback</span>
              </div>
            </div>

            <button
              onClick={() => alert("Redirecting to payment gateway...")}
              className="relative w-full py-3.5 rounded-xl font-bold text-white tracking-wide overflow-hidden group shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                Unlock Instant Speed
              </span>
            </button>
          </div>
        </motion.div>

        {/* Tier 3: Elite Alpha */}
        <motion.div
          whileHover={{ y: -5, rotateX: 2, rotateY: 2 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative flex flex-col bg-[#1a1b26]/80 backdrop-blur-xl border border-[#D4AF37]/30 rounded-3xl p-6 overflow-hidden"
        >
          {/* Subtle gold glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-3xl rounded-full" />

          <div className="mb-6 relative z-10">
            <h3 className="text-xl font-bold text-[#D4AF37] mb-2 flex items-center gap-2">
              Elite Alpha <Crown className="size-5 text-[#D4AF37]" />
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">₹499</span>
              <span className="text-[#D4AF37]/70 text-sm">/ Month</span>
            </div>
            <p className="text-white/60 text-sm mt-2">The ultimate luxury shopping experience.</p>
          </div>

          <div className="flex-1 space-y-4 mb-8 relative z-10">
            <div className="flex items-center gap-3 text-sm text-white/90">
              <CheckIcon className="text-[#D4AF37]" />
              <span>Dedicated High-Speed AI Pool</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/90">
              <CheckIcon className="text-[#D4AF37]" />
              <span>Unlimited Virtual Wardrobe Sync</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/90">
              <CheckIcon className="text-[#D4AF37]" />
              <span>Personal AI Stylist 24/7</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/90">
              <CheckIcon className="text-[#D4AF37]" />
              <span>Early Access to Brand Drops</span>
            </div>
          </div>

          <button
            onClick={() => alert("Redirecting to payment gateway...")}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-[#1a1b26] font-bold tracking-wide hover:brightness-110 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] relative z-10"
          >
            Become an Alpha
          </button>
        </motion.div>

      </div>
    </div>
  );
}
